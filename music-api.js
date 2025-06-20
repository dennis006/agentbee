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
const fetch = require('node-fetch'); // YouTube API calls

// Erweiterte Music Settings mit Playlist-Support
let musicSettings = {
    enabled: false,
    radio: {
        enabled: true,
        stations: [], // Live Radio Stations
        playlists: [], // Custom YouTube Playlists
        defaultStation: '',
        autoStop: true,
        showNowPlaying: true,
        embedColor: '#FF6B6B',
        crossfade: true,
        crossfadeDuration: 3000,
        autoRepeat: true,
        shuffleMode: false,
        autoQueue: true
    },
    announcements: {
        channelId: ''
    },
    interactivePanel: {
        enabled: false,
        channelId: '',
        messageId: '',
        autoUpdate: true,
        embedColor: '#9333EA'
    },
    youtube: {
        apiKey: '', // Optional für bessere Metadaten
        maxSongDuration: 600, // 10 Min max
        qualityPreference: 'high', // high, medium, low
        enableAutoSkip: true,
        enableVoting: true
    },
    autoDJ: {
        enabled: true,
        moodSchedule: {
            morning: 'chill', // 6-12
            afternoon: 'upbeat', // 12-18
            evening: 'ambient', // 18-24
            night: 'lofi' // 0-6
        },
        smartQueue: true,
        preventRepeats: 10 // Verhindere Wiederholung der letzten 10 Songs
    }
};

// Voice Connections und Players
const voiceConnections = new Map(); // guild -> connection
const audioPlayers = new Map(); // guild -> player
const currentRadioStations = new Map(); // guildId -> current radio station
const currentPlaylists = new Map(); // guildId -> Playlist
const songQueues = new Map(); // guildId -> Song Queue
const playHistory = new Map(); // guildId -> Play History
const userVotes = new Map(); // guildId -> { songId: [userIds] }
const crossfadeTimeouts = new Map(); // guildId -> Timeout

// YouTube Playlist Interface
class YouTubePlaylist {
    constructor(data) {
        this.id = data.id || `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = data.name || 'Neue Playlist';
        this.description = data.description || '';
        this.thumbnail = data.thumbnail || '';
        this.tags = data.tags || [];
        this.mood = data.mood || 'default'; // chill, upbeat, ambient, lofi, gaming, etc.
        this.songs = data.songs || []; // Array of YouTubeSong
        this.isPublic = data.isPublic || false;
        this.createdBy = data.createdBy || '';
        this.createdAt = data.createdAt || Date.now();
        this.playCount = data.playCount || 0;
        this.duration = data.duration || 0;
        this.settings = {
            shuffle: data.settings?.shuffle || false,
            repeat: data.settings?.repeat || 'off', // off, one, all
            crossfade: data.settings?.crossfade || true,
            autoQueue: data.settings?.autoQueue || true
        };
    }

    addSong(song, position = -1) {
        if (position === -1) {
            this.songs.push(song);
        } else {
            this.songs.splice(position, 0, song);
        }
        this.updateDuration();
    }

    removeSong(songId) {
        this.songs = this.songs.filter(song => song.id !== songId);
        this.updateDuration();
    }

    moveSong(fromIndex, toIndex) {
        const song = this.songs.splice(fromIndex, 1)[0];
        this.songs.splice(toIndex, 0, song);
    }

    updateDuration() {
        this.duration = this.songs.reduce((total, song) => total + (song.duration || 0), 0);
    }

    getShuffledOrder() {
        const indices = Array.from({ length: this.songs.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        return indices;
    }
}

// YouTube Song Interface
class YouTubeSong {
    constructor(data) {
        this.id = data.id || data.videoId;
        this.title = data.title || '';
        this.url = data.url || `https://youtube.com/watch?v=${this.id}`;
        this.duration = data.duration || 0;
        this.thumbnail = data.thumbnail || '';
        this.channel = data.channel || '';
        this.views = data.views || 0;
        this.addedBy = data.addedBy || '';
        this.addedAt = data.addedAt || Date.now();
        this.playCount = data.playCount || 0;
        this.skipCount = data.skipCount || 0;
        this.rating = data.rating || 0;
        this.tags = data.tags || [];
        this.mood = data.mood || 'default';
    }
}

