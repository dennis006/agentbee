-- ================================================================
-- 🎮 LFG SYSTEM - AUTO VOICE JOIN UPDATE
-- ================================================================
-- Fügt das neue enable_auto_voice_join Feld zur lfg_settings Tabelle hinzu
-- Created: 2025-01-29

-- Füge das neue Feld zur lfg_settings Tabelle hinzu
ALTER TABLE lfg_settings 
ADD COLUMN IF NOT EXISTS enable_auto_voice_join BOOLEAN DEFAULT true;

-- Kommentar für bessere Dokumentation
COMMENT ON COLUMN lfg_settings.enable_auto_voice_join IS 'Neue Spieler automatisch zu Owner Voice Channel verschieben wenn Owner bereits in Voice Channel ist';

-- Update bestehende Einträge (falls vorhanden) auf true setzen
UPDATE lfg_settings 
SET enable_auto_voice_join = true 
WHERE enable_auto_voice_join IS NULL;

-- Bestätige das Update
SELECT 
    table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lfg_settings' 
AND column_name = 'enable_auto_voice_join';

-- Zeige Beispiel-Konfiguration
SELECT 
    guild_id,
    enabled,
    enable_buttons,
    enable_voice_creation,
    enable_auto_voice_join,
    enable_dm_notifications
FROM lfg_settings 
LIMIT 5; 