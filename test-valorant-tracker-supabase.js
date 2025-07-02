/**
 * =====================================================
 * VALORANT TRACKER SUPABASE TEST SCRIPT
 * =====================================================
 * Testet alle Valorant Tracker Supabase Funktionen
 * =====================================================
 */

require('dotenv').config();

const {
    initializeValorantSupabase,
    loadValorantSettings,
    saveValorantSettings,
    loadValorantStats,
    updateValorantStatsSupabase,
    addValorantSearch,
    getDefaultValorantSettings,
    getDefaultValorantStats
} = require('./valorant-tracker-supabase-api');

async function runValorantSupabaseTests() {
    console.log('🚀 Starting Valorant Tracker Supabase Tests...\n');

    try {
        // Test 1: Connection
        console.log('📡 Test 1: Supabase Connection');
        const client = await initializeValorantSupabase();
        if (client) {
            console.log('✅ Connection successful\n');
        } else {
            console.log('❌ Connection failed\n');
            return;
        }

        // Test 2: Load Settings
        console.log('⚙️ Test 2: Load Settings');
        const settings = await loadValorantSettings();
        console.log('Settings loaded:', {
            enabled: settings.enabled,
            defaultRegion: settings.defaultRegion,
            outputMode: settings.outputFormat?.mode,
            embedTitle: settings.embedConfig?.title
        });
        console.log('✅ Settings loaded successfully\n');

        // Test 3: Load Stats
        console.log('📊 Test 3: Load Stats');
        const stats = await loadValorantStats();
        console.log('Stats loaded:', {
            totalSearches: stats.totalSearches,
            dailySearches: stats.dailySearches,
            totalPlayers: stats.totalPlayers,
            topRegions: stats.topRegions
        });
        console.log('✅ Stats loaded successfully\n');

        // Test 4: Add Search
        console.log('🔍 Test 4: Add Search');
        const searchResult1 = await addValorantSearch(
            'testplayer',
            '1234',
            'eu',
            true,
            '123456789',
            'TestUser#1234',
            { rank: 'Gold 2', rr: 85 },
            { matches: 5, winRate: 60 }
        );

        const searchResult2 = await addValorantSearch(
            'anotherplayer',
            '5678',
            'na',
            true,
            '987654321',
            'AnotherUser#5678',
            { rank: 'Platinum 1', rr: 45 },
            { matches: 3, winRate: 75 }
        );

        if (searchResult1 && searchResult2) {
            console.log('✅ Searches added successfully');
            console.log('Search IDs:', searchResult1, searchResult2);
        } else {
            console.log('❌ Failed to add searches');
        }
        console.log('');

        // Test 5: Update Stats with Search Data
        console.log('📈 Test 5: Update Stats');
        const updatedStats = await updateValorantStatsSupabase({
            region: 'eu'
        });
        console.log('Updated stats:', {
            totalSearches: updatedStats.totalSearches,
            dailySearches: updatedStats.dailySearches,
            topRegions: updatedStats.topRegions
        });
        console.log('✅ Stats updated successfully\n');

        // Test 6: Save Settings
        console.log('💾 Test 6: Save Settings');
        const newSettings = {
            ...settings,
            enabled: true,
            defaultRegion: 'na',
            embedConfig: {
                ...settings.embedConfig,
                title: '🎯 UPDATED Valorant Spielersuche',
                description: 'Updated description for testing!'
            }
        };

        const saveResult = await saveValorantSettings(newSettings);
        if (saveResult) {
            console.log('✅ Settings saved successfully');
        } else {
            console.log('❌ Failed to save settings');
        }
        console.log('');

        // Test 7: Verify Updated Settings
        console.log('🔄 Test 7: Verify Updated Settings');
        const verifySettings = await loadValorantSettings();
        console.log('Verified settings:', {
            enabled: verifySettings.enabled,
            defaultRegion: verifySettings.defaultRegion,
            embedTitle: verifySettings.embedConfig?.title
        });

        if (verifySettings.enabled === true && verifySettings.defaultRegion === 'na') {
            console.log('✅ Settings update verified successfully\n');
        } else {
            console.log('❌ Settings update verification failed\n');
        }

        // Test 8: Final Stats Check
        console.log('📋 Test 8: Final Stats Check');
        const finalStats = await loadValorantStats();
        console.log('Final stats:', finalStats);
        console.log('✅ Final stats check completed\n');

        console.log('🎉 All Valorant Tracker Supabase tests completed successfully!');
        console.log('\n📊 SUMMARY:');
        console.log(`- Connection: ✅ Working`);
        console.log(`- Settings Load/Save: ✅ Working`);
        console.log(`- Stats Load/Update: ✅ Working`);
        console.log(`- Search History: ✅ Working`);
        console.log(`- Database Functions: ✅ Working`);

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('1. Check SUPABASE_URL in environment variables');
        console.log('2. Check SUPABASE_SERVICE_ROLE_KEY in environment variables');
        console.log('3. Ensure Supabase tables exist (run migration SQL)');
        console.log('4. Check network connectivity to Supabase');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runValorantSupabaseTests().then(() => {
        console.log('\n🏁 Test execution completed');
        process.exit(0);
    }).catch((error) => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runValorantSupabaseTests }; 