// Auto-DJ System
class AutoDJ {
    constructor(guildId) {
        this.guildId = guildId;
        this.isActive = false;
        this.currentPlaylist = null;
        this.currentSongIndex = 0;
        this.shuffledOrder = [];
        this.playHistory = [];
        this.upcomingQueue = [];
    }

    start(playlistId) {
        const playlist = getPlaylist(playlistId);
        if (!playlist) return false;

        this.currentPlaylist = playlist;
        this.isActive = true;
        this.setupQueue();
        this.playNext();
        return true;
    }

    stop() {
        this.isActive = false;
        this.currentPlaylist = null;
        this.currentSongIndex = 0;
        this.clearTimeouts();
    }

    setupQueue() {
        if (!this.currentPlaylist) return;

        if (this.currentPlaylist.settings.shuffle) {
            this.shuffledOrder = this.currentPlaylist.getShuffledOrder();
        } else {
            this.shuffledOrder = Array.from({ length: this.currentPlaylist.songs.length }, (_, i) => i);
        }

        // Setup upcoming queue
        this.updateUpcomingQueue();
    }

    async playNext() {
        if (!this.isActive || !this.currentPlaylist) return;

        const songIndex = this.getCurrentSongIndex();
        if (songIndex === -1) {
            // Playlist Ende erreicht
            if (this.currentPlaylist.settings.repeat === 'all') {
                this.currentSongIndex = 0;
                this.setupQueue();
                return this.playNext();
            } else {
                return this.stop();
            }
        }

        const song = this.currentPlaylist.songs[songIndex];
        if (!song) return;

        // Play song
        await this.playSong(song);
        
        // Update history
        this.addToHistory(song);
        
        // Move to next song
        this.moveToNext();
        
        // Update upcoming queue
        this.updateUpcomingQueue();
    }

    async playSong(song) {
        try {
            const stream = await createYouTubeStream(song.url);
            if (!stream) return false;

            const player = audioPlayers.get(this.guildId);
            if (!player) return false;

            const resource = createAudioResource(stream.stream, {
                inputType: stream.type,
                metadata: {
                    title: song.title,
                    url: song.url
                }
            });

            // Crossfade handling
            if (musicSettings.radio.crossfade && this.playHistory.length > 0) {
                await this.handleCrossfade(player, resource);
            } else {
                player.play(resource);
            }

            // Update now playing
            currentPlaylists.set(this.guildId, {
                playlist: this.currentPlaylist,
                currentSong: song,
                autoDJ: this
            });

            // Send now playing message
            if (musicSettings.radio.showNowPlaying) {
                await sendSongNowPlayingMessage(this.guildId, song, this.currentPlaylist);
            }

            // Update interactive panel
            updateInteractiveRadioPanel(this.guildId, true);

            // Setup next song timer
            this.setupNextSongTimer(song.duration);

            song.playCount = (song.playCount || 0) + 1;
            this.currentPlaylist.playCount = (this.currentPlaylist.playCount || 0) + 1;
            saveMusicSettings();

            return true;

        } catch (error) {
            console.error('❌ Fehler beim Abspielen des Songs:', error);
            return false;
        }
    }

    async handleCrossfade(player, newResource) {
        // Implementierung für Crossfade zwischen Songs
        const fadeTime = musicSettings.radio.crossfadeDuration || 3000;
        
        // Fade out current song
        if (player.state.status === AudioPlayerStatus.Playing) {
            // Note: Discord.js Audio doesn't support volume control
            // Crossfade würde eine externe Audio-Library benötigen
            // Für jetzt: Direkter Wechsel
            player.play(newResource);
        } else {
            player.play(newResource);
        }
    }

    setupNextSongTimer(duration) {
        const timeout = setTimeout(() => {
            if (this.isActive) {
                this.playNext();
            }
        }, (duration * 1000) - (musicSettings.radio.crossfadeDuration || 0));

        crossfadeTimeouts.set(this.guildId, timeout);
    }

    clearTimeouts() {
        const timeout = crossfadeTimeouts.get(this.guildId);
        if (timeout) {
            clearTimeout(timeout);
            crossfadeTimeouts.delete(this.guildId);
        }
    }

    getCurrentSongIndex() {
        if (this.currentSongIndex >= this.shuffledOrder.length) return -1;
        return this.shuffledOrder[this.currentSongIndex];
    }

    moveToNext() {
        if (this.currentPlaylist?.settings.repeat === 'one') {
            // Repeat current song
            return;
        }

        this.currentSongIndex++;
    }

