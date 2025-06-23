-- =============================================
-- XP SYSTEM SUPABASE MIGRATION
-- =============================================
-- Diese SQL-Datei erstellt alle notwendigen Tabellen für das XP-System
-- Migration von JSON-Dateien zu Supabase

-- =============================================
-- 1. XP USERS TABLE
-- =============================================
-- Speichert alle User-XP-Daten (ersetzt xp-data.json)

CREATE TABLE IF NOT EXISTS xp_users (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    username TEXT DEFAULT 'Unbekannt',
    avatar TEXT,
    level INTEGER DEFAULT 1,
    total_xp BIGINT DEFAULT 0,
    xp BIGINT DEFAULT 0, -- Current XP (für legacy compatibility)
    message_count BIGINT DEFAULT 0,
    voice_time NUMERIC(12,4) DEFAULT 0, -- Voice-Zeit in Minuten (mit Dezimalstellen)
    last_message_time BIGINT DEFAULT 0, -- Timestamp der letzten Nachricht
    voice_join_time BIGINT DEFAULT 0, -- Timestamp des Voice-Joins (temporär)
    last_voice_xp BIGINT DEFAULT 0, -- Letztes Voice-XP (für Cooldown)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_xp_users_user_id ON xp_users(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_users_total_xp ON xp_users(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_xp_users_level ON xp_users(level DESC);
CREATE INDEX IF NOT EXISTS idx_xp_users_message_count ON xp_users(message_count DESC);
CREATE INDEX IF NOT EXISTS idx_xp_users_voice_time ON xp_users(voice_time DESC);

-- =============================================
-- 2. XP SETTINGS TABLE
-- =============================================
-- Speichert alle XP-System-Einstellungen (ersetzt xp-settings.json)

CREATE TABLE IF NOT EXISTS xp_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für Settings
CREATE INDEX IF NOT EXISTS idx_xp_settings_key ON xp_settings(setting_key);

-- =============================================
-- 3. XP LEVEL ROLES TABLE
-- =============================================
-- Speichert Level-Rollen-Konfiguration

CREATE TABLE IF NOT EXISTS xp_level_roles (
    id BIGSERIAL PRIMARY KEY,
    level INTEGER NOT NULL,
    role_id TEXT NOT NULL,
    role_name TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    is_auto_role BOOLEAN DEFAULT FALSE, -- TRUE für automatische Level-Rollen, FALSE für custom
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(level, guild_id, role_id)
);

-- Indizes für Level-Rollen
CREATE INDEX IF NOT EXISTS idx_xp_level_roles_level ON xp_level_roles(level);
CREATE INDEX IF NOT EXISTS idx_xp_level_roles_guild ON xp_level_roles(guild_id);
CREATE INDEX IF NOT EXISTS idx_xp_level_roles_auto ON xp_level_roles(is_auto_role);

-- =============================================
-- 4. XP MILESTONE REWARDS TABLE
-- =============================================
-- Speichert Meilenstein-Belohnungen

CREATE TABLE IF NOT EXISTS xp_milestone_rewards (
    id BIGSERIAL PRIMARY KEY,
    xp_required BIGINT NOT NULL,
    reward_title TEXT NOT NULL,
    reward_description TEXT,
    role_id TEXT, -- Optional: Discord-Rolle für diesen Meilenstein
    role_name TEXT,
    guild_id TEXT,
    is_auto_milestone BOOLEAN DEFAULT FALSE, -- TRUE für automatische Meilensteine
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes für Meilensteine
CREATE INDEX IF NOT EXISTS idx_xp_milestone_xp ON xp_milestone_rewards(xp_required);
CREATE INDEX IF NOT EXISTS idx_xp_milestone_guild ON xp_milestone_rewards(guild_id);
CREATE INDEX IF NOT EXISTS idx_xp_milestone_auto ON xp_milestone_rewards(is_auto_milestone);

-- =============================================
-- 5. XP CHANNEL BLACKLIST TABLE
-- =============================================
-- Speichert Channel-Blacklists für XP und Voice

CREATE TABLE IF NOT EXISTS xp_channel_blacklist (
    id BIGSERIAL PRIMARY KEY,
    channel_name TEXT NOT NULL,
    channel_type TEXT NOT NULL CHECK (channel_type IN ('text', 'voice')), -- 'text' oder 'voice'
    guild_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_name, channel_type, guild_id)
);

-- Index für Channel-Blacklist
CREATE INDEX IF NOT EXISTS idx_xp_blacklist_guild_type ON xp_channel_blacklist(guild_id, channel_type);

-- =============================================
-- 6. XP AUTO LEADERBOARD TABLE
-- =============================================
-- Speichert Auto-Leaderboard Message IDs für Cleanup

CREATE TABLE IF NOT EXISTS xp_auto_leaderboard_messages (
    id BIGSERIAL PRIMARY KEY,
    message_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    leaderboard_type TEXT NOT NULL, -- 'total', 'level', 'messages', 'voice'
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für Auto-Leaderboard Messages
CREATE INDEX IF NOT EXISTS idx_xp_auto_leaderboard_guild ON xp_auto_leaderboard_messages(guild_id);
CREATE INDEX IF NOT EXISTS idx_xp_auto_leaderboard_posted ON xp_auto_leaderboard_messages(posted_at DESC);

-- =============================================
-- 7. XP VOICE SESSIONS TABLE (Optional)
-- =============================================
-- Speichert aktive Voice-Sessions für besseres Tracking

CREATE TABLE IF NOT EXISTS xp_voice_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    channel_name TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    join_time BIGINT NOT NULL, -- Timestamp
    leave_time BIGINT, -- NULL wenn noch aktiv
    duration_minutes NUMERIC(12,4), -- Berechnet beim Leave
    xp_gained INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes für Voice-Sessions
CREATE INDEX IF NOT EXISTS idx_xp_voice_sessions_user ON xp_voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_voice_sessions_active ON xp_voice_sessions(user_id) WHERE leave_time IS NULL;
CREATE INDEX IF NOT EXISTS idx_xp_voice_sessions_guild ON xp_voice_sessions(guild_id);

-- =============================================
-- RLS (Row Level Security) POLICIES
-- =============================================
-- Aktiviere RLS auf allen Tabellen
ALTER TABLE xp_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_level_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_milestone_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_channel_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_auto_leaderboard_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_voice_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies für öffentlichen Lesezugriff (angepasst je nach Sicherheitsanforderungen)
CREATE POLICY "Allow public read access on xp_users" ON xp_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on xp_users" ON xp_users FOR ALL USING (true);

CREATE POLICY "Allow public read access on xp_settings" ON xp_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on xp_settings" ON xp_settings FOR ALL USING (true);

CREATE POLICY "Allow public read access on xp_level_roles" ON xp_level_roles FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on xp_level_roles" ON xp_level_roles FOR ALL USING (true);

CREATE POLICY "Allow public read access on xp_milestone_rewards" ON xp_milestone_rewards FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on xp_milestone_rewards" ON xp_milestone_rewards FOR ALL USING (true);

CREATE POLICY "Allow public read access on xp_channel_blacklist" ON xp_channel_blacklist FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on xp_channel_blacklist" ON xp_channel_blacklist FOR ALL USING (true);

CREATE POLICY "Allow public read access on xp_auto_leaderboard_messages" ON xp_auto_leaderboard_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on xp_auto_leaderboard_messages" ON xp_auto_leaderboard_messages FOR ALL USING (true);

CREATE POLICY "Allow public read access on xp_voice_sessions" ON xp_voice_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on xp_voice_sessions" ON xp_voice_sessions FOR ALL USING (true);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function für Updated_at Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at Triggers
CREATE TRIGGER update_xp_users_updated_at BEFORE UPDATE ON xp_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_xp_settings_updated_at BEFORE UPDATE ON xp_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_xp_level_roles_updated_at BEFORE UPDATE ON xp_level_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_xp_milestone_rewards_updated_at BEFORE UPDATE ON xp_milestone_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_xp_voice_sessions_updated_at BEFORE UPDATE ON xp_voice_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DEFAULT SETTINGS EINFÜGEN
-- =============================================

-- Insert default XP settings
INSERT INTO xp_settings (setting_key, setting_value, description) VALUES 
('system', '{"enabled": true}', 'XP System aktiviert/deaktiviert'),
('messageXP', '{"min": 5, "max": 15, "cooldown": 60000}', 'Nachrichten-XP Einstellungen'),
('voiceXP', '{"baseXP": 2, "afkChannelXP": 0, "soloChannelXP": 1, "cooldown": 60000, "intervalMinutes": 1}', 'Voice-XP Einstellungen'),
('levelSystem', '{"baseXP": 100, "multiplier": 1.5, "maxLevel": 100}', 'Level-System Konfiguration'),
('channels', '{"levelUpChannel": "level-up", "leaderboardChannel": "leaderboard"}', 'Channel-Konfiguration'),
('autoLeaderboard', '{"enabled": true, "time": "20:00", "timezone": "Europe/Berlin", "channelName": "leaderboard", "types": ["total"], "limit": 10, "lastPosted": 0, "autoDeleteOld": true}', 'Auto-Leaderboard Einstellungen'),
('announcements', '{"levelUp": true, "milestones": true, "newRecord": true}', 'Ankündigungs-Einstellungen'),
('display', '{"showRank": true, "showProgress": true, "embedColor": "0x00FF7F", "leaderboardSize": 10}', 'Anzeige-Einstellungen'),
('levelUpEmbed', '{"enabled": true, "title": "🎉 Level Up!", "color": "0x00FF7F", "animation": {"enabled": true, "style": "celebration", "duration": 5000}, "fields": {"showStats": true, "showNextLevel": true, "showRank": true, "customMessage": ""}, "footer": {"enabled": true, "text": "🎉 Herzlichen Glückwunsch!"}}', 'Level-Up Embed Konfiguration')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default milestone rewards
INSERT INTO xp_milestone_rewards (xp_required, reward_title, reward_description, is_auto_milestone) VALUES 
(500, '🌱 Newcomer', 'Newcomer Rolle', true),
(1000, '💬 Aktives Mitglied', 'Aktives Mitglied Rolle', true),
(2500, '⭐ Erfahrener User', 'Erfahrener User Rolle', true),
(5000, '🎯 Server-Veteran', 'Server-Veteran Rolle', true),
(10000, '👑 Elite Member', 'Elite Member Rolle', true),
(25000, '🏆 Server-Legende', 'Server-Legende Rolle', true),
(50000, '💎 Diamond Member', 'Diamond Member Rolle', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- PERFORMANCE OPTIMIERUNGEN
-- =============================================

-- Partitionierung für große xp_voice_sessions Tabelle (optional)
-- Falls die Voice-Sessions-Tabelle sehr groß wird, kann Partitionierung helfen

-- Cleanup-Jobs für alte Auto-Leaderboard Messages (PostgreSQL Cron Extension erforderlich)
-- SELECT cron.schedule('cleanup-old-leaderboard-messages', '0 2 * * *', 
--   'DELETE FROM xp_auto_leaderboard_messages WHERE posted_at < NOW() - INTERVAL ''7 days'';');

-- =============================================
-- MIGRATION HELPER VIEWS
-- =============================================

-- View für Legacy-Kompatibilität (falls nötig)
CREATE OR REPLACE VIEW xp_user_legacy AS
SELECT 
    user_id,
    username,
    avatar,
    level,
    total_xp,
    xp,
    message_count,
    voice_time,
    last_message_time as "lastMessage",
    voice_join_time as "voiceJoinTime"
FROM xp_users;

-- View für Leaderboard-Abfragen
CREATE OR REPLACE VIEW xp_leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY total_xp DESC) as rank,
    user_id,
    username,
    level,
    total_xp,
    message_count,
    voice_time,
    updated_at
FROM xp_users
WHERE total_xp > 0
ORDER BY total_xp DESC;

-- =============================================
-- KOMMENTARE FÜR ENTWICKLER
-- =============================================

/*
MIGRATION SCHRITTE:

1. Diese SQL-Datei in Supabase ausführen
2. Bestehende JSON-Daten migrieren:
   - xp-data.json → xp_users Tabelle
   - xp-settings.json → xp_settings Tabelle + xp_level_roles + xp_channel_blacklist
3. xp-system.js anpassen für Supabase-Zugriff
4. Testen aller XP-Funktionen
5. JSON-Dateien als Backup behalten bis alles funktioniert

WICHTIGE FELDER:
- user_id: Discord User ID (String)
- total_xp: Gesamt-XP des Users
- level: Aktuelles Level (berechnet aus total_xp)
- voice_time: Voice-Zeit in Minuten (mit Dezimalstellen)
- setting_value: JSONB für flexible Settings-Speicherung

PERFORMANCE TIPPS:
- Indizes sind bereits erstellt für häufige Abfragen
- RLS ist aktiviert für Sicherheit
- Views vereinfachen Legacy-Kompatibilität
- Triggers halten updated_at aktuell
*/ 