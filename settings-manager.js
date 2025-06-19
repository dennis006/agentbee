const fs = require('fs');
const path = require('path');

class SettingsManager {
  constructor() {
    this.settings = new Map(); // In-Memory Cache
    this.settingsPath = path.join(__dirname, 'settings');
    this.backupPath = path.join(__dirname, 'settings-backup');
    
    // Erstelle Ordner falls nicht vorhanden
    this.ensureDirectories();
    
    console.log('⚙️ SettingsManager initialisiert');
  }

  ensureDirectories() {
    if (!fs.existsSync(this.settingsPath)) {
      fs.mkdirSync(this.settingsPath, { recursive: true });
    }
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
  }

  getFilePath(module) {
    return path.join(this.settingsPath, `${module}.json`);
  }

  getBackupPath(module) {
    return path.join(this.backupPath, `${module}-backup.json`);
  }

  // ATOMARE LADE-OPERATION
  async loadSettings(module) {
    const cacheKey = module;
    
    try {
      console.log(`📂 Lade Settings für Modul: ${module}`);
      
      const filePath = this.getFilePath(module);
      
      if (!fs.existsSync(filePath)) {
        console.log(`📂 Keine Settings-Datei für ${module} gefunden`);
        return null;
      }

      const data = fs.readFileSync(filePath, 'utf8');
      const settings = JSON.parse(data);
      
      // Cache aktualisieren
      this.settings.set(cacheKey, settings);
      
      console.log(`✅ Settings für ${module} erfolgreich geladen`);
      return settings;
      
    } catch (error) {
      console.error(`❌ Fehler beim Laden von ${module} Settings:`, error);
      
      // Versuche Backup zu laden
      return this.loadBackup(module);
    }
  }

  // BACKUP-WIEDERHERSTELLUNG
  async loadBackup(module) {
    try {
      console.log(`🔄 Versuche Backup für ${module} zu laden...`);
      
      const backupPath = this.getBackupPath(module);
      
      if (!fs.existsSync(backupPath)) {
        console.log(`❌ Kein Backup für ${module} gefunden`);
        return null;
      }

      const data = fs.readFileSync(backupPath, 'utf8');
      const settings = JSON.parse(data);
      
      console.log(`✅ Backup für ${module} erfolgreich geladen`);
      return settings;
      
    } catch (error) {
      console.error(`❌ Fehler beim Laden des Backups für ${module}:`, error);
      return null;
    }
  }

  // ATOMARE SPEICHER-OPERATION
  async saveSettings(module, settings) {
    const cacheKey = module;
    
    try {
      console.log(`💾 Speichere Settings für Modul: ${module}`);
      
      // Validierung
      if (!settings || typeof settings !== 'object') {
        throw new Error('Ungültige Settings-Daten');
      }

      const filePath = this.getFilePath(module);
      const backupPath = this.getBackupPath(module);
      
      // Erstelle Backup der aktuellen Datei
      if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, backupPath);
        console.log(`📋 Backup erstellt für ${module}`);
      }

      // Füge Metadaten hinzu
      const settingsWithMeta = {
        ...settings,
        _metadata: {
          module: module,
          lastSaved: new Date().toISOString(),
          version: '2.0'
        }
      };

      // Atomares Schreiben (temp file → rename)
      const tempPath = filePath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(settingsWithMeta, null, 2));
      fs.renameSync(tempPath, filePath);
      
      // Cache aktualisieren
      this.settings.set(cacheKey, settingsWithMeta);
      
      console.log(`✅ Settings für ${module} erfolgreich gespeichert`);
      return { success: true, settings: settingsWithMeta };
      
    } catch (error) {
      console.error(`❌ Fehler beim Speichern von ${module} Settings:`, error);
      return { success: false, error: error.message };
    }
  }

  // SICHERE UPDATE-OPERATION
  async updateSettings(module, newSettings) {
    try {
      console.log(`🔄 Aktualisiere Settings für Modul: ${module}`);
      
      // Validierung der neuen Settings
      if (!newSettings || typeof newSettings !== 'object') {
        throw new Error('Ungültige Settings-Daten für Update');
      }

      console.log(`🔍 DEBUG - Update für ${module}:`, {
        keysCount: Object.keys(newSettings).length,
        hasMetadata: !!newSettings._metadata
      });

      // Entferne alte Metadaten vor dem Speichern
      const { _metadata, ...cleanSettings } = newSettings;
      
      // Atomares Speichern
      const result = await this.saveSettings(module, cleanSettings);
      
      if (result.success) {
        console.log(`✅ Settings für ${module} erfolgreich aktualisiert`);
        return result;
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error(`❌ Fehler beim Update von ${module} Settings:`, error);
      return { success: false, error: error.message };
    }
  }

  // CACHE-VERWALTUNG
  getCachedSettings(module) {
    return this.settings.get(module) || null;
  }

  clearCache(module = null) {
    if (module) {
      this.settings.delete(module);
      console.log(`🗑️ Cache für ${module} gelöscht`);
    } else {
      this.settings.clear();
      console.log(`🗑️ Gesamter Settings-Cache gelöscht`);
    }
  }

  // MODUL-VERWALTUNG
  async listModules() {
    try {
      const files = fs.readdirSync(this.settingsPath);
      const modules = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
      
      return modules;
    } catch (error) {
      console.error('❌ Fehler beim Auflisten der Module:', error);
      return [];
    }
  }

  // VALIDIERUNG
  validateSettings(module, settings) {
    // Basis-Validierung
    if (!settings || typeof settings !== 'object') {
      return { valid: false, error: 'Settings müssen ein Objekt sein' };
    }

    // Modul-spezifische Validierung
    switch (module) {
      case 'ticket-system':
        return this.validateTicketSettings(settings);
      case 'server-stats':
        return this.validateServerStatsSettings(settings);
      default:
        return { valid: true };
    }
  }

  validateTicketSettings(settings) {
    const required = ['enabled', 'embed', 'buttons'];
    for (const field of required) {
      if (!settings.hasOwnProperty(field)) {
        return { valid: false, error: `Pflichtfeld fehlt: ${field}` };
      }
    }

    if (!Array.isArray(settings.buttons)) {
      return { valid: false, error: 'Buttons muss ein Array sein' };
    }

    if (!settings.embed || !settings.embed.color) {
      return { valid: false, error: 'Embed-Einstellungen unvollständig' };
    }

    return { valid: true };
  }

  validateServerStatsSettings(settings) {
    const required = ['enabled', 'channels'];
    for (const field of required) {
      if (!settings.hasOwnProperty(field)) {
        return { valid: false, error: `Pflichtfeld fehlt: ${field}` };
      }
    }

    if (!settings.channels || typeof settings.channels !== 'object') {
      return { valid: false, error: 'Channels muss ein Objekt sein' };
    }

    return { valid: true };
  }
}

// Singleton-Instanz
const settingsManager = new SettingsManager();

module.exports = settingsManager; 