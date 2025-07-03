const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Direkte Credentials für Debug-Test
process.env.SUPABASE_URL = 'https://mmnobyrmsenrayarytxu.supabase.co';
process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbm9ieXJtc2VucmF5YXJ5dHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNDM2ODQsImV4cCI6MjA1MjYxOTY4NH0.0fV9ZoKSjZOH6uaYVHLO9OKpJO3kNpOWxC0GFwB8Ymw';
process.env.SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbm9ieXJtc2VucmF5YXJ5dHh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzA0MzY4NCwiZXhwIjoyMDUyNjE5Njg0fQ.3o9J6T_AzP0vP6Z5k67k_XeZp1qM_UQz9HQ8YXNl7qY';

// ⚡ NEU: Twitch API Credentials für Self-Monitoring
process.env.TWITCH_CLIENT_ID = 'TWITCH_CLIENT_ID_HIER_EINFÜGEN';
process.env.TWITCH_CLIENT_SECRET = 'TWITCH_CLIENT_SECRET_HIER_EINFÜGEN';

// Simuliere die Supabase Initialisierung wie in index.js
function initializeSupabase() {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service Role für RLS
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Fallback
        
        if (supabaseUrl && (supabaseServiceKey || supabaseAnonKey)) {
            // Bevorzuge Service Role für Discord Bot (umgeht RLS)
            const keyToUse = supabaseServiceKey || supabaseAnonKey;
            const keyType = supabaseServiceKey ? 'SERVICE_ROLE' : 'ANON_KEY';
            
            const supabase = createClient(supabaseUrl, keyToUse);
            global.supabaseClient = supabase;
            console.log(`✅ Supabase erfolgreich initialisiert (${keyType})`);
            return supabase;
        } else {
            console.log('⚠️ Supabase Credentials nicht gefunden');
            console.log(`   SUPABASE_URL: ${supabaseUrl ? 'gesetzt' : 'nicht gesetzt'}`);
            console.log(`   SUPABASE_SERVICE_KEY: ${supabaseServiceKey ? 'gesetzt' : 'nicht gesetzt'}`);
            console.log(`   SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'gesetzt' : 'nicht gesetzt'}`);
            return null;
        }
    } catch (error) {
        console.error('❌ Fehler bei Supabase-Initialisierung:', error.message);
        return null;
    }
}

