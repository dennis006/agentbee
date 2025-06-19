interface CyberBeeProps {
  size?: number;
  glowing?: boolean;
  animated?: boolean;
}

const CyberBee = ({ size = 40, glowing = true, animated = true }: CyberBeeProps) => {
  // Eindeutige IDs für SVG Filter
  const id = Math.random().toString(36).substr(2, 9);
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`cyber-bee ${animated ? 'animate-wing-flutter' : ''}`}
    >
      {/* Glow Filter Definition */}
      <defs>
        <filter id={`neon-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <filter id={`wing-glow-${id}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Gradient für Körper */}
        <linearGradient id={`bodyGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>

        {/* Gradient für Flügel */}
        <radialGradient id={`wingGradient-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#0891B2" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0E7490" stopOpacity="0.2" />
        </radialGradient>
      </defs>

      {/* Flügel Links */}
      <ellipse
        cx="25"
        cy="35"
        rx="18"
        ry="12"
        fill={`url(#wingGradient-${id})`}
        stroke="#06B6D4"
        strokeWidth="1"
        filter={glowing ? `url(#wing-glow-${id})` : undefined}
        className={animated ? "wing-left" : ""}
        transform="rotate(-20 25 35)"
      />
      
      {/* Flügel Rechts */}
      <ellipse
        cx="75"
        cy="35"
        rx="18"
        ry="12"
        fill={`url(#wingGradient-${id})`}
        stroke="#06B6D4"
        strokeWidth="1"
        filter={glowing ? `url(#wing-glow-${id})` : undefined}
        className={animated ? "wing-right" : ""}
        transform="rotate(20 75 35)"
      />

      {/* Hauptkörper */}
      <ellipse
        cx="50"
        cy="55"
        rx="22"
        ry="30"
        fill={`url(#bodyGradient-${id})`}
        stroke="#8B5CF6"
        strokeWidth="2"
        filter={glowing ? `url(#neon-glow-${id})` : undefined}
      />

      {/* Körper-Streifen */}
      <ellipse cx="50" cy="45" rx="20" ry="3" fill="#1F2937" opacity="0.7" />
      <ellipse cx="50" cy="55" rx="20" ry="3" fill="#1F2937" opacity="0.7" />
      <ellipse cx="50" cy="65" rx="20" ry="3" fill="#1F2937" opacity="0.7" />

      {/* Kopf */}
      <circle
        cx="50"
        cy="25"
        r="15"
        fill={`url(#bodyGradient-${id})`}
        stroke="#8B5CF6"
        strokeWidth="2"
        filter={glowing ? `url(#neon-glow-${id})` : undefined}
      />

      {/* Augen */}
      <circle cx="45" cy="22" r="4" fill="#06B6D4" className={animated ? "eye-glow" : ""} />
      <circle cx="55" cy="22" r="4" fill="#06B6D4" className={animated ? "eye-glow" : ""} />
      <circle cx="45" cy="22" r="2" fill="#FFFFFF" />
      <circle cx="55" cy="22" r="2" fill="#FFFFFF" />

      {/* Antennen */}
      <line x1="45" y1="15" x2="42" y2="8" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
      <line x1="55" y1="15" x2="58" y2="8" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
      <circle cx="42" cy="8" r="2" fill="#06B6D4" className={animated ? "antenna-glow" : ""} />
      <circle cx="58" cy="8" r="2" fill="#06B6D4" className={animated ? "antenna-glow" : ""} />

      {/* Stachel */}
      <polygon
        points="50,80 47,90 53,90"
        fill="#F59E0B"
        stroke="#D97706"
        strokeWidth="1"
        filter={glowing ? `url(#neon-glow-${id})` : undefined}
      />

      {/* Style für Animationen */}
      <style>{`
        .wing-left {
          animation: wing-beat-left 0.3s ease-in-out infinite;
          transform-origin: 25px 35px;
        }
        
        .wing-right {
          animation: wing-beat-right 0.3s ease-in-out infinite;
          transform-origin: 75px 35px;
        }
        
        .eye-glow {
          animation: eye-pulse 2s ease-in-out infinite;
        }
        
        .antenna-glow {
          animation: antenna-twinkle 1.5s ease-in-out infinite;
        }
        
        @keyframes wing-beat-left {
          0%, 100% { transform: rotate(-20deg) scaleY(1); }
          50% { transform: rotate(-30deg) scaleY(0.7); }
        }
        
        @keyframes wing-beat-right {
          0%, 100% { transform: rotate(20deg) scaleY(1); }
          50% { transform: rotate(30deg) scaleY(0.7); }
        }
        
        @keyframes eye-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes antenna-twinkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
      `}</style>
    </svg>
  );
};

export default CyberBee; 