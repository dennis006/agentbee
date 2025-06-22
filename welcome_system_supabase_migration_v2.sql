-- ====================================================================
-- WELCOME SYSTEM SUPABASE MIGRATION V2.0 (FIXED)
-- ====================================================================
-- 
-- Dieses Script führt eine sichere Migration des Welcome Systems durch:
-- - Erstellt welcome_settings Tabelle (IF NOT EXISTS)
-- - Erstellt welcome_images Tabelle für Bildverwaltung
-- - Erstellt welcome_folders Tabelle für Ordnerstruktur
-- - Setzt korrekte RLS-Policies und Permissions
-- - Kann sicher mehrfach ausgeführt werden
--
-- ANWENDUNG:
-- 1. In Supabase SQL Editor kopieren
-- 2. Komplett ausführen
-- 3. Bot neu starten
-- ====================================================================

-- 1. ALTE STRUKTUREN ENTFERNEN
-- ====================================================================

-- Drop alte Tabellen falls vorhanden (ignore errors wenn nicht existiert)
DROP TABLE IF EXISTS welcome_settings CASCADE;
DROP TABLE IF EXISTS welcome_images CASCADE;
DROP TABLE IF EXISTS welcome_folders CASCADE;

-- Alte Functions/Triggers entfernen falls vorhanden
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 2. NEUE OPTIMIERTE STRUKTUREN ERSTELLEN
-- ====================================================================

-- Welcome Settings Haupttabelle (Single Row Design)
CREATE TABLE IF NOT EXISTS welcome_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Welcome Images Tabelle
CREATE TABLE IF NOT EXISTS welcome_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    url TEXT NOT NULL,
    folder VARCHAR(100) DEFAULT 'general',
    size BIGINT DEFAULT 0,
    mime_type VARCHAR(100),
    github_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Welcome Folders Tabelle
CREATE TABLE IF NOT EXISTS welcome_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INDIZES FÜR PERFORMANCE
-- ====================================================================

-- Welcome Images Indizes
CREATE INDEX IF NOT EXISTS idx_welcome_images_folder ON welcome_images(folder);
CREATE INDEX IF NOT EXISTS idx_welcome_images_filename ON welcome_images(filename);
CREATE INDEX IF NOT EXISTS idx_welcome_images_created_at ON welcome_images(created_at DESC);

-- Welcome Folders Indizes
CREATE INDEX IF NOT EXISTS idx_welcome_folders_name ON welcome_folders(name);

-- 4. RLS (ROW LEVEL SECURITY) POLICIES
-- ====================================================================

-- Welcome Settings Policies (Public Access - da Discord Bot)
ALTER TABLE welcome_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for welcome_settings" ON welcome_settings;
DROP POLICY IF EXISTS "Public write access for welcome_settings" ON welcome_settings;

CREATE POLICY "Public read access for welcome_settings"
ON welcome_settings FOR SELECT
USING (true);

CREATE POLICY "Public write access for welcome_settings"
ON welcome_settings FOR ALL
USING (true);

-- Welcome Images Policies
ALTER TABLE welcome_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for welcome_images" ON welcome_images;
DROP POLICY IF EXISTS "Public write access for welcome_images" ON welcome_images;

CREATE POLICY "Public read access for welcome_images"
ON welcome_images FOR SELECT
USING (true);

CREATE POLICY "Public write access for welcome_images"
ON welcome_images FOR ALL
USING (true);

-- Welcome Folders Policies
ALTER TABLE welcome_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for welcome_folders" ON welcome_folders;
DROP POLICY IF EXISTS "Public write access for welcome_folders" ON welcome_folders;

CREATE POLICY "Public read access for welcome_folders"
ON welcome_folders FOR SELECT
USING (true);

CREATE POLICY "Public write access for welcome_folders"
ON welcome_folders FOR ALL
USING (true);

-- 5. TRIGGER FÜR AUTO-UPDATE TIMESTAMPS
-- ====================================================================

-- Function für updated_at auto-update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für welcome_settings
DROP TRIGGER IF EXISTS update_welcome_settings_updated_at ON welcome_settings;
CREATE TRIGGER update_welcome_settings_updated_at
    BEFORE UPDATE ON welcome_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für welcome_images
DROP TRIGGER IF EXISTS update_welcome_images_updated_at ON welcome_images;
CREATE TRIGGER update_welcome_images_updated_at
    BEFORE UPDATE ON welcome_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für welcome_folders
DROP TRIGGER IF EXISTS update_welcome_folders_updated_at ON welcome_folders;
CREATE TRIGGER update_welcome_folders_updated_at
    BEFORE UPDATE ON welcome_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. DEFAULT ORDNER ERSTELLEN
-- ====================================================================

-- Standard Welcome Ordner erstellen
INSERT INTO welcome_folders (name, description) VALUES
('general', 'Allgemeine Welcome Bilder'),
('valorant', 'Valorant-themed Welcome Bilder'),
('minecraft', 'Minecraft-themed Welcome Bilder'),
('gaming', 'Gaming-themed Welcome Bilder'),
('anime', 'Anime-themed Welcome Bilder'),
('memes', 'Lustige Meme Welcome Bilder'),
('seasonal', 'Saisonale Welcome Bilder (Weihnachten, Halloween, etc.)')
ON CONFLICT (name) DO NOTHING;

-- 7. VALIDIERUNG & CLEANUP
-- ====================================================================

-- Verifiziere dass alle Tabellen erstellt wurden
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('welcome_settings', 'welcome_images', 'welcome_folders');
    
    IF table_count = 3 THEN
        RAISE NOTICE '✅ Alle 3 Welcome System Tabellen erfolgreich erstellt!';
    ELSE
        RAISE EXCEPTION '❌ Fehler: Nicht alle Tabellen wurden erstellt. Erwartete: 3, Gefunden: %', table_count;
    END IF;
END $$;

-- Verifiziere dass Default-Ordner erstellt wurden
DO $$
DECLARE
    folder_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO folder_count FROM welcome_folders;
    
    IF folder_count >= 7 THEN
        RAISE NOTICE '✅ % Default-Ordner erfolgreich erstellt!', folder_count;
    ELSE
        RAISE EXCEPTION '❌ Fehler: Nicht alle Default-Ordner wurden erstellt. Erwartet: 7, Gefunden: %', folder_count;
    END IF;
END $$;

-- 8. MIGRATION ABGESCHLOSSEN
-- ====================================================================

-- Erfolgreiche Migration loggen
INSERT INTO welcome_folders (name, description) VALUES 
('_migration_log', 'Migration V2.0 completed at ' || NOW())
ON CONFLICT (name) DO UPDATE SET description = 'Migration V2.0 completed at ' || NOW();

-- Final Success Message
DO $$
BEGIN
    RAISE NOTICE '🎉 WELCOME SYSTEM MIGRATION V2.0 ERFOLGREICH ABGESCHLOSSEN!';
    RAISE NOTICE '📋 Erstellt: welcome_settings, welcome_images, welcome_folders';
    RAISE NOTICE '🔐 RLS Policies aktiviert';
    RAISE NOTICE '⚡ Performance Indizes erstellt';
    RAISE NOTICE '📁 7 Standard-Ordner erstellt';
    RAISE NOTICE '🚀 Bot kann jetzt neu gestartet werden!';
END $$; 