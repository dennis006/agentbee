const { createClient } = require('@supabase/supabase-js');

// Supabase Client initialisieren
let supabase = null;

function initSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase Umgebungsvariablen fehlen!');
        console.log('Benötigt: SUPABASE_URL und SUPABASE_ANON_KEY');
        return false;
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase für Musik-System initialisiert');
    return true;
}

// ================================================
// MUSIK SETTINGS FUNKTIONEN
// ================================================

async function loadMusicSettingsFromDB(guildId) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase nicht initialisiert - verwende lokale Einstellungen');
            return null;
        }

        const { data, error } = await supabase
            .from('music_settings')
            .select('*')
            .eq('guild_id', guildId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('❌ Fehler beim Laden der Musik-Einstellungen:', error);
            return null;
        }

        if (!data) {
            console.log(`📝 Keine Musik-Einstellungen für Guild ${guildId} gefunden - erstelle Standardeinstellungen`);
            return await createDefaultMusicSettings(guildId);
        }

        // Konvertiere DB-Format zu internem Format
        const settings = {
            enabled: data.enabled,
            localMusic: {
                enabled: data.local_music_enabled,
                musicDirectory: data.music_directory,
                stations: [], // Wird separat geladen
                defaultStation: data.default_station,
                autoStop: data.auto_stop,
                showNowPlaying: data.show_now_playing,
                embedColor: data.embed_color
            },
            voiceChannel: {
                preferredChannelId: data.preferred_channel_id,
                autoJoin: data.auto_join
            },
            announcements: {
                channelId: data.announcements_channel_id
            },
            interactivePanel: {
                enabled: data.interactive_panel_enabled,
                channelId: data.interactive_panel_channel_id,
                messageId: data.interactive_panel_message_id,
                autoUpdate: data.interactive_panel_auto_update,
                embedColor: data.interactive_panel_embed_color
            }
        };

        // Lade Stationen separat
        settings.localMusic.stations = await loadMusicStationsFromDB(guildId);

        console.log(`✅ Musik-Einstellungen für Guild ${guildId} geladen`);
        return settings;

    } catch (error) {
        console.error('❌ Fehler beim Laden der Musik-Einstellungen:', error);
        return null;
    }
}

async function saveMusicSettingsToDB(guildId, settings) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase nicht initialisiert - kann nicht speichern');
            return false;
        }

        // Konvertiere internes Format zu DB-Format
        const dbData = {
            guild_id: guildId,
            enabled: settings.enabled,
            local_music_enabled: settings.localMusic?.enabled || true,
            music_directory: settings.localMusic?.musicDirectory || './music',
            default_station: settings.localMusic?.defaultStation || 'custom1',
            auto_stop: settings.localMusic?.autoStop || false,
            show_now_playing: settings.localMusic?.showNowPlaying || true,
            embed_color: settings.localMusic?.embedColor || '0x00FF7F',
            preferred_channel_id: settings.voiceChannel?.preferredChannelId || '',
            auto_join: settings.voiceChannel?.autoJoin || true,
            announcements_channel_id: settings.announcements?.channelId || '',
            interactive_panel_enabled: settings.interactivePanel?.enabled || true,
            interactive_panel_channel_id: settings.interactivePanel?.channelId || '',
            interactive_panel_message_id: settings.interactivePanel?.messageId || '',
            interactive_panel_auto_update: settings.interactivePanel?.autoUpdate || true,
            interactive_panel_embed_color: settings.interactivePanel?.embedColor || '0x00FF7F'
        };

        const { data, error } = await supabase
            .from('music_settings')
            .upsert(dbData, { onConflict: 'guild_id' })
            .select()
            .single();

        if (error) {
            console.error('❌ Fehler beim Speichern der Musik-Einstellungen:', error);
            return false;
        }

        // Speichere auch die Stationen
        if (settings.localMusic?.stations) {
            await saveMusicStationsToDB(guildId, settings.localMusic.stations);
        }

        console.log(`✅ Musik-Einstellungen für Guild ${guildId} gespeichert`);
        return true;

    } catch (error) {
        console.error('❌ Fehler beim Speichern der Musik-Einstellungen:', error);
        return false;
    }
}

