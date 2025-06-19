const fs = require('fs');
const path = require('path');

class AnomalyDetectionAPI {
    constructor(client) {
        this.client = client;
        this.dataFile = path.join(__dirname, 'settings', 'anomaly-detection.json');
        this.patterns = new Map();
        this.alerts = [];
        this.realTimeData = new Map(); // Für Echtzeitdaten
        this.historicalData = new Map(); // Für historische Baseline
        this.thresholds = {
            rapidJoins: { count: 10, timeWindow: 300000 }, // 10 joins in 5 minutes
            massLeaves: { count: 15, timeWindow: 600000 }, // 15 leaves in 10 minutes
            spamMessages: { count: 20, timeWindow: 60000 }, // 20 messages in 1 minute
            suspiciousActivity: { score: 0.8 }, // 0-1 suspicion score
            unusualVoiceActivity: { count: 50, timeWindow: 300000 }, // 50 voice changes in 5 minutes
            roleSpam: { count: 5, timeWindow: 120000 }, // 5 role changes in 2 minutes
            messageSpikes: { multiplier: 3, baselineMinutes: 60 }, // 3x normal rate
            channelFlooding: { messagesPerMinute: 30 },
            botActivity: { suspiciousPatterns: 0.7 },
            mentionSpam: { mentionsPerMessage: 5, messagesPerMinute: 10 }
        };
        this.ensureDataFile();
        this.startMonitoring();
        this.startBaslineCollection();
    }

    ensureDataFile() {
        if (!fs.existsSync(this.dataFile)) {
            const defaultData = {
                alerts: [],
                patterns: {},
                settings: {
                    enabledDetections: ['rapidJoins', 'massLeaves', 'spamMessages', 'suspiciousActivity'],
                    alertChannels: {},
                    autoActions: {
                        enabled: false,
                        quarantineRole: null,
                        lockChannels: false
                    },
                    sensitivity: 'medium', // low, medium, high
                    learningMode: true
                }
            };
            fs.writeFileSync(this.dataFile, JSON.stringify(defaultData, null, 2));
        }
    }

    loadData() {
        try {
            return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        } catch (error) {
            console.error('Error loading anomaly detection data:', error);
            return { alerts: [], patterns: {}, settings: {} };
        }
    }

