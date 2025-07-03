// Twitch Bot System - Supabase API
// Multi-Channel Twitch Chat Bot Management

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const TwitchChatBot = require('./twitch-chat-bot');
const { createTwitchBotStreamEventsAPI, initializeSupabase: initializeStreamEventsSupabase, setTwitchBot: setStreamEventsTwitchBot } = require('./twitch-bot-stream-events-api');

// Supabase Client (wird in index.js initialisiert)
let supabaseClient = null;

// Globale Bot-Instanz
let twitchBot = null;

// Supabase Client setzen
function initializeSupabase(client) {
    supabaseClient = client;
    
    // Twitch Chat Bot initialisieren
    twitchBot = new TwitchChatBot();
    
    // Stream Events API initialisieren
    initializeStreamEventsSupabase(client);
    setStreamEventsTwitchBot(twitchBot);
    
    console.log('✅ Twitch Bot Supabase API initialisiert');
}

// Discord Client für Bot setzen
function setDiscordClient(discordClient) {
    if (twitchBot) {
        twitchBot.setDiscordClient(discordClient);
        console.log('🤖 Discord Client für Twitch Bot gesetzt');
    }
}

// Twitch Bot API Routes
function createTwitchBotAPI(app) {
    
    // =============================================
    // BOT SETTINGS MANAGEMENT
    // =============================================
    
    // Bot Einstellungen abrufen
    app.get('/api/twitch-bot/settings', async (req, res) => {
        try {
            console.log('🤖 [API] Getting Twitch Bot settings...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const { data, error } = await supabaseClient
                .from('twitch_bot_settings')
                .select('*')
                .eq('guild_id', 'default')
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Error fetching bot settings:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            // Default-Einstellungen falls noch keine existieren
            const defaultSettings = {
                botEnabled: false,
                botUsername: 'AgentBeeBot',
                oauthToken: '',
                autoConnect: true,
                reconnectAttempts: 3,
                commandPrefix: '!',
                modCommandsOnly: false,
                allowedRoles: [],
                blockedUsers: [],
                globalCooldown: 3
            };

            const settings = data ? {
                botEnabled: data.bot_enabled,
                botUsername: data.bot_username,
                oauthToken: data.oauth_token,
                autoConnect: data.auto_connect,
                reconnectAttempts: data.reconnect_attempts,
                commandPrefix: data.command_prefix,
                modCommandsOnly: data.mod_commands_only,
                allowedRoles: data.allowed_roles || [],
                blockedUsers: data.blocked_users || [],
                globalCooldown: data.global_cooldown
            } : defaultSettings;

            console.log('✅ Bot settings retrieved successfully');
            res.json({
                success: true,
                settings
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/settings GET:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Bot Einstellungen speichern
    app.post('/api/twitch-bot/settings', async (req, res) => {
        try {
            console.log('🤖 [API] Saving Twitch Bot settings...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const settings = req.body;
            
            const updateData = {
                guild_id: 'default',
                bot_enabled: settings.botEnabled,
                bot_username: settings.botUsername,
                oauth_token: settings.oauthToken,
                auto_connect: settings.autoConnect,
                reconnect_attempts: settings.reconnectAttempts,
                command_prefix: settings.commandPrefix,
                mod_commands_only: settings.modCommandsOnly,
                allowed_roles: settings.allowedRoles,
                blocked_users: settings.blockedUsers,
                global_cooldown: settings.globalCooldown,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabaseClient
                .from('twitch_bot_settings')
                .upsert(updateData, { onConflict: 'guild_id' })
                .select()
                .single();

            if (error) {
                console.error('❌ Error saving bot settings:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            console.log('✅ Bot settings saved successfully');
            res.json({
                success: true,
                message: 'Bot-Einstellungen erfolgreich gespeichert!',
                settings: data
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/settings POST:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Bot Ein/Ausschalten
    app.post('/api/twitch-bot/toggle', async (req, res) => {
        try {
            console.log('🤖 [API] Toggling Twitch Bot...');
            
            if (!supabaseClient || !twitchBot) {
                return res.status(500).json({
                    success: false,
                    error: 'System not initialized'
                });
            }

            // Aktuelle Einstellungen abrufen
            const { data: currentSettings, error: fetchError } = await supabaseClient
                .from('twitch_bot_settings')
                .select('*')
                .eq('guild_id', 'default')
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('❌ Error fetching current settings:', fetchError);
                return res.status(500).json({
                    success: false,
                    error: fetchError.message
                });
            }

            // Toggle Status
            const newStatus = currentSettings ? !currentSettings.bot_enabled : true;
            
            // Einstellungen in Supabase aktualisieren
            const { data, error } = await supabaseClient
                .from('twitch_bot_settings')
                .upsert({
                    guild_id: 'default',
                    bot_enabled: newStatus,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'guild_id' })
                .select()
                .single();

            if (error) {
                console.error('❌ Error toggling bot:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            // Echten Bot starten/stoppen
            try {
                if (newStatus) {
                    // Bot konfigurieren mit aktuellen Einstellungen
                    const settings = currentSettings || {};
                    twitchBot.configure({
                        botEnabled: true,
                        botUsername: settings.bot_username || 'AgentBeeBot',
                        oauthToken: settings.oauth_token || process.env.TWITCH_BOT_OAUTH || '',
                        commandPrefix: settings.command_prefix || '!',
                        modCommandsOnly: settings.mod_commands_only || false,
                        globalCooldown: settings.global_cooldown || 3
                    });

                    // Channels aus Supabase laden und hinzufügen
                    const { data: channels } = await supabaseClient
                        .from('twitch_bot_channels')
                        .select('*')
                        .eq('guild_id', 'default')
                        .eq('enabled', true);

                    if (channels) {
                        for (const channel of channels) {
                            await twitchBot.addChannel(channel.channel_name, {
                                discordChannelId: channel.discord_channel_id,
                                syncMessages: channel.sync_messages,
                                enabled: channel.enabled
                            });
                        }
                    }

                    // Bot starten
                    await twitchBot.start();
                } else {
                    // Bot stoppen
                    await twitchBot.stop();
                }
            } catch (botError) {
                console.error('❌ Error starting/stopping bot:', botError);
                // Rollback in Supabase
                await supabaseClient
                    .from('twitch_bot_settings')
                    .upsert({
                        guild_id: 'default',
                        bot_enabled: !newStatus,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'guild_id' });

                return res.status(500).json({
                    success: false,
                    error: `Bot ${newStatus ? 'Start' : 'Stop'} Error: ${botError.message}`
                });
            }

            const message = newStatus ? 'Bot erfolgreich gestartet!' : 'Bot erfolgreich gestoppt!';
            console.log(`✅ ${message}`);
            
            res.json({
                success: true,
                enabled: newStatus,
                message
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/toggle:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // =============================================
    // CHANNEL MANAGEMENT
    // =============================================
    
    // Alle Channels abrufen
    app.get('/api/twitch-bot/channels', async (req, res) => {
        try {
            console.log('🤖 [API] Getting Twitch Bot channels...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const { data, error } = await supabaseClient
                .from('twitch_bot_channels')
                .select(`
                    *,
                    commands:twitch_bot_commands(count)
                `)
                .eq('guild_id', 'default')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error fetching channels:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            const channels = data.map(channel => ({
                id: channel.id.toString(),
                channelName: channel.channel_name,
                channelId: channel.channel_id,
                enabled: channel.enabled,
                autoJoin: channel.auto_join,
                discordChannelId: channel.discord_channel_id,
                syncMessages: channel.sync_messages,
                welcomeMessage: channel.welcome_message,
                followMessage: channel.follow_message,
                subMessage: channel.sub_message,
                donationMessage: channel.donation_message,
                raidMessage: channel.raid_message,
                hostMessage: channel.host_message,
                totalCommands: channel.commands?.length || 0
            }));

            console.log(`✅ Retrieved ${channels.length} channels`);
            res.json({
                success: true,
                channels
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/channels GET:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Neuen Channel hinzufügen
    app.post('/api/twitch-bot/channels', async (req, res) => {
        try {
            console.log('🤖 [API] Adding new Twitch channel...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const { channelName, discordChannelId, syncMessages } = req.body;

            if (!channelName || !channelName.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'Channel-Name ist erforderlich'
                });
            }

            // Prüfen ob Channel bereits existiert
            const { data: existingChannel } = await supabaseClient
                .from('twitch_bot_channels')
                .select('id')
                .eq('guild_id', 'default')
                .eq('channel_name', channelName.toLowerCase())
                .single();

            if (existingChannel) {
                return res.status(400).json({
                    success: false,
                    error: 'Channel existiert bereits'
                });
            }

            const channelData = {
                guild_id: 'default',
                channel_name: channelName.toLowerCase(),
                channel_id: '',
                enabled: true,
                auto_join: true,
                discord_channel_id: discordChannelId || '',
                sync_messages: syncMessages || false,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabaseClient
                .from('twitch_bot_channels')
                .insert(channelData)
                .select()
                .single();

            if (error) {
                console.error('❌ Error adding channel:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            const responseChannel = {
                id: data.id.toString(),
                channelName: data.channel_name,
                channelId: data.channel_id,
                enabled: data.enabled,
                autoJoin: data.auto_join,
                discordChannelId: data.discord_channel_id,
                syncMessages: data.sync_messages,
                welcomeMessage: data.welcome_message,
                followMessage: data.follow_message,
                subMessage: data.sub_message,
                donationMessage: data.donation_message,
                raidMessage: data.raid_message,
                hostMessage: data.host_message,
                totalCommands: 0
            };

            // Echten Bot Channel hinzufügen wenn Bot läuft
            if (twitchBot && twitchBot.isConnected) {
                try {
                    await twitchBot.addChannel(channelName, {
                        discordChannelId: discordChannelId || '',
                        syncMessages: syncMessages || false,
                        enabled: true
                    });
                    console.log(`🤖 Channel "${channelName}" zum Bot hinzugefügt`);
                } catch (botError) {
                    console.error(`❌ Fehler beim Hinzufügen zu Bot:`, botError);
                }
            }

            console.log(`✅ Channel "${channelName}" added successfully`);
            res.json({
                success: true,
                message: `Channel ${channelName} erfolgreich hinzugefügt!`,
                channel: responseChannel
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/channels POST:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Channel löschen
    app.delete('/api/twitch-bot/channels/:channelId', async (req, res) => {
        try {
            console.log('🤖 [API] Deleting Twitch channel...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const { channelId } = req.params;

            // Channel-Info vor dem Löschen abrufen
            const { data: channelData, error: fetchError } = await supabaseClient
                .from('twitch_bot_channels')
                .select('channel_name')
                .eq('id', channelId)
                .eq('guild_id', 'default')
                .single();

            if (fetchError) {
                console.error('❌ Error fetching channel data:', fetchError);
                return res.status(500).json({
                    success: false,
                    error: fetchError.message
                });
            }

            // Aus Bot entfernen wenn läuft
            if (twitchBot && twitchBot.isConnected && channelData) {
                try {
                    await twitchBot.removeChannel(channelData.channel_name);
                    console.log(`🤖 Channel "${channelData.channel_name}" vom Bot entfernt`);
                } catch (botError) {
                    console.error(`❌ Fehler beim Entfernen vom Bot:`, botError);
                }
            }

            const { error } = await supabaseClient
                .from('twitch_bot_channels')
                .delete()
                .eq('id', channelId)
                .eq('guild_id', 'default');

            if (error) {
                console.error('❌ Error deleting channel:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            console.log(`✅ Channel ${channelId} deleted successfully`);
            res.json({
                success: true,
                message: 'Channel erfolgreich entfernt!'
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/channels DELETE:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // =============================================
    // BOT TESTING & UTILITIES
    // =============================================

    // Test-Nachricht in Channel senden
    app.post('/api/twitch-bot/test/:channelId', async (req, res) => {
        try {
            console.log('🧪 [API] Sending test message to Twitch channel...');
            
            if (!supabaseClient || !twitchBot) {
                return res.status(500).json({
                    success: false,
                    error: 'System not initialized'
                });
            }

            const { channelId } = req.params;

            // Channel-Info abrufen
            const { data: channelData, error: fetchError } = await supabaseClient
                .from('twitch_bot_channels')
                .select('channel_name')
                .eq('id', channelId)
                .eq('guild_id', 'default')
                .single();

            if (fetchError || !channelData) {
                return res.status(404).json({
                    success: false,
                    error: 'Channel nicht gefunden'
                });
            }

            if (!twitchBot.isConnected) {
                return res.status(400).json({
                    success: false,
                    error: 'Bot ist nicht mit Twitch verbunden'
                });
            }

            // Test-Nachricht senden
            const result = await twitchBot.sendTestMessage(channelData.channel_name);
            
            console.log(`✅ Test message sent to ${channelData.channel_name}`);
            res.json({
                success: true,
                message: `Test-Nachricht an ${channelData.channel_name} gesendet!`,
                testMessage: result.message
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/test:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // =============================================
    // BOT STATISTICS
    // =============================================
    
    // Bot Statistiken abrufen
    app.get('/api/twitch-bot/stats', async (req, res) => {
        try {
            console.log('🤖 [API] Getting Twitch Bot stats...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            // Parallel alle Stats abrufen
            const [channelsResult, commandsResult, eventsResult, settingsResult] = await Promise.all([
                supabaseClient
                    .from('twitch_bot_channels')
                    .select('*')
                    .eq('guild_id', 'default'),
                    
                supabaseClient
                    .from('twitch_bot_commands')
                    .select('*')
                    .eq('guild_id', 'default'),
                    
                supabaseClient
                    .from('twitch_bot_events')
                    .select('*')
                    .eq('guild_id', 'default')
                    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
                    
                supabaseClient
                    .from('twitch_bot_settings')
                    .select('bot_enabled, created_at')
                    .eq('guild_id', 'default')
                    .single()
            ]);

            const channels = channelsResult.data || [];
            const commands = commandsResult.data || [];
            const events = eventsResult.data || [];
            const settings = settingsResult.data;

            // Uptime berechnen
            let uptime = '0s';
            if (settings?.created_at) {
                const startTime = new Date(settings.created_at);
                const now = new Date();
                const diffMs = now - startTime;
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                uptime = diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m`;
            }

            // Echte Bot-Statistiken abrufen wenn Bot läuft
            let realTimeStats = {
                isConnected: false,
                uptime: '0s',
                messagesProcessed: 0,
                commandsExecuted: 0
            };

            if (twitchBot) {
                const botStatus = twitchBot.getStatus();
                realTimeStats = {
                    isConnected: botStatus.isConnected,
                    uptime: botStatus.stats.uptime,
                    messagesProcessed: botStatus.stats.messagesProcessed,
                    commandsExecuted: botStatus.stats.commandsExecuted
                };
            }

            const stats = {
                totalChannels: channels.length,
                activeChannels: channels.filter(c => c.enabled).length,
                totalCommands: commands.length,
                messagesLast24h: events.filter(e => e.event_type === 'message').length || realTimeStats.messagesProcessed,
                commandsUsedLast24h: events.filter(e => e.event_type === 'command').length || realTimeStats.commandsExecuted,
                isConnected: realTimeStats.isConnected,
                uptime: realTimeStats.isConnected ? realTimeStats.uptime : uptime
            };

            console.log('✅ Bot stats retrieved successfully');
            res.json({
                success: true,
                stats
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/stats GET:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // =============================================
    // STREAM EVENTS API INTEGRATION
    // =============================================
    
    // Stream Events API Routes hinzufügen
    createTwitchBotStreamEventsAPI(app);

    console.log('🤖 Twitch Bot API routes initialized');
}

module.exports = {
    initializeSupabase,
    createTwitchBotAPI,
    setDiscordClient
}; 