const fs = require('fs');
const path = require('path');

class SpamRaidDetectionAPI {
    constructor(client) {
        this.client = client;
        this.dataFile = path.join(__dirname, 'settings', 'spam-raid-detection.json');
        this.patterns = new Map();
        this.suspiciousUsers = new Map();
        this.raidProtection = {
            enabled: false,
            threshold: 5,
            timeWindow: 30000,
            autoActions: []
        };
        this.ensureDataFile();
        this.setupDetection();
    }

    ensureDataFile() {
        const settingsDir = path.join(__dirname, 'settings');
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.dataFile)) {
            const defaultData = {
                detectedRaids: [],
                spamPatterns: [],
                settings: {
                    enabled: true,
                    sensitivity: 'medium',
                    autoModeration: {
                        enabled: false,
                        deleteMessages: true,
                        muteSpammers: true,
                        kickRaiders: false,
                        banPersistentOffenders: false
                    },
                    thresholds: {
                        rapidMessages: 5,
                        identicalContent: 3,
                        massJoin: 10,
                        linkSpam: 3,
                        mentionSpam: 5
                    },
                    timeWindows: {
                        rapidMessages: 30000,
                        identicalContent: 60000,
                        massJoin: 300000,
                        linkSpam: 60000,
                        mentionSpam: 30000
                    },
                    whitelist: {
                        users: [],
                        roles: [],
                        channels: []
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
            console.error('Error loading spam raid detection data:', error);
            return { detectedRaids: [], spamPatterns: [], settings: {} };
        }
    }

    saveData(data) {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving spam raid detection data:', error);
            return false;
        }
    }

    setupDetection() {
        const data = this.loadData();
        if (!data.settings.enabled) return;

        // Message monitoring
        this.client.on('messageCreate', async (message) => {
            if (!message.guild || message.author.bot) return;
            await this.analyzeMessage(message);
        });

        // Member join monitoring
        this.client.on('guildMemberAdd', (member) => {
            this.analyzeJoinPattern(member);
        });

        // Periodic cleanup and analysis
        setInterval(() => {
            this.performPeriodicAnalysis();
        }, 60000); // Every minute
    }

    async analyzeMessage(message) {
        const data = this.loadData();
        
        // Check whitelist
        if (this.isWhitelisted(message.author, message.channel, data.settings.whitelist)) {
            return;
        }

        const results = await Promise.all([
            this.checkRapidMessages(message),
            this.checkIdenticalContent(message),
            this.checkLinkSpam(message),
            this.checkMentionSpam(message),
            this.checkSuspiciousPatterns(message)
        ]);

        const spamScore = results.reduce((total, result) => total + result.score, 0);
        const threats = results.filter(result => result.threat).map(result => result.type);

        if (spamScore > 0.7 || threats.length > 0) {
            await this.handleSpamDetection({
                message,
                spamScore,
                threats,
                details: results
            });
        }

        // Update user suspicion score
        this.updateSuspicionScore(message.author.id, spamScore);
    }

    async checkRapidMessages(message) {
        const key = `rapid_${message.guild.id}_${message.author.id}`;
        const data = this.loadData();
        const threshold = data.settings.thresholds.rapidMessages;
        const timeWindow = data.settings.timeWindows.rapidMessages;
        const now = Date.now();

        if (!this.patterns.has(key)) {
            this.patterns.set(key, []);
        }

        const messages = this.patterns.get(key);
        messages.push({
            id: message.id,
            timestamp: now,
            channelId: message.channel.id
        });

        // Clean old entries
        this.patterns.set(key, messages.filter(msg => now - msg.timestamp < timeWindow));

        const recentMessages = this.patterns.get(key);
        const score = Math.min(recentMessages.length / threshold, 1);

        return {
            type: 'rapid_messages',
            score: score > 0.8 ? score : 0,
            threat: recentMessages.length >= threshold,
            details: {
                messageCount: recentMessages.length,
                threshold: threshold,
                timeWindow: timeWindow
            }
        };
    }

    async checkIdenticalContent(message) {
        const key = `identical_${message.guild.id}_${message.author.id}`;
        const data = this.loadData();
        const threshold = data.settings.thresholds.identicalContent;
        const timeWindow = data.settings.timeWindows.identicalContent;
        const now = Date.now();

        if (!this.patterns.has(key)) {
            this.patterns.set(key, []);
        }

        const messages = this.patterns.get(key);
        messages.push({
            content: message.content.toLowerCase().trim(),
            timestamp: now
        });

        // Clean old entries
        this.patterns.set(key, messages.filter(msg => now - msg.timestamp < timeWindow));

        const recentMessages = this.patterns.get(key);
        const contentCounts = new Map();
        
        recentMessages.forEach(msg => {
            contentCounts.set(msg.content, (contentCounts.get(msg.content) || 0) + 1);
        });

        const maxRepeats = Math.max(...contentCounts.values());
        const score = Math.min(maxRepeats / threshold, 1);

        return {
            type: 'identical_content',
            score: score > 0.8 ? score : 0,
            threat: maxRepeats >= threshold,
            details: {
                maxRepeats: maxRepeats,
                threshold: threshold,
                uniqueMessages: contentCounts.size
            }
        };
    }

    async checkLinkSpam(message) {
        const data = this.loadData();
        const threshold = data.settings.thresholds.linkSpam;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = message.content.match(urlRegex) || [];

        if (urls.length === 0) {
            return { type: 'link_spam', score: 0, threat: false, details: {} };
        }

        const key = `links_${message.guild.id}_${message.author.id}`;
        const timeWindow = data.settings.timeWindows.linkSpam;
        const now = Date.now();

        if (!this.patterns.has(key)) {
            this.patterns.set(key, []);
        }

        const links = this.patterns.get(key);
        urls.forEach(url => {
            links.push({
                url: url,
                timestamp: now,
                domain: this.extractDomain(url)
            });
        });

        // Clean old entries
        this.patterns.set(key, links.filter(link => now - link.timestamp < timeWindow));

        const recentLinks = this.patterns.get(key);
        const score = Math.min(recentLinks.length / threshold, 1);

        // Check for suspicious link patterns
        const domains = recentLinks.map(link => link.domain);
        const uniqueDomains = new Set(domains).size;
        const suspiciousDomains = this.checkSuspiciousDomains(domains);

        return {
            type: 'link_spam',
            score: score > 0.7 ? score + (suspiciousDomains * 0.3) : 0,
            threat: recentLinks.length >= threshold || suspiciousDomains > 0,
            details: {
                linkCount: recentLinks.length,
                uniqueDomains: uniqueDomains,
                suspiciousDomains: suspiciousDomains,
                threshold: threshold
            }
        };
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return 'unknown';
        }
    }

    checkSuspiciousDomains(domains) {
        const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.ru', '.su'];
        const shorteners = ['bit.ly', 'tinyurl.com', 'short.link', 't.co'];
        
        let suspiciousCount = 0;
        
        domains.forEach(domain => {
            if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
                suspiciousCount++;
            }
            if (shorteners.some(shortener => domain.includes(shortener))) {
                suspiciousCount++;
            }
        });

        return suspiciousCount;
    }

    async checkMentionSpam(message) {
        const data = this.loadData();
        const threshold = data.settings.thresholds.mentionSpam;
        const mentions = message.mentions.users.size + message.mentions.roles.size;

        if (mentions === 0) {
            return { type: 'mention_spam', score: 0, threat: false, details: {} };
        }

        const key = `mentions_${message.guild.id}_${message.author.id}`;
        const timeWindow = data.settings.timeWindows.mentionSpam;
        const now = Date.now();

        if (!this.patterns.has(key)) {
            this.patterns.set(key, []);
        }

        const mentionEvents = this.patterns.get(key);
        mentionEvents.push({
            count: mentions,
            timestamp: now,
            hasEveryone: message.mentions.everyone
        });

        // Clean old entries
        this.patterns.set(key, mentionEvents.filter(event => now - event.timestamp < timeWindow));

        const recentMentions = this.patterns.get(key);
        const totalMentions = recentMentions.reduce((sum, event) => sum + event.count, 0);
        const hasEveryoneMention = recentMentions.some(event => event.hasEveryone);

        const score = Math.min(totalMentions / threshold, 1);

        return {
            type: 'mention_spam',
            score: score > 0.7 ? score + (hasEveryoneMention ? 0.5 : 0) : 0,
            threat: totalMentions >= threshold || hasEveryoneMention,
            details: {
                totalMentions: totalMentions,
                threshold: threshold,
                hasEveryoneMention: hasEveryoneMention,
                mentionEvents: recentMentions.length
            }
        };
    }

    async checkSuspiciousPatterns(message) {
        let score = 0;
        const patterns = [];

        // Check for Discord invite links
        if (message.content.match(/discord\.gg\/[a-zA-Z0-9]+/)) {
            score += 0.6;
            patterns.push('discord_invite');
        }

        // Check for excessive emojis
        const emojiCount = (message.content.match(/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}]/gu) || []).length;
        if (emojiCount > 10) {
            score += 0.3;
            patterns.push('emoji_spam');
        }

        // Check for excessive caps
        const upperCaseRatio = (message.content.match(/[A-Z]/g) || []).length / message.content.length;
        if (upperCaseRatio > 0.7 && message.content.length > 10) {
            score += 0.4;
            patterns.push('caps_spam');
        }

        // Check for repetitive characters
        if (message.content.match(/(.)\1{4,}/)) {
            score += 0.3;
            patterns.push('char_repeat');
        }

        return {
            type: 'suspicious_patterns',
            score: score,
            threat: score > 0.8,
            details: {
                patterns: patterns,
                emojiCount: emojiCount,
                upperCaseRatio: upperCaseRatio
            }
        };
    }

    analyzeJoinPattern(member) {
        const key = `joins_${member.guild.id}`;
        const data = this.loadData();
        const threshold = data.settings.thresholds.massJoin;
        const timeWindow = data.settings.timeWindows.massJoin;
        const now = Date.now();

        if (!this.patterns.has(key)) {
            this.patterns.set(key, []);
        }

        const joins = this.patterns.get(key);
        joins.push({
            userId: member.user.id,
            username: member.user.username,
            timestamp: now,
            accountAge: now - member.user.createdTimestamp,
            hasAvatar: !!member.user.avatar
        });

        // Clean old entries
        this.patterns.set(key, joins.filter(join => now - join.timestamp < timeWindow));

        const recentJoins = this.patterns.get(key);
        
        if (recentJoins.length >= threshold) {
            this.handleRaidDetection({
                guildId: member.guild.id,
                joinCount: recentJoins.length,
                timeWindow: timeWindow,
                joins: recentJoins
            });
        }
    }

    async handleSpamDetection(detectionData) {
        const { message, spamScore, threats, details } = detectionData;
        const data = this.loadData();

        // Log detection
        const detection = {
            type: 'spam',
            guildId: message.guild.id,
            userId: message.author.id,
            username: message.author.username,
            channelId: message.channel.id,
            messageId: message.id,
            spamScore: spamScore,
            threats: threats,
            timestamp: Date.now(),
            details: details
        };

        this.logDetection(detection);

        // Auto-moderation actions
        if (data.settings.autoModeration.enabled) {
            if (data.settings.autoModeration.deleteMessages && spamScore > 0.8) {
                try {
                    await message.delete();
                } catch (error) {
                    console.error('Error deleting spam message:', error);
                }
            }

            if (data.settings.autoModeration.muteSpammers && spamScore > 0.9) {
                try {
                    const member = message.guild.members.cache.get(message.author.id);
                    if (member) {
                        // Implement muting logic here
                        console.log(`Would mute user ${message.author.username} for spam`);
                    }
                } catch (error) {
                    console.error('Error muting spammer:', error);
                }
            }
        }

        // Send alert to moderation channel
        this.sendModerationAlert(detection);
    }

    async handleRaidDetection(raidData) {
        const data = this.loadData();
        
        const raid = {
            type: 'raid',
            guildId: raidData.guildId,
            joinCount: raidData.joinCount,
            timeWindow: raidData.timeWindow,
            timestamp: Date.now(),
            joins: raidData.joins,
            suspicionScore: this.calculateRaidSuspicion(raidData.joins)
        };

        this.logDetection(raid);

        // Auto-moderation for raids
        if (data.settings.autoModeration.enabled && raid.suspicionScore > 0.7) {
            if (data.settings.autoModeration.kickRaiders) {
                // Implement raid kicking logic
                console.log(`Would kick ${raidData.joinCount} suspicious users`);
            }
        }

        this.sendModerationAlert(raid);
    }

    calculateRaidSuspicion(joins) {
        let score = 0;
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;

        // Factor 1: New accounts
        const newAccounts = joins.filter(join => join.accountAge < oneWeek).length;
        score += (newAccounts / joins.length) * 0.4;

        // Factor 2: No avatars
        const noAvatars = joins.filter(join => !join.hasAvatar).length;
        score += (noAvatars / joins.length) * 0.3;

        // Factor 3: Similar usernames
        const usernames = joins.map(join => join.username.toLowerCase());
        const similarNames = this.findSimilarUsernames(usernames);
        score += (similarNames / joins.length) * 0.3;

        return Math.min(score, 1);
    }

    findSimilarUsernames(usernames) {
        let similarCount = 0;
        const patterns = new Map();

        usernames.forEach(name => {
            const withoutNumbers = name.replace(/\d+/g, '');
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

    updateSuspicionScore(userId, scoreIncrease) {
        const currentScore = this.suspiciousUsers.get(userId) || 0;
        const newScore = Math.min(currentScore + scoreIncrease, 1);
        this.suspiciousUsers.set(userId, newScore);

        // Decay suspicion over time
        setTimeout(() => {
            const decayedScore = Math.max((this.suspiciousUsers.get(userId) || 0) - 0.1, 0);
            if (decayedScore === 0) {
                this.suspiciousUsers.delete(userId);
            } else {
                this.suspiciousUsers.set(userId, decayedScore);
            }
        }, 300000); // 5 minutes
    }

    isWhitelisted(user, channel, whitelist) {
        if (whitelist.users.includes(user.id)) return true;
        if (whitelist.channels.includes(channel.id)) return true;
        
        const member = channel.guild.members.cache.get(user.id);
        if (member && member.roles.cache.some(role => whitelist.roles.includes(role.id))) {
            return true;
        }

        return false;
    }

    logDetection(detection) {
        const data = this.loadData();
        if (detection.type === 'spam') {
            data.spamPatterns.unshift(detection);
            data.spamPatterns = data.spamPatterns.slice(0, 500); // Keep last 500
        } else {
            data.detectedRaids.unshift(detection);
            data.detectedRaids = data.detectedRaids.slice(0, 100); // Keep last 100
        }
        this.saveData(data);
    }

    async sendModerationAlert(detection) {
        // Implementation for sending alerts to moderation channels
        console.log(`🚨 ${detection.type.toUpperCase()} Detection:`, detection);
    }

    performPeriodicAnalysis() {
        // Clean old patterns
        this.patterns.forEach((pattern, key) => {
            if (Array.isArray(pattern)) {
                const now = Date.now();
                this.patterns.set(key, pattern.filter(item => now - item.timestamp < 3600000));
            }
        });

        // Clean empty patterns
        this.patterns.forEach((pattern, key) => {
            if (Array.isArray(pattern) && pattern.length === 0) {
                this.patterns.delete(key);
            }
        });
    }

    getDetections(guildId = null, type = null, limit = 50) {
        const data = this.loadData();
        let detections = [];

        if (type === 'spam' || type === null) {
            detections = detections.concat(data.spamPatterns || []);
        }
        if (type === 'raid' || type === null) {
            detections = detections.concat(data.detectedRaids || []);
        }

        if (guildId) {
            detections = detections.filter(detection => detection.guildId === guildId);
        }

        detections.sort((a, b) => b.timestamp - a.timestamp);
        return detections.slice(0, limit);
    }

    getStatistics(guildId = null, days = 7) {
        const timeWindow = days * 24 * 60 * 60 * 1000;
        const since = Date.now() - timeWindow;
        
        const detections = this.getDetections(guildId, null, 1000)
            .filter(detection => detection.timestamp >= since);

        return {
            total: detections.length,
            spam: detections.filter(d => d.type === 'spam').length,
            raids: detections.filter(d => d.type === 'raid').length,
            avgSpamScore: this.calculateAverageSpamScore(detections),
            topThreats: this.getTopThreats(detections)
        };
    }

    calculateAverageSpamScore(detections) {
        const spamDetections = detections.filter(d => d.spamScore);
        if (spamDetections.length === 0) return 0;
        
        const totalScore = spamDetections.reduce((sum, d) => sum + d.spamScore, 0);
        return totalScore / spamDetections.length;
    }

    getTopThreats(detections) {
        const threatCounts = {};
        
        detections.forEach(detection => {
            if (detection.threats) {
                detection.threats.forEach(threat => {
                    threatCounts[threat] = (threatCounts[threat] || 0) + 1;
                });
            }
        });

        return Object.entries(threatCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([threat, count]) => ({ threat, count }));
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
}

module.exports = SpamRaidDetectionAPI;
