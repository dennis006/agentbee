// 🎵 LAVALINK MUSIK-SYSTEM
// Professionelle YouTube-Bot-Detection-freie Musik-Lösung

const { Manager } = require('erela.js');
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');

// Import Lavalink Config
const { 
    lavalink, 
    selectBestNode, 
    resolveTrackSource, 
    logNodePerformance 
} = require('./lavalink-config');

// Bot-Instanz (wird von index.js gesetzt)
let client = null;

// 🎵 Lavalink Manager
let manager = null;

// 📁 Einstellungen laden
let musicSettings = {};
try {
    const settingsPath = path.join(__dirname, 'music-settings.json');
    if (fs.existsSync(settingsPath)) {
        musicSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
} catch (error) {
    console.log('⚠️ Music-Settings laden fehlgeschlagen, verwende Defaults:', error.message);
    musicSettings = {
        defaultVolume: 80,
        maxPlaylistLength: 100,
        embedColor: '#FF6B6B',
        queue: {
            maxLength: 50,
            clearOnEmpty: true
        },
        announcements: {
            enabled: true,
            channelId: null
        }
    };
}

// 🚀 Lavalink Manager initialisieren
function initializeLavalink(botClient) {
    client = botClient;
    
    console.log('🎵 Initialisiere Lavalink-System...');
    
    manager = new Manager({
        // 🔧 Lavalink-Nodes
        nodes: lavalink.nodes,
        
        // 🎮 Discord Client senden
        send(id, payload) {
            const guild = client.guilds.cache.get(id);
            if (guild) guild.shard.send(payload);
        },
        
        // 🎵 Player-Optionen
        ...lavalink.playerOptions
    });

    // 🔥 Event-Handler registrieren
    setupLavalinkEvents();
    
    // 🔌 Manager initialisieren
    manager.init(client.user.id);
    
    console.log('✅ Lavalink-Manager initialisiert');
    return manager;
}

// 🎪 Lavalink Event-Handler
function setupLavalinkEvents() {
    // 🟢 Node-Verbindung erfolgreich
    manager.on('nodeConnect', (node) => {
        console.log(`🟢 Lavalink-Node verbunden: ${node.identifier}`);
        logNodePerformance(node);
    });

    // 🔴 Node-Verbindung verloren
    manager.on('nodeDisconnect', (node) => {
        console.log(`🔴 Lavalink-Node getrennt: ${node.identifier}`);
    });

    // ⚠️ Node-Fehler
    manager.on('nodeError', (node, error) => {
        console.log(`⚠️ Lavalink-Node Fehler ${node.identifier}:`, error.message);
    });

    // 🎵 Track startet
    manager.on('trackStart', (player, track) => {
        const channel = client.channels.cache.get(player.textChannel);
        if (channel && musicSettings.announcements.enabled) {
            const embed = new Discord.EmbedBuilder()
                .setColor(musicSettings.embedColor || '#FF6B6B')
                .setTitle('🎵 Spielt jetzt')
                .setDescription(`**${track.title}**`)
                .addFields([
                    {
                        name: 'Autor',
                        value: track.author || 'Unbekannt',
                        inline: true
                    },
                    {
                        name: 'Dauer',
                        value: formatDuration(track.duration) || 'Live',
                        inline: true
                    },
                    {
                        name: 'Quelle',
                        value: '🎵 Lavalink (YouTube)',
                        inline: true
                    }
                ])
                .setTimestamp();

            if (track.thumbnail) {
                embed.setThumbnail(track.thumbnail);
            }

            channel.send({ embeds: [embed] }).catch(console.error);
        }

        console.log(`🎵 Spielt jetzt: ${track.title} (Lavalink)`);
    });

    // ⏭️ Track beendet
    manager.on('trackEnd', (player) => {
        console.log('⏭️ Track beendet');
    });

    // ❌ Track fehler
    manager.on('trackError', (player, track, payload) => {
        console.log(`❌ Track-Fehler: ${track.title}`, payload);
        
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            channel.send({
                embeds: [{
                    color: 0xFF6B6B,
                    title: '❌ Wiedergabe-Fehler',
                    description: `Konnte **${track.title}** nicht abspielen.\n\n⏭️ Versuche nächsten Song...`,
                    timestamp: new Date().toISOString()
                }]
            }).catch(console.error);
        }
    });

    // 🎭 Player erstellt
    manager.on('playerCreate', (player) => {
        console.log(`🎮 Lavalink-Player erstellt für Guild: ${player.guild}`);
    });

    // 🗑️ Player zerstört
    manager.on('playerDestroy', (player) => {
        console.log(`🗑️ Lavalink-Player zerstört für Guild: ${player.guild}`);
    });

    // 📊 Node-Statistiken Update
    manager.on('nodeRaw', (node, payload) => {
        if (payload.op === 'stats' && lavalink.monitoring.logNodeStats) {
            logNodePerformance(node);
        }
    });
}

