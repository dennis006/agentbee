// ================================================================
// 🎮 LFG SYSTEM - SUPABASE API
// ================================================================
// Looking For Group System with Supabase Integration
// Features: Settings, Cooldowns, Statistics, History

const express = require('express');
const router = express.Router();

// Export für index.js
module.exports = router;

// Global Supabase Client (wird von index.js gesetzt)
let supabase = null;

// Initialisiere Supabase für LFG System
function initializeSupabaseForLFG(supabaseClient) {
    supabase = supabaseClient;
    console.log('✅ LFG Supabase API initialisiert');
}

// Default LFG Settings
const defaultLFGSettings = {
    enabled: false,
    channelId: '',
    channelName: 'lfg-suche',
    roleId: '',
    roleName: 'LFG',
    roleColor: '#9333ea',
    cooldownMinutes: 30,
    maxPingsPerDay: 10,
    autoDeleteAfterHours: 24,
    allowedGames: [
        'Valorant',
        'League of Legends',
        'Overwatch 2',
        'Counter-Strike 2',
        'Apex Legends',
        'Rocket League',
        'Call of Duty',
        'Fortnite',
        'Fragpunk'
    ],
    requireReason: true,
    
    // 🎮 Interactive Features Configuration
    enableButtons: true,
    enableVoiceCreation: true,
    enableDmNotifications: true,
    enableAutoVoiceCleanup: true,
    enableAutoVoiceJoin: true,
    voiceCleanupHours: 2,
    
    // 🏗️ Voice Channel Configuration
    voiceCategoryName: '🎮 Gaming Lobbys',
    voiceAutoCreateCategory: true,
    voiceUserLimitOverride: null,
    voiceChannelPrefix: '',
    
    // 🎯 Game-Specific Settings
    gameTeamSizes: {
        'Valorant': 5,
        'League of Legends': 5,
        'Overwatch 2': 6,
        'Counter-Strike 2': 5,
        'CS2': 5,
        'Apex Legends': 3,
        'Rocket League': 3,
        'Call of Duty': 6,
        'Fortnite': 4,
        'Fragpunk': 5
    },
    
    // 🔧 Advanced Features
    enableTeamSizeDetection: true,
    enableGameDetection: true,
    enableCreatorProtection: true,
    maxTeamSize: 10,
    minTeamSize: 2,
    
    // 📊 Analytics & Tracking
    trackTeamStatistics: true,
    trackUserActivity: true,
    enableLeaderboards: false
};

// ================================================================
// HELPER FUNCTIONS
// ================================================================

// Lade LFG Settings aus Supabase
async function loadLFGSettings(guildId = null) {
    try {
        if (!supabase) {
            console.log('⚠️ Supabase nicht verfügbar, verwende Default Settings');
            return defaultLFGSettings;
        }

        // Wenn keine guildId gegeben, verwende die erste verfügbare Guild
        if (!guildId && global.discordClient) {
            const guild = global.discordClient.guilds.cache.first();
            guildId = guild ? guild.id : null;
        }

        if (!guildId) {
            console.log('⚠️ Keine Guild ID verfügbar, verwende Default Settings');
            return defaultLFGSettings;
        }

        console.log(`🔄 Lade LFG Settings für Guild: ${guildId}`);

        const { data, error } = await supabase
            .from('lfg_settings')
            .select('*')
            .eq('guild_id', guildId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('❌ Supabase LFG Settings Fehler:', error);
            return defaultLFGSettings;
        }

        if (!data) {
            console.log('📝 Keine LFG Settings gefunden, erstelle Default Settings');
            return await createDefaultLFGSettings(guildId);
        }

        // Konvertiere Supabase Daten zu Frontend Format mit allen neuen Feldern
        const settings = {
            enabled: data.enabled || false,
            channelId: data.channel_id || '',
            channelName: data.channel_name || 'lfg-suche',
            roleId: data.role_id || '',
            roleName: data.role_name || 'LFG',
            roleColor: data.role_color || '#9333ea',
            cooldownMinutes: data.cooldown_minutes || 30,
            maxPingsPerDay: data.max_pings_per_day || 10,
            autoDeleteAfterHours: data.auto_delete_after_hours || 24,
            allowedGames: data.allowed_games || defaultLFGSettings.allowedGames,
            requireReason: data.require_reason ?? true,
            
            // 🎮 Interactive Features Configuration
            enableButtons: data.enable_buttons ?? true,
            enableVoiceCreation: data.enable_voice_creation ?? true,
            enableDmNotifications: data.enable_dm_notifications ?? true,
            enableAutoVoiceCleanup: data.enable_auto_voice_cleanup ?? true,
            enableAutoVoiceJoin: data.enable_auto_voice_join ?? true,
            voiceCleanupHours: data.voice_cleanup_hours || 2,
            
            // 🏗️ Voice Channel Configuration
            voiceCategoryName: data.voice_category_name || '🎮 Gaming Lobbys',
            voiceAutoCreateCategory: data.voice_auto_create_category ?? true,
            voiceUserLimitOverride: data.voice_user_limit_override || null,
            voiceChannelPrefix: data.voice_channel_prefix || '',
            
            // 🎯 Game-Specific Settings
            gameTeamSizes: data.game_team_sizes || defaultLFGSettings.gameTeamSizes,
            
            // 🔧 Advanced Features
            enableTeamSizeDetection: data.enable_team_size_detection ?? true,
            enableGameDetection: data.enable_game_detection ?? true,
            enableCreatorProtection: data.enable_creator_protection ?? true,
            maxTeamSize: data.max_team_size || 10,
            minTeamSize: data.min_team_size || 2,
            
            // 📊 Analytics & Tracking
            trackTeamStatistics: data.track_team_statistics ?? true,
            trackUserActivity: data.track_user_activity ?? true,
            enableLeaderboards: data.enable_leaderboards ?? false
        };

        console.log('✅ LFG Settings aus Supabase geladen');
        return settings;

    } catch (error) {
        console.error('❌ Fehler beim Laden der LFG Settings:', error);
        return defaultLFGSettings;
    }
}

