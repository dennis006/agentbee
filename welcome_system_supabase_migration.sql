-- ==============================================
-- WELCOME SYSTEM MIGRATION - SUPABASE
-- ==============================================

-- 1. Welcome Settings Tabelle
CREATE TABLE IF NOT EXISTS welcome_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT true,
    channel_name TEXT DEFAULT 'willkommen',
    title TEXT DEFAULT '🎉 Willkommen auf dem Server!',
    description TEXT DEFAULT 'Hey **{user}**! Schön dass du zu **{server}** gefunden hast! 🎊',
    color TEXT DEFAULT '0x00FF7F',
    custom_thumbnail TEXT DEFAULT '',
    image_rotation JSONB DEFAULT '{"enabled": false, "mode": "random", "folder": null}'::jsonb,
    fields JSONB DEFAULT '[]'::jsonb,
    footer TEXT DEFAULT 'Mitglied #{memberCount} • {server}',
    auto_role TEXT DEFAULT '',
    mention_user BOOLEAN DEFAULT true,
    delete_after INTEGER DEFAULT 0,
    dm_message JSONB DEFAULT '{"enabled": false, "message": "Willkommen! Schau gerne im Server vorbei! 😊"}'::jsonb,
    leave_message JSONB DEFAULT '{"enabled": false, "channelName": "verlassen", "title": "👋 Tschüss!", "description": "**{user}** hat den Server verlassen. Auf Wiedersehen! 😢", "color": "0xFF6B6B", "mentionUser": false, "deleteAfter": 0}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index für Guild ID
CREATE INDEX IF NOT EXISTS idx_welcome_settings_guild_id ON welcome_settings(guild_id);

-- 2. Welcome Images Tabelle
CREATE TABLE IF NOT EXISTS welcome_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    folder_name TEXT DEFAULT 'general',
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    url TEXT NOT NULL,
    github_path TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(guild_id, folder_name, filename)
);

-- Index für Guild ID und Ordner
CREATE INDEX IF NOT EXISTS idx_welcome_images_guild_folder ON welcome_images(guild_id, folder_name);
CREATE INDEX IF NOT EXISTS idx_welcome_images_guild_id ON welcome_images(guild_id);

-- 3. Welcome Folders Tabelle
CREATE TABLE IF NOT EXISTS welcome_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    folder_name TEXT NOT NULL,
    display_name TEXT,
    emoji TEXT DEFAULT '🎮',
    github_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(guild_id, folder_name)
);

-- Index für Guild ID
CREATE INDEX IF NOT EXISTS idx_welcome_folders_guild_id ON welcome_folders(guild_id);

-- 4. Welcome Stats Tabelle (für Analytics)
CREATE TABLE IF NOT EXISTS welcome_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    welcome_messages_sent INTEGER DEFAULT 0,
    leave_messages_sent INTEGER DEFAULT 0,
    dm_messages_sent INTEGER DEFAULT 0,
    auto_roles_assigned INTEGER DEFAULT 0,
    images_used JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(guild_id, date)
);

-- Index für Stats
CREATE INDEX IF NOT EXISTS idx_welcome_stats_guild_date ON welcome_stats(guild_id, date);

-- 5. GitHub Storage Settings Tabelle
CREATE TABLE IF NOT EXISTS github_storage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    github_token TEXT,
    repository_owner TEXT,
    repository_name TEXT,
    base_path TEXT DEFAULT 'welcome-images',
    auto_create_folders BOOLEAN DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    total_files INTEGER DEFAULT 0,
    total_size_mb DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- 6. RLS (Row Level Security) Policies
ALTER TABLE welcome_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_storage ENABLE ROW LEVEL SECURITY;

-- Policy für welcome_settings - nur Lesen erlaubt
CREATE POLICY "Public read access for welcome_settings" ON welcome_settings FOR SELECT USING (true);
CREATE POLICY "Service role access for welcome_settings" ON welcome_settings FOR ALL USING (auth.role() = 'service_role');

-- Policy für welcome_images - nur Lesen erlaubt
CREATE POLICY "Public read access for welcome_images" ON welcome_images FOR SELECT USING (true);
CREATE POLICY "Service role access for welcome_images" ON welcome_images FOR ALL USING (auth.role() = 'service_role');

-- Policy für welcome_folders - nur Lesen erlaubt
CREATE POLICY "Public read access for welcome_folders" ON welcome_folders FOR SELECT USING (true);
CREATE POLICY "Service role access for welcome_folders" ON welcome_folders FOR ALL USING (auth.role() = 'service_role');

