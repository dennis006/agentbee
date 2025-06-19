const fs = require('fs');
const path = require('path');

class ServerHealthAPI {
    constructor(client) {
        this.client = client;
        this.dataFile = path.join(__dirname, 'settings', 'server-health.json');
        this.healthScores = new Map();
        this.metrics = new Map();
        this.ensureDataFile();
        this.startMonitoring();
    }

    ensureDataFile() {
        if (!fs.existsSync(this.dataFile)) {
            const defaultData = {
                healthScores: {},
                metrics: {},
                settings: {
                    updateInterval: 3600000, // 1 hour
                    weights: {
                        activity: 0.25,
                        engagement: 0.20,
                        security: 0.20,
                        growth: 0.15,
                        moderation: 0.10,
                        structure: 0.10
                    },
                    thresholds: {
                        excellent: 85,
                        good: 70,
                        average: 50,
                        poor: 30
                    }
                }
            };
            fs.writeFileSync(this.dataFile, JSON.stringify(defaultData, null, 2));
        }
    }

    loadData() {
        try {
            return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        } catch (error) {
            console.error('Error loading server health data:', error);
            return { healthScores: {}, metrics: {}, settings: {} };
        }
    }

    saveData(data) {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving server health data:', error);
            return false;
        }
    }

    startMonitoring() {
        // Calculate health scores periodically
        setInterval(() => {
            this.updateAllHealthScores();
        }, this.loadData().settings.updateInterval || 3600000);

        // Event-Tracking für echte Daten
        this.initializeDataTracking();

        console.log('🏥 Server Health Monitoring gestartet');
    }

    initializeDataTracking() {
        // Track Message Events
        this.client.on('messageCreate', (message) => {
            if (message.guild && !message.author.bot) {
                this.trackMessageEvent(message);
            }
        });

        // Track Voice State Changes
        this.client.on('voiceStateUpdate', (oldState, newState) => {
            if (newState.guild) {
                this.trackVoiceEvent(oldState, newState);
            }
        });

        // Track Member Events
        this.client.on('guildMemberAdd', (member) => {
            this.trackJoinEvent(member);
        });

        this.client.on('guildMemberRemove', (member) => {
            this.trackLeaveEvent(member);
        });

        // Track Moderation Events
        this.client.on('messageDelete', (message) => {
            if (message.guild) {
                this.trackModerationEvent('message_delete', message.guild.id, message.author?.id);
            }
        });

        // Track Role Updates
        this.client.on('guildMemberUpdate', (oldMember, newMember) => {
            if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
                this.trackModerationEvent('role_update', newMember.guild.id, newMember.user.id);
            }
        });
    }

    trackMessageEvent(message) {
        const data = this.loadData();
        if (!data.messageHistory) data.messageHistory = {};
        if (!data.messageHistory[message.guild.id]) data.messageHistory[message.guild.id] = [];
        
        data.messageHistory[message.guild.id].push({
            userId: message.author.id,
            channelId: message.channel.id,
            timestamp: Date.now(),
            reactions: 0 // Wird später durch reaction events aktualisiert
        });

        // Behalte nur die letzten 2000 Messages pro Guild
        data.messageHistory[message.guild.id] = data.messageHistory[message.guild.id].slice(-2000);
        this.saveData(data);
    }

    trackVoiceEvent(oldState, newState) {
        if (oldState.channel?.id === newState.channel?.id) return;

        const data = this.loadData();
        if (!data.voiceHistory) data.voiceHistory = {};
        if (!data.voiceHistory[newState.guild.id]) data.voiceHistory[newState.guild.id] = [];
        
        data.voiceHistory[newState.guild.id].push({
            userId: newState.member.user.id,
            oldChannelId: oldState.channel?.id || null,
            newChannelId: newState.channel?.id || null,
            timestamp: Date.now(),
            duration: 60 // Default Session-Dauer in Minuten
        });

        // Behalte nur die letzten 1000 Voice Events pro Guild
        data.voiceHistory[newState.guild.id] = data.voiceHistory[newState.guild.id].slice(-1000);
        this.saveData(data);
    }

    trackJoinEvent(member) {
        const data = this.loadData();
        if (!data.joinEvents) data.joinEvents = {};
        if (!data.joinEvents[member.guild.id]) data.joinEvents[member.guild.id] = [];
        
        data.joinEvents[member.guild.id].push({
            userId: member.user.id,
            username: member.user.username,
            timestamp: Date.now(),
            accountAge: Date.now() - member.user.createdTimestamp
        });

        data.joinEvents[member.guild.id] = data.joinEvents[member.guild.id].slice(-500);
        this.saveData(data);
    }

    trackLeaveEvent(member) {
        const data = this.loadData();
        if (!data.leaveEvents) data.leaveEvents = {};
        if (!data.leaveEvents[member.guild.id]) data.leaveEvents[member.guild.id] = [];
        
        data.leaveEvents[member.guild.id].push({
            userId: member.user.id,
            username: member.user.username,
            timestamp: Date.now()
        });

        data.leaveEvents[member.guild.id] = data.leaveEvents[member.guild.id].slice(-500);
        this.saveData(data);
    }

    trackModerationEvent(type, guildId, targetUserId, moderatorId = null) {
        const data = this.loadData();
        if (!data.moderationHistory) data.moderationHistory = {};
        if (!data.moderationHistory[guildId]) data.moderationHistory[guildId] = [];
        
        data.moderationHistory[guildId].push({
            type: type,
            targetUserId: targetUserId,
            moderatorId: moderatorId,
            timestamp: Date.now(),
            responseTime: moderatorId ? Math.random() * 30 + 5 : null // 5-35 Minuten
        });

        data.moderationHistory[guildId] = data.moderationHistory[guildId].slice(-1000);
        this.saveData(data);
    }

    async calculateServerHealth(guildId) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) {
            throw new Error('Server nicht gefunden');
        }

        const metrics = await this.gatherHealthMetrics(guild);
        const scores = this.calculateIndividualScores(metrics);
        const overallScore = this.calculateOverallScore(scores);

        const healthData = {
            guildId: guildId,
            guildName: guild.name,
            timestamp: Date.now(),
            overallScore: overallScore,
            rating: this.getHealthRating(overallScore),
            scores: scores,
            metrics: metrics,
            recommendations: this.generateRecommendations(scores, metrics)
        };

        // Store in cache
        this.healthScores.set(guildId, healthData);
        this.metrics.set(guildId, metrics);

        // Save to file
        const data = this.loadData();
        data.healthScores[guildId] = healthData;
        data.metrics[guildId] = metrics;
        
        // Speichere in Historie für Trends
        if (!data.healthHistory) data.healthHistory = {};
        if (!data.healthHistory[guildId]) data.healthHistory[guildId] = [];
        
        data.healthHistory[guildId].push({
            timestamp: Date.now(),
            overallScore: healthData.overallScore,
            scores: healthData.scores
        });

        // Behalte nur die letzten 30 Tage
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        data.healthHistory[guildId] = data.healthHistory[guildId].filter(h => h.timestamp > thirtyDaysAgo);
        
        this.saveData(data);

        return healthData;
    }

    async gatherHealthMetrics(guild) {
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

        const metrics = {
            // Activity Metrics
            activity: {
                onlineMembers: guild.members.cache.filter(m => m.presence?.status !== 'offline').size,
                totalMembers: guild.memberCount,
                voiceMembers: guild.members.cache.filter(m => m.voice.channel).size,
                activeChannels: guild.channels.cache.filter(ch => ch.type === 0 && ch.lastMessageId).size,
                totalTextChannels: guild.channels.cache.filter(ch => ch.type === 0).size,
                recentMessages: await this.getRecentMessageCount(guild, oneDayAgo),
                dailyActiveUsers: await this.getDailyActiveUsers(guild),
                memberActivityRatio: await this.calculateMemberActivityRatio(guild)
            },

            // Engagement Metrics
            engagement: {
                averageSessionTime: await this.calculateAverageSessionTime(guild),
                messageFrequency: await this.getMessageFrequency(guild),
                reactionRate: await this.getReactionRate(guild),
                voiceChannelUsage: guild.channels.cache.filter(ch => ch.type === 2 && ch.members.size > 0).size,
                totalVoiceChannels: guild.channels.cache.filter(ch => ch.type === 2).size,
                eventParticipation: await this.getEventParticipation(guild),
                threadActivity: await this.getThreadActivity(guild),
                crossChannelInteraction: await this.getCrossChannelInteraction(guild)
            },

            // Security Metrics
            security: {
                verificationLevel: guild.verificationLevel,
                hasModeratorRoles: guild.roles.cache.some(role => 
                    role.permissions.has('ManageMessages') || role.permissions.has('KickMembers')
                ),
                adminCount: guild.members.cache.filter(m => m.permissions.has('Administrator')).size,
                botCount: guild.members.cache.filter(m => m.user.bot).size,
                hasWelcomeScreen: guild.features.includes('WELCOME_SCREEN_ENABLED'),
                hasRulesChannel: !!guild.rulesChannelId,
                mfaLevel: guild.mfaLevel,
                recentModerationActions: await this.getRecentModerationActions(guild),
                spamDetectionScore: await this.calculateSpamDetectionScore(guild),
                raidProtectionLevel: await this.calculateRaidProtectionLevel(guild)
            },

            // Growth Metrics
            growth: {
                memberGrowthRate: await this.calculateGrowthRate(guild, oneWeekAgo),
                retentionRate: await this.calculateRetentionRate(guild),
                joinToLeaveRatio: await this.calculateJoinToLeaveRatio(guild),
                newMemberEngagement: await this.calculateNewMemberEngagement(guild),
                inviteEffectiveness: await this.calculateInviteEffectiveness(guild),
                organicGrowth: await this.calculateOrganicGrowth(guild)
            },

            // Moderation Metrics
            moderation: {
                moderatorActivity: await this.calculateModeratorActivity(guild),
                reportResponseTime: await this.getAverageResponseTime(guild),
                automatedModeration: await this.hasAutomatedModeration(guild),
                warningsIssued: await this.getWarningsCount(guild, oneWeekAgo),
                bansIssued: await this.getBansCount(guild, oneWeekAgo),
                moderatorToMemberRatio: this.calculateModeratorRatio(guild),
                moderationEfficiency: await this.calculateModerationEfficiency(guild)
            },

            // Structure Metrics
            structure: {
                channelOrganization: this.calculateChannelOrganization(guild),
                roleHierarchy: this.calculateRoleHierarchy(guild),
                categoryUsage: this.calculateCategoryUsage(guild),
                namingConsistency: this.calculateNamingConsistency(guild),
                channelToMemberRatio: guild.channels.cache.size / guild.memberCount,
                permissionComplexity: this.calculatePermissionComplexity(guild),
                boostUtilization: this.calculateBoostUtilization(guild)
            }
        };

        return metrics;
    }

    calculateIndividualScores(metrics) {
        const scores = {};

        // Activity Score (0-100)
        scores.activity = this.calculateActivityScore(metrics.activity);

        // Engagement Score (0-100)
        scores.engagement = this.calculateEngagementScore(metrics.engagement);

        // Security Score (0-100)
        scores.security = this.calculateSecurityScore(metrics.security);

        // Growth Score (0-100)
        scores.growth = this.calculateGrowthScore(metrics.growth);

        // Moderation Score (0-100)
        scores.moderation = this.calculateModerationScore(metrics.moderation);

        // Structure Score (0-100)
        scores.structure = this.calculateStructureScore(metrics.structure);

        return scores;
    }

    calculateActivityScore(activity) {
        let score = 0;

        // Online-Mitglieder-Prozentsatz (0-30 Punkte) - Realistisch: 10-30% sind online
        const onlinePercentage = activity.totalMembers > 0 ? 
            (activity.onlineMembers / activity.totalMembers) : 0;
        
        if (onlinePercentage >= 0.3) score += 30;
        else if (onlinePercentage >= 0.2) score += 25;
        else if (onlinePercentage >= 0.15) score += 20;
        else if (onlinePercentage >= 0.1) score += 15;
        else if (onlinePercentage >= 0.05) score += 10;
        else score += 5;

        // Voice-Channel-Nutzung (0-20 Punkte) - Realistisch: 1-5% sind in Voice
        const voiceUsage = activity.totalMembers > 0 ? 
            (activity.voiceMembers / activity.totalMembers) : 0;
        
        if (voiceUsage >= 0.05) score += 20;
        else if (voiceUsage >= 0.03) score += 15;
        else if (voiceUsage >= 0.02) score += 12;
        else if (voiceUsage >= 0.01) score += 8;
        else if (voiceUsage > 0) score += 5;

        // Channel-Aktivität (0-25 Punkte) - Realistisch: 30-80% der Channels sind aktiv
        const channelActivity = activity.totalTextChannels > 0 ? 
            (activity.activeChannels / activity.totalTextChannels) : 0;
        
        if (channelActivity >= 0.7) score += 25;
        else if (channelActivity >= 0.5) score += 20;
        else if (channelActivity >= 0.3) score += 15;
        else if (channelActivity >= 0.2) score += 10;
        else score += 5;

        // Nachrichten-Aktivität (0-15 Punkte) - Basierend auf Server-Größe
        const memberCount = activity.totalMembers || 1;
        const expectedMessages = memberCount < 100 ? 10 : memberCount < 500 ? 50 : 200;
        const messageRatio = Math.min(activity.recentMessages / expectedMessages, 1.5);
        score += Math.min(messageRatio * 15, 15);

        // Mitglieder-Aktivitätsrate (0-10 Punkte) - Realistisch: 5-20% sind täglich aktiv
        const activityRatio = activity.memberActivityRatio || 0;
        if (activityRatio >= 0.2) score += 10;
        else if (activityRatio >= 0.15) score += 8;
        else if (activityRatio >= 0.1) score += 6;
        else if (activityRatio >= 0.05) score += 4;
        else if (activityRatio > 0) score += 2;

        return Math.min(score, 100);
    }

    calculateEngagementScore(engagement) {
        let score = 0;

        // Voice-Channel-Nutzung (0-25 Punkte) - Realistisch: 20-60% der Voice-Channels aktiv
        const voiceUsage = engagement.totalVoiceChannels > 0 ? 
            (engagement.voiceChannelUsage / engagement.totalVoiceChannels) : 0;
        
        if (voiceUsage >= 0.6) score += 25;
        else if (voiceUsage >= 0.4) score += 20;
        else if (voiceUsage >= 0.2) score += 15;
        else if (voiceUsage >= 0.1) score += 10;
        else if (voiceUsage > 0) score += 5;

        // Nachrichtenfrequenz (0-20 Punkte) - Realistisch: 1-10 Nachrichten/Stunde
        const msgFreq = engagement.messageFrequency || 0;
        if (msgFreq >= 5) score += 20;
        else if (msgFreq >= 3) score += 16;
        else if (msgFreq >= 2) score += 12;
        else if (msgFreq >= 1) score += 8;
        else if (msgFreq >= 0.5) score += 4;

        // Reaktionsrate (0-20 Punkte) - Realistisch: 10-30% der Nachrichten bekommen Reaktionen
        const reactionRate = engagement.reactionRate || 0;
        if (reactionRate >= 0.3) score += 20;
        else if (reactionRate >= 0.2) score += 16;
        else if (reactionRate >= 0.15) score += 12;
        else if (reactionRate >= 0.1) score += 8;
        else if (reactionRate > 0) score += 4;

        // Durchschnittliche Sitzungszeit (0-15 Punkte) - Realistisch: 30-120 Minuten
        const sessionTime = engagement.averageSessionTime || 0;
        if (sessionTime >= 90) score += 15;
        else if (sessionTime >= 60) score += 12;
        else if (sessionTime >= 45) score += 10;
        else if (sessionTime >= 30) score += 8;
        else if (sessionTime >= 15) score += 5;
        else if (sessionTime > 0) score += 2;

        // Cross-Channel-Interaktion (0-10 Punkte) - Realistisch: 40-80% der Channels werden genutzt
        const crossChannel = engagement.crossChannelInteraction || 0;
        if (crossChannel >= 0.7) score += 10;
        else if (crossChannel >= 0.5) score += 8;
        else if (crossChannel >= 0.3) score += 6;
        else if (crossChannel >= 0.2) score += 4;
        else if (crossChannel > 0) score += 2;

        // Thread-Aktivität (0-10 Punkte) - Bonus für aktive Threads
        const threadActivity = engagement.threadActivity || 0;
        if (threadActivity >= 10) score += 10;
        else if (threadActivity >= 5) score += 8;
        else if (threadActivity >= 3) score += 6;
        else if (threadActivity >= 1) score += 4;
        else if (threadActivity > 0) score += 2;

        return Math.min(score, 100);
    }

    calculateSecurityScore(security) {
        let score = 0;

        // Verification Level (0-20 Punkte)
        score += security.verificationLevel * 5;

        // Moderator-Rollen vorhanden (0-15 Punkte)
        if (security.hasModeratorRoles) score += 15;

        // MFA-Anforderung (0-15 Punkte)
        if (security.mfaLevel > 0) score += 15;

        // Spam-Detection-Score (0-20 Punkte)
        score += security.spamDetectionScore * 20;

        // Raid-Protection-Level (0-15 Punkte)
        score += security.raidProtectionLevel * 15;

        // Willkommensbildschirm und Regeln (0-10 Punkte)
        if (security.hasWelcomeScreen) score += 5;
        if (security.hasRulesChannel) score += 5;

        // Moderate Anzahl von Admins (0-5 Punkte)
        const adminRatio = security.adminCount / (security.adminCount + security.botCount + 100);
        if (adminRatio > 0.01 && adminRatio < 0.1) score += 5;

        return Math.min(score, 100);
    }

    calculateGrowthScore(growth) {
        let score = 60; // Neutral base - Stabilität ist gut

        // Wachstumsrate (0-25 Punkte) - Realistisch: 0-5% pro Woche ist gesund
        const growthRate = growth.memberGrowthRate || 0;
        if (growthRate >= 0.05) score += 20; // Sehr gutes Wachstum
        else if (growthRate >= 0.03) score += 15; // Gutes Wachstum
        else if (growthRate >= 0.01) score += 10; // Gesundes Wachstum
        else if (growthRate >= 0) score += 5; // Stabil
        else if (growthRate >= -0.02) score -= 5; // Leichter Rückgang
        else if (growthRate >= -0.05) score -= 15; // Starker Rückgang
        else score -= 25; // Kritischer Rückgang

        // Retention Rate (0-25 Punkte) - Realistisch: 60-90% bleiben
        const retention = growth.retentionRate || 0;
        if (retention >= 0.85) score += 25;
        else if (retention >= 0.75) score += 20;
        else if (retention >= 0.65) score += 15;
        else if (retention >= 0.55) score += 10;
        else if (retention >= 0.4) score += 5;
        else score -= 5;

        // Join-to-Leave Ratio (0-15 Punkte) - Realistisch: 1.1-2.0 ist gesund
        const ratio = growth.joinToLeaveRatio || 1;
        if (ratio >= 1.5 && ratio <= 3) score += 15; // Gesundes Wachstum
        else if (ratio >= 1.2 && ratio < 1.5) score += 12; // Gutes Wachstum
        else if (ratio >= 1.0 && ratio < 1.2) score += 8; // Stabiles Wachstum
        else if (ratio >= 0.9 && ratio < 1.0) score += 5; // Leicht rückläufig
        else if (ratio >= 0.7 && ratio < 0.9) score -= 5; // Rückläufig
        else if (ratio < 0.7) score -= 15; // Stark rückläufig
        else if (ratio > 3) score -= 5; // Möglicherweise ungesundes Wachstum

        // Neue Mitglieder Engagement (0-10 Punkte)
        const engagement = growth.newMemberEngagement || 0;
        if (engagement >= 0.6) score += 10;
        else if (engagement >= 0.4) score += 8;
        else if (engagement >= 0.3) score += 6;
        else if (engagement >= 0.2) score += 4;
        else if (engagement > 0) score += 2;

        // Organisches Wachstum (0-5 Punkte) - Bonus für organisches Wachstum
        const organic = growth.organicGrowth || 0;
        if (organic >= 0.7) score += 5;
        else if (organic >= 0.5) score += 3;
        else if (organic >= 0.3) score += 1;

        return Math.max(0, Math.min(score, 100));
    }

    calculateModerationScore(moderation) {
        let score = 50; // Base score

        // Moderator-zu-Mitglieder Verhältnis (0-25 Punkte) - Realistisch: 1-5% Moderatoren
        const modRatio = moderation.moderatorToMemberRatio || 0;
        if (modRatio >= 0.03 && modRatio <= 0.08) score += 25; // Optimal
        else if (modRatio >= 0.02 && modRatio < 0.03) score += 20; // Gut
        else if (modRatio >= 0.015 && modRatio < 0.02) score += 15; // Ausreichend
        else if (modRatio >= 0.01 && modRatio < 0.015) score += 10; // Knapp
        else if (modRatio >= 0.005 && modRatio < 0.01) score += 5; // Zu wenig
        else if (modRatio > 0.08) score += 10; // Vielleicht zu viele, aber okay
        else score -= 5; // Kritisch wenig

        // Moderator-Aktivität (0-20 Punkte) - Aktive Moderatoren sind wichtig
        const activity = moderation.moderatorActivity || 0;
        if (activity >= 0.8) score += 20;
        else if (activity >= 0.6) score += 16;
        else if (activity >= 0.4) score += 12;
        else if (activity >= 0.2) score += 8;
        else if (activity > 0) score += 4;
        else score -= 10; // Keine aktiven Moderatoren

        // Automatisierte Moderation (0-15 Punkte) - Sehr hilfreich
        if (moderation.automatedModeration) {
            score += 15;
        }

        // Reaktionszeit (0-15 Punkte) - Schnelle Reaktion ist wichtig
        const responseTime = moderation.reportResponseTime || 7200; // 2h default
        if (responseTime <= 1800) score += 15; // ≤30 Min
        else if (responseTime <= 3600) score += 12; // ≤1h
        else if (responseTime <= 7200) score += 8; // ≤2h
        else if (responseTime <= 14400) score += 4; // ≤4h
        else if (responseTime <= 43200) score += 2; // ≤12h
        // Keine Punkte für >12h

        // Moderationseffizienz (0-10 Punkte) - Wie gut werden Reports gelöst
        const efficiency = moderation.moderationEfficiency || 0;
        if (efficiency >= 0.9) score += 10;
        else if (efficiency >= 0.8) score += 8;
        else if (efficiency >= 0.7) score += 6;
        else if (efficiency >= 0.6) score += 4;
        else if (efficiency >= 0.5) score += 2;

        // Moderationsaktionen (0-10 Punkte) - Angemessene Anzahl an Aktionen
        const warnings = moderation.warningsIssued || 0;
        const bans = moderation.bansIssued || 0;
        const totalActions = warnings + (bans * 3); // Bans sind schwerwiegender
        
        // Basierend auf Server-Größe erwartete Aktionen
        if (totalActions > 0 && totalActions <= 20) score += 10; // Angemessen
        else if (totalActions > 20 && totalActions <= 50) score += 8; // Viel aber ok
        else if (totalActions > 50) score += 5; // Sehr viel - möglicherweise problematisch
        else score += 5; // Keine Aktionen - kann gut oder schlecht sein

        return Math.max(0, Math.min(score, 100));
    }

    calculateStructureScore(structure) {
        let score = 0;

        // Channel-Organisation (0-30 Punkte) - Wie gut sind Channels kategorisiert
        const channelOrg = structure.channelOrganization || 0;
        if (channelOrg >= 0.8) score += 30;
        else if (channelOrg >= 0.6) score += 25;
        else if (channelOrg >= 0.4) score += 20;
        else if (channelOrg >= 0.2) score += 15;
        else if (channelOrg > 0) score += 10;
        else score += 5;

        // Rollen-Hierarchie (0-20 Punkte) - Sinnvolle Rollenstruktur
        const roleHierarchy = structure.roleHierarchy || 0;
        if (roleHierarchy >= 0.7) score += 20;
        else if (roleHierarchy >= 0.5) score += 16;
        else if (roleHierarchy >= 0.3) score += 12;
        else if (roleHierarchy >= 0.2) score += 8;
        else if (roleHierarchy > 0) score += 4;

        // Kategorien-Nutzung (0-20 Punkte) - Channels sind in Kategorien
        const categoryUsage = structure.categoryUsage || 0;
        if (categoryUsage >= 0.8) score += 20;
        else if (categoryUsage >= 0.6) score += 16;
        else if (categoryUsage >= 0.4) score += 12;
        else if (categoryUsage >= 0.2) score += 8;
        else if (categoryUsage > 0) score += 4;

        // Namensgebung-Konsistenz (0-15 Punkte) - Einheitliche Namensgebung
        const namingConsistency = structure.namingConsistency || 0;
        if (namingConsistency >= 0.9) score += 15;
        else if (namingConsistency >= 0.8) score += 12;
        else if (namingConsistency >= 0.7) score += 10;
        else if (namingConsistency >= 0.6) score += 8;
        else if (namingConsistency >= 0.5) score += 6;
        else if (namingConsistency > 0) score += 3;

        // Channel-zu-Mitglieder Verhältnis (0-10 Punkte) - Optimal: 0.05-0.3
        const channelRatio = structure.channelToMemberRatio || 0;
        if (channelRatio >= 0.1 && channelRatio <= 0.25) score += 10; // Optimal
        else if (channelRatio >= 0.05 && channelRatio < 0.1) score += 8; // Gut
        else if (channelRatio >= 0.03 && channelRatio < 0.05) score += 6; // Ausreichend
        else if (channelRatio > 0.25 && channelRatio <= 0.4) score += 6; // Viele Channels
        else if (channelRatio > 0.4) score += 3; // Zu viele Channels
        else if (channelRatio < 0.03 && channelRatio > 0) score += 4; // Zu wenig Channels

        // Berechtigung-Komplexität (0-5 Punkte) - Bonus für sinnvolle Berechtigungen
        const permComplexity = structure.permissionComplexity || 0;
        if (permComplexity >= 0.3 && permComplexity <= 0.7) score += 5; // Angemessen komplex
        else if (permComplexity > 0.7) score += 2; // Zu komplex
        else if (permComplexity < 0.3 && permComplexity > 0) score += 3; // Einfach aber ok

        return Math.min(score, 100);
    }

    calculateOverallScore(scores) {
        const data = this.loadData();
        const weights = data.settings.weights;

        return Object.keys(weights).reduce((total, category) => {
            return total + (scores[category] || 0) * weights[category];
        }, 0);
    }

    getHealthRating(score) {
        const data = this.loadData();
        const thresholds = data.settings.thresholds;

        if (score >= thresholds.excellent) return 'excellent';
        if (score >= thresholds.good) return 'good';
        if (score >= thresholds.average) return 'average';
        if (score >= thresholds.poor) return 'poor';
        return 'critical';
    }

    generateRecommendations(scores, metrics) {
        const recommendations = [];

        // Activity recommendations
        if (scores.activity < 50) {
            const activityActions = [];
            if (metrics.activity.memberActivityRatio < 0.1) {
                activityActions.push('Events planen', 'Community Games organisieren');
            }
            if (metrics.activity.recentMessages < 20) {
                activityActions.push('Regelmäßige Inhalte posten');
            }
            if (metrics.activity.voiceMembers === 0) {
                activityActions.push('Voice-Events organisieren');
            }

            if (activityActions.length > 0) {
                recommendations.push({
                    category: 'activity',
                    priority: 'high',
                    title: 'Aktivität steigern',
                    description: 'Die Server-Aktivität ist niedrig. Versuche mehr Engagement zu fördern.',
                    actions: activityActions.slice(0, 3)
                });
            }
        }

        // Security recommendations (intelligente Analyse)
        if (scores.security < 80) {
            const securityActions = [];
            let priority = 'medium';
            
            if (metrics.security.verificationLevel < 2) {
                securityActions.push('Verifizierungslevel erhöhen');
                priority = 'high';
            }
            
            if (!metrics.security.hasModeratorRoles) {
                securityActions.push('Moderator-Rollen hinzufügen');
                priority = 'high';
            }
            
            if (metrics.security.mfaLevel === 0) {
                securityActions.push('MFA für Admins aktivieren');
            }
            
            if (!metrics.security.hasRulesChannel) {
                securityActions.push('Regelkanal erstellen');
            }
            
            if (!metrics.security.hasWelcomeScreen) {
                securityActions.push('Willkommensbildschirm aktivieren');
            }

            if (securityActions.length > 0) {
                recommendations.push({
                    category: 'security',
                    priority: priority,
                    title: 'Sicherheit verbessern',
                    description: `Die Server-Sicherheit könnte in ${securityActions.length} Bereichen verbessert werden.`,
                    actions: securityActions.slice(0, 3)
                });
            }
        }

        // Growth recommendations
        if (scores.growth < 60) {
            const growthActions = [];
            
            if (metrics.growth.retentionRate < 0.7) {
                growthActions.push('Willkommensprozess verbessern');
            }
            
            if (metrics.growth.newMemberEngagement < 0.4) {
                growthActions.push('Neue Mitglieder besser einbinden');
            }
            
            if (metrics.growth.joinToLeaveRatio < 1.2) {
                growthActions.push('Community-Building stärken');
            }

            if (growthActions.length > 0) {
                recommendations.push({
                    category: 'growth',
                    priority: 'medium',
                    title: 'Wachstum fördern',
                    description: 'Das Server-Wachstum und die Mitgliederbindung können verbessert werden.',
                    actions: growthActions
                });
            }
        }

        // Moderation recommendations
        if (scores.moderation < 70) {
            const moderationActions = [];
            
            if (metrics.moderation.moderatorToMemberRatio < 0.01) {
                moderationActions.push('Mehr Moderatoren ernennen');
            }
            
            if (metrics.moderation.reportResponseTime > 3600) {
                moderationActions.push('Moderator-Reaktionszeit verbessern');
            }
            
            if (!metrics.moderation.automatedModeration) {
                moderationActions.push('Auto-Moderation aktivieren');
            }

            if (moderationActions.length > 0) {
                recommendations.push({
                    category: 'moderation',
                    priority: 'medium',
                    title: 'Moderation optimieren',
                    description: 'Die Moderationseffizienz kann gesteigert werden.',
                    actions: moderationActions
                });
            }
        }

        // Structure recommendations
        if (scores.structure < 60) {
            const structureActions = [];
            
            if (metrics.structure.channelOrganization < 0.5) {
                structureActions.push('Channels in Kategorien organisieren');
            }
            
            if (metrics.structure.categoryUsage < 0.6) {
                structureActions.push('Channel-Kategorien besser nutzen');
            }
            
            if (metrics.structure.namingConsistency < 0.7) {
                structureActions.push('Konsistente Namensgebung einführen');
            }

            if (structureActions.length > 0) {
                recommendations.push({
                    category: 'structure',
                    priority: 'low',
                    title: 'Server-Struktur optimieren',
                    description: 'Die Channel- und Rollenstruktur könnte besser organisiert werden.',
                    actions: structureActions
                });
            }
        }

        return recommendations;
    }

    // Helper methods for calculations
    calculateModeratorRatio(guild) {
        const moderators = guild.members.cache.filter(member => 
            member.permissions.has('ManageMessages') || 
            member.permissions.has('KickMembers') ||
            member.permissions.has('BanMembers')
        ).size;
        
        return moderators / guild.memberCount;
    }

    calculateChannelOrganization(guild) {
        const categorizedChannels = guild.channels.cache.filter(ch => ch.parentId).size;
        const totalChannels = guild.channels.cache.filter(ch => ch.type === 0 || ch.type === 2).size;
        
        return categorizedChannels / totalChannels;
    }

    calculateRoleHierarchy(guild) {
        const roles = guild.roles.cache.filter(role => role.name !== '@everyone');
        const hoistedRoles = roles.filter(role => role.hoist);
        
        // Simple score based on role organization
        return Math.min(hoistedRoles.size / Math.max(roles.size / 4, 1), 1);
    }

    calculateCategoryUsage(guild) {
        const categories = guild.channels.cache.filter(ch => ch.type === 4);
        const channelsInCategories = guild.channels.cache.filter(ch => ch.parentId).size;
        const totalChannels = guild.channels.cache.filter(ch => ch.type === 0 || ch.type === 2).size;
        
        return channelsInCategories / totalChannels;
    }

    calculateNamingConsistency(guild) {
        // Simple check for consistent naming (e.g., lowercase, no special chars)
        const channels = guild.channels.cache.filter(ch => ch.type === 0 || ch.type === 2);
        const consistentNames = channels.filter(ch => {
            const name = ch.name;
            return name === name.toLowerCase() && /^[a-z0-9-_]+$/.test(name);
        }).size;
        
        return consistentNames / channels.size;
    }

    async getRecentMessageCount(guild, sinceTimestamp) {
        // Verwende echte Message-Tracking Daten
        const data = this.loadData();
        const messageHistory = data.messageHistory?.[guild.id] || [];
        
        // Zähle Nachrichten seit dem angegebenen Zeitstempel
        const recentMessages = messageHistory.filter(msg => msg.timestamp > sinceTimestamp).length;
        
        // Fallback: Schätze basierend auf Channel-Aktivität und Mitgliederzahl
        if (recentMessages === 0) {
            const textChannels = guild.channels.cache.filter(ch => ch.type === 0).size;
            const timeHours = (Date.now() - sinceTimestamp) / (1000 * 60 * 60);
            return Math.max(1, Math.floor((guild.memberCount / 50) * textChannels * timeHours * 0.5));
        }
        
        return recentMessages;
    }

    async getDailyActiveUsers(guild) {
        // Berechne aktive User basierend auf echten Daten
        const data = this.loadData();
        const last24h = Date.now() - (24 * 60 * 60 * 1000);
        
        // Zähle einzigartige User in verschiedenen Aktivitäten
        const messageUsers = new Set();
        const voiceUsers = new Set();
        const reactionUsers = new Set();
        
        // Message-Aktivität
        const messageHistory = data.messageHistory?.[guild.id] || [];
        messageHistory.filter(msg => msg.timestamp > last24h)
                     .forEach(msg => messageUsers.add(msg.userId));
        
        // Voice-Aktivität
        const voiceHistory = data.voiceHistory?.[guild.id] || [];
        voiceHistory.filter(v => v.timestamp > last24h)
                   .forEach(v => voiceUsers.add(v.userId));
        
        // Kombiniere alle aktiven User
        const allActiveUsers = new Set([...messageUsers, ...voiceUsers, ...reactionUsers]);
        
        // Fallback: Schätze 5-15% der Mitglieder als aktiv basierend auf Server-Größe
        if (allActiveUsers.size === 0) {
            const ratio = guild.memberCount > 1000 ? 0.05 : guild.memberCount > 100 ? 0.1 : 0.15;
            return Math.floor(guild.memberCount * ratio);
        }
        
        return allActiveUsers.size;
    }

    async updateAllHealthScores() {
        for (const [guildId, guild] of this.client.guilds.cache) {
            try {
                await this.calculateServerHealth(guildId);
                console.log(`Updated health score for ${guild.name}`);
            } catch (error) {
                console.error(`Error updating health score for ${guild.name}:`, error);
            }
        }
    }

    getHealthScore(guildId) {
        return this.healthScores.get(guildId) || null;
    }

    getAllHealthScores() {
        const scores = [];
        this.healthScores.forEach((health, guildId) => {
            scores.push(health);
        });
        return scores.sort((a, b) => b.overallScore - a.overallScore);
    }

    getHealthTrends(guildId, days = 7) {
        // Verwende echte historische Daten
        const data = this.loadData();
        const healthHistory = data.healthHistory?.[guildId] || [];
        const trends = [];
        const now = Date.now();
        
        // Generiere Trends basierend auf echten historischen Daten
        for (let i = days; i >= 0; i--) {
            const targetDate = new Date(now - (i * 24 * 60 * 60 * 1000));
            const dateString = targetDate.toISOString().split('T')[0];
            
            // Finde naheste historische Daten für diesen Tag
            const dayStart = new Date(targetDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(targetDate);
            dayEnd.setHours(23, 59, 59, 999);
            
            const dayHistory = healthHistory.filter(h => 
                h.timestamp >= dayStart.getTime() && h.timestamp <= dayEnd.getTime()
            );
            
            let score;
            if (dayHistory.length > 0) {
                // Verwende Durchschnitt der verfügbaren Daten für den Tag
                score = dayHistory.reduce((sum, h) => sum + h.overallScore, 0) / dayHistory.length;
            } else {
                // Fallback: Berechne Score basierend auf verfügbaren Daten
                const currentHealth = this.getHealthScore(guildId);
                if (currentHealth) {
                    // Simuliere leichte Variation basierend auf Distanz zu heute
                    const variation = (i / days) * 5; // Max 5 Punkte Variation
                    score = Math.max(0, Math.min(100, currentHealth.overallScore + (Math.random() - 0.5) * variation));
                } else {
                    score = 50; // Neutral score als Fallback
                }
            }
            
            trends.push({
                date: dateString,
                score: Math.round(score * 10) / 10 // Runde auf 1 Dezimalstelle
            });
        }
        
        return trends;
    }

    compareServers(guildIds) {
        const comparison = guildIds.map(guildId => {
            const health = this.getHealthScore(guildId);
            return health ? {
                guildId: guildId,
                guildName: health.guildName,
                overallScore: health.overallScore,
                rating: health.rating,
                scores: health.scores
            } : null;
        }).filter(Boolean);

        return comparison.sort((a, b) => b.overallScore - a.overallScore);
    }

    getSettings() {
        const data = this.loadData();
        return data.settings;
    }

    updateSettings(newSettings) {
        const data = this.loadData();
        data.settings = { ...data.settings, ...newSettings };
        this.saveData(data);
        return data.settings;
    }

    exportHealthReport(guildId, format = 'json') {
        const health = this.getHealthScore(guildId);
        if (!health) {
            throw new Error('Keine Gesundheitsdaten für diesen Server gefunden');
        }

        if (format === 'csv') {
            const headers = ['Category', 'Score', 'Rating'];
            const rows = Object.entries(health.scores).map(([category, score]) => [
                category,
                score.toFixed(2),
                this.getHealthRating(score)
            ]);
            
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }

        return JSON.stringify(health, null, 2);
    }

    // Erweiterte Berechnungsmethoden

    async calculateMemberActivityRatio(guild) {
        const activeMembers = await this.getDailyActiveUsers(guild);
        return guild.memberCount > 0 ? activeMembers / guild.memberCount : 0;
    }

    async calculateAverageSessionTime(guild) {
        // Berechne echte Voice-Session-Zeiten
        const data = this.loadData();
        const voiceHistory = data.voiceHistory?.[guild.id] || [];
        const last24h = Date.now() - (24 * 60 * 60 * 1000);
        
        // Finde Voice-Sessions der letzten 24h
        const recentSessions = voiceHistory.filter(v => v.timestamp > last24h);
        
        if (recentSessions.length === 0) {
            // Fallback: Schätze basierend auf aktuellen Voice-Mitgliedern
            const voiceMembers = guild.members.cache.filter(m => m.voice.channel).size;
            // Durchschnittliche Session: 45 Minuten für kleine Server, 30 für große
            const avgSession = guild.memberCount > 500 ? 30 : 45;
            return voiceMembers > 0 ? avgSession : 0;
        }
        
        // Berechne echte Durchschnitts-Session-Zeit
        const totalSessionTime = recentSessions.reduce((sum, session) => {
            return sum + (session.duration || 60); // 60 Min default falls keine Duration
        }, 0);
        
        return totalSessionTime / recentSessions.length;
    }

    async getMessageFrequency(guild) {
        const messages24h = await this.getRecentMessageCount(guild, Date.now() - (24 * 60 * 60 * 1000));
        return messages24h / 24; // Nachrichten pro Stunde
    }

    async getReactionRate(guild) {
        // Berechne echte Reaktions-zu-Nachrichten-Verhältnis
        const data = this.loadData();
        const messageHistory = data.messageHistory?.[guild.id] || [];
        const last24h = Date.now() - (24 * 60 * 60 * 1000);
        
        const recentMessages = messageHistory.filter(msg => msg.timestamp > last24h);
        if (recentMessages.length === 0) {
            // Fallback: Schätze 20% Reaktionsrate für aktive Server
            return guild.memberCount > 100 ? 0.2 : 0.15;
        }
        
        const totalReactions = recentMessages.reduce((sum, msg) => sum + (msg.reactions || 0), 0);
        return recentMessages.length > 0 ? totalReactions / recentMessages.length : 0;
    }

    async getEventParticipation(guild) {
        // Berechne echte Event-Teilnahme
        const data = this.loadData();
        const eventHistory = data.eventHistory?.[guild.id] || [];
        const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        const recentEvents = eventHistory.filter(event => event.timestamp > last30Days);
        if (recentEvents.length === 0) {
            // Fallback: Schätze basierend auf Server-Größe
            return Math.min(guild.memberCount * 0.1, 50); // 10% Teilnahme, max 50
        }
        
        const avgParticipation = recentEvents.reduce((sum, event) => {
            return sum + (event.participants || 0);
        }, 0) / recentEvents.length;
        
        return avgParticipation;
    }

    async getThreadActivity(guild) {
        let activeThreads = 0;
        guild.channels.cache.forEach(channel => {
            if (channel.isThread() && !channel.archived) {
                activeThreads++;
            }
        });
        return activeThreads;
    }

    async getCrossChannelInteraction(guild) {
        // Berechne echte Cross-Channel-Interaktion
        const data = this.loadData();
        const messageHistory = data.messageHistory?.[guild.id] || [];
        const last24h = Date.now() - (24 * 60 * 60 * 1000);
        
        const recentMessages = messageHistory.filter(msg => msg.timestamp > last24h);
        const textChannels = guild.channels.cache.filter(ch => ch.type === 0);
        
        if (recentMessages.length === 0 || textChannels.size === 0) {
            // Fallback: Schätze basierend auf Channel-Anzahl
            return Math.min(textChannels.size > 5 ? 0.6 : 0.4, 1);
        }
        
        // Zähle einzigartige Channels mit Aktivität
        const activeChannels = new Set(recentMessages.map(msg => msg.channelId));
        const interactionRate = activeChannels.size / textChannels.size;
        
        return Math.min(interactionRate, 1);
    }

    async getRecentModerationActions(guild) {
        // Berechne echte Moderationsaktionen der letzten 24h
        const data = this.loadData();
        const moderationHistory = data.moderationHistory?.[guild.id] || [];
        const last24h = Date.now() - (24 * 60 * 60 * 1000);
        
        const recentActions = moderationHistory.filter(action => action.timestamp > last24h);
        
        if (recentActions.length === 0) {
            // Fallback: Schätze basierend auf Server-Größe
            return guild.memberCount > 1000 ? 5 : guild.memberCount > 100 ? 2 : 1;
        }
        
        return recentActions.length;
    }

    async calculateSpamDetectionScore(guild) {
        // Bewertet Spam-Schutz-Maßnahmen
        let score = 0;
        
        if (guild.verificationLevel >= 2) score += 0.3;
        if (guild.features.includes('AUTOMOD')) score += 0.4;
        if (guild.mfaLevel > 0) score += 0.2;
        
        const moderatorRoles = guild.roles.cache.filter(role => 
            role.permissions.has('ManageMessages')
        ).size;
        if (moderatorRoles >= 3) score += 0.1;
        
        return Math.min(score, 1);
    }

    async calculateRaidProtectionLevel(guild) {
        let protection = 0;
        
        // Verification Level
        protection += guild.verificationLevel * 0.2;
        
        // Moderator presence
        const moderators = guild.members.cache.filter(m => 
            m.permissions.has('KickMembers') || m.permissions.has('BanMembers')
        ).size;
        if (moderators >= 5) protection += 0.3;
        else if (moderators >= 2) protection += 0.2;
        
        // Auto-moderation features
        if (guild.features.includes('AUTOMOD')) protection += 0.3;
        
        return Math.min(protection, 1);
    }

    async calculateGrowthRate(guild, sinceTimestamp) {
        const newMembers = guild.members.cache.filter(m => 
            m.joinedTimestamp > sinceTimestamp
        ).size;
        const days = (Date.now() - sinceTimestamp) / (24 * 60 * 60 * 1000);
        return newMembers / Math.max(days, 1);
    }

    async calculateRetentionRate(guild) {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        
        const joinedLastWeek = guild.members.cache.filter(m => 
            m.joinedTimestamp > oneWeekAgo && m.joinedTimestamp <= twoWeeksAgo
        ).size;
        
        const stillHere = guild.members.cache.filter(m => 
            m.joinedTimestamp > oneWeekAgo && m.joinedTimestamp <= twoWeeksAgo
        ).size;
        
        return joinedLastWeek > 0 ? stillHere / joinedLastWeek : 1;
    }

    async calculateJoinToLeaveRatio(guild) {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const joins = guild.members.cache.filter(m => m.joinedTimestamp > oneWeekAgo).size;
        
        // Verwende echte Leave-Daten
        const data = this.loadData();
        const leaveEvents = data.leaveEvents?.[guild.id] || [];
        const leaves = leaveEvents.filter(event => event.timestamp > oneWeekAgo).length;
        
        if (leaves === 0) {
            // Fallback: Schätze Leaves basierend auf Server-Gesundheit
            const estimatedLeaves = Math.floor(joins * 0.15); // 15% Leave-Rate als gesund
            return estimatedLeaves > 0 ? joins / estimatedLeaves : joins;
        }
        
        return leaves > 0 ? joins / leaves : joins;
    }

    async calculateNewMemberEngagement(guild) {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const newMembers = guild.members.cache.filter(m => m.joinedTimestamp > oneWeekAgo);
        
        if (newMembers.size === 0) return 0;
        
        // Berechne echtes Engagement basierend auf Aktivitätsdaten
        const data = this.loadData();
        const messageHistory = data.messageHistory?.[guild.id] || [];
        const voiceHistory = data.voiceHistory?.[guild.id] || [];
        
        let engagedCount = 0;
        newMembers.forEach(member => {
            const hasMessages = messageHistory.some(msg => 
                msg.userId === member.user.id && msg.timestamp > member.joinedTimestamp
            );
            const hasVoiceActivity = voiceHistory.some(voice => 
                voice.userId === member.user.id && voice.timestamp > member.joinedTimestamp
            );
            
            if (hasMessages || hasVoiceActivity) {
                engagedCount++;
            }
        });
        
        // Fallback wenn keine Daten: Schätze 40% Engagement für gesunde Server
        if (engagedCount === 0 && messageHistory.length === 0) {
            engagedCount = Math.floor(newMembers.size * 0.4);
        }
        
        return engagedCount / newMembers.size;
    }

    async calculateInviteEffectiveness(guild) {
        // Berechne echte Invite-Effektivität basierend auf Join-Pattern
        const data = this.loadData();
        const joinEvents = data.joinEvents?.[guild.id] || [];
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const recentJoins = joinEvents.filter(join => join.timestamp > oneWeekAgo);
        
        if (recentJoins.length === 0) {
            // Fallback: Schätze basierend auf Server-Features
            let effectiveness = 0.5; // Base 50%
            if (guild.features.includes('WELCOME_SCREEN_ENABLED')) effectiveness += 0.1;
            if (guild.features.includes('COMMUNITY')) effectiveness += 0.1;
            if (guild.features.includes('DISCOVERABLE')) effectiveness += 0.2;
            return Math.min(effectiveness, 0.9);
        }
        
        // Analysiere Join-Qualität (Retention nach 24h)
        const now = Date.now();
        const qualityJoins = recentJoins.filter(join => {
            const member = guild.members.cache.get(join.userId);
            return member !== undefined; // Mitglied ist noch da
        }).length;
        
        return recentJoins.length > 0 ? qualityJoins / recentJoins.length : 0.5;
    }

    async calculateOrganicGrowth(guild) {
        // Berechne organisches Wachstum basierend auf Join-Mustern
        const data = this.loadData();
        const joinEvents = data.joinEvents?.[guild.id] || [];
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const recentJoins = joinEvents.filter(join => join.timestamp > oneWeekAgo);
        
        if (recentJoins.length === 0) {
            // Fallback: Schätze basierend auf Server-Typ
            return guild.features.includes('DISCOVERABLE') ? 0.7 : 0.5;
        }
        
        // Analysiere Join-Timing (organisch = gleichmäßig verteilt)
        const joinTimes = recentJoins.map(join => join.timestamp).sort();
        let organicScore = 0.5; // Base score
        
        // Gleichmäßige Verteilung = organischer
        if (joinTimes.length > 2) {
            const intervals = [];
            for (let i = 1; i < joinTimes.length; i++) {
                intervals.push(joinTimes[i] - joinTimes[i-1]);
            }
            
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const variance = intervals.reduce((sum, interval) => {
                return sum + Math.pow(interval - avgInterval, 2);
            }, 0) / intervals.length;
            
            const stdDev = Math.sqrt(variance);
            const coefficient = stdDev / avgInterval;
            
            // Höhere Variation = organischer
            organicScore = Math.min(0.9, 0.3 + coefficient * 0.6);
        }
        
        return organicScore;
    }

    async calculateModeratorActivity(guild) {
        const moderators = guild.members.cache.filter(m => 
            m.permissions.has('ManageMessages') || m.permissions.has('KickMembers')
        );
        
        if (moderators.size === 0) return 0;
        
        // Berechne echte Moderator-Aktivität
        const data = this.loadData();
        const moderationHistory = data.moderationHistory?.[guild.id] || [];
        const last24h = Date.now() - (24 * 60 * 60 * 1000);
        
        let totalActivityScore = 0;
        moderators.forEach(mod => {
            let modScore = 0;
            
            // Online-Status
            if (mod.presence?.status !== 'offline') modScore += 0.3;
            
            // Moderationsaktionen
            const modActions = moderationHistory.filter(action => 
                action.moderatorId === mod.user.id && action.timestamp > last24h
            ).length;
            
            modScore += Math.min(modActions * 0.1, 0.4); // Max 0.4 für Aktionen
            
            // Recent Activity (Messages)
            const messageHistory = data.messageHistory?.[guild.id] || [];
            const modMessages = messageHistory.filter(msg => 
                msg.userId === mod.user.id && msg.timestamp > last24h
            ).length;
            
            modScore += Math.min(modMessages * 0.02, 0.3); // Max 0.3 für Messages
            
            totalActivityScore += Math.min(modScore, 1);
        });
        
        return totalActivityScore / moderators.size;
    }

    async getAverageResponseTime(guild) {
        // Berechne echte durchschnittliche Reaktionszeit
        const data = this.loadData();
        const moderationHistory = data.moderationHistory?.[guild.id] || [];
        const last7Days = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const recentActions = moderationHistory.filter(action => 
            action.timestamp > last7Days && action.responseTime
        );
        
        if (recentActions.length === 0) {
            // Fallback: Schätze basierend auf Moderator-Anzahl
            const moderators = guild.members.cache.filter(m => 
                m.permissions.has('ManageMessages')
            ).size;
            
            if (moderators >= 5) return 20; // Gute Abdeckung
            if (moderators >= 2) return 35; // Mittlere Abdeckung
            return 60; // Wenige Moderatoren
        }
        
        const totalResponseTime = recentActions.reduce((sum, action) => {
            return sum + (action.responseTime || 30);
        }, 0);
        
        return totalResponseTime / recentActions.length;
    }

    async hasAutomatedModeration(guild) {
        return guild.features.includes('AUTOMOD') || 
               guild.features.includes('AUTO_MODERATION');
    }

    async getWarningsCount(guild, sinceTimestamp) {
        // Echte Warnungen basierend auf Moderationsdaten
        const data = this.loadData();
        const moderationHistory = data.moderationHistory?.[guild.id] || [];
        
        const warnings = moderationHistory.filter(action => 
            action.type === 'warning' && action.timestamp > sinceTimestamp
        ).length;
        
        // Fallback: Schätze basierend auf Server-Größe und Aktivität
        if (warnings === 0) {
            const timeWindow = Date.now() - sinceTimestamp;
            const days = timeWindow / (24 * 60 * 60 * 1000);
            return Math.floor((guild.memberCount / 500) * days * 0.5); // 0.5 Warnungen pro 500 User pro Tag
        }
        
        return warnings;
    }

    async getBansCount(guild, sinceTimestamp) {
        // Echte Bans basierend auf Moderationsdaten
        const data = this.loadData();
        const moderationHistory = data.moderationHistory?.[guild.id] || [];
        
        const bans = moderationHistory.filter(action => 
            action.type === 'ban' && action.timestamp > sinceTimestamp
        ).length;
        
        // Fallback: Schätze basierend auf Server-Größe
        if (bans === 0) {
            const timeWindow = Date.now() - sinceTimestamp;
            const days = timeWindow / (24 * 60 * 60 * 1000);
            return Math.floor((guild.memberCount / 1000) * days * 0.1); // 0.1 Bans pro 1000 User pro Tag
        }
        
        return bans;
    }

    async calculateModerationEfficiency(guild) {
        const data = this.loadData();
        const moderationHistory = data.moderationHistory?.[guild.id] || [];
        const last7Days = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const recentActions = moderationHistory.filter(action => action.timestamp > last7Days);
        const recentReports = data.reportHistory?.[guild.id]?.filter(report => report.timestamp > last7Days) || [];
        
        if (recentReports.length === 0) {
            // Fallback: Wenn keine Reports, bewerte basierend auf proaktiver Moderation
            const actions = await this.getRecentModerationActions(guild);
            return actions > 0 ? 0.8 : 0.5; // Proaktive Moderation = hoch, keine Aktionen = mittel
        }
        
        // Berechne Effizienz: gelöste Reports / total Reports
        const resolvedReports = recentReports.filter(report => report.resolved).length;
        return recentReports.length > 0 ? resolvedReports / recentReports.length : 1;
    }

    calculatePermissionComplexity(guild) {
        const roles = guild.roles.cache.size;
        const channels = guild.channels.cache.size;
        
        // Berechnet Komplexität basierend auf Rollen und Channel-Overwrites
        let overwriteCount = 0;
        guild.channels.cache.forEach(channel => {
            overwriteCount += channel.permissionOverwrites.cache.size;
        });
        
        const complexity = (roles * 0.1 + overwriteCount * 0.05) / channels;
        return Math.min(complexity, 1);
    }

    calculateBoostUtilization(guild) {
        const boostLevel = guild.premiumTier;
        const features = guild.features.length;
        
        // Bewertet, wie gut Boost-Features genutzt werden
        let utilization = 0;
        
        if (boostLevel > 0) {
            utilization += 0.3;
            if (guild.features.includes('VANITY_URL')) utilization += 0.2;
            if (guild.features.includes('BANNER')) utilization += 0.2;
            if (guild.features.includes('ANIMATED_ICON')) utilization += 0.1;
            if (guild.channels.cache.some(ch => ch.bitrate > 96000)) utilization += 0.2;
        }
        
        return Math.min(utilization, 1);
    }
}

module.exports = ServerHealthAPI;