// Erstelle Default LFG Settings in Supabase
async function createDefaultLFGSettings(guildId) {
    try {
        if (!supabase || !guildId) {
            return defaultLFGSettings;
        }

        const settingsToInsert = {
            guild_id: guildId,
            ...defaultLFGSettings,
            allowed_games: defaultLFGSettings.allowedGames
        };

        const { data, error } = await supabase
            .from('lfg_settings')
            .insert(settingsToInsert)
            .select()
            .single();

        if (error) {
            console.error('❌ Fehler beim Erstellen der Default LFG Settings:', error);
            return defaultLFGSettings;
        }

        console.log('✅ Default LFG Settings erstellt');
        return {
            ...defaultLFGSettings,
            ...data,
            allowedGames: data.allowed_games || defaultLFGSettings.allowedGames
        };

    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Default LFG Settings:', error);
        return defaultLFGSettings;
    }
}

// Speichere LFG Settings in Supabase
async function saveLFGSettings(settings, guildId = null) {
    try {
        if (!supabase) {
            console.log('⚠️ Supabase nicht verfügbar, Settings nicht gespeichert');
            return false;
        }

        if (!guildId && global.discordClient) {
            const guild = global.discordClient.guilds.cache.first();
            guildId = guild ? guild.id : null;
        }

        if (!guildId) {
            console.error('❌ Keine Guild ID für LFG Settings speichern');
            return false;
        }

        const settingsToSave = {
            guild_id: guildId,
            enabled: settings.enabled,
            channel_id: settings.channelId || settings.channel_id,
            channel_name: settings.channelName || settings.channel_name,
            role_id: settings.roleId || settings.role_id,
            role_name: settings.roleName || settings.role_name,
            role_color: settings.roleColor || settings.role_color,
            cooldown_minutes: settings.cooldownMinutes || settings.cooldown_minutes,
            max_pings_per_day: settings.maxPingsPerDay || settings.max_pings_per_day,
            auto_delete_after_hours: settings.autoDeleteAfterHours || settings.auto_delete_after_hours,
            allowed_games: settings.allowedGames || settings.allowed_games,
            require_reason: settings.requireReason !== undefined ? settings.requireReason : settings.require_reason,
            
            // 🎮 Interactive Features Configuration
            enable_buttons: settings.enableButtons !== undefined ? settings.enableButtons : settings.enable_buttons,
            enable_voice_creation: settings.enableVoiceCreation !== undefined ? settings.enableVoiceCreation : settings.enable_voice_creation,
            enable_dm_notifications: settings.enableDmNotifications !== undefined ? settings.enableDmNotifications : settings.enable_dm_notifications,
            enable_auto_voice_cleanup: settings.enableAutoVoiceCleanup !== undefined ? settings.enableAutoVoiceCleanup : settings.enable_auto_voice_cleanup,
            enable_auto_voice_join: settings.enableAutoVoiceJoin !== undefined ? settings.enableAutoVoiceJoin : settings.enable_auto_voice_join,
            voice_cleanup_hours: settings.voiceCleanupHours || settings.voice_cleanup_hours,
            
            // 🏗️ Voice Channel Configuration
            voice_category_name: settings.voiceCategoryName || settings.voice_category_name,
            voice_auto_create_category: settings.voiceAutoCreateCategory !== undefined ? settings.voiceAutoCreateCategory : settings.voice_auto_create_category,
            voice_user_limit_override: settings.voiceUserLimitOverride || settings.voice_user_limit_override,
            voice_channel_prefix: settings.voiceChannelPrefix || settings.voice_channel_prefix,
            
            // 🎯 Game-Specific Settings
            game_team_sizes: settings.gameTeamSizes || settings.game_team_sizes,
            
            // 🔧 Advanced Features
            enable_team_size_detection: settings.enableTeamSizeDetection !== undefined ? settings.enableTeamSizeDetection : settings.enable_team_size_detection,
            enable_game_detection: settings.enableGameDetection !== undefined ? settings.enableGameDetection : settings.enable_game_detection,
            enable_creator_protection: settings.enableCreatorProtection !== undefined ? settings.enableCreatorProtection : settings.enable_creator_protection,
            max_team_size: settings.maxTeamSize || settings.max_team_size,
            min_team_size: settings.minTeamSize || settings.min_team_size,
            
            // 📊 Analytics & Tracking
            track_team_statistics: settings.trackTeamStatistics !== undefined ? settings.trackTeamStatistics : settings.track_team_statistics,
            track_user_activity: settings.trackUserActivity !== undefined ? settings.trackUserActivity : settings.track_user_activity,
            enable_leaderboards: settings.enableLeaderboards !== undefined ? settings.enableLeaderboards : settings.enable_leaderboards
        };

        const { data, error } = await supabase
            .from('lfg_settings')
            .upsert(settingsToSave, { onConflict: 'guild_id' })
            .select()
            .single();

        if (error) {
            console.error('❌ Fehler beim Speichern der LFG Settings:', error);
            return false;
        }

        console.log('✅ LFG Settings in Supabase gespeichert');
        return true;

    } catch (error) {
        console.error('❌ Fehler beim Speichern der LFG Settings:', error);
        return false;
    }
}

