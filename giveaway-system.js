const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const supabaseAPI = require('./giveaway-supabase-api');

class GiveawaySystem {
    constructor(client) {
        this.client = client;
        this.giveaways = new Map();
        this.inviteTracking = new Map(); // userId -> { codes: [], totalInvites: number, username: string }
        this.inviteCodeTracking = new Map(); // code -> { userId: string, giveawayId: string, uses: number }
        this.userInvites = new Map(); // giveawayId -> { userId -> inviteCount }
        this.invitedUsers = new Map(); // giveawayId -> { inviterId -> Set<invitedUserId> } - Tracking wer wen eingeladen hat
        this.isSupabaseEnabled = false;
        this.settings = {
            enabled: true,
            defaultChannel: 'giveaways',
            embedColor: '0x00FF7F',
            endedEmbedColor: '0xFFD700',
            winnerDmColor: '0xFFD700',
            managerRoles: [],
            notifications: {
                newGiveaway: true,
                giveawayEnd: true,
                giveawayWin: true
            },
            limits: {
                maxActiveGiveaways: 5,
                maxWinners: 10,
                minDuration: 60000, // 1 Minute
                maxDuration: 2592000000 // 1 Monat
            },
            antiCheat: {
                preventSelfInvite: true,
                preventBotAccounts: true,
                minAccountAge: 604800000, // 7 Tage
                preventMultipleEntries: true
            },
            leaderboard: {
                autoCreate: true, // Automatisch Leaderboard-Channels erstellen
                updateInterval: 30, // Sekunden zwischen Updates
                autoUpdate: true, // Automatische Updates aktiviert
                showUsernames: true, // Zeige Usernamen statt nur IDs
                autoPost: {
                    enabled: false, // Auto-Leaderboard-Channels standardmäßig deaktiviert
                    lastPosted: 0,
                    categoryName: 'giveaway' // Standard-Kategorie-Name
                }
            }
        };
        
        this.dataFile = path.join(__dirname, 'giveaway-data.json');
        this.settingsFile = path.join(__dirname, 'giveaway-settings.json');
        
        // Initialize Supabase
        this.initializeSystem();
        
        // Event-Listener für Member-Join (für Invite-Tracking)
        this.client.on('guildMemberAdd', (member) => this.handleMemberJoin(member));
        
        // Timer für automatisches Beenden von Giveaways
        setInterval(() => this.checkExpiredGiveaways(), 30000);
        
        // Timer für automatische Leaderboard-Updates (konfigurierbar)
        this.leaderboardTimer = setInterval(() => {
            if (this.settings.leaderboard?.autoUpdate) {
                this.updateAllLeaderboards();
            }
        }, (this.settings.leaderboard?.updateInterval || 30) * 1000); // Alle 30 Sekunden prüfen

        // Timer für automatisches Leaderboard-Posting (jede Minute prüfen)
        setInterval(() => this.checkAutoLeaderboardPost(), 60000);
    }

    async initializeSystem() {
        try {
            console.log('🔄 Initializing Giveaway System...');
            
            // Try to initialize Supabase
            this.isSupabaseEnabled = await supabaseAPI.initializeSupabase();
            
            if (this.isSupabaseEnabled) {
                console.log('✅ Supabase initialized for Giveaway System');
                // Load settings from Supabase
                await this.loadSettingsFromSupabase();
                // Load giveaways from Supabase
                await this.loadGiveawaysFromSupabase();
            } else {
                console.log('⚠️ Supabase not available, using local fallback for Giveaway System');
                // Fallback to local files
                this.loadData();
                this.loadSettings();
            }
        } catch (error) {
            console.error('❌ Error initializing Giveaway System:', error);
            // Fallback to local files
            this.loadData();
            this.loadSettings();
        }
    }

    async loadSettingsFromSupabase() {
        try {
            if (this.isSupabaseEnabled && supabaseAPI.isSupabaseAvailable()) {
                const settings = await supabaseAPI.getSettings();
                this.settings = { ...this.settings, ...settings };
                console.log('✅ Giveaway settings loaded from Supabase');
            }
        } catch (error) {
            console.error('❌ Error loading settings from Supabase:', error);
            // Fallback to local files
            this.loadSettings();
        }
    }

    async loadGiveawaysFromSupabase() {
        try {
            if (this.isSupabaseEnabled && supabaseAPI.isSupabaseAvailable()) {
                const giveaways = await supabaseAPI.getAllGiveaways();
                this.giveaways.clear();
                
                for (const giveaway of giveaways) {
                    // Get participants for each giveaway
                    const participants = await supabaseAPI.getParticipants(giveaway.id);
                    giveaway.participants = new Set(participants.map(p => p.user_id));
                    this.giveaways.set(giveaway.id, giveaway);
                }
                
                console.log(`✅ Loaded ${giveaways.length} giveaway(s) from Supabase`);
            }
        } catch (error) {
            console.error('❌ Error loading giveaways from Supabase:', error);
            // Fallback to local files
            this.loadData();
        }
    }

    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                
                // Giveaways laden
                if (data.giveaways) {
                    data.giveaways.forEach(g => {
                        g.participants = new Set(g.participants || []);
                        this.giveaways.set(g.id, g);
                    });
                }
                
                // Einstellungen laden
                if (data.settings) {
                    this.settings = { ...this.settings, ...data.settings };
                }
                
                // Invite-Tracking laden
                if (data.inviteTracking) {
                    this.inviteTracking = new Map(Object.entries(data.inviteTracking));
                }
                
                if (data.inviteCodeTracking) {
                    this.inviteCodeTracking = new Map(Object.entries(data.inviteCodeTracking));
                }
                
                if (data.userInvites) {
                    this.userInvites = new Map();
                    Object.entries(data.userInvites).forEach(([giveawayId, userInvites]) => {
                        this.userInvites.set(giveawayId, new Map(Object.entries(userInvites)));
                    });
                }

                // Invited Users Tracking laden
                if (data.invitedUsers) {
                    this.invitedUsers = new Map();
                    Object.entries(data.invitedUsers).forEach(([giveawayId, inviters]) => {
                        const giveawayInvitedUsers = new Map();
                        Object.entries(inviters).forEach(([inviterId, invitedArray]) => {
                            giveawayInvitedUsers.set(inviterId, new Set(invitedArray));
                        });
                        this.invitedUsers.set(giveawayId, giveawayInvitedUsers);
                    });
                }
                
