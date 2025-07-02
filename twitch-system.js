const { EmbedBuilder } = require('discord.js');
const TwitchSupabaseAPI = require('./twitch-supabase-api');

class TwitchSystem {
    constructor(client) {
        this.client = client;
        this.supabaseAPI = new TwitchSupabaseAPI();
        
        this.settings = {};
        this.streamers = [];
        this.liveData = {};
        
        this.checkInterval = null;
        this.twitchAPI = null;
        
        // Twitch API Credentials aus zentralem API-Key-System laden
        this.clientId = null;
        this.clientSecret = null;
        this.accessToken = null;
        
        // Credentials werden über setCredentials() gesetzt
        
        this.initializeSystem();
    }

    // System initialisieren
    async initializeSystem() {
        try {
            await this.loadData();
            if (this.settings.enabled && this.clientId && this.clientSecret) {
                this.startTwitchMonitoring();
            }
            console.log('🎮 Twitch Live Notification System mit Supabase initialisiert');
        } catch (error) {
            console.error('❌ Fehler beim Initialisieren des Twitch Systems:', error);
        }
    }

    // Daten aus Supabase laden
    async loadData() {
        try {
            if (!this.supabaseAPI.isAvailable()) {
                console.log('⚠️ Supabase nicht verfügbar - verwende Fallback-Einstellungen');
                this.settings = this.getDefaultSettings();
                this.streamers = [];
                this.liveData = {};
                return;
            }

            // Einstellungen laden
            this.settings = await this.loadSettingsFromSupabase();
            
            // Streamer laden
            this.streamers = await this.loadStreamersFromSupabase();
            
            // Live-Daten laden
            this.liveData = await this.loadLiveDataFromSupabase();
            
            console.log('✅ Twitch-Daten aus Supabase geladen');
        } catch (error) {
            console.error('❌ Fehler beim Laden der Twitch-Daten aus Supabase:', error);
            // Fallback zu Default-Einstellungen
            this.settings = this.getDefaultSettings();
            this.streamers = [];
            this.liveData = {};
        }
    }

    // Credentials setzen
    setCredentials(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.accessToken = null; // Reset access token
        
        if (clientId && clientSecret) {
            console.log('🔑 Twitch API Credentials gesetzt');
            if (this.settings.enabled && !this.checkInterval) {
                this.startTwitchMonitoring();
            }
        } else {
            console.log('⚠️  Twitch API Credentials entfernt - System gestoppt');
            this.stopTwitchMonitoring();
        }
    }

    // Einstellungen aus Supabase laden
    async loadSettingsFromSupabase() {
        try {
            const data = await this.supabaseAPI.getSettings();
            
            // Daten in altes Format konvertieren für Kompatibilität
            return {
                enabled: data.enabled,
                checkInterval: data.check_interval,
                channels: {
                    notificationChannel: data.notification_channel,
                    roleToMention: data.role_to_mention,
                    mentionEveryone: data.mention_everyone
                },
                embed: {
                    color: data.embed_color,
                    showThumbnail: data.show_thumbnail,
                    showViewerCount: data.show_viewer_count,
                    showCategory: data.show_category,
                    showUptime: data.show_uptime,
                    customMessage: data.custom_message,
                    includeEmojis: data.include_emojis,
                    customEmojis: data.custom_emojis || []
                },
                notifications: {
                    onlyFirstTime: data.only_first_time,
                    cooldown: data.cooldown,
                    offlineNotification: data.offline_notification,
                    streamEndedMessage: data.stream_ended_message
                },
                filters: {
                    minViewers: data.min_viewers,
                    allowedCategories: data.allowed_categories || [],
                    blockedCategories: data.blocked_categories || [],
                    onlyFollowers: data.only_followers
                }
            };
        } catch (error) {
            console.error('❌ Fehler beim Laden der Einstellungen aus Supabase:', error);
            return this.getDefaultSettings();
        }
    }

