const TwitchChatBot = require('./twitch-chat-bot');

// Test-Credentials (müssen mit echten Werten ersetzt werden)
const TEST_CONFIG = {
    botUsername: 'AgentBeeBot',
    oauthToken: 'oauth:DEIN_TWITCH_BOT_OAUTH_TOKEN',
    selfMonitoringEnabled: true,
    twitchClientId: 'DEIN_TWITCH_CLIENT_ID',
    twitchClientSecret: 'DEIN_TWITCH_CLIENT_SECRET',
    liveNotificationsEnabled: true,
    liveMessageCooldown: 1 // 1 Minute für Tests
};

async function testSelfMonitoring() {
    console.log('🧪 SELF-MONITORING TEST');
    console.log('=======================\n');
    
    // Bot erstellen und konfigurieren
    const bot = new TwitchChatBot();
    
    console.log('1️⃣ Bot konfigurieren...');
    bot.configure(TEST_CONFIG);
    
    // Test-Channel hinzufügen (deinen Channel!)
    console.log('2️⃣ Test-Channel hinzufügen...');
    await bot.addChannel('mindofdennis95', {
        liveMessageEnabled: true,
        liveMessageTemplate: '🔴 SELBST-ERKENNUNGS-TEST: Stream ist LIVE! 🎉',
        useCustomLiveMessage: true
    });
    
    console.log('3️⃣ Self-Monitoring Status vor Start:');
    console.log(bot.getSelfMonitoringStatus());
    
    try {
        // ACHTUNG: Du musst echte Credentials einfügen!
        if (TEST_CONFIG.twitchClientId === 'DEIN_TWITCH_CLIENT_ID') {
            console.log('\n❌ FEHLER: Du musst echte Twitch API Credentials einfügen!');
            console.log('   - Gehe zu: https://dev.twitch.tv/console/apps');
            console.log('   - Erstelle eine neue App');
            console.log('   - Trage Client ID und Secret in TEST_CONFIG ein');
            return;
        }
        
        console.log('4️⃣ Bot starten...');
        await bot.start();
        
        console.log('5️⃣ Self-Monitoring Status nach Start:');
        console.log(bot.getSelfMonitoringStatus());
        
        console.log('\n6️⃣ Warte 30 Sekunden auf ersten Live-Check...');
        console.log('💡 JETZT LIVE GEHEN auf Twitch!');
        
        // 2 Minuten warten und Status prüfen
        setTimeout(() => {
            console.log('\n7️⃣ Self-Monitoring Status nach 2 Minuten:');
            console.log(bot.getSelfMonitoringStatus());
            
            console.log('\n🧪 Test abgeschlossen! Stoppe Bot...');
            bot.stop();
        }, 2 * 60 * 1000);
        
    } catch (error) {
        console.error('❌ Test-Fehler:', error.message);
        
        if (error.message.includes('OAuth Token')) {
            console.log('\n💡 LÖSUNG: Twitch Bot OAuth Token einfügen');
            console.log('   - Gehe zu: https://twitchapps.com/tmi/');
            console.log('   - Generiere OAuth Token');
            console.log('   - Trage in TEST_CONFIG.oauthToken ein');
        }
    }
}

// Test nur ausführen wenn direkt aufgerufen
if (require.main === module) {
    testSelfMonitoring().catch(console.error);
}

module.exports = { testSelfMonitoring }; 