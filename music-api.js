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

// Erweiterte Music Settings - Radio + Custom Playlists
let musicSettings = {
    enabled: true,
    radio: {
        enabled: true,
        stations: [
            {
                id: "lofi",
                name: "Lofi Hip Hop Radio",
                url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
                genre: "Lofi/Chill",
                country: "International",
                description: "24/7 Lofi Hip Hop Beats",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM2NjMzOTkiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TG9GaTwvdGV4dD4KPC9zdmc+Cg=="
            },
            {
                id: "chillhop",
                name: "ChillHop Radio",
                url: "https://www.youtube.com/watch?v=5yx6BWlEVcY",
                genre: "Chillhop/Jazz",
                country: "International",
                description: "Chill beats to relax/study to",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM0NEFBODgiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q2hpbGxIb3A8L3RleHQ+Cjwvc3ZnPgo="
            },
            {
                id: "deephouse",
                name: "Deep House Radio",
                url: "https://www.youtube.com/watch?v=36YnV9STBqc",
                genre: "Deep House/Electronic",
                country: "International",
                description: "24/7 Deep House Live Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMwMDMzNjYiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMEZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRFRVA8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSI0NCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMDBGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5IT1VTRTI8L3RleHQ+Cjwvc3ZnPgo="
            },
            {
                id: "trapmusic",
                name: "Trap Music 24/7",
                url: "https://www.youtube.com/watch?v=5qap5aO4i9A",
                genre: "Trap/Hip-Hop",
                country: "USA",
                description: "24/7 Trap Music Live Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRjAwNzciLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VFJBUDwvdGV4dD4KPC9zdmc+Cg=="
            },
            {
                id: "gaming",
                name: "Gaming Music Radio",
                url: "https://www.youtube.com/watch?v=4xDzrJKXOOY",
                genre: "Gaming/Electronic",
                country: "International",
                description: "24/7 Gaming Music Live Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMwMEZGMDAiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdBTUlORzwvdGV4dD4KPHRleHQgeD0iMzIiIHk9IjQ0IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk1VU0lDPC90ZXh0Pgo8L3N2Zz4K"
            },
            {
                id: "jazzhop",
                name: "Jazz Hop Cafe",
                url: "https://www.youtube.com/watch?v=Dx5qFachd3A",
                genre: "Jazz Hop/Chill",
                country: "International",
                description: "24/7 Jazz Hop Cafe Live Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM4QjQ1MTMiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNGRkQ3MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkpBWlo8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSI0NCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjRkZENzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5IT1A8L3RleHQ+Cjwvc3ZnPgo="
            },
            {
                id: "retrowave",
                name: "Retrowave 24/7",
                url: "https://www.youtube.com/watch?v=MV_3Dpw-BRY",
                genre: "Retrowave/80s",
                country: "International",
                description: "24/7 Retrowave Live Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRjAwRkYiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5SRVRST1dBVkU8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSI0NCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+MjQvNzwvdGV4dD4KPC9zdmc+Cg=="
            },
            {
                id: "bassmusic",
                name: "Bass Music 24/7",
                url: "https://www.youtube.com/watch?v=6p0DAz_30qQ",
                genre: "Bass/Dubstep",
                country: "International",
                description: "24/7 Bass Music Live Stream",
                logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRjAwMDAiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QkFTUzwvdGV4dD4KPC9zdmc+Cg=="
            }
        ],
        defaultStation: "lofi",
        autoStop: false,
        showNowPlaying: true,
        embedColor: "#FF6B6B"
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
    },
    playlists: {
        enabled: true,
        customPlaylists: [], // Array of custom playlists
        autoQueue: true,
        crossfade: 3000, // 3 seconds crossfade
        voting: {
            enabled: true,
            votingTime: 30000, // 30 seconds
            skipThreshold: 0.5 // 50% of users need to vote
        },
        schedule: {
            enabled: false,
            timeZone: "Europe/Berlin",
            schedules: [] // Array of scheduled playlists
        }
    }
};

// Voice Connections und Players
const voiceConnections = new Map(); // guild -> connection
const audioPlayers = new Map(); // guild -> player
const currentRadioStations = new Map(); // guildId -> current radio station

// Playlist System
const currentPlaylists = new Map(); // guildId -> current playlist
const currentQueues = new Map(); // guildId -> song queue
const currentSongs = new Map(); // guildId -> current song
const votingSessions = new Map(); // guildId -> voting session
const playlistHistory = new Map(); // guildId -> song history

