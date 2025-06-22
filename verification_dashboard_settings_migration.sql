-- =====================================================
-- DISCORD BOT - VERIFICATION DASHBOARD SETTINGS MIGRATION
-- =====================================================
-- Erweitert: verification_supabase_migration.sql
-- Speichert: Dashboard-Einstellungen für Verification-Nachrichten
-- =====================================================

-- Lösche bestehende Tabelle falls vorhanden
DROP TABLE IF EXISTS verification_dashboard_settings CASCADE;

-- ============================
-- TABELLE: VERIFICATION DASHBOARD SETTINGS
-- ============================

CREATE TABLE verification_dashboard_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Allgemeine Einstellungen
    enabled BOOLEAN DEFAULT true,
    require_captcha BOOLEAN DEFAULT true,
    auto_assign_roles BOOLEAN DEFAULT true,
    
    -- Spiele-Konfiguration
    allowed_games JSONB DEFAULT '[
        {
            "id": "valorant",
            "label": "Valorant",
            "emoji": "🎯",
            "role": "Valorant"
        },
        {
            "id": "league-of-legends", 
            "label": "League of Legends",
            "emoji": "⭐",
            "role": "League of Legends"
        },
        {
            "id": "minecraft",
            "label": "Minecraft", 
            "emoji": "🧱",
            "role": "Minecraft"
        }
    ]'::jsonb,
    
    -- Plattform-Konfiguration
    allowed_platforms JSONB DEFAULT '[
        {
            "id": "pc",
            "label": "PC",
            "emoji": "💻",
            "role": "PC"
        },
        {
            "id": "ps5",
            "label": "PlayStation 5",
            "emoji": "🎮", 
            "role": "PS5"
        },
        {
            "id": "xbox",
            "label": "Xbox",
            "emoji": "❎",
            "role": "Xbox"
        }
    ]'::jsonb,
    
    -- Standard-Rollen
    default_roles JSONB DEFAULT '["Member", "Verified"]'::jsonb,
    
    -- Willkommensnachricht
    welcome_message TEXT DEFAULT 'Willkommen auf dem Server! Du hast die Verifizierung erfolgreich abgeschlossen.',
    
    -- Embed-Farbe
    embed_color TEXT DEFAULT '0x00FF7F',
    
    -- Log-Kanal
    log_channel TEXT DEFAULT 'verify-logs',
    
    -- Verification-Kanal
    verification_channel TEXT DEFAULT 'verify',
    
    -- Verifizierungsnachricht-Einstellungen
    verification_message JSONB DEFAULT '{
        "title": "🛡️ Server Verifizierung",
        "description": "Willkommen auf dem Server! Um Zugang zu allen Channels zu erhalten, musst du dich verifizieren.",
        "buttonText": "🚀 Jetzt verifizieren",
        "steps": [
            "✅ Wähle deine Lieblingsspiele",
            "💻 Gib deine Gaming-Plattform an", 
            "🎯 Erhalte passende Rollen automatisch"
        ]
    }'::jsonb,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- INDIZES FÜR PERFORMANCE
-- ============================

CREATE INDEX idx_verification_dashboard_enabled ON verification_dashboard_settings(enabled);
CREATE INDEX idx_verification_dashboard_games ON verification_dashboard_settings USING GIN(allowed_games);
CREATE INDEX idx_verification_dashboard_platforms ON verification_dashboard_settings USING GIN(allowed_platforms);

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

-- Trigger für Dashboard Settings
CREATE TRIGGER update_verification_dashboard_settings_updated_at
    BEFORE UPDATE ON verification_dashboard_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================
-- HILFSFUNKTIONEN
-- ============================

-- Funktion: Lade Dashboard-Einstellungen
CREATE OR REPLACE FUNCTION get_verification_dashboard_settings()
RETURNS JSONB AS $$
DECLARE
    settings_record RECORD;
    result JSONB;
