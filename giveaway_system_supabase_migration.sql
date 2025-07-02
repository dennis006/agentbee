-- =============================================
-- GIVEAWAY SYSTEM SUPABASE MIGRATION
-- =============================================
-- Umfassende Migration für das Giveaway-System
-- Datum: 2025-01-16
-- Version: 1.0

-- =============================================
-- 1. SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS giveaway_settings (
    id SERIAL PRIMARY KEY,
    enabled BOOLEAN DEFAULT true,
    default_channel VARCHAR(255) DEFAULT 'giveaways',
    embed_color VARCHAR(10) DEFAULT '0x00FF7F',
    ended_embed_color VARCHAR(10) DEFAULT '0xFFD700',
    winner_dm_color VARCHAR(10) DEFAULT '0xFFD700',
    manager_roles JSONB DEFAULT '[]'::jsonb,
    notifications JSONB DEFAULT '{"newGiveaway": true, "giveawayEnd": true, "giveawayWin": true}'::jsonb,
    limits JSONB DEFAULT '{"maxActiveGiveaways": 5, "maxWinners": 10, "minDuration": 60000, "maxDuration": 2592000000}'::jsonb,
    anti_cheat JSONB DEFAULT '{"preventSelfInvite": true, "preventBotAccounts": true, "minAccountAge": 604800000, "preventMultipleEntries": true, "preventDuplicateIPs": false}'::jsonb,
    leaderboard JSONB DEFAULT '{"autoCreate": true, "updateInterval": 30, "autoUpdate": true, "showUsernames": true, "autoPost": {"enabled": false, "lastPosted": 0, "categoryName": "giveaway"}}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. GIVEAWAYS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS giveaway_giveaways (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT DEFAULT '',
    prize VARCHAR(1000) NOT NULL,
    type VARCHAR(50) DEFAULT 'classic',
    winners INTEGER DEFAULT 1,
    end_time BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    created_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    channel_id VARCHAR(255) NOT NULL,
    channel_name VARCHAR(255),
    message_id VARCHAR(255),
    leaderboard_channel_id VARCHAR(255),
    leaderboard_message_id VARCHAR(255),
    auto_leaderboard_channel_id VARCHAR(255),
    auto_leaderboard_message_id VARCHAR(255),
    requirements JSONB DEFAULT '{}'::jsonb,
    anti_cheat JSONB DEFAULT '{}'::jsonb,
    winner_list JSONB DEFAULT '[]'::jsonb,
    ended_at BIGINT,
    total_participants INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. PARTICIPANTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS giveaway_participants (
    id SERIAL PRIMARY KEY,
    giveaway_id VARCHAR(255) NOT NULL REFERENCES giveaway_giveaways(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    joined_at BIGINT DEFAULT EXTRACT(epoch FROM NOW()) * 1000,
    is_winner BOOLEAN DEFAULT false,
    is_valid BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(giveaway_id, user_id)
);

-- =============================================
-- 4. INVITE TRACKING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS giveaway_invite_tracking (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    total_invites INTEGER DEFAULT 0,
    codes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. INVITE CODES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS giveaway_invite_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    giveaway_id VARCHAR(255) NOT NULL REFERENCES giveaway_giveaways(id) ON DELETE CASCADE,
    uses INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 100,
    expires_at BIGINT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. USER INVITES TRACKING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS giveaway_user_invites (
    id SERIAL PRIMARY KEY,
    giveaway_id VARCHAR(255) NOT NULL REFERENCES giveaway_giveaways(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    invite_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(giveaway_id, user_id)
);

-- =============================================
-- 7. INVITED USERS TRACKING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS giveaway_invited_users (
    id SERIAL PRIMARY KEY,
    giveaway_id VARCHAR(255) NOT NULL REFERENCES giveaway_giveaways(id) ON DELETE CASCADE,
    inviter_id VARCHAR(255) NOT NULL,
    invited_id VARCHAR(255) NOT NULL,
    invited_username VARCHAR(255),
    invited_at BIGINT DEFAULT EXTRACT(epoch FROM NOW()) * 1000,
    is_valid BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(giveaway_id, inviter_id, invited_id)
);

-- =============================================
-- 8. INDEXES FOR PERFORMANCE
-- =============================================

-- Giveaways indexes
CREATE INDEX IF NOT EXISTS idx_giveaways_status ON giveaway_giveaways(status);
CREATE INDEX IF NOT EXISTS idx_giveaways_end_time ON giveaway_giveaways(end_time);
CREATE INDEX IF NOT EXISTS idx_giveaways_type ON giveaway_giveaways(type);
CREATE INDEX IF NOT EXISTS idx_giveaways_created_at ON giveaway_giveaways(created_at);
CREATE INDEX IF NOT EXISTS idx_giveaways_channel_id ON giveaway_giveaways(channel_id);

-- Participants indexes
CREATE INDEX IF NOT EXISTS idx_participants_giveaway_id ON giveaway_participants(giveaway_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON giveaway_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_winner ON giveaway_participants(giveaway_id, is_winner);

-- Invite tracking indexes
CREATE INDEX IF NOT EXISTS idx_invite_tracking_user_id ON giveaway_invite_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_tracking_total_invites ON giveaway_invite_tracking(total_invites DESC);

-- Invite codes indexes
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON giveaway_invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_user_giveaway ON giveaway_invite_codes(user_id, giveaway_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_giveaway_active ON giveaway_invite_codes(giveaway_id, is_active);

-- User invites indexes
CREATE INDEX IF NOT EXISTS idx_user_invites_giveaway ON giveaway_user_invites(giveaway_id);
CREATE INDEX IF NOT EXISTS idx_user_invites_user ON giveaway_user_invites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_invites_count ON giveaway_user_invites(giveaway_id, invite_count DESC);

-- Invited users indexes
CREATE INDEX IF NOT EXISTS idx_invited_users_giveaway ON giveaway_invited_users(giveaway_id);
CREATE INDEX IF NOT EXISTS idx_invited_users_inviter ON giveaway_invited_users(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invited_users_invited ON giveaway_invited_users(invited_id);

-- =============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE giveaway_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaway_giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaway_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaway_invite_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaway_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaway_user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaway_invited_users ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now, can be restricted later)
DROP POLICY IF EXISTS "Allow all giveaway_settings" ON giveaway_settings;
CREATE POLICY "Allow all giveaway_settings" ON giveaway_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all giveaway_giveaways" ON giveaway_giveaways;
CREATE POLICY "Allow all giveaway_giveaways" ON giveaway_giveaways FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all giveaway_participants" ON giveaway_participants;
CREATE POLICY "Allow all giveaway_participants" ON giveaway_participants FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all giveaway_invite_tracking" ON giveaway_invite_tracking;
CREATE POLICY "Allow all giveaway_invite_tracking" ON giveaway_invite_tracking FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all giveaway_invite_codes" ON giveaway_invite_codes;
CREATE POLICY "Allow all giveaway_invite_codes" ON giveaway_invite_codes FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all giveaway_user_invites" ON giveaway_user_invites;
CREATE POLICY "Allow all giveaway_user_invites" ON giveaway_user_invites FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all giveaway_invited_users" ON giveaway_invited_users;
CREATE POLICY "Allow all giveaway_invited_users" ON giveaway_invited_users FOR ALL USING (true);

-- =============================================
-- 10. TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_giveaway_settings_updated_at BEFORE UPDATE ON giveaway_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_giveaway_giveaways_updated_at BEFORE UPDATE ON giveaway_giveaways FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_giveaway_invite_tracking_updated_at BEFORE UPDATE ON giveaway_invite_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_giveaway_invite_codes_updated_at BEFORE UPDATE ON giveaway_invite_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_giveaway_user_invites_updated_at BEFORE UPDATE ON giveaway_user_invites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 11. HELPER FUNCTIONS
-- =============================================

-- Function to get active giveaways
CREATE OR REPLACE FUNCTION get_active_giveaways()
RETURNS TABLE (
    id VARCHAR(255),
    title VARCHAR(500),
    description TEXT,
    prize VARCHAR(1000),
    type VARCHAR(50),
    winners INTEGER,
    end_time BIGINT,
    created_at BIGINT,
    status VARCHAR(50),
    channel_id VARCHAR(255),
    channel_name VARCHAR(255),
    participant_count BIGINT,
    time_remaining BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.title,
        g.description,
        g.prize,
        g.type,
        g.winners,
        g.end_time,
        g.created_at,
        g.status,
        g.channel_id,
        g.channel_name,
        COUNT(p.id) as participant_count,
        GREATEST(0, g.end_time - EXTRACT(epoch FROM NOW()) * 1000)::BIGINT as time_remaining
    FROM giveaway_giveaways g
    LEFT JOIN giveaway_participants p ON g.id = p.giveaway_id AND p.is_valid = true
    WHERE g.status = 'active'
    GROUP BY g.id, g.title, g.description, g.prize, g.type, g.winners, g.end_time, g.created_at, g.status, g.channel_id, g.channel_name
    ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get giveaway statistics
CREATE OR REPLACE FUNCTION get_giveaway_stats()
RETURNS TABLE (
    total_giveaways BIGINT,
    active_giveaways BIGINT,
    ended_giveaways BIGINT,
    total_participants BIGINT,
    total_invites BIGINT,
    average_participants NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_giveaways,
        COUNT(CASE WHEN status = 'active' THEN 1 END)::BIGINT as active_giveaways,
        COUNT(CASE WHEN status = 'ended' THEN 1 END)::BIGINT as ended_giveaways,
        COALESCE(SUM(total_participants), 0)::BIGINT as total_participants,
        COALESCE((SELECT SUM(total_invites) FROM giveaway_invite_tracking), 0)::BIGINT as total_invites,
        CASE 
            WHEN COUNT(*) > 0 THEN ROUND(COALESCE(AVG(total_participants), 0), 2)
            ELSE 0 
        END as average_participants
    FROM giveaway_giveaways;
END;
$$ LANGUAGE plpgsql;

-- Function to get invite leaderboard for a giveaway
CREATE OR REPLACE FUNCTION get_invite_leaderboard(giveaway_id_param VARCHAR(255))
RETURNS TABLE (
    user_id VARCHAR(255),
    username VARCHAR(255),
    invite_count INTEGER,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.user_id,
        COALESCE(it.username, 'Unknown') as username,
        ui.invite_count,
        ROW_NUMBER() OVER (ORDER BY ui.invite_count DESC, ui.updated_at ASC)::INTEGER as rank
    FROM giveaway_user_invites ui
    LEFT JOIN giveaway_invite_tracking it ON ui.user_id = it.user_id
    WHERE ui.giveaway_id = giveaway_id_param AND ui.invite_count > 0
    ORDER BY ui.invite_count DESC, ui.updated_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired giveaways
CREATE OR REPLACE FUNCTION cleanup_expired_giveaways()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER := 0;
BEGIN
    -- Mark expired giveaways as ended
    UPDATE giveaway_giveaways 
    SET status = 'ended', ended_at = EXTRACT(epoch FROM NOW()) * 1000
    WHERE status = 'active' AND end_time < EXTRACT(epoch FROM NOW()) * 1000;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Clean up old expired invite codes
    UPDATE giveaway_invite_codes 
    SET is_active = false 
    WHERE is_active = true AND expires_at < EXTRACT(epoch FROM NOW()) * 1000;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 12. VIEWS FOR EASY DATA ACCESS
-- =============================================

-- View for active giveaways with participant counts
CREATE OR REPLACE VIEW active_giveaways_with_stats AS
SELECT 
    g.*,
    COUNT(p.id) as participant_count,
    GREATEST(0, g.end_time - EXTRACT(epoch FROM NOW()) * 1000)::BIGINT as time_remaining
FROM giveaway_giveaways g
LEFT JOIN giveaway_participants p ON g.id = p.giveaway_id AND p.is_valid = true
WHERE g.status = 'active'
GROUP BY g.id
ORDER BY g.created_at DESC;

-- View for giveaway history with participant counts  
CREATE OR REPLACE VIEW giveaway_history_with_stats AS
SELECT 
    g.*,
    COUNT(p.id) as participant_count,
    0::BIGINT as time_remaining
FROM giveaway_giveaways g
LEFT JOIN giveaway_participants p ON g.id = p.giveaway_id AND p.is_valid = true
GROUP BY g.id
ORDER BY g.created_at DESC;

-- View for invite leaderboard global stats
CREATE OR REPLACE VIEW invite_leaderboard_global AS
SELECT 
    it.user_id,
    it.username,
    it.total_invites,
    COUNT(ic.id) as active_codes,
    ROW_NUMBER() OVER (ORDER BY it.total_invites DESC) as global_rank
FROM giveaway_invite_tracking it
LEFT JOIN giveaway_invite_codes ic ON it.user_id = ic.user_id AND ic.is_active = true
GROUP BY it.user_id, it.username, it.total_invites
ORDER BY it.total_invites DESC;

-- =============================================
-- 13. INITIAL DATA SETUP
-- =============================================

-- Insert default settings if none exist
INSERT INTO giveaway_settings (
    enabled, default_channel, embed_color, ended_embed_color, winner_dm_color,
    manager_roles, notifications, limits, anti_cheat, leaderboard
) 
SELECT 
    true, 'giveaways', '0x00FF7F', '0xFFD700', '0xFFD700',
    '["Admin", "Moderator"]'::jsonb,
    '{"newGiveaway": true, "giveawayEnd": true, "giveawayWin": true}'::jsonb,
    '{"maxActiveGiveaways": 5, "maxWinners": 10, "minDuration": 60000, "maxDuration": 2592000000}'::jsonb,
    '{"preventSelfInvite": true, "preventBotAccounts": true, "minAccountAge": 604800000, "preventMultipleEntries": true, "preventDuplicateIPs": false}'::jsonb,
    '{"autoCreate": true, "updateInterval": 30, "autoUpdate": true, "showUsernames": true, "autoPost": {"enabled": false, "lastPosted": 0, "categoryName": "giveaway"}}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM giveaway_settings LIMIT 1);

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Giveaway System Supabase Migration completed successfully!';
    RAISE NOTICE '📊 Created tables: giveaway_settings, giveaway_giveaways, giveaway_participants, giveaway_invite_tracking, giveaway_invite_codes, giveaway_user_invites, giveaway_invited_users';
    RAISE NOTICE '🔍 Created indexes for optimal performance';
    RAISE NOTICE '🛡️ Enabled Row Level Security with basic policies';
    RAISE NOTICE '⚡ Added triggers for automatic timestamp updates';
    RAISE NOTICE '🔧 Created helper functions for common operations';
    RAISE NOTICE '📈 Created views for easy data access';
    RAISE NOTICE '🚀 System ready for production use!';
END $$; 