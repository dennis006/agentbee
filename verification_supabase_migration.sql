-- =====================================================
-- DISCORD BOT - VERIFICATION SUPABASE MIGRATION
-- =====================================================
-- Ersetzt: verification.json, verified-users.json, verification-stats.json
-- =====================================================

-- Lösche bestehende Tabellen falls vorhanden
DROP TABLE IF EXISTS verification_users CASCADE;
DROP TABLE IF EXISTS verification_config CASCADE;
DROP TABLE IF EXISTS verification_stats CASCADE;

-- ============================
-- TABELLE: VERIFICATION CONFIG
-- ============================

CREATE TABLE verification_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basis-Einstellungen
    enabled BOOLEAN DEFAULT true,
    require_captcha BOOLEAN DEFAULT true,
    auto_assign_roles BOOLEAN DEFAULT true,
    
    -- Konfiguration als JSONB (wie verification.json)
    config JSONB NOT NULL DEFAULT '{
        "enabled": true,
        "requireCaptcha": true,
        "allowedGames": [
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
                "id": "world-of-warcraft",
                "label": "World Of Warcraft",
                "emoji": "⚔️",
                "role": "World of Warcraft"
            },
            {
                "id": "fragpunk",
                "label": "Fragpunk",
                "emoji": "🔞"
            }
        ],
        "defaultRoles": [
            "Member",
            "verify"
        ],
        "welcomeMessage": "Willkommen auf dem Server! Du hast die Verifizierung erfolgreich abgeschlossen.",
        "logChannel": "verify-logs",
        "autoAssignRoles": true,
        "gameRoles": {
            "valorant": "Valorant Player",
            "lol": "LoL Player",
            "minecraft": "Minecraft Player",
            "fortnite": "Fortnite Player",
            "cs2": "CS2 Player",
            "apex": "Apex Player"
        },
        "platformRoles": {
            "pc": "PC Gamer",
            "ps5": "PlayStation Gamer",
            "xbox": "Xbox Gamer",
            "switch": "Switch Gamer",
            "mobile": "Mobile Gamer"
        },
        "allowedPlatforms": [
            {
                "id": "pc",
                "label": "PC",
                "emoji": "💻",
                "role": "🖥️PC"
            },
            {
                "id": "xbox",
                "label": "Xbox",
                "emoji": "❎",
                "role": "❎Xbox"
            },
            {
                "id": "ps5",
                "label": "PS5",
                "emoji": "🎮",
                "role": "🎮PS5"
            }
        ],
        "verificationChannel": "verify",
        "botUpdates": {
            "enabled": true,
            "optInText": "📢 Ich möchte Bot-Updates und Neuigkeiten erhalten",
            "updatesRole": "Bot Updates",
            "channelName": "bot-updates"
        }
    }'::jsonb,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- TABELLE: VERIFICATION USERS
-- ============================

CREATE TABLE verification_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Discord User Info
    discord_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    discriminator TEXT DEFAULT '0',
    avatar TEXT,
    
    -- Verification Data
    games TEXT[] DEFAULT '{}',
    platform TEXT,
    agents TEXT[] DEFAULT '{}',
    assigned_roles TEXT[] DEFAULT '{}',
    wants_bot_updates BOOLEAN DEFAULT false,
    
    -- Guild Info
    guild_id TEXT NOT NULL,
    guild_name TEXT,
    
    -- Metadaten
    verification_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- TABELLE: VERIFICATION STATS
-- ============================

CREATE TABLE verification_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basis-Statistiken
    total_verifications INTEGER DEFAULT 0,
    today_verifications INTEGER DEFAULT 0,
    failed_attempts INTEGER DEFAULT 0,
    
    -- Game & Platform Stats als JSONB
    popular_games JSONB DEFAULT '[]'::jsonb,
    platform_stats JSONB DEFAULT '[]'::jsonb,
    
    -- Zeitstempel
    last_day DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- INDIZES FÜR PERFORMANCE
-- ============================

-- Verification Users
CREATE INDEX idx_verification_users_discord_id ON verification_users(discord_id);
CREATE INDEX idx_verification_users_guild_id ON verification_users(guild_id);
CREATE INDEX idx_verification_users_verification_date ON verification_users(verification_date);
CREATE INDEX idx_verification_users_games ON verification_users USING GIN(games);
CREATE INDEX idx_verification_users_platform ON verification_users(platform);

