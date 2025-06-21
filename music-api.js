const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    VoiceConnectionStatus, 
    AudioPlayerStatus,
    entersState,
    getVoiceConnection,
    StreamType
} = require('@discordjs/voice');

const fs = require('fs');
const path = require('path');
const play = require('play-dl');
const prism = require('prism-media');

// Music Settings mit Radio UND lokalen MP3s
let musicSettings = {
    enabled: true,
    radio: {
        enabled: true,
        stations: [
            {
                id: "lofi",
                name: "Lofi Hip Hop Radio",
                url: "http://streams.ilovemusic.de/iloveradio-lounge.mp3",
                genre: "Lofi/Chill", 
                country: "International",
                description: "Chill Lofi Hip Hop Beats",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM2NjMzOTkiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TG9GaTwvdGV4dD4KPC9zdmc+Cg=="
            },
            {
                id: "chillhop",
                name: "ChillHop Radio",
                url: "http://stream.laut.fm/chillhop",
                genre: "Chillhop/Jazz",
                country: "International", 
                description: "Chill beats to relax/study to",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM0NEFBODgiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q2hpbGxIb3A8L3RleHQ+Cjwvc3ZnPgo="
            },
            {
                id: "deephouse",
                name: "Deep House Radio",
                url: "http://stream.laut.fm/deephouse",
                genre: "Deep House/Electronic",
                country: "International",
                description: "24/7 Deep House Radio Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMwMDMzNjYiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMEZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRFRVA8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSI0NCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMDBGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5IT1VTRTI8L3RleHQ+Cjwvc3ZnPgo="
            },
            {
                id: "trapmusic",
                name: "Trap Music Radio",
                url: "http://stream.laut.fm/trap",
                genre: "Trap/Hip-Hop",
                country: "USA",
                description: "24/7 Trap Music Radio Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRjAwNzciLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VFJBUDwvdGV4dD4KPC9zdmc+Cg=="
            },
            {
                id: "gaming",
                name: "Gaming Music Radio",
                url: "http://stream.laut.fm/gaming",
                genre: "Gaming/Electronic",
                country: "International",
                description: "24/7 Gaming Music Radio Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMwMEZGMDAiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdBTUlORzwvdGV4dD4KPHRleHQgeD0iMzIiIHk9IjQ0IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk1VU0lDPC90ZXh0Pgo8L3N2Zz4K"
            },
            {
                id: "jazzhop",
                name: "Jazz Hop Cafe",
                url: "http://stream.laut.fm/jazzhop",
                genre: "Jazz Hop/Chill",
                country: "International",
                description: "24/7 Jazz Hop Cafe Radio Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM4QjQ1MTMiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNGRkQ3MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkpBWlo8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSI0NCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjRkZENzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5IT1A8L3RleHQ+Cjwvc3ZnPgo="
            },
            {
                id: "retrowave",
                name: "Retrowave Radio",
                url: "http://stream.laut.fm/retrowave",
                genre: "Retrowave/80s",
                country: "International",
                description: "24/7 Retrowave Radio Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRjAwRkYiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5SRVRST1dBVkU8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSI0NCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+MjQvNzwvdGV4dD4KPC9zdmc+Cg=="
            },
            {
                id: "bassmusic",
                name: "Bass Music Radio",
                url: "http://stream.laut.fm/bass",
                genre: "Bass/Dubstep",
                country: "International",
                description: "24/7 Bass Music Radio Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRjAwMDAiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QkFTUzwvdGV4dD4KPC9zdmc+Cg=="
            }
        ],
        defaultStation: "lofi",
        autoStop: false,
        showNowPlaying: true,
        embedColor: "#FF6B6B"
    },
    localMusic: {
        enabled: true,
        musicDirectory: './music',
        stations: [], // Benutzerdefinierte Stationen mit MP3 Playlists
        defaultStation: "custom1",
        autoStop: false,
        showNowPlaying: true,
        embedColor: "#FF6B6B"
    },
    voiceChannel: {
        preferredChannelId: "",
        autoJoin: true
    },
    announcements: {
        channelId: ""
    },
    interactivePanel: {
        enabled: true,
        channelId: "",
        messageId: "",
        autoUpdate: true,
        embedColor: "#FF6B6B"
    }
};

// Voice Connections und Players
const voiceConnections = new Map(); // guild -> connection
const audioPlayers = new Map(); // guild -> player
const currentStations = new Map(); // guildId -> current station
const currentSongs = new Map(); // guildId -> current song info
const currentRadioStations = new Map(); // guildId -> current radio station

// Genre-Liste für Dropdown
const musicGenres = [
    'Hip-Hop', 'Rap', 'Trap', 'Lofi', 'Chill', 'Electronic', 'House', 'Techno',
    'Dubstep', 'Bass', 'Jazz', 'Blues', 'Rock', 'Pop', 'Classical', 'Ambient',
    'Gaming', 'Synthwave', 'Retrowave', 'R&B', 'Soul', 'Funk', 'Reggae',
    'Country', 'Folk', 'Metal', 'Punk', 'Indie', 'Alternative', 'Experimental'
];

// MP3-Dateien im music/ Ordner scannen
function scanMusicDirectory() {
    try {
        const musicDir = path.resolve(musicSettings.localMusic.musicDirectory);
        
        if (!fs.existsSync(musicDir)) {
            console.log('📁 Musik-Ordner nicht gefunden, erstelle...');
            fs.mkdirSync(musicDir, { recursive: true });
            return [];
        }

        const files = fs.readdirSync(musicDir);
        const mp3Files = files.filter(file => 
            file.toLowerCase().endsWith('.mp3') || 
            file.toLowerCase().endsWith('.wav') ||
            file.toLowerCase().endsWith('.m4a')
        );

        console.log(`🎵 ${mp3Files.length} Audio-Dateien gefunden:`, mp3Files);
        
        return mp3Files.map(filename => {
            const filePath = path.join(musicDir, filename);
            const stats = fs.statSync(filePath);
            
            return {
                id: filename.replace(/\.[^/.]+$/, ""), // Dateiname ohne Erweiterung
                filename: filename,
                title: filename.replace(/\.[^/.]+$/, ""), // Fallback title
                artist: "Unbekannt",
                duration: 0, // Könnte später mit einer Audio-Library ermittelt werden
                size: stats.size,
                path: filePath
            };
        });
    } catch (error) {
        console.error('❌ Fehler beim Scannen des Musik-Ordners:', error);
        return [];
    }
}

