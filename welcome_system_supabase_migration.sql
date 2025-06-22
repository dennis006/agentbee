-- ===========================================
-- DISCORD BOT - WELCOME SYSTEM SUPABASE MIGRATION (STORAGE VERSION)
-- ===========================================
-- Version: 2.0 (Storage-Only)
-- Erstellt: Januar 2025
-- Beschreibung: Vollständige Migration des Welcome Systems zu Supabase mit Storage

-- 1. SUPABASE STORAGE BUCKET ERSTELLEN
-- ===========================================

-- Erstelle Storage Bucket für Welcome Images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'welcome-images',
    'welcome-images',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies für Welcome Images
CREATE POLICY "Welcome images sind öffentlich lesbar"
ON storage.objects FOR SELECT
USING (bucket_id = 'welcome-images');

CREATE POLICY "Nur Admins können Welcome images hochladen"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'welcome-images' AND auth.role() = 'service_role');

CREATE POLICY "Nur Admins können Welcome images löschen"
ON storage.objects FOR DELETE
USING (bucket_id = 'welcome-images' AND auth.role() = 'service_role');

-- 2. HAUPTTABELLEN ERSTELLEN
-- ===========================================

-- Welcome Settings Tabelle
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
    fields JSONB DEFAULT '[
        {"name": "📋 Erste Schritte", "value": "Schaue dir unsere Regeln an und werde Teil der Community!", "inline": false},
        {"name": "💬 Support", "value": "Bei Fragen wende dich an unsere Moderatoren!", "inline": true},
        {"name": "🎮 Viel Spaß", "value": "Wir freuen uns auf dich!", "inline": true}
    ]'::jsonb,
    footer TEXT DEFAULT 'Mitglied #{memberCount} • {server}',
    auto_role TEXT DEFAULT '',
    mention_user BOOLEAN DEFAULT true,
    delete_after INTEGER DEFAULT 0,
    dm_message JSONB DEFAULT '{"enabled": false, "message": "Willkommen! Schau gerne im Server vorbei! 😊"}'::jsonb,
    leave_message JSONB DEFAULT '{"enabled": false, "channelName": "verlassen", "title": "👋 Tschüss!", "description": "**{user}** hat den Server verlassen. Auf Wiedersehen! 😢", "color": "0xFF6B6B", "mentionUser": false, "deleteAfter": 0}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Welcome Images Tabelle (für Storage Metadata)
CREATE TABLE IF NOT EXISTS welcome_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    folder_name TEXT DEFAULT 'general',
    storage_path TEXT NOT NULL UNIQUE, -- Pfad in Supabase Storage
    storage_url TEXT NOT NULL,         -- Öffentliche URL aus Storage
    file_size BIGINT DEFAULT 0,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Welcome Folders Tabelle
CREATE TABLE IF NOT EXISTS welcome_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    folder_name TEXT NOT NULL,
    display_name TEXT,
    description TEXT,
    emoji TEXT DEFAULT '📁',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id, folder_name)
);

-- Welcome Statistiken Tabelle
CREATE TABLE IF NOT EXISTS welcome_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    date DATE NOT NULL,
    welcome_count INTEGER DEFAULT 0,
    leave_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id, date)
);

-- 3. INDIZES FÜR PERFORMANCE
-- ===========================================

-- Welcome Settings Indizes
CREATE INDEX IF NOT EXISTS idx_welcome_settings_guild_id ON welcome_settings(guild_id);

-- Welcome Images Indizes
CREATE INDEX IF NOT EXISTS idx_welcome_images_guild_id ON welcome_images(guild_id);
CREATE INDEX IF NOT EXISTS idx_welcome_images_folder ON welcome_images(guild_id, folder_name);
CREATE INDEX IF NOT EXISTS idx_welcome_images_storage_path ON welcome_images(storage_path);

-- Welcome Folders Indizes
CREATE INDEX IF NOT EXISTS idx_welcome_folders_guild_id ON welcome_folders(guild_id);
CREATE INDEX IF NOT EXISTS idx_welcome_folders_name ON welcome_folders(guild_id, folder_name);

-- Welcome Stats Indizes
CREATE INDEX IF NOT EXISTS idx_welcome_stats_guild_date ON welcome_stats(guild_id, date);
CREATE INDEX IF NOT EXISTS idx_welcome_stats_date ON welcome_stats(date);

-- 4. ROW LEVEL SECURITY (RLS)
-- ===========================================

-- RLS aktivieren
ALTER TABLE welcome_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_stats ENABLE ROW LEVEL SECURITY;

-- Service Role Policies (für Discord Bot)
CREATE POLICY "service_role_welcome_settings" ON welcome_settings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_welcome_images" ON welcome_images
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_welcome_folders" ON welcome_folders
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_welcome_stats" ON welcome_stats
    FOR ALL USING (auth.role() = 'service_role');

-- 5. TRIGGER FÜR AUTOMATISCHE TIMESTAMPS
-- ===========================================

-- Updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für alle Tabellen
CREATE TRIGGER update_welcome_settings_updated_at
    BEFORE UPDATE ON welcome_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_welcome_images_updated_at
    BEFORE UPDATE ON welcome_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_welcome_folders_updated_at
    BEFORE UPDATE ON welcome_folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_welcome_stats_updated_at
    BEFORE UPDATE ON welcome_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. STANDARDDATEN EINFÜGEN
-- ===========================================

-- Standard Guild ID (falls vorhanden)
DO $$
DECLARE
    guild_id_default TEXT := '1203994020779532348';
