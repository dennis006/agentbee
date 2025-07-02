// Giveaway API Endpoints
const express = require('express');

function registerGiveawayAPI(app, client) {
    // Giveaway-Einstellungen abrufen
    app.get('/api/giveaway/settings', (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }
            res.json(giveawaySystem.settings);
        } catch (error) {
            console.error('Fehler beim Laden der Giveaway-Einstellungen:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Einstellungen' });
        }
    });

    // Giveaway-Einstellungen speichern
    app.post('/api/giveaway/settings', async (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }
            const newSettings = req.body;
            await giveawaySystem.updateSettings(newSettings);
            
            // Sofortige Aktualisierung aller Auto-Leaderboard-Channels
            setTimeout(async () => {
                try {
                    await giveawaySystem.updateAllLeaderboards();
                    console.log('🔄 Auto-Leaderboard-Channels nach Settings-Update aktualisiert');
                } catch (error) {
                    console.error('⚠️ Fehler beim Aktualisieren der Auto-Leaderboards:', error);
                }
            }, 1000); // 1 Sekunde Verzögerung, damit Settings gespeichert sind
            
            console.log('✅ Giveaway-Einstellungen gespeichert');
            res.json({ success: true, message: 'Einstellungen gespeichert und Timer neu gestartet!' });
        } catch (error) {
            console.error('Fehler beim Speichern der Giveaway-Einstellungen:', error);
            res.status(500).json({ error: 'Fehler beim Speichern der Einstellungen' });
        }
    });

    // Aktive Giveaways abrufen
    app.get('/api/giveaway/active', (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }
            const activeGiveaways = Array.from(giveawaySystem.giveaways.values())
                .filter(g => g.status === 'active')
                .map(g => ({
                    ...g,
                    participants: Array.from(g.participants),
                    timeRemaining: Math.max(0, g.endTime - Date.now())
                }));
            
            res.json({ giveaways: activeGiveaways });
        } catch (error) {
            console.error('Fehler beim Laden der aktiven Giveaways:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Giveaways' });
        }
    });

    // Giveaway-Historie abrufen
    app.get('/api/giveaway/history', (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }
            const allGiveaways = Array.from(giveawaySystem.giveaways.values())
                .map(g => ({
                    ...g,
                    participants: Array.from(g.participants),
                    timeRemaining: Math.max(0, g.endTime - Date.now())
                }))
                .sort((a, b) => b.createdAt - a.createdAt);
            
            res.json({ giveaways: allGiveaways });
        } catch (error) {
            console.error('Fehler beim Laden der Giveaway-Historie:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Historie' });
        }
    });

    // Neues Giveaway erstellen
    app.post('/api/giveaway/create', async (req, res) => {
        try {
            console.log('🎯 Giveaway-Erstellung gestartet:', new Date().toLocaleString('de-DE'));
            console.log('📥 Request Body:', JSON.stringify(req.body, null, 2));
            
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                console.error('❌ Giveaway-System nicht initialisiert');
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }

            const {
                type,
                title,
                description,
                prize,
                duration,
                winners,
                channelName,
                requirements
            } = req.body;

            // Channel finden
            const guild = client.guilds.cache.first();
            if (!guild) {
                console.error('❌ Kein Server gefunden');
                return res.status(400).json({ error: 'Server nicht gefunden' });
            }
            console.log('✅ Server gefunden:', guild.name);

            const channel = guild.channels.cache.find(c => 
                c.name === channelName && c.type === 0
            );
            
            if (!channel) {
                console.error('❌ Channel nicht gefunden:', channelName);
                console.log('📋 Verfügbare Channels:', guild.channels.cache.filter(c => c.type === 0).map(c => c.name).join(', '));
                return res.status(400).json({ error: `Channel "${channelName}" nicht gefunden` });
            }
            console.log('✅ Channel gefunden:', channel.name);

            // Host-Info (für Demo verwenden wir Bot-Info)
            const host = {
                id: client.user.id,
                username: client.user.username
            };

            // Debug-Logging
            console.log('📝 Giveaway-Daten empfangen:', {
                type,
                title,
                description,
                prize,
                duration,
                winners,
                channelName,
                requirements: Object.keys(requirements || {})
            });

            // Endzeit berechnen
            const endTime = Date.now() + parseInt(duration);
            
            console.log('⏰ Zeit-Berechnung:', {
                now: Date.now(),
                duration: parseInt(duration),
                endTime: endTime,
                readable: new Date(endTime).toLocaleString('de-DE')
            });

            const giveaway = await giveawaySystem.createGiveaway({
                type,
                title,
                description,
                prize,
                endTime,
                winners: parseInt(winners),
                channelId: channel.id,
                channelName: channel.name,
                requirements,
                createdBy: host.id
            });

            res.json({ 
                success: true, 
                message: 'Giveaway erstellt!',
                giveaway: {
                    ...giveaway,
                    participants: Array.from(giveaway.participants)
                }
            });

        } catch (error) {
            console.error('❌ Fehler beim Erstellen des Giveaways:', error);
            console.error('📋 Error Stack:', error.stack);
            res.status(500).json({ error: error.message || 'Fehler beim Erstellen des Giveaways' });
        }
    });

    // Giveaway manuell beenden
    app.post('/api/giveaway/:id/end', async (req, res) => {
        try {
            const giveawayId = req.params.id;
            const giveaway = giveawaySystem.giveaways.get(giveawayId);
            
            if (!giveaway) {
                return res.status(404).json({ error: 'Giveaway nicht gefunden' });
            }

            if (giveaway.status !== 'active') {
                return res.status(400).json({ error: 'Giveaway ist nicht aktiv' });
            }

            await giveawaySystem.endGiveaway(giveaway);
            res.json({ success: true, message: 'Giveaway beendet!' });

        } catch (error) {
            console.error('Fehler beim Beenden des Giveaways:', error);
            res.status(500).json({ error: 'Fehler beim Beenden des Giveaways' });
        }
    });

    // Giveaway löschen
    app.delete('/api/giveaway/:id', (req, res) => {
        try {
            const giveawayId = req.params.id;
            const deleted = giveawaySystem.giveaways.delete(giveawayId);
            
            if (!deleted) {
                return res.status(404).json({ error: 'Giveaway nicht gefunden' });
            }

            giveawaySystem.saveData();
            res.json({ success: true, message: 'Giveaway gelöscht!' });

        } catch (error) {
            console.error('Fehler beim Löschen des Giveaways:', error);
            res.status(500).json({ error: 'Fehler beim Löschen des Giveaways' });
        }
    });

    // Giveaway aus Historie löschen
    app.delete('/api/giveaway/history/:id', (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }

            const giveawayId = req.params.id;
            const giveaway = giveawaySystem.giveaways.get(giveawayId);
            
            if (!giveaway) {
                return res.status(404).json({ error: 'Giveaway nicht gefunden' });
            }

            // Nur beendete Giveaways können aus der Historie gelöscht werden
            if (giveaway.status === 'active') {
                return res.status(400).json({ error: 'Aktive Giveaways können nicht aus der Historie gelöscht werden' });
            }

            const deleted = giveawaySystem.giveaways.delete(giveawayId);
            
            if (!deleted) {
                return res.status(404).json({ error: 'Fehler beim Löschen aus der Historie' });
            }

            giveawaySystem.saveData();
            console.log(`🗑️ Giveaway ${giveawayId} (${giveaway.title}) aus Historie entfernt`);
            res.json({ success: true, message: 'Giveaway aus Historie entfernt!' });

        } catch (error) {
            console.error('Fehler beim Entfernen aus der Historie:', error);
            res.status(500).json({ error: 'Fehler beim Entfernen aus der Historie' });
        }
    });

    // Giveaway-Statistiken
    app.get('/api/giveaway/stats', (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }
            const stats = giveawaySystem.getStats();
            res.json(stats);
        } catch (error) {
            console.error('Fehler beim Laden der Giveaway-Statistiken:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Statistiken' });
        }
    });

    // Invite-Tracking Statistiken
    app.get('/api/giveaway/invites', (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }
            const inviteStats = Array.from(giveawaySystem.inviteTracking.values())
                .map(user => ({
                    userId: user.userId,
                    username: user.username,
                    totalInvites: user.totalInvites,
                    activeCodes: user.codes?.length || 0
                }))
                .sort((a, b) => b.totalInvites - a.totalInvites);

            res.json({ invites: inviteStats });
        } catch (error) {
            console.error('Fehler beim Laden der Invite-Statistiken:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Invite-Daten' });
        }
    });

    // User aus allen Giveaways entfernen
    app.post('/api/giveaway/remove-user', (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }
            
            const { userId } = req.body;
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID erforderlich' });
            }

            giveawaySystem.removeUserFromAllGiveaways(userId);
            res.json({ success: true, message: 'User aus allen Giveaways entfernt!' });

        } catch (error) {
            console.error('Fehler beim Entfernen des Users:', error);
            res.status(500).json({ error: 'Fehler beim Entfernen des Users' });
        }
    });

    // Persönlichen Invite-Link für User erstellen
    app.post('/api/giveaway/:id/create-invite', async (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }

            const giveawayId = req.params.id;
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'User ID erforderlich' });
            }

            const invite = await giveawaySystem.createPersonalInviteLink(userId, giveawayId);
            
            res.json({ 
                success: true, 
                invite: {
                    code: invite.code,
                    url: invite.url,
                    maxUses: invite.maxUses,
                    expiresAt: invite.expiresTimestamp
                }
            });

        } catch (error) {
            console.error('Fehler beim Erstellen des Invite-Links:', error);
            res.status(500).json({ error: error.message || 'Fehler beim Erstellen des Invite-Links' });
        }
    });

    // Invite-Statistiken für User abrufen
    app.get('/api/giveaway/:id/invite-stats/:userId', (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }

            const giveawayId = req.params.id;
            const userId = req.params.userId;

            const userTracking = giveawaySystem.inviteTracking.get(userId) || { 
                totalInvites: 0, 
                codes: [], 
                username: 'Unknown' 
            };

            const giveawayInvites = giveawaySystem.userInvites.get(giveawayId) || new Map();
            const userInviteCount = giveawayInvites.get(userId) || 0;

            const leaderboard = giveawaySystem.getInviteLeaderboard(giveawayId);
            const userRank = leaderboard.findIndex(entry => entry.userId === userId) + 1;

            // User's aktive Codes für dieses Giveaway
            const activeCodes = userTracking.codes.filter(code => {
                const tracking = giveawaySystem.inviteCodeTracking.get(code);
                return tracking && tracking.giveawayId === giveawayId;
            }).map(code => {
                const tracking = giveawaySystem.inviteCodeTracking.get(code);
                return {
                    code,
                    uses: tracking.uses,
                    url: `https://discord.gg/${code}`
                };
            });

            res.json({
                totalInvites: userTracking.totalInvites,
                giveawayInvites: userInviteCount,
                rank: userRank || null,
                totalParticipants: leaderboard.length,
                activeCodes,
                leaderboard: leaderboard.slice(0, 10) // Top 10
            });

        } catch (error) {
            console.error('Fehler beim Laden der Invite-Statistiken:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Statistiken' });
        }
    });

    // Channels für Dropdown abrufen
    app.get('/api/giveaway/channels', (req, res) => {
        try {
            const guild = client.guilds.cache.first();
            if (!guild) {
                return res.status(400).json({ error: 'Server nicht gefunden' });
            }

            const textChannels = guild.channels.cache
                .filter(channel => channel.type === 0) // Text-Channels
                .map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    guildId: guild.id,
                    guildName: guild.name
                }));

            res.json({ channels: textChannels });
        } catch (error) {
            console.error('Fehler beim Laden der Channels:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Channels' });
        }
    });

    // Rollen für Dropdown abrufen
    app.get('/api/giveaway/roles', (req, res) => {
        try {
            const guild = client.guilds.cache.first();
            if (!guild) {
                return res.status(400).json({ error: 'Server nicht gefunden' });
            }

            const roles = guild.roles.cache
                .filter(role => !role.managed && role.name !== '@everyone')
                .map(role => ({
                    id: role.id,
                    name: role.name,
                    color: role.hexColor,
                    guildId: guild.id,
                    guildName: guild.name
                }));

            res.json({ roles });
        } catch (error) {
            console.error('Fehler beim Laden der Rollen:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Rollen' });
        }
    });

    // Test-Giveaway erstellen (für Entwicklung)
    app.post('/api/giveaway/test', async (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }

            const guild = client.guilds.cache.first();
            if (!guild) {
                return res.status(400).json({ error: 'Server nicht gefunden' });
            }

            const channel = guild.channels.cache.find(c => 
                c.name === giveawaySystem.settings.defaultChannel && c.type === 0
            ) || guild.channels.cache.filter(c => c.type === 0).first();
            
            if (!channel) {
                return res.status(400).json({ error: 'Kein geeigneter Channel gefunden' });
            }

            const host = {
                id: client.user.id,
                username: client.user.username
            };

            const testGiveaway = await giveawaySystem.createGiveaway({
                type: 'classic',
                title: '🎮 Test Giveaway',
                description: 'Dies ist ein Test-Giveaway vom Dashboard!',
                prize: 'Nitro Classic (1 Monat)',
                duration: 300000, // 5 Minuten
                winners: 1,
                channel,
                requirements: {},
                host
            });

            res.json({ 
                success: true, 
                message: 'Test-Giveaway erstellt!',
                giveaway: {
                    ...testGiveaway,
                    participants: Array.from(testGiveaway.participants)
                }
            });

        } catch (error) {
            console.error('Fehler beim Erstellen des Test-Giveaways:', error);
            res.status(500).json({ error: 'Fehler beim Erstellen des Test-Giveaways' });
        }
    });

    // Gewinner eines Giveaways abrufen
    app.get('/api/giveaway/:id/winners', async (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }

            const giveawayId = req.params.id;
            const giveaway = giveawaySystem.giveaways.get(giveawayId);
            
            if (!giveaway) {
                return res.status(404).json({ error: 'Giveaway nicht gefunden' });
            }

            // Gewinner aus der Giveaway-Historie oder aktuellen Daten laden
            let winners = [];
            
            if (giveaway.winnerIds && giveaway.winnerIds.length > 0) {
                // Versuche Benutzer-Details von Discord zu holen
                const guild = client.guilds.cache.first();
                if (guild) {
                    for (const winnerId of giveaway.winnerIds) {
                        try {
                            const member = await guild.members.fetch(winnerId).catch(() => null);
                            if (member) {
                                winners.push({
                                    id: member.id,
                                    username: member.user.username,
                                    discriminator: member.user.discriminator !== '0' ? member.user.discriminator : null,
                                    avatar: member.user.displayAvatarURL()
                                });
                            } else {
                                // Fallback wenn Member nicht mehr auf Server
                                winners.push({
                                    id: winnerId,
                                    username: `User ${winnerId}`,
                                    discriminator: null,
                                    avatar: null
                                });
                            }
                        } catch (error) {
                            console.error(`Fehler beim Laden von Mitglied ${winnerId}:`, error);
                            winners.push({
                                id: winnerId,
                                username: `User ${winnerId}`,
                                discriminator: null,
                                avatar: null
                            });
                        }
                    }
                }
            }

            res.json({ 
                success: true, 
                winners,
                giveaway: {
                    id: giveaway.id,
                    title: giveaway.title,
                    prize: giveaway.prize,
                    endTime: giveaway.endTime,
                    status: giveaway.status
                }
            });

        } catch (error) {
            console.error('Fehler beim Laden der Gewinner:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Gewinner' });
        }
    });

    // Nachricht an einen Benutzer senden
    app.post('/api/messages/send', async (req, res) => {
        try {
            const { userId, message } = req.body;

            if (!userId || !message) {
                return res.status(400).json({ error: 'User ID und Nachricht sind erforderlich' });
            }

            // Versuche den Benutzer zu finden
            const guild = client.guilds.cache.first();
            if (!guild) {
                return res.status(400).json({ error: 'Server nicht gefunden' });
            }

            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member) {
                return res.status(404).json({ error: 'Benutzer nicht gefunden oder nicht mehr auf dem Server' });
            }

            // DM senden
            try {
                await member.send(`📨 **Nachricht vom Server-Dashboard:**\n\n${message}\n\n*Gesendet von: ${guild.name}*`);
                
                res.json({ 
                    success: true, 
                    message: `Nachricht erfolgreich an ${member.user.username} gesendet!`
                });

                console.log(`✅ DM gesendet an ${member.user.username}: ${message}`);

            } catch (dmError) {
                console.error('Fehler beim Senden der DM:', dmError);
                
                // Fallback: Öffentliche Erwähnung in einem Channel
                const logChannel = guild.channels.cache.find(c => 
                    c.name.includes('log') || c.name.includes('admin') || c.name.includes('mod')
                ) || guild.channels.cache.filter(c => c.type === 0).first();

                if (logChannel) {
                    await logChannel.send(`📨 **Dashboard-Nachricht für <@${userId}>:**\n\n${message}\n\n*DM fehlgeschlagen - Nachricht hier gepostet*`);
                    
                    res.json({ 
                        success: true, 
                        message: `DM fehlgeschlagen, Nachricht wurde in #${logChannel.name} gepostet`
                    });
                } else {
                    res.status(500).json({ error: 'DM fehlgeschlagen und kein geeigneter Channel für Fallback gefunden' });
                }
            }

        } catch (error) {
            console.error('Fehler beim Senden der Nachricht:', error);
            res.status(500).json({ error: 'Fehler beim Senden der Nachricht' });
        }
    });

    // Debug: Invite-Tracking Daten für ein Giveaway
    app.get('/api/giveaway/:id/debug-invites', (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }

            const giveawayId = req.params.id;
            const giveaway = giveawaySystem.giveaways.get(giveawayId);
            
            if (!giveaway) {
                return res.status(404).json({ error: 'Giveaway nicht gefunden' });
            }

            const giveawayInvites = giveawaySystem.userInvites.get(giveawayId) || new Map();
            const giveawayInvitedUsers = giveawaySystem.invitedUsers.get(giveawayId) || new Map();
            
            const debugData = {
                giveawayId,
                giveawayTitle: giveaway.title,
                giveawayType: giveaway.type,
                antiCheatSettings: giveawaySystem.settings.antiCheat,
                userInviteCounts: Object.fromEntries(giveawayInvites),
                invitedUsersTracking: Object.fromEntries(
                    Array.from(giveawayInvitedUsers.entries()).map(([inviterId, invitedSet]) => [
                        inviterId,
                        Array.from(invitedSet)
                    ])
                ),
                activeCodes: Array.from(giveawaySystem.inviteCodeTracking.entries())
                    .filter(([code, data]) => data.giveawayId === giveawayId)
                    .map(([code, data]) => ({
                        code,
                        userId: data.userId,
                        uses: data.uses,
                        url: `https://discord.gg/${code}`
                    }))
            };

            res.json(debugData);

        } catch (error) {
            console.error('Fehler beim Laden der Debug-Daten:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Debug-Daten' });
        }
    });

    // Admin: Detaillierte Invite-Tracking Daten für ein bestimmtes Giveaway
    app.get('/api/giveaway/:id/admin-tracking', async (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }

            const giveawayId = req.params.id;
            const giveaway = giveawaySystem.giveaways.get(giveawayId);
            
            if (!giveaway) {
                return res.status(404).json({ error: 'Giveaway nicht gefunden' });
            }

            // Aktualisiere "Unknown" User-Namen vor der Anzeige
            await giveawaySystem.updateUnknownUsernames();

            const giveawayInvites = giveawaySystem.userInvites.get(giveawayId) || new Map();
            const giveawayInvitedUsers = giveawaySystem.invitedUsers.get(giveawayId) || new Map();
            
            // Erstelle detaillierte Tracking-Daten
            const leaderboard = giveawaySystem.getInviteLeaderboard(giveawayId);
            const detailedTracking = leaderboard.map(entry => {
                const invitedUsers = giveawayInvitedUsers.get(entry.userId) || new Set();
                const userTracking = giveawaySystem.inviteTracking.get(entry.userId) || {};
                
                const activeCodes = Array.from(giveawaySystem.inviteCodeTracking.entries())
                    .filter(([code, data]) => data.giveawayId === giveawayId && data.userId === entry.userId)
                    .map(([code, data]) => ({
                        code,
                        uses: data.uses,
                        url: `https://discord.gg/${code}`
                    }));

                // Hole User-Details für eingeladene User
                const invitedUsersWithDetails = Array.from(invitedUsers).map(userId => {
                    const userInfo = giveawaySystem.inviteTracking.get(userId) || {};
                    return {
                        id: userId,
                        username: userInfo.username || 'Unknown'
                    };
                });

                return {
                    userId: entry.userId,
                    username: userTracking.username || 'Unknown',
                    inviteCount: entry.invites,
                    invitedUserIds: Array.from(invitedUsers),
                    invitedUsersWithDetails,
                    activeCodes,
                    totalGlobalInvites: userTracking.totalInvites || 0
                };
            });

            // Zusätzliche Statistiken
            const totalInvitedUsers = Array.from(giveawayInvitedUsers.values())
                .reduce((total, userSet) => total + userSet.size, 0);
            
            const totalActiveCodes = Array.from(giveawaySystem.inviteCodeTracking.values())
                .filter(data => data.giveawayId === giveawayId).length;

            res.json({
                giveawayId,
                giveawayTitle: giveaway.title,
                giveawayType: giveaway.type,
                status: giveaway.status,
                participants: giveaway.participants.size,
                totalInvitedUsers,
                totalActiveCodes,
                leaderboard: detailedTracking,
                inviteRequirement: giveaway.requirements?.minInvites || 0
            });

        } catch (error) {
            console.error('Fehler beim Laden der Admin-Tracking Daten:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Admin-Tracking Daten' });
        }
    });

    // Admin: Leaderboard-Channel erstellen/aktualisieren
    app.post('/api/giveaway/:id/create-leaderboard-channel', async (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }

            const giveawayId = req.params.id;
            const result = await giveawaySystem.createOrUpdateLeaderboardChannel(giveawayId);
            
            res.json({
                success: true,
                channelId: result.channelId,
                channelName: result.channelName,
                messageId: result.messageId,
                isNew: result.isNew
            });

        } catch (error) {
            console.error('Fehler beim Erstellen des Leaderboard-Channels:', error);
            res.status(500).json({ error: error.message });
        }
    });



    // Teilnehmer-Details für ein Giveaway
    app.get('/api/giveaway/:id/participants', async (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }

            const giveawayId = req.params.id;
            const giveaway = giveawaySystem.giveaways.get(giveawayId);
            
            if (!giveaway) {
                return res.status(404).json({ error: 'Giveaway nicht gefunden' });
            }

            const guild = client.guilds.cache.first();
            if (!guild) {
                return res.status(500).json({ error: 'Server nicht gefunden' });
            }

            // Sammle alle Teilnehmer-Details
            const participants = [];
            for (const userId of giveaway.participants) {
                try {
                    const member = await guild.members.fetch(userId).catch(() => null);
                    const userTracking = giveawaySystem.inviteTracking.get(userId) || {};
                    
                    participants.push({
                        id: userId,
                        username: member?.user?.username || userTracking.username || 'Unknown',
                        discriminator: member?.user?.discriminator,
                        avatar: member?.user?.avatar,
                        joinedAt: member?.joinedTimestamp,
                        roles: member?.roles?.cache?.map(role => ({ id: role.id, name: role.name, color: role.hexColor })) || []
                    });
                } catch (error) {
                    // Fallback für User die nicht mehr im Server sind
                    const userTracking = giveawaySystem.inviteTracking.get(userId) || {};
                    participants.push({
                        id: userId,
                        username: userTracking.username || 'Unknown',
                        discriminator: null,
                        avatar: null,
                        joinedAt: null,
                        roles: [],
                        leftServer: true
                    });
                }
            }

            res.json({
                giveawayId,
                giveawayTitle: giveaway.title,
                giveawayType: giveaway.type,
                status: giveaway.status,
                totalParticipants: participants.length,
                participants
            });

        } catch (error) {
            console.error('Fehler beim Laden der Teilnehmer-Daten:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Teilnehmer-Daten' });
        }
    });

    // Admin: Leaderboard-Channel löschen
    app.delete('/api/giveaway/:id/leaderboard-channel', async (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }

            const giveawayId = req.params.id;
            await giveawaySystem.deleteLeaderboardChannel(giveawayId);
            
            res.json({
                success: true,
                message: 'Leaderboard-Channel erfolgreich gelöscht'
            });

        } catch (error) {
            console.error('Fehler beim Löschen des Leaderboard-Channels:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Admin: Auto-Leaderboard-Channel löschen
    app.delete('/api/giveaway/:id/auto-leaderboard-channel', async (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }

            const giveawayId = req.params.id;
            await giveawaySystem.deleteAutoLeaderboardChannel(giveawayId);
            
            res.json({
                success: true,
                message: 'Auto-Leaderboard-Channel erfolgreich gelöscht'
            });

        } catch (error) {
            console.error('Fehler beim Löschen des Auto-Leaderboard-Channels:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Test: Auto-Leaderboard Channels erstellen/aktualisieren
    app.post('/api/giveaway/test-auto-leaderboard', async (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }

            // Führe Auto-Leaderboard-Posting aus (erstellt/aktualisiert Channels)
            await giveawaySystem.postAutoLeaderboard();

            // Zähle aktive Auto-Leaderboard-Channels
            const activeInviteGiveaways = Array.from(giveawaySystem.giveaways.values())
                .filter(g => g.status === 'active' && g.type === 'invite' && g.autoLeaderboardChannelId);

            res.json({
                success: true,
                count: activeInviteGiveaways.length,
                message: `${activeInviteGiveaways.length} Auto-Leaderboard-Channel(s) erstellt/aktualisiert`
            });

        } catch (error) {
            console.error('Fehler beim Erstellen der Auto-Leaderboard-Channels:', error);
            res.status(500).json({ error: error.message || 'Fehler beim Erstellen der Auto-Leaderboard-Channels' });
        }
    });

    // Timer neu starten (bei Intervall-Änderung)
    app.post('/api/giveaway/restart-timer', async (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }

            giveawaySystem.restartLeaderboardTimer();
            
            res.json({
                success: true,
                message: `Timer neu gestartet mit ${giveawaySystem.settings.leaderboard?.updateInterval || 30}s Intervall`
            });

        } catch (error) {
            console.error('Fehler beim Neustarten des Timers:', error);
            res.status(500).json({ error: error.message || 'Fehler beim Neustarten des Timers' });
        }
    });

    // Verfügbare Kategorien abrufen
    app.get('/api/giveaway/categories', async (req, res) => {
        try {
            const guild = client.guilds.cache.first();
            if (!guild) {
                return res.status(400).json({ error: 'Server nicht gefunden' });
            }

            const categories = guild.channels.cache
                .filter(channel => channel.type === 4) // Nur Kategorien
                .map(category => ({
                    id: category.id,
                    name: category.name
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            res.json({
                success: true,
                categories: categories
            });

        } catch (error) {
            console.error('Fehler beim Laden der Kategorien:', error);
            res.status(500).json({ error: error.message || 'Fehler beim Laden der Kategorien' });
        }
    });

    // Debug: User-Details für Debugging
    app.get('/api/giveaway/debug-user/:userId', async (req, res) => {
        try {
            const giveawaySystem = client.giveawaySystem;
            if (!giveawaySystem) {
                return res.status(503).json({ error: 'Giveaway-System noch nicht initialisiert' });
            }

            const userId = req.params.userId;
            await giveawaySystem.debugUser(userId);
            
            res.json({
                success: true,
                message: `Debug-Informationen für User ${userId} in Console ausgegeben`
            });

        } catch (error) {
            console.error('Fehler beim User-Debug:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Discord Channels abrufen
    app.get('/api/discord/channels', (req, res) => {
        try {
            const guild = client.guilds.cache.first();
            if (!guild) {
                return res.status(500).json({ error: 'Server nicht gefunden' });
            }

            const channels = guild.channels.cache
                .filter(channel => channel.type === 0) // Text channels only
                .map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    guildId: guild.id,
                    guildName: guild.name
                }));

            res.json({ channels });
        } catch (error) {
            console.error('Fehler beim Laden der Channels:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Channels' });
        }
    });

    // Discord Rollen abrufen
    app.get('/api/discord/roles', (req, res) => {
        try {
            const guild = client.guilds.cache.first();
            if (!guild) {
                return res.status(500).json({ error: 'Server nicht gefunden' });
            }

            const roles = guild.roles.cache
                .filter(role => !role.managed && role.name !== '@everyone') // Exclude managed roles and @everyone
                .map(role => ({
                    id: role.id,
                    name: role.name,
                    color: role.hexColor,
                    guildId: guild.id,
                    guildName: guild.name
                }));

            res.json({ roles });
        } catch (error) {
            console.error('Fehler beim Laden der Rollen:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Rollen' });
        }
    });

    console.log('✅ Giveaway API-Endpoints registriert');
}

module.exports = { registerGiveawayAPI }; 