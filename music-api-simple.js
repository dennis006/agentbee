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

// Einfache Music Settings - nur lokale MP3-Dateien
let musicSettings = {
    enabled: true,
    localMusic: {
        enabled: true,
        musicFolder: './music', // Ordner für MP3-Dateien
        allowedFormats: ['.mp3', '.wav', '.ogg'],
        defaultVolume: 50,
        shuffle: false,
        loop: false
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
const currentSongs = new Map(); // guildId -> current song info

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
        
        // Musik-Ordner erstellen falls nicht vorhanden
        if (!fs.existsSync(musicSettings.localMusic.musicFolder)) {
            fs.mkdirSync(musicSettings.localMusic.musicFolder, { recursive: true });
            console.log('📁 Musik-Ordner erstellt:', musicSettings.localMusic.musicFolder);
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

// Lokale MP3-Dateien laden
function getLocalMusicFiles() {
    try {
        const musicFolder = musicSettings.localMusic.musicFolder;
        if (!fs.existsSync(musicFolder)) {
            return [];
        }
        
        const files = fs.readdirSync(musicFolder);
        const musicFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return musicSettings.localMusic.allowedFormats.includes(ext);
        });
        
        return musicFiles.map(file => {
            const filePath = path.join(musicFolder, file);
            const stats = fs.statSync(filePath);
            return {
                id: file.replace(/\.[^/.]+$/, ""), // Dateiname ohne Erweiterung
                name: file.replace(/\.[^/.]+$/, "").replace(/_/g, ' '), // Schöner Name
                filename: file,
                path: filePath,
                size: stats.size,
                duration: null // Könnte später mit einer Audio-Library bestimmt werden
            };
        });
    } catch (error) {
        console.error('❌ Fehler beim Laden der Musik-Dateien:', error);
        return [];
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
        currentSongs.delete(guildId);
        console.log('👋 Voice-Channel verlassen');
    }
}

// Lokale Musik abspielen
async function playLocalMusic(guildId, songId) {
    try {
        const connection = voiceConnections.get(guildId);
        if (!connection) {
            console.error('❌ Keine Voice-Connection gefunden');
            return false;
        }

        const musicFiles = getLocalMusicFiles();
        const song = musicFiles.find(file => file.id === songId);
        
        if (!song) {
            console.error('❌ Musik-Datei nicht gefunden:', songId);
            return false;
        }

        console.log('🎵 Spiele lokale Musik ab:', song.name);

        // Audio Resource erstellen
        const resource = createAudioResource(song.path, {
            inputType: StreamType.Arbitrary,
        });

        // Audio Player erstellen oder wiederverwenden
        let player = audioPlayers.get(guildId);
        if (!player) {
            player = createAudioPlayer();
            audioPlayers.set(guildId, player);
            
            player.on('stateChange', (oldState, newState) => {
                console.log(`🎵 Audio Player: ${oldState.status} → ${newState.status}`);
            });
            
            player.on('error', (error) => {
                console.error('❌ Audio Player Error:', error);
            });
        }

        // Song-Info speichern
        currentSongs.set(guildId, {
            ...song,
            startTime: Date.now(),
            isLocal: true
        });

        // Musik abspielen
        player.play(resource);
        connection.subscribe(player);

        return true;
    } catch (error) {
        console.error('❌ Fehler beim Abspielen der lokalen Musik:', error);
        return false;
    }
}

function stopMusic(guildId) {
    const player = audioPlayers.get(guildId);
    if (player) {
        player.stop();
        currentSongs.delete(guildId);
        console.log('⏹️ Musik gestoppt');
    }
}

function getCurrentSong(guildId) {
    return currentSongs.get(guildId) || null;
}

function isPlayingMusic(guildId) {
    const player = audioPlayers.get(guildId);
    return player && player.state.status === AudioPlayerStatus.Playing;
}

// API-Endpunkte
function registerMusicAPI(app) {
    // Musik-Einstellungen abrufen
    app.get('/api/music/settings', (req, res) => {
        res.json({
            success: true,
            settings: musicSettings
        });
    });

    // Musik-Einstellungen speichern
    app.post('/api/music/settings', (req, res) => {
        try {
            musicSettings = { ...musicSettings, ...req.body };
            saveMusicSettings();
            res.json({ success: true, message: 'Einstellungen gespeichert' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Verfügbare Musik-Dateien abrufen
    app.get('/api/music/files', (req, res) => {
        try {
            const files = getLocalMusicFiles();
            res.json({ success: true, files });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Voice-Channel beitreten
    app.post('/api/music/join', async (req, res) => {
        try {
            const { guildId, channelId } = req.body;
            const guild = global.client.guilds.cache.get(guildId);
            
            if (!guild) {
                return res.status(404).json({ success: false, error: 'Server nicht gefunden' });
            }

            const channel = guild.channels.cache.get(channelId);
            if (!channel) {
                return res.status(404).json({ success: false, error: 'Channel nicht gefunden' });
            }

            const connection = await joinVoiceChannelSafe(channel);
            if (connection) {
                res.json({ success: true, message: `Voice-Channel "${channel.name}" beigetreten` });
            } else {
                res.status(500).json({ success: false, error: 'Fehler beim Beitreten' });
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Voice-Channel verlassen
    app.post('/api/music/leave', (req, res) => {
        try {
            const { guildId } = req.body;
            leaveVoiceChannel(guildId);
            res.json({ success: true, message: 'Voice-Channel verlassen' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Musik abspielen
    app.post('/api/music/play', async (req, res) => {
        try {
            const { guildId, songId } = req.body;
            const success = await playLocalMusic(guildId, songId);
            
            if (success) {
                res.json({ success: true, message: 'Musik wird abgespielt' });
            } else {
                res.status(500).json({ success: false, error: 'Fehler beim Abspielen' });
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Musik stoppen
    app.post('/api/music/stop', (req, res) => {
        try {
            const { guildId } = req.body;
            stopMusic(guildId);
            res.json({ success: true, message: 'Musik gestoppt' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Aktueller Song
    app.get('/api/music/current/:guildId', (req, res) => {
        try {
            const { guildId } = req.params;
            const currentSong = getCurrentSong(guildId);
            const isPlaying = isPlayingMusic(guildId);
            
            res.json({
                success: true,
                currentSong,
                isPlaying
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    console.log('🎵 Vereinfachte Musik-API registriert');
}

// Initialisierung
loadMusicSettings();

module.exports = {
    registerMusicAPI,
    joinVoiceChannelSafe,
    leaveVoiceChannel,
    playLocalMusic,
    stopMusic,
    getCurrentSong,
    isPlayingMusic,
    getLocalMusicFiles,
    musicSettings
}; 