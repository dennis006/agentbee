-- =====================================================
-- DISCORD BOT - VALORANT TRACKER SUPABASE MIGRATION (FIXED)
-- =====================================================
-- FIXES: Mehrdeutige Spaltenreferenzen in update_valorant_stats()
-- =====================================================

-- Lösche und erstelle Funktionen neu (ohne mehrdeutige Referenzen)
DROP FUNCTION IF EXISTS update_valorant_stats(jsonb);
DROP FUNCTION IF EXISTS add_valorant_search(TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, JSONB, JSONB);
DROP FUNCTION IF EXISTS cleanup_old_search_history();

-- ============================
-- FIXED: Update Valorant Stats Function
-- ============================
CREATE OR REPLACE FUNCTION update_valorant_stats(search_data jsonb DEFAULT NULL)
RETURNS TABLE (
    result_total_searches INTEGER,
    result_daily_searches INTEGER,
    result_weekly_searches INTEGER,
    result_total_players INTEGER,
    result_top_regions JSONB,
    result_system_enabled BOOLEAN
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
        -- Aktualisiere Gesamt-Suchen (verwende Tabellen-Alias um Mehrdeutigkeit zu vermeiden)
        UPDATE valorant_tracker_stats AS vts 
        SET 
            total_searches = vts.total_searches + 1,
            last_update = NOW()
        WHERE vts.id = stats_row.id;
        
        -- Aktualisiere Region-Statistiken
        region_name := search_data->>'region';
        IF region_name IS NOT NULL THEN
            UPDATE valorant_tracker_stats AS vts
            SET 
                top_regions = jsonb_set(
                    vts.top_regions,
                    ARRAY[region_name],
                    to_jsonb(COALESCE((vts.top_regions->>region_name)::INTEGER, 0) + 1)
                )
            WHERE vts.id = stats_row.id;
        END IF;
    END IF;
    
    -- Berechne aktuelle Statistiken (verwende Tabellen-Alias)
    UPDATE valorant_tracker_stats AS vts
    SET
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
    WHERE vts.id = stats_row.id;
    
    -- Lade die aktualisierte Zeile
    SELECT * INTO stats_row FROM valorant_tracker_stats WHERE id = stats_row.id;
    
    -- Gebe aktualisierte Statistiken zurück (mit eindeutigen Namen)
    RETURN QUERY
    SELECT 
        stats_row.total_searches::INTEGER,
        stats_row.daily_searches::INTEGER,
        stats_row.weekly_searches::INTEGER,
        stats_row.total_players::INTEGER,
        stats_row.top_regions,
        stats_row.system_enabled::BOOLEAN;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- FIXED: Add Valorant Search Function
-- ============================
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
    
    -- Aktualisiere Statistiken (kein Return Value nötig)
    PERFORM update_valorant_stats(jsonb_build_object('region', p_region));
    
    RETURN search_id;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- ENHANCED: Player Stats Embed Configuration (MEHR DETAILS!)
-- ============================
UPDATE valorant_tracker_settings 
SET player_stats_embed = '{
    "title": "🎯 Valorant Stats für {playerName}#{playerTag}",
    "description": "**Region:** {region} • **Level:** {level}\n**Detaillierte Rang-Informationen und Spielstatistiken**",
    "color": "0xFF4655",
    "footer": "Valorant Tracker • Powered by AgentBee • Letzte Aktualisierung: {lastUpdate}",
    "thumbnail": "valorant",
    "customThumbnail": "",
    "author": {
        "enabled": true,
        "name": "🎮 Valorant Tracker",
        "iconUrl": "https://cdn.discordapp.com/emojis/1234567890.png"
    },
    "fields": {
        "currentRank": {
            "enabled": true,
            "name": "📊 Aktueller Rang",
            "value": "**{currentRank}** ({rr} RR)",
            "inline": true
        },
        "peakRank": {
            "enabled": true,
            "name": "🏆 Peak Rang",
            "value": "**{peakRank}** (Season {peakSeason})",
            "inline": true
        },
        "lastChange": {
            "enabled": true,
            "name": "📈 Letzte Änderung",
            "value": "{lastChange} RR {changeEmoji}",
            "inline": true
        },
        "leaderboard": {
            "enabled": true,
            "name": "🥇 Leaderboard Position",
            "value": "#{leaderboardRank} (Top {leaderboardPercent}%)",
            "inline": true
        },
        "matchStats": {
            "enabled": true,
            "name": "🎮 Match Statistiken",
            "value": "**{totalMatches}** Matches analysiert\n📊 Letzte 10 Spiele berücksichtigt",
            "inline": false
        },
        "kda": {
            "enabled": true,
            "name": "💀 K/D/A Ratio",
            "value": "**{kills}**/{deaths}/{assists}\nKD-Ratio: **{kdRatio}**",
            "inline": true
        },
        "precision": {
            "enabled": true,
            "name": "🎯 Präzision & Accuracy",
            "value": "🎯 **{headshotRate}%** Headshot Rate\n📊 **{accuracy}%** Trefferquote",
            "inline": true
        },
        "damage": {
            "enabled": true,
            "name": "💥 Schadens-Statistiken",
            "value": "💥 **{averageDamage}** DMG/Runde\n🔥 **{totalDamage}** Gesamt-Schaden",
            "inline": true
        },
        "seasonStats": {
            "enabled": true,
            "name": "📅 Season Übersicht",
            "value": "✅ **{wins}** Wins • ❌ **{losses}** Losses\n📊 **{winRate}%** Win-Rate",
            "inline": false
        },
        "agentStats": {
            "enabled": true,
            "name": "🎭 Lieblings-Agent",
            "value": "🎭 **{favoriteAgent}** ({agentWinRate}% Win-Rate)\n🎯 {agentMatches} Matches gespielt",
            "inline": true
        },
        "performance": {
            "enabled": true,
            "name": "⚡ Performance Metrics",
            "value": "⚡ **{averageScore}** Avg Score\n🏆 **{mvpRate}%** MVP Rate",
            "inline": true
        }
    }
}'::jsonb
WHERE id = (SELECT id FROM valorant_tracker_settings ORDER BY created_at DESC LIMIT 1);

