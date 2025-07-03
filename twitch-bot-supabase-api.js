// Twitch Bot System - Supabase API
// Multi-Channel Twitch Chat Bot Management

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const TwitchChatBot = require('./twitch-chat-bot');

// Supabase Client (wird in index.js initialisiert)
let supabaseClient = null;

// Globale Bot-Instanz
let twitchBot = null;

// Supabase Client setzen
function initializeSupabase(client) {
    supabaseClient = client;
    global.supabaseClient = client;
    
    // Twitch Chat Bot initialisieren
    twitchBot = new TwitchChatBot();
    
    // Auto-Start prüfen
    setTimeout(async () => {
        await checkAutoStart();
    }, 2000); // 2 Sekunden Verzögerung für vollständige Initialisierung
    
    console.log('✅ Twitch Bot Supabase API initialisiert');
}

// Auto-Start Funktionalität
async function checkAutoStart() {
    if (!supabaseClient || !twitchBot) return;
    
    try {
        console.log('🔍 Prüfe Auto-Start für Twitch Bot...');
        
        // Bot-Einstellungen laden
        const { data: settings, error } = await supabaseClient
            .from('twitch_bot_settings')
            .select('*')
            .eq('guild_id', 'default')
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('❌ Fehler beim Laden der Auto-Start Einstellungen:', error);
            return;
        }
        
        // Auto-Connect prüfen
        if (settings && settings.bot_enabled && settings.auto_connect) {
            console.log('🚀 Auto-Start aktiviert, starte Bot...');
            
            // Bot konfigurieren
            twitchBot.configure({
                botEnabled: true,
                botUsername: settings.bot_username || 'AgentBeeBot',
                oauthToken: settings.oauth_token || process.env.TWITCH_BOT_OAUTH || '',
                commandPrefix: settings.command_prefix || '!',
                modCommandsOnly: settings.mod_commands_only || false,
                globalCooldown: settings.global_cooldown || 3,
                liveNotificationsEnabled: settings.live_notifications_enabled ?? true,
                liveMessageCooldown: settings.live_message_cooldown ?? 30
            });
            
            // Channels laden und hinzufügen
            const { data: channels } = await supabaseClient
                .from('twitch_bot_channels')
                .select('*')
                .eq('guild_id', 'default')
                .eq('enabled', true);
            
            if (channels && channels.length > 0) {
                console.log(`📺 Lade ${channels.length} Channels...`);
                
                for (const channel of channels) {
                    await twitchBot.addChannel(channel.channel_name, {
                        discordChannelId: channel.discord_channel_id,
                        syncMessages: channel.sync_messages,
                        enabled: channel.enabled,
                        liveMessageEnabled: channel.live_message_enabled ?? true,
                        liveMessageTemplate: channel.live_message_template || '🔴 Stream ist LIVE! Willkommen alle! 🎉',
                        useCustomLiveMessage: channel.use_custom_live_message ?? false,
                        liveMessageVariables: channel.live_message_variables || { username: true, game: true, title: true, viewers: true }
                    });
                }
            }
            
            // Bot starten
            await twitchBot.start();
            console.log('✅ Auto-Start erfolgreich abgeschlossen!');
            
        } else {
            console.log('⏸️ Auto-Start deaktiviert oder Bot nicht aktiviert');
        }
        
    } catch (error) {
        console.error('❌ Fehler beim Auto-Start:', error);
    }
}

// Discord Client für Bot setzen
function setDiscordClient(discordClient) {
    if (twitchBot) {
        twitchBot.setDiscordClient(discordClient);
        console.log('🤖 Discord Client für Twitch Bot gesetzt');
    }
}

