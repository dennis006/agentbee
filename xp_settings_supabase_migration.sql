-- ================================================
-- XP SETTINGS SUPABASE MIGRATION
-- ================================================
-- Erstellt: $(date)
-- Version: 1.0
-- Beschreibung: Migration für XP-System Settings in Supabase
-- 
-- Diese Migration erstellt:
-- 1. xp_settings Tabelle für Guild-spezifische XP-Einstellungen
-- 2. xp_level_roles Tabelle für Level-Rollen (verwaltet im Dashboard)
-- 3. xp_milestone_rewards Tabelle für Meilenstein-Belohnungen
-- 4. Policies für Row Level Security (RLS)
-- 5. Indexe für Performance
-- ================================================

-- 1. XP Settings Haupttabelle
CREATE TABLE IF NOT EXISTS xp_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    
    -- System Settings
    enabled BOOLEAN DEFAULT true,
    
    -- Message XP Settings
    message_xp_min INTEGER DEFAULT 5,
    message_xp_max INTEGER DEFAULT 15,
    message_xp_cooldown INTEGER DEFAULT 60000,
    
    -- Voice XP Settings
    voice_xp_base INTEGER DEFAULT 2,
    voice_xp_afk_channel INTEGER DEFAULT 0,
    voice_xp_solo_channel INTEGER DEFAULT 1,
    voice_xp_cooldown INTEGER DEFAULT 60000,
    voice_xp_interval_minutes INTEGER DEFAULT 1,
    
    -- Level System Settings
    level_system_base_xp INTEGER DEFAULT 100,
    level_system_multiplier DECIMAL(3,2) DEFAULT 1.5,
    level_system_max_level INTEGER DEFAULT 100,
    
    -- Channel Settings
    level_up_channel TEXT DEFAULT 'level-up',
    leaderboard_channel TEXT DEFAULT 'leaderboard',
    xp_blacklist_channels TEXT[] DEFAULT '{}',
    voice_blacklist_channels TEXT[] DEFAULT '{}',
    
    -- Auto Leaderboard Settings
    auto_leaderboard_enabled BOOLEAN DEFAULT true,
    auto_leaderboard_time TEXT DEFAULT '20:00',
    auto_leaderboard_timezone TEXT DEFAULT 'Europe/Berlin',
    auto_leaderboard_channel TEXT DEFAULT 'leaderboard',
    auto_leaderboard_types TEXT[] DEFAULT '{"total"}',
    auto_leaderboard_limit INTEGER DEFAULT 10,
    auto_leaderboard_last_posted BIGINT DEFAULT 0,
    auto_leaderboard_auto_delete BOOLEAN DEFAULT true,
    auto_leaderboard_last_message_ids TEXT[] DEFAULT '{}',
    
    -- Announcement Settings
    announcements_level_up BOOLEAN DEFAULT true,
    announcements_milestones BOOLEAN DEFAULT true,
    announcements_new_record BOOLEAN DEFAULT true,
    
    -- Display Settings
    display_show_rank BOOLEAN DEFAULT true,
    display_show_progress BOOLEAN DEFAULT true,
    display_embed_color TEXT DEFAULT '0x2ECC71',
    display_leaderboard_size INTEGER DEFAULT 10,
    
    -- Level Up Embed Settings
    level_up_embed_enabled BOOLEAN DEFAULT true,
    level_up_embed_title TEXT DEFAULT '🎉 Level Up!',
    level_up_embed_color TEXT DEFAULT '0x00FF7F',
    
    -- Animation Settings
    animation_enabled BOOLEAN DEFAULT true,
    animation_style TEXT DEFAULT 'celebration',
    animation_duration INTEGER DEFAULT 5000,
    
    -- Embed Fields Settings
    fields_show_stats BOOLEAN DEFAULT true,
    fields_show_next_level BOOLEAN DEFAULT true,
    fields_show_rank BOOLEAN DEFAULT true,
    fields_custom_message TEXT DEFAULT '',
    
    -- Footer Settings
    footer_enabled BOOLEAN DEFAULT true,
    footer_text TEXT DEFAULT '🎉 Herzlichen Glückwunsch!',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Level Rollen Tabelle (Dashboard-verwaltbar)
