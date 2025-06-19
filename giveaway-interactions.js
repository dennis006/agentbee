const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class GiveawayInteractions {
    constructor(client) {
        this.client = client;
        this.giveawaySystem = null;
        
        // Event-Listener für Button-Interaktionen
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;
            
            if (interaction.customId.startsWith('giveaway_')) {
                await this.handleGiveawayInteraction(interaction);
            }
        });
    }

    setGiveawaySystem(giveawaySystem) {
        this.giveawaySystem = giveawaySystem;
    }

    async handleGiveawayInteraction(interaction) {
        if (!this.giveawaySystem) {
            return await interaction.reply({ 
                content: '❌ Giveaway-System nicht verfügbar!', 
                flags: 64 // ephemeral
            });
        }

        // Button-ID parsen: giveaway_join_gw_123... oder giveaway_invite_stats_gw_123...
        const customId = interaction.customId;
        
        if (!customId.startsWith('giveaway_')) return;

        let subAction, giveawayId, targetUserId;
        
        // Entferne "giveaway_" am Anfang
        const withoutPrefix = customId.substring(9); // "giveaway_".length = 9
        
        // Check für copy_invite Action (spezieller Fall)
        if (withoutPrefix.startsWith('copy_invite_')) {
            // Format: copy_invite_gw_123_456_userId
            // Wir müssen rückwärts parsen da die Giveaway-ID Unterstriche enthalten kann
            const parts = withoutPrefix.split('_');
            if (parts.length >= 3) {
                targetUserId = parts[parts.length - 1]; // Letzte Komponente ist User-ID
                subAction = 'copy_invite';
                // Alles zwischen "copy_invite_" und "_userId" ist die Giveaway-ID
                const startIndex = 'copy_invite_'.length;
                const endIndex = withoutPrefix.lastIndexOf('_' + targetUserId);
                giveawayId = withoutPrefix.substring(startIndex, endIndex);
            } else {
                console.error('❌ Ungültiges copy_invite Format:', customId);
                return await interaction.reply({ 
                    content: '❌ Ungültige Button-ID!', 
                    flags: 64 // ephemeral
                });
            }
        } else {
            // Normale Aktionen
            const actions = ['join', 'invite_stats', 'stats'];
            
            let actionFound = false;
            for (const action of actions) {
                if (withoutPrefix.startsWith(action + '_')) {
                    subAction = action;
                    giveawayId = withoutPrefix.substring(action.length + 1); // +1 für den Unterstrich
                    actionFound = true;
                    break;
                }
            }
            
            if (!actionFound) {
                console.error('❌ Unbekanntes Button-ID Format:', customId);
                return await interaction.reply({ 
                    content: '❌ Ungültige Button-ID!', 
                    flags: 64 // ephemeral
                });
            }
        }

        console.log(`🔍 Suche Giveaway mit ID: ${giveawayId}`);
        console.log(`📋 Verfügbare Giveaways:`, Array.from(this.giveawaySystem.giveaways.keys()));

        const giveaway = this.giveawaySystem.giveaways.get(giveawayId);
        if (!giveaway) {
            return await interaction.reply({ 
                content: `❌ Giveaway nicht gefunden! (ID: ${giveawayId})`, 
                flags: 64 // ephemeral
            });
        }

        if (giveaway.status !== 'active') {
            return await interaction.reply({ 
                content: '❌ Dieses Giveaway ist nicht mehr aktiv!', 
                flags: 64 // ephemeral
            });
        }

        switch (subAction) {
            case 'copy_invite':
                await this.handleCopyInvite(interaction, giveaway, targetUserId);
                break;
            case 'join':
                await this.handleJoinGiveaway(interaction, giveaway);
                break;
            case 'invite':
                if (giveaway.type === 'invite') {
                    await this.handleInviteGiveaway(interaction, giveaway);
                } else {
                    await this.handleJoinGiveaway(interaction, giveaway);
                }
                break;
            case 'invite_stats':
                await this.handleInviteStats(interaction, giveaway);
                break;
            case 'stats':
                await this.handleInviteStats(interaction, giveaway);
                break;
            default:
                console.error(`❌ Unbekannte Aktion: ${subAction}`);
                await interaction.reply({ 
                    content: `❌ Unbekannte Aktion: ${subAction}`, 
                    flags: 64 // ephemeral
                });
        }
    }

    async handleJoinGiveaway(interaction, giveaway) {
        const userId = interaction.user.id;

        // Anti-Cheat Prüfungen
        if (!await this.isUserEligible(interaction.user, giveaway)) {
            return await interaction.reply({ 
                content: '❌ Du erfüllst die Anforderungen für dieses Giveaway nicht!', 
                flags: 64 // ephemeral
            });
        }

        if (giveaway.participants.has(userId)) {
            if (giveaway.type === 'invite') {
                // Bei Invite-Giveaways: Invite-Link anzeigen statt Fehler
                await this.showInviteLink(interaction, giveaway, userId);
            } else {
                return await interaction.reply({ 
                    content: '❌ Du nimmst bereits an diesem Giveaway teil!', 
                    flags: 64 // ephemeral
                });
            }
            return;
        }

        // User zur Teilnehmerliste hinzufügen
        giveaway.participants.add(userId);
        this.giveawaySystem.saveData();

        // User-Tracking für globale Statistiken
        const userTracking = this.giveawaySystem.inviteTracking.get(userId) || {
            totalInvites: 0,
            codes: [],
            username: interaction.user.username
        };
        userTracking.username = interaction.user.username;
        this.giveawaySystem.inviteTracking.set(userId, userTracking);

        if (giveaway.type === 'invite') {
            // Für Invite-Giveaways: Invite-Link erstellen und anzeigen
            await this.createAndShowInviteLink(interaction, giveaway, userId);
        } else {
            // Normale Giveaway-Teilnahme
            await interaction.reply({ 
                content: '✅ Du nimmst jetzt am Giveaway teil! ��', 
                flags: 64 // ephemeral
            });
        }

        // Giveaway-Embed aktualisieren
        await this.giveawaySystem.updateGiveawayEmbed(giveaway.id);
    }

    async handleInviteGiveaway(interaction, giveaway) {
        const userId = interaction.user.id;

        if (!giveaway.participants.has(userId)) {
            return await interaction.reply({ 
                content: '❌ Du musst zuerst am Giveaway teilnehmen!', 
                flags: 64 // ephemeral
            });
        }

        await this.showInviteLink(interaction, giveaway, userId);
    }

    async createAndShowInviteLink(interaction, giveaway, userId) {
        try {
            // Prüfe ob User bereits Invite-Links hat
            const userTracking = this.giveawaySystem.inviteTracking.get(userId) || { codes: [] };
            const existingCodes = userTracking.codes.filter(code => {
                const tracking = this.giveawaySystem.inviteCodeTracking.get(code);
                return tracking && tracking.giveawayId === giveaway.id;
            });

            let invite;
            if (existingCodes.length === 0) {
                // Erstelle neuen Invite-Link
                invite = await this.giveawaySystem.createPersonalInviteLink(userId, giveaway.id);
            } else {
                // Verwende existierenden Link
                const code = existingCodes[0];
                const guild = this.client.guilds.cache.first();
                const invites = await guild.invites.fetch();
                invite = invites.get(code);
            }

            if (!invite) {
                throw new Error('Invite-Link konnte nicht erstellt werden');
            }

            await this.sendInviteEmbed(interaction, giveaway, invite, userId);

        } catch (error) {
            console.error('❌ Fehler beim Erstellen des Invite-Links:', error);
            await interaction.reply({ 
                content: `❌ Fehler beim Erstellen des Invite-Links: ${error.message}\n\nBitte versuche es in ein paar Minuten erneut oder kontaktiere einen Administrator.`, 
                flags: 64 // ephemeral
            });
            return; // Wichtig: Funktion hier beenden, kein Embed senden
        }
    }

    async showInviteLink(interaction, giveaway, userId) {
        try {
            // Lade existierende Invite-Links
            const userTracking = this.giveawaySystem.inviteTracking.get(userId) || { codes: [] };
            const existingCodes = userTracking.codes.filter(code => {
                const tracking = this.giveawaySystem.inviteCodeTracking.get(code);
                return tracking && tracking.giveawayId === giveaway.id;
            });

            if (existingCodes.length === 0) {
                // Erstelle neuen Link falls keiner existiert
                await this.createAndShowInviteLink(interaction, giveaway, userId);
                return;
            }

            // Zeige existierenden Link
            const code = existingCodes[0];
            const guild = this.client.guilds.cache.first();
            const invites = await guild.invites.fetch();
            const invite = invites.get(code);

            if (invite) {
                await this.sendInviteEmbed(interaction, giveaway, invite, userId);
            } else {
                // Link existiert nicht mehr, erstelle neuen
                await this.createAndShowInviteLink(interaction, giveaway, userId);
            }

        } catch (error) {
            console.error('❌ Fehler beim Anzeigen des Invite-Links:', error);
            await interaction.reply({ 
                content: `❌ Fehler beim Laden deines Invite-Links: ${error.message}\n\nBitte versuche es in ein paar Minuten erneut.`, 
                flags: 64 // ephemeral
            });
            return; // Wichtig: Funktion hier beenden
        }
    }

    async sendInviteEmbed(interaction, giveaway, invite, userId) {
        // Validiere den Invite-Link
        if (!invite || !invite.url) {
            await interaction.reply({ 
                content: '❌ Ungültiger Invite-Link! Bitte versuche es erneut.', 
                flags: 64 // ephemeral
            });
            return;
        }

        const giveawayInvites = this.giveawaySystem.userInvites.get(giveaway.id) || new Map();
        const userInviteCount = giveawayInvites.get(userId) || 0;
        const leaderboard = this.giveawaySystem.getInviteLeaderboard(giveaway.id);
        const userRank = leaderboard.findIndex(entry => entry.userId === userId) + 1;

        const embed = new EmbedBuilder()
            .setTitle('📨 Dein persönlicher Invite-Link')
            .setDescription(`**${giveaway.title}**\n\nTeile diesen Link, um Punkte zu sammeln!`)
            .setColor(0x00FF7F)
            .addFields([
                {
                    name: '🔗 Invite-Link',
                    value: `\`\`\`\n${invite.url}\n\`\`\`\n💡 Klicke auf "📋 Link kopieren" um ihn einfach zu kopieren!`,
                    inline: false
                },
                {
                    name: '📊 Deine Statistiken',
                    value: `**Einladungen:** ${userInviteCount}\n**Rang:** ${userRank > 0 ? `#${userRank}` : 'Nicht gerankt'}\n**Gesamt Teilnehmer:** ${leaderboard.length}`,
                    inline: true
                },
                {
                    name: '⏰ Gültig bis',
                    value: `<t:${Math.floor(giveaway.endTime / 1000)}:R>`,
                    inline: true
                }
            ])
            .setFooter({ text: 'Teile den Link in anderen Servern oder mit Freunden!' })
            .setTimestamp();

        // Leaderboard hinzufügen wenn vorhanden
        if (leaderboard.length > 0) {
            const topUsers = leaderboard.slice(0, 3).map((entry, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                return `${medal} <@${entry.userId}>: **${entry.invites}** Einladungen`;
            }).join('\n');

            embed.addFields({
                name: '🏆 Top 3 Einlader',
                value: topUsers,
                inline: false
            });
        }

        const components = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`giveaway_copy_invite_${giveaway.id}_${userId}`)
                    .setLabel('📋 Link kopieren')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`giveaway_invite_stats_${giveaway.id}`)
                    .setLabel('📊 Ausführliche Stats')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ 
            embeds: [embed], 
            components: [components], 
            flags: 64 // ephemeral
        });
    }

    async handleCopyInvite(interaction, giveaway, targetUserId) {
        const userId = interaction.user.id;

        // Nur der Besitzer des Links oder Admins können ihn kopieren
        if (userId !== targetUserId) {
            return await interaction.reply({ 
                content: '❌ Du kannst nur deine eigenen Invite-Links kopieren!', 
                flags: 64 // ephemeral
            });
        }

        if (!giveaway.participants.has(userId)) {
            return await interaction.reply({ 
                content: '❌ Du musst zuerst am Giveaway teilnehmen!', 
                flags: 64 // ephemeral
            });
        }

        try {
            // Lade existierende Invite-Links
            const userTracking = this.giveawaySystem.inviteTracking.get(userId) || { codes: [] };
            const existingCodes = userTracking.codes.filter(code => {
                const tracking = this.giveawaySystem.inviteCodeTracking.get(code);
                return tracking && tracking.giveawayId === giveaway.id;
            });

            if (existingCodes.length === 0) {
                return await interaction.reply({ 
                    content: '❌ Du hast noch keinen Invite-Link für dieses Giveaway! Klicke zuerst auf "Teilnehmen".', 
                    flags: 64 // ephemeral
                });
            }

            // Verwende den ersten aktiven Link
            const code = existingCodes[0];
            const inviteUrl = `https://discord.gg/${code}`;

            // Sende den Link als Text-Nachricht zum einfachen Kopieren
            await interaction.reply({ 
                content: `📋 **Dein Invite-Link:**\n\`\`\`\n${inviteUrl}\n\`\`\`\n\n🔗 Einfach den Link markieren und kopieren (Strg+C)!\n\n💡 **Tipp:** Teile diesen Link in anderen Discord-Servern oder mit Freunden, um Punkte für das Giveaway zu sammeln!`, 
                flags: 64 // ephemeral
            });

        } catch (error) {
            console.error('❌ Fehler beim Kopieren des Invite-Links:', error);
            await interaction.reply({ 
                content: `❌ Fehler beim Laden deines Invite-Links: ${error.message}`, 
                flags: 64 // ephemeral
            });
        }
    }

    async handleInviteStats(interaction, giveaway) {
        const userId = interaction.user.id;

        if (!giveaway.participants.has(userId)) {
            return await interaction.reply({ 
                content: '❌ Du musst zuerst am Giveaway teilnehmen!', 
                flags: 64 // ephemeral
            });
        }

        const userTracking = this.giveawaySystem.inviteTracking.get(userId) || { 
            totalInvites: 0, 
            codes: [], 
            username: interaction.user.username 
        };

        const giveawayInvites = this.giveawaySystem.userInvites.get(giveaway.id) || new Map();
        const userInviteCount = giveawayInvites.get(userId) || 0;
        const leaderboard = this.giveawaySystem.getInviteLeaderboard(giveaway.id);
        const userRank = leaderboard.findIndex(entry => entry.userId === userId) + 1;

        // User's aktive Codes für dieses Giveaway
        const activeCodes = userTracking.codes.filter(code => {
            const tracking = this.giveawaySystem.inviteCodeTracking.get(code);
            return tracking && tracking.giveawayId === giveaway.id;
        });

        const embed = new EmbedBuilder()
            .setTitle('📊 Deine Invite-Statistiken')
            .setDescription(`**${giveaway.title}**`)
            .setColor(0x3498DB)
            .addFields([
                {
                    name: '🎯 Giveaway-Statistiken',
                    value: `**Einladungen für dieses Giveaway:** ${userInviteCount}\n**Dein Rang:** ${userRank > 0 ? `#${userRank} von ${leaderboard.length}` : 'Nicht gerankt'}\n**Aktive Invite-Links:** ${activeCodes.length}`,
                    inline: false
                },
                {
                    name: '🌍 Globale Statistiken',
                    value: `**Gesamt-Einladungen (alle Giveaways):** ${userTracking.totalInvites}\n**Erstellte Invite-Links:** ${userTracking.codes.length}`,
                    inline: false
                }
            ])
            .setFooter({ text: 'Lade mehr Leute ein um deine Gewinnchancen zu erhöhen!' })
            .setTimestamp();

        // Mindest-Einladungen Info
        if (giveaway.requirements?.minInvites > 0) {
            const remaining = Math.max(0, giveaway.requirements.minInvites - userInviteCount);
            embed.addFields({
                name: '📋 Teilnahme-Anforderung',
                value: `**Mindest-Einladungen:** ${giveaway.requirements.minInvites}\n**Noch benötigt:** ${remaining > 0 ? remaining : '✅ Erfüllt!'}`,
                inline: false
            });
        }

        // Top 10 Leaderboard
        if (leaderboard.length > 0) {
            const topList = leaderboard.slice(0, 10).map((entry, index) => {
                const position = index + 1;
                const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
                const isCurrentUser = entry.userId === userId ? ' **(Du)**' : '';
                return `${medal} <@${entry.userId}>: **${entry.invites}** Einladungen${isCurrentUser}`;
            }).join('\n');

            embed.addFields({
                name: '🏆 Leaderboard (Top 10)',
                value: topList,
                inline: false
            });
        }

        const components = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`giveaway_join_${giveaway.id}`)
                    .setLabel('🔗 Invite-Link anzeigen')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel('🔄 Aktualisieren')
                    .setCustomId(`giveaway_invite_stats_${giveaway.id}`)
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ 
            embeds: [embed], 
            components: [components], 
            flags: 64 // ephemeral
        });
    }

    async isUserEligible(user, giveaway) {
        // Anti-Cheat und Anforderungen prüfen
        
        // 1. Bot-Account prüfen
        if (user.bot && giveaway.requirements?.preventBots) {
            return false;
        }

        // 2. Account-Alter prüfen
        const accountAge = Date.now() - user.createdTimestamp;
        if (giveaway.requirements?.minAccountAge && accountAge < giveaway.requirements.minAccountAge) {
            return false;
        }

        // 3. Blacklist prüfen
        if (giveaway.requirements?.blacklist && giveaway.requirements.blacklist.length > 0) {
            const isBlacklisted = giveaway.requirements.blacklist.some(entry => 
                entry === user.id || entry === `@${user.username}` || entry === user.username
            );
            if (isBlacklisted) {
                return false;
            }
        }

        // 4. Whitelist prüfen (wenn gesetzt, sind nur diese User erlaubt)
        if (giveaway.requirements?.whitelist && giveaway.requirements.whitelist.length > 0) {
            const isWhitelisted = giveaway.requirements.whitelist.some(entry => 
                entry === user.id || entry === `@${user.username}` || entry === user.username
            );
            if (!isWhitelisted) {
                return false;
            }
        }

        // 5. Discord-spezifische Anforderungen prüfen
        if (giveaway.requirements?.requiresAvatar && (!user.avatar || user.avatar === user.defaultAvatarURL)) {
            return false;
        }

        // 6. Server-Mitgliedschaft und weitere Prüfungen
            const guild = this.client.guilds.cache.first();
            if (guild) {
                const member = guild.members.cache.get(user.id);
            if (!member && giveaway.requirements?.checkMembership) {
                return false;
            }

            if (member) {
                // 6a. Server-Mitgliedschaftsdauer prüfen
                if (giveaway.requirements?.minServerAge > 0) {
                    const serverAge = Date.now() - member.joinedTimestamp;
                    if (serverAge < giveaway.requirements.minServerAge) {
                    return false;
                    }
                }

                // 6b. Erforderliche Rollen prüfen
                if (giveaway.requirements?.requiredRoles && giveaway.requirements.requiredRoles.length > 0) {
                    const hasRequiredRole = giveaway.requirements.requiredRoles.some(roleId => 
                        member.roles.cache.has(roleId)
                    );
                    if (!hasRequiredRole) {
                        return false;
                    }
                }

                // 6c. Gesperrte Rollen prüfen
                if (giveaway.requirements?.blockedRoles && giveaway.requirements.blockedRoles.length > 0) {
                    const hasBlockedRole = giveaway.requirements.blockedRoles.some(roleId => 
                        member.roles.cache.has(roleId)
                    );
                    if (hasBlockedRole) {
                        return false;
            }
        }

                // 6d. Nitro-Prüfung (approximativ über Rollen oder Premium)
                if (giveaway.requirements?.requiresNitro) {
                    const hasNitroRole = member.roles.cache.some(role => 
                        role.name.toLowerCase().includes('nitro') || 
                        role.name.toLowerCase().includes('boost')
                    );
                    if (!hasNitroRole && !member.premiumSince) {
                        return false;
                    }
                }

                // 6e. 2FA-Prüfung (nur möglich wenn Server MFA Level gesetzt ist)
                if (giveaway.requirements?.requires2FA && guild.mfaLevel === 0) {
                    // Kann nicht sicher geprüft werden, daher erlauben
                    // return false;
                }
            }
        }

        // 7. XP-System Prüfungen (falls verfügbar)
        if (this.client.xpSystem) {
            // 7a. Mindest-Level prüfen
            if (giveaway.requirements?.minLevel > 0) {
                const userLevel = this.client.xpSystem.getUserLevel(user.id);
                if (userLevel < giveaway.requirements.minLevel) {
                    return false;
                }
            }

            // 7b. Mindest-XP prüfen
            if (giveaway.requirements?.minXP > 0) {
            const userXP = this.client.xpSystem.getUserXP(user.id);
            if (userXP < giveaway.requirements.minXP) {
                return false;
            }
        }

            // 7c. Mindest-Nachrichten prüfen
            if (giveaway.requirements?.minMessages > 0) {
                const userMessages = this.client.xpSystem.getUserMessages(user.id);
                if (userMessages < giveaway.requirements.minMessages) {
                    return false;
                }
            }

            // 7d. Mindest-Voice-Zeit prüfen  
            if (giveaway.requirements?.minVoiceTime > 0) {
                const userVoiceTime = this.client.xpSystem.getUserVoiceTime(user.id); // in Minuten
                if (userVoiceTime < giveaway.requirements.minVoiceTime) {
                    return false;
                }
            }
        }

        // 8. Invite-Anforderungen prüfen (für Invite-Giveaways)
        if (giveaway.type === 'invite' && giveaway.requirements?.minInvites > 0) {
            const giveawayInvites = this.giveawaySystem.userInvites.get(giveaway.id) || new Map();
            const userInviteCount = giveawayInvites.get(user.id) || 0;
            if (userInviteCount < giveaway.requirements.minInvites) {
                // Für Invite-Giveaways: Erlaube Teilnahme auch ohne Mindest-Einladungen
                // Die Mindest-Einladungen werden nur beim Gewinnen geprüft
                return true;
            }
        }

        return true;
    }
}

module.exports = GiveawayInteractions; 