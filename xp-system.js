const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

class XPSystem {
    constructor(client) {
        this.client = client;
        this.userXP = new Map(); // userId -> { xp, level, totalXP, lastMessage, voiceJoinTime }
        this.voiceUsers = new Map(); // userId -> { joinTime, channelId }
        this.settings = {
            enabled: true,
            messageXP: {
                min: 5,
                max: 15,
                cooldown: 60000 // 1 Minute Cooldown zwischen Nachrichten
            },
            voiceXP: {
                baseXP: 2, // XP pro Minute
                afkChannelXP: 0, // Kein XP in AFK Channel
                soloChannelXP: 1, // Reduziertes XP wenn alleine
                cooldown: 60000, // Check alle 60 Sekunden
                intervalMinutes: 1 // XP alle X Minuten vergeben
            },
            levelSystem: {
                baseXP: 100, // XP für Level 1
                multiplier: 1.5, // Multiplikator pro Level
                maxLevel: 100
            },
            channels: {
                levelUpChannel: 'level-up',
                leaderboardChannel: 'leaderboard',
                xpBlacklist: [], // Channels ohne XP
                voiceBlacklist: [] // Voice-Channels ohne XP
            },
            autoLeaderboard: {
                enabled: true,
                time: '20:00', // Uhrzeit im Format HH:MM (24h)
                channelName: 'leaderboard',
                types: ['total'], // Array: total, level, messages, voice
                limit: 10,
                lastPosted: 0, // Timestamp der letzten Posting
                timezone: 'Europe/Berlin' // Zeitzone für die Uhrzeit
            },
            rewards: {
                levelRoles: [], // { level: 5, roleId: '123', roleName: 'Level 5' }
                milestoneRewards: [
                    { xp: 500, reward: '🌱 Newcomer Rolle' },
                    { xp: 1000, reward: '💬 Aktives Mitglied Rolle' },
                    { xp: 2500, reward: '⭐ Erfahrener User Rolle' },
                    { xp: 5000, reward: '🎯 Server-Veteran Rolle' },
                    { xp: 10000, reward: '👑 Elite Member Rolle' },
                    { xp: 25000, reward: '🏆 Server-Legende Rolle' },
                    { xp: 50000, reward: '💎 Diamond Member Rolle' }
                ]
            },
            announcements: {
                levelUp: true,
                milestones: true,
                newRecord: true
            },
            display: {
                showRank: true,
                showProgress: true,
                embedColor: '0x00FF7F',
                leaderboardSize: 10
            },
            levelUpEmbed: {
                enabled: true,
                title: '🎉 Level Up!',
                color: '0x00FF7F', // Separate Farbe für Level-Up-Embeds
                animation: {
                    enabled: true,
                    style: 'celebration', // celebration, gradient, pulse, rainbow
                    duration: 5000 // Dauer in Millisekunden
                },
                fields: {
                    showStats: true,
                    showNextLevel: true,
                    showRank: true,
                    customMessage: '' // Optional: Custom Message Template
                },
                footer: {
                    enabled: true,
                    text: '🎉 Herzlichen Glückwunsch!'
                }
            }
        };
        
        this.loadData();
        this.startVoiceXPTimer();
    }

    // Daten laden
    loadData() {
        try {
            // XP-Einstellungen laden
            if (fs.existsSync('./xp-settings.json')) {
                const loadedSettings = JSON.parse(fs.readFileSync('./xp-settings.json', 'utf8'));
                this.settings = { ...this.settings, ...loadedSettings };
                console.log('✅ XP-Einstellungen geladen');
            }

            // User-XP-Daten laden
            if (fs.existsSync('./xp-data.json')) {
                const xpData = JSON.parse(fs.readFileSync('./xp-data.json', 'utf8'));
                xpData.forEach(user => {
                    this.userXP.set(user.userId, {
                        xp: user.xp || 0,
                        level: user.level || 1,
                        totalXP: user.totalXP || 0,
                        lastMessage: user.lastMessage || 0,
                        voiceJoinTime: 0,
                        messageCount: user.messageCount || 0,
                        voiceTime: user.voiceTime || 0, // in Minuten
                        username: user.username || 'Unbekannt',
                        avatar: user.avatar || null
                    });
                });
                console.log(`✅ XP-Daten für ${xpData.length} User geladen`);
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der XP-Daten:', error);
        }
    }

    // Daten speichern
    saveData() {
        try {
            // Einstellungen speichern
            fs.writeFileSync('./xp-settings.json', JSON.stringify(this.settings, null, 2));

            // User-Daten speichern
            const xpData = Array.from(this.userXP.entries()).map(([userId, data]) => ({
                userId,
                ...data
            }));
            
            // Detailliertes Logging für Debug
            console.log(`💾 Speichere XP-Daten: ${xpData.length} User in JSON`);
            if (xpData.length === 0) {
                console.log(`🗑️ Leere XP-Datei wird geschrieben`);
            } else {
                console.log(`📊 Gespeicherte User-IDs: ${xpData.map(u => u.userId).join(', ')}`);
            }
            
            fs.writeFileSync('./xp-data.json', JSON.stringify(xpData, null, 2));
            console.log(`✅ xp-data.json erfolgreich gespeichert`);
            
        } catch (error) {
            console.error('❌ Fehler beim Speichern der XP-Daten:', error);
        }
    }

    // Nachrichten-XP hinzufügen
    async addMessageXP(message) {
        if (!this.settings.enabled) return;
        if (message.author.bot) return;
        if (this.settings.channels.xpBlacklist.includes(message.channel.name)) return;

        const userId = message.author.id;
        const userData = this.getUserData(userId);
        
        // Cooldown prüfen
        const now = Date.now();
        if (now - userData.lastMessage < this.settings.messageXP.cooldown) return;

        // Zufällige XP vergeben
        const xpGain = Math.floor(Math.random() * 
            (this.settings.messageXP.max - this.settings.messageXP.min + 1)) + 
            this.settings.messageXP.min;

        // Update User-Daten
        userData.lastMessage = now;
        userData.messageCount++;
        const oldLevel = userData.level;
        
        await this.addXP(userId, xpGain, message.author);
        
        // Level-Up Check
        const newLevel = userData.level;
        if (newLevel > oldLevel) {
            await this.handleLevelUp(message.guild, message.author, oldLevel, newLevel);
        }
    }

    // Voice-XP hinzufügen
    async handleVoiceStateUpdate(oldState, newState) {
        if (!this.settings.enabled) return;
        if (newState.member.user.bot) return;

        const userId = newState.member.id;

        // User joined Voice Channel
        if (!oldState.channel && newState.channel) {
            this.voiceUsers.set(userId, {
                joinTime: Date.now(),
                channelId: newState.channel.id,
                channelName: newState.channel.name
            });
            console.log(`🎤 ${newState.member.user.username} joined voice: ${newState.channel.name}`);
        }
        // User left Voice Channel
        else if (oldState.channel && !newState.channel) {
            if (this.voiceUsers.has(userId)) {
                const voiceData = this.voiceUsers.get(userId);
                const timeSpent = (Date.now() - voiceData.joinTime) / 1000 / 60; // Minuten
                
                await this.addVoiceXP(userId, timeSpent, oldState.channel, newState.member.user);
                this.voiceUsers.delete(userId);
                console.log(`🎤 ${newState.member.user.username} left voice after ${timeSpent.toFixed(1)} minutes`);
            }
        }
        // User moved between Voice Channels
        else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            if (this.voiceUsers.has(userId)) {
                const voiceData = this.voiceUsers.get(userId);
                const timeSpent = (Date.now() - voiceData.joinTime) / 1000 / 60;
                
                this.addVoiceXP(userId, timeSpent, oldState.channel, newState.member.user);
                
                // Update für neuen Channel
                this.voiceUsers.set(userId, {
                    joinTime: Date.now(),
                    channelId: newState.channel.id,
                    channelName: newState.channel.name
                });
                console.log(`🎤 ${newState.member.user.username} moved voice: ${oldState.channel.name} -> ${newState.channel.name}`);
            }
        }
    }