function loadMusicSettings() {
    try {
        if (fs.existsSync('music-settings.json')) {
            const data = fs.readFileSync('music-settings.json', 'utf8');
            const loadedSettings = JSON.parse(data);
            musicSettings = { ...musicSettings, ...loadedSettings };
            console.log('🎵 Musik-Einstellungen geladen');
        } else {
            saveMusicSettings();
            console.log('🎵 Standard-Musik-Einstellungen erstellt');
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Musik-Einstellungen:', error);
    }
}

function saveMusicSettings() {
    try {
        fs.writeFileSync('music-settings.json', JSON.stringify(musicSettings, null, 2));
        console.log('💾 Musik-Einstellungen gespeichert');
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Musik-Einstellungen:', error);
    }
}

// Voice Connection Management
async function joinVoiceChannelSafe(channel) {
    try {
        console.log(`🔊 Versuche Voice-Channel "${channel.name}" beizutreten...`);
        
        const botMember = channel.guild.members.cache.get(global.client.user.id);
        if (!botMember) {
            console.error('❌ Bot-Member nicht gefunden');
            return null;
        }
        
        const permissions = channel.permissionsFor(botMember);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            console.error('❌ Bot hat keine Voice-Permissions!');
            return null;
        }
        
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });

        voiceConnections.set(channel.guild.id, connection);
        
        connection.on('stateChange', (oldState, newState) => {
            console.log(`🔊 Voice-Connection: ${oldState.status} → ${newState.status}`);
        });
        
        connection.on('error', (error) => {
            console.error('❌ Voice-Connection Error:', error);
        });
        
        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 15000);
            console.log(`✅ Bot ist Voice-Channel "${channel.name}" beigetreten`);
        } catch (readyError) {
            console.log('⚠️ Ready-Status Timeout, aber Connection könnte trotzdem funktionieren');
        }
        
        return connection;
    } catch (error) {
        console.error('❌ Fehler beim Beitreten des Voice-Channels:', error);
        return null;
    }
}

function leaveVoiceChannel(guildId) {
    const connection = voiceConnections.get(guildId);
    if (connection) {
        connection.destroy();
        voiceConnections.delete(guildId);
        audioPlayers.delete(guildId);
        currentStations.delete(guildId);
        currentSongs.delete(guildId);
        console.log('👋 Voice-Channel verlassen');
    }
}

// Audio Player Management
function createPlayerForGuild(guildId) {
    if (!audioPlayers.has(guildId)) {
        console.log(`🎮 Erstelle neuen AudioPlayer für Guild ${guildId}`);
        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: 'pause',
                maxMissedFrames: Math.round(5000 / 20)
            }
        });
        audioPlayers.set(guildId, player);
        
        player.on(AudioPlayerStatus.Playing, () => {
            console.log('🎵 Musik: Playing');
        });
        
        player.on(AudioPlayerStatus.Paused, () => {
            console.log('⏸️ Musik: Paused');
        });
        
        player.on(AudioPlayerStatus.Idle, () => {
            console.log('💤 Musik: Idle - Song beendet');
            // Hier könnte automatisch das nächste Lied gespielt werden
        });

        player.on('error', error => {
            console.error('❌ Music Player Fehler:', error);
        });
        
        console.log('✅ Music AudioPlayer erstellt');
    }
    return audioPlayers.get(guildId);
}

// Music Functions
function getAvailableSongs() {
    return scanMusicDirectory();
}

function getMusicStations() {
    return musicSettings.localMusic?.stations || [];
}

function getMusicStation(stationId) {
    const stations = getMusicStations();
    return stations.find(station => station.id === stationId);
}

// Radio System Functions 
function getRadioStations() {
    return musicSettings.radio?.stations || [];
}

function getRadioStation(stationId) {
    const stations = getRadioStations();
    return stations.find(station => station.id === stationId);
}

// Lokale MP3 abspielen
async function playLocalSong(guildId, songId) {
    try {
        const availableSongs = getAvailableSongs();
        const song = availableSongs.find(s => s.id === songId || s.filename === songId);
        
        if (!song) {
            throw new Error(`Song "${songId}" nicht gefunden`);
        }

        console.log(`🎵 Spiele lokalen Song ab: ${song.title}`);

        // Auto-Join falls nicht im Voice-Channel
        let connection = voiceConnections.get(guildId);
        if (!connection) {
            console.log('📻 Auto-Join für Musik-Wiedergabe');
            const autoJoinSuccess = await autoJoinForMusic(guildId);
            if (!autoJoinSuccess) {
                throw new Error('Bot konnte keinem Voice-Channel beitreten');
            }
            connection = voiceConnections.get(guildId);
        }

        // Erstelle Player
        const player = createPlayerForGuild(guildId);

        // Erstelle lokale Datei-Ressource
        const resource = createAudioResource(song.path, {
            inputType: StreamType.Arbitrary,
            inlineVolume: true
        });

        if (resource.volume) {
            resource.volume.setVolume(0.5); // 50% Volume
        }

        // Spiele ab
        player.play(resource);
        connection.subscribe(player);

        // Setze als aktueller Song
        currentSongs.set(guildId, song);

        console.log(`✅ Song ${song.title} gestartet`);
        
        // Sende Now-Playing Nachricht
        if (musicSettings.localMusic?.showNowPlaying && musicSettings.announcements?.channelId) {
            await sendNowPlayingMessage(guildId, song);
        }

        return true;

    } catch (error) {
        console.error(`❌ Fehler beim Abspielen des Songs:`, error);
        throw error;
    }
}

// Station-Wiedergabe (spielt alle Songs einer Station ab)
async function playMusicStation(guildId, stationId) {
    try {
        const station = getMusicStation(stationId);
        if (!station) {
            throw new Error(`Station "${stationId}" nicht gefunden`);
        }

        if (!station.playlist || station.playlist.length === 0) {
            throw new Error(`Station "${station.name}" hat keine Songs`);
        }

        console.log(`📻 Starte Station: ${station.name} mit ${station.playlist.length} Songs`);

        // Spiele ersten Song der Station
        const firstSong = station.playlist[0];
        const success = await playLocalSong(guildId, firstSong.id);
        
        if (success) {
            // Setze aktuelle Station
            currentStations.set(guildId, station);
            
            // Update Interactive Panel
            if (musicSettings.interactivePanel?.enabled) {
                await updateInteractiveMusicPanel(guildId, true);
            }
        }

        return success;

    } catch (error) {
        console.error(`❌ Fehler beim Starten der Station:`, error);
        throw error;
    }
}

