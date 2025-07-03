-- Twitch Bot Commands System Migration
-- Vollständiges Command Management für Custom Commands

-- Commands Tabelle
CREATE TABLE IF NOT EXISTS twitch_bot_commands (
    id SERIAL PRIMARY KEY,
    command_name VARCHAR(50) NOT NULL,
    response_text TEXT NOT NULL,
    description TEXT,
    
    -- Command Settings
    enabled BOOLEAN DEFAULT true,
    cooldown_seconds INTEGER DEFAULT 30,
    uses_count INTEGER DEFAULT 0,
    
    -- Permissions
    mod_only BOOLEAN DEFAULT false,
    vip_only BOOLEAN DEFAULT false,
    subscriber_only BOOLEAN DEFAULT false,
    
    -- Advanced Features  
    response_type VARCHAR(20) DEFAULT 'text', -- 'text', 'embed', 'action'
    embed_color VARCHAR(7) DEFAULT '#9146FF',
    embed_title VARCHAR(100),
    
    -- Variables & Placeholders
    use_variables BOOLEAN DEFAULT true,
    custom_variables JSONB DEFAULT '{}',
    
    -- Channel Specific
    channel_name VARCHAR(50),
    discord_sync BOOLEAN DEFAULT false,
    discord_channel_id VARCHAR(20),
    
    -- Metadata
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    
    -- Constraints
    UNIQUE(command_name, channel_name)
);

