-- =============================================
-- TWITCH SYSTEM FINAL CLEANUP
-- Entfernt alle überflüssigen Tabellen und behält nur die benötigten
-- =============================================

-- SCHRITT 1: BACKUP WICHTIGER DATEN (falls vorhanden)
-- =============================================

-- Backup von monitored_streamers (wichtigste Daten)
CREATE TABLE IF NOT EXISTS twitch_backup_monitored_streamers AS 
SELECT * FROM twitch_monitored_streamers WHERE id > 0;

-- Backup von live_notifications settings
CREATE TABLE IF NOT EXISTS twitch_backup_live_notifications AS 
SELECT * FROM twitch_live_notifications WHERE id > 0;

-- SCHRITT 2: ALLE ÜBERFLÜSSIGEN TABELLEN LÖSCHEN
-- =============================================

-- Alte/Doppelte Chat Bot Tabellen
DROP TABLE IF EXISTS twitch_bot_auto_voice CASCADE;
DROP TABLE IF EXISTS twitch_bot_moderators CASCADE;
DROP TABLE IF EXISTS twitch_bot_stats CASCADE;
DROP TABLE IF EXISTS twitch_bot_status CASCADE;
DROP TABLE IF EXISTS twitch_bot_moderation CASCADE;

-- Doppelte Channel Tabellen
DROP TABLE IF EXISTS twitch_channels CASCADE;

-- Ungenutzte Log Tabellen
DROP TABLE IF EXISTS twitch_chat_logs CASCADE;
DROP TABLE IF EXISTS twitch_command_logs CASCADE;
DROP TABLE IF EXISTS twitch_command_stats CASCADE;
DROP TABLE IF EXISTS twitch_moderation_actions CASCADE;
DROP TABLE IF EXISTS twitch_moderation_logs CASCADE;

-- Doppelte Command Tabellen
DROP TABLE IF EXISTS twitch_commands CASCADE;

-- Temporäre/Cache Tabellen
DROP TABLE IF EXISTS twitch_live_data CASCADE;
DROP TABLE IF EXISTS twitch_active_streamers CASCADE;

-- Doppelte Stats Tabellen
DROP TABLE IF EXISTS twitch_statistics CASCADE;
DROP TABLE IF EXISTS twitch_stats CASCADE;

-- Doppelte Streamer Tabellen
DROP TABLE IF EXISTS twitch_streamers CASCADE;

-- Ungenutzte User Tabellen
DROP TABLE IF EXISTS twitch_users CASCADE;

-- Alte Settings Tabellen (falls duplikat)
DROP TABLE IF EXISTS twitch_settings CASCADE;

-- SCHRITT 3: VIEWS UND FUNCTIONS BEREINIGEN
-- =============================================

-- Alte Views löschen
DROP VIEW IF EXISTS twitch_bot_stats_summary CASCADE;
DROP VIEW IF EXISTS twitch_monitored_streamers_status CASCADE;
DROP VIEW IF EXISTS twitch_bot_active_channels CASCADE;

-- Alte Functions löschen (falls vorhanden)
DROP FUNCTION IF EXISTS update_twitch_bot_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_twitch_bot_events(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS increment_command_usage(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_twitch_bot_daily_stats(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) CASCADE;

-- SCHRITT 4: VERBLEIBENDE TABELLEN ÜBERPRÜFEN
-- =============================================

-- Diese Tabellen sollten BLEIBEN (nur überprüfen):
-- ✅ twitch_live_notifications - für Live-Benachrichtigungen
-- ✅ twitch_monitored_streamers - Liste der Streamer
-- ✅ twitch_bot_settings - Bot-Einstellungen  
-- ✅ twitch_bot_channels - Bot-Kanäle
-- ✅ twitch_bot_commands - Bot-Commands
-- ✅ twitch_bot_events - Bot-Events

-- SCHRITT 5: ERFOLGSMELDUNG
-- =============================================

SELECT 'TWITCH CLEANUP COMPLETED!' as status,
       'Überflüssige Tabellen entfernt' as action,
       'Nur 6 wichtige Tabellen bleiben übrig' as result,
       '2 Systeme: Live Notifications + Chat Bot' as info;

-- SCHRITT 6: AKTUELLE TABELLEN ANZEIGEN
-- =============================================

SELECT 
    table_name,
    CASE 
        WHEN table_name LIKE 'twitch_bot_%' THEN '🤖 Chat Bot System'
        WHEN table_name IN ('twitch_live_notifications', 'twitch_monitored_streamers') THEN '📺 Live Notifications'
        WHEN table_name LIKE 'twitch_backup_%' THEN '💾 Backup'
        ELSE '❓ Unbekannt'
    END as system_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'twitch%'
ORDER BY system_type, table_name; 