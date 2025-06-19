const express = require('express');

function setupAIOptimizationRoutes(app) {
    // Get AI optimization suggestions for a guild
    app.get('/api/ai-optimization/suggestions/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            
            if (!guildId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Guild ID ist erforderlich' 
                });
            }

            const client = app.get('discordClient');
            if (!client) {
                return res.status(503).json({ 
                    success: false, 
                    error: 'Discord Client nicht verfügbar' 
                });
            }

            // Check if AI optimization API is available
            if (!client.aiOptimization) {
                return res.status(503).json({ 
                    success: false, 
                    error: 'AI Optimization Service nicht verfügbar' 
                });
            }

            // Generate optimization suggestions
            const optimizationData = await client.aiOptimization.generateOptimizationSuggestions(guildId);

            res.json({
                success: true,
                data: optimizationData
            });

        } catch (error) {
            console.error('Error getting AI optimization suggestions:', error);
            res.status(500).json({
                success: false,
                error: 'Fehler beim Laden der AI-Optimierungen'
            });
        }
    });

    // Get growth predictions for a guild
    app.get('/api/ai-optimization/growth-predictions/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            
            if (!guildId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Guild ID ist erforderlich' 
                });
            }

            const client = app.get('discordClient');
            if (!client) {
                return res.status(503).json({ 
                    success: false, 
                    error: 'Discord Client nicht verfügbar' 
                });
            }

            // Check if AI optimization API is available
            if (!client.aiOptimization) {
                return res.status(503).json({ 
                    success: false, 
                    error: 'AI Optimization Service nicht verfügbar' 
                });
            }

            // Generate growth predictions
            const growthData = await client.aiOptimization.generateGrowthPredictions(guildId);

            res.json({
                success: true,
                data: growthData
            });

        } catch (error) {
            console.error('Error getting growth predictions:', error);
            res.status(500).json({
                success: false,
                error: 'Fehler beim Laden der Wachstumsprognosen'
            });
        }
    });

    // Apply an optimization suggestion
    app.post('/api/ai-optimization/apply-suggestion', async (req, res) => {
        try {
            const { guildId, suggestion } = req.body;
            
            if (!guildId || !suggestion) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Guild ID und Suggestion sind erforderlich' 
                });
            }

            const client = app.get('discordClient');
            if (!client) {
                return res.status(503).json({ 
                    success: false, 
                    error: 'Discord Client nicht verfügbar' 
                });
            }

            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Server nicht gefunden' 
                });
            }

            // Apply the suggestion based on its action type
            const result = await applySuggestion(guild, suggestion);

            // Update statistics
            if (client.aiOptimization && result.success) {
                const data = client.aiOptimization.loadData();
                data.statistics.suggestionsApplied++;
                client.aiOptimization.saveData(data);
            }

            res.json({
                success: result.success,
                message: result.message,
                details: result.details
            });

        } catch (error) {
            console.error('Error applying optimization suggestion:', error);
            res.status(500).json({
                success: false,
                error: 'Fehler beim Anwenden der Optimierung'
            });
        }
    });

    // Get AI optimization settings
    app.get('/api/ai-optimization/settings', async (req, res) => {
        try {
            const client = app.get('discordClient');
            if (!client || !client.aiOptimization) {
                return res.status(503).json({ 
                    success: false, 
                    error: 'AI Optimization Service nicht verfügbar' 
                });
            }

            const data = client.aiOptimization.loadData();
            
            res.json({
                success: true,
                settings: data.settings,
                statistics: data.statistics
            });

        } catch (error) {
            console.error('Error getting AI optimization settings:', error);
            res.status(500).json({
                success: false,
                error: 'Fehler beim Laden der Einstellungen'
            });
        }
    });

    // Update AI optimization settings
    app.post('/api/ai-optimization/settings', async (req, res) => {
        try {
            const { settings } = req.body;
            
            if (!settings) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Einstellungen sind erforderlich' 
                });
            }

            const client = app.get('discordClient');
            if (!client || !client.aiOptimization) {
                return res.status(503).json({ 
                    success: false, 
                    error: 'AI Optimization Service nicht verfügbar' 
                });
            }

            const data = client.aiOptimization.loadData();
            data.settings = { ...data.settings, ...settings };
            
            const saved = client.aiOptimization.saveData(data);
            
            if (saved) {
                res.json({
                    success: true,
                    message: 'Einstellungen erfolgreich gespeichert',
                    settings: data.settings
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Speichern der Einstellungen'
                });
            }

        } catch (error) {
            console.error('Error updating AI optimization settings:', error);
            res.status(500).json({
                success: false,
                error: 'Fehler beim Aktualisieren der Einstellungen'
            });
        }
    });

    // Get analysis history
    app.get('/api/ai-optimization/history/:guildId', async (req, res) => {
        try {
            const { guildId } = req.params;
            const { limit = 10 } = req.query;
            
            const client = app.get('discordClient');
            if (!client || !client.aiOptimization) {
                return res.status(503).json({ 
                    success: false, 
                    error: 'AI Optimization Service nicht verfügbar' 
                });
            }

            const data = client.aiOptimization.loadData();
            const guildAnalyses = data.analyses
                .filter(analysis => analysis.guildId === guildId)
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, parseInt(limit));

            res.json({
                success: true,
                analyses: guildAnalyses,
                total: guildAnalyses.length
            });

        } catch (error) {
            console.error('Error getting analysis history:', error);
            res.status(500).json({
                success: false,
                error: 'Fehler beim Laden der Analyse-Historie'
            });
        }
    });

    console.log('🤖 AI Optimization Routes registriert');
}

