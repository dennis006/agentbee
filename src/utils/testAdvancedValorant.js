const { createAdvancedValorantCard } = require('./valorantCardSVGAdvanced');
const fs = require('fs');
const path = require('path');

/**
 * Test der erweiterten SVG-basierten Valorant-Karte mit echten Icons
 */
async function testAdvancedCard() {
  console.log('🎮 Teste erweiterte Valorant-Karte mit echten Icons...');

  // Test-Daten mit allen neuen Features
  const testStats = {
    name: 'ProPlayer',
    tag: '0001', 
    currentRank: 'Diamond 2',
    peakRank: 'Immortal 1',
    currentTierId: 19, // Diamond 2
    peakTierId: 24, // Immortal 1
    rr: 87,
    level: 156,
    kills: 1847,
    deaths: 1523,
    assists: 892,
    hsRate: 24.7,
    adr: 158,
    winRate: 67.3,
    totalMatches: 234,
    mostPlayedAgent: 'Jett',
    agentIconUrl: 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png' // Jett
  };

  try {
    console.log('📸 Erstelle Karte mit echten Valorant-Assets...');
    
    // Erweiterte SVG-Karte erstellen
    const imageBuffer = await createAdvancedValorantCard(testStats);
    
    if (Buffer.isBuffer(imageBuffer)) {
      // PNG speichern
      const outputPath = path.join(__dirname, '../../test-advanced-valorant-card.png');
      fs.writeFileSync(outputPath, imageBuffer);
      console.log('✅ Erweiterte Valorant-Karte erfolgreich erstellt!');
      console.log(`📁 Gespeichert unter: ${outputPath}`);
      console.log(`📏 Größe: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
      console.log('🎯 Features: Echte Rang-Icons + Agenten-Bild + Verbessertes Design');
    } else {
      console.log('📝 Text-Fallback erhalten:', imageBuffer);
    }

  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error);
  }
}

// Test ausführen
testAdvancedCard(); 