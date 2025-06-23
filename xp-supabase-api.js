/**
 * XP System Supabase API
 * Handles all database operations for the XP system
 */

const { createClient } = require('@supabase/supabase-js');

class XPSupabaseAPI {
    constructor() {
        // Supabase Client initialisieren
        this.supabase = createClient(
            process.env.SUPABASE_URL || '',
            process.env.SUPABASE_ANON_KEY || ''
        );
        
        // Cache für Settings um häufige DB-Zugriffe zu vermeiden
        this.settingsCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 Minuten Cache
        this.lastCacheUpdate = 0;
        
        console.log('✅ XP Supabase API initialisiert');
    }

    // =============================================
    // SETTINGS MANAGEMENT
    // =============================================

    async loadSettings() {
        try {
            // Cache prüfen
            const now = Date.now();
            if (now - this.lastCacheUpdate < this.cacheExpiry && this.settingsCache.size > 0) {
                return this.buildSettingsObject();
            }

            // Settings aus DB laden
            const { data, error } = await this.supabase
                .from('xp_settings')
                .select('setting_key, setting_value');

            if (error) {
                console.error('❌ Fehler beim Laden der XP-Settings:', error);
                return this.getDefaultSettings();
            }

            // Cache aktualisieren
            this.settingsCache.clear();
            data.forEach(setting => {
                this.settingsCache.set(setting.setting_key, setting.setting_value);
            });
            this.lastCacheUpdate = now;

            return this.buildSettingsObject();
        } catch (error) {
            console.error('❌ Fehler beim Laden der Settings:', error);
            return this.getDefaultSettings();
        }
    }

    buildSettingsObject() {
        const settings = {
            enabled: this.settingsCache.get('system')?.enabled || true,
            messageXP: this.settingsCache.get('messageXP') || { min: 5, max: 15, cooldown: 60000 },
            voiceXP: this.settingsCache.get('voiceXP') || { baseXP: 2, afkChannelXP: 0, soloChannelXP: 1, cooldown: 60000, intervalMinutes: 1 },
            levelSystem: this.settingsCache.get('levelSystem') || { baseXP: 100, multiplier: 1.5, maxLevel: 100 },
            channels: this.settingsCache.get('channels') || { levelUpChannel: 'level-up', leaderboardChannel: 'leaderboard' },
            autoLeaderboard: this.settingsCache.get('autoLeaderboard') || { enabled: true, time: '20:00', timezone: 'Europe/Berlin', channelName: 'leaderboard', types: ['total'], limit: 10, lastPosted: 0, autoDeleteOld: true },
            announcements: this.settingsCache.get('announcements') || { levelUp: true, milestones: true, newRecord: true },
            display: this.settingsCache.get('display') || { showRank: true, showProgress: true, embedColor: '0x00FF7F', leaderboardSize: 10 },
            levelUpEmbed: this.settingsCache.get('levelUpEmbed') || { enabled: true, title: '🎉 Level Up!', color: '0x00FF7F', animation: { enabled: true, style: 'celebration', duration: 5000 }, fields: { showStats: true, showNextLevel: true, showRank: true, customMessage: '' }, footer: { enabled: true, text: '🎉 Herzlichen Glückwunsch!' } },
            rewards: {
                levelRoles: [],
                milestoneRewards: []
            }
        };

        return settings;
    }

