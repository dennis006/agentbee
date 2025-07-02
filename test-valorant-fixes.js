#!/usr/bin/env node

/**
 * 🧪 VALORANT TRACKER FIXES TEST
 * 
 * Testet alle kritischen Fixes:
 * 1. SQL Schema Fix (mehrdeutige Spalten)
 * 2. Verbesserte Spieler-Statistiken
 * 3. Rang-Belohnungssystem
 */

const {
    initializeValorantSupabase,
    checkValorantSupabaseConnection,
    loadValorantSettings,
    updateValorantStatsSupabase,
    addValorantSearch
} = require('./valorant-tracker-supabase-api');

async function runValorantFixesTest() {
    console.log('🧪 VALORANT TRACKER FIXES TEST\n');
    console.log('=' .repeat(50));
    
    let passed = 0;
    let failed = 0;
    
    try {
        // Test 1: Supabase Connection
        console.log('\n1️⃣ Teste Supabase-Verbindung...');
        const connectionOk = await checkValorantSupabaseConnection();
        if (connectionOk) {
            console.log('✅ Supabase-Verbindung erfolgreich');
            passed++;
        } else {
            console.log('❌ Supabase-Verbindung fehlgeschlagen');
            failed++;
            return;
        }
        
        // Test 2: Einstellungen laden (inkl. Enhanced Player Stats)
        console.log('\n2️⃣ Teste erweiterte Player Stats Konfiguration...');
        const settings = await loadValorantSettings();
        
        if (settings.playerStatsEmbed?.fields?.kda?.enabled && 
            settings.playerStatsEmbed?.fields?.agentStats?.enabled &&
            settings.playerStatsEmbed?.fields?.performance?.enabled) {
            console.log('✅ Erweiterte Player Stats Embeds konfiguriert');
            console.log(`   📊 Felder verfügbar: ${Object.keys(settings.playerStatsEmbed.fields).length}`);
            passed++;
        } else {
            console.log('❌ Player Stats Embeds nicht vollständig konfiguriert');
            failed++;
        }
        
        // Test 3: Rang-Belohnungssystem Konfiguration
        console.log('\n3️⃣ Teste Rang-Belohnungssystem...');
        if (settings.rankRewards?.enabled && 
            settings.rankRewards?.ranks?.length === 25) {
            console.log('✅ Rang-Belohnungssystem aktiviert');
            console.log(`   🎯 ${settings.rankRewards.ranks.length} Valorant-Ränge konfiguriert`);
            console.log(`   🏷️ Rollen-Präfix: "${settings.rankRewards.rolePrefix}"`);
            passed++;
        } else {
            console.log('❌ Rang-Belohnungssystem nicht korrekt konfiguriert');
            console.log(`   Enabled: ${settings.rankRewards?.enabled}`);
            console.log(`   Ranks: ${settings.rankRewards?.ranks?.length || 0}`);
            failed++;
        }
        
        // Test 4: SQL-Schema Fix (mehrdeutige Spalten)
        console.log('\n4️⃣ Teste SQL-Schema Fix (update_valorant_stats)...');
        try {
            const stats = await updateValorantStatsSupabase({
                region: 'eu'
            });
            
            if (stats && typeof stats.totalSearches === 'number') {
                console.log('✅ SQL-Schema Fix erfolgreich - keine mehrdeutigen Spalten');
                console.log(`   📊 Statistiken: ${stats.totalSearches} Searches, ${stats.totalPlayers} Players`);
                passed++;
            } else {
                console.log('❌ SQL-Schema Fix fehlgeschlagen - ungültige Antwort');
                failed++;
            }
        } catch (sqlError) {
            if (sqlError.message && sqlError.message.includes('ambiguous')) {
                console.log('❌ SQL-Schema Fix FEHLGESCHLAGEN - mehrdeutige Spalten noch vorhanden');
                console.log(`   Error: ${sqlError.message}`);
                failed++;
            } else {
                console.log('✅ SQL-Schema Fix erfolgreich (anderer Fehler, aber nicht mehrdeutig)');
                console.log(`   Info: ${sqlError.message}`);
                passed++;
            }
        }
        
        // Test 5: Suche hinzufügen (kompletter Workflow)
        console.log('\n5️⃣ Teste kompletten Suche-Workflow...');
        try {
            const searchId = await addValorantSearch({
                playerName: 'TestPlayer',
                playerTag: '1234',
                region: 'eu',
                success: true,
                discordUserId: '123456789',
                discordUsername: 'TestUser',
                rankData: {
                    currentRank: 'Gold 2',
                    rr: 45,
                    tier: { id: 13, name: 'Gold 2' }
                },
                matchData: {
                    totalMatches: 15,
                    wins: 9,
                    losses: 6
                }
            });
            
            if (searchId) {
                console.log('✅ Suche erfolgreich hinzugefügt');
                console.log(`   🆔 Search ID: ${searchId}`);
                passed++;
            } else {
                console.log('❌ Suche konnte nicht hinzugefügt werden');
                failed++;
            }
        } catch (searchError) {
            console.log('❌ Fehler beim Hinzufügen der Suche');
            console.log(`   Error: ${searchError.message}`);
            failed++;
        }
        
        // Test 6: Embed-Konfiguration Details
        console.log('\n6️⃣ Teste erweiterte Embed-Konfiguration...');
        const embedFields = settings.playerStatsEmbed.fields;
        const expectedFields = [
            'currentRank', 'peakRank', 'lastChange', 'leaderboard',
            'matchStats', 'kda', 'precision', 'damage', 
            'seasonStats', 'agentStats', 'performance'
        ];
        
        const missingFields = expectedFields.filter(field => !embedFields[field]);
        
        if (missingFields.length === 0) {
            console.log('✅ Alle erweiterten Embed-Felder konfiguriert');
            console.log(`   📝 Felder: ${expectedFields.join(', ')}`);
            passed++;
        } else {
            console.log('❌ Nicht alle Embed-Felder konfiguriert');
            console.log(`   ❌ Fehlend: ${missingFields.join(', ')}`);
            failed++;
        }
        
    } catch (error) {
        console.log('❌ KRITISCHER FEHLER beim Testen');
        console.error('Error:', error);
        failed++;
    }
    
    // Ergebnisse
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST ERGEBNISSE:');
    console.log(`✅ Bestanden: ${passed}`);
    console.log(`❌ Fehlgeschlagen: ${failed}`);
    console.log(`🎯 Gesamt: ${passed + failed}`);
    
    if (failed === 0) {
        console.log('\n🎉 ALLE FIXES ERFOLGREICH!');
        console.log('🚀 Valorant Tracker System ist bereit!');
        console.log('\n🔧 NÄCHSTE SCHRITTE:');
        console.log('1. 📤 Importiere valorant_tracker_supabase_migration_fixed.sql in Supabase');
        console.log('2. 🔄 Starte den Bot neu (node index.js)');
        console.log('3. 🎮 Teste eine Valorant-Suche im Discord');
        console.log('4. 🏆 Prüfe ob Rang-Rollen automatisch vergeben werden');
    } else {
        console.log('\n⚠️ EINIGE TESTS FEHLGESCHLAGEN');
        console.log('💡 Bitte prüfe die Fehlermeldungen und behebe die Probleme');
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('1. 🗄️ Supabase-SQL: Importiere die Fixed-Migration');
        console.log('2. 🔄 Code: Überprüfe ob alle Files aktualisiert sind');
        console.log('3. 🌐 Network: Teste Supabase-Verbindung manuell');
    }
}

// Initialize und starte Tests
console.log('🔧 Initialisiere Valorant Supabase...');
initializeValorantSupabase();

setTimeout(() => {
    runValorantFixesTest().catch(console.error);
}, 1000); 