    addToHistory(song) {
        this.playHistory.push({
            song: song,
            playedAt: Date.now()
        });

        // Keep only last X songs in history
        const maxHistory = musicSettings.autoDJ.preventRepeats || 10;
        if (this.playHistory.length > maxHistory) {
            this.playHistory = this.playHistory.slice(-maxHistory);
        }
    }

    updateUpcomingQueue() {
        this.upcomingQueue = [];
        const maxUpcoming = 5;

        for (let i = 1; i <= maxUpcoming; i++) {
            const nextIndex = this.currentSongIndex + i;
            if (nextIndex < this.shuffledOrder.length) {
                const songIndex = this.shuffledOrder[nextIndex];
                this.upcomingQueue.push(this.currentPlaylist.songs[songIndex]);
            } else if (this.currentPlaylist.settings.repeat === 'all') {
                // Wrap around
                const wrapIndex = (nextIndex) % this.shuffledOrder.length;
                const songIndex = this.shuffledOrder[wrapIndex];
                this.upcomingQueue.push(this.currentPlaylist.songs[songIndex]);
            }
        }
    }

    skipSong() {
        this.clearTimeouts();
        this.playNext();
    }

    addSongToQueue(song, position = -1) {
        if (position === -1) {
            this.upcomingQueue.push(song);
        } else {
            this.upcomingQueue.splice(position, 0, song);
        }
    }

    voteSong(userId, songId, vote) {
        // Voting system implementation
        const guildVotes = userVotes.get(this.guildId) || {};
        if (!guildVotes[songId]) guildVotes[songId] = { up: [], down: [] };

        // Remove previous vote
        guildVotes[songId].up = guildVotes[songId].up.filter(id => id !== userId);
        guildVotes[songId].down = guildVotes[songId].down.filter(id => id !== userId);

        // Add new vote
        if (vote === 'up') {
            guildVotes[songId].up.push(userId);
        } else if (vote === 'down') {
            guildVotes[songId].down.push(userId);
        }

        userVotes.set(this.guildId, guildVotes);

        // Auto-skip if too many downvotes
        const downvotes = guildVotes[songId].down.length;
        const upvotes = guildVotes[songId].up.length;
        
        if (downvotes >= 3 && downvotes > upvotes) {
            this.skipSong();
        }
    }
}

// Auto-DJ Instances
const autoDJs = new Map(); // guildId -> AutoDJ

