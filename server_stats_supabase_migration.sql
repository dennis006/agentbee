-- =====================================================
-- DISCORD BOT - SERVER STATS SYSTEM SUPABASE MIGRATION
-- =====================================================
-- Komplette Migration von JSON zu Supabase Datenbank
-- Erstellt: 2024
-- System: Server Statistiken mit automatischen Updates
-- Ersetzt: server-stats-settings.json und alle JSON-Abhängigkeiten
-- =====================================================

-- Lösche bestehende Tabellen falls vorhanden (für saubere Migration)
DROP TABLE IF EXISTS server_stats_analytics CASCADE;
DROP TABLE IF EXISTS server_stats_activities CASCADE;
DROP TABLE IF EXISTS server_stats_timer CASCADE;
DROP TABLE IF EXISTS server_stats_history CASCADE;
DROP TABLE IF EXISTS server_stats_current CASCADE;
DROP TABLE IF EXISTS server_stats_channels CASCADE;
DROP TABLE IF EXISTS server_stats_config CASCADE;

-- Lösche Views
DROP VIEW IF EXISTS view_server_stats_analytics_dashboard CASCADE;
DROP VIEW IF EXISTS view_server_stats_active_channels CASCADE;
DROP VIEW IF EXISTS view_server_stats_overview CASCADE;

-- Lösche Funktionen
DROP FUNCTION IF EXISTS daily_server_stats_maintenance() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_server_stats_data(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS log_server_stats_activity(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_current_stats(TEXT, JSON) CASCADE;
DROP FUNCTION IF EXISTS update_timer_status(TEXT, JSON) CASCADE;
DROP FUNCTION IF EXISTS save_server_stats_config(TEXT, JSON) CASCADE;
DROP FUNCTION IF EXISTS get_server_stats_config(TEXT) CASCADE;
DROP FUNCTION IF EXISTS initialize_default_server_stats(TEXT) CASCADE;

-- ============================
-- 1. HAUPTTABELLEN
-- ============================

-- Server Stats Hauptkonfiguration (ersetzt server-stats-settings.json)
CREATE TABLE server_stats_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT true,
    update_interval INTEGER DEFAULT 300000, -- 5 Minuten in Millisekunden
    category_id TEXT DEFAULT '',
    category_name TEXT DEFAULT '📊 Server Statistiken',
    
    -- Berechtigungen
    permissions_view_channel BOOLEAN DEFAULT true,
    permissions_connect BOOLEAN DEFAULT false,
    permissions_speak BOOLEAN DEFAULT false,
    permissions_use_vad BOOLEAN DEFAULT false,
    
    -- Design-Einstellungen
    design_emoji TEXT DEFAULT '📊',
    design_color TEXT DEFAULT '0x00FF7F',
    design_separator TEXT DEFAULT ' • ',
    design_format TEXT DEFAULT 'modern',
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_stats_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_update_time BIGINT DEFAULT 0, -- Unix timestamp in milliseconds
    
    -- Zusätzliche Einstellungen
    auto_repair_channels BOOLEAN DEFAULT true,
    cleanup_duplicates BOOLEAN DEFAULT true,
    log_activities BOOLEAN DEFAULT true
);

-- Server Stats Channels Konfiguration
CREATE TABLE server_stats_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    stat_type TEXT NOT NULL, -- memberCount, onlineCount, boostCount, etc.
    enabled BOOLEAN DEFAULT false,
    channel_id TEXT DEFAULT '',
    name_template TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    
    -- Zusätzliche Channel-Einstellungen
    last_value TEXT DEFAULT '',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    update_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT DEFAULT '',
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(guild_id, stat_type),
    FOREIGN KEY (guild_id) REFERENCES server_stats_config(guild_id) ON DELETE CASCADE
);

