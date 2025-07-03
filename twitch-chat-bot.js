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
            console.log(`🤖 Starte Twitch Bot "${this.botUsername}"...`);
            
            // TMI Client konfigurieren mit aggressiveren Einstellungen
            const clientOptions = {
                options: { 
                    debug: false,
                    messagesLogLevel: 'info'
                },
                connection: {
                    reconnect: true,
                    secure: true,
                    timeout: 30000,      // 30 Sekunden Timeout
                    reconnectDelay: 2000, // 2 Sekunden Reconnect-Delay
                    reconnectDecay: 1.5,  // Exponentieller Backoff
                    maxReconnectAttempts: 10
                },
                identity: {
                    username: this.botUsername,
                    password: this.oauthToken
                },
                channels: [] // Channels separat joinen für bessere Kontrolle
            };

            this.client = new tmi.Client(clientOptions);
            this.setupEventHandlers();
            
            // Bot verbinden mit Timeout
            console.log('🔗 Verbinde mit Twitch...');
            const connectPromise = this.client.connect();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000)
            );
            
            await Promise.race([connectPromise, timeoutPromise]);
            
            console.log(`✅ Twitch Bot "${this.botUsername}" erfolgreich verbunden`);
            
            this.isConnected = true;
            this.stats.uptime = Date.now();
            this.reconnectAttempts = 0;
            
            // Channels nach erfolgreicher Verbindung joinen
            await this.joinConfiguredChannels();
            
        } catch (error) {
            console.error('❌ Fehler beim Starten des Twitch Bots:', error);
            this.isConnected = false;
            
            // Cleanup bei Fehler
            if (this.client) {
                try {
                    await this.client.disconnect();
                } catch (disconnectError) {
                    console.error('❌ Fehler beim Disconnect nach Start-Fehler:', disconnectError);
                }
                this.client = null;
            }
            
            throw error;
        }
    }

    // Neue Methode: Channels nach Verbindung joinen
    async joinConfiguredChannels() {
        if (!this.client || !this.isConnected) return;
        
        const channelNames = Array.from(this.channels.keys());
        if (channelNames.length === 0) {
            console.log('🤖 Keine Channels zum Joinen konfiguriert');
            return;
        }
        
        console.log(`🏠 Joiner ${channelNames.length} Channels...`);
        
        for (const channelName of channelNames) {
            try {
                // Mit kleiner Verzögerung zwischen Joins
                await new Promise(resolve => setTimeout(resolve, 500));
                
                await this.client.join(channelName);
                console.log(`✅ Bot ist Channel ${channelName} beigetreten`);
                
            } catch (joinError) {
                console.error(`❌ Fehler beim Joinen von ${channelName}:`, joinError);
                // Weitermachen mit nächstem Channel
            }
        }
        
        console.log(`🎉 Bot Setup abgeschlossen! Aktiv in ${this.channels.size} Channels`);
    }

    // Bot stoppen
    async stop() {
        console.log('🛑 Stoppe Twitch Bot...');
        
        // Status sofort auf disconnected setzen um Reconnects zu verhindern
        this.isConnected = false;
        
        if (this.client) {
            try {
                // Channels verlassen
                const joinedChannels = this.client.getChannels ? this.client.getChannels() : [];
                console.log(`🔴 Verlasse ${joinedChannels.length} Channels...`);
                
                for (const channel of joinedChannels) {
                    try {
                        await this.client.part(channel);
                    } catch (e) {
                        // Ignorieren - Channel war bereits verlassen
                    }
                }
                
                // Client disconnecten
                await this.client.disconnect();
                console.log('🤖 Twitch Bot erfolgreich gestoppt');
                
            } catch (error) {
                console.error('❌ Fehler beim Stoppen des Bots:', error);
            } finally {
                // Client-Referenz cleanen
                this.client = null;
            }
        }
        
        // Stats zurücksetzen
        this.stats.connectedChannels = 0;
        this.reconnectAttempts = 0;
        
        console.log('✅ Bot vollständig gestoppt');
    }

    // Event Handlers setup
    setupEventHandlers() {
        if (!this.client) return;

        // Verbindung erfolgreich
        this.client.on('connected', (addr, port) => {
            console.log(`🟢 Twitch Bot verbunden mit ${addr}:${port}`);
            this.isConnected = true;
            this.stats.connectedChannels = this.channels.size;
        });

        // Verbindung verloren
        this.client.on('disconnected', (reason) => {
            console.log(`🔴 Twitch Bot getrennt: ${reason}`);
            this.isConnected = false;
            
            // Schnellere Reconnection versuchen
            setTimeout(() => {
                this.handleDisconnection();
            }, 1000); // 1 Sekunde Verzögerung
        });

        // Verbindung wird aufgebaut
        this.client.on('connecting', (address, port) => {
            console.log(`🔄 Verbinde mit Twitch Chat auf ${address}:${port}...`);
        });

        // Reconnect-Versuch
        this.client.on('reconnect', () => {
            console.log('🔄 Twitch Bot versucht Reconnect...');
        });

        // Chat Messages
        this.client.on('message', (channel, tags, message, self) => {
            if (self) return; // Eigene Messages ignorieren
            
            this.handleMessage(channel, tags, message);
        });

        // Channel joined - Mit verbessertem Logging
        this.client.on('join', (channel, username, self) => {
            if (self) {
                console.log(`🟢 Bot "${this.botUsername}" ist Channel ${channel} beigetreten`);
                this.stats.connectedChannels = this.getJoinedChannelsCount();
            }
        });

        // Channel left
        this.client.on('part', (channel, username, self) => {
            if (self) {
                console.log(`🔴 Bot "${this.botUsername}" hat Channel ${channel} verlassen`);
                this.stats.connectedChannels = this.getJoinedChannelsCount();
            }
        });

        // Error handling mit detailliertem Logging
        this.client.on('error', (error) => {
            console.error('❌ Twitch Bot Fehler:', error);
            
            // Bei kritischen Fehlern Reconnect versuchen
            if (error.message && error.message.includes('Login authentication failed')) {
                console.error('❌ KRITISCH: OAuth Token ungültig! Bot kann nicht verbinden.');
                this.isConnected = false;
            } else if (error.message && error.message.includes('Connection closed')) {
                console.log('🔄 Verbindung geschlossen, versuche Reconnect...');
                this.handleDisconnection();
            }
        });

        // Rate Limit Warnings
        this.client.on('slowmode', (channel, enabled, length) => {
            if (enabled) {
                console.log(`⚠️ Slowmode aktiviert in ${channel}: ${length}s`);
            }
        });

        // Hosting Events
        this.client.on('hosted', (channel, username, viewers, autohost) => {
            console.log(`🎯 ${channel} wird von ${username} gehostet (${viewers} Zuschauer)`);
        });
    }

    // Neue Hilfsmethode: Anzahl der tatsächlich beigetretenen Channels
    getJoinedChannelsCount() {
        if (!this.client || !this.client.getChannels) return 0;
        return this.client.getChannels().length;
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
        
        console.log(`🏠 Füge Channel ${formattedChannel} hinzu...`);
        
        this.channels.set(formattedChannel, {
            enabled: true,
            autoJoin: true,
            discordChannelId: '',
            syncMessages: false,
            welcomeMessage: '',
            liveMessageEnabled: true,
            liveMessageTemplate: '🔴 Stream ist LIVE! Willkommen alle! 🎉',
            useCustomLiveMessage: false,
            liveMessageVariables: { username: true, game: true, title: true, viewers: true },
            ...channelSettings
        });

        // Falls Bot bereits läuft, Channel sofort joinen
        if (this.client && this.isConnected) {
            try {
                console.log(`🔄 Joiner Channel ${formattedChannel} sofort...`);
                await this.client.join(formattedChannel);
                console.log(`✅ Channel ${formattedChannel} erfolgreich gejoint`);
                
                // Stats aktualisieren
                this.stats.connectedChannels = this.getJoinedChannelsCount();
                
            } catch (error) {
                console.error(`❌ Fehler beim Joinen von ${formattedChannel}:`, error);
                throw error;
            }
        } else {
            console.log(`📝 Channel ${formattedChannel} zur Liste hinzugefügt (Bot offline)`);
        }
        
        return true;
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
        // Nicht reconnecten wenn manuell gestoppt
        if (!this.isConnected && this.client === null) {
            console.log('🤖 Bot wurde manuell gestoppt, kein Reconnect');
            return;
        }
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 30000); // Max 30 Sekunden
            
            console.log(`🔄 Reconnect Versuch ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay/1000}s`);
            
            setTimeout(async () => {
                try {
                    // Cleanup alte Verbindung
                    if (this.client) {
                        try {
                            await this.client.disconnect();
                        } catch (e) {
                            // Ignorieren - client war bereits disconnected
                        }
                    }
                    
                    // Frische Verbindung aufbauen
                    console.log('🔄 Starte frische Bot-Verbindung...');
                    await this.start();
                    
                    console.log('✅ Bot erfolgreich reconnected!');
                    
                } catch (error) {
                    console.error('❌ Reconnect fehlgeschlagen:', error);
                    
                    // Weiterer Reconnect-Versuch
                    setTimeout(() => {
                        this.handleDisconnection();
                    }, 2000);
                }
            }, delay);
        } else {
            console.error('❌ Maximale Reconnect-Versuche erreicht. Bot gestoppt.');
            this.isConnected = false;
            this.client = null;
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
        const joinedChannels = this.client && this.client.getChannels ? this.client.getChannels() : [];
        
        return {
            isConnected: this.isConnected,
            botUsername: this.botUsername,
            channelsCount: this.channels.size,
            joinedChannelsCount: joinedChannels.length,
            commandsCount: this.commands.size,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts,
            stats: {
                ...this.stats,
                uptime: this.getUptimeString(),
                connectedChannels: joinedChannels.length,
                configuredChannels: this.channels.size,
                joinedChannelNames: joinedChannels
            },
            connectionDetails: {
                hasClient: !!this.client,
                clientState: this.client ? 'initialized' : 'null',
                isReconnecting: this.reconnectAttempts > 0
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
            
            // Prüfen ob Live-Messages für diesen Channel aktiviert sind
            if (channelSettings && channelSettings.liveMessageEnabled === false) {
                console.log(`🤖 Live-Nachrichten für ${channelName} deaktiviert`);
                return false;
            }
            
            let message;
            
            // Template-basierte Nachricht generieren
            if (channelSettings && channelSettings.useCustomLiveMessage && channelSettings.liveMessageTemplate) {
                // Custom Template vom Channel verwenden
                message = this.replaceVariables(channelSettings.liveMessageTemplate, streamerInfo, channelName);
            } else {
                // Zufälliges Template aus der Datenbank oder Standard-Templates
                message = await this.getRandomLiveMessage(streamerInfo, channelName);
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
                
                // Statistik in Datenbank speichern (falls verfügbar)
                if (global.supabaseClient) {
                    this.saveLiveMessageStats(channelName, message, streamerInfo);
                }
                
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
    
    // Zufällige Live-Nachricht generieren
    async getRandomLiveMessage(streamerInfo = {}, channelName = '') {
        try {
            // Fallback Standard-Nachrichten (falls keine Datenbank verfügbar)
            const fallbackMessages = [
                '🔴 Stream ist LIVE! Willkommen alle! 🎉',
                '🎮 Der Stream startet JETZT! Let\'s go! 🔥',
                '⚡ LIVE! Bereit für Action? 💪',
                '🚀 Stream ist online! Viel Spaß beim Zuschauen! ❤️',
                '🎊 GO LIVE! Lasst uns eine geile Zeit haben! 🎯'
            ];
            
            // Versuche Template aus Datenbank zu holen
            if (global.supabaseClient) {
                try {
                    const { data, error } = await global.supabaseClient
                        .from('twitch_bot_live_message_templates')
                        .select('id, template, name')
                        .eq('guild_id', 'default')
                        .eq('enabled', true)
                        .order('RANDOM()')
                        .limit(1)
                        .single();
                    
                    if (!error && data) {
                        // Template-Nutzung in DB vermerken
                        await this.incrementTemplateUsage(data.id);
                        
                        // Variablen ersetzen
                        return this.replaceVariables(data.template, streamerInfo, channelName);
                    }
                } catch (dbError) {
                    console.log('⚠️ Template aus DB nicht verfügbar, verwende Fallback');
                }
            }
            
            // Fallback zu Standard-Templates
            const randomMessage = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
            return this.replaceVariables(randomMessage, streamerInfo, channelName);
            
        } catch (error) {
            console.error('❌ Fehler beim Generieren der Live-Nachricht:', error);
            return '🔴 Stream ist LIVE! 🎉';
        }
    }
    
    // Template-Variablen ersetzen
    replaceVariables(template, streamerInfo = {}, channelName = '') {
        let message = template;
        
        // Variablen ersetzen
        message = message.replace(/\{\{username\}\}/g, streamerInfo.displayName || channelName || 'Streamer');
        message = message.replace(/\{\{streamer\}\}/g, streamerInfo.displayName || channelName || 'Streamer');
        message = message.replace(/\{\{game\}\}/g, streamerInfo.gameName || 'Gaming');
        message = message.replace(/\{\{title\}\}/g, streamerInfo.title || 'Awesome Stream');
        message = message.replace(/\{\{viewers\}\}/g, (streamerInfo.viewerCount || 0).toString());
        
        return message;
    }
    
    // Template-Nutzung in DB erhöhen
    async incrementTemplateUsage(templateId) {
        if (!global.supabaseClient) return;
        
        try {
            await global.supabaseClient
                .from('twitch_bot_live_message_templates')
                .update({ 
                    usage_count: global.supabaseClient.raw('usage_count + 1'),
                    updated_at: new Date().toISOString()
                })
                .eq('id', templateId);
        } catch (error) {
            console.log('⚠️ Template-Nutzung konnte nicht gespeichert werden:', error);
        }
    }
    
    // Live-Message Statistik speichern
    async saveLiveMessageStats(channelName, message, streamerInfo = {}) {
        if (!global.supabaseClient) return;
        
        try {
            // Channel ID ermitteln
            const { data: channelData } = await global.supabaseClient
                .from('twitch_bot_channels')
                .select('id')
                .eq('guild_id', 'default')
                .eq('channel_name', channelName.toLowerCase())
                .single();
            
            if (channelData) {
                await global.supabaseClient
                    .from('twitch_bot_live_message_stats')
                    .insert({
                        guild_id: 'default',
                        channel_id: channelData.id,
                        message_sent: message,
                        stream_info: {
                            game: streamerInfo.gameName,
                            title: streamerInfo.title,
                            viewers: streamerInfo.viewerCount,
                            displayName: streamerInfo.displayName
                        },
                        success: true
                    });
            }
        } catch (error) {
            console.log('⚠️ Live-Message Statistik konnte nicht gespeichert werden:', error);
        }
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