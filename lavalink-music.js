// Lavalink Music System

const { Manager } = require("erela.js");
const fs = require('fs');
const path = require('path');

// 🎵 LAVALINK MUSIK-SYSTEM mit erela.js
console.log('🚀 Lavalink Musik-System wird initialisiert...');

// Music Settings Management
let musicSettings = {
    enabled: true,
    defaultVolume: 50,
    maxQueueLength: 100,
    lavalink: {
        host: '49.13.193.144',
        port: 2333,
        password: 'youshallnotpass',
        secure: false,
        retryAmount: 3,
        retryDelay: 5000
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
        repeat: "off", // off, track, queue
        clearOnEmpty: true
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
        cooldownMinutes: 1
    }
};

// Lavalink Manager Instance
let manager = null;

// Load settings
function loadMusicSettings() {
    try {
        if (fs.existsSync('music-settings.json')) {
            const data = fs.readFileSync('music-settings.json', 'utf8');
            const loadedSettings = JSON.parse(data);
            musicSettings = deepMerge(musicSettings, loadedSettings);
            console.log('🎵 Musik-Einstellungen geladen');
        } else {
            saveMusicSettings();
            console.log('🎵 Standard-Musik-Einstellungen erstellt');
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Musik-Einstellungen:', error);
    }
}

function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    
    return result;
}

function saveMusicSettings() {
    try {
        fs.writeFileSync('music-settings.json', JSON.stringify(musicSettings, null, 2));
        console.log('💾 Musik-Einstellungen gespeichert');
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Musik-Einstellungen:', error);
    }
}

// 🚀 LAVALINK MANAGER INITIALISIERUNG
function initializeLavalink(client) {
    console.log('🔗 Initialisiere Lavalink Manager...');
    
    manager = new Manager({
        nodes: [
            {
                host: musicSettings.lavalink.host,
                port: musicSettings.lavalink.port,
                password: musicSettings.lavalink.password,
                secure: musicSettings.lavalink.secure,
                retryAmount: musicSettings.lavalink.retryAmount,
                retryDelay: musicSettings.lavalink.retryDelay,
                identifier: 'main',
                // Lavalink v4 Endpunkte
                restVersion: 'v4',
                wsPath: '/v4/websocket'
            }
        ],
        // Discord Client
        send: (id, payload) => {
            const guild = client.guilds.cache.get(id);
            if (guild) guild.shard.send(payload);
        },
        // Weitere Optionen
        autoPlay: true,
        clientName: 'AgentBee-Bot',
        clientId: client.user?.id,
        defaultSearchPlatform: 'ytsearch',
        restTimeout: 10000,
        shards: 1
    });

    // 🎵 PLAYER EVENTS
    manager
        .on("nodeConnect", node => {
            console.log(`✅ Lavalink Node "${node.options.identifier}" verbunden!`);
        })
        .on("nodeError", (node, error) => {
            console.error(`❌ Lavalink Node "${node.options.identifier}" Fehler:`, error);
        })
        .on("nodeDisconnect", (node, reason) => {
            console.log(`🔌 Lavalink Node "${node.options.identifier}" getrennt:`, reason);
        })
        .on("trackStart", (player, track) => {
            console.log(`🎵 Spielt jetzt: ${track.title} von ${track.author}`);
            
            // Send now playing message if enabled
            if (musicSettings.announcements.nowPlaying && musicSettings.announcements.channelId) {
                sendNowPlayingMessage(player.guild, track);
            }
        })
        .on("trackEnd", (player, track, payload) => {
            console.log(`⏹️ Track beendet: ${track.title}`);
        })
        .on("queueEnd", (player) => {
            console.log(`📭 Queue leer für Guild: ${player.guild}`);
            
            // Auto-leave when queue is empty
            if (musicSettings.queue.clearOnEmpty) {
                setTimeout(() => {
                    if (player.queue.size === 0 && !player.playing) {
                        player.destroy();
                        console.log(`🚪 Bot hat Voice-Channel verlassen (Queue leer): ${player.guild}`);
                    }
                }, 30000); // 30 Sekunden warten
            }
        })
        .on("playerCreate", (player) => {
            console.log(`🎮 Player erstellt für Guild: ${player.guild}`);
        })
        .on("playerDestroy", (player) => {
            console.log(`🗑️ Player zerstört für Guild: ${player.guild}`);
        })
        .on("playerMove", (player, initChannel, newChannel) => {
            player.voiceChannel = newChannel;
            console.log(`🔄 Player verschoben: ${initChannel} → ${newChannel}`);
        })
        .on("playerError", (player, error) => {
            console.error(`❌ Player Fehler für Guild ${player.guild}:`, error);
        })
        .on("trackError", (player, track, payload) => {
            console.error(`❌ Track Fehler: ${track.title}`, payload);
        })
        .on("trackStuck", (player, track, payload) => {
            console.error(`🚫 Track hängengeblieben: ${track.title}`, payload);
        });

    // Initialize Lavalink
    manager.init(client.user.id);
    console.log('🎵 Lavalink Manager initialisiert!');
    
    return manager;
}

