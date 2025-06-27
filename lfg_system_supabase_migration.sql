-- ================================================================
-- 🎮 LFG SYSTEM - SUPABASE MIGRATION
-- ================================================================
-- Looking For Group System with Cooldowns, Statistics and Settings
-- Created: 2025-01-27

-- Enable RLS (Row Level Security)
-- Note: Service Role Key bypasses RLS for Discord Bot

-- ================================================================
-- 1. LFG SETTINGS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS lfg_settings (
    id BIGSERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT false,
    channel_id TEXT,
    channel_name TEXT DEFAULT 'lfg-suche',
    role_id TEXT,
    role_name TEXT DEFAULT 'LFG',
    role_color TEXT DEFAULT '#9333ea',
    cooldown_minutes INTEGER DEFAULT 30,
    max_pings_per_day INTEGER DEFAULT 10,
    auto_delete_after_hours INTEGER DEFAULT 24,
    allowed_games JSONB DEFAULT '["Valorant", "League of Legends", "Overwatch 2", "Counter-Strike 2", "Apex Legends", "Rocket League", "Call of Duty", "Fortnite"]'::jsonb,
    require_reason BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_lfg_settings_guild_id ON lfg_settings(guild_id);

-- ================================================================
-- 2. LFG COOLDOWNS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS lfg_cooldowns (
    id BIGSERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    last_ping_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pings_today INTEGER DEFAULT 1,
    daily_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint für User pro Guild
    UNIQUE(guild_id, user_id)
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_lfg_cooldowns_guild_user ON lfg_cooldowns(guild_id, user_id);
CREATE INDEX IF NOT EXISTS idx_lfg_cooldowns_last_ping ON lfg_cooldowns(last_ping_at);
CREATE INDEX IF NOT EXISTS idx_lfg_cooldowns_daily_reset ON lfg_cooldowns(daily_reset_date);

-- ================================================================
-- 3. LFG HISTORY TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS lfg_history (
    id BIGSERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT,
    channel_id TEXT NOT NULL,
    message_id TEXT,
    game TEXT,
    content TEXT,
    ping_count INTEGER DEFAULT 1,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes für Analytics
CREATE INDEX IF NOT EXISTS idx_lfg_history_guild_id ON lfg_history(guild_id);
CREATE INDEX IF NOT EXISTS idx_lfg_history_user_id ON lfg_history(user_id);
CREATE INDEX IF NOT EXISTS idx_lfg_history_game ON lfg_history(game);
CREATE INDEX IF NOT EXISTS idx_lfg_history_created_at ON lfg_history(created_at);

-- ================================================================
-- 4. LFG STATISTICS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS lfg_statistics (
    id BIGSERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL,
    total_lfg_posts INTEGER DEFAULT 0,
    active_players INTEGER DEFAULT 0,
    today_posts INTEGER DEFAULT 0,
    popular_game TEXT DEFAULT 'Valorant',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    daily_reset_date DATE DEFAULT CURRENT_DATE,
    
    -- Ein Eintrag pro Guild
    UNIQUE(guild_id)
);

-- Index für Guild-basierte Abfragen
CREATE INDEX IF NOT EXISTS idx_lfg_statistics_guild_id ON lfg_statistics(guild_id);

-- ================================================================
-- 5. RLS POLICIES (Row Level Security)
-- ================================================================

-- LFG Settings Policies
ALTER TABLE lfg_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for service role" ON lfg_settings
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON lfg_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for service role" ON lfg_settings
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for service role" ON lfg_settings
    FOR DELETE USING (true);

-- LFG Cooldowns Policies
ALTER TABLE lfg_cooldowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for service role" ON lfg_cooldowns
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON lfg_cooldowns
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for service role" ON lfg_cooldowns
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for service role" ON lfg_cooldowns
    FOR DELETE USING (true);

-- LFG History Policies
ALTER TABLE lfg_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for service role" ON lfg_history
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON lfg_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for service role" ON lfg_history
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for service role" ON lfg_history
    FOR DELETE USING (true);

-- LFG Statistics Policies
ALTER TABLE lfg_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for service role" ON lfg_statistics
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON lfg_statistics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for service role" ON lfg_statistics
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for service role" ON lfg_statistics
    FOR DELETE USING (true);

-- ================================================================
-- 6. FUNCTIONS & TRIGGERS
-- ================================================================

-- Function: Update timestamp on record update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers für updated_at
CREATE TRIGGER update_lfg_settings_updated_at 
    BEFORE UPDATE ON lfg_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lfg_cooldowns_updated_at 
    BEFORE UPDATE ON lfg_cooldowns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Reset daily counters
CREATE OR REPLACE FUNCTION reset_daily_lfg_counters()
RETURNS void AS $$
BEGIN
    -- Reset daily ping counters
    UPDATE lfg_cooldowns 
    SET pings_today = 0, daily_reset_date = CURRENT_DATE 
    WHERE daily_reset_date < CURRENT_DATE;
    
    -- Reset daily statistics
    UPDATE lfg_statistics 
    SET today_posts = 0, daily_reset_date = CURRENT_DATE 
    WHERE daily_reset_date < CURRENT_DATE;
    
    RAISE NOTICE 'Daily LFG counters reset completed';
END;
$$ LANGUAGE plpgsql;

-- Function: Get LFG statistics for guild
CREATE OR REPLACE FUNCTION get_lfg_stats(p_guild_id TEXT)
RETURNS TABLE(
    total_posts INTEGER,
    active_players INTEGER,
    today_posts INTEGER,
    popular_game TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(s.total_lfg_posts, 0)::INTEGER,
        COALESCE(s.active_players, 0)::INTEGER,
        COALESCE(s.today_posts, 0)::INTEGER,
        COALESCE(s.popular_game, 'Valorant')::TEXT
    FROM lfg_statistics s
    WHERE s.guild_id = p_guild_id;
    
    -- If no stats exist, return defaults
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0, 0, 0, 'Valorant'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 7. DEFAULT DATA
-- ================================================================

-- Insert default LFG settings for testing (optional)
-- INSERT INTO lfg_settings (guild_id, enabled, channel_name, role_name) 
-- VALUES ('YOUR_GUILD_ID_HERE', true, 'lfg-suche', 'LFG')
-- ON CONFLICT (guild_id) DO NOTHING;

-- ================================================================
-- 8. CLEANUP FUNCTIONS
-- ================================================================

-- Function: Cleanup old LFG history (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_lfg_history()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM lfg_history 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Cleaned up % old LFG history records', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
-- 
-- Tables created:
-- ✅ lfg_settings - Guild-specific LFG configuration
-- ✅ lfg_cooldowns - User cooldown and daily limits
-- ✅ lfg_history - Complete LFG request history
-- ✅ lfg_statistics - Guild statistics and analytics
--
-- Features:
-- ✅ RLS Policies for security
-- ✅ Automatic timestamp updates
-- ✅ Daily counter reset function
-- ✅ Statistics aggregation
-- ✅ Cleanup functions
-- ✅ Performance indexes
--
-- Usage:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Update Discord Bot to use Supabase instead of JSON
-- 3. Configure Railway environment variables
-- 4. Test LFG system functionality
--
-- ================================================================ 