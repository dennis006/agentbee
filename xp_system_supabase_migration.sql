-- XP System Supabase Migration
-- Diese Datei erstellt alle benötigten Tabellen für das XP-System

-- Drop tables if they exist (für saubere Migration)
DROP TABLE IF EXISTS xp_channel_blacklists CASCADE;
DROP TABLE IF EXISTS xp_milestone_rewards CASCADE;
DROP TABLE IF EXISTS xp_level_roles CASCADE;
DROP TABLE IF EXISTS xp_users CASCADE;
DROP TABLE IF EXISTS xp_settings CASCADE;

-- 1. XP Settings Tabelle (Global Settings)
CREATE TABLE xp_settings (
    id SERIAL PRIMARY KEY,
    enabled BOOLEAN DEFAULT true,
    
    -- Message XP Settings
    message_xp_min INTEGER DEFAULT 5,
    message_xp_max INTEGER DEFAULT 15,
    message_xp_cooldown INTEGER DEFAULT 60000,
    
    -- Voice XP Settings
    voice_xp_base INTEGER DEFAULT 2,
    voice_xp_afk INTEGER DEFAULT 0,
    voice_xp_solo INTEGER DEFAULT 1,
    voice_xp_cooldown INTEGER DEFAULT 60000,
    voice_xp_interval_minutes INTEGER DEFAULT 1,
    
    -- Level System Settings
    level_system_base_xp INTEGER DEFAULT 100,
    level_system_multiplier DECIMAL(3,2) DEFAULT 1.5,
    level_system_max_level INTEGER DEFAULT 100,
    
    -- Channel Settings
    level_up_channel VARCHAR(255) DEFAULT 'level-up',
    leaderboard_channel VARCHAR(255) DEFAULT 'leaderboard',
    
    -- Auto Leaderboard Settings
    auto_leaderboard_enabled BOOLEAN DEFAULT true,
    auto_leaderboard_time VARCHAR(10) DEFAULT '20:00',
    auto_leaderboard_timezone VARCHAR(100) DEFAULT 'Europe/Berlin',
    auto_leaderboard_channel VARCHAR(255) DEFAULT 'leaderboard',
    auto_leaderboard_types TEXT[] DEFAULT ARRAY['total'],
    auto_leaderboard_limit INTEGER DEFAULT 10,
    auto_leaderboard_last_posted BIGINT DEFAULT 0,
    auto_leaderboard_last_message_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    auto_leaderboard_auto_delete_old BOOLEAN DEFAULT true,
    
    -- Announcement Settings
    announcements_level_up BOOLEAN DEFAULT true,
    announcements_milestones BOOLEAN DEFAULT true,
    announcements_new_record BOOLEAN DEFAULT true,
    
    -- Display Settings
    display_show_rank BOOLEAN DEFAULT true,
    display_show_progress BOOLEAN DEFAULT true,
    display_embed_color VARCHAR(20) DEFAULT '0x00FF7F',
    display_leaderboard_size INTEGER DEFAULT 10,
    
    -- Level Up Embed Settings
    level_up_embed_enabled BOOLEAN DEFAULT true,
    level_up_embed_title VARCHAR(255) DEFAULT '🎉 Level Up!',
    level_up_embed_color VARCHAR(20) DEFAULT '0x00FF7F',
    level_up_embed_animation_enabled BOOLEAN DEFAULT true,
    level_up_embed_animation_style VARCHAR(50) DEFAULT 'celebration',
    level_up_embed_animation_duration INTEGER DEFAULT 5000,
    level_up_embed_fields_show_stats BOOLEAN DEFAULT true,
    level_up_embed_fields_show_next_level BOOLEAN DEFAULT true,
    level_up_embed_fields_show_rank BOOLEAN DEFAULT true,
    level_up_embed_fields_custom_message TEXT DEFAULT '',
    level_up_embed_footer_enabled BOOLEAN DEFAULT true,
    level_up_embed_footer_text VARCHAR(255) DEFAULT '🎉 Herzlichen Glückwunsch!',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. XP Users Tabelle (User XP Data)
CREATE TABLE xp_users (
    user_id VARCHAR(50) PRIMARY KEY,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    voice_time DECIMAL(10,2) DEFAULT 0,
    last_message BIGINT DEFAULT 0,
    last_voice_xp BIGINT DEFAULT 0,
    voice_join_time BIGINT DEFAULT 0,
    username VARCHAR(255),
    avatar VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. XP Level Roles Tabelle (Level -> Role Mapping)
CREATE TABLE xp_level_roles (
    id SERIAL PRIMARY KEY,
    level INTEGER NOT NULL,
    role_id VARCHAR(50) NOT NULL,
    role_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_level_role UNIQUE(level, role_id)
);

-- 4. XP Milestone Rewards Tabelle
CREATE TABLE xp_milestone_rewards (
    id SERIAL PRIMARY KEY,
    xp_required INTEGER NOT NULL,
    reward VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_milestone_xp UNIQUE(xp_required)
);

-- 5. XP Channel Blacklists Tabelle
CREATE TABLE xp_channel_blacklists (
    id SERIAL PRIMARY KEY,
    channel_name VARCHAR(255) NOT NULL,
    channel_type VARCHAR(20) NOT NULL, -- 'text' oder 'voice'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_channel_blacklist UNIQUE(channel_name, channel_type)
);

-- Indices für bessere Performance
CREATE INDEX idx_xp_users_total_xp ON xp_users(total_xp DESC);
CREATE INDEX idx_xp_users_level ON xp_users(level DESC);
CREATE INDEX idx_xp_users_message_count ON xp_users(message_count DESC);
CREATE INDEX idx_xp_users_voice_time ON xp_users(voice_time DESC);
CREATE INDEX idx_xp_users_updated_at ON xp_users(updated_at);
CREATE INDEX idx_xp_level_roles_level ON xp_level_roles(level);
CREATE INDEX idx_xp_milestone_rewards_xp ON xp_milestone_rewards(xp_required);

-- Update Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_xp_settings_updated_at BEFORE UPDATE ON xp_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_xp_users_updated_at BEFORE UPDATE ON xp_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings row
INSERT INTO xp_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Insert default milestone rewards
INSERT INTO xp_milestone_rewards (xp_required, reward) VALUES
(500, '🌱 Newcomer'),
(1000, '💬 Aktives Mitglied'),
(2500, '⭐ Erfahrener User'),
(5000, '🎯 Server-Veteran'),
(10000, '👑 Elite Member'),
(25000, '🏆 Server-Legende'),
(50000, '💎 Diamond Member')
ON CONFLICT (xp_required) DO NOTHING;

-- RLS (Row Level Security) Policies
ALTER TABLE xp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_level_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_milestone_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_channel_blacklists ENABLE ROW LEVEL SECURITY;

-- Policies für Anon Access (da der Bot über API-Key zugreift)
CREATE POLICY "Allow anon access to xp_settings" ON xp_settings FOR ALL USING (true);
CREATE POLICY "Allow anon access to xp_users" ON xp_users FOR ALL USING (true);
CREATE POLICY "Allow anon access to xp_level_roles" ON xp_level_roles FOR ALL USING (true);
CREATE POLICY "Allow anon access to xp_milestone_rewards" ON xp_milestone_rewards FOR ALL USING (true);
CREATE POLICY "Allow anon access to xp_channel_blacklists" ON xp_channel_blacklists FOR ALL USING (true);

-- Kommentare für bessere Dokumentation
COMMENT ON TABLE xp_settings IS 'Globale XP-System Einstellungen';
COMMENT ON TABLE xp_users IS 'User XP Daten und Statistiken';
COMMENT ON TABLE xp_level_roles IS 'Level zu Discord-Rolle Zuordnungen';
COMMENT ON TABLE xp_milestone_rewards IS 'XP-Meilenstein Belohnungen';
COMMENT ON TABLE xp_channel_blacklists IS 'Channels die von XP-Vergabe ausgeschlossen sind'; 