// Lade LFG Statistiken
async function loadLFGStatistics(guildId) {
    try {
        if (!supabase) {
            return {
                totalLFGPosts: 0,
                activePlayers: 0,
                todayPosts: 0,
                popularGame: 'Valorant'
            };
        }

        // Verwende die SQL Function für optimierte Abfrage
        const { data, error } = await supabase
            .rpc('get_lfg_stats', { p_guild_id: guildId });

        if (error) {
            console.error('❌ Fehler beim Laden der LFG Statistiken:', error);
            return {
                totalLFGPosts: 0,
                activePlayers: 0,
                todayPosts: 0,
                popularGame: 'Valorant'
            };
        }

        if (data && data.length > 0) {
            const stats = data[0];
            return {
                totalLFGPosts: stats.total_posts || 0,
                activePlayers: stats.active_players || 0,
                todayPosts: stats.today_posts || 0,
                popularGame: stats.popular_game || 'Valorant'
            };
        }

        return {
            totalLFGPosts: 0,
            activePlayers: 0,
            todayPosts: 0,
            popularGame: 'Valorant'
        };

    } catch (error) {
        console.error('❌ Fehler beim Laden der LFG Statistiken:', error);
        return {
            totalLFGPosts: 0,
            activePlayers: 0,
            todayPosts: 0,
            popularGame: 'Valorant'
        };
    }
}

// ================================================================
// ACTIVE LFG POSTS MANAGEMENT
// ================================================================

