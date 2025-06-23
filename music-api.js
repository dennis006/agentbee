const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder, ButtonStyle, ComponentType, ActivityType } = require('discord.js');
const { 
    createAudioPlayer, 
    createAudioResource, 
    StreamType, 
    AudioPlayerStatus,
    VoiceConnectionStatus, 
    joinVoiceChannel, 
    AudioResource,
    entersState
} = require('@discordjs/voice');

const fs = require('fs');
const path = require('path');
const { PassThrough } = require('stream');
const axios = require('axios');

// Supabase Integration
const { 
    initSupabase, 
    loadMusicSettingsFromDB, 
    saveMusicSettingsToDB,
    loadMusicStatsFromDB,
    saveMusicStatsToDB,
    logMusicAction
} = require('./supabase-music');

// Nur noch lokale MP3-Settings
let musicSettings = {
    enabled: true,
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
const currentVolume = new Map(); // Guild-Volume Tracking

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
        
        return mp3Files.map((filename, index) => {
            const filePath = path.join(musicDir, filename);
            const stats = fs.statSync(filePath);
            
            // Sichere ID-Generierung: Index + sanitized filename
            const safeName = filename.replace(/\.[^/.]+$/, "")
                .replace(/[^a-zA-Z0-9\-_]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
            
            const safeId = `mp3_${index}_${safeName}`.substring(0, 100); // Discord max 100 chars
            
            return {
                id: safeId,
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

async function loadMusicSettings() {
    try {
        // Initialisiere Supabase
        const supabaseReady = initSupabase();
        
        if (supabaseReady) {
            console.log('🎵 Versuche Musik-Einstellungen aus Supabase zu laden...');
            
            // Lade für jede Guild separat (hier nehmen wir die erste Guild als Beispiel)
            // In einer echten Implementierung würdest du für jede Guild separat laden
            const guildId = process.env.GUILD_ID || '1203994020779532348';
            const dbSettings = await loadMusicSettingsFromDB(guildId);
            
            if (dbSettings) {
                musicSettings = { ...musicSettings, ...dbSettings };
                console.log('✅ Musik-Einstellungen aus Supabase geladen');
                return;
            }
        }
        
        // Fallback: Lokale JSON-Datei
        console.log('📁 Fallback: Lade lokale Musik-Einstellungen...');
        if (fs.existsSync('music-settings.json')) {
            const data = fs.readFileSync('music-settings.json', 'utf8');
            const loadedSettings = JSON.parse(data);
            musicSettings = { ...musicSettings, ...loadedSettings };
            console.log('🎵 Lokale Musik-Einstellungen geladen');
            
            // Migriere Channel-Namen zu Channel-IDs bei Bot-Start (nur einmal)
            if (!musicSettings.migrationCompleted) {
            setTimeout(() => {
                migrateChannelNamesToIds();
            }, 3000); // Warte 3 Sekunden bis Discord Client bereit ist
            } else {
                console.log('✅ Channel-Migration bereits abgeschlossen - überspringe');
            }
        } else {
            await saveMusicSettings();
            console.log('🎵 Standard-Musik-Einstellungen erstellt');
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Musik-Einstellungen:', error);
    }
}

// Migration: Konvertiert Channel-Namen zu Channel-IDs für bessere Persistierung
function migrateChannelNamesToIds() {
    try {
        if (!global.client?.guilds) {
            console.log('⚠️ Discord Client noch nicht bereit für Channel-Migration');
            return;
        }

        let needsSave = false;
        
        // Prüfe Interactive Panel channelId
        if (musicSettings.interactivePanel?.channelId && 
            typeof musicSettings.interactivePanel.channelId === 'string' && 
            musicSettings.interactivePanel.channelId !== '' &&
            !musicSettings.interactivePanel.channelId.match(/^\d+$/)) {
            
            console.log(`🔄 Migriere Interactive Panel Channel-Name "${musicSettings.interactivePanel.channelId}" zu Channel-ID...`);
            
            // Suche Channel-ID durch Name
            let foundChannel = null;
            for (const guild of global.client.guilds.cache.values()) {
                const channel = guild.channels.cache.find(ch => 
                    ch.name === musicSettings.interactivePanel.channelId && ch.type === 0
                );
                if (channel) {
                    foundChannel = channel;
                    break;
                }
            }
            
            if (foundChannel) {
                console.log(`✅ Channel-Migration: "${musicSettings.interactivePanel.channelId}" → ${foundChannel.id} (#${foundChannel.name} in ${foundChannel.guild.name})`);
                musicSettings.interactivePanel.channelId = foundChannel.id;
                needsSave = true;
            } else {
                console.log(`⚠️ Channel "${musicSettings.interactivePanel.channelId}" nicht gefunden - leere Einstellung`);
                musicSettings.interactivePanel.channelId = '';
                musicSettings.interactivePanel.messageId = '';
                needsSave = true;
            }
        }
        
        // Prüfe Announcements Channel
        if (musicSettings.announcements?.channelId && 
            typeof musicSettings.announcements.channelId === 'string' && 
            musicSettings.announcements.channelId !== '' &&
            !musicSettings.announcements.channelId.match(/^\d+$/)) {
            
            console.log(`🔄 Migriere Announcements Channel-Name "${musicSettings.announcements.channelId}" zu Channel-ID...`);
            
            let foundChannel = null;
            for (const guild of global.client.guilds.cache.values()) {
                const channel = guild.channels.cache.find(ch => 
                    ch.name === musicSettings.announcements.channelId && ch.type === 0
                );
                if (channel) {
                    foundChannel = channel;
                    break;
                }
            }
            
            if (foundChannel) {
                console.log(`✅ Announcements Channel-Migration: "${musicSettings.announcements.channelId}" → ${foundChannel.id}`);
                musicSettings.announcements.channelId = foundChannel.id;
                needsSave = true;
            } else {
                console.log(`⚠️ Announcements Channel nicht gefunden - leere Einstellung`);
                musicSettings.announcements.channelId = '';
                needsSave = true;
            }
        }
        
        // Speichere nur wenn wirklich Änderungen vorgenommen wurden
        if (needsSave) {
            saveMusicSettings();
            console.log('✅ Channel-Migration abgeschlossen und gespeichert');
        } else {
            console.log('✅ Keine Channel-Migration erforderlich - alle IDs sind bereits korrekt');
        }
        
        // Markiere Migration als abgeschlossen
        if (!musicSettings.migrationCompleted) {
            musicSettings.migrationCompleted = true;
            saveMusicSettings();
            console.log('🔒 Migration als abgeschlossen markiert');
        }
        
        console.log('🔒 Channel-Migration abgeschlossen - keine weiteren Migrationen erforderlich');
        
    } catch (error) {
        console.error('❌ Fehler bei Channel-Migration:', error);
    }
}

async function saveMusicSettings(guildId = null) {
    try {
        // Versuche zuerst in Supabase zu speichern
        const targetGuildId = guildId || process.env.GUILD_ID || '1203994020779532348';
        const dbSaved = await saveMusicSettingsToDB(targetGuildId, musicSettings);
        
        if (dbSaved) {
            console.log('💾 Musik-Einstellungen in Supabase gespeichert');
            
            // Log die Aktion
            await logMusicAction(targetGuildId, 'settings_update', {
                settings: Object.keys(musicSettings),
                timestamp: new Date().toISOString()
            });
        } else {
            console.log('⚠️ Supabase-Speicherung fehlgeschlagen - verwende lokale JSON');
        }
        
        // Fallback: Lokale JSON-Datei (immer als Backup)
        if (fs.existsSync('music-settings.json')) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            fs.copyFileSync('music-settings.json', `music-settings-backup-${timestamp}.json`);
        }
        
        fs.writeFileSync('music-settings.json', JSON.stringify(musicSettings, null, 2));
        console.log('💾 Musik-Einstellungen lokal gespeichert (Backup)');
        
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

        // Erstelle lokale Datei-Ressource mit Guild-spezifischem Volume
        const volume = getVolumeForGuild(guildId) / 100; // 0.0-1.0
        const resource = createAudioResource(song.path, {
            inputType: StreamType.Arbitrary,
            inlineVolume: true
        });

        if (resource.volume) {
            resource.volume.setVolume(volume);
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

// Interactive Panel für MP3-Musik-System
async function createInteractiveMusicPanel(guildId) {
    try {
        console.log(`🎵 Erstelle Interactive Musik Panel für Guild: ${guildId}`);
        
        // Aktueller Status prüfen
        const currentSong = getCurrentSong(guildId);
        const currentMusicStation = getCurrentStation(guildId);

        // Musik-Infos sammeln
        const availableSongs = getAvailableSongs();
        const musicStations = getMusicStations();
        
        // Embed erstellen
        const embed = {
            color: parseInt(musicSettings.localMusic?.embedColor?.replace('#', '') || 'FF6B6B', 16),
            title: '🎵 Musik-System',
            description: '**Lokale MP3-Bibliothek!**\n\n' +
                        '🎯 **Verfügbare Funktionen:**\n' +
                        '• 🎵 **MP3-Bibliothek** - Lokale Musik-Dateien\n' +
                        '• 🎼 **Playlists** - Custom Musik-Sammlungen\n' +
                        '• 🎚️ **Lautstärke** - Volume-Kontrolle\n' +
                        '• 🎙️ **Voice-Chat** - Auto-Join Funktionen',
            fields: [],
            footer: {
                text: '🎵 Lokales Musik-System • MP3s & Playlists'
            },
            timestamp: new Date().toISOString()
        };

        // Zeige aktuellen Status
        if (currentSong) {
            embed.fields.push({
                name: '🎵 MP3 läuft',
                value: `**${currentSong.title}**\n🎤 ${currentSong.artist || 'Unbekannt'}`,
                inline: true
            });
        } else if (currentMusicStation) {
            embed.fields.push({
                name: '🎼 Playlist läuft',
                value: `**${currentMusicStation.name}**\n🎧 ${currentMusicStation.description}`,
                inline: true
            });
        } else {
            embed.fields.push({
                name: '⏸️ Status',
                value: 'Keine Musik läuft',
                inline: true
            });
        }

        const guildVolume = getVolumeForGuild(guildId);
        embed.fields.push({
            name: '🔊 Lautstärke',
            value: `${guildVolume}%`,
            inline: true
        });
        
        embed.fields.push({
            name: '📊 Verfügbare Inhalte',
            value: `🎵 **${availableSongs.length}** MP3-Dateien\n🎼 **${musicStations.length}** Playlists`,
            inline: true
        });

        // Erstelle Buttons
        const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
        
        // Erste Reihe: Hauptfunktionen
        const mainButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('music_mp3_select')
                    .setLabel('🎵 MP3')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('music_playlist_select')
                    .setLabel('🎼 Playlists')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('music_stop_all')
                    .setLabel('⏹️ Stop')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(!currentSong && !currentMusicStation)
            );

        // Zweite Reihe: Voice-Chat Funktionen
        const voiceButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('music_voice_join')
                    .setLabel('🎙️ Join')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('music_voice_leave')
                    .setLabel('🚪 Leave')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('music_refresh')
                    .setLabel('🔄 Refresh')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Dritte Reihe: Lautstärke-Kontrolle
        const volumeButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('music_volume_down')
                    .setLabel('🔉 -10%')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('music_volume_show')
                    .setLabel('🔊 Volume')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('music_volume_up')
                    .setLabel('🔊 +10%')
                    .setStyle(ButtonStyle.Secondary)
            );

        return {
            embeds: [embed],
            components: [mainButtons, voiceButtons, volumeButtons]
        };

    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Musik-Panels:', error);
        throw error;
    }
}

// Post Interactive Panel für Musik-System
async function postInteractiveMusicPanel(guildId) {
    try {
        console.log(`🎵 Starte Interactive Musik Panel Management für Guild: ${guildId}`);
        
        if (!global.client?.guilds) {
            console.log('❌ Discord Client nicht verfügbar');
            return false;
        }
        
        const guild = global.client.guilds.cache.get(guildId);
        if (!guild) {
            console.log(`❌ Guild ${guildId} nicht gefunden`);
            return false;
        }

        const channelId = musicSettings.interactivePanel?.channelId;
        if (!channelId) {
            console.log('❌ Kein Interactive Panel Channel konfiguriert');
            return false;
        }
        
        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            console.log(`❌ Channel ${channelId} nicht gefunden`);
            return false;
        }

        // Checke ob Panel bereits existiert
        const existingMessageId = musicSettings.interactivePanel?.messageId;
        if (existingMessageId) {
            try {
                const existingMessage = await channel.messages.fetch(existingMessageId).catch(() => null);
                if (existingMessage) {
                    console.log('📋 Panel bereits vorhanden, verwende Update...');
                    return await updateInteractiveMusicPanel(guildId, true);
                }
            } catch (err) {
                console.log('⚠️ Existierende Panel-Message nicht gefunden, erstelle neue...');
            }
        }

        console.log(`🎵 Erstelle neues Interactive Musik Panel in #${channel.name}`);

        const panelData = await createInteractiveMusicPanel(guildId);
        
        try {
        const message = await channel.send(panelData);
        
            // Speichere Message ID in Settings
        musicSettings.interactivePanel.messageId = message.id;
        saveMusicSettings();

            console.log(`✅ Musik Panel erfolgreich erstellt: ${message.id} in #${channel.name}`);
        return true;
            
        } catch (sendError) {
            console.error('❌ Fehler beim Senden des Panels:', sendError);
            return false;
        }

    } catch (error) {
        console.error('❌ Fehler beim Posten des Interactive Musik Panels:', error);
        return false;
    }
}

// Update Interactive Panel für Musik-System  
async function updateInteractiveMusicPanel(guildId, forceUpdate = false) {
    try {
        if (!global.client?.guilds) return false;

        const guild = global.client.guilds.cache.get(guildId);
        if (!guild) return false;

        const channelId = musicSettings.interactivePanel?.channelId;
        const messageId = musicSettings.interactivePanel?.messageId;
        
        if (!channelId || !messageId) {
            console.log('⚠️ Keine Panel-Konfiguration gefunden');
            return false;
        }

        const channel = guild.channels.cache.get(channelId);
        if (!channel) return false;
        
        try {
            const message = await channel.messages.fetch(messageId);
            
            const panelData = await createInteractiveMusicPanel(guildId);
            
            await message.edit(panelData);
            
            console.log('🔄 Musik Panel erfolgreich aktualisiert');
            return true;
            
        } catch (fetchError) {
            console.log('❌ Panel-Message nicht gefunden, erstelle neue...');
            // Entferne alte Message ID und erstelle neue
            musicSettings.interactivePanel.messageId = "";
            saveMusicSettings();
            return await postInteractiveMusicPanel(guildId);
        }

    } catch (error) {
        console.error('❌ Unerwarteter Fehler beim Aktualisieren des Musik Panels:', error);
        return false;
    }
}

// Button Interactions für vollständiges Musik-System
async function handleMusicMP3SelectButton(interaction) {
    try {
        const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
        
        const availableSongs = getAvailableSongs();
        
        if (availableSongs.length === 0) {
            await interaction.reply({
                content: '❌ **Keine MP3-Dateien gefunden!**\n\nBitte füge MP3-Dateien zum Musik-Ordner hinzu.',
                ephemeral: true
            });
            return;
        }

        // Erstelle Select Menu für Songs (max 25 Optionen)
        const songOptions = availableSongs.slice(0, 25).map(song => ({
            label: (song.title || song.filename).substring(0, 100),
            description: `${song.artist || 'Unbekannter Künstler'} • ${Math.round(song.duration || 0)}s`.substring(0, 100),
            value: song.id
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('music_mp3_song_select')
            .setPlaceholder('🎵 Wähle eine MP3-Datei...')
            .addOptions(songOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: `🎵 **MP3-Bibliothek** (${availableSongs.length} Dateien verfügbar)\n\nWähle einen Song aus der Liste:`,
            components: [row],
            ephemeral: true
        });

    } catch (error) {
        console.error('❌ Fehler bei MP3-Auswahl:', error);
        await interaction.reply({
            content: '❌ Fehler beim Laden der MP3-Bibliothek.',
            ephemeral: true
        });
    }
}

async function handleMusicPlaylistSelectButton(interaction) {
    try {
        const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
        
        const musicStations = getMusicStations();
        
        if (musicStations.length === 0) {
            await interaction.reply({
                content: '❌ **Keine Playlists gefunden!**\n\nErstelle zuerst Playlists im Dashboard.',
                ephemeral: true
            });
            return;
        }

        // Erstelle Select Menu für Playlists
        const stationOptions = musicStations.map(station => ({
            label: station.name.substring(0, 100),
            description: `${station.playlist?.length || 0} Songs • ${station.genre || 'Custom Playlist'}`.substring(0, 100),
            value: station.id
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('music_playlist_station_select')
            .setPlaceholder('🎼 Wähle eine Playlist...')
            .addOptions(stationOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: `🎼 **Playlists** (${musicStations.length} verfügbar)\n\nWähle eine Playlist:`,
            components: [row],
            ephemeral: true
        });

    } catch (error) {
        console.error('❌ Fehler bei Playlist-Auswahl:', error);
        await interaction.reply({
            content: '❌ Fehler beim Laden der Playlists.',
            ephemeral: true
        });
    }
}

async function handleMusicStopAllButton(interaction) {
    try {
        const guildId = interaction.guild.id;

        await interaction.deferReply({ ephemeral: true });

        // Stoppe alles
        stopMusic(guildId);

        await interaction.editReply({
            content: '⏹️ **Musik gestoppt**\n\nAlle MP3s wurden beendet.',
            ephemeral: true
        });

        // Update Panel
        updateInteractiveMusicPanel(guildId, true);

    } catch (error) {
        console.error('❌ Fehler beim Music Stop All Button:', error);
        await interaction.followUp({
            content: '❌ Fehler beim Stoppen der Musik!',
            ephemeral: true
        });
    }
}

async function handleMusicVoiceJoinButton(interaction) {
    try {
        const guildId = interaction.guild.id;

        await interaction.deferReply({ ephemeral: true });

        const success = await autoJoinForMusic(guildId);
        
        if (success) {
            await interaction.editReply({
                content: '🎙️ **Voice-Channel beigetreten!**',
                ephemeral: true
            });
        } else {
            await interaction.editReply({
                content: '❌ **Konnte keinem Voice-Channel beitreten**\n\nStelle sicher, dass du in einem Voice-Channel bist oder es verfügbare Channels gibt.',
                ephemeral: true
            });
        }

        // Update Panel
        updateInteractiveMusicPanel(guildId, true);

    } catch (error) {
        console.error('❌ Fehler beim Music Voice Join Button:', error);
        await interaction.followUp({
            content: '❌ Fehler beim Beitreten des Voice-Channels!',
            ephemeral: true
        });
    }
}

async function handleMusicVoiceLeaveButton(interaction) {
    try {
        const guildId = interaction.guild.id;

        await interaction.deferReply({ ephemeral: true });

        // Stoppe Musik und verlasse Channel
        stopMusic(guildId);
        leaveVoiceChannel(guildId);

        await interaction.editReply({
            content: '🚪 **Voice-Channel verlassen**\n\nMusik gestoppt und Channel verlassen.',
            ephemeral: true
        });

        // Update Panel
        updateInteractiveMusicPanel(guildId, true);

    } catch (error) {
        console.error('❌ Fehler beim Music Voice Leave Button:', error);
        await interaction.followUp({
            content: '❌ Fehler beim Verlassen des Voice-Channels!',
            ephemeral: true
        });
    }
}

async function handleMusicRefreshButton(interaction) {
    try {
        const guildId = interaction.guild.id;

        await interaction.deferReply({ ephemeral: true });

        // Scanne Musik-Ordner neu
        scanMusicDirectory();

        await interaction.editReply({
            content: '🔄 **Musik-Bibliothek aktualisiert!**\n\nAlle MP3-Dateien wurden neu gescannt.',
            ephemeral: true
        });

        // Update Panel
        updateInteractiveMusicPanel(guildId, true);

    } catch (error) {
        console.error('❌ Fehler beim Music Refresh Button:', error);
        await interaction.followUp({
            content: '❌ Fehler beim Aktualisieren der Musik-Bibliothek!',
            ephemeral: true
        });
    }
}

// Handler für MP3-Song Auswahl - VEREINFACHT: Verwendet dieselbe API wie Dashboard
async function handleMusicMP3SongSelect(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const songId = interaction.values[0];
        const guildId = interaction.guild?.id;

        console.log(`🎵 MP3 Song Select: ${songId} in Guild: ${guildId}`);

        if (!guildId) {
            await interaction.editReply({
                content: '❌ **Server-Fehler:** Keine Guild-ID gefunden'
            });
            return;
        }

        await interaction.editReply({
            content: `🎵 **MP3 wird gestartet...**\n\nSong-ID: \`${songId}\`\n\nEinen Moment bitte...`
        });

        // 🎯 NEUE METHODE: Verwende dieselbe API wie das Dashboard
        try {
            // Simuliere Dashboard API-Call
            const fetch = require('node-fetch');
            const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
            
            console.log(`🔄 API Call: POST ${API_URL}/api/music/play/${guildId}`);
            console.log(`📦 Body: { songId: "${songId}" }`);
            
            const response = await fetch(`${API_URL}/api/music/play/${guildId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ songId })
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ API Success:`, data);
                
                await interaction.editReply({
                    content: `✅ **MP3 gestartet!**\n\n🎵 **${data.song?.title || 'Song'}**\n🎤 ${data.song?.artist || 'Unbekannt'}\n\n💡 *Verwendet Dashboard-API*`
                });
            } else {
                const errorData = await response.json();
                console.error(`❌ API Error:`, errorData);
                
                await interaction.editReply({
                    content: `❌ **Fehler beim Abspielen**\n\n❌ **API-Fehler:** ${errorData.error || 'Unbekannter Fehler'}\n\n**Status:** ${response.status}`
                });
            }
        } catch (apiError) {
            console.error('❌ API Call Fehler:', apiError);
            
            await interaction.editReply({
                content: `❌ **API-Verbindungsfehler**\n\n\`\`\`${apiError.message}\`\`\`\n\n💡 Fallback zum direkten Handler...`
            });
            
            // Fallback zur alten Methode
            await playLocalSong(guildId, songId);
            await interaction.editReply({
                content: `✅ **MP3 gestartet (Fallback)**\n\nSong-ID: \`${songId}\``
            });
        }

        // Update Panel
        setTimeout(() => {
            updateInteractiveMusicPanel(guildId, true);
        }, 2000);

    } catch (error) {
        console.error('❌ Fehler beim MP3 Song Select:', error);
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    content: `❌ **Unerwarteter Fehler**\n\n\`\`\`${error.message}\`\`\``
                });
            } else {
                await interaction.reply({
                    content: `❌ **Unerwarteter Fehler**\n\n\`\`\`${error.message}\`\`\``,
                    flags: 64
                });
            }
        } catch (replyError) {
            console.error('❌ Fehler beim Senden der Fehler-Antwort:', replyError);
        }
    }
}

// Handler für Playlist-Station Auswahl
async function handleMusicPlaylistStationSelect(interaction) {
    try {
        const stationId = interaction.values[0];
        const guildId = interaction.guild?.id;

        if (!guildId) return;

        await interaction.reply({
            content: '🎼 **Playlist wird gestartet...**\n\nEinen Moment bitte...',
            ephemeral: true
        });

        // Spiele Music Station/Playlist
        await playMusicStation(guildId, stationId);

        // Update Panel nach kurzer Verzögerung
        setTimeout(() => {
            updateInteractiveMusicPanel(guildId, true);
        }, 2000);

    } catch (error) {
        console.error('❌ Fehler beim Abspielen der Playlist:', error);
        await interaction.followUp({
            content: '❌ Fehler beim Abspielen der Playlist.',
            ephemeral: true
        });
    }
}

// Kompatibilitätsfunktion für alte Radio-Select Buttons
async function handleMusicRadioSelectButton(interaction) {
    try {
        await interaction.reply({
            content: '📻 **Radio-System nicht verfügbar**\n\n' +
                    'Das Radio-System wurde durch das lokale MP3-System ersetzt.\n\n' +
                    '🎵 **Verfügbare Optionen:**\n' +
                    '• MP3-Dateien aus der lokalen Bibliothek\n' +
                    '• Custom Playlists\n\n' +
                    '💡 Nutze die MP3 oder Playlist Buttons!',
            ephemeral: true
        });
    } catch (error) {
        console.error('❌ Fehler bei Radio Select Button:', error);
        await interaction.reply({
            content: '❌ Radio-System nicht verfügbar. Nutze die MP3-Bibliothek.',
            ephemeral: true
        });
    }
}

// Volume-Control Handler
async function handleMusicVolumeUpButton(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });
        
        const guildId = interaction.guild.id;
        const newVolume = increaseVolume(guildId, 10);
        
        await interaction.editReply({
            content: `🔊 **Lautstärke erhöht!**\n\`${newVolume}%\` Volume`,
            ephemeral: true
        });

        // Update Panel
        await updateInteractiveMusicPanel(guildId, true);

    } catch (error) {
        console.error('❌ Fehler beim Volume Up Button:', error);
        await interaction.followUp({
            content: '❌ Fehler beim Erhöhen der Lautstärke!',
            ephemeral: true
        });
    }
}

