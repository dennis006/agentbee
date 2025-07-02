-- =====================================================
-- DISCORD BOT - VALORANT TRACKER SUPABASE MIGRATION
-- =====================================================
-- Ersetzt: valorant-stats.json und valorant-players.json
-- =====================================================

-- Lösche bestehende Tabellen falls vorhanden
DROP TABLE IF EXISTS valorant_search_history CASCADE;
DROP TABLE IF EXISTS valorant_tracker_stats CASCADE;
DROP TABLE IF EXISTS valorant_tracker_settings CASCADE;

-- ============================
-- TABELLE: VALORANT TRACKER SETTINGS
-- ============================
CREATE TABLE valorant_tracker_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basis-Einstellungen
    enabled BOOLEAN DEFAULT false,
    default_region TEXT DEFAULT 'eu' CHECK (default_region IN ('eu', 'na', 'ap', 'kr')),
    refresh_interval INTEGER DEFAULT 300, -- Sekunden
    
    -- Rate Limiting
    rate_limit_current INTEGER DEFAULT 0,
    rate_limit_max INTEGER DEFAULT 30,
    rate_limit_reset_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Features
    features JSONB DEFAULT '{
        "mmrTracking": true,
        "matchHistory": true,
        "leaderboard": true,
        "playerStats": true
    }'::jsonb,
    
    -- Notifications
    notifications JSONB DEFAULT '{
        "rankUpdates": false,
        "newMatches": false,
        "channelName": "",
        "autoPost": false
    }'::jsonb,
    
    -- Output Format (nur noch embed erlaubt!)
    output_format JSONB DEFAULT '{
        "mode": "embed",
        "embedEnabled": true,
        "cardEnabled": false
    }'::jsonb,
    
    -- Visibility
    visibility JSONB DEFAULT '{
        "public": true,
        "allowUserChoice": false
    }'::jsonb,
    
    -- Rank Rewards
    rank_rewards JSONB DEFAULT '{
        "enabled": false,
        "autoCreateRoles": false,
        "removeOldRoles": false,
        "rolePrefix": "Valorant",
        "ranks": []
    }'::jsonb,
    
    -- Embed Configuration
    embed_config JSONB DEFAULT '{
        "title": "🎯 Valorant Spielersuche",
        "description": "Klicke auf einen der Buttons unten, um deine Valorant-Stats zu durchsuchen!",
        "color": "0xFF4655",
        "footer": "Valorant Tracker • Powered by Agentbee",
        "thumbnail": "valorant",
        "customThumbnail": "",
        "author": {
            "enabled": false,
            "name": "",
            "iconUrl": ""
        },
        "fields": []
    }'::jsonb,
    
    -- Player Stats Embed Configuration
    player_stats_embed JSONB DEFAULT '{
        "title": "🎯 Valorant Stats für {playerName}#{playerTag}",
        "description": "Aktuelle Rang-Informationen und Spielstatistiken",
        "color": "0xFF4655",
        "footer": "Valorant Tracker • Letzte Aktualisierung: {lastUpdate}",
        "thumbnail": "valorant",
        "customThumbnail": "",
        "author": {
            "enabled": false,
            "name": "",
            "iconUrl": ""
        },
        "fields": {
            "currentRank": {
                "enabled": true,
                "name": "📊 Aktueller Rang",
                "value": "{currentRank} ({rr} RR)",
                "inline": true
            },
            "peakRank": {
                "enabled": true,
                "name": "🏆 Peak Rang",
                "value": "{peakRank} (Season {peakSeason})",
                "inline": true
            },
            "lastChange": {
                "enabled": true,
                "name": "📈 Letzte Änderung",
                "value": "{lastChange} RR",
                "inline": true
            },
            "leaderboard": {
                "enabled": false,
                "name": "🥇 Leaderboard",
                "value": "Platz {leaderboardRank}",
                "inline": true
            },
            "matchStats": {
                "enabled": true,
                "name": "🎮 Match Stats",
                "value": "{totalMatches} Matches analysiert",
                "inline": false
            },
            "kda": {
                "enabled": false,
                "name": "💀 K/D/A",
                "value": "{kills}/{deaths}/{assists}",
                "inline": true
            },
            "precision": {
                "enabled": false,
                "name": "🎯 Präzision",
                "value": "{headshots}% Headshot Rate",
                "inline": true
            },
            "damage": {
                "enabled": false,
                "name": "💥 Schaden",
                "value": "{averageDamage} pro Runde",
                "inline": true
            },
            "seasonStats": {
                "enabled": false,
                "name": "📅 Season Stats",
                "value": "Wins: {wins} | Losses: {losses}",
                "inline": false
            }
        }
    }'::jsonb,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- TABELLE: VALORANT TRACKER STATS