// Speichere aktiven LFG Post in Supabase
async function saveActiveLFGPost(lfgPost, guildId, channelId, authorUsername) {
    try {
        if (!supabase) {
            console.log('⚠️ Supabase nicht verfügbar, LFG Post nicht gespeichert');
            return false;
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 Stunden Standard

        const postData = {
            guild_id: guildId,
            channel_id: channelId,
            message_id: lfgPost.messageId,
            author_id: lfgPost.authorId,
            author_username: authorUsername,
            game: lfgPost.game,
            description: lfgPost.description,
            max_players: lfgPost.maxPlayers,
            joined_players: JSON.stringify(lfgPost.joinedPlayers),
            status: lfgPost.status,
            expires_at: expiresAt.toISOString()
        };

        const { data, error } = await supabase
            .from('lfg_active_posts')
            .upsert(postData, { onConflict: 'message_id' })
            .select()
            .single();

        if (error) {
            console.error('❌ Fehler beim Speichern des aktiven LFG Posts:', error);
            return false;
        }

        console.log('✅ Aktiver LFG Post in Supabase gespeichert:', lfgPost.messageId);
        
        // HINZUGEFÜGT: Speichere auch in History und update Statistics
        await saveLFGHistory(lfgPost, guildId, channelId, authorUsername);
        await updateLFGStatistics(guildId, lfgPost.game);
        
        return true;

    } catch (error) {
        console.error('❌ Fehler beim Speichern des aktiven LFG Posts:', error);
        return false;
    }
}

// Aktualisiere aktiven LFG Post in Supabase
async function updateActiveLFGPost(messageId, joinedPlayers, status = null) {
    try {
        if (!supabase) {
            console.log('⚠️ Supabase nicht verfügbar, LFG Post nicht aktualisiert');
            return false;
        }

        const updateData = {
            joined_players: JSON.stringify(joinedPlayers),
            updated_at: new Date().toISOString()
        };

        if (status) {
            updateData.status = status;
        }

        const { data, error } = await supabase
            .from('lfg_active_posts')
            .update(updateData)
            .eq('message_id', messageId)
            .select()
            .single();

        if (error) {
            console.error('❌ Fehler beim Aktualisieren des aktiven LFG Posts:', error);
            return false;
        }

        console.log('✅ Aktiver LFG Post aktualisiert:', messageId);
        return true;

    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren des aktiven LFG Posts:', error);
        return false;
    }
}

// Lösche aktiven LFG Post aus Supabase
async function deleteActiveLFGPost(messageId) {
    try {
        if (!supabase) {
            console.log('⚠️ Supabase nicht verfügbar, LFG Post nicht gelöscht');
            return false;
        }

        const { error } = await supabase
            .from('lfg_active_posts')
            .delete()
            .eq('message_id', messageId);

        if (error) {
            console.error('❌ Fehler beim Löschen des aktiven LFG Posts:', error);
            return false;
        }

        console.log('✅ Aktiver LFG Post gelöscht:', messageId);
        return true;

    } catch (error) {
        console.error('❌ Fehler beim Löschen des aktiven LFG Posts:', error);
        return false;
    }
}

// Lade alle aktiven LFG Posts für eine Guild
async function loadActiveLFGPosts(guildId) {
    try {
        if (!supabase) {
            console.log('⚠️ Supabase nicht verfügbar, keine aktiven LFG Posts geladen');
            return [];
        }

        const { data, error } = await supabase
            .rpc('get_active_lfg_posts', { p_guild_id: guildId });

        if (error) {
            console.error('❌ Fehler beim Laden der aktiven LFG Posts:', error);
            return [];
        }

        if (!data || data.length === 0) {
            console.log('📝 Keine aktiven LFG Posts gefunden für Guild:', guildId);
            return [];
        }

        console.log(`✅ ${data.length} aktive LFG Posts geladen für Guild:`, guildId);
        return data.map(post => ({
            message_id: post.message_id,
            channel_id: post.channel_id,
            author_id: post.author_id,
            author_username: post.author_username,
            game: post.game,
            description: post.description,
            max_players: post.max_players,
            joined_players: JSON.parse(post.joined_players || '[]'),
            status: post.status,
            created_at: new Date(post.created_at),
            expires_at: post.expires_at ? new Date(post.expires_at) : null
        }));

    } catch (error) {
        console.error('❌ Fehler beim Laden der aktiven LFG Posts:', error);
        return [];
    }
}

// ================================================================
// LFG HISTORY MANAGEMENT
// ================================================================

// Speichere LFG Post in History
async function saveLFGHistory(lfgPost, guildId, channelId, authorUsername) {
    try {
        if (!supabase) {
            console.log('⚠️ Supabase nicht verfügbar, LFG History nicht gespeichert');
            return false;
        }

        const historyData = {
            guild_id: guildId,
            user_id: lfgPost.authorId,
            username: authorUsername,
            channel_id: channelId,
            message_id: lfgPost.messageId,
            game: lfgPost.game,
            content: lfgPost.description,
            ping_count: 1 // Initial ping
        };

        const { data, error } = await supabase
            .from('lfg_history')
            .insert(historyData)
            .select()
            .single();

        if (error) {
            console.error('❌ Fehler beim Speichern der LFG History:', error);
            return false;
        }

        console.log('✅ LFG History gespeichert für:', lfgPost.messageId);
        return true;

    } catch (error) {
        console.error('❌ Fehler beim Speichern der LFG History:', error);
        return false;
    }
}

// ================================================================
// LFG STATISTICS MANAGEMENT  
// ================================================================

// Aktualisiere LFG Statistiken
async function updateLFGStatistics(guildId, game) {
    try {
        if (!supabase) {
            console.log('⚠️ Supabase nicht verfügbar, LFG Statistics nicht aktualisiert');
            return false;
        }

        // Erste: Prüfe ob Statistics Eintrag für Guild existiert
        const { data: existingStats, error: selectError } = await supabase
            .from('lfg_statistics')
            .select('*')
            .eq('guild_id', guildId)
            .single();

        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('❌ Fehler beim Abrufen der LFG Statistics:', selectError);
            return false;
        }

        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD Format

        if (!existingStats) {
            // Erstelle neuen Statistics Eintrag
            const newStats = {
                guild_id: guildId,
                total_lfg_posts: 1,
                active_players: 1,
                today_posts: 1,
                popular_game: game,
                daily_reset_date: currentDate
            };

            const { data, error } = await supabase
                .from('lfg_statistics')
                .insert(newStats)
                .select()
                .single();

            if (error) {
                console.error('❌ Fehler beim Erstellen der LFG Statistics:', error);
                return false;
            }

            console.log('✅ Neue LFG Statistics erstellt für Guild:', guildId);
            return true;
        } else {
            // Update existierende Statistics
            const today = new Date().toISOString().split('T')[0];
            const isNewDay = existingStats.daily_reset_date !== today;

            const updateData = {
                total_lfg_posts: existingStats.total_lfg_posts + 1,
                today_posts: isNewDay ? 1 : existingStats.today_posts + 1,
                popular_game: game, // Einfache Implementierung: letztes Spiel
                daily_reset_date: today,
                last_updated: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('lfg_statistics')
                .update(updateData)
                .eq('guild_id', guildId)
                .select()
                .single();

            if (error) {
                console.error('❌ Fehler beim Aktualisieren der LFG Statistics:', error);
                return false;
            }

            console.log(`✅ LFG Statistics aktualisiert für Guild ${guildId}: Total: ${updateData.total_lfg_posts}, Today: ${updateData.today_posts}`);
            return true;
        }

    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der LFG Statistics:', error);
        return false;
    }
}

// ================================================================
// LFG COOLDOWN MANAGEMENT
// ================================================================

// Prüfe LFG Cooldown für User
async function checkLFGCooldown(guildId, userId, settings) {
    try {
        if (!supabase) {
            console.log('⚠️ Supabase nicht verfügbar, Cooldown nicht geprüft');
            return { allowed: true, reason: 'Supabase nicht verfügbar' };
        }

        const { data: cooldownData, error } = await supabase
            .from('lfg_cooldowns')
            .select('*')
            .eq('guild_id', guildId)
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('❌ Fehler beim Abrufen der LFG Cooldowns:', error);
            return { allowed: true, reason: 'Fehler beim Cooldown-Check' };
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        if (!cooldownData) {
            // Erster LFG Post für diesen User
            return { allowed: true, isFirstPost: true };
        }

        // Check Daily Limit
        const isNewDay = cooldownData.daily_reset_date !== today;
        const currentPingsToday = isNewDay ? 0 : cooldownData.pings_today;

        if (currentPingsToday >= settings.maxPingsPerDay) {
            return { 
                allowed: false, 
                reason: `Daily limit erreicht (${settings.maxPingsPerDay} LFG Posts pro Tag)`,
                resetTime: 'Morgen'
            };
        }

        // Check Cooldown
        const lastPing = new Date(cooldownData.last_ping_at);
        const cooldownMs = settings.cooldownMinutes * 60 * 1000;
        const timeSinceLastPing = now - lastPing;

        if (timeSinceLastPing < cooldownMs) {
            const remainingMs = cooldownMs - timeSinceLastPing;
            const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
            
            return { 
                allowed: false, 
                reason: `Cooldown aktiv noch ${remainingMinutes} Minuten`,
                remainingMinutes
            };
        }

        return { allowed: true };

    } catch (error) {
        console.error('❌ Fehler beim Cooldown-Check:', error);
        return { allowed: true, reason: 'Fehler beim Cooldown-Check' };
    }
}

// Update LFG Cooldown nach Post
async function updateLFGCooldown(guildId, userId) {
    try {
        if (!supabase) {
            console.log('⚠️ Supabase nicht verfügbar, Cooldown nicht aktualisiert');
            return false;
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const cooldownData = {
            guild_id: guildId,
            user_id: userId,
            last_ping_at: now.toISOString(),
            pings_today: 1,
            daily_reset_date: today
        };

        const { data, error } = await supabase
            .from('lfg_cooldowns')
            .upsert(cooldownData, { 
                onConflict: 'guild_id,user_id',
                ignoreDuplicates: false 
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Fehler beim Aktualisieren des LFG Cooldowns:', error);
            return false;
        }

        console.log('✅ LFG Cooldown aktualisiert für User:', userId);
        return true;

    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren des LFG Cooldowns:', error);
        return false;
    }
}

// ================================================================
// API ROUTES
// ================================================================

// GET /api/lfg/status - Get LFG system status
router.get('/status', async (req, res) => {
    try {
        const guildId = req.query.guildId || (global.discordClient?.guilds.cache.first()?.id);
        
        if (!guildId) {
            return res.status(400).json({
                success: false,
                error: 'Keine Guild ID verfügbar'
            });
        }

        const settings = await loadLFGSettings(guildId);
        const stats = await loadLFGStatistics(guildId);

        res.json({
            success: true,
            settings,
            stats
        });
    } catch (error) {
        console.error('Fehler beim Laden des LFG Status:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Laden des LFG Status'
        });
    }
});

// POST /api/lfg/settings - Update LFG settings
router.post('/settings', async (req, res) => {
    try {
        const settings = req.body;
        const guildId = settings.guildId || (global.discordClient?.guilds.cache.first()?.id);
        
        if (!guildId) {
            return res.status(400).json({
                success: false,
                error: 'Keine Guild ID verfügbar'
            });
        }

        const saved = await saveLFGSettings(settings, guildId);
        
        if (saved) {
            res.json({
                success: true,
                message: 'LFG Einstellungen gespeichert'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Fehler beim Speichern der Einstellungen'
            });
        }
    } catch (error) {
        console.error('Fehler beim Speichern der LFG Settings:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Speichern der Einstellungen'
        });
    }
});

// POST /api/lfg/toggle - Toggle LFG system
router.post('/toggle', async (req, res) => {
    try {
        const guildId = req.body.guildId || (global.discordClient?.guilds.cache.first()?.id);
        
        if (!guildId) {
            return res.status(400).json({
                success: false,
                error: 'Keine Guild ID verfügbar'
            });
        }

        const settings = await loadLFGSettings(guildId);
        settings.enabled = !settings.enabled;
        
        const saved = await saveLFGSettings(settings, guildId);
        
        if (saved) {
            res.json({
                success: true,
                enabled: settings.enabled,
                message: settings.enabled ? 'LFG System aktiviert' : 'LFG System deaktiviert'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Fehler beim Umschalten des LFG Systems'
            });
        }
    } catch (error) {
        console.error('Fehler beim Umschalten des LFG Systems:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Umschalten des LFG Systems'
        });
    }
});

