-- =============================================
-- Discord Bot Rules System - Supabase Tables
-- =============================================

-- Haupt-Tabelle für Server Rule Konfigurationen
CREATE TABLE IF NOT EXISTS server_rules_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    server_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL DEFAULT '📜 SERVERREGELN',
    description TEXT NOT NULL DEFAULT 'Willkommen auf **{serverName}**! Bitte lies und befolge diese Regeln:',
    color TEXT NOT NULL DEFAULT '0xFF6B6B',
    channel_name TEXT NOT NULL DEFAULT 'rules',
    footer TEXT NOT NULL DEFAULT 'Viel Spaß auf dem Server! 🎉',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für individuelle Server-Regeln
CREATE TABLE IF NOT EXISTS server_rules_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_id UUID REFERENCES server_rules_config(id) ON DELETE CASCADE,
    server_id TEXT NOT NULL,
    rule_order INTEGER NOT NULL DEFAULT 1,
    emoji TEXT NOT NULL DEFAULT '📝',
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Compound unique constraint für Ordnung pro Server
    UNIQUE(server_id, rule_order)
);

-- Tabelle für Reaktions-Einstellungen
CREATE TABLE IF NOT EXISTS server_rules_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_id UUID REFERENCES server_rules_config(id) ON DELETE CASCADE,
    server_id TEXT NOT NULL UNIQUE,
    emoji TEXT NOT NULL DEFAULT '✅',
    message TEXT NOT NULL DEFAULT 'Reagiere mit ✅ um die Regeln zu akzeptieren!',
    accepted_role TEXT NOT NULL DEFAULT 'verified',
    accepted_message TEXT NOT NULL DEFAULT 'Willkommen! Du hast die Regeln akzeptiert und erhältst Zugang zum Server.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_server_rules_config_server_id ON server_rules_config(server_id);
CREATE INDEX IF NOT EXISTS idx_server_rules_items_server_id ON server_rules_items(server_id);
CREATE INDEX IF NOT EXISTS idx_server_rules_items_config_id ON server_rules_items(config_id);
CREATE INDEX IF NOT EXISTS idx_server_rules_items_order ON server_rules_items(server_id, rule_order);
CREATE INDEX IF NOT EXISTS idx_server_rules_reactions_server_id ON server_rules_reactions(server_id);
CREATE INDEX IF NOT EXISTS idx_server_rules_reactions_config_id ON server_rules_reactions(config_id);

-- Trigger für automatische updated_at Aktualisierung
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_server_rules_config_updated_at BEFORE UPDATE ON server_rules_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_server_rules_items_updated_at BEFORE UPDATE ON server_rules_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_server_rules_reactions_updated_at BEFORE UPDATE ON server_rules_reactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE server_rules_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_rules_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_rules_reactions ENABLE ROW LEVEL SECURITY;

-- Beispiel-Policies (können je nach Authentifizierung angepasst werden)
CREATE POLICY "Server rules config are viewable by everyone" ON server_rules_config FOR SELECT USING (true);
CREATE POLICY "Server rules items are viewable by everyone" ON server_rules_items FOR SELECT USING (true);
CREATE POLICY "Server rules reactions are viewable by everyone" ON server_rules_reactions FOR SELECT USING (true);

-- Für Entwicklung - Admin kann alles (später durch spezifische User-Policies ersetzen)
CREATE POLICY "Enable all operations for admin users" ON server_rules_config FOR ALL USING (true);
CREATE POLICY "Enable all operations for admin users" ON server_rules_items FOR ALL USING (true);
CREATE POLICY "Enable all operations for admin users" ON server_rules_reactions FOR ALL USING (true);

-- =============================================
-- Beispiel-Daten für Testing
-- =============================================

-- Beispiel Server Rule Konfiguration
INSERT INTO server_rules_config (server_id, title, description, color, channel_name, footer) 
VALUES (
    '123456789012345678', 
    '📜 SERVERREGELN',
    'Willkommen auf **{serverName}**! Bitte lies und befolge diese Regeln:',
    '0xFF6B6B',
    'rules',
    'Viel Spaß auf dem Server! 🎉'
) ON CONFLICT (server_id) DO NOTHING;

-- Beispiel Regeln
INSERT INTO server_rules_items (config_id, server_id, rule_order, emoji, name, value) 
SELECT 
    src.id,
    '123456789012345678',
    unnest(ARRAY[1, 2, 3, 4, 5, 6, 7, 8]),
    unnest(ARRAY['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣']),
    unnest(ARRAY['Respekt', 'Kein Spam', 'Angemessene Inhalte', 'Richtige Kanäle', 'Discord Guidelines', 'Moderatoren', 'Sprache', 'Konsequenzen']),
    unnest(ARRAY[
        'Sei respektvoll und freundlich zu allen Mitgliedern',
        'Kein Spam, keine Werbung oder Eigenwerbung',
        'Keine beleidigenden, diskriminierenden oder NSFW Inhalte',
        'Nutze die entsprechenden Kanäle für verschiedene Themen',
        'Halte dich an die Discord Community Guidelines',
        'Respektiere Mods und Admins - bei Problemen wende dich an sie',
        'Deutsche Sprache bevorzugt im Chat',
        'Verstöße können zu Verwarnungen oder Bans führen'
    ])