BEGIN
    -- Lade die ersten (und einzigen) Einstellungen
    SELECT * INTO settings_record
    FROM verification_dashboard_settings
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Falls keine Einstellungen existieren, erstelle Standard-Einstellungen
    IF NOT FOUND THEN
        INSERT INTO verification_dashboard_settings DEFAULT VALUES
        RETURNING * INTO settings_record;
    END IF;
    
    -- Baue JSON-Response
    result := jsonb_build_object(
        'enabled', settings_record.enabled,
        'requireCaptcha', settings_record.require_captcha,
        'autoAssignRoles', settings_record.auto_assign_roles,
        'allowedGames', settings_record.allowed_games,
        'allowedPlatforms', settings_record.allowed_platforms,
        'defaultRoles', settings_record.default_roles,
        'welcomeMessage', settings_record.welcome_message,
        'embedColor', settings_record.embed_color,
        'logChannel', settings_record.log_channel,
        'verificationChannel', settings_record.verification_channel,
        'verificationMessage', settings_record.verification_message
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Speichere Dashboard-Einstellungen
CREATE OR REPLACE FUNCTION save_verification_dashboard_settings(settings_data JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    settings_id UUID;
BEGIN
    -- Finde bestehende Einstellungen
    SELECT id INTO settings_id
    FROM verification_dashboard_settings
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF settings_id IS NOT NULL THEN
        -- Update bestehende Einstellungen
        UPDATE verification_dashboard_settings
        SET
            enabled = COALESCE((settings_data->>'enabled')::boolean, enabled),
            require_captcha = COALESCE((settings_data->>'requireCaptcha')::boolean, require_captcha),
            auto_assign_roles = COALESCE((settings_data->>'autoAssignRoles')::boolean, auto_assign_roles),
            allowed_games = COALESCE(settings_data->'allowedGames', allowed_games),
            allowed_platforms = COALESCE(settings_data->'allowedPlatforms', allowed_platforms),
            default_roles = COALESCE(settings_data->'defaultRoles', default_roles),
            welcome_message = COALESCE(settings_data->>'welcomeMessage', welcome_message),
            embed_color = COALESCE(settings_data->>'embedColor', embed_color),
            log_channel = COALESCE(settings_data->>'logChannel', log_channel),
            verification_channel = COALESCE(settings_data->>'verificationChannel', verification_channel),
            verification_message = COALESCE(settings_data->'verificationMessage', verification_message),
            updated_at = NOW()
        WHERE id = settings_id;
    ELSE
        -- Erstelle neue Einstellungen
        INSERT INTO verification_dashboard_settings (
            enabled,
            require_captcha,
            auto_assign_roles,
            allowed_games,
            allowed_platforms,
            default_roles,
            welcome_message,
            embed_color,
            log_channel,
            verification_channel,
            verification_message
        ) VALUES (
            COALESCE((settings_data->>'enabled')::boolean, true),
            COALESCE((settings_data->>'requireCaptcha')::boolean, true),
            COALESCE((settings_data->>'autoAssignRoles')::boolean, true),
            COALESCE(settings_data->'allowedGames', '[]'::jsonb),
            COALESCE(settings_data->'allowedPlatforms', '[]'::jsonb),
            COALESCE(settings_data->'defaultRoles', '[]'::jsonb),
            COALESCE(settings_data->>'welcomeMessage', 'Willkommen!'),
            COALESCE(settings_data->>'embedColor', '0x00FF7F'),
            COALESCE(settings_data->>'logChannel', 'verify-logs'),
            COALESCE(settings_data->>'verificationChannel', 'verify'),
            COALESCE(settings_data->'verificationMessage', '{}'::jsonb)
        );
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- SEED DATA: STANDARD-EINSTELLUNGEN
-- ============================

-- Erstelle Standard-Einstellungen
INSERT INTO verification_dashboard_settings (
    enabled,
    require_captcha,
    auto_assign_roles,
    allowed_games,
    allowed_platforms,
    default_roles,
    welcome_message,
    embed_color,
    log_channel,
    verification_channel,
    verification_message
) VALUES (
    true,
    true,
    true,
    '[
        {
            "id": "valorant",
            "label": "Valorant",
            "emoji": "🎯",
            "role": "Valorant"
        },
        {
            "id": "league-of-legends",
            "label": "League of Legends", 
            "emoji": "⭐",
            "role": "League of Legends"
        },
        {
            "id": "minecraft",
            "label": "Minecraft",
            "emoji": "🧱",
            "role": "Minecraft"
        },
        {
            "id": "fortnite",
            "label": "Fortnite",
            "emoji": "🪂",
            "role": "Fortnite"
        }
    ]'::jsonb,
    '[
        {
            "id": "pc",
            "label": "PC",
            "emoji": "💻",
            "role": "PC"
        },
        {
            "id": "ps5",
            "label": "PlayStation 5",
            "emoji": "🎮",
            "role": "PS5"
        },
        {
            "id": "xbox",
            "label": "Xbox",
            "emoji": "❎",
            "role": "Xbox"
        },
        {
            "id": "switch",
            "label": "Nintendo Switch",
            "emoji": "🎮",
            "role": "Switch"
        }
    ]'::jsonb,
    '["Member", "Verified"]'::jsonb,
    'Willkommen auf dem Server! Du hast die Verifizierung erfolgreich abgeschlossen.',
    '0x00FF7F',
    'verify-logs',
    'verify',
    '{
        "title": "🛡️ Server Verifizierung",
        "description": "Willkommen auf dem Server! Um Zugang zu allen Channels zu erhalten, musst du dich verifizieren.",
        "buttonText": "🚀 Jetzt verifizieren",
        "steps": [
            "✅ Wähle deine Lieblingsspiele",
            "💻 Gib deine Gaming-Plattform an",
            "🎯 Erhalte passende Rollen automatisch"
        ]
    }'::jsonb
) ON CONFLICT DO NOTHING;

-- ============================
-- MIGRATION COMPLETE
-- ============================

-- Informationen
COMMENT ON TABLE verification_dashboard_settings IS 'Dashboard-Einstellungen für Verification-System - speichert UI-Konfiguration';
COMMENT ON COLUMN verification_dashboard_settings.verification_message IS 'Titel, Beschreibung, Button-Text und Schritte für Verification-Nachricht';
COMMENT ON COLUMN verification_dashboard_settings.allowed_games IS 'Konfigurierte Spiele mit Emojis und Rollen';
COMMENT ON COLUMN verification_dashboard_settings.allowed_platforms IS 'Konfigurierte Plattformen mit Emojis und Rollen';

-- Migration erfolgreich!
DO $$
BEGIN
    RAISE NOTICE '✅ Verification Dashboard Settings Migration erfolgreich!';
    RAISE NOTICE '📊 Standard-Einstellungen erstellt';
    RAISE NOTICE '🎮 Spiele konfiguriert: %', (SELECT jsonb_array_length(allowed_games) FROM verification_dashboard_settings LIMIT 1);
    RAISE NOTICE '💻 Plattformen konfiguriert: %', (SELECT jsonb_array_length(allowed_platforms) FROM verification_dashboard_settings LIMIT 1);
END $$; 