// POST /api/lfg/setup - Setup LFG channel and role
router.post('/setup', async (req, res) => {
    try {
        const guildId = req.body.guildId || (global.discordClient?.guilds.cache.first()?.id);
        
        if (!guildId) {
            return res.status(400).json({
                success: false,
                error: 'Keine Guild ID verfügbar'
            });
        }

        const settings = await loadLFGSettings(guildId);
        
        // Get Discord client from global scope
        const client = global.discordClient;
        if (!client) {
            return res.status(500).json({
                success: false,
                error: 'Discord Bot ist nicht verfügbar'
            });
        }

        const results = {
            channelCreated: false,
            roleCreated: false,
            channelId: null,
            roleId: null,
            errors: []
        };

        // Get the specific guild
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(500).json({
                success: false,
                error: 'Guild nicht gefunden'
            });
        }

        try {
            // 1. Create LFG Role if it doesn't exist
            let lfgRole = guild.roles.cache.find(role => role.name === settings.roleName);
            
            if (!lfgRole) {
                console.log(`🔧 Erstelle LFG Rolle: ${settings.roleName}`);
                lfgRole = await guild.roles.create({
                    name: settings.roleName,
                    color: settings.roleColor,
                    reason: 'LFG System Setup',
                    mentionable: true
                });
                results.roleCreated = true;
                console.log(`✅ LFG Rolle erstellt: ${lfgRole.name} (${lfgRole.id})`);
            } else {
                console.log(`✅ LFG Rolle existiert bereits: ${lfgRole.name} (${lfgRole.id})`);
            }
            
            results.roleId = lfgRole.id;

            // 2. Create LFG Channel if it doesn't exist
            let lfgChannel = guild.channels.cache.find(channel => 
                channel.name === settings.channelName && channel.type === 0 // Text channel
            );

            if (!lfgChannel) {
                console.log(`🔧 Erstelle LFG Channel: ${settings.channelName}`);
                lfgChannel = await guild.channels.create({
                    name: settings.channelName,
                    type: 0, // Text channel
                    reason: 'LFG System Setup',
                    topic: `🎮 Looking For Group - Finde Mitspieler für deine Lieblingsspiele! Pinge @${settings.roleName} um Spieler zu finden.`,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                            deny: ['ManageMessages', 'ManageChannels']
                        },
                        {
                            id: lfgRole.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'MentionEveryone']
                        }
                    ]
                });
                results.channelCreated = true;
                console.log(`✅ LFG Channel erstellt: ${lfgChannel.name} (${lfgChannel.id})`);
            } else {
                console.log(`✅ LFG Channel existiert bereits: ${lfgChannel.name} (${lfgChannel.id})`);
            }

            results.channelId = lfgChannel.id;

            // 3. Update settings with IDs
            settings.channelId = lfgChannel.id;
            settings.roleId = lfgRole.id;
            await saveLFGSettings(settings, guildId);

            // 4. Send welcome message to LFG channel
            const { EmbedBuilder } = require('discord.js');
            const welcomeEmbed = new EmbedBuilder()
                .setColor(parseInt(settings.roleColor.replace('#', ''), 16))
                .setTitle('🎮 LFG System aktiviert!')
                .setDescription(`Willkommen im **${settings.channelName}** Channel!\n\n` +
                            `**Wie funktioniert's?**\n` +
                            `• Pinge <@&${lfgRole.id}> um Mitspieler zu finden\n` +
                            `• Format: \`@${settings.roleName} - [Spiel]: [Nachricht]\`\n` +
                            `• Beispiel: \`@${settings.roleName} - Valorant: Suche 2 Spieler für Ranked\`\n\n` +
                            `**Unterstützte Spiele:**\n` +
                            settings.allowedGames.map(game => `• ${game}`).join('\n') + '\n\n' +
                            `**Regeln:**\n` +
                            `• Cooldown: ${settings.cooldownMinutes} Minuten zwischen Pings\n` +
                            `• Maximum: ${settings.maxPingsPerDay} Pings pro Tag\n` +
                            `• Nachrichten werden nach ${settings.autoDeleteAfterHours} Stunden gelöscht`)
                .setTimestamp()
                .setFooter({
                    text: 'LFG System by AgentBee'
                });

            await lfgChannel.send({ embeds: [welcomeEmbed] });

            const successMessage = [];
            if (results.roleCreated) successMessage.push(`Rolle "${settings.roleName}" erstellt`);
            if (results.channelCreated) successMessage.push(`Channel "${settings.channelName}" erstellt`);
            if (successMessage.length === 0) successMessage.push('Setup überprüft - alles bereits vorhanden');

            res.json({
                success: true,
                message: `✅ LFG Setup erfolgreich! ${successMessage.join(', ')}`,
                results
            });

        } catch (discordError) {
            console.error('Discord API Fehler:', discordError);
            results.errors.push(discordError.message);
            
            res.status(500).json({
                success: false,
                error: 'Fehler bei Discord API: ' + discordError.message,
                results
            });
        }

    } catch (error) {
        console.error('Fehler beim LFG Setup:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim LFG Setup: ' + error.message
        });
    }
});

