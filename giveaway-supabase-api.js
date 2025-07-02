// =============================================
// GIVEAWAY SYSTEM SUPABASE API
// =============================================
// Komplette API-Schicht für das Giveaway-System mit Supabase
// Datum: 2025-01-16
// Version: 1.0

const { createClient } = require('@supabase/supabase-js');

let supabaseClient = null;

// =============================================
// INITIALIZATION
// =============================================

async function initializeSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Supabase credentials not found, Giveaway System will use local fallback');
        return false;
    }

    try {
        supabaseClient = createClient(supabaseUrl, supabaseKey);
        
        // Test connection
        const { data, error } = await supabaseClient
            .from('giveaway_settings')
            .select('id')
            .limit(1);

        if (error) {
            console.error('❌ Supabase connection test failed:', error.message);
            return false;
        }

        console.log('✅ Giveaway System Supabase connection established successfully');
        global.supabaseClient = supabaseClient;
        return true;
    } catch (error) {
        console.error('❌ Error initializing Giveaway System Supabase:', error);
        return false;
    }
}

function getSupabaseClient() {
    return supabaseClient || global.supabaseClient;
}

function isSupabaseAvailable() {
    return getSupabaseClient() !== null;
}

// =============================================
// SETTINGS MANAGEMENT
// =============================================

async function getSettings() {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .from('giveaway_settings')
            .select('*')
            .order('id', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            throw error;
        }

        if (!data) {
            // Create default settings if none exist
            const defaultSettings = {
                enabled: true,
                default_channel: 'giveaways',
                embed_color: '0x00FF7F',
                ended_embed_color: '0xFFD700',
                winner_dm_color: '0xFFD700',
                manager_roles: ['Admin', 'Moderator'],
                notifications: {
                    newGiveaway: true,
                    giveawayEnd: true,
                    giveawayWin: true
                },
                limits: {
                    maxActiveGiveaways: 5,
                    maxWinners: 10,
                    minDuration: 60000,
                    maxDuration: 2592000000
                },
                anti_cheat: {
                    preventSelfInvite: true,
                    preventBotAccounts: true,
                    minAccountAge: 604800000,
                    preventMultipleEntries: true,
                    preventDuplicateIPs: false
                },
                leaderboard: {
                    autoCreate: true,
                    updateInterval: 30,
                    autoUpdate: true,
                    showUsernames: true,
                    autoPost: {
                        enabled: false,
                        lastPosted: 0,
                        categoryName: 'giveaway'
                    }
                }
            };

            const { data: newData, error: insertError } = await client
                .from('giveaway_settings')
                .insert([defaultSettings])
                .select()
                .single();

            if (insertError) throw insertError;
            return convertSettingsFromDb(newData);
        }

        return convertSettingsFromDb(data);
    } catch (error) {
        console.error('❌ Error getting settings from Supabase:', error);
        throw error;
    }
}

async function updateSettings(newSettings) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const dbSettings = convertSettingsToDb(newSettings);
        
        // Get current settings ID
        const { data: current, error: selectError } = await client
            .from('giveaway_settings')
            .select('id')
            .order('id', { ascending: false })
            .limit(1)
            .single();

        if (selectError && selectError.code !== 'PGRST116') {
            throw selectError;
        }

        let result;
        if (current?.id) {
            // Update existing settings
            const { data, error } = await client
                .from('giveaway_settings')
                .update(dbSettings)
                .eq('id', current.id)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            // Insert new settings
            const { data, error } = await client
                .from('giveaway_settings')
                .insert([dbSettings])
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        console.log('✅ Giveaway settings updated in Supabase');
        return convertSettingsFromDb(result);
    } catch (error) {
        console.error('❌ Error updating settings in Supabase:', error);
        throw error;
    }
}

// =============================================
// GIVEAWAY MANAGEMENT
// =============================================