CREATE TABLE IF NOT EXISTS xp_level_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    level INTEGER NOT NULL,
    role_id TEXT NOT NULL,
    role_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_guild_level UNIQUE(guild_id, level),
    CONSTRAINT unique_guild_role UNIQUE(guild_id, role_id),
    CONSTRAINT valid_level CHECK (level > 0 AND level <= 200)
);

-- 3. Meilenstein Belohnungen Tabelle (Dashboard-verwaltbar)
CREATE TABLE IF NOT EXISTS xp_milestone_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    xp_required INTEGER NOT NULL,
    reward_name TEXT NOT NULL,
    reward_description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_guild_xp UNIQUE(guild_id, xp_required),
    CONSTRAINT valid_xp_required CHECK (xp_required > 0)
);

-- 4. Indexe für Performance
CREATE INDEX IF NOT EXISTS idx_xp_settings_guild_id ON xp_settings(guild_id);
CREATE INDEX IF NOT EXISTS idx_xp_level_roles_guild_id ON xp_level_roles(guild_id);
CREATE INDEX IF NOT EXISTS idx_xp_level_roles_level ON xp_level_roles(guild_id, level);
CREATE INDEX IF NOT EXISTS idx_xp_milestone_rewards_guild_id ON xp_milestone_rewards(guild_id);
CREATE INDEX IF NOT EXISTS idx_xp_milestone_rewards_xp ON xp_milestone_rewards(guild_id, xp_required);

-- 5. Updated_at Trigger für alle Tabellen
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für xp_settings
DROP TRIGGER IF EXISTS update_xp_settings_updated_at ON xp_settings;
CREATE TRIGGER update_xp_settings_updated_at
    BEFORE UPDATE ON xp_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für xp_level_roles
DROP TRIGGER IF EXISTS update_xp_level_roles_updated_at ON xp_level_roles;
CREATE TRIGGER update_xp_level_roles_updated_at
    BEFORE UPDATE ON xp_level_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für xp_milestone_rewards
DROP TRIGGER IF EXISTS update_xp_milestone_rewards_updated_at ON xp_milestone_rewards;
CREATE TRIGGER update_xp_milestone_rewards_updated_at
    BEFORE UPDATE ON xp_milestone_rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Row Level Security (RLS) aktivieren
ALTER TABLE xp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_level_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_milestone_rewards ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies (Service Role hat vollen Zugriff)
-- XP Settings Policies
DROP POLICY IF EXISTS "Service role can manage xp_settings" ON xp_settings;
CREATE POLICY "Service role can manage xp_settings" ON xp_settings
    FOR ALL USING (true);

-- Level Roles Policies
DROP POLICY IF EXISTS "Service role can manage xp_level_roles" ON xp_level_roles;
CREATE POLICY "Service role can manage xp_level_roles" ON xp_level_roles
    FOR ALL USING (true);

-- Milestone Rewards Policies
DROP POLICY IF EXISTS "Service role can manage xp_milestone_rewards" ON xp_milestone_rewards;
CREATE POLICY "Service role can manage xp_milestone_rewards" ON xp_milestone_rewards
    FOR ALL USING (true);

-- 8. Hilfsfunktionen für XP-System

-- Funktion: Get all XP settings for guild
CREATE OR REPLACE FUNCTION get_xp_settings_for_guild(guild_id_param TEXT)
RETURNS JSON AS $$
DECLARE
    settings_json JSON;
    level_roles JSON;
    milestone_rewards JSON;
