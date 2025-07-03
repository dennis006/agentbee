// Twitch Chat Bot System - Echter Twitch Chat Bot
// Multi-Channel Chat Bot mit Commands und Moderation

const tmi = require('tmi.js');
const { EmbedBuilder } = require('discord.js');

class TwitchChatBot {
    constructor() {
        this.client = null;
        this.discordClient = null;
        this.isConnected = false;
        this.channels = new Map();
        this.commands = new Map();
        this.stats = {
            messagesProcessed: 0,
            commandsExecuted: 0,
            uptime: Date.now(),
            connectedChannels: 0
        };
        
        // Verbindungsdetails
        this.botUsername = '';
        this.oauthToken = '';
        this.settings = null;
        
        // Live Notification System
        this.liveNotificationEnabled = true;
        this.sentLiveNotifications = new Set(); // Track sent notifications
        
        // Reconnection handling
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000;
        
        this.initializeCommands();
    }

    // Discord Client setzen
    setDiscordClient(discordClient) {
        this.discordClient = discordClient;
    }

    // Bot konfigurieren
    configure(settings) {
        this.settings = settings;
        this.botUsername = settings.botUsername || 'AgentBeeBot';
        this.oauthToken = settings.oauthToken || '';
        this.liveNotificationEnabled = settings.liveNotificationEnabled !== false;
        
        console.log(`🤖 Twitch Bot konfiguriert: ${this.botUsername}`);
    }

    // Standard Commands initialisieren
    initializeCommands() {
        // Ping Command
        this.addCommand('ping', {
            description: 'Bot Ping testen',
            usage: '!ping',
            cooldown: 5000, // 5 Sekunden
            handler: async (channel, tags, message, args) => {
                const uptime = this.getUptimeString();
                this.sendMessage(channel, `🏓 Pong! Bot läuft seit ${uptime}`);
            }
        });

        // Uptime Command
        this.addCommand('uptime', {
            description: 'Bot Uptime anzeigen',
            usage: '!uptime',
            cooldown: 10000, // 10 Sekunden
            handler: async (channel, tags, message, args) => {
                const uptime = this.getUptimeString();
                this.sendMessage(channel, `⏰ Bot läuft seit ${uptime}`);
            }
        });

        // Help Command
        this.addCommand('help', {
            description: 'Zeige verfügbare Commands',
            usage: '!help [command]',
            cooldown: 15000, // 15 Sekunden
            handler: async (channel, tags, message, args) => {
                if (args.length > 0) {
                    const command = this.commands.get(args[0].toLowerCase());
                    if (command) {
                        this.sendMessage(channel, `ℹ️ ${command.usage} - ${command.description}`);
                    } else {
                        this.sendMessage(channel, `❌ Command "${args[0]}" nicht gefunden`);
                    }
                } else {
                    const commandList = Array.from(this.commands.keys()).join(', ');
                    this.sendMessage(channel, `📋 Verfügbare Commands: ${commandList}`);
                }
            }
        });

        // Discord Sync Command
        this.addCommand('discord', {
            description: 'Discord Server Link',
            usage: '!discord',
            cooldown: 30000, // 30 Sekunden
            handler: async (channel, tags, message, args) => {
                const channelSettings = this.channels.get(channel);
                if (channelSettings?.discordChannelId && this.discordClient) {
                    const discordChannel = this.discordClient.channels.cache.get(channelSettings.discordChannelId);
                    if (discordChannel) {
                        this.sendMessage(channel, `🔗 Discord Channel: ${discordChannel.guild.name} - #${discordChannel.name}`);
                        
                        // Sync zu Discord senden
                        if (channelSettings.syncMessages) {
                            const embed = new EmbedBuilder()
                                .setColor('#9146FF')
                                .setTitle('💬 Twitch Chat Command')
                                .setDescription(`**${tags['display-name']}** verwendete \`!discord\` in **${channel}**`)
                                .setTimestamp()
                                .setFooter({ text: 'Twitch Chat Bot' });
                            
                            discordChannel.send({ embeds: [embed] });
                        }
                    }
                } else {
                    this.sendMessage(channel, `💬 Unser Discord Server wartet auf dich!`);
                }
            }
        });

        console.log(`🤖 ${this.commands.size} Standard Commands initialisiert`);
    }

    // Command hinzufügen
    addCommand(name, commandData) {
        this.commands.set(name.toLowerCase(), {
            ...commandData,
            lastUsed: new Map() // Pro User Cooldown tracking
        });
    }

