const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');

// Audio Visualizer System
class AudioVisualizer {
    constructor() {
        this.isAnalyzing = false;
        this.audioData = {
            frequencies: new Array(128).fill(0),
            waveform: new Array(512).fill(0),
            volume: 0,
            peak: 0,
            bassLevel: 0,
            midLevel: 0,
            trebleLevel: 0,
            bpm: 0
        };
        this.canvas = createCanvas(800, 400);
        this.ctx = this.canvas.getContext('2d');
        this.animationFrame = 0;
        this.lastUpdate = Date.now();
        
        // WebSocket-Clients für Live-Updates
        this.wsClients = new Set();
        
        console.log('🌊 Audio Visualizer initialisiert');
    }

    // Audio-Stream Analyse
    createAudioAnalyzer() {
        return new Transform({
            transform(chunk, encoding, callback) {
                try {
                    // Audio-Daten analysieren
                    const samples = this.bytesToSamples(chunk);
                    const audioData = this.analyzeAudio(samples);
                    
                    // Live-Update an Dashboard senden
                    this.broadcastAudioData(audioData);
                    
                    // Canvas-Visualisierung aktualisieren
                    this.updateVisualization(audioData);
                    
                } catch (error) {
                    console.error('❌ Audio-Analyse Fehler:', error);
                }
                
                // Audio-Stream durchleiten
                this.push(chunk);
                callback();
            }.bind(this)
        });
    }

    // Bytes zu Audio-Samples konvertieren
    bytesToSamples(buffer) {
        const samples = [];
        for (let i = 0; i < buffer.length; i += 2) {
            // 16-bit PCM zu Float
            const sample = buffer.readInt16LE(i) / 32768.0;
            samples.push(sample);
        }
        return samples;
    }

    // Audio-Analyse durchführen
    analyzeAudio(samples) {
        if (samples.length === 0) return this.audioData;

        try {
            // Volume berechnen (RMS)
            const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
            this.audioData.volume = Math.min(100, rms * 100);

            // Peak-Level
            const peak = Math.max(...samples.map(s => Math.abs(s)));
            this.audioData.peak = Math.min(100, peak * 100);

            // Waveform für Visualisierung
            const step = Math.max(1, Math.floor(samples.length / 512));
            for (let i = 0; i < 512; i++) {
                const sampleIndex = i * step;
                if (sampleIndex < samples.length) {
                    this.audioData.waveform[i] = samples[sampleIndex] * 50; // Skalierung
                }
            }

            // Einfache Frequenz-Analyse (Mock FFT)
            this.performSimpleFFT(samples);

            // Bass/Mid/Treble Levels
            this.calculateFrequencyBands();

            return this.audioData;

        } catch (error) {
            console.error('❌ Audio-Analyse Fehler:', error);
            return this.audioData;
        }
    }

    // Vereinfachte FFT-Simulation
    performSimpleFFT(samples) {
        const fftSize = Math.min(128, samples.length);
        
        for (let i = 0; i < fftSize; i++) {
            // Simuliere Frequenz-Bins
            const frequency = (i / fftSize) * 22050; // Bis 22kHz
            let magnitude = 0;
            
            // Einfache Frequenz-Detektion
            for (let j = 0; j < Math.min(samples.length - 1, 100); j++) {
                const phase = (frequency * j * Math.PI * 2) / 44100;
                magnitude += samples[j] * Math.cos(phase);
            }
            
            this.audioData.frequencies[i] = Math.abs(magnitude) * 10;
        }
    }

    // Frequenz-Bänder berechnen
    calculateFrequencyBands() {
        const freqs = this.audioData.frequencies;
        
        // Bass (20Hz - 250Hz) - Bins 0-5
        this.audioData.bassLevel = freqs.slice(0, 6).reduce((sum, val) => sum + val, 0) / 6;
        
        // Mid (250Hz - 4kHz) - Bins 6-25
        this.audioData.midLevel = freqs.slice(6, 26).reduce((sum, val) => sum + val, 0) / 20;
        
        // Treble (4kHz - 20kHz) - Bins 26-127
        this.audioData.trebleLevel = freqs.slice(26, 128).reduce((sum, val) => sum + val, 0) / 102;
    }

    // Canvas-Visualisierung erstellen
    updateVisualization(audioData) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Canvas leeren
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Gradient-Hintergrund
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f0f1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Frequenz-Balken zeichnen
        this.drawFrequencyBars(ctx, audioData);
        
        // Waveform zeichnen
        this.drawWaveform(ctx, audioData);
        
        // Audio-Info Text
        this.drawAudioInfo(ctx, audioData);
        
