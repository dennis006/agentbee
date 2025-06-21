-- ==========================================
-- SUPABASE DISCORD BOT - MODERATION SYSTEM
-- ==========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- MODERATION LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_id TEXT UNIQUE NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action TEXT NOT NULL,
    
    -- Target User Info
    target_user_id TEXT NOT NULL,
    target_username TEXT NOT NULL,
    target_display_name TEXT NOT NULL,
    target_avatar_url TEXT,
    
    -- Moderator Info
    moderator_id TEXT NOT NULL,
    moderator_username TEXT NOT NULL,
    moderator_display_name TEXT NOT NULL,
    moderator_avatar_url TEXT,
    
    -- Guild Info
    guild_id TEXT NOT NULL,
    guild_name TEXT NOT NULL,
    
    -- Action Details
    reason TEXT NOT NULL DEFAULT 'Kein Grund angegeben',
    duration_ms BIGINT,
    formatted_duration TEXT,
    warning_count INTEGER,
    max_warnings INTEGER,
    
    -- Spam Detection Details
    spam_type TEXT,
    message_count INTEGER,
    content TEXT,
    bad_word TEXT,
    
    -- Reset System Details
    reset_stats JSONB,
    manual_reset BOOLEAN DEFAULT FALSE,
    total_warnings INTEGER,
    users_with_warnings INTEGER,
    no_warnings BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    server_id TEXT DEFAULT 'default'
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_moderation_logs_timestamp ON moderation_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_action ON moderation_logs(action);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target_user ON moderation_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_guild ON moderation_logs(guild_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_log_id ON moderation_logs(log_id);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage moderation_logs" ON moderation_logs
    FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- COMPLETION
-- ==========================================
DO $$
BEGIN
    RAISE NOTICE '✅ Moderation System Tables created successfully!';
END $$; 