// 🔍 Musik suchen und abspielen
async function searchAndPlay(query, guildId, voiceChannelId, textChannelId, requestedBy) {
    try {
        console.log(`🔍 Lavalink-Suche: "${query}" für Guild: ${guildId}`);

        // 🎯 Track-Quelle bestimmen
        const { source, query: processedQuery } = resolveTrackSource(query);
        console.log(`🎵 Verwende Quelle: ${source} für Query: ${processedQuery}`);

        // 🔍 Lavalink-Suche ausführen
        const searchResult = await manager.search(processedQuery, requestedBy);

        if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
            console.log('❌ Keine Suchergebnisse gefunden');
            
            // 🔄 Fallback-Suche mit anderen Quellen
            if (lavalink.fallback.enabled) {
                return await fallbackSearch(query, guildId, voiceChannelId, textChannelId, requestedBy);
            }
            
            return { success: false, message: 'Keine Suchergebnisse gefunden' };
        }

        console.log(`✅ ${searchResult.tracks.length} Suchergebnisse gefunden`);

        // 🎵 Ersten Track wählen
        const track = searchResult.tracks[0];
        console.log(`🎯 Gewählter Track: ${track.title} von ${track.author}`);

        // 🎮 Player für Guild erstellen/abrufen
        const player = manager.create({
            guild: guildId,
            voiceChannel: voiceChannelId,
            textChannel: textChannelId,
            volume: musicSettings.defaultVolume || 80,
            selfDeafen: true
        });

        // 🔌 Mit Voice-Channel verbinden (falls noch nicht verbunden)
        if (player.state !== 'CONNECTED') {
            player.connect();
            console.log(`🔊 Lavalink-Player verbindet mit Voice-Channel: ${voiceChannelId}`);
        }

        // ➕ Track zur Queue hinzufügen
        player.queue.add(track);

        // ▶️ Wiedergabe starten (falls nicht bereits am Spielen)
        if (!player.playing && !player.paused && !player.queue.size) {
            player.play();
        }

        console.log(`✅ Track zur Lavalink-Queue hinzugefügt: ${track.title}`);

        return {
            success: true,
            track: track,
            queueLength: player.queue.size,
            isPlaying: player.playing
        };

    } catch (error) {
        console.error('❌ Lavalink-Suche fehlgeschlagen:', error);

        // 🔄 Fallback-Suche bei Fehlern
        if (lavalink.fallback.enabled) {
            return await fallbackSearch(query, guildId, voiceChannelId, textChannelId, requestedBy);
        }

        return { 
            success: false, 
            message: `Suchfehler: ${error.message}` 
        };
    }
}

// 🔄 Fallback-Suche mit alternativen Quellen
async function fallbackSearch(originalQuery, guildId, voiceChannelId, textChannelId, requestedBy) {
    console.log(`🔄 Starte Fallback-Suche für: "${originalQuery}"`);

    for (let attempt = 0; attempt < lavalink.fallback.sources.length; attempt++) {
        const source = lavalink.fallback.sources[attempt];
        const searchQuery = `${source}:${originalQuery}`;

        try {
            console.log(`🔄 Fallback-Versuch ${attempt + 1}/${lavalink.fallback.sources.length}: ${source}`);

            const searchResult = await manager.search(searchQuery, requestedBy);

            if (searchResult && searchResult.tracks && searchResult.tracks.length > 0) {
                console.log(`✅ Fallback erfolgreich mit ${source}: ${searchResult.tracks[0].title}`);

                // Verwende gleiche Logik wie normale Suche
                const track = searchResult.tracks[0];
                const player = manager.create({
                    guild: guildId,
                    voiceChannel: voiceChannelId,
                    textChannel: textChannelId,
                    volume: musicSettings.defaultVolume || 80,
                    selfDeafen: true
                });

                if (player.state !== 'CONNECTED') {
                    player.connect();
                }

                player.queue.add(track);

                if (!player.playing && !player.paused && !player.queue.size) {
                    player.play();
                }

                return {
                    success: true,
                    track: track,
                    queueLength: player.queue.size,
                    isPlaying: player.playing,
                    fallbackSource: source
                };
            }

        } catch (fallbackError) {
            console.log(`⚠️ Fallback ${source} fehlgeschlagen: ${fallbackError.message}`);
        }

        // Warte zwischen Fallback-Versuchen
        if (attempt < lavalink.fallback.sources.length - 1) {
            await new Promise(resolve => setTimeout(resolve, lavalink.fallback.retryDelay));
        }
    }

    console.log('❌ Alle Fallback-Quellen fehlgeschlagen');
    return { success: false, message: 'Alle Suchquellen fehlgeschlagen' };
}