BEGIN
    -- Standard Welcome Settings
    INSERT INTO welcome_settings (guild_id) 
    VALUES (guild_id_default)
    ON CONFLICT (guild_id) DO NOTHING;

    -- Standard Folder (basierend auf deinen GitHub Ordnern)
    INSERT INTO welcome_folders (guild_id, folder_name, display_name, description, emoji) VALUES
    (guild_id_default, 'general', 'Allgemein', 'Allgemeine Welcome Bilder', '📁'),
    (guild_id_default, 'valorant', 'Valorant', 'Valorant-themed Welcome Bilder', '🎯'),
    (guild_id_default, 'minecraft', 'Minecraft', 'Minecraft-themed Welcome Bilder', '⛏️'),
    (guild_id_default, 'beellgrounds', 'Beellgrounds', 'Beellgrounds-themed Welcome Bilder', '🐝'),
    (guild_id_default, 'gaming', 'Gaming', 'Gaming-themed Welcome Bilder', '🎮'),
    (guild_id_default, 'anime', 'Anime', 'Anime-themed Welcome Bilder', '🎌'),
    (guild_id_default, 'memes', 'Memes', 'Lustige Meme Welcome Bilder', '😂'),
    (guild_id_default, 'seasonal', 'Seasonal', 'Saisonale Welcome Bilder', '🎄')
    ON CONFLICT (guild_id, folder_name) DO NOTHING;

    -- Initial Stats Eintrag
    INSERT INTO welcome_stats (guild_id, date)
    VALUES (guild_id_default, CURRENT_DATE)
    ON CONFLICT (guild_id, date) DO NOTHING;

END $$;

-- 7. FUNKTIONEN FÜR DATENBEREINIGUNG
-- ===========================================

-- Funktion zum Löschen alter Statistiken (älter als 1 Jahr)
CREATE OR REPLACE FUNCTION cleanup_old_welcome_stats()
RETURNS void AS $$
BEGIN
    DELETE FROM welcome_stats 
    WHERE date < CURRENT_DATE - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Funktion zum Bereinigen verwaister Images (ohne Datei in Storage)
CREATE OR REPLACE FUNCTION cleanup_orphaned_welcome_images()
RETURNS void AS $$
BEGIN
    -- Diese Funktion kann erweitert werden um mit Storage zu synchronisieren
    -- Für jetzt nur ein Platzhalter
    NULL;
END;
$$ LANGUAGE plpgsql;

-- 8. VIEWS FÜR ANALYTICS
-- ===========================================

-- View für Welcome Statistiken pro Monat
CREATE OR REPLACE VIEW welcome_monthly_stats AS
SELECT 
    guild_id,
    DATE_TRUNC('month', date) as month,
    SUM(welcome_count) as total_welcomes,
    SUM(leave_count) as total_leaves,
    COUNT(DISTINCT date) as active_days
FROM welcome_stats
GROUP BY guild_id, DATE_TRUNC('month', date)
ORDER BY guild_id, month DESC;

-- View für Image Statistiken pro Folder
CREATE OR REPLACE VIEW welcome_folder_stats AS
SELECT 
    wi.guild_id,
    wi.folder_name,
    wf.display_name,
    wf.emoji,
    COUNT(wi.id) as image_count,
    SUM(wi.file_size) as total_size_bytes,
    MAX(wi.created_at) as last_upload
FROM welcome_images wi
LEFT JOIN welcome_folders wf ON wi.guild_id = wf.guild_id AND wi.folder_name = wf.folder_name
GROUP BY wi.guild_id, wi.folder_name, wf.display_name, wf.emoji
ORDER BY wi.guild_id, wi.folder_name;

-- 9. KOMMENTARE FÜR DOKUMENTATION
-- ===========================================

COMMENT ON TABLE welcome_settings IS 'Willkommensnachrichten Konfiguration pro Guild';
COMMENT ON TABLE welcome_images IS 'Metadata für Bilder in Supabase Storage';
COMMENT ON TABLE welcome_folders IS 'Ordner-Organisation für Welcome Bilder';
COMMENT ON TABLE welcome_stats IS 'Analytics für Willkommensnachrichten-System';

COMMENT ON COLUMN welcome_images.storage_path IS 'Pfad in Supabase Storage Bucket';
COMMENT ON COLUMN welcome_images.storage_url IS 'Öffentliche URL aus Supabase Storage';
COMMENT ON COLUMN welcome_folders.emoji IS 'Emoji für UI-Darstellung des Ordners';

-- ===========================================
-- MIGRATION ERFOLGREICH ABGESCHLOSSEN! ✅
-- ===========================================

-- Logs und Bestätigung
DO $$
BEGIN
    RAISE NOTICE '🎉 Welcome System Supabase Migration (Storage Version) erfolgreich abgeschlossen!';
    RAISE NOTICE '📊 Tabellen erstellt: welcome_settings, welcome_images, welcome_folders, welcome_stats';
    RAISE NOTICE '🪣 Storage Bucket erstellt: welcome-images';
    RAISE NOTICE '🔒 RLS Policies aktiviert für alle Tabellen';
    RAISE NOTICE '⚡ Indizes für optimale Performance erstellt';
    RAISE NOTICE '📈 Analytics Views verfügbar: welcome_monthly_stats, welcome_folder_stats';
    RAISE NOTICE '🧹 Cleanup Funktionen bereit für Wartung';
    RAISE NOTICE '';
    RAISE NOTICE 'Migration Version: 2.0 (Storage-Only)';
    RAISE NOTICE 'Timestamp: %', NOW();
END $$; 