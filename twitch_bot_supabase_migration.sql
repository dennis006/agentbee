-- 🎮 AgentBee Twitch Bot - Supabase Database Migration
-- Erstellt alle Tabellen für den Multi-Channel Twitch Bot

-- 1. Twitch Bot Settings Tabelle
CREATE TABLE IF NOT EXISTS public.twitch_bot_settings (
    id SERIAL PRIMARY KEY,
    enabled BOOLEAN DEFAULT true,
    prefix VARCHAR(10) DEFAULT '!',
    command_cooldown INTEGER DEFAULT 3000,
    moderation_enabled BOOLEAN DEFAULT true,
    anti_spam BOOLEAN DEFAULT true,
    max_caps INTEGER DEFAULT 70,
    max_length INTEGER DEFAULT 500,
    banned_words TEXT[] DEFAULT '{"spam","scam","fake","bot"}',
    chat_logging BOOLEAN DEFAULT true,
    user_tracking BOOLEAN DEFAULT true,
    command_stats BOOLEAN DEFAULT true,
    auto_responses BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Twitch Channels Tabelle
CREATE TABLE IF NOT EXISTS public.twitch_channels (
    id SERIAL PRIMARY KEY,
    channel_name VARCHAR(255) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT true,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE,
    message_count INTEGER DEFAULT 0,
    command_count INTEGER DEFAULT 0,
    moderators TEXT[] DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Twitch Chat Logs Tabelle
CREATE TABLE IF NOT EXISTS public.twitch_chat_logs (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    badges JSONB DEFAULT '{}',
    is_mod BOOLEAN DEFAULT false,
    is_subscriber BOOLEAN DEFAULT false,
    is_vip BOOLEAN DEFAULT false,
    is_broadcaster BOOLEAN DEFAULT false,
    emotes JSONB DEFAULT '{}',
    message_type VARCHAR(50) DEFAULT 'chat'
);

-- 4. Twitch Command Logs Tabelle
CREATE TABLE IF NOT EXISTS public.twitch_command_logs (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    command VARCHAR(100) NOT NULL,
    arguments TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    execution_time INTEGER
);

-- 5. Twitch Users Tabelle
CREATE TABLE IF NOT EXISTS public.twitch_users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    command_count INTEGER DEFAULT 0,
    channels TEXT[] DEFAULT '{}',
    is_follower BOOLEAN DEFAULT false,
    is_subscriber BOOLEAN DEFAULT false,
    subscription_tier INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Twitch Commands Tabelle
CREATE TABLE IF NOT EXISTS public.twitch_commands (
    id SERIAL PRIMARY KEY,
    command_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    response TEXT,
    enabled BOOLEAN DEFAULT true,
    cooldown INTEGER DEFAULT 5000,
    mod_only BOOLEAN DEFAULT false,
    sub_only BOOLEAN DEFAULT false,
    vip_only BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    channels TEXT[] DEFAULT '{}', -- Specific channels or empty for all
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Twitch Auto Responses Tabelle
CREATE TABLE IF NOT EXISTS public.twitch_auto_responses (
    id SERIAL PRIMARY KEY,
    trigger_word VARCHAR(255) NOT NULL,
    response TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    channels TEXT[] DEFAULT '{}',
    cooldown INTEGER DEFAULT 10000,
    last_used TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Twitch Moderation Actions Tabelle
CREATE TABLE IF NOT EXISTS public.twitch_moderation_actions (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'timeout', 'ban', 'delete', 'warning'
    target_user VARCHAR(255) NOT NULL,
    target_user_id VARCHAR(255),
    moderator VARCHAR(255) NOT NULL,
    reason TEXT,
    duration INTEGER, -- in seconds for timeouts
    original_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    auto_action BOOLEAN DEFAULT false
);

-- 9. Twitch Statistics Tabelle
CREATE TABLE IF NOT EXISTS public.twitch_statistics (
    id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    channel VARCHAR(255) NOT NULL,
    total_messages INTEGER DEFAULT 0,
    total_commands INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    peak_viewers INTEGER DEFAULT 0,
    chat_activity JSONB DEFAULT '{}',
    command_stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, channel)
);

-- 10. Twitch Bot Events Tabelle
CREATE TABLE IF NOT EXISTS public.twitch_bot_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    channel VARCHAR(255),
    data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT false
);

-- 11. Twitch Bot Status Tabelle
CREATE TABLE IF NOT EXISTS public.twitch_bot_status (
    id INTEGER PRIMARY KEY DEFAULT 1,
    is_running BOOLEAN DEFAULT false,
    connected_channels TEXT[] DEFAULT '{}',
    total_messages INTEGER DEFAULT 0,
    uptime VARCHAR(50) DEFAULT '0h 0m',
    last_activity TIMESTAMP WITH TIME ZONE,
    start_time TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_status_row CHECK (id = 1)
);

-- 12. Twitch Command Stats Tabelle
CREATE TABLE IF NOT EXISTS public.twitch_command_stats (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(255) NOT NULL,
    command VARCHAR(100) NOT NULL,
    username VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Twitch Moderation Logs Tabelle
CREATE TABLE IF NOT EXISTS public.twitch_moderation_logs (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    reason TEXT,
    moderator VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📊 Indexes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_twitch_chat_logs_channel ON public.twitch_chat_logs(channel);
CREATE INDEX IF NOT EXISTS idx_twitch_chat_logs_timestamp ON public.twitch_chat_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_twitch_chat_logs_username ON public.twitch_chat_logs(username);

CREATE INDEX IF NOT EXISTS idx_twitch_command_logs_channel ON public.twitch_command_logs(channel);
CREATE INDEX IF NOT EXISTS idx_twitch_command_logs_command ON public.twitch_command_logs(command);
CREATE INDEX IF NOT EXISTS idx_twitch_command_logs_timestamp ON public.twitch_command_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_twitch_users_user_id ON public.twitch_users(user_id);
CREATE INDEX IF NOT EXISTS idx_twitch_users_username ON public.twitch_users(username);

CREATE INDEX IF NOT EXISTS idx_twitch_channels_name ON public.twitch_channels(channel_name);
CREATE INDEX IF NOT EXISTS idx_twitch_channels_enabled ON public.twitch_channels(enabled);

CREATE INDEX IF NOT EXISTS idx_twitch_statistics_date ON public.twitch_statistics(date);
CREATE INDEX IF NOT EXISTS idx_twitch_statistics_channel ON public.twitch_statistics(channel);

CREATE INDEX IF NOT EXISTS idx_twitch_command_stats_channel ON public.twitch_command_stats(channel);
CREATE INDEX IF NOT EXISTS idx_twitch_command_stats_command ON public.twitch_command_stats(command);
CREATE INDEX IF NOT EXISTS idx_twitch_command_stats_timestamp ON public.twitch_command_stats(timestamp);

CREATE INDEX IF NOT EXISTS idx_twitch_moderation_logs_channel ON public.twitch_moderation_logs(channel);
CREATE INDEX IF NOT EXISTS idx_twitch_moderation_logs_timestamp ON public.twitch_moderation_logs(timestamp);

-- 🔧 Trigger für updated_at Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated At Triggers
CREATE TRIGGER update_twitch_bot_settings_updated_at 
    BEFORE UPDATE ON public.twitch_bot_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_twitch_channels_updated_at 
    BEFORE UPDATE ON public.twitch_channels 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_twitch_users_updated_at 
    BEFORE UPDATE ON public.twitch_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_twitch_commands_updated_at 
    BEFORE UPDATE ON public.twitch_commands 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_twitch_auto_responses_updated_at 
    BEFORE UPDATE ON public.twitch_auto_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 📝 Insert Default Settings
INSERT INTO public.twitch_bot_settings (id) VALUES (1) 
ON CONFLICT (id) DO NOTHING;

-- 📝 Default Commands
INSERT INTO public.twitch_commands (command_name, description, response, enabled) VALUES
('ping', 'Bot Ping Test', 'Pong! 🏓 Bot ist online!', true),
('bot', 'Bot Information', '🤖 AgentBee Twitch Bot - Multi-Channel Support!', true),
('commands', 'Liste aller Befehle', '📋 Verfügbare Befehle: !ping, !bot, !uptime, !stats', true),
('uptime', 'Bot Uptime', '⏰ Bot läuft seit: {uptime}', true),
('stats', 'Bot Statistiken', '📊 Channels: {channels} | Nachrichten: {messages}', true)
ON CONFLICT (command_name) DO NOTHING;

-- 📝 Default Auto Responses
INSERT INTO public.twitch_auto_responses (trigger_word, response, enabled) VALUES
('hallo', 'Hallo {user}! 👋 Willkommen im Chat!', true),
('hi', 'Hi {user}! 👋 Schön dich zu sehen!', true),
('discord', '📢 Unser Discord Server: https://discord.gg/yourserver', true),
('youtube', '📺 Unser YouTube Channel: https://youtube.com/yourchannel', true)
ON CONFLICT (trigger_word) DO NOTHING;

-- 🔐 Row Level Security (RLS) Policies
ALTER TABLE public.twitch_bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitch_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitch_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitch_command_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitch_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitch_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitch_auto_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitch_moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitch_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitch_bot_events ENABLE ROW LEVEL SECURITY;

-- Public Access Policies (für den Bot)
CREATE POLICY "Public access for twitch_bot_settings" ON public.twitch_bot_settings FOR ALL USING (true);
CREATE POLICY "Public access for twitch_channels" ON public.twitch_channels FOR ALL USING (true);
CREATE POLICY "Public access for twitch_chat_logs" ON public.twitch_chat_logs FOR ALL USING (true);
CREATE POLICY "Public access for twitch_command_logs" ON public.twitch_command_logs FOR ALL USING (true);
CREATE POLICY "Public access for twitch_users" ON public.twitch_users FOR ALL USING (true);
CREATE POLICY "Public access for twitch_commands" ON public.twitch_commands FOR ALL USING (true);
CREATE POLICY "Public access for twitch_auto_responses" ON public.twitch_auto_responses FOR ALL USING (true);
CREATE POLICY "Public access for twitch_moderation_actions" ON public.twitch_moderation_actions FOR ALL USING (true);
CREATE POLICY "Public access for twitch_statistics" ON public.twitch_statistics FOR ALL USING (true);
CREATE POLICY "Public access for twitch_bot_events" ON public.twitch_bot_events FOR ALL USING (true);

-- ✅ Migration Complete
SELECT 'Twitch Bot Migration erfolgreich abgeschlossen!' as status; 