// Radio Station abspielen
async function playRadioStation(guildId, stationId) {
    try {
        const station = getRadioStation(stationId);
        if (!station) {
            throw new Error(`Radio-Station "${stationId}" nicht gefunden`);
        }

        console.log(`📻 Starte Radio-Station: ${station.name} für Guild ${guildId}`);
        console.log(`📻 Station URL: ${station.url}`);

        // Auto-Join falls nicht im Voice-Channel
        let connection = voiceConnections.get(guildId);
        if (!connection) {
            console.log('📻 Auto-Join für Radio-Wiedergabe');
            const autoJoinSuccess = await autoJoinForRadio(guildId);
            if (!autoJoinSuccess) {
                throw new Error('Bot konnte keinem Voice-Channel beitreten');
            }
            connection = voiceConnections.get(guildId);
        }

        if (!connection) {
            throw new Error('Keine Voice-Connection verfügbar');
        }

        // Erstelle Player
        const player = createPlayerForGuild(guildId);

        let resource;

        // Behandle verschiedene URL-Typen
        if (station.url.includes('youtube.com') || station.url.includes('youtu.be')) {
            console.log('📻 YouTube-Stream erkannt, verwende play-dl...');
            try {
                // Für YouTube-URLs verwende play-dl
                const stream = await play.stream(station.url, {
                    quality: 1 // Niedrigste Qualität für bessere Performance
                });
                
                resource = createAudioResource(stream.stream, {
                    inputType: stream.type,
                    inlineVolume: true
                });
            } catch (playError) {
                console.error('❌ play-dl Fehler:', playError);
                // Fallback zu direktem Stream
                resource = createAudioResource(station.url, {
                    inputType: StreamType.Arbitrary,
                    inlineVolume: true
                });
            }
        } else {
            console.log('📻 HTTP-Stream über FFmpeg...');
            try {
                // Verwende FFmpeg über prism-media für bessere Kompatibilität
                const ffmpegArgs = [
                    '-i', station.url,
                    '-analyzeduration', '0',
                    '-loglevel', '0',
                    '-f', 's16le',
                    '-ar', '48000',
                    '-ac', '2',
                    '-'
                ];
                
                const ffmpeg = new prism.FFmpeg({
                    args: ffmpegArgs,
                    shell: false
                });
                
                resource = createAudioResource(ffmpeg, {
                    inputType: StreamType.Raw,
                    inlineVolume: true
                });
                
                ffmpeg.on('error', (error) => {
                    console.error('❌ FFmpeg Stream Error:', error);
                });
                
            } catch (ffmpegError) {
                console.error('❌ FFmpeg failed, fallback zu direktem Stream:', ffmpegError);
                // Fallback zu direktem Stream
                resource = createAudioResource(station.url, {
                    inputType: StreamType.Arbitrary,
                    inlineVolume: true
                });
            }
        }

        if (resource.volume) {
            resource.volume.setVolume(0.3); // 30% Volume für bessere Performance
        }

        // Event-Listener für bessere Fehlerbehandlung
        player.on(AudioPlayerStatus.Playing, () => {
            console.log(`✅ Radio spielt: ${station.name}`);
        });

        player.on(AudioPlayerStatus.Buffering, () => {
            console.log(`🔄 Radio buffert: ${station.name}`);
        });

        player.on(AudioPlayerStatus.Idle, (oldState) => {
            console.log(`⏸️ Radio idle: ${station.name} (von ${oldState.status})`);
            
            // Wenn der Stream unexpectedly idle wird, versuche neu zu starten
            if (oldState.status === AudioPlayerStatus.Playing || oldState.status === AudioPlayerStatus.Buffering) {
                console.log('🔄 Stream unterbrochen, versuche Neustart...');
                setTimeout(async () => {
                    if (currentRadioStations.has(guildId)) {
                        try {
                            await playRadioStation(guildId, stationId);
                        } catch (error) {
                            console.error('❌ Neustart fehlgeschlagen:', error);
                        }
                    }
                }, 3000);
            }
        });

        player.on('error', (error) => {
            console.error(`❌ Radio Player Fehler:`, error);
            console.error(`❌ Error Stack:`, error.stack);
            
            // Versuche neu zu starten
            setTimeout(async () => {
                if (currentRadioStations.has(guildId)) {
                    console.log('🔄 Versuche Radio nach Fehler neu zu starten...');
                    try {
                        await playRadioStation(guildId, stationId);
                    } catch (retryError) {
                        console.error('❌ Neustart nach Fehler fehlgeschlagen:', retryError);
                    }
                }
            }, 5000);
        });

        // Resource Error Handling
        resource.playStream.on('error', (error) => {
            console.error(`❌ Audio Resource Stream Fehler:`, error);
        });

        // Spiele ab
        player.play(resource);
        connection.subscribe(player);

        // Setze als aktueller Radio-Sender
        currentRadioStations.set(guildId, station);

        console.log(`✅ Radio-Station ${station.name} gestartet`);
        
        // Update Interactive Panel
        updateInteractiveRadioPanel(guildId, true);
        
        // Sende Now-Playing Nachricht
        if (musicSettings.radio?.showNowPlaying && musicSettings.announcements?.channelId) {
            await sendRadioNowPlayingMessage(guildId, station);
        }

        return true;

    } catch (error) {
        console.error(`❌ Fehler beim Starten der Radio-Station:`, error);
        console.error(`❌ Error Details:`, {
            message: error.message,
            stack: error.stack,
            stationId,
            guildId
        });
        throw error;
    }
}



function stopMusic(guildId) {
    try {
        console.log(`📻 Stoppe Musik für Guild ${guildId}`);
        
        // Entferne aktuellen Song und Station
        currentSongs.delete(guildId);
        currentStations.delete(guildId);
        
        // Stoppe Player
        const player = audioPlayers.get(guildId);
        if (player) {
            player.stop();
        }

        // Update Interactive Panel
        if (musicSettings.interactivePanel?.enabled) {
            updateInteractiveMusicPanel(guildId, true);
        }

        console.log(`✅ Musik gestoppt`);
        return true;

    } catch (error) {
        console.error(`❌ Fehler beim Stoppen der Musik:`, error);
        return false;
    }
}

function getCurrentSong(guildId) {
    return currentSongs.get(guildId) || null;
}