-- Aktuelle Server Statistiken (Live-Daten)
CREATE TABLE server_stats_current (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    
    -- Server Informationen
    server_name TEXT DEFAULT '',
    server_icon TEXT DEFAULT '',
    
    -- Statistiken
    member_count INTEGER DEFAULT 0,
    online_count INTEGER DEFAULT 0,
    boost_count INTEGER DEFAULT 0,
    channel_count INTEGER DEFAULT 0,
    role_count INTEGER DEFAULT 0,
    server_level INTEGER DEFAULT 0,
    created_date TEXT DEFAULT '',
    bot_count INTEGER DEFAULT 0,
    
    -- Zusätzliche Stats
    voice_channel_count INTEGER DEFAULT 0,
    text_channel_count INTEGER DEFAULT 0,
    category_count INTEGER DEFAULT 0,
    thread_count INTEGER DEFAULT 0,
    emoji_count INTEGER DEFAULT 0,
    sticker_count INTEGER DEFAULT 0,
    
    -- Berechnete Werte
    growth_rate DECIMAL(5,2) DEFAULT 0,
    activity_score INTEGER DEFAULT 0,
    
    -- Metadaten
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculation_duration INTEGER DEFAULT 0, -- in Millisekunden
    data_quality_score INTEGER DEFAULT 100,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (guild_id) REFERENCES server_stats_config(guild_id) ON DELETE CASCADE
);

-- Server Stats Historie (für Analytics)
CREATE TABLE server_stats_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    
    -- Statistiken zum Zeitpunkt
    member_count INTEGER DEFAULT 0,
    online_count INTEGER DEFAULT 0,
    boost_count INTEGER DEFAULT 0,
    channel_count INTEGER DEFAULT 0,
    role_count INTEGER DEFAULT 0,
    server_level INTEGER DEFAULT 0,
    bot_count INTEGER DEFAULT 0,
    
    -- Zusätzliche Daten
    voice_channel_count INTEGER DEFAULT 0,
    text_channel_count INTEGER DEFAULT 0,
    activity_score INTEGER DEFAULT 0,
    
    -- Zeitstempel
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index für bessere Performance
    FOREIGN KEY (guild_id) REFERENCES server_stats_config(guild_id) ON DELETE CASCADE
);

-- Timer Status für das Frontend
CREATE TABLE server_stats_timer (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    
    -- Timer-Daten
    enabled BOOLEAN DEFAULT false,
    last_update_time BIGINT DEFAULT 0, -- Unix timestamp in milliseconds
    next_update_time BIGINT DEFAULT 0,
    total_interval INTEGER DEFAULT 300000,
    time_remaining INTEGER DEFAULT 0,
    progress DECIMAL(5,2) DEFAULT 0.0,
    
    -- Status
    is_running BOOLEAN DEFAULT false,
    last_error TEXT DEFAULT '',
    error_count INTEGER DEFAULT 0,
    successful_updates INTEGER DEFAULT 0,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (guild_id) REFERENCES server_stats_config(guild_id) ON DELETE CASCADE
);

-- Channel Activities Log
CREATE TABLE server_stats_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    
    -- Activity Details
    activity_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'repair', 'cleanup', 'reset'
    stat_type TEXT DEFAULT '', -- memberCount, onlineCount, etc.
    channel_id TEXT DEFAULT '',
    
    -- Action Details
    old_value TEXT DEFAULT '',
    new_value TEXT DEFAULT '',
    success BOOLEAN DEFAULT true,
    error_message TEXT DEFAULT '',
    duration INTEGER DEFAULT 0, -- in Millisekunden
    
    -- Metadata
    performed_by TEXT DEFAULT 'system', -- 'system', 'user', 'api'
    ip_address TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (guild_id) REFERENCES server_stats_config(guild_id) ON DELETE CASCADE
);

-- Analytics und Performance Metriken
CREATE TABLE server_stats_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    
    -- Performance Metriken
    average_update_time INTEGER DEFAULT 0, -- in Millisekunden
    update_success_rate DECIMAL(5,2) DEFAULT 100.0,
    channel_health_score INTEGER DEFAULT 100,
    
    -- Usage Statistics
    total_updates INTEGER DEFAULT 0,
    failed_updates INTEGER DEFAULT 0,
    channels_created INTEGER DEFAULT 0,
    channels_deleted INTEGER DEFAULT 0,
    channels_repaired INTEGER DEFAULT 0,
    
    -- Growth Analytics
    member_growth_7d INTEGER DEFAULT 0,
    member_growth_30d INTEGER DEFAULT 0,
    boost_growth_7d INTEGER DEFAULT 0,
    boost_growth_30d INTEGER DEFAULT 0,
    
    -- Zeitraum
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(guild_id, date_from, date_to),
    FOREIGN KEY (guild_id) REFERENCES server_stats_config(guild_id) ON DELETE CASCADE
);

-- ============================
-- 2. INDIZES FÜR PERFORMANCE
-- ============================