async function createGiveaway(giveawayData) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const dbData = convertGiveawayToDb(giveawayData);
        
        const { data, error } = await client
            .from('giveaway_giveaways')
            .insert([dbData])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Giveaway created in Supabase: ${data.title}`);
        return convertGiveawayFromDb(data);
    } catch (error) {
        console.error('❌ Error creating giveaway in Supabase:', error);
        throw error;
    }
}

async function updateGiveaway(giveawayId, updates) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const dbUpdates = convertGiveawayToDb(updates);
        
        const { data, error } = await client
            .from('giveaway_giveaways')
            .update(dbUpdates)
            .eq('id', giveawayId)
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Giveaway updated in Supabase: ${giveawayId}`);
        return convertGiveawayFromDb(data);
    } catch (error) {
        console.error(`❌ Error updating giveaway ${giveawayId} in Supabase:`, error);
        throw error;
    }
}

async function getGiveaway(giveawayId) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .from('giveaway_giveaways')
            .select('*')
            .eq('id', giveawayId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Not found
            }
            throw error;
        }

        return convertGiveawayFromDb(data);
    } catch (error) {
        console.error(`❌ Error getting giveaway ${giveawayId} from Supabase:`, error);
        throw error;
    }
}

async function getAllGiveaways() {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .from('giveaway_giveaways')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(convertGiveawayFromDb);
    } catch (error) {
        console.error('❌ Error getting all giveaways from Supabase:', error);
        throw error;
    }
}

async function getActiveGiveaways() {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .rpc('get_active_giveaways');

        if (error) throw error;

        return data.map(convertGiveawayFromDb);
    } catch (error) {
        console.error('❌ Error getting active giveaways from Supabase:', error);
        throw error;
    }
}

async function deleteGiveaway(giveawayId) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { error } = await client
            .from('giveaway_giveaways')
            .delete()
            .eq('id', giveawayId);

        if (error) throw error;

        console.log(`✅ Giveaway deleted from Supabase: ${giveawayId}`);
        return true;
    } catch (error) {
        console.error(`❌ Error deleting giveaway ${giveawayId} from Supabase:`, error);
        throw error;
    }
}

// =============================================
// PARTICIPANTS MANAGEMENT
// =============================================

async function addParticipant(giveawayId, userId, username) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .from('giveaway_participants')
            .insert([{
                giveaway_id: giveawayId,
                user_id: userId,
                username: username,
                joined_at: Date.now()
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                console.log(`ℹ️ User ${userId} already participating in giveaway ${giveawayId}`);
                return null; // Already participating
            }
            throw error;
        }

        // Update participant count in giveaway
        await updateParticipantCount(giveawayId);

        console.log(`✅ Participant added to Supabase: ${userId} -> ${giveawayId}`);
        return data;
    } catch (error) {
        console.error(`❌ Error adding participant ${userId} to giveaway ${giveawayId}:`, error);
        throw error;
    }
}

async function removeParticipant(giveawayId, userId) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { error } = await client
            .from('giveaway_participants')
            .delete()
            .eq('giveaway_id', giveawayId)
            .eq('user_id', userId);

        if (error) throw error;

        // Update participant count in giveaway
        await updateParticipantCount(giveawayId);

        console.log(`✅ Participant removed from Supabase: ${userId} -> ${giveawayId}`);
        return true;
    } catch (error) {
        console.error(`❌ Error removing participant ${userId} from giveaway ${giveawayId}:`, error);
        throw error;
    }
}

async function getParticipants(giveawayId) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .from('giveaway_participants')
            .select('*')
            .eq('giveaway_id', giveawayId)
            .eq('is_valid', true)
            .order('joined_at', { ascending: true });

        if (error) throw error;

        return data;
    } catch (error) {
        console.error(`❌ Error getting participants for giveaway ${giveawayId}:`, error);
        throw error;
    }
}

async function isParticipating(giveawayId, userId) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .from('giveaway_participants')
            .select('id')
            .eq('giveaway_id', giveawayId)
            .eq('user_id', userId)
            .eq('is_valid', true)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return !!data;
    } catch (error) {
        console.error(`❌ Error checking participation for ${userId} in ${giveawayId}:`, error);
        throw error;
    }
}

