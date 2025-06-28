-- ================================================================
-- 🎮 LFG SYSTEM - UPDATE MIGRATION
-- ================================================================
-- Fügt neue Konfigurationsfelder zur bestehenden lfg_settings Tabelle hinzu
-- Created: 2025-01-27

-- ================================================================
-- 1. NEUE SPALTEN ZUR LFG_SETTINGS TABELLE HINZUFÜGEN
-- ================================================================

-- 🎮 Interactive Features Configuration
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS enable_buttons BOOLEAN DEFAULT true;
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS enable_voice_creation BOOLEAN DEFAULT true;
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS enable_dm_notifications BOOLEAN DEFAULT true;
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS enable_auto_voice_cleanup BOOLEAN DEFAULT true;
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS voice_cleanup_hours INTEGER DEFAULT 2;

-- 🏗️ Voice Channel Configuration
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS voice_category_name TEXT DEFAULT '🎮 Gaming Lobbys';
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS voice_auto_create_category BOOLEAN DEFAULT true;
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS voice_user_limit_override INTEGER DEFAULT NULL;
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS voice_channel_prefix TEXT DEFAULT '';

-- 🎯 Game-Specific Settings
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS game_team_sizes JSONB DEFAULT '{
    "Valorant": 5,
    "League of Legends": 5,
    "Overwatch 2": 6,
    "Counter-Strike 2": 5,
    "CS2": 5,
    "Apex Legends": 3,
    "Rocket League": 3,
    "Call of Duty": 6,
    "Fortnite": 4
}'::jsonb;

-- 🔧 Advanced Features
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS enable_team_size_detection BOOLEAN DEFAULT true;
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS enable_game_detection BOOLEAN DEFAULT true;
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS enable_creator_protection BOOLEAN DEFAULT true;
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS max_team_size INTEGER DEFAULT 10;
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS min_team_size INTEGER DEFAULT 2;

-- 📊 Analytics & Tracking
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS track_team_statistics BOOLEAN DEFAULT true;
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS track_user_activity BOOLEAN DEFAULT true;
ALTER TABLE lfg_settings ADD COLUMN IF NOT EXISTS enable_leaderboards BOOLEAN DEFAULT false;

-- ================================================================
-- 2. UPDATE BESTEHENDE EINTRÄGE MIT DEFAULT-WERTEN
-- ================================================================

-- Stelle sicher, dass alle bestehenden Einträge die neuen Default-Werte haben
UPDATE lfg_settings SET 
    enable_buttons = COALESCE(enable_buttons, true),
    enable_voice_creation = COALESCE(enable_voice_creation, true),
    enable_dm_notifications = COALESCE(enable_dm_notifications, true),
    enable_auto_voice_cleanup = COALESCE(enable_auto_voice_cleanup, true),
    voice_cleanup_hours = COALESCE(voice_cleanup_hours, 2),
    voice_category_name = COALESCE(voice_category_name, '🎮 Gaming Lobbys'),
    voice_auto_create_category = COALESCE(voice_auto_create_category, true),
    voice_channel_prefix = COALESCE(voice_channel_prefix, ''),
    game_team_sizes = COALESCE(game_team_sizes, '{
        "Valorant": 5,
        "League of Legends": 5,
        "Overwatch 2": 6,
        "Counter-Strike 2": 5,
        "CS2": 5,
        "Apex Legends": 3,
        "Rocket League": 3,
        "Call of Duty": 6,
        "Fortnite": 4
    }'::jsonb),
    enable_team_size_detection = COALESCE(enable_team_size_detection, true),
    enable_game_detection = COALESCE(enable_game_detection, true),
    enable_creator_protection = COALESCE(enable_creator_protection, true),
    max_team_size = COALESCE(max_team_size, 10),
    min_team_size = COALESCE(min_team_size, 2),
    track_team_statistics = COALESCE(track_team_statistics, true),
    track_user_activity = COALESCE(track_user_activity, true),
    enable_leaderboards = COALESCE(enable_leaderboards, false)
WHERE id IS NOT NULL;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
-- 
-- Neue Spalten hinzugefügt:
-- ✅ enable_buttons - Button Interaktionen aktivieren
-- ✅ enable_voice_creation - Voice Channel Erstellung
-- ✅ enable_dm_notifications - DM Benachrichtigungen
-- ✅ enable_auto_voice_cleanup - Auto Voice Cleanup
-- ✅ voice_cleanup_hours - Cleanup Zeit in Stunden
-- ✅ voice_category_name - Name der Voice Category
-- ✅ voice_auto_create_category - Auto Category Erstellung
-- ✅ voice_user_limit_override - Globales User Limit
-- ✅ voice_channel_prefix - Channel Name Prefix
-- ✅ game_team_sizes - Spiel-spezifische Team-Größen
-- ✅ enable_team_size_detection - Team-Größen Erkennung
-- ✅ enable_game_detection - Spiel-Erkennung
-- ✅ enable_creator_protection - Creator Schutz
-- ✅ max_team_size - Maximale Team-Größe
-- ✅ min_team_size - Minimale Team-Größe
-- ✅ track_team_statistics - Team Statistiken
-- ✅ track_user_activity - User Aktivität
-- ✅ enable_leaderboards - Leaderboards aktivieren
--
-- Alle bestehenden Einträge wurden mit Default-Werten aktualisiert.
-- Das Dashboard kann jetzt alle neuen Features konfigurieren!
--
-- ================================================================ 