-- Hauptindizes
CREATE INDEX idx_server_stats_config_guild_id ON server_stats_config(guild_id);
CREATE INDEX idx_server_stats_channels_guild_id ON server_stats_channels(guild_id);
CREATE INDEX idx_server_stats_channels_stat_type ON server_stats_channels(stat_type);
CREATE INDEX idx_server_stats_channels_enabled ON server_stats_channels(enabled);
CREATE INDEX idx_server_stats_current_guild_id ON server_stats_current(guild_id);
CREATE INDEX idx_server_stats_history_guild_id ON server_stats_history(guild_id);
CREATE INDEX idx_server_stats_history_recorded_at ON server_stats_history(recorded_at);
CREATE INDEX idx_server_stats_timer_guild_id ON server_stats_timer(guild_id);
CREATE INDEX idx_server_stats_activities_guild_id ON server_stats_activities(guild_id);
CREATE INDEX idx_server_stats_activities_created_at ON server_stats_activities(created_at);
CREATE INDEX idx_server_stats_analytics_guild_id ON server_stats_analytics(guild_id);
CREATE INDEX idx_server_stats_analytics_date_range ON server_stats_analytics(date_from, date_to);

-- Zusammengesetzte Indizes
CREATE INDEX idx_server_stats_channels_guild_enabled ON server_stats_channels(guild_id, enabled);
CREATE INDEX idx_server_stats_history_guild_date ON server_stats_history(guild_id, recorded_at);
CREATE INDEX idx_server_stats_activities_guild_type ON server_stats_activities(guild_id, activity_type);

-- ============================
-- 3. VIEWS FÜR EINFACHE ABFRAGEN
-- ============================

-- Komplette Server Stats Übersicht
CREATE VIEW view_server_stats_overview AS
SELECT 
    c.guild_id,
    c.enabled,
    c.update_interval,
    c.category_id,
    c.category_name,
    c.last_stats_update,
    c.last_update_time,
    
    -- Channel Counts
    COUNT(ch.id) as total_channels,
    COUNT(CASE WHEN ch.enabled THEN 1 END) as enabled_channels,
    COUNT(CASE WHEN ch.channel_id != '' THEN 1 END) as created_channels,
    
    -- Current Stats
    cs.member_count,
    cs.online_count,
    cs.boost_count,
    cs.server_level,
    cs.server_name,
    cs.server_icon,
    
    -- Timer Status
    t.is_running as timer_running,
    t.progress as timer_progress,
    t.time_remaining,
    
    -- Performance  
    COALESCE(ch_stats.avg_update_time, 0) as avg_update_time,
    COALESCE(ch_stats.error_rate, 0) as error_rate
    
FROM server_stats_config c
LEFT JOIN server_stats_channels ch ON c.guild_id = ch.guild_id
LEFT JOIN server_stats_current cs ON c.guild_id = cs.guild_id
LEFT JOIN server_stats_timer t ON c.guild_id = t.guild_id
LEFT JOIN (
    SELECT 
        guild_id,
        AVG(update_count) as avg_update_time,
        (SUM(error_count)::DECIMAL / NULLIF(SUM(update_count), 0) * 100) as error_rate
    FROM server_stats_channels 
    GROUP BY guild_id
) ch_stats ON c.guild_id = ch_stats.guild_id
GROUP BY c.guild_id, c.enabled, c.update_interval, c.category_id, c.category_name, 
         c.last_stats_update, c.last_update_time, cs.member_count, cs.online_count, 
         cs.boost_count, cs.server_level, cs.server_name, cs.server_icon,
         t.is_running, t.progress, t.time_remaining, ch_stats.avg_update_time, ch_stats.error_rate;

-- Aktive Channels View
CREATE VIEW view_server_stats_active_channels AS
SELECT 
    ch.guild_id,
    ch.stat_type,
    ch.enabled,
    ch.channel_id,
    ch.name_template,
    ch.position,
    ch.last_value,
    ch.last_updated,
    ch.update_count,
    ch.error_count,
    
    -- Current Stats für diesen Channel
    CASE ch.stat_type
        WHEN 'memberCount' THEN cs.member_count::TEXT
        WHEN 'onlineCount' THEN cs.online_count::TEXT
        WHEN 'boostCount' THEN cs.boost_count::TEXT
        WHEN 'channelCount' THEN cs.channel_count::TEXT
        WHEN 'roleCount' THEN cs.role_count::TEXT
        WHEN 'serverLevel' THEN cs.server_level::TEXT
        WHEN 'createdDate' THEN cs.created_date
        WHEN 'botCount' THEN cs.bot_count::TEXT
        ELSE '0'
    END as current_value
    
