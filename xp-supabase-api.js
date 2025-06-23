/**
 * XP System Supabase API
 * Handles all database operations for the XP system
 */

const { createClient } = require('@supabase/supabase-js');

class XPSupabaseAPI {
    constructor() {
        this.supabase = null;
        this.initialized = false;
        this.initializeSupabase();
    }

    initializeSupabase() {
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) {
                console.error('❌ Supabase credentials not found in environment variables');
                return;
            }

            this.supabase = createClient(supabaseUrl, supabaseKey);
            this.initialized = true;
            console.log('✅ XP Supabase API initialized');
        } catch (error) {
            console.error('❌ Failed to initialize XP Supabase API:', error);
        }
    }

    // ==================== SETTINGS METHODS ====================

    async getSettings() {
        try {
            if (!this.initialized) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('xp_settings')
                .select('*')
                .eq('id', 1)
                .single();

            if (error) {
                console.error('❌ Error fetching XP settings:', error);
                return this.getDefaultSettings();
            }

            return this.transformSettingsFromDB(data);
        } catch (error) {
            console.error('❌ Error in getSettings:', error);
            return this.getDefaultSettings();
        }
    }

    async updateSettings(settings) {
        try {
            if (!this.initialized) {
                throw new Error('Supabase not initialized');
            }

            const dbSettings = this.transformSettingsToDB(settings);
            
            const { data, error } = await this.supabase
                .from('xp_settings')
                .upsert({ ...dbSettings, id: 1 })
                .select()
                .single();

            if (error) {
                console.error('❌ Error updating XP settings:', error);
                throw error;
            }

            console.log('✅ XP settings updated successfully');
            return this.transformSettingsFromDB(data);
        } catch (error) {
            console.error('❌ Error in updateSettings:', error);
            throw error;
        }
    }

    // ==================== USER METHODS ====================

    async getAllUsers() {
        try {
            if (!this.initialized) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('xp_users')
                .select('*')
                .order('total_xp', { ascending: false });

            if (error) {
                console.error('❌ Error fetching XP users:', error);
                return [];
            }

            return data.map(user => this.transformUserFromDB(user));
        } catch (error) {
            console.error('❌ Error in getAllUsers:', error);
            return [];
        }
    }

    async getUser(userId) {
        try {
            if (!this.initialized) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('xp_users')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('❌ Error fetching user XP data:', error);
                return null;
            }

            return data ? this.transformUserFromDB(data) : null;
        } catch (error) {
            console.error('❌ Error in getUser:', error);
            return null;
        }
    }

    async updateUser(userId, userData) {
        try {
            if (!this.initialized) {
                throw new Error('Supabase not initialized');
            }

            const dbUserData = this.transformUserToDB(userData);
            dbUserData.user_id = userId;

            const { data, error } = await this.supabase
                .from('xp_users')
                .upsert(dbUserData)
                .select()
                .single();

            if (error) {
                console.error('❌ Error updating user XP data:', error);
                throw error;
            }

            return this.transformUserFromDB(data);
        } catch (error) {
            console.error('❌ Error in updateUser:', error);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            if (!this.initialized) {
                throw new Error('Supabase not initialized');
            }

            const { error } = await this.supabase
                .from('xp_users')
                .delete()
                .eq('user_id', userId);

            if (error) {
                console.error('❌ Error deleting user XP data:', error);
                throw error;
            }

            console.log(`✅ User ${userId} XP data deleted`);
            return true;
        } catch (error) {
            console.error('❌ Error in deleteUser:', error);
            throw error;
        }
    }

    async deleteAllUsers() {
        try {
            if (!this.initialized) {
                throw new Error('Supabase not initialized');
            }

            const { error } = await this.supabase
                .from('xp_users')
                .delete()
                .neq('user_id', ''); // Delete all rows

            if (error) {
                console.error('❌ Error deleting all users:', error);
                throw error;
            }

            console.log('✅ All user XP data deleted');
            return true;
        } catch (error) {
            console.error('❌ Error in deleteAllUsers:', error);
            throw error;
        }
    }

    // ==================== LEVEL ROLES METHODS ====================

    async getLevelRoles() {
        try {
            if (!this.initialized) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('xp_level_roles')
                .select('*')
                .order('level', { ascending: true });

            if (error) {
                console.error('❌ Error fetching level roles:', error);
                return [];
            }

            return data.map(role => ({
                level: role.level,
                roleId: role.role_id,
                roleName: role.role_name
            }));
        } catch (error) {
            console.error('❌ Error in getLevelRoles:', error);
            return [];
        }
    }

    async addLevelRole(level, roleId, roleName) {
        try {
            if (!this.initialized) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('xp_level_roles')
                .insert({
                    level: level,
                    role_id: roleId,
                    role_name: roleName
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Error adding level role:', error);
                throw error;
            }

            return {
                level: data.level,
                roleId: data.role_id,
                roleName: data.role_name
            };
        } catch (error) {
            console.error('❌ Error in addLevelRole:', error);
            throw error;
        }
    }

    async deleteLevelRole(level, roleId) {
        try {
            if (!this.initialized) {
                throw new Error('Supabase not initialized');
            }

            const { error } = await this.supabase
                .from('xp_level_roles')
                .delete()
                .eq('level', level)
                .eq('role_id', roleId);

            if (error) {
                console.error('❌ Error deleting level role:', error);
                throw error;
            }

            return true;
        } catch (error) {
            console.error('❌ Error in deleteLevelRole:', error);
            throw error;
        }
    }

    // ==================== MILESTONE REWARDS METHODS ====================

    async getMilestoneRewards() {
        try {
            if (!this.initialized) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('xp_milestone_rewards')
                .select('*')
                .order('xp_required', { ascending: true });

            if (error) {
                console.error('❌ Error fetching milestone rewards:', error);
                return [];
            }

            return data.map(milestone => ({
                xp: milestone.xp_required,
                reward: milestone.reward
            }));
        } catch (error) {
            console.error('❌ Error in getMilestoneRewards:', error);
            return [];
        }
    }

    async addMilestoneReward(xp, reward) {
        try {
            if (!this.initialized) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('xp_milestone_rewards')
                .insert({
                    xp_required: xp,
                    reward: reward
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Error adding milestone reward:', error);
                throw error;
            }

            return {
                xp: data.xp_required,
                reward: data.reward
            };
        } catch (error) {
            console.error('❌ Error in addMilestoneReward:', error);
            throw error;
        }
    }

    async deleteMilestoneReward(xp) {
        try {
            if (!this.initialized) {
                throw new Error('Supabase not initialized');
            }

            const { error } = await this.supabase
                .from('xp_milestone_rewards')
                .delete()
                .eq('xp_required', xp);

            if (error) {
                console.error('❌ Error deleting milestone reward:', error);
                throw error;
            }

            return true;
        } catch (error) {
            console.error('❌ Error in deleteMilestoneReward:', error);
            throw error;
        }
    }

    // ==================== CHANNEL BLACKLIST METHODS ====================

    async getChannelBlacklists() {
        try {
            if (!this.initialized) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('xp_channel_blacklists')
                .select('*');

            if (error) {
                console.error('❌ Error fetching channel blacklists:', error);
                return { xpBlacklist: [], voiceBlacklist: [] };
            }

            const xpBlacklist = data.filter(item => item.channel_type === 'text').map(item => item.channel_name);
            const voiceBlacklist = data.filter(item => item.channel_type === 'voice').map(item => item.channel_name);

            return { xpBlacklist, voiceBlacklist };
        } catch (error) {
            console.error('❌ Error in getChannelBlacklists:', error);
            return { xpBlacklist: [], voiceBlacklist: [] };
        }
    }

    async updateChannelBlacklists(xpBlacklist, voiceBlacklist) {
        try {
            if (!this.initialized) {
                throw new Error('Supabase not initialized');
            }

            // Lösche alle bestehenden Blacklist-Einträge
            await this.supabase
                .from('xp_channel_blacklists')
                .delete()
                .neq('id', 0);

            // Füge neue Einträge hinzu
            const newEntries = [];
            
            for (const channelName of xpBlacklist) {
                if (channelName && channelName.trim()) {
                    newEntries.push({
                        channel_name: channelName.trim(),
                        channel_type: 'text'
                    });
                }
            }

            for (const channelName of voiceBlacklist) {
                if (channelName && channelName.trim()) {
                    newEntries.push({
                        channel_name: channelName.trim(),
                        channel_type: 'voice'
                    });
                }
            }

            if (newEntries.length > 0) {
                const { error } = await this.supabase
                    .from('xp_channel_blacklists')
                    .insert(newEntries);

                if (error) {
                    console.error('❌ Error updating channel blacklists:', error);
                    throw error;
                }
            }

            return true;
        } catch (error) {
            console.error('❌ Error in updateChannelBlacklists:', error);
            throw error;
        }
    }

    // ==================== UTILITY METHODS ====================

    getDefaultSettings() {
        return {
            enabled: true,
            messageXP: { min: 5, max: 15, cooldown: 60000 },
            voiceXP: { baseXP: 2, afkChannelXP: 0, soloChannelXP: 1, cooldown: 60000, intervalMinutes: 1 },
            levelSystem: { baseXP: 100, multiplier: 1.5, maxLevel: 100 },
            channels: { levelUpChannel: 'level-up', leaderboardChannel: 'leaderboard', xpBlacklist: [], voiceBlacklist: [] },
            autoLeaderboard: { 
                enabled: true, 
                time: '20:00', 
                timezone: 'Europe/Berlin', 
                channelName: 'leaderboard', 
                types: ['total'], 
                limit: 10, 
                lastPosted: 0, 
                lastMessageIds: [], 
                autoDeleteOld: true 
            },
            rewards: { levelRoles: [], milestoneRewards: [] },
            announcements: { levelUp: true, milestones: true, newRecord: true },
            display: { showRank: true, showProgress: true, embedColor: '0x00FF7F', leaderboardSize: 10 },
            levelUpEmbed: {
                enabled: true,
                title: '🎉 Level Up!',
                color: '0x00FF7F',
                animation: { enabled: true, style: 'celebration', duration: 5000 },
                fields: { showStats: true, showNextLevel: true, showRank: true, customMessage: '' },
                footer: { enabled: true, text: '🎉 Herzlichen Glückwunsch!' }
            }
        };
    }

    transformSettingsFromDB(dbData) {
        if (!dbData) return this.getDefaultSettings();

        return {
            enabled: dbData.enabled,
            messageXP: {
                min: dbData.message_xp_min,
                max: dbData.message_xp_max,
                cooldown: dbData.message_xp_cooldown
            },
            voiceXP: {
                baseXP: dbData.voice_xp_base,
                afkChannelXP: dbData.voice_xp_afk,
                soloChannelXP: dbData.voice_xp_solo,
                cooldown: dbData.voice_xp_cooldown,
                intervalMinutes: dbData.voice_xp_interval_minutes
            },
            levelSystem: {
                baseXP: dbData.level_system_base_xp,
                multiplier: parseFloat(dbData.level_system_multiplier),
                maxLevel: dbData.level_system_max_level
            },
            channels: {
                levelUpChannel: dbData.level_up_channel,
                leaderboardChannel: dbData.leaderboard_channel,
                xpBlacklist: [], // Wird separat geladen
                voiceBlacklist: [] // Wird separat geladen
            },
            autoLeaderboard: {
                enabled: dbData.auto_leaderboard_enabled,
                time: dbData.auto_leaderboard_time,
                timezone: dbData.auto_leaderboard_timezone,
                channelName: dbData.auto_leaderboard_channel,
                types: dbData.auto_leaderboard_types || ['total'],
                limit: dbData.auto_leaderboard_limit,
                lastPosted: dbData.auto_leaderboard_last_posted,
                lastMessageIds: dbData.auto_leaderboard_last_message_ids || [],
                autoDeleteOld: dbData.auto_leaderboard_auto_delete_old
            },
            rewards: {
                levelRoles: [], // Wird separat geladen
                milestoneRewards: [] // Wird separat geladen
            },
            announcements: {
                levelUp: dbData.announcements_level_up,
                milestones: dbData.announcements_milestones,
                newRecord: dbData.announcements_new_record
            },
            display: {
                showRank: dbData.display_show_rank,
                showProgress: dbData.display_show_progress,
                embedColor: dbData.display_embed_color,
                leaderboardSize: dbData.display_leaderboard_size
            },
            levelUpEmbed: {
                enabled: dbData.level_up_embed_enabled,
                title: dbData.level_up_embed_title,
                color: dbData.level_up_embed_color,
                animation: {
                    enabled: dbData.level_up_embed_animation_enabled,
                    style: dbData.level_up_embed_animation_style,
                    duration: dbData.level_up_embed_animation_duration
                },
                fields: {
                    showStats: dbData.level_up_embed_fields_show_stats,
                    showNextLevel: dbData.level_up_embed_fields_show_next_level,
                    showRank: dbData.level_up_embed_fields_show_rank,
                    customMessage: dbData.level_up_embed_fields_custom_message
                },
                footer: {
                    enabled: dbData.level_up_embed_footer_enabled,
                    text: dbData.level_up_embed_footer_text
                }
            }
        };
    }

    transformSettingsToDB(settings) {
        return {
            enabled: settings.enabled,
            
            // Message XP
            message_xp_min: settings.messageXP.min,
            message_xp_max: settings.messageXP.max,
            message_xp_cooldown: settings.messageXP.cooldown,
            
            // Voice XP
            voice_xp_base: settings.voiceXP.baseXP,
            voice_xp_afk: settings.voiceXP.afkChannelXP,
            voice_xp_solo: settings.voiceXP.soloChannelXP,
            voice_xp_cooldown: settings.voiceXP.cooldown,
            voice_xp_interval_minutes: settings.voiceXP.intervalMinutes,
            
            // Level System
            level_system_base_xp: settings.levelSystem.baseXP,
            level_system_multiplier: settings.levelSystem.multiplier,
            level_system_max_level: settings.levelSystem.maxLevel,
            
            // Channels
            level_up_channel: settings.channels.levelUpChannel,
            leaderboard_channel: settings.channels.leaderboardChannel,
            
            // Auto Leaderboard
            auto_leaderboard_enabled: settings.autoLeaderboard.enabled,
            auto_leaderboard_time: settings.autoLeaderboard.time,
            auto_leaderboard_timezone: settings.autoLeaderboard.timezone,
            auto_leaderboard_channel: settings.autoLeaderboard.channelName,
            auto_leaderboard_types: settings.autoLeaderboard.types,
            auto_leaderboard_limit: settings.autoLeaderboard.limit,
            auto_leaderboard_last_posted: settings.autoLeaderboard.lastPosted,
            auto_leaderboard_last_message_ids: settings.autoLeaderboard.lastMessageIds,
            auto_leaderboard_auto_delete_old: settings.autoLeaderboard.autoDeleteOld,
            
            // Announcements
            announcements_level_up: settings.announcements.levelUp,
            announcements_milestones: settings.announcements.milestones,
            announcements_new_record: settings.announcements.newRecord,
            
            // Display
            display_show_rank: settings.display.showRank,
            display_show_progress: settings.display.showProgress,
            display_embed_color: settings.display.embedColor,
            display_leaderboard_size: settings.display.leaderboardSize,
            
            // Level Up Embed
            level_up_embed_enabled: settings.levelUpEmbed.enabled,
            level_up_embed_title: settings.levelUpEmbed.title,
            level_up_embed_color: settings.levelUpEmbed.color,
            level_up_embed_animation_enabled: settings.levelUpEmbed.animation.enabled,
            level_up_embed_animation_style: settings.levelUpEmbed.animation.style,
            level_up_embed_animation_duration: settings.levelUpEmbed.animation.duration,
            level_up_embed_fields_show_stats: settings.levelUpEmbed.fields.showStats,
            level_up_embed_fields_show_next_level: settings.levelUpEmbed.fields.showNextLevel,
            level_up_embed_fields_show_rank: settings.levelUpEmbed.fields.showRank,
            level_up_embed_fields_custom_message: settings.levelUpEmbed.fields.customMessage,
            level_up_embed_footer_enabled: settings.levelUpEmbed.footer.enabled,
            level_up_embed_footer_text: settings.levelUpEmbed.footer.text
        };
    }

    transformUserFromDB(dbUser) {
        return {
            userId: dbUser.user_id,
            xp: dbUser.xp,
            level: dbUser.level,
            totalXP: dbUser.total_xp,
            messageCount: dbUser.message_count,
            voiceTime: parseFloat(dbUser.voice_time),
            lastMessage: dbUser.last_message,
            lastVoiceXP: dbUser.last_voice_xp,
            voiceJoinTime: dbUser.voice_join_time,
            username: dbUser.username,
            avatar: dbUser.avatar
        };
    }

    transformUserToDB(userData) {
        return {
            xp: userData.xp || 0,
            level: userData.level || 1,
            total_xp: userData.totalXP || userData.xp || 0,
            message_count: userData.messageCount || 0,
            voice_time: userData.voiceTime || 0,
            last_message: userData.lastMessage || 0,
            last_voice_xp: userData.lastVoiceXP || 0,
            voice_join_time: userData.voiceJoinTime || 0,
            username: userData.username,
            avatar: userData.avatar
        };
    }
}

module.exports = XPSupabaseAPI; 