async function createDefaultMusicSettings(guildId) {
    const defaultSettings = {
        enabled: true,
        localMusic: {
            enabled: true,
            musicDirectory: './music',
            stations: [],
            defaultStation: 'custom1',
            autoStop: false,
            showNowPlaying: true,
            embedColor: '0x00FF7F'
        },
        voiceChannel: {
            preferredChannelId: '',
            autoJoin: true
        },
        announcements: {
            channelId: ''
        },
        interactivePanel: {
            enabled: true,
            channelId: '',
            messageId: '',
            autoUpdate: true,
            embedColor: '0x00FF7F'
        }
    };

    await saveMusicSettingsToDB(guildId, defaultSettings);
    return defaultSettings;
}

// ================================================
// MUSIK STATIONEN FUNKTIONEN
// ================================================

async function loadMusicStationsFromDB(guildId) {
    try {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('music_stations')
            .select(`
                *,
                music_station_songs (
                    song_id,
                    filename,
                    title,
                    artist,
                    duration,
                    file_size,
                    file_path,
                    position
                )
            `)
            .eq('guild_id', guildId)
            .order('created_at');

        if (error) {
            console.error('❌ Fehler beim Laden der Musik-Stationen:', error);
            return [];
        }

        // Konvertiere zu internem Format
        const stations = data.map(station => ({
            id: station.station_id,
            name: station.name,
            genre: station.genre,
            description: station.description,
            logo: station.logo,
            playlist: station.music_station_songs
                .sort((a, b) => a.position - b.position)
                .map(song => ({
                    id: song.song_id,
                    filename: song.filename,
                    title: song.title,
                    artist: song.artist,
                    duration: song.duration,
                    size: song.file_size,
                    path: song.file_path
                }))
        }));

        return stations;

    } catch (error) {
        console.error('❌ Fehler beim Laden der Musik-Stationen:', error);
        return [];
    }
}

async function saveMusicStationsToDB(guildId, stations) {
    try {
        if (!supabase || !stations) return false;

        // Lösche alte Stationen für diese Guild
        await supabase
            .from('music_stations')
            .delete()
            .eq('guild_id', guildId);

        // Speichere neue Stationen
        for (const station of stations) {
            const { data: stationData, error: stationError } = await supabase
                .from('music_stations')
                .insert({
                    guild_id: guildId,
                    station_id: station.id,
                    name: station.name,
                    genre: station.genre,
                    description: station.description,
                    logo: station.logo
                })
                .select()
                .single();

            if (stationError) {
                console.error('❌ Fehler beim Speichern der Station:', stationError);
                continue;
            }

            // Speichere Songs der Station
            if (station.playlist && station.playlist.length > 0) {
                const songs = station.playlist.map((song, index) => ({
                    station_id: stationData.id,
                    song_id: song.id,
                    filename: song.filename,
                    title: song.title,
                    artist: song.artist,
                    duration: song.duration,
                    file_size: song.size,
                    file_path: song.path,
                    position: index
                }));

                const { error: songsError } = await supabase
                    .from('music_station_songs')
                    .insert(songs);

                if (songsError) {
                    console.error('❌ Fehler beim Speichern der Station-Songs:', songsError);
                }
            }
        }

        console.log(`✅ ${stations.length} Musik-Stationen für Guild ${guildId} gespeichert`);
        return true;

    } catch (error) {
        console.error('❌ Fehler beim Speichern der Musik-Stationen:', error);
        return false;
    }
}

// ================================================
// MUSIK STATISTIKEN FUNKTIONEN
// ================================================

async function loadMusicStatsFromDB(guildId) {
    try {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('music_stats')
            .select('*')
            .eq('guild_id', guildId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('❌ Fehler beim Laden der Musik-Statistiken:', error);
            return null;
        }

        if (!data) {
            // Erstelle Standard-Stats
            return await createDefaultMusicStats(guildId);
        }

        return {
            totalSongsPlayed: data.total_songs_played,
            totalPlaytimeSeconds: data.total_playtime_seconds,
            mostPlayedSong: data.most_played_song,
            mostPlayedStation: data.most_played_station,
            lastSongPlayed: data.last_song_played,
            lastStationPlayed: data.last_station_played,
            lastPlayedAt: data.last_played_at,
            currentVolume: data.current_volume,
            isCurrentlyPlaying: data.is_currently_playing,
            currentSongId: data.current_song_id,
            currentStationId: data.current_station_id
        };

    } catch (error) {
        console.error('❌ Fehler beim Laden der Musik-Statistiken:', error);
        return null;
    }
}

