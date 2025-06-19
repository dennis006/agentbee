const { createCanvas, loadImage, registerFont } = require('canvas');
const https = require('https');
const http = require('http');

/**
 * Lädt ein Bild von einer URL
 * @param {string} url 
 * @returns {Promise<Image>}
 */
async function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const image = await loadImage(buffer);
          resolve(image);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Zeichnet abgerundete Rechtecke
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} width 
 * @param {number} height 
 * @param {number} radius 
 */
function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Zeichnet Text mit Schatten
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} text 
 * @param {number} x 
 * @param {number} y 
 * @param {string} color 
 * @param {string} font 
 */
function drawTextWithShadow(ctx, text, x, y, color = '#FFFFFF', font = '24px Arial') {
  // Schatten
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillText(text, x + 2, y + 2);
  
  // Haupttext
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * Zeichnet ein Bild mit Schatten
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Image} image 
 * @param {number} x 
 * @param {number} y 
 * @param {number} width 
 * @param {number} height 
 */
function drawImageWithShadow(ctx, image, x, y, width, height) {
  ctx.save();
  
  // Schatten
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  
  ctx.drawImage(image, x, y, width, height);
  ctx.restore();
}

/**
 * Konvertiert Rang-Namen zu Riot CDN URLs
 * @param {string} rankName 
 * @returns {string}
 */
function getRankImageUrl(rankName) {
  const rankMap = {
    'Unranked': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/0/smallicon.png',
    'Iron 1': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/3/smallicon.png',
    'Iron 2': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/4/smallicon.png',
    'Iron 3': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/5/smallicon.png',
    'Bronze 1': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/6/smallicon.png',
    'Bronze 2': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/7/smallicon.png',
    'Bronze 3': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/8/smallicon.png',
    'Silver 1': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/9/smallicon.png',
    'Silver 2': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/10/smallicon.png',
    'Silver 3': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/11/smallicon.png',
    'Gold 1': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/12/smallicon.png',
    'Gold 2': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/13/smallicon.png',
    'Gold 3': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/14/smallicon.png',
    'Platinum 1': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/15/smallicon.png',
    'Platinum 2': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/16/smallicon.png',
    'Platinum 3': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/17/smallicon.png',
    'Diamond 1': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/18/smallicon.png',
    'Diamond 2': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/19/smallicon.png',
    'Diamond 3': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/20/smallicon.png',
    'Ascendant 1': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/21/smallicon.png',
    'Ascendant 2': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/22/smallicon.png',
    'Ascendant 3': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/23/smallicon.png',
    'Immortal 1': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/24/smallicon.png',
    'Immortal 2': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/25/smallicon.png',
    'Immortal 3': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/26/smallicon.png',
    'Radiant': 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/27/smallicon.png'
  };
  
  return rankMap[rankName] || rankMap['Unranked'];
}

/**
 * Erstellt eine Valorant-Statistik-Karte
 * @param {Object} stats
 * @param {string} stats.name
 * @param {string} stats.tag
 * @param {number} stats.level
 * @param {string} stats.currentRank  // z.B. "Gold 1"
 * @param {number} stats.rr           // z.B. 16
 * @param {string} stats.peakRank
 * @param {number} stats.kills
 * @param {number} stats.deaths
 * @param {number} stats.assists
 * @param {number} stats.adr
 * @param {number} stats.hsRate       // Kopf-Treffer in Prozent
 * @param {string} stats.agentIconUrl
 * @param {number} stats.totalMatches // Anzahl Matches
 * @param {number} stats.wins         // Gewonnene Matches
 * @param {number} stats.winRate      // Win-Rate in Prozent
 * @param {number} stats.headshots    // Headshots
 * @param {number} stats.bodyshots    // Bodyshots
 * @param {number} stats.legshots     // Legshots
 * @param {number} stats.totalDamage  // Gesamtschaden
 * @param {number} stats.averageScore // Durchschnittlicher Score
 * @returns {Buffer} Bild-Buffer
 */
