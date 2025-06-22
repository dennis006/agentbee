-- =====================================================
-- DISCORD BOT - VALORANT AGENTS SUPABASE MIGRATION
-- =====================================================
-- Ersetzt: Hardcodierte Valorant Agenten in index.js
-- =====================================================

-- Lösche bestehende Tabellen falls vorhanden
DROP TABLE IF EXISTS valorant_agent_roles CASCADE;
DROP TABLE IF EXISTS valorant_agents CASCADE;

-- ============================
-- TABELLE: VALORANT AGENTS
-- ============================

CREATE TABLE valorant_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Agent Basis-Daten
    name TEXT UNIQUE NOT NULL,
    uuid TEXT UNIQUE,
    display_name TEXT NOT NULL,
    role_type TEXT NOT NULL CHECK (role_type IN ('Duelist', 'Sentinel', 'Initiator', 'Controller')),
    role_color TEXT NOT NULL DEFAULT '#FF4655',
    
    -- Agent-Details
    description TEXT,
    icon TEXT DEFAULT '🎯', -- Emoji Icon für Dashboard
    icon_url TEXT,
    portrait_url TEXT,
    background_url TEXT,
    
    -- Rolle-Konfiguration
    role_config JSONB NOT NULL DEFAULT '{
        "hoist": false,
        "mentionable": true,
        "permissions": [],
        "position": 7
    }'::jsonb,
    
    -- Status & Sortierung
    enabled BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- TABELLE: VALORANT AGENT ROLES
-- ============================

CREATE TABLE valorant_agent_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Rollen-Details
    role_name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    color TEXT NOT NULL,
    
    -- Discord-Rolle Konfiguration
    role_config JSONB NOT NULL DEFAULT '{
        "hoist": true,
        "mentionable": true,
        "permissions": [],
        "position": 6
    }'::jsonb,
    
    -- Status
    enabled BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- INDIZES FÜR PERFORMANCE
-- ============================

-- Valorant Agents
CREATE INDEX idx_valorant_agents_name ON valorant_agents(name);
CREATE INDEX idx_valorant_agents_uuid ON valorant_agents(uuid);
CREATE INDEX idx_valorant_agents_role_type ON valorant_agents(role_type);
CREATE INDEX idx_valorant_agents_enabled ON valorant_agents(enabled);
CREATE INDEX idx_valorant_agents_sort_order ON valorant_agents(sort_order);

-- Valorant Agent Roles
CREATE INDEX idx_valorant_agent_roles_name ON valorant_agent_roles(role_name);
CREATE INDEX idx_valorant_agent_roles_enabled ON valorant_agent_roles(enabled);

-- ============================
-- TRIGGER FÜR AUTO-TIMESTAMPS
-- ============================

-- Auto-Update Timestamp Funktion (falls nicht bereits existiert)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für alle Tabellen
CREATE TRIGGER update_valorant_agents_updated_at
    BEFORE UPDATE ON valorant_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_valorant_agent_roles_updated_at
    BEFORE UPDATE ON valorant_agent_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================
-- SEED DATA: VALORANT AGENT ROLES
-- ============================

INSERT INTO valorant_agent_roles (role_name, display_name, color, role_config, sort_order) VALUES
('Duelist', 'Duelist', '#FF4655', '{"hoist": true, "mentionable": true, "permissions": [], "position": 6}', 1),
('Sentinel', 'Sentinel', '#00C851', '{"hoist": true, "mentionable": true, "permissions": [], "position": 6}', 2),
('Initiator', 'Initiator', '#AA66CC', '{"hoist": true, "mentionable": true, "permissions": [], "position": 6}', 3),
('Controller', 'Controller', '#33B5E5', '{"hoist": true, "mentionable": true, "permissions": [], "position": 6}', 4);

-- ============================
-- SEED DATA: VALORANT AGENTS
-- ============================
-- HINWEIS: UUIDs für Waylay, Vyse und Tejo sind temporäre Platzhalter
-- und müssen ggf. mit offiziellen UUIDs aktualisiert werden, sobald verfügbar

