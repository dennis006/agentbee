import React from 'react';
import AnimatedWarning from './AnimatedWarning';

const WarningDemo: React.FC = () => {
  const variants = [
    { name: 'Default', variant: 'default' as const, description: 'Sanfte Rotation und Skalierung' },
    { name: 'Pulse', variant: 'pulse' as const, description: 'Pulsierender Effekt' },
    { name: 'Shake', variant: 'shake' as const, description: 'Zitternde Bewegung für Aufmerksamkeit' },
    { name: 'Glow', variant: 'glow' as const, description: 'Leuchtender Glow-Effekt' },
    { name: 'Bounce', variant: 'bounce' as const, description: 'Springende Bewegung' },
  ];

  const sizes = [16, 24, 32, 48, 64];

  return (
    <div className="p-8 bg-gradient-dark min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-neon-purple mb-8 text-center">
          🎨 Animiertes Warning Icon Demo
        </h1>
        
        {/* Varianten Demo */}
        <div className="cyber-card p-6 mb-8">
          <h2 className="text-xl font-bold text-neon-purple mb-6">Animation Varianten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {variants.map((item) => (
              <div key={item.variant} className="text-center p-4 bg-dark-lighter rounded-lg border border-purple-primary/20">
                <div className="mb-4 flex justify-center">
                  <AnimatedWarning size={48} variant={item.variant} />
                </div>
                <h3 className="font-bold text-neon-purple mb-2">{item.name}</h3>
                <p className="text-dark-text text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Größen Demo */}
        <div className="cyber-card p-6 mb-8">
          <h2 className="text-xl font-bold text-neon-purple mb-6">Verschiedene Größen</h2>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {sizes.map((size) => (
              <div key={size} className="text-center">
                <div className="mb-2 flex justify-center">
                  <AnimatedWarning size={size} variant="glow" />
                </div>
                <span className="text-dark-muted text-sm">{size}px</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verwendungsbeispiele */}
        <div className="cyber-card p-6">
          <h2 className="text-xl font-bold text-neon-purple mb-6">Verwendungsbeispiele</h2>
          
          <div className="space-y-4">
            {/* Warnung in Alert */}
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 flex items-center gap-3">
              <AnimatedWarning size={24} variant="shake" />
              <div>
                <h4 className="font-bold text-yellow-400">Wichtiger Hinweis</h4>
                <p className="text-dark-text">Dies ist eine Warnung mit animiertem Icon.</p>
              </div>
            </div>

            {/* Fehler Message */}
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
              <AnimatedWarning size={20} variant="pulse" className="text-red-400" />
              <div>
                <h4 className="font-bold text-red-400">Fehler aufgetreten</h4>
                <p className="text-dark-text">Ein Problem wurde erkannt.</p>
              </div>
            </div>

            {/* Info mit Animation */}
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 flex items-center gap-3">
              <AnimatedWarning size={18} variant="bounce" />
              <div>
                <h4 className="font-bold text-blue-400">Information</h4>
                <p className="text-dark-text">Beachte diese wichtige Information.</p>
              </div>
            </div>

            {/* Inline Text mit Icon */}
            <div className="text-dark-text flex items-center gap-2">
              <AnimatedWarning size={16} variant="glow" />
              <span>Nur Administratoren haben Zugriff auf diese Funktion.</span>
            </div>
          </div>
        </div>

        {/* Code Beispiele */}
        <div className="cyber-card p-6 mt-8">
          <h2 className="text-xl font-bold text-neon-purple mb-6">Code Beispiele</h2>
          
          <div className="space-y-4">
            <div className="bg-dark-lighter p-4 rounded-lg border border-purple-primary/20">
              <h4 className="font-bold text-neon-purple mb-2">Basis Verwendung:</h4>
              <code className="text-green-400 text-sm">
                {'<AnimatedWarning size={24} variant="pulse" />'}
              </code>
            </div>

            <div className="bg-dark-lighter p-4 rounded-lg border border-purple-primary/20">
              <h4 className="font-bold text-neon-purple mb-2">Mit Custom Classes:</h4>
              <code className="text-green-400 text-sm">
                {'<AnimatedWarning size={20} variant="shake" className="text-red-400" />'}
              </code>
            </div>

            <div className="bg-dark-lighter p-4 rounded-lg border border-purple-primary/20">
              <h4 className="font-bold text-neon-purple mb-2">In Alert Message:</h4>
              <code className="text-green-400 text-sm">
                {`<div className="flex items-center gap-2">
  <AnimatedWarning size={16} variant="glow" />
  <span>Warnung: Nur für Admins!</span>
</div>`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarningDemo; 