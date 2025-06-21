import React, { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  audioData: {
    frequencies: number[];
    waveform: number[];
    volume: number;
    peak: number;
    bassLevel: number;
    midLevel: number;
    trebleLevel: number;
  };
  isAnalyzing: boolean;
  className?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  audioData, 
  isAnalyzing, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas-Größe setzen
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const animate = () => {
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

      if (isAnalyzing) {
        // Frequenz-Balken zeichnen
        drawFrequencyBars(ctx, audioData);
        
        // Waveform zeichnen
        drawWaveform(ctx, audioData);
        
        // Audio-Info Text
        drawAudioInfo(ctx, audioData);
      } else {
        // "Nicht aktiv" Anzeige
        drawInactiveState(ctx);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioData, isAnalyzing, dimensions]);

  // Responsive Canvas-Größe
  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        setDimensions({
          width: Math.min(800, rect.width - 40),
          height: 400
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const drawFrequencyBars = (ctx: CanvasRenderingContext2D, audioData: any) => {
    const barWidth = dimensions.width / audioData.frequencies.length;
    const maxHeight = dimensions.height * 0.6;
    
    for (let i = 0; i < audioData.frequencies.length; i++) {
      const barHeight = (audioData.frequencies[i] / 100) * maxHeight;
      const x = i * barWidth;
      const y = dimensions.height - barHeight - 50;
      
      // Farbe basierend auf Frequenz
      const hue = (i / audioData.frequencies.length) * 360;
      const saturation = 70 + (audioData.frequencies[i] / 100) * 30;
      const lightness = 50 + (audioData.frequencies[i] / 100) * 30;
      
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
      
      // Glow-Effekt für höhere Balken
      if (barHeight > 20) {
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y, barWidth - 1, Math.min(barHeight, 5));
        ctx.shadowBlur = 0;
      }
    }
  };

  const drawWaveform = (ctx: CanvasRenderingContext2D, audioData: any) => {
    const waveHeight = 80;
    const waveY = dimensions.height - 40;
    const stepX = dimensions.width / audioData.waveform.length;
    
    // Hauptwelle
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
  };

  const drawAudioInfo = (ctx: CanvasRenderingContext2D, audioData: any) => {
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
    ctx.fillStyle = `rgba(0, 255, 0, ${pulse})`;
    ctx.beginPath();
    ctx.arc(dimensions.width - 30, 30, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('LIVE', dimensions.width - 60, 36);
  };

  const drawInactiveState = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#666666';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      '🌊 Audio Visualizer - Nicht aktiv', 
      dimensions.width / 2, 
      dimensions.height / 2
    );
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#999999';
    ctx.fillText(
      'Starte Musik, um die Live-Visualisierung zu sehen', 
      dimensions.width / 2, 
      dimensions.height / 2 + 40
    );
    
    ctx.textAlign = 'left';
  };

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-700 bg-black ${className}`}>
      {/* Audio-Level Bars */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <div className="bg-black/70 rounded-lg p-3 text-white text-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-red-400">🔊</span>
            <div className="w-20 h-2 bg-gray-700 rounded">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-red-500 rounded transition-all duration-100"
                style={{ width: `${Math.min(audioData.volume, 100)}%` }}
              />
            </div>
            <span className="text-xs w-8">{audioData.volume.toFixed(0)}%</span>
          </div>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-400">🎵</span>
            <div className="w-20 h-2 bg-gray-700 rounded">
              <div 
                className="h-full bg-blue-500 rounded transition-all duration-100"
                style={{ width: `${Math.min(audioData.bassLevel * 2, 100)}%` }}
              />
            </div>
            <span className="text-xs w-8">Bass</span>
          </div>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-400">🎶</span>
            <div className="w-20 h-2 bg-gray-700 rounded">
              <div 
                className="h-full bg-yellow-500 rounded transition-all duration-100"
                style={{ width: `${Math.min(audioData.midLevel * 2, 100)}%` }}
              />
            </div>
            <span className="text-xs w-8">Mid</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-purple-400">🎵</span>
            <div className="w-20 h-2 bg-gray-700 rounded">
              <div 
                className="h-full bg-purple-500 rounded transition-all duration-100"
                style={{ width: `${Math.min(audioData.trebleLevel * 2, 100)}%` }}
              />
            </div>
            <span className="text-xs w-8">High</span>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="bg-black/70 rounded-lg p-2 text-white text-xs flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          {isAnalyzing ? 'Live' : 'Offline'}
        </div>
      </div>
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ maxWidth: '100%', height: '400px' }}
      />
    </div>
  );
};

export default AudioVisualizer; 