-- Duelist Agenten
INSERT INTO valorant_agents (name, uuid, display_name, role_type, role_color, role_config, sort_order, icon) VALUES
('Jett', 'add6443a-41bd-e414-f6ad-e58d267f4e95', 'Jett', 'Duelist', '#87CEEB', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 1, '💨'),
('Phoenix', 'eb93336a-449b-9c1b-0a54-a891f7921d69', 'Phoenix', 'Duelist', '#FF4500', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 2, '🔥'),
('Reyna', 'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc', 'Reyna', 'Duelist', '#8A2BE2', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 3, '👁️'),
('Raze', 'f94c3b30-42be-e959-889c-5aa313dba261', 'Raze', 'Duelist', '#FF6347', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 4, '💥'),
('Yoru', '7f94d92c-4234-0a36-9646-3a87eb8b5c89', 'Yoru', 'Duelist', '#483D8B', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 5, '🌀'),
('Neon', 'bb2a4828-46eb-8cd1-e765-15848195d751', 'Neon', 'Duelist', '#00FFFF', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 6, '⚡'),
('Iso', '0e38b510-41a8-5780-5e8f-568b2a4f2d6c', 'Iso', 'Duelist', '#9932CC', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 7, '🔮'),
('Waylay', 'a0fb1e56-4829-5c21-bd58-e38a9d8f4c27', 'Waylay', 'Duelist', '#4682B4', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 8, '🎯');

-- Sentinel Agenten
INSERT INTO valorant_agents (name, uuid, display_name, role_type, role_color, role_config, sort_order, icon) VALUES
('Killjoy', '1e58de9c-4950-5125-93e9-a0aee9f98746', 'Killjoy', 'Sentinel', '#FFD700', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 10, '🔧'),
('Cypher', '117ed9e3-49f3-6512-3ccf-0cada7e3823b', 'Cypher', 'Sentinel', '#708090', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 11, '📷'),
('Sage', '569fdd95-4d10-43ab-ca70-79becc718b46', 'Sage', 'Sentinel', '#98FB98', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 12, '🌿'),
('Chamber', '22697a3d-45bf-8dd7-4fec-84a9e28c69d7', 'Chamber', 'Sentinel', '#B8860B', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 13, '🎩'),
('Deadlock', 'cc8b64c8-4b25-4ff9-6e7f-37b4da43d235', 'Deadlock', 'Sentinel', '#2F4F4F', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 14, '🕸️'),
('Vyse', 'b1a4c798-6d3e-5f42-8c91-2e5b7a8d9f26', 'Vyse', 'Sentinel', '#556B2F', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 15, '🗡️');

-- Initiator Agenten
INSERT INTO valorant_agents (name, uuid, display_name, role_type, role_color, role_config, sort_order, icon) VALUES
('Sova', '320b2a48-4d9b-a075-30f1-1f93a9b638fa', 'Sova', 'Initiator', '#4169E1', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 20, '🏹'),
('Breach', '5f8d3a7f-467b-97f3-062c-13acf203c006', 'Breach', 'Initiator', '#FF8C00', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 21, '👊'),
('Skye', '6f2a04ca-43e0-be17-7f36-b3908627744d', 'Skye', 'Initiator', '#32CD32', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 22, '🦅'),
('Fade', 'dade69b4-4f5a-8528-247b-219e5a1facd6', 'Fade', 'Initiator', '#2E2E2E', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 23, '🌙'),
('KAY/O', '601dbbe7-43ce-be57-2a40-4abd24953621', 'KAY/O', 'Initiator', '#778899', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 24, '🤖'),
('Gekko', 'e370fa57-4757-3604-3648-499e1f642d3f', 'Gekko', 'Initiator', '#9ACD32', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 25, '🦎'),
('Tejo', 'c5e8d247-9b1a-4f6c-8e2d-3a7b5c9e1f84', 'Tejo', 'Initiator', '#DA70D6', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 26, '🎭');

-- Controller Agenten
INSERT INTO valorant_agents (name, uuid, display_name, role_type, role_color, role_config, sort_order, icon) VALUES
('Brimstone', '9f0d8ba9-4140-b941-57d3-a7ad57c6b417', 'Brimstone', 'Controller', '#8B4513', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 30, '💨'),
('Viper', '707eab51-4836-f488-046a-cda6bf494859', 'Viper', 'Controller', '#006400', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 31, '☠️'),
('Omen', '8e253930-4c05-31dd-1b6c-968525494517', 'Omen', 'Controller', '#191970', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 32, '👻'),
('Astra', '41fb69c1-4189-7b37-f117-bcaf1e96f1bf', 'Astra', 'Controller', '#9400D3', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 33, '⭐'),
('Harbor', '95b78ed7-4637-86d9-7e41-71ba8c293152', 'Harbor', 'Controller', '#20B2AA', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 34, '🌊'),
('Clove', '1dbf2edd-7729-4fe6-b095-9a9a46bf73fc', 'Clove', 'Controller', '#228B22', '{"hoist": false, "mentionable": true, "permissions": [], "position": 7}', 35, '🍀');

