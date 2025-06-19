const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class BulkServerActionsAPI extends EventEmitter {
    constructor(client) {
        super();
        this.client = client;
        this.dataPath = path.join(__dirname, 'settings', 'bulk-server-actions.json');
        this.templatePath = path.join(__dirname, 'settings', 'server-templates.json');
        this.optimizationPath = path.join(__dirname, 'settings', 'server-optimization.json');
        
        this.settings = {
            bulkActions: {
                maxConcurrentActions: 5,
                delayBetweenActions: 1000,
                retryAttempts: 3,
                enableConfirmation: true,
                logAllActions: true
            },
            templates: {
                autoApplyCategories: true,
                preserveExistingChannels: false,
                autoCreateRoles: true,
                enablePermissionSync: true
            },
            optimization: {
                autoOptimize: false,
                optimizationSchedule: 'weekly',
                enableRecommendations: true,
                minServerAge: 7
            }
        };

        this.actionQueue = [];
        this.isProcessing = false;
        this.actionHistory = [];
        this.serverTemplates = {};
        this.optimizationReports = new Map();
        
        this.init();
    }

    async init() {
        try {
            await this.loadSettings();
            await this.loadTemplates();
            await this.loadOptimizationData();
            
            setInterval(() => this.generateOptimizationReports(), 3600000);
            
            console.log('🔧 Bulk Server Actions API initialisiert');
        } catch (error) {
            console.error('❌ Fehler beim Initialisieren der Bulk Actions API:', error);
        }
    }

    async loadSettings() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const saved = JSON.parse(data);
            this.settings = { ...this.settings, ...saved };
            this.actionHistory = saved.actionHistory || [];
        } catch (error) {
            await this.saveSettings();
        }
    }

    async saveSettings() {
        try {
            const dataToSave = {
                ...this.settings,
                actionHistory: this.actionHistory,
                lastUpdated: Date.now()
            };
            await fs.writeFile(this.dataPath, JSON.stringify(dataToSave, null, 2));
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Bulk Actions Settings:', error);
        }
    }

    async loadTemplates() {
        try {
            const data = await fs.readFile(this.templatePath, 'utf8');
            this.serverTemplates = JSON.parse(data);
        } catch (error) {
            this.serverTemplates = {
                gamingCommunity: {
                    name: 'Gaming Community',
                    description: 'Vollständiges Setup für Gaming Communities',
                    icon: '🎮',
                    categories: [
                        {
                            name: '📋 Information',
                            channels: [
                                { name: 'regeln', type: 'text', topic: 'Server Regeln und Richtlinien' },
                                { name: 'ankündigungen', type: 'text', topic: 'Wichtige Server-Updates' }
                            ]
                        }
                    ],
                    roles: [
                        { name: 'Admin', color: '#ff0000', permissions: ['Administrator'], position: 10 }
                    ],
                    settings: {
                        verificationLevel: 1,
                        defaultNotifications: 'mentions'
                    }
                }
            };
            await this.saveTemplates();
        }
    }

    async saveTemplates() {
        try {
            await fs.writeFile(this.templatePath, JSON.stringify(this.serverTemplates, null, 2));
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Server Templates:', error);
        }
    }

    async loadOptimizationData() {
        try {
            const data = await fs.readFile(this.optimizationPath, 'utf8');
            const saved = JSON.parse(data);
            
            for (const [guildId, report] of Object.entries(saved.reports || {})) {
                this.optimizationReports.set(guildId, report);
            }
        } catch (error) {
            await this.saveOptimizationData();
        }
    }

    async saveOptimizationData() {
        try {
            const reports = {};
            for (const [guildId, report] of this.optimizationReports.entries()) {
                reports[guildId] = report;
            }
            
            const dataToSave = {
                reports,
                lastUpdated: Date.now()
            };
            
            await fs.writeFile(this.optimizationPath, JSON.stringify(dataToSave, null, 2));
            } catch (error) {
            console.error('❌ Fehler beim Speichern der Optimization Data:', error);
        }
    }

    async generateOptimizationReports() {
        for (const guild of this.client.guilds.cache.values()) {
            try {
                const report = await this.analyzeServerOptimization(guild.id);
                this.optimizationReports.set(guild.id, report);
            } catch (error) {
                console.error(`❌ Fehler bei Optimization Report für ${guild.name}:`, error);
            }
        }
        
        await this.saveOptimizationData();
        this.emit('optimizationReportsGenerated');
    }

    async analyzeServerOptimization(guildId) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return null;

        await guild.members.fetch({ limit: 100 });
        await guild.channels.fetch();
        await guild.roles.fetch();

        const analysis = {
            guildId,
            guildName: guild.name,
            timestamp: Date.now(),
            scores: {
                structure: 0,
                activity: 0,
                security: 0,
                engagement: 0,
                performance: 0
            },
            recommendations: [],
            metrics: {},
            optimizationPotential: 0
        };

        const structureScore = this.analyzeServerStructure(guild);
        analysis.scores.structure = structureScore.score;
        analysis.recommendations.push(...structureScore.recommendations);

        const activityScore = this.analyzeServerActivity(guild);
        analysis.scores.activity = activityScore.score;
        analysis.recommendations.push(...activityScore.recommendations);

        const securityScore = this.analyzeServerSecurity(guild);
        analysis.scores.security = securityScore.score;
        analysis.recommendations.push(...securityScore.recommendations);

        const engagementScore = this.analyzeServerEngagement(guild);
        analysis.scores.engagement = engagementScore.score;
        analysis.recommendations.push(...engagementScore.recommendations);

        const performanceScore = await this.analyzeServerPerformance(guild);
        analysis.scores.performance = performanceScore.score;
        analysis.recommendations.push(...performanceScore.recommendations);

        const totalScore = (
            analysis.scores.structure +
            analysis.scores.activity +
            analysis.scores.security +
            analysis.scores.engagement +
            analysis.scores.performance
        ) / 5;

        analysis.overallScore = Math.round(totalScore);
        analysis.optimizationPotential = Math.max(0, 100 - analysis.overallScore);

        analysis.metrics = {
            memberCount: guild.memberCount,
            channelCount: guild.channels.cache.size,
            roleCount: guild.roles.cache.size,
            boostLevel: guild.premiumTier,
            boostCount: guild.premiumSubscriptionCount,
            verificationLevel: guild.verificationLevel,
            createdAt: guild.createdTimestamp
        };

        return analysis;
    }

    analyzeServerStructure(guild) {
        let score = 100;
        const recommendations = [];

        const textChannels = guild.channels.cache.filter(c => c.type === 0);
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2);
        const categories = guild.channels.cache.filter(c => c.type === 4);
        const channelsWithoutCategory = textChannels.filter(c => !c.parentId);

        if (textChannels.size > 10 && categories.size < 3) {
            score -= 20;
            recommendations.push({
                type: 'structure',
                priority: 'high',
                title: 'Channel-Organisation verbessern',
                description: `${textChannels.size} Text-Channels, aber nur ${categories.size} Kategorien. ${channelsWithoutCategory.size} Channels ohne Kategorie: ${channelsWithoutCategory.slice(0, 3).map(c => c.name).join(', ')}${channelsWithoutCategory.size > 3 ? '...' : ''}`,
                action: 'create_categories',
                details: {
                    textChannels: textChannels.size,
                    categories: categories.size,
                    channelsWithoutCategory: Array.from(channelsWithoutCategory.values()).map(c => ({ id: c.id, name: c.name })),
                    suggestedCategories: ['📋 Information', '💬 Community', '🎮 Gaming', '🔊 Voice Channels']
                }
            });
        }

        if (textChannels.size > 0 && voiceChannels.size === 0) {
            score -= 15;
            recommendations.push({
                type: 'structure',
                priority: 'medium',
                title: 'Voice Channels hinzufügen',
                description: `${textChannels.size} Text-Channels vorhanden, aber keine Voice-Channels. Füge mindestens 2-3 Voice-Channels hinzu für Community-Interaktion.`,
                action: 'add_voice_channels',
                details: {
                    currentVoiceChannels: voiceChannels.size,
                    suggestedChannels: ['Allgemein', 'Gaming', 'Musik/Chill'],
                    recommendedCount: 3
                }
            });
        }

        // Rollen-Hierarchie prüfen
        const roles = Array.from(guild.roles.cache.values()).filter(r => r.name !== '@everyone');
        const rolesWithoutPermissions = roles.filter(r => r.permissions.bitfield === 0n);
        
        if (roles.length < 3) {
            score -= 10;
            recommendations.push({
                type: 'structure',
                priority: 'medium',
                title: 'Rollen-System einrichten',
                description: `Nur ${roles.length} Rollen vorhanden. Erstelle ein strukturiertes Rollen-System mit Admin, Moderator und Member-Rollen.`,
                action: 'create_basic_roles',
                details: {
                    currentRoles: roles.length,
                    suggestedRoles: [
                        { name: 'Admin', permissions: ['Administrator'], color: '#ff0000' },
                        { name: 'Moderator', permissions: ['ManageMessages', 'KickMembers'], color: '#ff8800' },
                        { name: 'Member', permissions: [], color: '#00ff00' }
                    ]
                }
            });
        }

        return { score: Math.max(0, score), recommendations };
    }

    analyzeServerActivity(guild) {
        let score = 70;
        const recommendations = [];

        const memberCount = guild.memberCount;
        const channelCount = guild.channels.cache.filter(c => c.type === 0).size;
        
        if (memberCount > 100 && channelCount < 5) {
            score -= 20;
            recommendations.push({
                type: 'activity',
                priority: 'high',
                title: 'Mehr Diskussions-Channels',
                description: 'Erstelle zusätzliche Channels für verschiedene Themen',
                action: 'add_discussion_channels'
            });
        }

        return { score: Math.max(0, score), recommendations };
    }

    analyzeServerSecurity(guild) {
        let score = 100;
        const recommendations = [];

        // Verification Level
        const verificationLevels = ['Keine', 'Niedrig', 'Mittel', 'Hoch', 'Höchst'];
        if (guild.verificationLevel < 1) {
            score -= 30;
            recommendations.push({
                type: 'security',
                priority: 'high',
                title: 'Verification Level erhöhen',
                description: `Aktuell: ${verificationLevels[guild.verificationLevel]} (${guild.verificationLevel}). Erhöhe auf mindestens "Niedrig" für besseren Schutz vor Spam und Raids.`,
                action: 'increase_verification',
                details: {
                    currentLevel: guild.verificationLevel,
                    currentLevelName: verificationLevels[guild.verificationLevel],
                    recommendedLevel: 1,
                    recommendedLevelName: verificationLevels[1],
                    benefits: ['Reduziert Spam', 'Erschwert Account-Erstellung für Raids', 'Verbessert allgemeine Sicherheit']
                }
            });
        }

        // Moderator-Rollen prüfen
        const modRoles = Array.from(guild.roles.cache.values()).filter(role => 
            role.permissions.has('ManageMessages') || 
            role.permissions.has('KickMembers') ||
            role.permissions.has('BanMembers')
        );
        
        const adminRoles = Array.from(guild.roles.cache.values()).filter(role => 
            role.permissions.has('Administrator')
        );

        if (modRoles.length === 0) {
            score -= 25;
            recommendations.push({
                type: 'security',
                priority: 'high',
                title: 'Moderator-Rollen erstellen',
                description: `Keine Moderator-Rollen gefunden. Erstelle spezielle Rollen für die Moderation mit begrenzten Rechten statt Administrator-Rechten.`,
                action: 'create_mod_roles',
                details: {
                    currentModRoles: modRoles.length,
                    adminRoles: adminRoles.map(r => ({ id: r.id, name: r.name, members: r.members.size })),
                    suggestedRoles: [
                        { name: 'Moderator', permissions: ['ManageMessages', 'KickMembers', 'ManageNicknames'] },
                        { name: 'Trial Mod', permissions: ['ManageMessages'] }
                    ]
                }
            });
        }

        // Zu viele Administrator-Rollen (Owner wird ausgeschlossen)
        const adminMembers = Array.from(guild.members.cache.values()).filter(m => 
            m.permissions.has('Administrator') && !m.user.bot && m.id !== guild.ownerId
        );

        if (adminMembers.length > guild.memberCount * 0.05) { // Mehr als 5% der Member (ohne Owner)
            score -= 15;
            recommendations.push({
                type: 'security',
                priority: 'medium',
                title: 'Administrator-Rechte einschränken',
                description: `${adminMembers.length} Members haben Administrator-Rechte (${((adminMembers.length / guild.memberCount) * 100).toFixed(1)}% aller Member, Owner ausgeschlossen). Das ist ein Sicherheitsrisiko.`,
                action: 'limit_admin_rights',
                details: {
                    adminCount: adminMembers.length,
                    totalMembers: guild.memberCount,
                    percentage: ((adminMembers.length / guild.memberCount) * 100).toFixed(1),
                    adminMembers: adminMembers.slice(0, 5).map(m => ({ id: m.id, name: m.user.username })),
                    ownerExcluded: true,
                    recommendation: 'Erstelle spezifische Rollen mit begrenzten Rechten'
                }
            });
        }

        // Content Filter prüfen
        const contentFilters = ['Deaktiviert', 'Nur Members ohne Rolle', 'Alle Members'];
        if (guild.explicitContentFilter < 1) {
            score -= 10;
            recommendations.push({
                type: 'security',
                priority: 'medium',
                title: 'Content Filter aktivieren',
                description: `Content Filter ist ${contentFilters[guild.explicitContentFilter]}. Aktiviere den Filter zum Schutz vor unerwünschten Inhalten.`,
                action: 'enable_content_filter',
                details: {
                    currentFilter: guild.explicitContentFilter,
                    currentFilterName: contentFilters[guild.explicitContentFilter],
                    recommendedFilter: 1,
                    recommendedFilterName: contentFilters[1]
                }
            });
        }

        return { score: Math.max(0, score), recommendations };
    }

    analyzeServerEngagement(guild) {
        let score = 60;
        const recommendations = [];

        const hasWelcomeChannel = guild.channels.cache.some(c => 
            c.name.includes('welcome') || 
            c.name.includes('willkommen') ||
            c.name.includes('hello')
        );

        if (!hasWelcomeChannel) {
            score -= 15;
            recommendations.push({
                type: 'engagement',
                priority: 'medium',
                title: 'Welcome Channel erstellen',
                description: 'Erstelle einen Channel für neue Mitglieder',
                action: 'create_welcome_channel'
            });
        }

        return { score: Math.max(0, score), recommendations };
    }

    async analyzeServerPerformance(guild) {
        let score = 80;
        const recommendations = [];

        // Detaillierte Rollen-Analyse mit Bot-Feature-Erkennung
        const roles = Array.from(guild.roles.cache.values()).filter(role => !role.managed && role.name !== '@everyone');
        
        // Erkenne Bot-Feature-Rollen
        const botFeatureRoles = await this.identifyBotFeatureRoles(roles);
        const nonBotRoles = roles.filter(role => !botFeatureRoles.includes(role.id));
        
        const unusedRoles = nonBotRoles.filter(role => role.members.size === 0);
        const duplicateRoles = this.findDuplicateRoles(nonBotRoles);
        
        if (guild.roles.cache.size > 50) {
            score -= 15;
            
            let roleDetails = [];
            if (unusedRoles.length > 0) {
                roleDetails.push(`${unusedRoles.length} ungenutzte Rollen (ohne Bot-Features): ${unusedRoles.slice(0, 3).map(r => r.name).join(', ')}${unusedRoles.length > 3 ? `, +${unusedRoles.length - 3} weitere` : ''}`);
            }
            if (duplicateRoles.length > 0) {
                roleDetails.push(`${duplicateRoles.length} mögliche Duplikate gefunden`);
            }
            if (botFeatureRoles.length > 0) {
                const botRoleNames = roles.filter(r => botFeatureRoles.includes(r.id)).slice(0, 3).map(r => r.name);
                roleDetails.push(`${botFeatureRoles.length} Bot-Feature-Rollen (werden ignoriert): ${botRoleNames.join(', ')}${botFeatureRoles.length > 3 ? `, +${botFeatureRoles.length - 3} weitere` : ''}`);
            }
            
            recommendations.push({
                type: 'performance',
                priority: unusedRoles.length > 0 ? 'medium' : 'low',
                title: 'Rollen-Anzahl reduzieren',
                description: `Server hat ${guild.roles.cache.size} Rollen. ${roleDetails.join('. ')}`,
                action: 'cleanup_roles',
                details: {
                    totalRoles: guild.roles.cache.size,
                    botFeatureRoles: botFeatureRoles.length,
                    unusedRoles: unusedRoles.map(r => ({ id: r.id, name: r.name, members: r.members.size })),
                    duplicateRoles: duplicateRoles,
                    recommendation: unusedRoles.length > 0 ? 'Lösche ungenutzte Rollen (Bot-Features werden automatisch ignoriert)' : 'Überprüfe Rollen auf Duplikate'
                }
            });
        }

        // Channel-Analyse
        const channels = Array.from(guild.channels.cache.values());
        const unusedChannels = channels.filter(channel => {
            if (channel.type === 0) { // Text Channel
                return channel.lastMessageId ? false : true; // Vereinfachte Prüfung
            }
            return false;
        });

        if (guild.channels.cache.size > 100) {
            score -= 10;
            recommendations.push({
                type: 'performance',
                priority: 'low',
                title: 'Channel-Anzahl optimieren',
                description: `Server hat ${guild.channels.cache.size} Channels. ${unusedChannels.length > 0 ? `${unusedChannels.length} Channels scheinen ungenutzt.` : 'Prüfe ob alle Channels noch benötigt werden.'}`,
                action: 'cleanup_channels',
                details: {
                    totalChannels: guild.channels.cache.size,
                    textChannels: channels.filter(c => c.type === 0).length,
                    voiceChannels: channels.filter(c => c.type === 2).length,
                    categories: channels.filter(c => c.type === 4).length,
                    unusedChannels: unusedChannels.map(c => ({ id: c.id, name: c.name, type: c.type }))
                }
            });
        }

        // Bot-Analyse
        const bots = guild.members.cache.filter(m => m.user.bot);
        const duplicateBots = this.findDuplicateBots(bots);
        
        if (bots.size > 10) {
            score -= 5;
            recommendations.push({
                type: 'performance',
                priority: 'low',
                title: 'Bot-Anzahl überprüfen',
                description: `${bots.size} Bots auf dem Server. ${duplicateBots.length > 0 ? `Mögliche Duplikate: ${duplicateBots.join(', ')}` : 'Überprüfe ob alle Bots benötigt werden.'}`,
                action: 'review_bots',
                details: {
                    totalBots: bots.size,
                    botList: Array.from(bots.values()).map(bot => ({ id: bot.id, name: bot.user.username, status: bot.presence?.status || 'offline' })),
                    duplicateBots: duplicateBots
                }
            });
        }

        return { score: Math.max(0, score), recommendations };
    }

    async identifyBotFeatureRoles(roles) {
        const botFeatureRoleIds = [];
        
        // 1. Lade alle Bot-Feature-Settings
        const botFeatureRoles = await this.loadBotFeatureRoles();
        
        // 2. Definiere ALLE bekannten Bot-Rollen-Patterns basierend auf deinem Projekt
        const knownBotRolePatterns = [
            // === XP SYSTEM PATTERNS ===
            // Level-Rollen (alle Varianten)
            /^🔥 Level \d+$/i, /^⚡ Level \d+$/i, /^💫 Level \d+$/i, /^🌟 Level \d+$/i, /^🚀 Level \d+$/i,
            /^🎯 Level \d+$/i, /^💎 Level \d+$/i, /^👑 Level \d+$/i, /^🏆 Level \d+$/i, /^🔮 Level \d+$/i,
            
            // Generic Level-Patterns (falls andere Formate verwendet werden)
            /^Level \d+$/i, /^Lvl\.? \d+$/i, /^LV \d+$/i, /^.*Level.* \d+.*$/i, /^\d+ Level.*$/i,
            
            // Meilenstein-Rollen (exakte Patterns)
            /^🌱 Newcomer$/i, /^💬 Aktives Mitglied$/i, /^⭐ Erfahrener User$/i, /^🎯 Server-Veteran$/i,
            /^👑 Elite Member$/i, /^🏆 Server-Legende$/i, /^💎 Diamond Member$/i,
            
            // === VALORANT SYSTEM PATTERNS ===
            // Valorant Rang-Rollen (alle Varianten)
            /^Valorant Unranked$/i,
            /^Valorant (Iron|Bronze|Silver|Gold|Platinum|Diamond|Ascendant|Immortal|Radiant) [1-3]?$/i,
            /^(Iron|Bronze|Silver|Gold|Platinum|Diamond|Ascendant|Immortal|Radiant) [1-3]?$/i,
            
            // Valorant Agent-Rollen (alle Agenten)
            /^(Jett|Sage|Phoenix|Sova|Viper|Cypher|Reyna|Breach|Omen|Raze|Skye|Yoru|Astra|KAY\/O|Chamber|Neon|Fade|Harbor|Gekko|Deadlock|Iso|Clove|Vyse|Killjoy|Brimstone)$/i,
            
            // Valorant Klassen-Rollen
            /^(Duelist|Controller|Initiator|Sentinel)$/i,
            
            // Valorant spezielle Rollen
            /^👑 Valorant Grandmaster👑$/i, /^✨Valorant Enthusiast✨$/i, /^🧠 Valorant Strategist🧠$/i,
            
            // Allgemeine Valorant-Patterns
            /^Valorant .+$/i, /^.*Valorant.*$/i,
            
            // === VERIFICATION SYSTEM PATTERNS ===
            // Gaming-Plattformen
            /^❎Xbox$/i, /^🎮PS5$/i, /^🖥️PC$/i, /^💻 ?PC$/i, /^🎮 PlayStation$/i,
            /^(PC|PlayStation|Xbox|Switch|Mobile) Gamer$/i,
            
            // Game-Rollen
            /^(World of Warcraft|League of Legends|Minecraft|Fragpunk)$/i,
            /^(Valorant|LoL|Minecraft|Fortnite|CS2|Apex) Player$/i,
            
            // === BOT SYSTEM PATTERNS ===
            // Basis Bot-Rollen
            /^(Member|verify|verified)$/i,
            /^Bot Updates$/i,
            /^(Muted|💤 AFK|AFK)$/i,
            
            // === WEITERE BOT-FEATURES PATTERNS ===
            // Ticket System
            /^(Ticket Support|Support|Staff)$/i,
            
            // Music System
            /^(DJ|Music|Music Lover)$/i,
            
            // Giveaway System
            /^(Giveaway|Winner|Event)$/i,
            /^Giveaway (Notifications|Winner|Participant)$/i,
            
            // Twitch/Streaming System
            /^(Streamer|Live Notifications|Twitch Notifications)$/i,
            
            // === ALLGEMEINE BOT-PATTERNS ===
            // Auto-generierte Rollen
            /^Auto .+$/i, /^Temp .+$/i, /^System .+$/i, /^Role .+$/i,
            /^Bot .+$/i, /^.*Bot.*$/i,
            
            // Admin/Mod Rollen (falls vom Bot erstellt)
            /^(Admin|Owner|Moderator|Helper)$/i,
            /^(Auto|Bot) (Moderator|Admin)$/i,
            
            // General Gaming/Community Rollen
            /^(Gaming|Gamer|Controller)$/i,
            /^(New Member|Newcomer|Active|Inactive|VIP|Premium|Regular|Veteran|Elite)$/i,
            
            // === EMOJI-BASIERTE PATTERNS ===
            // Rollen mit Gaming-Emojis
            /^🎮.+$/i, /^🎯.+$/i, /^🎲.+$/i, /^🏆.+$/i, /^💎.+$/i, /^⭐.+$/i,
            /^🔥.+$/i, /^⚡.+$/i, /^💫.+$/i, /^🌟.+$/i, /^🚀.+$/i, /^👑.+$/i,
            /^🌱.+$/i, /^💬.+$/i, /^🎯.+$/i, /^🏆.+$/i, /^💎.+$/i, /^🔮.+$/i,
            
            // === ERWEITERTE HEURISTIKEN ===
            // Level-bezogene Patterns erweitert
            /level/i, /lvl/i, /^lv \d+/i,
            
            // Rang-bezogene Patterns
            /(iron|bronze|silver|gold|platinum|diamond|ascendant|immortal|radiant)/i,
            
            // XP/Meilenstein-bezogene Patterns
            /(newcomer|aktiv|erfahren|veteran|elite|legende|diamond)/i,
            
            // Gaming-bezogene Patterns
            /(valorant|minecraft|league|warcraft|gaming|gamer)/i,
            
            // System/Bot-bezogene Patterns
            /(auto|temp|system|bot|mute|support|ticket|giveaway|music|dj)/i
        ];
        
        // 3. Definiere exakte Rollennamen, die definitiv Bot-Features sind
        const exactBotRoleNames = [
            // === XP SYSTEM ROLLEN (komplett aus xp-system.js) ===
            // Automatische Level-Rollen
            '🔥 Level 5', '⚡ Level 10', '💫 Level 15', '🌟 Level 20', '🚀 Level 25', 
            '🎯 Level 30', '💎 Level 40', '👑 Level 50', '🏆 Level 75', '🔮 Level 100',
            
            // Automatische Meilenstein-Rollen
            '🌱 Newcomer', '💬 Aktives Mitglied', '⭐ Erfahrener User', '🎯 Server-Veteran',
            '👑 Elite Member', '🏆 Server-Legende', '💎 Diamond Member',
            
            // === VALORANT SYSTEM ROLLEN (komplett aus valorant-settings.json) ===
            // Alle Valorant Ränge
            'Valorant Unranked',
            'Valorant Iron 1', 'Valorant Iron 2', 'Valorant Iron 3',
            'Valorant Bronze 1', 'Valorant Bronze 2', 'Valorant Bronze 3',
            'Valorant Silver 1', 'Valorant Silver 2', 'Valorant Silver 3',
            'Valorant Gold 1', 'Valorant Gold 2', 'Valorant Gold 3',
            'Valorant Platinum 1', 'Valorant Platinum 2', 'Valorant Platinum 3',
            'Valorant Diamond 1', 'Valorant Diamond 2', 'Valorant Diamond 3',
            'Valorant Ascendant 1', 'Valorant Ascendant 2', 'Valorant Ascendant 3',
            'Valorant Immortal 1', 'Valorant Immortal 2', 'Valorant Immortal 3',
            'Valorant Radiant',
            
            // Ohne "Valorant" Prefix (falls verwendet)
            'Unranked', 'Iron 1', 'Iron 2', 'Iron 3', 'Bronze 1', 'Bronze 2', 'Bronze 3',
            'Silver 1', 'Silver 2', 'Silver 3', 'Gold 1', 'Gold 2', 'Gold 3',
            'Platinum 1', 'Platinum 2', 'Platinum 3', 'Diamond 1', 'Diamond 2', 'Diamond 3',
            'Ascendant 1', 'Ascendant 2', 'Ascendant 3', 'Immortal 1', 'Immortal 2', 'Immortal 3',
            'Radiant',
            
            // Alle Valorant Agenten
            'Jett', 'Sage', 'Phoenix', 'Sova', 'Viper', 'Cypher', 'Reyna', 'Breach', 
            'Omen', 'Raze', 'Skye', 'Yoru', 'Astra', 'KAY/O', 'Chamber', 'Neon', 
            'Fade', 'Harbor', 'Gekko', 'Deadlock', 'Iso', 'Clove', 'Vyse', 'Killjoy',
            'Brimstone',
            
            // Valorant Klassen-Rollen
            'Duelist', 'Controller', 'Initiator', 'Sentinel',
            
            // Valorant spezielle Rollen (aus dem Projekt)
            '👑 Valorant Grandmaster👑', '✨Valorant Enthusiast✨', '🧠 Valorant Strategist🧠',
            
            // === VERIFICATION SYSTEM ROLLEN (aus verification.json) ===
            // Gaming-Plattformen
            '❎Xbox', '🎮PS5', '🖥️PC', '💻PC', '🎮 PlayStation',
            'PC Gamer', 'PlayStation Gamer', 'Xbox Gamer', 'Switch Gamer', 'Mobile Gamer',
            
            // Game-Rollen
            'Valorant', 'Valorant Player', 'World of Warcraft', 'League of Legends', 
            'LoL Player', 'Minecraft', 'Minecraft Player', 'Fortnite Player', 'CS2 Player', 
            'Apex Player', 'Fragpunk',
            
            // Basis Verification Rollen
            'Member', 'verify', 'verified',
            
            // === BOT SYSTEM ROLLEN ===
            // Bot Updates & Notifications
            'Bot Updates',
            
            // Moderation System
            'Muted', '💤 AFK', 'AFK',
            
            // === WEITERE BOT-FEATURES ===
            // Ticket System
            'Ticket Support', 'Support', 'Staff',
            
            // Music System
            'DJ', 'Music', 'Music Lover',
            
            // Giveaway System
            'Giveaway', 'Giveaway Notifications', 'Giveaway Winner', 'Winner', 'Event',
            
            // Twitch/Streaming
            'Streamer', 'Live Notifications', 'Twitch Notifications',
            
            // Admin/Mod Rollen (falls vom Bot erstellt)
            'Admin', 'Owner', 'Moderator', 'Helper',
            
            // General Gaming
            'Gaming', 'Gamer', 'Controller',
            
            // Weitere häufige Bot-Rollen
            'New Member', 'Newcomer', 'Active', 'Inactive', 'VIP', 'Premium', 'Regular',
            'Veteran', 'Elite', 'Auto Moderator', 'Bot Moderator', 'Temp Role'
        ];
        
        roles.forEach(role => {
            let isBot = false;
            
            // Prüfe exakte Namen zuerst
            if (exactBotRoleNames.includes(role.name)) {
                isBot = true;
            }
            
            // Prüfe gegen Patterns
            if (!isBot) {
                for (const pattern of knownBotRolePatterns) {
                    if (pattern.test(role.name)) {
                        isBot = true;
                        break;
                    }
                }
            }
            
            // Prüfe gegen geladene Feature-Rollen
            if (!isBot && botFeatureRoles.includes(role.id)) {
                isBot = true;
            }
            
            // Bot-Tags prüfen
            if (!isBot && role.tags?.botId) {
                isBot = true;
            }
            
            // Zusätzliche Heuristiken für Bot-Rollen
            if (!isBot) {
                const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(role.name);
                const hasLevel = /level|lvl|\d+/i.test(role.name);
                const hasGame = /valorant|minecraft|lol|wow|league|warcraft/i.test(role.name);
                const hasSystem = /auto|temp|system|bot|mute|support|ticket|giveaway/i.test(role.name);
                
                if ((hasEmoji && hasLevel) || (hasEmoji && hasGame) || hasSystem) {
                    isBot = true;
                }
            }
            
            if (isBot && !botFeatureRoleIds.includes(role.id)) {
                botFeatureRoleIds.push(role.id);
            }
        });
        
        return botFeatureRoleIds;
    }

    async loadBotFeatureRoles() {
        const featureRoleIds = [];
        
        try {
            // XP System Rollen laden
            const fs = require('fs').promises;
            const xpSettings = JSON.parse(await fs.readFile(path.join(__dirname, 'xp-settings.json'), 'utf8'));
            if (xpSettings.rewards?.levelRoles) {
                featureRoleIds.push(...xpSettings.rewards.levelRoles.map(r => r.roleId));
            }
            
            // Valorant Rollen laden
            const valorantSettings = JSON.parse(await fs.readFile(path.join(__dirname, 'valorant-settings.json'), 'utf8'));
            if (valorantSettings.rankRewards?.ranks) {
                featureRoleIds.push(...valorantSettings.rankRewards.ranks.map(r => r.roleId));
            }
        } catch (error) {
            console.log('Info: Konnte nicht alle Feature-Settings laden:', error.message);
        }
        
        return featureRoleIds;
    }

    findDuplicateRoles(roles) {
        const roleGroups = {};
        roles.forEach(role => {
            const key = `${role.name.toLowerCase()}_${role.color}`;
            if (!roleGroups[key]) roleGroups[key] = [];
            roleGroups[key].push(role);
        });
        
        return Object.values(roleGroups)
            .filter(group => group.length > 1)
            .map(group => group.map(r => r.name));
    }

    findDuplicateBots(bots) {
        const botNames = {};
        Array.from(bots.values()).forEach(bot => {
            const name = bot.user.username.toLowerCase();
            if (!botNames[name]) botNames[name] = [];
            botNames[name].push(bot.user.username);
        });
        
        return Object.values(botNames)
            .filter(group => group.length > 1)
            .map(group => group[0]);
    }

    getOptimizationReport(guildId) {
        return this.optimizationReports.get(guildId) || null;
    }

    getServerTemplates() {
        return Object.entries(this.serverTemplates).map(([id, template]) => ({
            id,
            ...template
        }));
    }

    getActionHistory(limit = 50) {
        return this.actionHistory.slice(0, limit);
    }

    getSettings() {
        return this.settings;
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        return true;
    }
}

module.exports = BulkServerActionsAPI; 