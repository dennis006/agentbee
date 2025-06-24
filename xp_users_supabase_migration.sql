-- XP Users Supabase Migration
-- Diese Datei erstellt nur die XP-User-Tabelle für Guild-spezifische XP-Daten

-- Drop table if exists (für saubere Migration)
DROP TABLE IF EXISTS xp_users CASCADE;

-- XP Users Tabelle (User XP Data per Guild)
CREATE TABLE xp_users (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint für Guild + User Kombination
    CONSTRAINT unique_guild_user UNIQUE(guild_id, user_id)
);

-- Indices für bessere Performance
CREATE INDEX idx_xp_users_guild_id ON xp_users(guild_id);
CREATE INDEX idx_xp_users_user_id ON xp_users(user_id);
CREATE INDEX idx_xp_users_guild_total_xp ON xp_users(guild_id, total_xp DESC);
CREATE INDEX idx_xp_users_guild_level ON xp_users(guild_id, level DESC);
CREATE INDEX idx_xp_users_guild_messages ON xp_users(guild_id, message_count DESC);
CREATE INDEX idx_xp_users_guild_voice ON xp_users(guild_id, voice_time DESC);
CREATE INDEX idx_xp_users_updated_at ON xp_users(updated_at);

-- Update Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_xp_users_updated_at 
BEFORE UPDATE ON xp_users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policy
ALTER TABLE xp_users ENABLE ROW LEVEL SECURITY;

-- Policy für Anon Access (da der Bot über API-Key zugreift)
CREATE POLICY "Allow anon access to xp_users" 
ON xp_users FOR ALL USING (true);

-- Kommentare für bessere Dokumentation
COMMENT ON TABLE xp_users IS 'User XP Daten und Statistiken pro Guild/Server';
COMMENT ON COLUMN xp_users.guild_id IS 'Discord Guild/Server ID';
COMMENT ON COLUMN xp_users.user_id IS 'Discord User ID';
COMMENT ON COLUMN xp_users.xp IS 'Aktuelle XP für das nächste Level';
COMMENT ON COLUMN xp_users.total_xp IS 'Gesamt XP des Users';
COMMENT ON COLUMN xp_users.message_count IS 'Anzahl gesendeter Nachrichten';
COMMENT ON COLUMN xp_users.voice_time IS 'Zeit in Voice-Channels (Minuten)';
COMMENT ON COLUMN xp_users.last_message IS 'Timestamp der letzten Message (für Cooldown)';
COMMENT ON COLUMN xp_users.voice_join_time IS 'Timestamp wann User Voice-Channel beigetreten ist'; 