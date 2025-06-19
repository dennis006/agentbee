const express = require('express');
const TwitchSystem = require('./twitch-system');

// API-Routen für das Twitch-System
function setupTwitchAPI(app, client) {
    let twitchSystem = null;

    // Twitch-System initialisieren wenn Client bereit ist
    if (client && client.isReady()) {
        twitchSystem = new TwitchSystem(client);
    }

    // ================== TWITCH LIVE NOTIFICATIONS API ==================

    // Twitch-Einstellungen abrufen
    app.get('/api/twitch/settings', (req, res) => {
        try {
            if (!twitchSystem) {
                return res.json({
                    settings: require('./twitch-system').prototype.getDefaultSettings(),
                    isSystemReady: false
                });
            }

            res.json({
                settings: twitchSystem.settings,
                isSystemReady: true,
                success: true
            });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Twitch-Einstellungen:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Twitch-Einstellungen' });
        }
    });

    // Twitch-Einstellungen speichern
    app.post('/api/twitch/settings', (req, res) => {
        try {
            if (!twitchSystem) {
                return res.status(503).json({ error: 'Twitch-System nicht initialisiert' });
            }

            const success = twitchSystem.updateSettings(req.body);
            
            if (success) {
                console.log('🎮 Twitch-Einstellungen aktualisiert');
                res.json({ 
                    success: true, 
                    message: 'Twitch-Einstellungen gespeichert',
                    settings: twitchSystem.settings
                });
            } else {
                res.status(500).json({ error: 'Fehler beim Speichern der Einstellungen' });
            }
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Twitch-Einstellungen:', error);
            res.status(500).json({ error: 'Fehler beim Speichern der Twitch-Einstellungen' });
        }
    });

    // Streamer-Liste abrufen
    app.get('/api/twitch/streamers', (req, res) => {
        try {
            if (!twitchSystem) {
                return res.json({ streamers: [], isSystemReady: false });
            }

            res.json({
                streamers: twitchSystem.streamers,
                isSystemReady: true,
                success: true
            });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Streamer:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Streamer' });
        }
    });

    // Streamer hinzufügen
    app.post('/api/twitch/streamers', (req, res) => {
        try {
            if (!twitchSystem) {
                return res.status(503).json({ error: 'Twitch-System nicht initialisiert' });
            }

            const { username, displayName, customMessage, offlineNotifications } = req.body;

            if (!username) {
                return res.status(400).json({ error: 'Username ist erforderlich' });
            }

            // Prüfen ob Streamer bereits existiert
            const existingStreamer = twitchSystem.streamers.find(s => 
                s.username.toLowerCase() === username.toLowerCase()
            );

            if (existingStreamer) {
                return res.status(400).json({ error: 'Streamer bereits vorhanden' });
            }

            const streamer = twitchSystem.addStreamer({
                username,
                displayName,
                customMessage,
                offlineNotifications
            });

            console.log(`🎮 Streamer hinzugefügt: ${username}`);
            res.json({ 
                success: true, 
                message: `Streamer ${username} hinzugefügt`,
                streamer
            });
        } catch (error) {
            console.error('❌ Fehler beim Hinzufügen des Streamers:', error);
            res.status(500).json({ error: 'Fehler beim Hinzufügen des Streamers' });
        }
    });

    // Streamer aktualisieren
    app.put('/api/twitch/streamers/:id', (req, res) => {
        try {
            if (!twitchSystem) {
                return res.status(503).json({ error: 'Twitch-System nicht initialisiert' });
            }

            const { id } = req.params;
            const updates = req.body;

            const updatedStreamer = twitchSystem.updateStreamer(id, updates);

            if (updatedStreamer) {
                console.log(`🎮 Streamer aktualisiert: ${updatedStreamer.username}`);
                res.json({ 
                    success: true, 
                    message: 'Streamer aktualisiert',
                    streamer: updatedStreamer
                });
            } else {
                res.status(404).json({ error: 'Streamer nicht gefunden' });
            }
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren des Streamers:', error);
            res.status(500).json({ error: 'Fehler beim Aktualisieren des Streamers' });
        }
    });

    // Streamer entfernen
    app.delete('/api/twitch/streamers/:id', (req, res) => {
        try {
            if (!twitchSystem) {
                return res.status(503).json({ error: 'Twitch-System nicht initialisiert' });
            }

            const { id } = req.params;
            const success = twitchSystem.removeStreamer(id);

            if (success) {
                console.log(`🎮 Streamer entfernt: ${id}`);
                res.json({ 
                    success: true, 
                    message: 'Streamer entfernt'
                });
            } else {
                res.status(404).json({ error: 'Streamer nicht gefunden' });
            }
        } catch (error) {
            console.error('❌ Fehler beim Entfernen des Streamers:', error);
            res.status(500).json({ error: 'Fehler beim Entfernen des Streamers' });
        }
    });

    // Twitch-System ein/ausschalten
    app.post('/api/twitch/toggle', (req, res) => {
        try {
            if (!twitchSystem) {
                return res.status(503).json({ error: 'Twitch-System nicht initialisiert' });
            }

            const currentStatus = twitchSystem.settings.enabled;
            const success = twitchSystem.updateSettings({ enabled: !currentStatus });
            
            const newStatus = !currentStatus;
            console.log(`🎮 Twitch-System ${newStatus ? 'aktiviert' : 'deaktiviert'}`);
            
            res.json({ 
                success: true, 
                enabled: newStatus,
                message: `Twitch-System ${newStatus ? 'aktiviert' : 'deaktiviert'}`
            });
        } catch (error) {
            console.error('❌ Fehler beim Umschalten des Twitch-Systems:', error);
            res.status(500).json({ error: 'Fehler beim Umschalten des Twitch-Systems' });
        }
    });

    // Streams manuell prüfen
    app.post('/api/twitch/check', async (req, res) => {
        try {
            if (!twitchSystem) {
                return res.status(503).json({ error: 'Twitch-System nicht initialisiert' });
            }

            if (!twitchSystem.settings.enabled) {
                return res.status(400).json({ error: 'Twitch-System ist deaktiviert' });
            }

            await twitchSystem.checkStreams();
            
            console.log('🎮 Manuelle Stream-Prüfung durchgeführt');
            res.json({ 
                success: true, 
                message: 'Stream-Prüfung abgeschlossen'
            });
        } catch (error) {
            console.error('❌ Fehler bei der manuellen Stream-Prüfung:', error);
            res.status(500).json({ error: 'Fehler bei der Stream-Prüfung' });
        }
    });

    // Test-Benachrichtigung senden
    app.post('/api/twitch/test/:streamerId', async (req, res) => {
        try {
            if (!twitchSystem) {
                return res.status(503).json({ error: 'Twitch-System nicht initialisiert' });
            }

            const { streamerId } = req.params;
            const result = await twitchSystem.testNotification(streamerId);

            if (result.error) {
                res.status(400).json({ error: result.error });
            } else {
                console.log(`🎮 Test-Benachrichtigung gesendet für Streamer ${streamerId}`);
                res.json(result);
            }
        } catch (error) {
            console.error('❌ Fehler beim Senden der Test-Benachrichtigung:', error);
            res.status(500).json({ error: 'Fehler beim Senden der Test-Benachrichtigung' });
        }
    });

    // Statistiken abrufen
    app.get('/api/twitch/stats', (req, res) => {
        try {
            if (!twitchSystem) {
                return res.json({
                    stats: {
                        totalStreamers: 0,
                        activeStreamers: 0,
                        totalNotifications: 0,
                        currentlyLive: 0,
                        systemEnabled: false,
                        lastCheck: null
                    },
                    isSystemReady: false
                });
            }

            const stats = twitchSystem.getStats();
            res.json({
                stats,
                isSystemReady: true,
                success: true
            });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Statistiken:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Statistiken' });
        }
    });

    // Live-Daten abrufen (für Dashboard)
    app.get('/api/twitch/live', (req, res) => {
        try {
            if (!twitchSystem) {
                return res.json({ liveData: {}, isSystemReady: false });
            }

            res.json({
                liveData: twitchSystem.liveData,
                isSystemReady: true,
                success: true
            });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Live-Daten:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Live-Daten' });
        }
    });

    // Verfügbare Rollen für Mentions abrufen
    app.get('/api/twitch/roles', (req, res) => {
        try {
            if (client && client.isReady()) {
                const roles = [];
                
                // Sammle Rollen aus allen Servern
                client.guilds.cache.forEach(guild => {
                    guild.roles.cache.forEach(role => {
                        if (!role.managed && role.name !== '@everyone') {
                            roles.push({
                                id: role.id,
                                name: role.name,
                                color: role.hexColor,
                                guildId: guild.id,
                                guildName: guild.name
                            });
                        }
                    });
                });

                res.json({ roles, success: true });
            } else {
                res.json({ roles: [], success: true });
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Rollen:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Rollen' });
        }
    });

    // Verfügbare Channels abrufen
    app.get('/api/twitch/channels', (req, res) => {
        try {
            if (client && client.isReady()) {
                const channels = [];
                
                // Sammle Text-Channels aus allen Servern
                client.guilds.cache.forEach(guild => {
                    guild.channels.cache.forEach(channel => {
                        if (channel.type === 0) { // Text Channel
                            channels.push({
                                id: channel.id,
                                name: channel.name,
                                guildId: guild.id,
                                guildName: guild.name
                            });
                        }
                    });
                });

                res.json({ channels, success: true });
            } else {
                res.json({ channels: [], success: true });
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Channels:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Channels' });
        }
    });

    // ================== END TWITCH API ==================

    // Twitch-System initialisieren wenn Client verfügbar wird
    return {
        initializeTwitchSystem: () => {
            if (client && client.isReady() && !twitchSystem) {
                twitchSystem = new TwitchSystem(client);
                console.log('🎮 Twitch-System über API initialisiert');
            }
        },
        getTwitchSystem: () => twitchSystem
    };
}

module.exports = setupTwitchAPI; 