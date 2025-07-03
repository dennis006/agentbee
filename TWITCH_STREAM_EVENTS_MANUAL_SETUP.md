# 🎯 Twitch Stream Events Manual Setup Guide

## Problem
Die Stream Events Tabellen fehlen in Supabase, daher sind die Einstellungen leer.

## Lösung
Das SQL-Migration-Script manuell in Supabase ausführen.

## Schritt-für-Schritt Anleitung

### 1. Supabase Dashboard öffnen
1. Gehe zu [supabase.com](https://supabase.com)
2. Logge dich in dein Konto ein
3. Öffne dein Discord Bot Projekt

### 2. SQL Editor öffnen
1. Klicke im linken Menü auf **"SQL Editor"**
2. Klicke auf **"New Query"**

### 3. Migration SQL kopieren
Kopiere den kompletten Inhalt aus der Datei `twitch_bot_stream_events_simple_migration.sql`:

```sql
-- =============================================
-- TWITCH BOT STREAM EVENTS - SIMPLE MIGRATION
-- Nur die essentiellen Stream Events Tabellen
-- =============================================

-- Stream Events Settings Tabelle
CREATE TABLE IF NOT EXISTS twitch_bot_stream_events (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    
    -- Stream Start Settings
    stream_start_enabled BOOLEAN DEFAULT false,
    stream_start_message TEXT DEFAULT '🔴 Stream startet! Lasst uns Spaß haben! 🎮',
    stream_start_delay INTEGER DEFAULT 30, -- Sekunden Verzögerung
    
    -- Stream End Settings
    stream_end_enabled BOOLEAN DEFAULT false,
    stream_end_message TEXT DEFAULT '📴 Stream beendet! Danke fürs Zuschauen! ❤️',
    
    -- Raid Messages
    raid_message_enabled BOOLEAN DEFAULT false,
    raid_message TEXT DEFAULT '⚡ Raid incoming! Willkommen {raiders}! 🎉',
    
    -- Follow Messages
    follow_message_enabled BOOLEAN DEFAULT false,
    follow_message TEXT DEFAULT '💜 Danke für den Follow {username}! 🙏',
    
    -- Subscription Messages
    sub_message_enabled BOOLEAN DEFAULT false,
    sub_message TEXT DEFAULT '🎉 {username} ist jetzt Subscriber! Willkommen in der Familie! 👑',
    
    -- Donation Messages
    donation_message_enabled BOOLEAN DEFAULT false,
    donation_message TEXT DEFAULT '💰 Wow! {username} hat {amount} gespendet! Vielen Dank! 🙏',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint für unique guild_id
    UNIQUE(guild_id)
);

-- Events History Tabelle (falls noch nicht existiert)
CREATE TABLE IF NOT EXISTS twitch_bot_events (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    event_type TEXT NOT NULL, -- 'stream_start_manual', 'stream_end_manual', etc.
    event_data JSONB DEFAULT '{}', -- Flexible Event-Daten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FÜR PERFORMANCE
-- =============================================

-- Stream Events
CREATE INDEX IF NOT EXISTS idx_twitch_bot_stream_events_guild_id ON twitch_bot_stream_events(guild_id);

-- Events History (falls neue Tabelle)
CREATE INDEX IF NOT EXISTS idx_twitch_bot_events_guild_id ON twitch_bot_events(guild_id);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_events_type ON twitch_bot_events(event_type);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_events_created_at ON twitch_bot_events(created_at DESC);

-- =============================================
-- RLS POLICIES (Row Level Security)
-- =============================================

-- Enable RLS (safe execution)
DO $$
BEGIN
    BEGIN
        ALTER TABLE twitch_bot_stream_events ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL; -- Ignore if already enabled
    END;
    
    BEGIN
        ALTER TABLE twitch_bot_events ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL; -- Ignore if already enabled
    END;
END $$;

-- Create Policies (drop first if they exist)
DROP POLICY IF EXISTS "Allow all operations on twitch_bot_stream_events" ON twitch_bot_stream_events;
CREATE POLICY "Allow all operations on twitch_bot_stream_events" ON twitch_bot_stream_events FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on twitch_bot_events" ON twitch_bot_events;
CREATE POLICY "Allow all operations on twitch_bot_events" ON twitch_bot_events FOR ALL USING (true);

-- =============================================
-- INITIAL DATA
-- =============================================

-- Standard Stream Events Einstellungen
INSERT INTO twitch_bot_stream_events (guild_id, stream_start_enabled, stream_start_message, stream_start_delay)
VALUES ('default', false, '🔴 Stream startet! Lasst uns Spaß haben! 🎮', 30)
ON CONFLICT (guild_id) DO NOTHING;

-- =============================================
-- KOMMENTARE
-- =============================================

COMMENT ON TABLE twitch_bot_stream_events IS 'Einstellungen für automatische Stream-Start/Ende Nachrichten und Events';
COMMENT ON TABLE twitch_bot_events IS 'Historie aller Bot-Events für Logging und Statistiken';
```

### 4. SQL Script ausführen
1. Füge das kopierte SQL in den SQL Editor ein
2. Klicke auf **"RUN"** (oder Strg+Enter)
3. Warte bis die Ausführung abgeschlossen ist

### 5. Erfolg überprüfen
Nach der Ausführung solltest du sehen:
- ✅ `twitch_bot_stream_events` Tabelle erstellt
- ✅ `twitch_bot_events` Tabelle erstellt
- ✅ Indexes erstellt
- ✅ RLS Policies aktiviert
- ✅ Standard-Daten eingefügt

### 6. Bot Dashboard aktualisieren
1. Gehe zurück zu deinem Discord Bot Dashboard
2. Öffne den **Twitch Bot Tab**
3. Klicke auf **"Stream Events"**
4. Die Einstellungen sollten jetzt sichtbar sein!

## Erwartete Ergebnisse

### Stream Events Tab
- ✅ Stream Start Einstellungen
- ✅ Stream End Einstellungen
- ✅ Raid Messages
- ✅ Follow Messages
- ✅ Subscription Messages
- ✅ Donation Messages

### Channel Management Tab
- ✅ Multi-Channel Verwaltung verfügbar nach Migration

## Troubleshooting

### Falls Fehler auftreten:
1. **"relation already exists"** - Ignorieren, die Tabelle ist bereits vorhanden
2. **"permission denied"** - Prüfe ob du Owner/Admin-Rechte im Supabase Projekt hast
3. **"syntax error"** - Prüfe ob das komplette SQL kopiert wurde

### Falls Einstellungen immer noch leer:
1. Überprüfe in Supabase Table Editor:
   - Tabelle `twitch_bot_stream_events` existiert
   - Mindestens ein Eintrag mit `guild_id = 'default'`
2. Bot neu starten (falls lokal)
3. Dashboard-Seite neu laden

## Support
Falls Probleme auftreten, überprüfe:
- Supabase Projektverbindung
- Browser-Konsole für Fehler
- Netzwerkverbindung

---
**Nach der Migration sind alle Stream Events Features verfügbar!** 🎉 