// ⏹️ Wiedergabe stoppen
function stopPlayback(guildId) {
    const player = manager.get(guildId);
    if (player) {
        player.stop();
        player.disconnect();
        player.destroy();
        console.log(`⏹️ Lavalink-Player gestoppt für Guild: ${guildId}`);
        return true;
    }
    return false;
}

// ⏸️ Wiedergabe pausieren
function pausePlayback(guildId) {
    const player = manager.get(guildId);
    if (player && player.playing) {
        player.pause(true);
        console.log(`⏸️ Lavalink-Player pausiert für Guild: ${guildId}`);
        return true;
    }
    return false;
}

// ▶️ Wiedergabe fortsetzen
function resumePlayback(guildId) {
    const player = manager.get(guildId);
    if (player && player.paused) {
        player.pause(false);
        console.log(`▶️ Lavalink-Player fortgesetzt für Guild: ${guildId}`);
        return true;
    }
    return false;
}

// ⏭️ Nächster Song
function skipTrack(guildId) {
    const player = manager.get(guildId);
    if (player) {
        player.stop();
        console.log(`⏭️ Lavalink-Track übersprungen für Guild: ${guildId}`);
        return true;
    }
    return false;
}

// 🔊 Lautstärke setzen
function setVolume(guildId, volume) {
    const player = manager.get(guildId);
    if (player) {
        const clampedVolume = Math.max(0, Math.min(100, volume));
        player.setVolume(clampedVolume);
        console.log(`🔊 Lavalink-Lautstärke gesetzt auf ${clampedVolume}% für Guild: ${guildId}`);
        return clampedVolume;
    }
    return null;
}

// 📋 Queue-Info abrufen
function getQueueInfo(guildId) {
    const player = manager.get(guildId);
    if (player) {
        return {
            current: player.queue.current,
            queue: player.queue,
            isPlaying: player.playing,
            isPaused: player.paused,
            volume: player.volume,
            position: player.position,
            connected: player.state === 'CONNECTED'
        };
    }
    return null;
}

// 📊 Lavalink-Statistiken
function getLavalinkStats() {
    const stats = {
        connectedNodes: manager.nodes.filter(node => node.connected).length,
        totalNodes: manager.nodes.size,
        players: manager.players.size,
        nodes: []
    };

    manager.nodes.forEach(node => {
        stats.nodes.push({
            identifier: node.identifier,
            connected: node.connected,
            stats: node.stats,
            players: node.stats?.players || 0,
            playingPlayers: node.stats?.playingPlayers || 0
        });
    });

    return stats;
}

