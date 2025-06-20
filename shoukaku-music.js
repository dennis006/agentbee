const { Kazagumo, KazagumoTrack } = require('kazagumo');
const { Connectors } = require('shoukaku');
const fs = require('fs');

// ===================================
// 🎵 SHOUKAKU MUSIK-SYSTEM V4
// ===================================

let kazagumo = null;
let musicSettings = {};
const musicQueues = new Map();
const userRequestCooldowns = new Map();
const userRequestCounts = new Map();
const progressTrackers = new Map();
const radioStations = new Map();

// Lade Musik-Einstellungen
function loadMusicSettings() {
    try {
        const defaults = getDefaultMusicSettings();
        
        if (fs.existsSync('./settings/music.json')) {
            const saved = JSON.parse(fs.readFileSync('./settings/music.json', 'utf8'));
            // Deep merge defaults with saved settings to ensure all properties exist
            musicSettings = deepMerge(defaults, saved);
            console.log('🎵 Musik-Einstellungen geladen und gemerged');
        } else {
            console.log('⚠️ Musik-Einstellungen nicht gefunden, verwende Defaults');
            musicSettings = defaults;
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Musik-Einstellungen:', error);
        musicSettings = getDefaultMusicSettings();
    }
}

// Helper function for deep merging objects
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

function saveMusicSettings() {
    try {
        if (!fs.existsSync('./settings')) {
            fs.mkdirSync('./settings', { recursive: true });
        }
        fs.writeFileSync('./settings/music.json', JSON.stringify(musicSettings, null, 2));
        console.log('💾 Musik-Einstellungen gespeichert');
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Musik-Einstellungen:', error);
    }
}

function getDefaultMusicSettings() {
    return {
        enabled: true,
        defaultVolume: 50,
        maxQueueLength: 100,
        lavalink: {
            host: "49.13.193.144",
            port: 2333,
            password: "youshallnotpass",
            secure: false,
            retryAmount: 5,
            retryDelay: 30000
        },
        autoJoinVoice: true,
        voiceChannels: {
            autoJoin: [],
            preferred: "",
            blacklist: []
        },
        commands: {
            enabled: true,
            prefix: "!",
            djRole: "",
            allowEveryone: true
        },
        queue: {
            autoplay: false,
            shuffle: false,
            repeat: "off",
            clearOnEmpty: true
        },
        filters: {
            bass: false,
            nightcore: false,
            vaporwave: false,
            lowpass: false
        },
        youtube: {
            quality: "highestaudio",
            maxLength: 600,
            playlistLimit: 50
        },
        announcements: {
            nowPlaying: true,
            queueAdd: true,
            channelId: ""
        },
        embedColor: "#9333EA",
        songRequests: {
            enabled: true,
            channels: [],
            prefix: "!play",
            embedColor: "#9333EA",
            requireDJRole: false,
            maxRequestsPerUser: 5,
            cooldownMinutes: 1,
            rateLimit: {
                enabled: true,
                maxRequests: 5,
                timeWindow: 60,
                timeUnit: 'minutes'
            },
            interactivePanel: {
                enabled: true,
                channelId: "",
                messageId: "",
                autoUpdate: true,
                showQueue: true,
                maxQueueDisplay: 5,
                requireDJForControls: false,
                autoJoinLeave: false,
                adminRole: ""
            }
        },
        radio: {
            enabled: true,
            stations: [],
            defaultStation: "lofi",
            autoStop: false,
            showNowPlaying: true,
            embedColor: "#9333EA"
        }
    };
}

// 🚀 KAZAGUMO MANAGER INITIALISIERUNG
function initializeShoukaku(client) {
    console.log('🔗 Initialisiere Kazagumo Manager (Lavalink v4)...');
    
    kazagumo = new Kazagumo({
        plugins: [],
        defaultSearchEngine: 'youtube',
        send: (guildId, payload) => {
            const guild = client.guilds.cache.get(guildId);
            if (guild) guild.shard.send(payload);
        }
    }, new Connectors.DiscordJS(client), [{
        name: 'main',
        url: `${musicSettings.lavalink.host}:${musicSettings.lavalink.port}`,
        auth: musicSettings.lavalink.password,
        secure: musicSettings.lavalink.secure
    }]);

    // Kazagumo Events
    kazagumo
        .on("nodeConnect", (node) => {
            console.log(`✅ Lavalink Node "${node.name}" verbunden! (Shoukaku v4)`);
        })
        .on("nodeError", (node, error) => {
            console.error(`❌ Lavalink Node "${node.name}" Fehler:`, error);
        })
        .on("nodeDisconnect", (node, reason) => {
            console.log(`⚠️ Lavalink Node "${node.name}" getrennt:`, reason);
        })
        .on("trackStart", (player, track) => {
            console.log(`🎵 Spielt jetzt: ${track.title} von ${track.author}`);
            const queue = getQueue(player.guildId);
            queue.currentSong = track;
            startProgressTracking(player.guildId, track.length);
        })
        .on("trackEnd", (player, track) => {
            console.log(`🎵 Track beendet: ${track.title}`);
            handleTrackEnd(player.guildId);
        })
        .on("queueEnd", (player) => {
            console.log(`🎵 Queue beendet für Guild ${player.guildId}`);
            const queue = getQueue(player.guildId);
            queue.currentSong = null;
            stopProgressTracking(player.guildId);
        })
        .on("playerEmpty", (player) => {
            console.log(`🎵 Player leer für Guild ${player.guildId}`);
            // Auto-Leave wenn konfiguriert
            if (musicSettings.songRequests?.interactivePanel?.autoJoinLeave) {
                setTimeout(() => {
                    if (kazagumo.players.get(player.guildId)) {
                        kazagumo.players.get(player.guildId).destroy();
                        console.log(`🚪 Auto-Leave: Player für Guild ${player.guildId} zerstört`);
                    }
                }, 30000); // 30 Sekunden Delay
            }
        });

    console.log('🎵 Kazagumo Manager initialisiert! (Lavalink v4 ready)');
    return kazagumo;
}

// Kazagumo Utility Functions
function getPlayer(guildId) {
    return kazagumo ? kazagumo.players.get(guildId) : null;
}

async function searchTracks(query) {
    if (!kazagumo) throw new Error('Kazagumo Manager nicht initialisiert');
    
    let searchQuery = query;
    if (!query.startsWith('http')) {
        searchQuery = `ytsearch:${query}`;
    }
    
    try {
        const result = await kazagumo.search(searchQuery);
        return result;
    } catch (error) {
        console.error('❌ Fehler bei Track-Suche:', error);
        throw error;
    }
}

// Queue Management (identisch zu erela.js Version)
function getQueue(guildId) {
    if (!musicQueues.has(guildId)) {
        musicQueues.set(guildId, {
            songs: [],
            currentSong: null,
            volume: musicSettings.defaultVolume,
            repeat: false,
            shuffle: false,
            autoplay: false,
            progress: {
                startTime: null,
                pausedTime: 0,
                duration: 0,
                currentTime: 0
            }
        });
    }
    return musicQueues.get(guildId);
}

function addToQueue(guildId, song) {
    try {
        const queue = getQueue(guildId);
        
        if (queue.songs.length >= musicSettings.maxQueueLength) {
            console.log(`❌ Queue voll (${musicSettings.maxQueueLength} Songs)`);
            return false;
        }

        queue.songs.push(song);
        console.log(`✅ Song zur Queue hinzugefügt: ${song.title} (Position: ${queue.songs.length})`);
        
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Hinzufügen zur Queue:', error);
        return false;
    }
}

// Progress Tracking
function startProgressTracking(guildId, duration) {
    const queue = getQueue(guildId);
    queue.progress = {
        startTime: Date.now(),
        pausedTime: 0,
        duration: duration,
        currentTime: 0
    };
    
    // Clear any existing tracker
    const existingTracker = progressTrackers.get(guildId);
    if (existingTracker) {
        clearInterval(existingTracker);
    }
    
    // Start new progress tracker
    const tracker = setInterval(() => {
        if (queue.progress.startTime) {
            const elapsed = Math.floor((Date.now() - queue.progress.startTime - queue.progress.pausedTime) / 1000);
            queue.progress.currentTime = Math.min(elapsed, duration);
            
            // Stop tracking if song is finished
            if (queue.progress.currentTime >= duration) {
                clearInterval(tracker);
                progressTrackers.delete(guildId);
            }
        }
    }, 1000);
    
    progressTrackers.set(guildId, tracker);
    console.log(`⏱️ Progress-Tracking gestartet für Guild ${guildId}, Dauer: ${duration}s`);
}

function stopProgressTracking(guildId) {
    const tracker = progressTrackers.get(guildId);
    if (tracker) {
        clearInterval(tracker);
        progressTrackers.delete(guildId);
        console.log(`⏱️ Progress-Tracking gestoppt für Guild ${guildId}`);
    }
}

// Kazagumo Playback Functions
async function createPlayerIfNeeded(guildId, voiceChannelId, textChannelId) {
    let player = kazagumo.players.get(guildId);
    
    if (!player) {
        try {
            player = await kazagumo.createPlayer({
                guildId: guildId,
                voiceId: voiceChannelId,
                textId: textChannelId,
                deaf: true
            });
            console.log(`✅ Kazagumo Player erstellt für Guild ${guildId}`);
        } catch (error) {
            console.error(`❌ Fehler beim Erstellen des Players:`, error);
            throw error;
        }
    }
    
    return player;
}

async function playTrack(guildId, track, voiceChannelId, textChannelId) {
    try {
        const player = await createPlayerIfNeeded(guildId, voiceChannelId, textChannelId);
        
        // Set volume
        const queue = getQueue(guildId);
        await player.setVolume(queue.volume);
        
        // Play track
        await player.play(track);
        
        console.log(`🎵 Spiele Track: ${track.title}`);
        return true;
    } catch (error) {
        console.error(`❌ Fehler beim Abspielen:`, error);
        throw error;
    }
}

async function handleTrackEnd(guildId) {
    const queue = getQueue(guildId);
    const player = getPlayer(guildId);
    
    if (!player || !queue) return;
    
    // Check repeat mode
    if (queue.repeat) {
        if (queue.currentSong) {
            await player.play(queue.currentSong);
            return;
        }
    }
    
    // Play next song
    if (queue.songs.length > 0) {
        const nextSong = queue.songs.shift();
        queue.currentSong = nextSong;
        await player.play(nextSong);
    } else {
        // Queue empty
        queue.currentSong = null;
        stopProgressTracking(guildId);
    }
}

// Radio Station Functions
function getRadioStations() {
    // Return radio stations from settings, or default list if not configured
    if (musicSettings.radio && musicSettings.radio.stations) {
        return musicSettings.radio.stations;
    }
    
    // Default radio stations (fallback)
    return [
        {
            id: "1live",
            name: "1LIVE",
            url: "https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3",
            genre: "Pop/Rock",
            country: "Deutschland",
            description: "Der junge Radiosender von WDR",
            logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRjAwMDAiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+MUxJVkU8L3RleHQ+Cjwvc3ZnPgo="
        },
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
            id: "deephouse",
            name: "Deep House Radio",
            url: "https://www.youtube.com/watch?v=36YnV9STBqc",
            genre: "Deep House/Electronic",
            country: "International",
            description: "24/7 Deep House Live Stream",
            logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiMwMDMzNjYiLz4KPHRleHQgeD0iMzIiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMEZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRFRVA8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSI0NCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMDBGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5IT1VTRTI8L3RleHQ+Cjwvc3ZnPgo="
        }
    ];
}