-- Verification Config
CREATE INDEX idx_verification_config_enabled ON verification_config USING GIN ((config->'enabled'));

-- ============================
-- TRIGGER FÜR AUTO-TIMESTAMPS
-- ============================

-- Auto-Update Timestamp Funktion
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für alle Tabellen
CREATE TRIGGER update_verification_config_updated_at
    BEFORE UPDATE ON verification_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_users_updated_at
    BEFORE UPDATE ON verification_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_stats_updated_at
    BEFORE UPDATE ON verification_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================
-- HILFSFUNKTIONEN
-- ============================

-- Funktion: Initialisiere Standard-Konfiguration
CREATE OR REPLACE FUNCTION initialize_verification_config()
RETURNS BOOLEAN AS $$
BEGIN
    -- Standard-Konfiguration erstellen
    INSERT INTO verification_config DEFAULT VALUES
    ON CONFLICT DO NOTHING;
    
    -- Standard-Stats erstellen
    INSERT INTO verification_stats DEFAULT VALUES
    ON CONFLICT DO NOTHING;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Funktion: User Statistiken aktualisieren
CREATE OR REPLACE FUNCTION update_verification_statistics()
RETURNS VOID AS $$
DECLARE
    user_count INTEGER;
    today_count INTEGER;
    game_stats JSONB;
    platform_stats JSONB;
BEGIN
    -- Berechne aktuelle Statistiken aus User-Daten
    SELECT COUNT(*) INTO user_count FROM verification_users;
    
    SELECT COUNT(*) INTO today_count 
    FROM verification_users 
    WHERE DATE(verification_date) = CURRENT_DATE;
    
    -- Game-Statistiken
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'game', game,
                'count', game_count
            ) ORDER BY game_count DESC
        ), '[]'::jsonb
    ) INTO game_stats
    FROM (
        SELECT unnest(games) as game, COUNT(*) as game_count
        FROM verification_users
        WHERE games IS NOT NULL AND array_length(games, 1) > 0
        GROUP BY unnest(games)
    ) game_counts;
    
    -- Platform-Statistiken
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'platform', platform,
                'count', platform_count
            ) ORDER BY platform_count DESC
        ), '[]'::jsonb
    ) INTO platform_stats
    FROM (
        SELECT platform, COUNT(*) as platform_count
        FROM verification_users
        WHERE platform IS NOT NULL
        GROUP BY platform
    ) platform_counts;
    
    -- Update oder Insert Stats
    INSERT INTO verification_stats (
        total_verifications,
        today_verifications,
        popular_games,
        platform_stats,
        last_day
    ) VALUES (
        user_count,
        today_count,
        game_stats,
        platform_stats,
        CURRENT_DATE
    )
    ON CONFLICT (id) DO UPDATE SET
        total_verifications = EXCLUDED.total_verifications,
        today_verifications = EXCLUDED.today_verifications,
        popular_games = EXCLUDED.popular_games,
        platform_stats = EXCLUDED.platform_stats,
        last_day = EXCLUDED.last_day,
        updated_at = NOW();
        
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-Update Stats bei User-Änderungen
CREATE OR REPLACE FUNCTION trigger_update_stats()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_verification_statistics();
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_verification_stats
    AFTER INSERT OR UPDATE OR DELETE ON verification_users
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_update_stats();

-- ============================
-- MIGRATION COMPLETE
-- ============================

-- Initialisiere Standard-Daten
SELECT initialize_verification_config();

-- Berechne initiale Statistiken
SELECT update_verification_statistics();

-- Informationen
COMMENT ON TABLE verification_config IS 'Verification System Konfiguration - ersetzt verification.json';
COMMENT ON TABLE verification_users IS 'Verifizierte Discord Users - ersetzt verified-users.json';
COMMENT ON TABLE verification_stats IS 'Verification Statistiken - ersetzt verification-stats.json';

-- Migration erfolgreich!
SELECT 'Verification Supabase Migration erfolgreich! Alle JSON-Dateien ersetzt.' as status; 