    // Voice-XP hinzufügen
    async addVoiceXP(userId, minutes, channel, user) {
        if (minutes < 0.5) return; // Mindestens 30 Sekunden
        if (this.settings.channels.voiceBlacklist.includes(channel.name)) return;

        let xpMultiplier = 1;
        
        // AFK Channel Check
        if (channel.name.toLowerCase().includes('afk')) {
            xpMultiplier = this.settings.voiceXP.afkChannelXP;
        }
        // Solo Channel Check (nur 1 Person im Channel)
        else if (channel.members.size === 1) {
            xpMultiplier = this.settings.voiceXP.soloChannelXP;
        }

        const xpGain = Math.floor(minutes * this.settings.voiceXP.baseXP * xpMultiplier);
        
        if (xpGain > 0) {
            const userData = this.getUserData(userId);
            userData.voiceTime += minutes;
            await this.addXP(userId, xpGain, user);
            
            console.log(`🎤 Voice XP: ${user.username} +${xpGain} XP (${minutes.toFixed(1)}min in ${channel.name})`);
        }
    }

    // Timer für kontinuierliche Voice-XP
    startVoiceXPTimer() {
        setInterval(async () => {
            const promises = [];
            this.voiceUsers.forEach((voiceData, userId) => {
                const user = this.client.users.cache.get(userId);
                if (user) {
                    const channel = this.client.channels.cache.get(voiceData.channelId);
                    if (channel) {
                        const timeSpent = (Date.now() - voiceData.joinTime) / 1000 / 60;
                        
                        if (timeSpent >= this.settings.voiceXP.intervalMinutes) {
                            promises.push(this.addVoiceXP(userId, this.settings.voiceXP.intervalMinutes, channel, user));
                            // Reset join time für kontinuierliche XP
                            voiceData.joinTime = Date.now();
                        }
                    }
                }
            });
            
            // Warte auf alle Voice XP Updates
            if (promises.length > 0) {
                try {
                    await Promise.all(promises);
                } catch (error) {
                    console.error('❌ Fehler beim Voice XP Timer:', error);
                }
            }
        }, this.settings.voiceXP.cooldown);
    }

    // User-Daten abrufen oder erstellen
    getUserData(userId) {
        if (!this.userXP.has(userId)) {
            this.userXP.set(userId, {
                xp: 0,
                level: 1,
                totalXP: 0,
                lastMessage: 0,
                voiceJoinTime: 0,
                messageCount: 0,
                voiceTime: 0,
                username: 'Unbekannt',
                avatar: null
            });
        }
        return this.userXP.get(userId);
    }

    // XP hinzufügen
    async addXP(userId, amount, user) {
        const userData = this.getUserData(userId);
        const oldTotalXP = userData.totalXP;
        const oldLevel = userData.level;
        const oldMaxLevel = this.getStats().maxLevel;
        
        userData.xp += amount;
        userData.totalXP += amount;
        userData.username = user.username;
        userData.avatar = user.avatar;

        // Level berechnen
        const newLevel = this.calculateLevel(userData.totalXP);
        if (newLevel !== userData.level) {
            userData.level = newLevel;
        }

        // Lokal speichern
        this.userXP.set(userId, userData);
        this.saveData();

        // Meilenstein-Check
        this.checkMilestones(userId, oldTotalXP, userData.totalXP, user);
        
        // Rekord-Check (nur wenn Client verfügbar ist)
        if (this.client) {
            this.checkNewRecords(userId, oldLevel, newLevel, oldMaxLevel, user);
        }
    }

    // Level berechnen
    calculateLevel(totalXP) {
        let level = 1;
        let requiredXP = this.settings.levelSystem.baseXP;

        while (totalXP >= requiredXP && level < this.settings.levelSystem.maxLevel) {
            totalXP -= requiredXP;
            level++;
            requiredXP = Math.floor(requiredXP * this.settings.levelSystem.multiplier);
        }

        return level;
    }

    // XP für nächstes Level berechnen
    getXPForNextLevel(level) {
        if (level >= this.settings.levelSystem.maxLevel) return 0;
        
        let requiredXP = this.settings.levelSystem.baseXP;
        for (let i = 1; i < level; i++) {
            requiredXP = Math.floor(requiredXP * this.settings.levelSystem.multiplier);
        }
        return requiredXP;
    }

    // Level-Up handhaben
    async handleLevelUp(guild, user, oldLevel, newLevel) {
        if (!this.settings.announcements.levelUp || !this.settings.levelUpEmbed.enabled) return;

        // Level-Up Nachricht senden
        const levelUpChannel = guild.channels.cache.find(ch => 
            ch.name.includes(this.settings.channels.levelUpChannel) ||
            ch.name.includes('level') ||
            ch.name.includes('general')
        );

        if (levelUpChannel) {
            const embed = await this.createLevelUpEmbed(user, oldLevel, newLevel);
            
            // Animation-Support: Mehrere Nachrichten für Animationseffekt
            if (this.settings.levelUpEmbed.animation.enabled) {
                await this.sendAnimatedLevelUp(levelUpChannel, embed, user, newLevel);
            } else {
                await levelUpChannel.send({ embeds: [embed] });
            }
        }

        // Alle Rollen-Systeme aktualisieren (Level-Rollen und Meilenstein-Rollen)
        await this.updateAllUserRoles(guild, user, newLevel);
    }

    // Level-Up-Embed erstellen
    async createLevelUpEmbed(user, oldLevel, newLevel) {
        const userData = this.getUserData(user.id);
        const nextLevelXP = this.getXPForNextLevel(newLevel);
        const config = this.settings.levelUpEmbed;
        
        // Basis-Beschreibung
        let description = `**${user.username}** ist jetzt **Level ${newLevel}**!`;
        
        // Custom Message Template verarbeiten
        if (config.fields.customMessage) {
            description = config.fields.customMessage
                .replace('{username}', user.username)
                .replace('{oldLevel}', oldLevel)
                .replace('{newLevel}', newLevel)
                .replace('{totalXP}', userData.totalXP.toLocaleString());
        }

        const embed = new EmbedBuilder()
            .setTitle(config.title)
            .setDescription(description)
            .setColor(parseInt(config.color.replace('0x', ''), 16))
            .setThumbnail(user.displayAvatarURL ? user.displayAvatarURL() : null)
            .setTimestamp();

        // Optionale Felder hinzufügen
        const fields = [];
        
        if (config.fields.showStats) {
            fields.push({
                name: '📊 Statistiken',
                value: `**Total XP:** ${userData.totalXP.toLocaleString()}\n**Nachrichten:** ${userData.messageCount}\n**Voice Zeit:** ${userData.voiceTime.toFixed(1)}min`,
                inline: true
            });
        }

        if (config.fields.showNextLevel) {
            fields.push({
                name: '🎯 Nächstes Level',
                value: nextLevelXP > 0 ? `${nextLevelXP.toLocaleString()} XP benötigt` : 'Max Level erreicht!',
                inline: true
            });
        }

        if (config.fields.showRank) {
            const rank = this.getUserRank(user.id);
            if (rank) {
                fields.push({
                    name: '🏆 Server-Rang',
                    value: `#${rank}`,
                    inline: true
                });
            }
        }

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        // Footer hinzufügen
        if (config.footer.enabled) {
            embed.setFooter({ text: config.footer.text });
        }

        return embed;
    }

