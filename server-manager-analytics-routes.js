const express = require('express');
const router = express.Router();

// Server Manager Analytics Routes
function setupServerManagerAnalyticsRoutes(app, initialServerManagerAnalytics) {
    
    // Helper function to get the analytics instance
    const getAnalyticsInstance = () => {
        const client = app.get('discordClient');
        return client?.serverManagerAnalytics;
    };
    
    // === DASHBOARD OVERVIEW ===
    app.get('/api/server-manager-analytics/dashboard/:guildId', (req, res) => {
        try {
            const serverManagerAnalytics = getAnalyticsInstance();
            if (!serverManagerAnalytics) {
                return res.status(503).json({ success: false, error: 'Analytics System noch nicht bereit' });
            }
            
            const { guildId } = req.params;
            const dashboard = serverManagerAnalytics.getAnalyticsDashboard(guildId);
            res.json({ success: true, data: dashboard });
        } catch (error) {
            console.error('❌ Fehler beim Laden des Analytics Dashboards:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // === LIVE EVENT FEED ===
    app.get('/api/server-manager-analytics/live-events', (req, res) => {
        try {
            const serverManagerAnalytics = getAnalyticsInstance();
            if (!serverManagerAnalytics) {
                return res.status(503).json({ success: false, error: 'Analytics System noch nicht bereit' });
            }
            
            const { 
                limit = 50, 
                types = '', 
                serverId = null,
                severity = ''
            } = req.query;
            
            const eventTypes = types ? types.split(',') : [];
            const severityLevels = severity ? severity.split(',') : [];
            
            let events = serverManagerAnalytics.getLiveEvents(
                parseInt(limit), 
                eventTypes, 
                serverId
            );
            
            // Filter nach Severity
            if (severityLevels.length > 0) {
                events = events.filter(event => severityLevels.includes(event.severity));
            }
            
            res.json({ 
                success: true, 
                data: {
                    events,
                    totalEvents: events.length,
                    availableTypes: ['memberJoin', 'memberLeave', 'messageCreate', 'voiceJoin', 'voiceLeave', 'voiceMove', 'reactionAdd'],
                    availableSeverities: ['low', 'info', 'warning', 'high']
                }
            });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Live Events:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Live Event Stream (Server-Sent Events)
    app.get('/api/server-manager-analytics/live-events/stream/:guildId', (req, res) => {
        const serverManagerAnalytics = getAnalyticsInstance();
        if (!serverManagerAnalytics) {
            return res.status(503).json({ success: false, error: 'Analytics System noch nicht bereit' });
        }
        
        const { guildId } = req.params;
        
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const mockSocket = {
            send: (data) => {
                res.write(`data: ${data}\n\n`);
            },
            readyState: 1
        };
        
        serverManagerAnalytics.addClient(clientId, mockSocket);
        
        res.write(`data: ${JSON.stringify({ 
            event: 'connected', 
            data: { clientId, guildId } 
        })}\n\n`);
        
        req.on('close', () => {
            serverManagerAnalytics.removeClient(clientId);
        });
    });

    // === VOICE CHANNEL VISUALIZER ===
    app.get('/api/server-manager-analytics/voice-visualization/:guildId', (req, res) => {
        try {
            const serverManagerAnalytics = getAnalyticsInstance();
            if (!serverManagerAnalytics) {
                return res.status(503).json({ success: false, error: 'Analytics System noch nicht bereit' });
            }
            
            const { guildId } = req.params;
            const { timeRange = '24h' } = req.query;
            
            const visualization = serverManagerAnalytics.getVoiceChannelVisualization(guildId, timeRange);
            
            res.json({ 
                success: true, 
                data: {
                    ...visualization,
                    timeRange,
                    generatedAt: Date.now()
                }
            });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Voice Visualization:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // === MEMBER JOURNEY TRACKING ===
    app.get('/api/server-manager-analytics/member-journeys/:guildId', (req, res) => {
        try {
            const serverManagerAnalytics = getAnalyticsInstance();
            if (!serverManagerAnalytics) {
                return res.status(503).json({ success: false, error: 'Analytics System noch nicht bereit' });
            }
            
            const { guildId } = req.params;
            const { 
                userId = null, 
                category = '', 
                sortBy = 'engagement', 
                limit = 100
            } = req.query;
            
            let journeyData = serverManagerAnalytics.getMemberJourneyData(guildId, userId);
            
            if (userId) {
                if (!journeyData) {
                    return res.status(404).json({ 
                        success: false, 
                        error: 'Member Journey nicht gefunden' 
                    });
                }
                res.json({ success: true, data: journeyData });
                return;
            }
            
            let { journeys, summary, analytics } = journeyData;
            
            if (category) {
                journeys = journeys.filter(j => j.engagement.category === category);
            }
            
            switch (sortBy) {
                case 'engagement':
                    journeys.sort((a, b) => b.engagement.score - a.engagement.score);
                    break;
                case 'churn':
                    journeys.sort((a, b) => b.journey.churnProbability - a.journey.churnProbability);
                    break;
                case 'activity':
                    journeys.sort((a, b) => b.journey.lastActivity - a.journey.lastActivity);
                    break;
                default:
                    journeys.sort((a, b) => b.joinedAt - a.joinedAt);
            }
            
            journeys = journeys.slice(0, parseInt(limit));
            
            res.json({ 
                success: true, 
                data: {
                    journeys,
                    summary,
                    analytics,
                    totalCount: journeyData.journeys.length,
                    filteredCount: journeys.length
                }
            });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Member Journeys:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // === SETTINGS ===
    app.get('/api/server-manager-analytics/settings', (req, res) => {
        try {
            const serverManagerAnalytics = getAnalyticsInstance();
            if (!serverManagerAnalytics) {
                return res.status(503).json({ success: false, error: 'Analytics System noch nicht bereit' });
            }
            
            const settings = serverManagerAnalytics.getSettings();
            res.json({ success: true, data: settings });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Settings:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/server-manager-analytics/settings', (req, res) => {
        try {
            const serverManagerAnalytics = getAnalyticsInstance();
            if (!serverManagerAnalytics) {
                return res.status(503).json({ success: false, error: 'Analytics System noch nicht bereit' });
            }
            
            const success = serverManagerAnalytics.updateSettings(req.body);
            
            if (success) {
                res.json({ success: true, message: 'Einstellungen erfolgreich gespeichert' });
            } else {
                res.status(500).json({ success: false, error: 'Fehler beim Speichern' });
            }
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Settings:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // === REALTIME STATS ===
    app.get('/api/server-manager-analytics/realtime-stats/:guildId', (req, res) => {
        try {
            const serverManagerAnalytics = getAnalyticsInstance();
            if (!serverManagerAnalytics) {
                return res.status(503).json({ success: false, error: 'Analytics System noch nicht bereit' });
            }
            
            const { guildId } = req.params;
            
            const stats = {
                liveEvents: {
                    total: serverManagerAnalytics.liveEvents.filter(e => e.serverId === guildId).length,
                    lastHour: serverManagerAnalytics.liveEvents.filter(e => 
                        e.serverId === guildId && 
                        e.timestamp > Date.now() - 3600000
                    ).length
                },
                voiceActivity: {
                    activeChannels: Array.from(serverManagerAnalytics.voiceChannelData.values())
                        .filter(ch => ch.guildId === guildId && ch.currentUsers.size > 0).length,
                    totalActiveUsers: new Set(
                        Array.from(serverManagerAnalytics.voiceChannelData.values())
                            .filter(ch => ch.guildId === guildId)
                            .flatMap(ch => Array.from(ch.currentUsers))
                    ).size
                },
                memberActivity: {
                    activeJourneys: Array.from(serverManagerAnalytics.memberJourneys.values())
                        .filter(j => 
                            j.guildId === guildId && 
                            j.journey.lastActivity > Date.now() - 3600000
                        ).length
                },
                systemHealth: {
                    connectedClients: serverManagerAnalytics.connectedClients.size,
                    uptime: process.uptime()
                }
            };
            
            res.json({ success: true, data: stats });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Realtime Stats:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    console.log('📊 Server Manager Analytics Routes registriert');
}

module.exports = { setupServerManagerAnalyticsRoutes }; 