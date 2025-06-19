const { makeValorantCard } = require('./valorantCard');
const fs = require('fs');
const path = require('path');

// Test-Daten für die Valorant-Karte
const testStats = {
  name: 'TestPlayer',
  tag: '1234',
  level: 87,
  currentRank: 'Gold 2',
  rr: 42,
  peakRank: 'Platinum 1',
  kills: 18,
  deaths: 12,
  assists: 7,
  adr: 156,
  hsRate: 23.5,
  agentIconUrl: 'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png' // Breach
};

async function testValorantCard() {
  try {
    console.log('🎯 Erstelle Valorant-Karte...');
    
    const startTime = Date.now();
    const imageBuffer = await makeValorantCard(testStats);
    const endTime = Date.now();
    
    console.log(`✅ Karte erfolgreich erstellt in ${endTime - startTime}ms`);
    console.log(`📊 Bildgröße: ${imageBuffer.length} bytes`);
    
    // Speichere das Bild zum Testen
    const outputPath = path.join(__dirname, '../../test-valorant-card.png');
    fs.writeFileSync(outputPath, imageBuffer);
    
    console.log(`💾 Testbild gespeichert: ${outputPath}`);
    console.log('🎨 Du kannst das Bild jetzt öffnen und das Design überprüfen!');
    
  } catch (error) {
    console.error('❌ Fehler beim Testen der Valorant-Karte:', error);
  }
}

// Test ausführen
if (require.main === module) {
  testValorantCard();
}

module.exports = { testValorantCard }; 