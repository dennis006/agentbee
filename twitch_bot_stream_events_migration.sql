-- =============================================
-- TWITCH BOT STREAM EVENTS MIGRATION
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

-- Events History Tabelle
CREATE TABLE IF NOT EXISTS twitch_bot_events (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    event_type TEXT NOT NULL, -- 'stream_start_manual', 'stream_end_manual', 'stream_start_auto', 'stream_end_auto', etc.
    event_data JSONB DEFAULT '{}', -- Flexible Event-Daten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto Voice Channel Settings (für zukünftige Features)
CREATE TABLE IF NOT EXISTS twitch_bot_auto_voice (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    channel_id TEXT NOT NULL, -- Twitch Channel
    discord_voice_channel_id TEXT NOT NULL, -- Discord Voice Channel ID
    enabled BOOLEAN DEFAULT false,
    auto_create_on_stream BOOLEAN DEFAULT false,
    voice_channel_name_template TEXT DEFAULT '{streamer} ist live!',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(guild_id, channel_id)
);

-- Custom Commands für Bot (für zukünftige Features)
CREATE TABLE IF NOT EXISTS twitch_bot_custom_commands (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    command_name TEXT NOT NULL,
    command_response TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    uses_count INTEGER DEFAULT 0,
    cooldown_seconds INTEGER DEFAULT 5,
    mod_only BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(guild_id, command_name)
);

-- Moderator Settings
CREATE TABLE IF NOT EXISTS twitch_bot_moderators (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    twitch_username TEXT NOT NULL,
    permissions JSONB DEFAULT '{"can_manage_bot": false, "can_manage_commands": false, "can_trigger_events": false}',
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(guild_id, twitch_username)
);

-- =============================================
-- INDEXES FÜR PERFORMANCE
-- =============================================

-- Stream Events
CREATE INDEX IF NOT EXISTS idx_twitch_bot_stream_events_guild_id ON twitch_bot_stream_events(guild_id);

-- Events History
CREATE INDEX IF NOT EXISTS idx_twitch_bot_events_guild_id ON twitch_bot_events(guild_id);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_events_type ON twitch_bot_events(event_type);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_events_created_at ON twitch_bot_events(created_at DESC);

-- Auto Voice
CREATE INDEX IF NOT EXISTS idx_twitch_bot_auto_voice_guild_id ON twitch_bot_auto_voice(guild_id);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_auto_voice_enabled ON twitch_bot_auto_voice(enabled);

-- Custom Commands
CREATE INDEX IF NOT EXISTS idx_twitch_bot_custom_commands_guild_id ON twitch_bot_custom_commands(guild_id);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_custom_commands_enabled ON twitch_bot_custom_commands(enabled);

-- Moderators
CREATE INDEX IF NOT EXISTS idx_twitch_bot_moderators_guild_id ON twitch_bot_moderators(guild_id);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_moderators_enabled ON twitch_bot_moderators(enabled);

-- =============================================
-- RLS POLICIES (Row Level Security)
-- =============================================

-- Enable RLS
ALTER TABLE twitch_bot_stream_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_auto_voice ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_custom_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_moderators ENABLE ROW LEVEL SECURITY;

-- Policies für öffentlichen Zugriff (da es ein Bot-System ist)
CREATE POLICY "Allow all operations on twitch_bot_stream_events" ON twitch_bot_stream_events FOR ALL USING (true);
CREATE POLICY "Allow all operations on twitch_bot_events" ON twitch_bot_events FOR ALL USING (true);
CREATE POLICY "Allow all operations on twitch_bot_auto_voice" ON twitch_bot_auto_voice FOR ALL USING (true);
CREATE POLICY "Allow all operations on twitch_bot_custom_commands" ON twitch_bot_custom_commands FOR ALL USING (true);
CREATE POLICY "Allow all operations on twitch_bot_moderators" ON twitch_bot_moderators FOR ALL USING (true);

-- =============================================
-- INITIAL DATA
-- =============================================

-- Standard Stream Events Einstellungen
INSERT INTO twitch_bot_stream_events (guild_id, stream_start_enabled, stream_start_message, stream_start_delay)
VALUES ('default', false, '🔴 Stream startet! Lasst uns Spaß haben! 🎮', 30)
ON CONFLICT (guild_id) DO NOTHING;

-- Standard Custom Commands
INSERT INTO twitch_bot_custom_commands (guild_id, command_name, command_response, enabled, mod_only) VALUES
('default', 'socials', '📱 Folge mir auf allen Plattformen! Discord: [Link] | YouTube: [Link] | Instagram: [Link]', true, false),
('default', 'game', '🎮 Aktuell spiele ich: [Spiel Name] - Was ist euer Lieblingsspiel?', true, false),
('default', 'setup', '💻 Mein Setup: [Hardware Details] - Fragt gerne nach Details!', true, false),
('default', 'schedule', '📅 Stream Schedule: [Zeiten] - Folgt mir um keine Streams zu verpassen!', true, false)
ON CONFLICT (guild_id, command_name) DO NOTHING;

-- =============================================
-- KOMMENTARE UND DOKUMENTATION
-- =============================================

COMMENT ON TABLE twitch_bot_stream_events IS 'Einstellungen für automatische Stream-Start/Ende Nachrichten und Events';
COMMENT ON TABLE twitch_bot_events IS 'Historie aller Bot-Events für Logging und Statistiken';
COMMENT ON TABLE twitch_bot_auto_voice IS 'Automatische Discord Voice Channel Erstellung bei Stream-Start';
COMMENT ON TABLE twitch_bot_custom_commands IS 'Benutzerdefinierte Bot-Commands mit Cooldowns und Moderator-Einstellungen';
COMMENT ON TABLE twitch_bot_moderators IS 'Bot-Moderatoren mit spezifischen Berechtigungen';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Erfolgsmeldung
DO $$
BEGIN
    RAISE NOTICE '✅ Twitch Bot Stream Events Migration erfolgreich abgeschlossen!';
    RAISE NOTICE '📋 Neue Tabellen: twitch_bot_stream_events, twitch_bot_events, twitch_bot_auto_voice, twitch_bot_custom_commands, twitch_bot_moderators';
    RAISE NOTICE '🔧 Features: Stream Events, Custom Commands, Auto Voice, Moderator System';
END $$; 