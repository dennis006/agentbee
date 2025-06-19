const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

class MiniChatAPI {
    constructor(client) {
        this.client = client;
        this.dataFile = path.join(__dirname, 'settings', 'mini-chat.json');
        this.activeConnections = new Map();
        this.chatHistory = new Map();
        this.quickResponses = new Map();
        this.ensureDataFile();
        this.setupChatHandling();
    }

    ensureDataFile() {
        const settingsDir = path.join(__dirname, 'settings');
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.dataFile)) {
            const defaultData = {
                settings: {
                    enabled: true,
                    maxHistoryLength: 100,
                    allowedRoles: [],
                    moderationEnabled: true,
                    autoTranslate: false
                },
                quickResponses: [
                    { id: 1, text: "Hello! Welcome to our server!", category: "greeting" },
                    { id: 2, text: "Please read our rules in #rules", category: "moderation" },
                    { id: 3, text: "Thanks for your question! Let me help you.", category: "support" },
                    { id: 4, text: "Have a great day! 😊", category: "farewell" }
                ],
                chatHistory: {},
                userPreferences: {}
            };
            fs.writeFileSync(this.dataFile, JSON.stringify(defaultData, null, 2));
        }
    }

    loadData() {
        try {
            return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        } catch (error) {
            console.error('Error loading mini chat data:', error);
            return { settings: {}, quickResponses: [], chatHistory: {}, userPreferences: {} };
        }
    }

    saveData(data) {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving mini chat data:', error);
            return false;
        }
    }

    setupChatHandling() {
        const data = this.loadData();
        if (!data.settings.enabled) return;

        // Monitor all messages for chat history
        this.client.on('messageCreate', (message) => {
            if (!message.guild) return;
            this.addToChatHistory(message);
        });

        // Monitor message deletions
        this.client.on('messageDelete', (message) => {
            if (!message.guild) return;
            this.handleMessageDeletion(message);
        });

        // Monitor message edits
        this.client.on('messageUpdate', (oldMessage, newMessage) => {
            if (!newMessage.guild) return;
            this.handleMessageEdit(oldMessage, newMessage);
        });
    }

    addToChatHistory(message) {
        const guildId = message.guild.id;
        const channelId = message.channel.id;
        const data = this.loadData();

        if (!data.chatHistory[guildId]) {
            data.chatHistory[guildId] = {};
        }

        if (!data.chatHistory[guildId][channelId]) {
            data.chatHistory[guildId][channelId] = [];
        }

        const messageData = {
            id: message.id,
            author: {
                id: message.author.id,
                username: message.author.username,
                avatar: message.author.displayAvatarURL(),
                bot: message.author.bot
            },
            content: message.content,
            timestamp: message.createdTimestamp,
            edited: false,
            deleted: false,
            attachments: message.attachments.map(att => ({
                id: att.id,
                name: att.name,
                url: att.url,
                size: att.size
            })),
            embeds: message.embeds.length,
            reactions: []
        };

        const channelHistory = data.chatHistory[guildId][channelId];
        channelHistory.push(messageData);

        // Keep only the latest messages
        if (channelHistory.length > data.settings.maxHistoryLength) {
            channelHistory.splice(0, channelHistory.length - data.settings.maxHistoryLength);
        }

        this.saveData(data);

        // Broadcast to connected clients
        this.broadcastMessage(guildId, channelId, {
            type: 'new_message',
            data: messageData
        });
    }

    handleMessageDeletion(message) {
        if (message.partial) return;

        const guildId = message.guild.id;
        const channelId = message.channel.id;
        const data = this.loadData();

        if (data.chatHistory[guildId] && data.chatHistory[guildId][channelId]) {
            const messageIndex = data.chatHistory[guildId][channelId]
                .findIndex(msg => msg.id === message.id);
            
            if (messageIndex !== -1) {
                data.chatHistory[guildId][channelId][messageIndex].deleted = true;
                data.chatHistory[guildId][channelId][messageIndex].content = '[Message deleted]';
                this.saveData(data);

                this.broadcastMessage(guildId, channelId, {
                    type: 'message_deleted',
                    data: { messageId: message.id }
                });
            }
        }
    }

    handleMessageEdit(oldMessage, newMessage) {
        if (oldMessage.partial || newMessage.partial) return;

        const guildId = newMessage.guild.id;
        const channelId = newMessage.channel.id;
        const data = this.loadData();

        if (data.chatHistory[guildId] && data.chatHistory[guildId][channelId]) {
            const messageIndex = data.chatHistory[guildId][channelId]
                .findIndex(msg => msg.id === newMessage.id);
            
            if (messageIndex !== -1) {
                data.chatHistory[guildId][channelId][messageIndex].content = newMessage.content;
                data.chatHistory[guildId][channelId][messageIndex].edited = true;
                data.chatHistory[guildId][channelId][messageIndex].editedTimestamp = newMessage.editedTimestamp;
                this.saveData(data);

                this.broadcastMessage(guildId, channelId, {
                    type: 'message_edited',
                    data: {
                        messageId: newMessage.id,
                        newContent: newMessage.content,
                        editedTimestamp: newMessage.editedTimestamp
                    }
                });
            }
        }
    }

    async sendMessage(guildId, channelId, content, userId) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) throw new Error('Guild not found');

            const channel = guild.channels.cache.get(channelId);
            if (!channel) throw new Error('Channel not found');

            const member = guild.members.cache.get(userId);
            if (!member) throw new Error('Member not found');

            // Check permissions
            if (!this.canUserSendMessages(member, channel)) {
                throw new Error('Insufficient permissions');
            }

            // Send the message
            const message = await channel.send(content);

            return {
                success: true,
                message: {
                    id: message.id,
                    content: message.content,
                    timestamp: message.createdTimestamp
                }
            };
        } catch (error) {
            console.error('Error sending message:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteMessage(guildId, channelId, messageId, userId) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            const channel = guild.channels.cache.get(channelId);
            const member = guild.members.cache.get(userId);

            if (!this.canUserModerate(member, channel)) {
                throw new Error('Insufficient permissions to delete messages');
            }

            const message = await channel.messages.fetch(messageId);
            await message.delete();

            return { success: true };
        } catch (error) {
            console.error('Error deleting message:', error);
            return { success: false, error: error.message };
        }
    }

    async muteUser(guildId, userId, duration, reason, moderatorId) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            const member = guild.members.cache.get(userId);
            const moderator = guild.members.cache.get(moderatorId);

            if (!this.canUserModerate(moderator)) {
                throw new Error('Insufficient permissions to mute users');
            }

            // Implementation depends on your muting system
            // This is a placeholder for muting logic
            console.log(`Muting user ${userId} for ${duration}ms. Reason: ${reason}`);

            return { success: true };
        } catch (error) {
            console.error('Error muting user:', error);
            return { success: false, error: error.message };
        }
    }

    canUserSendMessages(member, channel) {
        return channel.permissionsFor(member).has(['SEND_MESSAGES', 'VIEW_CHANNEL']);
    }

    canUserModerate(member, channel = null) {
        const permissions = channel ? 
            channel.permissionsFor(member) : 
            member.permissions;
        
        return permissions.has(['MANAGE_MESSAGES']) || 
               permissions.has(['ADMINISTRATOR']);
    }

    getChatHistory(guildId, channelId, limit = 50) {
        const data = this.loadData();
        
        if (!data.chatHistory[guildId] || !data.chatHistory[guildId][channelId]) {
            return [];
        }

        const history = data.chatHistory[guildId][channelId];
        return history.slice(-limit).reverse();
    }

    getChannelList(guildId, userId) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return [];

            const member = guild.members.cache.get(userId);
            if (!member) return [];

            const textChannels = guild.channels.cache
                .filter(channel => {
                    return channel.type === 'GUILD_TEXT' && 
                           channel.permissionsFor(member).has('VIEW_CHANNEL');
                })
                .map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    topic: channel.topic,
                    nsfw: channel.nsfw,
                    position: channel.position,
                    parentId: channel.parentId,
                    canSend: channel.permissionsFor(member).has('SEND_MESSAGES')
                }));

            return textChannels.sort((a, b) => a.position - b.position);
        } catch (error) {
            console.error('Error getting channel list:', error);
            return [];
        }
    }

    getQuickResponses(category = null) {
        const data = this.loadData();
        let responses = data.quickResponses || [];

        if (category) {
            responses = responses.filter(response => response.category === category);
        }

        return responses;
    }

    addQuickResponse(text, category = 'general') {
        const data = this.loadData();
        const newId = Math.max(...data.quickResponses.map(r => r.id), 0) + 1;

        const newResponse = {
            id: newId,
            text: text,
            category: category,
            createdAt: Date.now(),
            usageCount: 0
        };

        data.quickResponses.push(newResponse);
        this.saveData(data);

        return newResponse;
    }

    useQuickResponse(responseId) {
        const data = this.loadData();
        const response = data.quickResponses.find(r => r.id === responseId);

        if (response) {
            response.usageCount = (response.usageCount || 0) + 1;
            response.lastUsed = Date.now();
            this.saveData(data);
            return response.text;
        }

        return null;
    }

    deleteQuickResponse(responseId) {
        const data = this.loadData();
        const index = data.quickResponses.findIndex(r => r.id === responseId);

        if (index !== -1) {
            data.quickResponses.splice(index, 1);
            this.saveData(data);
            return true;
        }

        return false;
    }

    // WebSocket connection management
    addConnection(ws, guildId, channelId, userId) {
        const connectionId = Math.random().toString(36).substring(7);
        
        this.activeConnections.set(connectionId, {
            ws: ws,
            guildId: guildId,
            channelId: channelId,
            userId: userId,
            connectedAt: Date.now()
        });

        ws.on('close', () => {
            this.activeConnections.delete(connectionId);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            this.activeConnections.delete(connectionId);
        });

        // Send initial chat history
        const history = this.getChatHistory(guildId, channelId);
        ws.send(JSON.stringify({
            type: 'chat_history',
            data: history
        }));

        return connectionId;
    }

    broadcastMessage(guildId, channelId, message) {
        this.activeConnections.forEach(connection => {
            if (connection.guildId === guildId && 
                connection.channelId === channelId &&
                connection.ws.readyState === WebSocket.OPEN) {
                
                try {
                    connection.ws.send(JSON.stringify(message));
                } catch (error) {
                    console.error('Error broadcasting message:', error);
                }
            }
        });
    }

    getUserTyping(guildId, channelId) {
        const typing = [];
        
        this.activeConnections.forEach(connection => {
            if (connection.guildId === guildId && 
                connection.channelId === channelId &&
                connection.typing) {
                
                typing.push({
                    userId: connection.userId,
                    startedAt: connection.typingStarted
                });
            }
        });

        return typing;
    }

    setUserTyping(connectionId, typing) {
        const connection = this.activeConnections.get(connectionId);
        if (connection) {
            connection.typing = typing;
            connection.typingStarted = typing ? Date.now() : null;

            // Broadcast typing status
            this.broadcastMessage(connection.guildId, connection.channelId, {
                type: 'user_typing',
                data: {
                    userId: connection.userId,
                    typing: typing
                }
            });
        }
    }

    getOnlineUsers(guildId, channelId) {
        const users = new Map();

        this.activeConnections.forEach(connection => {
            if (connection.guildId === guildId && connection.channelId === channelId) {
                users.set(connection.userId, {
                    userId: connection.userId,
                    connectedAt: connection.connectedAt,
                    typing: connection.typing || false
                });
            }
        });

        return Array.from(users.values());
    }

    getStatistics(guildId = null) {
        const data = this.loadData();
        let messageCount = 0;
        let channelCount = 0;

        if (guildId && data.chatHistory[guildId]) {
            const guildHistory = data.chatHistory[guildId];
            channelCount = Object.keys(guildHistory).length;
            
            Object.values(guildHistory).forEach(channelHistory => {
                messageCount += channelHistory.length;
            });
        } else {
            // All guilds
            Object.values(data.chatHistory).forEach(guildHistory => {
                channelCount += Object.keys(guildHistory).length;
                
                Object.values(guildHistory).forEach(channelHistory => {
                    messageCount += channelHistory.length;
                });
            });
        }

        return {
            totalMessages: messageCount,
            totalChannels: channelCount,
            activeConnections: this.activeConnections.size,
            quickResponses: data.quickResponses.length,
            averageMessagesPerChannel: channelCount > 0 ? Math.round(messageCount / channelCount) : 0
        };
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

    // Moderation features
    async kickUser(guildId, userId, reason, moderatorId) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            const member = guild.members.cache.get(userId);
            const moderator = guild.members.cache.get(moderatorId);

            if (!this.canUserModerate(moderator)) {
                throw new Error('Insufficient permissions');
            }

            await member.kick(reason);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async banUser(guildId, userId, reason, moderatorId, deleteMessageDays = 0) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            const member = guild.members.cache.get(userId);
            const moderator = guild.members.cache.get(moderatorId);

            if (!moderator.permissions.has('BAN_MEMBERS')) {
                throw new Error('Insufficient permissions');
            }

            await guild.members.ban(userId, { 
                reason: reason,
                days: deleteMessageDays 
            });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = MiniChatAPI;