    // Command entfernen
    removeCommand(name) {
        return this.commands.delete(name.toLowerCase());
    }

    // Bot starten
    async start() {
        if (!this.oauthToken || !this.botUsername) {
            throw new Error('Bot Username oder OAuth Token fehlen');
        }

        try {
            // TMI Client konfigurieren
            const clientOptions = {
                options: { debug: false },
                connection: {
                    reconnect: true,
                    secure: true
                },
                identity: {
                    username: this.botUsername,
                    password: this.oauthToken
                },
                channels: Array.from(this.channels.keys())
            };

            this.client = new tmi.Client(clientOptions);
            this.setupEventHandlers();
            
            await this.client.connect();
            console.log(`🤖 Twitch Bot "${this.botUsername}" erfolgreich gestartet`);
            
            this.isConnected = true;
            this.stats.uptime = Date.now();
            this.reconnectAttempts = 0;
            
        } catch (error) {
            console.error('❌ Fehler beim Starten des Twitch Bots:', error);
            this.isConnected = false;
            throw error;
        }
    }

    // Bot stoppen
    async stop() {
        if (this.client) {
            try {
                await this.client.disconnect();
                console.log('🤖 Twitch Bot gestoppt');
            } catch (error) {
                console.error('❌ Fehler beim Stoppen des Bots:', error);
            }
        }
        this.isConnected = false;
        this.client = null;
    }

    // Event Handlers setup
    setupEventHandlers() {
        if (!this.client) return;

        // Verbindung erfolgreich
        this.client.on('connected', (addr, port) => {
            console.log(`🤖 Twitch Bot verbunden mit ${addr}:${port}`);
            this.isConnected = true;
            this.stats.connectedChannels = this.channels.size;
        });

        // Verbindung verloren
        this.client.on('disconnected', (reason) => {
            console.log(`🤖 Twitch Bot getrennt: ${reason}`);
            this.isConnected = false;
            this.handleDisconnection();
        });

        // Chat Messages
        this.client.on('message', (channel, tags, message, self) => {
            if (self) return; // Eigene Messages ignorieren
            
            this.handleMessage(channel, tags, message);
        });

        // Channel joined
        this.client.on('join', (channel, username, self) => {
            if (self) {
                console.log(`🤖 Bot "${this.botUsername}" ist Channel ${channel} beigetreten`);
            }
        });

        // Channel left
        this.client.on('part', (channel, username, self) => {
            if (self) {
                console.log(`🤖 Bot "${this.botUsername}" hat Channel ${channel} verlassen`);
            }
        });

        // Error handling
        this.client.on('error', (error) => {
            console.error('❌ Twitch Bot Fehler:', error);
        });
    }

    // Message handling
    async handleMessage(channel, tags, message) {
        this.stats.messagesProcessed++;
        
        const channelSettings = this.channels.get(channel);
        if (!channelSettings) return;

        // Command Prefix prüfen
        const prefix = this.settings?.commandPrefix || '!';
        if (!message.startsWith(prefix)) {
            // Normale Nachricht - zu Discord weiterleiten wenn aktiviert
            if (channelSettings.syncMessages && this.discordClient && channelSettings.discordChannelId) {
                await this.syncMessageToDiscord(channel, tags, message, channelSettings.discordChannelId);
            }
            return;
        }

        // Command verarbeiten
        const args = message.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        const command = this.commands.get(commandName);
        if (!command) return;

        // Moderation Check
        if (this.settings?.modCommandsOnly && !this.isModerator(tags)) {
            return;
        }

        // Cooldown Check
        const userId = tags['user-id'];
        const lastUsed = command.lastUsed.get(userId) || 0;
        const timeSinceLastUse = Date.now() - lastUsed;
        
        if (timeSinceLastUse < command.cooldown) {
            const remainingCooldown = Math.ceil((command.cooldown - timeSinceLastUse) / 1000);
            this.sendMessage(channel, `⏰ Command Cooldown: ${remainingCooldown}s verbleibend`);
            return;
        }

        try {
            // Command ausführen
            await command.handler(channel, tags, message, args);
            command.lastUsed.set(userId, Date.now());
            this.stats.commandsExecuted++;
            
            console.log(`🎮 Command "${commandName}" von ${tags['display-name']} in ${channel}`);
        } catch (error) {
            console.error(`❌ Fehler beim Ausführen von Command "${commandName}":`, error);
            this.sendMessage(channel, `❌ Fehler beim Ausführen des Commands`);
        }
    }

