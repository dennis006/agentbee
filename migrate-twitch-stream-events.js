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

        // Migration SQL laden und ausführen
        const migrationFile = path.join(__dirname, 'twitch_bot_stream_events_simple_migration.sql');
        
        if (!fs.existsSync(migrationFile)) {
            console.error('❌ Migration-Datei nicht gefunden:', migrationFile);
            return false;
        }

        const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
        console.log('📝 Migration SQL geladen');

        // SQL in Teile aufteilen (PostgreSQL kann nicht alle Commands in einem Zug)
        const sqlCommands = migrationSQL
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

        console.log(`🔧 Führe ${sqlCommands.length} SQL-Commands aus...`);

        // Commands einzeln ausführen
        for (let i = 0; i < sqlCommands.length; i++) {
            const command = sqlCommands[i];
            if (command.trim()) {
                try {
                    console.log(`   ${i + 1}/${sqlCommands.length}: ${command.substring(0, 50)}...`);
                    await supabase.rpc('exec_sql', { sql_command: command + ';' });
                } catch (error) {
                    // Manche Commands können fehlschlagen (z.B. wenn schon existiert) - das ist ok
                    if (!error.message.includes('already exists') && 
                        !error.message.includes('duplicate key') &&
                        !error.message.includes('relation') &&
                        !error.message.includes('function') &&
                        !error.message.includes('policy')) {
                        console.warn(`⚠️ Command ${i + 1} Warnung:`, error.message.substring(0, 100));
                    }
                }
            }
        }

        // Prüfen ob Tabellen erstellt wurden
        console.log('🔍 Prüfe erstellte Tabellen...');
        
        const { data: streamEventsTable, error: streamEventsError } = await supabase
            .from('twitch_bot_stream_events')
            .select('*')
            .limit(1);

        const { data: eventsTable, error: eventsError } = await supabase
            .from('twitch_bot_events')
            .select('*')
            .limit(1);

        if (streamEventsError) {
            console.error('❌ twitch_bot_stream_events Tabelle nicht gefunden:', streamEventsError.message);
            return false;
        }

        if (eventsError) {
            console.error('❌ twitch_bot_events Tabelle nicht gefunden:', eventsError.message);
            return false;
        }

        console.log('✅ Alle Tabellen erfolgreich erstellt!');
        console.log('📋 Tabellen:');
        console.log('   • twitch_bot_stream_events (Stream Event Einstellungen)');
        console.log('   • twitch_bot_events (Event Historie)');
        
        // Standard-Einträge prüfen
        const { data: defaultSettings } = await supabase
            .from('twitch_bot_stream_events')
            .select('*')
            .eq('guild_id', 'default')
            .single();

        if (defaultSettings) {
            console.log('✅ Standard-Einstellungen gefunden');
            console.log(`   Stream Start: ${defaultSettings.stream_start_enabled ? 'Aktiviert' : 'Deaktiviert'}`);
            console.log(`   Nachricht: "${defaultSettings.stream_start_message}"`);
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
                console.log('❌ Migration fehlgeschlagen');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('❌ Migration-Script Fehler:', error);
            process.exit(1);
        });
}

module.exports = migrateTwitchStreamEventsToSupabase; 