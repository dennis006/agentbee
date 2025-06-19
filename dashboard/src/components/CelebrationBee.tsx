import { useState, useEffect } from 'react';
import './FlyingBee.css';
import CyberBee from './CyberBee';

const CelebrationBee = () => {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    // Starte die Celebration nach kurzer Verzögerung
    const timer = setTimeout(() => {
      setShowCelebration(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!showCelebration) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Mehrere Bienen die rumfliegen und feiern */}
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="absolute animate-celebration-fly"
          style={{
            left: `${20 + index * 30}%`,
            top: `${30 + index * 10}%`,
            animationDelay: `${index * 0.5}s`,
            animationDuration: `${3 + index}s`,
          }}
        >
          <div className="relative">
            <div className="bee-bounce-subtle animate-celebration-bounce">
              <CyberBee size={80} glowing={true} animated={true} />
            </div>
            
            {/* Extra Neon-Glitzer für Celebration */}
            <div className="absolute -top-3 -left-3 animate-celebration-sparkle">
              <div className="w-3 h-3 bg-cyan-400 rounded-full blur-sm shadow-lg shadow-cyan-400/50"></div>
            </div>
            <div className="absolute -top-3 -right-3 animate-celebration-sparkle" style={{ animationDelay: '0.3s' }}>
              <div className="w-4 h-4 bg-purple-400 rounded-full blur-sm shadow-lg shadow-purple-400/50"></div>
            </div>
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 animate-celebration-sparkle" style={{ animationDelay: '0.6s' }}>
              <div className="w-3 h-3 bg-yellow-400 rounded-full blur-sm shadow-lg shadow-yellow-400/50"></div>
            </div>
          </div>
        </div>
      ))}

      {/* Cyber-Konfetti und Digital-Partikel */}
      {[...Array(20)].map((_, index) => {
        const shapes = ['○', '□', '◇', '△', '▽', '◊'];
        const colors = ['text-cyan-400', 'text-purple-400', 'text-yellow-400', 'text-pink-400', 'text-green-400'];
        
        return (
          <div
            key={`confetti-${index}`}
            className={`absolute animate-confetti-fall ${colors[Math.floor(Math.random() * colors.length)]}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
              fontSize: `${0.8 + Math.random() * 0.8}rem`,
              filter: 'drop-shadow(0 0 3px currentColor)',
            }}
          >
            {shapes[Math.floor(Math.random() * shapes.length)]}
          </div>
        );
      })}
      
      {/* Neon-Glitzer Partikel */}
      {[...Array(10)].map((_, index) => (
        <div
          key={`neon-${index}`}
          className="absolute animate-confetti-fall"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-5%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${4 + Math.random() * 2}s`,
          }}
        >
          <div 
            className={`w-1 h-1 rounded-full blur-sm ${
              ['bg-cyan-400', 'bg-purple-400', 'bg-yellow-400'][Math.floor(Math.random() * 3)]
            }`}
            style={{
              boxShadow: '0 0 6px currentColor',
            }}
          />
        </div>
      ))}


    </div>
  );
};

export default CelebrationBee; 