FROM server_stats_channels ch
LEFT JOIN server_stats_current cs ON ch.guild_id = cs.guild_id
WHERE ch.enabled = true
ORDER BY ch.guild_id, ch.position;

-- Analytics Dashboard View
CREATE OR REPLACE VIEW view_server_stats_analytics_dashboard AS
SELECT 
    c.guild_id,
    c.enabled,
    cs.server_name,
    cs.member_count,
    cs.online_count,
    cs.boost_count,
    
    -- Channel Status
    COUNT(ch.id) as total_channels,
    COUNT(CASE WHEN ch.enabled THEN 1 END) as active_channels,
    COUNT(CASE WHEN ch.channel_id != '' AND ch.enabled THEN 1 END) as working_channels,
    
    -- Performance Metriken (letzte 7 Tage)
    COALESCE(recent_activities.total_updates, 0) as updates_7d,
    COALESCE(recent_activities.successful_updates, 0) as successful_updates_7d,
    COALESCE(recent_activities.error_updates, 0) as error_updates_7d,
    
    -- Growth (basierend auf History)
    COALESCE(growth.member_growth_7d, 0) as member_growth_7d,
    COALESCE(growth.boost_growth_7d, 0) as boost_growth_7d,
    
    -- Last Update Info
    c.last_stats_update,
    t.is_running as timer_running,
    t.progress as timer_progress
    
FROM server_stats_config c
LEFT JOIN server_stats_current cs ON c.guild_id = cs.guild_id
LEFT JOIN server_stats_channels ch ON c.guild_id = ch.guild_id
LEFT JOIN server_stats_timer t ON c.guild_id = t.guild_id
LEFT JOIN (
    SELECT 
        guild_id,
        COUNT(*) as total_updates,
        COUNT(CASE WHEN success THEN 1 END) as successful_updates,
        COUNT(CASE WHEN NOT success THEN 1 END) as error_updates
    FROM server_stats_activities
    WHERE created_at >= NOW() - INTERVAL '7 days'
        AND activity_type = 'update'
    GROUP BY guild_id
) recent_activities ON c.guild_id = recent_activities.guild_id
LEFT JOIN (
    SELECT 
        guild_id,
        (
            SELECT member_count 
            FROM server_stats_history h1 
            WHERE h1.guild_id = h.guild_id 
            ORDER BY recorded_at DESC 
            LIMIT 1
        ) - (
            SELECT member_count 
            FROM server_stats_history h2 
            WHERE h2.guild_id = h.guild_id 
                AND recorded_at >= NOW() - INTERVAL '7 days'
            ORDER BY recorded_at ASC 
            LIMIT 1
        ) as member_growth_7d,
        (
            SELECT boost_count 
            FROM server_stats_history h1 
            WHERE h1.guild_id = h.guild_id 
            ORDER BY recorded_at DESC 
            LIMIT 1
        ) - (
            SELECT boost_count 
            FROM server_stats_history h2 
            WHERE h2.guild_id = h.guild_id 
                AND recorded_at >= NOW() - INTERVAL '7 days'
            ORDER BY recorded_at ASC 
            LIMIT 1
        ) as boost_growth_7d
    FROM server_stats_history h
    GROUP BY guild_id
) growth ON c.guild_id = growth.guild_id
GROUP BY c.guild_id, c.enabled, cs.server_name, cs.member_count, cs.online_count, 
         cs.boost_count, c.last_stats_update, t.is_running, t.progress,
         recent_activities.total_updates, recent_activities.successful_updates, 
         recent_activities.error_updates, growth.member_growth_7d, growth.boost_growth_7d;

-- ============================
-- 4. FUNKTIONEN
-- ============================