    // Message zu Discord weiterleiten
    async syncMessageToDiscord(channel, tags, message, discordChannelId) {
        if (!this.discordClient) return;

        try {
            const discordChannel = this.discordClient.channels.cache.get(discordChannelId);
            if (!discordChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#9146FF')
                .setAuthor({
                    name: tags['display-name'] || tags.username,
                    iconURL: `https://static-cdn.jtvnw.net/user-default-pictures-uv/13e5fa74-defa-11e5-8972-02301e8ac30e.png`
                })
                .setDescription(message)
                .setFooter({ 
                    text: `Twitch: ${channel.replace('#', '')}`,
                    iconURL: 'https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png'
                })
                .setTimestamp();

            await discordChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('❌ Fehler beim Sync zu Discord:', error);
        }
    }

    // Moderator Check
    isModerator(tags) {
        return tags.mod || tags.badges?.broadcaster === '1' || tags.badges?.moderator === '1';
    }

    // Message senden
    sendMessage(channel, message) {
        if (!this.client || !this.isConnected) return;
        
        // Global Cooldown berücksichtigen
        const globalCooldown = this.settings?.globalCooldown || 3;
        setTimeout(() => {
            this.client.say(channel, message);
        }, globalCooldown * 1000);
    }

    // Channel hinzufügen
    async addChannel(channelName, channelSettings = {}) {
        const formattedChannel = channelName.startsWith('#') ? channelName : `#${channelName}`;
        
        this.channels.set(formattedChannel, {
            enabled: true,
            autoJoin: true,
            discordChannelId: '',
            syncMessages: false,
            ...channelSettings
        });

        // Bot läuft bereits? Channel joinen
        if (this.client && this.isConnected) {
            try {
                await this.client.join(formattedChannel);
                console.log(`🤖 Channel ${formattedChannel} hinzugefügt`);
            } catch (error) {
                console.error(`❌ Fehler beim Joinen von ${formattedChannel}:`, error);
            }
        }
    }

    // Channel entfernen
    async removeChannel(channelName) {
        const formattedChannel = channelName.startsWith('#') ? channelName : `#${channelName}`;
        
        // Bot läuft? Channel verlassen
        if (this.client && this.isConnected) {
            try {
                await this.client.part(formattedChannel);
                console.log(`🤖 Channel ${formattedChannel} verlassen`);
            } catch (error) {
                console.error(`❌ Fehler beim Verlassen von ${formattedChannel}:`, error);
            }
        }

        return this.channels.delete(formattedChannel);
    }

    // Verbindungsfehler behandeln
    handleDisconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnect Versuch ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay/1000}s`);
            
            setTimeout(() => {
                this.start().catch(error => {
                    console.error('❌ Reconnect fehlgeschlagen:', error);
                });
            }, this.reconnectDelay);
        } else {
            console.error('❌ Maximale Reconnect-Versuche erreicht');
        }
    }

    // Uptime String generieren
    getUptimeString() {
        const uptimeMs = Date.now() - this.stats.uptime;
        const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
        const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    // Bot Status abrufen
    getStatus() {
        return {
            isConnected: this.isConnected,
            botUsername: this.botUsername,
            channelsCount: this.channels.size,
            commandsCount: this.commands.size,
            stats: {
                ...this.stats,
                uptime: this.getUptimeString(),
                connectedChannels: this.isConnected ? this.channels.size : 0
            }
        };
    }

    // Test Nachricht senden
    async sendTestMessage(channelName) {
        const formattedChannel = channelName.startsWith('#') ? channelName : `#${channelName}`;
        
        if (!this.channels.has(formattedChannel)) {
            throw new Error('Channel nicht gefunden');
        }

        const testMessage = `🤖 Test-Nachricht von ${this.botUsername}! Bot läuft ordnungsgemäß. ⚡`;
        this.sendMessage(formattedChannel, testMessage);
        
