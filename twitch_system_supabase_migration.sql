-- Twitch Bot System - Supabase Migration (Multi-Channel Support)
-- Datum: 2025

-- =============================================
-- TWITCH BOT SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS twitch_bot_settings (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    bot_enabled BOOLEAN DEFAULT false,
    bot_username TEXT DEFAULT '',
    oauth_token TEXT DEFAULT '',
    client_id TEXT DEFAULT '',
    auto_connect BOOLEAN DEFAULT true,
    reconnect_attempts INTEGER DEFAULT 3,
    command_prefix TEXT DEFAULT '!',
    mod_commands_only BOOLEAN DEFAULT false,
    allowed_roles JSONB DEFAULT '[]'::jsonb,
    blocked_users JSONB DEFAULT '[]'::jsonb,
    global_cooldown INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id)
);

-- =============================================
-- TWITCH BOT CHANNELS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS twitch_bot_channels (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    channel_name TEXT NOT NULL,
    channel_id TEXT DEFAULT '',
    enabled BOOLEAN DEFAULT true,
    auto_join BOOLEAN DEFAULT true,
    discord_channel_id TEXT DEFAULT '',
    sync_messages BOOLEAN DEFAULT false,
    welcome_message TEXT DEFAULT 'Hello {{username}}! Welcome to the stream! 🎉',
    follow_message TEXT DEFAULT 'Thanks for the follow {{username}}! ❤️',
    sub_message TEXT DEFAULT 'Thank you {{username}} for subscribing! 🎉',
    donation_message TEXT DEFAULT 'Thank you {{username}} for the donation of {{amount}}! 💜',
    raid_message TEXT DEFAULT 'Welcome raiders from {{from_channel}}! Thanks for the {{viewer_count}} viewers! 🔥',
    host_message TEXT DEFAULT 'Thanks {{username}} for hosting with {{viewer_count}} viewers! 🎊',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id, channel_name)
);

-- =============================================
-- TWITCH BOT COMMANDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS twitch_bot_commands (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    channel_id INTEGER REFERENCES twitch_bot_channels(id) ON DELETE CASCADE,
    command_name TEXT NOT NULL,
    command_type TEXT DEFAULT 'text', -- text, counter, timer, api
    response TEXT DEFAULT '',
    aliases JSONB DEFAULT '[]'::jsonb,
    enabled BOOLEAN DEFAULT true,
    cooldown INTEGER DEFAULT 5,
    user_level TEXT DEFAULT 'everyone', -- everyone, subscriber, vip, moderator, broadcaster
    usage_count INTEGER DEFAULT 0,
    created_by TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id, channel_id, command_name)
);

-- =============================================
-- TWITCH BOT MODERATION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS twitch_bot_moderation (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    channel_id INTEGER REFERENCES twitch_bot_channels(id) ON DELETE CASCADE,
    spam_protection BOOLEAN DEFAULT true,
    caps_protection BOOLEAN DEFAULT true,
    caps_limit INTEGER DEFAULT 70,
    link_protection BOOLEAN DEFAULT true,
    allowed_links JSONB DEFAULT '[]'::jsonb,
    word_filter BOOLEAN DEFAULT false,
    banned_words JSONB DEFAULT '[]'::jsonb,
    timeout_duration INTEGER DEFAULT 60,
    max_warnings INTEGER DEFAULT 3,
    auto_timeout BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id, channel_id)
);