function loadMusicSettings() {
    try {
        if (fs.existsSync('music-settings.json')) {
            const data = fs.readFileSync('music-settings.json', 'utf8');
            const loadedSettings = JSON.parse(data);
            
            // Deep merge um Default-Values zu behalten wenn neue Properties hinzugefügt werden
            musicSettings = {
                ...musicSettings,
                ...loadedSettings,
                radio: {
                    ...musicSettings.radio,
                    ...loadedSettings.radio
                },
                announcements: {
                    ...musicSettings.announcements,
                    ...loadedSettings.announcements
                },
                interactivePanel: {
                    ...musicSettings.interactivePanel,
                    ...loadedSettings.interactivePanel
                },
                playlists: {
                    ...musicSettings.playlists,
                    ...loadedSettings.playlists,
                    voting: {
                        ...musicSettings.playlists.voting,
                        ...loadedSettings.playlists?.voting
                    },
                    schedule: {
                        ...musicSettings.playlists.schedule,
                        ...loadedSettings.playlists?.schedule
                    }
                }
            };
            
            console.log('🎵 Musik-Einstellungen geladen');
            console.log('🎨 Radio Embed Farbe:', musicSettings.radio.embedColor);
            console.log('🎨 Panel Embed Farbe:', musicSettings.interactivePanel.embedColor);
        } else {
            saveMusicSettings();
            console.log('🎵 Standard-Musik-Einstellungen erstellt');
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Musik-Einstellungen:', error);
        // Fallback auf Default-Settings
        saveMusicSettings();
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
        currentRadioStations.delete(guildId);
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
            console.log('🎵 Radio: Playing');
        });
        
        player.on(AudioPlayerStatus.Paused, () => {
            console.log('⏸️ Radio: Paused');
        });
        
        player.on(AudioPlayerStatus.Idle, () => {
            console.log('💤 Radio: Idle');
        });

        player.on('error', error => {
            console.error('❌ Radio Player Fehler:', error);
        });
        
        console.log('✅ Radio AudioPlayer erstellt');
    }
    return audioPlayers.get(guildId);
}

// Radio System Functions
function getRadioStations() {
    return musicSettings.radio?.stations || [];
}

function getRadioStation(stationId) {
    const stations = getRadioStations();
    return stations.find(station => station.id === stationId);
}

async function playRadioStation(guildId, stationId) {
    try {
        const station = getRadioStation(stationId);
        if (!station) {
            throw new Error(`Radio-Sender "${stationId}" nicht gefunden`);
        }

        console.log(`📻 Starte Radio-Sender: ${station.name} für Guild ${guildId}`);

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

        // Erstelle Player
        const player = createPlayerForGuild(guildId);

        // Verwende play-dl für YouTube Live Stream
        const { stream, type } = await createYouTubeStream(station.url);
        
        const resource = createAudioResource(stream, {
            inputType: type,
            inlineVolume: true
        });

        if (resource.volume) {
            resource.volume.setVolume(0.5); // 50% Volume
        }

        // Spiele ab
        player.play(resource);
        connection.subscribe(player);

        // Setze als aktueller Radio-Sender
        currentRadioStations.set(guildId, station);

        console.log(`✅ Radio-Sender ${station.name} gestartet`);
        
        // Update Interactive Panel
        updateInteractiveRadioPanel(guildId, true);
        
        // Sende Now-Playing Nachricht
        if (musicSettings.radio?.showNowPlaying && musicSettings.announcements?.channelId) {
            await sendRadioNowPlayingMessage(guildId, station);
        }

        return true;

    } catch (error) {
        console.error(`❌ Fehler beim Starten des Radio-Senders:`, error);
        throw error;
    }
}