async function debugTwitchLiveDetection() {
    console.log('🔍 TWITCH LIVE DETECTION DEBUG');
    console.log('=====================================\n');

    // 1. Environment Variables prüfen (wie in index.js)
    console.log('1️⃣ Environment Variables:');
    console.log(`   - SUPABASE_URL: ${process.env.SUPABASE_URL ? 'SET' : 'NOT SET'}`);
    console.log(`   - SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`   - SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`   - TWITCH_CLIENT_ID: ${process.env.TWITCH_CLIENT_ID ? 'SET' : 'NOT SET'}`);
    console.log(`   - TWITCH_CLIENT_SECRET: ${process.env.TWITCH_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);

    // 2. Supabase wie im Hauptsystem initialisieren
    console.log('\n2️⃣ Supabase Initialisierung:');
    const supabase = initializeSupabase();
    
    if (!supabase) {
        console.error('❌ Kann nicht ohne Supabase fortfahren!');
        return;
    }

    let settings = null;
    let enabledStreamers = [];

    try {
        // 3. Live Notification Settings prüfen
        console.log('\n3️⃣ Twitch Live Notification Settings:');
        try {
            const { data: settingsData, error: settingsError } = await supabase
                .from('twitch_live_notifications')
                .select('*')
                .eq('guild_id', 'default')
                .single();

            if (settingsError && settingsError.code !== 'PGRST116') {
                console.error('❌ Settings Error:', settingsError.message);
            } else if (settingsData) {
                settings = settingsData;
                console.log(`   ✅ System Enabled: ${settings.enabled}`);
                console.log(`   ✅ Check Interval: ${settings.check_interval} Minuten`);
                console.log(`   ✅ Notification Channel: ${settings.notification_channel}`);
                console.log(`   ✅ Role to Mention: ${settings.role_to_mention || 'None'}`);
                console.log(`   ✅ Mention Everyone: ${settings.mention_everyone}`);
                console.log(`   ✅ Cooldown: ${settings.cooldown} Minuten`);
            } else {
                console.log('⚠️ Keine Settings gefunden - Default-Einstellungen werden verwendet');
            }
        } catch (error) {
            console.error('❌ Settings Connection Error:', error.message);
        }

        // 4. Monitored Streamers prüfen
        console.log('\n4️⃣ Monitored Streamers:');
        try {
            const { data: streamers, error: streamersError } = await supabase
                .from('twitch_monitored_streamers')
                .select('*')
                .eq('guild_id', 'default');

            if (streamersError) {
                console.error('❌ Streamers Error:', streamersError.message);
            } else {
                console.log(`   ✅ Total Streamers: ${streamers.length}`);
                enabledStreamers = streamers.filter(s => s.enabled);
                console.log(`   ✅ Enabled Streamers: ${enabledStreamers.length}`);
                
                enabledStreamers.forEach(streamer => {
                    console.log(`   - ${streamer.username}: Live Notifications ${streamer.live_notifications ? 'ON' : 'OFF'}, Total Notifications: ${streamer.total_notifications}`);
                    if (streamer.last_live) {
                        console.log(`     Last Live: ${new Date(streamer.last_live).toLocaleString()}`);
                    }
                });
            }
        } catch (error) {
            console.error('❌ Streamers Connection Error:', error.message);
            enabledStreamers = []; // Setze leeres Array bei Fehler
        }

        // 5. Twitch API Credentials und Test
        console.log('\n5️⃣ Twitch API Test:');
        const clientId = process.env.TWITCH_CLIENT_ID;
        const clientSecret = process.env.TWITCH_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.error('❌ Twitch API Credentials fehlen!');
            console.log('   Setze TWITCH_CLIENT_ID und TWITCH_CLIENT_SECRET in Railway Environment Variables');
        } else {
            try {
                // Access Token holen
                console.log('   🔑 Hole Twitch Access Token...');
                const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
                });

                if (!tokenResponse.ok) {
                    throw new Error(`Token Request failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
                }

                const tokenData = await tokenResponse.json();
                console.log('   ✅ Access Token erhalten');

                // Test alle Streamer falls vorhanden
                if (enabledStreamers && enabledStreamers.length > 0) {
                    console.log(`   🔍 Teste Stream-Status für alle ${enabledStreamers.length} Streamer...`);

                    const usernames = enabledStreamers.map(s => s.username).join('&user_login=');
                    
                    // Streams API Call
                    const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_login=${usernames}`, {
                        headers: {
                            'Client-ID': clientId,
                            'Authorization': `Bearer ${tokenData.access_token}`
                        }
                    });

                    if (!streamResponse.ok) {
                        throw new Error(`Stream API failed: ${streamResponse.status} ${streamResponse.statusText}`);
                    }

                    const streamData = await streamResponse.json();
                    
                    // Users API Call
                    const userResponse = await fetch(`https://api.twitch.tv/helix/users?login=${usernames}`, {
                        headers: {
                            'Client-ID': clientId,
                            'Authorization': `Bearer ${tokenData.access_token}`
                        }
                    });

                    const userData = userResponse.ok ? await userResponse.json() : { data: [] };
                    
                    console.log(`   📊 API Response: ${streamData.data.length} live streams von ${enabledStreamers.length} Streamern`);
                    
                    // Jeden Streamer prüfen
                    for (const streamer of enabledStreamers) {
                        const stream = streamData.data.find(s => s.user_login.toLowerCase() === streamer.username.toLowerCase());
                        const user = userData.data.find(u => u.login.toLowerCase() === streamer.username.toLowerCase());
                        
                        if (stream) {
                            console.log(`   🔴 ${streamer.username} ist LIVE!`);
                            console.log(`      - Spiel: ${stream.game_name}`);
                            console.log(`      - Zuschauer: ${stream.viewer_count}`);
                            console.log(`      - Title: ${stream.title?.substring(0, 60)}...`);
                            console.log(`      - Stream ID: ${stream.id}`);
                            console.log(`      - Started At: ${stream.started_at}`);
                            
                            // Prüfe ob bereits eine Benachrichtigung gesendet wurde
                            try {
                                const { data: existingNotification } = await supabase
                                    .from('twitch_bot_events')
                                    .select('*')
                                    .eq('guild_id', 'default')
                                    .eq('event_type', 'stream_live')
                                    .contains('data', { streamer_id: streamer.id.toString(), stream_id: stream.id })
                                    .order('created_at', { ascending: false })
                                    .limit(1);
                                
                                if (existingNotification && existingNotification.length > 0) {
                                    console.log(`      ⚠️ Bereits benachrichtigt am ${new Date(existingNotification[0].created_at).toLocaleString()}`);
                                } else {
                                    console.log(`      ✅ Noch nicht benachrichtigt - würde Live Message senden!`);
                                }
                            } catch (dbError) {
                                console.log(`      ⚠️ Notification Status Check fehlgeschlagen: ${dbError.message}`);
                            }
                        } else {
                            console.log(`   📴 ${streamer.username} ist offline`);
                        }
                    }
                } else {
                    console.log('   ⚠️ Keine Streamer konfiguriert zum Testen');
                }

            } catch (apiError) {
                console.error('❌ Twitch API Error:', apiError.message);
            }
        }

        // 6. Live Data / Events prüfen
        console.log('\n6️⃣ Recent Live Events:');
        try {
            const { data: liveEvents, error: liveError } = await supabase
                .from('twitch_bot_events')
                .select('*')
                .eq('guild_id', 'default')
                .in('event_type', ['stream_live', 'stream_ended'])
                .order('created_at', { ascending: false })
                .limit(10);

            if (liveError) {
                console.error('❌ Live Events Error:', liveError.message);
            } else {
                console.log(`   ✅ Recent Events: ${liveEvents.length}`);
                liveEvents.forEach(event => {
                    const eventData = event.data || {};
                    console.log(`   - ${event.event_type}: ${event.username || eventData.streamer_id} at ${new Date(event.created_at).toLocaleString()}`);
                });
            }
        } catch (error) {
            console.error('❌ Live Events Connection Error:', error.message);
        }

        // 7. System Status Summary
        console.log('\n7️⃣ DIAGNOSE ERGEBNIS:');
        console.log('=====================================');

        const problems = [];
        const checks = [];

        // Environment Check
        if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
            problems.push('❌ Twitch API Credentials fehlen');
        } else {
            checks.push('✅ Twitch API Credentials vorhanden');
        }

        // Settings Check
        if (!settings || !settings.enabled) {
            problems.push('❌ Live Notification System ist deaktiviert');
        } else {
            checks.push('✅ Live Notification System ist aktiviert');
        }

        // Streamers Check
        if (!enabledStreamers || enabledStreamers.length === 0) {
            problems.push('❌ Keine aktiven Streamer konfiguriert');
        } else {
            checks.push(`✅ ${enabledStreamers.length} aktive Streamer konfiguriert`);
        }

        // Supabase Check
        if (supabase) {
            checks.push('✅ Supabase-Verbindung funktioniert');
        } else {
            problems.push('❌ Supabase-Verbindung fehlgeschlagen');
        }

        console.log('\n✅ FUNKTIONIERENDE KOMPONENTEN:');
        checks.forEach(check => console.log(check));

        if (problems.length > 0) {
            console.log('\n❌ GEFUNDENE PROBLEME:');
            problems.forEach(problem => console.log(problem));
        }

        console.log('\n💡 EMPFOHLENE AKTIONEN:');
        if (problems.some(p => p.includes('Credentials'))) {
            console.log('1. Setze TWITCH_CLIENT_ID und TWITCH_CLIENT_SECRET in Railway Environment Variables');
        }
        if (problems.some(p => p.includes('deaktiviert'))) {
            console.log('2. Aktiviere das Live Notification System im Dashboard');
        }
        if (problems.some(p => p.includes('Streamer'))) {
            console.log('3. Füge Streamer im Dashboard hinzu');
        }
        console.log('4. Teste manuell mit /api/twitch/check API Endpoint');
        console.log('5. Prüfe Discord Channel-Namen und Permissions');
        console.log('6. Starte einen Test-Stream und schaue ob Benachrichtigung kommt');
        console.log('7. Prüfe ob Railway die Supabase Environment Variables hat');

    } catch (error) {
        console.error('❌ Debug Error:', error);
    }
}

// Script ausführen
debugTwitchLiveDetection().catch(console.error); 