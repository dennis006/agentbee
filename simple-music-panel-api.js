const express = require('express');
const fs = require('fs');
const path = require('path');

// Simple Music Panel API Routes
function registerSimpleMusicPanelAPI(app, client) {
    console.log('🎵 Registriere Simple Music Panel API...');

    // GET: Lade verfügbare Songs
    app.get('/api/simple-music/songs/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            
            // Musik-Verzeichnis scannen
            const musicDir = path.join(__dirname, 'music');
            if (!fs.existsSync(musicDir)) {
                return res.json({
                    success: true,
                    songs: [],
                    message: 'Musik-Ordner nicht gefunden'
                });
            }

            const files = fs.readdirSync(musicDir);
            const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));
            
            const songs = mp3Files.map((file, index) => {
                const [artist, title] = file.replace(/\.mp3$/i, '').split(' - ');
                
                return {
                    id: `song_${index}`,
                    filename: file,
                    title: title || artist || file.replace(/\.mp3$/i, ''),
                    artist: artist || 'Unbekannt',
                    path: path.join(musicDir, file),
                    size: fs.statSync(path.join(musicDir, file)).size
                };
            });

            res.json({
                success: true,
                songs,
                count: songs.length,
                guildId
            });

        } catch (error) {
            console.error('❌ Simple Music Songs API Error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // POST: Erstelle Simple Music Panel
    app.post('/api/simple-music/panel/:guildId/create', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { channelId, page = 0 } = req.body;

            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({
                    success: false,
                    error: 'Guild nicht gefunden'
                });
            }

            const channel = guild.channels.cache.get(channelId);
            if (!channel) {
                return res.status(404).json({
                    success: false,
                    error: 'Channel nicht gefunden'
                });
            }

            // Simple Music Panel erstellen
            const { SimpleMusicPanel } = require('./simple-music-panel');
            const simpleMusicPanel = new SimpleMusicPanel();
            
            let panelData;
            try {
                // Versuche Panel mit Live-Status zu erstellen
                panelData = await simpleMusicPanel.createSimplePanel(page, guildId);
            } catch (statusError) {
                console.warn('⚠️ Fallback: Erstelle Panel ohne Live-Status:', statusError.message);
                // Fallback: Panel ohne Guild-ID (statische Werte)
                panelData = await simpleMusicPanel.createSimplePanel(page, null);
            }

            // Panel senden
            const message = await channel.send(panelData);

            res.json({
                success: true,
                message: 'Simple Music Panel erfolgreich erstellt!',
                messageId: message.id,
                channelId: channel.id,
                guildId
            });

        } catch (error) {
            console.error('❌ Simple Music Panel Create API Error:', error);
            console.error('Error Stack:', error.stack);
            res.status(500).json({
                success: false,
                error: error.message,
                details: error.stack?.split('\n')[0] || 'Unbekannter Fehler'
            });
        }
    });

    // POST: Lösche alte Panel Messages
    app.post('/api/simple-music/panel/:guildId/clear', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { channelId, limit = 10 } = req.body;

            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({
                    success: false,
                    error: 'Guild nicht gefunden'
                });
            }

            const channel = guild.channels.cache.get(channelId);
            if (!channel) {
                return res.status(404).json({
                    success: false,
                    error: 'Channel nicht gefunden'
                });
            }

            // Hole die letzten Messages
            const messages = await channel.messages.fetch({ limit });
            const botMessages = messages.filter(msg => msg.author.id === client.user.id);

            let deletedCount = 0;
            for (const [messageId, message] of botMessages) {
                try {
                    await message.delete();
                    deletedCount++;
                } catch (deleteError) {
                    console.warn(`⚠️ Konnte Message ${messageId} nicht löschen:`, deleteError.message);
                }
            }

            res.json({
                success: true,
                message: `${deletedCount} Bot-Messages gelöscht`,
                deletedCount,
                channelId: channel.id,
                guildId
            });

        } catch (error) {
            console.error('❌ Simple Music Panel Clear API Error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // GET: Simple Music Panel Status
    app.get('/api/simple-music/status/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;

            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({
                    success: false,
                    error: 'Guild nicht gefunden'
                });
            }

            // Prüfe Voice-Connection Status
            const voiceConnection = guild.voiceConnection || null;
            
            // Musik-Ordner Status
            const musicDir = path.join(__dirname, 'music');
            const musicExists = fs.existsSync(musicDir);
            let songCount = 0;
            
            if (musicExists) {
                const files = fs.readdirSync(musicDir);
                songCount = files.filter(file => file.toLowerCase().endsWith('.mp3')).length;
            }

            res.json({
                success: true,
                status: {
                    guildId,
                    guildName: guild.name,
                    voiceConnected: !!voiceConnection,
                    voiceChannelId: voiceConnection?.joinConfig?.channelId || null,
                    musicDirectoryExists: musicExists,
                    songCount,
                    botConnected: true
                }
            });

        } catch (error) {
            console.error('❌ Simple Music Status API Error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // POST: Test Simple Music Button
    app.post('/api/simple-music/test/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { channelId, songId } = req.body;

            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({
                    success: false,
                    error: 'Guild nicht gefunden'
                });
            }

            const channel = guild.channels.cache.get(channelId);
            if (!channel) {
                return res.status(404).json({
                    success: false,
                    error: 'Channel nicht gefunden'
                });
            }

            // Test-Message senden
            await channel.send({
                content: `🧪 **Simple Music Panel Test**\n\n✅ API funktioniert!\n🎵 Song-ID: \`${songId || 'test'}\`\n⏰ Zeit: ${new Date().toLocaleTimeString()}`
            });

            res.json({
                success: true,
                message: 'Test-Message erfolgreich gesendet!',
                channelId: channel.id,
                guildId
            });

        } catch (error) {
            console.error('❌ Simple Music Test API Error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // POST: Spiele Song ab (Simple Music Panel Play)
    app.post('/api/simple-music/play', async (req, res) => {
        try {
            const { guildId, songName } = req.body;

            if (!guildId || !songName) {
                return res.status(400).json({
                    success: false,
                    error: 'guildId und songName sind erforderlich'
                });
            }

            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({
                    success: false,
                    error: 'Guild nicht gefunden'
                });
            }

            // Finde Song-Datei
            const musicDir = path.join(__dirname, 'music');
            const songPath = path.join(musicDir, songName);
            
            if (!fs.existsSync(songPath)) {
                return res.status(404).json({
                    success: false,
                    error: `Song "${songName}" nicht gefunden`
                });
            }

            // Verwende das bestehende Musik-System zur Wiedergabe
            const musicApi = require('./music-api');
            if (musicApi && typeof musicApi.playLocalSong === 'function') {
                // Erzeuge Song-ID im Format, das das Musik-System erwartet
                const songs = musicApi.getAvailableSongs();
                const matchingSong = songs.find(song => song.filename === songName);
                
                if (matchingSong) {
                    const result = await musicApi.playLocalSong(guildId, matchingSong.id);
                    
                    res.json({
                        success: true,
                        message: `Song "${songName}" wird abgespielt`,
                        songName,
                        songId: matchingSong.id,
                        guildId
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: `Song "${songName}" nicht im Musik-System gefunden`
                    });
                }
            } else {
                res.status(501).json({
                    success: false,
                    error: 'Musik-System nicht verfügbar'
                });
            }

        } catch (error) {
            console.error('❌ Simple Music Play API Error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // POST: Stoppe Musik (Simple Music Panel Stop)
    app.post('/api/simple-music/stop', async (req, res) => {
        try {
            const { guildId } = req.body;

            if (!guildId) {
                return res.status(400).json({
                    success: false,
                    error: 'guildId ist erforderlich'
                });
            }

            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({
                    success: false,
                    error: 'Guild nicht gefunden'
                });
            }

            // Verwende das bestehende Musik-System zum Stoppen
            const musicApi = require('./music-api');
            if (musicApi && typeof musicApi.stopMusic === 'function') {
                await musicApi.stopMusic(guildId);
                
                res.json({
                    success: true,
                    message: 'Musik gestoppt',
                    guildId
                });
            } else {
                res.status(501).json({
                    success: false,
                    error: 'Musik-System nicht verfügbar'
                });
            }

        } catch (error) {
            console.error('❌ Simple Music Stop API Error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // GET: Simple Music Panel Info
    app.get('/api/simple-music/info', (req, res) => {
        try {
            const musicDir = path.join(__dirname, 'music');
            const musicExists = fs.existsSync(musicDir);
            
            let songs = [];
            if (musicExists) {
                const files = fs.readdirSync(musicDir);
                songs = files.filter(file => file.toLowerCase().endsWith('.mp3'));
            }

            res.json({
                success: true,
                info: {
                    version: '1.0.0',
                    system: 'Simple Music Panel',
                    musicDirectory: musicDir,
                    musicDirectoryExists: musicExists,
                    totalSongs: songs.length,
                    songs: songs.slice(0, 10), // Nur die ersten 10 für Preview
                    features: [
                        'Einfache Button-Interface',
                        'Slash Commands',
                        'MP3 Playback',
                        'Pagination',
                        'Dashboard Integration'
                    ]
                }
            });

        } catch (error) {
            console.error('❌ Simple Music Info API Error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    console.log('✅ Simple Music Panel API registriert!');
}

module.exports = { registerSimpleMusicPanelAPI }; 