        return { success: true, message: testMessage };
    }

    // =============================================
    // LIVE STREAM NOTIFICATION SYSTEM
    // =============================================
    
    // Automatische Live-Nachricht senden
    async sendLiveMessage(channelName, streamerInfo = {}) {
        if (!this.isConnected || !this.liveNotificationEnabled) {
            return false;
        }
        
        const notificationKey = `${channelName}_${Date.now()}`;
        
        // Prüfen ob bereits eine Nachricht in den letzten 30 Minuten gesendet wurde
        const recentNotifications = Array.from(this.sentLiveNotifications).filter(key => 
            key.startsWith(channelName) && 
            (Date.now() - parseInt(key.split('_')[1])) < 30 * 60 * 1000 // 30 Minuten
        );
        
        if (recentNotifications.length > 0) {
            console.log(`🤖 Live-Nachricht für ${channelName} bereits kürzlich gesendet`);
            return false;
        }
        
        try {
            // Channel-spezifische Einstellungen abrufen
            const channelSettings = this.channels.get(`#${channelName}`);
            
            // Standard Live-Nachrichten
            const liveMessages = [
                `🔴 Stream ist LIVE! Willkommen alle! 🎉`,
                `🎮 Der Stream startet JETZT! Let's go! 🔥`,
                `⚡ LIVE! Bereit für Action? 💪`,
                `🚀 Stream ist online! Viel Spaß beim Zuschauen! ❤️`,
                `🎊 GO LIVE! Lasst uns eine geile Zeit haben! 🎯`
            ];
            
            // Custom Message falls konfiguriert
            let message = liveMessages[Math.floor(Math.random() * liveMessages.length)];
            
            if (channelSettings?.welcomeMessage) {
                message = channelSettings.welcomeMessage
                    .replace('{{username}}', streamerInfo.displayName || channelName)
                    .replace('{{streamer}}', streamerInfo.displayName || channelName)
                    .replace('{{game}}', streamerInfo.gameName || 'Gaming')
                    .replace('{{title}}', streamerInfo.title || 'Awesome Stream');
            }
            
            // Nachricht senden
            const success = this.sendMessage(`#${channelName}`, message);
            
            if (success) {
                // Notification tracking
                this.sentLiveNotifications.add(notificationKey);
                
                // Cleanup alte Notifications (> 2 Stunden)
                setTimeout(() => {
                    this.sentLiveNotifications.delete(notificationKey);
                }, 2 * 60 * 60 * 1000);
                
                console.log(`🤖 Live-Nachricht gesendet an ${channelName}: ${message}`);
                
                // Discord Sync falls aktiviert
                if (channelSettings?.syncMessages && channelSettings?.discordChannelId) {
                    await this.syncLiveMessageToDiscord(channelName, message, channelSettings.discordChannelId, streamerInfo);
                }
                
                return true;
            }
            
        } catch (error) {
            console.error(`❌ Fehler beim Senden der Live-Nachricht für ${channelName}:`, error);
        }
        
        return false;
    }
    
    // Live-Nachricht zu Discord syncen
    async syncLiveMessageToDiscord(channelName, message, discordChannelId, streamerInfo = {}) {
        if (!this.discordClient) return;
        
        try {
            const discordChannel = this.discordClient.channels.cache.get(discordChannelId);
            if (!discordChannel) return;
            
            const embed = new EmbedBuilder()
                .setColor('#FF0000') // Rot für LIVE
                .setTitle('🔴 Stream Live Nachricht')
                .setDescription(`**Bot Message in ${channelName}:**\n${message}`)
                .addFields([
                    {
                        name: '📺 Channel',
                        value: `https://twitch.tv/${channelName}`,
                        inline: true
                    }
                ])
                .setTimestamp()
                .setFooter({ text: 'Twitch Chat Bot - Live Notification' });
            
            // Streamer Info hinzufügen falls vorhanden
            if (streamerInfo.gameName) {
                embed.addFields([
                    {
                        name: '🎮 Spiel',
                        value: streamerInfo.gameName,
                        inline: true
                    }
                ]);
            }
            
            if (streamerInfo.viewerCount) {
                embed.addFields([
                    {
                        name: '👥 Zuschauer',
                        value: streamerInfo.viewerCount.toString(),
                        inline: true
                    }
                ]);
            }
            
            await discordChannel.send({ embeds: [embed] });
            console.log(`📤 Live-Nachricht zu Discord synced: #${discordChannel.name}`);
            
        } catch (error) {
            console.error('❌ Fehler beim Sync zu Discord:', error);
        }
    }
    
    // Live Notification System aktivieren/deaktivieren
    toggleLiveNotifications(enabled) {
        this.liveNotificationEnabled = enabled;
        console.log(`🤖 Live Notifications ${enabled ? 'aktiviert' : 'deaktiviert'}`);
        return this.liveNotificationEnabled;
    }
    
    // Manuelle Live-Nachricht (für Tests)
    async triggerLiveMessage(channelName, customMessage = null) {
        if (!this.isConnected) {
            throw new Error('Bot ist nicht verbunden');
        }
        
        const message = customMessage || `🔴 LIVE! Der Stream läuft! 🎉`;
        return this.sendMessage(`#${channelName}`, message);
    }
}

module.exports = TwitchChatBot; 