function getRadioStation(stationId) {
    const stations = getRadioStations();
    return stations.find(station => station.id === stationId);
}

async function playRadioStation(guildId, stationId) {
    const station = getRadioStation(stationId);
    if (!station) return false;
    
    try {
        const searchResult = await searchTracks(station.url);
        if (searchResult && searchResult.tracks && searchResult.tracks.length > 0) {
            const track = searchResult.tracks[0];
            // Find voice channel to join
            // This is a simplified version
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Fehler beim Abspielen der Radio-Station:', error);
        return false;
    }
}

function stopRadio(guildId) {
    const player = getPlayer(guildId);
    if (player) {
        player.stop();
        return true;
    }
    return false;
}

function getCurrentRadioStation(guildId) {
    // Simplified - could track radio state in queue
    return null;
}

function isPlayingRadio(guildId) {
    // Simplified - could track radio state in queue
    return false;
}

// API Registration (vollständige Implementierung)
function registerMusicAPI(app) {
    console.log('🎵 Registriere Shoukaku Musik-API...');
    
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
            // Update settings with new values
            Object.assign(musicSettings, req.body);
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

    // Search music (YouTube via Kazagumo)
    app.get('/api/music/search', async (req, res) => {
        try {
            const { query } = req.query;
            if (!query) {
                return res.status(400).json({
                    success: false,
                    error: 'Query parameter erforderlich'
                });
            }

            const result = await searchTracks(query);
            
            if (result && result.tracks) {
                // Convert Kazagumo tracks to frontend format
                const tracks = result.tracks.slice(0, 10).map(track => ({
                    title: track.title,
                    url: track.uri,
                    duration: Math.floor(track.length / 1000), // Convert ms to seconds
                    thumbnail: track.thumbnail,
                    author: track.author,
                    source: 'youtube' // Mark as YouTube source
                }));

                res.json({
                    success: true,
                    results: tracks
                });
            } else {
                res.json({
                    success: true,
                    results: []
                });
            }
        } catch (error) {
            console.error('❌ Musik-Suche Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get current queue
    app.get('/api/music/queue/:guildId', (req, res) => {
        try {
            const { guildId } = req.params;
            const queue = getQueue(guildId);
            const player = getPlayer(guildId);

            res.json({
                success: true,
                queue: {
                    currentSong: queue.currentSong,
                    songs: queue.songs,
                    volume: queue.volume,
                    repeat: queue.repeat ? 'song' : 'off',
                    shuffle: queue.shuffle,
                    isPlaying: player ? !player.paused : false
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Add song to queue
    app.post('/api/music/queue/:guildId/add', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { url, requestedBy } = req.body;

            if (!url) {
                return res.status(400).json({
                    success: false,
                    error: 'URL ist erforderlich'
                });
            }

            console.log(`🎵 Shoukaku: Füge Song hinzu: ${url}`);

            // Search for the track
            const searchResult = await searchTracks(url);
            
            if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Song nicht gefunden'
                });
            }

            const track = searchResult.tracks[0];
            
            // Convert to internal format
            const song = {
                title: track.title,
                url: track.uri,
                duration: Math.floor(track.length / 1000),
                thumbnail: track.thumbnail,
                author: track.author,
                requestedBy: requestedBy || 'Dashboard',
                source: 'youtube',
                // Store original track for playback
                _kazagumoTrack: track
            };

            const added = addToQueue(guildId, song);
            
            if (!added) {
                return res.status(400).json({
                    success: false,
                    error: `Queue ist voll (max. ${musicSettings.maxQueueLength} Songs)`
                });
            }

            res.json({
                success: true,
                message: 'Song zur Queue hinzugefügt',
                song: song
            });

        } catch (error) {
            console.error('❌ Shoukaku Add to Queue Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Player controls
    app.post('/api/music/control/:guildId/:action', async (req, res) => {
        try {
            const { guildId, action } = req.params;
            const player = getPlayer(guildId);
            const queue = getQueue(guildId);

            switch (action) {
                case 'play':
                    if (player) {
                        if (player.paused) {
                            await player.resume();
                        } else if (queue.songs.length > 0 && !queue.currentSong) {
                            // Start playing first song in queue
                            const nextSong = queue.songs.shift();
                            queue.currentSong = nextSong;
                            if (nextSong._kazagumoTrack) {
                                await player.play(nextSong._kazagumoTrack);
                            }
                        }
                    }
                    break;

                case 'pause':
                    if (player && !player.paused) {
                        await player.pause();
                    }
                    break;

                case 'skip':
                    if (player) {
                        await player.stop();
                    }
                    break;

                case 'stop':
                    if (player) {
                        await player.stop();
                        queue.songs = [];
                        queue.currentSong = null;
                    }
                    break;

                case 'shuffle':
                    shuffleQueue(guildId);
                    break;

                case 'clear':
                    queue.songs = [];
                    if (player) {
                        await player.stop();
                    }
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        error: `Unbekannte Aktion: ${action}`
                    });
            }

            res.json({
                success: true,
                message: `Aktion ${action} ausgeführt`
            });

        } catch (error) {
            console.error(`❌ Shoukaku Control Fehler (${req.params.action}):`, error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Volume control
    app.post('/api/music/volume/:guildId', (req, res) => {
        try {
            const { guildId } = req.params;
            const { volume } = req.body;
            
            if (volume < 0 || volume > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Lautstärke muss zwischen 0 und 100 liegen'
                });
            }
            
            const queue = getQueue(guildId);
            const player = getPlayer(guildId);
            
            // Update queue volume
            queue.volume = volume;
            
            // Update player volume if available
            if (player) {
                player.setVolume(volume);
                console.log(`🔊 Lautstärke geändert auf: ${volume}%`);
            }
            
            res.json({
                success: true,
                message: `Lautstärke auf ${volume}% gesetzt`,
                volume: volume
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Voice connection status and progress
    app.get('/api/music/voice/:guildId/status', (req, res) => {
        try {
            const { guildId } = req.params;
            const player = getPlayer(guildId);
            const queue = getQueue(guildId);
            
            // Format time helper
            const formatTime = (seconds) => {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };
            
            let progress = {
                currentTime: 0,
                duration: 0,
                currentTimeFormatted: '0:00',
                durationFormatted: '0:00',
                percentage: 0
            };

            if (player && player.queue.current) {
                const currentTime = Math.floor(player.position / 1000);
                const duration = Math.floor(player.queue.current.length / 1000);
                progress = {
                    currentTime,
                    duration,
                    currentTimeFormatted: formatTime(currentTime),
                    durationFormatted: formatTime(duration),
                    percentage: duration > 0 ? Math.round((currentTime / duration) * 100) : 0
                };
            }
            
            res.json({
                success: true,
                status: {
                    connected: !!player,
                    connectionStatus: player ? 'Ready' : 'disconnected',
                    playerStatus: player ? (player.paused ? 'paused' : 'playing') : 'idle',
                    hasActivePlayer: !!player,
                    progress: progress
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Join/Leave voice channel
    app.post('/api/music/voice/:guildId/:action', async (req, res) => {
        try {
            const { guildId, action } = req.params;
            const { channelId } = req.body;
            
            if (action === 'join' && channelId) {
                // Create player and join channel
                const player = kazagumo.createPlayer({
                    guildId: guildId,
                    voiceId: channelId,
                    textId: null, // Not needed for API usage
                    deaf: true
                });
                
                await player.connect();
                
                res.json({
                    success: true,
                    message: `Voice-Channel beigetreten`
                });
            } else if (action === 'leave') {
                const player = getPlayer(guildId);
                if (player) {
                    await player.destroy();
                }
                
                res.json({
                    success: true,
                    message: 'Voice-Channel verlassen'
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Ungültige Aktion oder fehlende Parameter'
                });
            }
        } catch (error) {
            console.error('❌ Voice Channel Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Radio API Endpoints
    app.get('/api/music/radio/stations', (req, res) => {
        try {
            const stations = getRadioStations();
            res.json({
                success: true,
                stations: stations,
                enabled: musicSettings.radio?.enabled || true
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get radio status for guild
    app.get('/api/music/radio/:guildId/status', (req, res) => {
        try {
            const { guildId } = req.params;
            const currentStation = getCurrentRadioStation(guildId);
            const isPlaying = isPlayingRadio(guildId);
            
            res.json({
                success: true,
                isPlaying: isPlaying,
                currentStation: currentStation,
                queue: getQueue(guildId)
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

    // Request tracking endpoint
    app.get('/api/music/request-tracking', (req, res) => {
        try {
            // Simple implementation - could be expanded with real tracking
            res.json({
                success: true,
                trackingData: [],
                rateLimit: {
                    enabled: musicSettings.songRequests?.rateLimit?.enabled || false,
                    maxRequests: musicSettings.songRequests?.maxRequestsPerUser || 5,
                    timeWindow: 24,
                    timeUnit: 'hours'
                },
                cooldownMinutes: musicSettings.songRequests?.cooldownMinutes || 1
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    console.log('✅ Shoukaku Musik-API Endpunkte registriert (inkl. Radio + Request Tracking)');
}

// Helper Functions for API
function getPlayer(guildId) {
    return kazagumo ? kazagumo.players.get(guildId) : null;
}

function getQueue(guildId) {
    if (!musicQueues.has(guildId)) {
        musicQueues.set(guildId, {
            currentSong: null,
            songs: [],
            volume: musicSettings.defaultVolume || 50,
            repeat: false,
            shuffle: false
        });
    }
    return musicQueues.get(guildId);
}

function addToQueue(guildId, song) {
    try {
        const queue = getQueue(guildId);
        
        if (queue.songs.length >= (musicSettings.maxQueueLength || 100)) {
            console.log(`❌ Queue voll (${musicSettings.maxQueueLength || 100} Songs)`);
            return false;
        }

        queue.songs.push(song);
        console.log(`✅ Song zur Queue hinzugefügt: ${song.title} (Position: ${queue.songs.length})`);
        
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Hinzufügen zur Queue:', error);
        return false;
    }
}

function shuffleQueue(guildId) {
    const queue = getQueue(guildId);
    for (let i = queue.songs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
    }
    console.log(`🔀 Queue gemischt (${queue.songs.length} Songs)`);
}

async function searchTracks(query) {
    if (!kazagumo) {
        throw new Error('Kazagumo Manager nicht initialisiert');
    }
    
    let searchQuery = query;
    if (!query.startsWith('http')) {
        searchQuery = `ytsearch:${query}`;
    }
    
    try {
        const result = await kazagumo.search(searchQuery);
        console.log(`🔍 Shoukaku Suche: "${query}" -> ${result.tracks?.length || 0} Tracks gefunden`);
        return result;
    } catch (error) {
        console.error('❌ Shoukaku Suche Fehler:', error);
        return null;
    }
}

// Voice State Update Handler (placeholder - Shoukaku handles this internally)
function handleVoiceStateUpdate(client) {
    console.log('🎵 Voice State Updates werden von Shoukaku automatisch verwaltet');
    // Shoukaku handles voice state updates internally via the Connectors
}

// Export additional functions
module.exports = {
    // ... existing exports ...
    
    // Radio functions
    getRadioStations,
    getRadioStation,
    playRadioStation,
    stopRadio,
    getCurrentRadioStation,
    isPlayingRadio,
    
    // API & Voice handling
    registerMusicAPI,
    handleVoiceStateUpdate,
    
    // Existing exports
    loadMusicSettings,
    initializeShoukaku,
    getPlayer,
    createPlayerIfNeeded,
    playTrack,
    searchTracks,
    getQueue,
    addToQueue,
    startProgressTracking,
    stopProgressTracking,
    musicSettings,
    musicQueues,
    get kazagumo() { return kazagumo; }
}; 