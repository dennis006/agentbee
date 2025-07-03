const { createClient } = require('@supabase/supabase-js');

class TwitchSupabaseAPI {
    constructor() {
        this.supabase = null;
        this.initializeSupabase();
    }

    // Supabase initialisieren
    initializeSupabase() {
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) {
                console.error('❌ Supabase Credentials fehlen für Twitch System');
                return;
            }

            this.supabase = createClient(supabaseUrl, supabaseKey);
            console.log('✅ Twitch Supabase API initialisiert');
        } catch (error) {
            console.error('❌ Fehler bei Twitch Supabase Initialisierung:', error);
        }
    }

    // Prüfen ob Supabase verfügbar ist
    isAvailable() {
        return this.supabase !== null;
    }

    // =============================================
    // SETTINGS OPERATIONS
    // =============================================

    // Einstellungen laden
    async getSettings(guildId = 'default') {
        try {
            if (!this.isAvailable()) {
                throw new Error('Supabase nicht verfügbar');
            }

            const { data, error } = await this.supabase
                .from('twitch_live_notifications')
                .select('*')
                .eq('guild_id', guildId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw error;
            }

            // Wenn keine Daten gefunden, Standard-Einstellungen erstellen
            if (!data) {
                return await this.createDefaultSettings(guildId);
            }

            // JSON-Felder parsen
            if (typeof data.custom_emojis === 'string') {
                data.custom_emojis = JSON.parse(data.custom_emojis);
            }
            if (typeof data.allowed_categories === 'string') {
                data.allowed_categories = JSON.parse(data.allowed_categories);
            }
            if (typeof data.blocked_categories === 'string') {
                data.blocked_categories = JSON.parse(data.blocked_categories);
            }

            return data;
        } catch (error) {
            console.error('❌ Fehler beim Laden der Twitch-Einstellungen:', error);
            throw error;
        }
    }

    // Standard-Einstellungen erstellen
    async createDefaultSettings(guildId = 'default') {
        try {
            const defaultSettings = {
                guild_id: guildId,
                enabled: true,
                check_interval: 5,
                notification_channel: 'live-streams',
                role_to_mention: '',
                mention_everyone: false,
                embed_color: '0x9146FF',
                show_thumbnail: true,
                show_viewer_count: true,
                show_category: true,
                show_uptime: true,
                custom_message: '🔴 **{{streamer}}** ist jetzt LIVE!',
                include_emojis: true,
                custom_emojis: ['🎮', '🔥', '💜', '⭐', '🚀'],
                only_first_time: false,
                cooldown: 30,
                offline_notification: false,
                stream_ended_message: '📴 **{{streamer}}** hat den Stream beendet!',
                min_viewers: 0,
                allowed_categories: [],
                blocked_categories: [],
                only_followers: false
            };

            const { data, error } = await this.supabase
                .from('twitch_live_notifications')
                .insert(defaultSettings)
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('❌ Fehler beim Erstellen der Standard-Einstellungen:', error);
            throw error;
        }
    }

    // Einstellungen speichern/aktualisieren
    async updateSettings(settings, guildId = 'default') {
        try {
            if (!this.isAvailable()) {
                throw new Error('Supabase nicht verfügbar');
            }

            // JSON-Arrays als JSONB speichern
            const updateData = {
                enabled: settings.enabled,
                check_interval: settings.checkInterval,
                notification_channel: settings.channels?.notificationChannel,
                role_to_mention: settings.channels?.roleToMention || '',
                mention_everyone: settings.channels?.mentionEveryone || false,
                embed_color: settings.embed?.color,
                show_thumbnail: settings.embed?.showThumbnail,
                show_viewer_count: settings.embed?.showViewerCount,
                show_category: settings.embed?.showCategory,
                show_uptime: settings.embed?.showUptime,
                custom_message: settings.embed?.customMessage,
                include_emojis: settings.embed?.includeEmojis,
                custom_emojis: settings.embed?.customEmojis || [],
                only_first_time: settings.notifications?.onlyFirstTime,
                cooldown: settings.notifications?.cooldown,
                offline_notification: settings.notifications?.offlineNotification,
                stream_ended_message: settings.notifications?.streamEndedMessage,
                min_viewers: settings.filters?.minViewers,
                allowed_categories: settings.filters?.allowedCategories || [],
                blocked_categories: settings.filters?.blockedCategories || [],
                only_followers: settings.filters?.onlyFollowers
            };

            const { data, error } = await this.supabase
                .from('twitch_live_notifications')
                .upsert({ guild_id: guildId, ...updateData }, { onConflict: 'guild_id' })
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Twitch-Einstellungen in Supabase gespeichert');
            return data;
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Twitch-Einstellungen:', error);
            throw error;
        }
    }

    // =============================================
    // STREAMERS OPERATIONS
    // =============================================

    // Alle Streamer laden
    async getStreamers(guildId = 'default') {
        try {
            if (!this.isAvailable()) {
                throw new Error('Supabase nicht verfügbar');
            }

            const { data, error } = await this.supabase
                .from('twitch_monitored_streamers')
                .select('*')
                .eq('guild_id', guildId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('❌ Fehler beim Laden der Streamer:', error);
            // Fallback: Return empty array
            return [];
        }
    }

    // Streamer hinzufügen
    async addStreamer(streamerData, guildId = 'default') {
        try {
            if (!this.isAvailable()) {
                throw new Error('Supabase nicht verfügbar');
            }

            const newStreamer = {
                guild_id: guildId,
                username: streamerData.username.toLowerCase(),
                display_name: streamerData.displayName || streamerData.username,
                custom_message: streamerData.customMessage || '',
                enabled: true,
                live_notifications: true,
                offline_notifications: streamerData.offlineNotifications || false,
                total_notifications: 0
            };

            const { data, error } = await this.supabase
                .from('twitch_monitored_streamers')
                .insert(newStreamer)
                .select()
                .single();

            if (error) throw error;

            console.log(`✅ Streamer ${streamerData.username} zu Supabase hinzugefügt`);
            return data;
        } catch (error) {
            console.error('❌ Fehler beim Hinzufügen des Streamers:', error);
            throw error;
        }
    }

    // Streamer aktualisieren
    async updateStreamer(streamerId, updates, guildId = 'default') {
        try {
            if (!this.isAvailable()) {
                throw new Error('Supabase nicht verfügbar');
            }

            const updateData = {
                display_name: updates.displayName,
                custom_message: updates.customMessage,
                enabled: updates.enabled,
                live_notifications: updates.notifications?.live,
                offline_notifications: updates.notifications?.offline
            };

            // Undefined-Werte entfernen
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            const { data, error } = await this.supabase
                .from('twitch_monitored_streamers')
                .update(updateData)
                .eq('id', streamerId)
                .eq('guild_id', guildId)
                .select()
                .single();

            if (error) throw error;

            console.log(`✅ Streamer ${streamerId} in Supabase aktualisiert`);
            return data;
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren des Streamers:', error);
            throw error;
        }
    }

    // Streamer entfernen
    async removeStreamer(streamerId, guildId = 'default') {
        try {
            if (!this.isAvailable()) {
                throw new Error('Supabase nicht verfügbar');
            }

            const { error } = await this.supabase
                .from('twitch_monitored_streamers')
                .delete()
                .eq('id', streamerId)
                .eq('guild_id', guildId);

            if (error) throw error;

            console.log(`✅ Streamer ${streamerId} aus Supabase entfernt`);
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Entfernen des Streamers:', error);
            throw error;
        }
    }

    // Streamer nach Username finden
    async getStreamerByUsername(username, guildId = 'default') {
        try {
            if (!this.isAvailable()) {
                throw new Error('Supabase nicht verfügbar');
            }

            const { data, error } = await this.supabase
                .from('twitch_monitored_streamers')
                .select('*')
                .eq('guild_id', guildId)
                .eq('username', username.toLowerCase())
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return data;
        } catch (error) {
            console.error('❌ Fehler beim Suchen des Streamers:', error);
            return null;
        }
    }

    // =============================================
    // LIVE DATA OPERATIONS
    // =============================================

    // Aktuelle Live-Daten laden (verwende twitch_bot_events für Stream-Events)
    async getLiveData(guildId = 'default') {
        try {
            if (!this.isAvailable()) {
                throw new Error('Supabase nicht verfügbar');
            }

            // Live-Events der letzten 24 Stunden laden
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

            const { data, error } = await this.supabase
                .from('twitch_bot_events')
                .select('*')
                .eq('guild_id', guildId)
                .eq('event_type', 'stream_live')
                .gte('created_at', twentyFourHoursAgo.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('❌ Fehler beim Laden der Live-Daten aus Supabase:', error);
            // Fallback: Return empty array statt Fehler zu werfen
            return [];
        }
    }

    // Live-Status setzen (verwende twitch_bot_events)
    async setLiveStatus(streamerId, streamData, guildId = 'default') {
        try {
            if (!this.isAvailable()) {
                throw new Error('Supabase nicht verfügbar');
            }

            const liveEvent = {
                guild_id: guildId,
                event_type: 'stream_live',
                username: streamData.username || 'unknown',
                data: {
                    streamer_id: streamerId,
                    stream_id: streamData.streamId,
                    started_at: streamData.startedAt
                },
                processed: true
            };

            const { data, error } = await this.supabase
                .from('twitch_bot_events')
                .insert(liveEvent)
                .select()
                .single();

            if (error) throw error;

            // Streamer Statistiken aktualisieren
            await this.incrementNotificationCount(streamerId, guildId);

            console.log(`✅ Live-Event für Streamer ${streamerId} erstellt`);
            return data;
        } catch (error) {
            console.error('❌ Fehler beim Setzen des Live-Status:', error);
            // Fallback: Return success ohne Fehler zu werfen
            return null;
        }
    }

    // Live-Status beenden (erstelle stream_ended Event)
    async endLiveStatus(streamerId, guildId = 'default') {
        try {
            if (!this.isAvailable()) {
                throw new Error('Supabase nicht verfügbar');
            }

            const endEvent = {
                guild_id: guildId,
                event_type: 'stream_ended',
                username: 'unknown',
                data: {
                    streamer_id: streamerId,
                    ended_at: new Date().toISOString()
                },
                processed: true
            };

            const { error } = await this.supabase
                .from('twitch_bot_events')
                .insert(endEvent);

            if (error) throw error;

            console.log(`✅ Stream-End-Event für Streamer ${streamerId} erstellt`);
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Beenden des Live-Status:', error);
            // Fallback: Return success ohne Fehler zu werfen
            return true;
        }
    }

    // Prüfen ob Streamer bereits für diesen Stream benachrichtigt wurde
    async isNotificationSent(streamerId, streamId, guildId = 'default') {
        try {
            if (!this.isAvailable()) {
                throw new Error('Supabase nicht verfügbar');
            }

            const { data, error } = await this.supabase
                .from('twitch_bot_events')
                .select('id')
                .eq('guild_id', guildId)
                .eq('event_type', 'stream_live')
                .contains('data', { stream_id: streamId })
                .single();

            if (error && error.code !== 'PGRST116') {
                // Bei Fehler: Assume false für sicherheit
                return false;
            }

            return !!data;
        } catch (error) {
            console.error('❌ Fehler beim Prüfen der Benachrichtigung:', error);
            return false;
        }
    }

    // =============================================
    // STATISTICS & UTILITIES
    // =============================================

    // Benachrichtigungs-Zähler erhöhen
    async incrementNotificationCount(streamerId, guildId = 'default') {
        try {
            if (!this.isAvailable()) {
                throw new Error('Supabase nicht verfügbar');
            }

            const { error } = await this.supabase
                .rpc('increment_twitch_notifications', {
                    p_streamer_id: streamerId,
                    p_guild_id: guildId
                });

            if (error) {
                // Fallback: Manuelle Aktualisierung
                const { error: updateError } = await this.supabase
                    .from('twitch_monitored_streamers')
                    .update({ 
                        total_notifications: this.supabase.sql`total_notifications + 1`,
                        last_live: new Date().toISOString()
                    })
                    .eq('id', streamerId)
                    .eq('guild_id', guildId);

                if (updateError) throw updateError;
            }

            return true;
        } catch (error) {
            console.error('❌ Fehler beim Erhöhen des Benachrichtigungs-Zählers:', error);
            return false;
        }
    }

    // Statistiken abrufen (berechne aus bestehenden Tabellen)
    async getStats(guildId = 'default') {
        try {
            if (!this.isAvailable()) {
                throw new Error('Supabase nicht verfügbar');
            }

            // Streamer-Statistiken aus twitch_monitored_streamers
            const { data: streamers, error: streamersError } = await this.supabase
                .from('twitch_monitored_streamers')
                .select('total_notifications, enabled')
                .eq('guild_id', guildId);

            if (streamersError) throw streamersError;

            const totalStreamers = streamers?.length || 0;
            const activeStreamers = streamers?.filter(s => s.enabled).length || 0;
            const totalNotifications = streamers?.reduce((sum, s) => sum + (s.total_notifications || 0), 0) || 0;

            // Live-Events der letzten 24 Stunden für currently_live
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

            const { data: liveEvents, error: liveError } = await this.supabase
                .from('twitch_bot_events')
                .select('id')
                .eq('guild_id', guildId)
                .eq('event_type', 'stream_live')
                .gte('created_at', twentyFourHoursAgo.toISOString());

            const currentlyLive = liveEvents?.length || 0;

            return {
                total_streamers: totalStreamers,
                active_streamers: activeStreamers,
                total_notifications: totalNotifications,
                currently_live: currentlyLive
            };
        } catch (error) {
            console.error('❌ Fehler beim Laden der Statistiken:', error);
            return {
                total_streamers: 0,
                active_streamers: 0,
                total_notifications: 0,
                currently_live: 0
            };
        }
    }

    // Alte Live-Daten bereinigen
    async cleanupOldLiveData(hoursOld = 24) {
        try {
            if (!this.isAvailable()) {
                throw new Error('Supabase nicht verfügbar');
            }

            const { data, error } = await this.supabase
                .rpc('cleanup_old_twitch_live_data', { hours_old: hoursOld });

            if (error) throw error;

            console.log(`✅ ${data} alte Live-Daten bereinigt`);
            return data;
        } catch (error) {
            console.error('❌ Fehler beim Bereinigen alter Live-Daten:', error);
            return 0;
        }
    }

    // =============================================
    // MIGRATION HELPER
    // =============================================

    // JSON-Daten zu Supabase migrieren
    async migrateFromJSON(settingsData, streamersData, liveData) {
        try {
            console.log('🔄 Starte Migration von JSON zu Supabase...');

            // Settings migrieren
            if (settingsData) {
                console.log('📝 Migriere Einstellungen...');
                await this.updateSettings(settingsData);
            }

            // Streamers migrieren
            if (streamersData && streamersData.length > 0) {
                console.log(`📊 Migriere ${streamersData.length} Streamer...`);
                for (const streamer of streamersData) {
                    try {
                        await this.addStreamer({
                            username: streamer.username,
                            displayName: streamer.displayName,
                            customMessage: streamer.customMessage,
                            offlineNotifications: streamer.notifications?.offline
                        });
                    } catch (error) {
                        console.log(`⚠️ Streamer ${streamer.username} bereits vorhanden oder Fehler:`, error.message);
                    }
                }
            }

            console.log('✅ Migration abgeschlossen!');
            return true;
        } catch (error) {
            console.error('❌ Fehler bei der Migration:', error);
            throw error;
        }
    }
}

module.exports = TwitchSupabaseAPI; 