function getCurrentStation(guildId) {
    return currentStations.get(guildId) || null;
}

function isPlayingMusic(guildId) {
    return currentSongs.has(guildId) || currentStations.has(guildId);
}

function stopRadio(guildId) {
    try {
        console.log(`📻 Stoppe Radio für Guild ${guildId}`);
        
        // Entferne aktuellen Radio-Sender
        currentRadioStations.delete(guildId);
        
        // Stoppe Player
        const player = audioPlayers.get(guildId);
        if (player) {
            player.stop();
        }

        // Update Interactive Panel
        updateInteractiveRadioPanel(guildId, true);

        console.log(`✅ Radio gestoppt`);
        return true;

    } catch (error) {
        console.error(`❌ Fehler beim Stoppen des Radios:`, error);
        return false;
    }
}

function getCurrentRadioStation(guildId) {
    return currentRadioStations.get(guildId) || null;
}

function isPlayingRadio(guildId) {
    return currentRadioStations.has(guildId);
}

// Auto-Join für Musik
async function autoJoinForMusic(guildId) {
    try {
        console.log(`🤖 Auto-Join für Musik gestartet: ${guildId}`);
        
        if (!global.client) {
            console.log('❌ global.client nicht verfügbar');
            return false;
        }
        
        const guild = global.client.guilds.cache.get(guildId);
        if (!guild) {
            console.log(`❌ Guild ${guildId} nicht gefunden`);
            return false;
        }
        
        // Finde Voice-Channels mit Usern
        const voiceChannelsWithUsers = guild.channels.cache.filter(channel => 
            channel.isVoiceBased() && 
            channel.members.size > 0 &&
            !channel.members.every(member => member.user.bot)
        );
        
        const allVoiceChannels = guild.channels.cache.filter(channel => 
            channel.isVoiceBased() && 
            channel.joinable
        );
        
        let targetChannel;
        
        if (voiceChannelsWithUsers.size > 0) {
            targetChannel = voiceChannelsWithUsers.sort((a, b) => b.members.size - a.members.size).first();
        } else if (allVoiceChannels.size > 0) {
            targetChannel = allVoiceChannels.first();
        }
        
        if (!targetChannel) {
            console.log('❌ Keine beitretbaren Voice-Channels gefunden');
            return false;
        }
        
        console.log(`🎵 Auto-Join: Trete ${targetChannel.name} bei`);
        const joinResult = await joinVoiceChannelSafe(targetChannel);
        
        return !!joinResult;
    } catch (error) {
        console.error('❌ Fehler beim Auto-Join:', error);
        return false;
    }
}

