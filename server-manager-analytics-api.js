const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class ServerManagerAnalyticsAPI extends EventEmitter {
    constructor(client) {
        super();
        this.client = client;
        this.dataFile = path.join(__dirname, 'settings', 'server-manager-analytics.json');
        this.liveEvents = [];
        this.voiceChannelData = new Map();
        this.memberJourneys = new Map();
        this.connectedClients = new Set();
        this.maxEventBuffer = 500;
        
        this.ensureDataFile();
        this.setupEventTracking();
        this.initializeDataStructures();
        this.startPeriodicTasks();
    }

    ensureDataFile() {
        const settingsDir = path.join(__dirname, 'settings');
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.dataFile)) {
            const defaultData = {
                liveEventSettings: {
                    maxBufferSize: 500,
                    eventTypes: ['memberJoin', 'memberLeave', 'messageCreate', 'voiceStateUpdate', 'roleUpdate', 'channelCreate', 'messageReactionAdd'],
                    autoCleanupInterval: 3600000, // 1 hour
                    realTimeEnabled: true
                },
                voiceVisualizerSettings: {
                    trackVoiceActivity: true,
                    recordSessionData: true,
                    visualizationType: 'heatmap', // heatmap, timeline, network
                    dataRetention: 30, // days
                    updateInterval: 30000 // 30 seconds
                },
                memberJourneySettings: {
                    trackingEnabled: true,
                    milestones: [
                        { name: 'Erster Schritt', type: 'join', threshold: 1, icon: '👋', color: '#22c55e' },
                        { name: 'Erste Nachricht', type: 'message', threshold: 1, icon: '💬', color: '#3b82f6' },
                        { name: 'Aktiver Teilnehmer', type: 'message', threshold: 10, icon: '🎯', color: '#8b5cf6' },
                        { name: 'Community Mitglied', type: 'message', threshold: 50, icon: '⭐', color: '#f59e0b' },
                        { name: 'Voice Nutzer', type: 'voice', threshold: 3600000, icon: '🎤', color: '#ef4444' },
                        { name: 'Voice Regular', type: 'voice', threshold: 36000000, icon: '🎵', color: '#06b6d4' },
                        { name: 'Reaktions-Fan', type: 'reaction', threshold: 100, icon: '❤️', color: '#ec4899' },
                        { name: 'Server Veteran', type: 'days', threshold: 30, icon: '👑', color: '#fbbf24' }
                    ],
                    engagementCategories: ['newcomer', 'casual', 'active', 'engaged', 'veteran', 'champion'],
                    churnPredictionEnabled: true
                },
                historicalData: {
                    voiceChannels: {},
                    memberJourneys: {},
                    dailySnapshots: {}
                }
            };
            fs.writeFileSync(this.dataFile, JSON.stringify(defaultData, null, 2));
        }
    }

    loadData() {
        try {
            return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        } catch (error) {
            console.error('❌ Fehler beim Laden der Analytics-Daten:', error);
            return { historicalData: {}, liveEventSettings: {}, voiceVisualizerSettings: {}, memberJourneySettings: {} };
        }
    }

    saveData(data) {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Analytics-Daten:', error);
            return false;
        }
    }

    initializeDataStructures() {
        const data = this.loadData();
        
        // Initialize voice channel tracking
        this.client.guilds.cache.forEach(guild => {
            guild.channels.cache.filter(channel => channel.type === 2).forEach(voiceChannel => {
                this.voiceChannelData.set(voiceChannel.id, {
                    guildId: guild.id,
                    channelId: voiceChannel.id,
                    channelName: voiceChannel.name,
                    currentUsers: new Set(),
                    sessionHistory: [],
                    dailyStats: {},
                    peakUsage: { count: 0, timestamp: 0 },
                    totalUsageTime: 0,
                    averageSessionLength: 0
                });
            });
        });

        console.log('📊 Server Manager Analytics initialisiert');
    }

    setupEventTracking() {
        const data = this.loadData();
        const enabledEvents = data.liveEventSettings?.eventTypes || [];

        // Member Join Event - Erweitert
        if (enabledEvents.includes('memberJoin')) {
            this.client.on('guildMemberAdd', (member) => {
                const event = {
                    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'memberJoin',
                    timestamp: Date.now(),
                    serverId: member.guild.id,
                    serverName: member.guild.name,
                    userId: member.user.id,
                    username: member.user.username,
                    userAvatar: member.user.displayAvatarURL({ size: 64 }),
                    memberCount: member.guild.memberCount,
                    severity: 'info',
                    icon: '👋',
                    color: '#22c55e',
                    data: {
                        accountAge: Date.now() - member.user.createdTimestamp,
                        isBot: member.user.bot,
                        hasAvatar: !!member.user.avatar,
                        inviteUsed: null // TODO: Implementiere Invite Tracking
                    }
                };
                
                this.addLiveEvent(event);
                this.updateMemberJourney(member, 'join');
            });
        }

        // Member Leave Event - Erweitert
        if (enabledEvents.includes('memberLeave')) {
            this.client.on('guildMemberRemove', (member) => {
                const event = {
                    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'memberLeave',
                    timestamp: Date.now(),
                    serverId: member.guild.id,
                    serverName: member.guild.name,
                    userId: member.user.id,
                    username: member.user.username,
                    userAvatar: member.user.displayAvatarURL({ size: 64 }),
                    memberCount: member.guild.memberCount,
                    severity: 'warning',
                    icon: '👋',
                    color: '#ef4444',
                    data: {
                        timeInServer: member.joinedAt ? Date.now() - member.joinedAt.getTime() : 0,
                        roleCount: member.roles.cache.size - 1, // -1 for @everyone
                        topRole: member.roles.highest.name,
                        wasBooster: member.premiumSince !== null
                    }
                };
                
                this.addLiveEvent(event);
                this.updateMemberJourney(member, 'leave');
            });
        }

        // Message Create Event - Intelligenter
        if (enabledEvents.includes('messageCreate')) {
            this.client.on('messageCreate', (message) => {
                if (message.author.bot || !message.guild) return;

                const isImportant = this.isImportantMessage(message);
                if (!isImportant && Math.random() > 0.1) return; // Sample nur 10% der normalen Nachrichten

                const event = {
                    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'messageCreate',
                    timestamp: Date.now(),
                    serverId: message.guild.id,
                    serverName: message.guild.name,
                    channelId: message.channel.id,
                    channelName: message.channel.name,
                    userId: message.author.id,
                    username: message.author.username,
                    userAvatar: message.author.displayAvatarURL({ size: 64 }),
                    severity: isImportant ? 'high' : 'low',
                    icon: isImportant ? '⭐' : '💬',
                    color: isImportant ? '#fbbf24' : '#6b7280',
                    data: {
                        messageLength: message.content.length,
                        hasAttachments: message.attachments.size > 0,
                        hasEmbeds: message.embeds.length > 0,
                        mentionsCount: message.mentions.users.size,
                        isThread: message.channel.isThread?.() || false,
                        sentiment: this.analyzeSentiment(message.content)
                    }
                };
                
                this.addLiveEvent(event);
                this.updateMemberJourney(message.member, 'message');
            });
        }

        // Voice State Update - Detailliert
        if (enabledEvents.includes('voiceStateUpdate')) {
            this.client.on('voiceStateUpdate', (oldState, newState) => {
                this.trackVoiceActivity(oldState, newState);
            });
        }

        // Reaction Add Event
        if (enabledEvents.includes('messageReactionAdd')) {
            this.client.on('messageReactionAdd', (reaction, user) => {
                if (user.bot) return;

                const event = {
                    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'reactionAdd',
                    timestamp: Date.now(),
                    serverId: reaction.message.guild?.id,
                    serverName: reaction.message.guild?.name,
                    channelId: reaction.message.channel.id,
                    channelName: reaction.message.channel.name,
                    userId: user.id,
                    username: user.username,
                    userAvatar: user.displayAvatarURL({ size: 64 }),
                    severity: 'low',
                    icon: reaction.emoji.toString(),
                    color: '#ec4899',
                    data: {
                        emoji: reaction.emoji.name,
                        isCustomEmoji: !reaction.emoji.id,
                        reactionCount: reaction.count
                    }
                };
                
                this.addLiveEvent(event);
                const member = reaction.message.guild?.members.cache.get(user.id);
                if (member) {
                    this.updateMemberJourney(member, 'reaction');
                }
            });
        }
    }

    // === LIVE EVENT FEED ===
    addLiveEvent(event) {
        this.liveEvents.unshift(event);
        
        // Buffer-Größe begrenzen
        if (this.liveEvents.length > this.maxEventBuffer) {
            this.liveEvents = this.liveEvents.slice(0, this.maxEventBuffer);
        }

        // Event an alle verbundenen Clients senden
        this.broadcastToClients('liveEvent', event);
        
        console.log(`📡 Live Event: ${event.type} - ${event.username || 'System'}`);
    }

    getLiveEvents(limit = 50, types = [], serverId = null) {
        let events = [...this.liveEvents];
        
        // Filter nach Server
        if (serverId) {
            events = events.filter(event => event.serverId === serverId);
        }
        
        // Filter nach Event-Typen
        if (types.length > 0) {
            events = events.filter(event => types.includes(event.type));
        }
        
        return events.slice(0, limit);
    }

    isImportantMessage(message) {
        // Wichtige Nachrichten identifizieren
        if (message.mentions.everyone || message.mentions.here) return true;
        if (message.mentions.roles.size > 0) return true;
        if (message.attachments.size > 0) return true;
        if (message.embeds.length > 0) return true;
        if (message.content.length > 200) return true;
        if (message.channel.name.includes('announce') || message.channel.name.includes('wichtig')) return true;
        
        return false;
    }

    analyzeSentiment(content) {
        // Einfache Sentiment-Analyse (kann erweitert werden)
        const positiveWords = ['gut', 'toll', 'super', 'awesome', 'great', 'love', 'perfect', 'amazing'];
        const negativeWords = ['schlecht', 'blöd', 'hate', 'terrible', 'awful', 'bad', 'worst'];
        
        const words = content.toLowerCase().split(' ');
        let score = 0;
        
        words.forEach(word => {
            if (positiveWords.some(pw => word.includes(pw))) score++;
            if (negativeWords.some(nw => word.includes(nw))) score--;
        });
        
        if (score > 0) return 'positive';
        if (score < 0) return 'negative';
        return 'neutral';
    }

    // === VOICE CHANNEL VISUALIZER ===
    trackVoiceActivity(oldState, newState) {
        const userId = newState.member.user.id;
        const username = newState.member.user.username;
        const now = Date.now();

        // User left voice channel
        if (oldState.channel && !newState.channel) {
            const channelData = this.voiceChannelData.get(oldState.channel.id);
            if (channelData) {
                channelData.currentUsers.delete(userId);
                
                const event = {
                    id: `event_${now}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'voiceLeave',
                    timestamp: now,
                    serverId: oldState.guild.id,
                    serverName: oldState.guild.name,
                    channelId: oldState.channel.id,
                    channelName: oldState.channel.name,
                    userId: userId,
                    username: username,
                    userAvatar: newState.member.user.displayAvatarURL({ size: 64 }),
                    severity: 'low',
                    icon: '🔇',
                    color: '#ef4444',
                    data: {
                        channelUserCount: channelData.currentUsers.size,
                        previousChannelId: oldState.channel.id
                    }
                };
                
                this.addLiveEvent(event);
                this.updateVoiceChannelStats(oldState.channel.id, 'leave');
            }
        }

        // User joined voice channel
        if (!oldState.channel && newState.channel) {
            const channelData = this.voiceChannelData.get(newState.channel.id);
            if (channelData) {
                channelData.currentUsers.add(userId);
                
                // Neue Peak-Nutzung?
                if (channelData.currentUsers.size > channelData.peakUsage.count) {
                    channelData.peakUsage = {
                        count: channelData.currentUsers.size,
                        timestamp: now
                    };
                }
                
                const event = {
                    id: `event_${now}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'voiceJoin',
                    timestamp: now,
                    serverId: newState.guild.id,
                    serverName: newState.guild.name,
                    channelId: newState.channel.id,
                    channelName: newState.channel.name,
                    userId: userId,
                    username: username,
                    userAvatar: newState.member.user.displayAvatarURL({ size: 64 }),
                    severity: 'info',
                    icon: '🎤',
                    color: '#22c55e',
                    data: {
                        channelUserCount: channelData.currentUsers.size,
                        isPeakUsage: channelData.currentUsers.size === channelData.peakUsage.count
                    }
                };
                
                this.addLiveEvent(event);
                this.updateVoiceChannelStats(newState.channel.id, 'join');
                this.updateMemberJourney(newState.member, 'voice');
            }
        }

        // User moved between channels
        if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            const oldChannelData = this.voiceChannelData.get(oldState.channel.id);
            const newChannelData = this.voiceChannelData.get(newState.channel.id);
            
            if (oldChannelData) oldChannelData.currentUsers.delete(userId);
            if (newChannelData) newChannelData.currentUsers.add(userId);
            
            const event = {
                id: `event_${now}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'voiceMove',
                timestamp: now,
                serverId: newState.guild.id,
                serverName: newState.guild.name,
                channelId: newState.channel.id,
                channelName: newState.channel.name,
                userId: userId,
                username: username,
                userAvatar: newState.member.user.displayAvatarURL({ size: 64 }),
                severity: 'info',
                icon: '🔄',
                color: '#3b82f6',
                data: {
                    fromChannelId: oldState.channel.id,
                    fromChannelName: oldState.channel.name,
                    toChannelId: newState.channel.id,
                    toChannelName: newState.channel.name
                }
            };
            
            this.addLiveEvent(event);
        }
    }

    updateVoiceChannelStats(channelId, action) {
        const channelData = this.voiceChannelData.get(channelId);
        if (!channelData) return;

        const dateKey = new Date().toISOString().split('T')[0];
        
        if (!channelData.dailyStats[dateKey]) {
            channelData.dailyStats[dateKey] = {
                joins: 0,
                leaves: 0,
                peakUsers: 0,
                totalSessions: 0,
                averageSessionLength: 0
            };
        }
        
        if (action === 'join') {
            channelData.dailyStats[dateKey].joins++;
            channelData.dailyStats[dateKey].peakUsers = Math.max(
                channelData.dailyStats[dateKey].peakUsers,
                channelData.currentUsers.size
            );
        } else if (action === 'leave') {
            channelData.dailyStats[dateKey].leaves++;
        }
    }

    getVoiceChannelVisualization(guildId, timeRange = '24h') {
        const guildChannels = Array.from(this.voiceChannelData.values())
            .filter(channel => channel.guildId === guildId);
        
        const visualization = {
            channels: guildChannels.map(channel => ({
                id: channel.channelId,
                name: channel.channelName,
                currentUsers: channel.currentUsers.size,
                peakUsage: channel.peakUsage,
                dailyStats: this.getChannelDailyStats(channel, timeRange),
                activityLevel: this.calculateActivityLevel(channel)
            })),
            networkData: this.generateVoiceNetworkData(guildChannels),
            heatmapData: this.generateVoiceHeatmap(guildChannels, timeRange),
            totalActiveUsers: new Set(
                guildChannels.flatMap(channel => Array.from(channel.currentUsers))
            ).size
        };
        
        return visualization;
    }

    getChannelDailyStats(channel, timeRange) {
        const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
        const stats = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            
            stats.push({
                date: dateKey,
                ...(channel.dailyStats[dateKey] || { joins: 0, leaves: 0, peakUsers: 0 })
            });
        }
        
        return stats;
    }

    calculateActivityLevel(channel) {
        const recentActivity = Object.values(channel.dailyStats)
            .slice(-7)
            .reduce((sum, day) => sum + day.joins, 0);
        
        if (recentActivity > 100) return 'very-high';
        if (recentActivity > 50) return 'high';
        if (recentActivity > 20) return 'medium';
        if (recentActivity > 5) return 'low';
        return 'very-low';
    }

    generateVoiceNetworkData(channels) {
        // Generiere Netzwerk-Daten für Voice Channel Verbindungen
        const nodes = channels.map(channel => ({
            id: channel.channelId,
            name: channel.channelName,
            size: channel.currentUsers.size,
            color: this.getChannelColor(channel.activityLevel)
        }));
        
        // TODO: Implementiere Verbindungen basierend auf User-Bewegungen zwischen Channels
        const links = [];
        
        return { nodes, links };
    }

    generateVoiceHeatmap(channels, timeRange) {
        // Generiere Heatmap-Daten für Voice Activity
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 1;
        
        return channels.map(channel => ({
            channelId: channel.channelId,
            channelName: channel.channelName,
            heatmapData: hours.map(hour => ({
                hour,
                activity: this.getHourlyActivity(channel, hour, days)
            }))
        }));
    }

    getHourlyActivity(channel, hour, days) {
        // Simuliere Stunden-basierte Aktivität (kann durch echte Daten ersetzt werden)
        return Math.floor(Math.random() * 20);
    }

    getChannelColor(activityLevel) {
        const colors = {
            'very-high': '#dc2626',
            'high': '#ea580c',
            'medium': '#ca8a04',
            'low': '#16a34a',
            'very-low': '#6b7280'
        };
        return colors[activityLevel] || '#6b7280';
    }

    // === MEMBER JOURNEY TRACKING ===
    updateMemberJourney(member, action, additionalData = {}) {
        if (!member || member.user.bot) return;
        
        const userId = member.user.id;
        const guildId = member.guild.id;
        const journeyKey = `${guildId}_${userId}`;
        
        if (!this.memberJourneys.has(journeyKey)) {
            this.memberJourneys.set(journeyKey, {
                userId: userId,
                guildId: guildId,
                username: member.user.username,
                avatar: member.user.displayAvatarURL({ size: 64 }),
                joinedAt: member.joinedAt?.getTime() || Date.now(),
                journey: {
                    messages: 0,
                    reactions: 0,
                    voiceTime: 0,
                    helpActions: 0,
                    milestones: [],
                    firstMessage: null,
                    lastActivity: Date.now(),
                    sessionsCount: 0,
                    averageSessionLength: 0,
                    engagementScore: 0,
                    churnProbability: 0
                },
                activities: [],
                milestoneHistory: [],
                engagement: {
                    score: 0,
                    trend: 'new',
                    category: 'newcomer',
                    lastUpdated: Date.now()
                }
            });
        }
        
        const journey = this.memberJourneys.get(journeyKey);
        journey.journey.lastActivity = Date.now();
        
        // Activity tracking
        journey.activities.push({
            type: action,
            timestamp: Date.now(),
            data: additionalData
        });
        
        // Keep only last 100 activities
        if (journey.activities.length > 100) {
            journey.activities = journey.activities.slice(-100);
        }
        
        // Update specific counters
        switch (action) {
            case 'message':
                journey.journey.messages++;
                if (!journey.journey.firstMessage) {
                    journey.journey.firstMessage = Date.now();
                }
                break;
            case 'reaction':
                journey.journey.reactions++;
                break;
            case 'voice':
                journey.journey.voiceTime += 60000; // Add 1 minute (simplified)
                break;
        }
        
        // Check for new milestones
        this.checkMemberMilestones(journey);
        
        // Update engagement score
        this.updateMemberEngagement(journey);
        
        // Predict churn probability
        this.calculateChurnProbability(journey);
    }

    checkMemberMilestones(journey) {
        const data = this.loadData();
        const milestones = data.memberJourneySettings?.milestones || [];
        
        milestones.forEach(milestone => {
            const alreadyAchieved = journey.milestoneHistory.some(m => m.name === milestone.name);
            if (alreadyAchieved) return;
            
            let achieved = false;
            
            switch (milestone.type) {
                case 'join':
                    achieved = true; // Achieved on first join
                    break;
                case 'message':
                    achieved = journey.journey.messages >= milestone.threshold;
                    break;
                case 'voice':
                    achieved = journey.journey.voiceTime >= milestone.threshold;
                    break;
                case 'reaction':
                    achieved = journey.journey.reactions >= milestone.threshold;
                    break;
                case 'days':
                    const daysInServer = (Date.now() - journey.joinedAt) / (24 * 60 * 60 * 1000);
                    achieved = daysInServer >= milestone.threshold;
                    break;
            }
            
            if (achieved) {
                journey.milestoneHistory.push({
                    ...milestone,
                    achievedAt: Date.now(),
                    value: this.getMilestoneValue(journey, milestone.type)
                });
                
                console.log(`🏆 ${journey.username} hat Meilenstein erreicht: ${milestone.name}`);
                
                // Broadcast milestone achievement
                this.broadcastToClients('milestoneAchieved', {
                    userId: journey.userId,
                    guildId: journey.guildId,
                    username: journey.username,
                    milestone: milestone,
                    timestamp: Date.now()
                });
            }
        });
    }

    getMilestoneValue(journey, type) {
        switch (type) {
            case 'message': return journey.journey.messages;
            case 'voice': return journey.journey.voiceTime;
            case 'reaction': return journey.journey.reactions;
            case 'days': return Math.floor((Date.now() - journey.joinedAt) / (24 * 60 * 60 * 1000));
            default: return 1;
        }
    }

    updateMemberEngagement(journey) {
        const now = Date.now();
        const timeSinceJoin = now - journey.joinedAt;
        const timeSinceLastActivity = now - journey.journey.lastActivity;
        
        // Base engagement calculation
        let score = 0;
        
        // Activity factors
        score += Math.min(journey.journey.messages * 2, 100);
        score += Math.min(journey.journey.reactions * 1, 50);
        score += Math.min(journey.journey.voiceTime / 3600000 * 10, 100); // 10 points per hour
        score += journey.milestoneHistory.length * 15;
        
        // Time factors
        const daysSinceJoin = timeSinceJoin / (24 * 60 * 60 * 1000);
        if (daysSinceJoin > 0) {
            score = score / Math.max(daysSinceJoin, 1); // Normalize by days
        }
        
        // Recency penalty
        const daysSinceActivity = timeSinceLastActivity / (24 * 60 * 60 * 1000);
        if (daysSinceActivity > 7) {
            score *= 0.5; // 50% penalty for inactive users
        }
        
        journey.engagement.score = Math.min(Math.max(score, 0), 100);
        
        // Determine engagement category
        if (journey.engagement.score >= 80) journey.engagement.category = 'champion';
        else if (journey.engagement.score >= 60) journey.engagement.category = 'veteran';
        else if (journey.engagement.score >= 40) journey.engagement.category = 'engaged';
        else if (journey.engagement.score >= 20) journey.engagement.category = 'active';
        else if (journey.engagement.score >= 10) journey.engagement.category = 'casual';
        else journey.engagement.category = 'newcomer';
        
        // Calculate trend
        const previousScore = journey.engagement.previousScore || 0;
        if (journey.engagement.score > previousScore) journey.engagement.trend = 'rising';
        else if (journey.engagement.score < previousScore) journey.engagement.trend = 'falling';
        else journey.engagement.trend = 'stable';
        
        journey.engagement.previousScore = journey.engagement.score;
        journey.engagement.lastUpdated = now;
    }

    calculateChurnProbability(journey) {
        const now = Date.now();
        const timeSinceJoin = now - journey.joinedAt;
        const timeSinceLastActivity = now - journey.journey.lastActivity;
        
        let churnScore = 0;
        
        // Time since last activity (major factor)
        const daysSinceActivity = timeSinceLastActivity / (24 * 60 * 60 * 1000);
        if (daysSinceActivity > 30) churnScore += 60;
        else if (daysSinceActivity > 14) churnScore += 40;
        else if (daysSinceActivity > 7) churnScore += 20;
        else if (daysSinceActivity > 3) churnScore += 10;
        
        // Low engagement factor
        if (journey.engagement.score < 20) churnScore += 30;
        else if (journey.engagement.score < 40) churnScore += 15;
        
        // New member factor
        const daysSinceJoin = timeSinceJoin / (24 * 60 * 60 * 1000);
        if (daysSinceJoin < 7 && journey.journey.messages < 5) churnScore += 25;
        
        // No milestones factor
        if (journey.milestoneHistory.length === 0 && daysSinceJoin > 3) churnScore += 20;
        
        journey.journey.churnProbability = Math.min(Math.max(churnScore, 0), 100);
    }

    getMemberJourneyData(guildId, userId = null) {
        if (userId) {
            const journeyKey = `${guildId}_${userId}`;
            return this.memberJourneys.get(journeyKey) || null;
        }
        
        // Return all journeys for guild
        const guildJourneys = Array.from(this.memberJourneys.values())
            .filter(journey => journey.guildId === guildId);
        
        return {
            journeys: guildJourneys,
            summary: this.getMemberJourneySummary(guildJourneys),
            analytics: this.getMemberJourneyAnalytics(guildJourneys)
        };
    }

    getMemberJourneySummary(journeys) {
        const total = journeys.length;
        const categories = {};
        const trends = {};
        let totalEngagement = 0;
        let highChurnRisk = 0;
        
        journeys.forEach(journey => {
            categories[journey.engagement.category] = (categories[journey.engagement.category] || 0) + 1;
            trends[journey.engagement.trend] = (trends[journey.engagement.trend] || 0) + 1;
            totalEngagement += journey.engagement.score;
            
            if (journey.journey.churnProbability > 70) highChurnRisk++;
        });
        
        return {
            totalMembers: total,
            averageEngagement: total > 0 ? totalEngagement / total : 0,
            categoryDistribution: categories,
            trendDistribution: trends,
            highChurnRisk: highChurnRisk,
            churnRate: total > 0 ? (highChurnRisk / total) * 100 : 0
        };
    }

    getMemberJourneyAnalytics(journeys) {
        // Calculate retention rates
        const now = Date.now();
        const retentionPeriods = [1, 7, 30, 90]; // days
        const retention = {};
        
        retentionPeriods.forEach(days => {
            const cutoffTime = now - (days * 24 * 60 * 60 * 1000);
            const membersFromPeriod = journeys.filter(j => j.joinedAt < cutoffTime);
            const stillActive = membersFromPeriod.filter(j => j.journey.lastActivity > cutoffTime);
            
            retention[`day${days}`] = {
                total: membersFromPeriod.length,
                retained: stillActive.length,
                rate: membersFromPeriod.length > 0 ? (stillActive.length / membersFromPeriod.length) * 100 : 0
            };
        });
        
        // Top performers
        const topPerformers = journeys
            .sort((a, b) => b.engagement.score - a.engagement.score)
            .slice(0, 10)
            .map(j => ({
                userId: j.userId,
                username: j.username,
                avatar: j.avatar,
                engagementScore: j.engagement.score,
                category: j.engagement.category,
                milestones: j.milestoneHistory.length
            }));
        
        // At-risk members
        const atRisk = journeys
            .filter(j => j.journey.churnProbability > 50)
            .sort((a, b) => b.journey.churnProbability - a.journey.churnProbability)
            .slice(0, 10)
            .map(j => ({
                userId: j.userId,
                username: j.username,
                avatar: j.avatar,
                churnProbability: j.journey.churnProbability,
                daysSinceActivity: Math.floor((now - j.journey.lastActivity) / (24 * 60 * 60 * 1000)),
                engagementScore: j.engagement.score
            }));
        
        return {
            retention,
            topPerformers,
            atRisk,
            milestoneDistribution: this.getMilestoneDistribution(journeys)
        };
    }

    getMilestoneDistribution(journeys) {
        const distribution = {};
        
        journeys.forEach(journey => {
            journey.milestoneHistory.forEach(milestone => {
                if (!distribution[milestone.name]) {
                    distribution[milestone.name] = {
                        name: milestone.name,
                        icon: milestone.icon,
                        color: milestone.color,
                        count: 0,
                        achievementRate: 0
                    };
                }
                distribution[milestone.name].count++;
            });
        });
        
        // Calculate achievement rates
        const totalMembers = journeys.length;
        Object.values(distribution).forEach(milestone => {
            milestone.achievementRate = totalMembers > 0 ? (milestone.count / totalMembers) * 100 : 0;
        });
        
        return Object.values(distribution);
    }

    // === UTILITY METHODS ===
    startPeriodicTasks() {
        // Update voice channel stats every minute
        setInterval(() => {
            this.updateVoiceChannelStats();
        }, 60000);
        
        // Clean old events every hour
        setInterval(() => {
            this.cleanupOldEvents();
        }, 3600000);
        
        // Save member journeys every 5 minutes
        setInterval(() => {
            this.saveMemberJourneys();
        }, 300000);
        
        console.log('⏰ Periodische Tasks gestartet');
    }

    cleanupOldEvents() {
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        const cutoff = Date.now() - maxAge;
        
        this.liveEvents = this.liveEvents.filter(event => event.timestamp > cutoff);
        
        console.log(`🧹 ${this.liveEvents.length} Events nach Cleanup übrig`);
    }

    saveMemberJourneys() {
        const data = this.loadData();
        
        // Convert Map to object for saving
        const journeysObject = {};
        this.memberJourneys.forEach((journey, key) => {
            journeysObject[key] = journey;
        });
        
        data.historicalData.memberJourneys = journeysObject;
        this.saveData(data);
    }

    loadMemberJourneys() {
        const data = this.loadData();
        const journeysObject = data.historicalData?.memberJourneys || {};
        
        // Convert object back to Map
        this.memberJourneys.clear();
        Object.entries(journeysObject).forEach(([key, journey]) => {
            this.memberJourneys.set(key, journey);
        });
        
        console.log(`📊 ${this.memberJourneys.size} Member Journeys geladen`);
    }

    // === CLIENT CONNECTION MANAGEMENT ===
    addClient(clientId, socket) {
        this.connectedClients.add({ id: clientId, socket });
        console.log(`🔗 Client ${clientId} verbunden. Total: ${this.connectedClients.size}`);
    }

    removeClient(clientId) {
        this.connectedClients = new Set([...this.connectedClients].filter(client => client.id !== clientId));
        console.log(`🔌 Client ${clientId} getrennt. Total: ${this.connectedClients.size}`);
    }

    broadcastToClients(event, data) {
        this.connectedClients.forEach(client => {
            try {
                if (client.socket && client.socket.readyState === 1) { // WebSocket.OPEN
                    client.socket.send(JSON.stringify({ event, data }));
                }
            } catch (error) {
                console.error('Fehler beim Senden an Client:', error);
                this.connectedClients.delete(client);
            }
        });
    }

    // === API ENDPOINTS ===
    getAnalyticsDashboard(guildId) {
        return {
            liveEvents: this.getLiveEvents(20, [], guildId),
            voiceVisualization: this.getVoiceChannelVisualization(guildId),
            memberJourneys: this.getMemberJourneyData(guildId),
            systemStats: {
                totalEvents: this.liveEvents.length,
                connectedClients: this.connectedClients.size,
                trackedJourneys: this.memberJourneys.size,
                voiceChannels: this.voiceChannelData.size
            }
        };
    }

    getSettings() {
        return this.loadData();
    }

    updateSettings(newSettings) {
        const data = this.loadData();
        Object.assign(data, newSettings);
        return this.saveData(data);
    }
}

module.exports = ServerManagerAnalyticsAPI; 