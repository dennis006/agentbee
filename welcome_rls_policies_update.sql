-- ===========================================
-- WELCOME SYSTEM RLS POLICIES UPDATE
-- ===========================================
-- Fügt zusätzliche RLS Policies hinzu für bessere Kompatibilität

-- Zusätzliche Policies für authenticated Users (Dashboard/API)
CREATE POLICY IF NOT EXISTS "authenticated_welcome_settings" ON welcome_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "authenticated_welcome_images" ON welcome_images
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "authenticated_welcome_folders" ON welcome_folders
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "authenticated_welcome_stats" ON welcome_stats
    FOR ALL USING (auth.role() = 'authenticated');

-- Fallback Policy für anon role (falls Service Key nicht verfügbar)
CREATE POLICY IF NOT EXISTS "anon_welcome_settings" ON welcome_settings
    FOR ALL USING (auth.role() = 'anon');

CREATE POLICY IF NOT EXISTS "anon_welcome_images" ON welcome_images
    FOR ALL USING (auth.role() = 'anon');

CREATE POLICY IF NOT EXISTS "anon_welcome_folders" ON welcome_folders
    FOR ALL USING (auth.role() = 'anon');

CREATE POLICY IF NOT EXISTS "anon_welcome_stats" ON welcome_stats
    FOR ALL USING (auth.role() = 'anon');

-- Log Update
DO $$
BEGIN
    RAISE NOTICE '🔒 Welcome System RLS Policies erfolgreich erweitert!';
    RAISE NOTICE '✅ Unterstützung für: service_role, authenticated, anon';
    RAISE NOTICE '📅 Update Timestamp: %', NOW();
END $$; 