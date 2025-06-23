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
    createSimplePanel(page = 0) {
        const songs = this.scanSongs();
        const startIndex = page * this.songsPerPage;
        const endIndex = startIndex + this.songsPerPage;
        const pageSongs = songs.slice(startIndex, endIndex);
        
        // Embed
        const embed = new EmbedBuilder()
            .setTitle('🎵 Einfaches Musik-Panel')
            .setDescription(`**${songs.length} Songs verfügbar**\n\nKlicke auf einen Song-Button oder nutze \`/play\` Command!`)
            .setColor(0x00FF7F)
            .addFields(
                {
                    name: '🎵 Aktuelle Songs',
                    value: pageSongs.length > 0 
                        ? pageSongs.map(song => `• **${song.title}** - ${song.artist}`).join('\n')
                        : 'Keine Songs auf dieser Seite',
                    inline: false
                },
                {
                    name: '📊 Info',
                    value: `Seite ${page + 1} von ${Math.ceil(songs.length / this.songsPerPage)}\nGesamt: ${songs.length} Songs`,
                    inline: true
                }
            )
            .setFooter({ text: 'Nutze /play [song] für alle Songs oder klicke die Buttons!' })
            .setTimestamp();

        // Song-Buttons (max 4 pro Seite)
        const songButtons = [];
        
        if (pageSongs.length > 0) {
            const songRow1 = new ActionRowBuilder();
            const songRow2 = new ActionRowBuilder();
            
            pageSongs.forEach((song, index) => {
                const button = new ButtonBuilder()
                    .setCustomId(`simple_play_${song.id}`)
                    .setLabel(`🎵 ${song.title.substring(0, 20)}`)
                    .setStyle(ButtonStyle.Primary);
                
                if (index < 2) {
                    songRow1.addComponents(button);
                } else {
                    songRow2.addComponents(button);
                }
            });
            
            if (songRow1.components.length > 0) songButtons.push(songRow1);
            if (songRow2.components.length > 0) songButtons.push(songRow2);
        }

        // Navigation + Control Buttons
        const controlRow = new ActionRowBuilder();
        
        // Previous Button
        if (page > 0) {
            controlRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`simple_page_${page - 1}`)
                    .setLabel('⬅️ Zurück')
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        
        // Stop Button
        controlRow.addComponents(
            new ButtonBuilder()
                .setCustomId('simple_stop')
                .setLabel('⏹️ Stop')
                .setStyle(ButtonStyle.Danger)
        );
        
        // Next Button
        if (endIndex < songs.length) {
            controlRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`simple_page_${page + 1}`)
                    .setLabel('Weiter ➡️')
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        
        // Refresh Button
        controlRow.addComponents(
            new ButtonBuilder()
                .setCustomId('simple_refresh')
                .setLabel('🔄 Refresh')
                .setStyle(ButtonStyle.Secondary)
        );
        
        songButtons.push(controlRow);

        return {
            embeds: [embed],
            components: songButtons
        };
    }

    // Button Handler
    async handleButtonInteraction(interaction) {
        try {
            const customId = interaction.customId;
            
            if (customId.startsWith('simple_play_')) {
                return await this.handleSongPlay(interaction);
            }
            
            if (customId.startsWith('simple_page_')) {
                return await this.handlePageChange(interaction);
            }
            
            if (customId === 'simple_stop') {
                return await this.handleStop(interaction);
            }
            
            if (customId === 'simple_refresh') {
                return await this.handleRefresh(interaction);
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

    // Song abspielen
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

        // Verwende dieselbe API wie Dashboard
        try {
            const fetch = require('node-fetch');
            const API_URL = process.env.API_URL || 'https://agentbee.up.railway.app';
            
            // Konvertiere zu altem System-Format
            const actualSongId = `mp3_${songs.indexOf(song)}_${song.filename.replace(/\.mp3$/i, '').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').toLowerCase()}`;
            
            const response = await fetch(`${API_URL}/api/music/play/${interaction.guild.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ songId: actualSongId })
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
            
            const response = await fetch(`${API_URL}/api/music/stop/${interaction.guild.id}`, {
                method: 'POST'
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

    // Panel refreshen
    async handleRefresh(interaction) {
        const panelData = this.createSimplePanel(0);
        await interaction.update(panelData);
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

        // API Call
        try {
            const fetch = require('node-fetch');
            const API_URL = process.env.API_URL || 'https://agentbee.up.railway.app';
            
            const actualSongId = `mp3_${songs.indexOf(matchingSong)}_${matchingSong.filename.replace(/\.mp3$/i, '').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').toLowerCase()}`;
            
            const response = await fetch(`${API_URL}/api/music/play/${interaction.guild.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ songId: actualSongId })
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
            
            const response = await fetch(`${API_URL}/api/music/stop/${interaction.guild.id}`, {
                method: 'POST'
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
        const panelData = this.createSimplePanel(0);
        
        await interaction.reply({
            content: '🆕 **Neues einfaches Musik-Panel erstellt!**',
            ...panelData
        });
    }
}

module.exports = { SimpleMusicPanel }; 