        this.animationFrame++;
    }

    // Frequenz-Balken zeichnen
    drawFrequencyBars(ctx, audioData) {
        const barWidth = this.canvas.width / audioData.frequencies.length;
        const maxHeight = this.canvas.height * 0.6;
        
        for (let i = 0; i < audioData.frequencies.length; i++) {
            const barHeight = (audioData.frequencies[i] / 100) * maxHeight;
            const x = i * barWidth;
            const y = this.canvas.height - barHeight - 50;
            
            // Farbe basierend auf Frequenz
            const hue = (i / audioData.frequencies.length) * 360;
            const saturation = 70 + (audioData.frequencies[i] / 100) * 30;
            const lightness = 50 + (audioData.frequencies[i] / 100) * 30;
            
            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            ctx.fillRect(x, y, barWidth - 1, barHeight);
            
            // Glow-Effekt
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.fillRect(x, y, barWidth - 1, Math.min(barHeight, 5));
            ctx.shadowBlur = 0;
        }
    }

    // Waveform zeichnen
    drawWaveform(ctx, audioData) {
        const waveHeight = 80;
        const waveY = this.canvas.height - 40;
        const stepX = this.canvas.width / audioData.waveform.length;
        
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < audioData.waveform.length; i++) {
            const x = i * stepX;
            const y = waveY + audioData.waveform[i];
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Waveform-Glow
        ctx.strokeStyle = '#00ff8844';
        ctx.lineWidth = 6;
        ctx.stroke();
    }

    // Audio-Info anzeigen
    drawAudioInfo(ctx, audioData) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        
        const info = [
            `🔊 Volume: ${audioData.volume.toFixed(1)}%`,
            `📈 Peak: ${audioData.peak.toFixed(1)}%`,
            `🎵 Bass: ${audioData.bassLevel.toFixed(1)}`,
            `🎶 Mid: ${audioData.midLevel.toFixed(1)}`,
            `🎵 Treble: ${audioData.trebleLevel.toFixed(1)}`
        ];
        
        info.forEach((text, index) => {
            ctx.fillText(text, 20, 30 + index * 25);
        });
        
        // Live-Indikator
        const time = Date.now();
        const pulse = Math.sin(time / 200) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
        ctx.beginPath();
        ctx.arc(this.canvas.width - 30, 30, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText('LIVE', this.canvas.width - 60, 36);
    }

    // Visualisierung als Buffer speichern
    getVisualizationBuffer() {
        return this.canvas.toBuffer('image/png');
    }

    // Live-Audio-Daten an Dashboard senden
    broadcastAudioData(audioData) {
        if (this.wsClients.size === 0) return;
        
        const message = JSON.stringify({
            type: 'audioVisualization',
            data: {
                ...audioData,
                timestamp: Date.now()
            }
        });
        
        this.wsClients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                try {
                    client.send(message);
                } catch (error) {
                    console.error('❌ WebSocket Send Error:', error);
                    this.wsClients.delete(client);
                }
            }
        });
    }

    // WebSocket-Client hinzufügen
    addWebSocketClient(ws) {
        this.wsClients.add(ws);
        console.log(`🌊 Audio Visualizer Client verbunden (${this.wsClients.size} aktiv)`);
        
        ws.on('close', () => {
            this.wsClients.delete(ws);
            console.log(`📡 Client getrennt (${this.wsClients.size} aktiv)`);
        });
    }

    // Visualizer starten
    startAnalysis(guildId) {
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        console.log(`🌊 Audio Visualizer gestartet für Guild: ${guildId}`);
        
        // Kontinuierliche Canvas-Updates
        this.startRenderLoop();
    }

    // Visualizer stoppen
    stopAnalysis(guildId) {
        this.isAnalyzing = false;
        
        // Reset audio data
        this.audioData = {
            frequencies: new Array(128).fill(0),
            waveform: new Array(512).fill(0),
            volume: 0,
            peak: 0,
            bassLevel: 0,
            midLevel: 0,
            trebleLevel: 0,
            bpm: 0
        };
        
        console.log(`⏹️ Audio Visualizer gestoppt für Guild: ${guildId}`);
    }

    // Render-Loop für kontinuierliche Updates
    startRenderLoop() {
        const renderInterval = setInterval(() => {
            if (!this.isAnalyzing) {
                clearInterval(renderInterval);
                return;
            }
            
            // Update Visualisierung auch ohne neue Audio-Daten (für Animationen)
            this.updateVisualization(this.audioData);
            
            // Broadcast aktualisierte Daten
            this.broadcastAudioData(this.audioData);
            
        }, 50); // 20 FPS
    }
}

// Globale Visualizer-Instanz
const audioVisualizer = new AudioVisualizer();

module.exports = {
    audioVisualizer,
    AudioVisualizer
}; 