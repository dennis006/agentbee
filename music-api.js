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
const currentPlaylists = new Map(); // guildId -> current playlist
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

// Voice Connection Management (bleibt gleich)
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
        currentPlaylists.delete(guildId);
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

    console.log('🎵 Musik-API registriert');
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
            musicSettings = { ...musicSettings, ...req.body };
            saveMusicSettings();
            res.json({
                success: true,
                message: 'YouTube Radio-Einstellungen gespeichert'
            });
        } catch (error) {
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

    console.log('✅ YouTube Radio API registriert!');
}

module.exports = {
    loadMusicSettings,
    saveMusicSettings,
    registerMusicAPI,
    joinVoiceChannelSafe,
    leaveVoiceChannel,
    getRadioStations,
    getRadioStation,
    playRadioStation,
    stopRadio,
    getCurrentRadioStation,
    isPlayingRadio,
    postInteractiveRadioPanel,
    updateInteractiveRadioPanel,
    handleRadioSelectButton,
    handleRadioStationSelect,
    handleRadioStopButton,
    musicSettings,
    autoJoinForRadio
}; 