                console.log('✅ Giveaway-Daten geladen');
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Giveaway-Daten:', error);
        }
    }

    loadSettings() {
        try {
            if (fs.existsSync(this.settingsFile)) {
                const fileSettings = JSON.parse(fs.readFileSync(this.settingsFile, 'utf8'));
                // Merge-Strategie: Datei-Einstellungen überschreiben Standard-Einstellungen
                this.settings = {
                    ...this.settings,
                    ...fileSettings,
                    // Nested Objects korrekt mergen
                    notifications: { ...this.settings.notifications, ...(fileSettings.notifications || {}) },
                    limits: { ...this.settings.limits, ...(fileSettings.limits || {}) },
                    antiCheat: { ...this.settings.antiCheat, ...(fileSettings.antiCheat || {}) },
                    leaderboard: { 
                        ...this.settings.leaderboard, 
                        ...(fileSettings.leaderboard || {}),
                        autoPost: { 
                            ...this.settings.leaderboard.autoPost, 
                            ...(fileSettings.leaderboard?.autoPost || {}) 
                        }
                    }
                };
                console.log('✅ Giveaway-Einstellungen aus separater Datei geladen:', {
                    embedColor: this.settings.embedColor,
                    endedEmbedColor: this.settings.endedEmbedColor,
                    winnerDmColor: this.settings.winnerDmColor
                });
            } else {
                console.log('ℹ️ Keine separate Settings-Datei gefunden, verwende Standard-Einstellungen');
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Giveaway-Einstellungen:', error);
        }
    }

    async saveData() {
        try {
            // If Supabase is available, data is saved automatically through API calls
            // This method is kept for fallback compatibility
            if (!this.isSupabaseEnabled || !supabaseAPI.isSupabaseAvailable()) {
                const data = {
                    giveaways: Array.from(this.giveaways.values()).map(g => ({
                        ...g,
                        participants: Array.from(g.participants)
                    })),
                    settings: this.settings,
                    inviteTracking: Object.fromEntries(this.inviteTracking),
                    inviteCodeTracking: Object.fromEntries(this.inviteCodeTracking),
                    userInvites: Object.fromEntries(
                        Array.from(this.userInvites.entries()).map(([giveawayId, userMap]) => [
                            giveawayId, 
                            Object.fromEntries(userMap)
                        ])
                    ),
                    invitedUsers: Object.fromEntries(
                        Array.from(this.invitedUsers.entries()).map(([giveawayId, inviterMap]) => [
                            giveawayId,
                            Object.fromEntries(
                                Array.from(inviterMap.entries()).map(([inviterId, invitedSet]) => [
                                    inviterId,
                                    Array.from(invitedSet)
                                ])
                            )
                        ])
                    )
                };
                
                fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
                console.log('✅ Giveaway data saved to local file (fallback)');
            }
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Giveaway-Daten:', error);
        }
    }

    async updateSettings(newSettings) {
        const oldUpdateInterval = this.settings.leaderboard?.updateInterval;
        this.settings = { ...this.settings, ...newSettings };
        
        // Wenn Update-Intervall geändert wurde, Timer neu setzen
        const newUpdateInterval = this.settings.leaderboard?.updateInterval;
        if (oldUpdateInterval !== newUpdateInterval) {
            this.restartLeaderboardTimer();
            console.log(`🔄 Leaderboard-Timer neu gestartet: ${newUpdateInterval}s`);
            
            // Sofort alle Auto-Leaderboard-Channels aktualisieren mit neuem Intervall
            setTimeout(async () => {
                try {
                    await this.updateAllAutoLeaderboardChannelsWithNewInterval();
                    console.log('🔄 Alle Auto-Leaderboard-Channels mit neuem Intervall aktualisiert');
                } catch (error) {
                    console.error('⚠️ Fehler beim Aktualisieren der Auto-Leaderboard-Channels:', error);
                }
            }, 500);
        }
        
        await this.saveSettings();
        await this.saveData();
    }

    restartLeaderboardTimer() {
        // Alten Timer stoppen
        if (this.leaderboardTimer) {
            clearInterval(this.leaderboardTimer);
        }
        
        // Neuen Timer mit aktuellen Einstellungen starten
        this.leaderboardTimer = setInterval(() => {
            if (this.settings.leaderboard?.autoUpdate) {
                this.updateAllLeaderboards();
            }
        }, (this.settings.leaderboard?.updateInterval || 30) * 1000);
        
        console.log(`⏰ Leaderboard-Timer gestartet: Updates alle ${this.settings.leaderboard?.updateInterval || 30}s`);
    }

    async saveSettings() {
        try {
            if (this.isSupabaseEnabled && supabaseAPI.isSupabaseAvailable()) {
                await supabaseAPI.updateSettings(this.settings);
                console.log('✅ Giveaway settings saved to Supabase');
            } else {
                // Fallback to local file
                fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2));
                console.log('✅ Giveaway-Einstellungen lokal gespeichert (fallback)');
            }
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Giveaway-Einstellungen:', error);
            // Try fallback if Supabase fails
            try {
                fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2));
                console.log('✅ Giveaway-Einstellungen lokal gespeichert (fallback nach Supabase-Fehler)');
            } catch (fallbackError) {
                console.error('❌ Auch Fallback-Speicherung fehlgeschlagen:', fallbackError);
            }
        }
    }

    async createGiveaway(options) {
        if (!this.settings.enabled) {
            throw new Error('Giveaway-System ist deaktiviert');
        }

        // Validierung
        if (!options.title || !options.prize || !options.endTime) {
            throw new Error('Titel, Preis und Endzeit sind erforderlich');
        }

        if (options.endTime <= Date.now()) {
            throw new Error('Endzeit muss in der Zukunft liegen');
        }

        const duration = options.endTime - Date.now();
        if (duration < this.settings.limits.minDuration) {
            throw new Error(`Mindestdauer: ${this.settings.limits.minDuration / 1000} Sekunden`);
        }

        if (duration > this.settings.limits.maxDuration) {
            throw new Error(`Maximaldauer: ${this.settings.limits.maxDuration / (1000 * 60 * 60 * 24)} Tage`);
        }

        if (options.winners > this.settings.limits.maxWinners) {
            throw new Error(`Maximal ${this.settings.limits.maxWinners} Gewinner erlaubt`);
        }

        // Prüfe aktive Giveaways Limit
        const activeGiveaways = Array.from(this.giveaways.values()).filter(g => g.status === 'active');
        if (activeGiveaways.length >= this.settings.limits.maxActiveGiveaways) {
            throw new Error(`Maximal ${this.settings.limits.maxActiveGiveaways} aktive Giveaways erlaubt`);
        }

        // Giveaway erstellen
        const giveaway = {
            id: `gw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: options.title,
            description: options.description || '',
            prize: options.prize,
            type: options.type || 'classic',
            winners: options.winners || 1,
            endTime: options.endTime,
            createdAt: Date.now(),
            createdBy: options.createdBy,
            status: 'active',
            participants: new Set(),
            channelId: options.channelId,
            messageId: null,
            requirements: options.requirements || {},
            antiCheat: { ...this.settings.antiCheat, ...options.antiCheat }
        };

        // Save to Supabase first, then add to local map
        if (this.isSupabaseEnabled && supabaseAPI.isSupabaseAvailable()) {
            try {
                await supabaseAPI.createGiveaway(giveaway);
                console.log('✅ Giveaway created in Supabase');
            } catch (error) {
                console.error('❌ Error creating giveaway in Supabase:', error);
                // Continue with local storage as fallback
            }
        }

        this.giveaways.set(giveaway.id, giveaway);

        // Channel finden oder erstellen für normale Giveaways
        const guild = this.client.guilds.cache.first();
        if (!guild) {
            throw new Error('Server nicht gefunden');
        }

        let channel = guild.channels.cache.get(options.channelId);
        if (!channel) {
            // Versuche Channel by Name zu finden
            channel = guild.channels.cache.find(c => c.name === options.channelName);
            if (!channel) {
                throw new Error(`Channel nicht gefunden: ${options.channelId || options.channelName}`);
            }
            giveaway.channelId = channel.id;
        }

        // Giveaway-Nachricht erstellen
        const embed = this.createGiveawayEmbed(giveaway);
        const components = this.createGiveawayComponents(giveaway);

        const message = await channel.send({
            content: '@everyone',
            embeds: [embed],
            components: components
        });

        giveaway.messageId = message.id;

        // Für Invite-Giveaways: Automatisch Leaderboard-Channel erstellen (falls aktiviert)
        if (giveaway.type === 'invite' && this.settings.leaderboard?.autoCreate) {
            try {
                const leaderboardResult = await this.createOrUpdateLeaderboardChannel(giveaway.id);
                giveaway.leaderboardChannelId = leaderboardResult.channelId;
                giveaway.leaderboardMessageId = leaderboardResult.messageId;
                console.log(`✅ Leaderboard-Channel automatisch erstellt: ${leaderboardResult.channelName}`);
            } catch (error) {
                console.error('⚠️ Fehler beim automatischen Erstellen des Leaderboard-Channels:', error);
                // Giveaway trotzdem erstellen, nur ohne Leaderboard-Channel
            }
        }
            
        // Für Invite-Giveaways: Automatisch Auto-Leaderboard-Channel erstellen (falls aktiviert)
        console.log(`🔍 Auto-Leaderboard Check: Type=${giveaway.type}, AutoPost.enabled=${this.settings.leaderboard?.autoPost?.enabled}`);
        if (giveaway.type === 'invite' && this.settings.leaderboard?.autoPost?.enabled) {
            try {
                // Finde die konfigurierte Kategorie
                const categoryName = this.settings.leaderboard?.autoPost?.categoryName || 'giveaway';
                const giveawayCategory = guild.channels.cache.find(c => 
                    c.type === 4 && c.name.toLowerCase() === categoryName.toLowerCase()
                );
                
                const channelName = 'leaderboard';
                console.log(`🏗️ Erstelle Auto-Leaderboard-Channel: ${channelName} in Kategorie: ${giveawayCategory?.name || `'${categoryName}' nicht gefunden`}`);
                
                const autoChannel = await guild.channels.create({
                    name: channelName,
                    type: 0, // Text Channel
                    topic: `📅 Automatisches Leaderboard für: ${giveaway.title} | Updates alle ${this.settings.leaderboard?.updateInterval || 30}s`,
                    parent: giveawayCategory?.id || null // Unter konfigurierter Kategorie oder ohne
                });

                giveaway.autoLeaderboardChannelId = autoChannel.id;
                console.log(`✅ Auto-Leaderboard-Channel automatisch erstellt: ${channelName} (${autoChannel.id}) in Kategorie: ${giveawayCategory?.name || `'${categoryName}' nicht gefunden`}`);
                
                // Erste Nachricht posten
                const embed = this.createLeaderboardEmbed(giveaway);
                const firstMessage = await autoChannel.send({
                    content: `📅 **Auto-Leaderboard** (${new Date().toLocaleString('de-DE')}) | Updates alle ${this.settings.leaderboard?.updateInterval || 30}s`,
                    embeds: [embed]
                });
                
                giveaway.autoLeaderboardMessageId = firstMessage.id;
                console.log(`✅ Auto-Leaderboard erste Nachricht gepostet: ${firstMessage.id}`);

        } catch (error) {
                console.error('⚠️ Fehler beim automatischen Erstellen des Auto-Leaderboard-Channels:', error);
                // Giveaway trotzdem erstellen, nur ohne Auto-Leaderboard-Channel
            }
        } else if (giveaway.type === 'invite') {
            console.log(`ℹ️ Auto-Leaderboard deaktiviert für Invite-Giveaway: ${giveaway.title}`);
        } else {
            console.log(`ℹ️ Auto-Leaderboard nur für Invite-Giveaways verfügbar (Type: ${giveaway.type})`);
        }

        await this.saveData();

        // Benachrichtigung senden
        if (this.settings.notifications.newGiveaway) {
            console.log(`🎉 Neues Giveaway erstellt: ${giveaway.title}`);
        }

        return giveaway;
    }

    createGiveawayEmbed(giveaway) {
        const embed = new EmbedBuilder()
            .setTitle(`🎉 ${giveaway.title}`)
            .setDescription(giveaway.description || 'Nimm teil und gewinne!')
            .setColor(parseInt(this.settings.embedColor.replace('0x', ''), 16) || 0x00FF7F)
            .setTimestamp(giveaway.endTime)
            .setFooter({ text: `Endet am • ${giveaway.winners} Gewinner` });

        // Preis-Feld
        embed.addFields({
            name: '🎁 Preis',
            value: giveaway.prize,
            inline: true
        });

        // Teilnehmer-Feld
        embed.addFields({
            name: '👥 Teilnehmer',
            value: giveaway.participants.size.toString(),
            inline: true
        });

        // Typ-spezifische Felder
        if (giveaway.type === 'invite') {
            embed.addFields({
                name: '📨 Invite Giveaway',
                value: 'Klicke auf "Teilnehmen" um deinen persönlichen Invite-Link zu erhalten!',
                inline: false
            });
            
            // Leaderboard hinzufügen
            const leaderboard = this.getInviteLeaderboard(giveaway.id);
            if (leaderboard.length > 0) {
                const leaderboardText = leaderboard.slice(0, 5).map((entry, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '��' : index === 2 ? '🥉' : '🏅';
                    return `${medal} <@${entry.userId}>: **${entry.invites}** Einladungen`;
                }).join('\n');
                
                embed.addFields({
                    name: '🏆 Top Einlader',
                    value: leaderboardText,
                    inline: false
                });
            }
        }

        // Anforderungen anzeigen
        if (giveaway.requirements) {
            const requirements = [];
            
            // Account-Anforderungen
            if (giveaway.requirements.minAccountAge > 0) {
                const days = Math.floor(giveaway.requirements.minAccountAge / (24 * 60 * 60 * 1000));
                requirements.push(`🔒 Account älter als ${days} Tage`);
            }
            
            // Server-Anforderungen
            if (giveaway.requirements.minServerAge > 0) {
                const days = Math.floor(giveaway.requirements.minServerAge / (24 * 60 * 60 * 1000));
                requirements.push(`🏠 Server-Mitglied seit ${days} Tagen`);
            }
            
            if (giveaway.requirements.minLevel > 0) {
                requirements.push(`⭐ Mindest-Level: ${giveaway.requirements.minLevel}`);
            }
            
            if (giveaway.requirements.minMessages > 0) {
                requirements.push(`💬 Mindestens ${giveaway.requirements.minMessages} Nachrichten`);
            }
            
            if (giveaway.requirements.minVoiceTime > 0) {
                requirements.push(`🎤 Mindestens ${giveaway.requirements.minVoiceTime} Min. Voice-Zeit`);
            }
            
            // Rollen-Anforderungen
            if (giveaway.requirements.requiredRoles && giveaway.requirements.requiredRoles.length > 0) {
                requirements.push(`👑 Benötigt eine der ${giveaway.requirements.requiredRoles.length} Rollen`);
            }
            
            if (giveaway.requirements.blockedRoles && giveaway.requirements.blockedRoles.length > 0) {
                requirements.push(`🚫 ${giveaway.requirements.blockedRoles.length} Rollen ausgeschlossen`);
            }
            
            // Zusätzliche Bedingungen
            if (giveaway.requirements.requiresNitro) {
                requirements.push(`💎 Discord Nitro erforderlich`);
            }
            
            if (giveaway.requirements.requiresAvatar) {
                requirements.push(`🖼️ Profilbild erforderlich`);
            }
            
            if (giveaway.requirements.requiresVerifiedEmail) {
                requirements.push(`✉️ Verifizierte E-Mail erforderlich`);
            }
            
            if (giveaway.requirements.requires2FA) {
                requirements.push(`🔐 2FA erforderlich`);
            }
            
            // Listen
            if (giveaway.requirements.whitelist && giveaway.requirements.whitelist.length > 0) {
                requirements.push(`✅ Nur ${giveaway.requirements.whitelist.length} Whitelist-User`);
            }
            
            if (giveaway.requirements.blacklist && giveaway.requirements.blacklist.length > 0) {
                requirements.push(`❌ ${giveaway.requirements.blacklist.length} User ausgeschlossen`);
            }
            
            // Typ-spezifische Anforderungen
            if (giveaway.requirements.minXP > 0) {
                requirements.push(`⭐ Mindestens ${giveaway.requirements.minXP} XP`);
            }
            
            if (giveaway.requirements.minInvites > 0) {
                requirements.push(`📨 Mindestens ${giveaway.requirements.minInvites} Einladungen`);
            }
            
            if (requirements.length > 0) {
                // Bei vielen Anforderungen aufteilen
                if (requirements.length <= 8) {
                embed.addFields({
                    name: '📋 Anforderungen',
                    value: requirements.join('\n'),
                    inline: false
                });
                } else {
                    const firstHalf = requirements.slice(0, Math.ceil(requirements.length / 2));
                    const secondHalf = requirements.slice(Math.ceil(requirements.length / 2));
                    
                    embed.addFields({
                        name: '📋 Anforderungen (Teil 1)',
                        value: firstHalf.join('\n'),
                        inline: true
                    });
                    
                    embed.addFields({
                        name: '📋 Anforderungen (Teil 2)',
                        value: secondHalf.join('\n'),
                        inline: true
                    });
                }
            }
        }

        return embed;
    }

    createGiveawayComponents(giveaway) {
        const row = new ActionRowBuilder();

        if (giveaway.type === 'invite') {
            row.addComponents(
            new ButtonBuilder()
                .setCustomId(`giveaway_join_${giveaway.id}`)
                    .setLabel('📨 Teilnehmen & Invite-Link erhalten')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                    .setCustomId(`giveaway_invite_stats_${giveaway.id}`)
                    .setLabel('📊 Meine Statistiken')
                .setStyle(ButtonStyle.Secondary)
        );
        } else {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`giveaway_join_${giveaway.id}`)
                    .setLabel('🎉 Teilnehmen')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        return [row];
    }

    async handleMemberJoin(member) {
        // Prüfe alle aktiven Invite-Giveaways
        const guild = member.guild;
        const invites = await guild.invites.fetch();
        
        // Finde den verwendeten Invite-Code
        for (const [code, inviteData] of this.inviteCodeTracking) {
            const discordInvite = invites.get(code);
            if (discordInvite && discordInvite.uses > inviteData.uses) {
                // Dieser Invite wurde verwendet
                inviteData.uses = discordInvite.uses;
                
                // Anti-Cheat: Prüfe ob es sich um eine gültige Einladung handelt
                if (await this.isValidInvite(member, inviteData.userId, inviteData.giveawayId)) {
                    // Erhöhe Invite-Counter für den Einlader
                    const giveawayInvites = this.userInvites.get(inviteData.giveawayId) || new Map();
                    const currentCount = giveawayInvites.get(inviteData.userId) || 0;
                    giveawayInvites.set(inviteData.userId, currentCount + 1);
                    this.userInvites.set(inviteData.giveawayId, giveawayInvites);
                    
                    // Tracking wer wen eingeladen hat
                    const giveawayInvitedUsers = this.invitedUsers.get(inviteData.giveawayId) || new Map();
                    const inviterInvitedUsers = giveawayInvitedUsers.get(inviteData.userId) || new Set();
                    inviterInvitedUsers.add(member.user.id);
                    giveawayInvitedUsers.set(inviteData.userId, inviterInvitedUsers);
                    this.invitedUsers.set(inviteData.giveawayId, giveawayInvitedUsers);
                    
                    // Update globales Invite-Tracking
                    const userTracking = this.inviteTracking.get(inviteData.userId) || { 
                        totalInvites: 0, 
                        codes: [], 
                        username: 'Unknown' 
                    };
                    userTracking.totalInvites++;
                    
                    // Username des Einladers aktualisieren falls verfügbar
                    try {
                        const inviterMember = await member.guild.members.fetch(inviteData.userId).catch(() => null);
                        if (inviterMember) {
                            userTracking.username = inviterMember.user.username;
                        }
                    } catch (error) {
                        console.log(`⚠️ Konnte Username für ${inviteData.userId} nicht laden`);
                    }
                    
                    this.inviteTracking.set(inviteData.userId, userTracking);
                    
                    // Tracking für den eingeladenen User hinzufügen
                    const invitedUserTracking = this.inviteTracking.get(member.user.id) || {
                        totalInvites: 0,
                        codes: [],
                        username: member.user.username
                    };
                    invitedUserTracking.username = member.user.username; // Username aktualisieren
                    this.inviteTracking.set(member.user.id, invitedUserTracking);
                    
                    // Update Giveaway-Embed
                    await this.updateGiveawayEmbed(inviteData.giveawayId);
                    
                    // Update Leaderboard falls vorhanden
                    const giveaway = this.giveaways.get(inviteData.giveawayId);
                    if (giveaway && giveaway.leaderboardChannelId) {
                        await this.createOrUpdateLeaderboardChannel(inviteData.giveawayId);
                    }
                    
                    // Save invite tracking to Supabase
                    if (this.isSupabaseEnabled && supabaseAPI.isSupabaseAvailable()) {
                        try {
                            // Update invite tracking
                            await supabaseAPI.updateInviteTracking(inviteData.userId, userTracking);
                            
                            // Add invited user
                            await supabaseAPI.addInvitedUser(
                                inviteData.giveawayId, 
                                inviteData.userId, 
                                member.user.id, 
                                member.user.username
                            );
                            
                            // Update user invites count
                            const currentCount = (this.userInvites.get(inviteData.giveawayId) || new Map()).get(inviteData.userId) || 0;
                            await supabaseAPI.updateUserInvites(inviteData.giveawayId, inviteData.userId, currentCount + 1);
                            
                            console.log('✅ Invite tracking saved to Supabase');
                        } catch (error) {
                            console.error('❌ Error saving invite tracking to Supabase:', error);
                        }
                    }
                    
                    await this.saveData();
                    
                    console.log(`✅ Invite-Tracking: ${member.user.tag} wurde von ${inviteData.userId} eingeladen`);
                } else {
                    console.log(`❌ Anti-Cheat: Einladung von ${member.user.tag} durch ${inviteData.userId} wurde abgelehnt`);
                }
                break;
            }
        }
    }

    async isValidInvite(member, inviterId, giveawayId) {
        // Anti-Cheat Prüfungen
        
        // 1. Selbst-Einladung verhindern
        if (member.user.id === inviterId) {
            console.log(`❌ Anti-Cheat: Selbst-Einladung verhindert (${member.user.tag})`);
            return false;
        }
        
        // 2. Bot-Accounts verhindern
        if (member.user.bot && this.settings.antiCheat.preventBotAccounts) {
            console.log(`❌ Anti-Cheat: Bot-Account verhindert (${member.user.tag})`);
            return false;
        }
        
        // 3. Account-Alter prüfen
        const accountAge = Date.now() - member.user.createdTimestamp;
        if (accountAge < this.settings.antiCheat.minAccountAge) {
            console.log(`❌ Anti-Cheat: Account zu jung (${member.user.tag}, Alter: ${Math.floor(accountAge / (24 * 60 * 60 * 1000))} Tage)`);
            return false;
        }
        
        // 4. Mehrfache Einladungen derselben Person verhindern
        if (this.settings.antiCheat.preventMultipleEntries && giveawayId) {
            const giveawayInvitedUsers = this.invitedUsers.get(giveawayId) || new Map();
            const inviterInvitedUsers = giveawayInvitedUsers.get(inviterId) || new Set();
            
            if (inviterInvitedUsers.has(member.user.id)) {
                console.log(`❌ Anti-Cheat: Mehrfache Einladung verhindert (${member.user.tag} wurde bereits von ${inviterId} eingeladen)`);
                return false;
            }
            
            // Prüfe auch global ob diese Person bereits von diesem User in diesem Giveaway eingeladen wurde
            for (const [otherInviterId, otherInvitedUsers] of giveawayInvitedUsers) {
                if (otherInviterId === inviterId && otherInvitedUsers.has(member.user.id)) {
                    console.log(`❌ Anti-Cheat: Doppelte Einladung verhindert (${member.user.tag} bereits von ${inviterId} eingeladen)`);
                    return false;
                }
            }
        }
        
        // 5. IP-Duplikate Ersatz: Account-Verhalten Analysis
        if (this.settings.antiCheat.preventDuplicateIPs && giveawayId) {
            // Da Discord keine IPs bereitstellt, verwenden wir alternative Methoden:
            
            // 5a. Prüfe auf sehr ähnliche Account-Namen (Alt-Account Detection)
            const suspiciousPattern = this.detectSuspiciousAccounts(member.user, giveawayId);
            if (suspiciousPattern) {
                console.log(`❌ Anti-Cheat: Verdächtiger Account erkannt (${member.user.tag}): ${suspiciousPattern}`);
                return false;
            }
            
            // 5b. Prüfe Join-Timing (verhindert Mass-Join innerhalb kurzer Zeit)
            const recentJoins = await this.checkRecentJoins(member, giveawayId);
            if (recentJoins > 3) { // Mehr als 3 Joins in letzten 5 Minuten
                console.log(`❌ Anti-Cheat: Zu viele neue Joins (${member.user.tag}), verdächtig auf koordinierte Alt-Accounts`);
                return false;
            }
        }
        
        console.log(`✅ Anti-Cheat: Einladung von ${member.user.tag} durch ${inviterId} ist gültig`);
        return true;
    }

    detectSuspiciousAccounts(user, giveawayId) {
        // Hole alle bereits eingeladenen User für dieses Giveaway
        const giveawayInvitedUsers = this.invitedUsers.get(giveawayId) || new Map();
        const allInvitedUsers = new Set();
        
        for (const [inviterId, invitedSet] of giveawayInvitedUsers) {
            for (const userId of invitedSet) {
                allInvitedUsers.add(userId);
            }
        }
        
        // Prüfe auch aktuelle Teilnehmer
        const giveaway = this.giveaways.get(giveawayId);
        if (giveaway) {
            for (const participantId of giveaway.participants) {
                allInvitedUsers.add(participantId);
            }
        }
        
        const username = user.username.toLowerCase();
        const discriminator = user.discriminator;
        
        // Prüfe auf ähnliche Usernamen (Alt-Account Patterns)
        const similarPatterns = [
            // Gleicher Name + Zahlen am Ende
            /^(.+?)[\d]{1,3}$/,
            // Name + Unterstriche + Zahlen
            /^(.+?)_[\d]{1,3}$/,
            // Name + Punkte + Zahlen  
            /^(.+?)\.[\d]{1,3}$/,
            // Sehr kurze Namen (oft Alt-Accounts)
            /^[a-z]{1,3}[\d]+$/
        ];
        
        for (const pattern of similarPatterns) {
            const match = username.match(pattern);
            if (match) {
                const baseName = match[1];
                if (baseName.length >= 2) {
                    // Prüfe ob andere User mit ähnlichem Pattern bereits teilnehmen
                    // (Das ist eine vereinfachte Prüfung - in der Realität würden wir Discord API für User-Details brauchen)
                    if (baseName.includes('test') || baseName.includes('alt') || baseName.includes('fake')) {
                        return `Verdächtiger Benutzername: ${username}`;
                    }
                }
            }
        }
        
        // Prüfe auf Default-Avatar nur wenn es in den Giveaway-Anforderungen explizit gefordert ist
        if (!user.avatar && giveaway && giveaway.requirements?.requiresAvatar) {
            // Nur blockieren wenn Profilbild explizit gefordert ist
            return `Kein Profilbild - Profilbild ist für dieses Giveaway erforderlich`;
        }
        
        // Zusätzliche Anti-Cheat Prüfung für Default-Avatar (nur bei sehr verdächtigen Mustern)
        if (!user.avatar && Math.random() < 0.3) { // Reduziert von 70% auf 30%
            // Nur bei sehr neuen Accounts (weniger als 7 Tage alt)
            const accountAge = Date.now() - user.createdTimestamp;
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            
            if (accountAge < sevenDaysInMs) {
                return `Sehr neuer Account ohne Profilbild - möglicherweise Alt-Account`;
            }
        }
        
        return null; // Kein verdächtiges Verhalten gefunden
    }

    async checkRecentJoins(member, giveawayId) {
        const guild = member.guild;
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        try {
            // Hole kürzlich beigetretene Mitglieder
            const members = await guild.members.fetch({ limit: 100 });
            const recentJoins = members.filter(m => 
                m.joinedTimestamp && 
                m.joinedTimestamp > fiveMinutesAgo &&
                m.user.id !== member.user.id
            );
            
            console.log(`📊 Anti-Cheat: ${recentJoins.size} neue Mitglieder in den letzten 5 Minuten`);
            return recentJoins.size;
            
        } catch (error) {
            console.error('Fehler beim Prüfen der Recent Joins:', error);
            return 0; // Bei Fehler erlauben wir die Teilnahme
        }
    }

    async createPersonalInviteLink(userId, giveawayId) {
        const giveaway = this.giveaways.get(giveawayId);
        if (!giveaway || giveaway.status !== 'active') {
            throw new Error('Giveaway nicht gefunden oder nicht aktiv');
        }

        const guild = this.client.guilds.cache.first();
        if (!guild) {
            throw new Error('Server nicht gefunden');
        }

        // Prüfe bereits existierende Links für diesen User
        const userTracking = this.inviteTracking.get(userId) || { totalInvites: 0, codes: [], username: 'Unknown' };
        const existingCodes = userTracking.codes.filter(code => {
            const tracking = this.inviteCodeTracking.get(code);
            return tracking && tracking.giveawayId === giveawayId;
        });

        const maxLinks = giveaway.requirements?.maxInviteLinks || 3;
        if (existingCodes.length >= maxLinks) {
            throw new Error(`Du hast bereits das Maximum von ${maxLinks} Invite-Links für dieses Giveaway`);
        }

        try {
            // Erstelle neuen Invite-Link
            const channel = guild.channels.cache.get(giveaway.channelId);
            if (!channel) {
                throw new Error('Giveaway-Channel nicht gefunden');
            }

            // Berechne maxAge in Sekunden und begrenze auf Discord-Maximum
            const maxAgeMs = giveaway.endTime - Date.now();
            const maxAgeSeconds = Math.floor(maxAgeMs / 1000);
            const DISCORD_MAX_AGE = 604800; // 7 Tage in Sekunden
            const finalMaxAge = Math.min(maxAgeSeconds, DISCORD_MAX_AGE);

            const invite = await channel.createInvite({
                maxAge: finalMaxAge > 0 ? finalMaxAge : 3600, // Mindestens 1 Stunde
                maxUses: 100,
                unique: true,
                reason: `Invite Giveaway: ${giveaway.title}`
            });

            // Tracking hinzufügen
            this.inviteCodeTracking.set(invite.code, {
                userId,
                giveawayId,
                uses: 0
            });

            // User-Tracking aktualisieren
            userTracking.codes.push(invite.code);
            this.inviteTracking.set(userId, userTracking);

            // Save to Supabase
            if (this.isSupabaseEnabled && supabaseAPI.isSupabaseAvailable()) {
                try {
                    await supabaseAPI.createInviteCode({
                        code: invite.code,
                        userId: userId,
                        giveawayId: giveawayId,
                        uses: 0,
                        maxUses: 100,
                        expiresAt: giveaway.endTime
                    });
                    
                    await supabaseAPI.updateInviteTracking(userId, userTracking);
                    console.log('✅ Invite code saved to Supabase');
                } catch (error) {
                    console.error('❌ Error saving invite code to Supabase:', error);
                }
            }

            await this.saveData();

            return invite;

        } catch (error) {
            console.error('❌ Fehler beim Erstellen des Invite-Links:', error);
            throw new Error('Fehler beim Erstellen des Invite-Links');
        }
    }

    getInviteLeaderboard(giveawayId) {
        const giveawayInvites = this.userInvites.get(giveawayId);
        if (!giveawayInvites) return [];

        return Array.from(giveawayInvites.entries())
            .map(([userId, invites]) => ({ userId, invites }))
            .sort((a, b) => b.invites - a.invites);
    }

    async updateGiveawayEmbed(giveawayId) {
        const giveaway = this.giveaways.get(giveawayId);
        if (!giveaway || !giveaway.messageId) return;

        try {
            const guild = this.client.guilds.cache.first();
            const channel = guild.channels.cache.get(giveaway.channelId);
            const message = await channel.messages.fetch(giveaway.messageId);

            const embed = this.createGiveawayEmbed(giveaway);
            await message.edit({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren des Giveaway-Embeds:', error);
        }
    }

    async checkExpiredGiveaways() {
            const now = Date.now();
            
        for (const giveaway of this.giveaways.values()) {
                if (giveaway.status === 'active' && giveaway.endTime <= now) {
                    await this.endGiveaway(giveaway);
                }
            }
    }

    async endGiveaway(giveaway) {
        try {
            giveaway.status = 'ended';
            
            let winners = [];
            
            if (giveaway.type === 'invite') {
                // Gewinner basierend auf Invite-Count ermitteln
                const leaderboard = this.getInviteLeaderboard(giveaway.id);
                
                if (leaderboard.length > 0) {
                    // Prüfe Mindest-Einladungen
                    const eligibleUsers = leaderboard.filter(entry => 
                        entry.invites >= (giveaway.requirements?.minInvites || 0)
                    );
                    
                    if (eligibleUsers.length > 0) {
                        // Nehme die Top-Performer
                        const topInviteCount = eligibleUsers[0].invites;
                        const topPerformers = eligibleUsers.filter(entry => entry.invites === topInviteCount);
                        
                        // Bei Gleichstand: Zufällige Auswahl
                        const shuffled = topPerformers.sort(() => 0.5 - Math.random());
                        winners = shuffled.slice(0, giveaway.winners).map(entry => entry.userId);
                    }
                }
            } else {
                // Normale Giveaway-Logik
                const participants = Array.from(giveaway.participants);
                if (participants.length > 0) {
                    const shuffled = participants.sort(() => 0.5 - Math.random());
                    winners = shuffled.slice(0, giveaway.winners);
                }
            }

            // Gewinner-IDs im Giveaway speichern
            giveaway.winnerIds = winners;
            giveaway.endedAt = Date.now();
            
            // Guild und Channel holen
            const guild = this.client.guilds.cache.first();
            const channel = guild.channels.cache.get(giveaway.channelId);
            
            // Original-Giveaway-Message löschen
            if (channel && giveaway.messageId) {
                try {
                    const message = await channel.messages.fetch(giveaway.messageId);
                    await message.delete();
                    console.log('✅ Original-Giveaway-Message gelöscht');
                } catch (error) {
                    console.error('❌ Fehler beim Löschen der Original-Giveaway-Message:', error);
                }
            }

            // Gewinner-Announcement senden (bleibt permanent)
            if (winners.length > 0) {
                const embed = this.createWinnerEmbed(giveaway, winners);
                const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
                
                await channel.send({
                    content: `🎉 **Gewinner des Giveaways "${giveaway.title}":**\n${winnerMentions}\n\nGlückwunsch! 🎊`,
                    embeds: [embed]
                });
                
                // DMs an Gewinner senden
                await this.sendWinnerDMs(giveaway, winners);
            } else {
                const embed = this.createWinnerEmbed(giveaway, winners);
                await channel.send({
                    content: `😔 **Giveaway "${giveaway.title}" beendet**\n\nLeider gab es keine gültigen Teilnehmer.`,
                    embeds: [embed]
                });
            }

            // Leaderboard-Channel löschen falls vorhanden
            if (giveaway.leaderboardChannelId) {
                await this.deleteLeaderboardChannel(giveaway.id);
            }

            // Auto-Leaderboard-Channel löschen falls vorhanden
            if (giveaway.autoLeaderboardChannelId) {
                await this.deleteAutoLeaderboardChannel(giveaway.id);
            }

            // Update in Supabase
            if (this.isSupabaseEnabled && supabaseAPI.isSupabaseAvailable()) {
                try {
                    await supabaseAPI.updateGiveaway(giveaway.id, {
                        status: giveaway.status,
                        winnerList: winners,
                        endedAt: giveaway.endedAt
                    });
                    console.log('✅ Giveaway status updated in Supabase');
                } catch (error) {
                    console.error('❌ Error updating giveaway in Supabase:', error);
                }
            }

            await this.saveData();
            console.log(`✅ Giveaway beendet: ${giveaway.title} (${winners.length} Gewinner)`);
            
            return { winners, giveaway };
            
        } catch (error) {
            console.error('❌ Fehler beim Beenden des Giveaways:', error);
            throw error;
        }
    }

    async sendWinnerDMs(giveaway, winners) {
        const guild = this.client.guilds.cache.first();
        if (!guild) return;

        for (let i = 0; i < winners.length; i++) {
            const winnerId = winners[i];
            
            try {
                // User vom Guild holen
                const member = await guild.members.fetch(winnerId).catch(() => null);
                if (!member) {
                    console.log(`⚠️ Gewinner ${winnerId} nicht im Server gefunden`);
                    continue;
                }

                // DM erstellen
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🎉 Herzlichen Glückwunsch!')
                    .setDescription(`Du hast das Giveaway **"${giveaway.title}"** gewonnen!`)
                    .setColor(parseInt(this.settings.winnerDmColor?.replace('0x', '') || 'FFD700', 16))
                    .addFields(
                        {
                            name: '🎁 Gewinn',
                            value: giveaway.prize,
                            inline: true
                        },
                        {
                            name: '🏆 Platz',
                            value: `${i + 1}${i === 0 ? '. Platz 🥇' : i === 1 ? '. Platz 🥈' : i === 2 ? '. Platz 🥉' : '. Platz'}`,
                            inline: true
                        },
                        {
                            name: '📅 Gewonnen am',
                            value: new Date().toLocaleDateString('de-DE', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            inline: false
                        },
                        {
                            name: '🎫 Preis erhalten',
                            value: '**Wichtig:** Öffne ein Ticket im Server, um deinen Preis zu erhalten!\n\n' +
                                   '📋 **So geht\'s:**\n' +
                                   '1. Gehe zum Ticket-Channel im Server\n' +
                                   '2. Klicke auf **"🎉 Giveaway Gewonnen"** Button\n' +
                                   '3. Teile diesen Screenshot/diese Nachricht mit\n' +
                                   '4. Unser Team wird dir deinen Preis geben\n\n' +
                                   '⏰ **Wichtig:** Melde dich innerhalb von 7 Tagen, sonst verfällt dein Gewinn!',
                            inline: false
                        }
                    )
                    .setFooter({ 
                        text: `Server: ${guild.name} • Öffne ein Ticket für deinen Preis!`,
                        iconURL: guild.iconURL() || undefined
                    })
                    .setTimestamp();

                // DM senden
                await member.send({ embeds: [dmEmbed] });
                console.log(`✅ DM an Gewinner ${member.user.tag} gesendet`);

                // Kleine Pause zwischen DMs um Rate-Limits zu vermeiden
                if (i < winners.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (error) {
                console.error(`❌ Fehler beim Senden der DM an Gewinner ${winnerId}:`, error.message);
                
                // Fallback: Nachricht im Channel wenn DM fehlschlägt
                try {
                    const channel = guild.channels.cache.get(giveaway.channelId);
                    if (channel && member) {
                        await channel.send(
                            `📨 <@${winnerId}>, ich konnte dir keine private Nachricht senden! Du hast das Giveaway **"${giveaway.title}"** gewonnen! 🎉\n\n` +
                            `**🎁 Preis:** ${giveaway.prize}\n` +
                            `**🏆 Platz:** ${i + 1}${i === 0 ? '. Platz 🥇' : i === 1 ? '. Platz 🥈' : i === 2 ? '. Platz 🥉' : '. Platz'}\n\n` +
                            `**🎫 Wichtig:** Öffne ein Ticket mit dem **"🎉 Giveaway Gewonnen"** Button, um deinen Preis zu erhalten!\n` +
                            `⏰ Melde dich innerhalb von 7 Tagen, sonst verfällt dein Gewinn!`
                        );
                    }
                } catch (fallbackError) {
                    console.error(`❌ Auch Fallback-Nachricht fehlgeschlagen für ${winnerId}:`, fallbackError.message);
                }
            }
        }
    }

    createWinnerEmbed(giveaway, winners) {
        const embed = new EmbedBuilder()
            .setTitle(`🎊 Giveaway Beendet!`)
            .setDescription(`**${giveaway.title}**`)
            .setColor(parseInt(this.settings.endedEmbedColor?.replace('0x', '') || 'FFD700', 16))
            .setTimestamp();

        if (winners.length > 0) {
            const winnerList = winners.map(id => `<@${id}>`).join('\n');
            embed.addFields({
                name: `🏆 Gewinner (${winners.length})`,
                value: winnerList,
                inline: false
            });
        } else {
            embed.addFields({
                name: '😔 Keine Gewinner',
                value: 'Es gab keine gültigen Teilnehmer.',
                inline: false
            });
        }

        embed.addFields({
            name: '🎁 Preis',
            value: giveaway.prize,
            inline: true
        });

        embed.addFields({
            name: '👥 Teilnehmer',
            value: giveaway.participants.size.toString(),
            inline: true
        });

        if (giveaway.type === 'invite') {
            const leaderboard = this.getInviteLeaderboard(giveaway.id);
            if (leaderboard.length > 0) {
                const topInviter = leaderboard[0];
                embed.addFields({
                    name: '📨 Top Einlader',
                    value: `<@${topInviter.userId}> mit **${topInviter.invites}** Einladungen`,
                    inline: false
                });
            }
        }

        return embed;
    }

    getStats() {
        const giveaways = Array.from(this.giveaways.values());
        const active = giveaways.filter(g => g.status === 'active');
        const ended = giveaways.filter(g => g.status === 'ended');
        
        const totalParticipants = giveaways.reduce((sum, g) => sum + g.participants.size, 0);
        const totalInvites = Array.from(this.inviteTracking.values())
            .reduce((sum, user) => sum + user.totalInvites, 0);

        return {
            totalGiveaways: giveaways.length,
            activeGiveaways: active.length,
            endedGiveaways: ended.length,
            totalParticipants,
            totalInvites,
            averageParticipants: giveaways.length > 0 ? Math.round(totalParticipants / giveaways.length) : 0
        };
    }

    removeUserFromAllGiveaways(userId) {
        for (const giveaway of this.giveaways.values()) {
            if (giveaway.participants.has(userId)) {
            giveaway.participants.delete(userId);
            }
        }
        this.saveData();
    }

    async createOrUpdateLeaderboardChannel(giveawayId) {
        const giveaway = this.giveaways.get(giveawayId);
        if (!giveaway) {
            throw new Error('Giveaway nicht gefunden');
        }

        if (giveaway.type !== 'invite') {
            throw new Error('Leaderboard-Channels sind nur für Invite-Giveaways verfügbar');
        }

        const guild = this.client.guilds.cache.first();
        if (!guild) {
            throw new Error('Server nicht gefunden');
        }

        // Channel-Name generieren (nicht mehr "test")
        const cleanTitle = giveaway.title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Nur Buchstaben, Zahlen und Spaces
            .replace(/\s+/g, '-') // Spaces zu Bindestrichen
            .substring(0, 30); // Max 30 Zeichen
        const channelName = `🏆-${cleanTitle}-leaderboard`;
        
        let channel;
        let isNew = false;

        // Prüfe ob bereits ein Leaderboard-Channel existiert
        if (giveaway.leaderboardChannelId) {
            channel = guild.channels.cache.get(giveaway.leaderboardChannelId);
        }

        // Erstelle neuen Channel falls keiner existiert
        if (!channel) {
            try {
                // Finde Giveaway-Kategorie oder erstelle Channel in derselben Kategorie wie das Haupt-Giveaway
                const giveawayChannel = guild.channels.cache.get(giveaway.channelId);
                const categoryId = giveawayChannel?.parent?.id;

                channel = await guild.channels.create({
                    name: channelName,
                    type: 0, // TEXT_CHANNEL
                    parent: categoryId,
                    topic: `🏆 Leaderboard für: ${giveaway.title} | Automatisch aktualisiert`,
                    reason: `Leaderboard-Channel für Invite-Giveaway: ${giveaway.title}`
                });

                // Channel-ID im Giveaway speichern
                giveaway.leaderboardChannelId = channel.id;
                isNew = true;

                console.log(`✅ Leaderboard-Channel erstellt: ${channel.name}`);
            } catch (error) {
                console.error('❌ Fehler beim Erstellen des Leaderboard-Channels:', error);
                throw new Error('Leaderboard-Channel konnte nicht erstellt werden');
            }
        }

        // Leaderboard-Embed erstellen und senden/aktualisieren
        const leaderboardEmbed = this.createLeaderboardEmbed(giveaway);
        
        let message;
        
        // Prüfe ob bereits eine Leaderboard-Nachricht existiert
        if (giveaway.leaderboardMessageId) {
            try {
                message = await channel.messages.fetch(giveaway.leaderboardMessageId);
                await message.edit({ embeds: [leaderboardEmbed] });
                console.log(`🔄 Leaderboard aktualisiert: ${channel.name}`);
            } catch (error) {
                // Nachricht existiert nicht mehr, erstelle neue
                message = null;
            }
        }

        // Erstelle neue Nachricht falls keine existiert
        if (!message) {
            try {
                // Lösche alte Nachrichten im Channel (optional)
                const messages = await channel.messages.fetch({ limit: 10 });
                if (messages.size > 0 && isNew) {
                    await channel.bulkDelete(messages).catch(() => {});
                }

                message = await channel.send({ 
                    embeds: [leaderboardEmbed],
                    content: `🏆 **Live-Leaderboard für: ${giveaway.title}**\n\n*Wird automatisch alle 30 Sekunden aktualisiert*`
                });
                
                giveaway.leaderboardMessageId = message.id;
                console.log(`📊 Neue Leaderboard-Nachricht erstellt: ${channel.name}`);
            } catch (error) {
                console.error('❌ Fehler beim Senden der Leaderboard-Nachricht:', error);
                throw new Error('Leaderboard-Nachricht konnte nicht erstellt werden');
            }
        }

        this.saveData();

        return {
            channelId: channel.id,
            channelName: channel.name,
            messageId: message.id,
            isNew
        };
    }

    createLeaderboardEmbed(giveaway) {
        const leaderboard = this.getInviteLeaderboard(giveaway.id);
        const giveawayInvitedUsers = this.invitedUsers.get(giveaway.id) || new Map();
        
        const embed = new EmbedBuilder()
            .setTitle(`🏆 Invite-Leaderboard`)
            .setDescription(`**${giveaway.title}**\n\n*Wer hat die meisten gültigen Einladungen?*`)
            .setColor(parseInt(this.settings.embedColor.replace('0x', ''), 16) || 0x00FF7F)
            .setTimestamp()
            .setFooter({ 
                text: `Status: ${giveaway.status === 'active' ? '🟢 Aktiv' : '🔴 Beendet'} | Endet: ${new Date(giveaway.endTime).toLocaleString('de-DE')}` 
            });

        // Anforderungen anzeigen
        if (giveaway.requirements?.minInvites > 0) {
            embed.addFields({
                name: '📋 Mindest-Einladungen zum Gewinnen',
                value: `**${giveaway.requirements.minInvites}** gültige Einladungen erforderlich`,
                inline: false
            });
        }

        // Leaderboard anzeigen
        if (leaderboard.length > 0) {
            const leaderboardText = leaderboard.slice(0, 15).map((entry, index) => {
                const position = index + 1;
                const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
                
                const invitedUsers = giveawayInvitedUsers.get(entry.userId) || new Set();
                const userTracking = this.inviteTracking.get(entry.userId) || {};
                const username = userTracking.username || 'Unknown';
                
                const eligibilityIcon = (giveaway.requirements?.minInvites || 0) <= entry.invites ? '✅' : '❌';
                
                return `${medal} **${username}** ${eligibilityIcon}\n` +
                       `└ **${entry.invites}** Einladungen | **${invitedUsers.size}** eingeladene User`;
            }).join('\n\n');

            embed.addFields({
                name: `👥 Teilnehmer (${leaderboard.length})`,
                value: leaderboardText || 'Noch keine Einladungen',
                inline: false
            });
        } else {
            embed.addFields({
                name: '👥 Teilnehmer',
                value: 'Noch keine Einladungen vorhanden.\nSei der Erste und lade Freunde ein!',
                inline: false
            });
        }

        // Giveaway-Informationen
        embed.addFields([
            {
                name: '🎁 Preis',
                value: giveaway.prize,
                inline: true
            },
            {
                name: '🏅 Gewinner',
                value: giveaway.winners.toString(),
                inline: true
            },
            {
                name: '📊 Gesamt-Teilnehmer',
                value: giveaway.participants.size.toString(),
                inline: true
            }
        ]);

        // Aktive Invite-Links
        const totalActiveCodes = Array.from(this.inviteCodeTracking.values())
            .filter(data => data.giveawayId === giveaway.id).length;
        
        const totalInvitedUsers = Array.from(giveawayInvitedUsers.values())
            .reduce((total, userSet) => total + userSet.size, 0);

        embed.addFields({
            name: '📈 Statistiken',
            value: `**Aktive Invite-Links:** ${totalActiveCodes}\n` +
                   `**Eingeladene User:** ${totalInvitedUsers}\n` +
                   `**Durchschn. Einladungen:** ${leaderboard.length > 0 ? (totalInvitedUsers / leaderboard.length).toFixed(1) : '0'}`,
            inline: false
        });

        return embed;
    }

    async deleteLeaderboardChannel(giveawayId) {
        const giveaway = this.giveaways.get(giveawayId);
        if (!giveaway || !giveaway.leaderboardChannelId) {
            return;
        }

        const guild = this.client.guilds.cache.first();
        if (!guild) {
            console.log('❌ Kein Server gefunden zum Löschen des Leaderboard-Channels');
            return;
        }

        try {
            const channel = guild.channels.cache.get(giveaway.leaderboardChannelId);
            if (channel) {
                await channel.delete('Giveaway beendet - Leaderboard nicht mehr benötigt');
                console.log(`✅ Leaderboard-Channel "${channel.name}" gelöscht (Giveaway: ${giveaway.title})`);
                
                // Channel-ID aus Giveaway entfernen
                delete giveaway.leaderboardChannelId;
                delete giveaway.leaderboardMessageId;
                this.saveData();
            } else {
                console.log(`⚠️ Leaderboard-Channel ${giveaway.leaderboardChannelId} nicht gefunden (bereits gelöscht?)`);
                // Channel-ID trotzdem entfernen da Channel nicht existiert
                delete giveaway.leaderboardChannelId;
                delete giveaway.leaderboardMessageId;
                this.saveData();
            }
        } catch (error) {
            console.error(`❌ Fehler beim Löschen des Leaderboard-Channels:`, error);
            
            // Bei Fehlern trotzdem die IDs entfernen
            delete giveaway.leaderboardChannelId;
            delete giveaway.leaderboardMessageId;
            this.saveData();
        }
    }

    async deleteAutoLeaderboardChannel(giveawayId) {
        const giveaway = this.giveaways.get(giveawayId);
        if (!giveaway || !giveaway.autoLeaderboardChannelId) {
            return;
        }

        const guild = this.client.guilds.cache.first();
        if (!guild) {
            console.log('❌ Kein Server gefunden zum Löschen des Auto-Leaderboard-Channels');
            return;
        }

        try {
            const channel = guild.channels.cache.get(giveaway.autoLeaderboardChannelId);
            if (channel) {
                await channel.delete('Giveaway beendet - Auto-Leaderboard nicht mehr benötigt');
                console.log(`✅ Auto-Leaderboard-Channel "${channel.name}" gelöscht (Giveaway: ${giveaway.title})`);
                
                // Channel-IDs aus Giveaway entfernen
                delete giveaway.autoLeaderboardChannelId;
                delete giveaway.autoLeaderboardMessageId;
                this.saveData();
            } else {
                console.log(`⚠️ Auto-Leaderboard-Channel ${giveaway.autoLeaderboardChannelId} nicht gefunden (bereits gelöscht?)`);
                // Channel-IDs trotzdem entfernen da Channel nicht existiert
                delete giveaway.autoLeaderboardChannelId;
                delete giveaway.autoLeaderboardMessageId;
                this.saveData();
            }
        } catch (error) {
            console.error(`❌ Fehler beim Löschen des Auto-Leaderboard-Channels:`, error);
            
            // Bei Fehlern trotzdem die IDs entfernen
            delete giveaway.autoLeaderboardChannelId;
            delete giveaway.autoLeaderboardMessageId;
            this.saveData();
        }
    }

    async updateAllLeaderboards() {
        // Aktualisiere alle aktiven Invite-Giveaway Leaderboards (normale)
        const activeInviteGiveaways = Array.from(this.giveaways.values())
            .filter(g => g.status === 'active' && g.type === 'invite' && g.leaderboardChannelId);

        for (const giveaway of activeInviteGiveaways) {
            try {
                await this.createOrUpdateLeaderboardChannel(giveaway.id);
            } catch (error) {
                console.error(`❌ Fehler beim Aktualisieren des Leaderboards für ${giveaway.title}:`, error);
            }
        }

        // Aktualisiere alle Auto-Leaderboard-Channels
        const autoLeaderboardGiveaways = Array.from(this.giveaways.values())
            .filter(g => g.status === 'active' && g.type === 'invite' && g.autoLeaderboardChannelId);

        for (const giveaway of autoLeaderboardGiveaways) {
            try {
                await this.updateAutoLeaderboardChannel(giveaway.id);
            } catch (error) {
                console.error(`❌ Fehler beim Aktualisieren des Auto-Leaderboards für ${giveaway.title}:`, error);
            }
        }
    }

    async updateAutoLeaderboardChannel(giveawayId) {
        const giveaway = this.giveaways.get(giveawayId);
        if (!giveaway || !giveaway.autoLeaderboardChannelId) {
            return;
        }

        const guild = this.client.guilds.cache.first();
        if (!guild) {
            return;
        }

        try {
            const channel = guild.channels.cache.get(giveaway.autoLeaderboardChannelId);
            if (!channel) {
                console.log(`⚠️ Auto-Leaderboard-Channel nicht gefunden: ${giveaway.autoLeaderboardChannelId}`);
                // Channel existiert nicht mehr, entferne ID
                delete giveaway.autoLeaderboardChannelId;
                delete giveaway.autoLeaderboardMessageId;
                this.saveData();
                return;
            }

            // Channel-Topic immer aktualisieren (auch ohne Teilnehmer)
            const expectedTopic = `📅 Automatisches Leaderboard für: ${giveaway.title} | Updates alle ${this.settings.leaderboard?.updateInterval || 30}s`;
            if (channel.topic !== expectedTopic) {
                try {
                    await channel.setTopic(expectedTopic);
                    console.log(`🔄 Channel-Topic aktualisiert: ${channel.name}`);
                } catch (error) {
                    console.error(`⚠️ Fehler beim Aktualisieren des Channel-Topics:`, error);
                }
            }

            const leaderboard = this.getInviteLeaderboard(giveaway.id);
            if (leaderboard.length === 0) {
                console.log(`ℹ️ Keine Teilnehmer für ${giveaway.title} - überspringe Nachrichten-Update (Spam-Schutz)`);
                return; // Keine Nachrichten-Updates wenn keine Teilnehmer (Spam-Schutz)
            }

            // Lösche alte Nachricht falls vorhanden
            if (giveaway.autoLeaderboardMessageId) {
                try {
                    const oldMessage = await channel.messages.fetch(giveaway.autoLeaderboardMessageId);
                    if (oldMessage) {
                        await oldMessage.delete();
                    }
                } catch (error) {
                    // Ignoriere Fehler beim Löschen
                }
            }

            // Erstelle neue Nachricht
            const embed = this.createLeaderboardEmbed(giveaway);
            const message = await channel.send({
                content: `📅 **Auto-Leaderboard** (${new Date().toLocaleString('de-DE')}) | Updates alle ${this.settings.leaderboard?.updateInterval || 30}s`,
                embeds: [embed]
            });

            giveaway.autoLeaderboardMessageId = message.id;
            this.saveData();

        } catch (error) {
            console.error(`❌ Fehler beim Aktualisieren des Auto-Leaderboard-Channels für ${giveaway.title}:`, error);
        }
    }

    async updateAllAutoLeaderboardChannelsWithNewInterval() {
        // Finde alle aktiven Auto-Leaderboard-Channels
        const autoLeaderboardGiveaways = Array.from(this.giveaways.values())
            .filter(g => g.status === 'active' && g.type === 'invite' && g.autoLeaderboardChannelId);

        console.log(`🔄 Aktualisiere ${autoLeaderboardGiveaways.length} Auto-Leaderboard-Channel(s) mit neuem Intervall: ${this.settings.leaderboard?.updateInterval || 30}s`);

        for (const giveaway of autoLeaderboardGiveaways) {
            try {
                await this.forceUpdateAutoLeaderboardChannel(giveaway.id);
                // Kurze Pause zwischen Updates
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`❌ Fehler beim Aktualisieren des Auto-Leaderboards für ${giveaway.title}:`, error);
            }
        }
    }

    async forceUpdateAutoLeaderboardChannel(giveawayId) {
        // Wie updateAutoLeaderboardChannel, aber postet auch bei 0 Teilnehmern eine Nachricht
        const giveaway = this.giveaways.get(giveawayId);
        if (!giveaway || !giveaway.autoLeaderboardChannelId) {
            return;
        }

        const guild = this.client.guilds.cache.first();
        if (!guild) {
            return;
        }

        try {
            const channel = guild.channels.cache.get(giveaway.autoLeaderboardChannelId);
            if (!channel) {
                console.log(`⚠️ Auto-Leaderboard-Channel nicht gefunden: ${giveaway.autoLeaderboardChannelId}`);
                // Channel existiert nicht mehr, entferne ID
                delete giveaway.autoLeaderboardChannelId;
                delete giveaway.autoLeaderboardMessageId;
                this.saveData();
                return;
            }

            // Channel-Topic immer aktualisieren
            const expectedTopic = `📅 Automatisches Leaderboard für: ${giveaway.title} | Updates alle ${this.settings.leaderboard?.updateInterval || 30}s`;
            if (channel.topic !== expectedTopic) {
                try {
                    await channel.setTopic(expectedTopic);
                    console.log(`🔄 Channel-Topic aktualisiert: ${channel.name}`);
                } catch (error) {
                    console.error(`⚠️ Fehler beim Aktualisieren des Channel-Topics:`, error);
                }
            }

            // Lösche alte Nachricht falls vorhanden
            if (giveaway.autoLeaderboardMessageId) {
                try {
                    const oldMessage = await channel.messages.fetch(giveaway.autoLeaderboardMessageId);
                    if (oldMessage) {
                        await oldMessage.delete();
                    }
                } catch (error) {
                    // Ignoriere Fehler beim Löschen
                }
            }

            // Erstelle IMMER eine neue Nachricht (auch bei 0 Teilnehmern bei Intervall-Änderung)
            const embed = this.createLeaderboardEmbed(giveaway);
            const message = await channel.send({
                content: `📅 **Auto-Leaderboard** (${new Date().toLocaleString('de-DE')}) | Updates alle ${this.settings.leaderboard?.updateInterval || 30}s`,
                embeds: [embed]
            });

            giveaway.autoLeaderboardMessageId = message.id;
            this.saveData();

            console.log(`✅ Auto-Leaderboard-Channel forciert aktualisiert: ${channel.name} (auch bei 0 Teilnehmern)`);

        } catch (error) {
            console.error(`❌ Fehler beim Force-Update des Auto-Leaderboard-Channels für ${giveaway.title}:`, error);
        }
    }

    // Auto-Posting System für Leaderboards
    async checkAutoLeaderboardPost() {
        if (!this.settings.leaderboard?.autoPost?.enabled) return;

        const autoPost = this.settings.leaderboard.autoPost;
        
        // Prüfe ob es Zeit für einen Post ist
        const now = new Date();
        const timeStr = autoPost.time || '20:00';
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        // Prüfe ob das letzte Posting heute war
        const lastPosted = autoPost.lastPosted || 0;
        const lastPostedDate = new Date(lastPosted);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const isToday = lastPostedDate >= today;
        const isTimeForPost = now.getHours() === hours && now.getMinutes() === minutes;
        
        if (isTimeForPost && !isToday) {
            await this.postAutoLeaderboard();
        }
    }

    async postAutoLeaderboard() {
        try {
            const autoPost = this.settings.leaderboard.autoPost;
            
            // Finde alle aktiven Invite-Giveaways
            const activeInviteGiveaways = Array.from(this.giveaways.values())
                .filter(g => g.status === 'active' && g.type === 'invite');

            if (activeInviteGiveaways.length === 0) {
                console.log('⏰ Auto-Leaderboard: Keine aktiven Invite-Giveaways gefunden');
                return;
            }

            const guild = this.client.guilds.cache.first();
            if (!guild) {
                console.error('❌ Auto-Leaderboard: Server nicht gefunden');
                return;
            }

            let postedCount = 0;
            const createdChannels = [];

            // Erstelle für jedes aktive Invite-Giveaway einen eigenen Auto-Leaderboard-Channel
            for (const giveaway of activeInviteGiveaways) {
                try {
                    const leaderboard = this.getInviteLeaderboard(giveaway.id);
                    
                    if (leaderboard.length === 0) {
                        continue; // Überspringe Giveaways ohne Teilnehmer
                    }

                    // Erstelle eigenen Channel für Auto-Leaderboard (falls noch nicht vorhanden)
                    if (!giveaway.autoLeaderboardChannelId) {
                        // Finde die konfigurierte Kategorie
                        const categoryName = this.settings.leaderboard?.autoPost?.categoryName || 'giveaway';
                        const giveawayCategory = guild.channels.cache.find(c => 
                            c.type === 4 && c.name.toLowerCase() === categoryName.toLowerCase()
                        );
                        
                        const channelName = 'leaderboard';
                        
                        const channel = await guild.channels.create({
                            name: channelName,
                            type: 0, // Text Channel
                            topic: `📅 Automatisches Leaderboard für: ${giveaway.title} | Updates alle ${this.settings.leaderboard?.updateInterval || 30}s`,
                            parent: giveawayCategory?.id || null // Unter konfigurierter Kategorie oder ohne
                        });

                        giveaway.autoLeaderboardChannelId = channel.id;
                        createdChannels.push(channelName);
                        console.log(`✅ Auto-Leaderboard-Channel erstellt: ${channelName} in Kategorie: ${giveawayCategory?.name || `'${categoryName}' nicht gefunden`}`);
                    }

                    // Poste/Update Leaderboard im Auto-Channel
                    const channel = guild.channels.cache.get(giveaway.autoLeaderboardChannelId);
                    if (!channel) {
                        console.error(`❌ Auto-Leaderboard-Channel nicht gefunden: ${giveaway.autoLeaderboardChannelId}`);
                        continue;
                    }

                    // Lösche alte Nachricht falls vorhanden
                    if (giveaway.autoLeaderboardMessageId) {
                        try {
                            const oldMessage = await channel.messages.fetch(giveaway.autoLeaderboardMessageId);
                            if (oldMessage) {
                                await oldMessage.delete();
                            }
                        } catch (error) {
                            // Ignoriere Fehler beim Löschen
                        }
                    }

                    const embed = this.createLeaderboardEmbed(giveaway);
                    
                    const message = await channel.send({
                        content: `📅 **Auto-Leaderboard** (${new Date().toLocaleString('de-DE')}) | Updates alle ${this.settings.leaderboard?.updateInterval || 30}s`,
                        embeds: [embed]
                    });

                    giveaway.autoLeaderboardMessageId = message.id;
                    postedCount++;

                    // Kurze Pause zwischen Posts
                    if (postedCount < activeInviteGiveaways.length) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }

                } catch (error) {
                    console.error(`❌ Fehler beim Auto-Posting des Leaderboards für ${giveaway.title}:`, error);
                }
            }

            // Aktualisiere Einstellungen und speichere
            this.settings.leaderboard.autoPost.lastPosted = Date.now();
            this.saveSettings();
            this.saveData();

            console.log(`✅ Auto-Leaderboard: ${postedCount} Channel(s) aktualisiert${createdChannels.length > 0 ? `, ${createdChannels.length} neue erstellt` : ''}`);

        } catch (error) {
            console.error('❌ Fehler beim Auto-Posting der Leaderboards:', error);
        }
    }

    generateAutoLeaderboardChannelName(title) {
        // Erstelle Channel-Namen für Auto-Leaderboards
        const cleanTitle = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Entferne Sonderzeichen
            .replace(/\s+/g, '-') // Ersetze Leerzeichen mit Bindestrichen
            .substring(0, 20); // Kürze auf 20 Zeichen
        
        return `📅-auto-${cleanTitle}-leaderboard`;
    }



    async debugUser(userId) {
        console.log(`🔍 Debug für User ${userId}:`);
        const guild = this.client.guilds.cache.first();
        
        if (!guild) {
            console.log('❌ Kein Server gefunden');
            return;
        }

        try {
            // 1. Prüfe Invite-Tracking
            const tracking = this.inviteTracking.get(userId);
            console.log(`📊 Invite-Tracking:`, tracking);

            // 2. Prüfe Guild Member
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member) {
                console.log(`👤 Guild Member gefunden: ${member.user.username}#${member.user.discriminator}`);
                console.log(`   - ID: ${member.user.id}`);
                console.log(`   - Bot: ${member.user.bot}`);
                console.log(`   - Join Date: ${member.joinedAt}`);
            } else {
                console.log(`❌ User nicht als Guild Member gefunden`);
            }

            // 3. Prüfe Discord Client
            const user = await this.client.users.fetch(userId).catch(() => null);
            if (user) {
                console.log(`🌐 Discord User gefunden: ${user.username}#${user.discriminator}`);
                console.log(`   - ID: ${user.id}`);
                console.log(`   - Bot: ${user.bot}`);
                console.log(`   - Created: ${user.createdAt}`);
            } else {
                console.log(`❌ User nicht über Discord Client gefunden`);
            }

            // 4. Prüfe Giveaway-Teilnahmen
            for (const [giveawayId, giveaway] of this.giveaways) {
                if (giveaway.participants.has(userId)) {
                    console.log(`🎁 Teilnehmer in Giveaway: ${giveaway.title} (${giveawayId})`);
                }
            }

            // 5. Prüfe eingeladene User
            for (const [giveawayId, giveawayInvitedUsers] of this.invitedUsers) {
                for (const [inviterId, invitedSet] of giveawayInvitedUsers) {
                    if (invitedSet.has(userId)) {
                        console.log(`📨 Wurde eingeladen von ${inviterId} in Giveaway ${giveawayId}`);
                    }
                }
            }

        } catch (error) {
            console.log(`❌ Debug-Fehler: ${error.message}`);
        }
    }
}

module.exports = GiveawaySystem; 