// Now Playing Message für lokale Songs
async function sendNowPlayingMessage(guildId, song) {
    try {
        if (!musicSettings.announcements?.channelId || !global.client) return;
        
        const guild = global.client.guilds.cache.get(guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(musicSettings.announcements.channelId);
        if (!channel) return;

        const embed = {
            title: '🎵 Spielt jetzt',
            description: `**${song.title}**\nby ${song.artist}`,
            color: parseInt(musicSettings.localMusic?.embedColor?.replace('#', '') || 'FF6B6B', 16),
            fields: [
                {
                    name: '📁 Datei',
                    value: song.filename,
                    inline: true
                },
                {
                    name: '💾 Größe', 
                    value: `${Math.round(song.size / 1024 / 1024)}MB`,
                    inline: true
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Lokales Musik System',
                icon_url: 'https://cdn.discordapp.com/emojis/852475899236630548.webp?size=128&quality=lossless'
            }
        };

        await channel.send({ embeds: [embed] });
        console.log(`🎵 Now-Playing Nachricht gesendet für Song: ${song.title}`);
    } catch (error) {
        console.error('❌ Fehler beim Senden der Now-Playing Nachricht:', error);
    }
}

async function sendRadioNowPlayingMessage(guildId, station) {
    try {
        if (!musicSettings.announcements?.channelId) return;

        const guild = global.client?.guilds.cache.get(guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(musicSettings.announcements.channelId);
        if (!channel) return;
        
        const embed = {
            color: parseInt(musicSettings.radio?.embedColor?.replace('#', '') || 'FF6B6B', 16),
            title: '📻 Radio läuft jetzt',
            description: `**${station.name}** wird abgespielt`,
            fields: [
                {
                    name: '🎵 Genre',
                    value: station.genre,
                    inline: true
                },
                {
                    name: '🌍 Land',
                    value: station.country,
                    inline: true
                },
                {
                    name: '📝 Beschreibung',
                    value: station.description,
                    inline: false
                }
            ],
            thumbnail: {
                url: station.logo
            },
            timestamp: new Date().toISOString(),
            footer: {
                text: '📻 YouTube Radio-Modus • Einfaches Discord Radio System'
            }
        };

        await channel.send({ embeds: [embed] });

    } catch (error) {
        console.error('❌ Fehler beim Senden der Radio Now-Playing Nachricht:', error);
    }
}

// Interactive Panel für Musik-System
async function updateInteractiveMusicPanel(guildId, forceUpdate = false) {
    try {
        // Placeholder - könnte in Zukunft ein Interactive Panel für Musik-Steuerung haben
        console.log(`🎵 Music Panel Update für Guild: ${guildId} (${forceUpdate ? 'forced' : 'auto'})`);
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Music Panel Update:', error);
        return false;
    }
}

// Interactive Panel für Radio-Auswahl
async function createInteractiveRadioPanel(guildId) {
    try {
        const guild = global.client?.guilds.cache.get(guildId);
        if (!guild) {
            console.log('❌ Guild nicht gefunden für Interactive Panel');
            return null;
        }

        const embedColor = parseInt(musicSettings.interactivePanel?.embedColor?.replace('#', '') || 'FF6B6B', 16);
        const currentStation = getCurrentRadioStation(guildId);

        const embed = {
            color: embedColor,
            title: '📻 Radio Panel',
            description: '**Wähle einen Radio-Stream!**\n\n' +
                        '🎯 **Wie funktioniert es?**\n' +
                        '• Klicke auf "📻 Radio auswählen"\n' +
                        '• Wähle einen der verfügbaren Streams\n' +
                        '• Der Bot joint automatisch deinen Voice-Channel!\n\n' +
                        '🎧 **Verfügbare Streams:**\n' +
                        '• 24/7 Radio-Streams\n' +
                        '• Lofi, ChillHop, Gaming Music & mehr\n' +
                        '• Einfach und zuverlässig',
            fields: [],
            footer: {
                text: '📻 Einfaches Radio System'
            },
            timestamp: new Date().toISOString()
        };

        // Zeige aktuellen Radio-Stream
        if (currentStation) {
            embed.fields.push({
                name: '📻 Aktuell läuft',
                value: `**${currentStation.name}**\n${currentStation.description}`,
                inline: false
            });
        } else {
            embed.fields.push({
                name: '📻 Radio Status',
                value: '🔇 Kein Radio-Stream aktiv\nWähle einen Stream aus der Liste!',
                inline: false
            });
        }

        // Erstelle Buttons
        const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
        
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('radio_select')
                    .setLabel('📻 Radio auswählen')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('radio_stop')
                    .setLabel('⏹️ Radio stoppen')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(!currentStation)
            );

        return { embeds: [embed], components: [buttons] };

    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Radio Panels:', error);
        return null;
    }
}

async function postInteractiveRadioPanel(guildId) {
    try {
        console.log(`📻 Starte Interactive Radio Panel Management für Guild: ${guildId}`);
        
        const guild = global.client?.guilds.cache.get(guildId);
        if (!guild) {
            console.log(`❌ Guild ${guildId} nicht gefunden`);
            return false;
        }

        const channelId = musicSettings.interactivePanel.channelId;
        console.log(`🔍 Suche Channel: "${channelId}"`);
        
        // Suche Channel nach ID (nicht Name!)
        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            console.log(`❌ Channel "${channelId}" nicht gefunden in Guild ${guild.name}`);
            console.log(`📋 Verfügbare Text-Channels:`, guild.channels.cache.filter(ch => ch.type === 0).map(ch => `${ch.name} (${ch.id})`).join(', '));
            return false;
        }

        console.log(`📻 Channel gefunden: #${channel.name} (ID: ${channel.id})`);

        // Prüfe ob bereits ein Panel existiert
        const existingMessageId = musicSettings.interactivePanel.messageId;
        if (existingMessageId) {
            console.log(`🔄 Existierende Panel-Message gefunden: ${existingMessageId}`);
            
            try {
                const existingMessage = await channel.messages.fetch(existingMessageId);
                if (existingMessage) {
                    console.log('✅ Panel existiert bereits - aktualisiere es');
                    return await updateInteractiveRadioPanel(guildId, true);
                }
            } catch (error) {
                console.log('⚠️ Existierende Message nicht mehr gültig, erstelle neue');
                // Message existiert nicht mehr, erstelle neue
                musicSettings.interactivePanel.messageId = '';
            }
        }

        // Erstelle neues Panel
        console.log(`📻 Erstelle neues Interactive Radio Panel in #${channel.name}`);

        const panelData = await createInteractiveRadioPanel(guildId);
        if (!panelData) {
            console.log('❌ Konnte Panel-Daten nicht erstellen');
            return false;
        }

        // Poste neue Message
        const message = await channel.send(panelData);
        
        // Speichere Message ID
        musicSettings.interactivePanel.messageId = message.id;
        saveMusicSettings();

        console.log(`✅ Radio Panel erfolgreich erstellt: ${message.id} in #${channel.name}`);
        return true;

    } catch (error) {
        console.error('❌ Fehler beim Panel Management:', error);
        console.error('❌ Error Stack:', error.stack);
        return false;
    }
}

async function updateInteractiveRadioPanel(guildId, forceUpdate = false) {
    try {
        // Prüfe Auto-Update Setting nur wenn nicht forced
        if (!forceUpdate && !musicSettings.interactivePanel.autoUpdate) {
            console.log('📻 Panel Update übersprungen - Auto-Update deaktiviert');
            return true; // Kein Fehler, nur übersprungen
        }

        // Prüfe ob Client verfügbar ist
        if (!global.client) {
            console.log('⚠️ Discord Client nicht verfügbar');
            return false;
        }

        const guild = global.client.guilds.cache.get(guildId);
        if (!guild) {
            console.log(`⚠️ Guild ${guildId} nicht gefunden`);
            return false;
        }

        const channelId = musicSettings.interactivePanel.channelId;
        const messageId = musicSettings.interactivePanel.messageId;
        
        if (!channelId) {
            console.log('⚠️ Kein Channel für Interactive Panel konfiguriert');
            return false;
        }

        if (!messageId) {
            console.log('⚠️ Keine Message-ID für Interactive Panel konfiguriert');
            return false;
        }

        // Suche Channel nach ID
        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            console.log(`⚠️ Channel "${channelId}" nicht gefunden`);
            return false;
        }

        // Versuche Nachricht zu fetchen
        let message;
        try {
            message = await channel.messages.fetch(messageId);
        } catch (fetchError) {
            console.log(`⚠️ Nachricht ${messageId} nicht gefunden:`, fetchError.message);
            return false;
        }

        if (!message) {
            console.log(`⚠️ Nachricht ${messageId} ist null`);
            return false;
        }

        // Erstelle Panel-Daten
        const panelData = await createInteractiveRadioPanel(guildId);
        if (!panelData) {
            console.log('⚠️ Konnte Panel-Daten nicht erstellen');
            return false;
        }

        // Aktualisiere Nachricht
        try {
            await message.edit(panelData);
            console.log('🔄 Radio Panel erfolgreich aktualisiert');
            return true;
        } catch (editError) {
            console.log('⚠️ Fehler beim Bearbeiten der Panel-Nachricht:', editError.message);
            return false;
        }

    } catch (error) {
        console.error('❌ Unerwarteter Fehler beim Aktualisieren des Radio Panels:', error);
        return false;
    }
}