function loadMusicSettings() {
    try {
        if (fs.existsSync('./music-settings.json')) {
            const data = fs.readFileSync('./music-settings.json', 'utf8');
            const loadedSettings = JSON.parse(data);
            musicSettings = { ...musicSettings, ...loadedSettings };
            
            // Convert plain objects to class instances
            if (musicSettings.radio?.playlists) {
                musicSettings.radio.playlists = musicSettings.radio.playlists.map(p => new YouTubePlaylist(p));
            }
            
            console.log('✅ Music settings geladen');
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Music Settings:', error);
    }
}

function saveMusicSettings() {
    try {
        fs.writeFileSync('./music-settings.json', JSON.stringify(musicSettings, null, 2));
        console.log('💾 Music settings gespeichert');
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Music Settings:', error);
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
        const playdl = require('play-dl');
        
        // Prüfe ob es ein YouTube Live Stream ist
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const stream = await playdl.stream(url, {
                quality: 2 // Beste Audio-Qualität
            });
            
            return {
                stream: stream.stream,
                type: stream.type
            };
        } else {
            // Direkter Stream (MP3/etc.)
            const response = await fetch(url);
            
            return {
                stream: response.body,
                type: StreamType.Arbitrary
            };
        }
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des YouTube Streams:', error);
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

    // NEUE MEGA PLAYLIST API ENDPOINTS! 🚀

    // Get all playlists
    app.get('/api/music/playlists', (req, res) => {
        try {
            const playlists = getPlaylists();
            res.json({
                success: true,
                playlists: playlists
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
            const playlist = createPlaylist(playlistData);
            
            res.json({
                success: true,
                message: `Playlist "${playlist.name}" erstellt!`,
                playlist: playlist
            });
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
            const updates = req.body;
            
            const playlist = updatePlaylist(playlistId, updates);
            
            if (playlist) {
                res.json({
                    success: true,
                    message: `Playlist "${playlist.name}" aktualisiert!`,
                    playlist: playlist
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
            const success = deletePlaylist(playlistId);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Playlist gelöscht!'
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

    // YouTube Search API
    app.post('/api/music/youtube/search', async (req, res) => {
        try {
            const { query, maxResults = 10 } = req.body;
            
            if (!query) {
                return res.status(400).json({
                    success: false,
                    error: 'Suchbegriff erforderlich'
                });
            }

            const results = await searchYouTubeSongs(query, maxResults);
            
            res.json({
                success: true,
                results: results,
                query: query,
                count: results.length,
                apiSource: process.env.YOUTUBE_API_KEY ? 'youtube_api' : 'play_dl'
            });
        } catch (error) {
            console.error('❌ YouTube Search API Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // YouTube Video Info API (für direkte URL Eingabe)
    app.post('/api/music/youtube/info', async (req, res) => {
        try {
            const { url } = req.body;
            
            if (!url) {
                return res.status(400).json({
                    success: false,
                    error: 'YouTube URL erforderlich'
                });
            }

            const song = await getYouTubeVideoInfo(url);
            
            if (!song) {
                return res.status(404).json({
                    success: false,
                    error: 'Video nicht gefunden oder URL ungültig'
                });
            }

            res.json({
                success: true,
                song: song,
                apiSource: process.env.YOUTUBE_API_KEY ? 'youtube_api' : 'play_dl'
            });
        } catch (error) {
            console.error('❌ YouTube Video Info API Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Start Auto-DJ with playlist
    app.post('/api/music/autodj/:guildId/start', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { playlistId } = req.body;
            
            if (!playlistId) {
                return res.status(400).json({
                    success: false,
                    error: 'Playlist-ID erforderlich'
                });
            }

            const success = startAutoDJ(guildId, playlistId);
            
            if (success) {
                const playlist = getPlaylist(playlistId);
                res.json({
                    success: true,
                    message: `Auto-DJ gestartet mit "${playlist.name}"! 🎵`,
                    playlist: playlist
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Starten des Auto-DJ'
                });
            }
        } catch (error) {
            console.error('❌ Auto-DJ Start Fehler:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Stop Auto-DJ
    app.post('/api/music/autodj/:guildId/stop', (req, res) => {
        try {
            const { guildId } = req.params;
            
            const success = stopAutoDJ(guildId);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Auto-DJ gestoppt! ⏹️'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Stoppen des Auto-DJ'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Skip current song
    app.post('/api/music/autodj/:guildId/skip', (req, res) => {
        try {
            const { guildId } = req.params;
            
            const autoDJ = getAutoDJ(guildId);
            if (autoDJ) {
                autoDJ.skipSong();
                res.json({
                    success: true,
                    message: 'Song übersprungen! ⏭️'
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Kein Auto-DJ aktiv'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Vote for song
    app.post('/api/music/vote/:guildId', (req, res) => {
        try {
            const { guildId } = req.params;
            const { userId, songId, vote } = req.body; // vote: 'up' or 'down'
            
            const autoDJ = getAutoDJ(guildId);
            if (autoDJ) {
                autoDJ.voteSong(userId, songId, vote);
                res.json({
                    success: true,
                    message: `Vote ${vote === 'up' ? '👍' : '👎'} registriert!`
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Kein Auto-DJ aktiv'
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
    app.get('/api/music/playlist/:guildId/status', (req, res) => {
        try {
            const { guildId } = req.params;
            const playlistData = currentPlaylists.get(guildId);
            const autoDJ = getAutoDJ(guildId);
            
            if (playlistData && autoDJ) {
                res.json({
                    success: true,
                    isPlaying: autoDJ.isActive,
                    currentPlaylist: playlistData.playlist,
                    currentSong: playlistData.currentSong,
                    upcomingQueue: autoDJ.upcomingQueue.slice(0, 5),
                    playHistory: autoDJ.playHistory.slice(-5)
                });
            } else {
                res.json({
                    success: true,
                    isPlaying: false,
                    currentPlaylist: null,
                    currentSong: null,
                    upcomingQueue: [],
                    playHistory: []
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    console.log('✅ YouTube Radio API + MEGA PLAYLIST SYSTEM registriert! 🎵🚀');
}

// Playlist Management Functions
function getPlaylists() {
    return musicSettings.radio.playlists || [];
}

function getPlaylist(playlistId) {
    return musicSettings.radio.playlists.find(p => p.id === playlistId);
}

function createPlaylist(data) {
    const playlist = new YouTubePlaylist(data);
    musicSettings.radio.playlists.push(playlist);
    saveMusicSettings();
    return playlist;
}

function updatePlaylist(playlistId, updates) {
    const playlist = getPlaylist(playlistId);
    if (!playlist) return null;

    Object.assign(playlist, updates);
    saveMusicSettings();
    return playlist;
}

function deletePlaylist(playlistId) {
    const index = musicSettings.radio.playlists.findIndex(p => p.id === playlistId);
    if (index === -1) return false;

    musicSettings.radio.playlists.splice(index, 1);
    saveMusicSettings();
    return true;
}

// YouTube Search Integration mit offizieller API
async function searchYouTubeSongs(query, maxResults = 10) {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        
        // Fallback: Verwende play-dl wenn kein API Key
        if (!apiKey) {
            console.log('📡 Verwende play-dl für YouTube Search (kein API Key)');
            const playDl = require('play-dl');
            
            const results = await playDl.search(query, {
                limit: maxResults,
                source: { youtube: 'video' }
            });

            return results.map(video => new YouTubeSong({
                id: video.id,
                title: video.title,
                url: video.url,
                duration: video.durationInSec,
                thumbnail: video.thumbnails?.[0]?.url || '',
                channel: video.channel?.name || '',
                views: video.views || 0
            }));
        }

        // Verwende offizielle YouTube API mit deinem API Key! 🚀
        console.log('🔑 Verwende YouTube API v3 mit offiziellem API Key!');
        
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}&type=video&key=${apiKey}`;
        
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (!searchData.items || searchData.items.length === 0) {
            return [];
        }

        // Hole Video-Details für Dauer und Views
        const videoIds = searchData.items.map(item => item.id.videoId).join(',');
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${apiKey}`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        // Kombiniere Search-Results mit Details
        return searchData.items.map((item, index) => {
            const details = detailsData.videos?.[index];
            const duration = details ? parseYouTubeDuration(details.contentDetails.duration) : 0;
            const views = details ? parseInt(details.statistics.viewCount || 0) : 0;

            return new YouTubeSong({
                id: item.id.videoId,
                title: item.snippet.title,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                duration: duration,
                thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
                channel: item.snippet.channelTitle,
                views: views,
                addedBy: 'system',
                addedAt: Date.now()
            });
        });

    } catch (error) {
        console.error('❌ YouTube Search Fehler:', error);
        
        // Fallback zu play-dl bei API Fehler
        try {
            console.log('🔄 Fallback zu play-dl...');
            const playDl = require('play-dl');
            
            const results = await playDl.search(query, {
                limit: maxResults,
                source: { youtube: 'video' }
            });

            return results.map(video => new YouTubeSong({
                id: video.id,
                title: video.title,
                url: video.url,
                duration: video.durationInSec,
                thumbnail: video.thumbnails?.[0]?.url || '',
                channel: video.channel?.name || '',
                views: video.views || 0
            }));
        } catch (fallbackError) {
            console.error('❌ Auch play-dl Fallback fehlgeschlagen:', fallbackError);
            return [];
        }
    }
}

// YouTube Duration Parser (PT4M13S -> 253 seconds)
function parseYouTubeDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    
    return hours * 3600 + minutes * 60 + seconds;
}

// Enhanced YouTube URL validation und Metadata-Fetching
async function getYouTubeVideoInfo(url) {
    try {
        const videoId = extractYouTubeVideoId(url);
        if (!videoId) return null;

        const apiKey = process.env.YOUTUBE_API_KEY;
        
        if (apiKey) {
            // Verwende offizielle API für bessere Metadaten
            const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                const video = data.items[0];
                return new YouTubeSong({
                    id: videoId,
                    title: video.snippet.title,
                    url: url,
                    duration: parseYouTubeDuration(video.contentDetails.duration),
                    thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url || '',
                    channel: video.snippet.channelTitle,
                    views: parseInt(video.statistics.viewCount || 0),
                    addedBy: 'manual',
                    addedAt: Date.now()
                });
            }
        }

        // Fallback zu play-dl
        const playDl = require('play-dl');
        const info = await playDl.video_info(url);
        
        if (info) {
            return new YouTubeSong({
                id: videoId,
                title: info.video_details.title,
                url: url,
                duration: info.video_details.durationInSec,
                thumbnail: info.video_details.thumbnails?.[0]?.url || '',
                channel: info.video_details.channel?.name || '',
                views: info.video_details.viewCount || 0,
                addedBy: 'manual',
                addedAt: Date.now()
            });
        }

        return null;
    } catch (error) {
        console.error('❌ YouTube Video Info Fehler:', error);
        return null;
    }
}

// YouTube Video ID Extraktor
function extractYouTubeVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    
    return null;
}

// Auto-DJ Functions
function startAutoDJ(guildId, playlistId) {
    const playlist = getPlaylist(playlistId);
    if (!playlist) return false;

    let autoDJ = autoDJs.get(guildId);
    if (!autoDJ) {
        autoDJ = new AutoDJ(guildId);
        autoDJs.set(guildId, autoDJ);
    }

    return autoDJ.start(playlistId);
}

function stopAutoDJ(guildId) {
    const autoDJ = autoDJs.get(guildId);
    if (autoDJ) {
        autoDJ.stop();
        autoDJs.delete(guildId);
        currentPlaylists.delete(guildId);
        return true;
    }
    return false;
}

function getAutoDJ(guildId) {
    return autoDJs.get(guildId);
}

// Enhanced Interactive Panel for Playlists
async function createInteractivePlaylistPanel(guildId) {
    try {
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

        const currentPlaylistData = currentPlaylists.get(guildId);
        const autoDJ = autoDJs.get(guildId);
        
        const embed = new EmbedBuilder()
            .setTitle('🎵 YouTube Playlist Radio')
            .setColor(musicSettings.interactivePanel.embedColor || '#9333EA')
            .setTimestamp();

        if (currentPlaylistData && autoDJ) {
            const { playlist, currentSong } = currentPlaylistData;
            
            embed.setDescription(`**Aktuelle Playlist:** ${playlist.name}\n**Aktueller Song:** ${currentSong.title}\n**Kanal:** ${currentSong.channel}`);
            
            if (currentSong.thumbnail) {
                embed.setThumbnail(currentSong.thumbnail);
            }

            embed.addFields([
                {
                    name: '📊 Playlist Info',
                    value: `Songs: ${playlist.songs.length}\nModus: ${playlist.settings.shuffle ? '🔀 Shuffle' : '📑 Linear'}\nRepeat: ${playlist.settings.repeat === 'all' ? '🔁 All' : playlist.settings.repeat === 'one' ? '🔂 One' : '⏹️ Off'}`,
                    inline: true
                },
                {
                    name: '⏭️ Nächste Songs',
                    value: autoDJ.upcomingQueue.slice(0, 3).map((song, i) => `${i + 1}. ${song.title.substring(0, 30)}...`).join('\n') || 'Keine weiteren Songs',
                    inline: true
                }
            ]);

            // Voting info
            const votes = userVotes.get(guildId)?.[currentSong.id];
            if (votes) {
                embed.addFields([{
                    name: '🗳️ Votes',
                    value: `👍 ${votes.up?.length || 0} | 👎 ${votes.down?.length || 0}`,
                    inline: true
                }]);
            }

        } else {
            embed.setDescription('Keine Playlist aktiv\n\nWähle eine Playlist aus oder erstelle eine neue!');
        }

        // Buttons
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('playlist_select')
                .setLabel('📁 Playlist wählen')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('playlist_skip')
                .setLabel('⏭️ Skip')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(!currentPlaylistData),
            new ButtonBuilder()
                .setCustomId('playlist_shuffle')
                .setLabel('🔀 Shuffle')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(!currentPlaylistData)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('song_vote_up')
                .setLabel('👍')
                .setStyle(ButtonStyle.Success)
                .setDisabled(!currentPlaylistData),
            new ButtonBuilder()
                .setCustomId('song_vote_down')
                .setLabel('👎')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(!currentPlaylistData),
            new ButtonBuilder()
                .setCustomId('playlist_stop')
                .setLabel('⏹️ Stop')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(!currentPlaylistData)
        );

        return {
            embeds: [embed],
            components: [row1, row2]
        };

    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Playlist Panels:', error);
        return null;
    }
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
    autoJoinForRadio,
    getPlaylists,
    getPlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    searchYouTubeSongs,
    startAutoDJ,
    stopAutoDJ,
    getAutoDJ,
    createInteractivePlaylistPanel
}; 