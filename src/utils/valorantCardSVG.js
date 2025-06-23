const sharp = require('sharp');

/**
 * Erstellt eine Valorant-Karte als SVG und konvertiert sie zu PNG
 * Funktioniert ohne Canvas - perfekt für Railway!
 */
async function createValorantCardSVG(stats) {
  try {
    // Valorant-Farben
    const colors = {
      primary: '#FF4655',
      secondary: '#0F1419', 
      accent: '#53212B',
      text: '#FFFFFF',
      textSecondary: '#9CA3AF',
      bg: 'url(#valorantGrad)',
      cardBg: 'rgba(15, 20, 25, 0.95)'
    };

    // Sichere Werte extrahieren
    const playerName = String(stats.name || 'Unknown').replace(/[<>&"']/g, '');
    const playerTag = String(stats.tag || '0000').replace(/[<>&"']/g, '');
    const currentRank = String(stats.currentRank || 'Unranked').replace(/[<>&"']/g, '');
    const peakRank = String(stats.peakRank || 'Unranked').replace(/[<>&"']/g, '');
    const rr = parseInt(stats.rr) || 0;
    const level = parseInt(stats.level) || 1;
    const kills = parseInt(stats.kills) || 0;
    const deaths = parseInt(stats.deaths) || 0;
    const assists = parseInt(stats.assists) || 0;
    const hsRate = parseFloat(stats.hsRate) || 0;
    const adr = parseInt(stats.adr) || 0;
    const winRate = parseFloat(stats.winRate) || 0;
    const totalMatches = parseInt(stats.totalMatches) || 0;

    // SVG Template mit Valorant-Design
    const svgContent = `
    <svg width="900" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Valorant-Gradient -->
        <linearGradient id="valorantGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1a1f2e" />
          <stop offset="50%" stop-color="${colors.secondary}" />
          <stop offset="100%" stop-color="#0f1419" />
        </linearGradient>
        
        <!-- Card Gradient -->
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(255, 70, 85, 0.1)" />
          <stop offset="100%" stop-color="rgba(15, 20, 25, 0.95)" />
        </linearGradient>

        <!-- Glow Filter -->
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <!-- Shadow Filter -->
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.8)"/>
        </filter>
      </defs>

      <!-- Hintergrund -->
      <rect width="900" height="600" fill="url(#valorantGrad)" />
      
      <!-- Hauptkarte -->
      <rect x="30" y="30" width="840" height="540" rx="12" ry="12" 
            fill="url(#cardGrad)" stroke="${colors.primary}" stroke-width="2" 
            filter="url(#shadow)" />

      <!-- Header Section -->
      <rect x="50" y="50" width="800" height="80" rx="8" ry="8" 
            fill="rgba(255, 70, 85, 0.1)" stroke="${colors.primary}" stroke-width="1" />
      
      <!-- Spielername -->
      <text x="70" y="85" font-family="Arial Black, Arial" font-size="32" 
            fill="${colors.text}" filter="url(#glow)" font-weight="bold">
        ${playerName}
      </text>
      <text x="70" y="110" font-family="Arial" font-size="18" 
            fill="${colors.textSecondary}">#${playerTag}</text>
      
      <!-- Level Badge -->
      <rect x="750" y="65" width="80" height="25" rx="12" ry="12" 
            fill="${colors.primary}" />
      <text x="790" y="82" font-family="Arial" font-size="14" 
            fill="white" text-anchor="middle">Level ${level}</text>

      <!-- Rang Section -->
      <rect x="50" y="150" width="380" height="120" rx="8" ry="8" 
            fill="rgba(255, 70, 85, 0.08)" stroke="${colors.accent}" stroke-width="1" />
      
      <text x="70" y="180" font-family="Arial" font-size="16" 
            fill="${colors.primary}" font-weight="bold">AKTUELLER RANG</text>
      <text x="70" y="210" font-family="Arial Black" font-size="28" 
            fill="${colors.text}" font-weight="bold">${currentRank}</text>
      <text x="70" y="240" font-family="Arial" font-size="20" 
            fill="${colors.textSecondary}">${rr} RR</text>

      <!-- Peak Rang -->
      <rect x="470" y="150" width="380" height="120" rx="8" ry="8" 
            fill="rgba(255, 70, 85, 0.08)" stroke="${colors.accent}" stroke-width="1" />
      
      <text x="490" y="180" font-family="Arial" font-size="16" 
            fill="${colors.primary}" font-weight="bold">PEAK RANG</text>
      <text x="490" y="210" font-family="Arial Black" font-size="28" 
            fill="${colors.text}" font-weight="bold">${peakRank}</text>

      <!-- Statistiken Grid -->
      
      <!-- K/D/A -->
      <rect x="50" y="290" width="180" height="100" rx="8" ry="8" 
            fill="rgba(255, 70, 85, 0.08)" stroke="${colors.accent}" stroke-width="1" />
      <text x="70" y="315" font-family="Arial" font-size="14" 
            fill="${colors.primary}" font-weight="bold">K/D/A</text>
      <text x="70" y="345" font-family="Arial Black" font-size="24" 
            fill="${colors.text}" font-weight="bold">${kills}/${deaths}/${assists}</text>

      <!-- Headshot Rate -->
      <rect x="250" y="290" width="180" height="100" rx="8" ry="8" 
            fill="rgba(255, 70, 85, 0.08)" stroke="${colors.accent}" stroke-width="1" />
      <text x="270" y="315" font-family="Arial" font-size="14" 
            fill="${colors.primary}" font-weight="bold">HEADSHOT</text>
      <text x="270" y="345" font-family="Arial Black" font-size="24" 
            fill="${colors.text}" font-weight="bold">${hsRate.toFixed(1)}%</text>

      <!-- ADR -->
      <rect x="450" y="290" width="180" height="100" rx="8" ry="8" 
            fill="rgba(255, 70, 85, 0.08)" stroke="${colors.accent}" stroke-width="1" />
      <text x="470" y="315" font-family="Arial" font-size="14" 
            fill="${colors.primary}" font-weight="bold">ADR</text>
      <text x="470" y="345" font-family="Arial Black" font-size="24" 
            fill="${colors.text}" font-weight="bold">${adr}</text>

      <!-- Win Rate -->
      <rect x="650" y="290" width="200" height="100" rx="8" ry="8" 
            fill="rgba(255, 70, 85, 0.08)" stroke="${colors.accent}" stroke-width="1" />
      <text x="670" y="315" font-family="Arial" font-size="14" 
            fill="${colors.primary}" font-weight="bold">WIN RATE</text>
      <text x="670" y="345" font-family="Arial Black" font-size="24" 
            fill="${colors.text}" font-weight="bold">${winRate.toFixed(1)}%</text>

      <!-- Matches -->
      <rect x="50" y="410" width="800" height="60" rx="8" ry="8" 
            fill="rgba(255, 70, 85, 0.08)" stroke="${colors.accent}" stroke-width="1" />
      <text x="70" y="435" font-family="Arial" font-size="14" 
            fill="${colors.primary}" font-weight="bold">GESPIELTE MATCHES</text>
      <text x="70" y="455" font-family="Arial" font-size="20" 
            fill="${colors.text}">${totalMatches} Matches diese Season</text>

      <!-- Footer -->
      <rect x="50" y="490" width="800" height="50" rx="8" ry="8" 
            fill="rgba(0, 0, 0, 0.3)" />
      <text x="450" y="520" font-family="Arial" font-size="16" 
            fill="${colors.textSecondary}" text-anchor="middle">Powered by AgentBee • Valorant API</text>

      <!-- Valorant Logo Simulation (geometrische Form) -->
      <polygon points="750,500 780,480 810,500 780,520" 
               fill="${colors.primary}" opacity="0.7" />
    </svg>`;

    // SVG zu PNG konvertieren mit Sharp
    const pngBuffer = await sharp(Buffer.from(svgContent))
      .png({
        quality: 90,
        compressionLevel: 6
      })
      .toBuffer();

    return pngBuffer;

  } catch (error) {
    console.error('❌ SVG Valorant Card Error:', error);
    
    // Fallback: Einfache Text-Karte
    return createSimpleTextCard(stats);
  }
}

/**
 * Fallback: Einfache Text-basierte Karte
 */
function createSimpleTextCard(stats) {
  const lines = [
    `🎮 **${stats.name || 'Unknown'}#${stats.tag || '0000'}** (Level ${stats.level || 1})`,
    '',
    `🏆 **Rang:** ${stats.currentRank || 'Unranked'} (${stats.rr || 0} RR)`,
    `⭐ **Peak:** ${stats.peakRank || 'Unranked'}`,
    '',
    `⚔️ **K/D/A:** ${stats.kills || 0}/${stats.deaths || 0}/${stats.assists || 0}`,
    `🎯 **Headshot-Rate:** ${(stats.hsRate || 0).toFixed(1)}%`,
    `💥 **ADR:** ${Math.round(stats.adr || 0)}`,
    '',
    `📊 **Matches:** ${stats.totalMatches || 0} (${(stats.winRate || 0).toFixed(1)}% Win-Rate)`,
    '',
    `*Powered by AgentBee*`
  ];
  
  return lines.join('\n');
}

module.exports = {
  createValorantCardSVG,
  createSimpleTextCard
}; 