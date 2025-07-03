// Test: OAuth Token aus Datenbank holen
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testOAuthFromDB() {
    console.log('🔍 TESTE OAUTH TOKEN AUS DATENBANK');
    console.log('===================================\n');
    
    try {
        // Supabase initialisieren
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseServiceKey) {
            console.log('❌ Supabase nicht konfiguriert - verwende Environment Fallback');
            console.log('   TWITCH_BOT_OAUTH:', process.env.TWITCH_BOT_OAUTH ? 'Gesetzt' : 'Fehlt');
            return;
        }
        
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
        console.log('✅ Supabase verbunden');
        
        // Bot Settings aus Datenbank laden
        const { data: settings, error } = await supabaseClient
            .from('twitch_bot_settings')
            .select('oauth_token, bot_username, bot_enabled, self_monitoring_enabled')
            .eq('guild_id', 'default')
            .single();
            
        if (error) {
            console.log('❌ Fehler beim Laden der Bot Settings:', error.message);
            return;
        }
        
        console.log('📋 Bot Settings aus Datenbank:');
        console.log('   Bot Username:', settings.bot_username);
        console.log('   Bot Enabled:', settings.bot_enabled);
        console.log('   Self Monitoring:', settings.self_monitoring_enabled);
        console.log('   OAuth Token:', settings.oauth_token ? 'Gesetzt (' + settings.oauth_token.substring(0, 10) + '...)' : 'FEHLT!');
        console.log('');
        
        if (settings.oauth_token && settings.bot_enabled) {
            console.log('✅ OAuth Token gefunden! Bot kann gestartet werden!');
            
            // Jetzt den Bot mit diesen Settings starten
            const TwitchChatBot = require('./twitch-chat-bot');
            const twitchBot = new TwitchChatBot();
            
            console.log('🤖 Starte Bot mit Datenbank-Token...');
            twitchBot.configure({
                botEnabled: true,
                botUsername: settings.bot_username,
                oauthToken: settings.oauth_token, // Token aus Datenbank!
                liveNotificationsEnabled: true,
                selfMonitoringEnabled: settings.self_monitoring_enabled
            });
            
            // Channel hinzufügen
            await twitchBot.addChannel('mindofdennis95', {
                liveMessageEnabled: true,
                useCustomLiveMessage: false
            });
            
            // Bot starten
            await twitchBot.start();
            
            console.log('✅ Bot gestartet mit Datenbank-Token!');
            
            const status = twitchBot.getSelfMonitoringStatus();
            console.log('📊 Self-Monitoring Status:');
            console.log('   Enabled:', status.enabled);
            console.log('   Is Running:', status.isRunning);
            console.log('   Monitored Channels:', status.monitoredChannels);
            
            if (status.enabled && status.isRunning) {
                console.log('\n🎯 SUCCESS! GEHE JETZT LIVE!');
                console.log('Live-Message wird automatisch gepostet! 🔔');
                
                // 10 Minuten laufen lassen
                setTimeout(() => {
                    console.log('\n🛑 Test beendet');
                    twitchBot.stop();
                    process.exit(0);
                }, 10 * 60 * 1000);
            } else {
                console.log('\n❌ Self-Monitoring läuft nicht');
                twitchBot.stop();
            }
            
        } else {
            console.log('❌ OAuth Token oder Bot nicht aktiviert in Datenbank');
        }
        
    } catch (error) {
        console.error('❌ Fehler:', error.message);
    }
}

testOAuthFromDB().catch(console.error); 