// ⚡ NEU: Twitch Bot Instanz abrufen (für Live System Integration)
function getTwitchBot() {
    return twitchBot;
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
                globalCooldown: 3,
                liveNotificationsEnabled: true,
                liveMessageCooldown: 30
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
                globalCooldown: data.global_cooldown,
                liveNotificationsEnabled: data.live_notifications_enabled ?? true,
                liveMessageCooldown: data.live_message_cooldown ?? 30
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
                live_notifications_enabled: settings.liveNotificationsEnabled ?? true,
                live_message_cooldown: settings.liveMessageCooldown ?? 30,
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
                        globalCooldown: settings.global_cooldown || 3,
                        liveNotificationsEnabled: settings.live_notifications_enabled !== false,
                        liveMessageCooldown: settings.live_message_cooldown ?? 30
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
                liveMessageEnabled: channel.live_message_enabled ?? true,
                liveMessageTemplate: channel.live_message_template || '🔴 Stream ist LIVE! Willkommen alle! 🎉',
                useCustomLiveMessage: channel.use_custom_live_message ?? false,
                liveMessageVariables: channel.live_message_variables || { username: true, game: true, title: true, viewers: true },
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

            const { channelName, discordChannelId, syncMessages, liveMessageEnabled, liveMessageTemplate, useCustomLiveMessage, liveMessageVariables } = req.body;

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
                live_message_enabled: liveMessageEnabled ?? true,
                live_message_template: liveMessageTemplate || '🔴 Stream ist LIVE! Willkommen alle! 🎉',
                use_custom_live_message: useCustomLiveMessage ?? false,
                live_message_variables: liveMessageVariables || { username: true, game: true, title: true, viewers: true },
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
                liveMessageEnabled: data.live_message_enabled,
                liveMessageTemplate: data.live_message_template,
                useCustomLiveMessage: data.use_custom_live_message,
                liveMessageVariables: data.live_message_variables,
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

    // ⚡ NEU: Live-Nachricht manuell auslösen
    app.post('/api/twitch-bot/trigger-live/:channelId', async (req, res) => {
        try {
            console.log('🔴 [API] Triggering live message for Twitch channel...');
            
            if (!supabaseClient || !twitchBot) {
                return res.status(500).json({
                    success: false,
                    error: 'System not initialized'
                });
            }

            const { channelId } = req.params;
            const { customMessage, streamerInfo } = req.body;

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

            // Live-Nachricht auslösen
            let success;
            if (customMessage) {
                // Manuelle Nachricht
                success = await twitchBot.triggerLiveMessage(channelData.channel_name, customMessage);
            } else {
                // Automatische Live-Nachricht mit Streamer-Info
                const testStreamerInfo = streamerInfo || {
                    displayName: channelData.channel_name,
                    gameName: 'Test Game',
                    title: 'Test Stream Title',
                    viewerCount: 42
                };
                success = await twitchBot.sendLiveMessage(channelData.channel_name, testStreamerInfo);
            }
            
            if (success) {
                console.log(`✅ Live message triggered for ${channelData.channel_name}`);
                res.json({
                    success: true,
                    message: `Live-Nachricht für ${channelData.channel_name} ausgelöst!`,
                    channelName: channelData.channel_name
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Live-Nachricht konnte nicht gesendet werden (Cooldown oder anderer Grund)'
                });
            }

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/trigger-live:', error);
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
    // LIVE MESSAGE TEMPLATES MANAGEMENT
    // =============================================
    
    // Alle Live Message Templates abrufen
    app.get('/api/twitch-bot/live-templates', async (req, res) => {
        try {
            console.log('🔴 [API] Getting live message templates...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const { data, error } = await supabaseClient
                .from('twitch_bot_live_message_templates')
                .select('*')
                .eq('guild_id', 'default')
                .order('category')
                .order('name');

            if (error) {
                console.error('❌ Error fetching live templates:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            const templates = data?.map(template => ({
                id: template.id.toString(),
                name: template.name,
                template: template.template,
                description: template.description,
                category: template.category,
                variables: template.variables,
                usageCount: template.usage_count,
                isDefault: template.is_default,
                enabled: template.enabled,
                createdAt: template.created_at
            })) || [];

            console.log(`✅ Retrieved ${templates.length} live message templates`);
            res.json({
                success: true,
                templates
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/live-templates GET:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Neues Live Message Template erstellen
    app.post('/api/twitch-bot/live-templates', async (req, res) => {
        try {
            console.log('🔴 [API] Creating new live message template...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const { name, template, description, category, variables } = req.body;

            if (!name || !template) {
                return res.status(400).json({
                    success: false,
                    error: 'Name und Template sind erforderlich'
                });
            }

            const templateData = {
                guild_id: 'default',
                name: name.trim(),
                template: template.trim(),
                description: description?.trim() || '',
                category: category || 'custom',
                variables: variables || ['username', 'game', 'title', 'viewers'],
                is_default: false,
                enabled: true
            };

            const { data, error } = await supabaseClient
                .from('twitch_bot_live_message_templates')
                .insert(templateData)
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    return res.status(400).json({
                        success: false,
                        error: 'Ein Template mit diesem Namen existiert bereits'
                    });
                }
                console.error('❌ Error creating template:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            console.log(`✅ Live message template "${name}" created successfully`);
            res.json({
                success: true,
                message: `Template "${name}" erfolgreich erstellt!`,
                template: {
                    id: data.id.toString(),
                    name: data.name,
                    template: data.template,
                    description: data.description,
                    category: data.category,
                    variables: data.variables,
                    usageCount: data.usage_count,
                    isDefault: data.is_default,
                    enabled: data.enabled,
                    createdAt: data.created_at
                }
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/live-templates POST:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Live Message Template bearbeiten
    app.put('/api/twitch-bot/live-templates/:templateId', async (req, res) => {
        try {
            console.log('🔴 [API] Updating live message template...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const { templateId } = req.params;
            const { name, template, description, category, variables, enabled } = req.body;

            const updateData = {
                updated_at: new Date().toISOString()
            };

            if (name !== undefined) updateData.name = name.trim();
            if (template !== undefined) updateData.template = template.trim();
            if (description !== undefined) updateData.description = description.trim();
            if (category !== undefined) updateData.category = category;
            if (variables !== undefined) updateData.variables = variables;
            if (enabled !== undefined) updateData.enabled = enabled;

            const { data, error } = await supabaseClient
                .from('twitch_bot_live_message_templates')
                .update(updateData)
                .eq('id', templateId)
                .eq('guild_id', 'default')
                .select()
                .single();

            if (error) {
                console.error('❌ Error updating template:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            if (!data) {
                return res.status(404).json({
                    success: false,
                    error: 'Template nicht gefunden'
                });
            }

            console.log(`✅ Live message template ${templateId} updated successfully`);
            res.json({
                success: true,
                message: 'Template erfolgreich aktualisiert!',
                template: {
                    id: data.id.toString(),
                    name: data.name,
                    template: data.template,
                    description: data.description,
                    category: data.category,
                    variables: data.variables,
                    usageCount: data.usage_count,
                    isDefault: data.is_default,
                    enabled: data.enabled
                }
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/live-templates PUT:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Live Message Template löschen
    app.delete('/api/twitch-bot/live-templates/:templateId', async (req, res) => {
        try {
            console.log('🔴 [API] Deleting live message template...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const { templateId } = req.params;

            // Prüfen ob es ein Standard-Template ist
            const { data: templateData, error: fetchError } = await supabaseClient
                .from('twitch_live_message_templates')
                .select('name, is_default')
                .eq('id', templateId)
                .eq('guild_id', 'default')
                .single();

            if (fetchError) {
                return res.status(404).json({
                    success: false,
                    error: 'Template nicht gefunden'
                });
            }

            if (templateData.is_default) {
                return res.status(400).json({
                    success: false,
                    error: 'Standard-Templates können nicht gelöscht werden'
                });
            }

            const { error } = await supabaseClient
                .from('twitch_bot_live_message_templates')
                .delete()
                .eq('id', templateId)
                .eq('guild_id', 'default');

            if (error) {
                console.error('❌ Error deleting template:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            console.log(`✅ Live message template ${templateId} deleted successfully`);
            res.json({
                success: true,
                message: `Template "${templateData.name}" erfolgreich gelöscht!`
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/live-templates DELETE:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // =============================================
    // COMMAND MANAGEMENT
    // =============================================
    
    // Alle Commands abrufen
    app.get('/api/twitch-bot/commands', async (req, res) => {
        try {
            console.log('🤖 [API] Getting Twitch Bot commands...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const { channelName } = req.query;

            let query = supabaseClient
                .from('twitch_bot_commands')
                .select(`
                    *,
                    category:twitch_bot_command_categories(name, icon, color)
                `)
                .order('command_name');

            if (channelName) {
                query = query.or(`channel_name.eq.${channelName},channel_name.is.null`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('❌ Error fetching commands:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            const commands = data.map(cmd => ({
                id: cmd.id.toString(),
                commandName: cmd.command_name,
                responseText: cmd.response_text,
                description: cmd.description || '',
                enabled: cmd.enabled,
                cooldownSeconds: cmd.cooldown_seconds,
                usesCount: cmd.uses_count,
                modOnly: cmd.mod_only,
                vipOnly: cmd.vip_only,
                subscriberOnly: cmd.subscriber_only,
                responseType: cmd.response_type,
                embedColor: cmd.embed_color,
                embedTitle: cmd.embed_title,
                useVariables: cmd.use_variables,
                customVariables: cmd.custom_variables || {},
                channelName: cmd.channel_name,
                discordSync: cmd.discord_sync,
                discordChannelId: cmd.discord_channel_id,
                category: cmd.category || { name: 'custom', icon: '⚙️', color: '#95A5A6' },
                createdBy: cmd.created_by,
                createdAt: cmd.created_at,
                lastUsedAt: cmd.last_used_at
            }));

            console.log(`✅ Retrieved ${commands.length} commands`);
            res.json({
                success: true,
                commands
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/commands GET:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Neuen Command erstellen
    app.post('/api/twitch-bot/commands', async (req, res) => {
        try {
            console.log('🤖 [API] Creating new Twitch command...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const {
                commandName,
                responseText,
                description,
                enabled = true,
                cooldownSeconds = 30,
                modOnly = false,
                vipOnly = false,
                subscriberOnly = false,
                responseType = 'text',
                embedColor = '#9146FF',
                embedTitle = '',
                useVariables = true,
                customVariables = {},
                channelName = null,
                discordSync = false,
                discordChannelId = null,
                categoryId = 6
            } = req.body;

            if (!commandName || !responseText) {
                return res.status(400).json({
                    success: false,
                    error: 'Command-Name und Response-Text sind erforderlich'
                });
            }

            // Command name validieren
            const cleanCommandName = commandName.toLowerCase().replace(/[^a-z0-9_]/g, '');
            if (cleanCommandName !== commandName.toLowerCase()) {
                return res.status(400).json({
                    success: false,
                    error: 'Command-Name darf nur Buchstaben, Zahlen und Unterstriche enthalten'
                });
            }

            // Prüfen ob Command bereits existiert
            const { data: existingCommand } = await supabaseClient
                .from('twitch_bot_commands')
                .select('id')
                .eq('command_name', cleanCommandName)
                .eq('channel_name', channelName || null)
                .single();

            if (existingCommand) {
                return res.status(400).json({
                    success: false,
                    error: 'Ein Command mit diesem Namen existiert bereits'
                });
            }

            const commandData = {
                command_name: cleanCommandName,
                response_text: responseText.trim(),
                description: description?.trim() || '',
                enabled,
                cooldown_seconds: Math.max(1, cooldownSeconds),
                mod_only: modOnly,
                vip_only: vipOnly,
                subscriber_only: subscriberOnly,
                response_type: responseType,
                embed_color: embedColor,
                embed_title: embedTitle?.trim() || '',
                use_variables: useVariables,
                custom_variables: customVariables,
                channel_name: channelName,
                discord_sync: discordSync,
                discord_channel_id: discordChannelId,
                category_id: categoryId,
                created_by: 'dashboard'
            };

            const { data, error } = await supabaseClient
                .from('twitch_bot_commands')
                .insert(commandData)
                .select(`
                    *,
                    category:twitch_bot_command_categories(name, icon, color)
                `)
                .single();

            if (error) {
                console.error('❌ Error creating command:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            // Command dem Bot hinzufügen wenn er läuft
            if (twitchBot) {
                try {
                    twitchBot.addCustomCommand(data.command_name, {
                        responseText: data.response_text,
                        description: data.description,
                        cooldownSeconds: data.cooldown_seconds,
                        modOnly: data.mod_only,
                        vipOnly: data.vip_only,
                        subscriberOnly: data.subscriber_only,
                        useVariables: data.use_variables,
                        customVariables: data.custom_variables,
                        channelName: data.channel_name,
                        discordSync: data.discord_sync,
                        discordChannelId: data.discord_channel_id
                    });
                    console.log(`🤖 Command !${data.command_name} zum Bot hinzugefügt`);
                } catch (botError) {
                    console.error(`❌ Fehler beim Hinzufügen zu Bot:`, botError);
                }
            }

            const responseCommand = {
                id: data.id.toString(),
                commandName: data.command_name,
                responseText: data.response_text,
                description: data.description,
                enabled: data.enabled,
                cooldownSeconds: data.cooldown_seconds,
                usesCount: data.uses_count,
                modOnly: data.mod_only,
                vipOnly: data.vip_only,
                subscriberOnly: data.subscriber_only,
                responseType: data.response_type,
                embedColor: data.embed_color,
                embedTitle: data.embed_title,
                useVariables: data.use_variables,
                customVariables: data.custom_variables,
                channelName: data.channel_name,
                discordSync: data.discord_sync,
                discordChannelId: data.discord_channel_id,
                category: data.category,
                createdBy: data.created_by,
                createdAt: data.created_at
            };

            console.log(`✅ Command !${data.command_name} created successfully`);
            res.json({
                success: true,
                message: `Command !${data.command_name} erfolgreich erstellt!`,
                command: responseCommand
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/commands POST:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Command bearbeiten
    app.put('/api/twitch-bot/commands/:commandId', async (req, res) => {
        try {
            console.log('🤖 [API] Updating Twitch command...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const { commandId } = req.params;
            const updateData = {
                updated_at: new Date().toISOString()
            };

            // Nur geänderte Felder aktualisieren
            const allowedFields = [
                'responseText', 'description', 'enabled', 'cooldownSeconds',
                'modOnly', 'vipOnly', 'subscriberOnly', 'responseType',
                'embedColor', 'embedTitle', 'useVariables', 'customVariables',
                'discordSync', 'discordChannelId', 'categoryId'
            ];

            allowedFields.forEach(field => {
                const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
                if (req.body[field] !== undefined) {
                    updateData[dbField] = req.body[field];
                }
            });

            const { data, error } = await supabaseClient
                .from('twitch_bot_commands')
                .update(updateData)
                .eq('id', commandId)
                .select(`
                    *,
                    category:twitch_bot_command_categories(name, icon, color)
                `)
                .single();

            if (error) {
                console.error('❌ Error updating command:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            if (!data) {
                return res.status(404).json({
                    success: false,
                    error: 'Command nicht gefunden'
                });
            }

            // Command im Bot aktualisieren wenn er läuft
            if (twitchBot) {
                try {
                    twitchBot.updateCustomCommand(data.command_name, {
                        responseText: data.response_text,
                        description: data.description,
                        cooldownSeconds: data.cooldown_seconds,
                        modOnly: data.mod_only,
                        vipOnly: data.vip_only,
                        subscriberOnly: data.subscriber_only,
                        useVariables: data.use_variables,
                        customVariables: data.custom_variables,
                        enabled: data.enabled
                    });
                    console.log(`🤖 Command !${data.command_name} im Bot aktualisiert`);
                } catch (botError) {
                    console.error(`❌ Fehler beim Aktualisieren im Bot:`, botError);
                }
            }

            console.log(`✅ Command ${commandId} updated successfully`);
            res.json({
                success: true,
                message: `Command !${data.command_name} erfolgreich aktualisiert!`,
                command: {
                    id: data.id.toString(),
                    commandName: data.command_name,
                    responseText: data.response_text,
                    description: data.description,
                    enabled: data.enabled,
                    cooldownSeconds: data.cooldown_seconds,
                    usesCount: data.uses_count,
                    modOnly: data.mod_only,
                    vipOnly: data.vip_only,
                    subscriberOnly: data.subscriber_only,
                    responseType: data.response_type,
                    embedColor: data.embed_color,
                    embedTitle: data.embed_title,
                    useVariables: data.use_variables,
                    customVariables: data.custom_variables,
                    channelName: data.channel_name,
                    discordSync: data.discord_sync,
                    discordChannelId: data.discord_channel_id,
                    category: data.category
                }
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/commands PUT:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Command löschen
    app.delete('/api/twitch-bot/commands/:commandId', async (req, res) => {
        try {
            console.log('🤖 [API] Deleting Twitch command...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const { commandId } = req.params;

            // Command-Daten abrufen vor dem Löschen
            const { data: commandData, error: fetchError } = await supabaseClient
                .from('twitch_bot_commands')
                .select('command_name, created_by')
                .eq('id', commandId)
                .single();

            if (fetchError) {
                return res.status(404).json({
                    success: false,
                    error: 'Command nicht gefunden'
                });
            }

            // System-Commands können nicht gelöscht werden
            if (commandData.created_by === 'system') {
                return res.status(400).json({
                    success: false,
                    error: 'System-Commands können nicht gelöscht werden'
                });
            }

            const { error } = await supabaseClient
                .from('twitch_bot_commands')
                .delete()
                .eq('id', commandId);

            if (error) {
                console.error('❌ Error deleting command:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            // Command aus Bot entfernen wenn er läuft
            if (twitchBot) {
                try {
                    twitchBot.removeCustomCommand(commandData.command_name);
                    console.log(`🤖 Command !${commandData.command_name} aus Bot entfernt`);
                } catch (botError) {
                    console.error(`❌ Fehler beim Entfernen aus Bot:`, botError);
                }
            }

            console.log(`✅ Command ${commandId} deleted successfully`);
            res.json({
                success: true,
                message: `Command !${commandData.command_name} erfolgreich gelöscht!`
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/commands DELETE:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Command Categories abrufen
    app.get('/api/twitch-bot/command-categories', async (req, res) => {
        try {
            console.log('🤖 [API] Getting command categories...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const { data, error } = await supabaseClient
                .from('twitch_bot_command_categories')
                .select('*')
                .order('name');

            if (error) {
                console.error('❌ Error fetching categories:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            const categories = data.map(cat => ({
                id: cat.id,
                name: cat.name,
                description: cat.description,
                color: cat.color,
                icon: cat.icon
            }));

            console.log(`✅ Retrieved ${categories.length} categories`);
            res.json({
                success: true,
                categories
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/command-categories GET:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Command Analytics abrufen
    app.get('/api/twitch-bot/command-analytics', async (req, res) => {
        try {
            console.log('🤖 [API] Getting command analytics...');
            
            if (!supabaseClient) {
                return res.status(500).json({
                    success: false,
                    error: 'Supabase client not initialized'
                });
            }

            const { channelName } = req.query;

            let query = supabaseClient
                .from('twitch_bot_command_analytics')
                .select('*')
                .order('recent_uses', { ascending: false });

            if (channelName) {
                query = query.or(`channel_name.eq.${channelName},channel_name.is.null`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('❌ Error fetching analytics:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            console.log(`✅ Retrieved analytics for ${data.length} commands`);
            res.json({
                success: true,
                analytics: data || []
            });

        } catch (error) {
            console.error('❌ Error in /api/twitch-bot/command-analytics GET:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    console.log('🤖 Twitch Bot API routes initialized');
}

module.exports = {
    initializeSupabase,
    createTwitchBotAPI,
    setDiscordClient,
    getTwitchBot
}; 