FROM server_rules_config src 
WHERE src.server_id = '123456789012345678'
ON CONFLICT (server_id, rule_order) DO NOTHING;

-- Beispiel Reaktions-Einstellungen
INSERT INTO server_rules_reactions (config_id, server_id, emoji, message, accepted_role, accepted_message)
SELECT 
    src.id,
    '123456789012345678',
    '✅',
    'Reagiere mit ✅ um die Regeln zu akzeptieren!',
    'verified',
    'Willkommen! Du hast die Regeln akzeptiert und erhältst Zugang zum Server.'
FROM server_rules_config src 
WHERE src.server_id = '123456789012345678'
ON CONFLICT (server_id) DO NOTHING;

-- =============================================
-- Nützliche Views für einfachere Queries
-- =============================================

-- View für komplette Rule Konfiguration pro Server
CREATE OR REPLACE VIEW server_rules_complete AS
SELECT 
    c.server_id,
    c.title,
    c.description,
    c.color,
    c.channel_name,
    c.footer,
    c.created_at,
    c.updated_at,
    
    -- Reaktions-Einstellungen
    r.emoji as reaction_emoji,
    r.message as reaction_message,
    r.accepted_role,
    r.accepted_message,
    
    -- Aggregierte Regeln als JSON
    COALESCE(
        json_agg(
            json_build_object(
                'emoji', ri.emoji,
                'name', ri.name,
                'value', ri.value
            ) ORDER BY ri.rule_order
        ) FILTER (WHERE ri.id IS NOT NULL),
        '[]'::json
    ) AS rules
    
FROM server_rules_config c
LEFT JOIN server_rules_reactions r ON c.id = r.config_id
LEFT JOIN server_rules_items ri ON c.id = ri.config_id
GROUP BY c.id, c.server_id, c.title, c.description, c.color, c.channel_name, c.footer, c.created_at, c.updated_at,
         r.emoji, r.message, r.accepted_role, r.accepted_message;

-- =============================================
-- Stored Procedures für häufige Operationen
-- =============================================

-- Funktion zum Erstellen einer kompletten Rule Konfiguration
CREATE OR REPLACE FUNCTION create_server_rules(
    p_server_id TEXT,
    p_title TEXT DEFAULT '📜 SERVERREGELN',
    p_description TEXT DEFAULT 'Willkommen auf **{serverName}**! Bitte lies und befolge diese Regeln:',
    p_color TEXT DEFAULT '0xFF6B6B',
    p_channel_name TEXT DEFAULT 'rules',
    p_footer TEXT DEFAULT 'Viel Spaß auf dem Server! 🎉',
    p_reaction_emoji TEXT DEFAULT '✅',
    p_reaction_message TEXT DEFAULT 'Reagiere mit ✅ um die Regeln zu akzeptieren!',
    p_accepted_role TEXT DEFAULT 'verified',
    p_accepted_message TEXT DEFAULT 'Willkommen! Du hast die Regeln akzeptiert und erhältst Zugang zum Server.'
)
RETURNS UUID AS $$
DECLARE
    config_id UUID;
BEGIN
    -- Erstelle Hauptkonfiguration
    INSERT INTO server_rules_config (server_id, title, description, color, channel_name, footer)
    VALUES (p_server_id, p_title, p_description, p_color, p_channel_name, p_footer)
    RETURNING id INTO config_id;
    
    -- Erstelle Reaktions-Einstellungen
    INSERT INTO server_rules_reactions (config_id, server_id, emoji, message, accepted_role, accepted_message)
    VALUES (config_id, p_server_id, p_reaction_emoji, p_reaction_message, p_accepted_role, p_accepted_message);
    
    RETURN config_id;
END;
$$ LANGUAGE plpgsql;

-- Funktion zum Löschen aller Rules eines Servers
CREATE OR REPLACE FUNCTION delete_server_rules(p_server_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM server_rules_config WHERE server_id = p_server_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Funktion zum Neuordnen von Regeln
CREATE OR REPLACE FUNCTION reorder_server_rules(p_server_id TEXT, p_rule_ids UUID[])
RETURNS BOOLEAN AS $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..array_length(p_rule_ids, 1) LOOP
        UPDATE server_rules_items 
        SET rule_order = i 
        WHERE id = p_rule_ids[i] AND server_id = p_server_id;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql; 