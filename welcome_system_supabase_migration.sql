-- =====================================
-- WELCOME SYSTEM SUPABASE MIGRATION
-- =====================================
-- Erstellt alle nötigen Tabellen für das Welcome System
-- Ausführen in der Supabase SQL Editor

-- 1. Welcome Settings Tabelle
CREATE TABLE IF NOT EXISTS welcome_settings (
    id BIGSERIAL PRIMARY KEY,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_welcome_settings_updated_at ON welcome_settings(updated_at);

-- 2. Welcome Images Tabelle
CREATE TABLE IF NOT EXISTS welcome_images (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    folder VARCHAR(100) NOT NULL DEFAULT 'general',
    size BIGINT DEFAULT 0,
    original_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eindeutiger Index für filename + folder Kombination
CREATE UNIQUE INDEX IF NOT EXISTS idx_welcome_images_filename_folder 
ON welcome_images(filename, folder);

-- Index für Ordner-basierte Abfragen
CREATE INDEX IF NOT EXISTS idx_welcome_images_folder ON welcome_images(folder);

-- Index für zeitbasierte Sortierung
CREATE INDEX IF NOT EXISTS idx_welcome_images_created_at ON welcome_images(created_at DESC);

-- 3. Welcome Folders Tabelle
CREATE TABLE IF NOT EXISTS welcome_folders (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für Namen-basierte Abfragen
CREATE INDEX IF NOT EXISTS idx_welcome_folders_name ON welcome_folders(name);

-- 4. Trigger für automatische updated_at Aktualisierung
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
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger für welcome_images
DROP TRIGGER IF EXISTS update_welcome_images_updated_at ON welcome_images;
CREATE TRIGGER update_welcome_images_updated_at
    BEFORE UPDATE ON welcome_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger für welcome_folders
DROP TRIGGER IF EXISTS update_welcome_folders_updated_at ON welcome_folders;
CREATE TRIGGER update_welcome_folders_updated_at
    BEFORE UPDATE ON welcome_folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Standard-Ordner erstellen  
INSERT INTO welcome_folders (name) VALUES 
    ('general'),
    ('valorant'),
    ('minecraft'),
    ('gaming'),
    ('anime'),
    ('memes'),
    ('seasonal')
ON CONFLICT (name) DO NOTHING;

-- 6. Standard Welcome-Einstellungen erstellen
INSERT INTO welcome_settings (config) VALUES ('{
  "enabled": true,
  "channelName": "willkommen",
  "title": "🎉 Willkommen auf dem Server!",
  "description": "Hey **{user}**! Schön dass du zu **{server}** gefunden hast! 🎊",
  "color": "0x00FF7F",
  "thumbnail": "user",
  "customThumbnail": "",
  "imageRotation": {
    "enabled": false,
    "mode": "random"
  },
  "fields": [
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
  ],
  "footer": "Mitglied #{memberCount} • {server}",
  "autoRole": "",
  "mentionUser": true,
  "deleteAfter": 0,
  "dmMessage": {
    "enabled": false,
    "message": "Willkommen! Schau gerne im Server vorbei! 😊"
  },
  "leaveMessage": {
    "enabled": false,
    "channelName": "verlassen",
    "title": "👋 Tschüss!",
    "description": "**{user}** hat den Server verlassen. Auf Wiedersehen! 😢",
    "color": "0xFF6B6B",
    "mentionUser": false,
    "deleteAfter": 0
  }
}'::jsonb) ON CONFLICT DO NOTHING;

-- 7. RLS (Row Level Security) aktivieren - optional für mehr Sicherheit
-- ALTER TABLE welcome_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE welcome_images ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE welcome_folders ENABLE ROW LEVEL SECURITY;

-- 8. Policies für RLS - falls aktiviert
-- CREATE POLICY "Enable all operations for authenticated users" ON welcome_settings
--     FOR ALL TO authenticated USING (true);

-- CREATE POLICY "Enable all operations for authenticated users" ON welcome_images
--     FOR ALL TO authenticated USING (true);

-- CREATE POLICY "Enable all operations for authenticated users" ON welcome_folders
--     FOR ALL TO authenticated USING (true);

-- =====================================
-- MIGRATION KOMPLETT
-- =====================================

-- Tabellen Übersicht:
-- 1. welcome_settings: Speichert alle Welcome-Konfigurationen als JSONB
-- 2. welcome_images: Verwaltet hochgeladene Willkommensbilder mit Ordner-Support
-- 3. welcome_folders: Verwaltet Ordner für die Bild-Organisation

-- Features:
-- ✅ Automatische Timestamps (created_at, updated_at)
-- ✅ Unique Constraints für Bilder (filename + folder)
-- ✅ Indizes für Performance
-- ✅ Trigger für automatische updated_at Aktualisierung
-- ✅ Standard 'general' Ordner
-- ✅ JSONB für flexible Konfiguration
-- ✅ Vorbereitet für RLS (Row Level Security)

COMMENT ON TABLE welcome_settings IS 'Speichert Welcome System Konfigurationen als JSONB';
COMMENT ON TABLE welcome_images IS 'Verwaltet hochgeladene Willkommensbilder mit Ordner-Support';
COMMENT ON TABLE welcome_folders IS 'Verwaltet Ordner für Bild-Organisation';

-- Ende der Migration
SELECT 'Welcome System Tabellen erfolgreich erstellt! 🎉' as migration_status; 