-- ============================
-- HELPER FUNCTIONS
-- ============================

-- Lösche bestehende Funktionen falls vorhanden
DROP FUNCTION IF EXISTS get_all_valorant_agents();
DROP FUNCTION IF EXISTS get_agents_by_role(TEXT);
DROP FUNCTION IF EXISTS get_agent_uuid(TEXT);
DROP FUNCTION IF EXISTS get_role_config(TEXT);

-- Funktion um alle Agenten zu holen
CREATE OR REPLACE FUNCTION get_all_valorant_agents()
RETURNS TABLE (
    name TEXT,
    uuid TEXT,
    display_name TEXT,
    role_type TEXT,
    role_color TEXT,
    enabled BOOLEAN,
    icon TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        va.name,
        va.uuid,
        va.display_name,
        va.role_type,
        va.role_color,
        va.enabled,
        va.icon
    FROM valorant_agents va
    WHERE va.enabled = true
    ORDER BY va.role_type, va.sort_order, va.name;
END;
$$ LANGUAGE plpgsql;

-- Funktion um Agenten nach Rolle zu holen
CREATE OR REPLACE FUNCTION get_agents_by_role(role_name TEXT)
RETURNS TABLE (
    name TEXT,
    uuid TEXT,
    display_name TEXT,
    role_color TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        va.name,
        va.uuid,
        va.display_name,
        va.role_color
    FROM valorant_agents va
    WHERE va.role_type = role_name 
    AND va.enabled = true
    ORDER BY va.sort_order, va.name;
END;
$$ LANGUAGE plpgsql;

-- Funktion um Agent UUID zu holen
CREATE OR REPLACE FUNCTION get_agent_uuid(agent_name TEXT)
RETURNS TEXT AS $$
DECLARE
    agent_uuid TEXT;
BEGIN
    SELECT uuid INTO agent_uuid
    FROM valorant_agents
    WHERE LOWER(name) = LOWER(agent_name)
    AND enabled = true
    AND uuid IS NOT NULL;
    
    -- Fallback zu Sage falls Agent nicht gefunden oder UUID NULL
    IF agent_uuid IS NULL THEN
        SELECT uuid INTO agent_uuid
        FROM valorant_agents
        WHERE LOWER(name) = 'sage'
        AND enabled = true
        AND uuid IS NOT NULL;
    END IF;
    
    -- Hard-coded Fallback falls auch Sage keine UUID hat
    IF agent_uuid IS NULL THEN
        agent_uuid := '569fdd95-4d10-43ab-ca70-79becc718b46'; -- Sage UUID
    END IF;
    
    RETURN agent_uuid;
END;
$$ LANGUAGE plpgsql;

-- Funktion um Rollen-Konfiguration zu holen
CREATE OR REPLACE FUNCTION get_role_config(role_name TEXT)
RETURNS JSONB AS $$
DECLARE
    config JSONB;
BEGIN
    -- Versuche zuerst Agent-spezifische Konfiguration
    SELECT role_config INTO config
    FROM valorant_agents
    WHERE LOWER(name) = LOWER(role_name)
    AND enabled = true;
    
    -- Falls nicht gefunden, versuche Rollen-Typ Konfiguration
    IF config IS NULL THEN
        SELECT role_config INTO config
        FROM valorant_agent_roles
        WHERE LOWER(role_name) = LOWER(role_name)
        AND enabled = true;
    END IF;
    
    -- Standard-Konfiguration falls nichts gefunden
    IF config IS NULL THEN
        config := '{"color": 10070709, "hoist": false, "mentionable": false, "permissions": [], "position": 1}';
    END IF;
    
    RETURN config;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- INITIAL SETUP
-- ============================

-- Log für erfolgreiche Migration
DO $$
BEGIN
    RAISE NOTICE '✅ Valorant Agents Supabase Migration erfolgreich abgeschlossen!';
    RAISE NOTICE '📊 Agenten erstellt: %', (SELECT COUNT(*) FROM valorant_agents);
    RAISE NOTICE '🎯 Rollen erstellt: %', (SELECT COUNT(*) FROM valorant_agent_roles);
END $$; 