async function updateParticipantCount(giveawayId) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        // Count valid participants
        const { count, error: countError } = await client
            .from('giveaway_participants')
            .select('*', { count: 'exact', head: true })
            .eq('giveaway_id', giveawayId)
            .eq('is_valid', true);

        if (countError) throw countError;

        // Update giveaway with current count
        const { error: updateError } = await client
            .from('giveaway_giveaways')
            .update({ total_participants: count || 0 })
            .eq('id', giveawayId);

        if (updateError) throw updateError;

        return count || 0;
    } catch (error) {
        console.error(`❌ Error updating participant count for ${giveawayId}:`, error);
        throw error;
    }
}

// =============================================
// INVITE TRACKING MANAGEMENT
// =============================================

async function getInviteTracking(userId) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .from('giveaway_invite_tracking')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data ? {
            userId: data.user_id,
            username: data.username,
            totalInvites: data.total_invites,
            codes: data.codes || []
        } : null;
    } catch (error) {
        console.error(`❌ Error getting invite tracking for ${userId}:`, error);
        throw error;
    }
}

async function updateInviteTracking(userId, trackingData) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const dbData = {
            user_id: userId,
            username: trackingData.username,
            total_invites: trackingData.totalInvites || 0,
            codes: trackingData.codes || []
        };

        const { data, error } = await client
            .from('giveaway_invite_tracking')
            .upsert([dbData])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Invite tracking updated for ${userId}`);
        return data;
    } catch (error) {
        console.error(`❌ Error updating invite tracking for ${userId}:`, error);
        throw error;
    }
}

async function createInviteCode(codeData) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .from('giveaway_invite_codes')
            .insert([{
                code: codeData.code,
                user_id: codeData.userId,
                giveaway_id: codeData.giveawayId,
                uses: codeData.uses || 0,
                max_uses: codeData.maxUses || 100,
                expires_at: codeData.expiresAt
            }])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Invite code created: ${codeData.code}`);
        return data;
    } catch (error) {
        console.error(`❌ Error creating invite code ${codeData.code}:`, error);
        throw error;
    }
}

async function getInviteCode(code) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .from('giveaway_invite_codes')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data ? {
            code: data.code,
            userId: data.user_id,
            giveawayId: data.giveaway_id,
            uses: data.uses,
            maxUses: data.max_uses,
            expiresAt: data.expires_at
        } : null;
    } catch (error) {
        console.error(`❌ Error getting invite code ${code}:`, error);
        throw error;
    }
}

async function updateInviteCodeUses(code, newUses) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .from('giveaway_invite_codes')
            .update({ uses: newUses })
            .eq('code', code)
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Invite code uses updated: ${code} -> ${newUses}`);
        return data;
    } catch (error) {
        console.error(`❌ Error updating invite code uses for ${code}:`, error);
        throw error;
    }
}

// =============================================
// USER INVITES MANAGEMENT
// =============================================

async function getUserInvites(giveawayId, userId) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .from('giveaway_user_invites')
            .select('*')
            .eq('giveaway_id', giveawayId)
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data?.invite_count || 0;
    } catch (error) {
        console.error(`❌ Error getting user invites for ${userId} in ${giveawayId}:`, error);
        throw error;
    }
}

async function updateUserInvites(giveawayId, userId, inviteCount) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .from('giveaway_user_invites')
            .upsert([{
                giveaway_id: giveawayId,
                user_id: userId,
                invite_count: inviteCount
            }])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ User invites updated: ${userId} in ${giveawayId} -> ${inviteCount}`);
        return data;
    } catch (error) {
        console.error(`❌ Error updating user invites for ${userId} in ${giveawayId}:`, error);
        throw error;
    }
}

