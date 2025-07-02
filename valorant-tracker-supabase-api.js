// =====================================================
// DISCORD BOT - VALORANT TRACKER SUPABASE API
// =====================================================
// Ersetzt: JSON-basierte Valorant Statistiken und Einstellungen
// =====================================================

const { createClient } = require('@supabase/supabase-js');

// Globale Variablen für Supabase
let supabaseClient = null;

/**
 * Initialisiere Supabase Client für Valorant Tracker
 */
function initializeValorantSupabase() {
    if (typeof global !== 'undefined' && global.supabaseClient) {
        supabaseClient = global.supabaseClient;
        console.log('✅ Valorant Tracker: Verwende bestehende Supabase-Verbindung');
        return true;
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Valorant Tracker: SUPABASE_URL oder SUPABASE_KEY nicht gefunden');
            return false;
        }

        supabaseClient = createClient(supabaseUrl, supabaseKey);
        
        if (typeof global !== 'undefined') {
            global.supabaseClient = supabaseClient;
        }

        console.log('✅ Valorant Tracker: Supabase-Verbindung erfolgreich initialisiert');
        return true;
    } catch (error) {
        console.error('❌ Valorant Tracker: Fehler beim Initialisieren von Supabase:', error);
        return false;
    }
}

/**
 * Prüfe Supabase-Verbindung
 */
async function checkValorantSupabaseConnection() {
    if (!supabaseClient) {
        const initialized = initializeValorantSupabase();
        if (!initialized) return false;
    }

    try {
        const { data, error } = await supabaseClient
            .from('valorant_tracker_settings')
            .select('id')
            .limit(1);

        if (error) {
            console.error('❌ Valorant Tracker: Supabase-Verbindungsfehler:', error.message);
            return false;
        }

        console.log('✅ Valorant Tracker: Supabase-Verbindung erfolgreich getestet');
        return true;
    } catch (error) {
        console.error('❌ Valorant Tracker: Unerwarteter Fehler bei Verbindungstest:', error);
        return false;
    }
}

/**
 * Lade Valorant Tracker Einstellungen aus Supabase
 */
async function loadValorantSettings() {
    try {
        if (!await checkValorantSupabaseConnection()) {
            throw new Error('Supabase-Verbindung fehlgeschlagen');
        }

        const { data, error } = await supabaseClient
            .from('valorant_tracker_settings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // Wenn keine Einstellungen gefunden, erstelle Standard-Einstellungen
            if (error.code === 'PGRST116') {
                console.log('ℹ️ Valorant Tracker: Keine Einstellungen gefunden, erstelle Standard-Einstellungen');
                return await createDefaultValorantSettings();
            }
            throw error;
        }

        // Konvertiere Supabase-Format zu Frontend-Format
        const settings = {
            enabled: data.enabled,
            defaultRegion: data.default_region,
            refreshInterval: data.refresh_interval,
            rateLimit: {
                current: data.rate_limit_current,
                limit: data.rate_limit_max,
                resetTime: new Date(data.rate_limit_reset_time).getTime()
            },
            features: data.features,
            notifications: data.notifications,
            outputFormat: data.output_format,
            visibility: data.visibility,
            rankRewards: data.rank_rewards,
            embed: data.embed_config,
            playerStatsEmbed: data.player_stats_embed
        };

        console.log('✅ Valorant Tracker: Einstellungen erfolgreich geladen');
        return settings;

    } catch (error) {
        console.error('❌ Valorant Tracker: Fehler beim Laden der Einstellungen:', error);
        throw error;
    }
}

/**
 * Speichere Valorant Tracker Einstellungen in Supabase
 */
async function saveValorantSettings(settings) {
    try {
        if (!await checkValorantSupabaseConnection()) {
            throw new Error('Supabase-Verbindung fehlgeschlagen');
        }

        // Konvertiere Frontend-Format zu Supabase-Format
        const supabaseData = {
            enabled: settings.enabled,
            default_region: settings.defaultRegion,
            refresh_interval: settings.refreshInterval,
            rate_limit_current: settings.rateLimit?.current || 0,
            rate_limit_max: settings.rateLimit?.limit || 30,
            rate_limit_reset_time: new Date(settings.rateLimit?.resetTime || Date.now()),
            features: settings.features,
            notifications: settings.notifications,
            output_format: settings.outputFormat,
            visibility: settings.visibility,
            rank_rewards: settings.rankRewards,
            embed_config: settings.embed,
            player_stats_embed: settings.playerStatsEmbed
        };

        // Lösche alle bestehenden Einstellungen und erstelle neue
        const { error: deleteError } = await supabaseClient
            .from('valorant_tracker_settings')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Lösche alle Einträge

        if (deleteError) {
            console.warn('⚠️ Valorant Tracker: Warnung beim Löschen alter Einstellungen:', deleteError.message);
        }

        // Erstelle neue Einstellungen
        const { data, error } = await supabaseClient
            .from('valorant_tracker_settings')
            .insert([supabaseData])
            .select()
            .single();

        if (error) {
            throw error;
        }

        console.log('✅ Valorant Tracker: Einstellungen erfolgreich gespeichert');
        return data;

    } catch (error) {
        console.error('❌ Valorant Tracker: Fehler beim Speichern der Einstellungen:', error);
        throw error;
    }
}

