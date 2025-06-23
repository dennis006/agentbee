const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Einfaches Musik-Panel System
class SimpleMusicPanel {
    constructor() {
        this.currentPage = 0;
        this.songsPerPage = 4;
    }

    // Scanne Musik-Dateien (vereinfacht)
    scanSongs() {
        const musicDir = path.join(__dirname, 'music');
        
        if (!fs.existsSync(musicDir)) {
            return [];
        }

        const files = fs.readdirSync(musicDir);
        const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));
        
        return mp3Files.map((file, index) => {
            const [artist, title] = file.replace(/\.mp3$/i, '').split(' - ');
            
            return {
                id: `song_${index}`,
                filename: file,
                title: title || artist || file.replace(/\.mp3$/i, ''),
                artist: artist || 'Unbekannt',
                path: path.join(musicDir, file)
            };
        });
    }

    // Erstelle einfaches Panel mit direkten Song-Buttons
    async createSimplePanel(page = 0, guildId = null) {
        const songs = this.scanSongs();
        
        // Status und Volume direkt vom lokalen Musik-System abrufen (wie vollständiges Panel)
        let currentStatus = 'Keine Musik läuft';
        let currentVolume = '50%';
        
        console.log(`🔍 Simple Panel: createSimplePanel aufgerufen mit guildId: ${guildId}, page: ${page}`);
        
        if (guildId) {
            try {
                // Verwende direkte lokale Funktionen (wie vollständiges Panel)
                const { getCurrentSong, getCurrentStation, getVolumeForGuild } = require('./music-api');
                
                const currentSong = getCurrentSong(guildId);
                const currentStation = getCurrentStation(guildId);
                const volume = getVolumeForGuild(guildId);
                
                // Status-Text erstellen (identisch zum vollständigen Panel)
                if (currentSong) {
                    currentStatus = `🎵 **${currentSong.title}**\n🎤 ${currentSong.artist || 'Unbekannt'}`;
                } else if (currentStation) {
                    currentStatus = `🎼 **${currentStation.name}**\n📻 Playlist aktiv`;
                } else {
                    currentStatus = 'Keine Musik läuft';
                }
                
                currentVolume = volume + '%';
                console.log(`✅ Simple Panel: Live-Status direkt geladen! Song: ${currentSong?.title}, Station: ${currentStation?.name}, Volume: ${volume}%`);
                
            } catch (error) {
                console.log('⚠️ Konnte lokale Musik-Funktionen nicht abrufen:', error.message);
                currentStatus = 'Status wird geladen...';
                currentVolume = '50%';
            }
        } else {
            console.log('⚠️ Simple Panel: Keine guildId - verwende statische Werte');
        }
        
        // Embed im Stil des vollständigen Panels erstellen
        const embed = new EmbedBuilder()
            .setTitle('🎵 Musik-System')
            .setDescription('**Lokale MP3-Bibliothek!**\n\n' +
                          '🎯 **Verfügbare Funktionen:**\n' +
                          '• 🎵 **MP3-Bibliothek** - Lokale Musik-Dateien\n' +
                          '• 🎼 **Playlists** - Custom Musik-Sammlungen\n' +
                          '• 🎚️ **Lautstärke** - Volume-Kontrolle\n' +
                          '• 🎙️ **Voice-Chat** - Auto-Join Funktionen')
            .setColor(0xFF6B6B)
            .addFields(
                {
                    name: '⏸️ Status',
                    value: currentStatus,
                    inline: true
                },
                {
                    name: '🔊 Lautstärke',
                    value: currentVolume,
                    inline: true
                },
                {
                    name: '📊 Verfügbare Inhalte', 
                    value: `🎵 **${songs.length}** MP3-Dateien\n🎼 **2** Playlists`,
                    inline: true
                }
            )
            .setFooter({ text: '🎵 Lokales Musik-System • MP3s & Playlists • heute um ' + new Date().toLocaleTimeString() })
            .setTimestamp();

        // Erstelle Buttons im Stil des vollständigen Panels
        const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
        
        // Erste Reihe: Hauptfunktionen
        const mainButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('simple_mp3_select')
                    .setLabel('🎵 MP3')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('simple_playlists_select')
                    .setLabel('🎼 Playlists')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('simple_status')
                    .setLabel('⏸️ Status')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('simple_stop')
                    .setLabel('⏹️ Stop')
                    .setStyle(ButtonStyle.Danger)
            );

        // Zweite Reihe: Voice-Chat Funktionen
        const voiceButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('simple_voice_join')
                    .setLabel('🎙️ Join')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('simple_voice_leave')
                    .setLabel('🚪 Leave')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('simple_refresh')
                    .setLabel('🔄 Refresh')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Dritte Reihe: Lautstärke-Kontrolle
        const volumeButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('simple_volume_down')
                    .setLabel('🔉 -10%')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('simple_volume_show')
                    .setLabel('🔊 Volume')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('simple_volume_up')
                    .setLabel('🔊 +10%')
                    .setStyle(ButtonStyle.Secondary)
            );

        return {
            embeds: [embed],
            components: [mainButtons, voiceButtons, volumeButtons]
        };
    }

    // Button Handler
    async handleButtonInteraction(interaction) {
        try {
            const customId = interaction.customId;
            
            if (customId === 'simple_mp3_select') {
                return await this.handleMp3Select(interaction);
            }
            
            if (customId === 'simple_playlists_select') {
                return await this.handlePlaylistsSelect(interaction);
            }
            
            if (customId === 'simple_status') {
                return await this.handleStatus(interaction);
            }
            
            if (customId === 'simple_stop') {
                return await this.handleStop(interaction);
            }
            
            if (customId === 'simple_voice_join') {
                return await this.handleVoiceJoin(interaction);
            }
            
            if (customId === 'simple_voice_leave') {
                return await this.handleVoiceLeave(interaction);
            }
            
            if (customId === 'simple_refresh') {
                return await this.handleRefresh(interaction);
            }
            
            if (customId === 'simple_volume_down') {
                return await this.handleVolumeDown(interaction);
            }
            
            if (customId === 'simple_volume_show') {
                return await this.handleVolumeShow(interaction);
            }
            
            if (customId === 'simple_volume_up') {
                return await this.handleVolumeUp(interaction);
            }
            
            if (customId.startsWith('simple_play_')) {
                return await this.handleSongPlay(interaction);
            }
            
            if (customId === 'simple_song_select') {
                return await this.handleSongSelect(interaction);
            }
            
            if (customId === 'simple_playlist_select') {
                return await this.handlePlaylistSelect(interaction);
            }
            
        } catch (error) {
            console.error('❌ Simple Music Panel Error:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: `❌ **Fehler:** ${error.message}`,
                    ephemeral: true
                });
            }
        }
    }

    // Song Select Menu Handler
    async handleSongSelect(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const songId = interaction.values[0];
        const songs = this.scanSongs();
        const song = songs.find(s => s.id === songId);
        
        if (!song) {
            await interaction.editReply({
                content: '❌ Song nicht gefunden!'
            });
            return;
        }

        // Verwende Simple Music Panel API
        try {
            const fetch = require('node-fetch');
            const API_URL = process.env.API_URL || 'https://agentbee.up.railway.app';
            
            // Verwende Dateiname direkt (wie Simple Panel API erwartet)
            const response = await fetch(`${API_URL}/api/simple-music/play`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    guildId: interaction.guild.id,
                    songName: song.filename 
                })
            });

            if (response.ok) {
                const data = await response.json();
                await interaction.editReply({
                    content: `✅ **Song gestartet!**\n\n🎵 **${song.title}**\n🎤 **${song.artist}**\n\n💡 *Simple Panel API*`
                });
            } else {
                const errorData = await response.json();
                await interaction.editReply({
                    content: `❌ **API-Fehler**\n\n${errorData.error || 'Unbekannter Fehler'}`
                });
            }
        } catch (error) {
            await interaction.editReply({
                content: `❌ **Fehler beim Abspielen**\n\n\`\`\`${error.message}\`\`\``
            });
        }
    }

    // Playlist Select Menu Handler
    async handlePlaylistSelect(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const stationId = interaction.values[0];
        const { getMusicStation } = require('./music-api');
        const station = getMusicStation(stationId);
        
        if (!station) {
            await interaction.editReply({
                content: '❌ Playlist nicht gefunden!'
            });
            return;
        }

        if (!station.playlist || station.playlist.length === 0) {
            await interaction.editReply({
                content: `❌ **Playlist "${station.name}" ist leer!**\n\nFüge Songs über das Dashboard hinzu.`
            });
            return;
        }

        // Verwende das Musik-System API für Playlist-Wiedergabe
        try {
            const fetch = require('node-fetch');
            const API_URL = process.env.API_URL || 'https://agentbee.up.railway.app';
            
            const response = await fetch(`${API_URL}/api/music/station/${interaction.guild.id}/play`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stationId })
            });

            if (response.ok) {
                const data = await response.json();
                await interaction.editReply({
                    content: `✅ **Playlist gestartet!**\n\n🎼 **${station.name}**\n🎵 **${station.playlist.length} Songs**\n🎭 **${station.genre || 'Custom Playlist'}**\n\n💡 *Musik-System API*`
                });
            } else {
                const errorData = await response.json();
                await interaction.editReply({
                    content: `❌ **API-Fehler**\n\n${errorData.error || 'Unbekannter Fehler'}`
                });
            }
        } catch (error) {
            await interaction.editReply({
                content: `❌ **Fehler beim Abspielen**\n\n\`\`\`${error.message}\`\`\``
            });
        }
    }

    // Song abspielen (falls noch verwendet)
    async handleSongPlay(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const songId = interaction.customId.replace('simple_play_', '');
        const songs = this.scanSongs();
        const song = songs.find(s => s.id === songId);
        
        if (!song) {
            await interaction.editReply({
                content: '❌ Song nicht gefunden!'
            });
            return;
        }

        // Verwende Simple Music Panel API
        try {
            const fetch = require('node-fetch');
            const API_URL = process.env.API_URL || 'https://agentbee.up.railway.app';
            
            // Verwende Dateiname direkt (wie Simple Panel API erwartet)
            const response = await fetch(`${API_URL}/api/simple-music/play`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    guildId: interaction.guild.id,
                    songName: song.filename 
                })
            });

            if (response.ok) {
                const data = await response.json();
                await interaction.editReply({
                    content: `✅ **Song gestartet!**\n\n🎵 **${song.title}**\n🎤 **${song.artist}**\n\n💡 *Simple Panel API*`
                });
            } else {
                const errorData = await response.json();
                await interaction.editReply({
                    content: `❌ **API-Fehler**\n\n${errorData.error || 'Unbekannter Fehler'}`
                });
            }
        } catch (error) {
            await interaction.editReply({
                content: `❌ **Fehler beim Abspielen**\n\n\`\`\`${error.message}\`\`\``
            });
        }
    }

    // Seite wechseln
    async handlePageChange(interaction) {
        const page = parseInt(interaction.customId.replace('simple_page_', ''));
        const panelData = this.createSimplePanel(page);
        
        await interaction.update(panelData);
    }

    // Musik stoppen
    async handleStop(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const fetch = require('node-fetch');
            const API_URL = process.env.API_URL || 'https://agentbee.up.railway.app';
            
            const response = await fetch(`${API_URL}/api/simple-music/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guildId: interaction.guild.id })
            });

            if (response.ok) {
                await interaction.editReply({
                    content: '⏹️ **Musik gestoppt!**'
                });
            } else {
                await interaction.editReply({
                    content: '❌ **Fehler beim Stoppen**'
                });
            }
        } catch (error) {
            await interaction.editReply({
                content: `❌ **Stop-Fehler:** ${error.message}`
            });
        }
    }

    // MP3 Auswahl anzeigen
    async handleMp3Select(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const songs = this.scanSongs();
        
        if (songs.length === 0) {
            await interaction.editReply({
                content: '❌ **Keine MP3-Dateien gefunden!**\n\nFüge MP3-Dateien zum Musik-Ordner hinzu.'
            });
            return;
        }

        // Erstelle Song-Auswahl ähnlich wie das vollständige Panel
        const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
        
        const songOptions = songs.slice(0, 25).map(song => ({
            label: song.title.length > 100 ? song.title.substring(0, 97) + '...' : song.title,
            description: `🎤 ${song.artist} • ${Math.round(song.size / 1024 / 1024)}MB`,
            value: song.id
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('simple_song_select')
            .setPlaceholder('🎵 Wähle einen Song aus...')
            .addOptions(songOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.editReply({
            content: `🎵 **MP3-Bibliothek (${songs.length} Songs)**\n\nWähle einen Song aus der Liste:`,
            components: [row]
        });
    }

    // Playlists Auswahl anzeigen
    async handlePlaylistsSelect(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        // Lade verfügbare Playlists vom Musik-System
        const { getMusicStations } = require('./music-api');
        const musicStations = getMusicStations();
        
        if (musicStations.length === 0) {
            await interaction.editReply({
                content: '❌ **Keine Playlists gefunden!**\n\nErstelle zuerst Playlists im Dashboard → Music → Playlists.'
            });
            return;
        }

        // Erstelle Playlist-Auswahl ähnlich wie das vollständige Panel
        const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
        
        const playlistOptions = musicStations.slice(0, 25).map(station => ({
            label: station.name.length > 100 ? station.name.substring(0, 97) + '...' : station.name,
            description: `🎵 ${station.playlist?.length || 0} Songs • ${station.genre || 'Custom Playlist'}`,
            value: station.id
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('simple_playlist_select')
            .setPlaceholder('🎼 Wähle eine Playlist aus...')
            .addOptions(playlistOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.editReply({
            content: `🎼 **Playlists (${musicStations.length} verfügbar)**\n\nWähle eine Playlist aus der Liste:`,
            components: [row]
        });
    }

    // Voice Channel beitreten
    async handleVoiceJoin(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const fetch = require('node-fetch');
            const API_URL = process.env.API_URL || 'https://agentbee.up.railway.app';
            
            // Finde den Voice Channel des Users
            const member = interaction.guild.members.cache.get(interaction.user.id);
            const userVoiceChannel = member?.voice?.channel;
            
            if (!userVoiceChannel) {
                await interaction.editReply({
                    content: '❌ **Voice Join Fehler**\n\nDu musst dich in einem Voice-Channel befinden!'
                });
                return;
            }
            
            const response = await fetch(`${API_URL}/api/music/voice/${interaction.guild.id}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelId: userVoiceChannel.id })
            });

            if (response.ok) {
                const data = await response.json();
                await interaction.editReply({
                    content: `🎙️ **Voice-Channel beigetreten!**\n\n${data.message || 'Bot ist jetzt im Voice-Channel.'}`
                });
            } else {
                const errorData = await response.json();
                await interaction.editReply({
                    content: `❌ **Voice Join Fehler**\n\n${errorData.error || 'Konnte keinem Voice-Channel beitreten.'}`
                });
            }
        } catch (error) {
            await interaction.editReply({
                content: `❌ **Voice Join Fehler**\n\n\`\`\`${error.message}\`\`\``
            });
        }
    }

    // Voice Channel verlassen
    async handleVoiceLeave(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const fetch = require('node-fetch');
            const API_URL = process.env.API_URL || 'https://agentbee.up.railway.app';
            
            const response = await fetch(`${API_URL}/api/music/voice/${interaction.guild.id}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (response.ok) {
                const data = await response.json();
                await interaction.editReply({
                    content: `🚪 **Voice-Channel verlassen**\n\n${data.message || 'Bot hat den Voice-Channel verlassen.'}`
                });
            } else {
                const errorData = await response.json();
                await interaction.editReply({
                    content: `❌ **Voice Leave Fehler**\n\n${errorData.error || 'Fehler beim Verlassen des Voice-Channels.'}`
                });
            }
        } catch (error) {
            await interaction.editReply({
                content: `❌ **Voice Leave Fehler**\n\n\`\`\`${error.message}\`\`\``
            });
        }
    }

    // Lautstärke verringern (verbesserte Version wie vollständiges Panel)
    async handleVolumeDown(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const { decreaseVolume } = require('./music-api');
            const guildId = interaction.guild.id;
            const newVolume = decreaseVolume(guildId, 10);
            
            await interaction.editReply({
                content: `🔉 **Lautstärke verringert!**\n\`${newVolume}%\` Volume`
            });

            // Panel automatisch refreshen (wie vollständiges Panel)
            setTimeout(async () => {
                try {
                    const panelData = await this.createSimplePanel(0, guildId);
                    const originalMessage = interaction.message;
                    if (originalMessage) {
                        await originalMessage.edit(panelData);
                    }
                } catch (updateError) {
                    console.log('⚠️ Konnte Panel nicht automatisch refreshen:', updateError.message);
                }
            }, 1000);

        } catch (error) {
            console.error('❌ Fehler beim Volume Down Button:', error);
            await interaction.editReply({
                content: '❌ Fehler beim Verringern der Lautstärke!'
            });
        }
    }

    // Lautstärke anzeigen (verbesserte Version wie vollständiges Panel)
    async handleVolumeShow(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const { getVolumeForGuild } = require('./music-api');
            const guildId = interaction.guild.id;
            const currentVolume = getVolumeForGuild(guildId);
            
            await interaction.editReply({
                content: `🔊 **Lautstärke:**\n\`${currentVolume}%\` Volume`
            });

        } catch (error) {
            console.error('❌ Fehler beim Anzeigen der Lautstärke:', error);
            await interaction.editReply({
                content: '❌ Fehler beim Anzeigen der Lautstärke!'
            });
        }
    }

    // Lautstärke erhöhen (verbesserte Version wie vollständiges Panel)
    async handleVolumeUp(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const { increaseVolume } = require('./music-api');
            const guildId = interaction.guild.id;
            const newVolume = increaseVolume(guildId, 10);
            
            await interaction.editReply({
                content: `🔊 **Lautstärke erhöht!**\n\`${newVolume}%\` Volume`
            });

            // Panel automatisch refreshen (wie vollständiges Panel)
            setTimeout(async () => {
                try {
                    const panelData = await this.createSimplePanel(0, guildId);
                    const originalMessage = interaction.message;
                    if (originalMessage) {
                        await originalMessage.edit(panelData);
                    }
                } catch (updateError) {
                    console.log('⚠️ Konnte Panel nicht automatisch refreshen:', updateError.message);
                }
            }, 1000);

        } catch (error) {
            console.error('❌ Fehler beim Volume Up Button:', error);
            await interaction.editReply({
                content: '❌ Fehler beim Erhöhen der Lautstärke!'
            });
        }
    }

    // getMusicStatus Methode entfernt - verwenden jetzt direkte lokale Funktionen wie vollständiges Panel

    // Status anzeigen (verbesserte Version mit direkten Funktionen)
    async handleStatus(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const { getCurrentSong, getCurrentStation, getVolumeForGuild, isPlayingMusic } = require('./music-api');
            const guildId = interaction.guild.id;
            
            const currentSong = getCurrentSong(guildId);
            const currentStation = getCurrentStation(guildId);
            const volume = getVolumeForGuild(guildId);
            const isPlaying = isPlayingMusic(guildId);
            
            // Status-Text erstellen
            let statusText = 'Keine Musik läuft';
            if (currentSong) {
                statusText = `🎵 **${currentSong.title}**\n🎤 ${currentSong.artist || 'Unbekannt'}`;
            } else if (currentStation) {
                statusText = `🎼 **${currentStation.name}**\n📻 Playlist aktiv`;
            }
            
            const embed = new EmbedBuilder()
                .setTitle('⏸️ **Aktueller Musik-Status**')
                .setColor(isPlaying ? 0x00FF7F : 0xFF6B6B)
                .addFields(
                    {
                        name: '🎵 Aktuelle Wiedergabe',
                        value: statusText,
                        inline: false
                    },
                    {
                        name: '🔊 Lautstärke',
                        value: `${volume}%`,
                        inline: true
                    },
                    {
                        name: '📊 Status',
                        value: isPlaying ? '▶️ Spielt' : '⏸️ Gestoppt',
                        inline: true
                    }
                )
                .setFooter({ text: '💡 Drücke 🔄 Refresh um das Panel zu aktualisieren' })
                .setTimestamp();

            await interaction.editReply({
                embeds: [embed]
            });
            
        } catch (error) {
            console.error('❌ Fehler beim Status-Handler:', error);
            await interaction.editReply({
                content: `❌ **Status-Fehler**\n\n\`\`\`${error.message}\`\`\``
            });
        }
    }

    // Panel refreshen
    async handleRefresh(interaction) {
        await interaction.deferUpdate();
        const panelData = await this.createSimplePanel(0, interaction.guild.id);
        await interaction.editReply(panelData);
    }

    // Slash Commands registrieren
    getSlashCommands() {
        return [
            new SlashCommandBuilder()
                .setName('play')
                .setDescription('Spiele einen Song ab')
                .addStringOption(option =>
                    option.setName('song')
                        .setDescription('Song-Name (Teil des Namens reicht)')
                        .setRequired(true)
                ),
            
            new SlashCommandBuilder()
                .setName('stop')
                .setDescription('Stoppe die aktuelle Musik'),
                
            new SlashCommandBuilder()
                .setName('songs')
                .setDescription('Zeige alle verfügbaren Songs'),
                
            new SlashCommandBuilder()
                .setName('musicpanel')
                .setDescription('Erstelle ein neues einfaches Musik-Panel')
        ];
    }

    // Slash Command Handler
    async handleSlashCommand(interaction) {
        const { commandName } = interaction;
        
        try {
            if (commandName === 'play') {
                return await this.handleSlashPlay(interaction);
            }
            
            if (commandName === 'stop') {
                return await this.handleSlashStop(interaction);
            }
            
            if (commandName === 'songs') {
                return await this.handleSlashSongs(interaction);
            }
            
            if (commandName === 'musicpanel') {
                return await this.handleSlashPanel(interaction);
            }
            
        } catch (error) {
            console.error('❌ Slash Command Error:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: `❌ **Slash Command Fehler:** ${error.message}`,
                    ephemeral: true
                });
            }
        }
    }

    // /play Command
    async handleSlashPlay(interaction) {
        await interaction.deferReply();
        
        const songQuery = interaction.options.getString('song').toLowerCase();
        const songs = this.scanSongs();
        
        // Finde Song by Name
        const matchingSong = songs.find(song => 
            song.title.toLowerCase().includes(songQuery) ||
            song.artist.toLowerCase().includes(songQuery) ||
            song.filename.toLowerCase().includes(songQuery)
        );
        
        if (!matchingSong) {
            const songList = songs.slice(0, 5).map(s => `• ${s.title} - ${s.artist}`).join('\n');
            await interaction.editReply({
                content: `❌ **Song "${songQuery}" nicht gefunden!**\n\n**Verfügbare Songs (Top 5):**\n${songList}\n\nNutze \`/songs\` für alle Songs!`
            });
            return;
        }

        // API Call mit Simple Music Panel API
        try {
            const fetch = require('node-fetch');
            const API_URL = process.env.API_URL || 'https://agentbee.up.railway.app';
            
            const response = await fetch(`${API_URL}/api/simple-music/play`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    guildId: interaction.guild.id,
                    songName: matchingSong.filename 
                })
            });

            if (response.ok) {
                await interaction.editReply({
                    content: `✅ **Song gestartet via Slash Command!**\n\n🎵 **${matchingSong.title}**\n🎤 **${matchingSong.artist}**\n\n🔍 Gesucht: "${songQuery}"`
                });
            } else {
                const errorData = await response.json();
                await interaction.editReply({
                    content: `❌ **API-Fehler:** ${errorData.error || 'Unbekannter Fehler'}`
                });
            }
        } catch (error) {
            await interaction.editReply({
                content: `❌ **Fehler:** ${error.message}`
            });
        }
    }

    // /stop Command
    async handleSlashStop(interaction) {
        await interaction.deferReply();
        
        try {
            const fetch = require('node-fetch');
            const API_URL = process.env.API_URL || 'https://agentbee.up.railway.app';
            
            const response = await fetch(`${API_URL}/api/simple-music/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guildId: interaction.guild.id })
            });

            if (response.ok) {
                await interaction.editReply({
                    content: '⏹️ **Musik gestoppt via Slash Command!**'
                });
            } else {
                await interaction.editReply({
                    content: '❌ **Fehler beim Stoppen**'
                });
            }
        } catch (error) {
            await interaction.editReply({
                content: `❌ **Stop-Fehler:** ${error.message}`
            });
        }
    }

    // /songs Command
    async handleSlashSongs(interaction) {
        const songs = this.scanSongs();
        
        if (songs.length === 0) {
            await interaction.reply({
                content: '❌ **Keine Songs gefunden!** Füge MP3-Dateien zum Musik-Ordner hinzu.',
                ephemeral: true
            });
            return;
        }

        const songList = songs.map((song, index) => 
            `${index + 1}. **${song.title}** - ${song.artist}`
        ).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`🎵 Alle Songs (${songs.length})`)
            .setDescription(songList.length > 4096 ? songList.substring(0, 4096) + '...' : songList)
            .setColor(0x00FF7F)
            .setFooter({ text: 'Nutze /play [song-name] zum Abspielen!' })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    // /musicpanel Command
    async handleSlashPanel(interaction) {
        await interaction.deferReply();
        
        try {
            const panelData = await this.createSimplePanel(0, interaction.guild.id);
            
            await interaction.editReply({
                content: '🆕 **Neues einfaches Musik-Panel erstellt!**',
                ...panelData
            });
            
        } catch (error) {
            console.error('❌ Panel Creation Error:', error);
            await interaction.editReply({
                content: `❌ **Panel-Fehler:** ${error.message}`
            });
        }
    }
}

module.exports = { SimpleMusicPanel }; 