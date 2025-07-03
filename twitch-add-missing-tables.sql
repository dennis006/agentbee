-- Twitch System - Nur fehlende Tabellen hinzufügen
-- ACHTUNG: Löscht KEINE bestehenden Tabellen!
-- Datum: 2025

-- =============================================
-- TWITCH LIVE NOTIFICATIONS (Settings)
-- =============================================
CREATE TABLE IF NOT EXISTS twitch_live_notifications (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id)
);

-- =============================================
-- TWITCH MONITORED STREAMERS
-- =============================================
CREATE TABLE IF NOT EXISTS twitch_monitored_streamers (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    custom_message TEXT DEFAULT '',
    enabled BOOLEAN DEFAULT true,
    live_notifications BOOLEAN DEFAULT true,
    offline_notifications BOOLEAN DEFAULT false,
    last_live TIMESTAMP WITH TIME ZONE NULL,
    total_notifications INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id, username)
);

-- =============================================
-- TWITCH BOT EVENTS (für Live-Status)
-- =============================================
CREATE TABLE IF NOT EXISTS twitch_bot_events (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    event_type TEXT NOT NULL, -- stream_live, stream_ended, etc.
    username TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TWITCH BOT SETTINGS TABLE EXTENSION
-- Self-Monitoring System Columns
-- =============================================

-- Prüfe ob twitch_bot_settings Tabelle existiert und erweitere sie
DO $$ 
BEGIN
    -- Füge Self-Monitoring Spalten hinzu falls sie nicht existieren
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitch_bot_settings' AND column_name = 'self_monitoring_enabled'
    ) THEN
        ALTER TABLE twitch_bot_settings 
        ADD COLUMN self_monitoring_enabled BOOLEAN DEFAULT FALSE,
        ADD COLUMN twitch_client_id VARCHAR(255) DEFAULT '',
        ADD COLUMN twitch_client_secret VARCHAR(255) DEFAULT '';
        
        RAISE NOTICE 'Self-Monitoring Spalten zu twitch_bot_settings hinzugefügt';
    ELSE
        RAISE NOTICE 'Self-Monitoring Spalten existieren bereits in twitch_bot_settings';
    END IF;
END $$;

-- =============================================
-- RLS (Row Level Security) POLICIES
-- =============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'twitch_live_notifications'
    ) THEN
        ALTER TABLE twitch_live_notifications ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow all operations on twitch_live_notifications" ON twitch_live_notifications FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'twitch_monitored_streamers'
    ) THEN
        ALTER TABLE twitch_monitored_streamers ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow all operations on twitch_monitored_streamers" ON twitch_monitored_streamers FOR ALL USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'twitch_bot_events'
    ) THEN
        ALTER TABLE twitch_bot_events ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow all operations on twitch_bot_events" ON twitch_bot_events FOR ALL USING (true);
    END IF;
END $$;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_twitch_monitored_streamers_guild_enabled ON twitch_monitored_streamers(guild_id, enabled);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_events_type_date ON twitch_bot_events(event_type, created_at);

-- =============================================
-- UPDATE TIMESTAMP TRIGGER (nur wenn nicht existiert)
-- =============================================
CREATE OR REPLACE FUNCTION update_twitch_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger nur erstellen wenn sie nicht existieren
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_twitch_live_notifications_updated_at') THEN
        CREATE TRIGGER update_twitch_live_notifications_updated_at BEFORE UPDATE ON twitch_live_notifications 
            FOR EACH ROW EXECUTE FUNCTION update_twitch_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_twitch_monitored_streamers_updated_at') THEN
        CREATE TRIGGER update_twitch_monitored_streamers_updated_at BEFORE UPDATE ON twitch_monitored_streamers 
            FOR EACH ROW EXECUTE FUNCTION update_twitch_updated_at_column();
    END IF;
END $$;

-- =============================================
-- DEFAULT DATA INSERTION
-- =============================================
INSERT INTO twitch_live_notifications (guild_id) 
VALUES ('default') 
ON CONFLICT (guild_id) DO NOTHING;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT 'Fehlende Twitch Tabellen erfolgreich hinzugefügt! ✅' as status,
       'Bestehende Tabellen blieben unverändert 🔒' as safety,
       'Neu hinzugefügt: twitch_live_notifications, twitch_monitored_streamers, twitch_bot_events' as added_tables,
       'Live Message System ist jetzt vollständig! 🔴' as ready; 