/**
 * Erstelle Standard-Einstellungen
 */
async function createDefaultValorantSettings() {
    const defaultSettings = {
        enabled: false,
        defaultRegion: 'eu',
        refreshInterval: 300,
        rateLimit: {
            current: 0,
            limit: 30,
            resetTime: Date.now()
        },
        features: {
            mmrTracking: true,
            matchHistory: true,
            leaderboard: true,
            playerStats: true
        },
        notifications: {
            rankUpdates: false,
            newMatches: false,
            channelName: '',
            autoPost: false
        },
        outputFormat: {
            mode: 'embed',
            embedEnabled: true,
            cardEnabled: false
        },
        visibility: {
            public: true,
            allowUserChoice: false
        },
        rankRewards: {
            enabled: false,
            autoCreateRoles: false,
            removeOldRoles: false,
            rolePrefix: 'Valorant',
            ranks: []
        },
        embed: {
            title: '🎯 Valorant Spielersuche',
            description: 'Klicke auf einen der Buttons unten, um deine Valorant-Stats zu durchsuchen!',
            color: '0xFF4655',
            footer: 'Valorant Tracker • Powered by Riot API',
            thumbnail: 'valorant',
            customThumbnail: '',
            author: {
                enabled: false,
                name: '',
                iconUrl: ''
            },
            fields: []
        },
        playerStatsEmbed: {
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
        }
    };

    return await saveValorantSettings(defaultSettings);
}

/**
 * Lade Valorant Tracker Statistiken aus Supabase
 */
async function loadValorantStats() {
    try {
        if (!await checkValorantSupabaseConnection()) {
            throw new Error('Supabase-Verbindung fehlgeschlagen');
        }

        const { data, error } = await supabaseClient
            .from('valorant_tracker_stats')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // Wenn keine Statistiken gefunden, erstelle Standard-Statistiken
            if (error.code === 'PGRST116') {
                console.log('ℹ️ Valorant Tracker: Keine Statistiken gefunden, erstelle Standard-Statistiken');
                return await createDefaultValorantStats();
            }
            throw error;
        }

        // Konvertiere zu Frontend-Format
        const stats = {
            totalSearches: data.total_searches,
            activeTracking: data.active_tracking,
            totalPlayers: data.total_players,
            apiCalls: data.api_calls,
            systemEnabled: data.system_enabled,
            lastUpdate: data.last_update,
            dailySearches: data.daily_searches,
            weeklySearches: data.weekly_searches,
            topRegions: data.top_regions
        };

        console.log('✅ Valorant Tracker: Statistiken erfolgreich geladen');
        return stats;

    } catch (error) {
        console.error('❌ Valorant Tracker: Fehler beim Laden der Statistiken:', error);
        throw error;
    }
}

/**
 * Aktualisiere Valorant Tracker Statistiken in Supabase
 */
async function updateValorantStatsSupabase(searchData = null) {
    try {
        if (!await checkValorantSupabaseConnection()) {
            throw new Error('Supabase-Verbindung fehlgeschlagen');
        }

        // Verwende die Supabase-Funktion um Statistiken zu aktualisieren
        const { data, error } = await supabaseClient
            .rpc('update_valorant_stats', {
                search_data: searchData ? JSON.stringify(searchData) : null
            });

        if (error) {
            throw error;
        }

        // Falls keine Daten zurückgegeben wurden, lade die aktuellen Statistiken
        if (!data || data.length === 0) {
            return await loadValorantStats();
        }

        // Konvertiere Supabase-Format zu Frontend-Format (FIXED: neue Return-Parameter)
        const result = data[0];
        const stats = {
            totalSearches: result.result_total_searches,
            dailySearches: result.result_daily_searches,
            weeklySearches: result.result_weekly_searches,
            totalPlayers: result.result_total_players,
            topRegions: result.result_top_regions,
            systemEnabled: result.result_system_enabled,
            lastUpdate: new Date().toISOString()
        };

        console.log('✅ Valorant Tracker: Statistiken erfolgreich aktualisiert');
        return stats;

    } catch (error) {
        console.error('❌ Valorant Tracker: Fehler beim Aktualisieren der Statistiken:', error);
        throw error;
    }
}

