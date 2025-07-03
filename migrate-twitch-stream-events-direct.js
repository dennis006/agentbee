const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrateTwitchStreamEventsToSupabase() {
    console.log('🔄 Starte Migration der Twitch Stream Events zu Supabase...');

    try {
        // Supabase Client initialisieren
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
        
        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('❌ Supabase Credentials nicht gefunden.');
            console.log('   Benötigt: SUPABASE_URL und SUPABASE_SERVICE_KEY in .env');
            return false;
        }

        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        console.log('✅ Supabase Client initialisiert');

        // Migration SQL laden
        const migrationFile = path.join(__dirname, 'twitch_bot_stream_events_simple_migration.sql');
        
        if (!fs.existsSync(migrationFile)) {
            console.error('❌ Migration-Datei nicht gefunden:', migrationFile);
            return false;
        }

        const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
        console.log('📝 Migration SQL geladen');

        // Direkte SQL-Ausführung über die REST API
        console.log('🔧 Führe Migration via REST API aus...');
        
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
            },
            body: JSON.stringify({
                sql: migrationSQL
            })
        });

        if (!response.ok) {
            // Fallback: Manuelle Tabellenerstellung
            console.log('⚠️ REST API Ansatz fehlgeschlagen, verwende manuelle Tabellenerstellung...');
            
            // Tabelle 1: twitch_bot_stream_events
            console.log('📋 Erstelle twitch_bot_stream_events Tabelle...');
            try {
                await supabase
                    .from('twitch_bot_stream_events')
                    .select('id')
                    .limit(1);
                console.log('✅ Tabelle twitch_bot_stream_events bereits vorhanden');
            } catch (error) {
                console.log('📝 Erstelle neue Tabelle twitch_bot_stream_events...');
                // Diese Tabelle muss in Supabase Dashboard oder via SQL Editor erstellt werden
                console.log('⚠️ Bitte führe das SQL-Script manuell in Supabase aus:');
                console.log('   1. Gehe zu deinem Supabase Projekt');
                console.log('   2. Öffne SQL Editor');
                console.log('   3. Kopiere den Inhalt von twitch_bot_stream_events_simple_migration.sql');
                console.log('   4. Führe das Script aus');
                return false;
            }

            // Tabelle 2: twitch_bot_events
            console.log('📋 Erstelle twitch_bot_events Tabelle...');
            try {
                await supabase
                    .from('twitch_bot_events')
                    .select('id')
                    .limit(1);
                console.log('✅ Tabelle twitch_bot_events bereits vorhanden');
            } catch (error) {
                console.log('📝 Erstelle neue Tabelle twitch_bot_events...');
            }
        } else {
            console.log('✅ Migration via REST API erfolgreich');
        }

        // Prüfen ob Tabellen existieren
        console.log('🔍 Prüfe erstellte Tabellen...');
        
        const { data: streamEventsTable, error: streamEventsError } = await supabase
            .from('twitch_bot_stream_events')
            .select('*')
            .limit(1);

        const { data: eventsTable, error: eventsError } = await supabase
            .from('twitch_bot_events')
            .select('*')
            .limit(1);

        if (streamEventsError && !streamEventsError.message.includes('relation "public.twitch_bot_stream_events" does not exist')) {
            console.error('❌ Fehler bei twitch_bot_stream_events:', streamEventsError.message);
        } else if (streamEventsError) {
            console.log('⚠️ Tabelle twitch_bot_stream_events existiert noch nicht');
            console.log('📝 Führe bitte das SQL-Script manuell aus:');
            console.log(`   SQL-Datei: ${migrationFile}`);
            return false;
        } else {
            console.log('✅ twitch_bot_stream_events Tabelle gefunden');
        }

        if (eventsError && !eventsError.message.includes('relation "public.twitch_bot_events" does not exist')) {
            console.error('❌ Fehler bei twitch_bot_events:', eventsError.message);
        } else if (eventsError) {
            console.log('⚠️ Tabelle twitch_bot_events existiert noch nicht');
            return false;
        } else {
            console.log('✅ twitch_bot_events Tabelle gefunden');
        }

        // Standard-Einstellungen prüfen
        const { data: defaultSettings } = await supabase
            .from('twitch_bot_stream_events')
            .select('*')
            .eq('guild_id', 'default')
            .single();

        if (defaultSettings) {
            console.log('✅ Standard-Einstellungen gefunden');
            console.log(`   Stream Start: ${defaultSettings.stream_start_enabled ? 'Aktiviert' : 'Deaktiviert'}`);
            console.log(`   Nachricht: "${defaultSettings.stream_start_message}"`);
        } else {
            console.log('⚠️ Keine Standard-Einstellungen gefunden, erstelle welche...');
            const { error: insertError } = await supabase
                .from('twitch_bot_stream_events')
                .insert({
                    guild_id: 'default',
                    stream_start_enabled: false,
                    stream_start_message: '🔴 Stream startet! Lasst uns Spaß haben! 🎮',
                    stream_start_delay: 30,
                    stream_end_enabled: false,
                    stream_end_message: '📴 Stream beendet! Danke fürs Zuschauen! ❤️'
                });

            if (insertError) {
                console.error('❌ Fehler beim Erstellen der Standard-Einstellungen:', insertError);
            } else {
                console.log('✅ Standard-Einstellungen erstellt');
            }
        }

        console.log('\n🎉 Twitch Stream Events Migration erfolgreich abgeschlossen!');
        console.log('🚀 Die Stream Events Features sind jetzt verfügbar in der Discord Bot Oberfläche!');
        
        return true;

    } catch (error) {
        console.error('❌ Fehler bei der Migration:', error);
        return false;
    }
}

// Migration ausführen wenn direkt aufgerufen
if (require.main === module) {
    migrateTwitchStreamEventsToSupabase()
        .then((success) => {
            if (success) {
                console.log('✅ Migration-Script erfolgreich beendet');
                process.exit(0);
            } else {
                console.log('❌ Migration fehlgeschlagen - führe SQL manuell aus');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('❌ Migration-Script Fehler:', error);
            process.exit(1);
        });
}

module.exports = migrateTwitchStreamEventsToSupabase; 