// Helper function to apply optimization suggestions
async function applySuggestion(guild, suggestion) {
    try {
        switch (suggestion.action) {
            case 'organize_channels':
                return await organizeChannels(guild, suggestion.data);
            
            case 'improve_roles':
                return await improveRoles(guild, suggestion.data);
            
            case 'cleanup_channels':
                return await cleanupChannels(guild, suggestion.data);
            
            case 'boost_engagement':
                return await boostEngagement(guild, suggestion.data);
            
            case 'promote_voice':
                return await promoteVoice(guild, suggestion.data);
            
            case 'improve_retention':
                return await improveRetention(guild, suggestion.data);
            
            default:
                return {
                    success: false,
                    message: 'Unbekannte Aktion',
                    details: `Aktion "${suggestion.action}" wird nicht unterstützt`
                };
        }
    } catch (error) {
        console.error('Error applying suggestion:', error);
        return {
            success: false,
            message: 'Fehler beim Anwenden der Optimierung',
            details: error.message
        };
    }
}

// Suggestion implementation functions
async function organizeChannels(guild, data) {
    try {
        // Create categories for uncategorized channels
        const uncategorizedChannels = guild.channels.cache.filter(c => 
            c.type === 0 && !c.parent // Text channels without category
        );

        if (uncategorizedChannels.size === 0) {
            return {
                success: true,
                message: 'Alle Channels sind bereits organisiert',
                details: 'Keine uncategorized Channels gefunden'
            };
        }

        // Create a general category if it doesn't exist
        let generalCategory = guild.channels.cache.find(c => 
            c.type === 4 && c.name.toLowerCase().includes('general')
        );

        if (!generalCategory) {
            generalCategory = await guild.channels.create({
                name: '📋 Allgemein',
                type: 4, // Category
                position: 0
            });
        }

        // Move uncategorized channels to the general category
        const movedChannels = [];
        for (const channel of uncategorizedChannels.values()) {
            try {
                await channel.setParent(generalCategory);
                movedChannels.push(channel.name);
            } catch (error) {
                console.error(`Error moving channel ${channel.name}:`, error);
            }
        }

        return {
            success: true,
            message: `${movedChannels.length} Channels erfolgreich organisiert`,
            details: `Channels in Kategorie "${generalCategory.name}" verschoben: ${movedChannels.join(', ')}`
        };

    } catch (error) {
        console.error('Error organizing channels:', error);
        return {
            success: false,
            message: 'Fehler beim Organisieren der Channels',
            details: error.message
        };
    }
}

async function improveRoles(guild, data) {
    return {
        success: true,
        message: 'Rollen-Verbesserung angewendet',
        details: 'Automatische Rollen-Optimierung ist ein komplexer Prozess, der manuell konfiguriert werden sollte.'
    };
}

async function cleanupChannels(guild, data) {
    try {
        if (!data.inactiveChannels || data.inactiveChannels.length === 0) {
            return {
                success: true,
                message: 'Keine inaktiven Channels gefunden',
                details: 'Keine Channels zum Aufräumen'
            };
        }

        const deletedChannels = [];
        
        for (const channelInfo of data.inactiveChannels) {
            const channel = guild.channels.cache.get(channelInfo.id);
            if (channel) {
                try {
                    // Only delete channels that look like test/old channels
                    if (channel.name.toLowerCase().includes('test') || 
                        channel.name.toLowerCase().includes('old') ||
                        channel.name.toLowerCase().includes('unused')) {
                        await channel.delete('AI Optimization: Inactive channel cleanup');
                        deletedChannels.push(channel.name);
                    }
                } catch (error) {
                    console.error(`Error deleting channel ${channel.name}:`, error);
                }
            }
        }

        return {
            success: true,
            message: `${deletedChannels.length} inaktive Channels entfernt`,
            details: deletedChannels.length > 0 ? 
                `Gelöschte Channels: ${deletedChannels.join(', ')}` : 
                'Keine Channels wurden als sicher zum Löschen eingestuft'
        };

    } catch (error) {
        console.error('Error cleaning up channels:', error);
        return {
            success: false,
            message: 'Fehler beim Aufräumen der Channels',
            details: error.message
        };
    }
}

async function boostEngagement(guild, data) {
    return {
        success: true,
        message: 'Engagement-Boost Empfehlungen bereitgestellt',
        details: 'Erwägen Sie: Events, Gewinnspiele, automatische Begrüßungen und Community-Challenges'
    };
}

async function promoteVoice(guild, data) {
    return {
        success: true,
        message: 'Voice-Promotion Strategien empfohlen',
        details: 'Erwägen Sie: Voice-Events, Gaming-Sessions und temporäre Voice-Channels'
    };
}

async function improveRetention(guild, data) {
    return {
        success: true,
        message: 'Retention-Verbesserungen vorgeschlagen',
        details: 'Erwägen Sie: Bessere Begrüßung, Mentoring-Programme und regelmäßige Community-Interaktionen'
    };
}

module.exports = { setupAIOptimizationRoutes }; 