// 🕒 Zeit formatieren
function formatDuration(ms) {
    if (!ms || ms === 0) return 'Live';
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const hours = Math.floor(ms / 1000 / 60 / 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// 🔧 Raw-Handler für Discord.js
function handleRaw(data) {
    if (manager) {
        manager.updateVoiceState(data);
    }
}

// 🚀 Lavalink-Health-Check
async function healthCheck() {
    if (!manager) return { healthy: false, reason: 'Manager nicht initialisiert' };

    const connectedNodes = manager.nodes.filter(node => node.connected);
    
    if (connectedNodes.length === 0) {
        return { healthy: false, reason: 'Keine Nodes verbunden' };
    }

    const stats = getLavalinkStats();
    return {
        healthy: true,
        stats: stats,
        bestNode: selectBestNode(manager)
    };
}

// 🔗 Queue-Management Funktionen
async function addToQueue(guildId, url, requestedBy = 'Dashboard') {
    try {
        const player = manager.get(guildId);
        if (!player) {
            return { success: false, error: 'Kein Player für diese Guild gefunden' };
        }

        // Track suchen
        const results = await manager.search(url);
        if (!results.tracks || results.tracks.length === 0) {
            return { success: false, error: 'Kein Track gefunden' };
        }

        const track = results.tracks[0];
        track.requester = requestedBy;

        // Track zur Queue hinzufügen
        player.queue.add(track);

        // Wenn nichts spielt, starte Wiedergabe
        if (!player.playing && !player.paused && player.queue.size === 1) {
            await player.play();
        }

        return {
            success: true,
            song: {
                title: track.title,
                author: track.author,
                url: track.uri,
                duration: Math.floor(track.duration / 1000),
                thumbnail: track.displayThumbnail,
                requestedBy: requestedBy,
                source: track.sourceName === 'youtube' ? 'youtube' : 
                       track.sourceName === 'spotify' ? 'spotify' : 'lavalink'
            }
        };

    } catch (error) {
        console.error('❌ Lavalink addToQueue Error:', error);
        return { success: false, error: error.message };
    }
}

// 🎤 Voice-Channel Management
async function joinVoiceChannel(guildId, channelId) {
    try {
        if (!client) {
            return { success: false, error: 'Bot-Client nicht verfügbar' };
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return { success: false, error: 'Guild nicht gefunden' };
        }

        const channel = guild.channels.cache.get(channelId);
        if (!channel || channel.type !== 'GUILD_VOICE') {
            return { success: false, error: 'Voice-Channel nicht gefunden' };
        }

        // Erstelle oder hole Player
        const player = manager.create({
            guild: guildId,
            voiceChannel: channelId,
            textChannel: null,
            volume: musicSettings.defaultVolume || 50
        });

        // Verbinde mit Voice-Channel
        await player.connect();

        return { 
            success: true, 
            message: `Voice-Channel "${channel.name}" erfolgreich beigetreten` 
        };

    } catch (error) {
        console.error('❌ Lavalink joinVoiceChannel Error:', error);
        return { success: false, error: error.message };
    }
}

function leaveVoiceChannel(guildId) {
    try {
        const player = manager.get(guildId);
        if (!player) {
            return false;
        }

        player.destroy();
        return true;

    } catch (error) {
        console.error('❌ Lavalink leaveVoiceChannel Error:', error);
        return false;
    }
}

// 🔀 Queue-Manipulationen
function clearQueue(guildId) {
    try {
        const player = manager.get(guildId);
        if (!player) {
            return false;
        }

        player.queue.clear();
        player.stop();
        return true;

    } catch (error) {
        console.error('❌ Lavalink clearQueue Error:', error);
        return false;
    }
}

function shuffleQueue(guildId) {
    try {
        const player = manager.get(guildId);
        if (!player || player.queue.size === 0) {
            return false;
        }

        // Shuffle die Queue (Fisher-Yates Algorithmus)
        const tracks = [...player.queue];
        for (let i = tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
        }

        // Neue shuffled Queue setzen
        player.queue.clear();
        tracks.forEach(track => player.queue.add(track));

        return true;

    } catch (error) {
        console.error('❌ Lavalink shuffleQueue Error:', error);
        return false;
    }
}

// 📋 Enhanced Queue Info (kompatibel mit Dashboard)
function getQueueInfo(guildId) {
    try {
        const player = manager.get(guildId);
        if (!player) {
            return {
                currentSong: null,
                songs: [],
                volume: 50,
                repeat: 'off',
                shuffle: false
            };
        }

        // Aktueller Song
        const currentSong = player.queue.current ? {
            title: player.queue.current.title,
            author: player.queue.current.author,
            url: player.queue.current.uri,
            duration: Math.floor(player.queue.current.duration / 1000),
            thumbnail: player.queue.current.displayThumbnail,
            requestedBy: player.queue.current.requester || 'Unknown',
            source: player.queue.current.sourceName === 'youtube' ? 'youtube' : 
                   player.queue.current.sourceName === 'spotify' ? 'spotify' : 'lavalink'
        } : null;

        // Queue Songs
        const songs = player.queue.map((track, index) => ({
            title: track.title,
            author: track.author,
            url: track.uri,
            duration: Math.floor(track.duration / 1000),
            thumbnail: track.displayThumbnail,
            requestedBy: track.requester || 'Unknown',
            source: track.sourceName === 'youtube' ? 'youtube' : 
                   track.sourceName === 'spotify' ? 'spotify' : 'lavalink',
            position: index + 1
        }));

        return {
            currentSong: currentSong,
            songs: songs,
            volume: player.volume || 50,
            repeat: 'off', // Lavalink hat kein eingebautes Repeat, könnte später implementiert werden
            shuffle: false, // Dito für Shuffle-Status
            isPlaying: player.playing,
            isPaused: player.paused,
            position: player.position || 0,
            connected: player.state === 'CONNECTED'
        };

    } catch (error) {
        console.error('❌ Lavalink getQueueInfo Error:', error);
        return {
            currentSong: null,
            songs: [],
            volume: 50,
            repeat: 'off',
            shuffle: false
        };
    }
}

// 📤 Module Exports
module.exports = {
    initializeLavalink,
    searchAndPlay,
    stopPlayback,
    pausePlayback,
    resumePlayback,
    skipTrack,
    setVolume,
    getQueueInfo,
    addToQueue,
    joinVoiceChannel,
    leaveVoiceChannel,
    clearQueue,
    shuffleQueue,
    getLavalinkStats,
    handleRaw,
    healthCheck,
    formatDuration,
    
    // Legacy-Kompatibilität für bestehende API-Calls
    playMusic: searchAndPlay,
    stopMusic: stopPlayback,
    pauseMusic: pausePlayback,
    resumeMusic: resumePlayback,
    skipMusic: skipTrack
}; 