-- =====================================================
-- DISCORD BOT - VALORANT CHANNEL UPDATE
-- =====================================================
-- Fügt den neuen Valorant Season Start Channel hinzu
-- =====================================================

-- Update bestehende Konfiguration um Valorant Channel hinzuzufügen
UPDATE server_stats_config 
SET config = jsonb_set(
    config, 
    '{channels,valorantSeason}', 
    '{
        "enabled": true,
        "channelId": "",
        "name": "🎮 Valorant Season Start: {countdown}",
        "position": 8
    }'::jsonb
)
WHERE config ? 'channels';

-- Prüfe ob Update erfolgreich war
SELECT 
    CASE 
        WHEN config->'channels' ? 'valorantSeason' THEN 
            '✅ Valorant Channel erfolgreich hinzugefügt!'
        ELSE 
            '❌ Valorant Channel konnte nicht hinzugefügt werden'
    END as status,
    config->'channels'->'valorantSeason' as valorant_config
FROM server_stats_config 
LIMIT 1; 