const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

class TwitchSystem {
    constructor(client) {
        this.client = client;
        this.settingsFile = path.join(__dirname, 'twitch-settings.json');
        this.streamersFile = path.join(__dirname, 'twitch-streamers.json');
        this.liveDataFile = path.join(__dirname, 'twitch-live-data.json');
        
        this.settings = this.loadSettings();
        this.streamers = this.loadStreamers();
        this.liveData = this.loadLiveData();
        
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
    initializeSystem() {
        if (this.settings.enabled && this.clientId && this.clientSecret) {
            this.startTwitchMonitoring();
        }
        console.log('🎮 Twitch Live Notification System initialisiert');
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

    // Einstellungen laden
    loadSettings() {
        try {
            if (fs.existsSync(this.settingsFile)) {
                return JSON.parse(fs.readFileSync(this.settingsFile, 'utf8'));
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Twitch-Einstellungen:', error);
        }
        
        return this.getDefaultSettings();
    }

    // Streamer laden
    loadStreamers() {
        try {
            if (fs.existsSync(this.streamersFile)) {
                return JSON.parse(fs.readFileSync(this.streamersFile, 'utf8'));
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Streamer:', error);
        }
        
        return [];
    }

    // Live-Daten laden
    loadLiveData() {
        try {
            if (fs.existsSync(this.liveDataFile)) {
                return JSON.parse(fs.readFileSync(this.liveDataFile, 'utf8'));
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Live-Daten:', error);
        }
        
        return {};
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

    // Einstellungen speichern
    saveSettings() {
        try {
            fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Twitch-Einstellungen:', error);
            return false;
        }
    }

    // Streamer speichern
    saveStreamers() {
        try {
            fs.writeFileSync(this.streamersFile, JSON.stringify(this.streamers, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Streamer:', error);
            return false;
        }
    }

    // Live-Daten speichern
    saveLiveData() {
        try {
            fs.writeFileSync(this.liveDataFile, JSON.stringify(this.liveData, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Live-Daten:', error);
            return false;
        }
    }

    // Einstellungen aktualisieren
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        
        if (this.settings.enabled && !this.checkInterval) {
            this.startTwitchMonitoring();
        } else if (!this.settings.enabled && this.checkInterval) {
            this.stopTwitchMonitoring();
        }
        
        return true;
    }

    // Streamer hinzufügen
    addStreamer(streamerData) {
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
        this.saveStreamers();
        return streamer;
    }

    // Streamer entfernen
    removeStreamer(streamerId) {
        this.streamers = this.streamers.filter(s => s.id !== streamerId);
        delete this.liveData[streamerId];
        this.saveStreamers();
        this.saveLiveData();
        return true;
    }

    // Streamer aktualisieren
    updateStreamer(streamerId, updates) {
        const streamerIndex = this.streamers.findIndex(s => s.id === streamerId);
        if (streamerIndex !== -1) {
            this.streamers[streamerIndex] = { ...this.streamers[streamerIndex], ...updates };
            this.saveStreamers();
            return this.streamers[streamerIndex];
        }
        return null;
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
        if (this.liveData[streamKey]) {
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
            
            // Status speichern
            this.liveData[streamKey] = {
                streamId: stream.id,
                startedAt: stream.started_at,
                notifiedAt: new Date().toISOString()
            };
            
            // Streamer-Daten aktualisieren
            const streamerIndex = this.streamers.findIndex(s => s.id === streamer.id);
            if (streamerIndex !== -1) {
                this.streamers[streamerIndex].lastLive = new Date().toISOString();
                this.streamers[streamerIndex].totalNotifications++;
            }

            this.saveLiveData();
            this.saveStreamers();
            
        } catch (error) {
            console.error(`❌ Fehler beim Senden der Live-Benachrichtigung für ${streamer.username}:`, error);
        }
    }

    // Offline-Stream behandeln
    async handleOfflineStream(streamer) {
        // Offline-Benachrichtigungen für diesen Streamer prüfen
        if (!streamer.notifications.offline) return;

        // Prüfen ob Streamer vorher live war
        const wasLive = Object.keys(this.liveData).some(key => 
            key.startsWith(`${streamer.id}_`)
        );

        if (wasLive) {
            // Offline-Benachrichtigung senden
            try {
                await this.sendOfflineNotification(streamer);
                
                // Live-Daten für diesen Streamer löschen
                Object.keys(this.liveData).forEach(key => {
                    if (key.startsWith(`${streamer.id}_`)) {
                        delete this.liveData[key];
                    }
                });
                
                this.saveLiveData();
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
    getStats() {
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
}

module.exports = TwitchSystem; 