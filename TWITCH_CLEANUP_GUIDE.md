# 🧹 TWITCH SYSTEM CLEANUP GUIDE

## 🔍 **Aktueller Zustand - Das Problem:**

In Supabase sind sehr viele Twitch-Tabellen die sich überschneiden und teilweise doppelt/überflüssig sind.

## 📋 **2 Verschiedene Twitch-Systeme identifiziert:**

### **System 1: Twitch Live Notifications** 📺
- **Zweck**: Benachrichtigungen wenn Streamer live gehen
- **Frontend**: `dashboard/src/pages/TwitchNotifications.tsx`
- **Backend**: `twitch-api.js` + `twitch-system.js` + `twitch-supabase-api.js`
- **Verwendete APIs**: `/api/twitch/*`

### **System 2: Twitch Chat Bot** 🤖
- **Zweck**: Echter Chat-Bot der sich mit Twitch verbindet
- **Frontend**: `dashboard/src/pages/TwitchBot.tsx`
- **Backend**: `twitch-chat-bot.js` + `twitch-bot-supabase-api.js`
- **Verwendete APIs**: `/api/twitch-bot/*`

---

## 🗑️ **BENÖTIGTE TABELLEN (BEHALTEN):**

### **Für Live Notifications System:**
✅ `twitch_live_notifications` - Live-Benachrichtigungs-Einstellungen
✅ `twitch_monitored_streamers` - Liste der überwachten Streamer
✅ `twitch_settings` - Grundeinstellungen (falls vorhanden)

### **Für Chat Bot System:**
✅ `twitch_bot_settings` - Bot-Grundeinstellungen
✅ `twitch_bot_channels` - Bot Channel-Management
✅ `twitch_bot_commands` - Bot Commands (falls implementiert)
✅ `twitch_bot_events` - Bot Event-Logging

---

## ❌ **ÜBERFLÜSSIGE TABELLEN (LÖSCHEN):**

### **Doppelte/Ungenutzte Tabellen:**
❌ `twitch_active_streamers` - ?
❌ `twitch_bot_auto_voice` - ?
❌ `twitch_bot_moderators` - Alt, nicht verwendet
❌ `twitch_bot_stats` - Doppelt zu Events
❌ `twitch_bot_stats_summary` - View, nicht nötig
❌ `twitch_bot_status` - ?
❌ `twitch_channels` - Doppelt
❌ `twitch_chat_logs` - Nicht verwendet
❌ `twitch_command_logs` - Doppelt zu Events
❌ `twitch_command_stats` - Nicht verwendet
❌ `twitch_commands` - Doppelt zu bot_commands
❌ `twitch_live_data` - Temporäre Daten
❌ `twitch_moderation_actions` - Nicht implementiert
❌ `twitch_moderation_logs` - Nicht implementiert
❌ `twitch_statistics` - Doppelt
❌ `twitch_stats` - Doppelt
❌ `twitch_streamers` - Doppelt zu monitored_streamers
❌ `twitch_users` - Nicht verwendet

---

## 🎯 **CLEANUP AKTION:**

### **Schritt 1: Backup der wichtigen Daten**
```sql
-- Backup wichtiger Daten falls vorhanden
CREATE TABLE twitch_backup_important AS 
SELECT * FROM twitch_monitored_streamers WHERE id > 0;
```

### **Schritt 2: Aufräumen**
```sql
-- Alle überflüssigen Tabellen löschen
DROP TABLE IF EXISTS twitch_active_streamers CASCADE;
DROP TABLE IF EXISTS twitch_bot_auto_voice CASCADE;
DROP TABLE IF EXISTS twitch_bot_moderators CASCADE;
DROP TABLE IF EXISTS twitch_bot_stats CASCADE;
DROP TABLE IF EXISTS twitch_bot_status CASCADE;
DROP TABLE IF EXISTS twitch_channels CASCADE;
DROP TABLE IF EXISTS twitch_chat_logs CASCADE;
DROP TABLE IF EXISTS twitch_command_logs CASCADE;
DROP TABLE IF EXISTS twitch_command_stats CASCADE;
DROP TABLE IF EXISTS twitch_commands CASCADE;
DROP TABLE IF EXISTS twitch_live_data CASCADE;
DROP TABLE IF EXISTS twitch_moderation_actions CASCADE;
DROP TABLE IF EXISTS twitch_moderation_logs CASCADE;
DROP TABLE IF EXISTS twitch_statistics CASCADE;
DROP TABLE IF EXISTS twitch_stats CASCADE;
DROP TABLE IF EXISTS twitch_streamers CASCADE;
DROP TABLE IF EXISTS twitch_users CASCADE;

-- Views löschen
DROP VIEW IF EXISTS twitch_bot_stats_summary CASCADE;
DROP VIEW IF EXISTS twitch_monitored_streamers_status CASCADE;
```

### **Schritt 3: Nur benötigte Tabellen behalten**

**Live Notifications:**
- `twitch_live_notifications`
- `twitch_monitored_streamers`

**Chat Bot:**
- `twitch_bot_settings`
- `twitch_bot_channels`
- `twitch_bot_commands`
- `twitch_bot_events`

---

## 🔧 **FINALES ERGEBNIS:**

Nach dem Cleanup:
- ✅ 6 saubere, organisierte Tabellen
- ✅ Keine Duplikate
- ✅ Beide Systeme funktionsfähig
- ✅ Übersichtliche Struktur

---

## ⚡ **NÄCHSTE SCHRITTE:**

1. **Cleanup-Script in Supabase ausführen**
2. **Funktionstests beider Systeme**
3. **Update der API-Calls falls nötig**
4. **Dokumentation aktualisieren**

**Geschätzte Zeit:** 10-15 Minuten
**Risiko:** Gering (Backups vorhanden) 