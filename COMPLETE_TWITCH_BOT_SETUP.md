# 🚀 Complete Twitch Bot Setup Guide

## Problem Übersicht
Sowohl **Channel Management** als auch **Stream Events** Tabs sind leer, weil die entsprechenden Supabase-Tabellen fehlen.

## Lösung
Beide Migration-Scripts in der richtigen Reihenfolge ausführen.

---

## Migration 1: Basis Twitch System (Channel Management)

### Schritt 1: Basis Migration
1. Gehe zu **Supabase Dashboard → SQL Editor**
2. Erstelle neue Query
3. Kopiere **KOMPLETTEN** Inhalt aus `twitch_system_supabase_migration.sql`
4. Führe aus (RUN)

### Was wird erstellt:
- ✅ `twitch_bot_settings` - Bot Grundeinstellungen
- ✅ `twitch_bot_channels` - **Channel Management** 
- ✅ `twitch_bot_commands` - Custom Commands
- ✅ `twitch_bot_moderation` - Moderation Settings
- ✅ `twitch_live_notifications` - Live Benachrichtigungen
- ✅ `twitch_monitored_streamers` - Überwachte Streamer
- ✅ `twitch_bot_events` - Event History
- ✅ `twitch_bot_stats` - Statistiken

---

## Migration 2: Stream Events (neu)

### Schritt 2: Stream Events Migration
1. **NACH** der ersten Migration
2. Neue Query in SQL Editor
3. Kopiere Inhalt aus `twitch_bot_stream_events_simple_migration.sql`
4. Führe aus (RUN)

### Was wird erstellt:
- ✅ `twitch_bot_stream_events` - **Stream Events** Einstellungen
- ✅ Zusätzliche Event-Handler

---

## SQL Scripts zum Kopieren

### Script 1: Basis System
```sql
-- Kopiere KOMPLETT aus: twitch_system_supabase_migration.sql
-- (Zu lang für hier, verwende die originale Datei)
```

### Script 2: Stream Events
```sql
-- Kopiere aus: twitch_bot_stream_events_simple_migration.sql
-- (Bereits im TWITCH_STREAM_EVENTS_MANUAL_SETUP.md Guide)
```

---

## Reihenfolge beachten!

### ✅ Richtige Reihenfolge:
1. **Erst**: `twitch_system_supabase_migration.sql`
2. **Dann**: `twitch_bot_stream_events_simple_migration.sql`

### ❌ Falsche Reihenfolge:
- Stream Events zuerst kann Konflikte verursachen

---

## Nach der Migration

### 1. Dashboard aktualisieren
- Bot Dashboard neu laden
- Hard-Refresh (Strg+F5)

### 2. Erwartete Ergebnisse

#### Twitch Bot Tab → Channel Management:
- ✅ Twitch Channels hinzufügen/entfernen
- ✅ Channel-spezifische Einstellungen
- ✅ Discord Integration
- ✅ Auto-Join Einstellungen
- ✅ Custom Messages pro Channel

#### Twitch Bot Tab → Stream Events:
- ✅ Stream Start/End Messages
- ✅ Raid Messages
- ✅ Follow Messages  
- ✅ Subscription Messages
- ✅ Donation Messages
- ✅ Event History

#### Twitch Bot Tab → Bot Einstellungen:
- ✅ Bot Credentials
- ✅ Global Settings
- ✅ Moderation Settings

---

## Troubleshooting

### "Channel Management" immer noch leer:
1. Prüfe ob `twitch_bot_channels` Tabelle existiert
2. Prüfe RLS Policies sind aktiv
3. Browser-Konsole auf API-Fehler prüfen

### "Stream Events" immer noch leer:
1. Prüfe ob `twitch_bot_stream_events` Tabelle existiert
2. Mindestens ein Eintrag mit `guild_id = 'default'` muss vorhanden sein

### Beide Tabs leer:
1. Supabase-Verbindung prüfen (Credentials)
2. Alle Scripts ausgeführt?
3. Browser-Cache leeren

### SQL Fehler während Migration:
- **"already exists"** → Ignorieren (normal)
- **"permission denied"** → Admin-Rechte prüfen
- **"syntax error"** → Komplettes Script kopiert?

---

## Erweiterte Features (optional)

Nach erfolgreicher Migration sind verfügbar:

### Multi-Channel Support:
- Mehrere Twitch Channels gleichzeitig überwachen
- Channel-spezifische Einstellungen
- Separate Discord-Integration pro Channel

### Advanced Stream Events:
- Automatische Stream Start/End Detection
- Customizable Event Messages
- Event History & Analytics
- Discord Role Mentions

### Bot Moderation:
- Spam Protection
- Word Filters
- Auto-Timeouts
- Caps Protection

---

## Support Kontakt

Bei Problemen überprüfe:
1. ✅ Beide Migrations ausgeführt
2. ✅ Richtige Reihenfolge eingehalten  
3. ✅ Supabase-Verbindung funktioniert
4. ✅ Browser-Cache geleert

**Nach beiden Migrations ist der komplette Twitch Bot funktionsbereit!** 🎉 