async function createYouTubeStream(url) {
    try {
        // URL Validation
        if (!url || typeof url !== 'string') {
            throw new Error(`Invalid URL provided: ${url} (type: ${typeof url})`);
        }
        
        url = url.trim();
        if (!url) {
            throw new Error('Empty URL provided');
        }
        
        console.log(`🎵 Erstelle Stream für URL: ${url}`);
        
        const playdl = require('play-dl');
        
        // Prüfe ob es ein YouTube URL ist
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            console.log(`🔍 Validiere YouTube URL: ${url}`);
            
            try {
                // Validate YouTube URL format
                const validYouTubeUrl = playdl.yt_validate(url);
                console.log(`📊 YouTube Validation Result: ${validYouTubeUrl}`);
                
                if (validYouTubeUrl === 'video' || validYouTubeUrl === 'playlist') {
                    console.log(`✅ Gültige YouTube URL gefunden: ${validYouTubeUrl}`);
                    
                    // Try alternative approach - get info first
                    console.log(`📋 Hole Video-Info für: ${url}`);
                    const info = await playdl.video_info(url);
                    console.log(`📊 Video-Info erhalten:`, info ? 'SUCCESS' : 'FAILED');
                    
                    if (!info) {
                        throw new Error('Konnte Video-Info nicht abrufen');
                    }
                    
                    console.log(`🎵 Erstelle Stream...`);
                    const stream = await playdl.stream_from_info(info, {
                        quality: 2 // Beste Audio-Qualität
                    });
                    
                    console.log(`✅ Stream erfolgreich erstellt`);
                    return {
                        stream: stream.stream,
                        type: stream.type
                    };
                } else if (validYouTubeUrl === false) {
                    // Try direct stream anyway
                    console.log(`⚠️ YouTube-Validation fehlgeschlagen, versuche direkten Stream...`);
                    const stream = await playdl.stream(url, {
                        quality: 2
                    });
                    
                    return {
                        stream: stream.stream,
                        type: stream.type
                    };
                } else {
                    throw new Error(`Ungültige YouTube URL: ${url} (Validation: ${validYouTubeUrl})`);
                }
            } catch (validationError) {
                console.error(`❌ YouTube Validation/Stream Fehler:`, validationError);
                
                // Fallback: Try direct URL approach
                console.log(`🔄 Fallback: Versuche direkten playdl.stream()...`);
                try {
                    const stream = await playdl.stream(url, {
                        quality: 2
                    });
                    
                    console.log(`✅ Fallback Stream erfolgreich`);
                    return {
                        stream: stream.stream,
                        type: stream.type
                    };
                } catch (fallbackError) {
                    console.error(`❌ Auch Fallback fehlgeschlagen:`, fallbackError);
                    throw new Error(`YouTube Stream konnte nicht erstellt werden: ${fallbackError.message}`);
                }
            }
        } else {
            // Direkter Stream (MP3/etc.)
            console.log(`🌐 Direkter Stream: ${url}`);
            const fetch = require('node-fetch');
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return {
                stream: response.body,
                type: StreamType.Arbitrary
            };
        }
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des YouTube Streams:', error);
        console.error('URL war:', url);
        console.error('URL Typ:', typeof url);
        throw error;
    }
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