-- ============================
CREATE TABLE valorant_tracker_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basis-Statistiken
    total_searches INTEGER DEFAULT 0,
    active_tracking INTEGER DEFAULT 0,
    total_players INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    system_enabled BOOLEAN DEFAULT false,
    
    -- Zeitraum-Statistiken
    daily_searches INTEGER DEFAULT 0,
    weekly_searches INTEGER DEFAULT 0,
    
    -- Region-Statistiken
    top_regions JSONB DEFAULT '{
        "eu": 0,
        "na": 0,
        "ap": 0,
        "kr": 0
    }'::jsonb,
    
    -- Metadaten
    last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- TABELLE: VALORANT SEARCH HISTORY
-- ============================
CREATE TABLE valorant_search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Suchdetails
    player_name TEXT NOT NULL,
    player_tag TEXT NOT NULL,
    full_player_name TEXT GENERATED ALWAYS AS (player_name || '#' || player_tag) STORED,
    region TEXT NOT NULL CHECK (region IN ('eu', 'na', 'ap', 'kr')),
    
    -- Suchergebnis
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    
    -- Benutzer-Info
    discord_user_id TEXT,
    discord_username TEXT,
    
    -- Ergebnis-Daten (optional)
    rank_data JSONB,
    match_data JSONB,
    
    -- Metadaten
    search_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_time_ms INTEGER, -- Wie lange die API-Anfrage gedauert hat
    api_endpoint TEXT, -- Welcher Valorant API Endpoint verwendet wurde
    
    -- Zusätzliche Daten
    user_agent TEXT,
    ip_address INET
);

-- ============================
-- INDIZES FÜR PERFORMANCE
-- ============================

-- Valorant Tracker Settings
CREATE INDEX idx_valorant_tracker_settings_enabled ON valorant_tracker_settings(enabled);

-- Valorant Tracker Stats
CREATE INDEX idx_valorant_tracker_stats_last_update ON valorant_tracker_stats(last_update);

-- Valorant Search History
CREATE INDEX idx_valorant_search_history_player ON valorant_search_history(full_player_name);
CREATE INDEX idx_valorant_search_history_region ON valorant_search_history(region);
CREATE INDEX idx_valorant_search_history_success ON valorant_search_history(success);
CREATE INDEX idx_valorant_search_history_discord_user ON valorant_search_history(discord_user_id);
CREATE INDEX idx_valorant_search_history_timestamp ON valorant_search_history(search_timestamp DESC);

-- Composite indexes for better performance on date-based queries
CREATE INDEX idx_valorant_search_history_date_region ON valorant_search_history(search_timestamp DESC, region);
CREATE INDEX idx_valorant_search_history_date_success ON valorant_search_history(search_timestamp DESC, success);

-- ============================
-- TRIGGER FÜR AUTO-TIMESTAMPS
-- ============================

-- Auto-Update Timestamp Funktion (falls nicht bereits existiert)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für alle Tabellen
CREATE TRIGGER update_valorant_tracker_settings_updated_at
    BEFORE UPDATE ON valorant_tracker_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_valorant_tracker_stats_updated_at
    BEFORE UPDATE ON valorant_tracker_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================
-- HELPER FUNCTIONS
-- ============================

-- Lösche bestehende Funktionen falls vorhanden
DROP FUNCTION IF EXISTS get_valorant_settings();
DROP FUNCTION IF EXISTS update_valorant_stats(jsonb);
DROP FUNCTION IF EXISTS add_valorant_search(text, text, text, boolean, text, text, jsonb, jsonb);
DROP FUNCTION IF EXISTS get_daily_search_count();
DROP FUNCTION IF EXISTS get_weekly_search_count();
DROP FUNCTION IF EXISTS get_unique_players_count();
DROP FUNCTION IF EXISTS cleanup_old_search_history();