// 🎵 UTILITY FUNCTIONS

function getPlayer(guildId) {
    return manager ? manager.players.get(guildId) : null;
}

function createPlayer(guildId, voiceChannelId, textChannelId) {
    if (!manager) {
        throw new Error('Lavalink Manager nicht initialisiert');
    }
    
    return manager.create({
        guild: guildId,
        voiceChannel: voiceChannelId,
        textChannel: textChannelId,
        volume: musicSettings.defaultVolume,
        selfDeafen: true
    });
}

async function searchTracks(query) {
    if (!manager) {
        throw new Error('Lavalink Manager nicht initialisiert');
    }
    
    try {
        // Prüfe ob es eine URL ist
        let searchQuery = query;
        if (!query.startsWith('http')) {
            searchQuery = `ytsearch:${query}`;
        }
        
        const result = await manager.search(searchQuery);
        return result;
    } catch (error) {
        console.error('❌ Fehler bei der Track-Suche:', error);
        throw error;
    }
}

function formatDuration(ms) {
    if (!ms || ms === 0) return 'Live';
    
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatProgress(position, duration) {
    if (!duration || duration === 0) return { current: 'Live', total: 'Live', percentage: 0 };
    
    const currentFormatted = formatDuration(position);
    const totalFormatted = formatDuration(duration);
    const percentage = Math.round((position / duration) * 100);
    
    return {
        current: currentFormatted,
        total: totalFormatted,
        percentage: Math.min(percentage, 100)
    };
}

async function sendNowPlayingMessage(guildId, track) {
    try {
        if (!musicSettings.announcements.channelId || !global.client) return;
        
        const guild = global.client.guilds.cache.get(guildId);
        if (!guild) return;
        
        const channel = guild.channels.cache.get(musicSettings.announcements.channelId);
        if (!channel) return;
        
        const embed = {
            color: parseInt(musicSettings.embedColor.replace('#', ''), 16),
            title: '🎵 Spielt jetzt',
            description: `**${track.title}**\nvon ${track.author}`,
            fields: [
                {
                    name: '⏱️ Dauer',
                    value: formatDuration(track.duration),
                    inline: true
                },
                {
                    name: '👤 Angefragt von',
                    value: track.requester ? track.requester.tag : 'System',
                    inline: true
                }
            ],
            thumbnail: {
                url: track.thumbnail || track.displayThumbnail?.() || ''
            },
            timestamp: new Date().toISOString()
        };
        
        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('❌ Fehler beim Senden der Now-Playing Nachricht:', error);
    }
}

// 🎵 LAVALINK API ROUTES
function registerLavalinkAPI(app) {
    // Health Check
    app.get('/api/music/lavalink/status', (req, res) => {
        const nodeStatus = manager?.nodes?.map(node => ({
            identifier: node.options.identifier,
            connected: node.connected,
            stats: node.stats
        })) || [];
        
        res.json({
            success: true,
            manager: !!manager,
            nodes: nodeStatus,
            settings: musicSettings
        });
    });

    // 🎵 PLAY TRACK
    app.post('/api/music/play', async (req, res) => {
        try {
            const { guildId, query, userId, voiceChannelId, textChannelId } = req.body;
            
            if (!query) {
                return res.status(400).json({
                    success: false,
                    error: 'Query ist erforderlich'
                });
            }
            
            if (!voiceChannelId) {
                return res.status(400).json({
                    success: false,
                    error: 'Voice-Channel ID ist erforderlich'
                });
            }
            
            console.log(`🎵 Lavalink Play Request: ${query} in Guild: ${guildId}`);
            
            // Suche Tracks
            const searchResult = await searchTracks(query);
            
            if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Keine Tracks gefunden'
                });
            }
            
            // Hole oder erstelle Player
            let player = getPlayer(guildId);
            if (!player) {
                player = createPlayer(guildId, voiceChannelId, textChannelId);
            }
            
            // Verbinde falls nicht verbunden
            if (player.state !== 'CONNECTED') {
                player.connect();
            }
            
            const track = searchResult.tracks[0];
            
            // Setze Requester Info
            if (userId && global.client) {
                const user = global.client.users.cache.get(userId);
                if (user) {
                    track.setRequester(user);
                }
            }
            
            // Füge Track zur Queue hinzu
            player.queue.add(track);
            
            // Starte Wiedergabe falls nicht spielend
            if (!player.playing && !player.paused && !player.queue.size) {
                await player.play();
            }
            
            const queuePosition = player.queue.size;
            
            res.json({
                success: true,
                message: queuePosition === 0 ? 'Track wird abgespielt' : `Track zur Queue hinzugefügt (Position ${queuePosition})`,
                track: {
                    title: track.title,
                    author: track.author,
                    duration: formatDuration(track.duration),
                    thumbnail: track.thumbnail,
                    uri: track.uri,
                    requester: track.requester?.tag || 'System'
                },
                queue: {
                    size: player.queue.size,
                    position: queuePosition
                }
            });
            
        } catch (error) {
            console.error('❌ Lavalink Play Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // ⏭️ SKIP TRACK
    app.post('/api/music/skip', async (req, res) => {
        try {
            const { guildId } = req.body;
            
            const player = getPlayer(guildId);
            if (!player) {
                return res.status(404).json({
                    success: false,
                    error: 'Kein aktiver Player gefunden'
                });
            }
            
            if (!player.queue.current) {
                return res.status(400).json({
                    success: false,
                    error: 'Kein Track spielt derzeit'
                });
            }
            
            const currentTrack = player.queue.current.title;
            await player.stop();
            
            res.json({
                success: true,
                message: `Track übersprungen: ${currentTrack}`,
                nextTrack: player.queue.size > 0 ? {
                    title: player.queue[0].title,
                    author: player.queue[0].author
                } : null
            });
            
        } catch (error) {
            console.error('❌ Skip Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // ⏸️ PAUSE TRACK
    app.post('/api/music/pause', async (req, res) => {
        try {
            const { guildId } = req.body;
            
            const player = getPlayer(guildId);
            if (!player) {
                return res.status(404).json({
                    success: false,
                    error: 'Kein aktiver Player gefunden'
                });
            }
            
            if (!player.playing) {
                return res.status(400).json({
                    success: false,
                    error: 'Kein Track spielt derzeit'
                });
            }
            
            await player.pause(true);
            
            res.json({
                success: true,
                message: 'Wiedergabe pausiert'
            });
            
        } catch (error) {
            console.error('❌ Pause Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // ▶️ RESUME TRACK
    app.post('/api/music/resume', async (req, res) => {
        try {
            const { guildId } = req.body;
            
            const player = getPlayer(guildId);
            if (!player) {
                return res.status(404).json({
                    success: false,
                    error: 'Kein aktiver Player gefunden'
                });
            }
            
            if (!player.paused) {
                return res.status(400).json({
                    success: false,
                    error: 'Wiedergabe ist nicht pausiert'
                });
            }
            
            await player.pause(false);
            
            res.json({
                success: true,
                message: 'Wiedergabe fortgesetzt'
            });
            
        } catch (error) {
            console.error('❌ Resume Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // 🚪 LEAVE VOICE CHANNEL
    app.post('/api/music/leave', async (req, res) => {
        try {
            const { guildId } = req.body;
            
            const player = getPlayer(guildId);
            if (!player) {
                return res.status(404).json({
                    success: false,
                    error: 'Kein aktiver Player gefunden'
                });
            }
            
            await player.destroy();
            
            res.json({
                success: true,
                message: 'Bot hat Voice-Channel verlassen'
            });
            
        } catch (error) {
            console.error('❌ Leave Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // 📋 GET QUEUE
    app.get('/api/music/queue/:guildId', (req, res) => {
        try {
            const { guildId } = req.params;
            
            const player = getPlayer(guildId);
            if (!player) {
                return res.json({
                    success: true,
                    queue: {
                        current: null,
                        tracks: [],
                        size: 0,
                        totalDuration: 0
                    },
                    player: {
                        playing: false,
                        paused: false,
                        connected: false,
                        volume: musicSettings.defaultVolume
                    }
                });
            }
            
            const current = player.queue.current;
            const tracks = player.queue.map(track => ({
                title: track.title,
                author: track.author,
                duration: formatDuration(track.duration),
                thumbnail: track.thumbnail,
                uri: track.uri,
                requester: track.requester?.tag || 'System'
            }));
            
            const totalDuration = player.queue.reduce((total, track) => total + track.duration, 0);
            
            res.json({
                success: true,
                queue: {
                    current: current ? {
                        title: current.title,
                        author: current.author,
                        duration: formatDuration(current.duration),
                        thumbnail: current.thumbnail,
                        uri: current.uri,
                        requester: current.requester?.tag || 'System',
                        progress: formatProgress(player.position, current.duration)
                    } : null,
                    tracks: tracks,
                    size: player.queue.size,
                    totalDuration: formatDuration(totalDuration)
                },
                player: {
                    playing: player.playing,
                    paused: player.paused,
                    connected: player.state === 'CONNECTED',
                    volume: player.volume,
                    repeatMode: player.queueRepeat ? 'queue' : (player.trackRepeat ? 'track' : 'off'),
                    position: player.position
                }
            });
            
        } catch (error) {
            console.error('❌ Queue Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // 🔊 SET VOLUME
    app.post('/api/music/volume', async (req, res) => {
        try {
            const { guildId, volume } = req.body;
            
            if (volume < 0 || volume > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Lautstärke muss zwischen 0 und 100 liegen'
                });
            }
            
            const player = getPlayer(guildId);
            if (!player) {
                return res.status(404).json({
                    success: false,
                    error: 'Kein aktiver Player gefunden'
                });
            }
            
            await player.setVolume(volume);
            
            res.json({
                success: true,
                message: `Lautstärke auf ${volume}% gesetzt`,
                volume: volume
            });
            
        } catch (error) {
            console.error('❌ Volume Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // 🔍 SEARCH TRACKS
    app.get('/api/music/search', async (req, res) => {
        try {
            const { query } = req.query;
            
            if (!query) {
                return res.status(400).json({
                    success: false,
                    error: 'Suchbegriff ist erforderlich'
                });
            }
            
            const result = await searchTracks(query);
            
            if (!result || !result.tracks || result.tracks.length === 0) {
                return res.json({
                    success: true,
                    tracks: [],
                    loadType: result?.loadType || 'NO_MATCHES'
                });
            }
            
            const tracks = result.tracks.slice(0, 10).map(track => ({
                title: track.title,
                author: track.author,
                duration: formatDuration(track.duration),
                thumbnail: track.thumbnail,
                uri: track.uri
            }));
            
            res.json({
                success: true,
                tracks: tracks,
                loadType: result.loadType
            });
            
        } catch (error) {
            console.error('❌ Search Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // 🗑️ CLEAR QUEUE
    app.post('/api/music/clear', async (req, res) => {
        try {
            const { guildId } = req.body;
            
            const player = getPlayer(guildId);
            if (!player) {
                return res.status(404).json({
                    success: false,
                    error: 'Kein aktiver Player gefunden'
                });
            }
            
            const clearedCount = player.queue.size;
            await player.queue.clear();
            
            res.json({
                success: true,
                message: `${clearedCount} Tracks aus der Queue entfernt`
            });
            
        } catch (error) {
            console.error('❌ Clear Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // ⚙️ GET/UPDATE SETTINGS
    app.get('/api/music/settings', (req, res) => {
        res.json({
            success: true,
            settings: musicSettings
        });
    });

    app.post('/api/music/settings', (req, res) => {
        try {
            musicSettings = { ...musicSettings, ...req.body };
            saveMusicSettings();
            res.json({
                success: true,
                message: 'Einstellungen gespeichert',
                settings: musicSettings
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
}

// Raw voice state update handler for Lavalink
function handleVoiceStateUpdate(client) {
    client.ws.on('VOICE_STATE_UPDATE', data => {
        if (manager) {
            manager.updateVoiceState(data);
        }
    });

    client.ws.on('VOICE_SERVER_UPDATE', data => {
        if (manager) {
            manager.updateVoiceState(data);
        }
    });
}

module.exports = {
    initializeLavalink,
    registerLavalinkAPI,
    handleVoiceStateUpdate,
    loadMusicSettings,
    saveMusicSettings,
    musicSettings,
    getPlayer,
    manager: () => manager
};
