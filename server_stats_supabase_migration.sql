-- =====================================================
-- DISCORD BOT - SERVER STATS SUPABASE MIGRATION
-- =====================================================
-- Einfache Migration passend zur server-stats-api.js
-- Ersetzt: server-stats-settings.json
-- =====================================================

-- Lösche bestehende Tabellen falls vorhanden
DROP TABLE IF EXISTS server_stats_config CASCADE;

-- ============================
-- HAUPTTABELLEN: SERVER STATS (NORMALISIERT)
-- ============================

-- Server Stats Basis-Konfiguration
CREATE TABLE server_stats_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    
    -- Basis-Einstellungen
    enabled BOOLEAN DEFAULT false,
    update_interval INTEGER DEFAULT 300000,
    
    -- Kategorie-Einstellungen
    category_id TEXT DEFAULT '',
    category_name TEXT DEFAULT '📊 Server Statistiken',
    
    -- Berechtigungen
    permission_view_channel BOOLEAN DEFAULT true,
    permission_connect BOOLEAN DEFAULT false,
    permission_speak BOOLEAN DEFAULT false,
    permission_use_vad BOOLEAN DEFAULT false,
    
    -- Design
    design_emoji TEXT DEFAULT '📊',
    design_color TEXT DEFAULT '0x00FF7F',
    design_separator TEXT DEFAULT ' • ',
    design_format TEXT DEFAULT 'modern',
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Server Stats Channels (einzeln aufgelistet)
CREATE TABLE server_stats_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL REFERENCES server_stats_config(guild_id) ON DELETE CASCADE,
    
    -- Channel-Info
    channel_type TEXT NOT NULL, -- 'memberCount', 'onlineCount', etc.
    channel_id TEXT DEFAULT '',
    channel_name TEXT NOT NULL,
    
    -- Status & Position
    enabled BOOLEAN DEFAULT false,
    position INTEGER DEFAULT 0,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Eindeutige Kombination pro Server
    UNIQUE(guild_id, channel_type)
);

-- ============================
-- INDIZES
-- ============================

-- Index für schnelle Guild-Suche (Config)
CREATE INDEX idx_server_stats_config_guild_id ON server_stats_config(guild_id);
CREATE INDEX idx_server_stats_config_enabled ON server_stats_config(enabled);

-- Index für schnelle Guild-Suche (Channels)
CREATE INDEX idx_server_stats_channels_guild_id ON server_stats_channels(guild_id);
CREATE INDEX idx_server_stats_channels_type ON server_stats_channels(channel_type);
CREATE INDEX idx_server_stats_channels_enabled ON server_stats_channels(enabled);
CREATE INDEX idx_server_stats_channels_position ON server_stats_channels(guild_id, position);

-- ============================
-- FUNKTIONEN
-- ============================

-- Auto-Update Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für updated_at (Config)
CREATE TRIGGER update_server_stats_config_updated_at
    BEFORE UPDATE ON server_stats_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger für updated_at (Channels)
CREATE TRIGGER update_server_stats_channels_updated_at
    BEFORE UPDATE ON server_stats_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================
-- HILFSFUNKTIONEN (OPTIONAL)
-- ============================

-- Funktion: Initialisiere Standard-Konfiguration für eine Guild
CREATE OR REPLACE FUNCTION initialize_server_stats_config(p_guild_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basis-Konfiguration erstellen
    INSERT INTO server_stats_config (guild_id)
    VALUES (p_guild_id)
    ON CONFLICT (guild_id) DO NOTHING;
    
    -- Standard-Channels erstellen
    INSERT INTO server_stats_channels (guild_id, channel_type, channel_name, position) VALUES
    (p_guild_id, 'memberCount', '👥 Mitglieder: {count}', 0),
    (p_guild_id, 'onlineCount', '🟢 Online: {count}', 1),
    (p_guild_id, 'boostCount', '🚀 Boosts: {count}', 2),
    (p_guild_id, 'channelCount', '📺 Kanäle: {count}', 3),
    (p_guild_id, 'roleCount', '🎭 Rollen: {count}', 4),
    (p_guild_id, 'serverLevel', '⭐ Level: {count}', 5),
    (p_guild_id, 'createdDate', '📅 Erstellt: {date}', 6),
    (p_guild_id, 'botCount', '🤖 Bots: {count}', 7)
    ON CONFLICT (guild_id, channel_type) DO NOTHING;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- MIGRATION COMPLETE
-- ============================

-- Informationen
COMMENT ON TABLE server_stats_config IS 'Server Stats Basis-Konfiguration - normalisierte Struktur statt JSON';
COMMENT ON TABLE server_stats_channels IS 'Server Stats Channels - einzeln aufgelistet für bessere Übersicht';
COMMENT ON COLUMN server_stats_channels.channel_type IS 'Channel-Typ: memberCount, onlineCount, boostCount, etc.';

-- Test: Initialisiere Standard-Konfiguration für Test-Guild
SELECT initialize_server_stats_config('1203994020779532348');

-- Migration erfolgreich!
SELECT 'Server Stats Supabase Migration erfolgreich! Normalisierte Struktur - Channels einzeln aufgelistet' as status; 