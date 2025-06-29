// Crosshair Proxy API für Netlify → Railway → Henrik API + Discord Sharing
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

function setupCrosshairProxyAPI(app) {
    console.log('🎯 Setting up Crosshair Proxy API with Discord Sharing...');

    // Initialize Supabase Client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

    if (!supabase) {
        console.warn('⚠️ Supabase not configured. Crosshair sharing features will be disabled.');
    }

    // CORS für Netlify
    const corsOptions = {
        origin: [
            'http://localhost:5173',
            'http://localhost:3000', 
            'https://agentbee.netlify.app',
            'https://beellgrounds.netlify.app',
            process.env.FRONTEND_URL
        ].filter(Boolean),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
    };

    // Crosshair Proxy Routes
    app.use('/api/crosshair', cors(corsOptions));

    // Generate Crosshair Image via Henrik API
    app.get('/api/crosshair/generate', async (req, res) => {
        try {
            const { code } = req.query;
            
            if (!code) {
                return res.status(400).json({
                    error: 'Crosshair code is required',
                    message: 'Bitte gib einen gültigen Crosshair-Code an'
                });
            }

            console.log('🎯 Generating crosshair for code:', code);

            // Henrik API Key aus Environment Variables
            const henrikApiKey = process.env.HENRIK_API_KEY || process.env.VALORANT_API_TOKEN;
            
            if (!henrikApiKey) {
                console.error('❌ Henrik API Key fehlt! Bitte HENRIK_API_KEY oder VALORANT_API_TOKEN setzen.');
                return res.status(500).json({
                    error: 'API Configuration Error',
                    message: 'Henrik API Key nicht konfiguriert. Bitte kontaktiere den Administrator.'
                });
            }

            // Henrik API Request mit API Key
            const apiUrl = `https://api.henrikdev.xyz/valorant/v1/crosshair/generate?id=${encodeURIComponent(code)}&api_key=${encodeURIComponent(henrikApiKey)}`;
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'AgentBee-Bot/1.0',
                    'Authorization': henrikApiKey
                }
            });

            if (!response.ok) {
                console.error('❌ Henrik API Error:', response.status, response.statusText);
                
                let errorMessage = 'Fehler beim Generieren des Crosshairs';
                
                if (response.status === 401) {
                    errorMessage = 'Henrik API Key ungültig oder abgelaufen. Bitte kontaktiere den Administrator.';
                } else if (response.status === 429) {
                    errorMessage = 'Henrik API Rate Limit erreicht. Bitte versuche es später erneut.';
                } else if (response.status === 400) {
                    errorMessage = 'Ungültiger Crosshair-Code. Bitte überprüfe den Code.';
                }
                
                return res.status(response.status).json({
                    error: 'Henrik API Error',
                    status: response.status,
                    message: errorMessage
                });
            }

            // Return image as blob
            const blob = await response.arrayBuffer();
            
            res.set({
                'Content-Type': 'image/png',
                'Content-Length': blob.byteLength,
                'Cache-Control': 'public, max-age=3600' // 1 hour cache
            });

            res.send(Buffer.from(blob));
            
            console.log('✅ Crosshair generated successfully');

        } catch (error) {
            console.error('❌ Crosshair Proxy Error:', error);
            
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Fehler beim Generieren des Crosshairs',
                details: error.message
            });
        }
    });

    // Validate Crosshair Code
    app.post('/api/crosshair/validate', cors(corsOptions), async (req, res) => {
        try {
            const { code } = req.body;
            
            if (!code) {
                return res.status(400).json({
                    valid: false,
                    error: 'Code ist erforderlich'
                });
            }

            // Basic validation
            const isValid = code.includes(';') && code.includes('P') && code.includes('c');
            
            res.json({
                valid: isValid,
                code: code,
                message: isValid ? 'Code ist gültig' : 'Code-Format ungültig'
            });

        } catch (error) {
            console.error('❌ Validation Error:', error);
            res.status(500).json({
                valid: false,
                error: 'Validation failed'
            });
        }
    });

    // Test endpoint
    app.get('/api/crosshair/test', cors(corsOptions), (req, res) => {
        res.json({
            status: 'online',
            message: 'Crosshair Proxy API is working',
            timestamp: new Date().toISOString()
        });
    });

    // ==================== DISCORD SHARING SYSTEM ====================

    // Helper function to post to Discord
    async function postToDiscord(crosshairData, settings) {
        try {
            if (!settings.webhook_url) {
                console.log('⚠️ No webhook URL configured for guild:', settings.guild_id);
                return null;
            }

            const embed = {
                title: `🎯 ${crosshairData.crosshair_name || 'New Crosshair Shared!'}`,
                description: crosshairData.description || 'Check out this crosshair!',
                color: 0x00d4aa, // AgentBee green
                fields: [
                    {
                        name: '📋 Crosshair Code',
                        value: `\`\`\`${crosshairData.crosshair_code}\`\`\``,
                        inline: false
                    },
                    {
                        name: '🎨 Type',
                        value: crosshairData.crosshair_type || 'Custom',
                        inline: true
                    },
                    {
                        name: '🌈 Color',
                        value: crosshairData.color_hex || '#FFFFFF',
                        inline: true
                    }
                ],
                author: {
                    name: crosshairData.username,
                    icon_url: crosshairData.user_avatar || undefined
                },
                image: {
                    url: crosshairData.image_url
                },
                footer: {
                    text: 'AgentBee Crosshair Sharing • React with 👍 or 👎 to vote!',
                    icon_url: 'https://cdn.discordapp.com/avatars/1234567890/avatar.png'
                },
                timestamp: new Date().toISOString()
            };

            const webhookBody = {
                embeds: [embed],
                components: [
                    {
                        type: 1, // ACTION_ROW
                        components: [
                            {
                                type: 2, // BUTTON
                                style: 3, // SUCCESS (green)
                                label: 'Copy Code',
                                custom_id: `copy_crosshair_${crosshairData.id}`,
                                emoji: { name: '📋' }
                            },
                            {
                                type: 2, // BUTTON
                                style: 1, // PRIMARY (blue)
                                label: 'View Stats',
                                custom_id: `stats_crosshair_${crosshairData.id}`,
                                emoji: { name: '📊' }
                            }
                        ]
                    }
                ]
            };

            const response = await fetch(settings.webhook_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(webhookBody)
            });

            if (response.ok) {
                console.log('✅ Posted crosshair to Discord successfully');
                return await response.json();
            } else {
                console.error('❌ Discord webhook failed:', response.status, response.statusText);
                return null;
            }
        } catch (error) {
            console.error('❌ Discord posting error:', error);
            return null;
        }
    }

    // POST: Share a crosshair to Discord
    app.post('/api/crosshair/share', cors(corsOptions), async (req, res) => {
        try {
            if (!supabase) {
                return res.status(503).json({
                    error: 'Service Unavailable',
                    message: 'Crosshair sharing is not configured'
                });
            }

            const {
                user_id,
                username,
                user_avatar,
                guild_id,
                crosshair_code,
                crosshair_name,
                description,
                crosshair_type,
                color_hex,
                tags
            } = req.body;

            // Validate required fields
            if (!user_id || !username || !guild_id || !crosshair_code) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'user_id, username, guild_id und crosshair_code sind erforderlich'
                });
            }

            // Get guild settings
            const { data: settings } = await supabase
                .from('crosshair_settings')
                .select('*')
                .eq('guild_id', guild_id)
                .single();

            if (!settings) {
                return res.status(404).json({
                    error: 'Guild not configured',
                    message: 'Discord Server ist nicht für Crosshair Sharing konfiguriert'
                });
            }

            if (!settings.auto_post_enabled) {
                return res.status(403).json({
                    error: 'Auto-posting disabled',
                    message: 'Automatisches Crosshair Sharing ist deaktiviert'
                });
            }

            // Generate crosshair image
            let imageUrl = null;
            try {
                const henrikApiKey = process.env.HENRIK_API_KEY || process.env.VALORANT_API_TOKEN;
                if (henrikApiKey) {
                    const apiUrl = `https://api.henrikdev.xyz/valorant/v1/crosshair/generate?id=${encodeURIComponent(crosshair_code)}&api_key=${encodeURIComponent(henrikApiKey)}`;
                    const imageResponse = await fetch(apiUrl);
                    if (imageResponse.ok) {
                        // Upload to temporary storage or use Henrik URL directly
                        imageUrl = apiUrl;
                    }
                }
            } catch (error) {
                console.warn('⚠️ Image generation failed:', error.message);
            }

            // Save to database
            const { data: crosshair, error: dbError } = await supabase
                .from('crosshair_shares')
                .insert({
                    user_id,
                    username,
                    user_avatar,
                    guild_id,
                    crosshair_code,
                    crosshair_name,
                    description,
                    crosshair_type,
                    color_hex,
                    tags,
                    image_url: imageUrl,
                    discord_channel_id: settings.crosshair_channel_id,
                    is_approved: !settings.require_approval
                })
                .select()
                .single();

            if (dbError) {
                console.error('❌ Database error:', dbError);
                return res.status(500).json({
                    error: 'Database error',
                    message: 'Fehler beim Speichern des Crosshairs'
                });
            }

            // Post to Discord if auto-posting is enabled
            let discordMessage = null;
            if (settings.auto_post_enabled && crosshair.is_approved) {
                discordMessage = await postToDiscord(crosshair, settings);
                
                // Update with Discord message ID
                if (discordMessage?.id) {
                    await supabase
                        .from('crosshair_shares')
                        .update({ discord_message_id: discordMessage.id })
                        .eq('id', crosshair.id);
                }
            }

            res.json({
                success: true,
                crosshair,
                discord_posted: !!discordMessage,
                message: 'Crosshair erfolgreich geteilt!'
            });

        } catch (error) {
            console.error('❌ Share crosshair error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Fehler beim Teilen des Crosshairs'
            });
        }
    });

    // POST: Vote on a crosshair
    app.post('/api/crosshair/:id/vote', cors(corsOptions), async (req, res) => {
        try {
            if (!supabase) {
                return res.status(503).json({
                    error: 'Service Unavailable',
                    message: 'Voting is not configured'
                });
            }

            const { id } = req.params;
            const { user_id, username, guild_id, vote_type } = req.body;

            if (!user_id || !username || !guild_id || !vote_type) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'user_id, username, guild_id und vote_type sind erforderlich'
                });
            }

            if (!['upvote', 'downvote'].includes(vote_type)) {
                return res.status(400).json({
                    error: 'Invalid vote type',
                    message: 'vote_type muss "upvote" oder "downvote" sein'
                });
            }

            // Check if crosshair exists
            const { data: crosshair } = await supabase
                .from('crosshair_shares')
                .select('*')
                .eq('id', id)
                .eq('guild_id', guild_id)
                .single();

            if (!crosshair) {
                return res.status(404).json({
                    error: 'Crosshair not found',
                    message: 'Crosshair nicht gefunden'
                });
            }

            // Upsert vote (insert or update if exists)
            const { data: vote, error: voteError } = await supabase
                .from('crosshair_votes')
                .upsert({
                    crosshair_id: id,
                    user_id,
                    username,
                    guild_id,
                    vote_type,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'crosshair_id,user_id'
                })
                .select()
                .single();

            if (voteError) {
                console.error('❌ Vote error:', voteError);
                return res.status(500).json({
                    error: 'Database error',
                    message: 'Fehler beim Speichern der Bewertung'
                });
            }

            // Get updated vote counts
            const { data: updatedCrosshair } = await supabase
                .from('crosshair_shares')
                .select('upvotes, downvotes, total_votes, vote_score')
                .eq('id', id)
                .single();

            res.json({
                success: true,
                vote,
                crosshair: updatedCrosshair,
                message: `${vote_type === 'upvote' ? '👍' : '👎'} Bewertung gespeichert!`
            });

        } catch (error) {
            console.error('❌ Vote error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Fehler beim Bewerten'
            });
        }
    });

    // POST: Track crosshair copy
    app.post('/api/crosshair/:id/copy', cors(corsOptions), async (req, res) => {
        try {
            if (!supabase) {
                return res.status(503).json({
                    error: 'Service Unavailable',
                    message: 'Copy tracking is not configured'
                });
            }

            const { id } = req.params;
            const { user_id, username, guild_id } = req.body;

            if (!user_id || !username || !guild_id) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'user_id, username und guild_id sind erforderlich'
                });
            }

            // Track the copy
            const { data: copy, error: copyError } = await supabase
                .from('crosshair_copies')
                .insert({
                    crosshair_id: id,
                    user_id,
                    username,
                    guild_id
                })
                .select()
                .single();

            if (copyError) {
                console.error('❌ Copy tracking error:', copyError);
                return res.status(500).json({
                    error: 'Database error',
                    message: 'Fehler beim Tracking'
                });
            }

            // Get crosshair code
            const { data: crosshair } = await supabase
                .from('crosshair_shares')
                .select('crosshair_code')
                .eq('id', id)
                .single();

            res.json({
                success: true,
                crosshair_code: crosshair?.crosshair_code,
                copy,
                message: '📋 Crosshair-Code kopiert!'
            });

        } catch (error) {
            console.error('❌ Copy tracking error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Fehler beim Kopieren'
            });
        }
    });

    // GET: List crosshairs for a guild
    app.get('/api/crosshair/list/:guild_id', cors(corsOptions), async (req, res) => {
        try {
            if (!supabase) {
                return res.status(503).json({
                    error: 'Service Unavailable',
                    message: 'Crosshair listing is not configured'
                });
            }

            const { guild_id } = req.params;
            const { 
                page = 1, 
                limit = 20, 
                sort = 'vote_score', 
                order = 'desc',
                featured_only = false 
            } = req.query;

            let query = supabase
                .from('crosshair_shares')
                .select(`
                    *,
                    crosshair_votes(vote_type),
                    crosshair_copies(id)
                `)
                .eq('guild_id', guild_id)
                .eq('is_approved', true);

            if (featured_only === 'true') {
                query = query.eq('is_featured', true);
            }

            const { data: crosshairs, error: listError } = await query
                .order(sort, { ascending: order === 'asc' })
                .range((page - 1) * limit, page * limit - 1);

            if (listError) {
                console.error('❌ List error:', listError);
                return res.status(500).json({
                    error: 'Database error',
                    message: 'Fehler beim Laden der Crosshairs'
                });
            }

            // Calculate copy counts
            const crosshairsWithStats = crosshairs.map(crosshair => ({
                ...crosshair,
                copy_count: crosshair.crosshair_copies.length,
                crosshair_votes: undefined, // Remove detailed votes
                crosshair_copies: undefined // Remove detailed copies
            }));

            res.json({
                success: true,
                crosshairs: crosshairsWithStats,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    has_more: crosshairs.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('❌ List crosshairs error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Fehler beim Laden der Crosshairs'
            });
        }
    });

    // GET/POST: Crosshair settings for a guild
    app.get('/api/crosshair/settings/:guild_id', cors(corsOptions), async (req, res) => {
        try {
            if (!supabase) {
                return res.status(503).json({
                    error: 'Service Unavailable',
                    message: 'Settings are not configured'
                });
            }

            const { guild_id } = req.params;

            const { data: settings, error } = await supabase
                .from('crosshair_settings')
                .select('*')
                .eq('guild_id', guild_id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Settings error:', error);
                return res.status(500).json({
                    error: 'Database error',
                    message: 'Fehler beim Laden der Einstellungen'
                });
            }

            res.json({
                success: true,
                settings: settings || null,
                message: settings ? 'Einstellungen geladen' : 'Keine Einstellungen gefunden'
            });

        } catch (error) {
            console.error('❌ Get settings error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Fehler beim Laden der Einstellungen'
            });
        }
    });

    app.post('/api/crosshair/settings/:guild_id', cors(corsOptions), async (req, res) => {
        try {
            if (!supabase) {
                return res.status(503).json({
                    error: 'Service Unavailable',
                    message: 'Settings are not configured'
                });
            }

            const { guild_id } = req.params;
            const settingsData = req.body;

            const { data: settings, error } = await supabase
                .from('crosshair_settings')
                .upsert({
                    guild_id,
                    ...settingsData,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'guild_id'
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Save settings error:', error);
                return res.status(500).json({
                    error: 'Database error',
                    message: 'Fehler beim Speichern der Einstellungen'
                });
            }

            res.json({
                success: true,
                settings,
                message: 'Einstellungen gespeichert!'
            });

        } catch (error) {
            console.error('❌ Save settings error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Fehler beim Speichern der Einstellungen'
            });
        }
    });

    console.log('✅ Crosshair Proxy API routes registered');
    console.log('✅ Discord Crosshair Sharing System initialized');
}

module.exports = { setupCrosshairProxyAPI }; 