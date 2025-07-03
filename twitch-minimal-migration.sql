-- Minimale Twitch System Migration - Nur benötigte Tabellen
-- Datum: 2025 - Optimiert für Live Messages

-- =============================================
-- CLEANUP: Drop tables if they exist
-- =============================================
DROP TABLE IF EXISTS twitch_monitored_streamers CASCADE;
DROP TABLE IF EXISTS twitch_live_notifications CASCADE;
DROP TABLE IF EXISTS twitch_bot_events CASCADE;

-- =============================================
-- TWITCH LIVE NOTIFICATIONS (Settings)
-- =============================================
CREATE TABLE twitch_live_notifications (
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
CREATE TABLE twitch_monitored_streamers (
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
CREATE TABLE twitch_bot_events (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    event_type TEXT NOT NULL, -- stream_live, stream_ended, etc.
    username TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- RLS (Row Level Security) POLICIES
-- =============================================
ALTER TABLE twitch_live_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_monitored_streamers ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on twitch_live_notifications" ON twitch_live_notifications FOR ALL USING (true);
CREATE POLICY "Allow all operations on twitch_monitored_streamers" ON twitch_monitored_streamers FOR ALL USING (true);
CREATE POLICY "Allow all operations on twitch_bot_events" ON twitch_bot_events FOR ALL USING (true);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_twitch_monitored_streamers_guild_enabled ON twitch_monitored_streamers(guild_id, enabled);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_events_type_date ON twitch_bot_events(event_type, created_at);

-- =============================================
-- UPDATE TIMESTAMP TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_twitch_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_twitch_live_notifications_updated_at BEFORE UPDATE ON twitch_live_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_twitch_updated_at_column();

CREATE TRIGGER update_twitch_monitored_streamers_updated_at BEFORE UPDATE ON twitch_monitored_streamers 
    FOR EACH ROW EXECUTE FUNCTION update_twitch_updated_at_column();

-- =============================================
-- DEFAULT DATA INSERTION
-- =============================================
INSERT INTO twitch_live_notifications (guild_id) 
VALUES ('default') 
ON CONFLICT (guild_id) DO NOTHING;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT 'Minimale Twitch System Migration erfolgreich ausgeführt! ✅' as status,
       'Tabellen: twitch_live_notifications, twitch_monitored_streamers, twitch_bot_events' as created_tables,
       'Bereit für Live Messages! 🔴' as ready_for; 