async function getInviteLeaderboard(giveawayId) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .rpc('get_invite_leaderboard', { giveaway_id_param: giveawayId });

        if (error) throw error;

        return data.map(row => ({
            userId: row.user_id,
            username: row.username,
            invites: row.invite_count,
            rank: row.rank
        }));
    } catch (error) {
        console.error(`❌ Error getting invite leaderboard for ${giveawayId}:`, error);
        throw error;
    }
}

// =============================================
// INVITED USERS TRACKING
// =============================================

async function addInvitedUser(giveawayId, inviterId, invitedId, invitedUsername) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .from('giveaway_invited_users')
            .insert([{
                giveaway_id: giveawayId,
                inviter_id: inviterId,
                invited_id: invitedId,
                invited_username: invitedUsername,
                invited_at: Date.now()
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                console.log(`ℹ️ User ${invitedId} already invited by ${inviterId} in ${giveawayId}`);
                return null;
            }
            throw error;
        }

        console.log(`✅ Invited user tracked: ${invitedId} by ${inviterId} in ${giveawayId}`);
        return data;
    } catch (error) {
        console.error(`❌ Error adding invited user tracking:`, error);
        throw error;
    }
}

async function getInvitedUsers(giveawayId, inviterId) {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .from('giveaway_invited_users')
            .select('*')
            .eq('giveaway_id', giveawayId)
            .eq('inviter_id', inviterId)
            .eq('is_valid', true)
            .order('invited_at', { ascending: true });

        if (error) throw error;

        return data.map(row => ({
            id: row.invited_id,
            username: row.invited_username,
            invitedAt: row.invited_at
        }));
    } catch (error) {
        console.error(`❌ Error getting invited users for ${inviterId} in ${giveawayId}:`, error);
        throw error;
    }
}

// =============================================
// STATISTICS
// =============================================

async function getStats() {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .rpc('get_giveaway_stats');

        if (error) throw error;

        const stats = data[0];
        return {
            totalGiveaways: parseInt(stats.total_giveaways) || 0,
            activeGiveaways: parseInt(stats.active_giveaways) || 0,
            endedGiveaways: parseInt(stats.ended_giveaways) || 0,
            totalParticipants: parseInt(stats.total_participants) || 0,
            totalInvites: parseInt(stats.total_invites) || 0,
            averageParticipants: parseFloat(stats.average_participants) || 0
        };
    } catch (error) {
        console.error('❌ Error getting stats from Supabase:', error);
        throw error;
    }
}

async function getGlobalInviteStats() {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .from('invite_leaderboard_global')
            .select('*')
            .order('total_invites', { ascending: false })
            .limit(100);

        if (error) throw error;

        return data.map(row => ({
            userId: row.user_id,
            username: row.username,
            totalInvites: row.total_invites,
            activeCodes: row.active_codes,
            globalRank: row.global_rank
        }));
    } catch (error) {
        console.error('❌ Error getting global invite stats from Supabase:', error);
        throw error;
    }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

async function cleanupExpiredGiveaways() {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not available');
    }

    try {
        const { data, error } = await client
            .rpc('cleanup_expired_giveaways');

        if (error) throw error;

        const expiredCount = data || 0;
        if (expiredCount > 0) {
            console.log(`✅ Cleaned up ${expiredCount} expired giveaway(s)`);
        }

        return expiredCount;
    } catch (error) {
        console.error('❌ Error cleaning up expired giveaways:', error);
        throw error;
    }
}

// =============================================
// DATA CONVERSION FUNCTIONS
// =============================================

function convertSettingsToDb(settings) {
    return {
        enabled: settings.enabled,
        default_channel: settings.defaultChannel,
        embed_color: settings.embedColor,
        ended_embed_color: settings.endedEmbedColor,
        winner_dm_color: settings.winnerDmColor,
        manager_roles: settings.managerRoles,
        notifications: settings.notifications,
        limits: settings.limits,
        anti_cheat: settings.antiCheat,
        leaderboard: settings.leaderboard
    };
}