    async saveSettings(newSettings) {
        try {
            // Cache invalidieren
            this.settingsCache.clear();
            this.lastCacheUpdate = 0;

            // Verschiedene Settings-Bereiche separat speichern
            const updates = [
                { key: 'system', value: { enabled: newSettings.enabled } },
                { key: 'messageXP', value: newSettings.messageXP },
                { key: 'voiceXP', value: newSettings.voiceXP },
                { key: 'levelSystem', value: newSettings.levelSystem },
                { key: 'channels', value: newSettings.channels },
                { key: 'autoLeaderboard', value: newSettings.autoLeaderboard },
                { key: 'announcements', value: newSettings.announcements },
                { key: 'display', value: newSettings.display },
                { key: 'levelUpEmbed', value: newSettings.levelUpEmbed }
            ];

            // Batch-Update für bessere Performance
            for (const update of updates) {
                const { error } = await this.supabase
                    .from('xp_settings')
                    .upsert({
                        setting_key: update.key,
                        setting_value: update.value,
                        updated_at: new Date().toISOString()
                    });

                if (error) {
                    console.error(`❌ Fehler beim Speichern von ${update.key}:`, error);
                }
            }

            // Channel-Blacklists separat behandeln
            await this.updateChannelBlacklists(newSettings.channels);

            // Level-Rollen und Meilensteine separat behandeln
            if (newSettings.rewards) {
                await this.updateLevelRoles(newSettings.rewards.levelRoles);
                await this.updateMilestoneRewards(newSettings.rewards.milestoneRewards);
            }

            console.log('✅ XP-Settings erfolgreich gespeichert');
            return { success: true };
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Settings:', error);
            return { success: false, error: error.message };
        }
    }

    getDefaultSettings() {
        return {
            enabled: true,
            messageXP: { min: 5, max: 15, cooldown: 60000 },
            voiceXP: { baseXP: 2, afkChannelXP: 0, soloChannelXP: 1, cooldown: 60000, intervalMinutes: 1 },
            levelSystem: { baseXP: 100, multiplier: 1.5, maxLevel: 100 },
            channels: { levelUpChannel: 'level-up', leaderboardChannel: 'leaderboard', xpBlacklist: [], voiceBlacklist: [] },
            autoLeaderboard: { enabled: true, time: '20:00', timezone: 'Europe/Berlin', channelName: 'leaderboard', types: ['total'], limit: 10, lastPosted: 0, autoDeleteOld: true },
            rewards: { levelRoles: [], milestoneRewards: [] },
            announcements: { levelUp: true, milestones: true, newRecord: true },
            display: { showRank: true, showProgress: true, embedColor: '0x00FF7F', leaderboardSize: 10 },
            levelUpEmbed: { enabled: true, title: '🎉 Level Up!', color: '0x00FF7F', animation: { enabled: true, style: 'celebration', duration: 5000 }, fields: { showStats: true, showNextLevel: true, showRank: true, customMessage: '' }, footer: { enabled: true, text: '🎉 Herzlichen Glückwunsch!' } }
        };
    }

    // =============================================
    // USER DATA MANAGEMENT
    // =============================================

