import { useState, useEffect } from 'react';
import './FlyingBee.css';
import CyberBee from './CyberBee';

interface BeePosition {
  x: number;
  y: number;
  rotation: number;
}

const FlyingBee = () => {
  const [position, setPosition] = useState<BeePosition>({ x: 50, y: 50, rotation: 0 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let animationId: number;
    let lastTime = 0;
    const speed = 0.8; // Geschwindigkeit der Biene
    const changeDirectionInterval = 3000; // Richtung alle 3 Sekunden ändern
    let lastDirectionChange = 0;
    let targetX = Math.random() * 80 + 10; // Ziel-X zwischen 10% und 90%
    let targetY = Math.random() * 80 + 10; // Ziel-Y zwischen 10% und 90%

    const updatePosition = (currentTime: number) => {
      if (currentTime - lastTime > 50) { // Update alle 50ms für smooth animation
        // Richtungsänderung alle paar Sekunden
        if (currentTime - lastDirectionChange > changeDirectionInterval) {
          targetX = Math.random() * 80 + 10;
          targetY = Math.random() * 80 + 10;
          lastDirectionChange = currentTime;
        }

        setPosition(prev => {
          // Berechne Richtung zum Ziel
          const deltaX = targetX - prev.x;
          const deltaY = targetY - prev.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance < 2) {
            // Neues Ziel wenn nah genug
            targetX = Math.random() * 80 + 10;
            targetY = Math.random() * 80 + 10;
          }

          // Normalisiere Richtung und füge etwas Zufall hinzu
          const normalizedX = distance > 0 ? deltaX / distance : 0;
          const normalizedY = distance > 0 ? deltaY / distance : 0;
          
          // Kleine zufällige Abweichung für realistisches Flugverhalten
          const randomX = (Math.random() - 0.5) * 0.3;
          const randomY = (Math.random() - 0.5) * 0.3;

          const newX = Math.max(5, Math.min(95, prev.x + (normalizedX + randomX) * speed));
          const newY = Math.max(5, Math.min(95, prev.y + (normalizedY + randomY) * speed));

          // Berechne Rotation basierend auf Bewegungsrichtung
          const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

          return {
            x: newX,
            y: newY,
            rotation: angle
          };
        });

        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(updatePosition);
    };

    animationId = requestAnimationFrame(updatePosition);

    // Gelegentliches Verstecken/Zeigen der Biene für mehr Realismus
    const hideShowInterval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% Chance alle 2 Sekunden
        setIsVisible(false);
        setTimeout(() => setIsVisible(true), 1000 + Math.random() * 2000); // 1-3 Sekunden versteckt
      }
    }, 2000);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(hideShowInterval);
    };
  }, []);

  return (
    <div
      className={`fixed pointer-events-none z-30 transition-all duration-500 bee-container ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
      }`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) rotate(${position.rotation}deg)`,
        transition: 'left 0.1s ease-out, top 0.1s ease-out',
      }}
    >
      {/* Cyber-Biene mit Animationen */}
      <div className="relative">
        {/* Custom SVG Biene */}
        <div className="bee-bounce-subtle">
          <CyberBee size={60} glowing={true} animated={true} />
        </div>
        
        {/* Neon-Glitzer-Effekt */}
        <div className="absolute -top-2 -left-2 bee-ping-slow opacity-40">
          <div className="w-2 h-2 bg-cyan-400 rounded-full blur-sm"></div>
        </div>
        <div 
          className="absolute -top-2 -right-2 bee-ping-slow opacity-40" 
          style={{ animationDelay: '0.5s' }}
        >
          <div className="w-2 h-2 bg-purple-400 rounded-full blur-sm"></div>
        </div>
        
        {/* Cyber-Schatten */}
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-purple-500/30 rounded-full blur-md bee-shadow-pulse" />
        
        {/* Digital Pollen-Trail */}
        <div 
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-cyan-300 text-sm opacity-60"
          style={{ animation: 'trail-fade 2s ease-out infinite' }}
        >
          •
        </div>
        <div 
          className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-purple-300 text-xs opacity-40"
          style={{ animation: 'trail-fade 2.5s ease-out infinite' }}
        >
          •
        </div>
      </div>
    </div>
  );
};

export default FlyingBee; 