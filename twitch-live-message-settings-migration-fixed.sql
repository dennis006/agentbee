-- =============================================
-- TWITCH BOT LIVE MESSAGE SETTINGS MIGRATION (CORRECTED)
-- Erweitert das bestehende Twitch Bot System um Live-Message Konfiguration
-- FIXES: SQL Syntax Errors und eindeutige Bot-Tabellennamen
-- =============================================

-- Erweitere twitch_bot_settings um Live-Message Features
ALTER TABLE twitch_bot_settings ADD COLUMN IF NOT EXISTS live_notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE twitch_bot_settings ADD COLUMN IF NOT EXISTS live_message_cooldown INTEGER DEFAULT 30; -- Minuten zwischen Nachrichten

-- Erweitere twitch_bot_channels um Live-Message Settings
ALTER TABLE twitch_bot_channels ADD COLUMN IF NOT EXISTS live_message_enabled BOOLEAN DEFAULT true;
ALTER TABLE twitch_bot_channels ADD COLUMN IF NOT EXISTS live_message_template TEXT DEFAULT '🔴 Stream ist LIVE! Willkommen alle! 🎉';
ALTER TABLE twitch_bot_channels ADD COLUMN IF NOT EXISTS use_custom_live_message BOOLEAN DEFAULT false;
ALTER TABLE twitch_bot_channels ADD COLUMN IF NOT EXISTS live_message_variables JSONB DEFAULT '{"username": true, "game": true, "title": true, "viewers": true}'::jsonb;

-- Neue Tabelle für Live Message Templates (mit "bot" Präfix)
CREATE TABLE IF NOT EXISTS twitch_bot_live_message_templates (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    template TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'general', -- general, gaming, special, custom
    variables JSONB DEFAULT '["username", "game", "title", "viewers"]'::jsonb,
    usage_count INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id, name)
);

-- Standard Live Message Templates einfügen (mit korrekten Escape-Zeichen)
INSERT INTO twitch_bot_live_message_templates (guild_id, name, template, description, category, is_default) VALUES
('default', 'Standard Begrüßung', '🔴 Stream ist LIVE! Willkommen alle! 🎉', 'Einfache Begrüßungsnachricht', 'general', true),
('default', 'Gaming Start', '🎮 Der Stream startet JETZT! Let''s go! 🔥', 'Für Gaming-Streams', 'gaming', false),
('default', 'Energie Boost', '⚡ LIVE! Bereit für Action? 💪', 'Energiegeladene Nachricht', 'general', false),
('default', 'Freundlich', '🚀 Stream ist online! Viel Spaß beim Zuschauen! ❤️', 'Freundliche Begrüßung', 'general', false),
('default', 'Party Stimmung', '🎊 GO LIVE! Lasst uns eine geile Zeit haben! 🎯', 'Party-Atmosphäre', 'special', false),
('default', 'Mit Spielinfo', '🔴 {{username}} ist LIVE mit {{game}}! 🎮 {{title}}', 'Zeigt Spiel und Titel an', 'gaming', false),
('default', 'Mit Zuschauern', '⚡ Stream läuft! Schon {{viewers}} Zuschauer dabei! Kommt dazu! 🚀', 'Zeigt aktuelle Zuschauerzahl', 'general', false),
('default', 'Interaktiv', '🎮 Live mit {{game}}! Was sagt ihr dazu? Chat los! 💬', 'Animiert zum Chatten', 'gaming', false)
ON CONFLICT (guild_id, name) DO NOTHING;