    // Animierte Level-Up-Nachricht senden
    async sendAnimatedLevelUp(channel, finalEmbed, user, newLevel) {
        const config = this.settings.levelUpEmbed.animation;
        
        try {
            switch (config.style) {
                case 'celebration':
                    await this.sendCelebrationAnimation(channel, finalEmbed, user, newLevel);
                    break;
                case 'gradient':
                    await this.sendGradientAnimation(channel, finalEmbed, user, newLevel);
                    break;
                case 'pulse':
                    await this.sendPulseAnimation(channel, finalEmbed, user, newLevel);
                    break;
                case 'rainbow':
                    await this.sendRainbowAnimation(channel, finalEmbed, user, newLevel);
                    break;
                default:
                    // Fallback zu normaler Nachricht
                    await channel.send({ embeds: [finalEmbed] });
                    break;
            }
        } catch (error) {
            console.error('❌ Fehler bei Level-Up-Animation:', error);
            // Fallback zu normaler Nachricht
            await channel.send({ embeds: [finalEmbed] });
        }
    }

    // Celebration Animation
    async sendCelebrationAnimation(channel, finalEmbed, user, newLevel) {
        // Schritt 1: Ankündigung
        const announcement = new EmbedBuilder()
            .setTitle('✨ Level Up Coming...')
            .setDescription(`**${user.username}** hat ein neues Level erreicht!`)
            .setColor(0xFFD700)
            .setTimestamp();

        const msg1 = await channel.send({ embeds: [announcement] });

        // Schritt 2: Countdown (nach 1 Sekunde)
        setTimeout(async () => {
            const countdown = new EmbedBuilder()
                .setTitle('🎊 3... 2... 1...')
                .setDescription('**LEVEL UP!**')
                .setColor(0xFF69B4)
                .setTimestamp();

            await msg1.edit({ embeds: [countdown] });
        }, 1000);

        // Schritt 3: Finale Nachricht (nach weiteren 2 Sekunden)
        setTimeout(async () => {
            await msg1.edit({ embeds: [finalEmbed] });
            
            // Bonus: Confetti-Reaktionen
            const emojis = ['🎉', '🎊', '🥳', '✨', '🌟'];
            for (const emoji of emojis) {
                try {
                    await msg1.react(emoji);
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (e) {
                    // Ignore reaction errors
                }
            }
        }, 3000);
    }

    // Gradient Animation
    async sendGradientAnimation(channel, finalEmbed, user, newLevel) {
        const colors = [0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x4B0082, 0x9400D3];
        
        const tempEmbed = new EmbedBuilder()
            .setTitle('🌈 Level Up!')
            .setDescription(`**${user.username}** ist jetzt **Level ${newLevel}**!`)
            .setColor(colors[0])
            .setTimestamp();

        const msg = await channel.send({ embeds: [tempEmbed] });

        // Farbwechsel-Animation
        for (let i = 1; i < colors.length; i++) {
            setTimeout(async () => {
                tempEmbed.setColor(colors[i]);
                await msg.edit({ embeds: [tempEmbed] });
            }, i * 500);
        }

        // Finale Nachricht
        setTimeout(async () => {
            await msg.edit({ embeds: [finalEmbed] });
        }, colors.length * 500 + 500);
    }

    // Pulse Animation
    async sendPulseAnimation(channel, finalEmbed, user, newLevel) {
        const baseColor = parseInt(this.settings.levelUpEmbed.color.replace('0x', ''), 16);
        const pulseColor = 0xFFFFFF; // Weiß für Pulse

        const tempEmbed = new EmbedBuilder()
            .setTitle('💫 Level Up!')
            .setDescription(`**${user.username}** ist jetzt **Level ${newLevel}**!`)
            .setColor(baseColor)
            .setTimestamp();

        const msg = await channel.send({ embeds: [tempEmbed] });

        // Pulse-Effekt: 3x zwischen base und pulse Farbe wechseln
        for (let i = 0; i < 6; i++) {
            setTimeout(async () => {
                const color = i % 2 === 0 ? pulseColor : baseColor;
                tempEmbed.setColor(color);
                await msg.edit({ embeds: [tempEmbed] });
            }, i * 300);
        }

        // Finale Nachricht
        setTimeout(async () => {
            await msg.edit({ embeds: [finalEmbed] });
        }, 2000);
    }

    // Rainbow Animation
    async sendRainbowAnimation(channel, finalEmbed, user, newLevel) {
        const rainbowColors = [
            0xFF0000, 0xFF4500, 0xFF8C00, 0xFFD700, 0xADFF2F,
            0x00FF7F, 0x00CED1, 0x1E90FF, 0x9370DB, 0xFF69B4
        ];

        const tempEmbed = new EmbedBuilder()
            .setTitle('🌈✨ RAINBOW LEVEL UP! ✨🌈')
            .setDescription(`**${user.username}** ist jetzt **Level ${newLevel}**! 🎉`)
            .setColor(rainbowColors[0])
            .setTimestamp();

        const msg = await channel.send({ embeds: [tempEmbed] });

        // Schnelle Rainbow-Animation
        for (let i = 1; i < rainbowColors.length; i++) {
            setTimeout(async () => {
                tempEmbed.setColor(rainbowColors[i]);
                await msg.edit({ embeds: [tempEmbed] });
            }, i * 200);
        }

        // Finale Nachricht
        setTimeout(async () => {
            await msg.edit({ embeds: [finalEmbed] });
        }, rainbowColors.length * 200 + 500);
    }

    // Meilenstein-Ankündigungen prüfen
    async checkMilestones(userId, oldTotalXP, newTotalXP, user) {
        if (!this.settings.announcements.milestones) return;
        if (!this.client) return;

        // Prüfe alle Meilensteine die zwischen old und new XP liegen
        for (const milestone of this.settings.rewards.milestoneRewards) {
            if (oldTotalXP < milestone.xp && newTotalXP >= milestone.xp) {
                await this.handleMilestoneReached(userId, milestone, user);
            }
        }
    }

    // Meilenstein erreicht
    async handleMilestoneReached(userId, milestone, user) {
        const channel = this.client.channels.cache.find(ch => 
            ch.name.includes(this.settings.channels.levelUpChannel) ||
            ch.name.includes('level') ||
            ch.name.includes('general')
        );

        if (channel) {
            const userData = this.getUserData(userId);
            const rank = this.getUserRank(userId);
            
            // Versuche automatische Rollen-Vergabe für Meilensteine
            await this.assignMilestoneRoles(channel.guild, user, milestone.xp);
            
            const embed = new EmbedBuilder()
                .setTitle('🎊 Meilenstein erreicht!')
                .setDescription(`**${user.username}** hat einen wichtigen Meilenstein erreicht!`)
                .addFields(
                    { name: '🎯 Meilenstein', value: `**${milestone.xp.toLocaleString()} XP**`, inline: true },
                    { name: '🏆 Belohnung', value: `**${milestone.reward}**`, inline: true },
                    { name: '📊 Statistiken', value: `**Level:** ${userData.level}\n**Rang:** #${rank || 'Unbekannt'}\n**Total XP:** ${userData.totalXP.toLocaleString()}`, inline: false }
                )
                .setColor(parseInt(this.settings.display.embedColor.replace('0x', ''), 16))
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: '🎉 Herzlichen Glückwunsch!' });

            await channel.send({ embeds: [embed] });
            console.log(`🎊 Meilenstein: ${user.username} erreichte ${milestone.xp} XP (${milestone.reward})`);
        }
    }

    // Meilenstein-Rollen vergeben (automatische Erstellung falls nötig)
    async assignMilestoneRoles(guild, user, milestoneXP) {
        if (!guild) return;

        // Verwende die neue updateMilestoneRoles Funktion für konsistente Logik
        const userData = this.getUserData(user.id);
        await this.updateMilestoneRoles(guild, user, userData.totalXP);
    }

    // Neue Rekorde prüfen
    async checkNewRecords(userId, oldLevel, newLevel, oldMaxLevel, user) {
        if (!this.settings.announcements.newRecord) return;

        const userData = this.getUserData(userId);
        const currentStats = this.getStats();

        // Neues höchstes Level erreicht
        if (newLevel > oldMaxLevel && newLevel > 1) {
            await this.handleNewLevelRecord(userId, newLevel, user, userData);
        }

        // Könnte auch neue XP-Rekorde prüfen wenn gewünscht
        // if (userData.totalXP > oldMaxTotalXP) { ... }
    }

    // Neuer Level-Rekord
    async handleNewLevelRecord(userId, newLevel, user, userData) {
        const channel = this.client.channels.cache.find(ch => 
            ch.name.includes(this.settings.channels.levelUpChannel) ||
            ch.name.includes('level') ||
            ch.name.includes('general')
        );

        if (channel) {
            const rank = this.getUserRank(userId);
            
            const embed = new EmbedBuilder()
                .setTitle('🏆 NEUER SERVER REKORD!')
                .setDescription(`**${user.username}** hat als erste Person **Level ${newLevel}** erreicht!`)
                .addFields(
                    { name: '👑 Neuer Rekord', value: `**Level ${newLevel}**`, inline: true },
                    { name: '⭐ Total XP', value: `**${userData.totalXP.toLocaleString()}**`, inline: true },
                    { name: '📊 Statistiken', value: `**Rang:** #${rank || 1}\n**Nachrichten:** ${userData.messageCount}\n**Voice Zeit:** ${userData.voiceTime.toFixed(1)}min`, inline: false }
                )
                .setColor(0xFFD700) // Gold
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: '🎉 Erster auf dem Server! 🎉' });

            await channel.send({ embeds: [embed] });
            console.log(`🏆 REKORD: ${user.username} erreichte als erste Person Level ${newLevel}!`);
        }
    }

    // Level-Rollen vergeben (erweitert mit automatischer Erstellung)
    async assignLevelRoles(guild, user, level) {
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;

        // Automatische Level-Rollen (falls aktiviert)
        await this.assignAutoLevelRoles(guild, user, level);

        // Benutzerdefinierte Level-Rollen - mit "nur höchste Rolle" Logik
        await this.assignCustomLevelRoles(guild, user, level);
    }

    // Benutzerdefinierte Level-Rollen vergeben (neue separate Funktion)
    async assignCustomLevelRoles(guild, user, level) {
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;

        // Finde die höchste Level-Rolle, die der User erreicht hat
        const eligibleRoles = this.settings.rewards.levelRoles
            .filter(reward => reward.level <= level)
            .sort((a, b) => b.level - a.level); // Sortiere absteigend nach Level

        if (eligibleRoles.length === 0) return;

        const highestRole = eligibleRoles[0]; // Höchste erreichte Rolle
        const targetRole = guild.roles.cache.get(highestRole.roleId) || 
                          guild.roles.cache.find(r => r.name === highestRole.roleName);

        if (!targetRole) return;

        try {
            // Vergib die höchste Rolle falls noch nicht vorhanden
            if (!member.roles.cache.has(targetRole.id)) {
                await member.roles.add(targetRole);
                console.log(`✅ Benutzerdefinierte Level-Rolle "${targetRole.name}" vergeben an ${user.username}`);
            }

            // Entferne alle niedrigeren benutzerdefinierten Level-Rollen
            for (const oldReward of this.settings.rewards.levelRoles) {
                if (oldReward.level < highestRole.level) {
                    const oldRole = guild.roles.cache.get(oldReward.roleId) || 
                                   guild.roles.cache.find(r => r.name === oldReward.roleName);
                    
                    if (oldRole && member.roles.cache.has(oldRole.id)) {
                        await member.roles.remove(oldRole);
                        console.log(`🔄 Alte benutzerdefinierte Level-Rolle "${oldRole.name}" entfernt von ${user.username}`);
                    }
                }
            }

        } catch (error) {
            console.error(`❌ Fehler beim Verwalten der benutzerdefinierten Level-Rolle:`, error);
        }
    }

    // Alle Rollen-Systeme für einen User aktualisieren
    async updateAllUserRoles(guild, user, currentLevel) {
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;

        const userData = this.getUserData(user.id);
        const currentTotalXP = userData.totalXP;

        // 1. Automatische Level-Rollen aktualisieren
        await this.updateAutoLevelRoles(guild, user, currentLevel);

        // 2. Benutzerdefinierte Level-Rollen aktualisieren  
        await this.updateCustomLevelRoles(guild, user, currentLevel);

        // 3. Meilenstein-Rollen aktualisieren
        await this.updateMilestoneRoles(guild, user, currentTotalXP);
    }

    // Automatische Level-Rollen komplett aktualisieren
    async updateAutoLevelRoles(guild, user, currentLevel) {
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;

        const levelRoles = [
            { level: 5, name: '🔥 Level 5', color: 0xFF4500 },
            { level: 10, name: '⚡ Level 10', color: 0x1E90FF },
            { level: 15, name: '💫 Level 15', color: 0x9370DB },
            { level: 20, name: '🌟 Level 20', color: 0xFFD700 },
            { level: 25, name: '🚀 Level 25', color: 0x00FF00 },
            { level: 30, name: '🎯 Level 30', color: 0xFF1493 },
            { level: 40, name: '💎 Level 40', color: 0x00FFFF },
            { level: 50, name: '👑 Level 50', color: 0x8A2BE2 },
            { level: 75, name: '🏆 Level 75', color: 0xDC143C },
            { level: 100, name: '🔮 Level 100', color: 0x4B0082 }
        ];

        // Finde die höchste erreichte automatische Level-Rolle
        const eligibleRoles = levelRoles.filter(role => role.level <= currentLevel);
        const highestRole = eligibleRoles.length > 0 ? eligibleRoles[eligibleRoles.length - 1] : null;

        try {
            // Entferne alle automatischen Level-Rollen
            for (const roleConfig of levelRoles) {
                const role = guild.roles.cache.find(r => r.name === roleConfig.name);
                if (role && member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    console.log(`🔄 Automatische Level-Rolle "${role.name}" entfernt von ${user.username}`);
                }
            }

            // Vergib die höchste erreichte Rolle
            if (highestRole) {
                let role = guild.roles.cache.find(r => r.name === highestRole.name);
                
                // Erstelle Rolle falls sie nicht existiert
                if (!role) {
                    role = await guild.roles.create({
                        name: highestRole.name,
                        color: highestRole.color,
                        permissions: [],
                        mentionable: false,
                        reason: `XP-System: Automatische Level-Rolle für Level ${highestRole.level}`
                    });
                }

                await member.roles.add(role);
                console.log(`✅ Höchste automatische Level-Rolle "${role.name}" vergeben an ${user.username}`);
            }

        } catch (error) {
            console.error(`❌ Fehler beim Aktualisieren der automatischen Level-Rollen:`, error);
        }
    }

    // Benutzerdefinierte Level-Rollen komplett aktualisieren
    async updateCustomLevelRoles(guild, user, currentLevel) {
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;

        // Finde die höchste erreichte benutzerdefinierte Level-Rolle
        const eligibleRoles = this.settings.rewards.levelRoles
            .filter(reward => reward.level <= currentLevel)
            .sort((a, b) => b.level - a.level);

        const highestRole = eligibleRoles.length > 0 ? eligibleRoles[0] : null;

        try {
            // Entferne alle benutzerdefinierten Level-Rollen
            for (const reward of this.settings.rewards.levelRoles) {
                const role = guild.roles.cache.get(reward.roleId) || 
                           guild.roles.cache.find(r => r.name === reward.roleName);
                
                if (role && member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    console.log(`🔄 Benutzerdefinierte Level-Rolle "${role.name}" entfernt von ${user.username}`);
                }
            }

            // Vergib die höchste erreichte Rolle
            if (highestRole) {
                const role = guild.roles.cache.get(highestRole.roleId) || 
                           guild.roles.cache.find(r => r.name === highestRole.roleName);
                
                if (role) {
                    await member.roles.add(role);
                    console.log(`✅ Höchste benutzerdefinierte Level-Rolle "${role.name}" vergeben an ${user.username}`);
                }
            }

        } catch (error) {
            console.error(`❌ Fehler beim Aktualisieren der benutzerdefinierten Level-Rollen:`, error);
        }
    }

    // Meilenstein-Rollen komplett aktualisieren
    async updateMilestoneRoles(guild, user, currentTotalXP) {
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;

        const milestoneRoles = [
            { xp: 500, name: '🌱 Newcomer', color: 0x90EE90 },
            { xp: 1000, name: '💬 Aktives Mitglied', color: 0x87CEEB },
            { xp: 2500, name: '⭐ Erfahrener User', color: 0xFFD700 },
            { xp: 5000, name: '🎯 Server-Veteran', color: 0xFF6347 },
            { xp: 10000, name: '👑 Elite Member', color: 0x9932CC },
            { xp: 25000, name: '🏆 Server-Legende', color: 0xFF1493 },
            { xp: 50000, name: '💎 Diamond Member', color: 0x00FFFF }
        ];

        // Finde die höchste erreichte Meilenstein-Rolle
        const eligibleRoles = milestoneRoles.filter(role => role.xp <= currentTotalXP);
        const highestRole = eligibleRoles.length > 0 ? eligibleRoles[eligibleRoles.length - 1] : null;

        try {
            // Entferne alle Meilenstein-Rollen
            for (const roleConfig of milestoneRoles) {
                const role = guild.roles.cache.find(r => r.name === roleConfig.name);
                if (role && member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    console.log(`🔄 Meilenstein-Rolle "${role.name}" entfernt von ${user.username}`);
                }
            }

            // Vergib die höchste erreichte Rolle
            if (highestRole) {
                let role = guild.roles.cache.find(r => r.name === highestRole.name);
                
                // Erstelle Rolle falls sie nicht existiert
                if (!role) {
                    role = await guild.roles.create({
                        name: highestRole.name,
                        color: highestRole.color,
                        permissions: [],
                        mentionable: false,
                        reason: `XP-System: Automatische Meilenstein-Rolle für ${highestRole.xp} XP`
                    });
                }

                await member.roles.add(role);
                console.log(`✅ Höchste Meilenstein-Rolle "${role.name}" vergeben an ${user.username}`);
            }

        } catch (error) {
            console.error(`❌ Fehler beim Aktualisieren der Meilenstein-Rollen:`, error);
        }
    }

    // Automatische Level-Rollen vergeben (neue Funktion)
    async assignAutoLevelRoles(guild, user, level) {
        if (!guild) return;

        // Verwende die neue updateAutoLevelRoles Funktion für konsistente Logik
        await this.updateAutoLevelRoles(guild, user, level);
    }

    // Leaderboard erstellen
    getLeaderboard(limit = 10, type = 'total') {
        const sortedUsers = Array.from(this.userXP.entries()).sort((a, b) => {
            switch (type) {
                case 'total':
                    return b[1].totalXP - a[1].totalXP;
                case 'level':
                    // Erst nach Level sortieren, dann bei gleichem Level nach totalXP
                    if (b[1].level !== a[1].level) {
                        return b[1].level - a[1].level;
                    }
                    return b[1].totalXP - a[1].totalXP;
                case 'messages':
                    // Erst nach Messages, dann bei gleichen Messages nach totalXP
                    if (b[1].messageCount !== a[1].messageCount) {
                        return b[1].messageCount - a[1].messageCount;
                    }
                    return b[1].totalXP - a[1].totalXP;
                case 'voice':
                    // Erst nach Voice-Zeit, dann bei gleicher Zeit nach totalXP
                    if (b[1].voiceTime !== a[1].voiceTime) {
                        return b[1].voiceTime - a[1].voiceTime;
                    }
                    return b[1].totalXP - a[1].totalXP;
                default:
                    return b[1].totalXP - a[1].totalXP;
            }
        });

        return sortedUsers.slice(0, limit).map(([userId, data], index) => ({
            rank: index + 1,
            userId,
            ...data
        }));
    }

    // User-Rang finden
    getUserRank(userId) {
        const sortedUsers = Array.from(this.userXP.entries())
            .sort((a, b) => b[1].totalXP - a[1].totalXP);
        
        const rank = sortedUsers.findIndex(([id]) => id === userId) + 1;
        return rank > 0 ? rank : null;
    }

    // Statistiken
    getStats() {
        const allUsers = Array.from(this.userXP.values());
        
        return {
            totalUsers: allUsers.length,
            totalXP: allUsers.reduce((sum, user) => sum + user.totalXP, 0),
            totalMessages: allUsers.reduce((sum, user) => sum + user.messageCount, 0),
            totalVoiceTime: allUsers.reduce((sum, user) => sum + user.voiceTime, 0),
            averageLevel: allUsers.reduce((sum, user) => sum + user.level, 0) / allUsers.length,
            maxLevel: Math.max(...allUsers.map(user => user.level)),
            activeUsers: allUsers.filter(user => user.totalXP > 100).length
        };
    }

    // XP-Profil erstellen
    createProfileEmbed(user, userData) {
        const rank = this.getUserRank(user.id);
        const nextLevelXP = this.getXPForNextLevel(userData.level);
        const currentLevelXP = userData.xp;
        const progress = nextLevelXP > 0 ? Math.floor((currentLevelXP / nextLevelXP) * 100) : 100;
        
        const progressBar = this.createProgressBar(progress);

        const embed = new EmbedBuilder()
            .setTitle(`📊 XP-Profil: ${user.username}`)
            .setColor(parseInt(this.settings.display.embedColor.replace('0x', ''), 16))
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        // Beschreibung mit optionalem Rang
        if (this.settings.display.showRank && rank) {
            embed.setDescription(`**Rang:** #${rank}`);
        }

        // Standard Felder
        const fields = [
            { name: '📈 Level', value: `**${userData.level}**`, inline: true },
            { name: '⭐ XP', value: `**${userData.xp}** / ${nextLevelXP || 'Max'}`, inline: true },
            { name: '💎 Total XP', value: `**${userData.totalXP}**`, inline: true },
            { name: '💬 Nachrichten', value: `**${userData.messageCount}**`, inline: true },
            { name: '🎤 Voice Zeit', value: `**${userData.voiceTime.toFixed(1)}** min`, inline: true }
        ];

        // Fortschritt nur anzeigen wenn aktiviert
        if (this.settings.display.showProgress) {
            fields.push({ name: '📊 Fortschritt', value: `${progressBar} **${progress}%**`, inline: false });
        }

        embed.addFields(fields);
        return embed;
    }

    // Fortschrittsbalken erstellen
    createProgressBar(percentage, length = 20) {
        const filled = Math.floor(percentage / 100 * length);
        const empty = length - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }

    // Einstellungen aktualisieren
    updateSettings(newSettings) {
        // Deep merge für nested objects (besonders autoLeaderboard)
        this.settings = this.deepMerge(this.settings, newSettings);
        
        // Sicherstellen dass kritische Felder existieren
        if (!this.settings.autoLeaderboard.lastMessageIds) {
            this.settings.autoLeaderboard.lastMessageIds = [];
        }
        if (this.settings.autoLeaderboard.autoDeleteOld === undefined) {
            this.settings.autoLeaderboard.autoDeleteOld = true;
        }
        if (!Array.isArray(this.settings.autoLeaderboard.types)) {
            this.settings.autoLeaderboard.types = ['total'];
        }
        
        console.log('🔄 XP-Settings aktualisiert:');
        console.log('  - Auto-Leaderboard aktiviert:', this.settings.autoLeaderboard.enabled);
        console.log('  - Auto-Delete aktiviert:', this.settings.autoLeaderboard.autoDeleteOld);
        console.log('  - Channel:', this.settings.autoLeaderboard.channelName);
        console.log('  - Zeit:', this.settings.autoLeaderboard.time);
        console.log('  - Typen:', this.settings.autoLeaderboard.types);
        console.log('  - Gespeicherte Message-IDs:', this.settings.autoLeaderboard.lastMessageIds?.length || 0);
        
        this.saveData();
    }
    
    // Helper für deep merge
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    // User XP setzen (Admin-Funktion)
    setUserXP(userId, xp) {
        const userData = this.getUserData(userId);
        userData.xp = xp;
        userData.totalXP = xp;
        userData.level = this.calculateLevel(xp);
        this.userXP.set(userId, userData);
        this.saveData();
    }

    // User XP zurücksetzen
    async resetUser(userId) {
        try {
            let userFound = false;
            let rolesRemoved = 0;

            // Prüfen ob User existiert
            if (this.userXP.has(userId)) {
                userFound = true;
                const userData = this.userXP.get(userId);
                console.log(`🔍 User ${userId} gefunden: Level ${userData.level}, ${userData.totalXP} Total XP`);

                // Discord-Rollen entfernen (falls Client verfügbar)
                if (this.client) {
                    try {
                        // Über alle Guilds iterieren wo der Bot ist
                        for (const guild of this.client.guilds.cache.values()) {
                            try {
                                const member = await guild.members.fetch(userId).catch(() => null);
                                if (member) {
                                    console.log(`👤 User ${userId} gefunden in Guild: ${guild.name}`);
                                    
                                    // Level-Rollen entfernen
                                    const levelRolesToRemove = [];
                                    for (const reward of this.settings.rewards.levelRoles) {
                                        if (member.roles.cache.has(reward.roleId)) {
                                            levelRolesToRemove.push(reward.roleId);
                                        }
                                    }
                                    
                                    // Auto-Level-Rollen entfernen (falls vorhanden)
                                    const autoRoles = member.roles.cache.filter(role => 
                                        role.name.includes('Level') || 
                                        role.name.includes('XP') ||
                                        role.name.toLowerCase().includes('level')
                                    );
                                    
                                    // Meilenstein-Rollen finden und entfernen
                                    const milestoneRolesToRemove = member.roles.cache.filter(role => {
                                        const milestoneNames = [
                                            'newcomer', 'aktives mitglied', 'erfahrener user', 
                                            'server-veteran', 'elite member', 'server-legende', 
                                            'diamond member', 'level', 'xp'
                                        ];
                                        return milestoneNames.some(name => 
                                            role.name.toLowerCase().includes(name)
                                        );
                                    });

                                    // Alle XP-bezogenen Rollen sammeln
                                    const allRolesToRemove = new Set([
                                        ...levelRolesToRemove,
                                        ...autoRoles.map(r => r.id),
                                        ...milestoneRolesToRemove.map(r => r.id)
                                    ]);

                                    // Rollen entfernen
                                    for (const roleId of allRolesToRemove) {
                                        try {
                                            await member.roles.remove(roleId);
                                            const role = guild.roles.cache.get(roleId);
                                            console.log(`🗑️ Rolle entfernt: ${role?.name || roleId} in ${guild.name}`);
                                            rolesRemoved++;
                                        } catch (roleError) {
                                            console.error(`❌ Fehler beim Entfernen der Rolle ${roleId}:`, roleError.message);
                                        }
                                    }
                                }
                            } catch (guildError) {
                                console.log(`⚠️ Konnte User ${userId} nicht in Guild ${guild.name} finden`);
                            }
                        }
                    } catch (clientError) {
                        console.error(`❌ Fehler beim Discord-Rollen-Reset:`, clientError);
                    }
                }

                // Aus lokalem Cache und JSON entfernen
                console.log(`🗑️ Entferne User ${userId} aus Memory-Cache...`);
                console.log(`📋 Vor Löschung: ${this.userXP.size} User im Cache`);
                this.userXP.delete(userId);
                console.log(`📋 Nach Löschung: ${this.userXP.size} User im Cache`);
                
                console.log(`💾 Speichere aktualisierte Daten in JSON...`);
                // Forcierte Speicherung mit mehrfacher Verifikation
                await this.forceSaveData(userId);
                
                // Mehrfache Verifikation: JSON-Datei prüfen
                setTimeout(async () => {
                    await this.verifyUserRemoval(userId);
                }, 100);
                
                // Zusätzliche Verifikation nach 2 Sekunden
                setTimeout(async () => {
                    await this.verifyUserRemoval(userId, true);
                }, 2000);
                
                console.log(`✅ User ${userId} aus XP-System entfernt`);
                console.log(`✅ ${rolesRemoved} Discord-Rollen entfernt`);
                
                return { 
                    success: true, 
                    message: `User erfolgreich zurückgesetzt. ${rolesRemoved} Rollen entfernt.`,
                    rolesRemoved 
                };
            } else {
                console.log(`⚠️ User ${userId} nicht im XP-System gefunden`);
                return { success: false, error: 'User nicht im XP-System gefunden' };
            }
        } catch (error) {
            console.error(`❌ Fehler beim Zurücksetzen von User ${userId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Alle XP zurücksetzen
    async resetAll() {
        try {
            const userCount = this.userXP.size;
            let totalRolesRemoved = 0;

            // Alle Discord-Rollen entfernen (falls Client verfügbar)
            if (this.client) {
                try {
                    for (const guild of this.client.guilds.cache.values()) {
                        console.log(`🔍 Prüfe Guild: ${guild.name}`);
                        
                        for (const [userId] of this.userXP) {
                            try {
                                const member = await guild.members.fetch(userId).catch(() => null);
                                if (member) {
                                    // XP-bezogene Rollen finden und entfernen
                                    const rolesToRemove = member.roles.cache.filter(role => {
                                        const xpRoleNames = [
                                            'level', 'xp', 'newcomer', 'aktives mitglied', 
                                            'erfahrener user', 'server-veteran', 'elite member', 
                                            'server-legende', 'diamond member'
                                        ];
                                        return xpRoleNames.some(name => 
                                            role.name.toLowerCase().includes(name)
                                        );
                                    });

                                    for (const role of rolesToRemove.values()) {
                                        try {
                                            await member.roles.remove(role);
                                            console.log(`🗑️ Rolle entfernt: ${role.name} von ${member.user.username}`);
                                            totalRolesRemoved++;
                                        } catch (roleError) {
                                            console.error(`❌ Fehler beim Entfernen der Rolle ${role.name}:`, roleError.message);
                                        }
                                    }
                                }
                            } catch (memberError) {
                                // User nicht in dieser Guild gefunden - normal
                            }
                        }
                    }
                } catch (clientError) {
                    console.error(`❌ Fehler beim Entfernen aller Discord-Rollen:`, clientError);
                }
            }

            // Lokalen Cache leeren
            this.userXP.clear();
            this.saveData();
            
            console.log(`✅ ${userCount} User aus XP-System entfernt`);
            console.log(`✅ ${totalRolesRemoved} Discord-Rollen entfernt`);
            
            return { 
                success: true, 
                usersCleared: userCount, 
                rolesRemoved: totalRolesRemoved,
                message: `${userCount} User und ${totalRolesRemoved} Rollen erfolgreich entfernt.`
            };
        } catch (error) {
            console.error(`❌ Fehler beim Zurücksetzen aller XP-Daten:`, error);
            return { success: false, error: error.message };
        }
    }

    // Automatisches Leaderboard erstellen und posten (Verbessertes Design)
    async createAutoLeaderboardEmbed(type = 'total', limit = 10) {
        const leaderboard = this.getLeaderboard(limit, type);
        
        const typeNames = {
            total: '🏆 XP Leaderboard',
            level: '📈 Level Ranking',
            messages: '💬 Message Champions',
            voice: '🎤 Voice Heroes'
        };

        const embed = new EmbedBuilder()
            .setTitle(`${typeNames[type]}`)
            .setColor(parseInt(this.settings.display.embedColor.replace('0x', ''), 16))
            .setTimestamp()
            .setFooter({ text: `Top ${limit} • ${new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` });

        if (leaderboard.length === 0) {
            embed.setDescription('🌟 **Noch keine Daten verfügbar**\n\nBeginn dein XP-Abenteuer jetzt und klettere die Rangliste hoch!');
            return embed;
        }

        // Schönes Card-Design für Top 3
        let topDescription = '';
        leaderboard.slice(0, Math.min(3, leaderboard.length)).forEach((user, index) => {
            const medals = ['🥇', '🥈', '🥉'];
            const medal = medals[index];
            
            let mainValue = '';
            let subValue = '';
            switch (type) {
                case 'total':
                    mainValue = `${user.totalXP.toLocaleString()} XP`;
                    subValue = `Level ${user.level}`;
                    break;
                case 'level':
                    mainValue = `Level ${user.level}`;
                    subValue = `${user.totalXP.toLocaleString()} XP`;
                    break;
                case 'messages':
                    mainValue = `${user.messageCount.toLocaleString()} Messages`;
                    subValue = `Level ${user.level}`;
                    break;
                case 'voice':
                    mainValue = `${user.voiceTime.toFixed(1)} Minuten`;
                    subValue = `Level ${user.level}`;
                    break;
            }
            
            topDescription += `${medal} **${user.username}**\n`;
            topDescription += `**${mainValue}** • *${subValue}*\n\n`;
        });

        embed.setDescription(topDescription);

        // Weitere Plätze als kompakte Liste
        if (leaderboard.length > 3) {
            let remainingUsers = '';
            leaderboard.slice(3, Math.min(limit, leaderboard.length)).forEach((user, index) => {
                const rank = index + 4;
                
                let value = '';
                switch (type) {
                    case 'total':
                        value = `${user.totalXP.toLocaleString()} XP`;
                        break;
                    case 'level':
                        value = `Level ${user.level}`;
                        break;
                    case 'messages':
                        value = `${user.messageCount.toLocaleString()} Messages`;
                        break;
                    case 'voice':
                        value = `${user.voiceTime.toFixed(1)} min`;
                        break;
                }
                
                remainingUsers += `**${rank}.** ${user.username} • ${value}\n`;
            });

            if (remainingUsers) {
                embed.addFields({
                    name: '📋 Weitere Platzierungen',
                    value: remainingUsers,
                    inline: false
                });
            }
        }

        return embed;
    }

    // Prüfen ob automatisches Leaderboard gepostet werden soll (Uhrzeit-basiert)
    shouldPostAutoLeaderboard() {
        if (!this.settings.autoLeaderboard.enabled) {
            console.log('🔍 Auto-Leaderboard: Deaktiviert');
            return false;
        }
        
        try {
            const now = new Date();
            const timezone = this.settings.autoLeaderboard.timezone || 'Europe/Berlin';
            
            // Konvertiere aktuelle Zeit zur konfigurierten Zeitzone
            const nowInTimezone = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
            
            // Parse die konfigurierte Zeit
            const [targetHour, targetMinute] = this.settings.autoLeaderboard.time.split(':').map(Number);
            
            // Erstelle Target-Zeit für heute
            const todayTarget = new Date(nowInTimezone);
            todayTarget.setHours(targetHour, targetMinute, 0, 0);
            
            // Prüfe ob wir seit dem letzten Post die Target-Zeit erreicht haben
            const lastPosted = new Date(this.settings.autoLeaderboard.lastPosted);
            
            // Debug-Ausgaben
            console.log('🔍 Auto-Leaderboard Zeitprüfung:');
            console.log('  - Aktuelle Zeit:', nowInTimezone.toLocaleString('de-DE'));
            console.log('  - Ziel-Zeit heute:', todayTarget.toLocaleString('de-DE'));
            console.log('  - Letztes Posting:', lastPosted.toLocaleString('de-DE'));
            console.log('  - Zeit erreicht:', nowInTimezone >= todayTarget);
            console.log('  - Noch nicht heute gepostet:', lastPosted < todayTarget);
            
            // Wenn die Ziel-Zeit erreicht wurde und wir heute noch nicht gepostet haben
            if (nowInTimezone >= todayTarget && lastPosted < todayTarget) {
                console.log('✅ Auto-Leaderboard sollte gepostet werden!');
                return true;
            }
            
            console.log('❌ Auto-Leaderboard Bedingungen nicht erfüllt');
            return false;
            
        } catch (error) {
            console.error('❌ Fehler bei Auto-Leaderboard Zeitprüfung:', error);
            return false;
        }
    }

    // Automatisches Leaderboard posten
    async postAutoLeaderboard() {
        if (!this.shouldPostAutoLeaderboard()) return false;
        if (!this.client.isReady()) return false;

        try {
            // Finde den konfigurierten Channel
            let targetChannel = null;
            for (const guild of this.client.guilds.cache.values()) {
                targetChannel = guild.channels.cache.find(ch => 
                    ch.name === this.settings.autoLeaderboard.channelName && ch.type === 0
                );
                if (targetChannel) break;
            }

            if (!targetChannel) {
                console.warn(`⚠️ Auto-Leaderboard Channel "${this.settings.autoLeaderboard.channelName}" nicht gefunden`);
                return false;
            }

            // 🗑️ VERBESSERTE LÖSCHLOGIK - LÖSCHT GARANTIERT ALLE ALTEN LEADERBOARDS
            if (this.settings.autoLeaderboard.autoDeleteOld) {
                console.log('🗑️ Starte intelligente Leaderboard-Bereinigung (Auto-Delete aktiviert)...');
                
                let deletedCount = 0;
                
                // Schritt 1: Lösche gespeicherte Message-IDs
                if (this.settings.autoLeaderboard.lastMessageIds && 
                    this.settings.autoLeaderboard.lastMessageIds.length > 0) {
                    console.log(`🔍 Lösche ${this.settings.autoLeaderboard.lastMessageIds.length} gespeicherte Message-IDs...`);
                    
                    for (const messageId of this.settings.autoLeaderboard.lastMessageIds) {
                        try {
                            const oldMessage = await targetChannel.messages.fetch(messageId);
                            if (oldMessage) {
                                await oldMessage.delete();
                                deletedCount++;
                                console.log(`✅ Gespeicherte Leaderboard-Message gelöscht: ${messageId}`);
                            }
                        } catch (error) {
                            console.log(`⚠️ Gespeicherte Message nicht löschbar (bereits gelöscht?): ${messageId}`);
                        }
                    }
                }
                
                // Schritt 2: Aggressive Bereinigung aller Bot-Leaderboard-Messages
                try {
                    console.log('🧹 Starte aggressive Bereinigung aller Leaderboard-Messages...');
                    const recentMessages = await targetChannel.messages.fetch({ limit: 50 });
                    
                    const leaderboardMessages = recentMessages.filter(msg => {
                        if (msg.author.id !== this.client.user.id) return false;
                        if (!msg.embeds || msg.embeds.length === 0) return false;
                        
                        // Prüfe auf Leaderboard-Keywords in Titel oder Beschreibung
                        return msg.embeds.some(embed => {
                            const title = embed.title || '';
                            const description = embed.description || '';
                            const footerText = embed.footer?.text || '';
                            
                            return title.includes('Leaderboard') || 
                                   title.includes('Ranking') || 
                                   title.includes('Champions') ||
                                   title.includes('Heroes') ||
                                   description.includes('🥇') ||
                                   description.includes('🥈') ||
                                   description.includes('🥉') ||
                                   footerText.includes('Top ');
                        });
                    });
                    
                    if (leaderboardMessages.size > 0) {
                        console.log(`🔍 ${leaderboardMessages.size} Leaderboard-Messages zur Löschung gefunden`);
                        
                        for (const [messageId, message] of leaderboardMessages) {
                            try {
                                await message.delete();
                                deletedCount++;
                                console.log(`🗑️ Leaderboard-Message gelöscht: ${messageId}`);
                                
                                // Kurze Pause zwischen Löschvorgängen (Rate Limit Schutz)
                                await new Promise(resolve => setTimeout(resolve, 100));
                            } catch (deleteError) {
                                console.log(`⚠️ Fehler beim Löschen von Message ${messageId}:`, deleteError.message);
                            }
                        }
                    }
                    
                    console.log(`✅ Leaderboard-Bereinigung abgeschlossen: ${deletedCount} Messages gelöscht`);
                    
                } catch (error) {
                    console.log('⚠️ Fehler bei der Leaderboard-Bereinigung:', error.message);
                }
            } else {
                console.log('ℹ️ Auto-Delete deaktiviert - keine Bereinigung alter Leaderboards');
            }

            // Erstelle und poste Leaderboards für alle ausgewählten Typen
            const embeds = [];
            for (const type of this.settings.autoLeaderboard.types) {
                const embed = await this.createAutoLeaderboardEmbed(
                    type,
                    this.settings.autoLeaderboard.limit
                );
                embeds.push(embed);
            }

            // Array um neue Message-IDs zu speichern
            const newMessageIds = [];

            // Poste alle Leaderboards (bis zu 10 Embeds pro Message)
            if (embeds.length > 0) {
                const message1 = await targetChannel.send({ embeds: embeds.slice(0, 10) });
                newMessageIds.push(message1.id);
                
                // Falls mehr als 10 Embeds, poste weitere Messages
                for (let i = 10; i < embeds.length; i += 10) {
                    const additionalMessage = await targetChannel.send({ embeds: embeds.slice(i, i + 10) });
                    newMessageIds.push(additionalMessage.id);
                }
            }

            // Update den letzten Post-Zeitpunkt und speichere die neuen Message-IDs
            this.settings.autoLeaderboard.lastPosted = Date.now();
            this.settings.autoLeaderboard.lastMessageIds = newMessageIds;
            this.saveData();

            console.log(`📊 Automatische Leaderboards gepostet in #${targetChannel.name} (${this.settings.autoLeaderboard.types.length} Typen)`);
            console.log(`💾 Neue Message-IDs gespeichert: ${newMessageIds.join(', ')}`);
            return true;

        } catch (error) {
            console.error('❌ Fehler beim automatischen Leaderboard-Posting:', error);
            return false;
        }
    }

    // Debug: Alle User im System anzeigen
    debugListAllUsers() {
        console.log(`\n🔍 === XP-SYSTEM DEBUG INFO ===`);
        console.log(`📊 Total User im Memory-Cache: ${this.userXP.size}`);
        
        if (this.userXP.size > 0) {
            console.log(`👥 User im Cache:`);
            for (const [userId, userData] of this.userXP) {
                console.log(`  - ${userId}: ${userData.username} (Level ${userData.level}, ${userData.totalXP} XP)`);
            }
        }
        
        // JSON-Datei prüfen
        try {
            if (fs.existsSync('./xp-data.json')) {
                const jsonContent = fs.readFileSync('./xp-data.json', 'utf8');
                const parsedData = JSON.parse(jsonContent);
                console.log(`📄 User in JSON-Datei: ${parsedData.length}`);
                
                if (parsedData.length > 0) {
                    console.log(`👥 User in JSON:`);
                    parsedData.forEach(user => {
                        console.log(`  - ${user.userId}: ${user.username} (Level ${user.level}, ${user.totalXP} XP)`);
                    });
                }
            } else {
                console.log(`❌ xp-data.json existiert nicht`);
            }
        } catch (error) {
            console.error(`❌ Fehler beim Lesen der JSON-Datei:`, error);
        }
        
        console.log(`=== DEBUG INFO ENDE ===\n`);
    }
    // Forcierte Speicherung mit Backup
    async forceSaveData(userId = null) {
        try {
            const backupFile = `./xp-data-backup-${Date.now()}.json`;
            
            // Backup der aktuellen Datei erstellen
            if (fs.existsSync('./xp-data.json')) {
                const currentData = fs.readFileSync('./xp-data.json', 'utf8');
                fs.writeFileSync(backupFile, currentData);
                console.log(`💾 Backup erstellt: ${backupFile}`);
            }
            
            // User-Daten speichern (ohne den zu löschenden User)
            const xpData = Array.from(this.userXP.entries())
                .filter(([id]) => !userId || id !== userId)
                .map(([userId, data]) => ({
                    userId,
                    ...data
                }));
            
            console.log(`💾 Forcierte Speicherung: ${xpData.length} User (${userId ? `ohne ${userId}` : 'alle'})`);
            
            // Datei überschreiben
            fs.writeFileSync('./xp-data.json', JSON.stringify(xpData, null, 2));
            
            // Sofortige Verifikation
            const savedData = JSON.parse(fs.readFileSync('./xp-data.json', 'utf8'));
            console.log(`✅ Datei gespeichert und verifiziert: ${savedData.length} User`);
            
            if (userId) {
                const userStillExists = savedData.some(user => user.userId === userId);
                if (userStillExists) {
                    console.error(`❌ WARNUNG: User ${userId} immer noch in gespeicherter Datei!`);
                    // Nochmaliger Versuch
                    const filteredData = savedData.filter(user => user.userId !== userId);
                    fs.writeFileSync('./xp-data.json', JSON.stringify(filteredData, null, 2));
                    console.log(`🔄 Zweiter Speicherversuch: ${filteredData.length} User`);
                } else {
                    console.log(`✅ User ${userId} erfolgreich aus JSON entfernt`);
                }
            }
            
        } catch (error) {
            console.error('❌ Fehler bei forcierter Speicherung:', error);
            throw error;
        }
    }
    
    // User-Entfernung verifizieren
    async verifyUserRemoval(userId, final = false) {
        try {
            const prefix = final ? '🔍 FINALE VERIFIKATION' : '🔍 Verifikation';
            console.log(`${prefix}: Prüfe ob User ${userId} entfernt wurde...`);
            
            // Memory-Cache prüfen
            const inMemory = this.userXP.has(userId);
            console.log(`📋 User in Memory: ${inMemory ? '❌ JA' : '✅ NEIN'}`);
            
            // JSON-Datei prüfen
            if (fs.existsSync('./xp-data.json')) {
                const jsonContent = fs.readFileSync('./xp-data.json', 'utf8');
                const parsedData = JSON.parse(jsonContent);
                const inJSON = parsedData.some(user => user.userId === userId);
                console.log(`📄 User in JSON: ${inJSON ? '❌ JA' : '✅ NEIN'}`);
                console.log(`📊 JSON-Datei enthält ${parsedData.length} User insgesamt`);
                
                // Bei finaler Verifikation: nochmaliger Cleanup-Versuch
                if (final && inJSON) {
                    console.log(`🧹 FINAL CLEANUP: Entferne User ${userId} nochmals...`);
                    const cleanedData = parsedData.filter(user => user.userId !== userId);
                    fs.writeFileSync('./xp-data.json', JSON.stringify(cleanedData, null, 2));
                    console.log(`✅ Final cleanup: ${cleanedData.length} User verbleibend`);
                }
                
                if (!inMemory && !inJSON) {
                    console.log(`✅ ${prefix}: User ${userId} erfolgreich entfernt!`);
                } else {
                    console.error(`❌ ${prefix}: User ${userId} noch gefunden! Memory: ${inMemory}, JSON: ${inJSON}`);
                }
            } else {
                console.log(`📄 xp-data.json existiert nicht`);
            }
            
        } catch (error) {
            console.error(`❌ Fehler bei Verifikation:`, error);
        }
    }
}

module.exports = XPSystem; 