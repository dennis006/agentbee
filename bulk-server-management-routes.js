// Bulk Server Management Routes
function setupBulkServerManagementRoutes(app) {
    
    // Helper function to get the bulk actions instance
    const getBulkActionsInstance = () => {
        const client = app.get('discordClient');
        if (!client || !client.bulkServerActions) {
            console.log('⚠️ Bulk Actions API noch nicht verfügbar');
            return null;
        }
        return client.bulkServerActions;
    };

    // === BULK MEMBER MANAGEMENT ===
    
    // Get servers overview for bulk actions
    app.get('/api/bulk-server-management/servers', async (req, res) => {
        try {
            const client = app.get('discordClient');
            if (!client) {
                return res.status(503).json({ success: false, error: 'Discord Client nicht verfügbar' });
            }

            const servers = [];
            for (const guild of client.guilds.cache.values()) {
                try {
                    await guild.members.fetch({ limit: 10 }); // Sample für Online-Count
                    
                    servers.push({
                        id: guild.id,
                        name: guild.name,
                        icon: guild.iconURL(),
                        memberCount: guild.memberCount,
                        onlineMembers: guild.members.cache.filter(m => m.presence?.status === 'online').size,
                        owner: guild.ownerId,
                        region: guild.preferredLocale || 'Unknown',
                        boostLevel: guild.premiumTier,
                        boostCount: guild.premiumSubscriptionCount,
                        verificationLevel: guild.verificationLevel,
                        createdAt: guild.createdTimestamp,
                        features: guild.features,
                        roles: guild.roles.cache.map(role => ({
                            id: role.id,
                            name: role.name,
                            color: role.hexColor,
                            memberCount: role.members.size,
                            permissions: role.permissions.toArray()
                        })),
                        channels: guild.channels.cache.map(channel => ({
                            id: channel.id,
                            name: channel.name,
                            type: channel.type,
                            parentId: channel.parentId,
                            position: channel.position
                        }))
                    });
                } catch (error) {
                    console.error(`Fehler beim Laden von Server ${guild.name}:`, error);
                }
            }

            res.json({
                success: true,
                data: {
                    servers: servers.sort((a, b) => b.memberCount - a.memberCount),
                    totalServers: servers.length,
                    totalMembers: servers.reduce((sum, s) => sum + s.memberCount, 0)
                }
            });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Server-Übersicht:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Preview bulk action (dry run)
    app.post('/api/bulk-server-management/preview-action', async (req, res) => {
        try {
            const client = app.get('discordClient');
            if (!client) {
                return res.status(503).json({ success: false, error: 'Discord Client nicht verfügbar' });
            }

            const { actionType, guildIds, criteria, actionData } = req.body;
            const preview = {
                actionType,
                estimatedTime: 0,
                affectedServers: [],
                totalAffectedMembers: 0,
                warnings: [],
                recommendations: []
            };

            for (const guildId of guildIds) {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) {
                    preview.warnings.push(`Server ${guildId} nicht gefunden`);
                    continue;
                }

                await guild.members.fetch();
                
                // Simuliere Member-Auswahl basierend auf Kriterien
                let affectedMembers = Array.from(guild.members.cache.values());
                
                if (criteria.roles?.include?.length > 0) {
                    affectedMembers = affectedMembers.filter(member => 
                        criteria.roles.include.some(roleId => member.roles.cache.has(roleId))
                    );
                }
                
                if (criteria.roles?.exclude?.length > 0) {
                    affectedMembers = affectedMembers.filter(member => 
                        !criteria.roles.exclude.some(roleId => member.roles.cache.has(roleId))
                    );
                }

                if (criteria.joinedAfter) {
                    affectedMembers = affectedMembers.filter(m => m.joinedTimestamp > criteria.joinedAfter);
                }

                if (criteria.joinedBefore) {
                    affectedMembers = affectedMembers.filter(m => m.joinedTimestamp < criteria.joinedBefore);
                }

                if (criteria.username) {
                    affectedMembers = affectedMembers.filter(m => 
                        m.user.username.toLowerCase().includes(criteria.username.toLowerCase())
                    );
                }

                if (criteria.maxCount) {
                    affectedMembers = affectedMembers.slice(0, criteria.maxCount);
                }

                // Sicherheitsprüfungen
                const adminMembers = affectedMembers.filter(m => m.permissions.has('Administrator'));
                if (adminMembers.length > 0 && (actionType === 'bulk_kick' || actionType === 'bulk_ban')) {
                    preview.warnings.push(
                        `⚠️ ${guild.name}: ${adminMembers.length} Administratoren betroffen`
                    );
                }

                if (affectedMembers.length > guild.memberCount * 0.1) {
                    preview.warnings.push(
                        `⚠️ ${guild.name}: Mehr als 10% der Mitglieder betroffen (${affectedMembers.length})`
                    );
                }

                preview.affectedServers.push({
                    guildId: guild.id,
                    guildName: guild.name,
                    affectedCount: affectedMembers.length,
                    totalMembers: guild.memberCount,
                    percentage: Math.round((affectedMembers.length / guild.memberCount) * 100),
                    sampleMembers: affectedMembers.slice(0, 5).map(m => ({
                        id: m.id,
                        username: m.user.username,
                        joinedAt: m.joinedTimestamp,
                        roles: m.roles.cache.map(r => r.name).slice(0, 3)
                    }))
                });

                preview.totalAffectedMembers += affectedMembers.length;
            }

            // Geschätzte Zeit berechnen (100ms pro Member + Delays)
            preview.estimatedTime = (preview.totalAffectedMembers * 100) + (guildIds.length * 1000);

            // Empfehlungen basierend auf Action-Typ
            if (actionType === 'bulk_ban' && preview.totalAffectedMembers > 50) {
                preview.recommendations.push(
                    'Erwäge die Aktion in kleineren Batches durchzuführen'
                );
            }

            if (preview.warnings.length > 3) {
                preview.recommendations.push(
                    'Überprüfe deine Kriterien - viele Warnungen erkannt'
                );
            }

            res.json({ success: true, data: preview });
        } catch (error) {
            console.error('❌ Fehler bei Action Preview:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Execute bulk action
    app.post('/api/bulk-server-management/execute-action', async (req, res) => {
        try {
            const bulkActions = getBulkActionsInstance();
            if (!bulkActions) {
                return res.status(503).json({ success: false, error: 'Bulk Actions System noch nicht bereit' });
            }

            const { actionType, guildIds, criteria, actionData, confirmation } = req.body;

            if (!confirmation) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Bestätigung erforderlich für Bulk-Aktionen' 
                });
            }

            const result = await bulkActions.performBulkMemberAction(
                actionType, 
                guildIds, 
                criteria, 
                actionData
            );

            res.json(result);
        } catch (error) {
            console.error('❌ Fehler bei Bulk Action Execution:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // === SERVER TEMPLATES ===
    
    // Get all available templates
    app.get('/api/bulk-server-management/templates', (req, res) => {
        try {
            const bulkActions = getBulkActionsInstance();
            if (!bulkActions) {
                return res.status(503).json({ success: false, error: 'Bulk Actions System noch nicht bereit' });
            }

            const templates = bulkActions.getServerTemplates();
            res.json({ success: true, data: templates });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Templates:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Apply template to server
    app.post('/api/bulk-server-management/apply-template', async (req, res) => {
        try {
            const bulkActions = getBulkActionsInstance();
            if (!bulkActions) {
                return res.status(503).json({ success: false, error: 'Bulk Actions System noch nicht bereit' });
            }

            const { guildId, templateId, options } = req.body;
            const result = await bulkActions.applyServerTemplate(guildId, templateId, options);

            res.json(result);
        } catch (error) {
            console.error('❌ Fehler beim Anwenden des Templates:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // === SERVER OPTIMIZATION ===
    
    // Get optimization reports for all servers
    app.get('/api/bulk-server-management/optimization-reports', (req, res) => {
        try {
            const bulkActions = getBulkActionsInstance();
            if (!bulkActions) {
                return res.status(503).json({ success: false, error: 'Bulk Actions System noch nicht bereit' });
            }

            const reports = bulkActions.getAllOptimizationReports();
            res.json({ success: true, data: reports });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Optimization Reports:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get specific optimization report
    app.get('/api/bulk-server-management/optimization-report/:guildId', (req, res) => {
        try {
            const bulkActions = getBulkActionsInstance();
            if (!bulkActions) {
                return res.status(503).json({ success: false, error: 'Bulk Actions System noch nicht bereit' });
            }

            const { guildId } = req.params;
            const report = bulkActions.getOptimizationReport(guildId);
            
            if (!report) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Optimization Report nicht gefunden' 
                });
            }

            res.json({ success: true, data: report });
        } catch (error) {
            console.error('❌ Fehler beim Laden des Optimization Reports:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Generate new optimization report
    app.post('/api/bulk-server-management/generate-optimization/:guildId', async (req, res) => {
        try {
            const bulkActions = getBulkActionsInstance();
            if (!bulkActions) {
                return res.status(503).json({ success: false, error: 'Bulk Actions System noch nicht bereit' });
            }

            const { guildId } = req.params;
            const report = await bulkActions.analyzeServerOptimization(guildId);
            
            if (report) {
                bulkActions.optimizationReports.set(guildId, report);
                await bulkActions.saveOptimizationData();
            }

            res.json({ success: true, data: report });
        } catch (error) {
            console.error('❌ Fehler beim Generieren des Optimization Reports:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // === ACTION HISTORY ===
    
    // Get action history
    app.get('/api/bulk-server-management/action-history', (req, res) => {
        try {
            const bulkActions = getBulkActionsInstance();
            if (!bulkActions) {
                return res.status(503).json({ success: false, error: 'Bulk Actions System noch nicht bereit' });
            }

            const { limit = 50, type, status } = req.query;
            let history = bulkActions.getActionHistory(parseInt(limit));

            if (type) {
                history = history.filter(action => action.type === type);
            }

            if (status) {
                history = history.filter(action => action.status === status);
            }

            res.json({ success: true, data: history });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Action History:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get specific action status
    app.get('/api/bulk-server-management/action-status/:actionId', (req, res) => {
        try {
            const bulkActions = getBulkActionsInstance();
            if (!bulkActions) {
                return res.status(503).json({ success: false, error: 'Bulk Actions System noch nicht bereit' });
            }

            const { actionId } = req.params;
            const action = bulkActions.getActionStatus(actionId);
            
            if (!action) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Action nicht gefunden' 
                });
            }

            res.json({ success: true, data: action });
        } catch (error) {
            console.error('❌ Fehler beim Laden des Action Status:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // === CROSS-SERVER SYNC ===
    
    // Sync settings between servers
    app.post('/api/bulk-server-management/sync-settings', async (req, res) => {
        try {
            const client = app.get('discordClient');
            if (!client) {
                return res.status(503).json({ success: false, error: 'Discord Client nicht verfügbar' });
            }

            const { sourceGuildId, targetGuildIds, settingsToSync } = req.body;
            const sourceGuild = client.guilds.cache.get(sourceGuildId);
            
            if (!sourceGuild) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Quell-Server nicht gefunden' 
                });
            }

            const results = [];

            for (const targetGuildId of targetGuildIds) {
                const targetGuild = client.guilds.cache.get(targetGuildId);
                if (!targetGuild) {
                    results.push({
                        guildId: targetGuildId,
                        success: false,
                        error: 'Server nicht gefunden'
                    });
                    continue;
                }

                const syncResult = {
                    guildId: targetGuildId,
                    guildName: targetGuild.name,
                    success: true,
                    synced: [],
                    errors: []
                };

                // Sync verschiedene Einstellungen
                if (settingsToSync.includes('verification')) {
                    try {
                        await targetGuild.setVerificationLevel(sourceGuild.verificationLevel);
                        syncResult.synced.push('Verification Level');
                    } catch (error) {
                        syncResult.errors.push(`Verification: ${error.message}`);
                    }
                }

                if (settingsToSync.includes('notifications')) {
                    try {
                        await targetGuild.setDefaultMessageNotifications(sourceGuild.defaultMessageNotifications);
                        syncResult.synced.push('Default Notifications');
                    } catch (error) {
                        syncResult.errors.push(`Notifications: ${error.message}`);
                    }
                }

                if (settingsToSync.includes('contentFilter')) {
                    try {
                        await targetGuild.setExplicitContentFilter(sourceGuild.explicitContentFilter);
                        syncResult.synced.push('Content Filter');
                    } catch (error) {
                        syncResult.errors.push(`Content Filter: ${error.message}`);
                    }
                }

                results.push(syncResult);
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            res.json({ success: true, data: results });
        } catch (error) {
            console.error('❌ Fehler beim Sync der Settings:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // === MASS MEMBER OPERATIONS ===
    
    // Get member statistics across servers
    app.get('/api/bulk-server-management/member-statistics', async (req, res) => {
        try {
            const client = app.get('discordClient');
            if (!client) {
                return res.status(503).json({ success: false, error: 'Discord Client nicht verfügbar' });
            }

            const { guildIds } = req.query;
            const targetGuilds = guildIds ? guildIds.split(',') : Array.from(client.guilds.cache.keys());
            
            const statistics = {
                totalServers: targetGuilds.length,
                totalMembers: 0,
                totalBots: 0,
                totalOnline: 0,
                averageJoinAge: 0,
                memberDistribution: {},
                roleDistribution: {},
                activityPatterns: {}
            };

            const allJoinDates = [];

            for (const guildId of targetGuilds) {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) continue;

                await guild.members.fetch();
                
                const members = guild.members.cache;
                const bots = members.filter(m => m.user.bot);
                const humans = members.filter(m => !m.user.bot);
                const online = members.filter(m => m.presence?.status === 'online');

                statistics.totalMembers += humans.size;
                statistics.totalBots += bots.size;
                statistics.totalOnline += online.size;

                // Sammle Join-Daten für Durchschnittsberechnung
                humans.forEach(member => {
                    if (member.joinedTimestamp) {
                        allJoinDates.push(member.joinedTimestamp);
                    }
                });

                // Member-Verteilung nach Server
                statistics.memberDistribution[guild.name] = {
                    total: humans.size,
                    bots: bots.size,
                    online: online.size,
                    percentage: 0 // Wird später berechnet
                };

                // Rollen-Verteilung
                guild.roles.cache.forEach(role => {
                    if (role.name !== '@everyone') {
                        if (!statistics.roleDistribution[role.name]) {
                            statistics.roleDistribution[role.name] = 0;
                        }
                        statistics.roleDistribution[role.name] += role.members.size;
                    }
                });
            }

            // Berechne Durchschnitts-Join-Alter
            if (allJoinDates.length > 0) {
                const averageJoinTimestamp = allJoinDates.reduce((sum, date) => sum + date, 0) / allJoinDates.length;
                statistics.averageJoinAge = Math.floor((Date.now() - averageJoinTimestamp) / (1000 * 60 * 60 * 24));
            }

            // Berechne Prozentsätze für Member-Verteilung
            Object.keys(statistics.memberDistribution).forEach(serverName => {
                const serverData = statistics.memberDistribution[serverName];
                serverData.percentage = Math.round((serverData.total / statistics.totalMembers) * 100);
            });

            res.json({ success: true, data: statistics });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Member Statistics:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // === SETTINGS ===
    
    // Get bulk actions settings
    app.get('/api/bulk-server-management/settings', (req, res) => {
        try {
            const bulkActions = getBulkActionsInstance();
            if (!bulkActions) {
                return res.status(503).json({ success: false, error: 'Bulk Actions System noch nicht bereit' });
            }

            const settings = bulkActions.getSettings();
            res.json({ success: true, data: settings });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Settings:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Update bulk actions settings
    app.post('/api/bulk-server-management/settings', (req, res) => {
        try {
            const bulkActions = getBulkActionsInstance();
            if (!bulkActions) {
                return res.status(503).json({ success: false, error: 'Bulk Actions System noch nicht bereit' });
            }

            const success = bulkActions.updateSettings(req.body);
            
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

    // === BULK ACTIONS ===
    
    // Execute bulk action with configuration
    app.post('/api/bulk-server-management/bulk-action', async (req, res) => {
        try {
            const { guildId, actionType, config } = req.body;
            
            if (!guildId || !actionType || !config) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Fehlende Parameter: guildId, actionType, config erforderlich' 
                });
            }

            const client = app.get('discordClient');
            if (!client) {
                return res.status(503).json({ success: false, error: 'Discord Client nicht verfügbar' });
            }

            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return res.status(404).json({ success: false, error: 'Server nicht gefunden' });
            }

            // Get mass member management instance
            const massMemberAPI = client.massMemberManagement;
            if (!massMemberAPI) {
                return res.status(503).json({ success: false, error: 'Mass Member Management nicht verfügbar' });
            }

            // Fetch all members to work with
            await guild.members.fetch();

            // Filter members based on criteria
            let targetMembers = [];
            
            switch (config.criteria) {
                case 'inactive_days':
                    const cutoffDate = Date.now() - (config.value * 24 * 60 * 60 * 1000);
                    targetMembers = guild.members.cache.filter(member => {
                        if (member.user.bot) return false;
                        const lastActive = massMemberAPI.getLastMessageTime(member.id, guildId);
                        return lastActive ? lastActive < cutoffDate : (member.joinedTimestamp < cutoffDate);
                    });
                    break;

                case 'no_roles':
                    targetMembers = guild.members.cache.filter(member => 
                        !member.user.bot && member.roles.cache.size <= 1 // Only @everyone role
                    );
                    break;

                case 'specific_roles':
                    if (config.targetRoles && config.targetRoles.length > 0) {
                        const roleNames = config.targetRoles.map(r => r.toLowerCase());
                        targetMembers = guild.members.cache.filter(member => {
                            if (member.user.bot) return false;
                            return member.roles.cache.some(role => 
                                roleNames.includes(role.name.toLowerCase())
                            );
                        });
                    }
                    break;

                case 'join_date':
                    const joinCutoffDate = Date.now() - (config.value * 24 * 60 * 60 * 1000);
                    targetMembers = guild.members.cache.filter(member => 
                        !member.user.bot && member.joinedTimestamp && member.joinedTimestamp < joinCutoffDate
                    );
                    break;

                case 'all_members':
                    targetMembers = guild.members.cache.filter(member => !member.user.bot);
                    break;

                default:
                    return res.status(400).json({ success: false, error: 'Unbekannte Auswahlkriterien' });
            }

            const memberIds = Array.from(targetMembers.keys());

            // If dry run, just return preview
            if (config.dryRun) {
                const preview = {
                    actionType,
                    criteria: config.criteria,
                    targetCount: memberIds.length,
                    members: Array.from(targetMembers.values()).slice(0, 10).map(member => ({
                        id: member.id,
                        username: member.user.username,
                        displayName: member.displayName,
                        joinedAt: member.joinedAt,
                        roles: Array.from(member.roles.cache.values()).map(role => role.name)
                    })),
                    showingFirst: Math.min(10, memberIds.length),
                    config
                };

                return res.json({ success: true, preview, dryRun: true });
            }

            // Execute the actual action
            let result;
            
            switch (actionType) {
                case 'bulk_kick':
                    result = await massMemberAPI.bulkKick(guildId, memberIds, config.reason || 'Bulk kick operation');
                    break;

                case 'bulk_ban':
                    result = await massMemberAPI.bulkBan(guildId, memberIds, config.reason || 'Bulk ban operation');
                    break;

                case 'role_actions':
                    if (config.targetRoles && config.targetRoles.length > 0) {
                        // Find role IDs by names
                        const roleIds = [];
                        for (const roleName of config.targetRoles) {
                            const role = guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
                            if (role) roleIds.push(role.id);
                        }
                        
                        if (roleIds.length > 0) {
                            // For role actions, assume we're adding roles (can be extended)
                            result = await massMemberAPI.bulkAssignRoles(guildId, memberIds, roleIds, config.reason || 'Bulk role assignment');
                        } else {
                            result = { success: false, error: 'Keine gültigen Rollen gefunden' };
                        }
                    } else {
                        result = { success: false, error: 'Keine Rollen spezifiziert' };
                    }
                    break;

                case 'bulk_message':
                    // For bulk messaging, we'd need to implement this in the mass member API
                    // For now, return a placeholder
                    result = { 
                        success: true, 
                        message: 'Bulk messaging noch nicht implementiert',
                        processed: 0,
                        targetCount: memberIds.length
                    };
                    break;

                case 'settings_sync':
                    // Settings sync would copy settings from this server to others
                    result = { 
                        success: true, 
                        message: 'Settings sync noch nicht implementiert',
                        processed: 0
                    };
                    break;

                default:
                    return res.status(400).json({ success: false, error: 'Unbekannter Aktionstyp' });
            }

            res.json({ success: true, result });

        } catch (error) {
            console.error('❌ Fehler bei Bulk Action:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    console.log('🔧 Bulk Server Management Routes registriert');
}

module.exports = { setupBulkServerManagementRoutes }; 