    async getUserData(userId) {
        try {
            const { data, error } = await this.supabase
                .from('xp_users')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('❌ Fehler beim Laden der User-Daten:', error);
                return this.createDefaultUserData(userId);
            }

            if (!data) {
                return this.createDefaultUserData(userId);
            }

            return {
                xp: parseInt(data.xp || 0),
                level: parseInt(data.level || 1),
                totalXP: parseInt(data.total_xp || 0),
                lastMessage: parseInt(data.last_message_time || 0),
                voiceJoinTime: parseInt(data.voice_join_time || 0),
                messageCount: parseInt(data.message_count || 0),
                voiceTime: parseFloat(data.voice_time || 0),
                username: data.username || 'Unbekannt',
                avatar: data.avatar || null
            };
        } catch (error) {
            console.error('❌ Fehler beim Laden der User-Daten:', error);
            return this.createDefaultUserData(userId);
        }
    }

    createDefaultUserData(userId) {
        return {
            xp: 0,
            level: 1,
            totalXP: 0,
            lastMessage: 0,
            voiceJoinTime: 0,
            messageCount: 0,
            voiceTime: 0,
            username: 'Unbekannt',
            avatar: null
        };
    }

    async saveUserData(userId, userData) {
        try {
            const { error } = await this.supabase
                .from('xp_users')
                .upsert({
                    user_id: userId,
                    username: userData.username || 'Unbekannt',
                    avatar: userData.avatar || null,
                    level: userData.level || 1,
                    total_xp: userData.totalXP || userData.xp || 0,
                    xp: userData.xp || 0,
                    message_count: userData.messageCount || 0,
                    voice_time: userData.voiceTime || 0,
                    last_message_time: userData.lastMessage || 0,
                    voice_join_time: userData.voiceJoinTime || 0,
                    last_voice_xp: userData.lastVoiceXP || 0,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error(`❌ Fehler beim Speichern der User-Daten für ${userId}:`, error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            console.error(`❌ Fehler beim Speichern der User-Daten für ${userId}:`, error);
            return { success: false, error: error.message };
        }
    }

    async getAllUsers() {
        try {
            const { data, error } = await this.supabase
                .from('xp_users')
                .select('*')
                .order('total_xp', { ascending: false });

            if (error) {
                console.error('❌ Fehler beim Laden aller User:', error);
                return [];
            }

            return data.map(user => ({
                userId: user.user_id,
                xp: parseInt(user.xp || 0),
                level: parseInt(user.level || 1),
                totalXP: parseInt(user.total_xp || 0),
                lastMessage: parseInt(user.last_message_time || 0),
                voiceJoinTime: parseInt(user.voice_join_time || 0),
                messageCount: parseInt(user.message_count || 0),
                voiceTime: parseFloat(user.voice_time || 0),
                username: user.username || 'Unbekannt',
                avatar: user.avatar || null
            }));
        } catch (error) {
            console.error('❌ Fehler beim Laden aller User:', error);
            return [];
        }
    }

    async setUserXP(userId, xp) {
        try {
            const { error } = await this.supabase
                .from('xp_users')
                .upsert({
                    user_id: userId,
                    total_xp: xp,
                    xp: xp,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error(`❌ Fehler beim Setzen der XP für ${userId}:`, error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            console.error(`❌ Fehler beim Setzen der XP für ${userId}:`, error);
            return { success: false, error: error.message };
        }
    }

    async resetUser(userId) {
        try {
            const { error } = await this.supabase
                .from('xp_users')
                .delete()
                .eq('user_id', userId);

            if (error) {
                console.error(`❌ Fehler beim Zurücksetzen von User ${userId}:`, error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            console.error(`❌ Fehler beim Zurücksetzen von User ${userId}:`, error);
            return { success: false, error: error.message };
        }
    }

    async resetAllUsers() {
        try {
            const { error } = await this.supabase
                .from('xp_users')
                .delete()
                .not('user_id', 'is', null); // Löscht alle Einträge

            if (error) {
                console.error('❌ Fehler beim Zurücksetzen aller User:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            console.error('❌ Fehler beim Zurücksetzen aller User:', error);
            return { success: false, error: error.message };
        }
    }

    // =============================================
    // LEADERBOARD & STATISTICS
    // =============================================

    async getLeaderboard(limit = 10, type = 'total') {
        try {
            let orderBy;
            switch (type) {
                case 'level':
                    orderBy = [{ column: 'level', ascending: false }, { column: 'total_xp', ascending: false }];
                    break;
                case 'messages':
                    orderBy = [{ column: 'message_count', ascending: false }, { column: 'total_xp', ascending: false }];
                    break;
                case 'voice':
                    orderBy = [{ column: 'voice_time', ascending: false }, { column: 'total_xp', ascending: false }];
                    break;
                default: // 'total'
                    orderBy = [{ column: 'total_xp', ascending: false }];
            }

            const { data, error } = await this.supabase
                .from('xp_users')
                .select('*')
                .gt('total_xp', 0)
                .order(orderBy[0].column, { ascending: orderBy[0].ascending })
                .limit(limit);

            if (error) {
                console.error('❌ Fehler beim Laden des Leaderboards:', error);
                return [];
            }

            return data.map((user, index) => ({
                rank: index + 1,
                userId: user.user_id,
                username: user.username || 'Unbekannt',
                level: parseInt(user.level || 1),
                totalXP: parseInt(user.total_xp || 0),
                messageCount: parseInt(user.message_count || 0),
                voiceTime: parseFloat(user.voice_time || 0),
                xp: parseInt(user.xp || 0)
            }));
        } catch (error) {
            console.error('❌ Fehler beim Laden des Leaderboards:', error);
            return [];
        }
    }

    async getUserRank(userId) {
        try {
            // Verwende die xp_leaderboard View für bessere Performance
            const { data, error } = await this.supabase
                .from('xp_leaderboard')
                .select('rank, user_id')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error(`❌ Fehler beim Laden des Rangs für ${userId}:`, error);
                return null;
            }

            return data ? data.rank : null;
        } catch (error) {
            console.error(`❌ Fehler beim Laden des Rangs für ${userId}:`, error);
            return null;
        }
    }

    async getStats() {
        try {
            const { data, error } = await this.supabase
                .from('xp_users')
                .select('level, total_xp, message_count, voice_time')
                .gt('total_xp', 0);

            if (error) {
                console.error('❌ Fehler beim Laden der Statistiken:', error);
                return {
                    totalUsers: 0,
                    totalXP: 0,
                    totalMessages: 0,
                    totalVoiceTime: 0,
                    averageLevel: 0,
                    maxLevel: 0,
                    activeUsers: 0
                };
            }

            const totalUsers = data.length;
            const activeUsers = data.filter(user => user.total_xp > 100).length;
            const totalXP = data.reduce((sum, user) => sum + parseInt(user.total_xp || 0), 0);
            const totalMessages = data.reduce((sum, user) => sum + parseInt(user.message_count || 0), 0);
            const totalVoiceTime = data.reduce((sum, user) => sum + parseFloat(user.voice_time || 0), 0);
            const averageLevel = totalUsers > 0 ? data.reduce((sum, user) => sum + parseInt(user.level || 0), 0) / totalUsers : 0;
            const maxLevel = data.length > 0 ? Math.max(...data.map(user => parseInt(user.level || 0))) : 0;

            return {
                totalUsers,
                totalXP,
                totalMessages,
                totalVoiceTime,
                averageLevel,
                maxLevel,
                activeUsers
            };
        } catch (error) {
            console.error('❌ Fehler beim Laden der Statistiken:', error);
            return {
                totalUsers: 0,
                totalXP: 0,
                totalMessages: 0,
                totalVoiceTime: 0,
                averageLevel: 0,
                maxLevel: 0,
                activeUsers: 0
            };
        }
    }

    // =============================================
    // LEVEL ROLES MANAGEMENT
    // =============================================

    async updateLevelRoles(levelRoles, guildId = 'default') {
        try {
            // Zuerst alle custom Level-Rollen für diese Guild löschen
            await this.supabase
                .from('xp_level_roles')
                .delete()
                .eq('guild_id', guildId)
                .eq('is_auto_role', false);

            // Neue Level-Rollen einfügen
            if (levelRoles && levelRoles.length > 0) {
                const insertData = levelRoles.map(role => ({
                    level: role.level,
                    role_id: role.roleId,
                    role_name: role.roleName,
                    guild_id: guildId,
                    is_auto_role: false
                }));

                const { error } = await this.supabase
                    .from('xp_level_roles')
                    .insert(insertData);

                if (error) {
                    console.error('❌ Fehler beim Speichern der Level-Rollen:', error);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren der Level-Rollen:', error);
            return { success: false, error: error.message };
        }
    }

    async getLevelRoles(guildId = 'default') {
        try {
            const { data, error } = await this.supabase
                .from('xp_level_roles')
                .select('*')
                .eq('guild_id', guildId)
                .order('level', { ascending: true });

            if (error) {
                console.error('❌ Fehler beim Laden der Level-Rollen:', error);
                return [];
            }

            return data.map(role => ({
                level: role.level,
                roleId: role.role_id,
                roleName: role.role_name,
                isAutoRole: role.is_auto_role
            }));
        } catch (error) {
            console.error('❌ Fehler beim Laden der Level-Rollen:', error);
            return [];
        }
    }

    // =============================================
    // MILESTONE REWARDS MANAGEMENT
    // =============================================

    async updateMilestoneRewards(milestoneRewards, guildId = 'default') {
        try {
            // Zuerst alle custom Meilensteine für diese Guild löschen
            await this.supabase
                .from('xp_milestone_rewards')
                .delete()
                .eq('guild_id', guildId)
                .eq('is_auto_milestone', false);

            // Neue Meilensteine einfügen
            if (milestoneRewards && milestoneRewards.length > 0) {
                const insertData = milestoneRewards.map(milestone => ({
                    xp_required: milestone.xp,
                    reward_title: milestone.reward,
                    reward_description: milestone.reward,
                    guild_id: guildId,
                    is_auto_milestone: false
                }));

                const { error } = await this.supabase
                    .from('xp_milestone_rewards')
                    .insert(insertData);

                if (error) {
                    console.error('❌ Fehler beim Speichern der Meilenstein-Belohnungen:', error);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren der Meilenstein-Belohnungen:', error);
            return { success: false, error: error.message };
        }
    }

    async getMilestoneRewards(guildId = 'default') {
        try {
            const { data, error } = await this.supabase
                .from('xp_milestone_rewards')
                .select('*')
                .eq('guild_id', guildId)
                .order('xp_required', { ascending: true });

            if (error) {
                console.error('❌ Fehler beim Laden der Meilenstein-Belohnungen:', error);
                return [];
            }

            return data.map(milestone => ({
                xp: milestone.xp_required,
                reward: milestone.reward_title,
                isAutoMilestone: milestone.is_auto_milestone
            }));
        } catch (error) {
            console.error('❌ Fehler beim Laden der Meilenstein-Belohnungen:', error);
            return [];
        }
    }

    // =============================================
    // CHANNEL BLACKLIST MANAGEMENT
    // =============================================

    async updateChannelBlacklists(channels, guildId = 'default') {
        try {
            // Alle Blacklists für diese Guild löschen
            await this.supabase
                .from('xp_channel_blacklist')
                .delete()
                .eq('guild_id', guildId);

            // Neue Blacklists einfügen
            const insertData = [];
            
            if (channels.xpBlacklist && channels.xpBlacklist.length > 0) {
                channels.xpBlacklist.forEach(channelName => {
                    if (channelName.trim()) {
                        insertData.push({
                            channel_name: channelName.trim(),
                            channel_type: 'text',
                            guild_id: guildId
                        });
                    }
                });
            }

            if (channels.voiceBlacklist && channels.voiceBlacklist.length > 0) {
                channels.voiceBlacklist.forEach(channelName => {
                    if (channelName.trim()) {
                        insertData.push({
                            channel_name: channelName.trim(),
                            channel_type: 'voice',
                            guild_id: guildId
                        });
                    }
                });
            }

            if (insertData.length > 0) {
                const { error } = await this.supabase
                    .from('xp_channel_blacklist')
                    .insert(insertData);

                if (error) {
                    console.error('❌ Fehler beim Speichern der Channel-Blacklists:', error);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren der Channel-Blacklists:', error);
            return { success: false, error: error.message };
        }
    }

    async getChannelBlacklists(guildId = 'default') {
        try {
            const { data, error } = await this.supabase
                .from('xp_channel_blacklist')
                .select('*')
                .eq('guild_id', guildId);

            if (error) {
                console.error('❌ Fehler beim Laden der Channel-Blacklists:', error);
                return { xpBlacklist: [], voiceBlacklist: [] };
            }

            const xpBlacklist = data
                .filter(item => item.channel_type === 'text')
                .map(item => item.channel_name);

            const voiceBlacklist = data
                .filter(item => item.channel_type === 'voice')
                .map(item => item.channel_name);

            return { xpBlacklist, voiceBlacklist };
        } catch (error) {
            console.error('❌ Fehler beim Laden der Channel-Blacklists:', error);
            return { xpBlacklist: [], voiceBlacklist: [] };
        }
    }

    // =============================================
    // AUTO LEADERBOARD MANAGEMENT
    // =============================================

    async saveAutoLeaderboardMessage(messageId, channelId, guildId, leaderboardType) {
        try {
            const { error } = await this.supabase
                .from('xp_auto_leaderboard_messages')
                .insert({
                    message_id: messageId,
                    channel_id: channelId,
                    guild_id: guildId,
                    leaderboard_type: leaderboardType
                });

            if (error) {
                console.error('❌ Fehler beim Speichern der Auto-Leaderboard Message:', error);
            }

            return { success: !error };
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Auto-Leaderboard Message:', error);
            return { success: false };
        }
    }

    async getAutoLeaderboardMessages(guildId, olderThanHours = 24) {
        try {
            const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));

            const { data, error } = await this.supabase
                .from('xp_auto_leaderboard_messages')
                .select('*')
                .eq('guild_id', guildId)
                .lt('posted_at', cutoffTime.toISOString());

            if (error) {
                console.error('❌ Fehler beim Laden der Auto-Leaderboard Messages:', error);
                return [];
            }

            return data;
        } catch (error) {
            console.error('❌ Fehler beim Laden der Auto-Leaderboard Messages:', error);
            return [];
        }
    }

    async deleteAutoLeaderboardMessage(messageId) {
        try {
            const { error } = await this.supabase
                .from('xp_auto_leaderboard_messages')
                .delete()
                .eq('message_id', messageId);

            if (error) {
                console.error('❌ Fehler beim Löschen der Auto-Leaderboard Message:', error);
            }

            return { success: !error };
        } catch (error) {
            console.error('❌ Fehler beim Löschen der Auto-Leaderboard Message:', error);
            return { success: false };
        }
    }

    // =============================================
    // VOICE SESSION TRACKING (Optional)
    // =============================================

    async startVoiceSession(userId, channelId, channelName, guildId) {
        try {
            const { error } = await this.supabase
                .from('xp_voice_sessions')
                .insert({
                    user_id: userId,
                    channel_id: channelId,
                    channel_name: channelName,
                    guild_id: guildId,
                    join_time: Date.now()
                });

            if (error) {
                console.error('❌ Fehler beim Starten der Voice-Session:', error);
            }

            return { success: !error };
        } catch (error) {
            console.error('❌ Fehler beim Starten der Voice-Session:', error);
            return { success: false };
        }
    }

    async endVoiceSession(userId, xpGained = 0) {
        try {
            const now = Date.now();

            // Aktive Session finden und beenden
            const { data: sessions, error: selectError } = await this.supabase
                .from('xp_voice_sessions')
                .select('*')
                .eq('user_id', userId)
                .is('leave_time', null)
                .order('join_time', { ascending: false })
                .limit(1);

            if (selectError || !sessions || sessions.length === 0) {
                return { success: false };
            }

            const session = sessions[0];
            const durationMinutes = (now - session.join_time) / 1000 / 60;

            const { error } = await this.supabase
                .from('xp_voice_sessions')
                .update({
                    leave_time: now,
                    duration_minutes: durationMinutes,
                    xp_gained: xpGained,
                    updated_at: new Date().toISOString()
                })
                .eq('id', session.id);

            if (error) {
                console.error('❌ Fehler beim Beenden der Voice-Session:', error);
            }

            return { success: !error, duration: durationMinutes };
        } catch (error) {
            console.error('❌ Fehler beim Beenden der Voice-Session:', error);
            return { success: false };
        }
    }

    // =============================================
    // MIGRATION HELPER METHODS
    // =============================================

    async migrateFromJSON(xpData, xpSettings) {
        try {
            console.log('🚀 Starte Migration von JSON zu Supabase...');

            // 1. Settings migrieren
            if (xpSettings) {
                await this.saveSettings(xpSettings);
                console.log('✅ Settings migriert');
            }

            // 2. User-Daten migrieren
            if (xpData && Array.isArray(xpData)) {
                for (const user of xpData) {
                    await this.saveUserData(user.userId, {
                        xp: user.xp || 0,
                        level: user.level || 1,
                        totalXP: user.totalXP || user.xp || 0,
                        lastMessage: user.lastMessage || 0,
                        voiceJoinTime: user.voiceJoinTime || 0,
                        messageCount: user.messageCount || 0,
                        voiceTime: user.voiceTime || 0,
                        username: user.username || 'Unbekannt',
                        avatar: user.avatar || null
                    });
                }
                console.log(`✅ ${xpData.length} User migriert`);
            }

            console.log('🎉 Migration erfolgreich abgeschlossen!');
            return { success: true };
        } catch (error) {
            console.error('❌ Fehler bei der Migration:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = XPSupabaseAPI; 