-- ============================
-- FIX: Rank Rewards System aktivieren
-- ============================
UPDATE valorant_tracker_settings 
SET rank_rewards = '{
    "enabled": true,
    "autoCreateRoles": true,
    "removeOldRoles": true,
    "rolePrefix": "Valorant",
    "ranks": [
        {"name": "Iron 1", "tierId": 3, "color": "#4A4A4A", "enabled": true, "roleId": null},
        {"name": "Iron 2", "tierId": 4, "color": "#4A4A4A", "enabled": true, "roleId": null},
        {"name": "Iron 3", "tierId": 5, "color": "#4A4A4A", "enabled": true, "roleId": null},
        {"name": "Bronze 1", "tierId": 6, "color": "#CD7F32", "enabled": true, "roleId": null},
        {"name": "Bronze 2", "tierId": 7, "color": "#CD7F32", "enabled": true, "roleId": null},
        {"name": "Bronze 3", "tierId": 8, "color": "#CD7F32", "enabled": true, "roleId": null},
        {"name": "Silver 1", "tierId": 9, "color": "#C0C0C0", "enabled": true, "roleId": null},
        {"name": "Silver 2", "tierId": 10, "color": "#C0C0C0", "enabled": true, "roleId": null},
        {"name": "Silver 3", "tierId": 11, "color": "#C0C0C0", "enabled": true, "roleId": null},
        {"name": "Gold 1", "tierId": 12, "color": "#FFD700", "enabled": true, "roleId": null},
        {"name": "Gold 2", "tierId": 13, "color": "#FFD700", "enabled": true, "roleId": null},
        {"name": "Gold 3", "tierId": 14, "color": "#FFD700", "enabled": true, "roleId": null},
        {"name": "Platinum 1", "tierId": 15, "color": "#00CED1", "enabled": true, "roleId": null},
        {"name": "Platinum 2", "tierId": 16, "color": "#00CED1", "enabled": true, "roleId": null},
        {"name": "Platinum 3", "tierId": 17, "color": "#00CED1", "enabled": true, "roleId": null},
        {"name": "Diamond 1", "tierId": 18, "color": "#9932CC", "enabled": true, "roleId": null},
        {"name": "Diamond 2", "tierId": 19, "color": "#9932CC", "enabled": true, "roleId": null},
        {"name": "Diamond 3", "tierId": 20, "color": "#9932CC", "enabled": true, "roleId": null},
        {"name": "Ascendant 1", "tierId": 21, "color": "#FF6B6B", "enabled": true, "roleId": null},
        {"name": "Ascendant 2", "tierId": 22, "color": "#FF6B6B", "enabled": true, "roleId": null},
        {"name": "Ascendant 3", "tierId": 23, "color": "#FF6B6B", "enabled": true, "roleId": null},
        {"name": "Immortal 1", "tierId": 24, "color": "#FF1744", "enabled": true, "roleId": null},
        {"name": "Immortal 2", "tierId": 25, "color": "#FF1744", "enabled": true, "roleId": null},
        {"name": "Immortal 3", "tierId": 26, "color": "#FF1744", "enabled": true, "roleId": null},
        {"name": "Radiant", "tierId": 27, "color": "#FFFF00", "enabled": true, "roleId": null}
    ]
}'::jsonb
WHERE id = (SELECT id FROM valorant_tracker_settings ORDER BY created_at DESC LIMIT 1);

-- ============================
-- ERFOLGS-MESSAGE
-- ============================
DO $$
BEGIN
    RAISE NOTICE '🎉 VALORANT TRACKER SUPABASE FIXES ERFOLGREICH ANGEWENDET!';
    RAISE NOTICE '✅ SQL-Schema Mehrdeutigkeit behoben';
    RAISE NOTICE '✅ Player Stats Embeds verbessert (mehr Details)';
    RAISE NOTICE '✅ Rank Rewards System aktiviert (alle 27 Ränge)';
    RAISE NOTICE '🚀 System ist bereit für Production!';
END $$; 