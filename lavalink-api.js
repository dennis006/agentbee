// 🎵 LAVALINK API ROUTEN
// Dashboard-Integration für das Lavalink-Musik-System

const express = require('express');
const router = express.Router();

// 🔍 Musik suchen und abspielen
function registerLavalinkAPI(app, client) {
    console.log('🎵 Registriere Lavalink-API...');
    
    // 🔍 Song suchen
    app.post('/api/music/search', async (req, res) => {
        try {
            const { query, guildId } = req.body;
            
            if (!query || !guildId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Query und Guild ID erforderlich' 
                });
            }
            
            const lavalinkSystem = require('./lavalink-music-system');
            
            // Manager prüfen
            if (!global.lavalinkManager) {
                return res.status(503).json({ 
                    success: false, 
                    error: 'Lavalink-Manager nicht verfügbar' 
                });
            }
            
            // Suche ausführen
            const searchResult = await global.lavalinkManager.search(query, null);
            
            if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Keine Suchergebnisse gefunden' 
                });
            }
            
            // Erste 10 Ergebnisse zurückgeben
            const tracks = searchResult.tracks.slice(0, 10).map(track => ({
                title: track.title,
                author: track.author,
                duration: track.duration,
                uri: track.uri,
                thumbnail: track.thumbnail,
                sourceName: track.sourceName
            }));
            
            res.json({
                success: true,
                tracks: tracks,
                count: tracks.length
            });
            
        } catch (error) {
            console.error('❌ Lavalink Suche Fehler:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Suchfehler: ' + error.message 
            });
        }
    });
    
    // ▶️ Song abspielen
    app.post('/api/music/play', async (req, res) => {
        try {
            const { query, guildId, voiceChannelId, textChannelId, requestedBy } = req.body;
            
            if (!query || !guildId || !voiceChannelId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Query, Guild ID und Voice Channel ID erforderlich' 
                });
            }
            
            const lavalinkSystem = require('./lavalink-music-system');
            
            // Song suchen und abspielen
            const result = await lavalinkSystem.searchAndPlay(
                query, 
                guildId, 
                voiceChannelId, 
                textChannelId || null, 
                requestedBy || 'Dashboard'
            );
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Song erfolgreich hinzugefügt',
                    track: {
                        title: result.track.title,
                        author: result.track.author,
                        duration: result.track.duration
                    },
                    queueLength: result.queueLength,
                    isPlaying: result.isPlaying
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.message || 'Fehler beim Abspielen'
                });
            }
            
        } catch (error) {
            console.error('❌ Lavalink Play Fehler:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Wiedergabe-Fehler: ' + error.message 
            });
        }
    });
    
    // ⏸️ Pausieren
    app.post('/api/music/pause/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            const lavalinkSystem = require('./lavalink-music-system');
            
            const success = lavalinkSystem.pausePlayback(guildId);
            
            res.json({
                success: success,
                message: success ? 'Wiedergabe pausiert' : 'Kein aktiver Player gefunden'
            });
            
        } catch (error) {
            console.error('❌ Lavalink Pause Fehler:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Pause-Fehler: ' + error.message 
            });
        }
    });
    
    // ▶️ Fortsetzen
    app.post('/api/music/resume/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            const lavalinkSystem = require('./lavalink-music-system');
            
            const success = lavalinkSystem.resumePlayback(guildId);
            
            res.json({
                success: success,
                message: success ? 'Wiedergabe fortgesetzt' : 'Kein pausierter Player gefunden'
            });
            
        } catch (error) {
            console.error('❌ Lavalink Resume Fehler:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Resume-Fehler: ' + error.message 
            });
        }
    });
    
    // ⏭️ Skip
    app.post('/api/music/skip/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            const lavalinkSystem = require('./lavalink-music-system');
            
            const success = lavalinkSystem.skipTrack(guildId);
            
            res.json({
                success: success,
                message: success ? 'Song übersprungen' : 'Kein aktiver Player gefunden'
            });
            
        } catch (error) {
            console.error('❌ Lavalink Skip Fehler:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Skip-Fehler: ' + error.message 
            });
        }
    });
    
    // ⏹️ Stoppen
    app.post('/api/music/stop/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            const lavalinkSystem = require('./lavalink-music-system');
            
            const success = lavalinkSystem.stopPlayback(guildId);
            
            res.json({
                success: success,
                message: success ? 'Wiedergabe gestoppt' : 'Kein aktiver Player gefunden'
            });
            
        } catch (error) {
            console.error('❌ Lavalink Stop Fehler:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Stop-Fehler: ' + error.message 
            });
        }
    });
    
    // 🔊 Lautstärke setzen
    app.post('/api/music/volume/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { volume } = req.body;
            
            if (volume === undefined || volume < 0 || volume > 100) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Lautstärke muss zwischen 0 und 100 liegen' 
                });
            }
            
            const lavalinkSystem = require('./lavalink-music-system');
            const newVolume = lavalinkSystem.setVolume(guildId, volume);
            
            if (newVolume !== null) {
                res.json({
                    success: true,
                    message: `Lautstärke auf ${newVolume}% gesetzt`,
                    volume: newVolume
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Kein aktiver Player gefunden'
                });
            }
            
        } catch (error) {
            console.error('❌ Lavalink Volume Fehler:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Volume-Fehler: ' + error.message 
            });
        }
    });
    
    // 📋 Queue-Status abrufen
    app.get('/api/music/queue/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            const lavalinkSystem = require('./lavalink-music-system');
            
            const queueData = lavalinkSystem.getQueueInfo(guildId);
            
            res.json({
                success: true,
                queue: {
                    currentSong: queueData.currentSong,
                    songs: queueData.songs,
                    volume: queueData.volume || 50,
                    repeat: queueData.repeat || 'off',
                    shuffle: queueData.shuffle || false
                }
            });
            
        } catch (error) {
            console.error('❌ Lavalink Queue Fehler:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Queue-Fehler: ' + error.message 
            });
        }
    });

    // ➕ Song zur Queue hinzufügen
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
            
            const lavalinkSystem = require('./lavalink-music-system');
            
            // Track suchen und hinzufügen
            const result = await lavalinkSystem.addToQueue(guildId, url, requestedBy || 'Dashboard');
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Song zur Queue hinzugefügt',
                    song: result.song
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error || 'Fehler beim Hinzufügen zur Queue'
                });
            }
            
        } catch (error) {
            console.error('❌ Lavalink Add Queue Fehler:', error);
            res.status(500).json({
                success: false,
                error: `Interner Fehler: ${error.message}`
            });
        }
    });

    // 🎛️ Player-Kontrollen
    app.post('/api/music/control/:guildId/:action', async (req, res) => {
        try {
            const { guildId, action } = req.params;
            const lavalinkSystem = require('./lavalink-music-system');
            
            let result = { success: false, message: 'Unbekannte Aktion' };
            
            switch (action) {
                case 'play':
                    result = lavalinkSystem.resumePlayback(guildId);
                    result = { success: result, message: result ? 'Wiedergabe gestartet' : 'Kein pausierter Player gefunden' };
                    break;
                case 'pause':
                    result = lavalinkSystem.pausePlayback(guildId);
                    result = { success: result, message: result ? 'Wiedergabe pausiert' : 'Kein aktiver Player gefunden' };
                    break;
                case 'skip':
                    result = lavalinkSystem.skipTrack(guildId);
                    result = { success: result, message: result ? 'Song übersprungen' : 'Kein aktiver Player gefunden' };
                    break;
                case 'clear':
                    result = lavalinkSystem.clearQueue(guildId);
                    result = { success: result, message: result ? 'Queue geleert' : 'Keine Queue gefunden' };
                    break;
                case 'shuffle':
                    result = lavalinkSystem.shuffleQueue(guildId);
                    result = { success: result, message: result ? 'Queue gemischt' : 'Keine Queue zum Mischen gefunden' };
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: `Unbekannte Aktion: ${action}`
                    });
            }
            
            res.json(result);
            
        } catch (error) {
            console.error(`❌ Lavalink Control (${req.params.action}) Fehler:`, error);
            res.status(500).json({
                success: false,
                error: `Control-Fehler: ${error.message}`
            });
        }
    });

    // 🎤 Voice-Channel beitreten
    app.post('/api/music/voice/:guildId/join', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { channelId } = req.body;
            
            if (!channelId) {
                return res.status(400).json({
                    success: false,
                    error: 'Voice Channel ID erforderlich'
                });
            }
            
            const lavalinkSystem = require('./lavalink-music-system');
            const result = await lavalinkSystem.joinVoiceChannel(guildId, channelId);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: result.message || 'Voice-Channel erfolgreich beigetreten'
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error || 'Fehler beim Beitreten des Voice-Channels'
                });
            }
            
        } catch (error) {
            console.error('❌ Lavalink Voice Join Fehler:', error);
            res.status(500).json({
                success: false,
                error: `Voice-Join Fehler: ${error.message}`
            });
        }
    });

    // 🚪 Voice-Channel verlassen
    app.post('/api/music/voice/:guildId/leave', async (req, res) => {
        try {
            const { guildId } = req.params;
            const lavalinkSystem = require('./lavalink-music-system');
            
            const result = lavalinkSystem.leaveVoiceChannel(guildId);
            
            res.json({
                success: result,
                message: result ? 'Voice-Channel verlassen' : 'Kein Voice-Channel gefunden'
            });
            
        } catch (error) {
            console.error('❌ Lavalink Voice Leave Fehler:', error);
            res.status(500).json({
                success: false,
                error: `Voice-Leave Fehler: ${error.message}`
            });
        }
    });

    // ⚙️ Musik-Einstellungen laden
    app.get('/api/music/settings', (req, res) => {
        try {
            // Lade Settings aus music-settings.json
            const fs = require('fs');
            const path = require('path');
            
            let settings = {};
            try {
                const settingsPath = path.join(__dirname, 'music-settings.json');
                if (fs.existsSync(settingsPath)) {
                    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                }
            } catch (error) {
                console.log('⚠️ Music-Settings laden fehlgeschlagen, verwende Defaults');
            }
            
            res.json({
                success: true,
                settings: settings
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // 💾 Musik-Einstellungen speichern
    app.post('/api/music/settings', (req, res) => {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const settingsPath = path.join(__dirname, 'music-settings.json');
            fs.writeFileSync(settingsPath, JSON.stringify(req.body, null, 2));
            
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

    // 📊 Request Tracking (kompatibel mit altem System)
    app.get('/api/music/request-tracking', (req, res) => {
        try {
            // Für Lavalink verwenden wir ein einfaches Tracking
            res.json({
                success: true,
                trackingData: [],
                rateLimit: {
                    enabled: false,
                    maxRequests: 5,
                    timeWindow: 60,
                    timeUnit: 'minutes'
                },
                cooldownMinutes: 1
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    console.log('✅ Lavalink-API Routen registriert');
            
            const queueInfo = lavalinkSystem.getQueueInfo(guildId);
            
            if (queueInfo) {
                res.json({
                    success: true,
                    current: queueInfo.current ? {
                        title: queueInfo.current.title,
                        author: queueInfo.current.author,
                        duration: queueInfo.current.duration,
                        position: queueInfo.position
                    } : null,
                    queue: queueInfo.queue.map(track => ({
                        title: track.title,
                        author: track.author,
                        duration: track.duration
                    })),
                    isPlaying: queueInfo.isPlaying,
                    isPaused: queueInfo.isPaused,
                    volume: queueInfo.volume,
                    connected: queueInfo.connected
                });
            } else {
                res.json({
                    success: true,
                    current: null,
                    queue: [],
                    isPlaying: false,
                    isPaused: false,
                    volume: 80,
                    connected: false
                });
            }
            
        } catch (error) {
            console.error('❌ Lavalink Queue Fehler:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Queue-Fehler: ' + error.message 
            });
        }
    });
    
    // 📊 Lavalink-Statistiken
    app.get('/api/music/stats', async (req, res) => {
        try {
            const lavalinkSystem = require('./lavalink-music-system');
            
            const stats = lavalinkSystem.getLavalinkStats();
            const health = await lavalinkSystem.healthCheck();
            
            res.json({
                success: true,
                stats: stats,
                health: health,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Lavalink Stats Fehler:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Stats-Fehler: ' + error.message 
            });
        }
    });
    
    // 🔧 Health Check für Lavalink
    app.get('/api/music/health', async (req, res) => {
        try {
            const lavalinkSystem = require('./lavalink-music-system');
            
            const health = await lavalinkSystem.healthCheck();
            
            if (health.healthy) {
                res.json({
                    success: true,
                    healthy: true,
                    message: 'Lavalink-System ist gesund',
                    stats: health.stats,
                    bestNode: health.bestNode ? health.bestNode.identifier : null
                });
            } else {
                res.status(503).json({
                    success: false,
                    healthy: false,
                    message: 'Lavalink-System ist nicht verfügbar',
                    reason: health.reason
                });
            }
            
        } catch (error) {
            console.error('❌ Lavalink Health Fehler:', error);
            res.status(500).json({ 
                success: false, 
                healthy: false,
                error: 'Health-Check-Fehler: ' + error.message 
            });
        }
    });
    
    // 🌐 Verfügbare Quellen abrufen
    app.get('/api/music/sources', (req, res) => {
        try {
            const sources = [
                {
                    name: 'YouTube',
                    identifier: 'ytsearch',
                    description: 'YouTube-Suche',
                    icon: '📺',
                    enabled: true
                },
                {
                    name: 'YouTube Music',
                    identifier: 'ytmsearch',
                    description: 'YouTube Music-Suche',
                    icon: '🎵',
                    enabled: true
                },
                {
                    name: 'SoundCloud',
                    identifier: 'scsearch',
                    description: 'SoundCloud-Suche',
                    icon: '🎧',
                    enabled: true
                },
                {
                    name: 'Spotify',
                    identifier: 'spsearch',
                    description: 'Spotify-Suche (falls verfügbar)',
                    icon: '🎶',
                    enabled: false // Abhängig von Lavalink-Node-Konfiguration
                }
            ];
            
            res.json({
                success: true,
                sources: sources,
                count: sources.length
            });
            
        } catch (error) {
            console.error('❌ Lavalink Sources Fehler:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Sources-Fehler: ' + error.message 
            });
        }
    });
    
    // 📻 Radio-Funktionen (verwendet music-settings.json)
    app.get('/api/music/radio/stations', (req, res) => {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const settingsPath = path.join(__dirname, 'music-settings.json');
            let settings = {};
            
            if (fs.existsSync(settingsPath)) {
                settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            }
            
            res.json({
                success: true,
                stations: settings.radio?.stations || []
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // 📻 Radio abspielen
    app.post('/api/music/radio/:guildId/play', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { stationId } = req.body;
            
            if (!stationId) {
                return res.status(400).json({
                    success: false,
                    error: 'Station ID erforderlich'
                });
            }
            
            // Lade Stations aus Settings
            const fs = require('fs');
            const path = require('path');
            const settingsPath = path.join(__dirname, 'music-settings.json');
            
            let settings = {};
            if (fs.existsSync(settingsPath)) {
                settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            }
            
            const station = settings.radio?.stations?.find(s => s.id === stationId);
            if (!station) {
                return res.status(404).json({
                    success: false,
                    error: 'Radio-Station nicht gefunden'
                });
            }
            
            const lavalinkSystem = require('./lavalink-music-system');
            
            // Spiele Radio-Stream ab
            const result = await lavalinkSystem.addToQueue(guildId, station.url, `Radio: ${station.name}`);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: `📻 ${station.name} wird abgespielt`,
                    station: station
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error || 'Fehler beim Starten des Radio-Senders'
                });
            }
            
        } catch (error) {
            console.error('❌ Lavalink Radio Play Fehler:', error);
            res.status(500).json({
                success: false,
                error: `Radio-Play Fehler: ${error.message}`
            });
        }
    });

    // 📻 Radio stoppen
    app.post('/api/music/radio/:guildId/stop', async (req, res) => {
        try {
            const { guildId } = req.params;
            const lavalinkSystem = require('./lavalink-music-system');
            
            const result = lavalinkSystem.stopPlayback(guildId);
            
            res.json({
                success: result,
                message: result ? '📻 Radio gestoppt' : 'Kein aktiver Radio-Stream gefunden'
            });
            
        } catch (error) {
            console.error('❌ Lavalink Radio Stop Fehler:', error);
            res.status(500).json({
                success: false,
                error: `Radio-Stop Fehler: ${error.message}`
            });
        }
    });

    // 📻 Radio-Status
    app.get('/api/music/radio/:guildId/status', (req, res) => {
        try {
            const { guildId } = req.params;
            const lavalinkSystem = require('./lavalink-music-system');
            
            const queueInfo = lavalinkSystem.getQueueInfo(guildId);
            
            // Prüfe ob ein Radio-Stream läuft
            const isRadio = queueInfo.currentSong && 
                           (queueInfo.currentSong.requestedBy?.startsWith('Radio:') || 
                            queueInfo.currentSong.url?.includes('stream.') ||
                            queueInfo.currentSong.url?.includes('radio'));
            
            let currentStation = null;
            if (isRadio && queueInfo.currentSong) {
                // Vereinfachte Station-Info
                currentStation = {
                    name: queueInfo.currentSong.requestedBy?.replace('Radio: ', '') || queueInfo.currentSong.title,
                    url: queueInfo.currentSong.url,
                    description: `Live Stream - ${queueInfo.currentSong.author}`
                };
            }
            
            res.json({
                success: true,
                isPlaying: isRadio && queueInfo.isPlaying,
                currentStation: currentStation
            });
            
        } catch (error) {
            console.error('❌ Lavalink Radio Status Fehler:', error);
            res.status(500).json({
                success: false,
                error: `Radio-Status Fehler: ${error.message}`
            });
        }
    });

    // 📻 Radio-Station hinzufügen
    app.post('/api/music/radio/stations', (req, res) => {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const newStation = {
                id: `custom_${Date.now()}`,
                name: req.body.name || 'Unbekannte Station',
                url: req.body.url,
                genre: req.body.genre || 'Unbekannt',
                country: req.body.country || 'Unbekannt',
                description: req.body.description || '',
                logo: req.body.logo || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM2NjY2NjYiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5O7PC90ZXh0Pgo8L3N2Zz4K'
            };
            
            if (!newStation.url) {
                return res.status(400).json({
                    success: false,
                    error: 'Stream-URL ist erforderlich'
                });
            }
            
            const settingsPath = path.join(__dirname, 'music-settings.json');
            let settings = {};
            
            if (fs.existsSync(settingsPath)) {
                settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            }
            
            if (!settings.radio) {
                settings.radio = { stations: [] };
            }
            
            settings.radio.stations.push(newStation);
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
            
            res.json({
                success: true,
                message: 'Radio-Station hinzugefügt',
                station: newStation
            });
            
        } catch (error) {
            console.error('❌ Lavalink Add Radio Station Fehler:', error);
            res.status(500).json({
                success: false,
                error: `Station hinzufügen Fehler: ${error.message}`
            });
        }
    });

    // 📻 Radio-Station entfernen
    app.delete('/api/music/radio/stations/:stationId', (req, res) => {
        try {
            const { stationId } = req.params;
            const fs = require('fs');
            const path = require('path');
            
            const settingsPath = path.join(__dirname, 'music-settings.json');
            let settings = {};
            
            if (fs.existsSync(settingsPath)) {
                settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            }
            
            if (!settings.radio?.stations) {
                return res.status(404).json({
                    success: false,
                    error: 'Keine Radio-Stationen gefunden'
                });
            }
            
            const originalLength = settings.radio.stations.length;
            settings.radio.stations = settings.radio.stations.filter(s => s.id !== stationId);
            
            if (settings.radio.stations.length === originalLength) {
                return res.status(404).json({
                    success: false,
                    error: 'Radio-Station nicht gefunden'
                });
            }
            
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
            
            res.json({
                success: true,
                message: 'Radio-Station entfernt'
            });
            
        } catch (error) {
            console.error('❌ Lavalink Remove Radio Station Fehler:', error);
            res.status(500).json({
                success: false,
                error: `Station entfernen Fehler: ${error.message}`
            });
        }
    });

    console.log('✅ Lavalink-API Routen registriert (inkl. Radio-Support)');
}

module.exports = {
    registerLavalinkAPI
}; 