-- =============================================
-- SERVER STATS SYSTEM - SUPABASE MIGRATION
-- =============================================
-- Vollständige Datenbankstruktur für das Server Stats System
-- Ersetzt: server-stats-settings.json
-- Erstellt: Server Stats Konfiguration, Channel-Management, Timer-Status

-- =============================================
-- HAUPTTABELLEN
-- =============================================

-- Server Stats Konfiguration (Haupteinstellungen)
CREATE TABLE IF NOT EXISTS server_stats_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    update_interval INTEGER DEFAULT 300000, -- Millisekunden (5 Minuten)
    category_id TEXT DEFAULT '',
    category_name TEXT DEFAULT '📊 Server Statistiken',
    last_update_time BIGINT DEFAULT NULL, -- Unix Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(server_id)
);

-- Server Stats Channel-Konfiguration
CREATE TABLE IF NOT EXISTS server_stats_channels (
    channel_config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id TEXT NOT NULL,
    config_id UUID REFERENCES server_stats_config(config_id) ON DELETE CASCADE,
    stat_type TEXT NOT NULL, -- memberCount, onlineCount, boostCount, etc.
    enabled BOOLEAN DEFAULT false,
    channel_id TEXT DEFAULT '',
    channel_name TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(server_id, stat_type)
);

-- Server Stats Berechtigungen
CREATE TABLE IF NOT EXISTS server_stats_permissions (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id TEXT NOT NULL,
    config_id UUID REFERENCES server_stats_config(config_id) ON DELETE CASCADE,
    view_channel BOOLEAN DEFAULT true,
    connect BOOLEAN DEFAULT false,
    speak BOOLEAN DEFAULT false,
    use_vad BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(server_id)
);

-- Server Stats Design-Einstellungen
CREATE TABLE IF NOT EXISTS server_stats_design (
    design_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id TEXT NOT NULL,
    config_id UUID REFERENCES server_stats_config(config_id) ON DELETE CASCADE,
    emoji TEXT DEFAULT '📊',
    color TEXT DEFAULT '0x00FF7F',
    separator TEXT DEFAULT ' • ',
    format TEXT DEFAULT 'modern', -- modern, classic, minimal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(server_id)
);

-- Server Stats Verlauf (für Analytics)
CREATE TABLE IF NOT EXISTS server_stats_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id TEXT NOT NULL,
    config_id UUID REFERENCES server_stats_config(config_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    member_count INTEGER DEFAULT 0,
    online_count INTEGER DEFAULT 0,
    boost_count INTEGER DEFAULT 0,
    channel_count INTEGER DEFAULT 0,
    role_count INTEGER DEFAULT 0,
    server_level INTEGER DEFAULT 0,
    bot_count INTEGER DEFAULT 0,
    created_date TEXT DEFAULT '',
    update_duration_ms INTEGER DEFAULT 0, -- Wie lange das Update gedauert hat
    success BOOLEAN DEFAULT true,
    error_message TEXT DEFAULT NULL
);

