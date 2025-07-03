-- =============================================
-- TWITCH SYSTEM CORRECTED CLEANUP
-- Berücksichtigt die tatsächlich verwendeten Tabellen
-- =============================================

-- WICHTIGE ERKENNTNIS:
-- Die twitch-supabase-api.js verwendet ANDERE Tabellennamen als die Migration!
-- API verwendet: twitch_settings + twitch_streamers
-- Migration erstellt: twitch_live_notifications + twitch_monitored_streamers

-- SCHRITT 1: BACKUP DER RICHTIGEN DATEN
-- =============================================

-- Backup von twitch_settings (API verwendet das!)
CREATE TABLE IF NOT EXISTS twitch_backup_settings AS 
SELECT * FROM twitch_settings WHERE id > 0;

-- Backup von twitch_streamers (API verwendet das!)
CREATE TABLE IF NOT EXISTS twitch_backup_streamers AS 
SELECT * FROM twitch_streamers WHERE id > 0;

-- Backup von monitored_streamers (falls Migration-Daten vorhanden)
CREATE TABLE IF NOT EXISTS twitch_backup_monitored_streamers AS 
SELECT * FROM twitch_monitored_streamers WHERE id > 0;

-- Backup von live_notifications (falls Migration-Daten vorhanden)
CREATE TABLE IF NOT EXISTS twitch_backup_live_notifications AS 
SELECT * FROM twitch_live_notifications WHERE id > 0;

-- SCHRITT 2: ALLE ÜBERFLÜSSIGEN TABELLEN LÖSCHEN
-- =============================================

-- Alte/Doppelte Chat Bot Tabellen
DROP TABLE IF EXISTS twitch_bot_auto_voice CASCADE;
DROP TABLE IF EXISTS twitch_bot_moderators CASCADE;
DROP TABLE IF EXISTS twitch_bot_stats CASCADE;
DROP TABLE IF EXISTS twitch_bot_status CASCADE;
DROP TABLE IF EXISTS twitch_bot_moderation CASCADE;

-- Doppelte Channel Tabellen
DROP TABLE IF EXISTS twitch_channels CASCADE;

-- Ungenutzte Log Tabellen
DROP TABLE IF EXISTS twitch_chat_logs CASCADE;
DROP TABLE IF EXISTS twitch_command_logs CASCADE;
DROP TABLE IF EXISTS twitch_command_stats CASCADE;
DROP TABLE IF EXISTS twitch_moderation_actions CASCADE;
DROP TABLE IF EXISTS twitch_moderation_logs CASCADE;

-- Doppelte Command Tabellen
DROP TABLE IF EXISTS twitch_commands CASCADE;

-- Temporäre/Cache Tabellen
DROP TABLE IF EXISTS twitch_live_data CASCADE;
DROP TABLE IF EXISTS twitch_active_streamers CASCADE;

-- Doppelte Stats Tabellen
DROP TABLE IF EXISTS twitch_statistics CASCADE;
DROP TABLE IF EXISTS twitch_stats CASCADE;

-- Ungenutzte User Tabellen
DROP TABLE IF EXISTS twitch_users CASCADE;

-- MIGRATIONS-TABELLEN LÖSCHEN (da API andere Namen verwendet)
-- Diese wurden von der Migration erstellt, aber API nutzt andere Namen!
DROP TABLE IF EXISTS twitch_live_notifications CASCADE;
DROP TABLE IF EXISTS twitch_monitored_streamers CASCADE;

-- SCHRITT 3: VIEWS UND FUNCTIONS BEREINIGEN
-- =============================================

-- Alte Views löschen
DROP VIEW IF EXISTS twitch_bot_stats_summary CASCADE;
DROP VIEW IF EXISTS twitch_monitored_streamers_status CASCADE;
DROP VIEW IF EXISTS twitch_bot_active_channels CASCADE;

-- SCHRITT 4: TABELLEN ERSTELLEN DIE API WIRKLICH BRAUCHT
-- =============================================

