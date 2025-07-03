const { createClient } = require('@supabase/supabase-js');
const TwitchChatBot = require('./twitch-chat-bot');

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

async function debugLiveDetection() {
    console.log('🔍 LIVE DETECTION DEBUG');
    console.log('======================\n');
    
    try {
        // 1. Environment Variables prüfen
        console.log('1️⃣ Environment Variables:');
        console.log('   TWITCH_CLIENT_ID:', process.env.TWITCH_CLIENT_ID ? '✅ Gesetzt' : '❌ Fehlt');
        console.log('   TWITCH_CLIENT_SECRET:', process.env.TWITCH_CLIENT_SECRET ? '✅ Gesetzt' : '❌ Fehlt');
        console.log('   TWITCH_BOT_OAUTH:', process.env.TWITCH_BOT_OAUTH ? '✅ Gesetzt' : '❌ Fehlt');
        console.log('');
        
        // 2. Bot Settings aus Supabase laden
        console.log('2️⃣ Bot Settings aus Supabase:');
        const { data: settings, error: settingsError } = await supabaseClient
            .from('twitch_bot_settings')
            .select('*')
            .eq('guild_id', 'default')
            .single();
            
        if (settingsError) {
            console.log('   ❌ Fehler:', settingsError.message);
        } else {
            console.log('   Bot Enabled:', settings.bot_enabled);
            console.log('   Self Monitoring:', settings.self_monitoring_enabled);
            console.log('   Live Notifications:', settings.live_notifications_enabled);
            console.log('   OAuth Token:', settings.oauth_token ? '✅ Gesetzt' : '❌ Fehlt');
        }
        console.log('');
        
        // 3. Channels aus Supabase laden
        console.log('3️⃣ Aktive Channels:');
        const { data: channels, error: channelsError } = await supabaseClient
            .from('twitch_bot_channels')
            .select('*')
            .eq('guild_id', 'default')
            .eq('enabled', true);
            
        if (channelsError) {
            console.log('   ❌ Fehler:', channelsError.message);
        } else {
            console.log(`   ${channels.length} aktive Channels gefunden:`);
            channels.forEach(channel => {
                console.log(`   - ${channel.channel_name} (Live Messages: ${channel.live_message_enabled})`);
            });
        }
        console.log('');
        
        // 4. Twitch API Test (Access Token holen)
        console.log('4️⃣ Twitch API Test:');
        if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
            console.log('   ❌ Twitch API Credentials fehlen');
        } else {
            try {
                const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        client_id: process.env.TWITCH_CLIENT_ID,
                        client_secret: process.env.TWITCH_CLIENT_SECRET,
                        grant_type: 'client_credentials'
                    })
                });
                
                if (tokenResponse.ok) {
                    const tokenData = await tokenResponse.json();
                    console.log('   ✅ Access Token erhalten');
                    
                    // Test: Channel live status prüfen
                    if (channels && channels.length > 0) {
                        const testChannel = channels[0].channel_name;
                        console.log(`   Test Channel "${testChannel}" auf Live-Status...`);
                        
                        // User ID holen
                        const userResponse = await fetch(
                            `https://api.twitch.tv/helix/users?login=${testChannel}`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${tokenData.access_token}`,
                                    'Client-Id': process.env.TWITCH_CLIENT_ID
                                }
                            }
                        );
                        
                        if (userResponse.ok) {
                            const userData = await userResponse.json();
                            if (userData.data.length > 0) {
                                const userId = userData.data[0].id;
                                console.log(`   User ID: ${userId}`);
                                
                                // Stream-Status prüfen
                                const streamResponse = await fetch(
                                    `https://api.twitch.tv/helix/streams?user_id=${userId}`,
                                    {
                                        headers: {
                                            'Authorization': `Bearer ${tokenData.access_token}`,
                                            'Client-Id': process.env.TWITCH_CLIENT_ID
                                        }
                                    }
                                );
                                
                                if (streamResponse.ok) {
                                    const streamData = await streamResponse.json();
                                    if (streamData.data.length > 0) {
                                        console.log(`   🔴 ${testChannel} ist LIVE!`);
                                        console.log(`      Title: ${streamData.data[0].title}`);
                                        console.log(`      Game: ${streamData.data[0].game_name}`);
                                        console.log(`      Viewer: ${streamData.data[0].viewer_count}`);
                                    } else {
                                        console.log(`   ⚫ ${testChannel} ist offline`);
                                    }
                                } else {
                                    console.log(`   ❌ Stream API Fehler: ${streamResponse.status}`);
                                }
                            } else {
                                console.log(`   ❌ User "${testChannel}" nicht gefunden`);
                            }
                        } else {
                            console.log(`   ❌ User API Fehler: ${userResponse.status}`);
                        }
                    }
                } else {
                    console.log('   ❌ Token Fehler:', tokenResponse.status);
                }
            } catch (error) {
                console.log('   ❌ API Fehler:', error.message);
            }
        }
        console.log('');
        
        // 5. Live Message Templates prüfen
        console.log('5️⃣ Live Message Templates:');
        const { data: templates, error: templatesError } = await supabaseClient
            .from('twitch_live_message_templates')
            .select('*')
            .eq('guild_id', 'default')
            .eq('enabled', true);
            
        if (templatesError) {
            console.log('   ❌ Fehler:', templatesError.message);
        } else {
            console.log(`   ${templates.length} aktive Templates gefunden`);
        }
        console.log('');
        
        // 6. Bot Instanz Status (falls vorhanden)
        console.log('6️⃣ Diagnose Ergebnis:');
        
        // Check 1: Bot Settings
        if (!settings || !settings.bot_enabled) {
            console.log('   ❌ Bot ist deaktiviert');
        } else if (!settings.self_monitoring_enabled) {
            console.log('   ❌ Self-Monitoring ist deaktiviert');
        } else {
            console.log('   ✅ Bot und Self-Monitoring sind aktiviert');
        }
        
        // Check 2: Credentials
        if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
            console.log('   ❌ Twitch API Credentials fehlen');
        } else {
            console.log('   ✅ Twitch API Credentials verfügbar');
        }
        
        // Check 3: OAuth Token
        if (!settings?.oauth_token && !process.env.TWITCH_BOT_OAUTH) {
            console.log('   ❌ Bot OAuth Token fehlt');
        } else {
            console.log('   ✅ Bot OAuth Token verfügbar');
        }
        
        // Check 4: Channels
        if (!channels || channels.length === 0) {
            console.log('   ❌ Keine aktiven Channels konfiguriert');
        } else {
            console.log(`   ✅ ${channels.length} aktive Channels konfiguriert`);
        }
        
        console.log('\n🔍 DEBUG ABGESCHLOSSEN');
        
    } catch (error) {
        console.error('❌ Debug Fehler:', error.message);
    }
}

// Debug ausführen
debugLiveDetection().then(() => {
    console.log('\n💡 NÄCHSTE SCHRITTE:');
    console.log('1. Bot neu starten falls alles konfiguriert ist');
    console.log('2. Live gehen und 3 Minuten warten');
    console.log('3. Bot-Logs prüfen auf Self-Monitoring Nachrichten');
    process.exit(0);
}).catch(console.error); 