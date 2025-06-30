-- Crosshair Interactive Panel System Migration
-- Adds Interactive Panel support to crosshair_settings table
-- Compatible with existing Discord Panel systems (Verify, Music, etc.)

-- Add Interactive Panel columns to crosshair_settings
ALTER TABLE crosshair_settings 
ADD COLUMN IF NOT EXISTS panel_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS panel_channel_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS panel_channel_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS panel_message_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS panel_embed_color VARCHAR(7) DEFAULT '#00D4AA';

-- Add comments for documentation
COMMENT ON COLUMN crosshair_settings.panel_enabled IS 'Enable/disable Interactive Panel for this guild';
COMMENT ON COLUMN crosshair_settings.panel_channel_id IS 'Discord channel ID where the interactive panel is posted';
COMMENT ON COLUMN crosshair_settings.panel_channel_name IS 'Human-readable name of the panel channel';
COMMENT ON COLUMN crosshair_settings.panel_message_id IS 'Discord message ID of the interactive panel (for updates)';
COMMENT ON COLUMN crosshair_settings.panel_embed_color IS 'Hex color for the panel embed (default AgentBee green)';

-- Add index for panel queries
CREATE INDEX IF NOT EXISTS idx_crosshair_settings_panel_enabled ON crosshair_settings(panel_enabled);
CREATE INDEX IF NOT EXISTS idx_crosshair_settings_panel_message_id ON crosshair_settings(panel_message_id);

-- Update existing records with default values
UPDATE crosshair_settings 
SET 
    panel_enabled = FALSE,
    panel_embed_color = '#00D4AA'
WHERE 
    panel_enabled IS NULL 
    OR panel_embed_color IS NULL;

-- Verify the migration
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_guilds,
    COUNT(CASE WHEN panel_enabled = TRUE THEN 1 END) as panels_enabled,
    COUNT(CASE WHEN panel_message_id IS NOT NULL THEN 1 END) as active_panels
FROM crosshair_settings;

-- Display current schema for verification
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'crosshair_settings' 
    AND column_name LIKE '%panel%'
ORDER BY ordinal_position; 