function convertSettingsFromDb(dbSettings) {
    return {
        enabled: dbSettings.enabled,
        defaultChannel: dbSettings.default_channel,
        embedColor: dbSettings.embed_color,
        endedEmbedColor: dbSettings.ended_embed_color,
        winnerDmColor: dbSettings.winner_dm_color,
        managerRoles: dbSettings.manager_roles,
        notifications: dbSettings.notifications,
        limits: dbSettings.limits,
        antiCheat: dbSettings.anti_cheat,
        leaderboard: dbSettings.leaderboard
    };
}

function convertGiveawayToDb(giveaway) {
    return {
        id: giveaway.id,
        title: giveaway.title,
        description: giveaway.description,
        prize: giveaway.prize,
        type: giveaway.type,
        winners: giveaway.winners,
        end_time: giveaway.endTime,
        created_at: giveaway.createdAt,
        created_by: giveaway.createdBy,
        status: giveaway.status,
        channel_id: giveaway.channelId,
        channel_name: giveaway.channelName,
        message_id: giveaway.messageId,
        leaderboard_channel_id: giveaway.leaderboardChannelId,
        leaderboard_message_id: giveaway.leaderboardMessageId,
        auto_leaderboard_channel_id: giveaway.autoLeaderboardChannelId,
        auto_leaderboard_message_id: giveaway.autoLeaderboardMessageId,
        requirements: giveaway.requirements,
        anti_cheat: giveaway.antiCheat,
        winner_list: giveaway.winnerList,
        ended_at: giveaway.endedAt,
        total_participants: giveaway.totalParticipants
    };
}

function convertGiveawayFromDb(dbGiveaway) {
    return {
        id: dbGiveaway.id,
        title: dbGiveaway.title,
        description: dbGiveaway.description,
        prize: dbGiveaway.prize,
        type: dbGiveaway.type,
        winners: dbGiveaway.winners,
        endTime: dbGiveaway.end_time,
        createdAt: dbGiveaway.created_at,
        createdBy: dbGiveaway.created_by,
        status: dbGiveaway.status,
        channelId: dbGiveaway.channel_id,
        channelName: dbGiveaway.channel_name,
        messageId: dbGiveaway.message_id,
        leaderboardChannelId: dbGiveaway.leaderboard_channel_id,
        leaderboardMessageId: dbGiveaway.leaderboard_message_id,
        autoLeaderboardChannelId: dbGiveaway.auto_leaderboard_channel_id,
        autoLeaderboardMessageId: dbGiveaway.auto_leaderboard_message_id,
        requirements: dbGiveaway.requirements || {},
        antiCheat: dbGiveaway.anti_cheat || {},
        winnerList: dbGiveaway.winner_list || [],
        endedAt: dbGiveaway.ended_at,
        totalParticipants: dbGiveaway.total_participants || 0,
        participants: new Set(), // Will be populated separately
        timeRemaining: dbGiveaway.time_remaining || Math.max(0, dbGiveaway.end_time - Date.now())
    };
}

// =============================================
// EXPORTS
// =============================================

module.exports = {
    // Core functions
    initializeSupabase,
    getSupabaseClient,
    isSupabaseAvailable,
    
    // Settings
    getSettings,
    updateSettings,
    
    // Giveaways
    createGiveaway,
    updateGiveaway,
    getGiveaway,
    getAllGiveaways,
    getActiveGiveaways,
    deleteGiveaway,
    
    // Participants
    addParticipant,
    removeParticipant,
    getParticipants,
    isParticipating,
    updateParticipantCount,
    
    // Invite tracking
    getInviteTracking,
    updateInviteTracking,
    createInviteCode,
    getInviteCode,
    updateInviteCodeUses,
    
    // User invites
    getUserInvites,
    updateUserInvites,
    getInviteLeaderboard,
    
    // Invited users
    addInvitedUser,
    getInvitedUsers,
    
    // Statistics
    getStats,
    getGlobalInviteStats,
    
    // Utilities
    cleanupExpiredGiveaways,
    
    // Conversion helpers
    convertSettingsToDb,
    convertSettingsFromDb,
    convertGiveawayToDb,
    convertGiveawayFromDb
}; 