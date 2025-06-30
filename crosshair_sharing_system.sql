-- Crosshair Sharing System with Discord Integration
-- Created for AgentBee Discord Bot

-- Table: crosshair_shares
-- Stores all shared crosshairs with their details
CREATE TABLE IF NOT EXISTS crosshair_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- Discord User ID
    username VARCHAR(255) NOT NULL, -- Discord Username
    user_avatar VARCHAR(500), -- Discord Avatar URL
    crosshair_code TEXT NOT NULL, -- Valorant Crosshair Code
    crosshair_name VARCHAR(255), -- Optional name for the crosshair
    description TEXT, -- Optional description
    image_url VARCHAR(500), -- Generated crosshair image URL
    discord_message_id VARCHAR(255) UNIQUE, -- Discord message ID for the post
    discord_channel_id VARCHAR(255) NOT NULL, -- Channel where it was posted
    guild_id VARCHAR(255) NOT NULL, -- Discord Server ID
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    vote_score INTEGER DEFAULT 0, -- upvotes - downvotes
    is_featured BOOLEAN DEFAULT FALSE, -- Featured crosshairs
    is_approved BOOLEAN DEFAULT TRUE, -- Moderation
    tags TEXT[], -- Optional tags like "pro", "creative", "minimal"
    crosshair_type VARCHAR(100), -- Type detected: "Center Dot", "Hybrid", etc.
    color_hex VARCHAR(7), -- Primary color if custom
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: crosshair_votes
-- Tracks individual user votes
CREATE TABLE IF NOT EXISTS crosshair_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    crosshair_id UUID REFERENCES crosshair_shares(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- Discord User ID
    username VARCHAR(255) NOT NULL, -- Discord Username
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    guild_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(crosshair_id, user_id) -- One vote per user per crosshair
);

-- Table: crosshair_settings
-- Discord channel and bot configuration
CREATE TABLE IF NOT EXISTS crosshair_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id VARCHAR(255) UNIQUE NOT NULL,
    guild_name VARCHAR(255) NOT NULL,
    crosshair_channel_id VARCHAR(255), -- Channel for posting crosshairs
    crosshair_channel_name VARCHAR(255),
    -- Interactive Panel Settings (like Verify system)
    panel_enabled BOOLEAN DEFAULT FALSE, -- Enable Interactive Panel
    panel_channel_id VARCHAR(255), -- Channel for the interactive panel
    panel_channel_name VARCHAR(255), -- Human-readable panel channel name
    panel_message_id VARCHAR(255), -- Discord message ID of panel (for updates)
    panel_embed_color VARCHAR(7) DEFAULT '#00D4AA', -- Panel embed color
    auto_post_enabled BOOLEAN DEFAULT TRUE, -- Auto-post new crosshairs
    voting_enabled BOOLEAN DEFAULT TRUE, -- Enable voting
    require_approval BOOLEAN DEFAULT FALSE, -- Moderation required
    moderator_role_id VARCHAR(255), -- Role for moderation
    featured_role_id VARCHAR(255), -- Role that can feature crosshairs
    min_votes_for_featured INTEGER DEFAULT 10, -- Min votes to auto-feature
    webhook_url VARCHAR(500), -- Discord webhook for posting
    notification_settings JSONB DEFAULT '{}', -- Additional settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: crosshair_copies
