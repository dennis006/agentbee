const express = require('express');
const ValorantCrosshairSystem = require('./valorant-crosshair-system');

/**
 * Setup Valorant Crosshair API Routes für Dashboard
 */
function setupValorantCrosshairAPI(app, client) {
    const crosshairSystem = new ValorantCrosshairSystem();

    // Send crosshair panel to Discord channel
    app.post('/api/valorant/crosshair/send-panel', async (req, res) => {
        try {
            const { channel } = req.body;
            
            if (!channel) {
                return res.status(400).json({
                    success: false,
                    error: 'Channel name ist erforderlich'
                });
            }

            if (!client || !client.isReady()) {
                return res.status(503).json({
                    success: false,
                    error: 'Discord Bot ist nicht bereit'
                });
            }

            // Finde Channel in allen Guilds
            let targetChannel = null;
            
            for (const guild of client.guilds.cache.values()) {
                const foundChannel = guild.channels.cache.find(ch => 
                    ch.name === channel || ch.name === channel.replace('#', '')
                );
                
                if (foundChannel && foundChannel.type === 0) { // Text channel
                    targetChannel = foundChannel;
                    break;
                }
            }

            if (!targetChannel) {
                return res.status(404).json({
                    success: false,
                    error: `Channel "${channel}" nicht gefunden`
                });
            }

            // Sende Panel
            const message = await crosshairSystem.sendCrosshairPanel(targetChannel);
            
            res.json({
                success: true,
                message: 'Crosshair-Panel erfolgreich gesendet',
                data: {
                    channelName: targetChannel.name,
                    channelId: targetChannel.id,
                    messageId: message.id
                }
            });

        } catch (error) {
            console.error('Fehler beim Senden des Crosshair-Panels:', error);
            res.status(500).json({
                success: false,
                error: 'Interner Serverfehler beim Senden des Panels'
            });
        }
    });

    // Get crosshair system stats
    app.get('/api/valorant/crosshair/stats', async (req, res) => {
        try {
            // Mock stats - in production würde das aus einer Datenbank kommen
            const stats = {
                totalGenerated: 1247,
                todayGenerated: 23,
                uniqueUsers: 87,
                popularCodes: [
                    {
                        code: '0;p=0;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0',
                        count: 45,
                        lastUsed: new Date().toISOString()
                    },
                    {
                        code: '0;p=1;o=1;f=0;0t=4;0l=2;0o=2;0a=1;0f=0;1b=0',
                        count: 32,
                        lastUsed: new Date().toISOString()
                    }
                ],
                apiStatus: 'online',
                remainingRequests: 67,
                nextReset: new Date(Date.now() + 3600000).toISOString()
            };

            res.json({
                success: true,
                stats: stats
            });

        } catch (error) {
            console.error('Fehler beim Laden der Crosshair-Stats:', error);
            res.status(500).json({
                success: false,
                error: 'Fehler beim Laden der Statistiken'
            });
        }
    });

    // Generate crosshair preview (for dashboard)
    app.post('/api/valorant/crosshair/generate', async (req, res) => {
        try {
            const { code } = req.body;
            
            if (!code) {
                return res.status(400).json({
                    success: false,
                    error: 'Crosshair-Code ist erforderlich'
                });
            }

            const result = await crosshairSystem.generateCrosshair(code);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error
                });
            }

            // Return image as response
            res.set({
                'Content-Type': result.contentType,
                'Content-Length': result.imageBuffer.length,
                'Cache-Control': 'public, max-age=3600'
            });

            res.send(result.imageBuffer);

        } catch (error) {
            console.error('Fehler beim Generieren des Crosshairs:', error);
            res.status(500).json({
                success: false,
                error: 'Fehler beim Generieren des Crosshairs'
            });
        }
    });

    // Get crosshair history
    app.get('/api/valorant/crosshair/history', async (req, res) => {
        try {
            // Mock history - in production würde das aus einer Datenbank kommen
            const history = [
                {
                    id: '1',
                    code: '0;p=0;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0',
                    user: 'TestUser#1234',
                    timestamp: new Date().toISOString(),
                    success: true
                },
                {
                    id: '2',
                    code: '0;p=1;o=1;f=0;0t=4;0l=2;0o=2;0a=1;0f=0;1b=0',
                    user: 'ProPlayer#5678',
                    timestamp: new Date(Date.now() - 300000).toISOString(),
                    success: true
                }
            ];

            res.json({
                success: true,
                history: history
            });

        } catch (error) {
            console.error('Fehler beim Laden des Crosshair-Verlaufs:', error);
            res.status(500).json({
                success: false,
                error: 'Fehler beim Laden des Verlaufs'
            });
        }
    });

    // Get/Set crosshair settings
    app.get('/api/valorant/crosshair/settings', async (req, res) => {
        try {
            // Mock settings - in production würde das aus einer Datenbank kommen
            const settings = {
                enabled: true,
                rateLimitWarning: true,
                defaultChannel: 'general',
                saveHistory: true,
                maxHistoryEntries: 100
            };

            res.json({
                success: true,
                settings: settings
            });

        } catch (error) {
            console.error('Fehler beim Laden der Crosshair-Einstellungen:', error);
            res.status(500).json({
                success: false,
                error: 'Fehler beim Laden der Einstellungen'
            });
        }
    });

    app.post('/api/valorant/crosshair/settings', async (req, res) => {
        try {
            const settings = req.body;
            
            // In production würde das in einer Datenbank gespeichert
            console.log('Crosshair-Einstellungen gespeichert:', settings);

            res.json({
                success: true,
                message: 'Einstellungen erfolgreich gespeichert'
            });

        } catch (error) {
            console.error('Fehler beim Speichern der Crosshair-Einstellungen:', error);
            res.status(500).json({
                success: false,
                error: 'Fehler beim Speichern der Einstellungen'
            });
        }
    });

    // Generate crosshair from custom config
    app.post('/api/valorant/crosshair/create', (req, res) => {
        try {
            const { config } = req.body;
            
            if (!config) {
                return res.status(400).json({ error: 'Crosshair-Konfiguration erforderlich' });
            }

            // Build crosshair code from config
            const code = `0;p=${config.primaryColor};o=${config.outlineOpacity ? 1 : 0};f=${config.fadeWithFiring ? 1 : 0};0t=${config.centerDot ? 1 : 0};0l=${config.centerDotThickness};0o=${config.centerDotOpacity || 1};0a=1;0f=0;1b=${config.innerLines ? 1 : 0};1s=${config.innerLineOpacity || 1};1l=${config.innerLineLength};1t=${config.innerLineThickness};1o=${config.innerLineOffset};1a=1;1m=0;1f=0;2b=${config.outerLines ? 1 : 0};2s=${config.outerLineOpacity || 1};2l=${config.outerLineLength};2t=${config.outerLineThickness};2o=${config.outerLineOffset};2a=1;2m=0;2f=0`;

            res.json({ 
                success: true,
                code: code,
                message: 'Crosshair-Code erfolgreich erstellt'
            });

        } catch (error) {
            console.error('Fehler beim Erstellen des Crosshair-Codes:', error);
            res.status(500).json({ error: 'Interner Server-Fehler beim Erstellen' });
        }
    });

    console.log('✅ Valorant Crosshair API-Routen registriert');
}

module.exports = { setupValorantCrosshairAPI }; 