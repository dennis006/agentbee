-- Twitch Live Notification System - Supabase Migration
-- Datum: 2025

-- =============================================
-- TWITCH SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS twitch_settings (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    enabled BOOLEAN DEFAULT true,
    check_interval INTEGER DEFAULT 5,
    client_id TEXT DEFAULT '',
    client_secret TEXT DEFAULT '',
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

-- =============================================
-- TWITCH STREAMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS twitch_streamers (
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
-- TWITCH LIVE DATA TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS twitch_live_data (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    streamer_id INTEGER NOT NULL REFERENCES twitch_streamers(id) ON DELETE CASCADE,
    stream_id TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    notified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX(guild_id, streamer_id, is_active),
    UNIQUE(guild_id, streamer_id, stream_id)
);

-- =============================================
-- RLS (Row Level Security) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE twitch_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_streamers ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_live_data ENABLE ROW LEVEL SECURITY;

-- Settings Policies
CREATE POLICY "Allow all operations on twitch_settings" ON twitch_settings FOR ALL USING (true);

-- Streamers Policies  
CREATE POLICY "Allow all operations on twitch_streamers" ON twitch_streamers FOR ALL USING (true);

-- Live Data Policies
CREATE POLICY "Allow all operations on twitch_live_data" ON twitch_live_data FOR ALL USING (true);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_twitch_streamers_guild_enabled ON twitch_streamers(guild_id, enabled);
CREATE INDEX IF NOT EXISTS idx_twitch_streamers_username ON twitch_streamers(username);
CREATE INDEX IF NOT EXISTS idx_twitch_live_data_active ON twitch_live_data(guild_id, is_active);
CREATE INDEX IF NOT EXISTS idx_twitch_live_data_streamer ON twitch_live_data(streamer_id, is_active);

-- =============================================
-- UPDATE TIMESTAMP TRIGGERS
-- =============================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_twitch_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_twitch_settings_updated_at BEFORE UPDATE ON twitch_settings 
    FOR EACH ROW EXECUTE FUNCTION update_twitch_updated_at_column();

CREATE TRIGGER update_twitch_streamers_updated_at BEFORE UPDATE ON twitch_streamers 
    FOR EACH ROW EXECUTE FUNCTION update_twitch_updated_at_column();

CREATE TRIGGER update_twitch_live_data_updated_at BEFORE UPDATE ON twitch_live_data 
    FOR EACH ROW EXECUTE FUNCTION update_twitch_updated_at_column();

-- =============================================
-- DEFAULT DATA INSERTION
-- =============================================

-- Insert default settings if not exists
INSERT INTO twitch_settings (guild_id) 
VALUES ('default') 
ON CONFLICT (guild_id) DO NOTHING;

-- =============================================
-- HELPFUL VIEWS
-- =============================================

-- View für aktive Streamer mit Live-Status
CREATE OR REPLACE VIEW twitch_active_streamers AS
SELECT 
    s.*,
    CASE WHEN ld.id IS NOT NULL THEN true ELSE false END as is_currently_live,
    ld.stream_id,
    ld.started_at as stream_started_at,
    ld.notified_at as stream_notified_at
FROM twitch_streamers s
LEFT JOIN twitch_live_data ld ON s.id = ld.streamer_id AND ld.is_active = true
WHERE s.enabled = true;

-- View für Statistiken
CREATE OR REPLACE VIEW twitch_stats AS
SELECT 
    guild_id,
    COUNT(*) as total_streamers,
    SUM(CASE WHEN enabled = true THEN 1 ELSE 0 END) as active_streamers,
    SUM(total_notifications) as total_notifications,
    (SELECT COUNT(*) FROM twitch_live_data WHERE is_active = true AND guild_id = s.guild_id) as currently_live
FROM twitch_streamers s
GROUP BY guild_id;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to cleanup old live data
CREATE OR REPLACE FUNCTION cleanup_old_twitch_live_data(hours_old INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM twitch_live_data 
    WHERE is_active = false 
    AND ended_at < NOW() - INTERVAL '1 hour' * hours_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get streamer by username
CREATE OR REPLACE FUNCTION get_twitch_streamer_by_username(p_guild_id TEXT, p_username TEXT)
RETURNS twitch_streamers AS $$
DECLARE
    result twitch_streamers;
BEGIN
    SELECT * INTO result 
    FROM twitch_streamers 
    WHERE guild_id = p_guild_id AND username = LOWER(p_username);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to increment notification count
CREATE OR REPLACE FUNCTION increment_twitch_notifications(p_streamer_id INTEGER, p_guild_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE twitch_streamers 
    SET total_notifications = total_notifications + 1,
        last_live = NOW()
    WHERE id = p_streamer_id AND guild_id = p_guild_id;
END;
$$ LANGUAGE plpgsql;

-- Erfolgsmeldung
SELECT 'Twitch Live Notification System Supabase-Migration erfolgreich ausgeführt!' as status; 