async function saveMusicStatsToDB(guildId, stats) {
    try {
        if (!supabase || !stats) return false;

        const dbData = {
            guild_id: guildId,
            total_songs_played: stats.totalSongsPlayed || 0,
            total_playtime_seconds: stats.totalPlaytimeSeconds || 0,
            most_played_song: stats.mostPlayedSong || '',
            most_played_station: stats.mostPlayedStation || '',
            last_song_played: stats.lastSongPlayed || '',
            last_station_played: stats.lastStationPlayed || '',
            last_played_at: stats.lastPlayedAt || null,
            current_volume: stats.currentVolume || 50,
            is_currently_playing: stats.isCurrentlyPlaying || false,
            current_song_id: stats.currentSongId || '',
            current_station_id: stats.currentStationId || ''
        };

        const { error } = await supabase
            .from('music_stats')
            .upsert(dbData, { onConflict: 'guild_id' });

        if (error) {
            console.error('❌ Fehler beim Speichern der Musik-Statistiken:', error);
            return false;
        }

        return true;

    } catch (error) {
        console.error('❌ Fehler beim Speichern der Musik-Statistiken:', error);
        return false;
    }
}

async function createDefaultMusicStats(guildId) {
    const defaultStats = {
        totalSongsPlayed: 0,
        totalPlaytimeSeconds: 0,
        mostPlayedSong: '',
        mostPlayedStation: '',
        lastSongPlayed: '',
        lastStationPlayed: '',
        lastPlayedAt: null,
        currentVolume: 50,
        isCurrentlyPlaying: false,
        currentSongId: '',
        currentStationId: ''
    };

    await saveMusicStatsToDB(guildId, defaultStats);
    return defaultStats;
}

// ================================================
// MUSIK LOGS FUNKTIONEN
// ================================================

async function logMusicAction(guildId, action, details = {}, userId = null) {
    try {
        if (!supabase) return false;

        const { error } = await supabase
            .from('music_logs')
            .insert({
                guild_id: guildId,
                action: action,
                details: details,
                user_id: userId
            });

        if (error) {
            console.error('❌ Fehler beim Loggen der Musik-Aktion:', error);
            return false;
        }

        return true;

    } catch (error) {
        console.error('❌ Fehler beim Loggen der Musik-Aktion:', error);
        return false;
    }
}

// ================================================
// MUSIK DATEIEN CACHE FUNKTIONEN
// ================================================

async function updateMusicFilesCache(files) {
    try {
        if (!supabase || !files) return false;

        // Lösche alte Cache-Einträge
        await supabase.from('music_files').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // Füge neue Dateien hinzu
        const fileData = files.map(file => ({
            file_id: file.id,
            filename: file.filename,
            title: file.title,
            artist: file.artist,
            duration: file.duration,
            file_size: file.size,
            file_path: file.path,
            file_hash: null // Könnte später für Duplikatserkennung verwendet werden
        }));

        const { error } = await supabase
            .from('music_files')
            .insert(fileData);

        if (error) {
            console.error('❌ Fehler beim Aktualisieren des Musik-Datei-Cache:', error);
            return false;
        }

        console.log(`✅ ${files.length} Musik-Dateien im Cache aktualisiert`);
        return true;

    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren des Musik-Datei-Cache:', error);
        return false;
    }
}

module.exports = {
    initSupabase,
    loadMusicSettingsFromDB,
    saveMusicSettingsToDB,
    loadMusicStationsFromDB,
    saveMusicStationsToDB,
    loadMusicStatsFromDB,
    saveMusicStatsToDB,
    logMusicAction,
    updateMusicFilesCache
}; 