-- =============================================
-- INDIZES FÜR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_server_stats_config_server_id ON server_stats_config(server_id);
CREATE INDEX IF NOT EXISTS idx_server_stats_channels_server_id ON server_stats_channels(server_id);
CREATE INDEX IF NOT EXISTS idx_server_stats_channels_config_id ON server_stats_channels(config_id);
CREATE INDEX IF NOT EXISTS idx_server_stats_channels_stat_type ON server_stats_channels(server_id, stat_type);
CREATE INDEX IF NOT EXISTS idx_server_stats_channels_enabled ON server_stats_channels(server_id, enabled);
CREATE INDEX IF NOT EXISTS idx_server_stats_permissions_server_id ON server_stats_permissions(server_id);
CREATE INDEX IF NOT EXISTS idx_server_stats_design_server_id ON server_stats_design(server_id);
CREATE INDEX IF NOT EXISTS idx_server_stats_history_server_id ON server_stats_history(server_id);
CREATE INDEX IF NOT EXISTS idx_server_stats_history_timestamp ON server_stats_history(server_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_server_stats_history_config_id ON server_stats_history(config_id);

-- =============================================
-- TRIGGER FÜR AUTOMATISCHE TIMESTAMPS
-- =============================================

-- Updated_at Trigger Funktion (falls nicht existiert)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für alle Tabellen
CREATE TRIGGER update_server_stats_config_updated_at BEFORE UPDATE ON server_stats_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_server_stats_channels_updated_at BEFORE UPDATE ON server_stats_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_server_stats_permissions_updated_at BEFORE UPDATE ON server_stats_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_server_stats_design_updated_at BEFORE UPDATE ON server_stats_design FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Aktiviere RLS für alle Tabellen
ALTER TABLE server_stats_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_stats_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_stats_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_stats_design ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_stats_history ENABLE ROW LEVEL SECURITY;

-- Service Role Policies (für Backend-API)
CREATE POLICY "Service role can manage server_stats_config" ON server_stats_config
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage server_stats_channels" ON server_stats_channels
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage server_stats_permissions" ON server_stats_permissions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage server_stats_design" ON server_stats_design
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage server_stats_history" ON server_stats_history
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- VIEWS FÜR VEREINFACHTE ABFRAGEN
-- =============================================

-- Vollständige Server Stats Konfiguration (alle Tabellen zusammengefügt)
CREATE OR REPLACE VIEW server_stats_complete AS
SELECT 
    c.config_id,
    c.server_id,
    c.enabled,
    c.update_interval,
    c.category_id,
    c.category_name,
    c.last_update_time,
    c.created_at,
    c.updated_at,
    
    -- Permissions als JSON
    jsonb_build_object(
        'viewChannel', COALESCE(p.view_channel, true),
        'connect', COALESCE(p.connect, false),
        'speak', COALESCE(p.speak, false),
        'useVAD', COALESCE(p.use_vad, false)
    ) as permissions,
    
    -- Design als JSON
    jsonb_build_object(
        'emoji', COALESCE(d.emoji, '📊'),
        'color', COALESCE(d.color, '0x00FF7F'),
        'separator', COALESCE(d.separator, ' • '),
        'format', COALESCE(d.format, 'modern')
    ) as design,
    
    -- Channels als JSON (alle Channels für diesen Server)
    COALESCE(
        (SELECT jsonb_object_agg(
            ch.stat_type,
            jsonb_build_object(
                'enabled', ch.enabled,
                'channelId', ch.channel_id,
                'name', ch.channel_name,
                'position', ch.position
            )
        )
        FROM server_stats_channels ch
        WHERE ch.server_id = c.server_id
        ), '{}'::jsonb
    ) as channels
    
FROM server_stats_config c
LEFT JOIN server_stats_permissions p ON c.config_id = p.config_id
LEFT JOIN server_stats_design d ON c.config_id = d.config_id;

-- Aktive Stats Channels (nur aktivierte)
CREATE OR REPLACE VIEW server_stats_active_channels AS
SELECT 
    c.server_id,
    c.config_id,
    ch.stat_type,
    ch.channel_id,
    ch.channel_name,
    ch.position,
    c.category_id,
    c.category_name,
    c.update_interval,
    c.last_update_time
FROM server_stats_config c
JOIN server_stats_channels ch ON c.config_id = ch.config_id
WHERE c.enabled = true 
AND ch.enabled = true
ORDER BY c.server_id, ch.position;

-- Server Stats Timer Status
CREATE OR REPLACE VIEW server_stats_timer_status AS
SELECT 
    server_id,
    config_id,
    enabled,
    update_interval,
    last_update_time,
    CASE 
        WHEN enabled AND last_update_time IS NOT NULL THEN
            GREATEST(0, update_interval - (EXTRACT(EPOCH FROM NOW()) * 1000 - last_update_time)::INTEGER)
        ELSE 0
    END as time_remaining_ms,
    CASE 
        WHEN enabled AND last_update_time IS NOT NULL THEN
            LEAST(100, ((EXTRACT(EPOCH FROM NOW()) * 1000 - last_update_time) / update_interval * 100)::INTEGER)
        ELSE 0
    END as progress_percentage
FROM server_stats_config;

-- =============================================
-- STORED PROCEDURES / FUNCTIONS
-- =============================================

-- Erstelle komplette Server Stats Konfiguration
CREATE OR REPLACE FUNCTION create_server_stats_config(
    p_server_id TEXT,
    p_config JSONB
)
RETURNS UUID AS $$
DECLARE
    v_config_id UUID;
    v_channel_key TEXT;
    v_channel_config JSONB;
BEGIN
    -- Erstelle Hauptkonfiguration
    INSERT INTO server_stats_config (
        server_id,
        enabled,
        update_interval,
        category_id,
        category_name,
        last_update_time
    ) VALUES (
        p_server_id,
        COALESCE((p_config->>'enabled')::BOOLEAN, true),
        COALESCE((p_config->>'updateInterval')::INTEGER, 300000),
        COALESCE(p_config->>'categoryId', ''),
        COALESCE(p_config->>'categoryName', '📊 Server Statistiken'),
        CASE WHEN p_config->>'lastUpdateTime' IS NOT NULL 
             THEN (p_config->>'lastUpdateTime')::BIGINT 
             ELSE NULL END
    )
    ON CONFLICT (server_id) 
    DO UPDATE SET
        enabled = EXCLUDED.enabled,
        update_interval = EXCLUDED.update_interval,
        category_id = EXCLUDED.category_id,
        category_name = EXCLUDED.category_name,
        last_update_time = EXCLUDED.last_update_time,
        updated_at = CURRENT_TIMESTAMP
    RETURNING config_id INTO v_config_id;
    
    -- Lösche alte Channel-Konfigurationen
    DELETE FROM server_stats_channels WHERE server_id = p_server_id;
    
    -- Erstelle Channel-Konfigurationen
    IF p_config ? 'channels' THEN
        FOR v_channel_key IN SELECT jsonb_object_keys(p_config->'channels')
        LOOP
            v_channel_config := p_config->'channels'->v_channel_key;
            
            INSERT INTO server_stats_channels (
                server_id,
                config_id,
                stat_type,
                enabled,
                channel_id,
                channel_name,
                position
            ) VALUES (
                p_server_id,
                v_config_id,
                v_channel_key,
                COALESCE((v_channel_config->>'enabled')::BOOLEAN, false),
                COALESCE(v_channel_config->>'channelId', ''),
                COALESCE(v_channel_config->>'name', '📊 ' || v_channel_key || ': {count}'),
                COALESCE((v_channel_config->>'position')::INTEGER, 0)
            );
        END LOOP;
    END IF;
    
    -- Erstelle/Update Permissions
    INSERT INTO server_stats_permissions (
        server_id,
        config_id,
        view_channel,
        connect,
        speak,
        use_vad
    ) VALUES (
        p_server_id,
        v_config_id,
        COALESCE((p_config->'permissions'->>'viewChannel')::BOOLEAN, true),
        COALESCE((p_config->'permissions'->>'connect')::BOOLEAN, false),
        COALESCE((p_config->'permissions'->>'speak')::BOOLEAN, false),
        COALESCE((p_config->'permissions'->>'useVAD')::BOOLEAN, false)
    )
    ON CONFLICT (server_id)
    DO UPDATE SET
        view_channel = EXCLUDED.view_channel,
        connect = EXCLUDED.connect,
        speak = EXCLUDED.speak,
        use_vad = EXCLUDED.use_vad,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Erstelle/Update Design
    INSERT INTO server_stats_design (
        server_id,
        config_id,
        emoji,
        color,
        separator,
        format
    ) VALUES (
        p_server_id,
        v_config_id,
        COALESCE(p_config->'design'->>'emoji', '📊'),
        COALESCE(p_config->'design'->>'color', '0x00FF7F'),
        COALESCE(p_config->'design'->>'separator', ' • '),
        COALESCE(p_config->'design'->>'format', 'modern')
    )
    ON CONFLICT (server_id)
    DO UPDATE SET
        emoji = EXCLUDED.emoji,
        color = EXCLUDED.color,
        separator = EXCLUDED.separator,
        format = EXCLUDED.format,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN v_config_id;
END;
$$ LANGUAGE plpgsql;

-- Lade Server Stats Konfiguration
CREATE OR REPLACE FUNCTION load_server_stats_config(p_server_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT row_to_json(ssc)::jsonb INTO v_result
    FROM server_stats_complete ssc
    WHERE ssc.server_id = p_server_id;
    
    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Update Timer Status
CREATE OR REPLACE FUNCTION update_server_stats_timer(
    p_server_id TEXT,
    p_last_update_time BIGINT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE server_stats_config 
    SET last_update_time = p_last_update_time,
        updated_at = CURRENT_TIMESTAMP
    WHERE server_id = p_server_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Speichere Stats History
CREATE OR REPLACE FUNCTION save_server_stats_history(
    p_server_id TEXT,
    p_stats JSONB,
    p_update_duration_ms INTEGER DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_config_id UUID;
    v_history_id UUID;
BEGIN
    -- Hole Config ID
    SELECT config_id INTO v_config_id
    FROM server_stats_config
    WHERE server_id = p_server_id;
    
    IF v_config_id IS NULL THEN
        RAISE EXCEPTION 'Server Stats Config not found for server_id: %', p_server_id;
    END IF;
    
    -- Speichere History
    INSERT INTO server_stats_history (
        server_id,
        config_id,
        member_count,
        online_count,
        boost_count,
        channel_count,
        role_count,
        server_level,
        bot_count,
        created_date,
        update_duration_ms,
        success,
        error_message
    ) VALUES (
        p_server_id,
        v_config_id,
        COALESCE((p_stats->>'memberCount')::INTEGER, 0),
        COALESCE((p_stats->>'onlineCount')::INTEGER, 0),
        COALESCE((p_stats->>'boostCount')::INTEGER, 0),
        COALESCE((p_stats->>'channelCount')::INTEGER, 0),
        COALESCE((p_stats->>'roleCount')::INTEGER, 0),
        COALESCE((p_stats->>'serverLevel')::INTEGER, 0),
        COALESCE((p_stats->>'botCount')::INTEGER, 0),
        COALESCE(p_stats->>'createdDate', ''),
        p_update_duration_ms,
        p_success,
        p_error_message
    ) RETURNING history_id INTO v_history_id;
    
    RETURN v_history_id;
END;
$$ LANGUAGE plpgsql;

-- Lösche alte History (behalte nur letzte 30 Tage)
CREATE OR REPLACE FUNCTION cleanup_server_stats_history()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM server_stats_history 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Lösche komplette Server Stats Konfiguration
CREATE OR REPLACE FUNCTION delete_server_stats_config(p_server_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM server_stats_config WHERE server_id = p_server_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DEFAULT CHANNEL KONFIGURATIONEN
-- =============================================

-- Funktion um Standard-Channels zu erstellen
CREATE OR REPLACE FUNCTION create_default_server_stats_channels(p_server_id TEXT, p_config_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Standard Channel-Konfigurationen
    INSERT INTO server_stats_channels (server_id, config_id, stat_type, enabled, channel_name, position) VALUES
    (p_server_id, p_config_id, 'memberCount', true, '👥 Mitglieder: {count}', 0),
    (p_server_id, p_config_id, 'onlineCount', true, '🟢 Online: {count}', 1),
    (p_server_id, p_config_id, 'boostCount', true, '🚀 Boosts: {count}', 2),
    (p_server_id, p_config_id, 'channelCount', false, '📺 Kanäle: {count}', 3),
    (p_server_id, p_config_id, 'roleCount', false, '🎭 Rollen: {count}', 4),
    (p_server_id, p_config_id, 'serverLevel', false, '⭐ Level: {count}', 5),
    (p_server_id, p_config_id, 'createdDate', false, '📅 Erstellt: {date}', 6),
    (p_server_id, p_config_id, 'botCount', false, '🤖 Bots: {count}', 7)
    ON CONFLICT (server_id, stat_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ANALYTICS VIEWS
-- =============================================

-- Server Stats Analytics (letzte 7 Tage)
CREATE OR REPLACE VIEW server_stats_analytics AS
SELECT 
    server_id,
    DATE(timestamp) as date,
    AVG(member_count)::INTEGER as avg_member_count,
    MAX(member_count) as max_member_count,
    MIN(member_count) as min_member_count,
    AVG(online_count)::INTEGER as avg_online_count,
    MAX(online_count) as max_online_count,
    AVG(boost_count)::INTEGER as avg_boost_count,
    COUNT(*) as update_count,
    AVG(update_duration_ms)::INTEGER as avg_update_duration_ms,
    SUM(CASE WHEN success THEN 1 ELSE 0 END)::INTEGER as successful_updates,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END)::INTEGER as failed_updates
FROM server_stats_history 
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY server_id, DATE(timestamp)
ORDER BY server_id, date DESC;

-- =============================================
-- KOMMENTARE UND DOKUMENTATION
-- =============================================

COMMENT ON TABLE server_stats_config IS 'Hauptkonfiguration für Server Statistics System';
COMMENT ON TABLE server_stats_channels IS 'Konfiguration für einzelne Stats-Channels (memberCount, onlineCount, etc.)';
COMMENT ON TABLE server_stats_permissions IS 'Discord-Berechtigungen für Stats-Channels';
COMMENT ON TABLE server_stats_design IS 'Design-Einstellungen für Stats-Channels (Emojis, Farben, Format)';
COMMENT ON TABLE server_stats_history IS 'Verlauf der Server-Statistiken für Analytics';

COMMENT ON VIEW server_stats_complete IS 'Vollständige Server Stats Konfiguration (alle Tabellen zusammengefügt)';
COMMENT ON VIEW server_stats_active_channels IS 'Nur aktivierte Stats-Channels';
COMMENT ON VIEW server_stats_timer_status IS 'Timer-Status für automatische Updates';
COMMENT ON VIEW server_stats_analytics IS 'Analytics-Daten der letzten 7 Tage';

COMMENT ON FUNCTION create_server_stats_config(TEXT, JSONB) IS 'Erstellt oder aktualisiert komplette Server Stats Konfiguration';
COMMENT ON FUNCTION load_server_stats_config(TEXT) IS 'Lädt vollständige Server Stats Konfiguration als JSON';
COMMENT ON FUNCTION update_server_stats_timer(TEXT, BIGINT) IS 'Aktualisiert Timer-Status für automatische Updates';
COMMENT ON FUNCTION save_server_stats_history(TEXT, JSONB, INTEGER, BOOLEAN, TEXT) IS 'Speichert Server-Statistiken im Verlauf';
COMMENT ON FUNCTION cleanup_server_stats_history() IS 'Löscht alte History-Einträge (älter als 30 Tage)';

-- =============================================
-- ENDE DER MIGRATION
-- =============================================

-- Erfolgsmeldung
DO $$
BEGIN
    RAISE NOTICE '✅ Server Stats System Tabellen erfolgreich erstellt!';
    RAISE NOTICE '📊 Tabellen: server_stats_config, server_stats_channels, server_stats_permissions, server_stats_design, server_stats_history';
    RAISE NOTICE '🔍 Views: server_stats_complete, server_stats_active_channels, server_stats_timer_status, server_stats_analytics';
    RAISE NOTICE '⚙️ Funktionen: create_server_stats_config(), load_server_stats_config(), update_server_stats_timer(), save_server_stats_history()';
    RAISE NOTICE '🚀 Bereit für JSON-zu-Supabase Migration!';
END $$; 