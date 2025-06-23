const { createValorantCardSVG } = require('./valorantCardSVG');
const fs = require('fs');
const path = require('path');

/**
 * Test der SVG-basierten Valorant-Karte
 */
async function testSVGCard() {
  console.log('🧪 Teste SVG Valorant-Karte...');

  // Test-Daten
  const testStats = {
    name: 'TestPlayer',
    tag: '1234',
    currentRank: 'Diamond 2',
    peakRank: 'Immortal 1',
    rr: 87,
    level: 156,
    kills: 1847,
    deaths: 1523,
    assists: 892,
    hsRate: 24.7,
    adr: 158,
    winRate: 67.3,
    totalMatches: 234
  };

  try {
    // SVG-Karte erstellen
    const imageBuffer = await createValorantCardSVG(testStats);
    
    if (Buffer.isBuffer(imageBuffer)) {
      // PNG speichern
      const outputPath = path.join(__dirname, '../../test-valorant-svg-card.png');
      fs.writeFileSync(outputPath, imageBuffer);
      console.log('✅ SVG Valorant-Karte erfolgreich erstellt!');
      console.log(`📁 Gespeichert unter: ${outputPath}`);
      console.log(`📏 Größe: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    } else {
      console.log('📝 Text-Fallback erhalten:', imageBuffer);
    }

  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error);
  }
}

// Test ausführen
testSVGCard(); 