BEGIN
    -- Hole Basis-Settings
    SELECT row_to_json(xp_settings.*) INTO settings_json
    FROM xp_settings 
    WHERE guild_id = guild_id_param;
    
    -- Hole Level Rollen
    SELECT COALESCE(json_agg(
        json_build_object(
            'level', level,
            'roleId', role_id,
            'roleName', role_name
        ) ORDER BY level
    ), '[]'::json) INTO level_roles
    FROM xp_level_roles 
    WHERE guild_id = guild_id_param;
    
    -- Hole Meilenstein Belohnungen
    SELECT COALESCE(json_agg(
        json_build_object(
            'xp', xp_required,
            'reward', reward_name
        ) ORDER BY xp_required
    ), '[]'::json) INTO milestone_rewards
    FROM xp_milestone_rewards 
    WHERE guild_id = guild_id_param;
    
    -- Kombiniere alles
    IF settings_json IS NULL THEN
        RETURN json_build_object(
            'levelRoles', level_roles,
            'milestoneRewards', milestone_rewards
        );
    ELSE
        RETURN settings_json || json_build_object(
            'levelRoles', level_roles,
            'milestoneRewards', milestone_rewards
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Beispiel-Daten für Standard-Guild einfügen (optional)
-- Diese können für Tests verwendet werden
INSERT INTO xp_settings (guild_id) 
VALUES ('1325050102477488169') 
ON CONFLICT (guild_id) DO NOTHING;

-- Standard Level-Rollen
INSERT INTO xp_level_roles (guild_id, level, role_id, role_name) VALUES
    ('1325050102477488169', 5, '1383131386013024379', '🔥 Level 5'),
    ('1325050102477488169', 10, '1383131387917373482', '⚡ Level 10'),
    ('1325050102477488169', 15, '1383131389406216303', '💫 Level 15'),
    ('1325050102477488169', 20, '1383131390543138816', '🌟 Level 20'),
    ('1325050102477488169', 25, '1383131391994106027', '🚀 Level 25'),
    ('1325050102477488169', 30, '1383131393344798740', '🎯 Level 30'),
    ('1325050102477488169', 40, '1383131394884239360', '💎 Level 40'),
    ('1325050102477488169', 50, '1383131396498915389', '👑 Level 50'),
    ('1325050102477488169', 75, '1383131397715398787', '🏆 Level 75'),
    ('1325050102477488169', 100, '1383131399145521363', '🔮 Level 100')
ON CONFLICT (guild_id, level) DO NOTHING;

-- Standard Meilenstein-Belohnungen
INSERT INTO xp_milestone_rewards (guild_id, xp_required, reward_name) VALUES
    ('1325050102477488169', 500, '🌱 Newcomer'),
    ('1325050102477488169', 1000, '💬 Aktives Mitglied'),
    ('1325050102477488169', 2500, '⭐ Erfahrener User'),
    ('1325050102477488169', 5000, '🎯 Server-Veteran'),
    ('1325050102477488169', 10000, '👑 Elite Member'),
    ('1325050102477488169', 25000, '🏆 Server-Legende'),
    ('1325050102477488169', 50000, '💎 Diamond Member')
ON CONFLICT (guild_id, xp_required) DO NOTHING;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
-- 
-- Nach dieser Migration können XP-Settings in Supabase gespeichert werden:
-- 
-- VERWENDUNG:
-- 1. Führe diese Migration in Supabase aus
-- 2. Der Discord Bot wird automatisch Supabase für Settings verwenden
-- 3. Das Dashboard kann Level-Rollen und Meilensteine verwalten
-- 4. JSON-Fallback bleibt für Kompatibilität erhalten
-- 
-- TABELLEN ERSTELLT:
-- - xp_settings: Haupt-Settings pro Guild
-- - xp_level_roles: Level-Rollen (Dashboard-verwaltbar)
-- - xp_milestone_rewards: Meilenstein-Belohnungen (Dashboard-verwaltbar)
-- 
-- FEATURES:
-- - Multi-Guild Support durch guild_id
-- - RLS für Sicherheit
-- - Performance-optimierte Indexe
-- - Auto-Update Timestamps
-- - JSON Helper-Funktionen
-- 
-- ================================================ 