// Auto-Join für Radio
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
        
        console.log(`🎵 Auto-Join: Trete ${targetChannel.name} bei`);
        const joinResult = await joinVoiceChannelSafe(targetChannel);
        
        return !!joinResult;
    } catch (error) {
        console.error('❌ Fehler beim Auto-Join:', error);
        return false;
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
            title: '📻 YouTube Radio Panel',
            description: '**Wähle einen YouTube Radio-Stream!**\n\n' +
                        '🎯 **Wie funktioniert es?**\n' +
                        '• Klicke auf "📻 Radio auswählen"\n' +
                        '• Wähle einen der verfügbaren Streams\n' +
                        '• Der Bot joint automatisch deinen Voice-Channel!\n\n' +
                        '🎧 **Verfügbare Streams:**\n' +
                        '• 24/7 YouTube Live-Streams\n' +
                        '• Lofi, ChillHop, Gaming Music & mehr\n' +
                        '• Einfach und zuverlässig',
            fields: [],
            footer: {
                text: '📻 Einfaches YouTube Radio System'
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
        const guild = global.client?.guilds.cache.get(guildId);
        if (!guild) return false;

        const channelId = musicSettings.interactivePanel.channelId;
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return false;

        console.log(`📻 Poste Interactive Radio Panel in #${channel.name}`);

        const panelData = await createInteractiveRadioPanel(guildId);
        if (!panelData) return false;

        // Lösche alte Message
        const oldMessageId = musicSettings.interactivePanel.messageId;
        if (oldMessageId) {
            try {
                const oldMessage = await channel.messages.fetch(oldMessageId);
                if (oldMessage) {
                    await oldMessage.delete();
                    console.log('🗑️ Alte Radio Panel Message gelöscht');
                }
            } catch (error) {
                console.log('⚠️ Alte Message nicht gefunden');
            }
        }

        // Poste neue Message
        const message = await channel.send(panelData);
        
        // Speichere Message ID
        musicSettings.interactivePanel.messageId = message.id;
        saveMusicSettings();

        console.log(`✅ Radio Panel gepostet: ${message.id}`);
        return true;

    } catch (error) {
        console.error('❌ Fehler beim Posten des Radio Panels:', error);
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

        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            console.log(`⚠️ Channel ${channelId} nicht gefunden`);
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

        const stations = getRadioStations();
        
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
            ? `📻 **Wähle deinen YouTube Radio-Stream:** (${limitedStations.length} von ${stations.length} Sendern)`
            : '📻 **Wähle deinen YouTube Radio-Stream:**';

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

// ========================================
// PLAYLIST SYSTEM FUNCTIONS
// ========================================

// Playlist Management
function getCustomPlaylists() {
    return musicSettings.playlists?.customPlaylists || [];
}

function getCustomPlaylist(playlistId) {
    const playlists = getCustomPlaylists();
    return playlists.find(playlist => playlist.id === playlistId);
}

function createCustomPlaylist(playlistData) {
    try {
        const newPlaylist = {
            id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: playlistData.name || 'Neue Playlist',
            description: playlistData.description || '',
            songs: playlistData.songs || [],
            thumbnail: playlistData.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM2NjMzOTkiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5O7PC90ZXh0Pgo8L3N2Zz4K',
            genre: playlistData.genre || 'Mixed',
            tags: playlistData.tags || [],
            isPublic: playlistData.isPublic || false,
            shuffle: playlistData.shuffle || false,
            repeat: playlistData.repeat || 'none', // none, one, all
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            playCount: 0,
            totalDuration: 0
        };

        if (!musicSettings.playlists) {
            musicSettings.playlists = { customPlaylists: [] };
        }
        
        musicSettings.playlists.customPlaylists.push(newPlaylist);
        saveMusicSettings();
        
        console.log(`✅ Playlist "${newPlaylist.name}" erstellt`);
        return newPlaylist;
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Playlist:', error);
        return null;
    }
}

function updateCustomPlaylist(playlistId, updateData) {
    try {
        const playlists = getCustomPlaylists();
        const playlistIndex = playlists.findIndex(p => p.id === playlistId);
        
        if (playlistIndex === -1) {
            throw new Error('Playlist nicht gefunden');
        }
        
        // Validiere Name-Update
        if (updateData.name !== undefined) {
            if (!updateData.name.trim()) {
                throw new Error('Playlist-Name darf nicht leer sein');
            }
            
            // Prüfe auf doppelte Namen (außer current playlist)
            const existingPlaylist = playlists.find(p => 
                p.name.toLowerCase() === updateData.name.trim().toLowerCase() && 
                p.id !== playlistId
            );
            
            if (existingPlaylist) {
                throw new Error(`Eine Playlist mit dem Namen "${updateData.name}" existiert bereits`);
            }
        }
        
        // Update playlist
        playlists[playlistIndex] = {
            ...playlists[playlistIndex],
            ...updateData,
            updatedAt: new Date().toISOString()
        };
        
        saveMusicSettings();
        console.log(`✅ Playlist "${playlists[playlistIndex].name}" aktualisiert`);
        return playlists[playlistIndex];
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Playlist:', error);
        throw error;
    }
}

function deleteCustomPlaylist(playlistId) {
    try {
        const playlists = getCustomPlaylists();
        const playlistIndex = playlists.findIndex(p => p.id === playlistId);
        
        if (playlistIndex === -1) {
            throw new Error('Playlist nicht gefunden');
        }
        
        const deletedPlaylist = playlists.splice(playlistIndex, 1)[0];
        saveMusicSettings();
        
        console.log(`✅ Playlist "${deletedPlaylist.name}" gelöscht`);
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Löschen der Playlist:', error);
        return false;
    }
}

// Song Management in Playlists
function addSongToPlaylist(playlistId, songData) {
    try {
        const playlist = getCustomPlaylist(playlistId);
        if (!playlist) {
            throw new Error('Playlist nicht gefunden');
        }
        
        console.log(`📥 Empfangene Song-Daten:`, JSON.stringify(songData, null, 2));
        
        // Validate songData
        if (!songData.url) {
            throw new Error(`Song-Daten haben keine URL: ${JSON.stringify(songData)}`);
        }
        
        const newSong = {
            id: `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: songData.title || 'Unbekannter Titel',
            artist: songData.artist || 'Unbekannter Künstler',
            url: songData.url,
            duration: songData.duration || 0,
            thumbnail: songData.thumbnail || '',
            addedAt: new Date().toISOString(),
            order: playlist.songs.length
        };
        
        console.log(`💾 Erstelle Song:`, JSON.stringify(newSong, null, 2));
        
        playlist.songs.push(newSong);
        playlist.updatedAt = new Date().toISOString();
        
        saveMusicSettings();
        console.log(`✅ Song "${newSong.title}" zu Playlist "${playlist.name}" hinzugefügt`);
        return newSong;
    } catch (error) {
        console.error('❌ Fehler beim Hinzufügen des Songs:', error);
        return null;
    }
}

function removeSongFromPlaylist(playlistId, songId) {
    try {
        const playlist = getCustomPlaylist(playlistId);
        if (!playlist) {
            throw new Error('Playlist nicht gefunden');
        }
        
        const songIndex = playlist.songs.findIndex(s => s.id === songId);
        if (songIndex === -1) {
            throw new Error('Song nicht gefunden');
        }
        
        const removedSong = playlist.songs.splice(songIndex, 1)[0];
        playlist.updatedAt = new Date().toISOString();
        
        // Update order for remaining songs
        playlist.songs.forEach((song, index) => {
            song.order = index;
        });
        
        saveMusicSettings();
        console.log(`✅ Song "${removedSong.title}" aus Playlist entfernt`);
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Entfernen des Songs:', error);
        return false;
    }
}

function reorderPlaylistSongs(playlistId, newOrder) {
    try {
        const playlist = getCustomPlaylist(playlistId);
        if (!playlist) {
            throw new Error('Playlist nicht gefunden');
        }
        
        // Reorder songs based on newOrder array
        const reorderedSongs = newOrder.map((songId, index) => {
            const song = playlist.songs.find(s => s.id === songId);
            if (song) {
                song.order = index;
                return song;
            }
            return null;
        }).filter(Boolean);
        
        playlist.songs = reorderedSongs;
        playlist.updatedAt = new Date().toISOString();
        
        saveMusicSettings();
        console.log(`✅ Playlist "${playlist.name}" neu sortiert`);
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Sortieren der Playlist:', error);
        return false;
    }
}

// Playlist Playback
async function playCustomPlaylist(guildId, playlistId, options = {}) {
    try {
        const playlist = getCustomPlaylist(playlistId);
        if (!playlist) {
            throw new Error('Playlist nicht gefunden');
        }
        
        if (playlist.songs.length === 0) {
            throw new Error('Playlist ist leer');
        }
        
        console.log(`🎵 Starte Playlist: ${playlist.name} für Guild ${guildId}`);
        
        // Auto-Join falls nicht im Voice-Channel
        let connection = voiceConnections.get(guildId);
        if (!connection) {
            console.log('🎵 Auto-Join für Playlist-Wiedergabe');
            const autoJoinSuccess = await autoJoinForRadio(guildId);
            if (!autoJoinSuccess) {
                throw new Error('Bot konnte keinem Voice-Channel beitreten');
            }
            connection = voiceConnections.get(guildId);
        }
        
        // Setup Queue
        let songs = [...playlist.songs];
        
        // Shuffle if enabled
        if (playlist.shuffle || options.shuffle) {
            songs = shuffleArray(songs);
        }
        
        // Set current playlist and queue
        currentPlaylists.set(guildId, playlist);
        currentQueues.set(guildId, songs);
        playlistHistory.set(guildId, []);
        
        // Start playing first song
        await playNextSongInQueue(guildId);
        
        // Update playlist play count
        playlist.playCount = (playlist.playCount || 0) + 1;
        saveMusicSettings();
        
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Abspielen der Playlist:', error);
        throw error;
    }
}

async function playNextSongInQueue(guildId) {
    try {
        const queue = currentQueues.get(guildId);
        const playlist = currentPlaylists.get(guildId);
        
        if (!queue || !playlist) {
            console.log('📻 Keine Queue oder Playlist aktiv');
            return false;
        }
        
        if (queue.length === 0) {
            // Handle repeat modes
            if (playlist.repeat === 'all') {
                // Restart playlist
                let songs = [...playlist.songs];
                if (playlist.shuffle) {
                    songs = shuffleArray(songs);
                }
                currentQueues.set(guildId, songs);
                return playNextSongInQueue(guildId);
            } else {
                console.log('🏁 Playlist beendet');
                currentPlaylists.delete(guildId);
                currentQueues.delete(guildId);
                currentSongs.delete(guildId);
                return false;
            }
        }
        
        const nextSong = queue.shift();
        currentSongs.set(guildId, nextSong);
        
        // Add to history
        const history = playlistHistory.get(guildId) || [];
        history.push(nextSong);
        if (history.length > 50) { // Keep last 50 songs
            history.shift();
        }
        playlistHistory.set(guildId, history);
        
        console.log(`🎵 Spiele nächsten Song: ${nextSong.title} von ${nextSong.artist}`);
        console.log(`🔗 Song URL: ${nextSong.url}`);
        console.log(`📝 Song Object:`, JSON.stringify(nextSong, null, 2));
        
        // Validate song data
        if (!nextSong.url) {
            throw new Error(`Song hat keine URL: ${nextSong.title} (ID: ${nextSong.id})`);
        }
        
        // Create player and play song
        const player = createPlayerForGuild(guildId);
        const connection = voiceConnections.get(guildId);
        
        const { stream, type } = await createYouTubeStream(nextSong.url);
        const resource = createAudioResource(stream, {
            inputType: type,
            inlineVolume: true
        });
        
        if (resource.volume) {
            resource.volume.setVolume(0.7); // 70% Volume für Playlists
        }
        
        player.play(resource);
        connection.subscribe(player);
        
        // Handle song end
        player.once(AudioPlayerStatus.Idle, () => {
            console.log(`🏁 Song beendet: ${nextSong.title}`);
            
            // Handle repeat one
            if (playlist.repeat === 'one') {
                queue.unshift(nextSong); // Add same song back to beginning
            }
            
            // Play next song after small delay
            setTimeout(() => {
                playNextSongInQueue(guildId);
            }, musicSettings.playlists?.crossfade || 1000);
        });
        
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Abspielen des nächsten Songs:', error);
        return false;
    }
}

function stopPlaylist(guildId) {
    try {
        console.log(`🛑 Stoppe Playlist für Guild ${guildId}`);
        
        // Clear playlist data
        currentPlaylists.delete(guildId);
        currentQueues.delete(guildId);
        currentSongs.delete(guildId);
        votingSessions.delete(guildId);
        
        // Stop player
        const player = audioPlayers.get(guildId);
        if (player) {
            player.stop();
        }
        
        console.log('✅ Playlist gestoppt');
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Stoppen der Playlist:', error);
        return false;
    }
}

// Voting System
async function startVotingSession(guildId, type, data = {}) {
    try {
        if (!musicSettings.playlists?.voting?.enabled) {
            throw new Error('Voting ist deaktiviert');
        }
        
        const votingTime = musicSettings.playlists.voting.votingTime || 30000;
        const session = {
            id: `vote_${Date.now()}`,
            type: type, // 'skip', 'add_song', 'remove_song'
            data: data,
            votes: new Map(), // userId -> vote
            startTime: Date.now(),
            endTime: Date.now() + votingTime,
            isActive: true
        };
        
        votingSessions.set(guildId, session);
        
        // Auto-end voting after time limit
        setTimeout(() => {
            if (votingSessions.get(guildId)?.id === session.id) {
                endVotingSession(guildId);
            }
        }, votingTime);
        
        console.log(`🗳️ Voting-Session gestartet: ${type}`);
        return session;
    } catch (error) {
        console.error('❌ Fehler beim Starten der Voting-Session:', error);
        return null;
    }
}

function addVote(guildId, userId, vote) {
    try {
        const session = votingSessions.get(guildId);
        if (!session || !session.isActive) {
            throw new Error('Keine aktive Voting-Session');
        }
        
        session.votes.set(userId, vote);
        console.log(`🗳️ Vote hinzugefügt: ${userId} -> ${vote}`);
        
        // Check if enough votes to end early
        const connection = voiceConnections.get(guildId);
        if (connection) {
            const guild = global.client?.guilds.cache.get(guildId);
            const channel = guild?.channels.cache.get(connection.joinConfig.channelId);
            if (channel) {
                const userCount = channel.members.filter(m => !m.user.bot).size;
                const threshold = Math.ceil(userCount * (musicSettings.playlists.voting.skipThreshold || 0.5));
                
                const yesVotes = Array.from(session.votes.values()).filter(v => v === 'yes').length;
                
                if (yesVotes >= threshold) {
                    endVotingSession(guildId, true);
                }
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Hinzufügen des Votes:', error);
        return false;
    }
}

function endVotingSession(guildId, forceResult = null) {
    try {
        const session = votingSessions.get(guildId);
        if (!session) return false;
        
        session.isActive = false;
        
        const votes = Array.from(session.votes.values());
        const yesVotes = votes.filter(v => v === 'yes').length;
        const noVotes = votes.filter(v => v === 'no').length;
        
        const result = forceResult !== null ? forceResult : yesVotes > noVotes;
        
        console.log(`🗳️ Voting beendet: ${result ? 'Angenommen' : 'Abgelehnt'} (${yesVotes}:${noVotes})`);
        
        // Handle voting result
        if (result) {
            switch (session.type) {
                case 'skip':
                    playNextSongInQueue(guildId);
                    break;
                case 'add_song':
                    // Add song to queue
                    const queue = currentQueues.get(guildId);
                    if (queue && session.data.song) {
                        queue.push(session.data.song);
                    }
                    break;
                case 'remove_song':
                    // Remove song from queue
                    const currentQueue = currentQueues.get(guildId);
                    if (currentQueue && session.data.songId) {
                        const index = currentQueue.findIndex(s => s.id === session.data.songId);
                        if (index > -1) {
                            currentQueue.splice(index, 1);
                        }
                    }
                    break;
            }
        }
        
        votingSessions.delete(guildId);
        return result;
    } catch (error) {
        console.error('❌ Fehler beim Beenden der Voting-Session:', error);
        return false;
    }
}

// Utility Functions
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getCurrentPlaylistStatus(guildId) {
    const playlist = currentPlaylists.get(guildId);
    const queue = currentQueues.get(guildId);
    const currentSong = currentSongs.get(guildId);
    const voting = votingSessions.get(guildId);
    const history = playlistHistory.get(guildId);
    
    return {
        isPlaying: !!playlist,
        playlist: playlist,
        currentSong: currentSong,
        queue: queue?.slice(0, 10) || [], // Next 10 songs
        queueLength: queue?.length || 0,
        history: history?.slice(-5) || [], // Last 5 songs
        voting: voting,
        repeat: playlist?.repeat || 'none',
        shuffle: playlist?.shuffle || false
    };
}

// YouTube Search Integration
async function searchYouTubeVideos(query, maxResults = 10) {
    try {
        const playdl = require('play-dl');
        
        console.log(`🔍 YouTube-Suche nach: "${query}"`);
        
        const searchResults = await playdl.search(query, {
            limit: maxResults,
            source: { youtube: 'video' }
        });
        
        console.log(`📊 ${searchResults.length} Suchergebnisse gefunden`);
        
        const results = searchResults.map((video, index) => {
            const result = {
                id: video.id,
                title: video.title || 'Unbekannter Titel',
                artist: video.channel?.name || 'Unbekannter Künstler',
                url: video.url,
                duration: video.durationInSec || 0,
                thumbnail: video.thumbnails?.[0]?.url || '',
                views: video.views || 0,
                uploadDate: video.uploadedAt || new Date().toISOString()
            };
            
            // URL Validation für jedes Ergebnis
            if (!result.url) {
                console.warn(`⚠️ Video ${index + 1} hat keine URL:`, video);
                result.url = `https://www.youtube.com/watch?v=${video.id}`;
            }
            
            // Ensure URL is properly formatted
            if (result.url && !result.url.startsWith('http')) {
                result.url = `https://www.youtube.com/watch?v=${video.id}`;
            }
            
            console.log(`📝 Video ${index + 1}: ${result.title} - URL: ${result.url}`);
            return result;
        }).filter(result => result.url); // Filter out results without URL
        
        console.log(`✅ ${results.length} gültige Videos bereit`);
        return results;
    } catch (error) {
        console.error('❌ Fehler bei YouTube-Suche:', error);
        return [];
    }
}

