const { makeValorantCard } = require('./valorantCard');
const fs = require('fs');

/**
 * Test der Ultra-sicheren Valorant-Karte
 */
async function testValorantCard() {
  console.log('🧪 Teste Valorant-Karte Generation...\n');

  // Test-Daten mit verschiedenen Szenarien
  const testCases = [
    {
      name: 'Standard Test',
      stats: {
        name: 'TestPlayer',
        tag: '1234',
        level: 42,
        currentRank: 'Diamond 2',
        rr: 67,
        peakRank: 'Immortal 1',
        kills: 245,
        deaths: 198,
        assists: 156,
        hsRate: 24.3,
        adr: 168,
        totalMatches: 127,
        winRate: 64.2,
        wins: 81
      }
    },
    {
      name: 'Unicode Test (sollte bereinigt werden)',
      stats: {
        name: 'Player测试',
        tag: '№123',
        level: 25,
        currentRank: 'Gold 🥇',
        rr: 45,
        peakRank: 'Platinum ⭐',
        kills: 150,
        deaths: 140,
        assists: 89,
        hsRate: 18.7,
        adr: 142,
        totalMatches: 85,
        winRate: 52.9,
        wins: 45
      }
    },
    {
      name: 'Minimal Data Test',
      stats: {
        name: 'MinimalUser',
        tag: '0001',
        level: 1
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log('Stats:', JSON.stringify(testCase.stats, null, 2));

    try {
      const result = await makeValorantCard(testCase.stats);
      
      // Prüfe ob Text oder Buffer returniert wurde
      if (typeof result === 'string') {
        console.log('✅ Text-basierte Statistiken generiert:');
        console.log(result);
      } else if (Buffer.isBuffer(result)) {
        console.log('✅ Canvas-Bild erfolgreich generiert!');
        
        // Speichere Test-Bild
        const filename = `test-valorant-card-${testCase.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        fs.writeFileSync(filename, result);
        console.log(`💾 Bild gespeichert als: ${filename}`);
      } else {
        console.log('⚠️  Unbekannter Return-Type:', typeof result);
      }
    } catch (error) {
      console.error(`❌ Fehler bei ${testCase.name}:`, error.message);
    }
  }

  console.log('\n✅ Alle Tests abgeschlossen!');
}

// Führe Tests aus
if (require.main === module) {
  testValorantCard().catch(console.error);
}

module.exports = { testValorantCard }; 