// POST /api/lfg/test-ping - Test LFG ping
router.post('/test-ping', async (req, res) => {
    try {
        const { game, reason } = req.body;
        const guildId = req.body.guildId || (global.discordClient?.guilds.cache.first()?.id);
        
        if (!guildId) {
            return res.status(400).json({
                success: false,
                error: 'Keine Guild ID verfügbar'
            });
        }

        const settings = await loadLFGSettings(guildId);
        
        if (!settings.enabled) {
            return res.status(400).json({
                success: false,
                error: 'LFG System ist nicht aktiviert'
            });
        }

        // Get Discord client from global scope
        const client = global.discordClient;
        if (!client) {
            return res.status(500).json({
                success: false,
                error: 'Discord Bot ist nicht verfügbar'
            });
        }

        // Get the guild and LFG channel
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(500).json({
                success: false,
                error: 'Guild nicht gefunden'
            });
        }

        // Find LFG channel
        let lfgChannel = guild.channels.cache.find(channel => 
            (channel.name === settings.channelName || channel.id === settings.channelId) && channel.type === 0
        );

        if (!lfgChannel) {
            return res.status(400).json({
                success: false,
                error: `LFG Channel "${settings.channelName}" nicht gefunden. Führe zuerst das Setup aus.`
            });
        }

        // Find LFG role
        let lfgRole = guild.roles.cache.find(role => 
            role.name === settings.roleName || role.id === settings.roleId
        );

        if (!lfgRole) {
            return res.status(400).json({
                success: false,
                error: `LFG Rolle "${settings.roleName}" nicht gefunden. Führe zuerst das Setup aus.`
            });
        }

        // Create test message content
        const testContent = `<@&${lfgRole.id}> - ${game}${reason ? `: ${reason}` : ''}`;
        
        // Send test message to LFG channel
        const { EmbedBuilder } = require('discord.js');
        const testEmbed = new EmbedBuilder()
            .setColor(parseInt(settings.roleColor.replace('#', ''), 16))
            .setTitle('🧪 LFG Test-Ping')
            .setDescription(`**Test-Nachricht gesendet:**\n\`${testContent}\`\n\n` +
                          `**Spiel:** ${game}\n` +
                          `**Nachricht:** ${reason || 'Keine Nachricht'}\n` +
                          `**Channel:** ${lfgChannel.name}\n` +
                          `**Rolle:** @${lfgRole.name}`)
            .setTimestamp()
            .setFooter({ text: 'Test-Ping von Dashboard' });

        await lfgChannel.send({ embeds: [testEmbed] });
        
        // Also send the actual LFG message for testing
        await lfgChannel.send(testContent);

        res.json({
            success: true,
            message: `✅ Test-Ping erfolgreich an #${lfgChannel.name} gesendet!`,
            details: {
                content: testContent,
                game: game,
                reason: reason,
                channelName: lfgChannel.name,
                roleName: lfgRole.name,
                roleId: lfgRole.id
            }
        });
    } catch (error) {
        console.error('Fehler beim Test-Ping:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Test-Ping: ' + error.message
        });
    }
});

