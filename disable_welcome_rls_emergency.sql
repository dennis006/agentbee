-- ===========================================
-- EMERGENCY FIX: DISABLE RLS POLICIES FOR WELCOME SYSTEM
-- ===========================================
-- Nur temporär bis SERVICE_KEY richtig konfiguriert ist!

-- Deaktiviere RLS für Welcome Tabellen (NOTFALL-FIX)
ALTER TABLE welcome_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE welcome_stats DISABLE ROW LEVEL SECURITY;

-- INFO: Nach diesem Fix sollte alles wieder funktionieren
-- WICHTIG: Sobald SUPABASE_SERVICE_KEY korrekt gesetzt ist, 
-- können die RLS Policies wieder aktiviert werden mit:
-- 
-- ALTER TABLE welcome_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE welcome_images ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE welcome_folders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE welcome_stats ENABLE ROW LEVEL SECURITY; 