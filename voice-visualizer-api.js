const fs = require('fs');
const path = require('path');

class VoiceVisualizerAPI {
    constructor(client) {
        this.client = client;
        this.dataFile = path.join(__dirname, 'settings', 'voice-visualizer.json');
        this.activeSessions = new Map();
        this.voiceData = new Map();
        this.ensureDataFile();
        this.setupVoiceTracking();
    }

    ensureDataFile() {
        const settingsDir = path.join(__dirname, 'settings');
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.dataFile)) {
            const defaultData = {
                voiceChannels: {},
                userSessions: {},
                dailyStats: {},
                settings: {
                    trackingEnabled: true,
                    recordAnonymous: false,
                    dataRetention: 90, // days
                    visualizationRefresh: 30000, // 30 seconds
                    peakTimeDetection: true
                },
                analytics: {
                    totalSessions: 0,
                    totalDuration: 0,
                    peakConcurrentUsers: 0,
                    mostPopularChannel: null
                }
            };
            fs.writeFileSync(this.dataFile, JSON.stringify(defaultData, null, 2));
        }
    }

    loadData() {
        try {
            return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        } catch (error) {
            console.error('Error loading voice visualizer data:', error);
            return { voiceChannels: {}, userSessions: {}, dailyStats: {}, settings: {}, analytics: {} };
        }
    }

    saveData(data) {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving voice visualizer data:', error);
            return false;
        }
    }

    setupVoiceTracking() {
        const data = this.loadData();
        if (!data.settings.trackingEnabled) return;

        // Voice state updates
        this.client.on('voiceStateUpdate', (oldState, newState) => {
            this.handleVoiceStateUpdate(oldState, newState);
        });

        // Periodic data updates
        setInterval(() => {
            this.updateChannelSnapshots();
        }, data.settings.visualizationRefresh || 30000);

        // Daily cleanup
        setInterval(() => {
            this.performDailyCleanup();
        }, 24 * 60 * 60 * 1000);
    }

    handleVoiceStateUpdate(oldState, newState) {
        const userId = newState.member.user.id;
        const guildId = newState.guild.id;
        const now = Date.now();

        // User left a voice channel
        if (oldState.channel && !newState.channel) {
            this.endVoiceSession(userId, oldState.channel.id, guildId, now);
        }
        
        // User joined a voice channel
        if (!oldState.channel && newState.channel) {
            this.startVoiceSession(userId, newState.channel.id, guildId, now);
        }
        
        // User switched channels
        if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            this.endVoiceSession(userId, oldState.channel.id, guildId, now);
            this.startVoiceSession(userId, newState.channel.id, guildId, now);
        }

        // Mute/unmute, deaf/undeaf tracking
        if (oldState.channel && newState.channel && oldState.channel.id === newState.channel.id) {
            this.updateVoiceState(userId, newState.channel.id, guildId, {
                muted: newState.mute,
                deafened: newState.deaf,
                selfMuted: newState.selfMute,
                selfDeafened: newState.selfDeaf,
                streaming: newState.streaming,
                camera: newState.selfVideo
            });
        }
    }

    startVoiceSession(userId, channelId, guildId, timestamp) {
        const sessionId = `${userId}_${channelId}_${timestamp}`;
        
        this.activeSessions.set(sessionId, {
            userId: userId,
            channelId: channelId,
            guildId: guildId,
            startTime: timestamp,
            muted: false,
            deafened: false,
            selfMuted: false,
            selfDeafened: false,
            streaming: false,
            camera: false
        });

        this.updateChannelActivity(guildId, channelId, 'join', userId, timestamp);
        console.log(`🎤 User ${userId} joined voice channel ${channelId}`);
    }

    endVoiceSession(userId, channelId, guildId, timestamp) {
        const data = this.loadData();
        
        // Find and end the active session
        let sessionId = null;
        for (const [id, session] of this.activeSessions.entries()) {
            if (session.userId === userId && session.channelId === channelId) {
                sessionId = id;
                break;
            }
        }

        if (sessionId) {
            const session = this.activeSessions.get(sessionId);
            const duration = timestamp - session.startTime;

            // Save session data
            if (!data.userSessions[guildId]) {
                data.userSessions[guildId] = {};
            }
            if (!data.userSessions[guildId][userId]) {
                data.userSessions[guildId][userId] = [];
            }

            data.userSessions[guildId][userId].push({
                channelId: channelId,
                startTime: session.startTime,
                endTime: timestamp,
                duration: duration,
                wasStreaming: session.streaming,
                wasOnCamera: session.camera
            });

            // Update analytics
            data.analytics.totalSessions++;
            data.analytics.totalDuration += duration;

            this.activeSessions.delete(sessionId);
            this.updateChannelActivity(guildId, channelId, 'leave', userId, timestamp);
            this.saveData(data);

            console.log(`🎤 User ${userId} left voice channel ${channelId} after ${Math.round(duration / 1000)}s`);
        }
    }

    updateVoiceState(userId, channelId, guildId, state) {
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (session.userId === userId && session.channelId === channelId) {
                Object.assign(session, state);
                break;
            }
        }
    }

    updateChannelActivity(guildId, channelId, action, userId, timestamp) {
        const data = this.loadData();
        
        if (!data.voiceChannels[guildId]) {
            data.voiceChannels[guildId] = {};
        }
        
        if (!data.voiceChannels[guildId][channelId]) {
            data.voiceChannels[guildId][channelId] = {
                name: this.getChannelName(guildId, channelId),
                totalJoins: 0,
                totalDuration: 0,
                peakUsers: 0,
                currentUsers: 0,
                lastActivity: timestamp,
                hourlyActivity: new Array(24).fill(0),
                dailyActivity: {}
            };
        }

        const channel = data.voiceChannels[guildId][channelId];
        
        if (action === 'join') {
            channel.totalJoins++;
            channel.currentUsers++;
            channel.peakUsers = Math.max(channel.peakUsers, channel.currentUsers);
        } else if (action === 'leave') {
            channel.currentUsers = Math.max(0, channel.currentUsers - 1);
        }

        channel.lastActivity = timestamp;

        // Update hourly activity
        const hour = new Date(timestamp).getHours();
        channel.hourlyActivity[hour]++;

        // Update daily activity
        const dateKey = new Date(timestamp).toISOString().split('T')[0];
        if (!channel.dailyActivity[dateKey]) {
            channel.dailyActivity[dateKey] = 0;
        }
        channel.dailyActivity[dateKey]++;

        this.saveData(data);
    }

    updateChannelSnapshots() {
        const data = this.loadData();
        const now = Date.now();

        // Update current user counts
        Object.keys(data.voiceChannels).forEach(guildId => {
            Object.keys(data.voiceChannels[guildId]).forEach(channelId => {
                const currentUsers = this.getCurrentUsersInChannel(guildId, channelId);
                data.voiceChannels[guildId][channelId].currentUsers = currentUsers.length;
                data.voiceChannels[guildId][channelId].lastSnapshot = now;
            });
        });

        this.saveData(data);
    }

    getCurrentUsersInChannel(guildId, channelId) {
        const users = [];
        
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (session.guildId === guildId && session.channelId === channelId) {
                users.push({
                    userId: session.userId,
                    username: this.getUserName(guildId, session.userId),
                    joinTime: session.startTime,
                    duration: Date.now() - session.startTime,
                    muted: session.muted,
                    deafened: session.deafened,
                    selfMuted: session.selfMuted,
                    selfDeafened: session.selfDeafened,
                    streaming: session.streaming,
                    camera: session.camera
                });
            }
        }

        return users;
    }

    getChannelName(guildId, channelId) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            const channel = guild?.channels.cache.get(channelId);
            return channel?.name || 'Unknown Channel';
        } catch {
            return 'Unknown Channel';
        }
    }

    getUserName(guildId, userId) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            const member = guild?.members.cache.get(userId);
            return member?.user.username || 'Unknown User';
        } catch {
            return 'Unknown User';
        }
    }

    getVoiceChannelVisualization(guildId) {
        const data = this.loadData();
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return null;

        const channels = [];
        
        // Get all voice channels in the guild
        guild.channels.cache
            .filter(channel => channel.type === 'GUILD_VOICE')
            .forEach(channel => {
                const channelData = data.voiceChannels[guildId]?.[channel.id] || {
                    name: channel.name,
                    totalJoins: 0,
                    totalDuration: 0,
                    peakUsers: 0,
                    currentUsers: 0,
                    lastActivity: 0,
                    hourlyActivity: new Array(24).fill(0),
                    dailyActivity: {}
                };

                const currentUsers = this.getCurrentUsersInChannel(guildId, channel.id);
                
                channels.push({
                    id: channel.id,
                    name: channel.name,
                    position: channel.position,
                    userLimit: channel.userLimit,
                    bitrate: channel.bitrate,
                    parentId: channel.parentId,
                    currentUsers: currentUsers,
                    userCount: currentUsers.length,
                    peakUsers: channelData.peakUsers,
                    totalJoins: channelData.totalJoins,
                    totalDuration: channelData.totalDuration,
                    hourlyActivity: channelData.hourlyActivity,
                    dailyActivity: channelData.dailyActivity,
                    lastActivity: channelData.lastActivity,
                    utilization: channel.userLimit > 0 ? 
                        Math.round((currentUsers.length / channel.userLimit) * 100) : 0,
                    status: this.getChannelStatus(currentUsers.length, channel.userLimit)
                });
            });

        return {
            channels: channels.sort((a, b) => a.position - b.position),
            totalActiveUsers: channels.reduce((sum, ch) => sum + ch.userCount, 0),
            totalChannels: channels.length,
            activeChannels: channels.filter(ch => ch.userCount > 0).length,
            peakConcurrentUsers: Math.max(...channels.map(ch => ch.peakUsers), 0)
        };
    }

    getChannelStatus(currentUsers, userLimit) {
        if (currentUsers === 0) return 'empty';
        if (userLimit === 0) return 'active';
        
        const utilization = currentUsers / userLimit;
        if (utilization >= 1) return 'full';
        if (utilization >= 0.8) return 'crowded';
        if (utilization >= 0.5) return 'busy';
        return 'active';
    }

    getVoiceAnalytics(guildId, days = 7) {
        const data = this.loadData();
        const now = Date.now();
        const timeWindow = days * 24 * 60 * 60 * 1000;
        const since = now - timeWindow;

        const analytics = {
            overview: {
                totalSessions: 0,
                totalDuration: 0,
                averageSessionLength: 0,
                uniqueUsers: new Set(),
                peakConcurrentUsers: 0
            },
            channels: [],
            users: [],
            timeDistribution: new Array(24).fill(0),
            dailyActivity: {}
        };

        // Analyze user sessions
        if (data.userSessions[guildId]) {
            Object.entries(data.userSessions[guildId]).forEach(([userId, sessions]) => {
                const recentSessions = sessions.filter(session => session.startTime >= since);
                
                if (recentSessions.length > 0) {
                    analytics.overview.uniqueUsers.add(userId);
                    
                    const userDuration = recentSessions.reduce((sum, session) => sum + session.duration, 0);
                    analytics.overview.totalSessions += recentSessions.length;
                    analytics.overview.totalDuration += userDuration;

                    analytics.users.push({
                        userId: userId,
                        username: this.getUserName(guildId, userId),
                        sessions: recentSessions.length,
                        totalDuration: userDuration,
                        averageSession: Math.round(userDuration / recentSessions.length),
                        favoriteChannel: this.getUserFavoriteChannel(recentSessions)
                    });

                    // Update time distribution
                    recentSessions.forEach(session => {
                        const hour = new Date(session.startTime).getHours();
                        analytics.timeDistribution[hour]++;
                    });
                }
            });
        }

        // Analyze channel data
        if (data.voiceChannels[guildId]) {
            Object.entries(data.voiceChannels[guildId]).forEach(([channelId, channelData]) => {
                analytics.channels.push({
                    id: channelId,
                    name: channelData.name,
                    totalJoins: channelData.totalJoins,
                    totalDuration: channelData.totalDuration,
                    peakUsers: channelData.peakUsers,
                    currentUsers: channelData.currentUsers,
                    hourlyActivity: channelData.hourlyActivity,
                    popularity: this.calculateChannelPopularity(channelData),
                    averageSessionLength: channelData.totalJoins > 0 ? 
                        Math.round(channelData.totalDuration / channelData.totalJoins) : 0
                });
            });
        }

        // Calculate averages
        analytics.overview.uniqueUsers = analytics.overview.uniqueUsers.size;
        analytics.overview.averageSessionLength = analytics.overview.totalSessions > 0 ?
            Math.round(analytics.overview.totalDuration / analytics.overview.totalSessions) : 0;

        // Sort arrays
        analytics.channels.sort((a, b) => b.popularity - a.popularity);
        analytics.users.sort((a, b) => b.totalDuration - a.totalDuration);

        return analytics;
    }

    getUserFavoriteChannel(sessions) {
        const channelTime = {};
        
        sessions.forEach(session => {
            if (!channelTime[session.channelId]) {
                channelTime[session.channelId] = 0;
            }
            channelTime[session.channelId] += session.duration;
        });

        const favoriteChannelId = Object.entries(channelTime)
            .sort(([,a], [,b]) => b - a)[0]?.[0];

        return favoriteChannelId;
    }

    calculateChannelPopularity(channelData) {
        // Popularity based on joins, duration, and recency
        const recentActivityWeight = Math.max(0, 1 - (Date.now() - channelData.lastActivity) / (7 * 24 * 60 * 60 * 1000));
        return Math.round(
            (channelData.totalJoins * 0.3) + 
            (channelData.totalDuration / 1000 / 60 * 0.5) + // minutes
            (recentActivityWeight * 100 * 0.2)
        );
    }

    getPeakTimes(guildId, days = 7) {
        const data = this.loadData();
        const hourlyActivity = new Array(24).fill(0);
        const dailyActivity = {};

        if (data.voiceChannels[guildId]) {
            Object.values(data.voiceChannels[guildId]).forEach(channel => {
                // Combine hourly activity
                channel.hourlyActivity.forEach((count, hour) => {
                    hourlyActivity[hour] += count;
                });

                // Combine daily activity
                Object.entries(channel.dailyActivity || {}).forEach(([date, count]) => {
                    if (!dailyActivity[date]) {
                        dailyActivity[date] = 0;
                    }
                    dailyActivity[date] += count;
                });
            });
        }

        // Find peak hour
        const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
        
        // Find peak day (within the time window)
        const now = new Date();
        const timeWindow = days * 24 * 60 * 60 * 1000;
        const recentDays = Object.entries(dailyActivity)
            .filter(([date]) => {
                const dayTime = new Date(date).getTime();
                return (now.getTime() - dayTime) <= timeWindow;
            })
            .sort(([,a], [,b]) => b - a);

        return {
            peakHour: {
                hour: peakHour,
                activity: hourlyActivity[peakHour],
                timeString: `${peakHour}:00-${(peakHour + 1) % 24}:00`
            },
            peakDay: recentDays.length > 0 ? {
                date: recentDays[0][0],
                activity: recentDays[0][1]
            } : null,
            hourlyDistribution: hourlyActivity.map((activity, hour) => ({
                hour: hour,
                activity: activity,
                percentage: hourlyActivity.reduce((sum, val) => sum + val, 0) > 0 ?
                    Math.round((activity / hourlyActivity.reduce((sum, val) => sum + val, 0)) * 100) : 0
            })),
            dailyDistribution: recentDays.slice(0, 7).map(([date, activity]) => ({
                date: date,
                activity: activity,
                dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
            }))
        };
    }

    getChannelRecommendations(guildId) {
        const data = this.loadData();
        const visualization = this.getVoiceChannelVisualization(guildId);
        const analytics = this.getVoiceAnalytics(guildId, 30);
        
        const recommendations = [];

        // Underutilized channels
        const underutilized = visualization.channels.filter(ch => 
            ch.totalJoins < 10 && ch.peakUsers < 2 && ch.lastActivity < Date.now() - 7 * 24 * 60 * 60 * 1000
        );

        if (underutilized.length > 0) {
            recommendations.push({
                type: 'cleanup',
                priority: 'low',
                title: 'Underutilized Channels',
                description: `Consider removing or repurposing ${underutilized.length} rarely used voice channels`,
                channels: underutilized.map(ch => ch.name)
            });
        }

        // Overcrowded channels
        const overcrowded = visualization.channels.filter(ch => 
            ch.userLimit > 0 && ch.utilization > 80
        );

        if (overcrowded.length > 0) {
            recommendations.push({
                type: 'capacity',
                priority: 'high',
                title: 'Channel Capacity Issues',
                description: `${overcrowded.length} channels are frequently at capacity`,
                channels: overcrowded.map(ch => ch.name),
                suggestion: 'Consider increasing user limits or adding more channels'
            });
        }

        // High demand times
        const peakTimes = this.getPeakTimes(guildId);
        if (peakTimes.peakHour.activity > analytics.overview.totalSessions * 0.3) {
            recommendations.push({
                type: 'scheduling',
                priority: 'medium',
                title: 'Peak Usage Time',
                description: `Peak activity occurs at ${peakTimes.peakHour.timeString}`,
                suggestion: 'Consider scheduling events during off-peak hours for better experience'
            });
        }

        return recommendations;
    }

    performDailyCleanup() {
        const data = this.loadData();
        const now = Date.now();
        const retentionPeriod = data.settings.dataRetention * 24 * 60 * 60 * 1000;

        // Clean old user sessions
        Object.keys(data.userSessions).forEach(guildId => {
            Object.keys(data.userSessions[guildId]).forEach(userId => {
                data.userSessions[guildId][userId] = data.userSessions[guildId][userId]
                    .filter(session => (now - session.startTime) < retentionPeriod);
                
                if (data.userSessions[guildId][userId].length === 0) {
                    delete data.userSessions[guildId][userId];
                }
            });
        });

        // Clean old daily activity data
        Object.keys(data.voiceChannels).forEach(guildId => {
            Object.keys(data.voiceChannels[guildId]).forEach(channelId => {
                const dailyActivity = data.voiceChannels[guildId][channelId].dailyActivity;
                Object.keys(dailyActivity).forEach(date => {
                    const dayTime = new Date(date).getTime();
                    if ((now - dayTime) > retentionPeriod) {
                        delete dailyActivity[date];
                    }
                });
            });
        });

        this.saveData(data);
        console.log('🧹 Voice visualizer daily cleanup completed');
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

    exportVoiceData(guildId, format = 'json') {
        const data = this.loadData();
        const guildData = {
            voiceChannels: data.voiceChannels[guildId] || {},
            userSessions: data.userSessions[guildId] || {},
            analytics: this.getVoiceAnalytics(guildId, 30),
            peakTimes: this.getPeakTimes(guildId, 30),
            exportedAt: Date.now()
        };

        if (format === 'csv') {
            // Convert to CSV format for spreadsheet analysis
            return this.convertToCSV(guildData);
        }

        return guildData;
    }

    convertToCSV(data) {
        // Simplified CSV conversion for voice data
        const lines = ['Channel,Total Joins,Total Duration (minutes),Peak Users,Current Users'];
        
        Object.entries(data.voiceChannels).forEach(([channelId, channel]) => {
            lines.push([
                channel.name,
                channel.totalJoins,
                Math.round(channel.totalDuration / 60000),
                channel.peakUsers,
                channel.currentUsers
            ].join(','));
        });

        return lines.join('\n');
    }
}

module.exports = VoiceVisualizerAPI;