// POST /api/lfg/debug - Debug LFG system
router.post('/debug', async (req, res) => {
    try {
        const guildId = req.body.guildId || (global.discordClient?.guilds.cache.first()?.id);
        
        if (!guildId) {
            return res.status(400).json({
                success: false,
                error: 'Keine Guild ID verfügbar'
            });
        }

        const settings = await loadLFGSettings(guildId);
        const client = global.discordClient;
        
        if (!client) {
            return res.status(500).json({
                success: false,
                error: 'Discord Bot ist nicht verfügbar'
            });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(500).json({
                success: false,
                error: 'Guild nicht gefunden'
            });
        }

        // Debug info sammeln
        const debugInfo = {
            settings: settings,
            guild: {
                id: guild.id,
                name: guild.name,
                memberCount: guild.memberCount
            },
            channels: {
                total: guild.channels.cache.size,
                lfgChannel: null,
                lfgChannelExists: false
            },
            roles: {
                total: guild.roles.cache.size,
                lfgRole: null,
                lfgRoleExists: false
            },
            system: {
                botUser: client.user?.tag,
                botId: client.user?.id,
                uptime: process.uptime(),
                supabaseConnected: !!global.supabaseClient
            }
        };

        // Check LFG Channel
        const lfgChannel = guild.channels.cache.find(channel => 
            (channel.name === settings.channelName || channel.id === settings.channelId) && channel.type === 0
        );
        
        if (lfgChannel) {
            debugInfo.channels.lfgChannelExists = true;
            debugInfo.channels.lfgChannel = {
                id: lfgChannel.id,
                name: lfgChannel.name,
                type: lfgChannel.type,
                topic: lfgChannel.topic,
                permissions: lfgChannel.permissionsFor(client.user)?.toArray() || []
            };
        }

        // Check LFG Role
        const lfgRole = guild.roles.cache.find(role => 
            role.name === settings.roleName || role.id === settings.roleId
        );
        
        if (lfgRole) {
            debugInfo.roles.lfgRoleExists = true;
            debugInfo.roles.lfgRole = {
                id: lfgRole.id,
                name: lfgRole.name,
                color: lfgRole.hexColor,
                mentionable: lfgRole.mentionable,
                memberCount: lfgRole.members.size
            };
        }

        res.json({
            success: true,
            message: 'Debug-Informationen gesammelt',
            debug: debugInfo
        });

    } catch (error) {
        console.error('Fehler beim LFG Debug:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim LFG Debug: ' + error.message
        });
    }
});

// GET /api/lfg/test-buttons - Test button settings
router.get('/test-buttons', async (req, res) => {
    try {
        const guildId = req.query.guildId || (global.discordClient?.guilds.cache.first()?.id);
        
        if (!guildId) {
            return res.status(400).json({
                success: false,
                error: 'Keine Guild ID verfügbar'
            });
        }

        const settings = await loadLFGSettings(guildId);
        
        res.json({
            success: true,
            message: 'Button Settings geladen',
            settings: {
                enabled: settings.enabled,
                enableButtons: settings.enableButtons,
                enableVoiceCreation: settings.enableVoiceCreation,
                enableDmNotifications: settings.enableDmNotifications,
                enableAutoVoiceCleanup: settings.enableAutoVoiceCleanup,
                enableTeamSizeDetection: settings.enableTeamSizeDetection,
                enableGameDetection: settings.enableGameDetection,
                enableCreatorProtection: settings.enableCreatorProtection,
                allowedGames: settings.allowedGames,
                gameTeamSizes: settings.gameTeamSizes
            }
        });

    } catch (error) {
        console.error('Fehler beim Button Test:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Button Test: ' + error.message
        });
    }
});