    // Streamer aus Supabase laden
    async loadStreamersFromSupabase() {
        try {
            const data = await this.supabaseAPI.getStreamers();
            
            // Daten in altes Format konvertieren für Kompatibilität
            return data.map(streamer => ({
                id: streamer.id.toString(),
                username: streamer.username,
                displayName: streamer.display_name,
                customMessage: streamer.custom_message,
                enabled: streamer.enabled,
                addedAt: streamer.created_at,
                notifications: {
                    live: streamer.live_notifications,
                    offline: streamer.offline_notifications
                },
                lastLive: streamer.last_live,
                totalNotifications: streamer.total_notifications
            }));
        } catch (error) {
            console.error('❌ Fehler beim Laden der Streamer aus Supabase:', error);
            return [];
        }
    }

    // Live-Daten aus Supabase laden
    async loadLiveDataFromSupabase() {
        try {
            const data = await this.supabaseAPI.getLiveData();
            
            // Daten in altes Format konvertieren für Kompatibilität
            const liveData = {};
            for (const item of data) {
                const key = `${item.streamer_id}_${item.stream_id}`;
                liveData[key] = {
                    streamId: item.stream_id,
                    startedAt: item.started_at,
                    notifiedAt: item.notified_at
                };
            }
            
            return liveData;
        } catch (error) {
            console.error('❌ Fehler beim Laden der Live-Daten aus Supabase:', error);
            return {};
        }
    }

    // Standard-Einstellungen
    getDefaultSettings() {
        return {
            enabled: true,
            checkInterval: 5, // Minuten
            channels: {
                notificationChannel: 'live-streams',
                roleToMention: '',
                mentionEveryone: false
            },
            embed: {
                color: '0x00FF7F', // Grün wie XP System
                showThumbnail: true,
                showViewerCount: true,
                showCategory: true,
                showUptime: true,
                customMessage: '🔴 **{streamer}** ist jetzt LIVE!',
                includeEmojis: true,
                customEmojis: ['🎮', '🔥', '💜', '⭐', '🚀']
            },
            notifications: {
                onlyFirstTime: false,
                cooldown: 30,
                offlineNotification: false,
                streamEndedMessage: '📴 **{streamer}** hat den Stream beendet!'
            },
            filters: {
                minViewers: 0,
                allowedCategories: [],
                blockedCategories: [],
                onlyFollowers: false
            }
        };
    }

    // Einstellungen in Supabase speichern
    async saveSettings() {
        try {
            if (!this.supabaseAPI.isAvailable()) {
                console.log('⚠️ Supabase nicht verfügbar - Einstellungen nicht gespeichert');
                return false;
            }

            await this.supabaseAPI.updateSettings(this.settings);
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Twitch-Einstellungen:', error);
            return false;
        }
    }

    // Streamer in Supabase speichern (wird automatisch durch API-Aufrufe erledigt)
    async saveStreamers() {
        // Diese Methode wird für Kompatibilität beibehalten, aber die Daten
        // werden automatisch durch die Supabase API gespeichert
        return true;
    }

    // Live-Daten in Supabase speichern (wird automatisch durch API-Aufrufe erledigt)
    async saveLiveData() {
        // Diese Methode wird für Kompatibilität beibehalten, aber die Daten
        // werden automatisch durch die Supabase API gespeichert
        return true;
    }

    // Einstellungen aktualisieren
    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        await this.saveSettings();
        
        if (this.settings.enabled && !this.checkInterval) {
            this.startTwitchMonitoring();
        } else if (!this.settings.enabled && this.checkInterval) {
            this.stopTwitchMonitoring();
        }
        
