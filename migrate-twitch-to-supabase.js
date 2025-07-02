const fs = require('fs');
const path = require('path');
const TwitchSupabaseAPI = require('./twitch-supabase-api');

async function migrateTwitchDataToSupabase() {
    console.log('🔄 Starte Migration der Twitch-Daten zu Supabase...');

    const supabaseAPI = new TwitchSupabaseAPI();

    if (!supabaseAPI.isAvailable()) {
        console.error('❌ Supabase nicht verfügbar. Prüfe die Umgebungsvariablen.');
        return;
    }

    try {
        // JSON-Dateien laden
        let settingsData = null;
        let streamersData = null;

        // Einstellungen laden
        const settingsFile = path.join(__dirname, 'twitch-settings.json');
        if (fs.existsSync(settingsFile)) {
            console.log('📝 Lade Twitch-Einstellungen...');
            settingsData = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
        }

        // Streamer laden
        const streamersFile = path.join(__dirname, 'twitch-streamers.json');
        if (fs.existsSync(streamersFile)) {
            console.log('👥 Lade Streamer-Daten...');
            streamersData = JSON.parse(fs.readFileSync(streamersFile, 'utf8'));
        }

        // Migration durchführen
        if (settingsData || streamersData) {
            await supabaseAPI.migrateFromJSON(settingsData, streamersData);
            
            console.log('✅ Migration erfolgreich abgeschlossen!');
            
            // Backup der JSON-Dateien erstellen
            const backupDir = path.join(__dirname, 'twitch-json-backup');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir);
            }

            if (settingsData) {
                fs.copyFileSync(settingsFile, path.join(backupDir, 'twitch-settings.json.backup'));
                console.log('💾 Backup von twitch-settings.json erstellt');
            }

            if (streamersData) {
                fs.copyFileSync(streamersFile, path.join(backupDir, 'twitch-streamers.json.backup'));
                console.log('💾 Backup von twitch-streamers.json erstellt');
            }

            const liveDataFile = path.join(__dirname, 'twitch-live-data.json');
            if (fs.existsSync(liveDataFile)) {
                fs.copyFileSync(liveDataFile, path.join(backupDir, 'twitch-live-data.json.backup'));
                console.log('💾 Backup von twitch-live-data.json erstellt');
            }

            console.log('\n📋 Migration abgeschlossen:');
            console.log('• Alle Daten wurden erfolgreich zu Supabase migriert');
            console.log('• JSON-Backups wurden im Ordner "twitch-json-backup" erstellt');
            console.log('• Das System verwendet jetzt Supabase statt JSON-Dateien');
            console.log('\n🚀 Das Twitch Live Notification System ist bereit!');
        } else {
            console.log('⚠️ Keine JSON-Daten zum Migrieren gefunden.');
        }

    } catch (error) {
        console.error('❌ Fehler bei der Migration:', error);
        throw error;
    }
}

// Migration ausführen wenn direkt aufgerufen
if (require.main === module) {
    migrateTwitchDataToSupabase()
        .then(() => {
            console.log('✅ Migration-Script beendet');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration fehlgeschlagen:', error);
            process.exit(1);
        });
}

module.exports = migrateTwitchDataToSupabase; 