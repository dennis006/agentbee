-- =====================================================
-- DISCORD BOT - SERVER STATS SUPABASE MIGRATION
-- =====================================================
-- Einfache Migration passend zur server-stats-api.js
-- Ersetzt: server-stats-settings.json
-- =====================================================

-- Lösche bestehende Tabellen falls vorhanden
DROP TABLE IF EXISTS server_stats_config CASCADE;

-- ============================
-- HAUPTTABELLE: SERVER STATS CONFIG
-- ============================

-- Server Stats Konfiguration (ersetzt server-stats-settings.json komplett)
CREATE TABLE server_stats_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    
    -- Die komplette serverStatsSettings als JSON
    config JSONB NOT NULL DEFAULT '{
        "enabled": true,
        "updateInterval": 300000,
        "channels": {
            "memberCount": {
                "enabled": true,
                "channelId": "",
                "name": "👥 Mitglieder: {count}",
                "position": 0
            },
            "onlineCount": {
                "enabled": true,
                "channelId": "",
                "name": "🟢 Online: {count}",
                "position": 1
            },
            "boostCount": {
                "enabled": true,
                "channelId": "",
                "name": "🚀 Boosts: {count}",
                "position": 2
            },
            "channelCount": {
                "enabled": false,
                "channelId": "",
                "name": "📺 Kanäle: {count}",
                "position": 3
            },
            "roleCount": {
                "enabled": false,
                "channelId": "",
                "name": "🎭 Rollen: {count}",
                "position": 4
            },
            "serverLevel": {
                "enabled": false,
                "channelId": "",
                "name": "⭐ Level: {count}",
                "position": 5
            },
            "createdDate": {
                "enabled": false,
                "channelId": "",
                "name": "📅 Erstellt: {date}",
                "position": 6
            },
            "botCount": {
                "enabled": false,
                "channelId": "",
                "name": "🤖 Bots: {count}",
                "position": 7
            }
        },
        "categoryId": "",
        "categoryName": "📊 Server Statistiken",
        "permissions": {
            "viewChannel": true,
            "connect": false,
            "speak": false,
            "useVAD": false
        },
        "design": {
            "emoji": "📊",
            "color": "0x00FF7F",
            "separator": " • ",
            "format": "modern"
        }
    }'::jsonb,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- INDIZES
-- ============================

-- Index für schnelle Guild-Suche
CREATE INDEX idx_server_stats_config_guild_id ON server_stats_config(guild_id);

-- Index für JSON-Abfragen
CREATE INDEX idx_server_stats_config_enabled ON server_stats_config USING GIN ((config->'enabled'));

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

-- Trigger für updated_at
CREATE TRIGGER update_server_stats_config_updated_at
    BEFORE UPDATE ON server_stats_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================
-- HILFSFUNKTIONEN (OPTIONAL)
-- ============================

-- Funktion: Initialisiere Standard-Konfiguration für eine Guild
CREATE OR REPLACE FUNCTION initialize_server_stats_config(p_guild_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO server_stats_config (guild_id)
    VALUES (p_guild_id)
    ON CONFLICT (guild_id) DO NOTHING;
    
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
COMMENT ON TABLE server_stats_config IS 'Server Stats Konfiguration - ersetzt server-stats-settings.json als JSON-Speicher';
COMMENT ON COLUMN server_stats_config.config IS 'Komplette serverStatsSettings als JSONB - exakt wie in server-stats-api.js';

-- Test: Initialisiere Standard-Konfiguration für Test-Guild
SELECT initialize_server_stats_config('1203994020779532348');

-- Migration erfolgreich!
SELECT 'Server Stats Supabase Migration erfolgreich! Einfach und passend zur server-stats-api.js' as status; 