-- Policy für welcome_stats - nur Service Role
CREATE POLICY "Service role access for welcome_stats" ON welcome_stats FOR ALL USING (auth.role() = 'service_role');

-- Policy für github_storage - nur Service Role
CREATE POLICY "Service role access for github_storage" ON github_storage FOR ALL USING (auth.role() = 'service_role');

-- 7. Functions für automatische Timestamp Updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für updated_at
CREATE TRIGGER update_welcome_settings_updated_at BEFORE UPDATE ON welcome_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_welcome_stats_updated_at BEFORE UPDATE ON welcome_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_github_storage_updated_at BEFORE UPDATE ON github_storage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Standard-Einstellungen für Default Guild
INSERT INTO welcome_settings (
    guild_id,
    enabled,
    channel_name,
    title,
    description,
    color,
    fields,
    footer,
    mention_user,
    delete_after,
    dm_message,
    leave_message
) VALUES (
    '1203994020779532348', -- Default Guild ID
    true,
    'willkommen',
    '🎉 Willkommen auf dem Server!',
    'Hey **{user}**! Schön dass du zu **{server}** gefunden hast! 🎊',
    '0x00FF7F',
    '[
        {
            "name": "📋 Erste Schritte",
            "value": "Schaue dir unsere Regeln an und werde Teil der Community!",
            "inline": false
        },
        {
            "name": "💬 Support", 
            "value": "Bei Fragen wende dich an unsere Moderatoren!",
            "inline": true
        },
        {
            "name": "🎮 Viel Spaß",
            "value": "Wir freuen uns auf dich!",
            "inline": true
        }
    ]'::jsonb,
    'Mitglied #{memberCount} • {server}',
    true,
    0,
    '{"enabled": false, "message": "Willkommen! Schau gerne im Server vorbei! 😊"}'::jsonb,
    '{"enabled": false, "channelName": "verlassen", "title": "👋 Tschüss!", "description": "**{user}** hat den Server verlassen. Auf Wiedersehen! 😢", "color": "0xFF6B6B", "mentionUser": false, "deleteAfter": 0}'::jsonb
) ON CONFLICT (guild_id) DO NOTHING;

-- 9. Standard Ordner erstellen
INSERT INTO welcome_folders (guild_id, folder_name, display_name, emoji) VALUES
    ('1203994020779532348', 'general', 'Allgemein', '📂'),
    ('1203994020779532348', 'valorant', 'Valorant', '🎯'),
    ('1203994020779532348', 'minecraft', 'Minecraft', '⛏️'),
    ('1203994020779532348', 'beellgrounds', 'Beellgrounds', '🐝'),
    ('1203994020779532348', 'events', 'Events', '🎉'),
    ('1203994020779532348', 'seasonal', 'Seasonal', '🌟')
ON CONFLICT (guild_id, folder_name) DO NOTHING;

-- 10. Views für bessere Datenabfrage
CREATE OR REPLACE VIEW welcome_overview AS
SELECT 
    ws.guild_id,
    ws.enabled,
    ws.channel_name,
    COUNT(wi.id) as total_images,
    COUNT(DISTINCT wi.folder_name) as total_folders,
    ws.updated_at as last_settings_update
FROM welcome_settings ws
LEFT JOIN welcome_images wi ON ws.guild_id = wi.guild_id
GROUP BY ws.guild_id, ws.enabled, ws.channel_name, ws.updated_at;

-- Grant permissions für Views
GRANT SELECT ON welcome_overview TO anon, authenticated, service_role;

-- 11. Cleanup alte JSON Dateien (Info für später)
-- Die folgenden Dateien können nach Migration gelöscht werden:
-- - welcome.json
-- - Bilder von ./dashboard/public/images/welcome/* (werden nach GitHub migriert)

COMMENT ON TABLE welcome_settings IS 'Speichert alle Willkommensnachrichten-Einstellungen pro Guild';
COMMENT ON TABLE welcome_images IS 'Speichert Metadaten aller hochgeladenen Willkommensbilder';
COMMENT ON TABLE welcome_folders IS 'Verwaltet Ordnerstruktur für Willkommensbilder';
COMMENT ON TABLE welcome_stats IS 'Analytics für Willkommensnachrichten-System';
COMMENT ON TABLE github_storage IS 'GitHub Repository Einstellungen für Bildspeicherung'; 