// Button Interactions
async function handleRadioSelectButton(interaction) {
    try {
        const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

        const stations = getMusicStations();
        
        // Discord erlaubt nur maximal 25 Optionen - beschränke auf die ersten 25
        const limitedStations = stations.slice(0, 25);
        
        const options = limitedStations.map(station => ({
            label: station.name,
            value: station.id,
            description: `${station.genre} • ${station.description.substring(0, 50)}`,
            emoji: station.genre.includes('Lofi') ? '🎵' : 
                   station.genre.includes('Gaming') ? '🎮' : 
                   station.genre.includes('Bass') ? '🔊' : '📻'
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('radio_station_select')
            .setPlaceholder('Wähle einen Radio-Stream...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Zeige Info wenn mehr als 25 Sender verfügbar sind
        const contentText = stations.length > 25 
            ? `📻 **Wähle deinen Radio-Stream:** (${limitedStations.length} von ${stations.length} Sendern)`
            : '📻 **Wähle deinen Radio-Stream:**';

        await interaction.reply({
            content: contentText,
            components: [row],
            ephemeral: true
        });

    } catch (error) {
        console.error('❌ Fehler beim Radio Select Button:', error);
        await interaction.reply({
            content: '❌ Ein Fehler ist aufgetreten.',
            ephemeral: true
        });
    }
}

async function handleRadioStationSelect(interaction) {
    try {
        const stationId = interaction.values[0];
        const guildId = interaction.guild.id;

        console.log(`📻 Radio-Station ausgewählt: ${stationId} von ${interaction.user.tag}`);

        await interaction.deferReply({ ephemeral: true });

        const success = await playRadioStation(guildId, stationId);
        
        if (success) {
            const station = getRadioStation(stationId);
            await interaction.editReply({
                content: `✅ **${station.name}** wird jetzt abgespielt! 📻`
            });
            
            // Update Panel
            await updateInteractiveRadioPanel(guildId);
        } else {
            await interaction.editReply({
                content: '❌ Fehler beim Starten des Radio-Streams.'
            });
        }

    } catch (error) {
        console.error('❌ Fehler beim Radio Station Select:', error);
        await interaction.editReply({
            content: '❌ Ein Fehler ist beim Starten des Radios aufgetreten.'
        });
    }
}

async function handleRadioStopButton(interaction) {
    try {
        const guildId = interaction.guild.id;

        await interaction.deferReply({ ephemeral: true });

        const success = stopRadio(guildId);
        
        if (success) {
            await interaction.editReply({
                content: '⏹️ Radio gestoppt!'
            });
            
            // Update Panel
            await updateInteractiveRadioPanel(guildId);
        } else {
            await interaction.editReply({
                content: '❌ Fehler beim Stoppen des Radios.'
            });
        }

    } catch (error) {
        console.error('❌ Fehler beim Radio Stop Button:', error);
        await interaction.editReply({
            content: '❌ Ein Fehler ist aufgetreten.'
        });
    }
}

// API Endpoints
function registerMusicAPI(app) {
    console.log('🎵 Registriere Musik API...');

    // Get music settings
    app.get('/api/music/settings', (req, res) => {
        res.json({
            success: true,
            settings: musicSettings
        });
    });

    // Save music settings
    app.post('/api/music/settings', (req, res) => {
        try {
            musicSettings = { ...musicSettings, ...req.body };
            saveMusicSettings();
            res.json({
                success: true,
                message: 'Musik-Einstellungen gespeichert'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get Channels (für Channel-Auswahl im Frontend)
    app.get('/api/music/channels/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            console.log(`🔍 Channels Request für Guild: ${guildId}`);
            
            if (!client || !client.guilds) {
                console.log('❌ Bot nicht verfügbar');
                return res.status(500).json({ error: 'Bot nicht verfügbar' });
            }

            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                console.log(`❌ Guild ${guildId} nicht gefunden`);
                console.log(`📋 Verfügbare Guilds: ${client.guilds.cache.map(g => `${g.name} (${g.id})`).join(', ')}`);
                return res.status(404).json({ error: 'Guild nicht gefunden' });
            }

            console.log(`✅ Guild gefunden: ${guild.name}`);

            // Text-Channels sammeln
            const textChannels = guild.channels.cache
                .filter(channel => channel.type === 0) // GUILD_TEXT
                .map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    type: 'text'
                }));

            // Voice-Channels sammeln
            const voiceChannels = guild.channels.cache
                .filter(channel => channel.type === 2) // GUILD_VOICE
                .map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    type: 'voice'
                }));

            const allChannels = [...textChannels, ...voiceChannels];
            console.log(`📺 Gefundene Channels: ${allChannels.length} (${textChannels.length} Text, ${voiceChannels.length} Voice)`);
            
            res.json(allChannels);
        } catch (error) {
            console.error('❌ Fehler beim Abrufen der Channels:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Channels' });
        }
    });

    // Get verfügbare Songs
    app.get('/api/music/songs', (req, res) => {
        try {
            const songs = getAvailableSongs();
            res.json({
                success: true,
                songs: songs,
                count: songs.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get Genre-Liste
    app.get('/api/music/genres', (req, res) => {
        try {
            res.json({
                success: true,
                genres: musicGenres
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get Radio-Stationen
    app.get('/api/music/radio/stations', (req, res) => {
        try {
            const stations = getRadioStations();
            res.json({
                success: true,
                stations: stations,
                enabled: musicSettings.radio?.enabled || false
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get Musik-Stationen (lokale MP3s)
    app.get('/api/music/stations', (req, res) => {
        try {
            const stations = getMusicStations();
            res.json({
                success: true,
                stations: stations,
                enabled: musicSettings.localMusic?.enabled || false
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get current radio status
    app.get('/api/music/radio/:guildId/status', (req, res) => {
        try {
            const { guildId } = req.params;
            const currentStation = getCurrentRadioStation(guildId);
            const isPlaying = isPlayingRadio(guildId);
            
            res.json({
                success: true,
                isPlaying: isPlaying,
                currentStation: currentStation
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get current music status
    app.get('/api/music/status/:guildId', (req, res) => {
        try {
            const { guildId } = req.params;
            const currentSong = getCurrentSong(guildId);
            const currentStation = getCurrentStation(guildId);
            const isPlaying = isPlayingMusic(guildId);
            
            res.json({
                success: true,
                isPlaying: isPlaying,
                currentSong: currentSong,
                currentStation: currentStation
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Play Song
    app.post('/api/music/play/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { songId } = req.body;

            if (!songId) {
                return res.status(400).json({
                    success: false,
                    error: 'Song ID ist erforderlich'
                });
            }

            const success = await playLocalSong(guildId, songId);
            
            if (success) {
                const song = getAvailableSongs().find(s => s.id === songId);
                res.json({
                    success: true,
                    message: `🎵 ${song?.title || songId} wird gespielt!`,
                    song: song
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Abspielen des Songs'
                });
            }

        } catch (error) {
            console.error('❌ Song Play Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Play Radio Station
    app.post('/api/music/radio/:guildId/play', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { stationId } = req.body;

            if (!stationId) {
                return res.status(400).json({
                    success: false,
                    error: 'Station-ID erforderlich'
                });
            }

            const station = getRadioStation(stationId);
            if (!station) {
                return res.status(400).json({
                    success: false,
                    error: `Radio-Sender "${stationId}" nicht gefunden`
                });
            }

            const success = await playRadioStation(guildId, stationId);
            
            if (success) {
                res.json({
                    success: true,
                    message: `📻 Radio-Sender "${station.name}" gestartet`,
                    station: station
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Starten des Radio-Senders'
                });
            }

        } catch (error) {
            console.error('❌ Radio Start Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Play Local Music Station
    app.post('/api/music/station/:guildId/play', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { stationId } = req.body;

            if (!stationId) {
                return res.status(400).json({
                    success: false,
                    error: 'Station ID ist erforderlich'
                });
            }

            const station = getMusicStation(stationId);
            if (!station) {
                return res.status(400).json({
                    success: false,
                    error: `Station "${stationId}" nicht gefunden`
                });
            }

            const success = await playMusicStation(guildId, stationId);
            
            if (success) {
                res.json({
                    success: true,
                    message: `📻 Station "${station.name}" gestartet!`,
                    station: station
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Starten der Station'
                });
            }

        } catch (error) {
            console.error('❌ Station Start Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Stop radio
    app.post('/api/music/radio/:guildId/stop', (req, res) => {
        try {
            const { guildId } = req.params;
            
            const success = stopRadio(guildId);
            
            if (success) {
                res.json({
                    success: true,
                    message: '📻 Radio gestoppt'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Stoppen des Radios'
                });
            }

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Stop music
    app.post('/api/music/stop/:guildId', (req, res) => {
        try {
            const { guildId } = req.params;
            
            const success = stopMusic(guildId);
            
            if (success) {
                res.json({
                    success: true,
                    message: '🎵 Musik gestoppt!'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Stoppen der Musik'
                });
            }

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Interactive Panel Management (neue Route ohne Guild ID)
    app.post('/api/music/interactive-panel/post', async (req, res) => {
        try {
            const { channelName, embedColor } = req.body;
            
            if (!channelName) {
                return res.status(400).json({
                    success: false,
                    error: 'Channel-Name ist erforderlich'
                });
            }
            
            // Update settings
            musicSettings.interactivePanel.channelId = channelName;
            if (embedColor) {
                musicSettings.interactivePanel.embedColor = embedColor;
            }
            saveMusicSettings();
            
            // Finde Guild durch Channel-Name
            let targetGuild = null;
            if (global.client && global.client.guilds) {
                for (const guild of global.client.guilds.cache.values()) {
                    const channel = guild.channels.cache.find(ch => ch.name === channelName && ch.type === 0);
                    if (channel) {
                        targetGuild = guild;
                        break;
                    }
                }
            }
            
            if (!targetGuild) {
                return res.status(404).json({
                    success: false,
                    error: `Channel "${channelName}" nicht gefunden`
                });
            }
            
            const success = await postInteractiveRadioPanel(targetGuild.id);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Interactive Panel erfolgreich gepostet!',
                    channelId: musicSettings.interactivePanel.channelId,
                    messageId: musicSettings.interactivePanel.messageId
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Posten des Interactive Panels'
                });
            }
        } catch (error) {
            console.error('❌ Fehler beim Interactive Panel Post:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Interactive Panel Management (alte Route mit Guild ID)
    app.post('/api/music/interactive-panel/:guildId/post', async (req, res) => {
        try {
            const { guildId } = req.params;
            
            if (!musicSettings.interactivePanel.channelId) {
                return res.status(400).json({
                    success: false,
                    error: 'Kein Channel für Interactive Panel konfiguriert'
                });
            }
            
            const success = await postInteractiveRadioPanel(guildId);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Radio Panel erfolgreich gepostet!',
                    channelId: musicSettings.interactivePanel.channelId,
                    messageId: musicSettings.interactivePanel.messageId
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Posten des Radio Panels'
                });
            }
        } catch (error) {
            console.error('❌ Fehler beim Radio Panel Post:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Update Interactive Panel
    app.post('/api/music/interactive-panel/:guildId/update', async (req, res) => {
        try {
            const { guildId } = req.params;
            
            console.log(`📻 Panel Update angefragt für Guild: ${guildId}`);
            
            // Prüfe Konfiguration
            if (!musicSettings.interactivePanel.enabled) {
                return res.status(400).json({
                    success: false,
                    error: 'Interactive Panel ist nicht aktiviert'
                });
            }

            if (!musicSettings.interactivePanel.channelId) {
                return res.status(400).json({
                    success: false,
                    error: 'Kein Channel für Interactive Panel konfiguriert'
                });
            }

            if (!musicSettings.interactivePanel.messageId) {
                return res.status(400).json({
                    success: false,
                    error: 'Keine Message-ID für Interactive Panel konfiguriert. Bitte poste zuerst ein Panel.'
                });
            }
            
            const success = await updateInteractiveRadioPanel(guildId, true); // Force update
            
            if (success) {
                console.log(`✅ Panel Update erfolgreich für Guild: ${guildId}`);
                res.json({
                    success: true,
                    message: 'Interactive Panel erfolgreich aktualisiert'
                });
            } else {
                console.log(`❌ Panel Update fehlgeschlagen für Guild: ${guildId}`);
                res.status(500).json({
                    success: false,
                    error: 'Panel konnte nicht aktualisiert werden. Prüfe die Logs für Details.'
                });
            }
        } catch (error) {
            console.error('❌ Unerwarteter Fehler beim Panel Update:', error);
            res.status(500).json({
                success: false,
                error: `Interner Fehler: ${error.message}`
            });
        }
    });

    // Voice Channel Management
    app.post('/api/music/voice/:guildId/:action', async (req, res) => {
        try {
            const { guildId, action } = req.params;
            const { channelId } = req.body;
            
            if (action === 'join' && channelId) {
                const guild = global.client?.guilds.cache.get(guildId);
                const channel = guild?.channels.cache.get(channelId);
                
                if (channel && channel.isVoiceBased()) {
                    const connection = await joinVoiceChannelSafe(channel);
                    if (connection) {
                        res.json({
                            success: true,
                            message: `Voice-Channel "${channel.name}" beigetreten`
                        });
                    } else {
                        res.status(500).json({
                            success: false,
                            error: 'Fehler beim Beitreten'
                        });
                    }
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Channel nicht gefunden'
                    });
                }
            } else if (action === 'leave') {
                leaveVoiceChannel(guildId);
                res.json({
                    success: true,
                    message: 'Voice-Channel verlassen'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Test Radio Station
    app.post('/api/music/radio/test', async (req, res) => {
        try {
            const { stationUrl } = req.body;
            
            if (!stationUrl) {
                return res.status(400).json({
                    success: false,
                    error: 'Station URL ist erforderlich'
                });
            }

            const testResult = await testRadioStation(stationUrl);
            
            res.json({
                success: testResult.success,
                result: testResult,
                message: testResult.success ? 'Station erfolgreich getestet' : 'Station-Test fehlgeschlagen'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Guild Channels abrufen
    app.get('/api/music/guild/:guildId/channels', async (req, res) => {
        try {
            const { guildId } = req.params;
            
            if (!global.client) {
                return res.status(503).json({
                    success: false,
                    error: 'Discord Client nicht verfügbar'
                });
            }

            const guild = global.client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({
                    success: false,
                    error: 'Server nicht gefunden'
                });
            }

            // Text-Channels sammeln
            const textChannels = guild.channels.cache
                .filter(channel => channel.type === 0) // Text-Channels
                .map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    type: 'text',
                    position: channel.position
                }));

            // Voice-Channels sammeln
            const voiceChannels = guild.channels.cache
                .filter(channel => channel.type === 2) // Voice-Channels
                .map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    type: 'voice',
                    position: channel.position,
                    members: channel.members.size,
                    joinable: channel.joinable
                }));

            // Nach Position sortieren
            textChannels.sort((a, b) => a.position - b.position);
            voiceChannels.sort((a, b) => a.position - b.position);

            res.json({
                success: true,
                guild: {
                    id: guild.id,
                    name: guild.name,
                    icon: guild.iconURL()
                },
                channels: {
                    text: textChannels,
                    voice: voiceChannels
                }
            });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Guild-Channels:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    console.log('✅ Musik API registriert!');
}

// Auto-Join für Radio (identisch aber separiert)
async function autoJoinForRadio(guildId) {
    try {
        console.log(`🤖 Auto-Join für Radio gestartet: ${guildId}`);
        
        if (!global.client) {
            console.log('❌ global.client nicht verfügbar');
            return false;
        }
        
        const guild = global.client.guilds.cache.get(guildId);
        if (!guild) {
            console.log(`❌ Guild ${guildId} nicht gefunden`);
            return false;
        }
        
        // Finde Voice-Channels mit Usern
        const voiceChannelsWithUsers = guild.channels.cache.filter(channel => 
            channel.isVoiceBased() && 
            channel.members.size > 0 &&
            !channel.members.every(member => member.user.bot)
        );
        
        const allVoiceChannels = guild.channels.cache.filter(channel => 
            channel.isVoiceBased() && 
            channel.joinable
        );
        
        let targetChannel;
        
        if (voiceChannelsWithUsers.size > 0) {
            targetChannel = voiceChannelsWithUsers.sort((a, b) => b.members.size - a.members.size).first();
        } else if (allVoiceChannels.size > 0) {
            targetChannel = allVoiceChannels.first();
        }
        
        if (!targetChannel) {
            console.log('❌ Keine beitretbaren Voice-Channels gefunden');
            return false;
        }
        
        console.log(`🎯 Auto-Join Target: ${targetChannel.name} (${targetChannel.members.size} Members)`);
        
        const connection = await joinVoiceChannelSafe(targetChannel);
        return !!connection;
        
    } catch (error) {
        console.error('❌ Auto-Join für Radio fehlgeschlagen:', error);
        return false;
    }
}

// Test Audio Stream Verbindung
async function testRadioStation(stationUrl) {
    try {
        console.log(`🧪 Teste Radio-Station URL: ${stationUrl}`);
        
        if (stationUrl.includes('youtube.com') || stationUrl.includes('youtu.be')) {
            console.log('📻 YouTube-Stream Test...');
            const stream = await play.stream(stationUrl, { quality: 1 });
            console.log('✅ YouTube-Stream erfolgreich');
            return { success: true, type: 'youtube', stream: stream };
        } else {
            console.log('📻 HTTP-Stream Test...');
            
            // Teste HTTP-Stream Verbindung
            const https = require('https');
            const http = require('http');
            const requestModule = stationUrl.startsWith('https:') ? https : http;
            
            return new Promise((resolve) => {
                const request = requestModule.get(stationUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'audio/*'
                    },
                    timeout: 10000
                }, (response) => {
                    console.log(`📻 Stream Status: ${response.statusCode}`);
                    console.log(`📻 Stream Headers:`, response.headers);
                    
                    if (response.statusCode === 200) {
                        resolve({ 
                            success: true, 
                            type: 'http',
                            statusCode: response.statusCode,
                            contentType: response.headers['content-type'],
                            server: response.headers['server']
                        });
                    } else {
                        resolve({ 
                            success: false, 
                            error: `HTTP ${response.statusCode}`,
                            statusCode: response.statusCode
                        });
                    }
                    
                    request.abort();
                });
                
                request.on('error', (error) => {
                    console.error(`❌ Stream Connection Error:`, error);
                    resolve({ success: false, error: error.message });
                });
                
                request.on('timeout', () => {
                    console.error(`❌ Stream Timeout`);
                    request.abort();
                    resolve({ success: false, error: 'Connection timeout' });
                });
            });
        }
    } catch (error) {
        console.error(`❌ Radio-Station Test fehlgeschlagen:`, error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    loadMusicSettings,
    saveMusicSettings,
    registerMusicAPI,
    joinVoiceChannelSafe,
    leaveVoiceChannel,
    // Radio Functions
    getRadioStations,
    getRadioStation,
    playRadioStation,
    stopRadio,
    getCurrentRadioStation,
    isPlayingRadio,
    autoJoinForRadio,
    // Local Music Functions
    getAvailableSongs,
    getMusicStations,
    getMusicStation,
    playLocalSong,
    playMusicStation,
    stopMusic,
    getCurrentSong,
    getCurrentStation,
    isPlayingMusic,
    sendNowPlayingMessage,
    updateInteractiveMusicPanel,
    autoJoinForMusic,
    musicGenres,
    scanMusicDirectory,
    // Settings
    musicSettings,
    // Interactive Panel Functions (Radio)
    postInteractiveRadioPanel,
    updateInteractiveRadioPanel,
    handleRadioSelectButton,
    handleRadioStationSelect,
    handleRadioStopButton
}; 