-- Neue Tabelle für Live Message Statistics (mit "bot" Präfix)
CREATE TABLE IF NOT EXISTS twitch_bot_live_message_stats (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    channel_id INTEGER REFERENCES twitch_bot_channels(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES twitch_bot_live_message_templates(id) ON DELETE SET NULL,
    message_sent TEXT NOT NULL,
    stream_info JSONB DEFAULT '{}'::jsonb, -- game, title, viewers, etc.
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT DEFAULT NULL
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_twitch_bot_live_message_templates_guild_enabled ON twitch_bot_live_message_templates(guild_id, enabled);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_live_message_stats_channel_date ON twitch_bot_live_message_stats(channel_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_twitch_bot_live_message_stats_template ON twitch_bot_live_message_stats(template_id);

-- Updated_at Trigger für neue Tabellen (nur wenn function existiert)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_twitch_bot_updated_at_column') THEN
        -- Trigger nur erstellen wenn Function existiert
        DROP TRIGGER IF EXISTS update_twitch_bot_live_message_templates_updated_at ON twitch_bot_live_message_templates;
        CREATE TRIGGER update_twitch_bot_live_message_templates_updated_at 
            BEFORE UPDATE ON twitch_bot_live_message_templates 
            FOR EACH ROW EXECUTE FUNCTION update_twitch_bot_updated_at_column();
    END IF;
END
$$;

-- RLS Policies für neue Tabellen (korrigierte Syntax)
ALTER TABLE twitch_bot_live_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_live_message_stats ENABLE ROW LEVEL SECURITY;

-- Policies entfernen falls sie existieren, dann neu erstellen
DROP POLICY IF EXISTS twitch_bot_live_message_templates_policy ON twitch_bot_live_message_templates;
DROP POLICY IF EXISTS twitch_bot_live_message_stats_policy ON twitch_bot_live_message_stats;

-- Neue Policies erstellen
CREATE POLICY twitch_bot_live_message_templates_policy ON twitch_bot_live_message_templates
    FOR ALL USING (true);

CREATE POLICY twitch_bot_live_message_stats_policy ON twitch_bot_live_message_stats
    FOR ALL USING (true);

-- View für Live Message Analytics (mit korrektem Tabellennamen)
CREATE OR REPLACE VIEW twitch_bot_live_message_analytics AS
WITH message_intervals AS (
    SELECT 
        s.channel_id,
        s.sent_at,
        s.success,
        s.template_id,
        EXTRACT(EPOCH FROM (s.sent_at - LAG(s.sent_at) OVER (PARTITION BY s.channel_id ORDER BY s.sent_at))) / 60 as minutes_since_last
    FROM twitch_bot_live_message_stats s
)
SELECT 
    c.channel_name,
    c.guild_id,
    COUNT(s.id) as total_messages_sent,
    COUNT(CASE WHEN s.success THEN 1 END) as successful_messages,
    COUNT(CASE WHEN NOT s.success THEN 1 END) as failed_messages,
    COALESCE(AVG(mi.minutes_since_last), 0) as avg_minutes_between_messages,
    MAX(s.sent_at) as last_message_sent,
    (SELECT t2.name FROM twitch_bot_live_message_templates t2 
     WHERE t2.id = s.template_id LIMIT 1) as most_used_template
FROM twitch_bot_channels c
LEFT JOIN twitch_bot_live_message_stats s ON c.id = s.channel_id
LEFT JOIN message_intervals mi ON mi.channel_id = c.id
WHERE c.live_message_enabled = true
GROUP BY c.id, c.channel_name, c.guild_id, s.template_id
ORDER BY total_messages_sent DESC;

-- Function für automatische Template-Auswahl (mit korrektem Tabellennamen)
CREATE OR REPLACE FUNCTION get_random_twitch_bot_live_message_template(p_guild_id TEXT, p_category TEXT DEFAULT 'general')
RETURNS TABLE(id INTEGER, template TEXT, name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.template, t.name
    FROM twitch_bot_live_message_templates t
    WHERE t.guild_id = p_guild_id 
      AND t.enabled = true
      AND (p_category = 'any' OR t.category = p_category)
    ORDER BY RANDOM()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function für Template-Variable-Ersetzung
CREATE OR REPLACE FUNCTION replace_twitch_bot_live_message_variables(
    p_template TEXT,
    p_username TEXT DEFAULT '',
    p_game TEXT DEFAULT '',
    p_title TEXT DEFAULT '',
    p_viewers INTEGER DEFAULT 0,
    p_streamer TEXT DEFAULT ''
) RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    result := p_template;
    
    -- Variable ersetzungen
    result := REPLACE(result, '{{username}}', COALESCE(p_username, ''));
    result := REPLACE(result, '{{streamer}}', COALESCE(p_streamer, p_username, ''));
    result := REPLACE(result, '{{game}}', COALESCE(p_game, ''));
    result := REPLACE(result, '{{title}}', COALESCE(p_title, ''));
    result := REPLACE(result, '{{viewers}}', COALESCE(p_viewers::TEXT, '0'));
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update usage counter when template is used
CREATE OR REPLACE FUNCTION increment_twitch_bot_template_usage(p_template_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE twitch_bot_live_message_templates 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- Kommentare für Dokumentation
COMMENT ON TABLE twitch_bot_live_message_templates IS 'Vordefinierte Templates für automatische Live-Nachrichten vom Twitch Bot';
COMMENT ON TABLE twitch_bot_live_message_stats IS 'Statistiken über gesendete Live-Nachrichten vom Twitch Bot';
COMMENT ON VIEW twitch_bot_live_message_analytics IS 'Analytics für Live-Message Performance pro Channel vom Twitch Bot';

COMMENT ON COLUMN twitch_bot_channels.live_message_enabled IS 'Ob automatische Live-Nachrichten für diesen Channel aktiviert sind';
COMMENT ON COLUMN twitch_bot_channels.live_message_template IS 'Custom Template für Live-Nachrichten (wenn use_custom_live_message = true)';
COMMENT ON COLUMN twitch_bot_channels.use_custom_live_message IS 'Ob custom Template statt vordefinierte Templates verwendet werden sollen';
COMMENT ON COLUMN twitch_bot_channels.live_message_variables IS 'Welche Variablen im Template ersetzt werden sollen';

COMMENT ON COLUMN twitch_bot_settings.live_notifications_enabled IS 'Globale Aktivierung der Live-Nachricht Funktion';
COMMENT ON COLUMN twitch_bot_settings.live_message_cooldown IS 'Mindestabstand in Minuten zwischen automatischen Live-Nachrichten';

-- Erfolgsmeldung
SELECT 'Twitch Bot Live Message Settings Migration erfolgreich angewendet!' as status,
       'Tabellen: twitch_bot_live_message_templates, twitch_bot_live_message_stats' as created_tables,
       'Functions: get_random_twitch_bot_live_message_template(), replace_twitch_bot_live_message_variables(), increment_twitch_bot_template_usage()' as created_functions; 