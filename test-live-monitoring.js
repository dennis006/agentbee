// Test-Script für Live-Monitoring ohne Supabase
// Testet direkt die Environment Variables

const TwitchChatBot = require('./twitch-chat-bot');

async function testLiveMonitoring() {
    console.log('🧪 LIVE MONITORING TEST (ohne Supabase)');
    console.log('=======================================\n');
    
    // Environment Variables prüfen
    console.log('1️⃣ Environment Variables prüfen:');
    console.log('   TWITCH_CLIENT_ID:', process.env.TWITCH_CLIENT_ID ? '✅' : '❌');
    console.log('   TWITCH_CLIENT_SECRET:', process.env.TWITCH_CLIENT_SECRET ? '✅' : '❌');
    console.log('   TWITCH_BOT_OAUTH:', process.env.TWITCH_BOT_OAUTH ? '✅' : '❌');
    console.log('   TWITCH_DEFAULT_CHANNEL:', process.env.TWITCH_DEFAULT_CHANNEL || 'nicht gesetzt');
    console.log('');
    
    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET || !process.env.TWITCH_BOT_OAUTH) {
        console.log('❌ Erforderliche Environment Variables fehlen!');
        console.log('💡 Setze folgende Variables:');
        console.log('   TWITCH_CLIENT_ID=deine_client_id');
        console.log('   TWITCH_CLIENT_SECRET=dein_client_secret');
        console.log('   TWITCH_BOT_OAUTH=oauth:dein_bot_token');
        console.log('   TWITCH_DEFAULT_CHANNEL=dein_channel_name');
        return;
    }
    
    try {
        // Bot erstellen und konfigurieren
        console.log('2️⃣ Bot erstellen und konfigurieren...');
        const twitchBot = new TwitchChatBot();
        
        // Bot konfigurieren (automatisch mit Environment Variables)
        twitchBot.configure({
            botEnabled: true,
            botUsername: 'AgentBeeBot',
            liveNotificationsEnabled: true
        });
        
        console.log('   ✅ Bot konfiguriert');
        console.log('');
        
        // Test-Channel hinzufügen
        console.log('3️⃣ Test-Channel hinzufügen...');
        const testChannel = process.env.TWITCH_DEFAULT_CHANNEL || 'mindofdennis95';
        
        await twitchBot.addChannel(testChannel, {
            liveMessageEnabled: true,
            customLiveMessage: '🔴 LIVE DETECTION TEST: Stream ist online! 🎉',
            useCustomLiveMessage: true
        });
        
        console.log(`   ✅ Channel "${testChannel}" hinzugefügt`);
        console.log('');
        
        // Bot starten
        console.log('4️⃣ Bot starten...');
        await twitchBot.start();
        
        console.log('   ✅ Bot gestartet');
        console.log('');
        
        // Self-Monitoring Status prüfen
        console.log('5️⃣ Self-Monitoring Status:');
        const status = twitchBot.getSelfMonitoringStatus();
        console.log('   Enabled:', status.enabled);
        console.log('   Has Credentials:', status.hasCredentials);
        console.log('   Has Token:', status.hasToken);
        console.log('   Is Running:', status.isRunning);
        console.log('   Monitored Channels:', status.monitoredChannels);
        console.log('');
        
        if (status.enabled && status.hasCredentials) {
            console.log('✅ Self-Monitoring ist aktiv!');
            console.log('');
            console.log('🎯 NÄCHSTE SCHRITTE:');
            console.log('1. Gehe JETZT auf Twitch live');
            console.log('2. Warte maximal 3 Minuten');
            console.log('3. Prüfe deinen Twitch Chat auf Live-Message');
            console.log('');
            console.log('🔍 Live-Check läuft alle 3 Minuten...');
            console.log('⏰ Nächster Check in 3 Minuten');
            
            // Bot 10 Minuten laufen lassen für Tests
            setTimeout(() => {
                console.log('\n🛑 Test beendet, stoppe Bot...');
                twitchBot.stop();
                process.exit(0);
            }, 10 * 60 * 1000); // 10 Minuten
            
        } else {
            console.log('❌ Self-Monitoring ist nicht aktiv!');
            console.log('🐛 Debug Info:');
            console.log('   Enabled:', status.enabled);
            console.log('   Has Credentials:', status.hasCredentials);
            console.log('   Client ID:', !!twitchBot.twitchClientId);
            console.log('   Client Secret:', !!twitchBot.twitchClientSecret);
            twitchBot.stop();
        }
        
    } catch (error) {
        console.error('❌ Test-Fehler:', error.message);
        if (error.message.includes('OAuth')) {
            console.log('\n💡 OAuth Token Problem:');
            console.log('1. Gehe zu: https://twitchapps.com/tmi/');
            console.log('2. Generiere neuen OAuth Token');
            console.log('3. Setze TWITCH_BOT_OAUTH=oauth:dein_token');
        }
    }
}

// Test ausführen
console.log('🚀 Starte Live-Monitoring Test...\n');
testLiveMonitoring().catch(console.error); 