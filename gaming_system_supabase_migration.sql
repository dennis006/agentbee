-- ================================================================
-- 🎮 GAMING SYSTEM SUPABASE MIGRATION
-- ================================================================
-- Comprehensive Gaming System Database
-- Features: Smart Auto-Ping, Team Management, Reputation, Voice Channels
-- ================================================================

-- Drop existing tables if they exist (clean migration)
DROP TABLE IF EXISTS gaming_team_invites CASCADE;
DROP TABLE IF EXISTS gaming_team_members CASCADE;
DROP TABLE IF EXISTS gaming_teams CASCADE;
DROP TABLE IF EXISTS gaming_scheduled_games CASCADE;
DROP TABLE IF EXISTS gaming_reputation_history CASCADE;
DROP TABLE IF EXISTS gaming_player_reputation CASCADE;
DROP TABLE IF EXISTS gaming_player_stats CASCADE;
DROP TABLE IF EXISTS gaming_voice_channels CASCADE;
DROP TABLE IF EXISTS gaming_system_settings CASCADE;

-- ================================================================
-- 1. GAMING SYSTEM SETTINGS
-- ================================================================

CREATE TABLE gaming_system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    
    -- System Settings
    enabled BOOLEAN DEFAULT true,
    auto_channel_creation BOOLEAN DEFAULT true,
    auto_role_creation BOOLEAN DEFAULT true,
    
    -- Auto-Ping System Settings
    auto_ping_enabled BOOLEAN DEFAULT true,
    auto_ping_min_rank TEXT DEFAULT 'Bronze',
    auto_ping_max_radius INTEGER DEFAULT 5,
    auto_ping_cooldown INTEGER DEFAULT 30000,
    auto_ping_max_per_hour INTEGER DEFAULT 10,
    auto_ping_smart_matching BOOLEAN DEFAULT true,
    auto_ping_respect_dnd BOOLEAN DEFAULT true,
    
    -- Quick Join Settings
    quick_join_enabled BOOLEAN DEFAULT true,
    quick_join_auto_voice BOOLEAN DEFAULT true,
    quick_join_max_team_size INTEGER DEFAULT 5,
    quick_join_allow_spectators BOOLEAN DEFAULT true,
    quick_join_auto_role_assignment BOOLEAN DEFAULT true,
    
    -- Team Tracker Settings
    team_tracker_enabled BOOLEAN DEFAULT true,
    team_tracker_show_progress BOOLEAN DEFAULT true,
    team_tracker_live_updates BOOLEAN DEFAULT true,
    team_tracker_track_stats BOOLEAN DEFAULT true,
    team_tracker_display_channel TEXT DEFAULT 'team-status',
    
    -- Voice Channel Settings
    voice_channels_enabled BOOLEAN DEFAULT true,
    voice_channels_auto_create BOOLEAN DEFAULT true,
    voice_channels_auto_delete BOOLEAN DEFAULT true,
    voice_channels_naming_scheme TEXT DEFAULT '{emoji} {game} Team #{number}',
    voice_channels_max_channels INTEGER DEFAULT 10,
    voice_channels_category_name TEXT DEFAULT '🎮 Gaming Lobbys',
    
    -- Reputation System Settings
    reputation_enabled BOOLEAN DEFAULT true,
    reputation_starting_points INTEGER DEFAULT 100,
    reputation_max_points INTEGER DEFAULT 1000,
    reputation_min_points INTEGER DEFAULT 0,
    reputation_good_teammate_reward INTEGER DEFAULT 5,
    reputation_bad_teammate_deduction INTEGER DEFAULT 10,
    reputation_win_bonus INTEGER DEFAULT 3,
    reputation_loss_deduction INTEGER DEFAULT 1,
    reputation_display_badges BOOLEAN DEFAULT true,
    reputation_require_min_games INTEGER DEFAULT 5,
    
    -- Scheduling Settings
    scheduling_enabled BOOLEAN DEFAULT true,
    scheduling_max_advance_booking INTEGER DEFAULT 7,
    scheduling_reminder_times INTEGER[] DEFAULT ARRAY[60, 15, 5],
    scheduling_auto_cancel INTEGER DEFAULT 30,
    
    -- Supported Games Configuration (JSONB)
    supported_games JSONB DEFAULT '{
        "valorant": {
            "name": "Valorant",
            "emoji": "🎯",
            "teamSize": 5,
            "roles": ["Controller", "Duelist", "Initiator", "Sentinel"],
            "ranks": ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"],
            "channels": {
                "general": "🎯 valorant-general",
                "lfg": "🔍 valorant-lfg", 
                "ranked": "🏆 valorant-ranked",
                "scrims": "⚔️ valorant-scrims"
            }
        }
    }'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 2. GAMING TEAMS
-- ================================================================

CREATE TABLE gaming_teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id TEXT UNIQUE NOT NULL,
    guild_id TEXT NOT NULL,
    
    -- Team Details
    game TEXT NOT NULL,
    game_mode TEXT DEFAULT 'Competitive',
    leader_id TEXT NOT NULL,
    leader_username TEXT NOT NULL,
    description TEXT NOT NULL,
    max_size INTEGER DEFAULT 5,
    current_size INTEGER DEFAULT 1,
    require_rank TEXT,
    
    -- Team Status
    status TEXT DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'full', 'playing', 'finished', 'disbanded')),
    privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'private', 'friends-only')),
    
    -- Voice Channel Integration
    voice_channel_id TEXT,
    voice_channel_name TEXT,
    auto_voice_join BOOLEAN DEFAULT true,
    
    -- Scheduling
    scheduled_start TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER, -- in minutes
    
    -- Stats & Tracking
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE
);