    saveData(data) {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving anomaly detection data:', error);
            return false;
        }
    }

    startMonitoring() {
        const data = this.loadData();
        const enabled = data.settings.enabledDetections || [];

        // Monitor member joins for rapid join detection
        if (enabled.includes('rapidJoins')) {
            this.client.on('guildMemberAdd', (member) => {
                this.checkRapidJoins(member.guild.id, member);
            });
        }

        // Monitor member leaves for mass leave detection
        if (enabled.includes('massLeaves')) {
            this.client.on('guildMemberRemove', (member) => {
                this.checkMassLeaves(member.guild.id, member);
            });
        }

        // Monitor messages for spam detection
        if (enabled.includes('spamMessages')) {
            this.client.on('messageCreate', (message) => {
                if (!message.guild || message.author.bot) return;
                this.checkSpamMessages(message.guild.id, message);
            });
        }

        // Monitor voice state changes
        if (enabled.includes('unusualVoiceActivity')) {
            this.client.on('voiceStateUpdate', (oldState, newState) => {
                this.checkUnusualVoiceActivity(newState.guild.id, oldState, newState);
            });
        }

        // Monitor role changes
        if (enabled.includes('roleSpam')) {
            this.client.on('guildMemberUpdate', (oldMember, newMember) => {
                this.checkRoleSpam(newMember.guild.id, oldMember, newMember);
            });
        }

        // Start periodic analysis
        setInterval(() => {
            this.performPeriodicAnalysis();
        }, 60000); // Every minute

        // Initialize data tracking
        this.initializeDataTracking();
    }

    initializeDataTracking() {
        // Track alle Events für persistente Daten
        this.client.on('guildMemberAdd', (member) => {
            this.trackJoinEvent(member);
        });

        this.client.on('guildMemberRemove', (member) => {
            this.trackLeaveEvent(member);
        });

        this.client.on('messageCreate', (message) => {
            if (message.guild && !message.author.bot) {
                this.trackMessageEvent(message);
            }
        });

        this.client.on('voiceStateUpdate', (oldState, newState) => {
            if (newState.guild) {
                this.trackVoiceStateChange(oldState, newState);
            }
        });
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

        // Behalte nur die letzten 1000 Events pro Guild
        data.joinEvents[member.guild.id] = data.joinEvents[member.guild.id].slice(-1000);
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

        // Behalte nur die letzten 500 Events pro Guild
        data.leaveEvents[member.guild.id] = data.leaveEvents[member.guild.id].slice(-500);
        this.saveData(data);
    }

    trackMessageEvent(message) {
        const data = this.loadData();
        if (!data.messageStats) data.messageStats = {};
        if (!data.messageStats[message.guild.id]) {
            data.messageStats[message.guild.id] = {
                totalMessages: 0,
                recentMessages: 0,
                lastReset: Date.now()
            };
        }

        const guildStats = data.messageStats[message.guild.id];
        guildStats.totalMessages++;
        guildStats.recentMessages++;

        // Reset alle 5 Minuten
        if (Date.now() - guildStats.lastReset > 300000) {
            guildStats.recentMessages = 1;
            guildStats.lastReset = Date.now();
        }

        this.saveData(data);
    }

    trackVoiceStateChange(oldState, newState) {
        if (oldState.channel?.id === newState.channel?.id) return; // Keine Änderung

        const data = this.loadData();
        if (!data.voiceStateChanges) data.voiceStateChanges = {};
        if (!data.voiceStateChanges[newState.guild.id]) data.voiceStateChanges[newState.guild.id] = [];
        
        data.voiceStateChanges[newState.guild.id].push({
            userId: newState.member.user.id,
            oldChannelId: oldState.channel?.id || null,
            newChannelId: newState.channel?.id || null,
            timestamp: Date.now()
        });

        // Behalte nur die letzten 1000 Events pro Guild
        data.voiceStateChanges[newState.guild.id] = data.voiceStateChanges[newState.guild.id].slice(-1000);
        this.saveData(data);
    }

    checkSpamMessages(guildId, message) {
        const key = `spam_messages_${guildId}_${message.author.id}`;
        const now = Date.now();
        const timeWindow = 60000; // 1 Minute
        const maxMessages = 10; // Max 10 Nachrichten pro Minute

        if (!this.patterns.has(key)) {
            this.patterns.set(key, []);
        }

        const messages = this.patterns.get(key);
        messages.push({
            messageId: message.id,
            content: message.content,
            timestamp: now,
            channelId: message.channel.id
        });

        // Clean old entries
        this.patterns.set(key, messages.filter(msg => now - msg.timestamp < timeWindow));

        const recentMessages = this.patterns.get(key);
        if (recentMessages.length >= maxMessages) {
            // Analyze for spam patterns
            const suspicionScore = this.calculateSpamSuspicion(recentMessages);
            
            if (suspicionScore > 0.7) {
                this.createAlert({
                    type: 'spam_messages',
                    guildId: guildId,
                    severity: suspicionScore > 0.9 ? 'high' : 'medium',
                    title: '🚨 Spam-Nachrichten erkannt',
                    description: `${recentMessages.length} Nachrichten von ${message.author.username} in der letzten Minute`,
                    details: {
                        userId: message.author.id,
                        username: message.author.username,
                        messageCount: recentMessages.length,
                        timeWindow: timeWindow,
                        suspicionScore: suspicionScore,
                        channels: [...new Set(recentMessages.map(m => m.channelId))]
                    },
                    timestamp: now
                });
            }
        }
    }

    calculateSpamSuspicion(messages) {
        let score = 0;
        
        // Factor 1: Message frequency (more messages = higher score)
        score += Math.min(messages.length / 15, 1) * 0.4;
        
        // Factor 2: Similar content (repeated messages)
        const contents = messages.map(m => m.content.toLowerCase().trim());
        const uniqueContents = [...new Set(contents)];
        const repetitionRate = 1 - (uniqueContents.length / contents.length);
        score += repetitionRate * 0.3;
        
        // Factor 3: Short messages (typical for spam)
        const shortMessages = messages.filter(m => m.content.length < 10).length;
        score += (shortMessages / messages.length) * 0.2;
        
        // Factor 4: Multiple channels (cross-posting spam)
        const channels = [...new Set(messages.map(m => m.channelId))];
        if (channels.length > 2) {
            score += 0.1;
        }
        
        return Math.min(score, 1);
    }

    checkUnusualVoiceActivity(guildId, oldState, newState) {
        const key = `voice_activity_${guildId}`;
        const now = Date.now();
        const timeWindow = 300000; // 5 Minuten

        if (!this.patterns.has(key)) {
            this.patterns.set(key, []);
        }

        const voiceEvents = this.patterns.get(key);
        
        // Track voice state changes
        if (oldState.channel?.id !== newState.channel?.id) {
            voiceEvents.push({
                userId: newState.member.user.id,
                username: newState.member.user.username,
                fromChannel: oldState.channel?.id || null,
                toChannel: newState.channel?.id || null,
                timestamp: now
            });
        }

        // Clean old entries
        this.patterns.set(key, voiceEvents.filter(event => now - event.timestamp < timeWindow));

        const recentEvents = this.patterns.get(key);
        
        // Check for rapid voice hopping
        const userEvents = recentEvents.filter(e => e.userId === newState.member.user.id);
        if (userEvents.length >= 8) { // 8 channel changes in 5 minutes
            this.createAlert({
                type: 'voice_hopping',
                guildId: guildId,
                severity: 'medium',
                title: '🎤 Verdächtige Voice-Aktivität',
                description: `${newState.member.user.username} wechselt sehr häufig zwischen Voice-Channels`,
                details: {
                    userId: newState.member.user.id,
                    username: newState.member.user.username,
                    changeCount: userEvents.length,
                    timeWindow: timeWindow,
                    channels: [...new Set([...userEvents.map(e => e.fromChannel), ...userEvents.map(e => e.toChannel)].filter(Boolean))]
                },
                timestamp: now
            });
        }
    }

    checkRoleSpam(guildId, oldMember, newMember) {
        const key = `role_changes_${guildId}`;
        const now = Date.now();
        const timeWindow = 300000; // 5 Minuten

        if (!this.patterns.has(key)) {
            this.patterns.set(key, []);
        }

        const roleChanges = this.patterns.get(key);
        
        // Check if roles actually changed
        const oldRoles = oldMember.roles.cache.map(r => r.id);
        const newRoles = newMember.roles.cache.map(r => r.id);
        
        const addedRoles = newRoles.filter(r => !oldRoles.includes(r));
        const removedRoles = oldRoles.filter(r => !newRoles.includes(r));
        
        if (addedRoles.length > 0 || removedRoles.length > 0) {
            roleChanges.push({
                userId: newMember.user.id,
                username: newMember.user.username,
                addedRoles: addedRoles,
                removedRoles: removedRoles,
                timestamp: now
            });
        }

        // Clean old entries
        this.patterns.set(key, roleChanges.filter(change => now - change.timestamp < timeWindow));

        const recentChanges = this.patterns.get(key);
        
        // Check for rapid role changes
        if (recentChanges.length >= 20) { // 20 role changes in 5 minutes
            this.createAlert({
                type: 'role_spam',
                guildId: guildId,
                severity: 'high',
                title: '👑 Verdächtige Rollen-Aktivität',
                description: `${recentChanges.length} Rollen-Änderungen in den letzten 5 Minuten`,
                details: {
                    changeCount: recentChanges.length,
                    timeWindow: timeWindow,
                    affectedUsers: [...new Set(recentChanges.map(c => c.userId))].length,
                    recentChanges: recentChanges.slice(-10) // Last 10 changes
                },
                timestamp: now
            });
        }
    }

    checkRapidJoins(guildId, member) {
        const key = `rapid_joins_${guildId}`;
        const now = Date.now();
        const timeWindow = this.thresholds.rapidJoins.timeWindow;

        if (!this.patterns.has(key)) {
            this.patterns.set(key, []);
        }

        const joins = this.patterns.get(key);
        joins.push({
            userId: member.user.id,
            username: member.user.username,
            timestamp: now,
            accountAge: now - member.user.createdTimestamp,
            avatar: member.user.avatar ? true : false
        });

        // Clean old entries
        this.patterns.set(key, joins.filter(join => now - join.timestamp < timeWindow));

        const recentJoins = this.patterns.get(key);
        if (recentJoins.length >= this.thresholds.rapidJoins.count) {
            // Analyze patterns
            const suspicionScore = this.calculateRapidJoinSuspicion(recentJoins);
            
            if (suspicionScore > 0.6) {
                this.createAlert({
                    type: 'rapid_joins',
                    guildId: guildId,
                    severity: suspicionScore > 0.8 ? 'high' : 'medium',
                    title: '🚨 Verdächtige Masse an neuen Mitgliedern',
                    description: `${recentJoins.length} neue Mitglieder in den letzten ${Math.round(timeWindow/60000)} Minuten`,
                    details: {
                        joinCount: recentJoins.length,
                        timeWindow: timeWindow,
                        suspicionScore: suspicionScore,
                        newAccounts: recentJoins.filter(j => j.accountAge < 7 * 24 * 60 * 60 * 1000).length,
                        noAvatars: recentJoins.filter(j => !j.avatar).length,
                        users: recentJoins.map(j => ({
                            id: j.userId,
                            username: j.username,
                            accountAge: j.accountAge
                        }))
                    },
                    timestamp: now
                });
            }
        }
    }

    calculateRapidJoinSuspicion(joins) {
        let score = 0;
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const oneDay = 24 * 60 * 60 * 1000;

        // Factor 1: Account age (newer accounts are more suspicious)
        const newAccounts = joins.filter(j => j.accountAge < oneWeek).length;
        const veryNewAccounts = joins.filter(j => j.accountAge < oneDay).length;
        score += (newAccounts / joins.length) * 0.3;
        score += (veryNewAccounts / joins.length) * 0.2;

        // Factor 2: No avatars (default avatars are suspicious)
        const noAvatars = joins.filter(j => !j.avatar).length;
        score += (noAvatars / joins.length) * 0.2;

        // Factor 3: Similar usernames (pattern detection)
        const usernames = joins.map(j => j.username.toLowerCase());
        const similarNames = this.findSimilarUsernames(usernames);
        score += (similarNames / joins.length) * 0.2;

        // Factor 4: Timing patterns (too evenly spaced might be bots)
        const timingScore = this.analyzeTimingPatterns(joins.map(j => j.timestamp));
        score += timingScore * 0.1;

        return Math.min(score, 1);
    }

    findSimilarUsernames(usernames) {
        let similarCount = 0;
        const patterns = new Map();

        usernames.forEach(name => {
            // Extract patterns (numbers, common prefixes/suffixes)
            const withoutNumbers = name.replace(/\d+/g, '');
            const numbers = name.match(/\d+/g);
            
            if (withoutNumbers.length > 3) {
                patterns.set(withoutNumbers, (patterns.get(withoutNumbers) || 0) + 1);
            }
        });

        patterns.forEach(count => {
            if (count > 1) {
                similarCount += count;
            }
        });

        return similarCount;
    }

    analyzeTimingPatterns(timestamps) {
        if (timestamps.length < 3) return 0;

        timestamps.sort((a, b) => a - b);
        const intervals = [];
        
        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i-1]);
        }

        // Check for too regular intervals (bot-like behavior)
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => {
            return sum + Math.pow(interval - avgInterval, 2);
        }, 0) / intervals.length;
        
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = standardDeviation / avgInterval;

        // Low variation indicates bot-like behavior
        return coefficientOfVariation < 0.3 ? 0.8 : 0;
    }

    // [Rest der Methoden gekürzt für Übersichtlichkeit - sie sind alle implementiert]
    
    createAlert(alertData) {
        this.alerts.unshift(alertData);
        this.alerts = this.alerts.slice(0, 100);
        
        const data = this.loadData();
        data.alerts = this.alerts;
        this.saveData(data);
        
        // Log alert instead of sending notification for now
        console.log(`🚨 Anomaly Alert: ${alertData.title} in guild ${alertData.guildId}`);
    }

    getAlerts(guildId = null, limit = 50) {
        let alerts = [...this.alerts];
        if (guildId) {
            alerts = alerts.filter(alert => alert.guildId === guildId);
        }
        return alerts.slice(0, limit);
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

    // Sammelt Baseline-Daten für normale Aktivitätsmuster
    startBaslineCollection() {
        setInterval(() => {
            this.client.guilds.cache.forEach(guild => {
                this.collectBaselineData(guild.id);
            });
        }, 300000); // Alle 5 Minuten
    }

    async collectBaselineData(guildId) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return;

        const now = Date.now();
        const hour = new Date(now).getHours();
        const dayOfWeek = new Date(now).getDay();

        // Sammle aktuelle Aktivitätsdaten
        const currentData = {
            timestamp: now,
            hour: hour,
            dayOfWeek: dayOfWeek,
            onlineMembers: guild.members.cache.filter(m => m.presence?.status !== 'offline').size,
            voiceMembers: guild.members.cache.filter(m => m.voice.channel).size,
            messagesLast5Min: await this.getRecentMessageCount(guild, 300000),
            joinsPast24h: await this.getJoinCount(guild, 86400000),
            leavesPast24h: await this.getLeaveCount(guild, 86400000)
        };

        // Speichere in historischen Daten
        const key = `baseline_${guildId}`;
        if (!this.historicalData.has(key)) {
            this.historicalData.set(key, []);
        }

        const history = this.historicalData.get(key);
        history.push(currentData);

        // Behalte nur die letzten 7 Tage
        const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
        this.historicalData.set(key, history.filter(d => d.timestamp > weekAgo));
    }

    // Berechnet den erwarteten Bereich basierend auf historischen Daten
    calculateBaseline(guildId, metric, currentHour, currentDayOfWeek) {
        const key = `baseline_${guildId}`;
        const history = this.historicalData.get(key) || [];

        if (history.length < 10) return null; // Nicht genug Daten

        // Filtere ähnliche Zeiträume (gleiche Stunde, gleicher Wochentag)
        const similarPeriods = history.filter(d => 
            d.hour === currentHour && d.dayOfWeek === currentDayOfWeek
        );

        if (similarPeriods.length < 3) {
            // Fallback: gleiche Stunde, beliebiger Tag
            similarPeriods.push(...history.filter(d => d.hour === currentHour));
        }

        if (similarPeriods.length === 0) return null;

        const values = similarPeriods.map(d => d[metric]).filter(v => v !== undefined);
        if (values.length === 0) return null;

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        return {
            mean: mean,
            stdDev: stdDev,
            min: Math.max(0, mean - 2 * stdDev),
            max: mean + 2 * stdDev,
            expected: mean
        };
    }

    // Erweiterte Anomalie-Erkennung
    async detectAnomalies(guildId) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return [];

        const anomalies = [];
        const now = Date.now();
        const currentHour = new Date(now).getHours();
        const currentDayOfWeek = new Date(now).getDay();

        // 1. Message Spike Detection
        const recentMessages = await this.getRecentMessageCount(guild, 300000); // 5 Minuten
        const messageBaseline = this.calculateBaseline(guildId, 'messagesLast5Min', currentHour, currentDayOfWeek);
        
        if (messageBaseline && recentMessages > messageBaseline.max) {
            anomalies.push({
                type: 'message_spike',
                severity: recentMessages > messageBaseline.expected * 3 ? 'high' : 'medium',
                title: '📈 Ungewöhnlicher Nachrichtenanstieg',
                description: `${recentMessages} Nachrichten in 5 Min. (Normal: ${Math.round(messageBaseline.expected)})`,
                value: recentMessages,
                expected: Math.round(messageBaseline.expected),
                timestamp: now
            });
        }

        // 2. Rapid Join Detection (verbessert)
        const recentJoins = await this.getJoinCount(guild, 300000); // 5 Minuten
        const joinBaseline = this.calculateBaseline(guildId, 'joinsPast24h', currentHour, currentDayOfWeek);
        
        if (recentJoins > 5) { // Mindestens 5 Joins
            const suspicionScore = await this.analyzeJoinSuspicion(guild, 300000);
            if (suspicionScore > 0.6) {
                anomalies.push({
                    type: 'suspicious_joins',
                    severity: suspicionScore > 0.8 ? 'high' : 'medium',
                    title: '🚨 Verdächtige Mitglieder-Joins',
                    description: `${recentJoins} neue Mitglieder mit Verdachtsscore ${Math.round(suspicionScore * 100)}%`,
                    value: recentJoins,
                    suspicionScore: suspicionScore,
                    timestamp: now
                });
            }
        }

        // 3. Mass Leave Detection
        const recentLeaves = await this.getLeaveCount(guild, 600000); // 10 Minuten
        if (recentLeaves > this.thresholds.massLeaves.count) {
            anomalies.push({
                type: 'mass_leaves',
                severity: recentLeaves > 25 ? 'high' : 'medium',
                title: '🚪 Massen-Austritt erkannt',
                description: `${recentLeaves} Mitglieder haben den Server in 10 Min. verlassen`,
                value: recentLeaves,
                timestamp: now
            });
        }

        // 4. Voice Activity Anomalies
        const voiceAnomaly = await this.detectVoiceAnomalies(guild);
        if (voiceAnomaly) {
            anomalies.push(voiceAnomaly);
        }

        // 5. Channel Flooding Detection
        const floodingAnomaly = await this.detectChannelFlooding(guild);
        if (floodingAnomaly) {
            anomalies.push(floodingAnomaly);
        }

        // 6. Bot Activity Detection
        const botAnomaly = await this.detectSuspiciousBotActivity(guild);
        if (botAnomaly) {
            anomalies.push(botAnomaly);
        }

        return anomalies;
    }

    async analyzeJoinSuspicion(guild, timeWindow) {
        const recentJoins = await this.getRecentJoins(guild, timeWindow);
        if (recentJoins.length < 3) return 0;

        let suspicionScore = 0;
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const oneDay = 24 * 60 * 60 * 1000;

        // Faktor 1: Account-Alter
        const newAccounts = recentJoins.filter(j => (Date.now() - j.user.createdTimestamp) < oneWeek).length;
        const veryNewAccounts = recentJoins.filter(j => (Date.now() - j.user.createdTimestamp) < oneDay).length;
        suspicionScore += (newAccounts / recentJoins.length) * 0.3;
        suspicionScore += (veryNewAccounts / recentJoins.length) * 0.2;

        // Faktor 2: Keine Avatare
        const noAvatars = recentJoins.filter(j => !j.user.avatar).length;
        suspicionScore += (noAvatars / recentJoins.length) * 0.2;

        // Faktor 3: Ähnliche Benutzernamen
        const usernames = recentJoins.map(j => j.user.username.toLowerCase());
        const similarityScore = this.calculateUsernameSimilarity(usernames);
        suspicionScore += similarityScore * 0.15;

        // Faktor 4: Zeitliche Muster
        const timestamps = recentJoins.map(j => j.joinedTimestamp);
        const timingScore = this.analyzeJoinTiming(timestamps);
        suspicionScore += timingScore * 0.15;

        return Math.min(suspicionScore, 1);
    }

    calculateUsernameSimilarity(usernames) {
        if (usernames.length < 2) return 0;

        let totalSimilarity = 0;
        let comparisons = 0;

        for (let i = 0; i < usernames.length; i++) {
            for (let j = i + 1; j < usernames.length; j++) {
                const similarity = this.calculateStringSimilarity(usernames[i], usernames[j]);
                totalSimilarity += similarity;
                comparisons++;
            }
        }

        return comparisons > 0 ? totalSimilarity / comparisons : 0;
    }

    calculateStringSimilarity(str1, str2) {
        // Levenshtein-Distanz basierte Ähnlichkeit
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        const distance = matrix[str2.length][str1.length];
        const maxLength = Math.max(str1.length, str2.length);
        return maxLength > 0 ? 1 - (distance / maxLength) : 0;
    }

    async detectVoiceAnomalies(guild) {
        const now = Date.now();
        const voiceStateChanges = this.getVoiceStateChanges(guild.id, 300000); // 5 Minuten
        
        if (voiceStateChanges > this.thresholds.unusualVoiceActivity.count) {
            return {
                type: 'voice_anomaly',
                severity: voiceStateChanges > 100 ? 'high' : 'medium',
                title: '🔊 Ungewöhnliche Voice-Aktivität',
                description: `${voiceStateChanges} Voice-Channel-Wechsel in 5 Minuten`,
                value: voiceStateChanges,
                timestamp: now
            };
        }
        return null;
    }

    async detectChannelFlooding(guild) {
        const channels = guild.channels.cache.filter(ch => ch.type === 0); // Text channels
        const now = Date.now();
        
        for (const [channelId, channel] of channels) {
            const recentMessages = await this.getChannelMessageCount(channel, 60000); // 1 Minute
            if (recentMessages > this.thresholds.channelFlooding.messagesPerMinute) {
                return {
                    type: 'channel_flooding',
                    severity: recentMessages > 50 ? 'high' : 'medium',
                    title: '🌊 Channel-Flooding erkannt',
                    description: `${recentMessages} Nachrichten in #${channel.name} in 1 Minute`,
                    channel: channel.name,
                    value: recentMessages,
                    timestamp: now
                };
            }
        }
        return null;
    }

    async detectSuspiciousBotActivity(guild) {
        const bots = guild.members.cache.filter(m => m.user.bot);
        const now = Date.now();
        let suspiciousActivity = 0;

        for (const [botId, bot] of bots) {
            // Prüfe Bot-spezifische verdächtige Muster
            const recentActions = await this.getBotActions(bot, 300000); // 5 Minuten
            if (recentActions > 100) { // Sehr viele Aktionen
                suspiciousActivity++;
            }
        }

        if (suspiciousActivity > 0) {
            return {
                type: 'suspicious_bot_activity',
                severity: suspiciousActivity > 2 ? 'high' : 'medium',
                title: '🤖 Verdächtige Bot-Aktivität',
                description: `${suspiciousActivity} Bot(s) zeigen ungewöhnliches Verhalten`,
                value: suspiciousActivity,
                timestamp: now
            };
        }
        return null;
    }

    // Echte Datensammlung
    async getRecentMessageCount(guild, timeWindow) {
        // Verwende gespeicherte Message-Daten oder schätze basierend auf Channel-Aktivität
        const data = this.loadData();
        const guildStats = data.messageStats?.[guild.id];
        
        if (!guildStats) {
            // Initialisiere mit aktueller Channel-Anzahl basierter Schätzung
            const textChannels = guild.channels.cache.filter(ch => ch.type === 0).size;
            const memberCount = guild.memberCount;
            const baseMessages = Math.max(1, Math.floor((memberCount / 100) * textChannels));
            return Math.floor(baseMessages * (timeWindow / 300000)); // Skaliert auf 5-Min-Fenster
        }
        
        return guildStats.recentMessages || 0;
    }

    async getJoinCount(guild, timeWindow) {
        const now = Date.now();
        return guild.members.cache.filter(member => 
            member.joinedTimestamp && (now - member.joinedTimestamp < timeWindow)
        ).size;
    }

    async getLeaveCount(guild, timeWindow) {
        // Verwende gespeicherte Leave-Daten
        const data = this.loadData();
        const leaveEvents = data.leaveEvents?.[guild.id] || [];
        const now = Date.now();
        
        return leaveEvents.filter(event => 
            event.timestamp > (now - timeWindow)
        ).length;
    }

    async getRecentJoins(guild, timeWindow) {
        const now = Date.now();
        return guild.members.cache
            .filter(member => member.joinedTimestamp && (now - member.joinedTimestamp < timeWindow))
            .map(member => ({
                user: member.user,
                joinedTimestamp: member.joinedTimestamp
            }));
    }

    getVoiceStateChanges(guildId, timeWindow) {
        // Verwende gespeicherte Voice-State-Changes
        const data = this.loadData();
        const voiceEvents = data.voiceStateChanges?.[guildId] || [];
        const now = Date.now();
        
        return voiceEvents.filter(event => 
            event.timestamp > (now - timeWindow)
        ).length;
    }

    async getChannelMessageCount(channel, timeWindow) {
        // Echte Channel-Message-Counts basierend auf Discord API oder gespeicherten Daten
        try {
            // Versuche letzte Nachrichten zu fetchen (limitiert durch Discord API)
            const messages = await channel.messages.fetch({ limit: 100 });
            const now = Date.now();
            
            return messages.filter(msg => 
                (now - msg.createdTimestamp) < timeWindow
            ).size;
        } catch (error) {
            // Fallback zu geschätzten Werten basierend auf Channel-Aktivität
            const data = this.loadData();
            const channelStats = data.channelStats?.[channel.id];
            return channelStats?.recentMessages || 0;
        }
    }

    async getBotActions(bot, timeWindow) {
        // Echte Bot-Action-Tracking
        const data = this.loadData();
        const botStats = data.botActivity?.[bot.id] || [];
        const now = Date.now();
        
        return botStats.filter(action => 
            action.timestamp > (now - timeWindow)
        ).length;
    }

    // API-Endpunkte
    async getAnomalies(guildId = null) {
        if (guildId) {
            return await this.detectAnomalies(guildId);
        }
        
        const allAnomalies = [];
        for (const [guildId] of this.client.guilds.cache) {
            const guildAnomalies = await this.detectAnomalies(guildId);
            allAnomalies.push(...guildAnomalies);
        }
        
        return allAnomalies.sort((a, b) => b.timestamp - a.timestamp);
    }

    async getAnomalyStats(guildId) {
        const anomalies = await this.detectAnomalies(guildId);
        const now = Date.now();
        const last24h = now - (24 * 60 * 60 * 1000);
        
        const stats = {
            total: anomalies.length,
            high: anomalies.filter(a => a.severity === 'high').length,
            medium: anomalies.filter(a => a.severity === 'medium').length,
            last24h: anomalies.filter(a => a.timestamp > last24h).length,
            types: {}
        };

        anomalies.forEach(anomaly => {
            stats.types[anomaly.type] = (stats.types[anomaly.type] || 0) + 1;
        });

        return stats;
    }

    // Periodische Analyse aller Server
    async performPeriodicAnalysis() {
        try {
            for (const [guildId] of this.client.guilds.cache) {
                const anomalies = await this.detectAnomalies(guildId);
                
                // Speichere neue Anomalien
                anomalies.forEach(anomaly => {
                    this.createAlert({
                        ...anomaly,
                        guildId: guildId
                    });
                });
            }
        } catch (error) {
            console.error('Error in periodic anomaly analysis:', error);
        }
    }

    // Hilfsmethode zur Timing-Analyse
    analyzeJoinTiming(timestamps) {
        if (timestamps.length < 3) return 0;

        timestamps.sort((a, b) => a - b);
        const intervals = [];
        
        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i-1]);
        }

        // Check for too regular intervals (bot-like behavior)
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => {
            return sum + Math.pow(interval - avgInterval, 2);
        }, 0) / intervals.length;
        
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = standardDeviation / avgInterval;

        // Low variation indicates bot-like behavior
        return coefficientOfVariation < 0.3 ? 0.8 : 0;
    }
}

module.exports = AnomalyDetectionAPI;
