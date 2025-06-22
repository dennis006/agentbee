-- =====================================================
-- VERIFICATION CONFIG UPDATE SCRIPT
-- =====================================================
-- Aktualisiert bestehende Verification-Configs um fehlende Felder zu ergänzen
-- =====================================================

-- Aktualisiere bestehende Verification-Config um fehlende Felder zu ergänzen
UPDATE verification_config 
SET config = config || jsonb_build_object(
    'embedColor', COALESCE(config->>'embedColor', '0x00FF7F'),
    'verificationMessage', COALESCE(
        config->'verificationMessage', 
        jsonb_build_object(
            'title', '🛡️ Server Verifizierung',
            'description', 'Willkommen auf dem Server! Um Zugang zu allen Channels zu erhalten, musst du dich verifizieren.',
            'buttonText', '🚀 Jetzt verifizieren',
            'steps', jsonb_build_array(
                '✅ Wähle deine Lieblingsspiele',
                '💻 Gib deine Gaming-Plattform an', 
                '🎯 Erhalte passende Rollen automatisch'
            )
        )
    )
)
WHERE config IS NOT NULL;

-- Stelle sicher, dass alle allowedGames die neuen Spiele enthalten
UPDATE verification_config 
SET config = jsonb_set(
    config,
    '{allowedGames}',
    COALESCE(config->'allowedGames', '[]'::jsonb) || 
    jsonb_build_array(
        jsonb_build_object('id', 'minecraft', 'label', 'Minecraft', 'emoji', '🧱'),
        jsonb_build_object('id', 'fortnite', 'label', 'Fortnite', 'emoji', '🪂'),
        jsonb_build_object('id', 'cs2', 'label', 'Counter-Strike 2', 'emoji', '💥'),
        jsonb_build_object('id', 'apex', 'label', 'Apex Legends', 'emoji', '🚀')
    )
)
WHERE config IS NOT NULL 
AND NOT (config->'allowedGames' @> '[{"id": "minecraft"}]'::jsonb);

-- Stelle sicher, dass alle allowedPlatforms die neuen Plattformen enthalten
UPDATE verification_config 
SET config = jsonb_set(
    config,
    '{allowedPlatforms}',
    COALESCE(config->'allowedPlatforms', '[]'::jsonb) || 
    jsonb_build_array(
        jsonb_build_object('id', 'switch', 'label', 'Nintendo Switch', 'emoji', '🎮', 'role', 'Switch'),
        jsonb_build_object('id', 'mobile', 'label', 'Mobile', 'emoji', '📱', 'role', 'Mobile')
    )
)
WHERE config IS NOT NULL 
AND NOT (config->'allowedPlatforms' @> '[{"id": "switch"}]'::jsonb);

-- Zeige die aktualisierte Config an
SELECT 
    id,
    config->>'embedColor' as embed_color,
    config->'verificationMessage'->>'title' as message_title,
    config->'verificationMessage'->>'buttonText' as button_text,
    jsonb_array_length(config->'allowedGames') as games_count,
    jsonb_array_length(config->'allowedPlatforms') as platforms_count,
    jsonb_array_length(config->'verificationMessage'->'steps') as steps_count
FROM verification_config; 