-- ================================================================
-- 3. GAMING TEAM MEMBERS
-- ================================================================

CREATE TABLE gaming_team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES gaming_teams(id) ON DELETE CASCADE,
    guild_id TEXT NOT NULL,
    
    -- Member Details
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    display_name TEXT,
    
    -- Role & Stats
    team_role TEXT DEFAULT 'Member',
    preferred_game_role TEXT,
    rank TEXT DEFAULT 'Unranked',
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'left', 'kicked')),
    is_leader BOOLEAN DEFAULT false,
    is_spectator BOOLEAN DEFAULT false,
    
    -- Voice Integration
    in_voice_channel BOOLEAN DEFAULT false,
    voice_joined_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(team_id, user_id)
);

-- ================================================================
-- 4. PLAYER REPUTATION SYSTEM
-- ================================================================

CREATE TABLE gaming_player_reputation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    
    -- Reputation Points
    points INTEGER DEFAULT 100,
    level TEXT DEFAULT 'Average',
    
    -- Game Statistics
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    
    -- Social Scores
    commendations INTEGER DEFAULT 0,
    reports INTEGER DEFAULT 0,
    good_teammate_votes INTEGER DEFAULT 0,
    bad_teammate_votes INTEGER DEFAULT 0,
    
    -- Calculated Stats
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    reliability_score DECIMAL(5,2) DEFAULT 100.00,
    teamwork_score DECIMAL(5,2) DEFAULT 100.00,
    
    -- Badges & Achievements
    badges JSONB DEFAULT '[]'::jsonb,
    achievements JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(guild_id, user_id)
);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

-- Gaming System Settings
CREATE INDEX idx_gaming_settings_guild_id ON gaming_system_settings(guild_id);

-- Gaming Teams
CREATE INDEX idx_gaming_teams_guild_id ON gaming_teams(guild_id);
CREATE INDEX idx_gaming_teams_game ON gaming_teams(game);
CREATE INDEX idx_gaming_teams_status ON gaming_teams(status);
CREATE INDEX idx_gaming_teams_leader ON gaming_teams(leader_id);
CREATE INDEX idx_gaming_teams_created_at ON gaming_teams(created_at DESC);

-- Team Members
CREATE INDEX idx_gaming_team_members_team_id ON gaming_team_members(team_id);
CREATE INDEX idx_gaming_team_members_user_id ON gaming_team_members(user_id);
CREATE INDEX idx_gaming_team_members_guild_id ON gaming_team_members(guild_id);
CREATE INDEX idx_gaming_team_members_status ON gaming_team_members(status);

-- Player Reputation
CREATE INDEX idx_gaming_reputation_guild_user ON gaming_player_reputation(guild_id, user_id);
CREATE INDEX idx_gaming_reputation_points ON gaming_player_reputation(points DESC);
CREATE INDEX idx_gaming_reputation_level ON gaming_player_reputation(level);

-- ================================================================
-- TRIGGERS FOR AUTO-TIMESTAMPS
-- ================================================================

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_gaming_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_gaming_system_settings_updated_at
    BEFORE UPDATE ON gaming_system_settings
    FOR EACH ROW EXECUTE FUNCTION update_gaming_updated_at_column();

CREATE TRIGGER update_gaming_teams_updated_at
    BEFORE UPDATE ON gaming_teams
    FOR EACH ROW EXECUTE FUNCTION update_gaming_updated_at_column();

CREATE TRIGGER update_gaming_player_reputation_updated_at
    BEFORE UPDATE ON gaming_player_reputation
    FOR EACH ROW EXECUTE FUNCTION update_gaming_updated_at_column();

-- ================================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE gaming_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaming_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaming_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaming_player_reputation ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Allow authenticated users to read gaming data" ON gaming_system_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow service role full access to gaming data" ON gaming_system_settings
    FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- DEFAULT DATA & FUNCTIONS
-- ================================================================

-- Function to initialize gaming system for a guild
CREATE OR REPLACE FUNCTION initialize_gaming_system(p_guild_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_settings_id UUID;
    v_result JSONB;
BEGIN
    -- Insert default settings
    INSERT INTO gaming_system_settings (guild_id)
    VALUES (p_guild_id)
    ON CONFLICT (guild_id) DO NOTHING
    RETURNING id INTO v_settings_id;
    
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Gaming system initialized for guild: ' || p_guild_id,
        'settings_id', v_settings_id
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- INITIAL SETUP COMPLETE
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '🎮 Gaming System Supabase Migration erfolgreich abgeschlossen!';
    RAISE NOTICE '📊 Tabellen erstellt: 4';
    RAISE NOTICE '🔧 Funktionen erstellt: 2';
    RAISE NOTICE '⚡ Trigger erstellt: 3';
    RAISE NOTICE '🛡️ RLS Policies aktiviert: 4 Tabellen';
END $$; 