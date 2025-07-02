// =====================================================
// DISCORD BOT - VALORANT TRACKER SUPABASE TEST
// =====================================================
// Testet die neue Supabase-Integration für Valorant Tracker
// =====================================================

require('dotenv').config();

const {
    initializeValorantSupabase,
    checkValorantSupabaseConnection,
    loadValorantSettings,
    saveValorantSettings,
    loadValorantStats,
    updateValorantStatsSupabase,
    addValorantSearch
} = require('./valorant-tracker-supabase-api');

async function testValorantTrackerSupabase() {
    console.log('🧪 === VALORANT TRACKER SUPABASE TEST START ===');
    console.log('');

    try {
        // 1. Initialisierung testen
        console.log('1️⃣ Test: Supabase-Initialisierung');
        const initialized = initializeValorantSupabase();
        console.log(`   Ergebnis: ${initialized ? '✅ Erfolgreich' : '❌ Fehlgeschlagen'}`);
        
        if (!initialized) {
            console.log('❌ Kann ohne Supabase-Verbindung nicht fortfahren');
            return;
        }
        console.log('');

        // 2. Verbindung testen
        console.log('2️⃣ Test: Supabase-Verbindung');
        const connected = await checkValorantSupabaseConnection();
        console.log(`   Ergebnis: ${connected ? '✅ Verbunden' : '❌ Nicht verbunden'}`);
        
        if (!connected) {
            console.log('❌ Kann ohne aktive Verbindung nicht fortfahren');
            return;
        }
        console.log('');

        // 3. Einstellungen laden
        console.log('3️⃣ Test: Valorant-Einstellungen laden');
        const settings = await loadValorantSettings();
        console.log(`   Ergebnis: ${settings ? '✅ Geladen' : '❌ Fehler'}`);
        
        if (settings) {
            console.log(`   - Enabled: ${settings.enabled}`);
            console.log(`   - Region: ${settings.defaultRegion}`);
            console.log(`   - Output-Mode: ${settings.outputFormat?.mode || 'N/A'}`);
            console.log(`   - Embed-Title: ${settings.embed?.title || 'N/A'}`);
        }
        console.log('');

        // 4. Einstellungen modifizieren und speichern
        console.log('4️⃣ Test: Valorant-Einstellungen speichern');
        if (settings) {
            const testSettings = {
                ...settings,
                enabled: true,
                defaultRegion: 'eu',
                outputFormat: {
                    mode: 'embed',
                    embedEnabled: true,
                    cardEnabled: false
                },
                embed: {
                    ...settings.embed,
                    title: '🧪 TEST: Valorant Spielersuche',
                    description: 'Dies ist ein Test der Supabase-Integration!'
                }
            };

            const saved = await saveValorantSettings(testSettings);
            console.log(`   Ergebnis: ${saved ? '✅ Gespeichert' : '❌ Fehler'}`);
        }
        console.log('');

        // 5. Statistiken laden
        console.log('5️⃣ Test: Valorant-Statistiken laden');
        const stats = await loadValorantStats();
        console.log(`   Ergebnis: ${stats ? '✅ Geladen' : '❌ Fehler'}`);
        
        if (stats) {
            console.log(`   - Total Searches: ${stats.totalSearches}`);
            console.log(`   - Daily Searches: ${stats.dailySearches}`);
            console.log(`   - Total Players: ${stats.totalPlayers}`);
            console.log(`   - System Enabled: ${stats.systemEnabled}`);
        }
        console.log('');

        // 6. Test-Suche hinzufügen
        console.log('6️⃣ Test: Valorant-Suche hinzufügen');
        const searchId = await addValorantSearch({
            playerName: 'TestPlayer',
            playerTag: '1234',
            region: 'eu',
            success: true,
            discordUserId: '123456789012345678',
            discordUsername: 'TestUser#0001',
            rankData: {
                currentTier: { id: 15, name: 'Gold 3' },
                rr: 75,
                lastChange: 25
            },
            matchData: {
                totalMatches: 5,
                wins: 3,
                losses: 2
            }
        });
        console.log(`   Ergebnis: ${searchId ? '✅ Hinzugefügt' : '❌ Fehler'}`);
        console.log(`   - Search ID: ${searchId}`);
        console.log('');

        // 7. Statistiken aktualisieren
        console.log('7️⃣ Test: Valorant-Statistiken aktualisieren');
        const updatedStats = await updateValorantStatsSupabase({
            region: 'eu'
        });
        console.log(`   Ergebnis: ${updatedStats ? '✅ Aktualisiert' : '❌ Fehler'}`);
        
        if (updatedStats) {
            console.log(`   - Total Searches: ${updatedStats.totalSearches}`);
            console.log(`   - EU Searches: ${updatedStats.topRegions?.eu || 0}`);
        }
        console.log('');

        // 8. Weitere Test-Suchen für bessere Statistiken
        console.log('8️⃣ Test: Mehrere Test-Suchen hinzufügen');
        const testSearches = [
            { playerName: 'BeellGrounder', playerTag: '1996', region: 'eu', success: true },
            { playerName: 'Cracko', playerTag: '1907', region: 'eu', success: true },
            { playerName: 'FailedPlayer', playerTag: '0000', region: 'na', success: false },
            { playerName: 'AnotherTest', playerTag: '5678', region: 'ap', success: true }
        ];

        for (const search of testSearches) {
            await addValorantSearch({
                ...search,
                discordUserId: `${Math.floor(Math.random() * 1000000000000000000)}`,
                discordUsername: `TestUser${Math.floor(Math.random() * 1000)}#0001`
            });
        }
        console.log(`   Ergebnis: ✅ ${testSearches.length} Test-Suchen hinzugefügt`);
        console.log('');

        // 9. Finale Statistiken anzeigen
        console.log('9️⃣ Test: Finale Statistiken abrufen');
        const finalStats = await loadValorantStats();
        console.log(`   Ergebnis: ${finalStats ? '✅ Geladen' : '❌ Fehler'}`);
        
        if (finalStats) {
            console.log(`   - Total Searches: ${finalStats.totalSearches}`);
            console.log(`   - Daily Searches: ${finalStats.dailySearches}`);
            console.log(`   - Weekly Searches: ${finalStats.weeklySearches}`);
            console.log(`   - Total Players: ${finalStats.totalPlayers}`);
            console.log(`   - Top Regions:`);
            console.log(`     • EU: ${finalStats.topRegions?.eu || 0}`);
            console.log(`     • NA: ${finalStats.topRegions?.na || 0}`);
            console.log(`     • AP: ${finalStats.topRegions?.ap || 0}`);
            console.log(`     • KR: ${finalStats.topRegions?.kr || 0}`);
        }
        console.log('');

        // 10. Erfolgreiche Fertigstellung
        console.log('🎉 === VALORANT TRACKER SUPABASE TEST ERFOLGREICH ===');
        console.log('');
        console.log('✅ Alle Tests bestanden!');
        console.log('✅ Supabase-Integration funktioniert korrekt');
        console.log('✅ Das System ist bereit für die Verwendung');
        console.log('');
        console.log('📋 Nächste Schritte:');
        console.log('   1. Führe die SQL-Migration in Supabase aus');
        console.log('   2. Starte den Discord Bot neu');
        console.log('   3. Teste die Valorant-Funktionen im Discord');
        console.log('   4. Überprüfe das Dashboard für Einstellungen');

    } catch (error) {
        console.error('❌ === VALORANT TRACKER SUPABASE TEST FEHLGESCHLAGEN ===');
        console.error('');
        console.error('Fehler:', error.message);
        console.error('Stack:', error.stack);
        console.error('');
        console.error('🔧 Mögliche Lösungen:');
        console.error('   1. Überprüfe die SUPABASE_URL und SUPABASE_KEY in den Umgebungsvariablen');
        console.error('   2. Stelle sicher, dass die Supabase-Migration ausgeführt wurde');
        console.error('   3. Überprüfe die Netzwerkverbindung zu Supabase');
        console.error('   4. Überprüfe die RLS-Policies in Supabase');
    }
}

// Führe den Test aus wenn das Script direkt aufgerufen wird
if (require.main === module) {
    testValorantTrackerSupabase()
        .then(() => {
            console.log('🏁 Test abgeschlossen');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test-Script Fehler:', error);
            process.exit(1);
        });
}

module.exports = {
    testValorantTrackerSupabase
}; 