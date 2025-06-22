-- ================================================================
-- 📁 ORDNER-MANAGEMENT MIGRATION - DEDICATED TABLE
-- ================================================================
-- 
-- Erstellt eine separate Tabelle NUR für Ordner-Management Settings
-- Kein Konflikt mit bestehenden welcome_settings
-- Einfache, dedizierte Struktur für maximale Zuverlässigkeit
--
-- ANWENDUNG:
-- 1. In Supabase SQL Editor kopieren  
-- 2. Ausführen
-- 3. Backend + Frontend Code deployen
-- ================================================================

-- 1. DEDICATED FOLDER SETTINGS TABLE
-- ================================================================

-- Drop falls vorhanden (Clean Start)
DROP TABLE IF EXISTS welcome_folder_settings CASCADE;

-- Neue dedizierte Tabelle für Ordner-Management
CREATE TABLE welcome_folder_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    folder_name VARCHAR(100),  -- NULL = "Alle Ordner", sonst spezifischer Ordner
    rotation_enabled BOOLEAN DEFAULT false,
    rotation_mode VARCHAR(20) DEFAULT 'random',  -- 'random' oder 'sequential'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. INDIZES FÜR PERFORMANCE
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_welcome_folder_settings_folder ON welcome_folder_settings(folder_name);
CREATE INDEX IF NOT EXISTS idx_welcome_folder_settings_enabled ON welcome_folder_settings(rotation_enabled);

-- 3. RLS POLICIES
-- ================================================================

ALTER TABLE welcome_folder_settings ENABLE ROW LEVEL SECURITY;

-- Public Access für Discord Bot
CREATE POLICY "Public read access for welcome_folder_settings"
ON welcome_folder_settings FOR SELECT
USING (true);

CREATE POLICY "Public write access for welcome_folder_settings"
ON welcome_folder_settings FOR ALL
USING (true);

-- 4. AUTO-UPDATE TRIGGER
-- ================================================================

-- Trigger für updated_at
CREATE TRIGGER update_welcome_folder_settings_updated_at
    BEFORE UPDATE ON welcome_folder_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. DEFAULT EINSTELLUNGEN
-- ================================================================

-- Standard-Einstellung: Rotation deaktiviert, alle Ordner
INSERT INTO welcome_folder_settings (
    folder_name, 
    rotation_enabled, 
    rotation_mode
) VALUES (
    NULL,     -- Alle Ordner (kein spezifischer Ordner)
    false,    -- Rotation zunächst deaktiviert
    'random'  -- Random Mode als Standard
);

-- 6. VALIDIERUNG
-- ================================================================

-- Prüfe dass Tabelle erstellt wurde
DO $$
DECLARE
    table_exists BOOLEAN;
    row_count INTEGER;
BEGIN
    -- Prüfe Tabelle
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'welcome_folder_settings'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ welcome_folder_settings Tabelle erfolgreich erstellt!';
        
        -- Prüfe Default-Eintrag
        SELECT COUNT(*) FROM welcome_folder_settings INTO row_count;
        
        IF row_count >= 1 THEN
            RAISE NOTICE '✅ Default-Einstellungen erstellt! (% Zeilen)', row_count;
        ELSE
            RAISE EXCEPTION '❌ Fehler: Default-Einstellungen nicht erstellt!';
        END IF;
    ELSE
        RAISE EXCEPTION '❌ Fehler: welcome_folder_settings Tabelle nicht erstellt!';
    END IF;
END $$;

-- 7. MIGRATION ABGESCHLOSSEN
-- ================================================================

COMMENT ON TABLE welcome_folder_settings IS 'Dedizierte Tabelle für Welcome System Ordner-Management Settings';
COMMENT ON COLUMN welcome_folder_settings.folder_name IS 'NULL = Alle Ordner, sonst spezifischer Ordnername (valorant, minecraft, etc.)';
COMMENT ON COLUMN welcome_folder_settings.rotation_enabled IS 'Ob Bild-Rotation aktiviert ist';
COMMENT ON COLUMN welcome_folder_settings.rotation_mode IS 'Rotation Modus: random oder sequential';

-- Erfolgs-Message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ORDNER-MANAGEMENT MIGRATION ERFOLGREICH!';
    RAISE NOTICE '📁 Tabelle: welcome_folder_settings';
    RAISE NOTICE '🔐 RLS aktiviert';
    RAISE NOTICE '⚡ Performance-Indizes erstellt';
    RAISE NOTICE '🎯 Default-Einstellungen gesetzt';
    RAISE NOTICE '🚀 Bereit für Backend-Integration!';
    RAISE NOTICE '';
END $$; 