-- Funktion: Lade komplette Server Stats Konfiguration
CREATE OR REPLACE FUNCTION get_server_stats_config(p_guild_id TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'enabled', c.enabled,
        'updateInterval', c.update_interval,
        'categoryId', c.category_id,
        'categoryName', c.category_name,
        'permissions', json_build_object(
            'viewChannel', c.permissions_view_channel,
            'connect', c.permissions_connect,
            'speak', c.permissions_speak,
            'useVAD', c.permissions_use_vad
        ),
        'design', json_build_object(
            'emoji', c.design_emoji,
            'color', c.design_color,
            'separator', c.design_separator,
            'format', c.design_format
        ),
        'channels', (
            SELECT json_object_agg(
                ch.stat_type,
                json_build_object(
                    'enabled', ch.enabled,
                    'channelId', ch.channel_id,
                    'name', ch.name_template,
                    'position', ch.position
                )
            )
            FROM server_stats_channels ch
            WHERE ch.guild_id = p_guild_id
        )
    )
    INTO result
    FROM server_stats_config c
    WHERE c.guild_id = p_guild_id;
    
    RETURN COALESCE(result, '{}'::JSON);
END;
$$ LANGUAGE plpgsql;

-- Funktion: Speichere Server Stats Konfiguration
CREATE OR REPLACE FUNCTION save_server_stats_config(p_guild_id TEXT, p_config JSON)
RETURNS BOOLEAN AS $$
DECLARE
    channel_key TEXT;
    channel_config JSON;