async function makeValorantCard(stats) {
  // Canvas erstellen - größer für mehr Daten
  const canvas = createCanvas(900, 600);
  const ctx = canvas.getContext('2d');

  try {
    // Authentische Valorant-Farben
    const colors = {
      primary: '#FF4655',      // Valorant Rot
      secondary: '#0F1419',    // Dunkles Grau
      accent: '#53212B',       // Dunkles Rot
      text: '#ECECEC',         // Helles Grau (wie im Original)
      textPrimary: '#FFFFFF',  // Weiß für wichtige Texte
      textSecondary: '#9CA3AF', // Grau für sekundäre Texte
      background: '#0F1419',   // Hintergrund
      cardBg: 'rgba(15, 20, 25, 0.95)', // Dunkler für besseren Kontrast
      statBg: 'rgba(255, 70, 85, 0.1)',  // Subtiler
      borderColor: '#FF4655',  // Valorant Rot für Borders
      gradientStart: '#1a1f2e', // Gradient Start
      gradientEnd: '#0f1419'    // Gradient End
    };

    // Valorant-ähnlicher Gradient-Hintergrund
    const gradient = ctx.createLinearGradient(0, 0, 900, 600);
    gradient.addColorStop(0, colors.gradientStart);
    gradient.addColorStop(0.5, colors.secondary);
    gradient.addColorStop(1, colors.gradientEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 900, 600);

    // Valorant-ähnliche geometrische Muster im Hintergrund
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 1;
    
    // Diagonale Linien
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 50, 0);
      ctx.lineTo(i * 50 + 200, 600);
      ctx.stroke();
    }
    
    // Horizontale Akzentlinien
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.lineTo(900, 100);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, 500);
    ctx.lineTo(900, 500);
    ctx.stroke();
    
    ctx.restore();

    // Hauptkarte im Valorant-Stil
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    
    // Hauptkarte mit Valorant-Border
    roundedRect(ctx, 30, 30, 840, 540, 12);
    ctx.fillStyle = colors.cardBg;
    ctx.fill();
    
    // Valorant-roter Border
    ctx.strokeStyle = colors.borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Header-Bereich mit Agent und Spieler-Info
    const headerY = 60;
    
    // Agent-Icon (links oben, größer)
    if (stats.agentIconUrl) {
      try {
        const agentImage = await loadImageFromUrl(stats.agentIconUrl);
        drawImageWithShadow(ctx, agentImage, 50, headerY, 80, 80);
      } catch (error) {
        console.warn('Konnte Agent-Icon nicht laden:', error.message);
        // Fallback: Agent-Box
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        roundedRect(ctx, 50, headerY, 80, 80, 8);
        ctx.fillStyle = colors.primary;
        ctx.fill();
        ctx.restore();
      }
    }

    // Spielername und Tag (neben Agent) - mit Fallback-Werten
    const playerName = stats.name || 'Unknown';
    const playerTag = stats.tag || '0000';
    const playerLevel = stats.level || 1;
    
    drawTextWithShadow(ctx, playerName, 150, headerY + 30, colors.textPrimary, 'bold 36px Arial');
    drawTextWithShadow(ctx, `#${playerTag}`, 150, headerY + 65, colors.textSecondary, '24px Arial');
    
    // Level (rechts oben)
    drawTextWithShadow(ctx, `Level ${playerLevel}`, 700, headerY + 30, colors.text, 'bold 20px Arial');

    // Rang-Bereich (unter Header)
    const rankY = headerY + 120;
    
    // Aktueller Rang
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    roundedRect(ctx, 50, rankY, 200, 100, 8);
    ctx.fillStyle = colors.statBg;
    ctx.fill();
    ctx.strokeStyle = colors.borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    const currentRank = stats.currentRank || 'Unranked';
    const currentRR = stats.rr !== undefined ? stats.rr : 0;

    // Current Rang Icon
    try {
      const rankImageUrl = getRankImageUrl(currentRank);
      const rankImage = await loadImageFromUrl(rankImageUrl);
      drawImageWithShadow(ctx, rankImage, 60, rankY + 10, 50, 50);
    } catch (error) {
      console.warn('Konnte Rang-Icon nicht laden:', error.message);
    }
    
    drawTextWithShadow(ctx, '🏆 Aktueller Rang', 120, rankY + 25, colors.textSecondary, '14px Arial');
    drawTextWithShadow(ctx, currentRank, 120, rankY + 45, colors.textPrimary, 'bold 18px Arial');
    drawTextWithShadow(ctx, `${currentRR} RR`, 120, rankY + 70, colors.text, '16px Arial');

    // Peak Rang (daneben)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    roundedRect(ctx, 270, rankY, 200, 100, 8);
    ctx.fillStyle = colors.statBg;
    ctx.fill();
    ctx.strokeStyle = colors.borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    const peakRank = stats.peakRank || 'Unranked';

    // Peak Rang Icon
    try {
      const peakRankImageUrl = getRankImageUrl(peakRank);
      const peakRankImage = await loadImageFromUrl(peakRankImageUrl);
      drawImageWithShadow(ctx, peakRankImage, 280, rankY + 10, 50, 50);
    } catch (error) {
      console.warn('Konnte Peak-Rang-Icon nicht laden:', error.message);
    }
    
    drawTextWithShadow(ctx, '⭐ Peak Rang', 340, rankY + 25, colors.textSecondary, '14px Arial');
    drawTextWithShadow(ctx, peakRank, 340, rankY + 45, colors.textPrimary, 'bold 18px Arial');
    drawTextWithShadow(ctx, 'Season e4a2', 340, rankY + 70, colors.text, '14px Arial');

    // Match-Statistiken Bereich (rechts oben)
    const matchStatsY = rankY;
    
    // Match-Statistiken Box
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    roundedRect(ctx, 490, matchStatsY, 180, 100, 8);
    ctx.fillStyle = colors.statBg;
    ctx.fill();
    ctx.strokeStyle = colors.borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    drawTextWithShadow(ctx, '⚔️ Match-Statistiken', 500, matchStatsY + 25, colors.textSecondary, '14px Arial');
    drawTextWithShadow(ctx, `Matches: ${stats.totalMatches || 0}`, 500, matchStatsY + 45, colors.text, '16px Arial');
    drawTextWithShadow(ctx, `Win-Rate: ${(stats.winRate || 0).toFixed(1)}%`, 500, matchStatsY + 70, colors.text, '16px Arial');

    // Letzte Änderung Box
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    roundedRect(ctx, 690, matchStatsY, 180, 100, 8);
    ctx.fillStyle = colors.statBg;
    ctx.fill();
    ctx.strokeStyle = colors.borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    const lastChange = Math.floor(Math.random() * 40) - 20; // Beispiel: -20 bis +20
    const changePrefix = lastChange > 0 ? '+' : '';
    const changeColor = lastChange > 0 ? '#00FF88' : lastChange < 0 ? '#FF4655' : colors.text;
    
    drawTextWithShadow(ctx, '📊 Letzte Änderung', 700, matchStatsY + 25, colors.textSecondary, '14px Arial');
    drawTextWithShadow(ctx, `${changePrefix}${lastChange} RR`, 700, matchStatsY + 55, changeColor, 'bold 20px Arial');

    // K/D/A Bereich (zweite Reihe)
    const kdaY = rankY + 120;
    
    // K/D/A Box
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    roundedRect(ctx, 50, kdaY, 280, 100, 8);
    ctx.fillStyle = colors.statBg;
    ctx.fill();
    ctx.strokeStyle = colors.borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    drawTextWithShadow(ctx, '⚔️ K/D/A', 60, kdaY + 25, colors.textSecondary, '14px Arial');
    
    const kdaText = `${stats.kills || 0} / ${stats.deaths || 0} / ${stats.assists || 0}`;
    drawTextWithShadow(ctx, kdaText, 60, kdaY + 55, colors.primary, 'bold 24px Arial');
    
    const kd = (stats.deaths && stats.deaths > 0) ? (stats.kills / stats.deaths).toFixed(2) : (stats.kills || 0).toFixed(2);
    drawTextWithShadow(ctx, `K/D: ${kd}`, 60, kdaY + 80, colors.text, '16px Arial');

    // Präzision Box
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    roundedRect(ctx, 350, kdaY, 260, 100, 8);
    ctx.fillStyle = colors.statBg;
    ctx.fill();
    ctx.strokeStyle = colors.borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    drawTextWithShadow(ctx, '🎯 Präzision', 360, kdaY + 25, colors.textSecondary, '14px Arial');
    drawTextWithShadow(ctx, `Headshot-Rate: ${(stats.hsRate || 0).toFixed(1)}%`, 360, kdaY + 45, colors.text, '16px Arial');
    
    const totalShots = (stats.headshots || 0) + (stats.bodyshots || 0) + (stats.legshots || 0);
    if (totalShots > 0) {
      drawTextWithShadow(ctx, `Headshots: ${stats.headshots || 0}`, 360, kdaY + 65, colors.text, '14px Arial');
      drawTextWithShadow(ctx, `Body/Leg: ${(stats.bodyshots || 0)}/${(stats.legshots || 0)}`, 360, kdaY + 80, colors.textSecondary, '12px Arial');
    }

    // Damage & Score Box
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    roundedRect(ctx, 630, kdaY, 240, 100, 8);
    ctx.fillStyle = colors.statBg;
    ctx.fill();
    ctx.strokeStyle = colors.borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    drawTextWithShadow(ctx, '💥 Damage & Score', 640, kdaY + 25, colors.textSecondary, '14px Arial');
    drawTextWithShadow(ctx, `ADR: ${Math.round(stats.adr || 0)}`, 640, kdaY + 45, colors.text, '16px Arial');
    drawTextWithShadow(ctx, `Total Damage: ${(stats.totalDamage || 0).toLocaleString()}`, 640, kdaY + 65, colors.text, '14px Arial');
    drawTextWithShadow(ctx, `Avg Score: ${Math.round(stats.averageScore || 0)}`, 640, kdaY + 80, colors.textSecondary, '12px Arial');

    // Season-Statistiken (dritte Reihe)
    const seasonY = kdaY + 120;
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    roundedRect(ctx, 50, seasonY, 820, 80, 8);
    ctx.fillStyle = colors.statBg;
    ctx.fill();
    ctx.strokeStyle = colors.borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    drawTextWithShadow(ctx, '🏆 Season-Statistiken', 60, seasonY + 25, colors.textSecondary, '14px Arial');
    
    const seasonWins = stats.wins || 0;
    const seasonGames = stats.totalMatches || 0;
    const seasonWinRate = seasonGames > 0 ? ((seasonWins / seasonGames) * 100).toFixed(1) : '0';
    
    drawTextWithShadow(ctx, `Wins: ${seasonWins}`, 60, seasonY + 50, colors.text, '16px Arial');
    drawTextWithShadow(ctx, `Games: ${seasonGames}`, 200, seasonY + 50, colors.text, '16px Arial');
    drawTextWithShadow(ctx, `Win-Rate: ${seasonWinRate}%`, 350, seasonY + 50, colors.text, '16px Arial');
    
    // Powered by Text
    drawTextWithShadow(ctx, 'Powered by AgentBee', 500, seasonY + 65, colors.textSecondary, '12px Arial');

    // Canvas als Buffer zurückgeben
    return canvas.toBuffer('image/png');

  } catch (error) {
    console.error('Fehler beim Erstellen der Valorant-Karte:', error);
    
    // Fallback: Einfache Fehlerkarte
    ctx.fillStyle = colors.secondary;
    ctx.fillRect(0, 0, 900, 600);
    
    const fallbackName = stats.name || 'Unknown';
    const fallbackTag = stats.tag || '0000';
    
    drawTextWithShadow(ctx, 'Fehler beim Laden der Statistiken', 50, 280, colors.primary, 'bold 24px Arial');
    drawTextWithShadow(ctx, `${fallbackName}#${fallbackTag}`, 50, 330, colors.text, '20px Arial');
    
    return canvas.toBuffer('image/png');
  }
}

module.exports = { makeValorantCard }; 