async function handleMusicVolumeDownButton(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });
        
        const guildId = interaction.guild.id;
        const newVolume = decreaseVolume(guildId, 10);
        
        await interaction.editReply({
            content: `🔉 **Lautstärke verringert!**\n\`${newVolume}%\` Volume`,
            ephemeral: true
        });

        // Update Panel
        await updateInteractiveMusicPanel(guildId, true);

    } catch (error) {
        console.error('❌ Fehler beim Volume Down Button:', error);
        await interaction.followUp({
            content: '❌ Fehler beim Verringern der Lautstärke!',
            ephemeral: true
        });
    }
}

async function handleMusicVolumeShowButton(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });
        
        const guildId = interaction.guild.id;
        const currentVolume = getVolumeForGuild(guildId);
        
        await interaction.editReply({
            content: `🔊 **Lautstärke:**\n\`${currentVolume}%\` Volume`,
            ephemeral: true
        });

    } catch (error) {
        console.error('❌ Fehler beim Anzeigen der Lautstärke:', error);
        await interaction.followUp({
            content: '❌ Fehler beim Anzeigen der Lautstärke!',
            ephemeral: true
        });
    }
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

// API Endpoints
function registerMusicAPI(app) {
    console.log('🎵 Registriere Musik API...');

    // Get Music Settings
    app.get('/api/music/settings', (req, res) => {
        try {
        res.json({
            success: true,
            settings: musicSettings
        });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Update Music Settings
    app.post('/api/music/settings', async (req, res) => {
        try {
            const newSettings = req.body;
            console.log('💾 Musik-Einstellungen Update Request:', JSON.stringify(newSettings, null, 2));
            
            // Validierung und sichere Aktualisierung
            if (newSettings.localMusic) {
                musicSettings.localMusic = { ...musicSettings.localMusic, ...newSettings.localMusic };
                console.log('✅ LocalMusic Settings aktualisiert');
            }
            
            if (newSettings.voiceChannel) {
                musicSettings.voiceChannel = { ...musicSettings.voiceChannel, ...newSettings.voiceChannel };
                console.log('✅ VoiceChannel Settings aktualisiert');
            }
            
            if (newSettings.announcements) {
                musicSettings.announcements = { ...musicSettings.announcements, ...newSettings.announcements };
                console.log('✅ Announcements Settings aktualisiert');
            }
            
            if (newSettings.interactivePanel) {
                musicSettings.interactivePanel = { ...musicSettings.interactivePanel, ...newSettings.interactivePanel };
                console.log('✅ InteractivePanel Settings aktualisiert');
                console.log(`🔍 Channel-ID nach Update: ${musicSettings.interactivePanel.channelId}`);
            }
            
            // Guild-ID aus Request extrahieren oder Default verwenden
            const guildId = newSettings.guildId || process.env.GUILD_ID || '1203994020779532348';
            console.log(`💾 Speichere Musik-Einstellungen für Guild: ${guildId}`);
            
            // Asynchron speichern (Supabase + lokale JSON)
            await saveMusicSettings(guildId);
            
            res.json({
                success: true,
                message: 'Musik-Einstellungen erfolgreich aktualisiert und in Supabase gespeichert',
                settings: musicSettings,
                savedToDatabase: true
            });
            
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren der Musik-Einstellungen:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                savedToDatabase: false
            });
        }
    });

    // Reload Settings from file (for manual updates)
    app.post('/api/music/settings/reload', async (req, res) => {
        try {
            console.log('🔄 Lade Musik-Einstellungen neu...');
            await loadMusicSettings();
            
            res.json({
                success: true,
                message: 'Musik-Einstellungen erfolgreich neu geladen',
                settings: musicSettings,
                channelId: musicSettings.interactivePanel?.channelId
            });
            
        } catch (error) {
            console.error('❌ Fehler beim Neuladen der Musik-Einstellungen:', error);
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
            
            if (!global.client || !global.client.guilds) {
                console.log('❌ Bot nicht verfügbar');
                return res.status(500).json({ error: 'Bot nicht verfügbar' });
            }

            const guild = global.client.guilds.cache.get(guildId);
            if (!guild) {
                console.log(`❌ Guild ${guildId} nicht gefunden`);
                console.log(`📋 Verfügbare Guilds: ${global.client.guilds.cache.map(g => `${g.name} (${g.id})`).join(', ')}`);
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

    // Post Interactive Panel (beide URL-Formate unterstützen)
    const handlePanelPost = async (req, res) => {
        try {
            const { guildId } = req.params;
            
            // Debug logging
            console.log(`🔍 API Post Request für Guild: ${guildId}`);
            console.log(`🔍 Channel-Konfiguration: ${musicSettings.interactivePanel?.channelId}`);
            
            const success = await postInteractiveMusicPanel(guildId);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Musik Panel erfolgreich gepostet!',
                    guildId: guildId,
                    channelId: musicSettings.interactivePanel?.channelId,
                    messageId: musicSettings.interactivePanel?.messageId
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Posten des Musik Panels',
                    debug: {
                        channelConfigured: !!musicSettings.interactivePanel?.channelId,
                        channelId: musicSettings.interactivePanel?.channelId,
                        guildId: guildId,
                        clientAvailable: !!global.client?.guilds
                    }
                });
            }

        } catch (error) {
            console.error('❌ Fehler beim Musik Panel Post:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                debug: {
                    channelConfigured: !!musicSettings.interactivePanel?.channelId,
                    channelId: musicSettings.interactivePanel?.channelId,
                    guildId: guildId
                }
            });
        }
    };
    
    // Beide URL-Formate für Kompatibilität
    app.post('/api/music/interactive-panel/post/:guildId', handlePanelPost);
    app.post('/api/music/interactive-panel/:guildId/post', handlePanelPost);

    // Update Interactive Panel (beide URL-Formate unterstützen)
    const handlePanelUpdate = async (req, res) => {
        try {
            const { guildId } = req.params;
            
            const success = await updateInteractiveMusicPanel(guildId, true); // Force update
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Musik Panel erfolgreich aktualisiert!',
                    guildId: guildId
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Aktualisieren des Musik Panels'
                });
            }

        } catch (error) {
            console.error('❌ Fehler beim Musik Panel Update:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };
    
    // Beide URL-Formate für Kompatibilität
    app.post('/api/music/interactive-panel/update/:guildId', handlePanelUpdate);
    app.post('/api/music/interactive-panel/:guildId/update', handlePanelUpdate);

    // Force refresh panel with new song IDs
    app.post('/api/music/interactive-panel/:guildId/refresh', async (req, res) => {
        try {
            const { guildId } = req.params;
            
            console.log(`🔄 Force Refresh Panel für Guild: ${guildId}`);
            
            // Scanne Musik-Verzeichnis neu für aktuelle Song-IDs
            const freshSongs = scanMusicDirectory();
            console.log(`🎵 Frische Songs gefunden: ${freshSongs.length}`);
            freshSongs.forEach(song => {
                console.log(`- ${song.id} (${song.title})`);
            });
            
            // Lösche alte Message und erstelle neue
            if (musicSettings.interactivePanel?.messageId) {
                try {
                    const guild = global.client?.guilds.cache.get(guildId);
                    const channel = guild?.channels.cache.get(musicSettings.interactivePanel.channelId);
                    if (channel) {
                        const oldMessage = await channel.messages.fetch(musicSettings.interactivePanel.messageId).catch(() => null);
                        if (oldMessage) {
                            await oldMessage.delete();
                            console.log('🗑️ Alte Panel-Message gelöscht');
                        }
                    }
                } catch (deleteError) {
                    console.log('⚠️ Alte Message konnte nicht gelöscht werden:', deleteError.message);
                }
                
                // Reset Message ID
                musicSettings.interactivePanel.messageId = "";
                await saveMusicSettings(guildId);
            }
            
            // Erstelle neues Panel mit frischen Song-IDs
            const success = await postInteractiveMusicPanel(guildId);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Panel mit neuen Song-IDs aktualisiert!',
                    songCount: freshSongs.length,
                    songs: freshSongs.map(s => ({ id: s.id, title: s.title }))
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Aktualisieren des Panels'
                });
            }
            
        } catch (error) {
            console.error('❌ Fehler beim Panel Refresh:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Get available channels for configuration
    app.get('/api/music/channels/:guildId', (req, res) => {
        try {
            const { guildId } = req.params;
            
            if (!global.client?.guilds) {
                return res.status(500).json({
                    success: false,
                    error: 'Discord Client nicht verfügbar'
                });
            }
            
            const guild = global.client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({
                    success: false,
                    error: 'Guild nicht gefunden'
                });
            }

            const textChannels = guild.channels.cache
                .filter(channel => channel.type === 0) // Text channels
                .map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    topic: channel.topic || '',
                    position: channel.position
                }))
                .sort((a, b) => a.position - b.position);

            res.json({
                success: true,
                channels: textChannels,
                currentChannelId: musicSettings.interactivePanel?.channelId || null
            });

        } catch (error) {
            console.error('❌ Fehler beim Abrufen der Channels:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Set channel for interactive panel
    app.post('/api/music/channels/:guildId/set', (req, res) => {
        try {
            const { guildId } = req.params;
            const { channelId } = req.body;
            
            if (!channelId) {
                return res.status(400).json({
                    success: false,
                    error: 'Channel ID erforderlich'
                });
            }
            
            // Verify channel exists
            if (!global.client?.guilds) {
                return res.status(500).json({
                    success: false,
                    error: 'Discord Client nicht verfügbar'
                });
            }
            
            const guild = global.client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({
                    success: false,
                    error: 'Guild nicht gefunden'
                });
            }

            const channel = guild.channels.cache.get(channelId);
            if (!channel || channel.type !== 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Text-Channel nicht gefunden'
                });
            }

            // Update settings
            musicSettings.interactivePanel.channelId = channelId;
            musicSettings.interactivePanel.messageId = ""; // Reset message ID
            
            const saveSuccess = saveMusicSettings();
            
            if (saveSuccess) {
                res.json({
                    success: true,
                    message: `Channel #${channel.name} für Musik Panel konfiguriert`,
                    channelId: channelId,
                    channelName: channel.name,
                    guildId: guildId
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Speichern der Einstellungen'
                });
            }

        } catch (error) {
            console.error('❌ Fehler beim Setzen des Channels:', error);
            res.status(500).json({
                success: false,
                error: error.message
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

    // Volume Control Endpoints
    app.get('/api/music/volume/:guildId', (req, res) => {
        try {
            const { guildId } = req.params;
            const volume = getVolumeForGuild(guildId);
            
            res.json({
                success: true,
                volume: volume,
                guildId: guildId
            });
        } catch (error) {
            console.error('❌ Fehler beim Abrufen der Lautstärke:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    app.post('/api/music/volume/:guildId', (req, res) => {
        try {
            const { guildId } = req.params;
            const { volume } = req.body;
            
            if (typeof volume !== 'number' || volume < 0 || volume > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Volume muss eine Zahl zwischen 0 und 100 sein'
                });
            }
            
            const newVolume = setVolumeForGuild(guildId, volume);
            
            res.json({
                success: true,
                volume: newVolume,
                guildId: guildId,
                message: `Lautstärke auf ${newVolume}% gesetzt`
            });
        } catch (error) {
            console.error('❌ Fehler beim Setzen der Lautstärke:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    app.post('/api/music/volume/:guildId/increase', (req, res) => {
        try {
            const { guildId } = req.params;
            const { amount = 10 } = req.body;
            
            const newVolume = increaseVolume(guildId, amount);
            
            res.json({
                success: true,
                volume: newVolume,
                guildId: guildId,
                message: `Lautstärke um ${amount}% erhöht auf ${newVolume}%`
            });
        } catch (error) {
            console.error('❌ Fehler beim Erhöhen der Lautstärke:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    app.post('/api/music/volume/:guildId/decrease', (req, res) => {
        try {
            const { guildId } = req.params;
            const { amount = 10 } = req.body;
            
            const newVolume = decreaseVolume(guildId, amount);
            
            res.json({
                success: true,
                volume: newVolume,
                guildId: guildId,
                message: `Lautstärke um ${amount}% verringert auf ${newVolume}%`
            });
        } catch (error) {
            console.error('❌ Fehler beim Verringern der Lautstärke:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    console.log('✅ Musik API registriert!');
}

// Utility Functions (Hilfsfunktionen)
function getVolumeForGuild(guildId) {
    return currentVolume.get(guildId) || 50; // Default volume 50%
}

function setVolumeForGuild(guildId, volume) {
    const newVolume = Math.max(0, Math.min(100, volume));
    currentVolume.set(guildId, newVolume);
    
    console.log(`🔊 Volume für Guild ${guildId} gesetzt auf: ${newVolume}%`);
    
    // Aktualisiere aktuelle Audio-Resource Volume
    const player = audioPlayers.get(guildId);
    if (player && player.state.status === AudioPlayerStatus.Playing) {
        const resource = player.state.resource;
        if (resource && resource.volume) {
            resource.volume.setVolume(newVolume / 100);
            console.log(`🎵 Audio-Resource Volume aktualisiert: ${newVolume / 100}`);
        }
    }
    
    return newVolume;
}

function increaseVolume(guildId, amount = 10) {
    const currentVol = getVolumeForGuild(guildId);
    const newVolume = Math.min(100, currentVol + amount);
    setVolumeForGuild(guildId, newVolume);
    return newVolume;
}

function decreaseVolume(guildId, amount = 10) {
    const currentVol = getVolumeForGuild(guildId);
    const newVolume = Math.max(0, currentVol - amount);
    setVolumeForGuild(guildId, newVolume);
    return newVolume;
}

module.exports = {
    loadMusicSettings,
    saveMusicSettings,
    scanMusicDirectory,
    joinVoiceChannelSafe,
    leaveVoiceChannel,
    getAvailableSongs,
    getMusicStations,
    getMusicStation,
    playLocalSong,
    playMusicStation,
    stopMusic,
    getCurrentSong,
    getCurrentStation,
    isPlayingMusic,
    autoJoinForMusic,
    sendNowPlayingMessage,
    getVolumeForGuild,
    setVolumeForGuild,
    increaseVolume,
    decreaseVolume,
    postInteractiveMusicPanel,
    updateInteractiveMusicPanel,
    handleMusicRadioSelectButton,
    handleMusicMP3SelectButton,
    handleMusicPlaylistSelectButton,
    handleMusicStopAllButton,
    handleMusicVoiceJoinButton,
    handleMusicVoiceLeaveButton,
    handleMusicRefreshButton,
    handleMusicMP3SongSelect,
    handleMusicPlaylistStationSelect,
    handleMusicVolumeUpButton,
    handleMusicVolumeDownButton,
    handleMusicVolumeShowButton,
    registerMusicAPI
}; 