// Twitch Bot Stream Events API
// Automatische Nachrichten bei Stream-Start/Ende Events

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

// Supabase Client (wird von Hauptsystem gesetzt)
let supabaseClient = null;

// Globale Bot-Instanz
let twitchBot = null;

// Supabase Client setzen
function initializeSupabase(client) {
    supabaseClient = client;
    console.log('✅ Twitch Bot Stream Events API initialisiert');
}

// Bot-Instanz setzen
function setTwitchBot(bot) {
    twitchBot = bot;
}

// Stream Events API Routes
function createTwitchBotStreamEventsAPI(app) {
    
    // =============================================
    // STREAM START MESSAGES
    // =============================================
    
    // Stream-Start Einstellungen abrufen
    app.get('/api/twitch-bot/stream-events/settings', async (req, res) => {
        try {
            console.log('📺 [API] Getting stream events settings...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const { data, error } = await supabaseClient
                .from('twitch_bot_stream_events')
                .select('*')
                .eq('guild_id', 'default')
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Error fetching stream events settings:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            const settings = data || {
                stream_start_enabled: false,
                stream_start_message: '🔴 Stream startet! Lasst uns Spaß haben! 🎮',
                stream_start_delay: 30,
                stream_end_enabled: false,
                stream_end_message: '📴 Stream beendet! Danke fürs Zuschauen! ❤️',
                raid_message_enabled: false,
                raid_message: '⚡ Raid incoming! Willkommen {raiders}! 🎉',
                follow_message_enabled: false,
                follow_message: '💜 Danke für den Follow {username}! 🙏',
                sub_message_enabled: false,
                sub_message: '🎉 {username} ist jetzt Subscriber! Willkommen in der Familie! 👑',
                donation_message_enabled: false,
                donation_message: '💰 Wow! {username} hat {amount} gespendet! Vielen Dank! 🙏'
            };

            console.log('✅ Stream events settings retrieved successfully');
            res.json({
                success: true,
                settings
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/stream-events/settings GET:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Stream-Start Einstellungen speichern
    app.post('/api/twitch-bot/stream-events/settings', async (req, res) => {
        try {
            console.log('📺 [API] Saving stream events settings...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const settings = req.body;

            const settingsData = {
                guild_id: 'default',
                stream_start_enabled: settings.streamStartEnabled || false,
                stream_start_message: settings.streamStartMessage || '🔴 Stream startet! Lasst uns Spaß haben! 🎮',
                stream_start_delay: settings.streamStartDelay || 30,
                stream_end_enabled: settings.streamEndEnabled || false,
                stream_end_message: settings.streamEndMessage || '📴 Stream beendet! Danke fürs Zuschauen! ❤️',
                raid_message_enabled: settings.raidMessageEnabled || false,
                raid_message: settings.raidMessage || '⚡ Raid incoming! Willkommen {raiders}! 🎉',
                follow_message_enabled: settings.followMessageEnabled || false,
                follow_message: settings.followMessage || '💜 Danke für den Follow {username}! 🙏',
                sub_message_enabled: settings.subMessageEnabled || false,
                sub_message: settings.subMessage || '🎉 {username} ist jetzt Subscriber! Willkommen in der Familie! 👑',
                donation_message_enabled: settings.donationMessageEnabled || false,
                donation_message: settings.donationMessage || '💰 Wow! {username} hat {amount} gespendet! Vielen Dank! 🙏',
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabaseClient
                .from('twitch_bot_stream_events')
                .upsert(settingsData, { onConflict: 'guild_id' })
                .select()
                .single();

            if (error) {
                console.error('❌ Error saving stream events settings:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            console.log('✅ Stream events settings saved successfully');
            res.json({
                success: true,
                message: 'Stream Events Einstellungen gespeichert!',
                settings: data
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/stream-events/settings POST:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // =============================================
    // STREAM EVENT TRIGGERS
    // =============================================

    // Manuellen Stream-Start triggern (für Tests)
    app.post('/api/twitch-bot/stream-events/trigger/start', async (req, res) => {
        try {
            console.log('🎬 [API] Triggering manual stream start...');
            
            if (!supabaseClient || !twitchBot) {
                return res.status(500).json({
                    success: false,
                    error: 'System not initialized'
                });
            }

            // Einstellungen abrufen
            const { data: settings } = await supabaseClient
                .from('twitch_bot_stream_events')
                .select('*')
                .eq('guild_id', 'default')
                .single();

            if (!settings || !settings.stream_start_enabled) {
                return res.status(400).json({
                    success: false,
                    error: 'Stream-Start Nachrichten sind deaktiviert'
                });
            }

            // Alle aktiven Channels abrufen
            const { data: channels } = await supabaseClient
                .from('twitch_bot_channels')
                .select('*')
                .eq('guild_id', 'default')
                .eq('enabled', true);

            if (!channels || channels.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Keine aktiven Channels gefunden'
                });
            }

            // Stream-Start Nachrichten senden
            let messagesSent = 0;
            for (const channel of channels) {
                try {
                    if (twitchBot.isConnected) {
                        const formattedChannel = channel.channel_name.startsWith('#') ? 
                            channel.channel_name : `#${channel.channel_name}`;
                        
                        // Delay berücksichtigen
                        setTimeout(() => {
                            twitchBot.sendMessage(formattedChannel, settings.stream_start_message);
                        }, settings.stream_start_delay * 1000);
                        
                        messagesSent++;
                        console.log(`📺 Stream-Start Nachricht für ${formattedChannel} geplant`);
                    }
                } catch (error) {
                    console.error(`❌ Fehler beim Senden für ${channel.channel_name}:`, error);
                }
            }

            // Event loggen
            await supabaseClient
                .from('twitch_bot_events')
                .insert({
                    guild_id: 'default',
                    event_type: 'stream_start_manual',
                    event_data: {
                        channels_count: messagesSent,
                        message: settings.stream_start_message,
                        delay: settings.stream_start_delay
                    },
                    created_at: new Date().toISOString()
                });

            console.log(`✅ Stream-Start Nachrichten für ${messagesSent} Channels geplant`);
            res.json({
                success: true,
                message: `Stream-Start Nachrichten für ${messagesSent} Channels gesendet!`,
                channelsCount: messagesSent,
                delay: settings.stream_start_delay
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/stream-events/trigger/start:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Stream-Ende triggern
    app.post('/api/twitch-bot/stream-events/trigger/end', async (req, res) => {
        try {
            console.log('🎬 [API] Triggering manual stream end...');
            
            if (!supabaseClient || !twitchBot) {
                return res.status(500).json({
                    success: false,
                    error: 'System not initialized'
                });
            }

            // Einstellungen abrufen
            const { data: settings } = await supabaseClient
                .from('twitch_bot_stream_events')
                .select('*')
                .eq('guild_id', 'default')
                .single();

            if (!settings || !settings.stream_end_enabled) {
                return res.status(400).json({
                    success: false,
                    error: 'Stream-Ende Nachrichten sind deaktiviert'
                });
            }

            // Alle aktiven Channels abrufen
            const { data: channels } = await supabaseClient
                .from('twitch_bot_channels')
                .select('*')
                .eq('guild_id', 'default')
                .eq('enabled', true);

            if (!channels || channels.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Keine aktiven Channels gefunden'
                });
            }

            // Stream-Ende Nachrichten senden
            let messagesSent = 0;
            for (const channel of channels) {
                try {
                    if (twitchBot.isConnected) {
                        const formattedChannel = channel.channel_name.startsWith('#') ? 
                            channel.channel_name : `#${channel.channel_name}`;
                        
                        twitchBot.sendMessage(formattedChannel, settings.stream_end_message);
                        messagesSent++;
                        console.log(`📴 Stream-Ende Nachricht für ${formattedChannel} gesendet`);
                    }
                } catch (error) {
                    console.error(`❌ Fehler beim Senden für ${channel.channel_name}:`, error);
                }
            }

            // Event loggen
            await supabaseClient
                .from('twitch_bot_events')
                .insert({
                    guild_id: 'default',
                    event_type: 'stream_end_manual',
                    event_data: {
                        channels_count: messagesSent,
                        message: settings.stream_end_message
                    },
                    created_at: new Date().toISOString()
                });

            console.log(`✅ Stream-Ende Nachrichten für ${messagesSent} Channels gesendet`);
            res.json({
                success: true,
                message: `Stream-Ende Nachrichten für ${messagesSent} Channels gesendet!`,
                channelsCount: messagesSent
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/stream-events/trigger/end:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // =============================================
    // EVENT HISTORY & STATISTICS
    // =============================================

    // Event History abrufen
    app.get('/api/twitch-bot/stream-events/history', async (req, res) => {
        try {
            console.log('📊 [API] Getting stream events history...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const { data, error } = await supabaseClient
                .from('twitch_bot_events')
                .select('*')
                .eq('guild_id', 'default')
                .in('event_type', ['stream_start_manual', 'stream_end_manual', 'stream_start_auto', 'stream_end_auto'])
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('❌ Error fetching events history:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            const events = data.map(event => ({
                id: event.id,
                type: event.event_type,
                data: event.event_data,
                timestamp: event.created_at
            }));

            console.log(`✅ Retrieved ${events.length} stream events`);
            res.json({
                success: true,
                events
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/stream-events/history:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    console.log('📺 Twitch Bot Stream Events API routes initialized');
}

module.exports = {
    initializeSupabase,
    setTwitchBot,
    createTwitchBotStreamEventsAPI
}; 