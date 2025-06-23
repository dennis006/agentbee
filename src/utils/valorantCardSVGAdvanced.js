const sharp = require('sharp');
const https = require('https');
const http = require('http');

/**
 * Lädt ein Bild von einer URL und konvertiert es zu Base64
 */
async function loadImageAsBase64(url, fallbackChar = '🎮') {
  return new Promise((resolve) => {
    try {
      const protocol = url.startsWith('https:') ? https : http;
      
      protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          console.log(`⚠️ Bild nicht verfügbar (${response.statusCode}): ${url}`);
          resolve(fallbackChar);
          return;
        }

        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks);
            const base64 = buffer.toString('base64');
            const mimeType = response.headers['content-type'] || 'image/png';
            resolve(`data:${mimeType};base64,${base64}`);
          } catch (error) {
            console.log(`⚠️ Fehler beim Base64-Konvertieren: ${error.message}`);
            resolve(fallbackChar);
          }
        });
      }).on('error', (error) => {
        console.log(`⚠️ Fehler beim Laden des Bildes: ${error.message}`);
        resolve(fallbackChar);
      }).setTimeout(5000, () => {
        console.log(`⚠️ Timeout beim Laden des Bildes: ${url}`);
        resolve(fallbackChar);
      });
    } catch (error) {
      console.log(`⚠️ Fehler beim Image-Load: ${error.message}`);
      resolve(fallbackChar);
    }
  });
}

/**
 * Rang-Icon URLs basierend auf Tier-ID
 */
function getRankIconUrl(tierId) {
  const tierMap = {
    0: null, // Unranked
    3: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/0/smallicon.png', // Iron 1
    4: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/1/smallicon.png', // Iron 2
    5: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/2/smallicon.png', // Iron 3
    6: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/3/smallicon.png', // Bronze 1
    7: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/4/smallicon.png', // Bronze 2
    8: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/5/smallicon.png', // Bronze 3
    9: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/6/smallicon.png', // Silver 1
    10: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/7/smallicon.png', // Silver 2
    11: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/8/smallicon.png', // Silver 3
    12: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/9/smallicon.png', // Gold 1
    13: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/10/smallicon.png', // Gold 2
    14: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/11/smallicon.png', // Gold 3
    15: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/12/smallicon.png', // Platinum 1
    16: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/13/smallicon.png', // Platinum 2
    17: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/14/smallicon.png', // Platinum 3
    18: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/15/smallicon.png', // Diamond 1
    19: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/16/smallicon.png', // Diamond 2
    20: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/17/smallicon.png', // Diamond 3
    21: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/18/smallicon.png', // Ascendant 1
    22: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/19/smallicon.png', // Ascendant 2
    23: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/20/smallicon.png', // Ascendant 3
    24: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/21/smallicon.png', // Immortal 1
    25: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/22/smallicon.png', // Immortal 2
    26: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/23/smallicon.png', // Immortal 3
    27: 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/24/smallicon.png' // Radiant
  };
  
  return tierMap[tierId] || null;
}

/**
 * Erstellt eine Valorant-Karte mit echten Icons und Agenten-Bildern
 */