-- =============================================
-- TWITCH BOT LIVE NOTIFICATIONS (erweitert)
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
-- TWITCH MONITORED STREAMERS TABLE
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
-- TWITCH BOT EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS twitch_bot_events (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    channel_id INTEGER REFERENCES twitch_bot_channels(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- follow, subscribe, donation, raid, host, cheer, etc.
    username TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    processed BOOLEAN DEFAULT false,
    discord_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TWITCH BOT STATS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS twitch_bot_stats (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    channel_id INTEGER REFERENCES twitch_bot_channels(id) ON DELETE CASCADE,
    stat_date DATE DEFAULT CURRENT_DATE,
    messages_sent INTEGER DEFAULT 0,
    commands_used INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    peak_viewers INTEGER DEFAULT 0,
    stream_duration INTEGER DEFAULT 0, -- in minutes
    followers_gained INTEGER DEFAULT 0,
    subscribers_gained INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id, channel_id, stat_date)
);

-- =============================================
-- RLS (Row Level Security) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE twitch_bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_live_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_monitored_streamers ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_stats ENABLE ROW LEVEL SECURITY;

-- Allow all operations policies
CREATE POLICY "Allow all operations on twitch_bot_settings" ON twitch_bot_settings FOR ALL USING (true);
CREATE POLICY "Allow all operations on twitch_bot_channels" ON twitch_bot_channels FOR ALL USING (true);
CREATE POLICY "Allow all operations on twitch_bot_commands" ON twitch_bot_commands FOR ALL USING (true);
CREATE POLICY "Allow all operations on twitch_bot_moderation" ON twitch_bot_moderation FOR ALL USING (true);
CREATE POLICY "Allow all operations on twitch_live_notifications" ON twitch_live_notifications FOR ALL USING (true);
CREATE POLICY "Allow all operations on twitch_monitored_streamers" ON twitch_monitored_streamers FOR ALL USING (true);
CREATE POLICY "Allow all operations on twitch_bot_events" ON twitch_bot_events FOR ALL USING (true);
CREATE POLICY "Allow all operations on twitch_bot_stats" ON twitch_bot_stats FOR ALL USING (true);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_twitch_bot_channels_guild_enabled ON twitch_bot_channels(guild_id, enabled);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_commands_channel_enabled ON twitch_bot_commands(channel_id, enabled);
CREATE INDEX IF NOT EXISTS idx_twitch_monitored_streamers_guild_enabled ON twitch_monitored_streamers(guild_id, enabled);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_events_channel_processed ON twitch_bot_events(channel_id, processed);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_events_type_date ON twitch_bot_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_stats_date ON twitch_bot_stats(guild_id, stat_date);

-- =============================================
-- UPDATE TIMESTAMP TRIGGERS
-- =============================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_twitch_bot_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_twitch_bot_settings_updated_at BEFORE UPDATE ON twitch_bot_settings 
    FOR EACH ROW EXECUTE FUNCTION update_twitch_bot_updated_at_column();

CREATE TRIGGER update_twitch_bot_channels_updated_at BEFORE UPDATE ON twitch_bot_channels 
    FOR EACH ROW EXECUTE FUNCTION update_twitch_bot_updated_at_column();

CREATE TRIGGER update_twitch_bot_commands_updated_at BEFORE UPDATE ON twitch_bot_commands 
    FOR EACH ROW EXECUTE FUNCTION update_twitch_bot_updated_at_column();

CREATE TRIGGER update_twitch_bot_moderation_updated_at BEFORE UPDATE ON twitch_bot_moderation 
    FOR EACH ROW EXECUTE FUNCTION update_twitch_bot_updated_at_column();

CREATE TRIGGER update_twitch_live_notifications_updated_at BEFORE UPDATE ON twitch_live_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_twitch_bot_updated_at_column();

CREATE TRIGGER update_twitch_monitored_streamers_updated_at BEFORE UPDATE ON twitch_monitored_streamers 
    FOR EACH ROW EXECUTE FUNCTION update_twitch_bot_updated_at_column();

CREATE TRIGGER update_twitch_bot_stats_updated_at BEFORE UPDATE ON twitch_bot_stats 
    FOR EACH ROW EXECUTE FUNCTION update_twitch_bot_updated_at_column();

-- =============================================
-- DEFAULT DATA INSERTION
-- =============================================

-- Insert default settings if not exists
INSERT INTO twitch_bot_settings (guild_id) 
VALUES ('default') 
ON CONFLICT (guild_id) DO NOTHING;

INSERT INTO twitch_live_notifications (guild_id) 
VALUES ('default') 
ON CONFLICT (guild_id) DO NOTHING;

-- =============================================
-- HELPFUL VIEWS
-- =============================================

-- View für aktive Bot Channels mit Stats
CREATE OR REPLACE VIEW twitch_bot_active_channels AS
SELECT 
    c.*,
    m.spam_protection,
    m.caps_protection,
    m.link_protection,
    COUNT(cmd.id) as total_commands,
    COUNT(CASE WHEN cmd.enabled = true THEN 1 END) as active_commands
FROM twitch_bot_channels c
LEFT JOIN twitch_bot_moderation m ON c.id = m.channel_id
LEFT JOIN twitch_bot_commands cmd ON c.id = cmd.channel_id
WHERE c.enabled = true
GROUP BY c.id, m.spam_protection, m.caps_protection, m.link_protection;

-- View für Bot Statistiken
CREATE OR REPLACE VIEW twitch_bot_stats_summary AS
SELECT 
    guild_id,
    COUNT(DISTINCT channel_id) as total_channels,
    SUM(messages_sent) as total_messages,
    SUM(commands_used) as total_commands_used,
    SUM(unique_users) as total_unique_users,
    MAX(peak_viewers) as highest_peak_viewers,
    SUM(stream_duration) as total_stream_minutes,
    SUM(followers_gained) as total_followers_gained,
    SUM(subscribers_gained) as total_subscribers_gained
FROM twitch_bot_stats
WHERE stat_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY guild_id;

-- View für überwachte Streamer mit Live-Status
CREATE OR REPLACE VIEW twitch_monitored_streamers_status AS
SELECT 
    s.*,
    CASE WHEN s.last_live > NOW() - INTERVAL '10 minutes' THEN true ELSE false END as is_currently_live
FROM twitch_monitored_streamers s
WHERE s.enabled = true;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to cleanup old events
CREATE OR REPLACE FUNCTION cleanup_old_twitch_bot_events(days_old INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM twitch_bot_events 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old
    AND processed = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to increment command usage
CREATE OR REPLACE FUNCTION increment_command_usage(p_command_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE twitch_bot_commands 
    SET usage_count = usage_count + 1
    WHERE id = p_command_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily stats
CREATE OR REPLACE FUNCTION update_twitch_bot_daily_stats(
    p_guild_id TEXT,
    p_channel_id INTEGER,
    p_messages_sent INTEGER DEFAULT 0,
    p_commands_used INTEGER DEFAULT 0,
    p_unique_users INTEGER DEFAULT 0,
    p_peak_viewers INTEGER DEFAULT 0,
    p_stream_duration INTEGER DEFAULT 0,
    p_followers_gained INTEGER DEFAULT 0,
    p_subscribers_gained INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO twitch_bot_stats (
        guild_id, channel_id, stat_date, messages_sent, commands_used, 
        unique_users, peak_viewers, stream_duration, followers_gained, subscribers_gained
    ) VALUES (
        p_guild_id, p_channel_id, CURRENT_DATE, p_messages_sent, p_commands_used,
        p_unique_users, p_peak_viewers, p_stream_duration, p_followers_gained, p_subscribers_gained
    )
    ON CONFLICT (guild_id, channel_id, stat_date) 
    DO UPDATE SET
        messages_sent = twitch_bot_stats.messages_sent + EXCLUDED.messages_sent,
        commands_used = twitch_bot_stats.commands_used + EXCLUDED.commands_used,
        unique_users = GREATEST(twitch_bot_stats.unique_users, EXCLUDED.unique_users),
        peak_viewers = GREATEST(twitch_bot_stats.peak_viewers, EXCLUDED.peak_viewers),
        stream_duration = twitch_bot_stats.stream_duration + EXCLUDED.stream_duration,
        followers_gained = twitch_bot_stats.followers_gained + EXCLUDED.followers_gained,
        subscribers_gained = twitch_bot_stats.subscribers_gained + EXCLUDED.subscribers_gained,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Erfolgsmeldung
SELECT 'Twitch Bot System Supabase-Migration erfolgreich ausgeführt!' as status; 