-- ================================================================
-- 🎮 LFG SYSTEM - FRAGPUNK UPDATE
-- ================================================================
-- Fügt Fragpunk zu den unterstützten Spielen hinzu
-- Created: 2025-01-27

-- ================================================================
-- 1. UPDATE EXISTING SETTINGS - ADD FRAGPUNK
-- ================================================================

-- Update allowed_games für alle bestehenden Einträge
UPDATE lfg_settings 
SET allowed_games = jsonb_set(
    allowed_games, 
    '{-1}', 
    '"Fragpunk"'::jsonb, 
    true
)
WHERE NOT (allowed_games ? 'Fragpunk');

-- Update game_team_sizes für alle bestehenden Einträge
UPDATE lfg_settings 
SET game_team_sizes = jsonb_set(
    game_team_sizes, 
    '{"Fragpunk"}', 
    '5'::jsonb, 
    true
)
WHERE NOT (game_team_sizes ? 'Fragpunk');

-- ================================================================
-- 2. UPDATE DEFAULT VALUES FOR NEW ENTRIES
-- ================================================================

-- Aktualisiere die Default-Werte in der Tabellen-Definition
ALTER TABLE lfg_settings 
ALTER COLUMN allowed_games 
SET DEFAULT '["Valorant", "League of Legends", "Overwatch 2", "Counter-Strike 2", "Apex Legends", "Rocket League", "Call of Duty", "Fortnite", "Fragpunk"]'::jsonb;

ALTER TABLE lfg_settings 
ALTER COLUMN game_team_sizes 
SET DEFAULT '{
    "Valorant": 5,
    "League of Legends": 5,
    "Overwatch 2": 6,
    "Counter-Strike 2": 5,
    "CS2": 5,
    "Apex Legends": 3,
    "Rocket League": 3,
    "Call of Duty": 6,
    "Fortnite": 4,
    "Fragpunk": 5
}'::jsonb;

-- ================================================================
-- 3. VERIFICATION QUERIES
-- ================================================================

-- Zeige alle Guild-Einstellungen mit Fragpunk-Status
-- SELECT 
--     guild_id,
--     allowed_games ? 'Fragpunk' as has_fragpunk_in_games,
--     game_team_sizes ? 'Fragpunk' as has_fragpunk_in_sizes,
--     allowed_games,
--     game_team_sizes
-- FROM lfg_settings;

-- ================================================================
-- 4. CLEANUP FUNCTION (OPTIONAL)
-- ================================================================

-- Funktion um alle LFG-Einstellungen zu aktualisieren
CREATE OR REPLACE FUNCTION update_lfg_settings_with_fragpunk()
RETURNS void AS $$
BEGIN
    -- Füge Fragpunk zu allowed_games hinzu falls nicht vorhanden
    UPDATE lfg_settings 
    SET allowed_games = jsonb_set(
        allowed_games, 
        '{-1}', 
        '"Fragpunk"'::jsonb, 
        true
    )
    WHERE NOT (allowed_games ? 'Fragpunk');
    
    -- Füge Fragpunk zu game_team_sizes hinzu falls nicht vorhanden
    UPDATE lfg_settings 
    SET game_team_sizes = jsonb_set(
        game_team_sizes, 
        '{"Fragpunk"}', 
        '5'::jsonb, 
        true
    )
    WHERE NOT (game_team_sizes ? 'Fragpunk');
    
    -- Update updated_at timestamp
    UPDATE lfg_settings 
    SET updated_at = NOW() 
    WHERE NOT (allowed_games ? 'Fragpunk') OR NOT (game_team_sizes ? 'Fragpunk');
    
    RAISE NOTICE 'Fragpunk erfolgreich zu allen LFG-Einstellungen hinzugefügt!';
END;
$$ LANGUAGE plpgsql;

-- Führe das Update aus
SELECT update_lfg_settings_with_fragpunk();

-- ================================================================
-- 5. MIGRATION COMPLETE
-- ================================================================

-- Zeige Bestätigung
DO $$
BEGIN
    RAISE NOTICE '✅ LFG System Fragpunk Migration abgeschlossen!';
    RAISE NOTICE '🎮 Fragpunk wurde zu allen allowed_games hinzugefügt';
    RAISE NOTICE '⚙️ Fragpunk Team-Größe auf 5 Spieler gesetzt';
    RAISE NOTICE '🔄 Default-Werte für neue Einträge aktualisiert';
END $$; 