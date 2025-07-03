-- =============================================
-- TWITCH SYSTEM CLEANUP & RESTORE
-- Entfernt falsche Migration und stellt korrekte wieder her
-- =============================================

-- STEP 1: KOMPLETTE BEREINIGUNG
-- =============================================

-- Drop alle Views und Functions
DROP VIEW IF EXISTS twitch_bot_active_channels CASCADE;
DROP VIEW IF EXISTS twitch_bot_stats_summary CASCADE;
DROP VIEW IF EXISTS twitch_monitored_streamers_status CASCADE;
DROP FUNCTION IF EXISTS update_twitch_bot_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_twitch_bot_events(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS increment_command_usage(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_twitch_bot_daily_stats(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) CASCADE;

-- Drop ALLE falschen Twitch Tabellen
DROP TABLE IF EXISTS twitch_bot_stats CASCADE;
DROP TABLE IF EXISTS twitch_bot_events CASCADE;
DROP TABLE IF EXISTS twitch_bot_commands CASCADE;
DROP TABLE IF EXISTS twitch_bot_moderation CASCADE;
DROP TABLE IF EXISTS twitch_bot_channels CASCADE;
DROP TABLE IF EXISTS twitch_monitored_streamers CASCADE;
DROP TABLE IF EXISTS twitch_live_notifications CASCADE;
DROP TABLE IF EXISTS twitch_bot_settings CASCADE;
DROP TABLE IF EXISTS twitch_bot_stream_events CASCADE;

-- STEP 2: ERFOLGSMELDUNG CLEANUP
-- =============================================
SELECT 'TWITCH TABELLEN BEREINIGT!' as status,
       'Alle falschen Tabellen wurden entfernt' as info,
       'Jetzt twitch_system_supabase_migration.sql manuell ausführen' as next_step; 