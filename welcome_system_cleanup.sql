-- ===========================================
-- WELCOME SYSTEM CLEANUP SCRIPT
-- ===========================================
-- Löscht alle Welcome System Komponenten falls nötig für Clean Install

-- 1. TRIGGER LÖSCHEN
-- ===========================================
DROP TRIGGER IF EXISTS update_welcome_settings_updated_at ON welcome_settings;
DROP TRIGGER IF EXISTS update_welcome_images_updated_at ON welcome_images;
DROP TRIGGER IF EXISTS update_welcome_folders_updated_at ON welcome_folders;
DROP TRIGGER IF EXISTS update_welcome_stats_updated_at ON welcome_stats;

-- 2. RLS POLICIES LÖSCHEN
-- ===========================================

-- Welcome Settings Policies
DROP POLICY IF EXISTS "service_role_welcome_settings" ON welcome_settings;
DROP POLICY IF EXISTS "authenticated_welcome_settings" ON welcome_settings;
DROP POLICY IF EXISTS "anon_welcome_settings" ON welcome_settings;

-- Welcome Images Policies
DROP POLICY IF EXISTS "service_role_welcome_images" ON welcome_images;
DROP POLICY IF EXISTS "authenticated_welcome_images" ON welcome_images;
DROP POLICY IF EXISTS "anon_welcome_images" ON welcome_images;

-- Welcome Folders Policies
DROP POLICY IF EXISTS "service_role_welcome_folders" ON welcome_folders;
DROP POLICY IF EXISTS "authenticated_welcome_folders" ON welcome_folders;
DROP POLICY IF EXISTS "anon_welcome_folders" ON welcome_folders;

-- Welcome Stats Policies
DROP POLICY IF EXISTS "service_role_welcome_stats" ON welcome_stats;
DROP POLICY IF EXISTS "authenticated_welcome_stats" ON welcome_stats;
DROP POLICY IF EXISTS "anon_welcome_stats" ON welcome_stats;

-- Storage Policies (optional - nur falls nötig)
-- DROP POLICY IF EXISTS "Welcome images sind öffentlich lesbar" ON storage.objects;
-- DROP POLICY IF EXISTS "Nur Admins können Welcome images hochladen" ON storage.objects;
-- DROP POLICY IF EXISTS "Nur Admins können Welcome images löschen" ON storage.objects;

-- 3. VIEWS LÖSCHEN
-- ===========================================
DROP VIEW IF EXISTS welcome_monthly_stats;
DROP VIEW IF EXISTS welcome_folder_stats;

-- 4. FUNKTIONEN LÖSCHEN
-- ===========================================
DROP FUNCTION IF EXISTS cleanup_old_welcome_stats();
DROP FUNCTION IF EXISTS cleanup_orphaned_welcome_images();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 5. TABELLEN LÖSCHEN (VORSICHT - ALLE DATEN GEHEN VERLOREN!)
-- ===========================================
-- Uncomment nur falls wirklich nötig:
-- DROP TABLE IF EXISTS welcome_stats;
-- DROP TABLE IF EXISTS welcome_images;
-- DROP TABLE IF EXISTS welcome_folders;
-- DROP TABLE IF EXISTS welcome_settings;

-- 6. STORAGE BUCKET LÖSCHEN (VORSICHT - ALLE BILDER GEHEN VERLOREN!)
-- ===========================================
-- Uncomment nur falls wirklich nötig:
-- DELETE FROM storage.objects WHERE bucket_id = 'welcome-images';
-- DELETE FROM storage.buckets WHERE id = 'welcome-images';

-- ===========================================
-- CLEANUP ABGESCHLOSSEN
-- ===========================================

DO $$
BEGIN
    RAISE NOTICE '🧹 Welcome System Cleanup abgeschlossen!';
    RAISE NOTICE '⚠️ Tabellen und Storage wurden NICHT gelöscht (uncomment falls nötig)';
    RAISE NOTICE '✅ Trigger, Policies, Views und Functions entfernt';
    RAISE NOTICE '📅 Cleanup Timestamp: %', NOW();
END $$; 