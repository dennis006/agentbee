import React from 'react';

interface AnimatedWarningProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'pulse' | 'shake' | 'glow' | 'bounce';
}

const AnimatedWarning: React.FC<AnimatedWarningProps> = ({ 
  size = 24, 
  className = '',
  variant = 'default'
}) => {
  const getAnimationClass = () => {
    switch (variant) {
      case 'pulse':
        return 'animate-warning-pulse';
      case 'shake':
        return 'animate-warning-shake';
      case 'glow':
        return 'animate-warning-glow';
      case 'bounce':
        return 'animate-warning-bounce';
      default:
        return 'animate-warning-default';
    }
  };

  return (
    <span className={`inline-block ${getAnimationClass()} ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="warning-svg"
      >
        {/* Glowing Background Circle */}
        <circle
          cx="12"
          cy="12"
          r="11"
          fill="url(#warningGlow)"
          className="warning-glow animate-warning-glow-bg"
        />
        
        {/* Main Triangle */}
        <path
          d="M12 2L22 20H2L12 2Z"
          fill="url(#warningGradient)"
          stroke="url(#warningStroke)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="warning-triangle"
        />
        
        {/* Inner Shadow Triangle */}
        <path
          d="M12 4L20 19H4L12 4Z"
          fill="url(#warningInner)"
          className="warning-inner"
        />
        
        {/* Exclamation Mark Body */}
        <line
          x1="12"
          y1="9"
          x2="12"
          y2="15"
          stroke="#1a1a2e"
          strokeWidth="2"
          strokeLinecap="round"
          className="warning-line animate-warning-line"
        />
        
        {/* Exclamation Mark Dot */}
        <circle
          cx="12"
          cy="17"
          r="1"
          fill="#1a1a2e"
          className="warning-dot animate-warning-dot"
        />
        
        {/* Pulsing Ring */}
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="url(#warningPulse)"
          strokeWidth="1"
          className="warning-pulse-ring animate-warning-pulse-ring"
        />
        
        {/* Sparkling Effects */}
        <g className="warning-sparkles">
          <circle cx="6" cy="8" r="0.5" fill="#fbbf24" className="animate-warning-sparkle-1">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0s"/>
          </circle>
          <circle cx="18" cy="10" r="0.5" fill="#f59e0b" className="animate-warning-sparkle-2">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0.7s"/>
          </circle>
          <circle cx="8" cy="18" r="0.5" fill="#fbbf24" className="animate-warning-sparkle-3">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="1.4s"/>
          </circle>
          <circle cx="16" cy="17" r="0.5" fill="#f59e0b" className="animate-warning-sparkle-4">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0.3s"/>
          </circle>
        </g>
        
        {/* Gradients and Effects */}
        <defs>
          {/* Main Warning Gradient */}
          <linearGradient id="warningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24">
              <animate attributeName="stop-color" values="#fbbf24;#f59e0b;#fbbf24" dur="3s" repeatCount="indefinite"/>
            </stop>
            <stop offset="50%" stopColor="#f59e0b">
              <animate attributeName="stop-color" values="#f59e0b;#d97706;#f59e0b" dur="3s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#d97706">
              <animate attributeName="stop-color" values="#d97706;#b45309;#d97706" dur="3s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>
          
          {/* Stroke Gradient */}
          <linearGradient id="warningStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#d97706" stopOpacity="1"/>
          </linearGradient>
          
          {/* Inner Shadow */}
          <radialGradient id="warningInner" cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1"/>
          </radialGradient>
          
          {/* Glow Effect */}
          <radialGradient id="warningGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.2">
              <animate attributeName="stop-opacity" values="0.1;0.3;0.1" dur="2s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0">
              <animate attributeName="stop-opacity" values="0;0.2;0" dur="2s" repeatCount="indefinite"/>
            </stop>
          </radialGradient>
          
          {/* Pulse Ring */}
          <linearGradient id="warningPulse" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3"/>
          </linearGradient>
          
          {/* Drop Shadow Filter */}
          <filter id="warningDropShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        {/* Apply filter to main triangle */}
        <style>
          {`
            .warning-triangle {
              filter: url(#warningDropShadow);
            }
          `}
        </style>
      </svg>
    </span>
  );
};

export default AnimatedWarning; 