-- Funktion um Valorant Einstellungen zu holen
CREATE OR REPLACE FUNCTION get_valorant_settings()
RETURNS TABLE (
    enabled BOOLEAN,
    default_region TEXT,
    output_format JSONB,
    embed_config JSONB,
    player_stats_embed JSONB,
    rank_rewards JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vts.enabled,
        vts.default_region,
        vts.output_format,
        vts.embed_config,
        vts.player_stats_embed,
        vts.rank_rewards
    FROM valorant_tracker_settings vts
    ORDER BY vts.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Funktion um Valorant Statistiken zu aktualisieren
CREATE OR REPLACE FUNCTION update_valorant_stats(search_data jsonb DEFAULT NULL)
RETURNS TABLE (
    total_searches INTEGER,
    daily_searches INTEGER,
    weekly_searches INTEGER,
    total_players INTEGER,
    top_regions JSONB,
    system_enabled BOOLEAN
) AS $$
DECLARE
    stats_row valorant_tracker_stats%ROWTYPE;
    region_name TEXT;
BEGIN
    -- Lade oder erstelle Statistiken
    SELECT * INTO stats_row FROM valorant_tracker_stats ORDER BY created_at DESC LIMIT 1;
    
    IF NOT FOUND THEN
        INSERT INTO valorant_tracker_stats DEFAULT VALUES RETURNING * INTO stats_row;
    END IF;
    
    -- Wenn neue Suchdaten vorhanden sind
    IF search_data IS NOT NULL THEN
        -- Aktualisiere Gesamt-Suchen
        UPDATE valorant_tracker_stats SET 
            total_searches = total_searches + 1,
            last_update = NOW()
        WHERE id = stats_row.id;
        
        -- Aktualisiere Region-Statistiken
        region_name := search_data->>'region';
        IF region_name IS NOT NULL THEN
            UPDATE valorant_tracker_stats SET 
                top_regions = jsonb_set(
                    top_regions,
                    ARRAY[region_name],
                    to_jsonb(COALESCE((top_regions->>region_name)::INTEGER, 0) + 1)
                )
            WHERE id = stats_row.id;
        END IF;
    END IF;
    
    -- Berechne aktuelle Statistiken
    UPDATE valorant_tracker_stats SET
        daily_searches = (
            SELECT COUNT(*) FROM valorant_search_history 
            WHERE search_timestamp >= CURRENT_DATE
        ),
        weekly_searches = (
            SELECT COUNT(*) FROM valorant_search_history 
            WHERE search_timestamp >= CURRENT_DATE - INTERVAL '7 days'
        ),
        total_players = (
            SELECT COUNT(DISTINCT full_player_name) FROM valorant_search_history
        ),
        last_update = NOW()
    WHERE id = stats_row.id;
    
    -- Gebe aktualisierte Statistiken zurück
    RETURN QUERY
    SELECT 
        vts.total_searches,
        vts.daily_searches,
        vts.weekly_searches,
        vts.total_players,
        vts.top_regions,
        vts.system_enabled
    FROM valorant_tracker_stats vts
    WHERE vts.id = stats_row.id;
END;
$$ LANGUAGE plpgsql;

-- Funktion um neue Suche hinzuzufügen
CREATE OR REPLACE FUNCTION add_valorant_search(
    p_player_name TEXT,
    p_player_tag TEXT,
    p_region TEXT,
    p_success BOOLEAN,
    p_discord_user_id TEXT DEFAULT NULL,
    p_discord_username TEXT DEFAULT NULL,
    p_rank_data JSONB DEFAULT NULL,
    p_match_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    search_id UUID;
BEGIN
    INSERT INTO valorant_search_history (
        player_name,
        player_tag,
        region,
        success,
        discord_user_id,
        discord_username,
        rank_data,
        match_data
    ) VALUES (
        p_player_name,
        p_player_tag,
        p_region,
        p_success,
        p_discord_user_id,
        p_discord_username,
        p_rank_data,
        p_match_data
    ) RETURNING id INTO search_id;
    
    -- Aktualisiere Statistiken
    PERFORM update_valorant_stats(jsonb_build_object('region', p_region));
    
    RETURN search_id;
END;
$$ LANGUAGE plpgsql;

-- Funktion um alte Suchhistorie zu bereinigen (behalte nur letzte 1000 Einträge)
CREATE OR REPLACE FUNCTION cleanup_old_search_history()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH old_searches AS (
        SELECT id FROM valorant_search_history
        ORDER BY search_timestamp DESC
        OFFSET 1000
    )
    DELETE FROM valorant_search_history
    WHERE id IN (SELECT id FROM old_searches);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- SEED DATA: DEFAULT SETTINGS
-- ============================
INSERT INTO valorant_tracker_settings (
    enabled,
    default_region,
    output_format,
    embed_config,
    player_stats_embed
) VALUES (
    false, -- System startet deaktiviert
    'eu',
    '{"mode": "embed", "embedEnabled": true, "cardEnabled": false}'::jsonb,
    '{
        "title": "🎯 Valorant Spielersuche",
        "description": "Klicke auf einen der Buttons unten, um deine Valorant-Stats zu durchsuchen!",
        "color": "0xFF4655",
        "footer": "Valorant Tracker • Powered by Riot API",
        "thumbnail": "valorant",
        "customThumbnail": "",
        "author": {"enabled": false, "name": "", "iconUrl": ""},
        "fields": []
    }'::jsonb,
    '{
        "title": "🎯 Valorant Stats für {playerName}#{playerTag}",
        "description": "Aktuelle Rang-Informationen und Spielstatistiken",
        "color": "0xFF4655",
        "footer": "Valorant Tracker • Letzte Aktualisierung: {lastUpdate}",
        "thumbnail": "valorant",
        "customThumbnail": "",
        "author": {"enabled": false, "name": "", "iconUrl": ""},
        "fields": {
            "currentRank": {"enabled": true, "name": "📊 Aktueller Rang", "value": "{currentRank} ({rr} RR)", "inline": true},
            "peakRank": {"enabled": true, "name": "🏆 Peak Rang", "value": "{peakRank} (Season {peakSeason})", "inline": true},
            "lastChange": {"enabled": true, "name": "📈 Letzte Änderung", "value": "{lastChange} RR", "inline": true},
            "matchStats": {"enabled": true, "name": "🎮 Match Stats", "value": "{totalMatches} Matches analysiert", "inline": false}
        }
    }'::jsonb
);

