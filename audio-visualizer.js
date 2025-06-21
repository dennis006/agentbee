const { Transform } = require('stream');
const WebSocket = require('ws');

// Optional Canvas für Visualisierung
let Canvas, createCanvas;
try {
  Canvas = require('canvas');
  createCanvas = Canvas.createCanvas;
} catch (error) {
  console.log('⚠️ Canvas nicht verfügbar - Audio Visualizer läuft ohne Grafik-Rendering');
}

// Optional ffmpeg für erweiterte Audio-Verarbeitung
let ffmpeg;
try {
  ffmpeg = require('fluent-ffmpeg');
} catch (error) {
  console.log('⚠️ FFmpeg nicht verfügbar - Audio Visualizer läuft mit eingeschränkter Funktionalität');
}

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
        
        // WebSocket Server für Live-Updates
        this.wsServer = null;
        this.clients = new Set();
        this.wsPort = 8080; // Default Port
        
        // Canvas für Visualisierung (falls verfügbar)
        this.canvas = null;
        this.ctx = null;
        
        // Audio Buffer für Analyse
        this.audioBuffer = [];
        this.sampleRate = 48000; // Discord Audio Sample Rate
        
        this.initializeWebSocketServer();
        this.initializeCanvas();
        
        console.log('🌊 Audio Visualizer initialisiert');
    }

    async findAvailablePort(startPort = 8080) {
        const net = require('net');
        
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.listen(startPort, (err) => {
                if (err) {
                    server.close();
                    // Versuche nächsten Port
                    this.findAvailablePort(startPort + 1).then(resolve);
                } else {
                    const port = server.address().port;
                    server.close();
                    resolve(port);
                }
            });
            
            server.on('error', () => {
                // Port nicht verfügbar, versuche nächsten
                this.findAvailablePort(startPort + 1).then(resolve);
            });
        });
    }

    async initializeWebSocketServer() {
        try {
            // Finde einen verfügbaren Port
            this.wsPort = await this.findAvailablePort(8080);
            
            this.wsServer = new WebSocket.Server({ 
                port: this.wsPort,
                perMessageDeflate: false
            });
            
            this.wsServer.on('connection', (ws) => {
                console.log(`🌊 Neuer Audio Visualizer Client verbunden auf Port ${this.wsPort}`);
                this.clients.add(ws);
                
                // Sende aktuelle Audio-Daten
                ws.send(JSON.stringify({
                    type: 'audioVisualization',
                    data: this.audioData
                }));
                
                ws.on('close', () => {
                    this.clients.delete(ws);
                    console.log('📡 Audio Visualizer Client getrennt');
                });
                
                ws.on('message', (message) => {
                    try {
                        const data = JSON.parse(message);
                        if (data.type === 'requestVisualization') {
                            ws.send(JSON.stringify({
                                type: 'audioVisualization',
                                data: this.audioData
                            }));
                        }
                    } catch (error) {
                        console.error('WebSocket Message Error:', error);
                    }
                });
                
                ws.on('error', (error) => {
                    console.error('WebSocket Client Error:', error);
                    this.clients.delete(ws);
                });
            });
            
            this.wsServer.on('error', (error) => {
                console.error('❌ WebSocket Server Error:', error);
                if (error.code === 'EADDRINUSE') {
                    console.log('🔄 Port belegt, versuche anderen Port...');
                    setTimeout(() => this.initializeWebSocketServer(), 1000);
                }
            });
            
            console.log(`🌊 Audio Visualizer WebSocket Server gestartet auf Port ${this.wsPort}`);
        } catch (error) {
            console.error('❌ Fehler beim Starten des WebSocket Servers:', error);
        }
    }

    initializeCanvas() {
        if (!createCanvas) {
            console.log('⚠️ Canvas-Rendering nicht verfügbar - Audio-Daten werden nur als JSON gesendet');
            return;
        }
        
        try {
            this.canvas = createCanvas(800, 400);
            this.ctx = this.canvas.getContext('2d');
            console.log('🎨 Canvas für Audio Visualisierung initialisiert (800x400)');
        } catch (error) {
            console.error('❌ Fehler beim Initialisieren des Canvas:', error);
        }
    }

    startAnalyzing() {
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        console.log('🌊 Audio Visualizer gestartet');
        
        // Starte Render-Loop (auch ohne Canvas für Audio-Daten)
        this.renderLoop();
    }

    stopAnalyzing() {
        this.isAnalyzing = false;
        console.log('📡 Audio Visualizer gestoppt');
        
        // Reset Audio-Daten
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
        
        this.broadcastData();
    }

    // Audio Stream Transformer für Echtzeit-Analyse
    createAudioTransform() {
        const self = this;
        return new Transform({
            transform(chunk, encoding, callback) {
                if (self.isAnalyzing) {
                    self.processAudioChunk(chunk);
                }
                callback(null, chunk); // Pass-through
            }
        });
    }

    processAudioChunk(chunk) {
        try {
            // Convert 16-bit PCM zu Float-Array
            const samples = this.pcmToFloat32Array(chunk);
            
            // Update Audio Buffer
            this.audioBuffer = this.audioBuffer.concat(samples);
            
            // Keep buffer size manageable
            if (this.audioBuffer.length > 4096) {
                this.audioBuffer = this.audioBuffer.slice(-4096);
            }
            
            // Analyse nur wenn genug Daten vorhanden
            if (this.audioBuffer.length >= 1024) {
                this.analyzeAudio(this.audioBuffer);
            }
        } catch (error) {
            console.error('❌ Fehler bei Audio-Chunk Verarbeitung:', error);
        }
    }

    pcmToFloat32Array(buffer) {
        const samples = [];
        for (let i = 0; i < buffer.length; i += 2) {
            const sample = buffer.readInt16LE(i) / 32768;
            samples.push(sample);
        }
        return samples;
    }

    analyzeAudio(samples) {
        // Volume berechnen (RMS)
        let sum = 0;
        let peak = 0;
        
        for (let i = 0; i < samples.length; i++) {
            const abs = Math.abs(samples[i]);
            sum += abs * abs;
            peak = Math.max(peak, abs);
        }
        
        const rms = Math.sqrt(sum / samples.length);
        this.audioData.volume = Math.min(rms * 100, 100);
        this.audioData.peak = Math.min(peak * 100, 100);
        
        // Simplified Frequency Analysis (ohne echte FFT)
        this.simulateFrequencyAnalysis(samples);
        
        // Waveform Update
        this.updateWaveform(samples.slice(-512));
        
        // Frequency Bands
        this.calculateFrequencyBands();
    }

    simulateFrequencyAnalysis(samples) {
        // Vereinfachte Frequenz-Analyse ohne echte FFT
        const freqBins = 128;
        const frequencies = new Array(freqBins).fill(0);
        
        // Simuliere Frequenz-Verteilung basierend auf Audio-Eigenschaften
        for (let i = 0; i < freqBins; i++) {
            const freq = (i / freqBins) * (this.sampleRate / 2); // 0 bis 24kHz
            
            // Einfache Frequenz-Simulation basierend auf Sample-Daten
            let magnitude = 0;
            const startIdx = Math.floor((i / freqBins) * samples.length);
            const endIdx = Math.floor(((i + 1) / freqBins) * samples.length);
            
            for (let j = startIdx; j < endIdx && j < samples.length; j++) {
                magnitude += Math.abs(samples[j]);
            }
            
            frequencies[i] = magnitude / (endIdx - startIdx) * 100;
        }
        
        this.audioData.frequencies = frequencies;
    }

    updateWaveform(samples) {
        // Waveform auf 512 Punkte normalisieren
        const waveform = new Array(512);
        
        for (let i = 0; i < 512; i++) {
            if (i < samples.length) {
                waveform[i] = samples[i] * 100; // Normalisiert zu ±100
            } else {
                waveform[i] = 0;
            }
        }
        
        this.audioData.waveform = waveform;
    }

    calculateFrequencyBands() {
        const frequencies = this.audioData.frequencies;
        const bassEnd = Math.floor(frequencies.length * 0.1); // ~2.4kHz
        const midEnd = Math.floor(frequencies.length * 0.4);  // ~9.6kHz
        
        // Bass (20Hz - 250Hz)
        let bassSum = 0;
        for (let i = 0; i < bassEnd; i++) {
            bassSum += frequencies[i];
        }
        this.audioData.bassLevel = bassSum / bassEnd;
        
        // Mid (250Hz - 4kHz)
        let midSum = 0;
        for (let i = bassEnd; i < midEnd; i++) {
            midSum += frequencies[i];
        }
        this.audioData.midLevel = midSum / (midEnd - bassEnd);
        
        // Treble (4kHz - 20kHz)
        let trebleSum = 0;
        for (let i = midEnd; i < frequencies.length; i++) {
            trebleSum += frequencies[i];
        }
        this.audioData.trebleLevel = trebleSum / (frequencies.length - midEnd);
    }

    renderVisualization() {
        if (!this.ctx) return null;
        
        try {
            const { width, height } = this.canvas;
            
            // Clear canvas
            this.ctx.fillStyle = '#0a0a0a';
            this.ctx.fillRect(0, 0, width, height);
            
            // Gradient background
            const gradient = this.ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, 'rgba(147, 51, 234, 0.1)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, width, height);
            
            // Frequency Bars
            this.drawFrequencyBars();
            
            // Waveform
            this.drawWaveform();
            
            // Audio Info
            this.drawAudioInfo();
            
            return this.canvas.toBuffer('image/png');
        } catch (error) {
            console.error('❌ Render Error:', error);
            return null;
        }
    }

    drawFrequencyBars() {
        if (!this.ctx) return;
        
        const { width, height } = this.canvas;
        const barWidth = width / this.audioData.frequencies.length;
        const maxHeight = height * 0.4;
        
        for (let i = 0; i < this.audioData.frequencies.length; i++) {
            const barHeight = (this.audioData.frequencies[i] / 100) * maxHeight;
            const x = i * barWidth;
            const y = height - barHeight - 80;
            
            // Rainbow-Farben basierend auf Frequenz
            const hue = (i / this.audioData.frequencies.length) * 360;
            const intensity = Math.min(this.audioData.frequencies[i] / 50, 1);
            
            this.ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${intensity})`;
            
            // Glow-Effekt für hohe Amplitude
            if (this.audioData.frequencies[i] > 30) {
                this.ctx.shadowColor = `hsl(${hue}, 70%, 60%)`;
                this.ctx.shadowBlur = 10;
            } else {
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.fillRect(x, y, barWidth - 1, barHeight);
        }
        
        this.ctx.shadowBlur = 0;
    }

    drawWaveform() {
        if (!this.ctx) return;
        
        const { width, height } = this.canvas;
        const waveformY = height - 40;
        const waveformHeight = 30;
        
        this.ctx.strokeStyle = '#10b981';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = '#10b981';
        this.ctx.shadowBlur = 5;
        
        this.ctx.beginPath();
        
        for (let i = 0; i < this.audioData.waveform.length; i++) {
            const x = (i / this.audioData.waveform.length) * width;
            const y = waveformY + (this.audioData.waveform[i] / 100) * waveformHeight;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    drawAudioInfo() {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        // Live Indicator
        const time = Date.now() / 1000;
        const pulse = (Math.sin(time * 3) + 1) / 2;
        this.ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + pulse * 0.5})`;
        this.ctx.fillRect(10, 10, 8, 8);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('LIVE', 25, 20);
        
        // Audio Stats
        this.ctx.fillText(`Volume: ${this.audioData.volume.toFixed(1)}%`, 10, 40);
        this.ctx.fillText(`Peak: ${this.audioData.peak.toFixed(1)}%`, 10, 60);
        this.ctx.fillText(`Bass: ${this.audioData.bassLevel.toFixed(1)}`, 150, 40);
        this.ctx.fillText(`Mid: ${this.audioData.midLevel.toFixed(1)}`, 150, 60);
        this.ctx.fillText(`Treble: ${this.audioData.trebleLevel.toFixed(1)}`, 250, 40);
    }

    renderLoop() {
        if (!this.isAnalyzing) return;
        
        // Broadcast Audio-Daten an WebSocket-Clients
        this.broadcastData();
        
        // Nächster Frame
        setTimeout(() => this.renderLoop(), 50); // 20 FPS
    }

    broadcastData() {
        if (this.clients.size === 0) return;
        
        const message = JSON.stringify({
            type: 'audioVisualization',
            data: this.audioData,
            timestamp: Date.now()
        });
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                } catch (error) {
                    console.error('❌ WebSocket Send Error:', error);
                }
            }
        });
    }

    getVisualizationImage() {
        return this.renderVisualization();
    }

    getCurrentData() {
        return {
            ...this.audioData,
            isAnalyzing: this.isAnalyzing,
            wsPort: this.wsPort,
            timestamp: Date.now()
        };
    }

    cleanup() {
        this.stopAnalyzing();
        
        if (this.wsServer) {
            this.wsServer.close();
            console.log('🔌 Audio Visualizer WebSocket Server geschlossen');
        }
    }
}

// Globale Visualizer-Instanz
const audioVisualizer = new AudioVisualizer();

module.exports = {
    audioVisualizer,
    AudioVisualizer
}; 