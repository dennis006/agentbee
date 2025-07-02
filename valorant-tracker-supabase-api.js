/**
 * =====================================================
 * VALORANT TRACKER SUPABASE API INTEGRATION
 * =====================================================
 * Ersetzt: valorant-stats.json und valorant-players.json
 * Autor: AI Assistant
 * Version: 1.0.0
 * =====================================================
 */

const { createClient } = require('@supabase/supabase-js');

// Global Supabase client
let supabaseClient = null;

/**
 * Initialisiert Supabase Client für Valorant Tracker
 */
async function initializeValorantSupabase() {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.log('❌ [Valorant-Supabase] Environment variables missing');
            return null;
        }

        supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Test connection
        const { data, error } = await supabaseClient
            .from('valorant_tracker_settings')
            .select('id')
            .limit(1);

        if (error) {
            console.log('❌ [Valorant-Supabase] Connection test failed:', error.message);
            return null;
        }

        console.log('✅ [Valorant-Supabase] Successfully connected to Supabase');
        return supabaseClient;

    } catch (error) {
        console.log('❌ [Valorant-Supabase] Initialization error:', error.message);
        return null;
    }
}

/**
 * Lädt Valorant Tracker Einstellungen aus Supabase
 */
async function loadValorantSettings() {
    try {
        if (!supabaseClient) {
            await initializeValorantSupabase();
        }

        if (!supabaseClient) {
            console.log('⚠️ [Valorant-Supabase] Using fallback settings (no connection)');
            return getDefaultValorantSettings();
        }

        const { data, error } = await supabaseClient
            .rpc('get_valorant_settings');

        if (error) {
            console.log('❌ [Valorant-Supabase] Error loading settings:', error.message);
            return getDefaultValorantSettings();
        }

        if (!data || data.length === 0) {
            console.log('⚠️ [Valorant-Supabase] No settings found, using defaults');
            return getDefaultValorantSettings();
        }

        const settings = data[0];
        console.log('✅ [Valorant-Supabase] Settings loaded successfully');
        
        return {
            enabled: settings.enabled || false,
            defaultRegion: settings.default_region || 'eu',
            outputFormat: settings.output_format || { mode: 'embed', embedEnabled: true, cardEnabled: false },
            embedConfig: settings.embed_config || getDefaultEmbedConfig(),
            playerStatsEmbed: settings.player_stats_embed || getDefaultPlayerStatsEmbed(),
            rankRewards: settings.rank_rewards || { enabled: false }
        };

    } catch (error) {
        console.log('❌ [Valorant-Supabase] Error in loadValorantSettings:', error.message);
        return getDefaultValorantSettings();
    }
}

/**
 * Speichert Valorant Tracker Einstellungen in Supabase
 */
async function saveValorantSettings(settings) {
    try {
        if (!supabaseClient) {
            await initializeValorantSupabase();
        }

        if (!supabaseClient) {
            console.log('❌ [Valorant-Supabase] Cannot save settings (no connection)');
            return false;
        }

        // Update or Insert settings
        const { data: existingData } = await supabaseClient
            .from('valorant_tracker_settings')
            .select('id')
            .limit(1);

        const settingsData = {
            enabled: settings.enabled || false,
            default_region: settings.defaultRegion || 'eu',
            output_format: settings.outputFormat || { mode: 'embed', embedEnabled: true, cardEnabled: false },
            embed_config: settings.embedConfig || getDefaultEmbedConfig(),
            player_stats_embed: settings.playerStatsEmbed || getDefaultPlayerStatsEmbed(),
            rank_rewards: settings.rankRewards || { enabled: false },
            updated_at: new Date().toISOString()
        };

        let result;
        if (existingData && existingData.length > 0) {
            // Update existing
            result = await supabaseClient
                .from('valorant_tracker_settings')
                .update(settingsData)
                .eq('id', existingData[0].id);
        } else {
            // Insert new
            result = await supabaseClient
                .from('valorant_tracker_settings')
                .insert(settingsData);
        }

        if (result.error) {
            console.log('❌ [Valorant-Supabase] Error saving settings:', result.error.message);
            return false;
        }

        console.log('✅ [Valorant-Supabase] Settings saved successfully');
        return true;

    } catch (error) {
        console.log('❌ [Valorant-Supabase] Error in saveValorantSettings:', error.message);
        return false;
    }
}

/**
 * Lädt Valorant Tracker Statistiken
 */
async function loadValorantStats() {
    try {
        if (!supabaseClient) {
            await initializeValorantSupabase();
        }

        if (!supabaseClient) {
            console.log('⚠️ [Valorant-Supabase] Using default stats (no connection)');
            return getDefaultValorantStats();
        }

        const { data, error } = await supabaseClient
            .from('valorant_tracker_stats')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.log('❌ [Valorant-Supabase] Error loading stats:', error.message);
            return getDefaultValorantStats();
        }

        if (!data || data.length === 0) {
            console.log('⚠️ [Valorant-Supabase] No stats found, creating default');
            // Create default stats entry
            const { error: insertError } = await supabaseClient
                .from('valorant_tracker_stats')
                .insert(getDefaultValorantStats());
            
            if (insertError) {
                console.log('❌ [Valorant-Supabase] Error creating default stats:', insertError.message);
            }
            
            return getDefaultValorantStats();
        }

        const stats = data[0];
        console.log('✅ [Valorant-Supabase] Stats loaded successfully');

        return {
            totalSearches: stats.total_searches || 0,
            dailySearches: stats.daily_searches || 0,
            weeklySearches: stats.weekly_searches || 0,
            totalPlayers: stats.total_players || 0,
            topRegions: stats.top_regions || { eu: 0, na: 0, ap: 0, kr: 0 },
            systemEnabled: stats.system_enabled || false,
            lastUpdate: stats.last_update || new Date().toISOString()
        };

    } catch (error) {
        console.log('❌ [Valorant-Supabase] Error in loadValorantStats:', error.message);
        return getDefaultValorantStats();
    }
}

