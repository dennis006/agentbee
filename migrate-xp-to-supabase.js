const fs = require('fs');
const XPSupabaseAPI = require('./xp-supabase-api');

class XPMigration {
    constructor() {
        this.supabaseAPI = new XPSupabaseAPI();
    }

    async migrateAll() {
        console.log('🚀 Starte XP-System Migration von JSON zu Supabase...');

        try {
            // 1. JSON-Dateien laden
            const xpData = this.loadXPData();
            const xpSettings = this.loadXPSettings();

            console.log(`📊 Gefunden: ${xpData.length} User, Settings vorhanden: ${!!xpSettings}`);

            // 2. Migration durchführen
            const result = await this.supabaseAPI.migrateFromJSON(xpData, xpSettings);

            if (result.success) {
                console.log('✅ Migration erfolgreich abgeschlossen!');
                
                // 3. Backup der alten JSON-Dateien erstellen
                await this.createBackup();
                
                console.log('📋 Migration Summary:');
                console.log(`  ✅ ${xpData.length} User migriert`);
                console.log(`  ✅ Settings migriert`);
                console.log(`  ✅ JSON-Backups erstellt`);
                console.log('🎉 XP-System ist jetzt auf Supabase umgestellt!');
                
                return true;
            } else {
                console.error('❌ Migration fehlgeschlagen:', result.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Kritischer Fehler bei der Migration:', error);
            return false;
        }
    }

    loadXPData() {
        try {
            if (fs.existsSync('./xp-data.json')) {
                const data = JSON.parse(fs.readFileSync('./xp-data.json', 'utf8'));
                console.log('📄 xp-data.json geladen');
                return Array.isArray(data) ? data : [];
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden von xp-data.json:', error);
        }
        return [];
    }

    loadXPSettings() {
        try {
            if (fs.existsSync('./xp-settings.json')) {
                const settings = JSON.parse(fs.readFileSync('./xp-settings.json', 'utf8'));
                console.log('⚙️ xp-settings.json geladen');
                return settings;
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden von xp-settings.json:', error);
        }
        return null;
    }

    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = './migration-backup';
        
        // Backup-Verzeichnis erstellen
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        // JSON-Dateien sichern
        if (fs.existsSync('./xp-data.json')) {
            fs.copyFileSync('./xp-data.json', `${backupDir}/xp-data-backup-${timestamp}.json`);
            console.log(`💾 Backup erstellt: xp-data-backup-${timestamp}.json`);
        }

        if (fs.existsSync('./xp-settings.json')) {
            fs.copyFileSync('./xp-settings.json', `${backupDir}/xp-settings-backup-${timestamp}.json`);
            console.log(`💾 Backup erstellt: xp-settings-backup-${timestamp}.json`);
        }
    }

    async testSupabaseConnection() {
        console.log('🔍 Teste Supabase-Verbindung...');
        
        try {
            // Test mit einem einfachen Read-Zugriff
            await this.supabaseAPI.loadSettings();
            console.log('✅ Supabase-Verbindung erfolgreich');
            return true;
        } catch (error) {
            console.error('❌ Supabase-Verbindung fehlgeschlagen:', error);
            console.error('💡 Überprüfe deine Umgebungsvariablen:');
            console.error('   - SUPABASE_URL');
            console.error('   - SUPABASE_ANON_KEY');
            return false;
        }
    }

    async verifyMigration() {
        console.log('🔍 Verifiziere Migration...');

        try {
            // Test: Settings laden
            const settings = await this.supabaseAPI.loadSettings();
            console.log('✅ Settings erfolgreich aus Supabase geladen');

            // Test: User-Daten laden
            const users = await this.supabaseAPI.getAllUsers();
            console.log(`✅ ${users.length} User erfolgreich aus Supabase geladen`);

            // Test: Statistiken laden
            const stats = await this.supabaseAPI.getStats();
            console.log('✅ Statistiken erfolgreich aus Supabase geladen');

            console.log('🎉 Migration-Verifikation erfolgreich!');
            return true;
        } catch (error) {
            console.error('❌ Migration-Verifikation fehlgeschlagen:', error);
            return false;
        }
    }

    // Rollback-Funktion (falls nötig)
    async rollback() {
        console.log('🔄 Starte Rollback zur JSON-Speicherung...');
        
        // Hier könnte eine Rollback-Logik implementiert werden
        // Die JSON-Backups sind bereits vorhanden
        
        console.log('💡 Rollback-Info:');
        console.log('  - JSON-Backups sind im "./migration-backup" Verzeichnis');
        console.log('  - Für Rollback: Backup-Dateien zurück nach xp-data.json und xp-settings.json kopieren');
        console.log('  - XP-System Code auf JSON-Version zurücksetzen');
    }
}

// CLI-Interface
async function main() {
    const args = process.argv.slice(2);
    const migration = new XPMigration();

    switch (args[0]) {
        case 'test':
            await migration.testSupabaseConnection();
            break;
        
        case 'migrate':
            const connectionOk = await migration.testSupabaseConnection();
            if (connectionOk) {
                const success = await migration.migrateAll();
                if (success) {
                    await migration.verifyMigration();
                }
            }
            break;
        
        case 'verify':
            await migration.verifyMigration();
            break;
        
        case 'rollback':
            await migration.rollback();
            break;
        
        default:
            console.log('🚀 XP-System Supabase Migration Tool');
            console.log('');
            console.log('Verfügbare Befehle:');
            console.log('  node migrate-xp-to-supabase.js test     - Teste Supabase-Verbindung');
            console.log('  node migrate-xp-to-supabase.js migrate  - Vollständige Migration durchführen');
            console.log('  node migrate-xp-to-supabase.js verify   - Migration verifizieren');
            console.log('  node migrate-xp-to-supabase.js rollback - Rollback-Info anzeigen');
            console.log('');
            console.log('Vor der Migration:');
            console.log('  1. Supabase SQL-Datei ausführen (xp_system_supabase_migration.sql)');
            console.log('  2. SUPABASE_URL und SUPABASE_ANON_KEY in Umgebungsvariablen setzen');
            console.log('  3. npm install @supabase/supabase-js');
            break;
    }
}

// Export für Verwendung als Modul
module.exports = XPMigration;

// CLI-Verwendung
if (require.main === module) {
    main().catch(console.error);
} 