async function createAdvancedValorantCard(stats) {
  try {
    console.log('🎨 Erstelle erweiterte Valorant-Karte mit echten Icons...');
    
    // Valorant-Farben
    const colors = {
      primary: '#FF4655',
      secondary: '#0F1419',
      accent: '#53212B',
      text: '#FFFFFF',
      textSecondary: '#9CA3AF',
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

    // Bilder laden (parallel für bessere Performance)
    console.log('📥 Lade Rang-Icons und Agenten-Bild...');
    
    const [currentRankIcon, peakRankIcon, agentImage] = await Promise.all([
      stats.currentTierId ? loadImageAsBase64(getRankIconUrl(stats.currentTierId), '🏆') : Promise.resolve('🏆'),
      stats.peakTierId ? loadImageAsBase64(getRankIconUrl(stats.peakTierId), '⭐') : Promise.resolve('⭐'),
      stats.agentIconUrl ? loadImageAsBase64(stats.agentIconUrl, '🎯') : Promise.resolve('🎯')
    ]);

    console.log('✅ Icons geladen');

    // SVG Template mit echten Valorant-Assets
    const svgContent = `
    <svg width="1000" height="650" xmlns="http://www.w3.org/2000/svg">
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

        <!-- Agent Gradient -->
        <linearGradient id="agentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(255, 70, 85, 0.2)" />
          <stop offset="100%" stop-color="rgba(255, 70, 85, 0.05)" />
        </linearGradient>

        <!-- Glow Filter -->
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <!-- Shadow Filter -->
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="3" dy="3" stdDeviation="4" flood-color="rgba(0,0,0,0.8)"/>
        </filter>

        <!-- Icon Shadow -->
        <filter id="iconShadow">
          <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.6)"/>
        </filter>
      </defs>

      <!-- Hintergrund -->
      <rect width="1000" height="650" fill="url(#valorantGrad)" />
      
      <!-- Hauptkarte -->
      <rect x="30" y="30" width="940" height="590" rx="12" ry="12" 
            fill="url(#cardGrad)" stroke="${colors.primary}" stroke-width="2" 
            filter="url(#shadow)" />

      <!-- Agent-Section (Links) -->
      <rect x="50" y="50" width="300" height="550" rx="8" ry="8" 
            fill="url(#agentGrad)" stroke="${colors.accent}" stroke-width="1" />
      
      <!-- Agent-Bild Container -->
      <rect x="70" y="70" width="260" height="260" rx="8" ry="8" 
            fill="rgba(0, 0, 0, 0.3)" stroke="${colors.primary}" stroke-width="1" />
      
      ${agentImage.startsWith('data:') ? 
        `<image x="75" y="75" width="250" height="250" href="${agentImage}" 
                preserveAspectRatio="xMidYMid slice" filter="url(#iconShadow)" />` :
        `<text x="200" y="220" font-family="Arial" font-size="48" 
               fill="${colors.primary}" text-anchor="middle">${agentImage}</text>`
      }
      
      <!-- Agent-Info -->
      <text x="200" y="370" font-family="Arial Black" font-size="20" 
            fill="${colors.primary}" text-anchor="middle" font-weight="bold">MAIN AGENT</text>
      <text x="200" y="400" font-family="Arial" font-size="16" 
            fill="${colors.text}" text-anchor="middle">${stats.mostPlayedAgent || 'Verschiedene'}</text>

      <!-- Spieler-Level Badge -->
      <rect x="80" y="450" width="240" height="40" rx="20" ry="20" 
            fill="${colors.primary}" filter="url(#shadow)" />
      <text x="200" y="475" font-family="Arial Black" font-size="18" 
            fill="white" text-anchor="middle" font-weight="bold">LEVEL ${level}</text>

      <!-- Matches Badge -->
      <rect x="80" y="510" width="240" height="60" rx="8" ry="8" 
            fill="rgba(0, 0, 0, 0.4)" stroke="${colors.accent}" stroke-width="1" />
      <text x="200" y="535" font-family="Arial" font-size="14" 
            fill="${colors.primary}" text-anchor="middle" font-weight="bold">SEASON MATCHES</text>
      <text x="200" y="555" font-family="Arial Black" font-size="20" 
            fill="${colors.text}" text-anchor="middle">${totalMatches}</text>

      <!-- Header Section (Rechts) -->
      <rect x="370" y="50" width="600" height="100" rx="8" ry="8" 
            fill="rgba(255, 70, 85, 0.1)" stroke="${colors.primary}" stroke-width="1" />
      
      <!-- Spielername -->
      <text x="390" y="85" font-family="Arial Black, Arial" font-size="36" 
            fill="${colors.text}" filter="url(#glow)" font-weight="bold">
        ${playerName}
      </text>
      <text x="390" y="115" font-family="Arial" font-size="20" 
            fill="${colors.textSecondary}">#${playerTag}</text>

      <!-- Aktueller Rang Section -->
      <rect x="370" y="170" width="280" height="140" rx="8" ry="8" 
            fill="rgba(255, 70, 85, 0.08)" stroke="${colors.accent}" stroke-width="1" />
      
      <!-- Rang-Icon (Aktuell) -->
      ${currentRankIcon.startsWith('data:') ? 
        `<image x="385" y="185" width="50" height="50" href="${currentRankIcon}" 
                filter="url(#iconShadow)" />` :
        `<text x="410" y="220" font-family="Arial" font-size="30" 
               fill="${colors.primary}" text-anchor="middle">${currentRankIcon}</text>`
      }
      
      <text x="450" y="200" font-family="Arial" font-size="16" 
            fill="${colors.primary}" font-weight="bold">AKTUELLER RANG</text>
      <text x="450" y="230" font-family="Arial Black" font-size="24" 
            fill="${colors.text}" font-weight="bold">${currentRank}</text>
      <text x="450" y="260" font-family="Arial" font-size="18" 
            fill="${colors.textSecondary}">${rr} RR</text>

      <!-- Peak Rang Section -->
      <rect x="670" y="170" width="300" height="140" rx="8" ry="8" 
            fill="rgba(255, 70, 85, 0.08)" stroke="${colors.accent}" stroke-width="1" />
      
      <!-- Rang-Icon (Peak) -->
      ${peakRankIcon.startsWith('data:') ? 
        `<image x="685" y="185" width="50" height="50" href="${peakRankIcon}" 
                filter="url(#iconShadow)" />` :
        `<text x="710" y="220" font-family="Arial" font-size="30" 
               fill="${colors.primary}" text-anchor="middle">${peakRankIcon}</text>`
      }
      
      <text x="750" y="200" font-family="Arial" font-size="16" 
            fill="${colors.primary}" font-weight="bold">PEAK RANG</text>
      <text x="750" y="230" font-family="Arial Black" font-size="24" 
            fill="${colors.text}" font-weight="bold">${peakRank}</text>

      <!-- Statistiken Grid -->
      
      <!-- K/D/A -->
      <rect x="370" y="330" width="180" height="110" rx="8" ry="8" 
            fill="rgba(255, 70, 85, 0.08)" stroke="${colors.accent}" stroke-width="1" />
      <text x="390" y="355" font-family="Arial" font-size="14" 
            fill="${colors.primary}" font-weight="bold">K/D/A</text>
      <text x="390" y="385" font-family="Arial Black" font-size="26" 
            fill="${colors.text}" font-weight="bold">${kills}/${deaths}/${assists}</text>
      <text x="390" y="410" font-family="Arial" font-size="12" 
            fill="${colors.textSecondary}">Kills/Deaths/Assists</text>

      <!-- Headshot Rate -->
      <rect x="570" y="330" width="180" height="110" rx="8" ry="8" 
            fill="rgba(255, 70, 85, 0.08)" stroke="${colors.accent}" stroke-width="1" />
      <text x="590" y="355" font-family="Arial" font-size="14" 
            fill="${colors.primary}" font-weight="bold">HEADSHOT</text>
      <text x="590" y="385" font-family="Arial Black" font-size="26" 
            fill="${colors.text}" font-weight="bold">${hsRate.toFixed(1)}%</text>
      <text x="590" y="410" font-family="Arial" font-size="12" 
            fill="${colors.textSecondary}">Accuracy Rate</text>

      <!-- ADR -->
      <rect x="770" y="330" width="200" height="110" rx="8" ry="8" 
            fill="rgba(255, 70, 85, 0.08)" stroke="${colors.accent}" stroke-width="1" />
      <text x="790" y="355" font-family="Arial" font-size="14" 
            fill="${colors.primary}" font-weight="bold">ADR</text>
      <text x="790" y="385" font-family="Arial Black" font-size="26" 
            fill="${colors.text}" font-weight="bold">${adr}</text>
      <text x="790" y="410" font-family="Arial" font-size="12" 
            fill="${colors.textSecondary}">Average Damage</text>

      <!-- Win Rate Section -->
      <rect x="370" y="460" width="600" height="80" rx="8" ry="8" 
            fill="rgba(255, 70, 85, 0.08)" stroke="${colors.accent}" stroke-width="1" />
      <text x="390" y="485" font-family="Arial" font-size="14" 
            fill="${colors.primary}" font-weight="bold">WIN RATE</text>
      <text x="390" y="515" font-family="Arial Black" font-size="28" 
            fill="${colors.text}" font-weight="bold">${winRate.toFixed(1)}%</text>
      <text x="650" y="515" font-family="Arial" font-size="16" 
            fill="${colors.textSecondary}">aus ${totalMatches} Matches</text>

      <!-- Footer -->
      <rect x="370" y="560" width="600" height="60" rx="8" ry="8" 
            fill="rgba(0, 0, 0, 0.3)" />
      <text x="670" y="595" font-family="Arial" font-size="16" 
            fill="${colors.textSecondary}" text-anchor="middle">Powered by AgentBee • Valorant API</text>

      <!-- Valorant Logo Simulation -->
      <polygon points="920,580 950,560 980,580 950,600" 
               fill="${colors.primary}" opacity="0.7" />
    </svg>`;

    // SVG zu PNG konvertieren mit Sharp
    const pngBuffer = await sharp(Buffer.from(svgContent))
      .png({
        quality: 95,
        compressionLevel: 6
      })
      .toBuffer();

    console.log('✅ Erweiterte Valorant-Karte erstellt');
    return pngBuffer;

  } catch (error) {
    console.error('❌ Fehler bei erweiterter Valorant-Karte:', error);
    
    // Fallback zur einfachen Version
    const { createValorantCardSVG } = require('./valorantCardSVG');
    return await createValorantCardSVG(stats);
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
    `🎯 **Main Agent:** ${stats.mostPlayedAgent || 'Verschiedene'}`,
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
  createAdvancedValorantCard,
  createSimpleTextCard
}; 