/**
 * Aktualisiert Valorant Tracker Statistiken via Supabase Function
 */
async function updateValorantStatsSupabase(searchData = null) {
    try {
        if (!supabaseClient) {
            await initializeValorantSupabase();
        }

        if (!supabaseClient) {
            console.log('❌ [Valorant-Supabase] Cannot update stats (no connection)');
            return getDefaultValorantStats();
        }

        const { data, error } = await supabaseClient
            .rpc('update_valorant_stats', { search_data: searchData });

        if (error) {
            console.log('❌ [Valorant-Supabase] Error updating stats:', error.message);
            return getDefaultValorantStats();
        }

        if (!data || data.length === 0) {
            console.log('⚠️ [Valorant-Supabase] No stats returned from function');
            return getDefaultValorantStats();
        }

        const stats = data[0];
        console.log('✅ [Valorant-Supabase] Stats updated successfully');

        return {
            totalSearches: stats.total_searches || 0,
            dailySearches: stats.daily_searches || 0,
            weeklySearches: stats.weekly_searches || 0,
            totalPlayers: stats.total_players || 0,
            topRegions: stats.top_regions || { eu: 0, na: 0, ap: 0, kr: 0 },
            systemEnabled: stats.system_enabled || false
        };

    } catch (error) {
        console.log('❌ [Valorant-Supabase] Error in updateValorantStatsSupabase:', error.message);
        return getDefaultValorantStats();
    }
}

/**
 * Fügt neue Valorant Suche zur Historie hinzu
 */
async function addValorantSearch(playerName, playerTag, region, success, discordUserId = null, discordUsername = null, rankData = null, matchData = null) {
    try {
        if (!supabaseClient) {
            await initializeValorantSupabase();
        }

        if (!supabaseClient) {
            console.log('❌ [Valorant-Supabase] Cannot add search (no connection)');
            return null;
        }

        const { data, error } = await supabaseClient
            .rpc('add_valorant_search', {
                p_player_name: playerName,
                p_player_tag: playerTag,
                p_region: region,
                p_success: success,
                p_discord_user_id: discordUserId,
                p_discord_username: discordUsername,
                p_rank_data: rankData,
                p_match_data: matchData
            });

        if (error) {
            console.log('❌ [Valorant-Supabase] Error adding search:', error.message);
            return null;
        }

        console.log('✅ [Valorant-Supabase] Search added successfully');
        return data;

    } catch (error) {
        console.log('❌ [Valorant-Supabase] Error in addValorantSearch:', error.message);
        return null;
    }
}

/**
 * Standard Valorant Einstellungen
 */
function getDefaultValorantSettings() {
    return {
        enabled: false,
        defaultRegion: 'eu',
        outputFormat: {
            mode: 'embed',
            embedEnabled: true,
            cardEnabled: false
        },
        embedConfig: getDefaultEmbedConfig(),
        playerStatsEmbed: getDefaultPlayerStatsEmbed(),
        rankRewards: {
            enabled: false,
            autoCreateRoles: false,
            removeOldRoles: false,
            rolePrefix: 'Valorant',
            ranks: []
        }
    };
}

/**
 * Standard Embed Konfiguration
 */
function getDefaultEmbedConfig() {
    return {
        title: '🎯 Valorant Spielersuche',
        description: 'Klicke auf einen der Buttons unten, um deine Valorant-Stats zu durchsuchen!',
        color: '0xFF4655',
        footer: 'Valorant Tracker • Powered by Agentbee',
        thumbnail: 'valorant',
        customThumbnail: '',
        author: {
            enabled: false,
            name: '',
            iconUrl: ''
        },
        fields: []
    };
}

/**
 * Standard Player Stats Embed Konfiguration
 */
function getDefaultPlayerStatsEmbed() {
    return {
        title: '🎯 Valorant Stats für {playerName}#{playerTag}',
        description: 'Aktuelle Rang-Informationen und Spielstatistiken',
        color: '0xFF4655',
        footer: 'Valorant Tracker • Letzte Aktualisierung: {lastUpdate}',
        thumbnail: 'valorant',
        customThumbnail: '',
        author: {
            enabled: false,
            name: '',
            iconUrl: ''
        },
        fields: {
            currentRank: {
                enabled: true,
                name: '📊 Aktueller Rang',
                value: '{currentRank} ({rr} RR)',
                inline: true
            },
            peakRank: {
                enabled: true,
                name: '🏆 Peak Rang',
                value: '{peakRank} (Season {peakSeason})',
                inline: true
            },
            lastChange: {
                enabled: true,
                name: '📈 Letzte Änderung',
                value: '{lastChange} RR',
                inline: true
            },
            matchStats: {
                enabled: true,
                name: '🎮 Match Stats',
                value: '{totalMatches} Matches analysiert',
                inline: false
            }
        }
    };
}

/**
 * Standard Valorant Statistiken
 */
function getDefaultValorantStats() {
    return {
        totalSearches: 0,
        dailySearches: 0,
        weeklySearches: 0,
        totalPlayers: 0,
        topRegions: {
            eu: 0,
            na: 0,
            ap: 0,
            kr: 0
        },
        systemEnabled: false,
        lastUpdate: new Date().toISOString()
    };
}

// Exports
module.exports = {
    initializeValorantSupabase,
    loadValorantSettings,
    saveValorantSettings,
    loadValorantStats,
    updateValorantStatsSupabase,
    addValorantSearch,
    getDefaultValorantSettings,
    getDefaultValorantStats
}; 