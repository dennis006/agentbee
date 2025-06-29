-- ================================================================
-- 🎮 LFG SYSTEM - ACTIVE POSTS PERSISTENCE
-- ================================================================
-- Fügt persistente Speicherung für aktive LFG Posts hinzu
-- Löst das Problem der verlorenen Button-Interaktionen nach Bot-Neustart
-- Created: 2025-01-29

-- ================================================================
-- ACTIVE LFG POSTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS lfg_active_posts (
    id BIGSERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL UNIQUE, -- Discord Message ID
    author_id TEXT NOT NULL,
    author_username TEXT,
    game TEXT NOT NULL,
    description TEXT,
    max_players INTEGER DEFAULT 5,
    joined_players JSONB DEFAULT '[]'::jsonb, -- Array von User IDs
    status TEXT DEFAULT 'open', -- open, full, closed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Auto-delete Zeit
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('open', 'full', 'closed')),
    CONSTRAINT valid_max_players CHECK (max_players >= 2 AND max_players <= 20)
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_lfg_active_posts_guild_id ON lfg_active_posts(guild_id);
CREATE INDEX IF NOT EXISTS idx_lfg_active_posts_message_id ON lfg_active_posts(message_id);
CREATE INDEX IF NOT EXISTS idx_lfg_active_posts_author_id ON lfg_active_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_lfg_active_posts_status ON lfg_active_posts(status);
CREATE INDEX IF NOT EXISTS idx_lfg_active_posts_expires_at ON lfg_active_posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_lfg_active_posts_created_at ON lfg_active_posts(created_at);

-- ================================================================
-- RLS POLICIES
-- ================================================================
ALTER TABLE lfg_active_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for service role" ON lfg_active_posts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for service role" ON lfg_active_posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for service role" ON lfg_active_posts
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for service role" ON lfg_active_posts
    FOR DELETE USING (true);

-- ================================================================
-- TRIGGERS
-- ================================================================
CREATE TRIGGER update_lfg_active_posts_updated_at 
    BEFORE UPDATE ON lfg_active_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Function: Cleanup expired LFG posts
CREATE OR REPLACE FUNCTION cleanup_expired_lfg_posts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Lösche abgelaufene Posts
    DELETE FROM lfg_active_posts 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Cleaned up % expired LFG posts', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get active LFG posts for guild
CREATE OR REPLACE FUNCTION get_active_lfg_posts(p_guild_id TEXT)
RETURNS TABLE(
    message_id TEXT,
    channel_id TEXT,
    author_id TEXT,
    author_username TEXT,
    game TEXT,
    description TEXT,
    max_players INTEGER,
    joined_players JSONB,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Cleanup erst durchführen
    PERFORM cleanup_expired_lfg_posts();
    
    -- Dann aktive Posts zurückgeben
    RETURN QUERY
    SELECT 
        a.message_id,
        a.channel_id,
        a.author_id,
        a.author_username,
        a.game,
        a.description,
        a.max_players,
        a.joined_players,
        a.status,
        a.created_at,
        a.expires_at
    FROM lfg_active_posts a
    WHERE a.guild_id = p_guild_id
    AND a.status != 'closed'
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Update LFG post players
CREATE OR REPLACE FUNCTION update_lfg_post_players(
    p_message_id TEXT,
    p_joined_players JSONB,
    p_status TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    UPDATE lfg_active_posts 
    SET 
        joined_players = p_joined_players,
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE message_id = p_message_id;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- EXAMPLE QUERIES
-- ================================================================

-- Beispiel: Aktive Posts für eine Guild abrufen
-- SELECT * FROM get_active_lfg_posts('1234567890123456789');

-- Beispiel: Spieler zu Post hinzufügen
-- SELECT update_lfg_post_players('9876543210987654321', '["123", "456", "789"]', 'open');

-- Beispiel: Expired Posts cleanup
-- SELECT cleanup_expired_lfg_posts();

-- Beispiel: Statistiken
-- SELECT 
--     COUNT(*) as total_active,
--     COUNT(*) FILTER (WHERE status = 'open') as open_posts,
--     COUNT(*) FILTER (WHERE status = 'full') as full_posts
-- FROM lfg_active_posts 
-- WHERE guild_id = '1234567890123456789'; 