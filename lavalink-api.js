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
    
    console.log('✅ Lavalink-API Routen registriert');
}

module.exports = {
    registerLavalinkAPI
}; 