// POST /api/lfg/update-fragpunk - Add Fragpunk to existing settings
router.post('/update-fragpunk', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({
                success: false,
                error: 'Supabase nicht verfügbar'
            });
        }

        console.log('🎮 Starte Fragpunk Update für alle LFG Settings...');

        // Lade alle bestehenden Settings
        const { data: existingSettings, error: fetchError } = await supabase
            .from('lfg_settings')
            .select('*');

        if (fetchError) {
            console.error('❌ Fehler beim Laden der Settings:', fetchError);
            return res.status(500).json({
                success: false,
                error: 'Fehler beim Laden der Settings: ' + fetchError.message
            });
        }

        let updatedCount = 0;
        const errors = [];

        // Update jede Setting einzeln
        for (const setting of existingSettings || []) {
            try {
                let needsUpdate = false;
                let newAllowedGames = setting.allowed_games || [];
                let newGameTeamSizes = setting.game_team_sizes || {};

                // Füge Fragpunk zu allowed_games hinzu falls nicht vorhanden
                if (!newAllowedGames.includes('Fragpunk')) {
                    newAllowedGames = [...newAllowedGames, 'Fragpunk'];
                    needsUpdate = true;
                }

                // Füge Fragpunk zu game_team_sizes hinzu falls nicht vorhanden
                if (!newGameTeamSizes.Fragpunk) {
                    newGameTeamSizes.Fragpunk = 5;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    const { error: updateError } = await supabase
                        .from('lfg_settings')
                        .update({
                            allowed_games: newAllowedGames,
                            game_team_sizes: newGameTeamSizes,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', setting.id);

                    if (updateError) {
                        console.error(`❌ Fehler beim Update von Guild ${setting.guild_id}:`, updateError);
                        errors.push(`Guild ${setting.guild_id}: ${updateError.message}`);
                    } else {
                        updatedCount++;
                        console.log(`✅ Guild ${setting.guild_id} erfolgreich aktualisiert`);
                    }
                }
            } catch (error) {
                console.error(`❌ Fehler beim Verarbeiten von Guild ${setting.guild_id}:`, error);
                errors.push(`Guild ${setting.guild_id}: ${error.message}`);
            }
        }

        if (errors.length > 0) {
            console.error('❌ Einige Updates fehlgeschlagen:', errors);
        }

        // Prüfe alle Settings nach dem Update
        const { data: allSettings, error: verifyError } = await supabase
            .from('lfg_settings')
            .select('guild_id, allowed_games, game_team_sizes');

        if (verifyError) {
            console.error('❌ Fehler beim Laden der Settings:', verifyError);
        }

        let finalUpdatedCount = 0;
        let totalCount = allSettings ? allSettings.length : 0;
        let fragpunkStats = {
            hasFragpunkInGames: 0,
            hasFragpunkInSizes: 0,
            missingFragpunk: []
        };

        if (allSettings) {
            for (const setting of allSettings) {
                const hasInGames = setting.allowed_games && setting.allowed_games.includes('Fragpunk');
                const hasInSizes = setting.game_team_sizes && setting.game_team_sizes.Fragpunk;
                
                if (hasInGames) fragpunkStats.hasFragpunkInGames++;
                if (hasInSizes) fragpunkStats.hasFragpunkInSizes++;
                
                if (hasInGames && hasInSizes) {
                    finalUpdatedCount++;
                } else {
                    fragpunkStats.missingFragpunk.push({
                        guild_id: setting.guild_id,
                        hasInGames,
                        hasInSizes
                    });
                }
            }
        }

        console.log(`✅ Fragpunk Update abgeschlossen: ${finalUpdatedCount}/${totalCount} Settings aktualisiert`);

        res.json({
            success: true,
            message: `✅ Fragpunk erfolgreich hinzugefügt! ${finalUpdatedCount}/${totalCount} Settings aktualisiert.`,
            stats: {
                totalSettings: totalCount,
                updatedSettings: finalUpdatedCount,
                fragpunkInGames: fragpunkStats.hasFragpunkInGames,
                fragpunkInSizes: fragpunkStats.hasFragpunkInSizes,
                missingFragpunk: fragpunkStats.missingFragpunk
            }
        });

    } catch (error) {
        console.error('❌ Fehler beim Fragpunk Update:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Fragpunk Update: ' + error.message
        });
    }
});

// Export functions für externe Nutzung
module.exports = {
    router,
    initializeSupabaseForLFG,
    loadLFGSettings,
    saveLFGSettings,
    loadLFGStatistics,
    saveActiveLFGPost,
    updateActiveLFGPost,
    deleteActiveLFGPost,
    loadActiveLFGPosts,
    saveLFGHistory,
    updateLFGStatistics,
    checkLFGCooldown,
    updateLFGCooldown
}; 