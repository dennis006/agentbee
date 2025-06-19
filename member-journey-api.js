const fs = require('fs');
const path = require('path');

class MemberJourneyAPI {
    constructor(client) {
        this.client = client;
        this.dataFile = path.join(__dirname, 'settings', 'member-journey.json');
        this.memberData = new Map();
        this.ensureDataFile();
        this.setupTracking();
    }

    ensureDataFile() {
        const settingsDir = path.join(__dirname, 'settings');
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.dataFile)) {
            const defaultData = {
                members: {},
                milestones: [
                    { name: 'First Message', type: 'message', threshold: 1 },
                    { name: 'Active Participant', type: 'message', threshold: 10 },
                    { name: 'Community Member', type: 'message', threshold: 50 },
                    { name: 'Veteran', type: 'message', threshold: 200 },
                    { name: 'Voice User', type: 'voice', threshold: 3600000 }, // 1 hour
                    { name: 'Voice Regular', type: 'voice', threshold: 36000000 }, // 10 hours
                    { name: 'Reaction Enthusiast', type: 'reaction', threshold: 100 },
                    { name: 'Helper', type: 'help', threshold: 5 }
                ],
                retentionPeriods: [1, 7, 30, 90], // days
                settings: {
                    trackingEnabled: true,
                    privacyMode: false,
                    dataRetention: 365, // days
                    milestoneNotifications: true
                }
            };
            fs.writeFileSync(this.dataFile, JSON.stringify(defaultData, null, 2));
        }
    }

    loadData() {
        try {
            return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        } catch (error) {
            console.error('Error loading member journey data:', error);
            return { members: {}, milestones: [], retentionPeriods: [], settings: {} };
        }
    }

    saveData(data) {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving member journey data:', error);
            return false;
        }
    }

    setupTracking() {
        const data = this.loadData();
        if (!data.settings.trackingEnabled) return;

        // Member join tracking
        this.client.on('guildMemberAdd', (member) => {
            this.trackMemberJoin(member);
        });

        // Member leave tracking
        this.client.on('guildMemberRemove', (member) => {
            this.trackMemberLeave(member);
        });

        // Message tracking
        this.client.on('messageCreate', (message) => {
            if (!message.guild || message.author.bot) return;
            this.trackMessage(message);
        });

        // Reaction tracking
        this.client.on('messageReactionAdd', (reaction, user) => {
            if (user.bot) return;
            this.trackReaction(reaction, user, 'add');
        });

        // Voice state tracking
        this.client.on('voiceStateUpdate', (oldState, newState) => {
            this.trackVoiceActivity(oldState, newState);
        });

        // Role updates
        this.client.on('guildMemberUpdate', (oldMember, newMember) => {
            this.trackRoleChanges(oldMember, newMember);
        });

        // Periodic cleanup
        setInterval(() => {
            this.performCleanup();
        }, 24 * 60 * 60 * 1000); // Daily
    }

    trackMemberJoin(member) {
        const data = this.loadData();
        const memberId = member.user.id;
        const guildId = member.guild.id;
        const now = Date.now();

        if (!data.members[guildId]) {
            data.members[guildId] = {};
        }

        data.members[guildId][memberId] = {
            userId: memberId,
            username: member.user.username,
            discriminator: member.user.discriminator,
            joinedAt: now,
            leftAt: null,
            isActive: true,
            journey: {
                messages: 0,
                reactions: 0,
                voiceTime: 0,
                helpActions: 0,
                milestones: [],
                firstMessage: null,
                lastActivity: now,
                sessionsCount: 0,
                averageSessionLength: 0
            },
            retention: {
                day1: false,
                day7: false,
                day30: false,
                day90: false
            },
            engagement: {
                score: 0,
                trend: 'new',
                category: 'newcomer'
            }
        };

        this.saveData(data);
        console.log(`📈 Member ${member.user.username} joined ${member.guild.name}`);
    }

    trackMemberLeave(member) {
        const data = this.loadData();
        const memberId = member.user.id;
        const guildId = member.guild.id;
        const now = Date.now();

        if (data.members[guildId] && data.members[guildId][memberId]) {
            const memberData = data.members[guildId][memberId];
            memberData.leftAt = now;
            memberData.isActive = false;
            
            // Calculate retention metrics
            const daysSinceJoin = (now - memberData.joinedAt) / (24 * 60 * 60 * 1000);
            memberData.retentionDays = Math.floor(daysSinceJoin);

            this.saveData(data);
            console.log(`📉 Member ${member.user.username} left ${member.guild.name} after ${Math.floor(daysSinceJoin)} days`);
        }
    }

    trackMessage(message) {
        const data = this.loadData();
        const memberId = message.author.id;
        const guildId = message.guild.id;
        const now = Date.now();

        if (!data.members[guildId] || !data.members[guildId][memberId]) {
            return; // Member not tracked
        }

        const memberData = data.members[guildId][memberId];
        memberData.journey.messages++;
        memberData.journey.lastActivity = now;

        // Track first message
        if (!memberData.journey.firstMessage) {
            memberData.journey.firstMessage = now;
            this.checkMilestone(memberData, 'message', 1, data.milestones);
        }

        // Check message milestones
        this.checkMilestone(memberData, 'message', memberData.journey.messages, data.milestones);

        // Update engagement score
        this.updateEngagementScore(memberData);

        this.saveData(data);
    }

    trackReaction(reaction, user, action) {
        const data = this.loadData();
        const memberId = user.id;
        const guildId = reaction.message.guild.id;

        if (!data.members[guildId] || !data.members[guildId][memberId]) {
            return;
        }

        const memberData = data.members[guildId][memberId];
        if (action === 'add') {
            memberData.journey.reactions++;
            memberData.journey.lastActivity = Date.now();

            // Check reaction milestones
            this.checkMilestone(memberData, 'reaction', memberData.journey.reactions, data.milestones);
            this.updateEngagementScore(memberData);
        }

        this.saveData(data);
    }

    trackVoiceActivity(oldState, newState) {
        const data = this.loadData();
        const memberId = newState.member.user.id;
        const guildId = newState.guild.id;

        if (!data.members[guildId] || !data.members[guildId][memberId]) {
            return;
        }

        const memberData = data.members[guildId][memberId];

        // Starting voice session
        if (!oldState.channel && newState.channel) {
            memberData.voiceSessionStart = Date.now();
            memberData.journey.sessionsCount++;
        }

        // Ending voice session
        if (oldState.channel && !newState.channel && memberData.voiceSessionStart) {
            const sessionLength = Date.now() - memberData.voiceSessionStart;
            memberData.journey.voiceTime += sessionLength;
            
            // Update average session length
            const totalSessions = memberData.journey.sessionsCount;
            memberData.journey.averageSessionLength = 
                ((memberData.journey.averageSessionLength * (totalSessions - 1)) + sessionLength) / totalSessions;

            memberData.journey.lastActivity = Date.now();
            delete memberData.voiceSessionStart;

            // Check voice milestones
            this.checkMilestone(memberData, 'voice', memberData.journey.voiceTime, data.milestones);
            this.updateEngagementScore(memberData);
        }

        this.saveData(data);
    }

    trackRoleChanges(oldMember, newMember) {
        const data = this.loadData();
        const memberId = newMember.user.id;
        const guildId = newMember.guild.id;

        if (!data.members[guildId] || !data.members[guildId][memberId]) {
            return;
        }

        const memberData = data.members[guildId][memberId];
        
        // Track role promotions as help actions
        const oldRoles = oldMember.roles.cache.size;
        const newRoles = newMember.roles.cache.size;
        
        if (newRoles > oldRoles) {
            memberData.journey.helpActions++;
            memberData.journey.lastActivity = Date.now();

            // Check help milestones
            this.checkMilestone(memberData, 'help', memberData.journey.helpActions, data.milestones);
            this.updateEngagementScore(memberData);
        }

        this.saveData(data);
    }

    checkMilestone(memberData, type, value, milestones) {
        milestones.forEach(milestone => {
            if (milestone.type === type && value >= milestone.threshold) {
                const milestoneKey = `${milestone.name}_${milestone.threshold}`;
                if (!memberData.journey.milestones.includes(milestoneKey)) {
                    memberData.journey.milestones.push(milestoneKey);
                    console.log(`🎉 ${memberData.username} achieved milestone: ${milestone.name}`);
                }
            }
        });
    }

    updateEngagementScore(memberData) {
        const now = Date.now();
        const daysSinceJoin = (now - memberData.joinedAt) / (24 * 60 * 60 * 1000);
        const daysSinceLastActivity = (now - memberData.journey.lastActivity) / (24 * 60 * 60 * 1000);

        let score = 0;

        // Message activity (40%)
        const messagesPerDay = memberData.journey.messages / Math.max(daysSinceJoin, 1);
        score += Math.min(messagesPerDay * 10, 40);

        // Voice activity (30%)
        const voiceHoursPerDay = (memberData.journey.voiceTime / (1000 * 60 * 60)) / Math.max(daysSinceJoin, 1);
        score += Math.min(voiceHoursPerDay * 15, 30);

        // Reactions (15%)
        const reactionsPerDay = memberData.journey.reactions / Math.max(daysSinceJoin, 1);
        score += Math.min(reactionsPerDay * 5, 15);

        // Milestones (10%)
        score += Math.min(memberData.journey.milestones.length * 2, 10);

        // Recent activity bonus (5%)
        if (daysSinceLastActivity < 1) score += 5;
        else if (daysSinceLastActivity < 7) score += 3;

        memberData.engagement.score = Math.round(score);

        // Categorize engagement
        if (score >= 80) memberData.engagement.category = 'highly_active';
        else if (score >= 60) memberData.engagement.category = 'active';
        else if (score >= 40) memberData.engagement.category = 'moderate';
        else if (score >= 20) memberData.engagement.category = 'low';
        else memberData.engagement.category = 'inactive';

        // Update trend
        const previousScore = memberData.engagement.previousScore || 0;
        if (score > previousScore + 5) memberData.engagement.trend = 'increasing';
        else if (score < previousScore - 5) memberData.engagement.trend = 'decreasing';
        else memberData.engagement.trend = 'stable';

        memberData.engagement.previousScore = score;
    }

    checkRetention() {
        const data = this.loadData();
        const now = Date.now();

        Object.keys(data.members).forEach(guildId => {
            Object.keys(data.members[guildId]).forEach(memberId => {
                const memberData = data.members[guildId][memberId];
                if (!memberData.isActive) return;

                const daysSinceJoin = (now - memberData.joinedAt) / (24 * 60 * 60 * 1000);

                // Check retention periods
                data.retentionPeriods.forEach(period => {
                    const retentionKey = `day${period}`;
                    if (daysSinceJoin >= period && !memberData.retention[retentionKey]) {
                        memberData.retention[retentionKey] = true;
                        console.log(`✅ ${memberData.username} retained for ${period} days`);
                    }
                });
            });
        });

        this.saveData(data);
    }

    performCleanup() {
        const data = this.loadData();
        const now = Date.now();
        const retentionPeriod = data.settings.dataRetention * 24 * 60 * 60 * 1000;

        Object.keys(data.members).forEach(guildId => {
            Object.keys(data.members[guildId]).forEach(memberId => {
                const memberData = data.members[guildId][memberId];
                
                // Remove old inactive members
                if (!memberData.isActive && memberData.leftAt && 
                    (now - memberData.leftAt) > retentionPeriod) {
                    delete data.members[guildId][memberId];
                    console.log(`🗑️ Cleaned up data for ${memberData.username}`);
                }
            });
        });

        this.saveData(data);
        this.checkRetention();
    }

    getMemberJourney(guildId, userId) {
        const data = this.loadData();
        if (!data.members[guildId] || !data.members[guildId][userId]) {
            return null;
        }

        const memberData = data.members[guildId][userId];
        const now = Date.now();
        const daysSinceJoin = (now - memberData.joinedAt) / (24 * 60 * 60 * 1000);

        return {
            ...memberData,
            daysSinceJoin: Math.floor(daysSinceJoin),
            predictedChurn: this.predictChurn(memberData),
            suggestions: this.getEngagementSuggestions(memberData)
        };
    }

    predictChurn(memberData) {
        const now = Date.now();
        const daysSinceLastActivity = (now - memberData.journey.lastActivity) / (24 * 60 * 60 * 1000);
        const engagementScore = memberData.engagement.score;

        let churnRisk = 0;

        // High risk if inactive for long periods
        if (daysSinceLastActivity > 14) churnRisk += 40;
        else if (daysSinceLastActivity > 7) churnRisk += 20;
        else if (daysSinceLastActivity > 3) churnRisk += 10;

        // Risk based on engagement score
        if (engagementScore < 20) churnRisk += 30;
        else if (engagementScore < 40) churnRisk += 15;

        // Risk based on trend
        if (memberData.engagement.trend === 'decreasing') churnRisk += 20;

        return Math.min(churnRisk, 100);
    }

    getEngagementSuggestions(memberData) {
        const suggestions = [];
        const churnRisk = this.predictChurn(memberData);

        if (churnRisk > 60) {
            suggestions.push({
                type: 'intervention',
                message: 'High churn risk - consider personal outreach',
                priority: 'high'
            });
        }

        if (memberData.journey.messages < 5) {
            suggestions.push({
                type: 'engagement',
                message: 'Encourage first conversations',
                priority: 'medium'
            });
        }

        if (memberData.journey.voiceTime === 0) {
            suggestions.push({
                type: 'voice',
                message: 'Invite to voice channels',
                priority: 'low'
            });
        }

        if (memberData.engagement.score < 30) {
            suggestions.push({
                type: 'activity',
                message: 'Share engaging content or events',
                priority: 'medium'
            });
        }

        return suggestions;
    }

    getRetentionStats(guildId) {
        const data = this.loadData();
        const members = data.members[guildId] || {};
        
        const stats = {
            total: Object.keys(members).length,
            active: 0,
            retention: {},
            avgEngagement: 0,
            churnPrediction: {
                low: 0,
                medium: 0,
                high: 0
            }
        };

        data.retentionPeriods.forEach(period => {
            stats.retention[`day${period}`] = 0;
        });

        let totalEngagement = 0;

        Object.values(members).forEach(member => {
            if (member.isActive) {
                stats.active++;
                totalEngagement += member.engagement.score;

                // Count retention
                data.retentionPeriods.forEach(period => {
                    if (member.retention[`day${period}`]) {
                        stats.retention[`day${period}`]++;
                    }
                });

                // Churn prediction
                const churnRisk = this.predictChurn(member);
                if (churnRisk < 30) stats.churnPrediction.low++;
                else if (churnRisk < 70) stats.churnPrediction.medium++;
                else stats.churnPrediction.high++;
            }
        });

        stats.avgEngagement = stats.active > 0 ? Math.round(totalEngagement / stats.active) : 0;

        // Calculate retention rates
        Object.keys(stats.retention).forEach(period => {
            stats.retention[period] = {
                count: stats.retention[period],
                rate: stats.total > 0 ? Math.round((stats.retention[period] / stats.total) * 100) : 0
            };
        });

        return stats;
    }

    getTopMembers(guildId, category = 'engagement', limit = 10) {
        const data = this.loadData();
        const members = data.members[guildId] || {};

        const memberList = Object.values(members)
            .filter(member => member.isActive)
            .sort((a, b) => {
                switch (category) {
                    case 'engagement':
                        return b.engagement.score - a.engagement.score;
                    case 'messages':
                        return b.journey.messages - a.journey.messages;
                    case 'voice':
                        return b.journey.voiceTime - a.journey.voiceTime;
                    case 'reactions':
                        return b.journey.reactions - a.journey.reactions;
                    case 'milestones':
                        return b.journey.milestones.length - a.journey.milestones.length;
                    default:
                        return b.engagement.score - a.engagement.score;
                }
            })
            .slice(0, limit);

        return memberList.map(member => ({
            userId: member.userId,
            username: member.username,
            score: member.engagement.score,
            category: member.engagement.category,
            milestones: member.journey.milestones.length,
            messages: member.journey.messages,
            voiceHours: Math.round(member.journey.voiceTime / (1000 * 60 * 60) * 10) / 10
        }));
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

module.exports = MemberJourneyAPI;
