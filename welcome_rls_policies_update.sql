-- ===========================================
-- WELCOME SYSTEM RLS POLICIES UPDATE
-- ===========================================
-- Fügt zusätzliche RLS Policies hinzu für bessere Kompatibilität

DO $$
BEGIN
    -- Zusätzliche Policies für authenticated Users (Dashboard/API)
    BEGIN
        CREATE POLICY "authenticated_welcome_settings" ON welcome_settings
            FOR ALL USING (auth.role() = 'authenticated');
    EXCEPTION WHEN duplicate_object THEN 
        RAISE NOTICE 'Policy authenticated_welcome_settings bereits vorhanden - überspringe';
    END;

    BEGIN
        CREATE POLICY "authenticated_welcome_images" ON welcome_images
            FOR ALL USING (auth.role() = 'authenticated');
    EXCEPTION WHEN duplicate_object THEN 
        RAISE NOTICE 'Policy authenticated_welcome_images bereits vorhanden - überspringe';
    END;

    BEGIN
        CREATE POLICY "authenticated_welcome_folders" ON welcome_folders
            FOR ALL USING (auth.role() = 'authenticated');
    EXCEPTION WHEN duplicate_object THEN 
        RAISE NOTICE 'Policy authenticated_welcome_folders bereits vorhanden - überspringe';
    END;

    BEGIN
        CREATE POLICY "authenticated_welcome_stats" ON welcome_stats
            FOR ALL USING (auth.role() = 'authenticated');
    EXCEPTION WHEN duplicate_object THEN 
        RAISE NOTICE 'Policy authenticated_welcome_stats bereits vorhanden - überspringe';
    END;

    -- Fallback Policy für anon role (falls Service Key nicht verfügbar)
    BEGIN
        CREATE POLICY "anon_welcome_settings" ON welcome_settings
            FOR ALL USING (auth.role() = 'anon');
    EXCEPTION WHEN duplicate_object THEN 
        RAISE NOTICE 'Policy anon_welcome_settings bereits vorhanden - überspringe';
    END;

    BEGIN
        CREATE POLICY "anon_welcome_images" ON welcome_images
            FOR ALL USING (auth.role() = 'anon');
    EXCEPTION WHEN duplicate_object THEN 
        RAISE NOTICE 'Policy anon_welcome_images bereits vorhanden - überspringe';
    END;

    BEGIN
        CREATE POLICY "anon_welcome_folders" ON welcome_folders
            FOR ALL USING (auth.role() = 'anon');
    EXCEPTION WHEN duplicate_object THEN 
        RAISE NOTICE 'Policy anon_welcome_folders bereits vorhanden - überspringe';
    END;

    BEGIN
        CREATE POLICY "anon_welcome_stats" ON welcome_stats
            FOR ALL USING (auth.role() = 'anon');
    EXCEPTION WHEN duplicate_object THEN 
        RAISE NOTICE 'Policy anon_welcome_stats bereits vorhanden - überspringe';
    END;

END $$;

-- Log Update
DO $$
BEGIN
    RAISE NOTICE '🔒 Welcome System RLS Policies erfolgreich erweitert!';
    RAISE NOTICE '✅ Unterstützung für: service_role, authenticated, anon';
    RAISE NOTICE '📅 Update Timestamp: %', NOW();
END $$; 