const fs = require('fs');
const path = require('path');

class AnalyticsChartsAPI {
    constructor(client) {
        this.client = client;
        this.dataFile = path.join(__dirname, 'settings', 'analytics-charts.json');
        this.chartData = new Map();
        this.ensureDataFile();
        this.setupDataCollection();
    }

    ensureDataFile() {
        const settingsDir = path.join(__dirname, 'settings');
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.dataFile)) {
            const defaultData = {
                memberGrowth: {},
                messageActivity: {},
                channelActivity: {},
                voiceActivity: {},
                engagementMetrics: {},
                dailySnapshots: {},
                settings: {
                    dataRetention: 365, // days
                    snapshotInterval: 3600000, // 1 hour
                    trackChannelActivity: true,
                    trackVoiceActivity: true,
                    trackEngagement: true,
                    generateHeatmaps: true
                },
                chartConfigs: {
                    memberGrowth: {
                        type: 'line',
                        title: 'Member Growth Over Time',
                        backgroundColor: ['rgba(75, 192, 192, 0.2)'],
                        borderColor: ['rgba(75, 192, 192, 1)'],
                        borderWidth: 2
                    },
                    messageActivity: {
                        type: 'bar',
                        title: 'Daily Message Activity',
                        backgroundColor: ['rgba(54, 162, 235, 0.2)'],
                        borderColor: ['rgba(54, 162, 235, 1)'],
                        borderWidth: 1
                    },
                    channelPerformance: {
                        type: 'doughnut',
                        title: 'Channel Message Distribution',
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 205, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)'
                        ]
                    },
                    engagementScore: {
                        type: 'radar',
                        title: 'Server Engagement Metrics',
                        backgroundColor: ['rgba(255, 99, 132, 0.2)'],
                        borderColor: ['rgba(255, 99, 132, 1)'],
                        pointBackgroundColor: ['rgba(255, 99, 132, 1)']
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
            console.error('Error loading analytics charts data:', error);
            return { memberGrowth: {}, messageActivity: {}, channelActivity: {}, voiceActivity: {}, settings: {}, chartConfigs: {} };
        }
    }

    saveData(data) {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving analytics charts data:', error);
            return false;
        }
    }

    setupDataCollection() {
        const data = this.loadData();
        if (!data.settings.trackChannelActivity) return;

        // Message tracking
        this.client.on('messageCreate', (message) => {
            if (!message.guild) return;
            this.trackMessage(message);
        });

        // Member join/leave tracking
        this.client.on('guildMemberAdd', (member) => {
            this.trackMemberChange(member.guild.id, 'join');
        });

        this.client.on('guildMemberRemove', (member) => {
            this.trackMemberChange(member.guild.id, 'leave');
        });

        // Voice activity tracking
        if (data.settings.trackVoiceActivity) {
            this.client.on('voiceStateUpdate', (oldState, newState) => {
                this.trackVoiceActivity(oldState, newState);
            });
        }

        // Periodic snapshots
        setInterval(() => {
            this.takeServerSnapshots();
        }, data.settings.snapshotInterval);

        // Daily cleanup
        setInterval(() => {
            this.performDataCleanup();
        }, 24 * 60 * 60 * 1000);
    }

    trackMessage(message) {
        const data = this.loadData();
        const guildId = message.guild.id;
        const channelId = message.channel.id;
        const now = Date.now();
        const dateKey = new Date(now).toISOString().split('T')[0];
        const hourKey = new Date(now).getHours();

        // Initialize data structures
        if (!data.messageActivity[guildId]) {
            data.messageActivity[guildId] = {};
        }
        if (!data.messageActivity[guildId][dateKey]) {
            data.messageActivity[guildId][dateKey] = {
                total: 0,
                hourly: new Array(24).fill(0),
                channels: {}
            };
        }
        if (!data.channelActivity[guildId]) {
            data.channelActivity[guildId] = {};
        }
        if (!data.channelActivity[guildId][channelId]) {
            data.channelActivity[guildId][channelId] = {
                name: message.channel.name,
                totalMessages: 0,
                dailyActivity: {},
                hourlyActivity: new Array(24).fill(0)
            };
        }

        // Update message activity
        data.messageActivity[guildId][dateKey].total++;
        data.messageActivity[guildId][dateKey].hourly[hourKey]++;
        
        if (!data.messageActivity[guildId][dateKey].channels[channelId]) {
            data.messageActivity[guildId][dateKey].channels[channelId] = 0;
        }
        data.messageActivity[guildId][dateKey].channels[channelId]++;

        // Update channel activity
        data.channelActivity[guildId][channelId].totalMessages++;
        data.channelActivity[guildId][channelId].hourlyActivity[hourKey]++;
        
        if (!data.channelActivity[guildId][channelId].dailyActivity[dateKey]) {
            data.channelActivity[guildId][channelId].dailyActivity[dateKey] = 0;
        }
        data.channelActivity[guildId][channelId].dailyActivity[dateKey]++;

        this.saveData(data);
    }

    trackMemberChange(guildId, action) {
        const data = this.loadData();
        const now = Date.now();
        const dateKey = new Date(now).toISOString().split('T')[0];

        if (!data.memberGrowth[guildId]) {
            data.memberGrowth[guildId] = {};
        }
        if (!data.memberGrowth[guildId][dateKey]) {
            data.memberGrowth[guildId][dateKey] = {
                joins: 0,
                leaves: 0,
                netGrowth: 0,
                totalMembers: 0
            };
        }

        if (action === 'join') {
            data.memberGrowth[guildId][dateKey].joins++;
        } else {
            data.memberGrowth[guildId][dateKey].leaves++;
        }

        data.memberGrowth[guildId][dateKey].netGrowth = 
            data.memberGrowth[guildId][dateKey].joins - data.memberGrowth[guildId][dateKey].leaves;

        // Update total member count
        const guild = this.client.guilds.cache.get(guildId);
        if (guild) {
            data.memberGrowth[guildId][dateKey].totalMembers = guild.memberCount;
        }

        this.saveData(data);
    }

    trackVoiceActivity(oldState, newState) {
        const data = this.loadData();
        const guildId = newState.guild.id;
        const now = Date.now();
        const dateKey = new Date(now).toISOString().split('T')[0];
        const hourKey = new Date(now).getHours();

        if (!data.voiceActivity[guildId]) {
            data.voiceActivity[guildId] = {};
        }
        if (!data.voiceActivity[guildId][dateKey]) {
            data.voiceActivity[guildId][dateKey] = {
                totalJoins: 0,
                totalLeaves: 0,
                peakConcurrent: 0,
                hourlyJoins: new Array(24).fill(0),
                channels: {}
            };
        }

        // User joined a voice channel
        if (!oldState.channel && newState.channel) {
            data.voiceActivity[guildId][dateKey].totalJoins++;
            data.voiceActivity[guildId][dateKey].hourlyJoins[hourKey]++;
            
            const channelId = newState.channel.id;
            if (!data.voiceActivity[guildId][dateKey].channels[channelId]) {
                data.voiceActivity[guildId][dateKey].channels[channelId] = {
                    name: newState.channel.name,
                    joins: 0,
                    currentUsers: 0
                };
            }
            data.voiceActivity[guildId][dateKey].channels[channelId].joins++;
        }

        // User left a voice channel
        if (oldState.channel && !newState.channel) {
            data.voiceActivity[guildId][dateKey].totalLeaves++;
        }

        // Update peak concurrent users
        const currentVoiceUsers = this.getCurrentVoiceUsers(guildId);
        data.voiceActivity[guildId][dateKey].peakConcurrent = 
            Math.max(data.voiceActivity[guildId][dateKey].peakConcurrent, currentVoiceUsers);

        this.saveData(data);
    }

    getCurrentVoiceUsers(guildId) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return 0;

        let voiceUsers = 0;
        guild.channels.cache
            .filter(channel => channel.type === 'GUILD_VOICE')
            .forEach(channel => {
                voiceUsers += channel.members.size;
            });

        return voiceUsers;
    }

    takeServerSnapshots() {
        const data = this.loadData();
        const now = Date.now();
        const snapshotKey = Math.floor(now / 3600000) * 3600000; // Round to hour

        this.client.guilds.cache.forEach(guild => {
            if (!data.dailySnapshots[guild.id]) {
                data.dailySnapshots[guild.id] = {};
            }

            data.dailySnapshots[guild.id][snapshotKey] = {
                timestamp: now,
                memberCount: guild.memberCount,
                channelCount: guild.channels.cache.size,
                roleCount: guild.roles.cache.size,
                onlineMembers: guild.presences.cache.filter(presence => 
                    presence.status !== 'offline'
                ).size,
                voiceUsers: this.getCurrentVoiceUsers(guild.id),
                boostLevel: guild.premiumTier,
                boostCount: guild.premiumSubscriptionCount
            };
        });

        this.saveData(data);
    }

    // Interactive Growth Charts
    getMemberGrowthChart(guildId, days = 30) {
        const data = this.loadData();
        const now = new Date();
        const chartData = {
            labels: [],
            datasets: [{
                label: 'Total Members',
                data: [],
                ...data.chartConfigs.memberGrowth
            }, {
                label: 'Daily Joins',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                yAxisID: 'y1'
            }, {
                label: 'Daily Leaves',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                yAxisID: 'y1'
            }]
        };

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            
            chartData.labels.push(date.toLocaleDateString());
            
            const dayData = data.memberGrowth[guildId]?.[dateKey];
            chartData.datasets[0].data.push(dayData?.totalMembers || 0);
            chartData.datasets[1].data.push(dayData?.joins || 0);
            chartData.datasets[2].data.push(dayData?.leaves || 0);
        }

        return {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Total Members'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Daily Changes'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        };
    }

    getMessageActivityChart(guildId, days = 7) {
        const data = this.loadData();
        const now = new Date();
        const chartData = {
            labels: [],
            datasets: [{
                label: 'Daily Messages',
                data: [],
                ...data.chartConfigs.messageActivity
            }]
        };

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            
            chartData.labels.push(date.toLocaleDateString());
            
            const dayData = data.messageActivity[guildId]?.[dateKey];
            chartData.datasets[0].data.push(dayData?.total || 0);
        }

        return {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Messages'
                        }
                    }
                }
            }
        };
    }

    // Activity Heatmap
    getActivityHeatmap(guildId, days = 30) {
        const data = this.loadData();
        const now = new Date();
        const heatmapData = [];

        // Generate heatmap data for the last 30 days, 24 hours each
        for (let day = days - 1; day >= 0; day--) {
            const date = new Date(now);
            date.setDate(date.getDate() - day);
            const dateKey = date.toISOString().split('T')[0];
            
            const dayData = data.messageActivity[guildId]?.[dateKey];
            const hourlyData = dayData?.hourly || new Array(24).fill(0);
            
            for (let hour = 0; hour < 24; hour++) {
                heatmapData.push({
                    x: hour,
                    y: day,
                    d: hourlyData[hour],
                    date: dateKey,
                    hour: hour
                });
            }
        }

        return {
            type: 'heatmap',
            data: heatmapData,
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: 23,
                        title: {
                            display: true,
                            text: 'Hour of Day'
                        },
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return value + ':00';
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        min: 0,
                        max: days - 1,
                        title: {
                            display: true,
                            text: 'Days Ago'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const point = context[0];
                                return `${point.raw.date} ${point.raw.hour}:00`;
                            },
                            label: function(context) {
                                return `Messages: ${context.raw.d}`;
                            }
                        }
                    }
                }
            }
        };
    }

    // Channel Performance Dashboard
    getChannelPerformanceChart(guildId, days = 30) {
        const data = this.loadData();
        const channelData = data.channelActivity[guildId] || {};
        
        // Get top 10 most active channels
        const channels = Object.entries(channelData)
            .map(([channelId, channel]) => ({
                id: channelId,
                name: channel.name,
                messages: channel.totalMessages
            }))
            .sort((a, b) => b.messages - a.messages)
            .slice(0, 10);

        const chartData = {
            labels: channels.map(ch => ch.name),
            datasets: [{
                label: 'Total Messages',
                data: channels.map(ch => ch.messages),
                ...data.chartConfigs.channelPerformance
            }]
        };

        return {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Channel Message Distribution'
                    }
                }
            }
        };
    }

    getChannelPerformanceTable(guildId, days = 30) {
        const data = this.loadData();
        const channelData = data.channelActivity[guildId] || {};
        const now = new Date();
        
        const channels = Object.entries(channelData).map(([channelId, channel]) => {
            // Calculate recent activity
            let recentMessages = 0;
            for (let i = 0; i < days; i++) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateKey = date.toISOString().split('T')[0];
                recentMessages += channel.dailyActivity[dateKey] || 0;
            }

            // Calculate average hourly activity
            const avgHourlyActivity = channel.hourlyActivity.reduce((sum, val) => sum + val, 0) / 24;
            
            // Find peak hour
            const peakHour = channel.hourlyActivity.indexOf(Math.max(...channel.hourlyActivity));

            return {
                id: channelId,
                name: channel.name,
                totalMessages: channel.totalMessages,
                recentMessages: recentMessages,
                avgHourlyActivity: Math.round(avgHourlyActivity * 10) / 10,
                peakHour: `${peakHour}:00`,
                peakActivity: channel.hourlyActivity[peakHour]
            };
        }).sort((a, b) => b.recentMessages - a.recentMessages);

        return channels;
    }

    // Engagement Scoring Chart
    getEngagementChart(guildId) {
        // This would integrate with your server health API
        const mockEngagementData = {
            labels: [
                'Message Activity',
                'Voice Activity', 
                'Member Retention',
                'Channel Usage',
                'Role Distribution',
                'Interaction Rate'
            ],
            datasets: [{
                label: 'Engagement Score',
                data: [85, 72, 90, 78, 83, 76],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
            }]
        };

        return {
            type: 'radar',
            data: mockEngagementData,
            options: {
                responsive: true,
                elements: {
                    line: {
                        borderWidth: 3
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            display: false
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        };
    }

    // Voice Activity Chart
    getVoiceActivityChart(guildId, days = 7) {
        const data = this.loadData();
        const now = new Date();
        const chartData = {
            labels: [],
            datasets: [{
                label: 'Voice Joins',
                data: [],
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }, {
                label: 'Peak Concurrent',
                data: [],
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1,
                type: 'line'
            }]
        };

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            
            chartData.labels.push(date.toLocaleDateString());
            
            const dayData = data.voiceActivity[guildId]?.[dateKey];
            chartData.datasets[0].data.push(dayData?.totalJoins || 0);
            chartData.datasets[1].data.push(dayData?.peakConcurrent || 0);
        }

        return {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Activity Count'
                        }
                    }
                }
            }
        };
    }

    // Export functionality
    exportChartData(guildId, chartType, format = 'json') {
        let chartData;
        
        switch (chartType) {
            case 'memberGrowth':
                chartData = this.getMemberGrowthChart(guildId, 90);
                break;
            case 'messageActivity':
                chartData = this.getMessageActivityChart(guildId, 30);
                break;
            case 'channelPerformance':
                chartData = this.getChannelPerformanceTable(guildId, 30);
                break;
            case 'activityHeatmap':
                chartData = this.getActivityHeatmap(guildId, 30);
                break;
            case 'voiceActivity':
                chartData = this.getVoiceActivityChart(guildId, 30);
                break;
            default:
                return { success: false, error: 'Invalid chart type' };
        }

        if (format === 'csv') {
            return this.convertChartToCSV(chartData, chartType);
        }

        return {
            success: true,
            data: chartData,
            exportedAt: Date.now()
        };
    }

    convertChartToCSV(chartData, chartType) {
        const lines = [];
        
        if (chartType === 'channelPerformance' && Array.isArray(chartData)) {
            lines.push('Channel,Total Messages,Recent Messages,Avg Hourly Activity,Peak Hour,Peak Activity');
            chartData.forEach(channel => {
                lines.push([
                    channel.name,
                    channel.totalMessages,
                    channel.recentMessages,
                    channel.avgHourlyActivity,
                    channel.peakHour,
                    channel.peakActivity
                ].join(','));
            });
        } else if (chartData.data && chartData.data.labels) {
            // Convert chart.js data to CSV
            const headers = ['Date', ...chartData.data.datasets.map(ds => ds.label)];
            lines.push(headers.join(','));
            
            chartData.data.labels.forEach((label, index) => {
                const row = [label];
                chartData.data.datasets.forEach(dataset => {
                    row.push(dataset.data[index] || 0);
                });
                lines.push(row.join(','));
            });
        }

        return {
            success: true,
            csv: lines.join('\n'),
            filename: `${chartType}_${Date.now()}.csv`
        };
    }

    performDataCleanup() {
        const data = this.loadData();
        const now = Date.now();
        const retentionPeriod = data.settings.dataRetention * 24 * 60 * 60 * 1000;

        // Clean old data
        Object.keys(data.memberGrowth).forEach(guildId => {
            Object.keys(data.memberGrowth[guildId]).forEach(dateKey => {
                const dataTime = new Date(dateKey).getTime();
                if ((now - dataTime) > retentionPeriod) {
                    delete data.memberGrowth[guildId][dateKey];
                }
            });
        });

        Object.keys(data.messageActivity).forEach(guildId => {
            Object.keys(data.messageActivity[guildId]).forEach(dateKey => {
                const dataTime = new Date(dateKey).getTime();
                if ((now - dataTime) > retentionPeriod) {
                    delete data.messageActivity[guildId][dateKey];
                }
            });
        });

        // Clean old snapshots
        Object.keys(data.dailySnapshots).forEach(guildId => {
            Object.keys(data.dailySnapshots[guildId]).forEach(timestamp => {
                if ((now - parseInt(timestamp)) > retentionPeriod) {
                    delete data.dailySnapshots[guildId][timestamp];
                }
            });
        });

        this.saveData(data);
        console.log('🧹 Analytics charts data cleanup completed');
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

    getAnalyticsSummary(guildId, days = 7) {
        const data = this.loadData();
        const now = new Date();
        const timeWindow = days * 24 * 60 * 60 * 1000;
        
        let totalMessages = 0;
        let totalJoins = 0;
        let totalLeaves = 0;
        let totalVoiceJoins = 0;
        
        for (let i = 0; i < days; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            
            const messageData = data.messageActivity[guildId]?.[dateKey];
            const memberData = data.memberGrowth[guildId]?.[dateKey];
            const voiceData = data.voiceActivity[guildId]?.[dateKey];
            
            totalMessages += messageData?.total || 0;
            totalJoins += memberData?.joins || 0;
            totalLeaves += memberData?.leaves || 0;
            totalVoiceJoins += voiceData?.totalJoins || 0;
        }

        const guild = this.client.guilds.cache.get(guildId);
        
        return {
            period: `${days} days`,
            currentMembers: guild?.memberCount || 0,
            memberGrowth: totalJoins - totalLeaves,
            totalMessages: totalMessages,
            avgMessagesPerDay: Math.round(totalMessages / days),
            totalVoiceJoins: totalVoiceJoins,
            avgVoiceJoinsPerDay: Math.round(totalVoiceJoins / days),
            activeChannels: Object.keys(data.channelActivity[guildId] || {}).length,
            generatedAt: Date.now()
        };
    }
}

module.exports = AnalyticsChartsAPI;