-- twitch_settings Tabelle (wird von twitch-supabase-api.js verwendet!)
CREATE TABLE IF NOT EXISTS twitch_settings (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    enabled BOOLEAN DEFAULT true,
    check_interval INTEGER DEFAULT 5,
    notification_channel TEXT DEFAULT 'live-streams',
    role_to_mention TEXT DEFAULT '',
    mention_everyone BOOLEAN DEFAULT false,
    embed_color TEXT DEFAULT '0x9146FF',
    show_thumbnail BOOLEAN DEFAULT true,
    show_viewer_count BOOLEAN DEFAULT true,
    show_category BOOLEAN DEFAULT true,
    show_uptime BOOLEAN DEFAULT true,
    custom_message TEXT DEFAULT '🔴 **{{streamer}}** ist jetzt LIVE!',
    include_emojis BOOLEAN DEFAULT true,
    custom_emojis JSONB DEFAULT '["🎮", "🔥", "💜", "⭐", "🚀"]'::jsonb,
    only_first_time BOOLEAN DEFAULT false,
    cooldown INTEGER DEFAULT 30,
    offline_notification BOOLEAN DEFAULT false,
    stream_ended_message TEXT DEFAULT '📴 **{{streamer}}** hat den Stream beendet!',
    min_viewers INTEGER DEFAULT 0,
    allowed_categories JSONB DEFAULT '[]'::jsonb,
    blocked_categories JSONB DEFAULT '[]'::jsonb,
    only_followers BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id)
);

-- twitch_streamers Tabelle (wird von twitch-supabase-api.js verwendet!)
CREATE TABLE IF NOT EXISTS twitch_streamers (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    username TEXT NOT NULL,
    display_name TEXT DEFAULT '',
    custom_message TEXT DEFAULT '',
    enabled BOOLEAN DEFAULT true,
    live_notifications BOOLEAN DEFAULT true,
    offline_notifications BOOLEAN DEFAULT false,
    last_live TIMESTAMP WITH TIME ZONE NULL,
    total_notifications INTEGER DEFAULT 0,
    current_stream_id TEXT DEFAULT '',
    last_notification TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id, username)
);

-- SCHRITT 5: RLS UND POLICIES
-- =============================================

-- RLS aktivieren
ALTER TABLE twitch_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_streamers ENABLE ROW LEVEL SECURITY;

-- Chat Bot Tabellen (falls sie existieren)
ALTER TABLE twitch_bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_events ENABLE ROW LEVEL SECURITY;

-- Policies erstellen
DROP POLICY IF EXISTS "Allow all on twitch_settings" ON twitch_settings;
CREATE POLICY "Allow all on twitch_settings" ON twitch_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on twitch_streamers" ON twitch_streamers;
CREATE POLICY "Allow all on twitch_streamers" ON twitch_streamers FOR ALL USING (true);

-- Bot Policies (falls Tabellen existieren)
DROP POLICY IF EXISTS "Allow all on twitch_bot_settings" ON twitch_bot_settings;
CREATE POLICY "Allow all on twitch_bot_settings" ON twitch_bot_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on twitch_bot_channels" ON twitch_bot_channels;
CREATE POLICY "Allow all on twitch_bot_channels" ON twitch_bot_channels FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on twitch_bot_commands" ON twitch_bot_commands;
CREATE POLICY "Allow all on twitch_bot_commands" ON twitch_bot_commands FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on twitch_bot_events" ON twitch_bot_events;
CREATE POLICY "Allow all on twitch_bot_events" ON twitch_bot_events FOR ALL USING (true);

-- SCHRITT 6: DEFAULT DATEN WIEDERHERSTELLEN
-- =============================================

-- Default Twitch Settings erstellen
INSERT INTO twitch_settings (guild_id) 
VALUES ('default') 
ON CONFLICT (guild_id) DO NOTHING;

-- SCHRITT 7: ERFOLGSMELDUNG
-- =============================================

SELECT 'TWITCH CLEANUP CORRECTED COMPLETED!' as status,
       'Überflüssige Tabellen entfernt - Korrekte API-Tabellen erstellt' as action,
       'Live Notifications: twitch_settings + twitch_streamers' as live_system,
       'Chat Bot: twitch_bot_* Tabellen' as bot_system;

-- SCHRITT 8: FINALE TABELLEN ANZEIGEN
-- =============================================

SELECT 
    table_name,
    CASE 
        WHEN table_name LIKE 'twitch_bot_%' THEN '🤖 Chat Bot System'
        WHEN table_name IN ('twitch_settings', 'twitch_streamers') THEN '📺 Live Notifications (API)'
        WHEN table_name LIKE 'twitch_backup_%' THEN '💾 Backup'
        ELSE '❓ Unbekannt'
    END as system_type,
    CASE
        WHEN table_name IN ('twitch_settings', 'twitch_streamers') THEN '✅ Von API verwendet'
        WHEN table_name LIKE 'twitch_bot_%' THEN '✅ Bot System'
        WHEN table_name LIKE 'twitch_backup_%' THEN '💾 Sicherung'
        ELSE '❌ Prüfen'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'twitch%'
ORDER BY system_type, table_name; 