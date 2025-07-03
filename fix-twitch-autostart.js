// FORCE-FIX für Twitch Bot Auto-Start
// Startet den Bot direkt mit den Environment Variables

require('dotenv').config();
const TwitchChatBot = require('./twitch-chat-bot');

async function forceTwitchBotStart() {
    console.log('🔧 FORCE-START TWITCH BOT');
    console.log('==========================\n');
    
    try {
        // Environment Variables prüfen
        console.log('📋 Environment Variables:');
        console.log('   TWITCH_CLIENT_ID:', process.env.TWITCH_CLIENT_ID ? '✅ Gesetzt' : '❌ Fehlt');
        console.log('   TWITCH_CLIENT_SECRET:', process.env.TWITCH_CLIENT_SECRET ? '✅ Gesetzt' : '❌ Fehlt');
        console.log('   TWITCH_BOT_OAUTH:', process.env.TWITCH_BOT_OAUTH ? '✅ Gesetzt' : '❌ Fehlt');
        console.log('');
        
        // Bot erstellen
        console.log('🤖 Bot erstellen und konfigurieren...');
        const twitchBot = new TwitchChatBot();
        
        // Bot konfigurieren mit Environment Variables
        twitchBot.configure({
            botEnabled: true,
            botUsername: 'Agentbeebot',
            oauthToken: process.env.TWITCH_BOT_OAUTH,
            liveNotificationsEnabled: true,
            selfMonitoringEnabled: true // Force aktivieren
        });
        
        console.log('✅ Bot konfiguriert');
        
        // Channel hinzufügen
        console.log('📺 Channel "mindofdennis95" hinzufügen...');
        await twitchBot.addChannel('mindofdennis95', {
            liveMessageEnabled: true,
            customLiveMessage: '🔴 Stream ist LIVE! Kommt alle rein! 🎉',
            useCustomLiveMessage: false // Nutzt die 8 Standard-Templates
        });
        
        console.log('✅ Channel hinzugefügt');
        
        // Bot starten
        console.log('🚀 Bot starten...');
        await twitchBot.start();
        
        console.log('✅ Bot erfolgreich gestartet!');
        console.log('');
        
        // Self-Monitoring Status prüfen
        const status = twitchBot.getSelfMonitoringStatus();
        console.log('📊 Self-Monitoring Status:');
        console.log('   Enabled:', status.enabled);
        console.log('   Has Token:', status.hasToken);
        console.log('   Is Running:', status.isRunning);
        console.log('   Monitored Channels:', status.monitoredChannels);
        console.log('');
        
        if (status.enabled && status.isRunning) {
            console.log('🎯 SUCCESS! Self-Monitoring läuft!');
            console.log('');
            console.log('⚡ JETZT LIVE GEHEN!');
            console.log('💡 Live-Check läuft alle 3 Minuten');
            console.log('🔔 Live-Message wird automatisch gepostet!');
            console.log('');
            console.log('⏰ Bot läuft für 15 Minuten zum Testen...');
            
            // Bot 15 Minuten laufen lassen
            setTimeout(() => {
                console.log('\n🛑 Test beendet');
                twitchBot.stop();
                process.exit(0);
            }, 15 * 60 * 1000);
            
        } else {
            console.log('❌ FEHLER: Self-Monitoring läuft nicht!');
            console.log('Debug:', status);
            twitchBot.stop();
        }
        
    } catch (error) {
        console.error('❌ FEHLER:', error.message);
        
        if (error.message.includes('OAuth')) {
            console.log('\n💡 OAuth Token Problem - Generiere neuen Token:');
            console.log('   https://twitchapps.com/tmi/');
        }
    }
}

// Script ausführen
forceTwitchBotStart().catch(console.error); 