BEGIN
    -- Hauptkonfiguration speichern/aktualisieren
    INSERT INTO server_stats_config (
        guild_id, enabled, update_interval, category_id, category_name,
        permissions_view_channel, permissions_connect, permissions_speak, permissions_use_vad,
        design_emoji, design_color, design_separator, design_format,
        updated_at
    ) VALUES (
        p_guild_id,
        (p_config->>'enabled')::BOOLEAN,
        (p_config->>'updateInterval')::INTEGER,
        COALESCE(p_config->>'categoryId', ''),
        COALESCE(p_config->>'categoryName', '📊 Server Statistiken'),
        COALESCE((p_config->'permissions'->>'viewChannel')::BOOLEAN, true),
        COALESCE((p_config->'permissions'->>'connect')::BOOLEAN, false),
        COALESCE((p_config->'permissions'->>'speak')::BOOLEAN, false),
        COALESCE((p_config->'permissions'->>'useVAD')::BOOLEAN, false),
        COALESCE(p_config->'design'->>'emoji', '📊'),
        COALESCE(p_config->'design'->>'color', '0x00FF7F'),
        COALESCE(p_config->'design'->>'separator', ' • '),
        COALESCE(p_config->'design'->>'format', 'modern'),
        NOW()
    )
    ON CONFLICT (guild_id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        update_interval = EXCLUDED.update_interval,
        category_id = EXCLUDED.category_id,
        category_name = EXCLUDED.category_name,
        permissions_view_channel = EXCLUDED.permissions_view_channel,
        permissions_connect = EXCLUDED.permissions_connect,
        permissions_speak = EXCLUDED.permissions_speak,
        permissions_use_vad = EXCLUDED.permissions_use_vad,
        design_emoji = EXCLUDED.design_emoji,
        design_color = EXCLUDED.design_color,
        design_separator = EXCLUDED.design_separator,
        design_format = EXCLUDED.design_format,
        updated_at = NOW();
    
    -- Channels konfiguration speichern
    IF p_config ? 'channels' THEN
        -- Zuerst alle bestehenden Channels für diese Guild löschen
        DELETE FROM server_stats_channels WHERE guild_id = p_guild_id;
        
        -- Dann neue Channels einfügen
        FOR channel_key IN SELECT json_object_keys(p_config->'channels')
        LOOP
            channel_config := p_config->'channels'->channel_key;
            
            INSERT INTO server_stats_channels (
                guild_id, stat_type, enabled, channel_id, name_template, position, updated_at
            ) VALUES (
                p_guild_id,
                channel_key,
                (channel_config->>'enabled')::BOOLEAN,
                COALESCE(channel_config->>'channelId', ''),
                COALESCE(channel_config->>'name', ''),
                COALESCE((channel_config->>'position')::INTEGER, 0),
                NOW()
            );
        END LOOP;
    END IF;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Update Timer Status
CREATE OR REPLACE FUNCTION update_timer_status(p_guild_id TEXT, p_timer_data JSON)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO server_stats_timer (
        guild_id, enabled, last_update_time, next_update_time, 
        total_interval, time_remaining, progress, is_running, updated_at
    ) VALUES (
        p_guild_id,
        (p_timer_data->>'enabled')::BOOLEAN,
        (p_timer_data->>'lastUpdateTime')::BIGINT,
        (p_timer_data->>'nextUpdateTime')::BIGINT,
        (p_timer_data->>'totalInterval')::INTEGER,
        (p_timer_data->>'timeRemaining')::INTEGER,
        (p_timer_data->>'progress')::DECIMAL,
        (p_timer_data->>'isRunning')::BOOLEAN,
        NOW()
    )
    ON CONFLICT (guild_id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        last_update_time = EXCLUDED.last_update_time,
        next_update_time = EXCLUDED.next_update_time,
        total_interval = EXCLUDED.total_interval,
        time_remaining = EXCLUDED.time_remaining,
        progress = EXCLUDED.progress,
        is_running = EXCLUDED.is_running,
        updated_at = NOW();
        
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Update Current Stats
CREATE OR REPLACE FUNCTION update_current_stats(p_guild_id TEXT, p_stats JSON)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO server_stats_current (
        guild_id, server_name, server_icon,
        member_count, online_count, boost_count, channel_count, 
        role_count, server_level, created_date, bot_count,
        voice_channel_count, text_channel_count, category_count,
        updated_at, last_calculated
    ) VALUES (
        p_guild_id,
        COALESCE(p_stats->>'serverName', ''),
        COALESCE(p_stats->>'serverIcon', ''),
        COALESCE((p_stats->>'memberCount')::INTEGER, 0),
        COALESCE((p_stats->>'onlineCount')::INTEGER, 0),
        COALESCE((p_stats->>'boostCount')::INTEGER, 0),
        COALESCE((p_stats->>'channelCount')::INTEGER, 0),
        COALESCE((p_stats->>'roleCount')::INTEGER, 0),
        COALESCE((p_stats->>'serverLevel')::INTEGER, 0),
        COALESCE(p_stats->>'createdDate', ''),
        COALESCE((p_stats->>'botCount')::INTEGER, 0),
        COALESCE((p_stats->>'voiceChannelCount')::INTEGER, 0),
        COALESCE((p_stats->>'textChannelCount')::INTEGER, 0),
        COALESCE((p_stats->>'categoryCount')::INTEGER, 0),
        NOW(),
        NOW()
    )
    ON CONFLICT (guild_id) DO UPDATE SET
        server_name = EXCLUDED.server_name,
        server_icon = EXCLUDED.server_icon,
        member_count = EXCLUDED.member_count,
        online_count = EXCLUDED.online_count,
        boost_count = EXCLUDED.boost_count,
        channel_count = EXCLUDED.channel_count,
        role_count = EXCLUDED.role_count,
        server_level = EXCLUDED.server_level,
        created_date = EXCLUDED.created_date,
        bot_count = EXCLUDED.bot_count,
        voice_channel_count = EXCLUDED.voice_channel_count,
        text_channel_count = EXCLUDED.text_channel_count,
        category_count = EXCLUDED.category_count,
        updated_at = NOW(),
        last_calculated = NOW();
        
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Log Activity
CREATE OR REPLACE FUNCTION log_server_stats_activity(
    p_guild_id TEXT,
    p_activity_type TEXT,
    p_stat_type TEXT DEFAULT '',
    p_channel_id TEXT DEFAULT '',
    p_old_value TEXT DEFAULT '',
    p_new_value TEXT DEFAULT '',
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT '',
    p_duration INTEGER DEFAULT 0,
    p_performed_by TEXT DEFAULT 'system'
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO server_stats_activities (
        guild_id, activity_type, stat_type, channel_id,
        old_value, new_value, success, error_message,
        duration, performed_by, created_at
    ) VALUES (
        p_guild_id, p_activity_type, p_stat_type, p_channel_id,
        p_old_value, p_new_value, p_success, p_error_message,
        p_duration, p_performed_by, NOW()
    )
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Bereinige alte Daten
CREATE OR REPLACE FUNCTION cleanup_old_server_stats_data(p_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Lösche alte Historie-Einträge (behalte letzte 30 Tage)
    DELETE FROM server_stats_history 
    WHERE recorded_at < NOW() - INTERVAL '1 day' * p_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Lösche alte Activity-Logs (behalte letzte 7 Tage)
    DELETE FROM server_stats_activities 
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Funktion: Initialisiere Standard Server Stats
CREATE OR REPLACE FUNCTION initialize_default_server_stats(p_guild_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Hauptkonfiguration
    INSERT INTO server_stats_config (guild_id) 
    VALUES (p_guild_id)
    ON CONFLICT (guild_id) DO NOTHING;
    
    -- Standard Channels
    INSERT INTO server_stats_channels (guild_id, stat_type, enabled, name_template, position) VALUES
    (p_guild_id, 'memberCount', true, '👥 Mitglieder: {count}', 0),
    (p_guild_id, 'onlineCount', true, '🟢 Online: {count}', 1),
    (p_guild_id, 'boostCount', true, '🚀 Boosts: {count}', 2),
    (p_guild_id, 'channelCount', false, '📺 Kanäle: {count}', 3),
    (p_guild_id, 'roleCount', false, '🎭 Rollen: {count}', 4),
    (p_guild_id, 'serverLevel', false, '⭐ Level: {count}', 5),
    (p_guild_id, 'createdDate', false, '📅 Erstellt: {date}', 6),
    (p_guild_id, 'botCount', false, '🤖 Bots: {count}', 7)
    ON CONFLICT (guild_id, stat_type) DO NOTHING;
    
    -- Timer initialisieren
    INSERT INTO server_stats_timer (guild_id, enabled, total_interval) 
    VALUES (p_guild_id, false, 300000)
    ON CONFLICT (guild_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- 5. TRIGGER
-- ============================

-- Auto-Update Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für alle Tabellen mit updated_at
CREATE TRIGGER update_server_stats_config_updated_at
    BEFORE UPDATE ON server_stats_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_stats_channels_updated_at
    BEFORE UPDATE ON server_stats_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_stats_current_updated_at
    BEFORE UPDATE ON server_stats_current
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_stats_timer_updated_at
    BEFORE UPDATE ON server_stats_timer
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-Historie bei Stats-Updates
CREATE OR REPLACE FUNCTION create_stats_history_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Nur wenn sich wichtige Werte geändert haben
    IF (OLD.member_count != NEW.member_count OR 
        OLD.online_count != NEW.online_count OR 
        OLD.boost_count != NEW.boost_count OR
        OLD.server_level != NEW.server_level) THEN
        
        INSERT INTO server_stats_history (
            guild_id, member_count, online_count, boost_count,
            channel_count, role_count, server_level, bot_count,
            voice_channel_count, text_channel_count, activity_score,
            recorded_at
        ) VALUES (
            NEW.guild_id, NEW.member_count, NEW.online_count, NEW.boost_count,
            NEW.channel_count, NEW.role_count, NEW.server_level, NEW.bot_count,
            NEW.voice_channel_count, NEW.text_channel_count, NEW.activity_score,
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_stats_history
    AFTER UPDATE ON server_stats_current
    FOR EACH ROW EXECUTE FUNCTION create_stats_history_entry();

-- ============================
-- 6. WARTUNGS-FUNKTIONEN
-- ============================

-- Automatische Bereinigung (täglich ausführen)
CREATE OR REPLACE FUNCTION daily_server_stats_maintenance()
RETURNS TEXT AS $$
DECLARE
    cleaned_records INTEGER;
    result TEXT;
BEGIN
    -- Bereinige alte Daten
    SELECT cleanup_old_server_stats_data() INTO cleaned_records;
    
    -- Aktualisiere Analytics
    -- (Hier könnten weitere Wartungsaufgaben stehen)
    
    result := format('Wartung abgeschlossen. %s alte Datensätze bereinigt.', cleaned_records);
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- MIGRATION COMPLETE! 
-- ============================

-- Informationen für Entwickler:
COMMENT ON TABLE server_stats_config IS 'Hauptkonfiguration für Server Stats System - ersetzt server-stats-settings.json';
COMMENT ON TABLE server_stats_channels IS 'Channel-Konfigurationen für verschiedene Statistik-Typen';
COMMENT ON TABLE server_stats_current IS 'Aktuelle Live-Statistiken der Server';
COMMENT ON TABLE server_stats_history IS 'Historische Daten für Analytics und Trends';
COMMENT ON TABLE server_stats_timer IS 'Timer-Status für Frontend Progress-Bars';
COMMENT ON TABLE server_stats_activities IS 'Log aller Aktivitäten und Änderungen';
COMMENT ON TABLE server_stats_analytics IS 'Zusammengefasste Analytics und Performance-Metriken';

-- Migration erfolgreich!
SELECT 'Server Stats Supabase Migration erfolgreich abgeschlossen!' as status; 