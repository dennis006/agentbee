const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class RealTimeEventsAPI extends EventEmitter {
    constructor(client) {
        super();
        this.client = client;
        this.eventsFile = path.join(__dirname, 'settings', 'realtime-events.json');
        this.eventBuffer = [];
        this.maxBufferSize = 1000;
        this.connectedClients = new Set();
        this.filters = new Map();
        this.ensureEventsFile();
        this.setupEventListeners();
    }

    ensureEventsFile() {
        if (!fs.existsSync(this.eventsFile)) {
            const defaultData = {
                events: [],
                settings: {
                    enabledEvents: ['memberJoin', 'memberLeave', 'messageCreate', 'voiceStateUpdate', 'roleUpdate'],
                    bufferSize: 1000,
                    enableFiltering: true,
                    autoCleanup: true,
                    cleanupInterval: 3600000 // 1 hour
                }
            };
            fs.writeFileSync(this.eventsFile, JSON.stringify(defaultData, null, 2));
        }
    }

    loadData() {
        try {
            return JSON.parse(fs.readFileSync(this.eventsFile, 'utf8'));
        } catch (error) {
            console.error('Error loading events data:', error);
            return { events: [], settings: {} };
        }
    }

    saveData(data) {
        try {
            fs.writeFileSync(this.eventsFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving events data:', error);
            return false;
        }
    }

    setupEventListeners() {
        const data = this.loadData();
        const enabledEvents = data.settings.enabledEvents || [];

        // Member Join Event
        if (enabledEvents.includes('memberJoin')) {
            this.client.on('guildMemberAdd', (member) => {
                this.addEvent({
                    type: 'memberJoin',
                    timestamp: Date.now(),
                    serverId: member.guild.id,
                    serverName: member.guild.name,
                    userId: member.user.id,
                    username: member.user.username,
                    userAvatar: member.user.displayAvatarURL(),
                    memberCount: member.guild.memberCount,
                    data: {
                        joinedAt: member.joinedAt,
                        accountCreated: member.user.createdAt,
                        isBot: member.user.bot
                    }
                });
            });
        }

        // Member Leave Event
        if (enabledEvents.includes('memberLeave')) {
            this.client.on('guildMemberRemove', (member) => {
                this.addEvent({
                    type: 'memberLeave',
                    timestamp: Date.now(),
                    serverId: member.guild.id,
                    serverName: member.guild.name,
                    userId: member.user.id,
                    username: member.user.username,
                    userAvatar: member.user.displayAvatarURL(),
                    memberCount: member.guild.memberCount,
                    data: {
                        roles: member.roles.cache.map(role => role.name),
                        joinedAt: member.joinedAt,
                        isBot: member.user.bot
                    }
                });
            });
        }

        // Message Create Event
        if (enabledEvents.includes('messageCreate')) {
            this.client.on('messageCreate', (message) => {
                if (message.author.bot) return;

                this.addEvent({
                    type: 'messageCreate',
                    timestamp: Date.now(),
                    serverId: message.guild?.id,
                    serverName: message.guild?.name,
                    channelId: message.channel.id,
                    channelName: message.channel.name,
                    userId: message.author.id,
                    username: message.author.username,
                    userAvatar: message.author.displayAvatarURL(),
                    data: {
                        messageId: message.id,
                        content: message.content.substring(0, 100), // Limit content length
                        attachments: message.attachments.size,
                        embeds: message.embeds.length,
                        reactions: message.reactions.cache.size
                    }
                });
            });
        }

        // Voice State Update Event
        if (enabledEvents.includes('voiceStateUpdate')) {
            this.client.on('voiceStateUpdate', (oldState, newState) => {
                let eventType = 'voiceUpdate';
                let action = 'unknown';

                if (!oldState.channel && newState.channel) {
                    action = 'joined';
                } else if (oldState.channel && !newState.channel) {
                    action = 'left';
                } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
                    action = 'moved';
                } else {
                    action = 'updated';
                }

                this.addEvent({
                    type: 'voiceStateUpdate',
                    timestamp: Date.now(),
                    serverId: newState.guild.id,
                    serverName: newState.guild.name,
                    userId: newState.member.user.id,
                    username: newState.member.user.username,
                    userAvatar: newState.member.user.displayAvatarURL(),
                    data: {
                        action: action,
                        oldChannel: oldState.channel ? {
                            id: oldState.channel.id,
                            name: oldState.channel.name,
                            memberCount: oldState.channel.members.size
                        } : null,
                        newChannel: newState.channel ? {
                            id: newState.channel.id,
                            name: newState.channel.name,
                            memberCount: newState.channel.members.size
                        } : null,
                        muted: newState.mute,
                        deafened: newState.deaf,
                        streaming: newState.streaming
                    }
                });
            });
        }

        // Role Update Event
        if (enabledEvents.includes('roleUpdate')) {
            this.client.on('roleCreate', (role) => {
                this.addEvent({
                    type: 'roleCreate',
                    timestamp: Date.now(),
                    serverId: role.guild.id,
                    serverName: role.guild.name,
                    data: {
                        roleId: role.id,
                        roleName: role.name,
                        roleColor: role.hexColor,
                        permissions: role.permissions.toArray(),
                        hoist: role.hoist,
                        mentionable: role.mentionable
                    }
                });
            });

            this.client.on('roleDelete', (role) => {
                this.addEvent({
                    type: 'roleDelete',
                    timestamp: Date.now(),
                    serverId: role.guild.id,
                    serverName: role.guild.name,
                    data: {
                        roleId: role.id,
                        roleName: role.name,
                        roleColor: role.hexColor
                    }
                });
            });
        }

        // Channel Events
        if (enabledEvents.includes('channelUpdate')) {
            this.client.on('channelCreate', (channel) => {
                if (!channel.guild) return;

                this.addEvent({
                    type: 'channelCreate',
                    timestamp: Date.now(),
                    serverId: channel.guild.id,
                    serverName: channel.guild.name,
                    data: {
                        channelId: channel.id,
                        channelName: channel.name,
                        channelType: channel.type,
                        category: channel.parent?.name || 'None'
                    }
                });
            });

            this.client.on('channelDelete', (channel) => {
                if (!channel.guild) return;

                this.addEvent({
                    type: 'channelDelete',
                    timestamp: Date.now(),
                    serverId: channel.guild.id,
                    serverName: channel.guild.name,
                    data: {
                        channelId: channel.id,
                        channelName: channel.name,
                        channelType: channel.type
                    }
                });
            });
        }

        // Setup auto cleanup
        if (data.settings.autoCleanup) {
            setInterval(() => {
                this.cleanupOldEvents();
            }, data.settings.cleanupInterval || 3600000);
        }
    }

    addEvent(eventData) {
        // Add to buffer
        this.eventBuffer.unshift(eventData);

        // Limit buffer size
        if (this.eventBuffer.length > this.maxBufferSize) {
            this.eventBuffer = this.eventBuffer.slice(0, this.maxBufferSize);
        }

        // Emit to connected clients
        this.emit('newEvent', eventData);

        // Save to file periodically
        if (this.eventBuffer.length % 10 === 0) {
            this.saveEventBuffer();
        }
    }

    saveEventBuffer() {
        const data = this.loadData();
        data.events = [...this.eventBuffer, ...data.events].slice(0, this.maxBufferSize);
        this.saveData(data);
    }

    getEvents(serverId = null, limit = 50, eventTypes = [], startTime = null, endTime = null) {
        const data = this.loadData();
        let events = [...this.eventBuffer, ...data.events];

        // Filter by server
        if (serverId) {
            events = events.filter(event => event.serverId === serverId);
        }

        // Filter by event types
        if (eventTypes.length > 0) {
            events = events.filter(event => eventTypes.includes(event.type));
        }

        // Filter by time range
        if (startTime) {
            events = events.filter(event => event.timestamp >= startTime);
        }
        if (endTime) {
            events = events.filter(event => event.timestamp <= endTime);
        }

        // Sort by timestamp (newest first)
        events.sort((a, b) => b.timestamp - a.timestamp);

        return events.slice(0, limit);
    }

    getEventStats(serverId = null, timeRange = 3600000) { // Default 1 hour
        const currentTime = Date.now();
        const startTime = currentTime - timeRange;
        
        const events = this.getEvents(serverId, 1000, [], startTime, currentTime);

        const stats = {
            total: events.length,
            byType: {},
            byHour: {},
            topUsers: {},
            topChannels: {}
        };

        events.forEach(event => {
            // Count by type
            stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;

            // Count by hour
            const hour = new Date(event.timestamp).getHours();
            stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;

            // Count top users
            if (event.userId) {
                const userKey = `${event.username} (${event.userId})`;
                stats.topUsers[userKey] = (stats.topUsers[userKey] || 0) + 1;
            }

            // Count top channels
            if (event.channelName) {
                stats.topChannels[event.channelName] = (stats.topChannels[event.channelName] || 0) + 1;
            }
        });

        // Convert objects to sorted arrays
        stats.topUsers = Object.entries(stats.topUsers)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([user, count]) => ({ user, count }));

        stats.topChannels = Object.entries(stats.topChannels)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([channel, count]) => ({ channel, count }));

        return stats;
    }

    cleanupOldEvents() {
        const data = this.loadData();
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        data.events = data.events.filter(event => event.timestamp > oneWeekAgo);
        this.eventBuffer = this.eventBuffer.filter(event => event.timestamp > oneWeekAgo);
        
        this.saveData(data);
        console.log(`Cleaned up events older than 1 week. Events remaining: ${data.events.length + this.eventBuffer.length}`);
    }

    getSettings() {
        const data = this.loadData();
        return data.settings;
    }

    updateSettings(newSettings) {
        const data = this.loadData();
        data.settings = { ...data.settings, ...newSettings };
        this.saveData(data);
        
        // Restart event listeners if enabled events changed
        if (newSettings.enabledEvents) {
            this.removeAllListeners();
            this.setupEventListeners();
        }
        
        return data.settings;
    }

    // WebSocket support for real-time updates
    addClient(clientId, socket) {
        this.connectedClients.add({ id: clientId, socket });
        
        // Send recent events to new client
        const recentEvents = this.getEvents(null, 20);
        socket.emit('initialEvents', recentEvents);

        // Listen for client filters
        socket.on('setFilters', (filters) => {
            this.filters.set(clientId, filters);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            this.removeClient(clientId);
        });
    }

    removeClient(clientId) {
        this.connectedClients = new Set([...this.connectedClients].filter(client => client.id !== clientId));
        this.filters.delete(clientId);
    }

    broadcastEvent(eventData) {
        this.connectedClients.forEach(client => {
            const filters = this.filters.get(client.id);
            
            // Apply filters if set
            if (filters) {
                if (filters.serverId && eventData.serverId !== filters.serverId) return;
                if (filters.eventTypes && !filters.eventTypes.includes(eventData.type)) return;
            }

            client.socket.emit('newEvent', eventData);
        });
    }
}

module.exports = RealTimeEventsAPI; 