-- Command Usage Stats Tabelle
CREATE TABLE IF NOT EXISTS twitch_bot_command_stats (
    id SERIAL PRIMARY KEY,
    command_id INTEGER REFERENCES twitch_bot_commands(id) ON DELETE CASCADE,
    channel_name VARCHAR(50) NOT NULL,
    user_name VARCHAR(50) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Command Categories Tabelle (für Organisation)
CREATE TABLE IF NOT EXISTS twitch_bot_command_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6441A5',
    icon VARCHAR(50) DEFAULT '🤖',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Standard Kategorien einfügen
INSERT INTO twitch_bot_command_categories (name, description, color, icon) VALUES
('general', 'Allgemeine Commands', '#9146FF', '💬'),
('social', 'Social Media Links', '#1DA1F2', '🔗'),
('fun', 'Spaß Commands', '#FF6B6B', '🎉'),
('moderation', 'Moderations Commands', '#E74C3C', '🛡️'),
('info', 'Informations Commands', '#3498DB', 'ℹ️'),
('custom', 'Benutzerdefiniert', '#95A5A6', '⚙️')
ON CONFLICT (name) DO NOTHING;

-- Category Zuordnung zu Commands
ALTER TABLE twitch_bot_commands 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES twitch_bot_command_categories(id) DEFAULT 6;

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_twitch_bot_commands_name ON twitch_bot_commands(command_name);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_commands_channel ON twitch_bot_commands(channel_name);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_commands_enabled ON twitch_bot_commands(enabled);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_command_stats_command ON twitch_bot_command_stats(command_id);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_command_stats_used_at ON twitch_bot_command_stats(used_at);

-- Function: Command Usage tracken
CREATE OR REPLACE FUNCTION log_twitch_command_usage(
    p_command_id INTEGER,
    p_channel_name VARCHAR(50),
    p_user_name VARCHAR(50),
    p_response_time_ms INTEGER DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Usage in stats tracken
    INSERT INTO twitch_bot_command_stats (
        command_id, channel_name, user_name, response_time_ms, success, error_message
    ) VALUES (
        p_command_id, p_channel_name, p_user_name, p_response_time_ms, p_success, p_error_message
    );
    
    -- Uses count erhöhen
    UPDATE twitch_bot_commands 
    SET uses_count = uses_count + 1,
        last_used_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_command_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Variable Replacement
CREATE OR REPLACE FUNCTION replace_command_variables(
    p_text TEXT,
    p_variables JSONB DEFAULT '{}',
    p_user_name VARCHAR(50) DEFAULT '',
    p_channel_name VARCHAR(50) DEFAULT ''
) RETURNS TEXT AS $$
DECLARE
    result TEXT := p_text;
    var_key TEXT;
    var_value TEXT;
BEGIN
    -- Standard Variablen ersetzen
    result := REPLACE(result, '{{user}}', p_user_name);
    result := REPLACE(result, '{{channel}}', p_channel_name);
    result := REPLACE(result, '{{time}}', TO_CHAR(CURRENT_TIMESTAMP, 'HH24:MI'));
    result := REPLACE(result, '{{date}}', TO_CHAR(CURRENT_TIMESTAMP, 'DD.MM.YYYY'));
    
    -- Custom Variablen ersetzen
    IF p_variables IS NOT NULL THEN
        FOR var_key IN SELECT jsonb_object_keys(p_variables) LOOP
            var_value := p_variables->>var_key;
            result := REPLACE(result, '{{' || var_key || '}}', var_value);
        END LOOP;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function: Command Analytics View
CREATE OR REPLACE VIEW twitch_bot_command_analytics AS
WITH usage_stats AS (
    SELECT 
        c.id,
        c.command_name,
        c.channel_name,
        c.uses_count,
        COUNT(s.id) as recent_uses,
        AVG(s.response_time_ms) as avg_response_time,
        MAX(s.used_at) as last_used,
        COUNT(CASE WHEN s.success = false THEN 1 END) as error_count
    FROM twitch_bot_commands c
    LEFT JOIN twitch_bot_command_stats s ON c.id = s.command_id 
        AND s.used_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
    GROUP BY c.id, c.command_name, c.channel_name, c.uses_count
)
SELECT 
    us.*,
    cat.name as category_name,
    cat.icon as category_icon,
    CASE 
        WHEN us.recent_uses > 100 THEN 'high'
        WHEN us.recent_uses > 10 THEN 'medium'
        ELSE 'low'
    END as usage_level
FROM usage_stats us
LEFT JOIN twitch_bot_commands c ON us.id = c.id
LEFT JOIN twitch_bot_command_categories cat ON c.category_id = cat.id;

-- Standard Commands einfügen
INSERT INTO twitch_bot_commands (
    command_name, response_text, description, category_id, channel_name, created_by
) VALUES
('discord', 'Join unseren Discord Server: https://discord.gg/your-invite 🎮 Hier findest du die Community auch außerhalb des Streams!', 'Discord Server Link', 2, NULL, 'system'),
('socials', 'Folge mir auch hier: 📺 Twitch: {{channel}} | 🐦 Twitter: @deintwitter | 📷 Instagram: @deininstagram', 'Social Media Links', 2, NULL, 'system'),
('commands', 'Verfügbare Commands: !discord, !socials, !uptime, !lurk - Für alle Commands: !help', 'Command Liste', 1, NULL, 'system'),
('lurk', 'Danke fürs Lurken {{user}}! 👀 Genieße den Stream und bis später! 💜', 'Lurk Command', 3, NULL, 'system'),
('followage', 'Hey {{user}}! Du folgst diesem Channel seit {{followage}} - Danke für deine Unterstützung! 💜', 'Followage anzeigen', 1, NULL, 'system')
ON CONFLICT (command_name, channel_name) DO NOTHING;

-- RLS Policies aktivieren
ALTER TABLE twitch_bot_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_command_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_command_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Alle können Commands lesen
CREATE POLICY "Commands sind öffentlich lesbar" ON twitch_bot_commands
    FOR SELECT USING (true);

-- Policy: Nur authentifizierte User können Commands ändern
CREATE POLICY "Nur authentifizierte User können Commands verwalten" ON twitch_bot_commands
    FOR ALL USING (auth.role() = 'authenticated');

-- Policy: Stats sind öffentlich lesbar
CREATE POLICY "Stats sind öffentlich lesbar" ON twitch_bot_command_stats
    FOR SELECT USING (true);

-- Policy: Nur System kann Stats schreiben
CREATE POLICY "Nur System kann Stats schreiben" ON twitch_bot_command_stats
    FOR INSERT WITH CHECK (true);

-- Policy: Categories sind öffentlich lesbar
CREATE POLICY "Categories sind öffentlich lesbar" ON twitch_bot_command_categories
    FOR SELECT USING (true);

COMMENT ON TABLE twitch_bot_commands IS 'Custom Twitch Bot Commands mit erweiterten Features';
COMMENT ON TABLE twitch_bot_command_stats IS 'Command Usage Statistiken und Performance Tracking';
COMMENT ON TABLE twitch_bot_command_categories IS 'Command Kategorien für bessere Organisation'; 