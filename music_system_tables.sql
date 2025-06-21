-- ================================================
-- MUSIK SYSTEM TABELLEN FÜR SUPABASE
-- ================================================

-- Musik-System Haupteinstellungen
CREATE TABLE music_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT true,
    
    -- Lokale Musik Einstellungen
    local_music_enabled BOOLEAN DEFAULT true,
    music_directory TEXT DEFAULT './music',
    default_station TEXT DEFAULT 'custom1',
    auto_stop BOOLEAN DEFAULT false,
    show_now_playing BOOLEAN DEFAULT true,
    embed_color TEXT DEFAULT '0x00FF7F',
    
    -- Voice Channel Einstellungen
    preferred_channel_id TEXT DEFAULT '',
    auto_join BOOLEAN DEFAULT true,
    
    -- Ankündigungs Channel
    announcements_channel_id TEXT DEFAULT '',
    
    -- Interactive Panel Einstellungen
    interactive_panel_enabled BOOLEAN DEFAULT true,
    interactive_panel_channel_id TEXT DEFAULT '',
    interactive_panel_message_id TEXT DEFAULT '',
    interactive_panel_auto_update BOOLEAN DEFAULT true,
    interactive_panel_embed_color TEXT DEFAULT '0x00FF7F',
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Benutzerdefinierte Musik-Stationen
CREATE TABLE music_stations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    station_id TEXT NOT NULL, -- z.B. "custom1", "custom2"
    name TEXT NOT NULL,
    genre TEXT DEFAULT 'Hip-Hop',
    description TEXT DEFAULT '',
    logo TEXT DEFAULT '',
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(guild_id, station_id)
);

-- Songs in Stationen (Playlists)
CREATE TABLE music_station_songs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    station_id UUID REFERENCES music_stations(id) ON DELETE CASCADE,
    song_id TEXT NOT NULL, -- Dateiname ohne Erweiterung
    filename TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT DEFAULT 'Unbekannt',
    duration INTEGER DEFAULT 0, -- in Sekunden
    file_size BIGINT DEFAULT 0, -- in Bytes
    file_path TEXT NOT NULL,
    position INTEGER DEFAULT 0, -- Reihenfolge in der Playlist
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Musik-System Statistiken
CREATE TABLE music_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    
    -- Spielzeit-Statistiken
    total_songs_played INTEGER DEFAULT 0,
    total_playtime_seconds BIGINT DEFAULT 0,
    most_played_song TEXT DEFAULT '',
    most_played_station TEXT DEFAULT '',
    
    -- Letzte Aktivität
    last_song_played TEXT DEFAULT '',
    last_station_played TEXT DEFAULT '',
    last_played_at TIMESTAMP WITH TIME ZONE,
    
    -- Session-Daten
    current_volume INTEGER DEFAULT 50,
    is_currently_playing BOOLEAN DEFAULT false,
    current_song_id TEXT DEFAULT '',
    current_station_id TEXT DEFAULT '',
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(guild_id)
);

-- Verfügbare MP3-Dateien Cache
CREATE TABLE music_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id TEXT NOT NULL UNIQUE, -- Hash oder eindeutige ID
    filename TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT DEFAULT 'Unbekannt',
    duration INTEGER DEFAULT 0,
    file_size BIGINT DEFAULT 0,
    file_path TEXT NOT NULL,
    file_hash TEXT, -- MD5 oder SHA256 für Duplikatserkennung
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_scanned TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Musik-System Logs
CREATE TABLE music_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'play', 'stop', 'volume_change', 'station_create', etc.
    details JSONB, -- Zusätzliche Informationen als JSON
    user_id TEXT, -- Discord User ID (falls verfügbar)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- INDIZES FÜR BESSERE PERFORMANCE
-- ================================================

CREATE INDEX idx_music_settings_guild_id ON music_settings(guild_id);
CREATE INDEX idx_music_stations_guild_id ON music_stations(guild_id);
CREATE INDEX idx_music_station_songs_station_id ON music_station_songs(station_id);
CREATE INDEX idx_music_stats_guild_id ON music_stats(guild_id);
CREATE INDEX idx_music_files_file_id ON music_files(file_id);
CREATE INDEX idx_music_logs_guild_id ON music_logs(guild_id);
CREATE INDEX idx_music_logs_created_at ON music_logs(created_at);

-- ================================================
-- TRIGGER FÜR AUTOMATISCHE TIMESTAMPS
-- ================================================

-- Update Trigger für music_settings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_music_settings_updated_at 
    BEFORE UPDATE ON music_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_music_stations_updated_at 
    BEFORE UPDATE ON music_stations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_music_station_songs_updated_at 
    BEFORE UPDATE ON music_station_songs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_music_stats_updated_at 
    BEFORE UPDATE ON music_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_music_files_updated_at 
    BEFORE UPDATE ON music_files 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- BEISPIEL-DATEN (OPTIONAL)
-- ================================================

-- Beispiel Guild Settings
INSERT INTO music_settings (guild_id, enabled) 
VALUES ('1203994020779532348', true)
ON CONFLICT (guild_id) DO NOTHING;

-- Beispiel Station
INSERT INTO music_stations (guild_id, station_id, name, genre, description)
VALUES ('1203994020779532348', 'custom1', 'Meine Chill Playlist', 'Lofi', 'Entspannte Musik für den Alltag')
ON CONFLICT (guild_id, station_id) DO NOTHING;

-- Beispiel Stats
INSERT INTO music_stats (guild_id, current_volume)
VALUES ('1203994020779532348', 50)
ON CONFLICT (guild_id) DO NOTHING; 