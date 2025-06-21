# 🔄 Server Stats System - Supabase Migration Guide

## 📋 Übersicht
Komplette Migration des Server Stats Systems von JSON-Dateien zu Supabase Datenbank.

---

## ✅ Schritt 1: Supabase Setup

### 1.1 SQL-Datei importieren
```sql
-- Führe diese SQL-Datei in Supabase aus:
server_stats_supabase_migration.sql
```

### 1.2 Environment Variables hinzufügen
```env
# .env Datei erweitern:
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GUILD_ID=your_discord_guild_id
```

### 1.3 Dependencies installieren
```bash
npm install @supabase/supabase-js
```

---

## 🔧 Schritt 2: Code-Änderungen

### 2.1 index.js anpassen
```javascript
// ALT:
const serverStatsApi = require('./server-stats-api.js');

// NEU:
const serverStatsApi = require('./supabase-server-stats.js');
```

### 2.2 Express Routes (bereits angepasst)
✅ `server-stats-routes.js` nutzt jetzt `supabase-server-stats.js`

---

## 🗑️ Schritt 3: Dateien löschen

### Können nach erfolgreicher Migration gelöscht werden:

#### ❌ Haupt-API (ersetzt)
- `server-stats-api.js` → Ersetzt durch `supabase-server-stats.js`

#### ❌ JSON-Konfigurationsdateien
- `settings/server-stats.json` → Daten jetzt in Supabase
- `settings-backup/server-stats-backup.json` → Nicht mehr benötigt

#### ❌ Weitere JSON-Dateien (falls vorhanden)
- `server-stats-settings.json` → Ersetzt durch Supabase
- Alle anderen `*server-stats*.json` Dateien

### ✅ Behalten und angepasst:
- `supabase-server-stats.js` → **Neue Haupt-API**
- `server-stats-routes.js` → **Angepasst für Supabase**
- `dashboard/src/pages/ServerStats.tsx` → **Funktioniert weiterhin**

---

## 📊 Schritt 4: Daten-Migration

### 4.1 Bestehende Konfiguration migrieren
Wenn du bereits eine `settings/server-stats.json` hast:

```javascript
// Einmalig ausführen - Beispiel-Script:
const fs = require('fs');
const ServerStatsSupabase = require('./supabase-server-stats');

async function migrateExistingConfig() {
  try {
    // Lade alte JSON-Konfiguration
    const oldConfig = JSON.parse(fs.readFileSync('./settings/server-stats.json', 'utf8'));
    
    // Initialisiere Supabase
    await ServerStatsSupabase.initializeSupabase();
    
    // Speichere in Supabase
    const success = await ServerStatsSupabase.saveServerStatsSettings(oldConfig, process.env.GUILD_ID);
    
    if (success) {
      console.log('✅ Migration erfolgreich!');
      console.log('⚠️ Du kannst jetzt die JSON-Dateien löschen.');
    } else {
      console.log('❌ Migration fehlgeschlagen!');
    }
  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error);
  }
}

// migrateExistingConfig();
```

### 4.2 Standard-Konfiguration (falls keine vorhanden)
```javascript
// Wird automatisch erstellt beim ersten Aufruf:
await ServerStatsSupabase.initializeDefaultServerStats(guildId);
```

---

## 🔄 Schritt 5: System testen

### 5.1 Dashboard testen
1. Starte den Bot: `npm start`
2. Öffne Dashboard: `http://localhost:3000`
3. Gehe zu Server Stats
4. Teste die Funktionen:
   - Konfiguration laden ✅
   - Konfiguration speichern ✅
   - Timer-Status anzeigen ✅
   - Aktuelle Stats anzeigen ✅
   - Manuelles Update ✅

### 5.2 Bot-Funktionen testen
```javascript
// Im Bot-Code testen:
const stats = await ServerStatsSupabase.getCurrentStats(guildId);
console.log('Current Stats:', stats);

const timerStatus = await ServerStatsSupabase.getTimerStatus(guildId);
console.log('Timer Status:', timerStatus);
```

---

## ⚠️ Schritt 6: Cleanup

### Nach erfolgreicher Migration löschen:

```bash
# Sichere die alten Dateien erst (optional):
mkdir backup_json_files
mv settings/server-stats.json backup_json_files/
mv settings-backup/server-stats-backup.json backup_json_files/
mv server-stats-api.js backup_json_files/

# Oder lösche direkt:
rm settings/server-stats.json
rm settings-backup/server-stats-backup.json
rm server-stats-api.js
```

---

## 🚀 Vorteile nach Migration

### ✅ Verbesserungen:
- 🗄️ **Keine JSON-Dateien mehr** - Alles in Supabase
- 📊 **Performance-optimiert** - Datenbankindizes
- 📝 **Activity-Logging** - Vollständige Nachverfolgung
- 🔄 **Bessere Timer-Synchronisation** - Real-time Updates
- 📈 **Historische Daten** - Analytics möglich
- 🔒 **Automatische Backups** - Durch Supabase
- 🌐 **Skalierbar** - Multi-Server Support

### 🆕 Neue Features:
- Timer-Progress-Bar im Dashboard
- Activity-Log für alle Änderungen
- Historische Stats-Daten
- Performance-Metriken
- Erweiterte Analytics (zukünftig)

---

## 🔧 Funktionen noch in Entwicklung

Einige Legacy-Funktionen sind noch nicht in der neuen Supabase API implementiert:

### ⏳ TODO:
- `validateAndRepairStatsChannels()` 
- `cleanupDuplicateStatsChannels()`
- `completeStatsChannelReset()`
- `createAllStatsChannels()`
- `deleteAllStatsChannels()`

Diese Funktionen haben temporäre Placeholder in den Routes und loggen Activities in Supabase.

---

## 📞 Support

Bei Problemen:
1. Prüfe Supabase-Verbindung
2. Prüfe Environment Variables
3. Prüfe Bot-Logs für Fehler
4. Prüfe Dashboard Network-Tab für API-Errors

**Migration erfolgreich! 🎉** 