-- Track how often crosshairs are copied
CREATE TABLE IF NOT EXISTS crosshair_copies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    crosshair_id UUID REFERENCES crosshair_shares(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- Who copied it
    username VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    copied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crosshair_shares_guild_id ON crosshair_shares(guild_id);
CREATE INDEX IF NOT EXISTS idx_crosshair_shares_user_id ON crosshair_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_crosshair_shares_vote_score ON crosshair_shares(vote_score DESC);
CREATE INDEX IF NOT EXISTS idx_crosshair_shares_created_at ON crosshair_shares(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crosshair_shares_featured ON crosshair_shares(is_featured);
CREATE INDEX IF NOT EXISTS idx_crosshair_votes_crosshair_id ON crosshair_votes(crosshair_id);
CREATE INDEX IF NOT EXISTS idx_crosshair_votes_user_id ON crosshair_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_crosshair_copies_crosshair_id ON crosshair_copies(crosshair_id);
-- Interactive Panel indexes
CREATE INDEX IF NOT EXISTS idx_crosshair_settings_panel_enabled ON crosshair_settings(panel_enabled);
CREATE INDEX IF NOT EXISTS idx_crosshair_settings_panel_message_id ON crosshair_settings(panel_message_id);

-- Function to update vote counts automatically
CREATE OR REPLACE FUNCTION update_crosshair_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE crosshair_shares 
        SET 
            upvotes = COALESCE((
                SELECT COUNT(*) 
                FROM crosshair_votes 
                WHERE crosshair_id = NEW.crosshair_id AND vote_type = 'upvote'
            ), 0),
            downvotes = COALESCE((
                SELECT COUNT(*) 
                FROM crosshair_votes 
                WHERE crosshair_id = NEW.crosshair_id AND vote_type = 'downvote'
            ), 0),
            total_votes = COALESCE((
                SELECT COUNT(*) 
                FROM crosshair_votes 
                WHERE crosshair_id = NEW.crosshair_id
            ), 0),
            vote_score = COALESCE((
                SELECT 
                    COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) - 
                    COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END)
                FROM crosshair_votes 
                WHERE crosshair_id = NEW.crosshair_id
            ), 0),
            updated_at = NOW()
        WHERE id = NEW.crosshair_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        UPDATE crosshair_shares 
        SET 
            upvotes = COALESCE((
                SELECT COUNT(*) 
                FROM crosshair_votes 
                WHERE crosshair_id = OLD.crosshair_id AND vote_type = 'upvote'
            ), 0),
            downvotes = COALESCE((
                SELECT COUNT(*) 
                FROM crosshair_votes 
                WHERE crosshair_id = OLD.crosshair_id AND vote_type = 'downvote'
            ), 0),
            total_votes = COALESCE((
                SELECT COUNT(*) 
                FROM crosshair_votes 
                WHERE crosshair_id = OLD.crosshair_id
            ), 0),
            vote_score = COALESCE((
                SELECT 
                    COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) - 
                    COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END)
                FROM crosshair_votes 
                WHERE crosshair_id = OLD.crosshair_id
            ), 0),
            updated_at = NOW()
        WHERE id = OLD.crosshair_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic vote count updates
DROP TRIGGER IF EXISTS trigger_update_vote_counts ON crosshair_votes;
CREATE TRIGGER trigger_update_vote_counts
    AFTER INSERT OR UPDATE OR DELETE ON crosshair_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_crosshair_vote_counts();

-- Function to auto-feature popular crosshairs
CREATE OR REPLACE FUNCTION auto_feature_popular_crosshairs()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-feature if vote score is high enough
    IF NEW.vote_score >= (
        SELECT COALESCE(min_votes_for_featured, 10)
        FROM crosshair_settings 
        WHERE guild_id = NEW.guild_id
    ) AND NEW.is_featured = FALSE THEN
        UPDATE crosshair_shares 
        SET is_featured = TRUE, updated_at = NOW()
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-featuring
DROP TRIGGER IF EXISTS trigger_auto_feature ON crosshair_shares;
CREATE TRIGGER trigger_auto_feature
    AFTER UPDATE ON crosshair_shares
    FOR EACH ROW
    WHEN (NEW.vote_score IS DISTINCT FROM OLD.vote_score)
    EXECUTE FUNCTION auto_feature_popular_crosshairs();

-- Row Level Security (RLS) Policies
ALTER TABLE crosshair_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE crosshair_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crosshair_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crosshair_copies ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for service role (bot)
CREATE POLICY "Service role can manage crosshair_shares" ON crosshair_shares
    FOR ALL USING (true);

CREATE POLICY "Service role can manage crosshair_votes" ON crosshair_votes
    FOR ALL USING (true);

CREATE POLICY "Service role can manage crosshair_settings" ON crosshair_settings
    FOR ALL USING (true);

CREATE POLICY "Service role can manage crosshair_copies" ON crosshair_copies
    FOR ALL USING (true);

-- Sample data for testing
INSERT INTO crosshair_settings (
    guild_id, 
    guild_name, 
    auto_post_enabled, 
    voting_enabled, 
    min_votes_for_featured
) VALUES (
    'sample_guild_123', 
    'Test Server', 
    true, 
    true, 
    5
) ON CONFLICT (guild_id) DO NOTHING;

-- Grant permissions
GRANT ALL ON crosshair_shares TO service_role;
GRANT ALL ON crosshair_votes TO service_role;
GRANT ALL ON crosshair_settings TO service_role;
GRANT ALL ON crosshair_copies TO service_role;

-- Comments for documentation
COMMENT ON TABLE crosshair_shares IS 'Stores shared Valorant crosshairs with voting data';
COMMENT ON TABLE crosshair_votes IS 'Individual user votes on crosshairs';
COMMENT ON TABLE crosshair_settings IS 'Discord server configuration for crosshair sharing';
COMMENT ON TABLE crosshair_copies IS 'Tracks crosshair copy statistics'; 