        return true;
    }

    // Streamer hinzufügen
    async addStreamer(streamerData) {
        try {
            if (!this.supabaseAPI.isAvailable()) {
                // Fallback: Lokales hinzufügen
                const streamer = {
                    id: Date.now().toString(),
                    username: streamerData.username.toLowerCase(),
                    displayName: streamerData.displayName || streamerData.username,
                    customMessage: streamerData.customMessage || '',
                    enabled: true,
                    addedAt: new Date().toISOString(),
                    notifications: {
                        live: true,
                        offline: streamerData.offlineNotifications || false
                    },
                    lastLive: null,
                    totalNotifications: 0
                };

                this.streamers.push(streamer);
                return streamer;
            }

            // Zu Supabase hinzufügen
            const supabaseStreamer = await this.supabaseAPI.addStreamer(streamerData);
            
            // Lokale Liste aktualisieren
            const streamer = {
                id: supabaseStreamer.id.toString(),
                username: supabaseStreamer.username,
                displayName: supabaseStreamer.display_name,
                customMessage: supabaseStreamer.custom_message,
                enabled: supabaseStreamer.enabled,
                addedAt: supabaseStreamer.created_at,
                notifications: {
                    live: supabaseStreamer.live_notifications,
                    offline: supabaseStreamer.offline_notifications
                },
                lastLive: supabaseStreamer.last_live,
                totalNotifications: supabaseStreamer.total_notifications
            };

            this.streamers.push(streamer);
            return streamer;
        } catch (error) {
            console.error('❌ Fehler beim Hinzufügen des Streamers:', error);
            throw error;
        }
    }

    // Streamer entfernen
    async removeStreamer(streamerId) {
        try {
            if (this.supabaseAPI.isAvailable()) {
                await this.supabaseAPI.removeStreamer(streamerId);
            }

            // Lokale Liste aktualisieren
            this.streamers = this.streamers.filter(s => s.id !== streamerId);
            
            // Live-Daten für diesen Streamer entfernen
            Object.keys(this.liveData).forEach(key => {
                if (key.startsWith(`${streamerId}_`)) {
                    delete this.liveData[key];
                }
            });
            
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Entfernen des Streamers:', error);
            return false;
        }
    }

    // Streamer aktualisieren
    async updateStreamer(streamerId, updates) {
        try {
            if (this.supabaseAPI.isAvailable()) {
                const updatedStreamer = await this.supabaseAPI.updateStreamer(streamerId, updates);
                
                // Lokale Liste aktualisieren
                const streamerIndex = this.streamers.findIndex(s => s.id === streamerId);
                if (streamerIndex !== -1) {
                    this.streamers[streamerIndex] = {
                        id: updatedStreamer.id.toString(),
                        username: updatedStreamer.username,
                        displayName: updatedStreamer.display_name,
                        customMessage: updatedStreamer.custom_message,
                        enabled: updatedStreamer.enabled,
                        addedAt: updatedStreamer.created_at,
                        notifications: {
                            live: updatedStreamer.live_notifications,
                            offline: updatedStreamer.offline_notifications
                        },
                        lastLive: updatedStreamer.last_live,
                        totalNotifications: updatedStreamer.total_notifications
                    };
                    return this.streamers[streamerIndex];
                }
            } else {
                // Fallback: Lokale Aktualisierung
                const streamerIndex = this.streamers.findIndex(s => s.id === streamerId);
                if (streamerIndex !== -1) {
                    this.streamers[streamerIndex] = { ...this.streamers[streamerIndex], ...updates };
                    return this.streamers[streamerIndex];
                }
            }
            
            return null;
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren des Streamers:', error);
            return null;
        }
    }

    // Monitoring starten
    startTwitchMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        const intervalMs = this.settings.checkInterval * 60 * 1000;
        
        this.checkInterval = setInterval(() => {
            this.checkStreams();
        }, intervalMs);

        setTimeout(() => {
            this.checkStreams();
        }, 10000);

        console.log(`🎮 Twitch-Monitoring gestartet (alle ${this.settings.checkInterval} Minuten)`);
    }

    // Monitoring stoppen
    stopTwitchMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        console.log('🎮 Twitch-Monitoring gestoppt');
    }

    // Streams prüfen - Echte Twitch API Integration
    async checkStreams() {
        if (!this.settings.enabled || this.streamers.length === 0) {
            return;
        }

        // Prüfen ob Twitch Credentials vorhanden sind
        if (!this.clientId || !this.clientSecret) {
            console.log('⚠️ Twitch API Credentials fehlen - bitte in .env konfigurieren');
            return;
        }

        try {
            console.log('🎮 Prüfe Streams...');
            
            // Access Token holen falls nicht vorhanden
            if (!this.accessToken) {
                await this.getAccessToken();
            }

            const enabledStreamers = this.streamers.filter(s => s.enabled);
            if (enabledStreamers.length === 0) return;

            // Twitch API - Streamer-Status abrufen
            const usernames = enabledStreamers.map(s => s.username).join('&user_login=');
            const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_login=${usernames}`, {
                headers: {
                    'Client-ID': this.clientId,
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!streamResponse.ok) {
                if (streamResponse.status === 401) {
                    // Token abgelaufen - neu holen
                    this.accessToken = null;
                    await this.getAccessToken();
                    return this.checkStreams(); // Nochmal versuchen
                }
                throw new Error(`Twitch API Fehler: ${streamResponse.status}`);
            }

            const streamData = await streamResponse.json();
            
            // User-Daten holen für Display-Namen
            const userResponse = await fetch(`https://api.twitch.tv/helix/users?login=${usernames}`, {
                headers: {
                    'Client-ID': this.clientId,
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!userResponse.ok) {
                throw new Error(`Twitch Users API Fehler: ${userResponse.status}`);
            }

            const userData = await userResponse.json();

            // Streams verarbeiten
            for (const streamer of enabledStreamers) {
                const stream = streamData.data.find(s => s.user_login.toLowerCase() === streamer.username.toLowerCase());
                const user = userData.data.find(u => u.login.toLowerCase() === streamer.username.toLowerCase());
                
                if (stream) {
                    // Streamer ist live
                    await this.handleLiveStream(streamer, stream, user);
                } else {
                    // Streamer ist offline
                    await this.handleOfflineStream(streamer);
                }
            }

            this.lastCheck = new Date().toISOString();
            console.log(`✅ Stream-Check abgeschlossen (${enabledStreamers.length} Streamer geprüft)`);

        } catch (error) {
            console.error('❌ Fehler beim Prüfen der Streams:', error);
        }
    }

    // Access Token von Twitch holen
    async getAccessToken() {
        try {
            // Prüfe ob Credentials vorhanden sind
            if (!this.clientId || !this.clientSecret) {
                throw new Error('Twitch API Credentials nicht konfiguriert');
            }

            const response = await fetch('https://id.twitch.tv/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`,
                timeout: 15000 // 15 Sekunden Timeout
            });

            if (!response.ok) {
                throw new Error(`Token-Request fehlgeschlagen: ${response.status}`);
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            console.log('🔑 Twitch Access Token erhalten');
            return this.accessToken;
        } catch (error) {
            console.error('❌ Fehler beim Holen des Access Tokens:', error);
            throw error;
        }
    }

    // Live-Stream behandeln
    async handleLiveStream(streamer, stream, user) {
        const streamKey = `${streamer.id}_${stream.id}`;
        
        // Prüfen ob bereits eine Benachrichtigung für diesen Stream gesendet wurde
        let alreadyNotified = false;
        
        if (this.supabaseAPI.isAvailable()) {
            alreadyNotified = await this.supabaseAPI.isNotificationSent(streamer.id, stream.id);
        } else {
            alreadyNotified = !!this.liveData[streamKey];
        }
        
        if (alreadyNotified) {
            return; // Bereits benachrichtigt
        }

        // Filter prüfen
        if (!this.passesFilters(stream)) {
            return;
        }

        // Cooldown prüfen
        if (this.settings.notifications.onlyFirstTime && streamer.lastLive) {
            const lastLive = new Date(streamer.lastLive).getTime();
            const cooldownMs = this.settings.notifications.cooldown * 60 * 1000;
            if (Date.now() - lastLive < cooldownMs) {
                return;
            }
        }

        try {
            await this.sendLiveNotification(streamer, stream, user);
            
            // Status in Supabase speichern
            if (this.supabaseAPI.isAvailable()) {
                await this.supabaseAPI.setLiveStatus(streamer.id, {
                    streamId: stream.id,
                    startedAt: stream.started_at
                });
            } else {
                // Fallback: Lokales Speichern
                this.liveData[streamKey] = {
                    streamId: stream.id,
                    startedAt: stream.started_at,
                    notifiedAt: new Date().toISOString()
                };
            }
            
            // Lokale Streamer-Daten aktualisieren
            const streamerIndex = this.streamers.findIndex(s => s.id === streamer.id);
            if (streamerIndex !== -1) {
                this.streamers[streamerIndex].lastLive = new Date().toISOString();
                this.streamers[streamerIndex].totalNotifications++;
            }
            
        } catch (error) {
            console.error(`❌ Fehler beim Senden der Live-Benachrichtigung für ${streamer.username}:`, error);
        }
    }

    // Offline-Stream behandeln
    async handleOfflineStream(streamer) {
        // Offline-Benachrichtigungen für diesen Streamer prüfen
        if (!streamer.notifications.offline) return;

        // Prüfen ob Streamer vorher live war
        let wasLive = false;
        
        if (this.supabaseAPI.isAvailable()) {
            const liveData = await this.supabaseAPI.getLiveData();
            wasLive = liveData.some(item => item.streamer_id === parseInt(streamer.id));
        } else {
            wasLive = Object.keys(this.liveData).some(key => 
                key.startsWith(`${streamer.id}_`)
            );
        }

        if (wasLive) {
            // Offline-Benachrichtigung senden
            try {
                await this.sendOfflineNotification(streamer);
                
                // Live-Status in Supabase beenden
                if (this.supabaseAPI.isAvailable()) {
                    await this.supabaseAPI.endLiveStatus(streamer.id);
                } else {
                    // Fallback: Lokale Live-Daten für diesen Streamer löschen
                    Object.keys(this.liveData).forEach(key => {
                        if (key.startsWith(`${streamer.id}_`)) {
                            delete this.liveData[key];
                        }
                    });
                }
                
            } catch (error) {
                console.error(`❌ Fehler beim Senden der Offline-Benachrichtigung für ${streamer.username}:`, error);
            }
        }
    }

    // Filter prüfen
    passesFilters(stream) {
        // Mindest-Zuschauerzahl
        if (stream.viewer_count < this.settings.filters.minViewers) {
            return false;
        }

        // Erlaubte Kategorien
        if (this.settings.filters.allowedCategories.length > 0) {
            if (!this.settings.filters.allowedCategories.includes(stream.game_name)) {
                return false;
            }
        }

        // Blockierte Kategorien
        if (this.settings.filters.blockedCategories.includes(stream.game_name)) {
            return false;
        }

        return true;
    }

    // Live-Benachrichtigung senden
    async sendLiveNotification(streamer, stream, user) {
        const channel = await this.getNotificationChannel();
        if (!channel) {
            throw new Error('Notification-Channel nicht gefunden');
        }

        const embed = new EmbedBuilder()
            .setTitle(`🔴 ${streamer.displayName} ist jetzt LIVE!`)
            .setURL(`https://twitch.tv/${streamer.username}`)
            .setColor(parseInt(this.settings.embed.color.replace('0x', ''), 16))
            .addFields(
                { name: '🎮 Spiel', value: stream.game_name || 'Unbekannt', inline: true },
                { name: '👥 Zuschauer', value: stream.viewer_count.toString(), inline: true }
            )
            .setTimestamp();

        if (this.settings.embed.showUptime) {
            const uptime = this.calculateUptime(stream.started_at);
            embed.addFields({ name: '⏰ Live seit', value: uptime, inline: true });
        }

        if (this.settings.embed.showThumbnail && stream.thumbnail_url) {
            const thumbnailUrl = stream.thumbnail_url.replace('{width}', '1920').replace('{height}', '1080');
            embed.setImage(thumbnailUrl);
        }

        if (stream.title) {
            embed.setDescription(`**${stream.title}**`);
        }

        if (user && user.profile_image_url) {
            embed.setThumbnail(user.profile_image_url);
        }

        embed.setFooter({ text: 'Twitch Live Notification' });

        // Nachricht zusammenstellen
        let message = '';
        if (this.settings.channels.mentionEveryone) {
            message += '@everyone ';
        } else if (this.settings.channels.roleToMention) {
            message += `<@&${this.settings.channels.roleToMention}> `;
        }

        const template = streamer.customMessage || this.settings.embed.customMessage;
        message += template
            .replace('{{streamer}}', streamer.displayName)
            .replace('{streamer}', streamer.displayName);

        if (this.settings.embed.includeEmojis && this.settings.embed.customEmojis.length > 0) {
            const randomEmoji = this.settings.embed.customEmojis[Math.floor(Math.random() * this.settings.embed.customEmojis.length)];
            message += ` ${randomEmoji}`;
        }

        await channel.send({
            content: message,
            embeds: [embed]
        });

        console.log(`📢 Live-Benachrichtigung gesendet für ${streamer.username}`);
    }

    // Offline-Benachrichtigung senden
    async sendOfflineNotification(streamer) {
        const channel = await this.getNotificationChannel();
        if (!channel) return;

        const message = this.settings.notifications.streamEndedMessage
            .replace('{{streamer}}', streamer.displayName)
            .replace('{streamer}', streamer.displayName);
        
        await channel.send({
            content: message
        });

        console.log(`📴 Offline-Benachrichtigung gesendet für ${streamer.username}`);
    }

    // Uptime berechnen
    calculateUptime(startedAt) {
        const start = new Date(startedAt);
        const now = new Date();
        const diffMs = now - start;
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    // Test-Benachrichtigung
    async testNotification(streamerId) {
        const streamer = this.streamers.find(s => s.id === streamerId);
        if (!streamer) return { error: 'Streamer nicht gefunden' };

        try {
            const channel = await this.getNotificationChannel();
            if (!channel) return { error: 'Notification-Channel nicht gefunden' };

            const embed = new EmbedBuilder()
                .setTitle(`🔴 ${streamer.displayName} ist jetzt LIVE! (TEST)`)
                .setDescription('🧪 Dies ist eine Test-Benachrichtigung!')
                .setColor(parseInt(this.settings.embed.color.replace('0x', ''), 16))
                .setURL(`https://twitch.tv/${streamer.username}`)
                .addFields(
                    { name: '🎮 Spiel', value: 'Just Chatting', inline: true },
                    { name: '👥 Zuschauer', value: '42', inline: true },
                    { name: '⏰ Live seit', value: '5m', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Twitch Live Notification (TEST)' });

            let message = '';
            if (this.settings.channels.mentionEveryone) {
                message += '@everyone ';
            } else if (this.settings.channels.roleToMention) {
                message += `<@&${this.settings.channels.roleToMention}> `;
            }

            const template = streamer.customMessage || this.settings.embed.customMessage;
            message += template
                .replace('{{streamer}}', streamer.displayName)
                .replace('{streamer}', streamer.displayName);

            if (this.settings.embed.includeEmojis && this.settings.embed.customEmojis.length > 0) {
                const randomEmoji = this.settings.embed.customEmojis[Math.floor(Math.random() * this.settings.embed.customEmojis.length)];
                message += ` ${randomEmoji}`;
            }

            await channel.send({
                content: message,
                embeds: [embed]
            });

            return { success: true, message: 'Test-Benachrichtigung gesendet!' };
        } catch (error) {
            console.error('❌ Fehler beim Testen der Benachrichtigung:', error);
            return { error: error.message };
        }
    }

    // Notification-Channel holen
    async getNotificationChannel() {
        try {
            for (const guild of this.client.guilds.cache.values()) {
                const channel = guild.channels.cache.find(ch => 
                    ch.name === this.settings.channels.notificationChannel && ch.type === 0
                );
                if (channel) return channel;
            }
        } catch (error) {
            console.error('❌ Fehler beim Finden des Notification-Channels:', error);
        }
        return null;
    }

    // Statistiken holen
    async getStats() {
        try {
            if (this.supabaseAPI.isAvailable()) {
                const stats = await this.supabaseAPI.getStats();
                return {
                    totalStreamers: stats.total_streamers || 0,
                    activeStreamers: stats.active_streamers || 0,
                    totalNotifications: stats.total_notifications || 0,
                    currentlyLive: stats.currently_live || 0,
                    systemEnabled: this.settings.enabled,
                    lastCheck: this.lastCheck || null
                };
            } else {
                // Fallback: Lokale Berechnung
                const totalStreamers = this.streamers.length;
                const activeStreamers = this.streamers.filter(s => s.enabled).length;
                const totalNotifications = this.streamers.reduce((sum, s) => sum + s.totalNotifications, 0);
                const currentlyLive = Object.keys(this.liveData).length;

                return {
                    totalStreamers,
                    activeStreamers,
                    totalNotifications,
                    currentlyLive,
                    systemEnabled: this.settings.enabled,
                    lastCheck: this.lastCheck || null
                };
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Statistiken:', error);
            return {
                totalStreamers: 0,
                activeStreamers: 0,
                totalNotifications: 0,
                currentlyLive: 0,
                systemEnabled: this.settings.enabled,
                lastCheck: this.lastCheck || null
            };
        }
    }
}

module.exports = TwitchSystem; 