/**
 * Erstelle Standard-Statistiken
 */
async function createDefaultValorantStats() {
    try {
        const { data, error } = await supabaseClient
            .from('valorant_tracker_stats')
            .insert([{
                total_searches: 0,
                active_tracking: 0,
                total_players: 0,
                api_calls: 0,
                system_enabled: false,
                daily_searches: 0,
                weekly_searches: 0,
                top_regions: { eu: 0, na: 0, ap: 0, kr: 0 }
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        console.log('✅ Valorant Tracker: Standard-Statistiken erstellt');
        
        return {
            totalSearches: 0,
            activeTracking: 0,
            totalPlayers: 0,
            apiCalls: 0,
            systemEnabled: false,
            lastUpdate: new Date().toISOString(),
            dailySearches: 0,
            weeklySearches: 0,
            topRegions: { eu: 0, na: 0, ap: 0, kr: 0 }
        };

    } catch (error) {
        console.error('❌ Valorant Tracker: Fehler beim Erstellen der Standard-Statistiken:', error);
        throw error;
    }
}

/**
 * Füge neue Valorant-Suche zur Historie hinzu
 */
async function addValorantSearch(searchParams) {
    try {
        if (!await checkValorantSupabaseConnection()) {
            throw new Error('Supabase-Verbindung fehlgeschlagen');
        }

        const {
            playerName,
            playerTag,
            region,
            success,
            discordUserId = null,
            discordUsername = null,
            rankData = null,
            matchData = null,
            errorMessage = null
        } = searchParams;

        // Verwende die Supabase-Funktion um Suche hinzuzufügen
        const { data, error } = await supabaseClient
            .rpc('add_valorant_search', {
                p_player_name: playerName,
                p_player_tag: playerTag,
                p_region: region,
                p_success: success,
                p_discord_user_id: discordUserId,
                p_discord_username: discordUsername,
                p_rank_data: rankData ? JSON.stringify(rankData) : null,
                p_match_data: matchData ? JSON.stringify(matchData) : null
            });

        if (error) {
            throw error;
        }

        console.log(`✅ Valorant Tracker: Suche hinzugefügt - ${playerName}#${playerTag} (${region}) - Erfolg: ${success}`);
        return data; // UUID der neuen Suche

    } catch (error) {
        console.error('❌ Valorant Tracker: Fehler beim Hinzufügen der Suche:', error);
        throw error;
    }
}

/**
 * Lade Valorant-Suchhistorie aus Supabase
 */
async function getValorantSearchHistory(limit = 50, offset = 0) {
    try {
        if (!await checkValorantSupabaseConnection()) {
            throw new Error('Supabase-Verbindung fehlgeschlagen');
        }

        const { data, error } = await supabaseClient
            .from('valorant_search_history')
            .select('*')
            .order('search_timestamp', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw error;
        }

        // Konvertiere zu Frontend-Format
        const history = data.map(item => ({
            player: item.full_player_name,
            region: item.region,
            timestamp: item.search_timestamp,
            success: item.success,
            discordUser: item.discord_username,
            errorMessage: item.error_message,
            rankData: item.rank_data,
            matchData: item.match_data
        }));

        console.log(`✅ Valorant Tracker: ${history.length} Suchhistorie-Einträge geladen`);
        return history;

    } catch (error) {
        console.error('❌ Valorant Tracker: Fehler beim Laden der Suchhistorie:', error);
        throw error;
    }
}

/**
 * Bereinige alte Suchhistorie (behalte nur letzte 1000 Einträge)
 */
async function cleanupValorantSearchHistory() {
    try {
        if (!await checkValorantSupabaseConnection()) {
            throw new Error('Supabase-Verbindung fehlgeschlagen');
        }

        const { data, error } = await supabaseClient
            .rpc('cleanup_old_search_history');

        if (error) {
            throw error;
        }

        const deletedCount = data || 0;
        console.log(`✅ Valorant Tracker: ${deletedCount} alte Suchhistorie-Einträge bereinigt`);
        return deletedCount;

    } catch (error) {
        console.error('❌ Valorant Tracker: Fehler beim Bereinigen der Suchhistorie:', error);
        throw error;
    }
}

/**
 * Migriere bestehende JSON-Daten zu Supabase
 */
async function migrateValorantJSONToSupabase() {
    const fs = require('fs');
    
    try {
        console.log('🔄 Valorant Tracker: Starte Migration von JSON zu Supabase...');

        // Migriere Statistiken
        if (fs.existsSync('./valorant-stats.json')) {
            const jsonStats = JSON.parse(fs.readFileSync('./valorant-stats.json', 'utf8'));
            
            // Migriere Suchhistorie
            if (jsonStats.searchHistory && jsonStats.searchHistory.length > 0) {
                console.log(`🔄 Migriere ${jsonStats.searchHistory.length} Suchhistorie-Einträge...`);
                
                for (const search of jsonStats.searchHistory) {
                    const [playerName, playerTag] = search.player.split('#');
                    
                    await addValorantSearch({
                        playerName: playerName || 'Unknown',
                        playerTag: playerTag || '0000',
                        region: search.region,
                        success: search.success,
                        discordUserId: null,
                        discordUsername: null,
                        rankData: null,
                        matchData: null
                    });
                }
            }

            // Backup der alten Datei
            fs.renameSync('./valorant-stats.json', `./valorant-stats-backup-${Date.now()}.json`);
            console.log('✅ Valorant Stats JSON-Datei gesichert und umbenannt');
        }

        // Migriere Spielerdaten (falls vorhanden)
        if (fs.existsSync('./valorant-players.json')) {
            const jsonPlayers = JSON.parse(fs.readFileSync('./valorant-players.json', 'utf8'));
            
            if (jsonPlayers.length > 0) {
                console.log(`🔄 Verarbeite ${jsonPlayers.length} Spielerdaten...`);
                // Hier könnten weitere Spielerdaten verarbeitet werden falls nötig
            }

            // Backup der alten Datei
            fs.renameSync('./valorant-players.json', `./valorant-players-backup-${Date.now()}.json`);
            console.log('✅ Valorant Players JSON-Datei gesichert und umbenannt');
        }

        console.log('✅ Valorant Tracker: Migration von JSON zu Supabase erfolgreich abgeschlossen!');
        return true;

    } catch (error) {
        console.error('❌ Valorant Tracker: Fehler bei der Migration:', error);
        return false;
    }
}

/**
 * Test-Funktion für Valorant Tracker Supabase
 */
async function testValorantSupabase() {
    try {
        console.log('🧪 Teste Valorant Tracker Supabase...');

        // 1. Verbindung testen
        const connected = await checkValorantSupabaseConnection();
        if (!connected) {
            throw new Error('Supabase-Verbindung fehlgeschlagen');
        }

        // 2. Einstellungen laden/erstellen
        const settings = await loadValorantSettings();
        console.log('✅ Einstellungen:', settings ? 'Geladen' : 'Fehler');

        // 3. Statistiken laden/erstellen
        const stats = await loadValorantStats();
        console.log('✅ Statistiken:', stats ? 'Geladen' : 'Fehler');

        // 4. Test-Suche hinzufügen
        await addValorantSearch({
            playerName: 'TestPlayer',
            playerTag: '1234',
            region: 'eu',
            success: true,
            discordUserId: '123456789',
            discordUsername: 'TestUser'
        });
        console.log('✅ Test-Suche erfolgreich hinzugefügt');

        // 5. Statistiken aktualisieren
        const updatedStats = await updateValorantStatsSupabase({
            playerName: 'TestPlayer',
            playerTag: '1234',
            region: 'eu',
            success: true
        });
        console.log('✅ Statistiken aktualisiert:', updatedStats.totalSearches);

        console.log('✅ Valorant Tracker Supabase Test erfolgreich!');
        return true;

    } catch (error) {
        console.error('❌ Valorant Tracker Supabase Test fehlgeschlagen:', error);
        return false;
    }
}

// Export aller Funktionen
module.exports = {
    initializeValorantSupabase,
    checkValorantSupabaseConnection,
    loadValorantSettings,
    saveValorantSettings,
    createDefaultValorantSettings,
    loadValorantStats,
    updateValorantStatsSupabase,
    createDefaultValorantStats,
    addValorantSearch,
    getValorantSearchHistory,
    cleanupValorantSearchHistory,
    migrateValorantJSONToSupabase,
    testValorantSupabase
}; 