// API Endpoints
function registerMusicAPI(app) {
    console.log('📻 Registriere YouTube Radio API...');

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
            // Deep merge to preserve all nested properties
            musicSettings = {
                ...musicSettings,
                ...req.body,
                radio: {
                    ...musicSettings.radio,
                    ...req.body.radio
                },
                announcements: {
                    ...musicSettings.announcements,
                    ...req.body.announcements
                },
                interactivePanel: {
                    ...musicSettings.interactivePanel,
                    ...req.body.interactivePanel
                },
                playlists: {
                    ...musicSettings.playlists,
                    ...req.body.playlists
                }
            };
            saveMusicSettings();
            console.log('💾 Settings gespeichert:', JSON.stringify(musicSettings, null, 2));
            res.json({
                success: true,
                message: 'YouTube Radio-Einstellungen gespeichert',
                settings: musicSettings
            });
        } catch (error) {
            console.error('❌ Settings Speicher-Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get radio stations
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

    // Start radio station
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

    // Interactive Panel Management
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
                    message: 'YouTube Radio Panel erfolgreich gepostet!',
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

    // ========================================
    // PLAYLIST API ENDPOINTS
    // ========================================

    // Get all custom playlists
    app.get('/api/music/playlists', (req, res) => {
        try {
            const playlists = getCustomPlaylists();
            res.json({
                success: true,
                playlists: playlists,
                total: playlists.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get specific playlist
    app.get('/api/music/playlists/:playlistId', (req, res) => {
        try {
            const { playlistId } = req.params;
            const playlist = getCustomPlaylist(playlistId);
            
            if (!playlist) {
                return res.status(404).json({
                    success: false,
                    error: 'Playlist nicht gefunden'
                });
            }
            
            res.json({
                success: true,
                playlist: playlist
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Create new playlist
    app.post('/api/music/playlists', (req, res) => {
        try {
            const playlistData = req.body;
            const newPlaylist = createCustomPlaylist(playlistData);
            
            if (newPlaylist) {
                res.json({
                    success: true,
                    message: 'Playlist erstellt',
                    playlist: newPlaylist
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Erstellen der Playlist'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Update playlist
    app.put('/api/music/playlists/:playlistId', (req, res) => {
        try {
            const { playlistId } = req.params;
            const updateData = req.body;
            
            const updatedPlaylist = updateCustomPlaylist(playlistId, updateData);
            
            if (updatedPlaylist) {
                res.json({
                    success: true,
                    message: 'Playlist aktualisiert',
                    playlist: updatedPlaylist
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Playlist nicht gefunden'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Delete playlist
    app.delete('/api/music/playlists/:playlistId', (req, res) => {
        try {
            const { playlistId } = req.params;
            const success = deleteCustomPlaylist(playlistId);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Playlist gelöscht'
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Playlist nicht gefunden'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Add song to playlist
    app.post('/api/music/playlists/:playlistId/songs', (req, res) => {
        try {
            const { playlistId } = req.params;
            const songData = req.body;
            
            const newSong = addSongToPlaylist(playlistId, songData);
            
            if (newSong) {
                res.json({
                    success: true,
                    message: 'Song zur Playlist hinzugefügt',
                    song: newSong
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Playlist nicht gefunden'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Remove song from playlist
    app.delete('/api/music/playlists/:playlistId/songs/:songId', (req, res) => {
        try {
            const { playlistId, songId } = req.params;
            const success = removeSongFromPlaylist(playlistId, songId);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Song aus Playlist entfernt'
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Song oder Playlist nicht gefunden'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Reorder playlist songs
    app.put('/api/music/playlists/:playlistId/reorder', (req, res) => {
        try {
            const { playlistId } = req.params;
            const { newOrder } = req.body;
            
            const success = reorderPlaylistSongs(playlistId, newOrder);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Playlist neu sortiert'
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Playlist nicht gefunden'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Play playlist
    app.post('/api/music/playlists/:playlistId/play/:guildId', async (req, res) => {
        try {
            const { playlistId, guildId } = req.params;
            const options = req.body || {};
            
            const success = await playCustomPlaylist(guildId, playlistId, options);
            
            if (success) {
                const playlist = getCustomPlaylist(playlistId);
                res.json({
                    success: true,
                    message: `Playlist "${playlist.name}" wird abgespielt`,
                    playlist: playlist
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Abspielen der Playlist'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Stop playlist
    app.post('/api/music/playlists/:guildId/stop', (req, res) => {
        try {
            const { guildId } = req.params;
            const success = stopPlaylist(guildId);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Playlist gestoppt'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Stoppen der Playlist'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get current playlist status
    app.get('/api/music/playlists/:guildId/status', (req, res) => {
        try {
            const { guildId } = req.params;
            const status = getCurrentPlaylistStatus(guildId);
            
            res.json({
                success: true,
                status: status
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Skip to next song
    app.post('/api/music/playlists/:guildId/skip', async (req, res) => {
        try {
            const { guildId } = req.params;
            const success = await playNextSongInQueue(guildId);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Song übersprungen'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Keine Playlist aktiv oder Fehler beim Überspringen'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // YouTube Search
    app.get('/api/music/search', async (req, res) => {
        try {
            const { query, limit = 10 } = req.query;
            
            if (!query) {
                return res.status(400).json({
                    success: false,
                    error: 'Suchquery erforderlich'
                });
            }
            
            const results = await searchYouTubeVideos(query, parseInt(limit));
            
            res.json({
                success: true,
                results: results,
                query: query,
                total: results.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Voting endpoints
    app.post('/api/music/voting/:guildId/start', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { type, data } = req.body;
            
            const session = await startVotingSession(guildId, type, data);
            
            if (session) {
                res.json({
                    success: true,
                    message: 'Voting-Session gestartet',
                    session: {
                        id: session.id,
                        type: session.type,
                        endTime: session.endTime
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Starten der Voting-Session'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    app.post('/api/music/voting/:guildId/vote', (req, res) => {
        try {
            const { guildId } = req.params;
            const { userId, vote } = req.body;
            
            const success = addVote(guildId, userId, vote);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Vote hinzugefügt'
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Keine aktive Voting-Session oder ungültiger Vote'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    console.log('✅ YouTube Radio & Playlist API registriert!');
}

module.exports = {
    // Settings
    loadMusicSettings,
    saveMusicSettings,
    musicSettings,
    
    // API Registration
    registerMusicAPI,
    
    // Voice Channel Functions
    joinVoiceChannelSafe,
    leaveVoiceChannel,
    autoJoinForRadio,
    
    // Radio Functions
    getRadioStations,
    getRadioStation,
    playRadioStation,
    stopRadio,
    getCurrentRadioStation,
    isPlayingRadio,
    
    // Interactive Panel Functions
    postInteractiveRadioPanel,
    updateInteractiveRadioPanel,
    handleRadioSelectButton,
    handleRadioStationSelect,
    handleRadioStopButton,
    
    // Playlist Functions
    getCustomPlaylists,
    getCustomPlaylist,
    createCustomPlaylist,
    updateCustomPlaylist,
    deleteCustomPlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    reorderPlaylistSongs,
    playCustomPlaylist,
    stopPlaylist,
    playNextSongInQueue,
    getCurrentPlaylistStatus,
    
    // Voting Functions
    startVotingSession,
    addVote,
    endVotingSession,
    
    // Utility Functions
    searchYouTubeVideos,
    shuffleArray
}; 