-- Erstelle initiale Statistiken
INSERT INTO valorant_tracker_stats DEFAULT VALUES;

-- ============================
-- ROW LEVEL SECURITY (RLS)
-- ============================

-- Aktiviere RLS für alle Tabellen
ALTER TABLE valorant_tracker_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE valorant_tracker_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE valorant_search_history ENABLE ROW LEVEL SECURITY;

-- Policies für Valorant Tracker Settings
CREATE POLICY "Allow read access for all users" ON valorant_tracker_settings FOR SELECT USING (true);
CREATE POLICY "Allow insert/update for authenticated users" ON valorant_tracker_settings FOR ALL USING (true);

-- Policies für Valorant Tracker Stats
CREATE POLICY "Allow read access for all users" ON valorant_tracker_stats FOR SELECT USING (true);
CREATE POLICY "Allow insert/update for authenticated users" ON valorant_tracker_stats FOR ALL USING (true);

-- Policies für Valorant Search History
CREATE POLICY "Allow read access for all users" ON valorant_search_history FOR SELECT USING (true);
CREATE POLICY "Allow insert for all users" ON valorant_search_history FOR INSERT WITH CHECK (true);

-- ============================
-- ERFOLGSMELDUNG
-- ============================
DO $$
BEGIN
    RAISE NOTICE '✅ Valorant Tracker Supabase Migration erfolgreich abgeschlossen!';
    RAISE NOTICE 'ℹ️  Tabellen erstellt: valorant_tracker_settings, valorant_tracker_stats, valorant_search_history';
    RAISE NOTICE 'ℹ️  Helper Functions erstellt: get_valorant_settings(), update_valorant_stats(), add_valorant_search()';
    RAISE NOTICE 'ℹ️  Standard-Einstellungen eingefügt (System deaktiviert)';
    RAISE NOTICE 'ℹ️  Output-Format: NUR EMBED (Card und Both entfernt)';
END $$; 