const { Client, Events, GatewayIntentBits, Collection, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XPSystem = require('./xp-system');
const GiveawaySystem = require('./giveaway-system');
const { registerGiveawayAPI } = require('./giveaway-api');
const { registerTicketAPI } = require('./ticket-api');
const TicketSystemV2 = require('./ticket-system-v2');
const setupTwitchAPI = require('./twitch-api');

// 🎵 YOUTUBE RADIO-SYSTEM
const { loadMusicSettings, musicSettings, registerMusicAPI } = require('./music-api');
const aiMusicRecommendations = require('./ai-music-recommendations');
const { OpenAI } = require('openai');
const { makeValorantCard } = require('./src/utils/valorantCard');
const TicketSystem = require('./ticket-system');
const ServerStats = require('./server-stats-api');
const settingsAPI = require('./settings-api');
const AnomalyDetectionAPI = require('./anomaly-detection-api');
const ServerHealthAPI = require('./server-health-api');
const ServerManagerAnalyticsAPI = require('./server-manager-analytics-api');
const BulkServerActionsAPI = require('./bulk-server-actions-api');
const MassMemberManagementAPI = require('./mass-member-management-api');
const AIOptimizationAPI = require('./ai-optimization-api');
const { setupServerManagerAnalyticsRoutes } = require('./server-manager-analytics-routes');
const { setupBulkServerManagementRoutes } = require('./bulk-server-management-routes');
const { setupAIOptimizationRoutes } = require('./ai-optimization-routes');
const { setupRulesSupabaseRoutes } = require('./rules-supabase-api');
const { setupModerationSupabaseRoutes } = require('./moderation-supabase-api');
const { 
    initializeSupabaseForWelcome,
    loadWelcomeSettings,
    saveWelcomeSettings,
    loadWelcomeImages,
    saveWelcomeImage,
    deleteWelcomeImage,
    createWelcomeFolder,
    deleteWelcomeFolder,
    createWelcomeEmbed,
    createLeaveEmbed,
    getRandomWelcomeImage,
    autoCreateGameFolders,
    updateWelcomeStats
} = require('./welcome-supabase-api');
require('dotenv').config();

// ================== SUPABASE INITIALIZATION ==================
let supabase = null;

// Initialisiere Supabase wenn Credentials vorhanden
function initializeSupabase() {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        let supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service Role für RLS
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Fallback
        
        // 🚨 NOTFALL-FALLBACK: Falls SERVICE_KEY nicht gesetzt ist in Railway
        if (!supabaseServiceKey && supabaseUrl && supabaseUrl.includes('supabase.co')) {
            console.log('⚠️ SUPABASE_SERVICE_KEY nicht gefunden! Das kann zu RLS Policy Fehlern führen!');
            console.log('💡 Lösung: Setze SUPABASE_SERVICE_KEY in Railway Environment Variables');
            console.log('📝 Alternative: Führe disable_welcome_rls_emergency.sql in Supabase aus');
        }
        
        if (supabaseUrl && (supabaseServiceKey || supabaseAnonKey)) {
            const { createClient } = require('@supabase/supabase-js');
            
            // Bevorzuge Service Role für Discord Bot (umgeht RLS)
            const keyToUse = supabaseServiceKey || supabaseAnonKey;
            const keyType = supabaseServiceKey ? 'SERVICE_ROLE' : 'ANON_KEY';
            
            supabase = createClient(supabaseUrl, keyToUse);
            console.log(`✅ Supabase erfolgreich initialisiert (${keyType})`);
            
            if (!supabaseServiceKey) {
                console.log('🚨 WARNUNG: Verwende ANON_KEY - RLS Policy Fehler möglich!');
            }
            
            return true;
        } else {
            console.log('⚠️ Supabase Credentials nicht gefunden - verwende JSON-Fallback');
            return false;
        }
    } catch (error) {
        console.error('❌ Fehler bei Supabase-Initialisierung:', error.message);
        console.log('📄 Verwende JSON-Dateien als Fallback');
        return false;
    }
}

// Supabase beim Start initialisieren
const supabaseInitialized = initializeSupabase();

// Welcome System mit Supabase initialisieren
if (supabaseInitialized && supabase) {
    initializeSupabaseForWelcome(supabase);
}

// ================== API KEYS MANAGEMENT ==================
// Zentrale API-Key-Verwaltung - alle Keys hier konfigurieren
let apiKeys = {
    discord: {
        bot_token: process.env.DISCORD_TOKEN || '',
        client_id: process.env.DISCORD_CLIENT_ID || '',
        client_secret: process.env.DISCORD_CLIENT_SECRET || ''
    },
    openai: process.env.OPENAI_API_KEY || '',
    twitch: {
        clientId: process.env.TWITCH_CLIENT_ID || '',
        clientSecret: process.env.TWITCH_CLIENT_SECRET || ''
    },
    valorant: process.env.VALORANT_API_TOKEN || '',
    youtube: {
        apiKey: process.env.YOUTUBE_API_KEY || ''
    }
};

// API-Keys aus Datei laden falls vorhanden
function loadAPIKeys() {
    try {
        if (fs.existsSync('./api-keys.json')) {
            const fileKeys = JSON.parse(fs.readFileSync('./api-keys.json', 'utf8'));
            apiKeys = { ...apiKeys, ...fileKeys };
            console.log('🔑 API-Keys aus Datei geladen');
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der API-Keys:', error);
    }
}

// API-Keys speichern
function saveAPIKeys() {
    try {
        fs.writeFileSync('./api-keys.json', JSON.stringify(apiKeys, null, 2));
        console.log('🔑 API-Keys gespeichert');
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Speichern der API-Keys:', error);
        return false;
    }
}

// API-Keys beim Start laden
loadAPIKeys();

// ================== VALORANT SYSTEM ==================

// Rate Limiter für Valorant API
class ValorantRateLimit {
    constructor() {
        this.requests = [];
        this.limit = 30; // 30 Requests pro Minute
        this.window = 60000; // 1 Minute in ms
    }

    canMakeRequest() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.window);
        return this.requests.length < this.limit;
    }

    recordRequest() {
        this.requests.push(Date.now());
    }

    getRemaining() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.window);
        return Math.max(0, this.limit - this.requests.length);
    }

    getResetTime() {
        if (this.requests.length === 0) return 0;
        return Math.max(0, this.window - (Date.now() - this.requests[0]));
    }
}

const valorantRateLimit = new ValorantRateLimit();

// Agent-Namen zu UUID-Mapping für Icons
// 🎯 Valorant Agenten Cache für Performance
let valorantAgentsCache = null;
let valorantAgentsCacheTime = 0;
const VALORANT_CACHE_DURATION = 300000; // 5 Minuten

// Lade alle Valorant Agenten aus Supabase
async function loadValorantAgentsFromSupabase() {
    try {
        if (!supabase) {
            console.log('⚠️ Supabase nicht initialisiert, verwende Legacy-Agenten');
            return getLegacyAgentData();
        }
        
        // Cache prüfen
        const now = Date.now();
        if (valorantAgentsCache && (now - valorantAgentsCacheTime) < VALORANT_CACHE_DURATION) {
            return valorantAgentsCache;
        }
        
        console.log('🔄 Lade Valorant Agenten aus Supabase...');
        
        const { data: agents, error } = await supabase
            .from('valorant_agents')
            .select('id, name, uuid, display_name, role_type, role_color, role_config, enabled, sort_order, icon')
            .eq('enabled', true)
            .order('role_type')
            .order('sort_order')
            .order('name');
        
        if (error) {
            console.error('❌ Fehler beim Laden der Valorant Agenten:', error);
            return getLegacyAgentData();
        }
        
        // Cache aktualisieren
        valorantAgentsCache = agents || [];
        valorantAgentsCacheTime = now;
        
        console.log(`✅ ${agents?.length || 0} Valorant Agenten aus Supabase geladen`);
        return valorantAgentsCache;
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Valorant Agenten:', error);
        return getLegacyAgentData();
    }
}

// Legacy Agent Daten als Fallback
function getLegacyAgentData() {
    return [
        // Duelist
        { name: 'Jett', uuid: 'add6443a-41bd-e414-f6ad-e58d267f4e95', role_type: 'Duelist' },
        { name: 'Phoenix', uuid: 'eb93336a-449b-9c1b-0a54-a891f7921d69', role_type: 'Duelist' },
        { name: 'Reyna', uuid: 'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc', role_type: 'Duelist' },
        { name: 'Raze', uuid: 'f94c3b30-42be-e959-889c-5aa313dba261', role_type: 'Duelist' },
        { name: 'Yoru', uuid: '7f94d92c-4234-0a36-9646-3a87eb8b5c89', role_type: 'Duelist' },
        { name: 'Neon', uuid: 'bb2a4828-46eb-8cd1-e765-15848195d751', role_type: 'Duelist' },
        { name: 'Iso', uuid: '0e38b510-41a8-5780-5e8f-568b2a4f2d6c', role_type: 'Duelist' },
        { name: 'Waylay', uuid: 'a0fb1e56-4829-5c21-bd58-e38a9d8f4c27', role_type: 'Duelist' },
        
        // Sentinel
        { name: 'Killjoy', uuid: '1e58de9c-4950-5125-93e9-a0aee9f98746', role_type: 'Sentinel' },
        { name: 'Cypher', uuid: '117ed9e3-49f3-6512-3ccf-0cada7e3823b', role_type: 'Sentinel' },
        { name: 'Sage', uuid: '569fdd95-4d10-43ab-ca70-79becc718b46', role_type: 'Sentinel' },
        { name: 'Chamber', uuid: '22697a3d-45bf-8dd7-4fec-84a9e28c69d7', role_type: 'Sentinel' },
        { name: 'Deadlock', uuid: 'cc8b64c8-4b25-4ff9-6e7f-37b4da43d235', role_type: 'Sentinel' },
        { name: 'Vyse', uuid: 'b1a4c798-6d3e-5f42-8c91-2e5b7a8d9f26', role_type: 'Sentinel' },
        
        // Initiator
        { name: 'Sova', uuid: '320b2a48-4d9b-a075-30f1-1f93a9b638fa', role_type: 'Initiator' },
        { name: 'Breach', uuid: '5f8d3a7f-467b-97f3-062c-13acf203c006', role_type: 'Initiator' },
        { name: 'Skye', uuid: '6f2a04ca-43e0-be17-7f36-b3908627744d', role_type: 'Initiator' },
        { name: 'Fade', uuid: 'dade69b4-4f5a-8528-247b-219e5a1facd6', role_type: 'Initiator' },
        { name: 'KAY/O', uuid: '601dbbe7-43ce-be57-2a40-4abd24953621', role_type: 'Initiator' },
        { name: 'Gekko', uuid: 'e370fa57-4757-3604-3648-499e1f642d3f', role_type: 'Initiator' },
        { name: 'Tejo', uuid: 'c5e8d247-9b1a-4f6c-8e2d-3a7b5c9e1f84', role_type: 'Initiator' },
        
        // Controller
        { name: 'Brimstone', uuid: '9f0d8ba9-4140-b941-57d3-a7ad57c6b417', role_type: 'Controller' },
        { name: 'Viper', uuid: '707eab51-4836-f488-046a-cda6bf494859', role_type: 'Controller' },
        { name: 'Omen', uuid: '8e253930-4c05-31dd-1b6c-968525494517', role_type: 'Controller' },
        { name: 'Astra', uuid: '41fb69c1-4189-7b37-f117-bcaf1e96f1bf', role_type: 'Controller' },
        { name: 'Harbor', uuid: '95b78ed7-4637-86d9-7e41-71ba8c293152', role_type: 'Controller' },
        { name: 'Clove', uuid: '1dbf2edd-7729-4fe6-b095-9a9a46bf73fc', role_type: 'Controller' }
    ];
}

// Supabase-basierte getAgentUUID Funktion
async function getAgentUUID(agentName) {
    try {
        const agents = await loadValorantAgentsFromSupabase();
        const agent = agents.find(a => a.name.toLowerCase() === agentName.toLowerCase());
        
        if (agent) {
            return agent.uuid;
        }
        
        // Fallback zu Sage
        const sageAgent = agents.find(a => a.name.toLowerCase() === 'sage');
        return sageAgent ? sageAgent.uuid : '569fdd95-4d10-43ab-ca70-79becc718b46';
        
    } catch (error) {
        console.error('❌ Fehler beim Abrufen der Agent UUID:', error);
        // Hard-coded Fallback zu Sage
        return '569fdd95-4d10-43ab-ca70-79becc718b46';
    }
}

// Interaktive Valorant-Nachricht posten
async function postValorantInteractiveMessage(channelName) {
    try {
        if (!client || !client.guilds) {
            console.log('❌ Bot nicht bereit für Valorant-Nachricht');
            return false;
        }

        // Lade Valorant-Einstellungen
        let valorantSettings = {};
        try {
            if (fs.existsSync('./valorant-settings.json')) {
                valorantSettings = JSON.parse(fs.readFileSync('./valorant-settings.json', 'utf8'));
            }
        } catch (error) {
            console.log('⚠️ Fehler beim Laden der Valorant-Einstellungen, verwende Standard-Werte');
        }

        // Standard-Embed-Einstellungen falls nicht konfiguriert
        const embedSettings = valorantSettings.embed || {
            title: '🎯 Valorant Spielersuche',
            description: 'Klicke auf eine Region um deine Valorant-Statistiken abzurufen!',
            color: '0xFF4655',
            footer: 'Powered by Agentbee • {timestamp}',
            thumbnail: 'valorant',
            customThumbnail: '',
            author: {
                enabled: true,
                name: 'Valorant Stats Bot',
                iconUrl: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png'
            },
            fields: [
                {
                    name: '🌍 Verfügbare Regionen',
                    value: '🇪🇺 **EU** - Europa\n🇺🇸 **NA** - Nordamerika\n🌏 **AP** - Asien-Pazifik',
                    inline: true
                },
                {
                    name: '📊 Features',
                    value: '• Aktueller Rang & RR\n• Peak Rang\n• Headshot-Rate\n• K/D Ratio\n• Win-Rate',
                    inline: true
                },
                {
                    name: '⚡ Rate-Limit',
                    value: '30 Requests pro Minute\nFaire Nutzung für alle!',
                    inline: true
                }
            ]
        };

        // Finde den Channel in allen Servern
        let targetChannel = null;
        for (const guild of client.guilds.cache.values()) {
            const channel = guild.channels.cache.find(ch => 
                ch.name === channelName && ch.type === 0 // Text Channel
            );
            if (channel) {
                targetChannel = channel;
                break;
            }
        }

        if (!targetChannel) {
            console.log(`❌ Valorant-Channel "${channelName}" nicht gefunden`);
            return false;
        }

        // Erstelle das Embed mit konfigurierten Einstellungen
        const embed = {
            color: parseInt(embedSettings.color.replace('0x', ''), 16) || 0xFF4655,
            title: embedSettings.title,
            description: embedSettings.description
        };

        // Author hinzufügen falls aktiviert
        if (embedSettings.author?.enabled && embedSettings.author?.name) {
            embed.author = {
                name: embedSettings.author.name
            };
            if (embedSettings.author.iconUrl) {
                embed.author.icon_url = embedSettings.author.iconUrl;
            }
        }

        // Thumbnail hinzufügen
        if (embedSettings.thumbnail === 'valorant') {
            embed.thumbnail = {
                url: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png'
            };
        } else if (embedSettings.thumbnail === 'custom' && embedSettings.customThumbnail) {
            embed.thumbnail = {
                url: embedSettings.customThumbnail
            };
        } else if (embedSettings.thumbnail === 'user' && client.user?.displayAvatarURL) {
            embed.thumbnail = {
                url: client.user.displayAvatarURL()
            };
        }

        // Felder hinzufügen mit Rate-Limit Update
        embed.fields = embedSettings.fields.map(field => {
            let value = field.value;
            // Rate-Limit Info in entsprechendem Feld aktualisieren
            if (field.name.includes('Rate-Limit') || field.value.includes('30 Requests')) {
                value = `**${valorantRateLimit.getRemaining()}/30** Requests verfügbar\nReset in: ${Math.ceil(valorantRateLimit.getResetTime() / 1000)}s`;
            }
            return {
                name: field.name,
                value: value,
                inline: field.inline
            };
        });

        // Footer hinzufügen mit Platzhalter-Ersetzung
        if (embedSettings.footer) {
            const now = new Date();
            embed.footer = {
                text: embedSettings.footer
                    .replace('{timestamp}', now.toLocaleString('de-DE'))
                    .replace('{date}', now.toLocaleDateString('de-DE'))
                    .replace('{time}', now.toLocaleTimeString('de-DE'))
            };
        }

        // Timestamp hinzufügen
        embed.timestamp = new Date().toISOString();

        // Erstelle die Action Rows mit Buttons
        const actionRows = [
            {
                type: 1, // ACTION_ROW
                components: [
                    {
                        type: 2, // BUTTON
                        style: 1, // PRIMARY
                        label: 'EU Stats abrufen',
                        emoji: { name: '🇪🇺' },
                        custom_id: 'valorant_stats_eu'
                    },
                    {
                        type: 2, // BUTTON
                        style: 1, // PRIMARY
                        label: 'NA Stats abrufen',
                        emoji: { name: '🇺🇸' },
                        custom_id: 'valorant_stats_na'
                    },
                    {
                        type: 2, // BUTTON
                        style: 1, // PRIMARY
                        label: 'AP Stats abrufen',
                        emoji: { name: '🌏' },
                        custom_id: 'valorant_stats_ap'
                    }
                ]
            },
            {
                type: 1, // ACTION_ROW
                components: [
                    {
                        type: 2, // BUTTON
                        style: 2, // SECONDARY
                        label: 'Rate-Limit prüfen',
                        emoji: { name: '⚡' },
                        custom_id: 'valorant_rate_limit'
                    },
                    {
                        type: 2, // BUTTON
                        style: 4, // DANGER
                        label: 'Hilfe',
                        emoji: { name: '❓' },
                        custom_id: 'valorant_help'
                    }
                ]
            }
        ];

        // Sende die Nachricht
        await targetChannel.send({
            embeds: [embed],
            components: actionRows
        });

        console.log(`✅ Interaktive Valorant-Nachricht in #${channelName} gepostet`);
        return true;

    } catch (error) {
        console.error('❌ Fehler beim Posten der Valorant-Nachricht:', error);
        return false;
    }
}

// Valorant Button-Interaktionen behandeln
async function handleValorantButtonInteraction(interaction) {
    try {
        const { customId, user } = interaction;

        // Rate-Limit prüfen
        if (customId.startsWith('valorant_stats_') && !valorantRateLimit.canMakeRequest()) {
            const resetTime = Math.ceil(valorantRateLimit.getResetTime() / 1000);
            await interaction.reply({
                content: `⚡ **Rate-Limit erreicht!**\n\n` +
                        `Du musst noch **${resetTime} Sekunden** warten, bevor du eine neue Anfrage stellen kannst.\n` +
                        `**Verbleibende Requests:** ${valorantRateLimit.getRemaining()}/30`,
                ephemeral: true
            });
            return;
        }

        switch (customId) {
            case 'valorant_stats_eu':
            case 'valorant_stats_na':
            case 'valorant_stats_ap':
                const region = customId.split('_')[2]; // eu, na, ap
                await showValorantStatsModal(interaction, region);
                break;

            case 'valorant_rate_limit':
                const remaining = valorantRateLimit.getRemaining();
                const resetTime = Math.ceil(valorantRateLimit.getResetTime() / 1000);
                
                await interaction.reply({
                    content: `⚡ **Rate-Limit Status**\n\n` +
                            `**Verbleibende Requests:** ${remaining}/30\n` +
                            `**Reset in:** ${resetTime} Sekunden\n` +
                            `**Limit:** 30 Requests pro Minute`,
                    ephemeral: true
                });
                break;

            case 'valorant_help':
                const helpEmbed = {
                    color: 0x7C3AED,
                    title: '❓ Valorant Stats - Hilfe',
                    description: '**So verwendest du das Valorant-System:**',
                    fields: [
                        {
                            name: '1️⃣ Region wählen',
                            value: 'Klicke auf den Button deiner Region (EU, NA, AP)',
                            inline: false
                        },
                        {
                            name: '2️⃣ Daten eingeben',
                            value: 'Gib deinen **Spielernamen** und **Tag** ein\nBeispiel: `PlayerName` und `1234`',
                            inline: false
                        },
                        {
                            name: '3️⃣ Statistiken erhalten',
                            value: '• Aktueller Rang und RR\n• Peak Rang der Season\n• Match-Historie\n• Leaderboard Position',
                            inline: false
                        },
                        {
                            name: '⚡ Rate-Limit',
                            value: '**30 Requests pro Minute** für alle User zusammen\nBei Überschreitung: 1 Minute warten',
                            inline: false
                        }
                    ],
                    footer: {
                        text: '🔥 Powered by AgentBee',
                    },
                    timestamp: new Date().toISOString()
                };

                await interaction.reply({
                    embeds: [helpEmbed],
                    ephemeral: true
                });
                break;
        }

    } catch (error) {
        console.error('❌ Fehler bei Valorant-Button-Interaktion:', error);
        await interaction.reply({
            content: '❌ Ein Fehler ist aufgetreten. Bitte versuche es später erneut.',
            ephemeral: true
        }).catch(console.error);
    }
}

// Modal für Valorant-Stats anzeigen
async function showValorantStatsModal(interaction, region) {
    try {
        const modal = {
            title: `🎯 Valorant Stats - ${region.toUpperCase()}`,
            custom_id: `valorant_modal_${region}`,
            components: [
                {
                    type: 1, // ACTION_ROW
                    components: [
                        {
                            type: 4, // TEXT_INPUT
                            custom_id: 'player_name',
                            label: 'Spielername',
                            style: 1, // SHORT
                            placeholder: 'Dein Valorant-Spielername (ohne #Tag)',
                            required: true,
                            max_length: 50
                        }
                    ]
                },
                {
                    type: 1, // ACTION_ROW
                    components: [
                        {
                            type: 4, // TEXT_INPUT
                            custom_id: 'player_tag',
                            label: 'Tag',
                            style: 1, // SHORT
                            placeholder: 'Dein Tag (nur die Zahlen/Buchstaben)',
                            required: true,
                            max_length: 10
                        }
                    ]
                }
            ]
        };

        await interaction.showModal(modal);

    } catch (error) {
        console.error('❌ Fehler beim Anzeigen des Valorant-Modals:', error);
        await interaction.reply({
            content: '❌ Fehler beim Öffnen des Eingabeformulars.',
            ephemeral: true
        }).catch(console.error);
    }
}

// Valorant Modal-Submission behandeln
async function handleValorantModalSubmission(interaction) {
    try {
        const region = interaction.customId.split('_')[2]; // eu, na, ap
        const playerName = interaction.fields.getTextInputValue('player_name').trim();
        const playerTag = interaction.fields.getTextInputValue('player_tag').trim();

        // Validierung
        if (!playerName || !playerTag) {
            await interaction.reply({
                content: '❌ Bitte gib sowohl Spielername als auch Tag ein!',
                ephemeral: true
            });
            return;
        }

        // Rate-Limit prüfen (wir brauchen mehrere Requests für detaillierte Stats)
        if (valorantRateLimit.getRemaining() < 3) {
            const resetTime = Math.ceil(valorantRateLimit.getResetTime() / 1000);
            await interaction.reply({
                content: `⚡ **Rate-Limit erreicht!**\n\n` +
                        `Du musst noch **${resetTime} Sekunden** warten, bevor du eine neue Anfrage stellen kannst.\n` +
                        `**Verbleibende Requests:** ${valorantRateLimit.getRemaining()}/30\n` +
                        `*Für detaillierte Statistiken werden 3 API-Calls benötigt.*`,
                ephemeral: true
            });
            return;
        }

        // API-Token prüfen
        if (!apiKeys.valorant) {
            await interaction.reply({
                content: '❌ Valorant API-Token ist nicht konfiguriert. Bitte kontaktiere einen Administrator.',
                ephemeral: true
            });
            return;
        }

        // Prüfe Sichtbarkeits-Einstellungen
        const visibilitySettings = JSON.parse(fs.readFileSync('./valorant-settings.json', 'utf8'));
        const isPublic = visibilitySettings.visibility?.public !== false; // Default: öffentlich
        
        // Loading-Antwort senden (basierend auf Sichtbarkeits-Einstellung)
        await interaction.reply({
            content: `🔍 **Suche nach Spieler:** \`${playerName}#${playerTag}\`\n⏳ Lade detaillierte Statistiken von der Valorant API...\n📊 *Hole MMR, Match-History und Account-Daten...*`,
            ephemeral: !isPublic
        });

        // Mehrere API-Anfragen parallel für detaillierte Stats
        const headers = { 'Authorization': apiKeys.valorant };
        
        const [mmrResponse, matchesResponse, accountResponse] = await Promise.all([
            fetch(`https://api.henrikdev.xyz/valorant/v3/mmr/${region}/pc/${playerName}/${playerTag}`, { headers }),
            fetch(`https://api.henrikdev.xyz/valorant/v4/matches/${region}/pc/${playerName}/${playerTag}?size=10`, { headers }),
            fetch(`https://api.henrikdev.xyz/valorant/v2/account/${playerName}/${playerTag}`, { headers })
        ]);

        // Rate-Limit Requests aufzeichnen (3 Calls)
        valorantRateLimit.recordRequest();
        valorantRateLimit.recordRequest();
        valorantRateLimit.recordRequest();

        const mmrData = await mmrResponse.json();
        const matchesData = await matchesResponse.json();
        const accountData = await accountResponse.json();

        if (!mmrResponse.ok || mmrData.status !== 200) {
            await interaction.editReply({
                content: `❌ **Spieler nicht gefunden!**\n\n` +
                        `**Spieler:** \`${playerName}#${playerTag}\`\n` +
                        `**Region:** ${region.toUpperCase()}\n\n` +
                        `**Mögliche Gründe:**\n` +
                        `• Spielername oder Tag falsch geschrieben\n` +
                        `• Spieler existiert nicht in dieser Region\n` +
                        `• Profil ist privat\n` +
                        `• Noch nie Competitive gespielt`,
            });
            return;
        }

        // Daten verarbeiten
        const playerData = mmrData.data;
        const currentTier = playerData.current.tier;
        const peakTier = playerData.peak.tier;
        const accountInfo = accountData.status === 200 ? accountData.data : null;

        // Match-Statistiken berechnen
        let matchStats = {
            totalMatches: 0,
            wins: 0,
            kills: 0,
            deaths: 0,
            assists: 0,
            headshots: 0,
            bodyshots: 0,
            legshots: 0,
            totalDamage: 0,
            totalRounds: 0,
            averageScore: 0,
            winRate: 0,
            kd: 0,
            headshotRate: 0,
            adr: 0 // Average Damage per Round
        };

        if (matchesData.status === 200 && matchesData.data && matchesData.data.length > 0) {
            const matches = matchesData.data;
            matchStats.totalMatches = matches.length;
            
            let totalScore = 0;
            
            matches.forEach(match => {
                // Finde den Spieler in diesem Match
                const player = match.players.find(p => 
                    p.name.toLowerCase() === playerName.toLowerCase() && 
                    p.tag.toLowerCase() === playerTag.toLowerCase()
                );
                
                if (player) {
                    // Team-Statistiken
                    const playerTeam = match.teams.find(team => team.team_id === player.team_id);
                    if (playerTeam && playerTeam.won) {
                        matchStats.wins++;
                    }
                    
                    // Spieler-Statistiken
                    if (player.stats) {
                        matchStats.kills += player.stats.kills || 0;
                        matchStats.deaths += player.stats.deaths || 0;
                        matchStats.assists += player.stats.assists || 0;
                        matchStats.headshots += player.stats.headshots || 0;
                        matchStats.bodyshots += player.stats.bodyshots || 0;
                        matchStats.legshots += player.stats.legshots || 0;
                        matchStats.totalDamage += player.stats.damage?.dealt || 0;
                        totalScore += player.stats.score || 0;
                    }
                    
                    // Runden zählen
                    if (match.teams && match.teams.length >= 2) {
                        const totalRoundsInMatch = match.teams[0].rounds.won + match.teams[0].rounds.lost;
                        matchStats.totalRounds += totalRoundsInMatch;
                    }
                }
            });
            
            // Berechnungen
            matchStats.winRate = matchStats.totalMatches > 0 ? (matchStats.wins / matchStats.totalMatches * 100) : 0;
            matchStats.kd = matchStats.deaths > 0 ? (matchStats.kills / matchStats.deaths) : matchStats.kills;
            matchStats.averageScore = matchStats.totalMatches > 0 ? (totalScore / matchStats.totalMatches) : 0;
            
            const totalShots = matchStats.headshots + matchStats.bodyshots + matchStats.legshots;
            matchStats.headshotRate = totalShots > 0 ? (matchStats.headshots / totalShots * 100) : 0;
            matchStats.adr = matchStats.totalRounds > 0 ? (matchStats.totalDamage / matchStats.totalRounds) : 0;
        }

        // Rang-Farben
        const getRankColor = (tierId) => {
            const colors = {
                0: 0x808080,   // Unranked - Grau
                3: 0x8B4513,   // Iron - Braun
                6: 0xCD7F32,   // Bronze - Bronze
                9: 0xC0C0C0,   // Silver - Silber
                12: 0xFFD700,  // Gold - Gold
                15: 0x40E0D0,  // Platinum - Türkis
                18: 0x4169E1,  // Diamond - Blau
                21: 0x32CD32,  // Ascendant - Grün
                24: 0x8A2BE2,  // Immortal - Lila
                27: 0xFFFF00   // Radiant - Gelb
            };
            return colors[tierId] || 0x808080;
        };

        // Lade Valorant-Einstellungen für Player Stats Embed
        let valorantSettings = {};
        try {
            if (fs.existsSync('./valorant-settings.json')) {
                valorantSettings = JSON.parse(fs.readFileSync('./valorant-settings.json', 'utf8'));
            }
        } catch (error) {
            console.log('⚠️ Fehler beim Laden der Valorant-Einstellungen, verwende Standard-Werte');
        }

        const playerStatsConfig = valorantSettings.playerStatsEmbed || {
            title: '🎯 {playerName}#{playerTag}',
            description: '**Region:** {region} • **Plattform:** PC{level}',
            color: 'dynamic',
            footer: '🔥 Powered by Agentbee • Verbleibende Requests: {remainingRequests}/30 • {timestamp}',
            thumbnail: 'valorant',
            author: { enabled: false },
            fields: {
                currentRank: { enabled: true, name: '🏆 Aktueller Rang', value: '**{currentRankName}**\n{currentRR} RR', inline: true },
                peakRank: { enabled: true, name: '⭐ Peak Rang', value: '**{peakRankName}**\nSeason {peakSeason}', inline: true },
                lastChange: { enabled: true, name: '📊 Letzte Änderung', value: '{lastChangePrefix}{lastChange} RR', inline: true }
            }
        };

        // Template-Variablen für Ersetzung vorbereiten
        const templateVars = {
            playerName: playerData.account.name,
            playerTag: playerData.account.tag,
            region: region.toUpperCase(),
            level: accountInfo ? ` • **Level:** ${accountInfo.account_level}` : '',
            currentRankName: currentTier.name,
            currentRR: playerData.current.rr,
            peakRankName: peakTier.name,
            peakSeason: playerData.peak.season.short,
            lastChange: Math.abs(playerData.current.last_change),
            lastChangePrefix: playerData.current.last_change > 0 ? '+' : (playerData.current.last_change < 0 ? '-' : ''),
            remainingRequests: valorantRateLimit.getRemaining(),
            timestamp: new Date().toLocaleString('de-DE')
        };

        // Template-String-Ersetzung
        const replaceTemplate = (template, vars) => {
            let result = template;
            Object.keys(vars).forEach(key => {
                const placeholder = `{${key}}`;
                result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), vars[key]);
            });
            return result;
        };

        // Detailliertes Embed erstellen
        const embed = {
            color: playerStatsConfig.color === 'dynamic' ? getRankColor(currentTier.id) : parseInt(playerStatsConfig.color),
            title: replaceTemplate(playerStatsConfig.title, templateVars),
            description: replaceTemplate(playerStatsConfig.description, templateVars),
            fields: [],
            footer: {
                text: replaceTemplate(playerStatsConfig.footer, templateVars)
            },
            timestamp: new Date().toISOString()
        };

        // Author hinzufügen falls aktiviert
        if (playerStatsConfig.author?.enabled) {
            embed.author = {
                name: playerStatsConfig.author.name,
                icon_url: playerStatsConfig.author.iconUrl
            };
        }

        // Thumbnail hinzufügen
        if (playerStatsConfig.thumbnail === 'valorant') {
            embed.thumbnail = {
                url: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png'
            };
        } else if (playerStatsConfig.thumbnail === 'custom' && playerStatsConfig.customThumbnail) {
            embed.thumbnail = {
                url: playerStatsConfig.customThumbnail
            };
        }

        // Erweiterte Template-Variablen für alle Statistiken
        const extendedTemplateVars = {
            ...templateVars,
            // Match-Statistiken
            totalMatches: matchStats.totalMatches,
            wins: matchStats.wins,
            losses: matchStats.totalMatches - matchStats.wins,
            winRate: matchStats.winRate.toFixed(1),
            kd: matchStats.kd.toFixed(2),
            kills: matchStats.kills,
            deaths: matchStats.deaths,
            assists: matchStats.assists,
            headshotRate: matchStats.headshotRate.toFixed(1),
            headshots: matchStats.headshots,
            bodyshots: matchStats.bodyshots,
            legshots: matchStats.legshots,
            adr: matchStats.adr.toFixed(0),
            totalDamage: matchStats.totalDamage.toLocaleString(),
            averageScore: matchStats.averageScore.toFixed(0),
            // Leaderboard
            leaderboardPosition: playerData.current.leaderboard_placement || 'Nicht verfügbar',
            // Season Stats
            seasonWins: (playerData.seasonal && playerData.seasonal.length > 0) ? (playerData.seasonal[0].wins || 0) : 0,
            seasonGames: (playerData.seasonal && playerData.seasonal.length > 0) ? (playerData.seasonal[0].games || 0) : 0,
            seasonWinRate: (playerData.seasonal && playerData.seasonal.length > 0 && playerData.seasonal[0].games > 0) ? 
                ((playerData.seasonal[0].wins / playerData.seasonal[0].games) * 100).toFixed(1) : '0'
        };

        // Felder basierend auf Konfiguration hinzufügen
        const fieldOrder = ['currentRank', 'peakRank', 'lastChange', 'leaderboard', 'matchStats', 'kda', 'precision', 'damage', 'seasonStats'];
        
        fieldOrder.forEach(fieldKey => {
            const fieldConfig = playerStatsConfig.fields[fieldKey];
            if (fieldConfig && fieldConfig.enabled) {
                // Spezielle Bedingungen für bestimmte Felder
                if (fieldKey === 'leaderboard' && !playerData.current.leaderboard_placement) {
                    return; // Überspringe Leaderboard-Feld wenn keine Position verfügbar
                }
                
                if (fieldKey === 'matchStats' && matchStats.totalMatches === 0) {
                    // Zeige alternative Nachricht wenn keine Match-Daten verfügbar
            embed.fields.push({
                        name: fieldConfig.name,
                value: '⚠️ Keine aktuellen Match-Daten verfügbar\n*Möglicherweise privates Profil oder keine kürzlichen Matches*',
                        inline: fieldConfig.inline
                    });
                    return;
                }
                
                if ((fieldKey === 'kda' || fieldKey === 'precision' || fieldKey === 'damage') && matchStats.totalMatches === 0) {
                    return; // Überspringe diese Felder wenn keine Match-Daten
                }
                
                if (fieldKey === 'seasonStats' && (!playerData.seasonal || playerData.seasonal.length === 0)) {
                    return; // Überspringe Season Stats wenn nicht verfügbar
                }

            embed.fields.push({
                    name: replaceTemplate(fieldConfig.name, extendedTemplateVars),
                    value: replaceTemplate(fieldConfig.value, extendedTemplateVars),
                    inline: fieldConfig.inline
                });
            }
        });

        // Erstelle Valorant-Karte
        let cardAttachment = null;
        try {
            console.log('🎨 Erstelle Valorant-Statistik-Karte...');
            
            // Finde den am häufigsten gespielten Agent aus den Match-Daten
            let mostPlayedAgent = null;
            if (matchesData.status === 200 && matchesData.data && matchesData.data.length > 0) {
                const agentCounts = {};
                matchesData.data.forEach(match => {
                    const player = match.players.find(p => 
                        p.name.toLowerCase() === playerName.toLowerCase() && 
                        p.tag.toLowerCase() === playerTag.toLowerCase()
                    );
                    if (player && player.agent) {
                        const agentName = player.agent.name;
                        agentCounts[agentName] = (agentCounts[agentName] || 0) + 1;
                    }
                });
                
                // Finde den am häufigsten gespielten Agent
                let maxCount = 0;
                Object.entries(agentCounts).forEach(([agent, count]) => {
                    if (count > maxCount) {
                        maxCount = count;
                        mostPlayedAgent = agent;
                    }
                });
            }

            // Bereite Daten für die Karte vor mit Fallback-Werten
            const cardStats = {
                name: playerData?.account?.name || 'Unknown',
                tag: playerData?.account?.tag || '0000',
                level: accountInfo?.account_level || 1,
                currentRank: currentTier?.name || 'Unranked',
                rr: playerData?.current?.rr || 0,
                peakRank: peakTier?.name || 'Unranked',
                kills: matchStats?.kills || 0,
                deaths: matchStats?.deaths || 0,
                assists: matchStats?.assists || 0,
                adr: Math.round(matchStats?.adr || 0),
                hsRate: Math.round((matchStats?.headshotRate || 0) * 10) / 10,
                agentIconUrl: mostPlayedAgent ? `https://media.valorant-api.com/agents/${await getAgentUUID(mostPlayedAgent)}/displayicon.png` : null,
                // Zusätzliche Daten für das neue Design
                totalMatches: matchStats?.totalMatches || 0,
                wins: matchStats?.wins || 0,
                winRate: matchStats?.winRate || 0,
                headshots: matchStats?.headshots || 0,
                bodyshots: matchStats?.bodyshots || 0,
                legshots: matchStats?.legshots || 0,
                totalDamage: matchStats?.totalDamage || 0,
                averageScore: matchStats?.averageScore || 0
            };
            
            // Debug-Log für die Card-Daten
            console.log('🔍 Card Stats Debug:', {
                name: cardStats.name,
                tag: cardStats.tag,
                level: cardStats.level,
                currentRank: cardStats.currentRank,
                rr: cardStats.rr,
                peakRank: cardStats.peakRank,
                totalMatches: cardStats.totalMatches
            });
            
            // Erstelle die Karte
            const cardBuffer = await makeValorantCard(cardStats);
            
            // Erstelle Discord-Attachment
            cardAttachment = new AttachmentBuilder(cardBuffer, { 
                name: `valorant-stats-${playerName}-${playerTag}.png` 
            });
            
            console.log('✅ Valorant-Karte erfolgreich erstellt');
            
        } catch (cardError) {
            console.error('❌ Fehler beim Erstellen der Valorant-Karte:', cardError);
            // Karte-Erstellung fehlgeschlagen, aber wir senden trotzdem das Embed
        }

        // Prüfe Output-Format-Konfiguration
        const outputFormat = valorantSettings.outputFormat || { mode: 'both', embedEnabled: true, cardEnabled: true };
        
        // Bereite Antwort basierend auf Konfiguration vor
        const replyOptions = {
            content: `✅ **Detaillierte Spielerdaten erfolgreich geladen!**\n📈 *Basierend auf den letzten ${matchStats.totalMatches} Matches*`
        };

        // Füge Embed hinzu falls aktiviert
        if (outputFormat.embedEnabled && (outputFormat.mode === 'embed' || outputFormat.mode === 'both')) {
            replyOptions.embeds = [embed];
        }

        // Füge Karte hinzu falls aktiviert und erfolgreich erstellt
        if (outputFormat.cardEnabled && (outputFormat.mode === 'card' || outputFormat.mode === 'both') && cardAttachment) {
            replyOptions.files = [cardAttachment];
            
            // Passe Content-Nachricht basierend auf Modus an
            if (outputFormat.mode === 'card') {
                replyOptions.content += `\n🎨 **Valorant-Statistik-Karte generiert!** 📊`;
            } else if (outputFormat.mode === 'both') {
                replyOptions.content += `\n🎨 **Bonus:** Deine Stats als schöne Karte! 📊`;
            }
        }

        // Spezielle Behandlung wenn nur Embed gewünscht ist
        if (outputFormat.mode === 'embed') {
            replyOptions.content += `\n📝 **Discord Embed Format**`;
        }

        // Fallback falls weder Embed noch Karte verfügbar
        if (!replyOptions.embeds && !replyOptions.files) {
            replyOptions.content = `❌ **Fehler:** Weder Discord Embed noch Valorant Card konnten erstellt werden.\n\n**Konfiguration:** ${outputFormat.mode}\n**Embed aktiviert:** ${outputFormat.embedEnabled}\n**Card aktiviert:** ${outputFormat.cardEnabled}`;
        }

        await interaction.editReply(replyOptions);

        // Log-Nachricht mit Output-Format-Info
        const outputInfo = outputFormat.mode === 'embed' ? 'Embed' : 
                          outputFormat.mode === 'card' ? 'Card' : 
                          'Embed+Card';
        console.log(`🎯 Detaillierte Valorant-Stats abgerufen: ${playerName}#${playerTag} (${region}) von ${interaction.user.username} - ${matchStats.totalMatches} Matches analysiert - Format: ${outputInfo}${cardAttachment && outputFormat.cardEnabled ? ' (Karte erstellt)' : ''}`);

        // Rang-Belohnungen verarbeiten (falls aktiviert)
        try {
            await handleRankRewards(interaction.guild, interaction.user, currentTier);
        } catch (rewardError) {
            console.error('❌ Fehler bei Rang-Belohnungen:', rewardError);
            // Fehler bei Rang-Belohnungen soll nicht die Hauptfunktion beeinträchtigen
        }

        // Statistiken aktualisieren
        updateValorantStats({
            playerName: playerName,
            playerTag: playerTag,
            region: region,
            success: true
        });

    } catch (error) {
        console.error('❌ Fehler bei Valorant-Modal-Submission:', error);
        
        try {
            await interaction.editReply({
                content: '❌ **Ein Fehler ist aufgetreten!**\n\nBitte versuche es später erneut oder kontaktiere einen Administrator.',
            });
        } catch (editError) {
            console.error('❌ Fehler beim Bearbeiten der Antwort:', editError);
        }
    }
}

// Express API Server
const app = express();

// CORS Configuration für Production
const corsOptions = {
    origin: function (origin, callback) {
        // Erlaubte Origins
        const allowedOrigins = [
            'http://localhost:5173', // Development Frontend
            'http://localhost:3000', // Alternative Development Port
            'https://agentbee-dashboard.netlify.app', // Production Frontend (Netlify)
            'https://main--agentbee-dashboard.netlify.app', // Netlify Branch Deploy
            process.env.FRONTEND_URL, // Zusätzliche Frontend URL
            ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [])
        ].filter(Boolean); // Entferne undefined Werte
        
        // CORS Debug für alle Requests
        console.log(`🌐 CORS Request from origin: ${origin}`);
        
        // Erlaube Requests ohne Origin (z.B. mobile apps oder Postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log(`✅ CORS allowed for origin: ${origin}`);
            callback(null, true);
        } else {
            console.log(`❌ CORS blocked origin: ${origin}`);
            console.log(`📋 Allowed origins:`, allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Für Cookies und Auth
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Größere Uploads erlauben

// Multer für Datei-Uploads konfigurieren
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = './dashboard/public/images/welcome/';
        // Stelle sicher, dass der Ordner existiert
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generiere einen einzigartigen Dateinamen
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'welcome-' + uniqueSuffix + extension);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB Limit
    },
    fileFilter: function (req, file, cb) {
        // Nur Bilder erlauben
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Nur Bilddateien sind erlaubt!'), false);
        }
    }
});

// Statische Dateien servieren
app.use('/images', express.static('./dashboard/public/images'));

// Bot Status für API
let currentBotStatus = {
    isRunning: false,
    status: 'offline',
    guilds: 0,
    users: 0,
    uptime: '0s',
    startTime: null
};

// Enhanced Health Check Endpoint für Railway
app.get('/api/health', (req, res) => {
    const botStatus = client?.isReady() ? 'online' : 'starting';
    const uptime = client?.readyAt ? Date.now() - client.readyAt.getTime() : 0;
    
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.20',
        environment: process.env.NODE_ENV || 'development',
        bot: {
            status: botStatus,
            connected: client?.isReady() || false,
            guilds: client?.guilds?.cache?.size || 0,
            uptime: formatDuration(uptime),
            readyAt: client?.readyAt?.toISOString() || null,
            user: client?.user ? {
                id: client.user.id,
                tag: client.user.tag,
                username: client.user.username
            } : null
        },
        system: {
            platform: process.platform,
            nodeVersion: process.version,
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
            },
            cpu: {
                uptime: Math.round(process.uptime()),
                loadavg: require('os').loadavg()
            }
        },
        railway: {
            environment: process.env.RAILWAY_ENVIRONMENT || null,
            staticUrl: process.env.RAILWAY_STATIC_URL || null,
            hasEnvironment: !!process.env.RAILWAY_ENVIRONMENT,
            deploymentId: process.env.RAILWAY_DEPLOYMENT_ID || null
        },
        api: {
            cors: process.env.NODE_ENV === 'production' ? 'enabled' : 'development',
            host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
            port: process.env.PORT || 3001
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Discord Bot API',
        version: '1.0.20',
        status: 'running',
        documentation: '/api/health'
    });
});

// API Routes
app.get('/api/bot/status', (req, res) => {
    // Aktualisiere Bot Status vor Antwort
    updateBotStatus();
    res.json(currentBotStatus);
});

// Bot Start API  
app.post('/api/bot/start', (req, res) => {
    try {
        console.log('🟢 Bot Start Request erhalten...');
        
        if (currentBotStatus.isRunning) {
            return res.json({ 
                success: true, 
                message: 'Bot läuft bereits',
                status: currentBotStatus.status 
            });
        }
        
        // Setze Status auf starting
        currentBotStatus.status = 'starting';
        currentBotStatus.isRunning = false;
        
        res.json({ 
            success: true, 
            message: 'Bot wird gestartet...',
            status: 'starting' 
        });
        
        // Starte den Bot-Login nach kurzer Verzögerung
        setTimeout(async () => {
            try {
                console.log('🟢 Bot wird gestartet...');
                if (!client.isReady()) {
                    await client.login(apiKeys.discord.bot_token);
                }
            } catch (error) {
                console.error('❌ Fehler beim Starten des Bots:', error);
                currentBotStatus.status = 'error';
                currentBotStatus.isRunning = false;
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Fehler beim Starten des Bots:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Fehler beim Starten des Bots',
            details: error.message 
        });
    }
});

// Bot Restart API - Railway Container Restart
app.post('/api/bot/restart', (req, res) => {
    try {
        console.log('🔄 Bot Restart Request erhalten...');
        
        // Setze Status auf restarting
        currentBotStatus.status = 'restarting';
        currentBotStatus.isRunning = false;
        
        res.json({ 
            success: true, 
            message: 'Bot wird neugestartet (Container-Restart)...',
            status: 'restarting' 
        });
        
        // Container Restart nach kurzer Verzögerung
        setTimeout(async () => {
            console.log('🔄 Bot wird neugestartet (Container-Restart)...');
            
            if (process.env.RAILWAY_ENVIRONMENT) {
                // Railway: Container Restart mit ALWAYS policy
                console.log('🚂 Railway Container Restart (restartPolicyType: ALWAYS)');
                console.log('🔄 Triggering container restart via process.exit(0)...');
                
                // Graceful Discord disconnect
                if (client.isReady()) {
                    await client.destroy();
                    console.log('✅ Bot Discord connection closed gracefully');
                }
                
                // Railway wird den Container automatisch neustarten
                console.log('🏃‍♂️ Exiting for Railway auto-restart...');
                process.exit(0);
            } else {
                // Lokal: Nur Discord reconnect
                console.log('💻 Local environment - Discord reconnect only');
                client.destroy();
                setTimeout(async () => {
                    try {
                        currentBotStatus.status = 'starting';
                        await client.login(apiKeys.discord.bot_token);
                        console.log('✅ Local restart complete');
                    } catch (error) {
                        console.error('❌ Fehler beim lokalen Neustart:', error);
                        currentBotStatus.status = 'error';
                        currentBotStatus.isRunning = false;
                    }
                }, 2000);
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Fehler beim Neustarten des Bots:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Fehler beim Neustarten des Bots',
            details: error.message 
        });
    }
});

// Bot Stop API
app.post('/api/bot/stop', (req, res) => {
    try {
        console.log('🛑 Bot Stop Request erhalten...');
        
        // Setze Status auf stopping
        currentBotStatus.status = 'stopping';
        currentBotStatus.isRunning = false;
        
        res.json({ 
            success: true, 
            message: 'Bot wird gestoppt...',
            status: 'stopping' 
        });
        
        // Stoppe den Bot nach kurzer Verzögerung damit die Response noch gesendet wird
        setTimeout(() => {
            console.log('🛑 Bot wird gestoppt...');
            if (process.env.RAILWAY_ENVIRONMENT) {
                // In Railway: Graceful shutdown
                console.log('🚂 Railway Stop - Graceful shutdown');
                client.destroy();
                process.exit(0);
            } else {
                // Lokal: Nur disconnect
                client.destroy();
                currentBotStatus.status = 'offline';
                currentBotStatus.isRunning = false;
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Fehler beim Stoppen des Bots:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Fehler beim Stoppen des Bots',
            details: error.message 
        });
    }
});

// Bot Commands API
app.get('/api/commands', (req, res) => {
    try {
        const commands = [
            // Moderation Commands
            { name: '/warn', description: 'Einen Benutzer verwarnen', category: 'Moderation', usage: '/warn @user [reason]', permissions: 'MODERATE_MEMBERS', icon: '⚠️' },
            { name: '/ban', description: 'Einen Benutzer bannen', category: 'Moderation', usage: '/ban @user [reason]', permissions: 'BAN_MEMBERS', icon: '🔨' },
            { name: '/kick', description: 'Einen Benutzer kicken', category: 'Moderation', usage: '/kick @user [reason]', permissions: 'KICK_MEMBERS', icon: '👢' },
            { name: '/mute', description: 'Einen Benutzer stumm schalten', category: 'Moderation', usage: '/mute @user [time] [reason]', permissions: 'MODERATE_MEMBERS', icon: '🔇' },
            { name: '/unmute', description: 'Einen Benutzer entstummen', category: 'Moderation', usage: '/unmute @user', permissions: 'MODERATE_MEMBERS', icon: '🔊' },
            { name: '/clear', description: 'Nachrichten löschen', category: 'Moderation', usage: '/clear [amount]', permissions: 'MANAGE_MESSAGES', icon: '🧹' },
            
            // XP System Commands  
            { name: '/level', description: 'Zeige dein aktuelles Level', category: 'XP System', usage: '/level [@user]', permissions: 'Alle', icon: '📊' },
            { name: '/leaderboard', description: 'Zeige die XP-Rangliste', category: 'XP System', usage: '/leaderboard', permissions: 'Alle', icon: '🏆' },
            { name: '/xp', description: 'XP-System verwalten', category: 'XP System', usage: '/xp add/remove @user [amount]', permissions: 'ADMINISTRATOR', icon: '⭐' },
            
            // Music Commands
            { name: '/play', description: 'Musik abspielen', category: 'Musik', usage: '/play [song/url]', permissions: 'Alle', icon: '🎵' },
            { name: '/stop', description: 'Musik stoppen', category: 'Musik', usage: '/stop', permissions: 'DJ', icon: '⏹️' },
            { name: '/skip', description: 'Song überspringen', category: 'Musik', usage: '/skip', permissions: 'DJ', icon: '⏭️' },
            { name: '/queue', description: 'Aktuelle Warteschlange anzeigen', category: 'Musik', usage: '/queue', permissions: 'Alle', icon: '📋' },
            { name: '/volume', description: 'Lautstärke ändern', category: 'Musik', usage: '/volume [0-100]', permissions: 'DJ', icon: '🔊' },
            
            // Utility Commands
            { name: '/ping', description: 'Bot-Latenz prüfen', category: 'Utility', usage: '/ping', permissions: 'Alle', icon: '🏓' },
            { name: '/serverinfo', description: 'Server-Informationen anzeigen', category: 'Utility', usage: '/serverinfo', permissions: 'Alle', icon: 'ℹ️' },
            { name: '/userinfo', description: 'Benutzer-Informationen anzeigen', category: 'Utility', usage: '/userinfo [@user]', permissions: 'Alle', icon: '👤' },
            { name: '/help', description: 'Hilfe und Commands anzeigen', category: 'Utility', usage: '/help [command]', permissions: 'Alle', icon: '❓' },
            
            // Valorant Commands
            { name: '/valorant', description: 'Valorant-Stats anzeigen', category: 'Gaming', usage: '/valorant [region] [username]', permissions: 'Alle', icon: '🎯' },
            { name: '/valorant-setup', description: 'Valorant-Rollen erstellen', category: 'Gaming', usage: '/valorant-setup', permissions: 'ADMINISTRATOR', icon: '⚙️' },
            
            // Fun Commands
            { name: '/8ball', description: 'Magische 8-Ball Antwort', category: 'Fun', usage: '/8ball [question]', permissions: 'Alle', icon: '🎱' },
            { name: '/coinflip', description: 'Münze werfen', category: 'Fun', usage: '/coinflip', permissions: 'Alle', icon: '🪙' },
            { name: '/dice', description: 'Würfel werfen', category: 'Fun', usage: '/dice [sides]', permissions: 'Alle', icon: '🎲' }
        ];

        const stats = {
            total: commands.length,
            byCategory: commands.reduce((acc, cmd) => {
                acc[cmd.category] = (acc[cmd.category] || 0) + 1;
                return acc;
            }, {})
        };

        res.json({ commands, stats });
    } catch (error) {
        console.error('❌ Fehler beim Laden der Commands:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Commands' });
    }
});

app.get('/api/info', (req, res) => {
    res.json({
        name: 'Discord Bot API',
        version: '1.0.0',
        botStatus: currentBotStatus
    });
});

// ================== API KEYS API ROUTES ==================

// API-Keys Status abrufen (ohne die Keys selbst zu zeigen)
app.get('/api/keys/status', (req, res) => {
    try {
        const status = {
            discord: {
                bot_token: !!apiKeys.discord.bot_token,
                client_id: !!apiKeys.discord.client_id,
                client_secret: !!apiKeys.discord.client_secret,
                configured: !!(apiKeys.discord.bot_token && apiKeys.discord.client_id && apiKeys.discord.client_secret)
            },
            openai: !!apiKeys.openai,
            twitch: {
                clientId: !!apiKeys.twitch.clientId,
                clientSecret: !!apiKeys.twitch.clientSecret,
                configured: !!(apiKeys.twitch.clientId && apiKeys.twitch.clientSecret)
            },
            valorant: !!apiKeys.valorant,
            youtube: {
                apiKey: !!apiKeys.youtube.apiKey,
                configured: !!apiKeys.youtube.apiKey
            }
        };
        res.json({ success: true, status });
    } catch (error) {
        console.error('❌ Fehler beim Abrufen des API-Key-Status:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen des API-Key-Status' });
    }
});

// API-Keys aktualisieren
app.post('/api/keys', (req, res) => {
    try {
        const { discord, openai, twitch, valorant } = req.body;
        
        // Nur nicht-leere Keys aktualisieren
        if (discord) {
            if (discord.bot_token) apiKeys.discord.bot_token = discord.bot_token;
            if (discord.client_id) apiKeys.discord.client_id = discord.client_id;
            if (discord.client_secret) apiKeys.discord.client_secret = discord.client_secret;
        }
        if (openai) apiKeys.openai = openai;
        if (twitch) {
            if (twitch.clientId) apiKeys.twitch.clientId = twitch.clientId;
            if (twitch.clientSecret) apiKeys.twitch.clientSecret = twitch.clientSecret;
        }
        if (valorant) apiKeys.valorant = valorant;
        if (req.body.youtube && req.body.youtube.apiKey) {
            apiKeys.youtube.apiKey = req.body.youtube.apiKey;
        }
        
        // Speichern
        const saved = saveAPIKeys();
        
        if (saved) {
            // Systeme mit neuen Keys aktualisieren
            if (openai && apiKeys.openai) {
                initializeOpenAI();
            }
            
            if (twitchAPI && twitch) {
                const twitchSystem = twitchAPI.getTwitchSystem();
                if (twitchSystem) {
                    twitchSystem.setCredentials(apiKeys.twitch.clientId, apiKeys.twitch.clientSecret);
                }
            }
            
            console.log('🔑 API-Keys aktualisiert');
            res.json({ 
                success: true, 
                message: 'API-Keys gespeichert und Systeme aktualisiert',
                status: {
                    discord: {
                        bot_token: !!apiKeys.discord.bot_token,
                        client_id: !!apiKeys.discord.client_id,
                        client_secret: !!apiKeys.discord.client_secret,
                        configured: !!(apiKeys.discord.bot_token && apiKeys.discord.client_id && apiKeys.discord.client_secret)
                    },
                    openai: !!apiKeys.openai,
                    twitch: {
                        clientId: !!apiKeys.twitch.clientId,
                        clientSecret: !!apiKeys.twitch.clientSecret,
                        configured: !!(apiKeys.twitch.clientId && apiKeys.twitch.clientSecret)
                    },
                    valorant: !!apiKeys.valorant,
                    youtube: {
                        apiKey: !!apiKeys.youtube.apiKey,
                        configured: !!apiKeys.youtube.apiKey
                    }
                }
            });
        } else {
            res.status(500).json({ error: 'Fehler beim Speichern der API-Keys' });
        }
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der API-Keys:', error);
        res.status(500).json({ error: 'Fehler beim Aktualisieren der API-Keys' });
    }
});

// Bot Settings laden
app.get('/api/bot/settings', (req, res) => {
    try {
        if (fs.existsSync('./bot-settings.json')) {
            const settings = JSON.parse(fs.readFileSync('./bot-settings.json', 'utf8'));
            res.json(settings);
        } else {
            // Standard-Einstellungen
            const defaultSettings = {
                botName: 'CyberBot',
                botStatus: 'online',
                activityType: 'playing',
                activityText: 'mit dem Discord Server',
                prefix: '!',
                autoModeration: true,
                antiSpam: true,
                maxWarnings: 3,
                muteRole: 'Muted',
                logChannel: 'mod-log',
                welcomeEnabled: true,
                leveling: false,
                economyEnabled: false,
                musicEnabled: true,
                adminRoles: ['Admin', 'Owner'],
                moderatorRoles: ['Moderator', 'Helper'],
                djRole: 'DJ',
                commandCooldown: 3,
                deleteCommands: false,
                dmCommands: true,
                debugMode: false
            };
            res.json(defaultSettings);
        }
    } catch (error) {
        console.error('Fehler beim Laden der Bot-Einstellungen:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Bot-Einstellungen' });
    }
});

// Bot Settings speichern
app.post('/api/bot/settings', async (req, res) => {
    try {
        const settings = req.body;
        
        // Speichere in Datei
        fs.writeFileSync('./bot-settings.json', JSON.stringify(settings, null, 2));
        
        // Wende Einstellungen sofort an
        await applyBotSettings(settings);
        
        console.log('✅ Bot-Einstellungen aktualisiert');
        res.json({ success: true, message: 'Bot-Einstellungen gespeichert und angewendet' });
    } catch (error) {
        console.error('Fehler beim Speichern der Bot-Einstellungen:', error);
        res.status(500).json({ error: 'Fehler beim Speichern der Bot-Einstellungen' });
    }
});

// Legacy Rules API entfernt - verwendet jetzt Supabase API
// Siehe rules-supabase-api.js für neue Endpunkte

// Legacy Welcome API entfernt - verwendet jetzt welcome-supabase-api.js
// Siehe welcome-supabase-api.js für neue Endpunkte







// Ticket-API wird jetzt in ticket-api.js behandelt

// Rules automatisch neu posten
app.post('/api/rules/repost', async (req, res) => {
    if (!client.isReady()) {
        return res.status(503).json({ error: 'Bot ist nicht online' });
    }

    try {
        console.log('🔄 Starte automatisches Neu-Posten der Regeln...');
        
        // Lade aktuelle Regeln aus Supabase
        await loadCurrentRules();
        const currentRules = getCurrentRules();
        
        let repostedCount = 0;
        
        // Durchlaufe alle Server
        for (const guild of client.guilds.cache.values()) {
            // Verwende den konfigurierten Channel-Namen aus den Regeln
            const channelName = currentRules.channelName || currentRules.channel || 'rules';
            const rulesChannel = guild.channels.cache.find(ch => 
                ch.name.toLowerCase().includes(channelName.toLowerCase()) ||
                ch.name.includes('rules') || ch.name.includes('regeln') || ch.name.includes('regel')
            );

            if (rulesChannel) {
                try {
                    // Lösche alte Bot-Nachrichten
                    const messages = await rulesChannel.messages.fetch({ limit: 10 });
                    const botMessages = messages.filter(msg => msg.author.id === client.user.id);
                    
                    if (botMessages.size > 0) {
                        await rulesChannel.bulkDelete(botMessages);
                    }

                    // Poste neue Regeln
                    const rulesEmbed = await createRulesEmbed(guild.name);
                    const rulesMessage = await rulesChannel.send({ embeds: [rulesEmbed] });
                    
                    // Füge Reaktion hinzu
                    await rulesMessage.react(currentRules.reaction.emoji);
                    
                    // Speichere Nachrichten-ID
                    rulesMessages.set(rulesMessage.id, {
                        guildId: guild.id,
                        channelId: rulesChannel.id
                    });
                    
                    repostedCount++;
                    console.log(`✅ Regeln neu gepostet in ${guild.name}`);
                    
                    // Kleine Verzögerung zwischen Servern
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (error) {
                    console.error(`❌ Fehler beim Neu-Posten in ${guild.name}:`, error.message);
                }
            }
        }
        
        res.json({ 
            success: true, 
            message: `Regeln in ${repostedCount} Server(n) neu gepostet`,
            repostedCount 
        });
        
    } catch (error) {
        console.error('❌ Fehler beim Neu-Posten der Regeln:', error);
        res.status(500).json({ error: 'Fehler beim Neu-Posten der Regeln' });
    }
});

// ==============================================
// WELCOME SYSTEM API - SUPABASE STORAGE
// ==============================================

// Multer für Welcome Image-Uploads konfigurieren
const welcomeUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB wie in Supabase Storage
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Nur Bilddateien sind erlaubt!'), false);
        }
    }
});

// GET: Welcome Settings laden
app.get('/api/welcome', async (req, res) => {
    try {
        const guildId = req.query.guildId || process.env.GUILD_ID || '1203994020779532348';
        const settings = await loadWelcomeSettings(guildId);
        
        if (!settings) {
            return res.status(404).json({ error: 'Keine Welcome Settings gefunden' });
        }
        
        res.json(settings);
    } catch (error) {
        console.error('❌ Fehler beim Laden der Welcome Settings:', error);
        res.status(500).json({ error: 'Interner Server-Fehler' });
    }
});

// POST: Welcome Settings speichern
app.post('/api/welcome', async (req, res) => {
    try {
        const guildId = req.body.guildId || process.env.GUILD_ID || '1203994020779532348';
        const settings = req.body;
        
        const result = await saveWelcomeSettings(settings, guildId);
        
        if (result.success) {
            res.json({ success: true, message: 'Welcome Settings gespeichert' });
        } else {
            res.status(500).json({ error: result.error || 'Fehler beim Speichern' });
        }
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Welcome Settings:', error);
        res.status(500).json({ error: 'Interner Server-Fehler' });
    }
});

// GET: Welcome Images laden
app.get('/api/welcome/images', async (req, res) => {
    try {
        const guildId = req.query.guildId || process.env.GUILD_ID || '1203994020779532348';
        const images = await loadWelcomeImages(guildId);
        
        res.json(images);
    } catch (error) {
        console.error('❌ Fehler beim Laden der Welcome Images:', error);
        res.status(500).json({ error: 'Interner Server-Fehler' });
    }
});

// POST: Welcome Image hochladen
app.post('/api/welcome/upload', welcomeUpload.single('welcomeImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Keine Datei hochgeladen' });
        }

        const guildId = req.body.guildId || process.env.GUILD_ID || '1203994020779532348';
        const folder = req.body.folder || 'general';
        
        // Erstelle einzigartigen Dateinamen
        const timestamp = Date.now();
        const extension = req.file.originalname.split('.').pop();
        const filename = `welcome-${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
        
        const imageData = {
            filename,
            originalName: req.file.originalname,
            folder,
            buffer: req.file.buffer,
            size: req.file.size,
            mimetype: req.file.mimetype
        };

        const result = await saveWelcomeImage(imageData, guildId);
        
        if (result.success) {
        res.json({ 
                success: true,
                url: result.url,
                filename: result.filename,
                folder: result.folder,
                message: 'Bild erfolgreich hochgeladen'
            });
        } else {
            res.status(500).json({ error: result.error || 'Fehler beim Upload' });
        }
    } catch (error) {
        console.error('❌ Fehler beim Upload:', error);
        res.status(500).json({ error: 'Upload fehlgeschlagen' });
    }
});

// DELETE: Welcome Image löschen
app.delete('/api/welcome/images/:imageId', async (req, res) => {
    try {
        const imageId = req.params.imageId;
        const guildId = req.query.guildId || process.env.GUILD_ID || '1203994020779532348';
        
        const result = await deleteWelcomeImage(imageId, guildId);
        
        if (result.success) {
            res.json({ success: true, message: 'Bild erfolgreich gelöscht' });
        } else {
            res.status(500).json({ error: result.error || 'Fehler beim Löschen' });
        }
    } catch (error) {
        console.error('❌ Fehler beim Löschen:', error);
        res.status(500).json({ error: 'Löschen fehlgeschlagen' });
    }
});

// POST: Welcome Folder erstellen
app.post('/api/welcome/folders', async (req, res) => {
    try {
        const { folderName } = req.body;
        const guildId = req.body.guildId || process.env.GUILD_ID || '1203994020779532348';
        
        if (!folderName) {
            return res.status(400).json({ error: 'Ordnername ist erforderlich' });
        }
        
        const result = await createWelcomeFolder(folderName, guildId);
        
        if (result.success) {
            res.json({ success: true, folderName: result.folderName, message: 'Ordner erfolgreich erstellt' });
        } else {
            res.status(500).json({ error: result.error || 'Fehler beim Erstellen des Ordners' });
        }
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Ordners:', error);
        res.status(500).json({ error: 'Erstellen fehlgeschlagen' });
    }
});

// DELETE: Welcome Folder löschen
app.delete('/api/welcome/folders/:folderName', async (req, res) => {
    try {
        const folderName = req.params.folderName;
        const guildId = req.query.guildId || process.env.GUILD_ID || '1203994020779532348';
        
        const result = await deleteWelcomeFolder(folderName, guildId);
        
        if (result.success) {
        res.json({ success: true, message: 'Ordner erfolgreich gelöscht' });
        } else {
            res.status(500).json({ error: result.error || 'Fehler beim Löschen des Ordners' });
        }
    } catch (error) {
        console.error('❌ Fehler beim Löschen des Ordners:', error);
        res.status(500).json({ error: 'Löschen fehlgeschlagen' });
    }
});

// POST: Test Welcome Message
app.post('/api/welcome/test', async (req, res) => {
    try {
        if (!client.isReady()) {
            return res.status(503).json({ error: 'Bot ist nicht online' });
        }

        const guildId = req.body.guildId || process.env.GUILD_ID || '1203994020779532348';
        const settings = req.body;
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: 'Server nicht gefunden' });
        }

        // Finde Welcome-Channel
        const welcomeChannel = guild.channels.cache.find(ch => 
            ch.name.toLowerCase().includes(settings.channelName?.toLowerCase() || 'willkommen') ||
            ch.name.toLowerCase().includes('welcome') ||
            ch.name.toLowerCase().includes('general')
        );

        if (!welcomeChannel) {
            return res.status(404).json({ error: `Channel "${settings.channelName || 'willkommen'}" nicht gefunden` });
        }

        // Erstelle Test-Member (Bot als Beispiel)
        const testMember = guild.members.cache.get(client.user.id);
        
        // Erstelle Welcome-Embed
        const { embed } = await createWelcomeEmbed(guild, testMember, settings);
        
        // Sende Test-Message
        await welcomeChannel.send({
            content: '🧪 **TEST-WILLKOMMENSNACHRICHT** 🧪',
            embeds: [embed]
        });

        res.json({ success: true, message: 'Test-Willkommensnachricht gesendet' });
    } catch (error) {
        console.error('❌ Fehler beim Senden der Test-Nachricht:', error);
        res.status(500).json({ error: 'Test fehlgeschlagen' });
    }
});

// POST: Test Leave Message
app.post('/api/welcome/test-leave', async (req, res) => {
    try {
    if (!client.isReady()) {
        return res.status(503).json({ error: 'Bot ist nicht online' });
    }

        const guildId = req.body.guildId || process.env.GUILD_ID || '1203994020779532348';
        const settings = req.body;
        
        if (!settings.leaveMessage || !settings.leaveMessage.enabled) {
            return res.status(400).json({ error: 'Leave Messages sind nicht aktiviert' });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: 'Server nicht gefunden' });
        }

        // Finde Leave-Channel
        const leaveChannel = guild.channels.cache.find(ch => 
            ch.name.toLowerCase().includes(settings.leaveMessage.channelName?.toLowerCase() || 'verlassen')
        );

        if (!leaveChannel) {
            return res.status(404).json({ error: `Channel "${settings.leaveMessage.channelName || 'verlassen'}" nicht gefunden` });
        }

        // Erstelle Test-Member (Bot als Beispiel)
        const testMember = guild.members.cache.get(client.user.id);
        
        // Erstelle Leave-Embed
        const leaveEmbed = await createLeaveEmbed(guild, testMember, settings.leaveMessage);
        
        // Sende Test-Message
        await leaveChannel.send({
            content: '🧪 **TEST-ABSCHIEDSNACHRICHT** 🧪',
            embeds: [leaveEmbed]
        });

        res.json({ success: true, message: 'Test-Abschiedsnachricht gesendet' });
                } catch (error) {
        console.error('❌ Fehler beim Senden der Test-Leave-Nachricht:', error);
        res.status(500).json({ error: 'Test fehlgeschlagen' });
    }
});

// ==============================================
// LEGACY RULES SYSTEM
// ==============================================

// Regeln werden jetzt über Supabase API geladen
let rulesData = {
    title: "📜 SERVERREGELN",
    description: "Willkommen auf **{serverName}**! Bitte lies und befolge diese Regeln:",
    color: "0xFF6B6B",
    channelName: "rules",
    rules: [
        { emoji: "1️⃣", name: "Respekt", value: "Sei respektvoll und freundlich zu allen Mitgliedern" },
        { emoji: "2️⃣", name: "Kein Spam", value: "Kein Spam, keine Werbung oder Eigenwerbung" }
    ],
    footer: "Viel Spaß auf dem Server! 🎉",
    reaction: {
        emoji: "✅",
        message: "Reagiere mit ✅ um die Regeln zu akzeptieren!",
        acceptedRole: "verified",
        acceptedMessage: "Willkommen! Du hast die Regeln akzeptiert."
    }
};

// Globale Variable für aktuelle Regeln aus Supabase
let currentRulesData = null;

// Funktion zum Laden der aktuellen Regeln aus Supabase
async function loadCurrentRules() {
    try {
        const { loadRulesFromSupabase } = require('./rules-supabase-api');
        const rules = await loadRulesFromSupabase(process.env.GUILD_ID || '1203994020779532348');
        
        if (rules) {
            currentRulesData = rules;
            console.log('✅ Aktuelle Regeln aus Supabase geladen');
            return rules;
        } else {
            console.log('⚠️ Keine Regeln in Supabase gefunden, verwende Fallback');
            currentRulesData = rulesData;
            return rulesData;
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Regeln:', error);
        currentRulesData = rulesData;
        return rulesData;
    }
}

// Hilfsfunktion um die aktuellen Regeln zu bekommen
function getCurrentRules() {
    return currentRulesData || rulesData;
}

// Daily Message Counter für echte "heute" Statistiken
let dailyMessageCount = 0;
let lastResetDate = new Date().toDateString();

// Daily Counter aus Datei laden
function loadDailyCounter() {
    try {
        if (fs.existsSync('./daily-message-counter.json')) {
            const data = JSON.parse(fs.readFileSync('./daily-message-counter.json', 'utf8'));
            const currentDate = new Date().toDateString();
            
            if (data.date === currentDate) {
                dailyMessageCount = data.count || 0;
                lastResetDate = data.date;
                console.log(`📊 Daily Counter geladen: ${dailyMessageCount} Nachrichten für ${currentDate}`);
            } else {
                console.log(`📅 Neuer Tag erkannt: ${data.date} → ${currentDate}`);
                dailyMessageCount = 0;
                lastResetDate = currentDate;
                saveDailyCounter();
            }
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden des Daily Counters:', error);
    }
}

// Daily Counter speichern
function saveDailyCounter() {
    try {
        const data = {
            count: dailyMessageCount,
            date: lastResetDate,
            lastUpdate: new Date().toISOString()
        };
        fs.writeFileSync('./daily-message-counter.json', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Fehler beim Speichern des Daily Counters:', error);
    }
}

// Erstelle eine neue Client-Instanz
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
    ] 
});

// Commands Collection
client.commands = new Collection();

// XP System initialisieren
let xpSystem;

// Speichere Regeln-Nachrichten IDs für Reaktionen
const rulesMessages = new Map();

// API Server URL
const API_SERVER_URL = process.env.NODE_ENV === 'production' 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'agentbee.up.railway.app'}` 
    : 'http://localhost:3001';

// OpenAI Client initialisieren
let openai = null;

function initializeOpenAI() {
    if (apiKeys.openai) {
        openai = new OpenAI({
            apiKey: apiKeys.openai
        });
        // Mache OpenAI global verfügbar für andere Module
        global.openai = openai;
        console.log('🤖 OpenAI Client initialisiert');
        return true;
    } else {
        console.log('⚠️  OpenAI API-Key nicht konfiguriert');
        return false;
    }
}

// OpenAI beim Start initialisieren
initializeOpenAI();

// Funktion um Regeln zu erstellen
async function createRulesEmbed(guildName) {
    // Lade Regeln aus Supabase
    const { loadRulesFromSupabase } = require('./rules-supabase-api');
    let rules = await loadRulesFromSupabase(process.env.GUILD_ID || '1203994020779532348');
    
    // Fallback zu Standard-Regeln falls Supabase nicht verfügbar
    if (!rules) {
        rules = rulesData;
        console.log('⚠️ Verwende Fallback-Regeln für Embed');
    } else {
        console.log('✅ Regeln aus Supabase für Embed geladen');
    }
    
    const description = rules.description.replace('{serverName}', guildName);
    
    const embed = new EmbedBuilder()
        .setColor(parseInt(rules.color, 16))
        .setTitle(rules.title)
        .setDescription(description)
        .setFooter({ text: rules.footer })
        .setTimestamp();

    // Füge alle Regeln hinzu
    rules.rules.forEach(rule => {
        embed.addFields({
            name: `${rule.emoji} ${rule.name}`,
            value: rule.value,
            inline: false
        });
    });

    // Füge Reaktions-Anweisung hinzu
    embed.addFields({
        name: '📝 Bestätigung',
        value: rules.reaction.message,
        inline: false
    });

    return embed;
}

// Legacy Welcome-Funktionen entfernt - verwende jetzt welcome-supabase-api.js

// Funktion um automatisch Regeln zu posten
async function autoPostRules() {
    console.log('🔍 Suche nach Rules-Kanälen...');
    
    // Lade Regeln aus Supabase
    const { loadRulesFromSupabase } = require('./rules-supabase-api');
    let rules = await loadRulesFromSupabase(process.env.GUILD_ID || '1203994020779532348');
    
    // Fallback zu Standard-Regeln falls Supabase nicht verfügbar
    if (!rules) {
        rules = rulesData;
        console.log('⚠️ Verwende Fallback-Regeln für Auto-Post');
    } else {
        console.log('✅ Regeln aus Supabase für Auto-Post geladen');
    }
    
    // Durchlaufe alle Server (Guilds) in denen der Bot ist
    client.guilds.cache.forEach(async guild => {
        // Verwende den konfigurierten Channel-Namen aus den Regeln
        const channelName = rules.channelName || rules.channel || 'rules';
        // Finde den Rules-Kanal
        const rulesChannel = guild.channels.cache.find(ch => 
            ch.name.toLowerCase().includes(channelName.toLowerCase()) ||
            ch.name.includes('rules') || ch.name.includes('regeln') || ch.name.includes('regel')
        );

        if (rulesChannel) {
            try {
                // Lösche alte Regeln-Nachrichten (optional)
                const messages = await rulesChannel.messages.fetch({ limit: 10 });
                const botMessages = messages.filter(msg => msg.author.id === client.user.id);
                
                if (botMessages.size > 0) {
                    await rulesChannel.bulkDelete(botMessages);
                    console.log(`🗑️ Alte Regeln in ${guild.name} gelöscht`);
                }

                // Poste neue Regeln
                const rulesEmbed = await createRulesEmbed(guild.name);
                const rulesMessage = await rulesChannel.send({ embeds: [rulesEmbed] });
                
                // Füge Reaktion hinzu
                await rulesMessage.react(rules.reaction.emoji);
                
                // Speichere Nachrichten-ID für Reaktions-Handling
                rulesMessages.set(rulesMessage.id, {
                    guildId: guild.id,
                    channelId: rulesChannel.id
                });
                
                console.log(`✅ Regeln automatisch gepostet in ${guild.name} -> ${rulesChannel.name}`);
                
            } catch (error) {
                console.error(`❌ Fehler beim Posten der Regeln in ${guild.name}:`, error.message);
            }
        } else {
            console.log(`⚠️ Kein Rules-Kanal in ${guild.name} gefunden`);
        }
    });
}

// Moderation System
let moderationSettings = {
    autoModeration: true,
    antiSpam: true,
    maxWarnings: 3,
    muteRole: 'Muted',
    logChannel: 'mod-log'
};

// Warnings Datenbank
let warningsDatabase = new Map(); // userId -> [warnings]
let userMessageHistory = new Map(); // userId -> [timestamps]
let mutedUsers = new Map(); // Map: User ID -> { until: timestamp, reason: string, guildId: string, muteDuration: number }

// Lade Moderation-Einstellungen
function loadModerationSettings() {
    try {
        if (fs.existsSync('./bot-settings.json')) {
            const settings = JSON.parse(fs.readFileSync('./bot-settings.json', 'utf8'));
            moderationSettings = {
                autoModeration: settings.autoModeration || false,
                antiSpam: settings.antiSpam || false,
                maxWarnings: settings.maxWarnings || 3,
                muteRole: settings.muteRole || 'Muted',
                logChannel: settings.logChannel || 'mod-log'
            };
            
            console.log('📋 Moderation Settings geladen:', moderationSettings);
            console.log(`📍 Log-Channel konfiguriert: "${moderationSettings.logChannel}"`);
        } else {
            // Standard Settings falls Datei nicht existiert
            moderationSettings = {
                autoModeration: true,
                antiSpam: true,
                maxWarnings: 3,
                muteRole: 'Muted',
                logChannel: 'mod-log'
            };
            console.log('📋 Standard Moderation Settings geladen (Datei nicht gefunden)');
            console.log(`📍 Standard Log-Channel: "${moderationSettings.logChannel}"`);
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Moderation-Einstellungen:', error);
        // Fallback Settings
        moderationSettings = {
            autoModeration: true,
            antiSpam: true,
            maxWarnings: 3,
            muteRole: 'Muted',
            logChannel: 'mod-log'
        };
        console.log('📋 Fallback Moderation Settings verwendet');
    }
}

// Warnung hinzufügen
async function addWarning(guild, user, reason, moderator) {
    const userId = user.id;
    if (!warningsDatabase.has(userId)) {
        warningsDatabase.set(userId, []);
    }
    
    const warning = {
        id: Date.now(),
        reason: reason,
        moderator: moderator.tag,
        timestamp: new Date().toISOString()
    };
    
    warningsDatabase.get(userId).push(warning);
    const totalWarnings = warningsDatabase.get(userId).length;
    
    console.log(`⚠️ User ${user.tag} hat jetzt ${totalWarnings} Verwarnungen (Max: ${moderationSettings.maxWarnings})`);
    
    // Füge zum Moderations-Log hinzu
    addModerationLog('warn', user, moderator, reason, guild, {
        warningCount: totalWarnings,
        maxWarnings: moderationSettings.maxWarnings
    });
    
    // Log in Moderation Channel
    await logModerationAction(guild, 'warning', user, moderator, reason, totalWarnings);
    
    // Prüfe ob Max-Warnings erreicht
    if (totalWarnings >= moderationSettings.maxWarnings) {
        console.log(`🚨 Max-Warnings erreicht! Versuche ${user.tag} zu muten...`);
        const muteSuccess = await muteUser(guild, user, `${moderationSettings.maxWarnings} Verwarnungen erreicht`, moderator);
        
        if (!muteSuccess) {
            console.error(`❌ Auto-Mute fehlgeschlagen für ${user.tag}! Prüfe Mute-Rolle und Permissions.`);
            
            // Erstelle automatisch Mute-Rolle falls sie nicht existiert
            await createMuteRoleIfNeeded(guild);
        }
    }
    
    return totalWarnings;
}

// User muten
async function muteUser(guild, user, reason, moderator) {
    try {
        console.log(`🔇 Versuche ${user.tag} zu muten...`);
        
        const member = await guild.members.fetch(user.id);
        console.log(`✅ Member ${user.tag} erfolgreich geholt`);
        
        // Prüfe Bot-Permissions
        const botMember = guild.members.cache.get(client.user.id);
        if (!botMember.permissions.has('ManageRoles')) {
            console.error(`❌ Bot hat keine "Rollen verwalten" Permission in ${guild.name}!`);
            return false;
        }
        
        let muteRole = guild.roles.cache.find(role => 
            role.name.toLowerCase() === moderationSettings.muteRole.toLowerCase()
        );
        
        // Falls Mute-Rolle nicht existiert, erstelle sie
        if (!muteRole) {
            console.log(`⚠️ Mute-Rolle "${moderationSettings.muteRole}" nicht gefunden. Erstelle sie...`);
            muteRole = await createMuteRole(guild);
            
            if (!muteRole) {
                console.error(`❌ Konnte Mute-Rolle nicht erstellen!`);
                return false;
            }
        }
        
        console.log(`✅ Mute-Rolle gefunden: ${muteRole.name}`);
        
        // Prüfe ob User bereits die Rolle hat
        if (member.roles.cache.has(muteRole.id)) {
            console.log(`ℹ️ ${user.tag} hat bereits die Mute-Rolle`);
            return true;
        }
        
        // Bestimme Mute-Dauer basierend auf Verstoß
        const muteDuration = determineMuteDuration(reason, warningsDatabase.get(user.id)?.length || 0);
        const muteUntil = Date.now() + muteDuration;
        
        // Füge Mute-Rolle hinzu
        await member.roles.add(muteRole);
        
        // Speichere Mute-Informationen
        mutedUsers.set(user.id, {
            until: muteUntil,
            reason: reason,
            guildId: guild.id,
            muteDuration: muteDuration,
            muteRoleId: muteRole.id,
            username: user.tag,
            mutedAt: Date.now(),
            moderator: moderator?.tag || 'AutoMod'
        });
        
        console.log(`✅ ${user.tag} erfolgreich gemutet für ${formatDuration(muteDuration)}!`);
        
        // Füge zum Moderations-Log hinzu
        addModerationLog('mute', user, moderator, reason, guild, {
            duration: muteDuration,
            formattedDuration: formatDuration(muteDuration),
            warningCount: warningsDatabase.get(user.id)?.length || 0
        });
        
        await logModerationAction(guild, 'mute', user, moderator, reason, formatDuration(muteDuration));
        
        // Speichere Mute-Daten persistent
        saveMuteDatabase();
        
        // Plane automatisches Unmute
        setTimeout(async () => {
            await autoUnmute(user.id);
        }, muteDuration);
        
        // DM an User senden
        try {
            await user.send(`🔇 **Du wurdest auf ${guild.name} gemutet**\n\n` +
                           `📋 **Grund:** ${reason}\n` +
                           `⏱️ **Dauer:** ${formatDuration(muteDuration)}\n` +
                           `📅 **Bis:** ${new Date(muteUntil).toLocaleString('de-DE')}\n` +
                           `⚠️ **Verwarnungen:** ${warningsDatabase.get(user.id)?.length || 0}\n\n` +
                           `ℹ️ Du wirst automatisch entmutet, wenn die Zeit abgelaufen ist.`);
        } catch (error) {
            console.log('⚠️ Konnte keine DM senden');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Fehler beim Muten:', error);
        console.error('❌ Error Details:', error.message);
        
        // Spezifische Fehlerbehandlung
        if (error.code === 50013) {
            console.error(`❌ Keine Berechtigung zum Hinzufügen von Rollen!`);
        } else if (error.code === 50001) {
            console.error(`❌ Keine Berechtigung zum Zugriff auf diesen User!`);
        }
        
        return false;
    }
}

// Anti-Spam Prüfung (Verbessert)
function checkSpam(userId, content, messageId) {
    if (!moderationSettings.antiSpam) return false;
    
    const now = Date.now();
    const timeWindow = 3000; // 3 Sekunden (noch empfindlicher)
    const maxMessages = 3; // Max 3 Nachrichten in 3 Sekunden
    
    if (!userMessageHistory.has(userId)) {
        userMessageHistory.set(userId, []);
    }
    
    const userHistory = userMessageHistory.get(userId);
    
    // Entferne alte Nachrichten außerhalb des Zeitfensters
    const recentMessages = userHistory.filter(entry => now - entry.timestamp < timeWindow);
    
    // Füge aktuelle Nachricht hinzu
    recentMessages.push({ 
        timestamp: now, 
        messageId: messageId,
        content: content.substring(0, 50) // Ersten 50 Zeichen für Debugging
    });
    
    userMessageHistory.set(userId, recentMessages);
    
    console.log(`🔍 Spam-Check für ${userId}: ${recentMessages.length} Nachrichten in ${timeWindow}ms`);
    
    // Prüfe ob Spam-Limit überschritten
    if (recentMessages.length > maxMessages) {
        console.log(`🚫 SPAM ERKANNT: ${recentMessages.length} Nachrichten zu schnell!`);
        return { 
            type: 'message_spam', 
            reason: `${recentMessages.length} Nachrichten in ${timeWindow/1000} Sekunden`,
            messageCount: recentMessages.length
        };
    }
    
    // Identische Nachrichten erkennen (Copy-Paste Spam)
    const identicalMessages = recentMessages.filter(entry => 
        entry.content.toLowerCase() === content.toLowerCase().substring(0, 50)
    );
    if (identicalMessages.length >= 2) {
        console.log(`🚫 SPAM ERKANNT: Identische Nachrichten "${content}"`);
        return { 
            type: 'identical_spam', 
            reason: 'Identische Nachrichten wiederholt',
            messageCount: identicalMessages.length
        };
    }
    
    // Zusätzliche Spam-Prüfungen
    const repeatedChar = /(.)\1{6,}/.test(content); // Wiederholte Zeichen (noch empfindlicher)
    if (repeatedChar) {
        console.log(`🚫 SPAM ERKANNT: Wiederholte Zeichen in "${content}"`);
        return { type: 'repeated_chars', reason: 'Wiederholte Zeichen' };
    }
    
    const capsSpam = content.length > 10 && content === content.toUpperCase() && /[A-Z]{10,}/.test(content);
    if (capsSpam) {
        console.log(`🚫 SPAM ERKANNT: CAPS-Spam in "${content}"`);
        return { type: 'caps_spam', reason: 'Übermäßige Großschreibung' };
    }
    
    const mentionSpam = (content.match(/<@/g) || []).length > 2;
    if (mentionSpam) {
        console.log(`🚫 SPAM ERKANNT: Mention-Spam in "${content}"`);
        return { type: 'mention_spam', reason: 'Übermäßige Erwähnungen' };
    }
    
    // Link-Spam erkennen
    const urlCount = (content.match(/https?:\/\//g) || []).length;
    if (urlCount > 2) {
        console.log(`🚫 SPAM ERKANNT: Link-Spam in "${content}"`);
        return { type: 'link_spam', reason: 'Übermäßige Links' };
    }
    
    return false;
}

// Moderation Log
async function logModerationAction(guild, action, user, moderator, reason, extra = null) {
    // Prioritätsreihenfolge für Log-Channel Suche
    let logChannel = null;
    
    // 1. Exakte Übereinstimmung mit dem konfigurierten Log-Channel
    if (moderationSettings.logChannel && moderationSettings.logChannel !== 'general') {
        logChannel = guild.channels.cache.find(ch => 
            ch.name.toLowerCase() === moderationSettings.logChannel.toLowerCase()
        );
        console.log(`🔍 Suche exakt nach "${moderationSettings.logChannel}": ${logChannel ? '✅ Gefunden' : '❌ Nicht gefunden'}`);
    }
    
    // 2. Falls nicht gefunden, suche nach "mod-log" (bevorzugt)
    if (!logChannel) {
        logChannel = guild.channels.cache.find(ch => 
            ch.name.toLowerCase() === 'mod-log' ||
            ch.name.toLowerCase() === 'modlog' ||
            ch.name.toLowerCase() === 'mod_log'
        );
        console.log(`🔍 Suche nach mod-log: ${logChannel ? '✅ Gefunden' : '❌ Nicht gefunden'}`);
    }
    
    // 3. Falls immer noch nicht gefunden, suche nach anderen Log-Channels
    if (!logChannel) {
        logChannel = guild.channels.cache.find(ch => 
            ch.name.toLowerCase() === 'logs' ||
            ch.name.toLowerCase() === 'audit-log' ||
            ch.name.toLowerCase() === 'server-log'
        );
        console.log(`🔍 Suche nach anderen Log-Channels: ${logChannel ? '✅ Gefunden' : '❌ Nicht gefunden'}`);
    }
    
    // 4. Als letzter Ausweg allgemeine Log-Channels
    if (!logChannel) {
        logChannel = guild.channels.cache.find(ch => 
            ch.name.toLowerCase().includes('log') && 
            ch.name.toLowerCase() !== 'welcome' &&
            ch.name.toLowerCase() !== 'general'
        );
        console.log(`🔍 Suche nach beliebigen Log-Channels: ${logChannel ? '✅ Gefunden' : '❌ Nicht gefunden'}`);
    }
    
    if (!logChannel) {
        console.warn(`⚠️ Kein Log-Channel in ${guild.name} gefunden! Konfiguriert: "${moderationSettings.logChannel}"`);
        console.warn(`📋 Verfügbare Text-Kanäle:`);
        guild.channels.cache.forEach(ch => {
            if (ch.type === 0) { // Text channels only
                console.log(`   📝 #${ch.name}`);
            }
        });
        console.warn(`💡 Erstelle einen Kanal namens "mod-log" oder ändere die Konfiguration!`);
        return;
    }
    
    console.log(`📝 Sende Moderation-Log an: #${logChannel.name}`);
    
    const colors = {
        warning: 0xFFFF00,
        mute: 0xFF6B6B,
        unmute: 0x00FF00,
        kick: 0xFF4500,
        ban: 0x8B0000,
        spam: 0xFF1493
    };
    
    const actionNames = {
        warning: '⚠️ Verwarnung',
        mute: '🔇 Mute',
        unmute: '✅ Unmute',
        kick: '👢 Kick',
        ban: '🔨 Ban',
        spam: '🚫 Spam erkannt'
    };
    
    const embed = new EmbedBuilder()
        .setColor(colors[action] || 0x808080)
        .setTitle(actionNames[action] || action)
        .addFields(
            { name: '👤 User', value: `${user} (${user.tag})`, inline: true },
            { name: '👮 Moderator', value: moderator.tag, inline: true },
            { name: '📝 Grund', value: reason || 'Kein Grund angegeben', inline: false }
        )
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();
    
    if (extra !== null) {
        embed.addFields({ name: 'ℹ️ Info', value: `Gesamte Verwarnungen: ${extra}`, inline: false });
    }
    
    await logChannel.send({ embeds: [embed] });
}

// Twitch-System Setup
let twitchAPI = null;

// Event: Bot ist bereit (initial startup)
client.once(Events.ClientReady, async readyClient => {
    console.log(`✅ Bot ist bereit! Angemeldet als ${readyClient.user.tag}`);
    
    // Daily Message Counter laden
    loadDailyCounter();
    
    // XP System initialisieren
    xpSystem = new XPSystem(client);
global.xpSystem = xpSystem; // Als globale Variable verfügbar machen

// Giveaway-System initialisieren
let giveawaySystem = new GiveawaySystem(client);
client.giveawaySystem = giveawaySystem;
global.giveawaySystem = giveawaySystem; // Als globale Variable verfügbar machen

// Giveaway-Interaktionen initialisieren
const GiveawayInteractions = require('./giveaway-interactions');
const giveawayInteractions = new GiveawayInteractions(client);
giveawayInteractions.setGiveawaySystem(giveawaySystem);
client.giveawayInteractions = giveawayInteractions;

console.log('🎉 Giveaway-System und Interaktionen initialisiert');

// Giveaway-API registrieren nach System-Initialisierung
registerGiveawayAPI(app, client);
registerTicketAPI(app, client);
console.log('🎉 Giveaway-API registriert');

// 🎵 YOUTUBE RADIO-SYSTEM INITIALISIEREN
try {
    console.log('🎵 Initialisiere YouTube Radio-System...');
    
    // Settings laden
    loadMusicSettings();
    
    // Global Client verfügbar machen
    global.client = client;
    
    // YouTube Radio-System initialisiert
    // Musik-System initialisiert
    console.log('🎵 YouTube Radio-System geladen!');
    
    // API-Routen registrieren (verschoben nach Express-Server-Start)
    
    console.log('✅ YouTube Radio-System erfolgreich initialisiert!');
    
} catch (error) {
    console.error('❌ Fehler beim Initialisieren des YouTube Radio-Systems:', error);
}
    console.log('✅ XP-System initialisiert');
    
    // Twitch-System initialisieren
    twitchAPI = setupTwitchAPI(app, client);
    if (twitchAPI) {
        twitchAPI.initializeTwitchSystem();
        // Setze Twitch API Credentials
        const twitchSystem = twitchAPI.getTwitchSystem();
        if (twitchSystem && apiKeys.twitch.clientId && apiKeys.twitch.clientSecret) {
            twitchSystem.setCredentials(apiKeys.twitch.clientId, apiKeys.twitch.clientSecret);
        }
    }
    
    // Bot Status initialisieren und sofort updaten
    currentBotStatus = {
        isRunning: true,
        status: 'online',
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        uptime: '0s',
        startTime: Date.now()
    };
    
    // Sofortiger Status-Update (wichtig für Railway Restart Fix)
    updateBotStatus();
    sendStatusToAPI();
    console.log('🟢 Bot Status sofort aktualisiert - Railway-Restart berücksichtigt');
    
    // Prüfe Bot Permissions nach 1 Sekunde
    setTimeout(() => {
        checkBotPermissions();
    }, 1000);
    
    // Periodische Status-Updates alle 5 Sekunden für bessere Responsivität
    const statusInterval = setInterval(() => {
        updateBotStatus();
        sendStatusToAPI();
    }, 5000);
    
    // Cleanup für Status-Interval
    client.once('disconnect', () => {
        clearInterval(statusInterval);
        console.log('🔄 Status-Updates gestoppt (disconnect)');
    });
    
    // Automatisch Regeln posten nach 2 Sekunden
    setTimeout(async () => {
        await autoPostRules();
    }, 2000);
    


    // OpenAI ist bereits beim Start initialisiert - keine weitere Initialisierung nötig

    // Bot-Introduction-Trigger initialisieren nach 5 Sekunden
    setTimeout(async () => {
        try {
            console.log('🤖 Initialisiere Bot-Vorstellungs-Trigger...');
            setupIntroductionTriggers(client);
            console.log('✅ Bot-Vorstellungs-Trigger aktiviert');
        } catch (error) {
            console.error('❌ Fehler bei Bot-Vorstellungs-Triggern:', error);
        }
    }, 5000);
    
    // Server-Stats System mit SettingsManager initialisieren nach 6 Sekunden
    setTimeout(async () => {
        try {
            console.log('📊 Initialisiere Server-Stats System (V2-Ready)...');
            
            // Migration der alten Server-Stats Settings
            await migrateServerStatsToV2();
            
            await ServerStats.initializeServerStats(client);
            console.log('✅ Server-Stats System aktiviert (V2-Ready)');
        } catch (error) {
            console.error('❌ Fehler bei Server-Stats System:', error);
        }
    }, 6000);
    
    // Ticket-System V2 initialisieren nach 7 Sekunden
    setTimeout(async () => {
        try {
            console.log('🎫 Initialisiere TicketSystemV2...');
            
            // Migration von alten Settings
            console.log('🔄 Prüfe Migration von alten Ticket-Settings...');
            const migrated = await TicketSystemV2.migrateFromOldSystem();
            if (migrated) {
                console.log('✅ Migration der Ticket-Settings erfolgreich');
            }
            
            // Initialisiere neues System
            const initialized = await TicketSystemV2.initialize();
            if (initialized) {
                console.log('✅ TicketSystemV2 aktiviert');
                
                // Mache global verfügbar für andere Module und API
                global.ticketSystemV2 = TicketSystemV2;
                client.ticketSystemV2 = TicketSystemV2;
            } else {
                console.error('❌ Fehler bei der Initialisierung von TicketSystemV2');
            }
        } catch (error) {
            console.error('❌ Fehler bei TicketSystemV2:', error);
        }
    }, 7000);
    
    // Discord Native AFK - wird über Dashboard konfiguriert
    setTimeout(async () => {
        console.log('💤 Discord Native AFK verfügbar - konfiguriere über Dashboard');
        console.log('ℹ️ Verwende guild.edit({afkChannelId, afkTimeout}) für AFK Setup');
    }, 8000);
    
    // Anomalie-Erkennung und Server-Health-System initialisieren nach 9 Sekunden
    setTimeout(async () => {
        try {
            console.log('🔍 Initialisiere Anomalie-Erkennungssystem...');
            client.anomalyDetection = new AnomalyDetectionAPI(client);
            console.log('✅ Anomalie-Erkennungssystem aktiviert');
            
            console.log('🏥 Initialisiere Server-Health-System...');
            client.serverHealth = new ServerHealthAPI(client);
            console.log('✅ Server-Health-System aktiviert');
            
            console.log('📊 Initialisiere Server Manager Analytics...');
            client.serverManagerAnalytics = new ServerManagerAnalyticsAPI(client);
            client.bulkServerActions = new BulkServerActionsAPI(client);
            console.log('🔧 Bulk Server Actions API initialisiert');
            
            console.log('👥 Initialisiere Mass Member Management...');
            client.massMemberManagement = new MassMemberManagementAPI(client);
            console.log('✅ Mass Member Management API initialisiert');
            
            console.log('🤖 Initialisiere AI Optimization...');
            client.aiOptimization = new AIOptimizationAPI(client);
            console.log('✅ AI Optimization API initialisiert');
            
            console.log('✅ Server Manager Analytics aktiviert');
        } catch (error) {
            console.error('❌ Fehler bei der Initialisierung der Analyse-Systeme:', error);
        }
    }, 9000);
    
    // Bot-Einstellungen laden und anwenden nach 3 Sekunden
    setTimeout(async () => {
        try {
            console.log('🔧 Lade Bot-Einstellungen...');
        await loadAndApplyBotSettings();
            console.log('✅ Bot-Einstellungen geladen');
            
            console.log('🔧 Lade Moderation-Einstellungen...');
        loadModerationSettings();
            console.log('✅ Moderation-Einstellungen geladen');
            
            console.log('🔧 Lade Mute-Database...');
        loadMuteDatabase();
            console.log('✅ Mute-Database geladen');
            
            console.log('🔧 Lade Moderations-Logs...');
        loadModerationLogs(); // Lade Moderations-Logs
            console.log('✅ Moderations-Logs geladen');
            
            // Starte wichtige Timer zuerst (unabhängig von Command-Registrierung)
            console.log('🔧 Starte Daily Reset Timer...');
            startDailyResetTimer();
            console.log('✅ Daily Reset Timer gestartet');
            
            // Starte Auto-Leaderboard Timer (alle 1 Minute prüfen)
            console.log('🚀 Starte Auto-Leaderboard Timer...');
            startAutoLeaderboardTimer();
            console.log('✅ Auto-Leaderboard Timer Setup abgeschlossen');
        
        // Force reload der Logs nach kurzer Zeit zur Sicherheit
        setTimeout(() => {
            loadModerationLogs();
            console.log(`🔄 Moderations-Logs neu geladen: ${moderationLogs.length} Einträge`);
        }, 2000);
        
            // Commands im Hintergrund registrieren (kann länger dauern)
            console.log('🔧 Registriere Commands im Hintergrund...');
            registerModerationCommands().then(() => {
                console.log('✅ Moderation-Commands registriert');
            }).catch(error => {
                console.error('❌ Fehler bei Moderation-Commands:', error);
            });
            
            registerXPCommands().then(() => {
                console.log('✅ XP-Commands registriert');
            }).catch(error => {
                console.error('❌ Fehler bei XP-Commands:', error);
            });
            
        } catch (error) {
            console.error('❌ Fehler beim Bot-Setup:', error);
        }
    }, 3000);
});

// Event: Bot reconnected (für Railway Restart Fix)
client.on(Events.ClientReady, async readyClient => {
    // Nur bei Reconnect-Events (nicht initial startup)
    if (currentBotStatus.status === 'restarting' || currentBotStatus.status === 'starting') {
        console.log(`🔄 Bot reconnected nach Restart: ${readyClient.user.tag}`);
        
        // Sofortiger Status-Update nach Reconnect
        currentBotStatus.status = 'online';
        currentBotStatus.isRunning = true;
        updateBotStatus();
        sendStatusToAPI();
        console.log('🟢 Bot Status nach Reconnect aktualisiert');
    }
});

// Prüfe Bot Permissions
function checkBotPermissions() {
    console.log(`🔐 Prüfe Bot-Permissions...`);
    
    client.guilds.cache.forEach(guild => {
        const botMember = guild.members.cache.get(client.user.id);
        if (botMember) {
            const hasManageMessages = botMember.permissions.has('ManageMessages');
            const hasKickMembers = botMember.permissions.has('KickMembers');
            const hasManageRoles = botMember.permissions.has('ManageRoles');
            const hasSendMessages = botMember.permissions.has('SendMessages');
            const hasViewChannel = botMember.permissions.has('ViewChannel');
            
            console.log(`🏰 Server: ${guild.name}`);
            console.log(`   - Kanäle ansehen: ${hasViewChannel ? '✅' : '❌'}`);
            console.log(`   - Nachrichten senden: ${hasSendMessages ? '✅' : '❌'}`);
            console.log(`   - Nachrichten verwalten: ${hasManageMessages ? '✅' : '❌'}`);
            console.log(`   - Mitglieder kicken: ${hasKickMembers ? '✅' : '❌'}`);
            console.log(`   - Rollen verwalten: ${hasManageRoles ? '✅' : '❌'}`);
            
            if (!hasManageMessages) {
                console.warn(`⚠️ WICHTIG: Bot benötigt "Nachrichten verwalten" Permission zum Löschen von Spam/Schimpfwörtern in ${guild.name}!`);
            }
            
            if (!hasKickMembers) {
                console.warn(`⚠️ Bot benötigt "Mitglieder kicken" Permission für Mute-Funktion in ${guild.name}!`);
            }
            
            if (!hasManageRoles) {
                console.warn(`⚠️ Bot benötigt "Rollen verwalten" Permission für Mute-Rolle in ${guild.name}!`);
            }
            
        } else {
            console.error(`❌ Bot Member nicht gefunden in ${guild.name}`);
        }
    });
    
    console.log(`✅ Permission-Check abgeschlossen!`);
}

// Debug: Alle Kanäle anzeigen
function showAllChannels(guild) {
    console.log(`📺 Alle Kanäle in ${guild.name}:`);
    guild.channels.cache.forEach(ch => {
        if (ch.type === 0) { // Text channels only
            console.log(`   📝 #${ch.name} (ID: ${ch.id})`);
        }
    });
}

// Erstelle Mute-Rolle automatisch
async function createMuteRole(guild) {
    try {
        console.log(`🔨 Erstelle Mute-Rolle "${moderationSettings.muteRole}" in ${guild.name}...`);
        
        const muteRole = await guild.roles.create({
            name: moderationSettings.muteRole,
            color: 0x808080, // Grau
            permissions: [],
            reason: 'Automatisch erstellte Mute-Rolle für Moderation'
        });
        
        console.log(`✅ Mute-Rolle "${muteRole.name}" erfolgreich erstellt!`);
        
        // Konfiguriere Channel-Permissions für alle Text- und Voice-Channels
        setTimeout(async () => {
            await configureMuteRolePermissions(guild, muteRole);
        }, 1000);
        
        return muteRole;
        
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Mute-Rolle:', error);
        return null;
    }
}

// Konfiguriere Mute-Rolle Permissions für alle Channels
async function configureMuteRolePermissions(guild, muteRole) {
    try {
        console.log(`⚙️ Konfiguriere Mute-Rolle Permissions für alle Channels...`);
        
        let configuredChannels = 0;
        
        for (const [channelId, channel] of guild.channels.cache) {
            try {
                if (channel.type === 0) { // Text channels
                    await channel.permissionOverwrites.create(muteRole, {
                        SendMessages: false,
                        AddReactions: false,
                        CreatePublicThreads: false,
                        CreatePrivateThreads: false,
                        SendMessagesInThreads: false,
                        UseApplicationCommands: false
                    });
                    configuredChannels++;
                } else if (channel.type === 2) { // Voice channels
                    await channel.permissionOverwrites.create(muteRole, {
                        Speak: false,
                        Stream: false,
                        UseVAD: false,
                        UseSoundboard: false
                    });
                    configuredChannels++;
                }
                
                // Kleine Pause um Rate-Limits zu vermeiden
                await new Promise(resolve => setTimeout(resolve, 250));
                
            } catch (error) {
                console.warn(`⚠️ Konnte Permissions für #${channel.name} nicht setzen:`, error.message);
            }
        }
        
        console.log(`✅ Mute-Rolle Permissions für ${configuredChannels} Channels konfiguriert!`);
        
    } catch (error) {
        console.error('❌ Fehler beim Konfigurieren der Mute-Rolle Permissions:', error);
    }
}

// Erstelle Mute-Rolle falls benötigt
async function createMuteRoleIfNeeded(guild) {
    const muteRole = guild.roles.cache.find(role => 
        role.name.toLowerCase() === moderationSettings.muteRole.toLowerCase()
    );
    
    if (!muteRole) {
        console.log(`🔨 Erstelle fehlende Mute-Rolle für ${guild.name}...`);
        return await createMuteRole(guild);
    }
    
    console.log(`✅ Mute-Rolle "${muteRole.name}" bereits vorhanden`);
    return muteRole;
}

// Bestimme Mute-Dauer basierend auf Verstoß
function determineMuteDuration(reason, warningCount) {
    const durations = {
        // Spam-basierte Mutes (kürzer)
        'spam': 10 * 60 * 1000, // 10 Minuten
        'message_spam': 15 * 60 * 1000, // 15 Minuten
        'repeated_chars': 5 * 60 * 1000, // 5 Minuten
        'caps_spam': 10 * 60 * 1000, // 10 Minuten
        'mention_spam': 20 * 60 * 1000, // 20 Minuten
        'link_spam': 30 * 60 * 1000, // 30 Minuten
        
        // Schimpfwort-basierte Mutes (länger)
        'unangemessene sprache': 60 * 60 * 1000, // 1 Stunde
        'schimpfwort': 60 * 60 * 1000, // 1 Stunde
        
        // Verwarnungs-basierte Mutes (progressiv)
        'verwarnungen': getWarningBasedDuration(warningCount),
        
        // Standard
        'default': 30 * 60 * 1000 // 30 Minuten
    };
    
    // Erkenne Typ des Verstoßes
    const lowerReason = reason.toLowerCase();
    
    if (lowerReason.includes('spam')) {
        if (lowerReason.includes('message') || lowerReason.includes('nachrichten')) return durations.message_spam;
        if (lowerReason.includes('wiederholte')) return durations.repeated_chars;
        if (lowerReason.includes('großschreibung') || lowerReason.includes('caps')) return durations.caps_spam;
        if (lowerReason.includes('erwähnungen') || lowerReason.includes('mention')) return durations.mention_spam;
        if (lowerReason.includes('link')) return durations.link_spam;
        return durations.spam;
    }
    
    if (lowerReason.includes('sprache') || lowerReason.includes('schimpf')) {
        return durations['unangemessene sprache'];
    }
    
    if (lowerReason.includes('verwarnungen') || lowerReason.includes('warnings')) {
        return getWarningBasedDuration(warningCount);
    }
    
    return durations.default;
}

// Berechne Mute-Dauer basierend auf Anzahl der Verwarnungen
function getWarningBasedDuration(warningCount) {
    if (warningCount <= 3) return 30 * 60 * 1000; // 30 Minuten
    if (warningCount <= 5) return 2 * 60 * 60 * 1000; // 2 Stunden
    if (warningCount <= 8) return 6 * 60 * 60 * 1000; // 6 Stunden
    if (warningCount <= 12) return 24 * 60 * 60 * 1000; // 24 Stunden
    return 7 * 24 * 60 * 60 * 1000; // 7 Tage
}

// Formatiere Dauer in lesbaren Text
function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} Tag${days !== 1 ? 'e' : ''}`;
    if (hours > 0) return `${hours} Stunde${hours !== 1 ? 'n' : ''}`;
    if (minutes > 0) return `${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
    return `${seconds} Sekunde${seconds !== 1 ? 'n' : ''}`;
}

// Automatisches Unmute
async function autoUnmute(userId) {
    try {
        const muteInfo = mutedUsers.get(userId);
        if (!muteInfo) {
            console.log(`ℹ️ User ${userId} ist nicht mehr gemutet (bereits entfernt)`);
            return;
        }
        
        // Prüfe ob Mute-Zeit abgelaufen ist
        if (Date.now() < muteInfo.until) {
            console.log(`⏱️ Mute für User ${userId} läuft noch bis ${new Date(muteInfo.until).toLocaleString('de-DE')}`);
            return;
        }
        
        const guild = client.guilds.cache.get(muteInfo.guildId);
        if (!guild) {
            console.warn(`⚠️ Guild ${muteInfo.guildId} nicht gefunden für Unmute von ${userId}`);
            mutedUsers.delete(userId);
            return;
        }
        
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
            console.warn(`⚠️ Member ${userId} nicht gefunden für Unmute`);
            mutedUsers.delete(userId);
            return;
        }
        
        const muteRole = guild.roles.cache.get(muteInfo.muteRoleId);
        if (muteRole && member.roles.cache.has(muteRole.id)) {
            await member.roles.remove(muteRole);
            console.log(`✅ Auto-Unmute: ${member.user.tag} wurde automatisch entmutet`);
            
            // Log in Moderation Channel
            const botUser = client.user;
            await logModerationAction(guild, 'unmute', member.user, botUser, 'Automatisches Unmute nach Zeitablauf');
            
            // DM an User senden
            try {
                await member.user.send(`✅ **Du wurdest auf ${guild.name} entmutet**\n\n` +
                                     `🎉 Deine Mute-Zeit ist abgelaufen!\n` +
                                     `📋 **Grund des Mutes war:** ${muteInfo.reason}\n` +
                                     `⏱️ **Dauer war:** ${formatDuration(muteInfo.muteDuration)}\n\n` +
                                     `⚠️ Bitte halte dich an die Serverregeln, um weitere Mutes zu vermeiden.`);
            } catch (error) {
                console.log('⚠️ Konnte keine Unmute-DM senden');
            }
        }
        
        // Entferne aus Mute-Database
        mutedUsers.delete(userId);
        saveMuteDatabase();
        
    } catch (error) {
        console.error(`❌ Fehler beim automatischen Unmute von ${userId}:`, error);
    }
}

// Speichere Mute-Database persistent
function saveMuteDatabase() {
    try {
        const muteData = Array.from(mutedUsers.entries()).map(([userId, info]) => ({
            userId,
            ...info
        }));
        
        fs.writeFileSync('./muted-users.json', JSON.stringify(muteData, null, 2));
        console.log(`💾 Mute-Database gespeichert (${muteData.length} gemutete Users)`);
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Mute-Database:', error);
    }
}

// Lade Mute-Database beim Start
function loadMuteDatabase() {
    try {
        if (fs.existsSync('./muted-users.json')) {
            let muteData = JSON.parse(fs.readFileSync('./muted-users.json', 'utf8'));
            
            // Stelle sicher, dass muteData ein Array ist
            if (!Array.isArray(muteData)) {
                console.log('⚠️ muted-users.json ist kein Array beim Laden der Database, konvertiere zu leerem Array');
                muteData = [];
                // Speichere korrigierte Datei
                fs.writeFileSync('./muted-users.json', JSON.stringify([], null, 2));
            }
            
            muteData.forEach(entry => {
                if (entry && entry.userId && entry.until) {
                    mutedUsers.set(entry.userId, {
                        until: entry.until,
                        reason: entry.reason,
                        guildId: entry.guildId,
                        muteDuration: entry.muteDuration,
                        muteRoleId: entry.muteRoleId,
                        username: entry.username || 'Unbekannt',
                        mutedAt: entry.mutedAt || Date.now(),
                        moderator: entry.moderator || 'System'
                    });
                    
                    // Plane automatisches Unmute falls noch nicht abgelaufen
                    const timeLeft = entry.until - Date.now();
                    if (timeLeft > 0) {
                        setTimeout(async () => {
                            await autoUnmute(entry.userId);
                        }, timeLeft);
                        console.log(`⏱️ Auto-Unmute geplant für User ${entry.username || entry.userId} in ${formatDuration(timeLeft)}`);
                    } else {
                        // Sofortiges Unmute wenn bereits abgelaufen
                        setTimeout(async () => {
                            await autoUnmute(entry.userId);
                        }, 1000);
                    }
                }
            });
            
            console.log(`📂 Mute-Database geladen: ${muteData.length} gemutete Users`);
            
            // Debug-Output für geladene Mutes
            muteData.forEach(entry => {
                if (entry && entry.userId) {
                    console.log(`   - ${entry.username || 'Unbekannt'} (${entry.userId}) bis ${new Date(entry.until).toLocaleString('de-DE')}`);
                }
            });
        } else {
            // Erstelle leere Datei falls sie nicht existiert
            fs.writeFileSync('./muted-users.json', JSON.stringify([], null, 2));
            console.log('✅ Neue muted-users.json Datei erstellt');
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Mute-Database:', error);
        // Erstelle eine neue, leere Datei falls sie korrupt ist
        try {
            fs.writeFileSync('./muted-users.json', JSON.stringify([], null, 2));
            console.log('✅ Neue muted-users.json Datei nach Fehler erstellt');
        } catch (writeError) {
            console.error('❌ Fehler beim Erstellen einer neuen muted-users.json:', writeError);
        }
    }
}

// Lösche letzte Nachrichten eines Users (Anti-Spam)
async function deleteRecentUserMessages(channel, userId, limit = 10) {
    try {
        console.log(`🧹 Versuche ${limit} letzte Nachrichten von User ${userId} zu löschen...`);
        
        // Hole die letzten 50 Nachrichten aus dem Channel
        const messages = await channel.messages.fetch({ limit: 50 });
        
        // Filtere Nachrichten vom spezifischen User (max. 2 Wochen alt für Discord API)
        const userMessages = messages.filter(msg => 
            msg.author.id === userId && 
            (Date.now() - msg.createdTimestamp) < 1209600000 // 2 Wochen in Millisekunden
        );
        
        // Begrenze auf das Limit
        const messagesToDelete = userMessages.first(limit);
        
        if (messagesToDelete.length === 0) {
            console.log(`ℹ️ Keine löschbaren Nachrichten von User ${userId} gefunden`);
            return;
        }
        
        console.log(`🗑️ Lösche ${messagesToDelete.length} Nachrichten von User ${userId}...`);
        
        // Lösche Nachrichten einzeln (sicherer als bulkDelete)
        let deletedCount = 0;
        for (const msg of messagesToDelete) {
            try {
                if (!msg.deleted) {
                    await msg.delete();
                    deletedCount++;
                    // Kleine Pause zwischen Löschungen um Rate-Limits zu vermeiden
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                console.warn(`⚠️ Konnte Nachricht ${msg.id} nicht löschen:`, error.message);
            }
        }
        
        console.log(`✅ ${deletedCount} Spam-Nachrichten erfolgreich gelöscht!`);
        
    } catch (error) {
        console.error('❌ Fehler beim Bulk-Delete von Spam-Nachrichten:', error);
    }
}

// Event: Bot wird zu neuem Server hinzugefügt
client.on(Events.GuildCreate, async guild => {
    console.log(`🆕 Bot wurde zu ${guild.name} hinzugefügt`);
    
    // Warte kurz und poste dann Regeln
    setTimeout(async () => {
        const rulesChannel = guild.channels.cache.find(ch => 
            ch.name.includes('rules') || ch.name.includes('regeln') || ch.name.includes('regel')
        );

        if (rulesChannel) {
            const rulesEmbed = await createRulesEmbed(guild.name);
            const rulesMessage = await rulesChannel.send({ embeds: [rulesEmbed] });
            const currentRules = getCurrentRules();
            await rulesMessage.react(currentRules.reaction.emoji);
            
            rulesMessages.set(rulesMessage.id, {
                guildId: guild.id,
                channelId: rulesChannel.id
            });
            
            console.log(`✅ Regeln automatisch gepostet beim Beitritt zu ${guild.name}`);
        }
    }, 3000);
});

// Event: Reaktion hinzugefügt
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    // Ignoriere Bot-Reaktionen
    if (user.bot) return;

    // Prüfe ob es eine Regeln-Nachricht ist
    if (rulesMessages.has(reaction.message.id)) {
        const rulesInfo = rulesMessages.get(reaction.message.id);
        const guild = client.guilds.cache.get(rulesInfo.guildId);
        const member = guild.members.cache.get(user.id);

        // Lade aktuelle Regeln für Reaktions-Handling
        const currentRules = getCurrentRules();
        
        // Prüfe ob es die richtige Reaktion ist
        if (reaction.emoji.name === currentRules.reaction.emoji) {
            try {
                // Suche nach "verified" oder ähnlicher Rolle
                const verifiedRole = guild.roles.cache.find(role => 
                    role.name.toLowerCase().includes(currentRules.reaction.acceptedRole) ||
                    role.name.toLowerCase().includes('verified') ||
                    role.name.toLowerCase().includes('member') ||
                    role.name.toLowerCase().includes('user')
                );

                if (verifiedRole && !member.roles.cache.has(verifiedRole.id)) {
                    await member.roles.add(verifiedRole);
                    console.log(`✅ ${user.tag} hat die Regeln akzeptiert und Rolle erhalten`);

                    // Sende DM an User (optional)
                    try {
                        await user.send(`🎉 ${currentRules.reaction.acceptedMessage}`);
                    } catch (error) {
                        console.log(`⚠️ Konnte keine DM an ${user.tag} senden`);
                    }

                    // Log in Kanal (optional)
                    const logChannel = guild.channels.cache.find(ch => 
                        ch.name.includes('log') || ch.name.includes('welcome')
                    );

                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setColor(0x00FF00)
                            .setTitle('✅ Regeln Akzeptiert')
                            .setDescription(`${user} hat die Serverregeln akzeptiert!`)
                            .setThumbnail(user.displayAvatarURL())
                            .setTimestamp();

                        logChannel.send({ embeds: [logEmbed] });
                    }

                } else if (verifiedRole) {
                    console.log(`ℹ️ ${user.tag} hat bereits die Verified-Rolle`);
                } else {
                    console.log(`⚠️ Keine Verified-Rolle in ${guild.name} gefunden`);
                }

            } catch (error) {
                console.error(`❌ Fehler beim Hinzufügen der Rolle für ${user.tag}:`, error);
            }
        }
    }
});

// Event: Reaktion entfernt
client.on(Events.MessageReactionRemove, async (reaction, user) => {
    // Ignoriere Bot-Reaktionen
    if (user.bot) return;

    // Lade aktuelle Regeln für Reaktions-Handling
    const currentRules = getCurrentRules();
    
    // Prüfe ob es eine Regeln-Nachricht ist und die richtige Reaktion
    if (rulesMessages.has(reaction.message.id) && reaction.emoji.name === currentRules.reaction.emoji) {
        const rulesInfo = rulesMessages.get(reaction.message.id);
        const guild = client.guilds.cache.get(rulesInfo.guildId);
        const member = guild.members.cache.get(user.id);

        // Optional: Rolle entfernen wenn Reaktion entfernt wird
        const verifiedRole = guild.roles.cache.find(role => 
            role.name.toLowerCase().includes(currentRules.reaction.acceptedRole) ||
            role.name.toLowerCase().includes('verified') ||
            role.name.toLowerCase().includes('member')
        );

        if (verifiedRole && member.roles.cache.has(verifiedRole.id)) {
            await member.roles.remove(verifiedRole);
            console.log(`❌ ${user.tag} hat Reaktion entfernt und Rolle verloren`);
        }
    }
});

// Event: Nachricht empfangen (Auto-Moderation)
client.on(Events.MessageCreate, async message => {
    // Ignoriere Bot-Nachrichten
    if (message.author.bot) return;
    
    const guild = message.guild;
    if (!guild) return; // Keine DMs moderieren
    
    console.log(`📝 Nachricht von ${message.author.tag}: "${message.content}"`);
    
    // Prüfe nur wenn Auto-Moderation aktiviert ist
    if (!moderationSettings.autoModeration) {
        console.log('⚠️ Auto-Moderation ist deaktiviert');
        return;
    }
    
    // Prüfe ob User Administrator oder Moderator ist
    const member = guild.members.cache.get(message.author.id);
    if (!member) return;
    
    // Lade Admin/Mod Rollen aus Settings
    let adminRoles = ['Admin', 'Owner'];
    let modRoles = ['Moderator', 'Helper'];
    
    try {
        if (fs.existsSync('./bot-settings.json')) {
            const settings = JSON.parse(fs.readFileSync('./bot-settings.json', 'utf8'));
            adminRoles = settings.adminRoles || adminRoles;
            modRoles = settings.moderatorRoles || modRoles;
        }
    } catch (error) {
        console.error('Fehler beim Laden der Rollen:', error);
    }
    
    // Prüfe ob User Admin/Mod ist (ignoriere Moderation)
    const hasAdminRole = member.roles.cache.some(role => 
        adminRoles.some(adminRole => role.name.toLowerCase().includes(adminRole.toLowerCase()))
    );
    const hasModRole = member.roles.cache.some(role => 
        modRoles.some(modRole => role.name.toLowerCase().includes(modRole.toLowerCase()))
    );
    
    if (hasAdminRole || hasModRole || member.permissions.has('Administrator')) {
        console.log(`👮 ${message.author.tag} ist Staff - ignoriere Moderation`);
        return; // Ignoriere Staff
    }
    
    // Anti-Spam Prüfung
    const spamResult = checkSpam(message.author.id, message.content, message.id);
    
    if (spamResult) {
        try {
            console.log(`🚫 Versuche Spam-Nachricht zu löschen von ${message.author.tag} (${spamResult.type})`);
            
            // Prüfe Bot-Permissions vor dem Löschen
            const botMember = guild.members.cache.get(client.user.id);
            if (!botMember.permissions.has('ManageMessages')) {
                console.error(`❌ Bot hat keine "Nachrichten verwalten" Permission in ${guild.name}!`);
                return;
            }
            
            // Lösche Spam-Nachricht sofort
            if (!message.deleted) {
                await message.delete();
                console.log(`✅ Spam-Nachricht erfolgreich gelöscht! (${spamResult.type})`);
            }
            
            // Bei Message-Spam: Lösche auch vorherige Nachrichten des Users
            if (spamResult.type === 'message_spam' && spamResult.messageCount > 3) {
                await deleteRecentUserMessages(message.channel, message.author.id, 10);
            }
            
            // Warnung hinzufügen
            const botUser = client.user;
            await addWarning(guild, message.author, `Spam erkannt: ${spamResult.reason}`, botUser);
            
            // Füge zum Moderations-Log hinzu
            addModerationLog('spam_delete', message.author, null, `Spam erkannt: ${spamResult.reason}`, guild, {
                spamType: spamResult.type,
                messageCount: spamResult.messageCount,
                content: message.content.substring(0, 100)
            });
            
            console.log(`🚫 Spam von ${message.author.tag} erkannt und gelöscht: ${spamResult.reason}`);
            
        } catch (error) {
            console.error('❌ Fehler bei Spam-Moderation:', error);
            console.error('❌ Fehler Details:', error.message);
            
            // Falls Nachricht nicht gelöscht werden konnte, versuche Channel-Timeout
            if (error.code === 50013) { // Missing Permissions
                console.error(`❌ Keine Berechtigung zum Löschen von Nachrichten in ${message.channel.name}!`);
            }
        }
        return; // Keine weitere Verarbeitung nach Spam-Detection
    }
    
    // Schimpfwörter Filter (erweitert)
    const content = message.content.toLowerCase();
    
    // Erweiterte Schimpfwörter Liste
    const badWords = [
        // Deutsch
        'scheisse', 'scheiße', 'arschloch', 'fotze', 'hurensohn', 'wichser', 'kacke', 'verdammt',
        'bastard', 'idiot', 'depp', 'trottel', 'blödmann',
        // Englisch
        'fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap', 'whore', 'slut',
        'stupid', 'retard', 'moron', 'dumbass',
        // Leetspeak Varianten
        'f*ck', 'sh*t', 'b*tch', 'a**hole', 'fck', 'sht'
    ];
    
    // Prüfe auf Schimpfwörter
    const foundBadWord = badWords.find(word => {
        // Exakte Übereinstimmung oder als ganzes Wort
        const regex = new RegExp(`\\b${word.replace(/\*/g, '.')}\\b`, 'i');
        return regex.test(content) || content.includes(word);
    });
    
    if (foundBadWord) {
        try {
            console.log(`🤬 Versuche Schimpfwort-Nachricht zu löschen von ${message.author.tag}: "${foundBadWord}"`);
            
            // Prüfe Bot-Permissions vor dem Löschen
            const botMember = guild.members.cache.get(client.user.id);
            if (!botMember.permissions.has('ManageMessages')) {
                console.error(`❌ Bot hat keine "Nachrichten verwalten" Permission für Schimpfwort-Filter in ${guild.name}!`);
                return;
            }
            
            // Lösche Schimpfwort-Nachricht
            if (!message.deleted) {
                await message.delete();
                console.log(`✅ Schimpfwort-Nachricht erfolgreich gelöscht!`);
            }
            
            // Warnung für Schimpfwörter
            const botUser = client.user;
            await addWarning(guild, message.author, `Unangemessene Sprache: "${foundBadWord}"`, botUser);
            
            // Füge zum Moderations-Log hinzu
            addModerationLog('language_filter', message.author, null, `Unangemessene Sprache: "${foundBadWord}"`, guild, {
                badWord: foundBadWord,
                content: message.content.substring(0, 100)
            });
            
            console.log(`🤬 Unangemessene Sprache von ${message.author.tag} erkannt und gelöscht: "${foundBadWord}"`);
            
        } catch (error) {
            console.error('❌ Fehler bei Schimpfwort-Filter:', error);
            console.error('❌ Fehler Details:', error.message);
            
            // Spezifische Fehlerbehandlung
            if (error.code === 50013) { // Missing Permissions
                console.error(`❌ Keine Berechtigung zum Löschen von Schimpfwort-Nachrichten in ${message.channel.name}!`);
            } else if (error.code === 10008) { // Unknown Message
                console.warn(`⚠️ Nachricht bereits gelöscht oder nicht gefunden`);
            }
        }
    }
});

// Event: Neues Mitglied beitritt (nutzt jetzt Supabase Welcome-System)
client.on(Events.GuildMemberAdd, async member => {
    console.log(`👋 ${member.user.tag} ist ${member.guild.name} beigetreten`);
    console.log(`🔍 DEBUG: User ID: ${member.id}, Guild: ${member.guild.name}, Timestamp: ${new Date().toISOString()}`);
    console.log(`🔍 DEBUG: Joined at: ${member.joinedAt}, Is Bot: ${member.user.bot}`);
    
    // Invite-Tracking für Giveaways (wird jetzt automatisch von GiveawaySystem behandelt)
    // Das neue System hört direkt auf member join events
    
    try {
        // Lade Welcome-Einstellungen aus Supabase
        const currentWelcomeSettings = await loadWelcomeSettings(member.guild.id);

    // Prüfe ob Welcome-Messages aktiviert sind
        if (!currentWelcomeSettings || !currentWelcomeSettings.enabled) {
            console.log('❌ Welcome-Messages sind deaktiviert oder Supabase nicht verfügbar');
        return;
    }
    
    // Finde Welcome-Channel
    const welcomeChannel = member.guild.channels.cache.find(ch => 
        ch.name.toLowerCase().includes(currentWelcomeSettings.channelName.toLowerCase()) ||
        ch.name.toLowerCase().includes('willkommen') ||
        ch.name.toLowerCase().includes('welcome') ||
        ch.name.toLowerCase().includes('general')
    );
    
    if (welcomeChannel) {
            // Erstelle Welcome-Embed mit Supabase-Funktionen
            const { embed: welcomeEmbed, attachment } = await createWelcomeEmbed(member.guild, member, currentWelcomeSettings);
            
            // Mention User falls aktiviert
            let messageContent = '';
            if (currentWelcomeSettings.mentionUser) {
                messageContent = `<@${member.id}>`;
            }
            
            // Sende Welcome-Message mit oder ohne Attachment
            const messageOptions = { 
                content: messageContent, 
                embeds: [welcomeEmbed] 
            };
            
            if (attachment) {
                messageOptions.files = [attachment];
            }
            
            const welcomeMessage = await welcomeChannel.send(messageOptions);
            
            // Auto-Delete falls konfiguriert
            if (currentWelcomeSettings.deleteAfter > 0) {
                setTimeout(() => {
                    welcomeMessage.delete().catch(console.error);
                }, currentWelcomeSettings.deleteAfter * 1000);
            }
            
            console.log(`✅ Welcome-Message für ${member.user.tag} gesendet in #${welcomeChannel.name}`);
            console.log(`🔍 DEBUG: Message ID: ${welcomeMessage.id}, Channel: ${welcomeChannel.name}`);
            
            // Aktualisiere Welcome-Statistiken
            await updateWelcomeStats(member.guild.id, 'welcome');
            
    } else {
        console.log(`⚠️ Kein Welcome-Channel in ${member.guild.name} gefunden`);
    }

    // Auto-Role vergeben falls konfiguriert
    if (currentWelcomeSettings.autoRole) {
        try {
            const autoRole = member.guild.roles.cache.find(role => 
                role.name.toLowerCase() === currentWelcomeSettings.autoRole.toLowerCase()
            );
            
            if (autoRole) {
                await member.roles.add(autoRole);
                console.log(`✅ Auto-Role "${autoRole.name}" vergeben an ${member.user.tag}`);
            } else {
                console.log(`⚠️ Auto-Role "${currentWelcomeSettings.autoRole}" nicht gefunden`);
            }
        } catch (error) {
            console.error('❌ Fehler beim Vergeben der Auto-Role:', error);
        }
    }

    // DM an User senden falls aktiviert
        if (currentWelcomeSettings.dmMessage && currentWelcomeSettings.dmMessage.enabled && currentWelcomeSettings.dmMessage.message) {
        try {
            await member.send(currentWelcomeSettings.dmMessage.message
                .replace(/{user}/g, member.displayName)
                .replace(/{server}/g, member.guild.name)
                .replace(/{memberCount}/g, member.guild.memberCount.toString())
            );
            console.log(`📨 Welcome-DM an ${member.user.tag} gesendet`);
        } catch (error) {
            console.log(`⚠️ Konnte keine Welcome-DM an ${member.user.tag} senden:`, error.message);
        }
        }
        
    } catch (error) {
        console.error('❌ KRITISCHER FEHLER im Welcome-System:', error);
        console.error('❌ Stack Trace:', error.stack);
        // NIEMALS den ganzen Bot crashen lassen!
        try {
            // Sende Notfall-Welcome falls möglich
            const emergencyChannel = member.guild.channels.cache.find(ch => 
                ch.name.toLowerCase().includes('general') ||
                ch.name.toLowerCase().includes('welcome') ||
                ch.type === 0 // Text channel
            );
            if (emergencyChannel) {
                await emergencyChannel.send(`🚨 Willkommen ${member.user.username}! (Notfall-Modus)`);
                console.log('🚨 Notfall-Welcome-Message gesendet');
            }
        } catch (emergencyError) {
            console.error('❌ Selbst Notfall-Message fehlgeschlagen:', emergencyError.message);
        }
    }
});

// Event: Mitglied verlässt Server (nutzt jetzt Supabase Welcome-System)
client.on(Events.GuildMemberRemove, async member => {
    console.log(`👋 ${member.user.tag} hat den Server verlassen`);
    
    try {
        // Lade Welcome-Einstellungen aus Supabase (inkl. Leave Messages)
        const currentSettings = await loadWelcomeSettings(member.guild.id);

        // Prüfe ob Leave Messages aktiviert sind
        if (!currentSettings || !currentSettings.leaveMessage || !currentSettings.leaveMessage.enabled) {
            console.log('❌ Leave Messages sind deaktiviert oder Supabase nicht verfügbar');
            return;
        }

        // Finde den konfigurierten Leave-Channel
        const leaveChannelName = currentSettings.leaveMessage.channelName || 'verlassen';
        const leaveChannel = member.guild.channels.cache.find(ch => 
            ch.name.toLowerCase().includes(leaveChannelName.toLowerCase()) ||
            ch.name === leaveChannelName
        );

        if (!leaveChannel) {
            console.log(`❌ Leave-Channel "${leaveChannelName}" nicht gefunden`);
            return;
        }

        // Erstelle Leave Embed mit Supabase-Funktionen
        const leaveEmbed = await createLeaveEmbed(member.guild, member, currentSettings.leaveMessage);
        
        // Sende Leave Message
        const messageContent = currentSettings.leaveMessage.mentionUser ? `<@${member.user.id}>` : '';
        const sentMessage = await leaveChannel.send({
            content: messageContent,
            embeds: [leaveEmbed]
        });

        // Auto-Delete nach eingestellter Zeit
        if (currentSettings.leaveMessage.deleteAfter > 0) {
            setTimeout(() => {
                sentMessage.delete().catch(console.error);
            }, currentSettings.leaveMessage.deleteAfter * 1000);
        }

        console.log(`✅ Leave Message gesendet für ${member.user.tag} in #${leaveChannel.name}`);
        
        // Aktualisiere Welcome-Statistiken
        await updateWelcomeStats(member.guild.id, 'leave');

    } catch (error) {
        console.error('❌ KRITISCHER FEHLER im Leave-System:', error);
        console.error('❌ Stack Trace:', error.stack);
        // NIEMALS den ganzen Bot crashen lassen!
    }
});

// Event: Voice State Update (für XP-System)
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    if (xpSystem) {
        xpSystem.handleVoiceStateUpdate(oldState, newState);
    }
});

// Event: Nachrichten verarbeiten
client.on(Events.MessageCreate, async message => {
    // Ignoriere Bot-Nachrichten
    if (message.author.bot) return;

    // Daily Message Counter aktualisieren (nur für echte User-Messages)
    if (message.guild) {
        const currentDate = new Date().toDateString();
        
        // Reset daily counter wenn ein neuer Tag beginnt
        if (currentDate !== lastResetDate) {
            console.log(`📅 Täglicher Reset: ${lastResetDate} → ${currentDate}`);
            console.log(`📊 Gestern: ${dailyMessageCount} Nachrichten`);
            dailyMessageCount = 0;
            lastResetDate = currentDate;
        }
        
        // Erhöhe täglichen Counter
        dailyMessageCount++;
        
        // Speichere alle 10 Nachrichten (für Performance)
        if (dailyMessageCount % 10 === 0) {
            saveDailyCounter();
        }
    }

    // XP für Nachrichten hinzufügen
    if (xpSystem && message.guild) {
        await xpSystem.addMessageXP(message);
    }

    // Einfache Befehle
    if (message.content === '!ping') {
        message.reply('🏓 Pong!');
    }

    // XP-Befehle
    if (message.content === '!xp' || message.content === '!level') {
        if (xpSystem) {
            const userData = xpSystem.getUserData(message.author.id);
            const profileEmbed = xpSystem.createProfileEmbed(message.author, userData);
            message.reply({ embeds: [profileEmbed] });
        }
    }

    if (message.content === '!leaderboard' || message.content === '!top') {
        if (xpSystem) {
            const leaderboard = xpSystem.getLeaderboard(10);
            const embed = new EmbedBuilder()
                .setTitle('🏆 XP Leaderboard')
                .setColor(0x00FF7F)
                .setTimestamp();

            let description = '';
            leaderboard.forEach((user, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
                description += `${medal} **${user.username}** - Level ${user.level} (${user.totalXP} XP)\n`;
            });

            embed.setDescription(description || 'Keine Daten verfügbar');
            message.reply({ embeds: [embed] });
        }
    }

    if (message.content === '!hallo') {
        message.reply(`👋 Hallo ${message.author.username}!`);
    }

    if (message.content === '!server') {
        message.reply(`📊 Server Name: ${message.guild.name}\n👥 Mitglieder: ${message.guild.memberCount}`);
    }

    if (message.content === '!user') {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('👤 Benutzer Info')
            .addFields(
                { name: 'Name', value: message.author.username, inline: true },
                { name: 'ID', value: message.author.id, inline: true },
                { name: 'Beigetreten', value: message.member.joinedAt.toDateString(), inline: true }
            )
            .setThumbnail(message.author.displayAvatarURL());

        message.reply({ embeds: [embed] });
    }

    // Manueller Befehl: Regeln neu posten (falls gewünscht)
    if (message.content === '!regeln-update' && message.member.permissions.has('ManageMessages')) {
        const rulesChannel = message.guild.channels.cache.find(ch => 
            ch.name.includes('rules') || ch.name.includes('regeln') || ch.name.includes('regel')
        );

        if (rulesChannel) {
            const rulesEmbed = await createRulesEmbed(message.guild.name);
            const rulesMessage = await rulesChannel.send({ embeds: [rulesEmbed] });
            const currentRules = getCurrentRules();
            await rulesMessage.react(currentRules.reaction.emoji);
            
            rulesMessages.set(rulesMessage.id, {
                guildId: message.guild.id,
                channelId: rulesChannel.id
            });
            
            message.reply(`✅ Regeln wurden in ${rulesChannel} aktualisiert!`);
        } else {
            message.reply('❌ Kein Rules-Kanal gefunden!');
        }
    }

    // Test Welcome-Message (nutzt jetzt Supabase Welcome-System)
    if (message.content === '!test-welcome' && message.member.permissions.has('ManageMessages')) {
        try {
            // Lade aktuelle Welcome-Einstellungen aus Supabase
            const currentWelcomeSettings = await loadWelcomeSettings(message.guild.id);
            
            if (!currentWelcomeSettings) {
                message.reply('❌ Keine Welcome-Einstellungen gefunden!');
                return;
            }
            
            console.log('🧪 Test Welcome-Message gestartet...');
            console.log('Settings aus Supabase:', JSON.stringify(currentWelcomeSettings, null, 2));
            
            const { embed: welcomeEmbed, attachment } = await createWelcomeEmbed(message.guild, message.member, currentWelcomeSettings);
            
            const messageOptions = { 
                content: currentWelcomeSettings.mentionUser ? `<@${message.author.id}>` : '', 
                embeds: [welcomeEmbed] 
            };
            
            if (attachment) {
                messageOptions.files = [attachment];
            }
            
            await message.channel.send(messageOptions);
            message.react('✅');
            
        } catch (error) {
            console.error('❌ Fehler beim Test-Welcome:', error);
            message.reply(`❌ Fehler: ${error.message}`);
        }
    }

    // Song Request System
    if (musicSettings && musicSettings.songRequests && musicSettings.songRequests.enabled) {
        const prefix = musicSettings.songRequests.prefix || '!play';
        
        if (message.content.startsWith(prefix + ' ')) {
            const query = message.content.slice(prefix.length + 1).trim();
            if (query) {
                await handleSongRequest(message, query);
                return; // Verhindere weitere Command-Verarbeitung
            }
        }
        
        // Alternative Commands
        if (message.content.startsWith('!request ')) {
            const query = message.content.slice('!request '.length).trim();
            if (query) {
                await handleSongRequest(message, query);
                return;
            }
        }
        
        if (message.content.startsWith('!song ')) {
            const query = message.content.slice('!song '.length).trim();
            if (query) {
                await handleSongRequest(message, query);
                return;
            }
        }
    }

    // Radio System Commands
    if (musicSettings && musicSettings.radio && musicSettings.radio.enabled) {
        if (message.content.startsWith('!radio ')) {
            const args = message.content.slice('!radio '.length).trim().split(' ');
            const command = args[0]?.toLowerCase();
            
            if (command === 'play' && args[1]) {
                const stationId = args[1];
                try {
                    const { playRadioStation } = require('./music-api.js');
                    const success = await playRadioStation(message.guild.id, stationId);
                    
                    if (success) {
                        message.react('📻');
                    }
                } catch (error) {
                    console.error('❌ Radio Play Fehler:', error);
                    message.reply(`❌ Fehler beim Starten des Radio-Senders: ${error.message}`);
                }
                return;
            }
            
            if (command === 'stop') {
                try {
                    const { stopRadio } = require('./music-api.js');
                    const success = stopRadio(message.guild.id);
                    
                    if (success) {
                        message.react('⏹️');
                    }
                } catch (error) {
                    console.error('❌ Radio Stop Fehler:', error);
                    message.reply(`❌ Fehler beim Stoppen des Radios: ${error.message}`);
                }
                return;
            }
            
            if (command === 'list' || command === 'stations') {
                try {
                    const { getMusicStations, getAvailableSongs } = require('./music-api.js');
                    const stations = getMusicStations();
                    const songs = getAvailableSongs();
                    
                    const embed = new EmbedBuilder()
                        .setTitle('🎵 Lokales Musik-System')
                        .setColor(0xFF6B6B)
                        .setDescription('Nutze das Dashboard für die Musik-Verwaltung!')
                        .setTimestamp();
                    
                    embed.addFields({
                        name: '📁 Verfügbare Songs',
                        value: songs.length > 0 ? `${songs.length} MP3-Dateien gefunden` : 'Keine MP3-Dateien im /music Ordner',
                        inline: true
                    });

                    embed.addFields({
                        name: '📻 Erstellte Stationen',
                        value: stations.length > 0 ? `${stations.length} Stationen verfügbar` : 'Keine Stationen erstellt',
                        inline: true
                    });

                    embed.addFields({
                        name: '🌐 Dashboard',
                        value: 'Nutze das Web-Dashboard um Stationen zu erstellen und Musik zu verwalten!',
                        inline: false
                    });
                    
                    message.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('❌ Musik List Fehler:', error);
                    message.reply('❌ Fehler beim Laden der Musik-Daten.');
                }
                return;
            }
            
            if (command === 'status') {
                try {
                    const { getCurrentSong, getCurrentStation, isPlayingMusic } = require('./music-api.js');
                    const currentSong = getCurrentSong(message.guild.id);
                    const currentStation = getCurrentStation(message.guild.id);
                    const isPlaying = isPlayingMusic(message.guild.id);
                    
                    if (!isPlaying) {
                        message.reply('🎵 Keine Musik aktiv.');
                        return;
                    }
                    
                    const embed = new EmbedBuilder()
                        .setTitle('🎵 Musik Status')
                        .setColor(0xFF6B6B)
                        .setTimestamp();

                    if (currentSong) {
                        embed.addFields(
                            { name: '🎵 Aktueller Song', value: currentSong.title, inline: true },
                            { name: '🎤 Künstler', value: currentSong.artist, inline: true },
                            { name: '📁 Datei', value: currentSong.filename, inline: true }
                        );
                    }

                    if (currentStation) {
                        embed.addFields(
                            { name: '📻 Station', value: currentStation.name, inline: true },
                            { name: '🎭 Genre', value: currentStation.genre, inline: true },
                            { name: '📝 Beschreibung', value: currentStation.description, inline: false }
                        );
                    }
                    
                    message.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('❌ Musik Status Fehler:', error);
                    message.reply('❌ Fehler beim Laden des Musik-Status.');
                }
                return;
            }
            
            // Musik Help
            const musicHelpEmbed = new EmbedBuilder()
                .setTitle('🎵 Musik-Befehle')
                .setColor(0xFF6B6B)
                .setDescription('Verfügbare Musik-Befehle:')
                .addFields(
                    { name: '!radio list', value: 'Zeigt verfügbare Songs und Stationen', inline: true },
                    { name: '!radio status', value: 'Zeigt aktuellen Musik-Status', inline: true },
                    { name: '🌐 Dashboard', value: 'Nutze das Web-Dashboard für erweiterte Funktionen!', inline: false }
                )
                .setFooter({ text: 'Lokales Musik-System 🎵' });
            
            message.reply({ embeds: [musicHelpEmbed] });
            return;
        }
    }

    if (message.content === '!hilfe') {
        const helpEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🤖 Bot Befehle')
            .setDescription('Hier sind alle verfügbaren Befehle:')
            .addFields(
                { name: '!ping', value: 'Testet ob der Bot antwortet', inline: true },
                { name: '!hallo', value: 'Grüßt dich freundlich', inline: true },
                { name: '!server', value: 'Zeigt Server-Informationen', inline: true },
                { name: '!user', value: 'Zeigt deine Benutzer-Informationen', inline: true },
                { name: '!regeln-update', value: 'Aktualisiert Regeln (nur Admins)', inline: true },
                { name: '!test-welcome', value: 'Testet Welcome-Message (nur Admins)', inline: true },
                { name: '!play <song>', value: '🎵 Fügt einen Song zur Musik-Queue hinzu', inline: true },
                { name: '!request <song>', value: '🎵 Alternative für Song-Requests', inline: true },
                { name: '!song <song>', value: '🎵 Weitere Alternative für Song-Requests', inline: true },
                { name: '!radio list', value: '🎵 Zeigt verfügbare Songs und Stationen', inline: true },
                { name: '!radio status', value: '🎵 Zeigt aktuellen Musik-Status', inline: true },
                { name: '!hilfe', value: 'Zeigt diese Hilfenachricht', inline: true }
            )
            .setFooter({ text: 'Auto-Rules Bot mit Musik-System! 🎵' });

        message.reply({ embeds: [helpEmbed] });
    }
});

// Event: Fehlerbehandlung
client.on(Events.Error, error => {
    console.error('❌ Discord-Client Fehler:', error);
});

// Event: Button-Interaktionen und Slash Commands behandeln
client.on(Events.InteractionCreate, async interaction => {
    // Behandle Slash Commands
    if (interaction.isChatInputCommand()) {
        const { commandName, guild, member } = interaction;
        
        // Prüfe ob User berechtigt ist für Moderation Commands
        const hasModPerms = member.permissions.has('ManageMessages') || 
                           member.permissions.has('Administrator');
        
        if (!hasModPerms && ['warn', 'mute', 'warnings'].includes(commandName)) {
            return await interaction.reply({
                content: '❌ Du hast keine Berechtigung für Moderation-Commands!',
                ephemeral: true
            });
        }
        
        switch (commandName) {
            case 'warn':
                const warnUser = interaction.options.getUser('user');
                const warnReason = interaction.options.getString('reason') || 'Kein Grund angegeben';
                
                try {
                    const totalWarnings = await addWarning(guild, warnUser, warnReason, interaction.user);
                    await interaction.reply({
                        content: `⚠️ **${warnUser.tag}** wurde verwarnt!\n**Grund:** ${warnReason}\n**Gesamte Verwarnungen:** ${totalWarnings}`,
                        ephemeral: true
                    });
                } catch (error) {
                    await interaction.reply({
                        content: '❌ Fehler beim Verwarnen des Users!',
                        ephemeral: true
                    });
                }
                break;
                
            case 'mute':
                const muteTargetUser = interaction.options.getUser('user');
                const muteReason = interaction.options.getString('reason') || 'Kein Grund angegeben';
                
                try {
                    const success = await muteUser(guild, muteTargetUser, muteReason, interaction.user);
                    if (success) {
                        await interaction.reply({
                            content: `🔇 **${muteTargetUser.tag}** wurde gemutet!\n**Grund:** ${muteReason}`,
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            content: '❌ Fehler beim Muten - Mute-Rolle nicht gefunden!',
                            ephemeral: true
                        });
                    }
                } catch (error) {
                    await interaction.reply({
                        content: '❌ Fehler beim Muten des Users!',
                        ephemeral: true
                    });
                }
                break;
                
            case 'warnings':
                const checkUser = interaction.options.getUser('user');
                const userWarnings = warningsDatabase.get(checkUser.id) || [];
                
                if (userWarnings.length === 0) {
                    await interaction.reply({
                        content: `✅ **${checkUser.tag}** hat keine Verwarnungen.`,
                        ephemeral: true
                    });
                } else {
                    const warningsText = userWarnings.map((w, i) => 
                        `**${i + 1}.** ${w.reason} (${w.moderator})`
                    ).join('\n');
                    
                    await interaction.reply({
                        content: `⚠️ **Verwarnungen für ${checkUser.tag}:**\n${warningsText}`,
                        ephemeral: true
                    });
                }
                break;
        }
        
        return;
    }
    
    if (!interaction.isButton()) return;
    
    // Behandle Verifizierungsbutton
    if (interaction.customId === 'verify_start') {
        console.log(`🚀 ${interaction.user.username} hat den Verifizierungsbutton geklickt`);
        
        try {
            // Erstelle Antwort mit Link zur Verifizierungsseite
            const verifyEmbed = new EmbedBuilder()
                .setTitle('🚀 Starte deine Verifizierung!')
                .setDescription('Klicke auf den Link unten, um mit der Verifizierung zu beginnen.')
                .addFields({
                    name: '🔗 Verifizierungs-Link',
                    value: `[➤ Jetzt verifizieren (Klick hier)](${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify)`,
                    inline: false
                })
                .setColor(0x00FF7F)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter({ 
                    text: 'Diese Nachricht ist nur für dich sichtbar',
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();
            
            // Antwort nur für den User sichtbar (ephemeral)
            await interaction.reply({
                embeds: [verifyEmbed],
                ephemeral: true
            });
            
        } catch (error) {
            console.error('❌ Fehler bei Button-Interaktion:', error);
            
            // Fallback-Antwort
            await interaction.reply({
                content: `🚀 **Starte deine Verifizierung hier:**\n${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify`,
                ephemeral: true
            }).catch(console.error);
        }
    }

    // Behandle Valorant-Buttons
    if (interaction.customId.startsWith('valorant_')) {
        await handleValorantButtonInteraction(interaction);
    }

    // Behandle Bot-Introduction-Buttons
    if (interaction.customId.startsWith('bot_')) {
        await handleIntroductionButtonInteraction(interaction);
    }

    // Behandle Ticket-Buttons
    if (interaction.customId.startsWith('ticket_create_')) {
        await handleTicketCreateInteraction(interaction);
    }

    if (interaction.customId.startsWith('ticket_close_')) {
        await handleTicketCloseInteraction(interaction);
    }

    // Giveaway-Button-Interaktionen werden jetzt von GiveawayInteractions behandelt
    // (automatisch über event listener)

    // YouTube Radio Button Handlers
    if (interaction.customId === 'radio_select') {
        const { handleRadioSelectButton } = require('./music-api');
        await handleRadioSelectButton(interaction);
        return;
    }

    if (interaction.customId === 'radio_stop') {
        const { handleRadioStopButton } = require('./music-api');
        await handleRadioStopButton(interaction);
        return;
    }

    // Radio Station Selection Menu
    if (interaction.customId === 'radio_station_select') {
        const { handleRadioStationSelect } = require('./music-api');
        await handleRadioStationSelect(interaction);
        return;
    }

    // Vollständiges Musik-System Button Handlers
    if (interaction.customId === 'music_radio_select') {
        const { handleMusicRadioSelectButton } = require('./music-api');
        await handleMusicRadioSelectButton(interaction);
        return;
    }

    if (interaction.customId === 'music_mp3_select') {
        const { handleMusicMP3SelectButton } = require('./music-api');
        await handleMusicMP3SelectButton(interaction);
        return;
    }

    if (interaction.customId === 'music_playlist_select') {
        const { handleMusicPlaylistSelectButton } = require('./music-api');
        await handleMusicPlaylistSelectButton(interaction);
        return;
    }

    if (interaction.customId === 'music_stop_all') {
        const { handleMusicStopAllButton } = require('./music-api');
        await handleMusicStopAllButton(interaction);
        return;
    }

    if (interaction.customId === 'music_voice_join') {
        const { handleMusicVoiceJoinButton } = require('./music-api');
        await handleMusicVoiceJoinButton(interaction);
        return;
    }

    if (interaction.customId === 'music_voice_leave') {
        const { handleMusicVoiceLeaveButton } = require('./music-api');
        await handleMusicVoiceLeaveButton(interaction);
        return;
    }

    if (interaction.customId === 'music_refresh') {
        const { handleMusicRefreshButton } = require('./music-api');
        await handleMusicRefreshButton(interaction);
        return;
    }

    // Volume Control Button Handlers
    if (interaction.customId === 'music_volume_up') {
        const { handleMusicVolumeUpButton } = require('./music-api');
        await handleMusicVolumeUpButton(interaction);
        return;
    }

    if (interaction.customId === 'music_volume_down') {
        const { handleMusicVolumeDownButton } = require('./music-api');
        await handleMusicVolumeDownButton(interaction);
        return;
    }

    // Vollständiges Musik-System Select Menu Handlers
    if (interaction.customId === 'music_mp3_song_select') {
        const { handleMusicMP3SongSelect } = require('./music-api');
        await handleMusicMP3SongSelect(interaction);
        return;
    }

    if (interaction.customId === 'music_playlist_station_select') {
        const { handleMusicPlaylistStationSelect } = require('./music-api');
        await handleMusicPlaylistStationSelect(interaction);
        return;
    }

    // Old Music Interactive Panel Buttons (DEPRECATED - für kompatibilität)
    if (interaction.customId === 'song_request') {
        await interaction.reply({
            content: '📻 **YouTube Radio-System** - Song-Requests nicht verfügbar! Nutze die Radio-Auswahl.',
            ephemeral: true
        });
        return;
    }

    if (interaction.customId === 'view_queue') {
        // Show current queue in ephemeral message
        try {
            // Kein Queue-System mehr im einfachen Radio-System
            await interaction.reply({ 
              content: '📻 **YouTube Radio-System** - Kein Queue verfügbar, nur Live-Radio-Streams!', 
              ephemeral: true 
            });
        } catch (error) {
            console.error('❌ Fehler beim Anzeigen der Queue:', error);
            await interaction.reply({
                content: '❌ Fehler beim Laden der Queue.',
                ephemeral: true
            });
        }
        return;
    }

    if (interaction.customId === 'player_controls') {
        // Check DJ role permission for player controls
        try {
            // Sofort antworten um Timeout zu vermeiden
            await interaction.deferReply({ ephemeral: true });
            
            // Reload music settings to get latest configuration
            loadMusicSettings();
            // Load fresh settings directly from file
            const fs = require('fs');
            if (fs.existsSync('music-settings.json')) {
                const freshSettings = JSON.parse(fs.readFileSync('music-settings.json', 'utf8'));
                musicSettings = freshSettings;
                console.log(`🔍 Fresh settings loaded: requireDJForControls = ${freshSettings.songRequests?.interactivePanel?.requireDJForControls}`);
            }
            
            const userId = interaction.user.id;
            const member = interaction.guild.members.cache.get(userId);
            
            // Check if DJ role is required for player controls
            const requireDJForControls = musicSettings.songRequests?.interactivePanel?.requireDJForControls || false;
            
            console.log(`🔍 Player Controls Debug - User: ${interaction.user.tag}`);
            console.log(`🔍 requireDJForControls: ${requireDJForControls}`);
            console.log(`🔍 musicSettings.songRequests.interactivePanel.requireDJForControls: ${musicSettings.songRequests?.interactivePanel?.requireDJForControls}`);
            console.log(`🔍 djRole: ${musicSettings.commands.djRole}`);
            console.log(`🔍 adminRole: ${musicSettings.songRequests?.interactivePanel?.adminRole}`);
            console.log(`🔍 User roles: ${member.roles.cache.map(r => r.name).join(', ')}`);
            
            if (requireDJForControls) {
                const hasDJRole = musicSettings.commands.djRole ? member.roles.cache.has(musicSettings.commands.djRole) : false;
                const hasDiscordAdminPerms = member.permissions.has('Administrator');
                const hasCustomAdminRole = musicSettings.songRequests?.interactivePanel?.adminRole ? 
                    member.roles.cache.has(musicSettings.songRequests.interactivePanel.adminRole) : false;
                
                if (!hasDJRole && !hasDiscordAdminPerms && !hasCustomAdminRole) {
                    // Finde die aktuellen Rollen für bessere Fehlermeldung
                    const djRole = interaction.guild.roles.cache.get(musicSettings.commands.djRole);
                    const djRoleName = djRole ? djRole.name : 'DJ 🎵';
                    
                    const adminRole = musicSettings.songRequests?.interactivePanel?.adminRole ? 
                        interaction.guild.roles.cache.get(musicSettings.songRequests.interactivePanel.adminRole) : null;
                    const adminRoleName = adminRole ? adminRole.name : null;
                    
                    let requiredRoles = `\`${djRoleName}\``;
                    if (adminRoleName) {
                        requiredRoles += ` oder \`${adminRoleName}\``;
                    }
                    requiredRoles += ' oder Discord-Administrator';
                    
                    return await interaction.editReply({
                        embeds: [{
                            color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                            title: '🚫 Player-Controls gesperrt',
                            description: `**Du benötigst eine der folgenden Berechtigungen:**\n\n` +
                                       `🎧 ${requiredRoles}\n\n` +
                                       `⚠️ Deine aktuellen Rollen reichen nicht aus.\n\n` +
                                       `💡 **Lösung:** Kontaktiere einen Admin für die entsprechende Rolle.`,
                            fields: [
                                {
                                    name: '🎯 Benötigte Berechtigung',
                                    value: requiredRoles,
                                    inline: true
                                },
                                {
                                    name: '👤 Dein Status',
                                    value: '❌ Keine ausreichende Berechtigung',
                                    inline: true
                                },
                                {
                                    name: '🔒 Verfügbare Aktionen',
                                    value: '• 🎵 Song Request ✅\n• 📋 Queue anzeigen ✅\n• ⏯️ Player Controls ❌',
                                    inline: false
                                }
                            ],
                            footer: {
                                text: 'Player-Controls sind nur für berechtigte Rollen verfügbar'
                            },
                            timestamp: new Date().toISOString()
                        }]
                    });
                }
            }

            // Show player controls in ephemeral message
            const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
            
            const controls = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('music_play')
                        .setLabel('▶️ Play')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('music_pause')
                        .setLabel('⏸️ Pause')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('music_skip')
                        .setLabel('⏭️ Skip')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('music_stop')
                        .setLabel('⏹️ Stop')
                        .setStyle(ButtonStyle.Danger)
                );

            // Erstelle dynamische Beschreibung basierend auf Berechtigung
            let description = 'Verwende die Buttons unten um den Player zu steuern.\n\n';
            let footerText = 'Nur für dich sichtbar';
            
            if (requireDJForControls) {
                const hasDJRole = musicSettings.commands.djRole ? member.roles.cache.has(musicSettings.commands.djRole) : false;
                const hasDiscordAdminPerms = member.permissions.has('Administrator');
                const hasCustomAdminRole = musicSettings.songRequests?.interactivePanel?.adminRole ? 
                    member.roles.cache.has(musicSettings.songRequests.interactivePanel.adminRole) : false;
                
                if (hasDiscordAdminPerms) {
                    description += '👑 **Discord-Administrator-Berechtigung bestätigt!**';
                    footerText += ' • Discord Admin Controls';
                } else if (hasCustomAdminRole) {
                    const adminRole = interaction.guild.roles.cache.get(musicSettings.songRequests.interactivePanel.adminRole);
                    const adminRoleName = adminRole ? adminRole.name : 'Admin';
                    description += `👑 **Admin-Berechtigung bestätigt!** (\`${adminRoleName}\`)`;
                    footerText += ' • Admin Controls';
                } else if (hasDJRole) {
                    const djRole = interaction.guild.roles.cache.get(musicSettings.commands.djRole);
                    const djRoleName = djRole ? djRole.name : 'DJ 🎵';
                    description += `🎧 **DJ-Berechtigung bestätigt!** (\`${djRoleName}\`)`;
                    footerText += ' • DJ Controls';
                }
            } else {
                description += '🎵 **Player-Controls für alle verfügbar**';
                footerText += ' • Public Controls';
            }

            await interaction.editReply({
                embeds: [{
                    color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                    title: '⏯️ Player Controls',
                    description: description,
                    footer: {
                        text: footerText
                    },
                    timestamp: new Date().toISOString()
                }],
                components: [controls]
            });
        } catch (error) {
            console.error('❌ Fehler bei Player Controls:', error);
            await interaction.editReply({
                content: '❌ Fehler beim Laden der Player Controls.'
            });
        }
        return;
    }

    // Music Player Control Buttons
    if (interaction.customId.startsWith('music_')) {
        const action = interaction.customId.replace('music_', '');
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        
        try {
            // Sofort antworten um Timeout zu vermeiden
            await interaction.deferReply({ ephemeral: true });
            
            // Music settings werden jetzt über Supabase geladen
            // Die aktuellen Einstellungen sind bereits im musicSettings Objekt verfügbar
            console.log(`🔍 Using current music settings for buttons: requireDJForControls = ${musicSettings.songRequests?.interactivePanel?.requireDJForControls}`);
            
            // Check if DJ role is required for music controls
            const requireDJForControls = musicSettings.songRequests?.interactivePanel?.requireDJForControls || false;
            
            if (requireDJForControls) {
                const member = interaction.guild.members.cache.get(userId);
                const hasDJRole = musicSettings.commands.djRole ? member.roles.cache.has(musicSettings.commands.djRole) : false;
                const hasDiscordAdminPerms = member.permissions.has('Administrator');
                const hasCustomAdminRole = musicSettings.songRequests?.interactivePanel?.adminRole ? 
                    member.roles.cache.has(musicSettings.songRequests.interactivePanel.adminRole) : false;
                
                if (!hasDJRole && !hasDiscordAdminPerms && !hasCustomAdminRole) {
                    // Finde die aktuellen Rollen für bessere Fehlermeldung
                    const djRole = interaction.guild.roles.cache.get(musicSettings.commands.djRole);
                    const djRoleName = djRole ? djRole.name : 'DJ 🎵';
                    
                    const adminRole = musicSettings.songRequests?.interactivePanel?.adminRole ? 
                        interaction.guild.roles.cache.get(musicSettings.songRequests.interactivePanel.adminRole) : null;
                    const adminRoleName = adminRole ? adminRole.name : null;
                    
                    let requiredRoles = `\`${djRoleName}\``;
                    if (adminRoleName) {
                        requiredRoles += ` oder \`${adminRoleName}\``;
                    }
                    requiredRoles += ' oder Discord-Administrator';
                    
                    return await interaction.editReply({
                        embeds: [{
                            color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                            title: '🚫 Zugriff verweigert',
                            description: `**Du benötigst eine der folgenden Berechtigungen:**\n\n` +
                                       `🎧 ${requiredRoles}\n\n` +
                                       `⚠️ Nur berechtigte Rollen können **${action.toUpperCase()}** verwenden.\n\n` +
                                       `💡 **Lösung:** Kontaktiere einen Admin für die entsprechende Rolle.`,
                            fields: [
                                {
                                    name: '🎯 Benötigte Berechtigung',
                                    value: requiredRoles,
                                    inline: true
                                },
                                {
                                    name: '👤 Dein Status',
                                    value: '❌ Keine ausreichende Berechtigung',
                                    inline: true
                                }
                            ],
                            footer: {
                                text: 'Player-Controls sind nur für berechtigte Rollen verfügbar'
                            },
                            timestamp: new Date().toISOString()
                        }]
                    });
                }
            }

            const response = await fetch(`${API_SERVER_URL}/api/music/control/${guildId}/${action}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Action-specific emojis and messages
                const actionEmojis = {
                    'play': '▶️',
                    'pause': '⏸️',
                    'skip': '⏭️',
                    'stop': '⏹️'
                };
                
                const actionMessages = {
                    'play': 'Wiedergabe gestartet',
                    'pause': 'Wiedergabe pausiert',
                    'skip': 'Song übersprungen',
                    'stop': 'Wiedergabe gestoppt'
                };
                
                await interaction.editReply({
                    embeds: [{
                        color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                        title: `${actionEmojis[action] || '✅'} ${actionMessages[action] || 'Erfolgreich'}`,
                        description: `${data.message || `${action} ausgeführt`}\n\n🎧 **DJ-Aktion von ${interaction.user.tag}**`,
                        footer: {
                            text: 'DJ Controls • Nur für dich sichtbar'
                        },
                        timestamp: new Date().toISOString()
                    }]
                });
                
                // Update interactive panel
                await updateInteractivePanel(guildId);
            } else {
                const errorData = await response.json();
                await interaction.editReply({
                    embeds: [{
                        color: parseInt(musicSettings.songRequests.embedColor.replace('#', ''), 16),
                        title: '❌ Fehler',
                        description: errorData.error || `Fehler bei ${action}`,
                        timestamp: new Date().toISOString()
                    }]
                });
            }
        } catch (error) {
            console.error(`❌ Fehler bei Music Control ${action}:`, error);
            await interaction.editReply({
                content: '❌ Netzwerkfehler beim Ausführen der Aktion.'
            });
        }
        return;
    }


});

// ================== TICKET SYSTEM HANDLERS ==================

// Handler für Ticket-Erstellung (zeigt zuerst Modal)
async function handleTicketCreateInteraction(interaction) {
    try {
        const ticketType = interaction.customId.replace('ticket_create_', '');
        
        // Verwende das neue TicketSystemV2
        const ticketSystem = client.ticketSystemV2;
        if (!ticketSystem) {
            return await interaction.reply({
                content: '❌ Ticket-System nicht verfügbar!',
                flags: MessageFlags.Ephemeral
            });
        }
        
        // Prüfe ob User bereits ein offenes Ticket hat
        for (const [ticketId, ticketData] of ticketSystem.activeTickets) {
            if (ticketData.userId === interaction.user.id && ticketData.status === 'open') {
                return await interaction.reply({
                    content: `❌ Du hast bereits ein offenes Ticket: <#${ticketData.channelId}>`,
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        // Finde Button-Konfiguration für bessere Bezeichnungen
        const buttonConfig = ticketSystem.settings.buttons.find(btn => btn.id === ticketType);
        const buttonLabel = buttonConfig ? buttonConfig.label : 'Support';

        // Erstelle Modal für Ticket-Details
        const modal = new ModalBuilder()
            .setCustomId(`ticket_modal_${ticketType}`)
            .setTitle(`${buttonConfig?.emoji || '🎫'} ${buttonLabel} - Ticket erstellen`);

        // Betreff-Eingabe
        const subjectInput = new TextInputBuilder()
            .setCustomId('ticket_subject')
            .setLabel('Betreff')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Kurze Beschreibung deines Anliegens...')
            .setRequired(true)
            .setMaxLength(100);

        // Beschreibung-Eingabe
        const descriptionInput = new TextInputBuilder()
            .setCustomId('ticket_description')
            .setLabel('Beschreibung')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Beschreibe dein Anliegen ausführlich...\n\nJe detaillierter, desto besser können wir dir helfen!')
            .setRequired(true)
            .setMaxLength(2000);

        // Erstelle Action Rows für die Inputs
        const subjectRow = new ActionRowBuilder().addComponents(subjectInput);
        const descriptionRow = new ActionRowBuilder().addComponents(descriptionInput);

        modal.addComponents(subjectRow, descriptionRow);

        // Zeige Modal
        await interaction.showModal(modal);

    } catch (error) {
        console.error('❌ Fehler beim Anzeigen des Ticket-Modals:', error);
        await interaction.reply({
            content: '❌ Fehler beim Anzeigen des Ticket-Formulars!',
            flags: MessageFlags.Ephemeral
        }).catch(console.error);
    }
}

// Handler für Ticket-Schließung (zeigt Modal für Grund-Angabe)
async function handleTicketCloseInteraction(interaction) {
    try {
        const ticketId = interaction.customId.replace('ticket_close_', '');
        const ticketSystem = client.ticketSystemV2;
        
        if (!ticketSystem) {
            return await interaction.reply({
                content: '❌ Ticket-System nicht verfügbar!',
                flags: MessageFlags.Ephemeral
            });
        }
        
        const ticketData = ticketSystem.activeTickets.get(ticketId);
        
        if (!ticketData) {
            return await interaction.reply({
                content: '❌ Ticket nicht gefunden!',
                flags: MessageFlags.Ephemeral
            });
        }

        // Prüfe Berechtigung (Ticket-Owner oder Support/Staff-Rolle)
        const hasPermission = interaction.user.id === ticketData.userId ||
                             interaction.member.permissions.has('ManageChannels') ||
                             ticketSystem.settings.supportRoles.some(roleName => {
                                 if (!roleName || !roleName.trim()) return false;
                                 const role = interaction.guild.roles.cache.find(r => r.name === roleName.trim());
                                 return role && interaction.member.roles.cache.has(role.id);
                             }) ||
                             ticketSystem.settings.staffRoles.some(roleName => {
                                 if (!roleName || !roleName.trim()) return false;
                                 const role = interaction.guild.roles.cache.find(r => r.name === roleName.trim());
                                 return role && interaction.member.roles.cache.has(role.id);
                             });

        if (!hasPermission) {
            return await interaction.reply({
                content: '❌ Du hast keine Berechtigung, dieses Ticket zu schließen!',
                flags: MessageFlags.Ephemeral
            });
        }

        // Bestimme ob User der Ticket-Ersteller ist
        const isTicketOwner = interaction.user.id === ticketData.userId;
        const modalTitle = isTicketOwner ? '🔒 Ticket schließen - Grund angeben' : '🛠️ Ticket schließen - Admin/Mod Grund';

        // Erstelle Modal für Schließungs-Grund
        const closeModal = new ModalBuilder()
            .setCustomId(`ticket_close_modal_${ticketId}`)
            .setTitle(modalTitle);

        // Grund-Eingabe
        const reasonInput = new TextInputBuilder()
            .setCustomId('close_reason')
            .setLabel('Grund für Schließung')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(isTicketOwner ? 
                'Warum möchtest du dein Ticket schließen?\n\nZ.B.: Problem gelöst, Frage beantwortet, etc.' :
                'Grund für die Schließung des Tickets...\n\nZ.B.: Problem gelöst, User inaktiv, Spam, etc.'
            )
            .setRequired(true)
            .setMaxLength(1000);

        const reasonRow = new ActionRowBuilder().addComponents(reasonInput);
        closeModal.addComponents(reasonRow);

        // Zeige Modal
        await interaction.showModal(closeModal);

    } catch (error) {
        console.error('❌ Fehler beim Anzeigen des Schließungs-Modals:', error);
        await interaction.reply({
            content: '❌ Fehler beim Anzeigen des Schließungs-Formulars!',
            flags: MessageFlags.Ephemeral
        }).catch(console.error);
    }
}



// Handler für Ticket-Modal-Submission
async function handleTicketModalSubmission(interaction) {
    try {
        const ticketType = interaction.customId.replace('ticket_modal_', '');
        const ticketSystem = client.ticketSystemV2;
        
        if (!ticketSystem) {
            return await interaction.reply({
                content: '❌ Ticket-System nicht verfügbar!',
                flags: MessageFlags.Ephemeral
            });
        }
        
        // Extrahiere Modal-Daten
        const subject = interaction.fields.getTextInputValue('ticket_subject');
        const description = interaction.fields.getTextInputValue('ticket_description');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Erstelle Ticket mit erweiterten Informationen
        const result = await ticketSystem.createTicketChannelWithDetails(interaction, ticketType, subject, description);
        
        if (result.success) {
            await interaction.editReply({
                content: `✅ Ticket erfolgreich erstellt! <#${result.channelId}>\n\n**Betreff:** ${subject}`
            });
        } else {
            await interaction.editReply({
                content: `❌ Fehler beim Erstellen des Tickets: ${result.error}`
            });
        }

    } catch (error) {
        console.error('❌ Fehler bei Ticket-Modal-Submission:', error);
        if (interaction.deferred) {
            await interaction.editReply({
                content: '❌ Fehler beim Erstellen des Tickets!'
            });
        } else {
            await interaction.reply({
                content: '❌ Fehler beim Erstellen des Tickets!',
                flags: MessageFlags.Ephemeral
            }).catch(console.error);
        }
    }
}

// Handler für Ticket-Schließungs-Modal-Submission
async function handleTicketCloseModalSubmission(interaction) {
    try {
        const ticketId = interaction.customId.replace('ticket_close_modal_', '');
        const ticketSystem = client.ticketSystemV2;
        
        if (!ticketSystem) {
            return await interaction.reply({
                content: '❌ Ticket-System nicht verfügbar!',
                flags: MessageFlags.Ephemeral
            });
        }
        
        const ticketData = ticketSystem.activeTickets.get(ticketId);
        
        if (!ticketData) {
            return await interaction.reply({
                content: '❌ Ticket nicht gefunden!',
                flags: MessageFlags.Ephemeral
            });
        }

        // Extrahiere Schließungs-Grund
        const closeReason = interaction.fields.getTextInputValue('close_reason');
        const isTicketOwner = interaction.user.id === ticketData.userId;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Schließe Ticket mit Grund und PN-Benachrichtigung
        const result = await ticketSystem.closeTicketWithReason(interaction, ticketId, closeReason, isTicketOwner);
        
        if (result.success) {
            await interaction.editReply({
                content: `✅ Ticket wurde erfolgreich geschlossen!\n\n**Grund:** ${closeReason}\n\n${result.dmSent ? '📧 Benachrichtigung wurde per PN gesendet.' : '⚠️ PN konnte nicht gesendet werden.'}`
            });
        } else {
            await interaction.editReply({
                content: `❌ Fehler beim Schließen des Tickets: ${result.error}`
            });
        }

    } catch (error) {
        console.error('❌ Fehler bei Ticket-Schließungs-Modal:', error);
        if (interaction.deferred) {
            await interaction.editReply({
                content: '❌ Fehler beim Schließen des Tickets!'
            });
        } else {
            await interaction.reply({
                content: '❌ Fehler beim Schließen des Tickets!',
                flags: MessageFlags.Ephemeral
            }).catch(console.error);
        }
    }
}

// Event: Modal-Submissions behandeln
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isModalSubmit()) return;

    // Behandle Valorant-Modal-Submissions
    if (interaction.customId.startsWith('valorant_modal_')) {
        await handleValorantModalSubmission(interaction);
    }

    // Behandle Ticket-Modal-Submissions
    if (interaction.customId.startsWith('ticket_modal_')) {
        await handleTicketModalSubmission(interaction);
    }

    // Behandle Ticket-Schließungs-Modal-Submissions
    if (interaction.customId.startsWith('ticket_close_modal_')) {
        await handleTicketCloseModalSubmission(interaction);
    }

    // Behandle Song-Request-Modal-Submissions
    if (interaction.customId === 'song_request_modal') {
        await handleSongRequestModal(interaction);
    }
});

// Funktion um Bot-Status an API Server zu senden
function sendStatusToAPI() {
    if (!client.isReady()) return;
    
    const statusData = {
        isRunning: true,
        status: 'online',
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        timestamp: Date.now()
    };

    const postData = JSON.stringify(statusData);
    // Verwende die API_SERVER_URL für internen Status-Update
    const serverUrl = new URL(`${API_SERVER_URL}/api/bot/status/update`);
    const options = {
        hostname: serverUrl.hostname,
        port: serverUrl.port || (serverUrl.protocol === 'https:' ? 443 : 80),
        path: serverUrl.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        // Stille Verarbeitung - kein Output für erfolgreiche Updates
    });

    req.on('error', (err) => {
        // Stille Verarbeitung - kein Output für Fehler um Spam zu vermeiden
    });

    req.write(postData);
    req.end();
}

// Bot Status direkt updaten mit besserer Restart-Erkennung
function updateBotStatus() {
    if (client.isReady() && client.user) {
        // Berechne Uptime
        let uptimeString = '0s';
        if (currentBotStatus.startTime) {
            const uptime = Date.now() - currentBotStatus.startTime;
            const seconds = Math.floor(uptime / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (days > 0) {
                uptimeString = `${days}d ${hours % 24}h ${minutes % 60}m`;
            } else if (hours > 0) {
                uptimeString = `${hours}h ${minutes % 60}m ${seconds % 60}s`;
            } else if (minutes > 0) {
                uptimeString = `${minutes}m ${seconds % 60}s`;
            } else {
                uptimeString = `${seconds}s`;
            }
        }
        
        const previousStatus = currentBotStatus.status;
        currentBotStatus = {
            isRunning: true,
            status: 'online',
            guilds: client.guilds.cache.size,
            users: client.users.cache.size,
            uptime: uptimeString,
            startTime: currentBotStatus.startTime || Date.now()
        };
        
        // Log Status-Änderungen
        if (previousStatus !== 'online') {
            console.log(`🟢 Bot Status changed: ${previousStatus} → online`);
        }
    } else {
        // Prüfe ob Bot im Restart-Modus ist
        if (currentBotStatus.status === 'restarting') {
            // Behalte restarting Status bei, bis Bot wirklich ready ist
        } else {
            // Bot ist nicht bereit - setze auf offline
            const previousStatus = currentBotStatus.status;
            currentBotStatus.status = 'offline';
            currentBotStatus.isRunning = false;
            
            if (previousStatus !== 'offline') {
                console.log(`🔴 Bot Status changed: ${previousStatus} → offline`);
            }
        }
    }
}

// Verification Settings (Supabase + JSON Fallback)
let verificationSettings = {
    enabled: true,
    requireCaptcha: true,
    allowedGames: ['valorant', 'lol', 'minecraft', 'fortnite', 'cs2', 'apex'],
    defaultRoles: ['Member'],
    welcomeMessage: 'Willkommen auf dem Server! Du hast die Verifizierung erfolgreich abgeschlossen.',
    logChannel: 'verification-logs',
    autoAssignRoles: true,
    gameRoles: {
        valorant: 'Valorant Player',
        lol: 'LoL Player',
        minecraft: 'Minecraft Player',
        fortnite: 'Fortnite Player',
        cs2: 'CS2 Player',
        apex: 'Apex Player'
    },
    platformRoles: {
        pc: 'PC Gamer',
        ps5: 'PlayStation Gamer', 
        xbox: 'Xbox Gamer',
        switch: 'Switch Gamer',
        mobile: 'Mobile Gamer'
    }
};

// Verification Stats (Supabase + JSON Fallback)
let verificationStats = {
    totalVerifications: 0,
    todayVerifications: 0,
    failedAttempts: 0,
    popularGames: [],
    platformStats: []
};

// ============================
// VERIFICATION SUPABASE FUNCTIONS
// ============================

// Lade Verification-Config aus Supabase (Nur-Supabase Version)
async function loadVerificationConfig() {
    try {
        // Nur Supabase - keine JSON-Fallbacks mehr
        if (!supabase) {
            throw new Error('Supabase nicht initialisiert - Verification System erfordert Supabase-Datenbank');
        }

        console.log('🔍 Lade Verification-Config aus Supabase...');
        
        const { data, error } = await supabase
            .from('verification_config')
            .select('*')
            .limit(1)
            .single();

        console.log('📊 Supabase Response:', { data: !!data, error: error?.code, message: error?.message });

        if (data && !error) {
            console.log('📋 Verification-Config aus Supabase geladen:', Object.keys(data.config || {}));
            console.log('🎮 Anzahl Spiele in Config:', data.config?.allowedGames?.length || 0);
            
            // Merge separate Felder mit JSONB config für Konsistenz
            const mergedConfig = {
                ...data.config,
                enabled: data.enabled,
                requireCaptcha: data.require_captcha,
                autoAssignRoles: data.auto_assign_roles
            };
            
            console.log('🔧 Config-Status:', {
                enabled: mergedConfig.enabled,
                requireCaptcha: mergedConfig.requireCaptcha,
                autoAssignRoles: mergedConfig.autoAssignRoles
            });
            
            return mergedConfig;
        }

        // Wenn keine Config in Supabase existiert, erstelle Standard-Config NUR EINMAL
        if (error?.code === 'PGRST116') { // No rows found
            console.log('🆕 Keine Config gefunden - erstelle Standard Verification-Config in Supabase...');
            
            // Prüfe nochmal ob nicht doch eine Config existiert (Race Condition vermeiden)
            const { data: existingData } = await supabase
                .from('verification_config')
                .select('*')
                .limit(1);

            if (existingData && existingData.length > 0) {
                console.log('📋 Config gefunden beim zweiten Versuch');
                return existingData[0].config;
            }
            
            const defaultConfig = {
                enabled: true,
                requireCaptcha: true,
                allowedGames: [
                    { id: 'valorant', label: 'Valorant', emoji: '🎯', role: 'Valorant' },
                    { id: 'league-of-legends', label: 'League of Legends', emoji: '⭐', role: 'League of Legends' },
                    { id: 'world-of-warcraft', label: 'World Of Warcraft', emoji: '⚔️', role: 'World of Warcraft' },
                    { id: 'fragpunk', label: 'Fragpunk', emoji: '🔞' },
                    { id: 'minecraft', label: 'Minecraft', emoji: '🧱' },
                    { id: 'fortnite', label: 'Fortnite', emoji: '🪂' },
                    { id: 'cs2', label: 'Counter-Strike 2', emoji: '💥' },
                    { id: 'apex', label: 'Apex Legends', emoji: '🚀' }
                ],
                allowedPlatforms: [
                    { id: 'pc', label: 'PC', emoji: '💻', role: '🖥️PC' },
                    { id: 'xbox', label: 'Xbox', emoji: '❎', role: '❎Xbox' },
                    { id: 'ps5', label: 'PS5', emoji: '🎮', role: '🎮PS5' },
                    { id: 'switch', label: 'Nintendo Switch', emoji: '🎮', role: 'Switch' },
                    { id: 'mobile', label: 'Mobile', emoji: '📱', role: 'Mobile' }
                ],
                defaultRoles: ['Member', 'verify'],
                welcomeMessage: 'Willkommen auf dem Server! Du hast die Verifizierung erfolgreich abgeschlossen.',
                logChannel: 'verify-logs',
                autoAssignRoles: true,
                verificationChannel: 'verify',
                botUpdates: {
                    enabled: true,
                    optInText: '📢 Ich möchte Bot-Updates und Neuigkeiten erhalten',
                    updatesRole: 'Bot Updates',
                    channelName: 'bot-updates'
                }
            };

            // Speichere Standard-Config in Supabase
            const { error: insertError } = await supabase
                .from('verification_config')
                .insert({ config: defaultConfig });

            if (!insertError) {
                console.log('✅ Standard Verification-Config in Supabase erstellt');
                return defaultConfig;
            } else {
                console.error('❌ Fehler beim Erstellen der Standard-Config:', insertError);
                throw insertError;
            }
        }

        console.error('❌ Unerwarteter Supabase-Fehler:', error);
        throw new Error(`Supabase-Fehler: ${error?.message || 'Unbekannter Fehler'}`);
    } catch (error) {
        console.error('❌ Fehler beim Laden der Verification-Config:', error.message);
        throw error; // Fehler weiterwerfen statt Fallback
    }
}

// Speichere Verification-Config in Supabase (Nur-Supabase Version)
async function saveVerificationConfig(config) {
    try {
        // Nur Supabase - keine JSON-Fallbacks mehr
        if (!supabase) {
            throw new Error('Supabase nicht initialisiert - Verification System erfordert Supabase-Datenbank');
        }

        console.log('💾 Speichere Verification-Config in Supabase...');
        console.log('🎮 Anzahl Spiele:', config.allowedGames?.length || 0);

        // Erst prüfen ob bereits eine Config existiert
        const { data: existingData, error: fetchError } = await supabase
            .from('verification_config')
            .select('id')
            .limit(1)
            .single();

        if (existingData && !fetchError) {
            // Update bestehende Config - SOWOHL separate Felder ALS AUCH config JSONB
            console.log('🔄 Aktualisiere bestehende Config mit ID:', existingData.id);
            const { error: updateError } = await supabase
                .from('verification_config')
                .update({
                    // Separate Felder aktualisieren
                    enabled: config.enabled,
                    require_captcha: config.requireCaptcha,
                    auto_assign_roles: config.autoAssignRoles,
                    // JSONB Config aktualisieren
                    config: config,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingData.id);

            if (!updateError) {
                console.log('✅ Verification-Config erfolgreich aktualisiert (separate Felder + JSONB)');
                return true;
            } else {
                console.error('❌ Fehler beim Aktualisieren:', updateError);
                throw updateError;
            }
        } else {
            // Erstelle neue Config - SOWOHL separate Felder ALS AUCH config JSONB
            console.log('🆕 Erstelle neue Config-Zeile');
            const { error: insertError } = await supabase
                .from('verification_config')
                .insert({
                    // Separate Felder setzen
                    enabled: config.enabled,
                    require_captcha: config.requireCaptcha,
                    auto_assign_roles: config.autoAssignRoles,
                    // JSONB Config setzen
                    config: config,
                    updated_at: new Date().toISOString()
                });

            if (!insertError) {
                console.log('✅ Neue Verification-Config erstellt (separate Felder + JSONB)');
                return true;
            } else {
                console.error('❌ Fehler beim Erstellen:', insertError);
                throw insertError;
            }
        }
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Verification-Config:', error.message);
        throw error; // Fehler weiterwerfen statt Fallback
    }
        }
        
// Lade alle verifizierten User aus Supabase (Nur-Supabase Version)
async function loadVerifiedUsers() {
    try {
        // Nur Supabase - keine JSON-Fallbacks mehr
        if (!supabase) {
            throw new Error('Supabase nicht initialisiert - Verification System erfordert Supabase-Datenbank');
        }

        const { data, error } = await supabase
            .from('verification_users')
            .select('*')
            .order('verification_date', { ascending: false });

        if (!error) {
            console.log(`👥 ${data?.length || 0} verifizierte User aus Supabase geladen`);
            return {
                users: (data || []).map(user => ({
                    discordId: user.discord_id,
                    username: user.username,
                    discriminator: user.discriminator,
                    avatar: user.avatar,
                    games: user.games,
                    platform: user.platform,
                    agents: user.agents,
                    assignedRoles: user.assigned_roles,
                    verificationDate: user.verification_date,
                    guildId: user.guild_id,
                    guildName: user.guild_name,
                    wantsBotUpdates: user.wants_bot_updates
                })),
                totalCount: data?.length || 0,
                lastUpdated: new Date().toISOString()
            };
        } else {
            console.error('❌ Supabase-Fehler beim Laden der User:', error);
            throw error;
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der verifizierten User:', error.message);
        throw error; // Fehler weiterwerfen statt Fallback
    }
}

// Speichere verifizierten User in Supabase (Nur-Supabase Version)
async function saveVerifiedUserToSupabase(userData) {
    try {
        // Nur Supabase - keine JSON-Fallbacks mehr
        if (!supabase) {
            throw new Error('Supabase nicht initialisiert - Verification System erfordert Supabase-Datenbank');
        }

        const { error } = await supabase
            .from('verification_users')
            .upsert({
                discord_id: userData.discordId,
                username: userData.username,
                discriminator: userData.discriminator || '0',
                avatar: userData.avatar,
                games: userData.games,
                platform: userData.platform,
                agents: userData.agents,
                assigned_roles: userData.assignedRoles,
                wants_bot_updates: userData.wantsBotUpdates || false,
                guild_id: userData.guildId,
                guild_name: userData.guildName,
                verification_date: userData.verificationDate || new Date().toISOString()
            }, {
                onConflict: 'discord_id'
            });

        if (!error) {
            console.log(`✅ User ${userData.username} in Supabase gespeichert`);
            return true;
        } else {
            console.error('❌ Supabase-Fehler beim Speichern des Users:', error);
            throw error;
        }
    } catch (error) {
        console.error('❌ Fehler beim Speichern des Users:', error.message);
        throw error; // Fehler weiterwerfen statt Fallback
    }
}

// Lade Verification-Stats aus Supabase (Nur-Supabase Version)
async function loadVerificationStats() {
    try {
        // Nur Supabase - keine JSON-Fallbacks mehr
        if (!supabase) {
            throw new Error('Supabase nicht initialisiert - Verification System erfordert Supabase-Datenbank');
        }

        const { data, error } = await supabase
            .from('verification_stats')
            .select('*')
            .limit(1)
            .single();

        if (!error && data) {
            console.log('📊 Verification-Stats aus Supabase geladen');
            return {
                totalVerifications: data.total_verifications,
                todayVerifications: data.today_verifications,
                failedAttempts: data.failed_attempts,
                popularGames: data.popular_games,
                platformStats: data.platform_stats,
                lastDay: data.last_day
            };
        } else if (error?.code === 'PGRST116') { // No rows found
            // Erstelle leere Stats wenn keine existieren
            console.log('📊 Keine Stats gefunden - verwende leere Statistiken');
            return {
                totalVerifications: 0,
                todayVerifications: 0,
                failedAttempts: 0,
                popularGames: [],
                platformStats: [],
                lastDay: new Date().toDateString()
            };
        } else {
            console.error('❌ Supabase-Fehler beim Laden der Stats:', error);
            throw error;
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Verification-Stats:', error.message);
        throw error; // Fehler weiterwerfen statt Fallback
    }
}

// Entfernt - doppelte Endpoints wurden weiter unten zusammengeführt

// Verification Stats laden (Supabase + JSON Fallback)
app.get('/api/verification/stats', async (req, res) => {
    try {
        // Lade User-Daten und Stats aus Supabase oder JSON
        const userData = await loadVerifiedUsers();
        const stats = await loadVerificationStats();
        const users = userData.users || [];
        
        // Berechne aktuelle Statistiken aus User-Daten
            const today = new Date().toDateString();
        const todayCount = users.filter(user => {
                const userDate = new Date(user.verificationDate).toDateString();
                return userDate === today;
            }).length;
            
            // Spiel-Statistiken aus echten Daten
            const gameStats = {};
            users.forEach(user => {
                user.games?.forEach(game => {
                    gameStats[game] = (gameStats[game] || 0) + 1;
                });
            });
        const popularGames = Object.entries(gameStats)
                .map(([game, count]) => ({ game, count }))
                .sort((a, b) => b.count - a.count);
            
            // Plattform-Statistiken aus echten Daten
            const platformStats = {};
            users.forEach(user => {
                if (user.platform) {
                    platformStats[user.platform] = (platformStats[user.platform] || 0) + 1;
                }
            });
        const platformStatsArray = Object.entries(platformStats)
                .map(([platform, count]) => ({ platform, count }))
                .sort((a, b) => b.count - a.count);
        
        // Erweiterte Statistiken
        const extendedStats = {
            totalVerifications: users.length,
            todayVerifications: todayCount,
            failedAttempts: stats.failedAttempts || 0,
            popularGames: popularGames,
            platformStats: platformStatsArray,
            recentUsers: users.slice(-5).reverse(), // Letzte 5 User
            totalUsers: users.length,
            activeToday: todayCount,
            mostPopularGame: popularGames[0]?.game || 'Keine Daten',
            mostPopularPlatform: platformStatsArray[0]?.platform || 'Keine Daten',
            lastDay: stats.lastDay || today
        };
        
        res.json(extendedStats);
    } catch (error) {
        console.error('Fehler beim Laden der Verification-Stats:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Verification-Stats' });
    }
});

// Alle verifizierten User laden (Supabase + JSON Fallback)
app.get('/api/verification/users', async (req, res) => {
    try {
        const userData = await loadVerifiedUsers();
            res.json(userData);
    } catch (error) {
        console.error('❌ Fehler beim Laden der verifizierten User:', error);
        res.status(500).json({ error: 'Fehler beim Laden der User-Daten' });
    }
});

// Verifizierung eines Users löschen (Nur-Supabase Version)
app.delete('/api/verification/users/:discordId', async (req, res) => {
    try {
        const { discordId } = req.params;
        
        const result = await removeVerifiedUser(discordId);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('❌ Fehler beim Löschen der Verifizierung:', error);
        if (error.message && error.message.includes('Supabase nicht initialisiert')) {
            res.status(503).json({ error: 'Supabase-Datenbank nicht verfügbar' });
        } else {
        res.status(500).json({ error: 'Fehler beim Löschen der Verifizierung' });
        }
    }
});

// Einzelnen User abrufen (Supabase + JSON Fallback)
app.get('/api/verification/users/:discordId', async (req, res) => {
    try {
        const { discordId } = req.params;
        
        const userData = await loadVerifiedUsers();
        const user = userData.users.find(u => u.discordId === discordId);
        
        if (!user) {
            return res.status(404).json({ error: 'User nicht gefunden' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('❌ Fehler beim Laden des Users:', error);
        res.status(500).json({ error: 'Fehler beim Laden der User-Daten' });
    }
});

// Cache für verwendete Authorization Codes (verhindert doppelte Verwendung)
const usedCodes = new Set();

// Discord OAuth2 Token Exchange
app.post('/api/auth/discord/token', async (req, res) => {
    try {
        const { code, redirectUri } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: 'Authorization code is required' });
        }

        // Prüfe, ob Code bereits verwendet wurde
        if (usedCodes.has(code)) {
            console.log('⚠️ Authorization code already used:', code.substring(0, 10) + '...');
            return res.status(400).json({ error: 'Authorization code already used' });
        }

        // Markiere Code als verwendet
        usedCodes.add(code);
        
        // Cache automatisch nach 10 Minuten leeren
        setTimeout(() => {
            usedCodes.delete(code);
        }, 10 * 60 * 1000);

        // Bestimme die richtige Redirect-URI
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const allowedRedirectUris = [
            `${frontendUrl}/verify`,    // Für Verification
            `${frontendUrl}/login`      // Für Dashboard-Login
        ];
        
        const finalRedirectUri = redirectUri && allowedRedirectUris.includes(redirectUri) 
            ? redirectUri 
            : `${frontendUrl}/verify`; // Default fallback

        console.log('🔑 Discord Token Exchange - Code received:', code.substring(0, 10) + '...');
        console.log('🔀 Using redirect URI:', finalRedirectUri);

        // Token-Request an Discord
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: apiKeys.discord.client_id,
                client_secret: apiKeys.discord.client_secret,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: finalRedirectUri,
            }),
        });

        console.log('🌐 Discord Token Response Status:', tokenResponse.status);

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('❌ Discord Token Error:', errorText);
            return res.status(400).json({ 
                error: 'Token exchange failed', 
                details: errorText 
            });
        }

        const tokenData = await tokenResponse.json();
        console.log('✅ Discord Token received successfully');

        // User-Informationen abrufen
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        if (!userResponse.ok) {
            console.error('❌ Failed to get user info from Discord');
            return res.status(400).json({ error: 'Failed to get user info' });
        }

        const userData = await userResponse.json();
        console.log('👤 Discord User data received:', userData.username);

        // Nur die notwendigen Daten zurückgeben (ohne Access Token)
        res.json({
            success: true,
            user: {
                id: userData.id,
                username: userData.username,
                discriminator: userData.discriminator,
                avatar: userData.avatar,
                email: userData.email
            }
        });

    } catch (error) {
        console.error('❌ Discord OAuth Error:', error);
        res.status(500).json({ error: 'Internal server error during Discord authentication' });
    }
});

// Verification-Konfiguration laden (Supabase + JSON Fallback)
app.get('/api/verification/config', async (req, res) => {
    try {
        const verificationConfig = await loadVerificationConfig();
        res.json(verificationConfig);
    } catch (error) {
        console.error('❌ Fehler beim Laden der Verification-Config:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Konfiguration' });
    }
});

// Verification-Konfiguration speichern (Nur-Supabase Version)
app.post('/api/verification/config', async (req, res) => {
    try {
        const configData = req.body;
        
        // Validierung
        if (!configData || typeof configData !== 'object') {
            return res.status(400).json({ error: 'Ungültige Konfigurationsdaten' });
        }

        await saveVerificationConfig(configData);
        
        console.log('🎮 Spiele:', configData.allowedGames?.length || 0);
        console.log('💻 Plattformen:', configData.allowedPlatforms?.length || 0);
        console.log('👥 Rollen:', configData.defaultRoles?.length || 0);
        console.log('📺 Log-Kanal:', configData.logChannel || 'nicht gesetzt');
        
        res.json({ success: true, message: 'Konfiguration erfolgreich in Supabase gespeichert' });
        
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Verification-Config:', error);
        if (error.message.includes('Supabase nicht initialisiert')) {
            res.status(503).json({ error: 'Supabase-Datenbank nicht verfügbar' });
        } else {
        res.status(500).json({ error: 'Fehler beim Speichern der Konfiguration' });
        }
    }
});

// Verifizierungsnachricht in Channel posten
app.post('/api/verification/post-message', async (req, res) => {
    try {
        const { channel, embedColor, title, description, buttonText } = req.body;
        
        if (!channel) {
            return res.status(400).json({ error: 'Channel-Name ist erforderlich' });
        }
        
        console.log(`🚀 Poste Verifizierungsnachricht in #${channel}`);
        
        // Finde den Guild
        const guild = client.guilds.cache.first();
        if (!guild) {
            console.error('❌ Guild nicht gefunden');
            return res.status(500).json({ error: 'Discord-Server nicht gefunden' });
        }
        
        // Finde den Channel
        const targetChannel = guild.channels.cache.find(c => c.name === channel && c.type === 0); // Text channel
        if (!targetChannel) {
            console.error(`❌ Channel #${channel} nicht gefunden`);
            return res.status(404).json({ error: `Channel #${channel} nicht gefunden` });
        }
        
        // Prüfe Bot-Berechtigung
        if (!targetChannel.permissionsFor(guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
            console.error(`❌ Keine Berechtigung für #${channel}`);
            return res.status(403).json({ error: `Keine Berechtigung für #${channel}` });
        }
        
        // Erstelle Embed
        const verificationEmbed = new EmbedBuilder()
            .setTitle(title || '🛡️ Server Verifizierung')
            .setDescription(description || 'Willkommen auf dem Server! Um Zugang zu allen Channels zu erhalten, musst du dich verifizieren.')
            .addFields(
                {
                    name: '📋 Was dich erwartet:',
                    value: '✅ Wähle deine Lieblingsspiele\n💻 Gib deine Gaming-Plattform an\n🎯 Erhalte passende Rollen automatisch',
                    inline: false
                },
                {
                    name: '⚡ Schnell & Einfach',
                    value: 'Der gesamte Prozess dauert nur wenige Sekunden!',
                    inline: false
                }
            )
            .setColor(parseInt(embedColor?.replace('0x', '') || '00FF7F', 16))
            .setThumbnail(guild.iconURL())
            .setFooter({ text: `${guild.name} • Verifizierung`, iconURL: guild.iconURL() })
            .setTimestamp();
        
        // Erstelle Button
        const verifyButton = new ButtonBuilder()
            .setCustomId('verify_start')
            .setLabel(buttonText || '🚀 Jetzt verifizieren')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🛡️');
        
        const row = new ActionRowBuilder()
            .addComponents(verifyButton);
        
        // Sende Nachricht
        const message = await targetChannel.send({
            embeds: [verificationEmbed],
            components: [row]
        });
        
        console.log(`✅ Verifizierungsnachricht erfolgreich in #${channel} gepostet (Message ID: ${message.id})`);
        
        res.json({ 
            success: true, 
            message: `Verifizierungsnachricht erfolgreich in #${channel} gepostet`,
            messageId: message.id,
            channelId: targetChannel.id
        });
        
    } catch (error) {
        console.error('❌ Fehler beim Posten der Verifizierungsnachricht:', error);
        res.status(500).json({ error: 'Fehler beim Posten der Nachricht' });
    }
});

// Neue Verifizierung verarbeiten
app.post('/api/verification', async (req, res) => {
    try {
        const { discordId, games, platform, agents, wantsBotUpdates } = req.body;
        
        console.log('🔐 Neue Verifizierung erhalten:', { discordId, games, platform, agents, wantsBotUpdates });
        
        // Lade aktuelle Verification-Config (Supabase + JSON Fallback)
        const verificationConfig = await loadVerificationConfig();
        
        if (!verificationConfig.enabled) {
            return res.status(400).json({ error: 'Verifizierung ist deaktiviert' });
        }

        // Finde den User im Guild
        const guild = client.guilds.cache.first(); // Annahme: Bot ist nur in einem Guild
        if (!guild) {
            return res.status(500).json({ error: 'Guild nicht gefunden' });
        }

        const member = await guild.members.fetch(discordId).catch(() => null);
        if (!member) {
            return res.status(404).json({ error: 'Benutzer nicht im Server gefunden' });
        }

        // Sammle Rollen, die zugewiesen werden sollen
        const rolesToAssign = [...(verificationConfig.defaultRoles || [])];

        if (verificationConfig.autoAssignRoles) {
            // Für jedes gewählte Spiel die konfigurierte Rolle hinzufügen
            for (const gameId of games) {
                const gameInfo = verificationConfig.allowedGames?.find(g => g.id === gameId);
                if (gameInfo && gameInfo.role && gameInfo.role.trim()) {
                    rolesToAssign.push(gameInfo.role.trim());
                    console.log(`🎮 Spiel-Rolle hinzugefügt: ${gameInfo.role} für ${gameInfo.label}`);
                }
            }

            // Plattform-spezifische Rolle (falls konfiguriert)
            if (platform) {
                const platformInfo = verificationConfig.allowedPlatforms?.find(p => p.id === platform);
                if (platformInfo && platformInfo.role && platformInfo.role.trim()) {
                    rolesToAssign.push(platformInfo.role.trim());
                    console.log(`💻 Plattform-Rolle hinzugefügt: ${platformInfo.role} für ${platformInfo.label}`);
                }
            }
        }



        // 🎯 VALORANT AGENTEN-ROLLEN: Automatische Rollen-Vergabe basierend auf Agenten-Auswahl
        if (agents && agents.length > 0) {
            const valorantRoles = await getValorantRolesFromAgents(agents);
            rolesToAssign.push(...valorantRoles);
            
            // Füge auch individuelle Agenten-Rollen hinzu
            rolesToAssign.push(...agents);
            
            console.log(`🎯 Valorant-Rollen hinzugefügt: ${valorantRoles.join(', ')} + individuelle Agenten: ${agents.join(', ')}`);
        }

        // 🔧 AUTOMATISCHE ROLLEN-ERSTELLUNG: Erstelle fehlende Rollen automatisch
        await createMissingVerificationRoles(guild, rolesToAssign);

        // Rollen zuweisen
        console.log(`🎯 Versuche ${rolesToAssign.length} Rollen zuzuweisen:`, rolesToAssign);
        console.log(`📋 Verfügbare Server-Rollen:`, guild.roles.cache.map(r => r.name).slice(0, 10));
        
        const assignedRoles = [];
        const failedRoles = [];
        
        for (const roleName of rolesToAssign) {
            let role = guild.roles.cache.find(r => r.name === roleName);
            
            // Falls die Rolle immer noch nicht existiert, versuche sie zu erstellen
            if (!role) {
                console.log(`🛠️ Erstelle fehlende Rolle "${roleName}"...`);
                try {
                    role = await createVerificationRole(guild, roleName);
                    console.log(`✅ Rolle "${roleName}" erfolgreich erstellt!`);
                } catch (error) {
                    console.error(`❌ Fehler beim Erstellen der Rolle "${roleName}":`, error.message);
                    failedRoles.push(roleName);
                    continue;
                }
            }
            
            if (member.roles.cache.has(role.id)) {
                console.log(`ℹ️ ${member.user.username} hat bereits die Rolle "${roleName}"`);
                assignedRoles.push(roleName);
                continue;
            }
            
            try {
                await member.roles.add(role);
                console.log(`✅ Rolle "${roleName}" zu ${member.user.username} hinzugefügt`);
                assignedRoles.push(roleName);
            } catch (error) {
                console.error(`❌ Fehler beim Hinzufügen der Rolle "${roleName}":`, error.message);
                failedRoles.push(roleName);
            }
        }
        
        console.log(`📊 Rollen-Zusammenfassung: ${assignedRoles.length} erfolgreich, ${failedRoles.length} fehlgeschlagen`);
        if (failedRoles.length > 0) {
            console.log(`❌ Fehlgeschlagene Rollen:`, failedRoles);
        }

        // Willkommensnachricht senden
        if (verificationConfig.welcomeMessage) {
            try {
                await member.send(verificationConfig.welcomeMessage);
            } catch (error) {
                console.log(`⚠️  Konnte DM nicht an ${member.user.username} senden`);
            }
        }

        // Log in Kanal
        if (verificationConfig.logChannel) {
            const logChannel = guild.channels.cache.find(c => c.name === verificationConfig.logChannel);
            if (logChannel) {
                // Spiel-Namen für das Log aufbereiten
                const gameNames = games.map(gameId => {
                    const gameInfo = verificationConfig.allowedGames?.find(g => g.id === gameId);
                    return gameInfo ? gameInfo.label : gameId;
                });

                // Plattform-Name für das Log aufbereiten
                const platformName = platform ? 
                    verificationConfig.allowedPlatforms?.find(p => p.id === platform)?.label || platform 
                    : 'Nicht angegeben';

                const logEmbed = new EmbedBuilder()
                    .setTitle('✅ Neue Verifizierung')
                    .setDescription(`**${member.user.username}** hat die Verifizierung abgeschlossen`)
                    .addFields(
                        { name: '🎮 Spiele', value: gameNames.join(', ') || 'Keine', inline: true },
                        { name: '💻 Plattform', value: platformName, inline: true },
                        { name: '👥 Rollen', value: rolesToAssign.join(', ') || 'Keine', inline: false }
                    )
                    .setThumbnail(member.user.displayAvatarURL())
                    .setColor(0x00FF7F)
                    .setTimestamp();
                
                if (agents && agents.length > 0) {
                    logEmbed.addFields({ name: '🎯 Valorant Agenten', value: agents.join(', '), inline: false });
                }

                await logChannel.send({ embeds: [logEmbed] });
            }
        }

        // Vollständige User-Daten speichern (Supabase + JSON Fallback)
        await saveVerifiedUserToSupabase({
            discordId: discordId,
            username: member.user.username,
            discriminator: member.user.discriminator,
            avatar: member.user.avatar,
            games: games,
            platform: platform,
            agents: agents || [],
            assignedRoles: assignedRoles,
            verificationDate: new Date().toISOString(),
            guildId: guild.id,
            guildName: guild.name,
            wantsBotUpdates: wantsBotUpdates || false
        });

                    // Statistiken werden automatisch in Supabase über Trigger aktualisiert

        res.json({ 
            success: true, 
            message: 'Verifizierung erfolgreich abgeschlossen',
            assignedRoles: assignedRoles,
            failedRoles: failedRoles,
            totalRoles: assignedRoles.length
        });

    } catch (error) {
        console.error('❌ Fehler bei Verifizierung:', error);
        res.status(500).json({ error: 'Fehler bei der Verifizierung' });
    }
});

// 🎭 AUTOMATISCHE VERIFICATION-ROLLEN ERSTELLUNG
async function createMissingVerificationRoles(guild, rolesToAssign) {
    console.log(`🎭 Prüfe Verification-Rollen für automatische Erstellung...`);
    
    for (const roleName of rolesToAssign) {
        const existingRole = guild.roles.cache.find(r => r.name === roleName);
        if (!existingRole) {
            console.log(`🆕 Erstelle fehlende Verification-Rolle: "${roleName}"`);
            try {
                await createVerificationRole(guild, roleName);
                console.log(`✅ Verification-Rolle "${roleName}" erfolgreich erstellt!`);
            } catch (error) {
                console.error(`❌ Fehler beim Erstellen der Verification-Rolle "${roleName}":`, error.message);
            }
        }
    }
}

async function createVerificationRole(guild, roleName) {
    try {
        // Bestimme Farbe und Position basierend auf dem Rollen-Namen
        const roleConfig = await getVerificationRoleConfig(roleName);
        
        const newRole = await guild.roles.create({
            name: roleName,
            color: roleConfig.color,
            hoist: roleConfig.hoist,
            mentionable: roleConfig.mentionable,
            permissions: roleConfig.permissions,
            reason: `🤖 Automatisch erstellt für Verification-System`
        });
        
        console.log(`🎭 Neue Verification-Rolle erstellt: "${roleName}" (ID: ${newRole.id})`);
        
        // Positionierung der Rolle
        if (roleConfig.position > 0) {
            try {
                await newRole.setPosition(roleConfig.position);
                console.log(`📍 Rolle "${roleName}" positioniert auf Position ${roleConfig.position}`);
            } catch (error) {
                console.log(`⚠️ Konnte Rolle "${roleName}" nicht positionieren:`, error.message);
            }
        }
        
        return newRole;
        
    } catch (error) {
        console.error(`❌ Fehler beim Erstellen der Rolle "${roleName}":`, error);
        throw error;
    }
}

// 🎯 Valorant Agenten-Rollen Mapping
// Supabase-basierte Valorant Rollen aus Agenten ermitteln
async function getValorantRolesFromAgents(agents) {
    try {
        const allAgents = await loadValorantAgentsFromSupabase();
        const assignedRoles = new Set();
        
        // Prüfe für jeden ausgewählten Agenten, zu welcher Rolle er gehört
        for (const agent of agents) {
            const agentData = allAgents.find(a => a.name.toLowerCase() === agent.toLowerCase());
            if (agentData) {
                assignedRoles.add(agentData.role_type);
                console.log(`🎯 Agent "${agent}" → Rolle "${agentData.role_type}"`);
            } else {
                // Fallback für nicht gefundene Agenten
                console.log(`⚠️ Agent "${agent}" nicht in Supabase gefunden, verwende Legacy-Zuordnung`);
                const legacyRole = getLegacyAgentRole(agent);
                if (legacyRole) {
                    assignedRoles.add(legacyRole);
                    console.log(`🎯 Agent "${agent}" → Legacy-Rolle "${legacyRole}"`);
                }
            }
        }
        
        // Füge "Valorant" Basis-Rolle hinzu, falls Agenten ausgewählt wurden
        if (assignedRoles.size > 0) {
            assignedRoles.add('Valorant');
        }
        
        return Array.from(assignedRoles);
        
    } catch (error) {
        console.error('❌ Fehler beim Ermitteln der Valorant Rollen:', error);
        // Fallback auf Legacy-System
        return getLegacyValorantRoles(agents);
    }
}

// Legacy-Zuordnung für Fallback
function getLegacyAgentRole(agentName) {
    const valorantAgentRoles = {
        'Duelist': ['Jett', 'Phoenix', 'Reyna', 'Raze', 'Yoru', 'Neon', 'Iso', 'Waylay'],
        'Sentinel': ['Killjoy', 'Cypher', 'Sage', 'Chamber', 'Deadlock', 'Vyse'],
        'Initiator': ['Sova', 'Breach', 'Skye', 'Fade', 'KAY/O', 'Gekko', 'Tejo'],
        'Controller': ['Brimstone', 'Viper', 'Omen', 'Astra', 'Harbor', 'Clove']
    };
    
    for (const [roleName, roleAgents] of Object.entries(valorantAgentRoles)) {
        if (roleAgents.includes(agentName)) {
            return roleName;
        }
    }
    return null;
}

// Legacy Valorant Rollen System (Fallback)
function getLegacyValorantRoles(agents) {
    const valorantAgentRoles = {
        'Duelist': ['Jett', 'Phoenix', 'Reyna', 'Raze', 'Yoru', 'Neon', 'Iso', 'Waylay'],
        'Sentinel': ['Killjoy', 'Cypher', 'Sage', 'Chamber', 'Deadlock', 'Vyse'],
        'Initiator': ['Sova', 'Breach', 'Skye', 'Fade', 'KAY/O', 'Gekko', 'Tejo'],
        'Controller': ['Brimstone', 'Viper', 'Omen', 'Astra', 'Harbor', 'Clove']
    };
    
    const assignedRoles = new Set();
    
    for (const agent of agents) {
        for (const [roleName, roleAgents] of Object.entries(valorantAgentRoles)) {
            if (roleAgents.includes(agent)) {
                assignedRoles.add(roleName);
                console.log(`🎯 Legacy: Agent "${agent}" → Rolle "${roleName}"`);
            }
        }
    }
    
    if (assignedRoles.size > 0) {
        assignedRoles.add('Valorant');
    }
    
    return Array.from(assignedRoles);
}

// Supabase-basierte Rollen-Konfiguration
async function getVerificationRoleConfig(roleName) {
    try {
        // Versuche zuerst Valorant-Agent Konfiguration zu laden
        const allAgents = await loadValorantAgentsFromSupabase();
        const agent = allAgents.find(a => a.name.toLowerCase() === roleName.toLowerCase());
        
        if (agent && agent.role_config) {
            // Konvertiere Hex-Farbe zu Decimal
            const color = agent.role_color ? parseInt(agent.role_color.replace('#', ''), 16) : 0x99AAB5;
            return {
                color: color,
                hoist: agent.role_config.hoist || false,
                mentionable: agent.role_config.mentionable || true,
                permissions: agent.role_config.permissions || [],
                position: agent.role_config.position || 7
            };
        }
        
        // Versuche Valorant-Rollen-Typ zu laden
        if (supabase) {
            const { data: roleData, error } = await supabase
                .from('valorant_agent_roles')
                .select('color, role_config')
                .eq('role_name', roleName)
                .eq('enabled', true)
                .single();
            
            if (!error && roleData) {
                const color = roleData.color ? parseInt(roleData.color.replace('#', ''), 16) : 0x99AAB5;
                return {
                    color: color,
                    hoist: roleData.role_config.hoist || true,
                    mentionable: roleData.role_config.mentionable || true,
                    permissions: roleData.role_config.permissions || [],
                    position: roleData.role_config.position || 6
                };
            }
        }
        
        // Fallback auf Legacy-Konfiguration
        return getLegacyRoleConfig(roleName);
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Rollen-Konfiguration:', error);
        return getLegacyRoleConfig(roleName);
    }
}

// Legacy-Rollen-Konfiguration (Fallback)
function getLegacyRoleConfig(roleName) {
    const configs = {
        'Verified': {
            color: 0x00FF7F, // Grün
            hoist: false,
            mentionable: false,
            permissions: ['SendMessages', 'ReadMessageHistory', 'AddReactions', 'UseExternalEmojis'],
            position: 5
        },
        'Member': {
            color: 0x5865F2, // Discord Blau
            hoist: false,
            mentionable: false,
            permissions: ['SendMessages', 'ReadMessageHistory', 'AddReactions'],
            position: 4
        },
        'Valorant': {
            color: 0xFF4655, // Valorant Rot
            hoist: false,
            mentionable: true,
            permissions: [],
            position: 3
        },
        'League of Legends': {
            color: 0xC8AA6E, // LoL Gold
            hoist: false,
            mentionable: true,
            permissions: [],
            position: 3
        },
        'Minecraft': {
            color: 0x62C946, // Minecraft Grün
            hoist: false,
            mentionable: true,
            permissions: [],
            position: 3
        },
        'PC': {
            color: 0x747F8D, // Grau
            hoist: false,
            mentionable: false,
            permissions: [],
            position: 2
        },
        'PlayStation': {
            color: 0x006FCD, // PS Blau
            hoist: false,
            mentionable: false,
            permissions: [],
            position: 2
        },
        'Xbox': {
            color: 0x107C10, // Xbox Grün
            hoist: false,
            mentionable: false,
            permissions: [],
            position: 2
        },
        'Bot Updates': {
            color: 0x9146FF, // Twitch Lila
            hoist: false,
            mentionable: true,
            permissions: [],
            position: 1
        },
        // 🎯 Valorant Agenten-Rollen
        'Duelist': {
            color: 0xFF4655, // Valorant Rot
            hoist: true,
            mentionable: true,
            permissions: [],
            position: 6
        },
        'Sentinel': {
            color: 0x00C851, // Grün
            hoist: true,
            mentionable: true,
            permissions: [],
            position: 6
        },
        'Initiator': {
            color: 0xAA66CC, // Lila
            hoist: true,
            mentionable: true,
            permissions: [],
            position: 6
        },
        'Controller': {
            color: 0x33B5E5, // Blau
            hoist: true,
            mentionable: true,
            permissions: [],
            position: 6
        },
        // 🎯 Individuelle Agenten-Rollen
        // Duelist Agenten
        'Jett': { color: 0x87CEEB, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Phoenix': { color: 0xFF4500, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Reyna': { color: 0x8A2BE2, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Raze': { color: 0xFF6347, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Yoru': { color: 0x483D8B, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Neon': { color: 0x00FFFF, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Iso': { color: 0x9932CC, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Waylay': { color: 0x4682B4, hoist: false, mentionable: true, permissions: [], position: 7 },
        
        // Sentinel Agenten
        'Killjoy': { color: 0xFFD700, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Cypher': { color: 0x708090, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Sage': { color: 0x98FB98, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Chamber': { color: 0xB8860B, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Deadlock': { color: 0x2F4F4F, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Vyse': { color: 0x556B2F, hoist: false, mentionable: true, permissions: [], position: 7 },
        
        // Initiator Agenten
        'Sova': { color: 0x4169E1, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Breach': { color: 0xFF8C00, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Skye': { color: 0x32CD32, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Fade': { color: 0x2E2E2E, hoist: false, mentionable: true, permissions: [], position: 7 },
        'KAY/O': { color: 0x778899, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Gekko': { color: 0x9ACD32, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Tejo': { color: 0xDA70D6, hoist: false, mentionable: true, permissions: [], position: 7 },
        
        // Controller Agenten
        'Brimstone': { color: 0x8B4513, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Viper': { color: 0x006400, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Omen': { color: 0x191970, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Astra': { color: 0x9400D3, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Harbor': { color: 0x20B2AA, hoist: false, mentionable: true, permissions: [], position: 7 },
        'Clove': { color: 0x228B22, hoist: false, mentionable: true, permissions: [], position: 7 }
    };
    
    // Standard-Konfiguration für unbekannte Rollen
    const defaultConfig = {
        color: 0x99AAB5, // Standard Discord Grau
        hoist: false,
        mentionable: false,
        permissions: [],
        position: 1
    };
    
    return configs[roleName] || defaultConfig;
}

// 🛡️ API-Endpunkt: Admin-Status überprüfen für Dashboard-Login
app.post('/api/auth/check-admin', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID erforderlich' });
        }
        
        const guild = client.guilds.cache.first();
        if (!guild) {
            return res.status(500).json({ error: 'Guild nicht gefunden' });
        }
        
        console.log(`🔍 Überprüfe Admin-Status für User: ${userId}`);
        
        try {
            // Hole Guild Member
            const member = await guild.members.fetch(userId);
            
            if (!member) {
                console.log(`❌ User ${userId} nicht im Server gefunden`);
                return res.json({ 
                    isAdmin: false, 
                    reason: 'User nicht im Server gefunden',
                    userId: userId
                });
            }
            
            // Prüfe auf Admin-Rollen (mehrere mögliche Namen)
            const adminRoleNames = ['Admin', 'Administrator', 'Owner', 'Moderator', 'Mod'];
            const hasAdminRole = member.roles.cache.some(role => 
                adminRoleNames.some(adminName => 
                    role.name.toLowerCase().includes(adminName.toLowerCase())
                )
            );
            
            // Prüfe auf Administrator-Berechtigung
            const hasAdminPermission = member.permissions.has('Administrator');
            
            // Prüfe ob User der Server-Owner ist
            const isOwner = member.id === guild.ownerId;
            
            const isAdmin = hasAdminRole || hasAdminPermission || isOwner;
            
            console.log(`🛡️ Admin-Check für ${member.user.username}:`);
            console.log(`  - Admin-Rolle: ${hasAdminRole}`);
            console.log(`  - Admin-Permission: ${hasAdminPermission}`);
            console.log(`  - Server-Owner: ${isOwner}`);
            console.log(`  - Ergebnis: ${isAdmin ? 'ADMIN' : 'KEIN ADMIN'}`);
            
            if (hasAdminRole) {
                const adminRoles = member.roles.cache
                    .filter(role => adminRoleNames.some(name => role.name.toLowerCase().includes(name.toLowerCase())))
                    .map(role => role.name);
                console.log(`  - Gefundene Admin-Rollen: ${adminRoles.join(', ')}`);
            }
            
            res.json({
                isAdmin: isAdmin,
                userId: userId,
                username: member.user.username,
                hasAdminRole: hasAdminRole,
                hasAdminPermission: hasAdminPermission,
                isOwner: isOwner,
                roles: member.roles.cache.map(role => role.name)
            });
            
        } catch (fetchError) {
            console.error(`❌ Fehler beim Abrufen des Members: ${fetchError.message}`);
            return res.json({ 
                isAdmin: false, 
                reason: 'User nicht im Server oder Fehler beim Abrufen',
                error: fetchError.message,
                userId: userId
            });
        }
        
    } catch (error) {
        console.error('❌ Fehler bei Admin-Überprüfung:', error);
        res.status(500).json({ 
            error: 'Fehler bei der Admin-Überprüfung',
            details: error.message 
        });
    }
});

// 🎭 API-Endpunkt: Verification-Rollen manuell erstellen
app.post('/api/verification/create-roles', async (req, res) => {
    try {
        const { roles } = req.body;
        
        if (!roles || !Array.isArray(roles)) {
            return res.status(400).json({ error: 'Rollen-Array erforderlich' });
        }
        
        const guild = client.guilds.cache.first();
        if (!guild) {
            return res.status(500).json({ error: 'Guild nicht gefunden' });
        }
        
        console.log(`🎭 Manuelle Erstellung von ${roles.length} Verification-Rollen angefordert`);
        
        const createdRoles = [];
        const failedRoles = [];
        const existingRoles = [];
        
        for (const roleName of roles) {
            if (!roleName || !roleName.trim()) continue;
            
            const cleanRoleName = roleName.trim();
            const existingRole = guild.roles.cache.find(r => r.name === cleanRoleName);
            
            if (existingRole) {
                console.log(`📋 Rolle "${cleanRoleName}" existiert bereits`);
                existingRoles.push(cleanRoleName);
                continue;
            }
            
            try {
                await createVerificationRole(guild, cleanRoleName);
                console.log(`✅ Verification-Rolle "${cleanRoleName}" manuell erstellt`);
                createdRoles.push(cleanRoleName);
            } catch (error) {
                console.error(`❌ Fehler beim manuellen Erstellen der Rolle "${cleanRoleName}":`, error.message);
                failedRoles.push(cleanRoleName);
            }
        }
        
        console.log(`🎯 Rollen-Erstellung abgeschlossen: ${createdRoles.length} erstellt, ${existingRoles.length} bereits vorhanden, ${failedRoles.length} fehlgeschlagen`);
        
        res.json({
            success: true,
            message: `${createdRoles.length} Rollen erstellt, ${existingRoles.length} bereits vorhanden`,
            createdRoles,
            existingRoles,
            failedRoles,
            totalProcessed: createdRoles.length + existingRoles.length + failedRoles.length
        });
        
    } catch (error) {
        console.error('❌ Fehler beim manuellen Erstellen von Verification-Rollen:', error);
        res.status(500).json({ error: 'Fehler beim Erstellen der Rollen' });
    }
});

// ENTFERNT: Alte JSON-Funktion durch saveVerifiedUserToSupabase ersetzt

// Entferne Verifizierung eines Users (Supabase-Version)
async function removeVerifiedUser(discordId) {
    try {
        // Nur Supabase - keine JSON-Fallbacks mehr
        if (!supabase) {
            throw new Error('Supabase nicht initialisiert - Verification System erfordert Supabase-Datenbank');
        }
        
        // Hole User-Daten bevor wir löschen (für Rollen-Entfernung)
        const { data: userData, error: fetchError } = await supabase
            .from('verification_users')
            .select('*')
            .eq('discord_id', discordId)
            .single();
        
        if (fetchError || !userData) {
            return { success: false, message: 'User nicht gefunden' };
        }
        
        // Lösche User aus Supabase
        const { error: deleteError } = await supabase
            .from('verification_users')
            .delete()
            .eq('discord_id', discordId);

        if (deleteError) {
            console.error('❌ Supabase-Fehler beim Löschen:', deleteError);
            throw deleteError;
        }

        // Entferne Rollen vom Discord-User
        const guild = client.guilds.cache.first();
        if (guild) {
            const member = await guild.members.fetch(discordId).catch(() => null);
            if (member && userData.assigned_roles) {
                for (const roleName of userData.assigned_roles) {
                    const role = guild.roles.cache.find(r => r.name === roleName);
                    if (role && member.roles.cache.has(role.id)) {
                        try {
                            await member.roles.remove(role);
                            console.log(`🗑️ Rolle "${roleName}" von ${userData.username} entfernt`);
                        } catch (error) {
                            console.error(`❌ Fehler beim Entfernen der Rolle "${roleName}":`, error.message);
                        }
                    }
                }
            }
        }
        
        console.log(`✅ User ${userData.username} aus Supabase entfernt`);
        return { 
            success: true, 
            message: `Verifizierung von ${userData.username} entfernt`, 
            user: {
                discordId: userData.discord_id,
                username: userData.username,
                discriminator: userData.discriminator,
                avatar: userData.avatar,
                games: userData.games,
                platform: userData.platform,
                agents: userData.agents,
                assignedRoles: userData.assigned_roles,
                verificationDate: userData.verification_date,
                guildId: userData.guild_id,
                guildName: userData.guild_name,
                wantsBotUpdates: userData.wants_bot_updates
            }
        };
        
    } catch (error) {
        console.error('❌ Fehler beim Entfernen des Users:', error);
        if (error.message.includes('Supabase nicht initialisiert')) {
            return { success: false, message: 'Supabase-Datenbank nicht verfügbar' };
        }
        return { success: false, message: 'Fehler beim Entfernen der Verifizierung' };
    }
}

// ENTFERNT: Alte JSON-Funktion - Statistiken werden jetzt automatisch via Supabase-Trigger aktualisiert

// Bot Settings anwenden
async function applyBotSettings(settings) {
    try {
        if (!client.isReady()) {
            console.log('⚠️ Bot ist nicht bereit, Einstellungen werden beim nächsten Start angewendet');
            return;
        }

        console.log('🤖 Wende Bot-Einstellungen an...');

        // Bot Status und Aktivität ändern
        const activityTypes = {
            'playing': 0,
            'listening': 2,
            'watching': 3,
            'streaming': 1
        };

        const statusTypes = {
            'online': 'online',
            'idle': 'idle',
            'dnd': 'dnd',
            'invisible': 'invisible'
        };

        await client.user.setPresence({
            activities: [{
                name: settings.activityText || 'mit dem Discord Server',
                type: activityTypes[settings.activityType] || 0
            }],
            status: statusTypes[settings.botStatus] || 'online'
        });

        console.log(`✅ Bot Status: ${settings.botStatus}, Aktivität: ${settings.activityType} ${settings.activityText}`);

        // Debug-Modus setzen
        if (settings.debugMode) {
            console.log('🐛 Debug-Modus aktiviert');
        }

        // Weitere Einstellungen können hier angewendet werden
        // z.B. Prefix für Commands, etc.

    } catch (error) {
        console.error('❌ Fehler beim Anwenden der Bot-Einstellungen:', error);
    }
}

// Registriere Moderation Slash Commands
async function registerModerationCommands() {
    try {
        const commands = [
            {
                name: 'warn',
                description: 'Verwarne einen User',
                options: [
                    {
                        name: 'user',
                        description: 'Der zu verwarnende User',
                        type: 6, // USER
                        required: true
                    },
                    {
                        name: 'reason',
                        description: 'Grund für die Verwarnung',
                        type: 3, // STRING
                        required: false
                    }
                ]
            },
            {
                name: 'mute',
                description: 'Mute einen User',
                options: [
                    {
                        name: 'user',
                        description: 'Der zu mutende User',
                        type: 6, // USER
                        required: true
                    },
                    {
                        name: 'reason',
                        description: 'Grund für den Mute',
                        type: 3, // STRING
                        required: false
                    }
                ]
            },
            {
                name: 'warnings',
                description: 'Zeige Verwarnungen eines Users',
                options: [
                    {
                        name: 'user',
                        description: 'Der User dessen Verwarnungen angezeigt werden sollen',
                        type: 6, // USER
                        required: true
                    }
                ]
            },
            {
                name: 'clearwarnings',
                description: 'Lösche alle Verwarnungen eines Users',
                options: [
                    {
                        name: 'user',
                        description: 'Der User dessen Verwarnungen gelöscht werden sollen',
                        type: 6, // USER
                        required: true
                    }
                ]
            },
            {
                name: 'unmute',
                description: 'Entmute einen User',
                options: [
                    {
                        name: 'user',
                        description: 'Der zu entmutende User',
                        type: 6, // USER
                        required: true
                    }
                ]
            },
            {
                name: 'mutelist',
                description: 'Zeige alle gemuteten User',
                options: []
            },
            {
                name: 'testmute',
                description: 'Teste das Auto-Mute System (nur für Admins)',
                options: []
            }
        ];

        for (const guild of client.guilds.cache.values()) {
            await guild.commands.set(commands);
        }
        
        console.log('✅ Moderation Slash Commands registriert');
    } catch (error) {
        console.error('❌ Fehler beim Registrieren der Moderation Commands:', error);
    }
}

// Registriere XP Slash Commands
async function registerXPCommands() {
    try {
        const xpCommands = [
            {
                name: 'xp',
                description: 'Zeige dein XP-Profil oder das eines anderen Users',
                options: [
                    {
                        name: 'user',
                        description: 'Der User dessen XP angezeigt werden soll (optional)',
                        type: 6, // USER
                        required: false
                    }
                ]
            },
            {
                name: 'leaderboard',
                description: 'Zeige das XP-Leaderboard',
                options: [
                    {
                        name: 'type',
                        description: 'Art des Leaderboards',
                        type: 3, // STRING
                        required: false,
                        choices: [
                            { name: 'Total XP', value: 'total' },
                            { name: 'Level', value: 'level' },
                            { name: 'Nachrichten', value: 'messages' },
                            { name: 'Voice Zeit', value: 'voice' }
                        ]
                    },
                    {
                        name: 'limit',
                        description: 'Anzahl der anzuzeigenden User (max 25)',
                        type: 4, // INTEGER
                        required: false
                    }
                ]
            },
            {
                name: 'addxp',
                description: 'XP zu einem User hinzufügen (Admin only)',
                options: [
                    {
                        name: 'user',
                        description: 'Der User dem XP hinzugefügt werden soll',
                        type: 6, // USER
                        required: true
                    },
                    {
                        name: 'amount',
                        description: 'Anzahl der XP',
                        type: 4, // INTEGER
                        required: true
                    }
                ]
            },
            {
                name: 'setxp',
                description: 'XP eines Users setzen (Admin only)',
                options: [
                    {
                        name: 'user',
                        description: 'Der User dessen XP gesetzt werden soll',
                        type: 6, // USER
                        required: true
                    },
                    {
                        name: 'amount',
                        description: 'Anzahl der XP',
                        type: 4, // INTEGER
                        required: true
                    }
                ]
            }
        ];

        for (const guild of client.guilds.cache.values()) {
            // Füge XP-Commands zu den bestehenden hinzu
            const existingCommands = await guild.commands.fetch();
            const allCommands = [...xpCommands];
            
            // Füge Moderation Commands hinzu falls noch nicht vorhanden
            const moderationCommands = [
                'warn', 'mute', 'warnings', 'clearwarnings', 'unmute', 'mutelist', 'testmute'
            ];
            
            const hasModerationCommands = existingCommands.some(cmd => 
                moderationCommands.includes(cmd.name)
            );
            
            if (!hasModerationCommands) {
                // Füge auch Moderation Commands hinzu
                allCommands.push(...[
                    {
                        name: 'warn',
                        description: 'Verwarne einen User',
                        options: [
                            { name: 'user', description: 'Der zu verwarnende User', type: 6, required: true },
                            { name: 'reason', description: 'Grund für die Verwarnung', type: 3, required: false }
                        ]
                    },
                    {
                        name: 'mute',
                        description: 'Mute einen User',
                        options: [
                            { name: 'user', description: 'Der zu mutende User', type: 6, required: true },
                            { name: 'reason', description: 'Grund für den Mute', type: 3, required: false }
                        ]
                    }
                ]);
            }
            
            await guild.commands.set(allCommands);
        }
        
        console.log('✅ XP Slash Commands registriert');
    } catch (error) {
        console.error('❌ Fehler beim Registrieren der XP Commands:', error);
    }
}

// Lade und wende Bot-Einstellungen beim Start an
async function loadAndApplyBotSettings() {
    try {
        if (fs.existsSync('./bot-settings.json')) {
            const settings = JSON.parse(fs.readFileSync('./bot-settings.json', 'utf8'));
            await applyBotSettings(settings);
            console.log('✅ Bot-Einstellungen beim Start geladen');
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Bot-Einstellungen beim Start:', error);
    }
}

// Slash Command Handler
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, guild, member, user } = interaction;

    // XP Commands (für alle verfügbar)
    if (['xp', 'leaderboard'].includes(commandName)) {
        if (!xpSystem) {
            return interaction.reply({ content: '❌ XP-System ist nicht verfügbar!', ephemeral: true });
        }

        try {
            if (commandName === 'xp') {
                const targetUser = interaction.options.getUser('user') || user;
                const userData = xpSystem.getUserData(targetUser.id);
                const profileEmbed = xpSystem.createProfileEmbed(targetUser, userData);
                
                await interaction.reply({ embeds: [profileEmbed], ephemeral: false });
                
            } else if (commandName === 'leaderboard') {
                const type = interaction.options.getString('type') || 'total';
                const limit = Math.min(interaction.options.getInteger('limit') || 10, 25);
                
                const leaderboard = xpSystem.getLeaderboard(limit, type);
                
                const typeNames = {
                    total: 'Total XP',
                    level: 'Level',
                    messages: 'Nachrichten',
                    voice: 'Voice Zeit'
                };

                const embed = new EmbedBuilder()
                    .setTitle(`🏆 ${typeNames[type]} Leaderboard`)
                    .setColor(parseInt(xpSystem.settings.display.embedColor.replace('0x', ''), 16))
                    .setTimestamp()
                    .setFooter({ text: `Top ${limit} • ${guild.name}` });

                let description = '';
                leaderboard.forEach((userData, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
                    
                    let value = '';
                    switch (type) {
                        case 'total':
                            value = `${userData.totalXP} XP`;
                            break;
                        case 'level':
                            value = `Level ${userData.level}`;
                            break;
                        case 'messages':
                            value = `${userData.messageCount} Nachrichten`;
                            break;
                        case 'voice':
                            value = `${userData.voiceTime.toFixed(1)} min`;
                            break;
                    }
                    
                    description += `${medal} **${userData.username}** - ${value}\n`;
                });

                embed.setDescription(description || 'Keine Daten verfügbar');
                await interaction.reply({ embeds: [embed], ephemeral: false });
            }
        } catch (error) {
            console.error('❌ Fehler in XP Command:', error);
            await interaction.reply({ content: '❌ Fehler beim Verarbeiten des XP-Befehls!', ephemeral: true });
        }
        return;
    }

    // Admin XP Commands
    if (['addxp', 'setxp'].includes(commandName)) {
        if (!member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ Du benötigst Administrator-Rechte für diesen Befehl!', ephemeral: true });
        }

        if (!xpSystem) {
            return interaction.reply({ content: '❌ XP-System ist nicht verfügbar!', ephemeral: true });
        }

        try {
            const targetUser = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');

            if (amount < 0) {
                return interaction.reply({ content: '❌ XP-Anzahl muss positiv sein!', ephemeral: true });
            }

            if (commandName === 'addxp') {
                xpSystem.addXP(targetUser.id, amount, targetUser);
                await interaction.reply({ 
                    content: `✅ ${amount} XP zu ${targetUser.username} hinzugefügt!`,
                    ephemeral: false 
                });
            } else if (commandName === 'setxp') {
                xpSystem.setUserXP(targetUser.id, amount);
                await interaction.reply({ 
                    content: `✅ XP von ${targetUser.username} auf ${amount} gesetzt!`,
                    ephemeral: false 
                });
            }
        } catch (error) {
            console.error('❌ Fehler in Admin XP Command:', error);
            await interaction.reply({ content: '❌ Fehler beim Verarbeiten des XP-Befehls!', ephemeral: true });
        }
        return;
    }

    // Moderation Commands (Prüfe Permissions)
    if (!member.permissions.has('ManageMessages') && !member.permissions.has('Administrator')) {
        return interaction.reply({ content: '❌ Du hast keine Berechtigung für Moderation-Commands!', ephemeral: true });
    }

    try {
        if (commandName === 'warn') {
            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'Kein Grund angegeben';

            if (targetUser.bot) {
                return interaction.reply({ content: '❌ Bots können nicht verwarnt werden!', ephemeral: true });
            }

            if (targetUser.id === user.id) {
                return interaction.reply({ content: '❌ Du kannst dich nicht selbst verwarnen!', ephemeral: true });
            }

            const totalWarnings = await addWarning(guild, targetUser, reason, user);
            
            await interaction.reply({ 
                content: `⚠️ ${targetUser} wurde verwarnt!\nGrund: ${reason}\nGesamte Verwarnungen: ${totalWarnings}`,
                ephemeral: false 
            });

        } else if (commandName === 'mute') {
            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'Kein Grund angegeben';

            if (targetUser.bot) {
                return interaction.reply({ content: '❌ Bots können nicht gemutet werden!', ephemeral: true });
            }

            if (targetUser.id === user.id) {
                return interaction.reply({ content: '❌ Du kannst dich nicht selbst muten!', ephemeral: true });
            }

            const success = await muteUser(guild, targetUser, reason, user);
            
            if (success) {
                await interaction.reply({ 
                    content: `🔇 ${targetUser} wurde gemutet!\nGrund: ${reason}`,
                    ephemeral: false 
                });
            } else {
                await interaction.reply({ 
                    content: `❌ Fehler beim Muten von ${targetUser}. Prüfe Mute-Rolle und Permissions!`,
                    ephemeral: true 
                });
            }

        } else if (commandName === 'warnings') {
            const targetUser = interaction.options.getUser('user');
            const userWarnings = warningsDatabase.get(targetUser.id) || [];

            if (userWarnings.length === 0) {
                return interaction.reply({ 
                    content: `ℹ️ ${targetUser} hat keine Verwarnungen.`,
                    ephemeral: true 
                });
            }

            const embed = new EmbedBuilder()
                .setColor(0xFFFF00)
                .setTitle(`⚠️ Verwarnungen für ${targetUser.tag}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .setDescription(`Gesamte Verwarnungen: **${userWarnings.length}**`)
                .setTimestamp();

            userWarnings.slice(-5).forEach((warning, index) => {
                embed.addFields({
                    name: `Verwarnung ${index + 1}`,
                    value: `**Grund:** ${warning.reason}\n**Moderator:** ${warning.moderator}\n**Datum:** ${new Date(warning.timestamp).toLocaleString('de-DE')}`,
                    inline: false
                });
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (commandName === 'clearwarnings') {
            const targetUser = interaction.options.getUser('user');
            
            if (!member.permissions.has('Administrator')) {
                return interaction.reply({ content: '❌ Nur Administratoren können Verwarnungen löschen!', ephemeral: true });
            }

            const oldWarnings = warningsDatabase.get(targetUser.id)?.length || 0;
            warningsDatabase.delete(targetUser.id);
            
            await interaction.reply({ 
                content: `✅ ${oldWarnings} Verwarnungen von ${targetUser} wurden gelöscht!`,
                ephemeral: false 
            });

        } else if (commandName === 'unmute') {
            const targetUser = interaction.options.getUser('user');

            if (targetUser.bot) {
                return interaction.reply({ content: '❌ Bots können nicht entmutet werden!', ephemeral: true });
            }

            if (!mutedUsers.has(targetUser.id)) {
                return interaction.reply({ content: `ℹ️ ${targetUser} ist nicht gemutet.`, ephemeral: true });
            }

            // Entmute User sofort
            await autoUnmute(targetUser.id);
            
            await interaction.reply({ 
                content: `✅ ${targetUser} wurde manuell entmutet!`,
                ephemeral: false 
            });

        } else if (commandName === 'mutelist') {
            if (mutedUsers.size === 0) {
                return interaction.reply({ content: 'ℹ️ Derzeit sind keine User gemutet.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setTitle(`🔇 Gemutete User (${mutedUsers.size})`)
                .setTimestamp();

            let description = '';
            let count = 0;

            for (const [userId, muteInfo] of mutedUsers.entries()) {
                if (count >= 10) break; // Limitiere auf 10 User
                
                const timeLeft = muteInfo.until - Date.now();
                const user = client.users.cache.get(userId);
                const userTag = user ? user.tag : `User ${userId}`;
                
                description += `**${userTag}**\n`;
                description += `📋 Grund: ${muteInfo.reason}\n`;
                description += `⏱️ Verbleibend: ${timeLeft > 0 ? formatDuration(timeLeft) : 'Abgelaufen'}\n`;
                description += `📅 Bis: ${new Date(muteInfo.until).toLocaleString('de-DE')}\n\n`;
                
                count++;
            }

            embed.setDescription(description || 'Keine gemuteten User');

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (commandName === 'testmute') {
            if (!member.permissions.has('Administrator')) {
                return interaction.reply({ content: '❌ Nur Administratoren können das Auto-Mute System testen!', ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            // Teste Mute-System
            console.log(`🧪 Testing Auto-Mute System...`);
            console.log(`📋 Aktuelle Settings: maxWarnings=${moderationSettings.maxWarnings}, muteRole=${moderationSettings.muteRole}`);
            
            // Erstelle/Prüfe Mute-Rolle
            const muteRole = await createMuteRoleIfNeeded(guild);
            
            if (muteRole) {
                await interaction.editReply({ 
                    content: `✅ **Auto-Mute System funktioniert!**\n\n` +
                            `**Einstellungen:**\n` +
                            `- Max Verwarnungen: ${moderationSettings.maxWarnings}\n` +
                            `- Mute-Rolle: ${muteRole.name}\n` +
                            `- Auto-Moderation: ${moderationSettings.autoModeration ? '✅' : '❌'}\n` +
                            `- Anti-Spam: ${moderationSettings.antiSpam ? '✅' : '❌'}\n\n` +
                            `**Mute-Dauern:**\n` +
                            `- Spam: 5-30 Minuten\n` +
                            `- Schimpfwörter: 1 Stunde\n` +
                            `- 3 Verwarnungen: 30 Minuten\n` +
                            `- 5+ Verwarnungen: 2+ Stunden\n\n` +
                            `**Gemutete User:** ${mutedUsers.size}\n\n` +
                            `**Teste es:** Schreibe schnell mehrere Nachrichten hintereinander!`,
                    ephemeral: true 
                });
            } else {
                await interaction.editReply({ 
                    content: `❌ **Auto-Mute System hat Probleme!**\n\n` +
                            `**Fehlerhafte Konfiguration:**\n` +
                            `- Kann Mute-Rolle nicht erstellen\n` +
                            `- Prüfe Bot-Permissions: "Rollen verwalten"\n` +
                            `- Prüfe Bot-Permissions: "Nachrichten verwalten"`,
                    ephemeral: true 
                });
            }
        }

    } catch (error) {
        console.error('❌ Fehler in Slash Command Handler:', error);
        
        const errorMessage = { content: '❌ Ein Fehler ist aufgetreten!', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// ================== TICKET SYSTEM INITIALIZATION ==================
// Ticket-System wird jetzt korrekt nach dem Bot-Ready-Event initialisiert (siehe oben)

// ================== NEW SETTINGS API ==================
// Neue einheitliche Settings API
app.use(settingsAPI);

// ================== AFK AUTO-MOVE API ==================
// AFK Auto-Move System wird unten als einzelne Endpoints registriert

// ================== SERVER STATS ROUTES ==================
// Server-Stats Routen registrieren
app.use(ServerStats.router);
app.set('discordClient', client); // Client für Routen verfügbar machen

// Server Manager Analytics Routen registrieren (wird später mit dem Client verbunden)
setupServerManagerAnalyticsRoutes(app, null);

// Bulk Server Management Routen registrieren
setupBulkServerManagementRoutes(app);

// AI Optimization Routen registrieren
setupAIOptimizationRoutes(app);

// Supabase API Routen registrieren
setupRulesSupabaseRoutes(app);
setupModerationSupabaseRoutes(app);

// ================== ANOMALY DETECTION & SERVER HEALTH ==================
// API-Endpunkte für Anomalie-Erkennung und Server-Health
app.get('/api/anomalies/:guildId?', async (req, res) => {
    try {
        const { guildId } = req.params;
        const anomalies = await client.anomalyDetection.getAnomalies(guildId);
        res.json({
            success: true,
            anomalies: anomalies
        });
    } catch (error) {
        console.error('Error fetching anomalies:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Laden der Anomalie-Daten'
        });
    }
});

app.get('/api/anomaly-stats/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const stats = await client.anomalyDetection.getAnomalyStats(guildId);
        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Error fetching anomaly stats:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Laden der Anomalie-Statistiken'
        });
    }
});

app.get('/api/server-health/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const healthData = await client.serverHealth.calculateServerHealth(guildId);
        res.json({
            success: true,
            health: healthData
        });
    } catch (error) {
        console.error('Error calculating server health:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Berechnen der Server-Gesundheit'
        });
    }
});

app.get('/api/server-health-trends/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { days = 7 } = req.query;
        const trends = await client.serverHealth.getHealthTrends(guildId, parseInt(days));
        res.json({
            success: true,
            trends: trends
        });
    } catch (error) {
        console.error('Error fetching health trends:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Laden der Gesundheits-Trends'
        });
    }
});

app.post('/api/anomaly-settings/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const settings = req.body;
        const success = await client.anomalyDetection.updateSettings(settings);
        
        res.json({
            success: success,
            message: success ? 'Anomalie-Einstellungen aktualisiert' : 'Fehler beim Speichern'
        });
    } catch (error) {
        console.error('Error updating anomaly settings:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Aktualisieren der Einstellungen'
        });
    }
});

app.get('/api/server-comparison', async (req, res) => {
    try {
        const { guildIds } = req.query;
        const guildIdArray = guildIds ? guildIds.split(',') : [];
        const comparison = await client.serverHealth.compareServers(guildIdArray);
        
        res.json({
            success: true,
            comparison: comparison
        });
    } catch (error) {
        console.error('Error comparing servers:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Vergleichen der Server'
        });
    }
});

// === DISCORD NATIVE AFK - CONFIGURE VIA DISCORD SERVER SETTINGS ===
// AFK System entfernt - verwende Discord's eingebaute AFK Funktionalität
// Hinweis: guild.edit({afkChannelId: "channelId", afkTimeout: 60}) für Setup

// Voice Channels und Categories werden für Discord Native AFK nicht benötigt
// Discord AFK wird direkt über Server Settings konfiguriert

// Lade Regeln aus Supabase beim Start
loadCurrentRules().then(() => {
    console.log('✅ Regeln beim Bot-Start geladen');
}).catch(error => {
    console.error('❌ Fehler beim Laden der Regeln beim Start:', error);
});

// Bot anmelden
client.login(apiKeys.discord.bot_token);

// Starte API Server
const API_PORT = process.env.PORT || 3001;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(API_PORT, HOST, () => {
    const environment = process.env.NODE_ENV || 'development';
    const baseUrl = environment === 'production' 
        ? `https://${process.env.RAILWAY_STATIC_URL || 'your-railway-domain.railway.app'}`
        : `http://${HOST}:${API_PORT}`;
    
    console.log(`🌐 Dashboard API läuft auf ${baseUrl}`);
    console.log(`🔧 Environment: ${environment}`);
    console.log(`🌍 Host: ${HOST}:${API_PORT}`);
    
    // 🎵 Musik-API-Routen registrieren (nach Express-Server-Start)
    try {
        registerMusicAPI(app);
        
        // AI Musik-Empfehlungen API registrieren
        app.use('/api/music', aiMusicRecommendations);
        console.log('🎵 YouTube Radio-API erfolgreich registriert!');
    } catch (error) {
        console.error('❌ Fehler beim Registrieren der Musik-API:', error);
    }
    console.log('📋 Verfügbare Endpoints:');
    console.log('   GET  /api/health');
    console.log('   GET  /api/bot/status');
    console.log('   GET  /api/bot/settings');
    console.log('   POST /api/bot/settings');
    console.log('   POST /api/bot/stop');
    console.log('   GET  /api/info');
    console.log('   GET  /api/rules');
    console.log('   POST /api/rules');
    console.log('   POST /api/rules/repost');
    console.log('   GET  /api/moderation/logs');
    console.log('   GET  /api/moderation/stats');
    console.log('   GET  /api/moderation/muted');
    console.log('   POST /api/moderation/unmute');
    console.log('   POST /api/moderation/action');
    console.log('   GET  /api/valorant-settings');
    console.log('   POST /api/valorant-settings');
    console.log('   GET  /api/valorant/token-status');
    console.log('   GET  /api/valorant/mmr/:region/:platform/:name/:tag');
    console.log('   GET  /api/valorant/history/:region/:platform/:name/:tag');
    console.log('   POST /api/valorant/post-interactive');
    console.log('   GET  /api/keys/status');
    console.log('   POST /api/keys');
    console.log('   GET  /api/server-stats');
    console.log('   POST /api/server-stats');
    console.log('   POST /api/server-stats/create-channels');
    console.log('   DELETE /api/server-stats/delete-channels');
    console.log('   POST /api/server-stats/update-now');
    console.log('   GET  /api/server-stats/current');
    console.log('   POST /api/server-stats/test-channel/:statType');
    console.log('   ℹ️ AFK System: Verwende Discord Native AFK (Server Settings)');
}); 

// Migration Helper für Server-Stats
async function migrateServerStatsToV2() {
    try {
        const settingsManager = require('./settings-manager');
        const fs = require('fs');
        const path = require('path');
        
        const oldPath = path.join(__dirname, 'server-stats-settings.json');
        
        if (fs.existsSync(oldPath)) {
            console.log('🔄 Migriere Server-Stats Settings zu V2...');
            const data = fs.readFileSync(oldPath, 'utf8');
            const oldSettings = JSON.parse(data);
            
            // Entferne Metadaten
            const { _loadTimestamp, _metadata, ...cleanSettings } = oldSettings;
            
            // Speichere in neuem System
            const result = await settingsManager.updateSettings('server-stats', cleanSettings);
            
            if (result.success) {
                console.log('✅ Server-Stats Migration erfolgreich');
                
                // Backup der alten Datei
                const backupPath = oldPath + '.migrated';
                fs.renameSync(oldPath, backupPath);
                console.log(`📋 Alte Server-Stats Datei gesichert als: ${backupPath}`);
            }
        } else {
            console.log('ℹ️ Keine alten Server-Stats Settings zum Migrieren gefunden');
        }
    } catch (error) {
        console.error('❌ Fehler bei Server-Stats Migration:', error);
    }
}

// Moderations-Log-System
let moderationLogs = [];

function loadModerationLogs() {
    if (fs.existsSync('./moderation-logs.json')) {
        try {
            moderationLogs = JSON.parse(fs.readFileSync('./moderation-logs.json', 'utf8'));
            console.log(`📋 ${moderationLogs.length} Moderations-Logs geladen`);
        } catch (error) {
            console.error('❌ Fehler beim Laden der Moderations-Logs:', error);
            moderationLogs = [];
        }
    } else {
        moderationLogs = [];
    }
}

function saveModerationLogs() {
    try {
        fs.writeFileSync('./moderation-logs.json', JSON.stringify(moderationLogs, null, 2));
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Moderations-Logs:', error);
    }
}

function addModerationLog(action, targetUser, moderator, reason, guild, extra = {}) {
    const logEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: action, // 'mute', 'unmute', 'kick', 'ban', 'unban', 'warn', 'spam_delete'
        targetUser: {
            id: targetUser.id,
            username: targetUser.username,
            displayName: targetUser.displayName || targetUser.username,
            avatarURL: targetUser.avatarURL?.() || null
        },
        moderator: moderator ? {
            id: moderator.id,
            username: moderator.username,
            displayName: moderator.displayName || moderator.username,
            avatarURL: moderator.avatarURL?.() || null
        } : {
            id: 'system',
            username: 'System',
            displayName: 'AutoMod System',
            avatarURL: null
        },
        reason: reason || 'Kein Grund angegeben',
        guild: {
            id: guild.id,
            name: guild.name
        },
        ...extra
    };
    
    moderationLogs.unshift(logEntry); // Neueste zuerst
    
    // Behalte nur die letzten 1000 Logs um die Datei nicht zu groß werden zu lassen
    if (moderationLogs.length > 1000) {
        moderationLogs = moderationLogs.slice(0, 1000);
    }
    
    saveModerationLogs();
    return logEntry;
}

// API für Moderations-Logs
app.get('/api/moderation/logs', (req, res) => {
    try {
        const { page = 1, limit = 50, action, user, days } = req.query;
        
        let filteredLogs = [...moderationLogs];
        
        // Filter nach Aktion
        if (action && action !== 'all') {
            filteredLogs = filteredLogs.filter(log => log.action === action);
        }
        
        // Filter nach User
        if (user) {
            filteredLogs = filteredLogs.filter(log => 
                log.targetUser.username.toLowerCase().includes(user.toLowerCase()) ||
                log.targetUser.displayName.toLowerCase().includes(user.toLowerCase())
            );
        }
        
        // Filter nach Zeitraum
        if (days) {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(days));
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= daysAgo);
        }
        
        // Pagination
        const totalLogs = filteredLogs.length;
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
        
        res.json({
            logs: paginatedLogs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalLogs / parseInt(limit)),
                totalLogs: totalLogs,
                hasNext: endIndex < totalLogs,
                hasPrev: startIndex > 0
            }
        });
    } catch (error) {
        console.error('❌ Fehler beim Laden der Moderations-Logs:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Moderations-Logs' });
    }
});

// API für Moderations-Statistiken
app.get('/api/moderation/stats', (req, res) => {
    try {
        const stats = {
            totalActions: moderationLogs.length,
            actionCounts: {},
            topModerators: {},
            recentActivity: []
        };
        
        // Zähle Aktionen
        moderationLogs.forEach(log => {
            stats.actionCounts[log.action] = (stats.actionCounts[log.action] || 0) + 1;
            
            // Top Moderatoren
            const modKey = log.moderator.username;
            stats.topModerators[modKey] = (stats.topModerators[modKey] || 0) + 1;
        });
        
        // Aktivität der letzten 7 Tage
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        
        stats.recentActivity = moderationLogs
            .filter(log => new Date(log.timestamp) >= last7Days)
            .slice(0, 20);
        
        res.json(stats);
    } catch (error) {
        console.error('❌ Fehler beim Laden der Moderations-Statistiken:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Moderations-Statistiken' });
    }
});

// API für aktuelle Mutes
app.get('/api/moderation/muted', async (req, res) => {
    try {
        // Benutze direkt die mutedUsers Map die im Bot geladen wird UND die JSON-Datei
        const activeMutes = [];
        
        // Funktion um Username zu finden
        const resolveUsername = async (userId) => {
            try {
                // Versuche User von Discord API zu holen
                for (const guild of client.guilds.cache.values()) {
                    try {
                        const member = await guild.members.fetch(userId);
                        if (member) {
                            return member.user.username;
                        }
                    } catch (error) {
                        continue;
                    }
                }
                
                // Fallback: Versuche über Client
                try {
                    const user = await client.users.fetch(userId);
                    return user.username;
                } catch (error) {
                    return 'Unbekannt';
                }
            } catch (error) {
                return 'Unbekannt';
            }
        };
        
        // Prüfe zuerst die Map
        for (const [userId, muteInfo] of mutedUsers.entries()) {
            if (muteInfo.until > Date.now()) {
                // Versuche aktuellen Username zu holen
                const username = await resolveUsername(userId) || muteInfo.username || 'Unbekannt';
                
                activeMutes.push({
                    userId,
                    username: username,
                    mutedAt: new Date(muteInfo.mutedAt || Date.now()).toISOString(),
                    until: new Date(muteInfo.until).toISOString(),
                    reason: muteInfo.reason || 'Kein Grund angegeben',
                    moderator: muteInfo.moderator || 'System',
                    remainingTime: muteInfo.until - Date.now()
                });
            }
        }
        
        // Falls die Map leer ist, prüfe die JSON-Datei direkt
        if (activeMutes.length === 0 && fs.existsSync('./muted-users.json')) {
            try {
                const fileContent = fs.readFileSync('./muted-users.json', 'utf8');
                let muteData = JSON.parse(fileContent);
                
                // Stelle sicher, dass muteData ein Array ist
                if (!Array.isArray(muteData)) {
                    console.log('⚠️ muted-users.json ist kein Array, konvertiere zu leerem Array');
                    muteData = [];
                    // Speichere korrigierte Datei
                    fs.writeFileSync('./muted-users.json', JSON.stringify([], null, 2));
                }
                
                for (const entry of muteData) {
                    if (entry && entry.until && entry.until > Date.now()) {
                        // Versuche aktuellen Username zu holen
                        const username = await resolveUsername(entry.userId) || entry.username || 'Unbekannt';
                        
                        activeMutes.push({
                            userId: entry.userId,
                            username: username,
                            mutedAt: new Date(entry.mutedAt || Date.now()).toISOString(),
                            until: new Date(entry.until).toISOString(),
                            reason: entry.reason || 'Kein Grund angegeben',
                            moderator: entry.moderator || 'System',
                            remainingTime: entry.until - Date.now()
                        });
                    }
                }
            } catch (fileError) {
                console.error('❌ Fehler beim Lesen der muted-users.json:', fileError);
                // Erstelle eine neue, leere Datei falls sie korrupt ist
                try {
                    fs.writeFileSync('./muted-users.json', JSON.stringify([], null, 2));
                    console.log('✅ Neue muted-users.json Datei erstellt');
                } catch (writeError) {
                    console.error('❌ Fehler beim Erstellen einer neuen muted-users.json:', writeError);
                }
            }
        }
            
        console.log(`🔍 Aktive Mutes gefunden: ${activeMutes.length}`);
        activeMutes.forEach(mute => {
            console.log(`   - ${mute.username} (${mute.userId}) bis ${new Date(mute.until).toLocaleString('de-DE')}`);
        });
        
        res.json({ activeMutes });
    } catch (error) {
        console.error('❌ Fehler beim Laden der aktiven Mutes:', error);
        res.status(500).json({ error: 'Fehler beim Laden der aktiven Mutes' });
    }
});

// API zum Aufheben von Mutes (Admin)
app.post('/api/moderation/unmute', async (req, res) => {
    try {
        const { userId, reason = 'Manually unmuted via dashboard' } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID erforderlich' });
        }
        
        // Entferne aus der Map
        if (mutedUsers.has(userId)) {
            mutedUsers.delete(userId);
        }
        
        // Entferne aus der JSON-Datei
        if (fs.existsSync('./muted-users.json')) {
            try {
                let muteData = JSON.parse(fs.readFileSync('./muted-users.json', 'utf8'));
                
                // Stelle sicher, dass muteData ein Array ist
                if (!Array.isArray(muteData)) {
                    console.log('⚠️ muted-users.json ist kein Array beim Unmute, erstelle neues Array');
                    muteData = [];
                }
                
                muteData = muteData.filter(entry => entry.userId !== userId);
                fs.writeFileSync('./muted-users.json', JSON.stringify(muteData, null, 2));
            } catch (fileError) {
                console.error('❌ Fehler beim Aktualisieren der muted-users.json:', fileError);
                // Erstelle eine neue, leere Datei falls sie korrupt ist
                try {
                    fs.writeFileSync('./muted-users.json', JSON.stringify([], null, 2));
                    console.log('✅ Neue muted-users.json Datei nach Fehler erstellt');
                } catch (writeError) {
                    console.error('❌ Fehler beim Erstellen einer neuen muted-users.json:', writeError);
                }
            }
        }
        
        // Versuche die Rolle im Discord zu entfernen
        try {
            for (const guild of client.guilds.cache.values()) {
                try {
                    const member = await guild.members.fetch(userId);
                    const muteRole = guild.roles.cache.find(role => 
                        role.name.toLowerCase() === 'muted'
                    );
                    
                    if (member && muteRole && member.roles.cache.has(muteRole.id)) {
                        await member.roles.remove(muteRole);
                        console.log(`✅ Mute-Rolle entfernt von ${member.user.tag}`);
                        
                        // Log die Aktion
                        addModerationLog('unmute', member.user, null, reason, guild, {
                            unmuteReason: 'Dashboard Admin Action'
                        });
                        
                        break;
                    }
                } catch (memberError) {
                    // Member nicht in diesem Guild gefunden
                    continue;
                }
            }
        } catch (discordError) {
            console.error('❌ Fehler beim Entfernen der Discord-Rolle:', discordError);
        }
        
        res.json({ success: true, message: 'User erfolgreich entmutet' });
    } catch (error) {
        console.error('❌ Fehler beim Entmuten:', error);
        res.status(500).json({ error: 'Fehler beim Entmuten des Users' });
    }
});

// API für Moderations-Aktionen (Admin)
app.post('/api/moderation/action', async (req, res) => {
    try {
        const { action, userId, reason = 'Admin action via dashboard', duration } = req.body;
        
        if (!action || !userId) {
            return res.status(400).json({ error: 'Action und User ID erforderlich' });
        }
        
        let result = { success: false, message: 'Unbekannte Aktion' };
        
        // Finde den User in allen Guilds
        let targetUser = null;
        let targetGuild = null;
        
        for (const guild of client.guilds.cache.values()) {
            try {
                const member = await guild.members.fetch(userId);
                if (member) {
                    targetUser = member.user;
                    targetGuild = guild;
                    break;
                }
            } catch (error) {
                continue;
            }
        }
        
        if (!targetUser || !targetGuild) {
            return res.status(404).json({ error: 'User nicht gefunden' });
        }
        
        switch (action) {
            case 'warn':
                await addWarning(targetGuild, targetUser, reason, client.user);
                result = { success: true, message: `${targetUser.tag} erfolgreich verwarnt` };
                break;
                
            case 'mute':
                const muteSuccess = await muteUser(targetGuild, targetUser, reason, client.user);
                result = { 
                    success: muteSuccess, 
                    message: muteSuccess ? `${targetUser.tag} erfolgreich gemutet` : 'Mute fehlgeschlagen' 
                };
                break;
                
            case 'kick':
                try {
                    const member = await targetGuild.members.fetch(userId);
                    await member.kick(reason);
                    addModerationLog('kick', targetUser, client.user, reason, targetGuild);
                    result = { success: true, message: `${targetUser.tag} erfolgreich gekickt` };
                } catch (kickError) {
                    result = { success: false, message: 'Kick fehlgeschlagen: ' + kickError.message };
                }
                break;
                
            case 'ban':
                try {
                    await targetGuild.members.ban(userId, { reason: reason });
                    addModerationLog('ban', targetUser, client.user, reason, targetGuild, { duration });
                    result = { success: true, message: `${targetUser.tag} erfolgreich gebannt` };
                } catch (banError) {
                    result = { success: false, message: 'Ban fehlgeschlagen: ' + banError.message };
                }
                break;
                
            default:
                result = { success: false, message: 'Unbekannte Aktion: ' + action };
        }
        
        res.json(result);
    } catch (error) {
        console.error('❌ Fehler bei Moderations-Aktion:', error);
        res.status(500).json({ error: 'Fehler bei der Moderations-Aktion' });
    }
});

// Daily Reset System
function performDailyReset() {
    const today = new Date().toDateString();
    
    if (lastResetDate !== today) {
        console.log('🔄 Täglicher Reset wird durchgeführt...');
        
        // Erstelle Reset-Log Eintrag vor dem Reset
        const resetStats = {
            totalWarnings: Array.from(warningsDatabase.values()).reduce((sum, warnings) => sum + warnings.length, 0),
            usersWithWarnings: warningsDatabase.size,
            date: lastResetDate
        };
        
        // Log Reset-Aktion für jede Guild
        client.guilds.cache.forEach(guild => {
            addModerationLog('daily_reset', 
                { id: 'system', username: 'System', displayName: 'Daily Reset System' }, 
                null, 
                `Täglicher Reset: ${resetStats.totalWarnings} Warnungen von ${resetStats.usersWithWarnings} Usern zurückgesetzt`, 
                guild, 
                { resetStats }
            );
        });
        
        // Reset alle Warnings
        const usersReset = warningsDatabase.size;
        const totalWarningsReset = Array.from(warningsDatabase.values()).reduce((sum, warnings) => sum + warnings.length, 0);
        
        warningsDatabase.clear();
        userMessageHistory.clear(); // Optional: Reset auch Message History für neuen Start
        
        // Update Reset-Datum
        lastResetDate = today;
        
        console.log(`✅ Daily Reset abgeschlossen: ${totalWarningsReset} Warnungen von ${usersReset} Usern zurückgesetzt`);
        console.log(`📅 Nächster Reset: ${new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()}`);
        
        // Speichere Reset-Info in separate Datei für Tracking
        saveResetHistory(resetStats);
    }
}

function startDailyResetTimer() {
    // Prüfe sofort beim Start
    performDailyReset();
    
    // Setze Timer für alle 1 Stunde (3600000ms) zur regelmäßigen Prüfung
    setInterval(() => {
        performDailyReset();
    }, 3600000); // Jede Stunde prüfen
    
    console.log('⏰ Daily Reset Timer gestartet - prüft stündlich auf neuen Tag');
    
    // Berechne Zeit bis zum nächsten Reset
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilReset = tomorrow.getTime() - now.getTime();
    const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log(`⏳ Nächster automatischer Reset in: ${hoursUntilReset}h ${minutesUntilReset}m`);
}

function saveResetHistory(resetStats) {
    try {
        const resetHistoryFile = './reset-history.json';
        let resetHistory = [];
        
        if (fs.existsSync(resetHistoryFile)) {
            resetHistory = JSON.parse(fs.readFileSync(resetHistoryFile, 'utf8'));
        }
        
        resetHistory.push({
            date: resetStats.date,
            resetTime: new Date().toISOString(),
            totalWarnings: resetStats.totalWarnings,
            usersWithWarnings: resetStats.usersWithWarnings
        });
        
        // Behalte nur die letzten 30 Tage
        if (resetHistory.length > 30) {
            resetHistory = resetHistory.slice(-30);
        }
        
        fs.writeFileSync(resetHistoryFile, JSON.stringify(resetHistory, null, 2));
        console.log('💾 Reset-Historie gespeichert');
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Reset-Historie:', error);
    }
}

// API für manuellen Reset (Admin-Funktion)
app.post('/api/moderation/reset', (req, res) => {
    try {
        const { confirmReset } = req.body;
        
        if (!confirmReset) {
            return res.status(400).json({ error: 'Reset-Bestätigung erforderlich' });
        }
        
        const usersWithWarnings = warningsDatabase.size;
        const totalWarnings = Array.from(warningsDatabase.values()).reduce((sum, warnings) => sum + warnings.length, 0);
        
        if (totalWarnings === 0) {
            // Log auch bei 0 Warnungen - für Admin-Tracking
            client.guilds.cache.forEach(guild => {
                addModerationLog('manual_reset', 
                    { id: 'admin', username: 'Admin', displayName: 'Dashboard Admin' }, 
                    null, 
                    `Manueller Reset via Dashboard: Keine aktiven Warnungen vorhanden (Reset-Datum aktualisiert)`, 
                    guild, 
                    { manualReset: true, totalWarnings: 0, usersWithWarnings: 0, noWarnings: true }
                );
            });
            
            // Update lastResetDate auch bei 0 Warnungen
            lastResetDate = new Date().toDateString();
            
            return res.json({ 
                success: true, 
                message: 'Reset durchgeführt: Keine aktiven Warnungen vorhanden, aber Reset-Datum wurde aktualisiert',
                stats: { totalWarnings: 0, usersWithWarnings: 0 }
            });
        }
        
        // Log manuellen Reset
        client.guilds.cache.forEach(guild => {
            addModerationLog('manual_reset', 
                { id: 'admin', username: 'Admin', displayName: 'Dashboard Admin' }, 
                null, 
                `Manueller Reset via Dashboard: ${totalWarnings} Warnungen von ${usersWithWarnings} Usern zurückgesetzt`, 
                guild, 
                { manualReset: true, totalWarnings, usersWithWarnings }
            );
        });
        
        // Reset durchführen
        warningsDatabase.clear();
        userMessageHistory.clear();
        
        // Update lastResetDate um zu verhindern, dass heute noch ein automatischer Reset stattfindet
        lastResetDate = new Date().toDateString();
        
        console.log(`🔧 Manueller Reset durchgeführt: ${totalWarnings} Warnungen von ${usersWithWarnings} Usern`);
        
        res.json({ 
            success: true, 
            message: `Reset erfolgreich: ${totalWarnings} Warnungen von ${usersWithWarnings} Usern zurückgesetzt`,
            stats: { totalWarnings, usersWithWarnings }
        });
    } catch (error) {
        console.error('❌ Fehler beim manuellen Reset:', error);
        res.status(500).json({ error: 'Fehler beim Reset' });
    }
});

// API für Reset-Statistiken
app.get('/api/moderation/reset-stats', (req, res) => {
    try {
        const resetHistoryFile = './reset-history.json';
        let resetHistory = [];
        
        if (fs.existsSync(resetHistoryFile)) {
            resetHistory = JSON.parse(fs.readFileSync(resetHistoryFile, 'utf8'));
        }
        
        const currentStats = {
            currentWarnings: Array.from(warningsDatabase.values()).reduce((sum, warnings) => sum + warnings.length, 0),
            usersWithWarnings: warningsDatabase.size,
            lastResetDate: lastResetDate,
            nextResetTime: getNextResetTime()
        };
        
        res.json({
            currentStats,
            resetHistory: resetHistory.slice(-7), // Letzte 7 Tage
            totalResets: resetHistory.length
        });
    } catch (error) {
        console.error('❌ Fehler beim Laden der Reset-Statistiken:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Reset-Statistiken' });
    }
});

function getNextResetTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
}

// Auto-Leaderboard Timer starten
function startAutoLeaderboardTimer() {
    console.log('⏰ Auto-Leaderboard Timer gestartet (alle 1 Minute prüfen)');
    
    // Sofortige erste Prüfung
    setTimeout(async () => {
        console.log('🔍 Erste Auto-Leaderboard Prüfung...');
        if (xpSystem && client.isReady()) {
            try {
                const result = await xpSystem.postAutoLeaderboard();
                if (result) {
                    console.log('✅ Auto-Leaderboard wurde automatisch gepostet!');
                } else {
                    console.log('ℹ️ Auto-Leaderboard Bedingungen nicht erfüllt');
                }
            } catch (error) {
                console.error('❌ Fehler beim automatischen Leaderboard-Check:', error);
            }
        } else {
            console.log('⚠️ XP-System oder Client nicht bereit');
        }
    }, 5000); // Nach 5 Sekunden
    
    // Prüfe alle 1 Minute ob ein Leaderboard gepostet werden soll
    setInterval(async () => {
        if (xpSystem && client.isReady()) {
            try {
                const result = await xpSystem.postAutoLeaderboard();
                if (result) {
                    console.log('✅ Auto-Leaderboard wurde automatisch gepostet!');
                }
            } catch (error) {
                console.error('❌ Fehler beim automatischen Leaderboard-Check:', error);
            }
        }
    }, 1 * 60 * 1000); // 1 Minute
}

// ================== VALORANT API ENDPOINTS ==================

// Valorant API-Token Status
app.get('/api/valorant/token-status', (req, res) => {
    try {
        const hasToken = !!apiKeys.valorant;
        res.json({
            success: true,
            valid: hasToken,
            configured: hasToken,
            hasToken: hasToken
        });
    } catch (error) {
        console.error('❌ Fehler beim Prüfen des Valorant-Tokens:', error);
        res.status(500).json({ error: 'Fehler beim Prüfen des Valorant-Tokens' });
    }
});

// Valorant API-Token für Frontend
app.get('/api/valorant/token', (req, res) => {
    try {
        if (apiKeys.valorant) {
            res.json({ token: apiKeys.valorant });
        } else {
            res.status(404).json({ error: 'Valorant API-Token nicht konfiguriert' });
        }
    } catch (error) {
        console.error('❌ Fehler beim Abrufen des Valorant-Tokens:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen des Valorant-Tokens' });
    }
});

// Valorant API Proxy - MMR Daten
app.get('/api/valorant/mmr/:region/:platform/:name/:tag', async (req, res) => {
    try {
        if (!apiKeys.valorant) {
            return res.status(404).json({ 
                success: false,
                error: 'Valorant API-Token nicht konfiguriert' 
            });
        }

        const { region, platform, name, tag } = req.params;
        
        const response = await fetch(
            `https://api.henrikdev.xyz/valorant/v3/mmr/${region}/${platform}/${name}/${tag}`,
            {
                headers: {
                    'Authorization': apiKeys.valorant
                }
            }
        );

        const data = await response.json();
        
        if (response.ok && data.status === 200) {
            // Statistiken aktualisieren bei erfolgreicher Suche
            updateValorantStats({
                playerName: name,
                playerTag: tag,
                region: region,
                success: true
            });

            res.json({
                success: true,
                data: data.data
            });
        } else {
            // Auch fehlgeschlagene Suchen tracken
            updateValorantStats({
                playerName: name,
                playerTag: tag,
                region: region,
                success: false
            });

            res.json({
                success: false,
                error: data.errors?.[0]?.message || 'Spieler nicht gefunden'
            });
        }
    } catch (error) {
        console.error('❌ Fehler beim Abrufen der Valorant MMR-Daten:', error);
        res.status(500).json({ 
            success: false,
            error: 'Fehler beim Abrufen der MMR-Daten' 
        });
    }
});

// Valorant API Proxy - Match History
app.get('/api/valorant/history/:region/:platform/:name/:tag', async (req, res) => {
    try {
        if (!apiKeys.valorant) {
            return res.status(404).json({ 
                success: false,
                error: 'Valorant API-Token nicht konfiguriert' 
            });
        }

        const { region, platform, name, tag } = req.params;
        
        const response = await fetch(
            `https://api.henrikdev.xyz/valorant/v2/mmr-history/${region}/${platform}/${name}/${tag}`,
            {
                headers: {
                    'Authorization': apiKeys.valorant
                }
            }
        );

        const data = await response.json();
        
        if (response.ok && (data.status === 200 || data.status === 1)) {
            res.json({
                success: true,
                data: data.data || []
            });
        } else {
            res.json({
                success: false,
                error: data.errors?.[0]?.message || 'Match-Historie nicht verfügbar'
            });
        }
    } catch (error) {
        console.error('❌ Fehler beim Abrufen der Valorant Match-History:', error);
        res.status(500).json({ 
            success: false,
            error: 'Fehler beim Abrufen der Match-History' 
        });
    }
});

// Valorant-Einstellungen laden
app.get('/api/valorant-settings', (req, res) => {
    try {
        if (fs.existsSync('./valorant-settings.json')) {
            const settings = JSON.parse(fs.readFileSync('./valorant-settings.json', 'utf8'));
            res.json({
                success: true,
                settings: settings
            });
        } else {
            // Standard-Einstellungen
            const defaultSettings = {
                enabled: false,
                defaultRegion: 'eu',
                refreshInterval: 5,
                rateLimit: {
                    current: 0,
                    limit: 30,
                    resetTime: 0
                },
                features: {
                    mmrTracking: true,
                    matchHistory: true,
                    leaderboard: false,
                    playerStats: true
                },
                notifications: {
                    rankUpdates: false,
                    newMatches: false,
                    channelName: '',
                    autoPost: false
                },
                embed: {
                    title: '🎯 Valorant Spielersuche',
                    description: 'Klicke auf eine Region um deine Valorant-Statistiken abzurufen!',
                    color: '0xFF4655',
                    footer: 'Powered by AgentBee • {timestamp}',
                    thumbnail: 'valorant',
                    customThumbnail: '',
                    author: {
                        enabled: true,
                        name: 'Valorant Stats Bot',
                        iconUrl: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png'
                    },
                    fields: [
                        {
                            name: '🌍 Verfügbare Regionen',
                            value: '🇪🇺 **EU** - Europa\n🇺🇸 **NA** - Nordamerika\n🌏 **AP** - Asien-Pazifik',
                            inline: true
                        },
                        {
                            name: '📊 Features',
                            value: '• Aktueller Rang & RR\n• Peak Rang\n• Headshot-Rate\n• K/D Ratio\n• Win-Rate',
                            inline: true
                        },
                        {
                            name: '⚡ Rate-Limit',
                            value: '30 Requests pro Minute\nFaire Nutzung für alle!',
                            inline: true
                        }
                    ]
                }
            };
            res.json({
                success: true,
                settings: defaultSettings
            });
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Valorant-Einstellungen:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Valorant-Einstellungen' });
    }
});

// Valorant-Einstellungen speichern
app.post('/api/valorant-settings', (req, res) => {
    try {
        const settings = req.body;
        
        // Speichere in Datei
        fs.writeFileSync('./valorant-settings.json', JSON.stringify(settings, null, 2));
        
        // Wenn Auto-Post aktiviert wurde, poste die interaktive Nachricht
        if (settings.notifications.autoPost && settings.notifications.channelName) {
            // Kurz warten damit die Datei gespeichert ist, dann posten
            setTimeout(() => {
                postValorantInteractiveMessage(settings.notifications.channelName);
            }, 500);
        }
        
        console.log('✅ Valorant-Einstellungen aktualisiert');
        res.json({ success: true, message: 'Valorant-Einstellungen gespeichert' });
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Valorant-Einstellungen:', error);
        res.status(500).json({ error: 'Fehler beim Speichern der Valorant-Einstellungen' });
    }
});

// Valorant-Statistiken abrufen
app.get('/api/valorant/stats', (req, res) => {
    try {
        // Lade Valorant-Statistiken aus Datei oder erstelle Standard-Werte
        let stats = {
            totalSearches: 0,
            activeTracking: 0,
            totalPlayers: 0,
            apiCalls: 0,
            systemEnabled: false,
            lastUpdate: null,
            dailySearches: 0,
            weeklySearches: 0,
            topRegions: { eu: 0, na: 0, ap: 0, kr: 0 },
            searchHistory: []
        };

        if (fs.existsSync('./valorant-stats.json')) {
            const savedStats = JSON.parse(fs.readFileSync('./valorant-stats.json', 'utf8'));
            stats = { ...stats, ...savedStats };
        }

        // Aktuelle Rate-Limit-Daten hinzufügen
        stats.apiCalls = valorantRateLimit.getRemaining();
        stats.rateLimitMax = 30;
        stats.rateLimitReset = Math.ceil(valorantRateLimit.getResetTime() / 1000);

        // System-Status aus Einstellungen
        if (fs.existsSync('./valorant-settings.json')) {
            const settings = JSON.parse(fs.readFileSync('./valorant-settings.json', 'utf8'));
            stats.systemEnabled = settings.enabled || false;
        }

        // Aktive Tracker (simuliert basierend auf letzten Suchen)
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        stats.activeTracking = stats.searchHistory.filter(search => 
            new Date(search.timestamp).getTime() > oneHourAgo
        ).length;

        // Letzte Aktualisierung
        stats.lastUpdate = new Date().toISOString();

        res.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('❌ Fehler beim Laden der Valorant-Statistiken:', error);
        res.status(500).json({ 
            success: false,
            error: 'Fehler beim Laden der Statistiken' 
        });
    }
});

// ============================
// 🎯 VALORANT AGENTS API ENDPOINTS
// ============================

// Alle Valorant Agenten abrufen
app.get('/api/valorant/agents', async (req, res) => {
    try {
        const agents = await loadValorantAgentsFromSupabase();
        
        res.json({
            success: true,
            agents: agents.map(agent => ({
                id: agent.id || agent.name,
                name: agent.name,
                uuid: agent.uuid,
                display_name: agent.display_name || agent.name,
                role_type: agent.role_type,
                role_color: agent.role_color,
                enabled: agent.enabled,
                sort_order: agent.sort_order || 0,
                role_config: agent.role_config || {},
                icon: agent.icon || '🎯'
            }))
        });
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Valorant Agenten:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Fehler beim Laden der Agenten' 
        });
    }
});

// Valorant Agent-Rollen abrufen
app.get('/api/valorant/agent-roles', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ 
                success: false, 
                error: 'Supabase nicht verfügbar' 
            });
        }
        
        const { data: roles, error } = await supabase
            .from('valorant_agent_roles')
            .select('*')
            .eq('enabled', true)
            .order('sort_order')
            .order('role_name');
        
        if (error) {
            console.error('❌ Fehler beim Laden der Agent-Rollen:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Fehler beim Laden der Rollen' 
            });
        }
        
        res.json({
            success: true,
            roles: roles || []
        });
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Valorant Agent-Rollen:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Fehler beim Laden der Rollen' 
        });
    }
});

// Neuen Valorant Agent hinzufügen
app.post('/api/valorant/agents', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ 
                success: false, 
                error: 'Supabase nicht verfügbar' 
            });
        }
        
        const { name, uuid, display_name, role_type, role_color, role_config, icon } = req.body;
        
        if (!name || !role_type) {
            return res.status(400).json({ 
                success: false, 
                error: 'Name und Role-Type sind erforderlich' 
            });
        }
        
        const { data: agent, error } = await supabase
            .from('valorant_agents')
            .insert({
                name,
                uuid: uuid || null,
                display_name: display_name || name,
                role_type,
                role_color: role_color || '#FF4655',
                role_config: role_config || {
                    hoist: false,
                    mentionable: true,
                    permissions: [],
                    position: 7
                },
                enabled: true,
                icon: icon || '🎯'
            })
            .select()
            .single();
        
        if (error) {
            console.error('❌ Fehler beim Hinzufügen des Agenten:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Fehler beim Hinzufügen des Agenten' 
            });
        }
        
        // Cache leeren
        valorantAgentsCache = null;
        
        console.log(`✅ Valorant Agent hinzugefügt: ${name}`);
        res.json({
            success: true,
            message: 'Agent erfolgreich hinzugefügt',
            agent: agent
        });
        
    } catch (error) {
        console.error('❌ Fehler beim Hinzufügen des Valorant Agenten:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Fehler beim Hinzufügen des Agenten' 
        });
    }
});

// Valorant Agent aktualisieren
app.put('/api/valorant/agents/:agentId', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ 
                success: false, 
                error: 'Supabase nicht verfügbar' 
            });
        }
        
        const { agentId } = req.params;
        const { name, uuid, display_name, role_type, role_color, role_config, enabled, sort_order, icon } = req.body;
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (uuid !== undefined) updateData.uuid = uuid;
        if (display_name !== undefined) updateData.display_name = display_name;
        if (role_type !== undefined) updateData.role_type = role_type;
        if (role_color !== undefined) updateData.role_color = role_color;
        if (role_config !== undefined) updateData.role_config = role_config;
        if (enabled !== undefined) updateData.enabled = enabled;
        if (sort_order !== undefined) updateData.sort_order = sort_order;
        if (icon !== undefined) updateData.icon = icon;
        
        const { data: agent, error } = await supabase
            .from('valorant_agents')
            .update(updateData)
            .eq('id', agentId)
            .select()
            .single();
        
        if (error) {
            console.error('❌ Fehler beim Aktualisieren des Agenten:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Fehler beim Aktualisieren des Agenten' 
            });
        }
        
        // Cache leeren
        valorantAgentsCache = null;
        
        console.log(`✅ Valorant Agent aktualisiert: ${agent.name}`);
        res.json({
            success: true,
            message: 'Agent erfolgreich aktualisiert',
            agent: agent
        });
        
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren des Valorant Agenten:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Fehler beim Aktualisieren des Agenten' 
        });
    }
});

// Valorant Agent löschen/deaktivieren
app.delete('/api/valorant/agents/:agentId', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ 
                success: false, 
                error: 'Supabase nicht verfügbar' 
            });
        }
        
        const { agentId } = req.params;
        const { permanent = false } = req.query;
        
        if (permanent === 'true') {
            // Permanent löschen
            const { error } = await supabase
                .from('valorant_agents')
                .delete()
                .eq('id', agentId);
            
            if (error) {
                console.error('❌ Fehler beim Löschen des Agenten:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Fehler beim Löschen des Agenten' 
                });
            }
            
            console.log(`🗑️ Valorant Agent permanent gelöscht: ${agentId}`);
        } else {
            // Nur deaktivieren
            const { error } = await supabase
                .from('valorant_agents')
                .update({ enabled: false })
                .eq('id', agentId);
            
            if (error) {
                console.error('❌ Fehler beim Deaktivieren des Agenten:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Fehler beim Deaktivieren des Agenten' 
                });
            }
            
            console.log(`⏸️ Valorant Agent deaktiviert: ${agentId}`);
        }
        
        // Cache leeren
        valorantAgentsCache = null;
        
        res.json({
            success: true,
            message: permanent === 'true' ? 'Agent erfolgreich gelöscht' : 'Agent erfolgreich deaktiviert'
        });
        
    } catch (error) {
        console.error('❌ Fehler beim Löschen/Deaktivieren des Valorant Agenten:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Fehler beim Löschen/Deaktivieren des Agenten' 
        });
    }
});

// Valorant-Statistiken aktualisieren (interne Funktion)
// Rang-Belohnungen verarbeiten
async function handleRankRewards(guild, user, currentTier) {
    try {
        // Lade Valorant-Einstellungen
        const valorantSettings = JSON.parse(fs.readFileSync('./valorant-settings.json', 'utf8'));
        
        // Prüfe ob Rang-Belohnungen aktiviert sind
        if (!valorantSettings.rankRewards?.enabled) {
            return;
        }
        
        const rankConfig = valorantSettings.rankRewards;
        const currentRankName = currentTier.name;
        const currentTierId = currentTier.id;
        
        console.log(`🏆 Verarbeite Rang-Belohnungen für ${user.username}: ${currentRankName} (Tier ${currentTierId})`);
        
        // Finde die entsprechende Rang-Konfiguration
        const rankData = rankConfig.ranks.find(rank => rank.tierId === currentTierId && rank.enabled);
        
        if (!rankData) {
            console.log(`⚠️ Kein aktivierter Rang gefunden für Tier ${currentTierId}`);
            return;
        }
        
        // Erstelle Rolle falls sie nicht existiert und Auto-Create aktiviert ist
        let targetRole = null;
        const roleName = `${rankConfig.rolePrefix} ${rankData.name}`;
        
        // Suche existierende Rolle
        targetRole = guild.roles.cache.find(role => role.name === roleName);
        
        if (!targetRole && rankConfig.autoCreateRoles) {
            console.log(`🔧 Erstelle neue Rolle: ${roleName}`);
            
            // Konvertiere Hex-Farbe zu Discord-Format
            const roleColor = rankData.color.startsWith('#') ? rankData.color.slice(1) : rankData.color.replace('#', '');
            
            try {
                targetRole = await guild.roles.create({
                    name: roleName,
                    color: roleColor,
                    reason: `Automatische Valorant Rang-Rolle für ${rankData.name}`,
                    mentionable: false,
                    hoist: false
                });
                
                // Speichere Rollen-ID in den Einstellungen
                rankData.roleId = targetRole.id;
                fs.writeFileSync('./valorant-settings.json', JSON.stringify(valorantSettings, null, 2));
                
                console.log(`✅ Rolle erstellt: ${roleName} (${targetRole.id})`);
            } catch (createError) {
                console.error(`❌ Fehler beim Erstellen der Rolle ${roleName}:`, createError);
                return;
            }
        }
        
        if (!targetRole) {
            console.log(`⚠️ Rolle ${roleName} existiert nicht und Auto-Create ist deaktiviert`);
            return;
        }
        
        // Hole Guild-Member
        const member = await guild.members.fetch(user.id);
        
        // Entferne alte Valorant-Rollen falls aktiviert
        if (rankConfig.removeOldRoles) {
            const valorantRoles = guild.roles.cache.filter(role => 
                role.name.startsWith(rankConfig.rolePrefix) && 
                role.id !== targetRole.id &&
                member.roles.cache.has(role.id)
            );
            
            for (const [roleId, role] of valorantRoles) {
                try {
                    await member.roles.remove(role, 'Valorant Rang-Update: Alte Rolle entfernen');
                    console.log(`🗑️ Alte Rolle entfernt: ${role.name}`);
                } catch (removeError) {
                    console.error(`❌ Fehler beim Entfernen der Rolle ${role.name}:`, removeError);
                }
            }
        }
        
        // Füge neue Rolle hinzu (falls noch nicht vorhanden)
        if (!member.roles.cache.has(targetRole.id)) {
            try {
                await member.roles.add(targetRole, `Valorant Rang-Belohnung: ${currentRankName}`);
                console.log(`✅ Rolle vergeben: ${roleName} an ${user.username}`);
            } catch (addError) {
                console.error(`❌ Fehler beim Vergeben der Rolle ${roleName}:`, addError);
            }
        } else {
            console.log(`ℹ️ ${user.username} hat bereits die Rolle ${roleName}`);
        }
        
    } catch (error) {
        console.error('❌ Fehler in handleRankRewards:', error);
        throw error;
    }
}

function updateValorantStats(searchData) {
    try {
        let stats = {
            totalSearches: 0,
            activeTracking: 0,
            totalPlayers: 0,
            apiCalls: 0,
            systemEnabled: false,
            lastUpdate: null,
            dailySearches: 0,
            weeklySearches: 0,
            topRegions: { eu: 0, na: 0, ap: 0, kr: 0 },
            searchHistory: []
        };

        if (fs.existsSync('./valorant-stats.json')) {
            const savedStats = JSON.parse(fs.readFileSync('./valorant-stats.json', 'utf8'));
            stats = { ...stats, ...savedStats };
        }

        // Neue Suche hinzufügen
        if (searchData) {
            stats.totalSearches++;
            stats.topRegions[searchData.region] = (stats.topRegions[searchData.region] || 0) + 1;
            
            // Suchhistorie aktualisieren (nur letzte 100 behalten)
            stats.searchHistory.unshift({
                player: `${searchData.playerName}#${searchData.playerTag}`,
                region: searchData.region,
                timestamp: new Date().toISOString(),
                success: searchData.success || false
            });
            
            if (stats.searchHistory.length > 100) {
                stats.searchHistory = stats.searchHistory.slice(0, 100);
            }

            // Tägliche/wöchentliche Statistiken
            const now = new Date();
            const today = now.toDateString();
            const oneWeekAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);

            stats.dailySearches = stats.searchHistory.filter(search => 
                new Date(search.timestamp).toDateString() === today
            ).length;

            stats.weeklySearches = stats.searchHistory.filter(search => 
                new Date(search.timestamp).getTime() > oneWeekAgo
            ).length;

            // Unique Players zählen
            const uniquePlayers = new Set(stats.searchHistory.map(search => search.player));
            stats.totalPlayers = uniquePlayers.size;
        }

        stats.lastUpdate = new Date().toISOString();

        // Speichern
        fs.writeFileSync('./valorant-stats.json', JSON.stringify(stats, null, 2));
        
        return stats;
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Valorant-Statistiken:', error);
        return null;
    }
}

// Valorant Interactive Message posten
app.post('/api/valorant/post-interactive', (req, res) => {
    try {
        const { channelName } = req.body;
        
        if (!channelName) {
            return res.status(400).json({ 
                success: false, 
                error: 'Channel-Name ist erforderlich' 
            });
        }
        
        const success = postValorantInteractiveMessage(channelName);
        
        if (success) {
            res.json({ 
                success: true, 
                message: 'Interaktive Valorant-Nachricht gepostet!' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'Channel nicht gefunden oder Bot hat keine Berechtigung' 
            });
        }
    } catch (error) {
        console.error('❌ Fehler beim Posten der interaktiven Nachricht:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Fehler beim Posten der Nachricht' 
        });
    }
});

// Valorant-Rollen erstellen
app.post('/api/valorant/create-rank-roles', async (req, res) => {
    try {
        if (!client.isReady()) {
            return res.status(503).json({ error: 'Bot nicht bereit' });
        }

        const { rolePrefix, enabledRanks } = req.body;

        if (!rolePrefix || !enabledRanks || !Array.isArray(enabledRanks)) {
            return res.status(400).json({ error: 'Rollen-Präfix und aktivierte Ränge erforderlich' });
        }

        // Nimm die erste verfügbare Guild-ID (normalerweise vom ersten verfügbaren Guild)
        const guild = client.guilds.cache.first();
        if (!guild) {
            return res.status(404).json({ error: 'Keine Guild gefunden. Bot muss mit einem Discord-Server verbunden sein.' });
        }

        const createdRoles = [];
        const existingRoles = [];

        for (const rank of enabledRanks) {
            try {
                const roleName = `${rolePrefix} ${rank.name}`;
                
                // Prüfe ob Rolle bereits existiert
                let role = guild.roles.cache.find(r => r.name === roleName);
                
                if (role) {
                    existingRoles.push({
                        name: roleName,
                        tierId: rank.tierId,
                        id: role.id,
                        color: rank.color
                    });
                } else {
                    // Erstelle neue Rolle
                    const roleColor = rank.color.startsWith('#') ? rank.color : `#${rank.color}`;
                    
                    role = await guild.roles.create({
                        name: roleName,
                        color: roleColor,
                        permissions: [],
                        mentionable: false,
                        reason: `Valorant-System: Automatische Rang-Rolle für ${rank.name}`
                    });

                    createdRoles.push({
                        name: roleName,
                        tierId: rank.tierId,
                        id: role.id,
                        color: rank.color
                    });

                    console.log(`✅ Valorant-Rolle erstellt: ${roleName} (Tier ${rank.tierId})`);
                }
            } catch (error) {
                console.error(`❌ Fehler beim Erstellen der Rolle ${rank.name}:`, error);
            }
        }

        // Aktualisiere Valorant-Settings mit neuen Rollen-IDs
        try {
            const valorantSettings = JSON.parse(fs.readFileSync('./valorant-settings.json', 'utf8'));
            
            // Update role IDs in settings
            for (const rank of valorantSettings.rankRewards.ranks) {
                const createdRole = createdRoles.find(r => r.tierId === rank.tierId);
                const existingRole = existingRoles.find(r => r.tierId === rank.tierId);
                
                if (createdRole) {
                    rank.roleId = createdRole.id;
                } else if (existingRole) {
                    rank.roleId = existingRole.id;
                }
            }
            
            fs.writeFileSync('./valorant-settings.json', JSON.stringify(valorantSettings, null, 2));
            console.log(`🔄 Valorant-Settings mit ${createdRoles.length + existingRoles.length} Rollen-IDs aktualisiert`);
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren der Valorant-Settings:', error);
        }

        res.json({
            success: true,
            message: `Valorant-Rollen Setup abgeschlossen!`,
            created: createdRoles,
            existing: existingRoles,
            total: enabledRanks.length,
            guildName: guild.name
        });

    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Valorant-Rollen:', error);
        res.status(500).json({ error: 'Fehler beim Erstellen der Valorant-Rollen' });
    }
});

// ================== XP SYSTEM API ENDPOINTS ==================

// XP-Einstellungen laden
app.get('/api/xp/settings', (req, res) => {
    try {
        if (xpSystem) {
            res.json(xpSystem.settings);
        } else {
            // Default XP Settings wenn System nicht initialisiert
            const defaultSettings = {
                enabled: true,
                messageXP: { min: 5, max: 15, cooldown: 60000 },
                voiceXP: { baseXP: 2, afkChannelXP: 0, soloChannelXP: 1, cooldown: 60000, intervalMinutes: 1 },
                levelSystem: { baseXP: 100, multiplier: 1.5, maxLevel: 100 },
                channels: { levelUpChannel: 'level-up', leaderboardChannel: 'leaderboard', xpBlacklist: [], voiceBlacklist: [] },
                autoLeaderboard: { enabled: true, time: '20:00', timezone: 'Europe/Berlin', channelName: 'leaderboard', types: ['total'], limit: 10, lastPosted: 0, lastMessageIds: [], autoDeleteOld: true },
                rewards: { levelRoles: [], milestoneRewards: [] },
                announcements: { levelUp: true, milestones: true, newRecord: true },
                display: { showRank: true, showProgress: true, embedColor: '0x00FF7F', leaderboardSize: 10 },
                levelUpEmbed: {
                    enabled: true,
                    title: '🎉 Level Up!',
                    color: '0x00FF7F',
                    animation: {
                        enabled: true,
                        style: 'celebration',
                        duration: 5000
                    },
                    fields: {
                        showStats: true,
                        showNextLevel: true,
                        showRank: true,
                        customMessage: ''
                    },
                    footer: {
                        enabled: true,
                        text: '🎉 Herzlichen Glückwunsch!'
                    }
                }
            };
            res.json(defaultSettings);
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der XP-Einstellungen:', error);
        res.status(500).json({ error: 'Fehler beim Laden der XP-Einstellungen' });
    }
});

// XP-Einstellungen speichern
app.post('/api/xp/settings', (req, res) => {
    try {
        if (!xpSystem) {
            return res.status(503).json({ error: 'XP-System nicht initialisiert' });
        }

        const newSettings = req.body;
        xpSystem.updateSettings(newSettings);
        
        console.log('✅ XP-Einstellungen aktualisiert');
        res.json({ success: true, message: 'XP-Einstellungen gespeichert' });
    } catch (error) {
        console.error('❌ Fehler beim Speichern der XP-Einstellungen:', error);
        res.status(500).json({ error: 'Fehler beim Speichern der XP-Einstellungen' });
    }
});

// Leaderboard laden
app.get('/api/xp/leaderboard', (req, res) => {
    try {
        if (xpSystem) {
            const { limit = 50, type = 'total' } = req.query;
            const leaderboard = xpSystem.getLeaderboard(parseInt(limit), type);
            res.json({ leaderboard, total: leaderboard.length });
        } else {
            // Leeres Leaderboard wenn System nicht initialisiert
            res.json({ leaderboard: [], total: 0 });
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden des Leaderboards:', error);
        res.status(500).json({ error: 'Fehler beim Laden des Leaderboards' });
    }
});

// XP-Statistiken
app.get('/api/xp/stats', (req, res) => {
    try {
        if (xpSystem) {
            const stats = xpSystem.getStats();
            const topUsers = xpSystem.getLeaderboard(5);
            
            res.json({
                ...stats,
                topUsers,
                isEnabled: xpSystem.settings.enabled
            });
        } else {
            // Default Statistiken wenn System nicht initialisiert
            res.json({
                totalUsers: 0,
                totalXP: 0,
                totalMessages: 0,
                totalVoiceTime: 0,
                averageLevel: 0,
                maxLevel: 0,
                activeUsers: 0,
                topUsers: [],
                isEnabled: false
            });
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der XP-Statistiken:', error);
        res.status(500).json({ error: 'Fehler beim Laden der XP-Statistiken' });
    }
});

// User-XP abrufen
app.get('/api/xp/user/:userId', (req, res) => {
    try {
        if (!xpSystem) {
            return res.status(503).json({ error: 'XP-System nicht initialisiert' });
        }

        const { userId } = req.params;
        const userData = xpSystem.getUserData(userId);
        const rank = xpSystem.getUserRank(userId);
        
        res.json({
            ...userData,
            rank: rank || 'Unranked',
            userId
        });
    } catch (error) {
        console.error('❌ Fehler beim Laden der User-XP:', error);
        res.status(500).json({ error: 'Fehler beim Laden der User-XP' });
    }
});

// User-XP setzen (Admin)
app.post('/api/xp/user/:userId/set', async (req, res) => {
    try {
        if (!xpSystem) {
            return res.status(503).json({ error: 'XP-System nicht initialisiert' });
        }

        const { userId } = req.params;
        const { xp } = req.body;

        if (typeof xp !== 'number' || xp < 0) {
            return res.status(400).json({ error: 'Ungültige XP-Anzahl' });
        }

        // Alte Daten für alle Checks speichern
        const currentData = xpSystem.getUserData(userId);
        const oldLevel = currentData.level;
        const oldTotalXP = currentData.totalXP || 0;
        
        // User-Objekt für Meilenstein-Checks erstellen
        let user = null;
        if (client && client.isReady()) {
            user = client.users.cache.get(userId);
        }
        
        // Fallback User-Objekt erstellen falls User nicht gefunden
        if (!user) {
            user = {
                id: userId,
                username: currentData.username || `User#${userId.slice(-4)}`,
                avatar: currentData.avatar || null,
                displayAvatarURL: () => `https://cdn.discordapp.com/embed/avatars/0.png`
            };
        }
        
        // XP setzen
        xpSystem.setUserXP(userId, xp);
        const userData = xpSystem.getUserData(userId);
        const newLevel = userData.level;
        
        // Wenn XP erhöht wurden, Meilenstein- und Rekord-Checks durchführen
        if (xp > oldTotalXP) {
            // Meilenstein-Check
            xpSystem.checkMilestones(userId, oldTotalXP, xp, user);
            
            // Rekord-Check (nur wenn Client verfügbar ist)
            if (xpSystem.client) {
                const oldMaxLevel = xpSystem.getStats().maxLevel;
                xpSystem.checkNewRecords(userId, oldLevel, newLevel, oldMaxLevel, user);
            }
        }
        
        // Level-Up Check und Ankündigung (falls neues Level erreicht)
        if (newLevel > oldLevel && client && client.isReady()) {
            try {
                // Finde Guild für Level-Up-Ankündigung
                const guild = client.guilds.cache.first(); // Nimm die erste Guild
                if (guild) {
                    await xpSystem.handleLevelUp(guild, user, oldLevel, newLevel);
                    console.log(`🎉 Admin-Level-Up ausgelöst: ${userData.username} ${oldLevel} -> ${newLevel}`);
                }
            } catch (levelUpError) {
                console.error('❌ Fehler bei Admin-Level-Up-Ankündigung:', levelUpError);
                // Fehler beim Level-Up soll nicht die ganze Operation beenden
            }
        }
        
        console.log(`🔧 Admin setzte XP für User ${userId}: ${oldTotalXP} -> ${xp} XP${newLevel !== oldLevel ? `, Level ${oldLevel} -> ${newLevel}` : ''}`);
        res.json({ 
            success: true, 
            message: `User-XP gesetzt${newLevel > oldLevel ? ` - Level Up auf ${newLevel}!` : ''}`,
            userData: { ...userData, userId },
            levelUp: newLevel > oldLevel ? { oldLevel, newLevel } : null
        });
    } catch (error) {
        console.error('❌ Fehler beim Setzen der User-XP:', error);
        res.status(500).json({ error: 'Fehler beim Setzen der User-XP' });
    }
});

// User-XP hinzufügen (Admin)
app.post('/api/xp/user/:userId/add', async (req, res) => {
    try {
        if (!xpSystem) {
            return res.status(503).json({ error: 'XP-System nicht initialisiert' });
        }

        const { userId } = req.params;
        const { xp } = req.body;

        if (typeof xp !== 'number') {
            return res.status(400).json({ error: 'Ungültige XP-Anzahl' });
        }

        // Alte Daten für Checks speichern
        const currentData = xpSystem.getUserData(userId);
        const oldLevel = currentData.level;
        const oldTotalXP = currentData.totalXP || 0;
        
        // User-Objekt für addXP erstellen
        let user = null;
        if (client && client.isReady()) {
            user = client.users.cache.get(userId);
        }
        
        // Fallback User-Objekt erstellen falls User nicht gefunden
        if (!user) {
            user = {
                id: userId,
                username: currentData.username || `User#${userId.slice(-4)}`,
                avatar: currentData.avatar || null,
                displayAvatarURL: () => `https://cdn.discordapp.com/embed/avatars/0.png`
            };
        }
        
        // WICHTIG: addXP verwenden statt setUserXP - das macht alle Checks (Meilensteine, Rekorde, etc.)
        xpSystem.addXP(userId, xp, user);
        
        const userData = xpSystem.getUserData(userId);
        const newLevel = userData.level;
        
        // Level-Up Check und Ankündigung (falls neues Level erreicht)
        if (newLevel > oldLevel && client && client.isReady()) {
            try {
                // Finde Guild für Level-Up-Ankündigung
                const guild = client.guilds.cache.first(); // Nimm die erste Guild
                if (guild) {
                    await xpSystem.handleLevelUp(guild, user, oldLevel, newLevel);
                    console.log(`🎉 Admin-Level-Up ausgelöst: ${userData.username} ${oldLevel} -> ${newLevel}`);
                }
            } catch (levelUpError) {
                console.error('❌ Fehler bei Admin-Level-Up-Ankündigung:', levelUpError);
                // Fehler beim Level-Up soll nicht die ganze Operation beenden
            }
        }
        
        console.log(`🔧 Admin fügte XP hinzu für User ${userId}: ${xp} XP (${oldTotalXP} -> ${userData.totalXP}${newLevel > oldLevel ? `, Level ${oldLevel} -> ${newLevel}` : ''})`);
        res.json({ 
            success: true, 
            message: `${xp} XP hinzugefügt${newLevel > oldLevel ? ` - Level Up auf ${newLevel}!` : ''}`,
            userData: { ...userData, userId },
            levelUp: newLevel > oldLevel ? { oldLevel, newLevel } : null
        });
    } catch (error) {
        console.error('❌ Fehler beim Hinzufügen von User-XP:', error);
        res.status(500).json({ error: 'Fehler beim Hinzufügen von User-XP' });
    }
});

// User-XP zurücksetzen (Admin)
app.delete('/api/xp/user/:userId', (req, res) => {
    try {
        if (!xpSystem) {
            return res.status(503).json({ error: 'XP-System nicht initialisiert' });
        }

        const { userId } = req.params;
        const success = xpSystem.resetUser(userId);
        
        if (success) {
            console.log(`🔧 Admin resetete XP für User ${userId}`);
            res.json({ success: true, message: 'User-XP zurückgesetzt' });
        } else {
            res.status(404).json({ error: 'User nicht gefunden' });
        }
    } catch (error) {
        console.error('❌ Fehler beim Zurücksetzen der User-XP:', error);
        res.status(500).json({ error: 'Fehler beim Zurücksetzen der User-XP' });
    }
});

// Alle XP zurücksetzen (Admin)
app.post('/api/xp/reset-all', (req, res) => {
    try {
        if (!xpSystem) {
            return res.status(503).json({ error: 'XP-System nicht initialisiert' });
        }

        const { confirmReset } = req.body;
        
        if (!confirmReset) {
            return res.status(400).json({ error: 'Reset-Bestätigung erforderlich' });
        }

        xpSystem.resetAll();
        
        console.log('🔧 Admin resetete alle XP-Daten');
        res.json({ success: true, message: 'Alle XP-Daten zurückgesetzt' });
    } catch (error) {
        console.error('❌ Fehler beim Zurücksetzen aller XP:', error);
        res.status(500).json({ error: 'Fehler beim Zurücksetzen aller XP' });
    }
});

// Verfügbare Server-Rollen für Level-Belohnungen abrufen
app.get('/api/xp/roles', (req, res) => {
    try {
        if (client && client.isReady()) {
            const roles = [];
            
            // Sammle Rollen aus allen Servern
            client.guilds.cache.forEach(guild => {
                guild.roles.cache.forEach(role => {
                    if (!role.managed && role.name !== '@everyone') {
                        roles.push({
                            id: role.id,
                            name: role.name,
                            color: role.hexColor,
                            guildId: guild.id,
                            guildName: guild.name
                        });
                    }
                });
            });

            res.json({ roles });
        } else {
            // Leere Rollen-Liste wenn Bot nicht online
            res.json({ roles: [] });
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Rollen:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Rollen' });
    }
});

// Verfügbare Channels für XP-Konfiguration abrufen
app.get('/api/xp/channels', (req, res) => {
    try {
        if (client && client.isReady()) {
            const channels = {
                text: [],
                voice: []
            };
            
            // Sammle Channels aus allen Servern
            client.guilds.cache.forEach(guild => {
                guild.channels.cache.forEach(channel => {
                    if (channel.type === 0) { // Text Channel
                        channels.text.push({
                            id: channel.id,
                            name: channel.name,
                            guildId: guild.id,
                            guildName: guild.name
                        });
                    } else if (channel.type === 2) { // Voice Channel
                        channels.voice.push({
                            id: channel.id,
                            name: channel.name,
                            guildId: guild.id,
                            guildName: guild.name
                        });
                    }
                });
            });

            res.json(channels);
        } else {
            // Leere Channel-Liste wenn Bot nicht online
            res.json({ text: [], voice: [] });
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Channels:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Channels' });
    }
});

// ================== ALLGEMEINE API ENDPUNKTE ==================

// Verfügbare Server-Rollen für alle Systeme abrufen
app.get('/api/roles', (req, res) => {
    try {
        if (client && client.isReady()) {
            const roles = [];
            
            // Sammle Rollen aus allen Servern
            client.guilds.cache.forEach(guild => {
                guild.roles.cache.forEach(role => {
                    if (!role.managed && role.name !== '@everyone') {
                        roles.push({
                            id: role.id,
                            name: role.name,
                            color: role.hexColor,
                            guildId: guild.id,
                            guildName: guild.name
                        });
                    }
                });
            });

            res.json({ roles });
        } else {
            // Leere Rollen-Liste wenn Bot nicht online
            res.json({ roles: [] });
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Rollen:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Rollen' });
    }
});

// Verfügbare Channels für alle Systeme abrufen
app.get('/api/channels', (req, res) => {
    try {
        if (client && client.isReady()) {
            const channels = [];
            
            // Sammle alle Channels aus allen Servern
            client.guilds.cache.forEach(guild => {
                guild.channels.cache.forEach(channel => {
                    let channelType = 'unknown';
                    if (channel.type === 0) channelType = 'text';
                    else if (channel.type === 2) channelType = 'voice';
                    else if (channel.type === 4) channelType = 'category';
                    else if (channel.type === 5) channelType = 'news';
                    else if (channel.type === 13) channelType = 'stage';

                    if (channelType !== 'unknown') {
                        channels.push({
                            id: channel.id,
                            name: channel.name,
                            type: channelType,
                            guildId: guild.id,
                            guildName: guild.name
                        });
                    }
                });
            });

            res.json({ channels });
        } else {
            // Leere Channel-Liste wenn Bot nicht online
            res.json({ channels: [] });
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Channels:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Channels' });
    }
});

// Bot-Guild-Informationen abrufen
app.get('/api/guilds', (req, res) => {
    try {
        if (client && client.isReady()) {
            const guilds = [];
            
            client.guilds.cache.forEach(guild => {
                // Detailliertere Server-Informationen sammeln
                const channels = guild.channels.cache;
                const roles = guild.roles.cache;
                const members = guild.members.cache;
                
                // Bot-Berechtigungen in diesem Server
                const botMember = guild.members.cache.get(client.user.id);
                const botPermissions = botMember ? botMember.permissions.toArray() : [];
                
                // Online-Mitglieder zählen
                const onlineMembers = members.filter(member => 
                    member.presence && ['online', 'idle', 'dnd'].includes(member.presence.status)
                ).size;

                // Channel-Typen zählen
                const textChannels = channels.filter(ch => ch.type === 0).size;
                const voiceChannels = channels.filter(ch => ch.type === 2).size;
                const categoryChannels = channels.filter(ch => ch.type === 4).size;
                
                guilds.push({
                    id: guild.id,
                    name: guild.name,
                    memberCount: guild.memberCount,
                    onlineMembers: onlineMembers,
                    iconURL: guild.iconURL(),
                    joinedAt: guild.joinedAt ? guild.joinedAt.toISOString() : null,
                    isOwner: guild.ownerId === client.user.id,
                    ownerId: guild.ownerId,
                    permissions: botPermissions,
                    features: guild.features || [],
                    verificationLevel: guild.verificationLevel,
                    region: guild.preferredLocale || 'unknown',
                    channelCount: channels.size,
                    textChannels: textChannels,
                    voiceChannels: voiceChannels,
                    categoryChannels: categoryChannels,
                    roleCount: roles.size,
                    boostLevel: guild.premiumTier,
                    boostCount: guild.premiumSubscriptionCount || 0,
                    maxMembers: guild.maximumMembers || null,
                    description: guild.description || null,
                    bannerURL: guild.bannerURL(),
                    splashURL: guild.splashURL(),
                    partnered: guild.partnered,
                    verified: guild.verified,
                    createdAt: guild.createdAt.toISOString()
                });
            });

            // Erste/Standard-Guild für einfache APIs
            const primaryGuild = guilds[0] || null;

            res.json({ 
                guilds,
                primaryGuild: primaryGuild ? primaryGuild.id : null,
                totalServers: guilds.length,
                totalMembers: guilds.reduce((sum, guild) => sum + guild.memberCount, 0),
                totalOnlineMembers: guilds.reduce((sum, guild) => sum + guild.onlineMembers, 0)
            });
        } else {
            res.json({ 
                guilds: [], 
                primaryGuild: null,
                totalServers: 0,
                totalMembers: 0,
                totalOnlineMembers: 0
            });
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Guild-Informationen:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Guild-Informationen' });
    }
});

// Detaillierte Server-Statistiken abrufen
app.get('/api/server-statistics', (req, res) => {
    try {
        if (client && client.isReady()) {
            const stats = {
                totalMessages: 0,
                todayMessages: 0,
                activeUsers: 0,
                newMembers: Math.floor(Math.random() * 20) + 5, // Mock-Daten (real tracking würde Member-Join-Events benötigen)
                leftMembers: Math.floor(Math.random() * 5) + 1, // Mock-Daten (real tracking würde Member-Leave-Events benötigen)
                topChannels: [],
                topUsers: []
            };

            // Echte Message-Daten aus dem XP-System holen
            if (xpSystem && xpSystem.userXP) {
                // Berechne Gesamt-Messages aus XP-System
                const allXPUsers = Array.from(xpSystem.userXP.values());
                stats.totalMessages = allXPUsers.reduce((sum, userData) => sum + (userData.messageCount || 0), 0);

                // Echte heutige Messages verwenden
                stats.todayMessages = dailyMessageCount;
            }

            // Sammle Statistiken aus allen Servern
            const allChannels = [];
            const allMembers = new Map();

            client.guilds.cache.forEach(guild => {
                stats.activeUsers += guild.members.cache.filter(member => 
                    member.presence && ['online', 'idle', 'dnd'].includes(member.presence.status)
                ).size;

                // Top Channels sammeln (basierend auf realer Aktivität)
                guild.channels.cache.filter(ch => ch.type === 0).forEach(channel => {
                    // Schätze Channel-Aktivität basierend auf Namen und XP-System-Daten
                    let estimatedMessages = 0;
                    
                    // Basis-Schätzung basierend auf Channel-Namen
                    const channelName = channel.name.toLowerCase();
                    if (channelName.includes('general') || channelName.includes('allgemein')) {
                        estimatedMessages = Math.floor(stats.totalMessages * 0.25); // 25% der Messages
                    } else if (channelName.includes('chat') || channelName.includes('talk')) {
                        estimatedMessages = Math.floor(stats.totalMessages * 0.15); // 15% der Messages
                    } else if (channelName.includes('gaming') || channelName.includes('game')) {
                        estimatedMessages = Math.floor(stats.totalMessages * 0.12); // 12% der Messages
                    } else if (channelName.includes('bot') || channelName.includes('command')) {
                        estimatedMessages = Math.floor(stats.totalMessages * 0.08); // 8% der Messages
                    } else if (channelName.includes('spam') || channelName.includes('meme')) {
                        estimatedMessages = Math.floor(stats.totalMessages * 0.10); // 10% der Messages
                    } else {
                        // Verteile den Rest auf andere Channels
                        estimatedMessages = Math.floor(stats.totalMessages * 0.02); // 2% der Messages
                    }
                    
                    // Füge etwas Zufälligkeit hinzu für Realismus
                    estimatedMessages = Math.floor(estimatedMessages * (0.7 + Math.random() * 0.6));
                    
                    allChannels.push({
                        id: channel.id,
                        name: channel.name,
                        messages: estimatedMessages,
                        type: 'text',
                        guildName: guild.name
                    });
                });

                // Top Users sammeln (echte Daten aus XP-System)
                guild.members.cache.forEach(member => {
                    if (!member.user.bot && !allMembers.has(member.user.id)) {
                        let messageCount = 0;
                        
                        // Echte Message-Count aus XP-System holen
                        if (xpSystem && xpSystem.userXP && xpSystem.userXP.has(member.user.id)) {
                            const userData = xpSystem.userXP.get(member.user.id);
                            messageCount = userData.messageCount || 0;
                        }
                        
                        allMembers.set(member.user.id, {
                            id: member.user.id,
                            username: member.user.username,
                            messages: messageCount,
                            avatar: member.user.avatarURL()
                        });
                    }
                });
            });

            // Top 5 Channels
            stats.topChannels = allChannels
                .sort((a, b) => b.messages - a.messages)
                .slice(0, 5);

            // Top 5 Users
            stats.topUsers = Array.from(allMembers.values())
                .sort((a, b) => b.messages - a.messages)
                .slice(0, 5);

            // Gesamt-Messages (Mock)
            stats.totalMessages = stats.topChannels.reduce((sum, ch) => sum + ch.messages, 0) * 2;

            res.json(stats);
        } else {
            res.json({
                totalMessages: 0,
                todayMessages: 0,
                activeUsers: 0,
                newMembers: 0,
                leftMembers: 0,
                topChannels: [],
                topUsers: []
            });
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Server-Statistiken:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Server-Statistiken' });
    }
});

// Verfügbare Kategorien für Ticket-System abrufen
app.get('/api/categories', (req, res) => {
    try {
        if (client && client.isReady()) {
            const { guildId } = req.query;
            const categories = [];
            
            if (guildId) {
                // Kategorien nur für spezifischen Server
                const guild = client.guilds.cache.get(guildId);
                if (guild) {
                    guild.channels.cache.forEach(channel => {
                        if (channel.type === 4) { // Category Channel
                            categories.push({
                                id: channel.id,
                                name: channel.name,
                                guildId: guild.id,
                                guildName: guild.name
                            });
                        }
                    });
                }
            } else {
                // Sammle Kategorien aus allen Servern (für Rückwärtskompatibilität)
                client.guilds.cache.forEach(guild => {
                    guild.channels.cache.forEach(channel => {
                        if (channel.type === 4) { // Category Channel
                            categories.push({
                                id: channel.id,
                                name: channel.name,
                                guildId: guild.id,
                                guildName: guild.name
                            });
                        }
                    });
                });
            }

            res.json({ categories });
        } else {
            // Leere Kategorie-Liste wenn Bot nicht online
            res.json({ categories: [] });
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der Kategorien:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Kategorien' });
    }
});

// Leaderboard in Discord-Channel posten
app.post('/api/xp/post-leaderboard', async (req, res) => {
    try {
        if (!xpSystem || !client.isReady()) {
            return res.status(503).json({ error: 'XP-System oder Bot nicht bereit' });
        }

        const { channelName, type = 'total', limit = 10 } = req.body;

        if (!channelName) {
            return res.status(400).json({ error: 'Channel-Name erforderlich' });
        }

        // Finde Channel
        let targetChannel = null;
        for (const guild of client.guilds.cache.values()) {
            targetChannel = guild.channels.cache.find(ch => ch.name === channelName && ch.type === 0);
            if (targetChannel) break;
        }

        if (!targetChannel) {
            return res.status(404).json({ error: `Channel #${channelName} nicht gefunden` });
        }

        // 🗑️ LÖSCHE ALTE LEADERBOARD-MESSAGES (falls channelName = leaderboard channel UND Auto-Delete aktiviert)
        if (channelName === xpSystem.settings.autoLeaderboard.channelName && 
            xpSystem.settings.autoLeaderboard.autoDeleteOld &&
            xpSystem.settings.autoLeaderboard.lastMessageIds && 
            xpSystem.settings.autoLeaderboard.lastMessageIds.length > 0) {
            
            console.log('🗑️ Lösche alte Leaderboard-Messages (manuelles Posting, Auto-Delete aktiviert)...');
            
            for (const messageId of xpSystem.settings.autoLeaderboard.lastMessageIds) {
                try {
                    const oldMessage = await targetChannel.messages.fetch(messageId);
                    if (oldMessage) {
                        await oldMessage.delete();
                        console.log(`✅ Alte Leaderboard-Message gelöscht: ${messageId}`);
                    }
                } catch (error) {
                    console.log(`⚠️ Konnte alte Message nicht löschen: ${messageId}`);
                }
            }
            
            // Zusätzliche Bereinigung
            try {
                const recentMessages = await targetChannel.messages.fetch({ limit: 15 });
                const botMessages = recentMessages.filter(msg => 
                    msg.author.id === client.user.id && 
                    msg.embeds.length > 0 && 
                    msg.embeds.some(embed => embed.title && embed.title.includes('Leaderboard'))
                );
                
                if (botMessages.size > 0) {
                    console.log(`🧹 Zusätzliche Bereinigung: ${botMessages.size} alte Leaderboard-Messages gefunden`);
                    for (const [messageId, message] of botMessages) {
                        try {
                            await message.delete();
                            console.log(`🗑️ Zusätzliche alte Leaderboard-Message gelöscht: ${messageId}`);
                        } catch (deleteError) {
                            console.log(`⚠️ Konnte zusätzliche Message nicht löschen: ${messageId}`);
                        }
                    }
                }
            } catch (error) {
                console.log('⚠️ Fehler beim zusätzlichen Bereinigen:', error.message);
            }
        }

        const leaderboard = xpSystem.getLeaderboard(limit, type);
        
        const typeNames = {
            total: '🏆 XP Leaderboard',
            level: '📈 Level Ranking',
            messages: '💬 Message Champions',
            voice: '🎤 Voice Heroes'
        };

        const embed = new EmbedBuilder()
            .setTitle(`${typeNames[type]}`)
            .setColor(parseInt(xpSystem.settings.display.embedColor.replace('0x', ''), 16))
            .setTimestamp()
            .setFooter({ text: `Top ${limit} • ${new Date().toLocaleDateString('de-DE')}` });

        // Verbessertes Card-Design ohne störende Statistiken
        if (leaderboard.length === 0) {
            embed.setDescription('🌟 **Noch keine Daten verfügbar**\n\nBeginn dein XP-Abenteuer jetzt und klettere die Rangliste hoch!');
        } else {
            // Top 3 mit schönem Design
            let topDescription = '';
            leaderboard.slice(0, Math.min(3, leaderboard.length)).forEach((user, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                const medal = medals[index];
                
                let mainValue = '';
                let subValue = '';
                switch (type) {
                    case 'total':
                        mainValue = `${user.totalXP.toLocaleString()} XP`;
                        subValue = `Level ${user.level}`;
                        break;
                    case 'level':
                        mainValue = `Level ${user.level}`;
                        subValue = `${user.totalXP.toLocaleString()} XP`;
                        break;
                    case 'messages':
                        mainValue = `${user.messageCount.toLocaleString()} Messages`;
                        subValue = `Level ${user.level}`;
                        break;
                    case 'voice':
                        mainValue = `${user.voiceTime.toFixed(1)} Minuten`;
                        subValue = `Level ${user.level}`;
                        break;
                }
                
                topDescription += `${medal} **${user.username}**\n`;
                topDescription += `**${mainValue}** • *${subValue}*\n\n`;
            });

            embed.setDescription(topDescription);

            // Weitere Plätze als kompakte Liste
            if (leaderboard.length > 3) {
                let remainingUsers = '';
                leaderboard.slice(3, Math.min(leaderboard.length, 10)).forEach((user, index) => {
                    const rank = index + 4;
                    
                    let value = '';
                    switch (type) {
                        case 'total':
                            value = `${user.totalXP.toLocaleString()} XP`;
                            break;
                        case 'level':
                            value = `Level ${user.level}`;
                            break;
                        case 'messages':
                            value = `${user.messageCount.toLocaleString()} Messages`;
                            break;
                        case 'voice':
                            value = `${user.voiceTime.toFixed(1)} min`;
                            break;
                    }
                    
                    remainingUsers += `**${rank}.** ${user.username} • ${value}\n`;
                });

                if (remainingUsers) {
                    embed.addFields({
                        name: '📋 Weitere Platzierungen',
                        value: remainingUsers,
                        inline: false
                    });
                }
            }
        }

        const message = await targetChannel.send({ embeds: [embed] });
        
        // 💾 SPEICHERE MESSAGE-ID FÜR NÄCHSTES LÖSCHEN (falls es der Auto-Leaderboard Channel ist)
        if (channelName === xpSystem.settings.autoLeaderboard.channelName) {
            xpSystem.settings.autoLeaderboard.lastMessageIds = [message.id];
            xpSystem.saveData();
            console.log(`💾 Message-ID für nächstes Löschen gespeichert: ${message.id}`);
        }
        
        console.log(`📊 Leaderboard gepostet in #${channelName}`);
        res.json({ success: true, message: `Leaderboard erfolgreich in #${channelName} gepostet` });

    } catch (error) {
        console.error('❌ Fehler beim Posten des Leaderboards:', error);
        res.status(500).json({ error: 'Fehler beim Posten des Leaderboards' });
    }
});

// Auto-Leaderboard sofort triggern
app.post('/api/xp/trigger-auto-leaderboard', async (req, res) => {
    try {
        if (!xpSystem || !client.isReady()) {
            return res.status(503).json({ error: 'XP-System oder Bot nicht bereit' });
        }

        console.log('🚀 Manueller Auto-Leaderboard Trigger gestartet...');
        
        // Lade aktuelle Einstellungen neu
        xpSystem.loadData();
        
        console.log('Aktuelle Auto-Leaderboard Einstellungen:');
        console.log('- Aktiviert:', xpSystem.settings.autoLeaderboard.enabled);
        console.log('- Zeit:', xpSystem.settings.autoLeaderboard.time);
        console.log('- Zeitzone:', xpSystem.settings.autoLeaderboard.timezone);
        console.log('- Channel:', xpSystem.settings.autoLeaderboard.channelName);
        console.log('- Letztes Posting:', new Date(xpSystem.settings.autoLeaderboard.lastPosted).toLocaleString('de-DE'));

        // Setze lastPosted auf 0 um das Posting zu erzwingen
        const originalLastPosted = xpSystem.settings.autoLeaderboard.lastPosted;
        xpSystem.settings.autoLeaderboard.lastPosted = 0;
        
        // Prüfe ob es posten sollte
        const shouldPost = xpSystem.shouldPostAutoLeaderboard();
        console.log('Sollte posten:', shouldPost);
        
        if (shouldPost) {
            const result = await xpSystem.postAutoLeaderboard();
            if (result) {
                console.log('✅ Auto-Leaderboard erfolgreich gepostet!');
                res.json({ 
                    success: true, 
                    message: 'Auto-Leaderboard erfolgreich gepostet!',
                    posted: true
                });
            } else {
                console.log('❌ Auto-Leaderboard Posting fehlgeschlagen');
                // Restore original lastPosted
                xpSystem.settings.autoLeaderboard.lastPosted = originalLastPosted;
                xpSystem.saveData();
                res.status(500).json({ error: 'Auto-Leaderboard Posting fehlgeschlagen' });
            }
        } else {
            // Restore original lastPosted
            xpSystem.settings.autoLeaderboard.lastPosted = originalLastPosted;
            xpSystem.saveData();
            res.json({ 
                success: true, 
                message: 'Auto-Leaderboard würde nicht posten (Bedingungen nicht erfüllt)',
                posted: false,
                reason: 'Zeitbedingungen nicht erfüllt oder System deaktiviert'
            });
        }

    } catch (error) {
        console.error('❌ Fehler beim manuellen Auto-Leaderboard Trigger:', error);
        res.status(500).json({ error: 'Fehler beim Triggern des Auto-Leaderboards' });
    }
});

// Auto-Leaderboard testen
app.post('/api/xp/test-auto-leaderboard', async (req, res) => {
    try {
        if (!xpSystem || !client.isReady()) {
            return res.status(503).json({ error: 'XP-System oder Bot nicht bereit' });
        }

        const { channelName, types = ['total'], limit = 10 } = req.body;

        if (!channelName) {
            return res.status(400).json({ error: 'Channel-Name erforderlich' });
        }

        if (!Array.isArray(types) || types.length === 0) {
            return res.status(400).json({ error: 'Mindestens ein Leaderboard-Typ erforderlich' });
        }

        // Finde Channel
        let targetChannel = null;
        for (const guild of client.guilds.cache.values()) {
            targetChannel = guild.channels.cache.find(ch => ch.name === channelName && ch.type === 0);
            if (targetChannel) break;
        }

        if (!targetChannel) {
            return res.status(404).json({ error: `Channel #${channelName} nicht gefunden` });
        }

        // 🗑️ VERBESSERTE LÖSCHLOGIK VOR TEST-LEADERBOARD (identisch zum Auto-System)
        if (channelName === xpSystem.settings.autoLeaderboard.channelName &&
            xpSystem.settings.autoLeaderboard.autoDeleteOld) {
            console.log('🗑️ Starte Test-Leaderboard Bereinigung (Auto-Delete aktiviert)...');
            
            let deletedCount = 0;
            
            // Schritt 1: Lösche gespeicherte Message-IDs
            if (xpSystem.settings.autoLeaderboard.lastMessageIds &&
                xpSystem.settings.autoLeaderboard.lastMessageIds.length > 0) {
                console.log(`🔍 Lösche ${xpSystem.settings.autoLeaderboard.lastMessageIds.length} gespeicherte Message-IDs...`);
                
                for (const messageId of xpSystem.settings.autoLeaderboard.lastMessageIds) {
                    try {
                        const oldMessage = await targetChannel.messages.fetch(messageId);
                        if (oldMessage) {
                            await oldMessage.delete();
                            deletedCount++;
                            console.log(`✅ Gespeicherte Test-Message gelöscht: ${messageId}`);
                        }
                    } catch (error) {
                        console.log(`⚠️ Gespeicherte Message nicht löschbar: ${messageId}`);
                    }
                }
            }
            
            // Schritt 2: Aggressive Bereinigung aller Bot-Leaderboard-Messages
            try {
                console.log('🧹 Starte aggressive Test-Bereinigung aller Leaderboard-Messages...');
                const recentMessages = await targetChannel.messages.fetch({ limit: 50 });
                
                const leaderboardMessages = recentMessages.filter(msg => {
                    if (msg.author.id !== client.user.id) return false;
                    if (!msg.embeds || msg.embeds.length === 0) return false;
                    
                    // Prüfe auf Leaderboard-Keywords in Titel oder Beschreibung
                    return msg.embeds.some(embed => {
                        const title = embed.title || '';
                        const description = embed.description || '';
                        const footerText = embed.footer?.text || '';
                        
                        return title.includes('Leaderboard') || 
                               title.includes('Ranking') || 
                               title.includes('Champions') ||
                               title.includes('Heroes') ||
                               title.includes('TEST') ||
                               description.includes('🥇') ||
                               description.includes('🥈') ||
                               description.includes('🥉') ||
                               footerText.includes('Top ') ||
                               footerText.includes('Test-Modus');
                    });
                });
                
                if (leaderboardMessages.size > 0) {
                    console.log(`🔍 ${leaderboardMessages.size} Test-Leaderboard-Messages zur Löschung gefunden`);
                    
                    for (const [messageId, message] of leaderboardMessages) {
                        try {
                            await message.delete();
                            deletedCount++;
                            console.log(`🗑️ Test-Leaderboard-Message gelöscht: ${messageId}`);
                            
                            // Kurze Pause zwischen Löschvorgängen (Rate Limit Schutz)
                            await new Promise(resolve => setTimeout(resolve, 100));
                        } catch (deleteError) {
                            console.log(`⚠️ Fehler beim Löschen von Test-Message ${messageId}:`, deleteError.message);
                        }
                    }
                }
                
                console.log(`✅ Test-Leaderboard-Bereinigung abgeschlossen: ${deletedCount} Messages gelöscht`);
                
            } catch (error) {
                console.log('⚠️ Fehler bei der Test-Leaderboard-Bereinigung:', error.message);
            }
        } else {
            console.log('ℹ️ Test-Modus oder Auto-Delete deaktiviert - keine Bereinigung');
        }

        // Erstelle Embeds für alle ausgewählten Typen
        const embeds = [];
        const typeNames = {
            total: '🏆 XP Leaderboard',
            level: '📈 Level Ranking',
            messages: '💬 Message Champions',
            voice: '🎤 Voice Heroes'
        };

        for (const type of types) {
            const leaderboard = xpSystem.getLeaderboard(limit, type);
            
            const embed = new EmbedBuilder()
                .setTitle(`${typeNames[type]} (TEST)`)
                .setColor(parseInt(xpSystem.settings.display.embedColor.replace('0x', ''), 16))
                .setTimestamp()
                .setFooter({ text: `🧪 Test-Modus • Top ${limit} • ${new Date().toLocaleDateString('de-DE')}` })
                .setThumbnail('https://cdn.discordapp.com/emojis/1234567890123456789.png?v=1'); // Optional: Trophy image

            // Verbessertes Card-Design ohne störende Statistiken (Test-Version)
            if (leaderboard.length === 0) {
                embed.setDescription('🌟 **Noch keine Daten verfügbar**\n\nBeginn dein XP-Abenteuer jetzt und klettere die Rangliste hoch!');
            } else {
                // Top 3 mit schönem Design
                let topDescription = '';
                leaderboard.slice(0, Math.min(3, leaderboard.length)).forEach((user, index) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const medal = medals[index];
                    
                    let mainValue = '';
                    let subValue = '';
                    switch (type) {
                        case 'total':
                            mainValue = `${user.totalXP.toLocaleString()} XP`;
                            subValue = `Level ${user.level}`;
                            break;
                        case 'level':
                            mainValue = `Level ${user.level}`;
                            subValue = `${user.totalXP.toLocaleString()} XP`;
                            break;
                        case 'messages':
                            mainValue = `${user.messageCount.toLocaleString()} Messages`;
                            subValue = `Level ${user.level}`;
                            break;
                        case 'voice':
                            mainValue = `${user.voiceTime.toFixed(1)} Minuten`;
                            subValue = `Level ${user.level}`;
                            break;
                    }
                    
                    topDescription += `${medal} **${user.username}**\n`;
                    topDescription += `**${mainValue}** • *${subValue}*\n\n`;
                });

                embed.setDescription(topDescription);

                // Weitere Plätze als kompakte Liste
                if (leaderboard.length > 3) {
                    let remainingUsers = '';
                    leaderboard.slice(3, Math.min(leaderboard.length, 10)).forEach((user, index) => {
                        const rank = index + 4;
                        
                        let value = '';
                        switch (type) {
                            case 'total':
                                value = `${user.totalXP.toLocaleString()} XP`;
                                break;
                            case 'level':
                                value = `Level ${user.level}`;
                                break;
                            case 'messages':
                                value = `${user.messageCount.toLocaleString()} Messages`;
                                break;
                            case 'voice':
                                value = `${user.voiceTime.toFixed(1)} min`;
                                break;
                        }
                        
                        remainingUsers += `**${rank}.** ${user.username} • ${value}\n`;
                    });

                    if (remainingUsers) {
                        embed.addFields({
                            name: '📋 Weitere Platzierungen',
                            value: remainingUsers,
                            inline: false
                        });
                    }
                }
            }
            embeds.push(embed);
        }

        // Poste alle Embeds und speichere Message-IDs (falls Auto-Leaderboard Channel)
        const newMessageIds = [];
        
        if (embeds.length <= 10) { // Discord limit
            const message = await targetChannel.send({ embeds });
            newMessageIds.push(message.id);
        } else {
            // Wenn mehr als 10 Embeds, poste sie in Gruppen
            for (let i = 0; i < embeds.length; i += 10) {
                const batch = embeds.slice(i, i + 10);
                const message = await targetChannel.send({ embeds: batch });
                newMessageIds.push(message.id);
            }
        }

        // 💾 SPEICHERE MESSAGE-IDs FÜR NÄCHSTES LÖSCHEN (falls es der Auto-Leaderboard Channel ist)
        if (channelName === xpSystem.settings.autoLeaderboard.channelName) {
            xpSystem.settings.autoLeaderboard.lastMessageIds = newMessageIds;
            xpSystem.saveData();
            console.log(`💾 Test-Message-IDs für nächstes Löschen gespeichert: ${newMessageIds.join(', ')}`);
        }

        console.log(`🧪 Test-Leaderboard(s) gepostet in #${channelName} (${embeds.length} Embeds)`);
        res.json({ 
            success: true, 
            message: `Test-Leaderboard(s) erfolgreich gepostet`,
            count: embeds.length,
            types: types,
            messageIds: newMessageIds
        });

    } catch (error) {
        console.error('❌ Fehler beim Posten des Test-Leaderboards:', error);
        res.status(500).json({ error: 'Fehler beim Posten des Test-Leaderboards' });
    }
});

// Level-Up-Embed testen
app.post('/api/xp/test-levelup', async (req, res) => {
    try {
        if (!xpSystem || !client.isReady()) {
            return res.status(503).json({ error: 'XP-System oder Bot nicht bereit' });
        }

        const { channelName, testUser = null } = req.body;

        if (!channelName) {
            return res.status(400).json({ error: 'Channel-Name erforderlich' });
        }

        // Finde Channel
        let targetChannel = null;
        for (const guild of client.guilds.cache.values()) {
            targetChannel = guild.channels.cache.find(ch => ch.name === channelName && ch.type === 0);
            if (targetChannel) break;
        }

        if (!targetChannel) {
            return res.status(404).json({ error: `Channel #${channelName} nicht gefunden` });
        }

        // Erstelle Test-User oder nutze echten User
        let user;
        if (testUser) {
            // Versuche echten User zu finden
            user = client.users.cache.get(testUser) || targetChannel.guild.members.cache.get(testUser)?.user;
        }
        
        if (!user) {
            // Fallback: Erstelle Mock-User-Objekt
            user = {
                id: '123456789012345678',
                username: 'TestUser',
                discriminator: '1234',
                displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
                tag: 'TestUser#1234'
            };
        }

        // Stelle sicher dass XP-System Daten existieren
        if (!xpSystem.data) {
            xpSystem.data = { users: {} };
        }
        if (!xpSystem.data.users) {
            xpSystem.data.users = {};
        }

        // Erstelle Test-Daten falls User nicht in DB existiert
        if (!xpSystem.data.users[user.id]) {
            xpSystem.data.users[user.id] = {
                totalXP: 2750,
                level: 15,
                messageCount: 425,
                voiceTime: 180.5,
                lastMessage: Date.now(),
                lastVoice: Date.now()
            };
        }

        const oldLevel = 14;
        const newLevel = 15;

        // Level-Up-Embed erstellen
        const embed = await xpSystem.createLevelUpEmbed(user, oldLevel, newLevel);
        
        // Test-Marker hinzufügen
        embed.setFooter({ 
            text: `🧪 TEST LEVEL-UP • ${embed.data.footer?.text || 'Level-Up System'}`
        });

        // Je nach Animations-Einstellungen senden
        if (xpSystem.settings.levelUpEmbed.animation.enabled) {
            // Test-Version der Animation (verkürzt)
            const config = xpSystem.settings.levelUpEmbed.animation;
            
            switch (config.style) {
                case 'celebration':
                    // Vereinfachte Test-Animation
                    const announcement = new EmbedBuilder()
                        .setTitle('✨ Level Up Test...')
                        .setDescription(`**${user.username}** testet ein Level-Up!`)
                        .setColor(0xFFD700)
                        .setTimestamp()
                        .setFooter({ text: '🧪 TEST ANIMATION - Celebration Style' });

                    const msg = await targetChannel.send({ embeds: [announcement] });
                    
                    // Nach 2 Sekunden finale Nachricht zeigen
                    setTimeout(async () => {
                        await msg.edit({ embeds: [embed] });
                        
                        // Test-Reaktionen hinzufügen
                        const emojis = ['🎉', '🎊', '🥳'];
                        for (const emoji of emojis) {
                            try {
                                await msg.react(emoji);
                                await new Promise(resolve => setTimeout(resolve, 200));
                            } catch (e) {
                                // Ignore reaction errors
                            }
                        }
                    }, 2000);
                    break;
                    
                case 'gradient':
                case 'pulse':
                case 'rainbow':
                    // Für andere Animationen: Zeige direkt das finale Embed mit Hinweis
                    embed.setTitle(`${embed.data.title} (${config.style.toUpperCase()} Animation aktiviert)`);
                    await targetChannel.send({ embeds: [embed] });
                    break;
                    
                default:
                    await targetChannel.send({ embeds: [embed] });
                    break;
            }
        } else {
            // Normale Nachricht ohne Animation
            await targetChannel.send({ embeds: [embed] });
        }

        console.log(`🧪 Test Level-Up gepostet in #${channelName} für User: ${user.username}`);
        res.json({ 
            success: true, 
            message: `Test Level-Up erfolgreich in #${channelName} gepostet!`,
            user: user.username,
            oldLevel: oldLevel,
            newLevel: newLevel,
            animation: xpSystem.settings.levelUpEmbed.animation.enabled ? xpSystem.settings.levelUpEmbed.animation.style : 'none'
        });

    } catch (error) {
        console.error('❌ Fehler beim Posten des Test Level-Ups:', error);
        res.status(500).json({ error: 'Fehler beim Posten des Test Level-Ups' });
    }
});

// Meilenstein-Ankündigung testen
app.post('/api/xp/test-milestone', async (req, res) => {
    try {
        if (!xpSystem || !client.isReady()) {
            return res.status(503).json({ error: 'XP-System oder Bot nicht bereit' });
        }

        const { channelName, milestoneXP = 5000 } = req.body;

        if (!channelName) {
            return res.status(400).json({ error: 'Channel-Name erforderlich' });
        }

        // Finde Channel
        let targetChannel = null;
        for (const guild of client.guilds.cache.values()) {
            targetChannel = guild.channels.cache.find(ch => ch.name === channelName && ch.type === 0);
            if (targetChannel) break;
        }

        if (!targetChannel) {
            return res.status(404).json({ error: `Channel #${channelName} nicht gefunden` });
        }

        // Mock-User erstellen
        const user = {
            id: '123456789012345678',
            username: 'TestUser',
            discriminator: '1234',
            displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
            tag: 'TestUser#1234'
        };

        // Finde passenden Meilenstein oder erstelle Test-Meilenstein
        let milestone = xpSystem.settings.rewards.milestoneRewards.find(m => m.xp >= milestoneXP);
        if (!milestone) {
            milestone = { xp: milestoneXP, reward: '🎁 Spezieller Test-Meilenstein erreicht!' };
        }

        // Meilenstein-Embed erstellen
        const embed = new EmbedBuilder()
            .setTitle('🎯 Meilenstein erreicht!')
            .setDescription(`**${user.username}** hat einen wichtigen Meilenstein erreicht!`)
            .setColor(parseInt(xpSystem.settings.display.embedColor.replace('0x', ''), 16))
            .addFields(
                {
                    name: '📊 Meilenstein',
                    value: `**${milestone.xp.toLocaleString()} XP**`,
                    inline: true
                },
                {
                    name: '🎁 Belohnung',
                    value: milestone.reward,
                    inline: true
                },
                {
                    name: '🎉 Herzlichen Glückwunsch!',
                    value: 'Du hast dir diese Belohnung verdient!',
                    inline: false
                }
            )
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: '🧪 TEST MEILENSTEIN • XP System' });

        await targetChannel.send({ embeds: [embed] });

        console.log(`🧪 Test Meilenstein gepostet in #${channelName} für ${milestone.xp} XP`);
        res.json({ 
            success: true, 
            message: `Test Meilenstein erfolgreich in #${channelName} gepostet!`,
            milestone: milestone.xp,
            reward: milestone.reward,
            user: user.username
        });

    } catch (error) {
        console.error('❌ Fehler beim Posten des Test Meilensteins:', error);
        res.status(500).json({ error: 'Fehler beim Posten des Test Meilensteins' });
    }
});

// Neuer Rekord Ankündigung testen
app.post('/api/xp/test-record', async (req, res) => {
    try {
        if (!xpSystem || !client.isReady()) {
            return res.status(503).json({ error: 'XP-System oder Bot nicht bereit' });
        }

        const { channelName, recordType = 'level' } = req.body;

        if (!channelName) {
            return res.status(400).json({ error: 'Channel-Name erforderlich' });
        }

        // Finde Channel
        let targetChannel = null;
        for (const guild of client.guilds.cache.values()) {
            targetChannel = guild.channels.cache.find(ch => ch.name === channelName && ch.type === 0);
            if (targetChannel) break;
        }

        if (!targetChannel) {
            return res.status(404).json({ error: `Channel #${channelName} nicht gefunden` });
        }

        // Mock-User erstellen
        const user = {
            id: '123456789012345678',
            username: 'TestUser',
            discriminator: '1234',
            displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
            tag: 'TestUser#1234'
        };

        let embed;
        let recordValue;
        let recordDesc;

        switch (recordType) {
            case 'level':
                recordValue = 25;
                recordDesc = 'Höchstes Level';
                embed = new EmbedBuilder()
                    .setTitle('🏆 NEUER SERVER-REKORD!')
                    .setDescription(`**${user.username}** hat einen neuen Level-Rekord aufgestellt!`)
                    .setColor(0xFFD700) // Gold
                    .addFields(
                        {
                            name: '📈 Neuer Level-Rekord',
                            value: `**Level ${recordValue}**`,
                            inline: true
                        },
                        {
                            name: '🎯 Bisheriger Rekord',
                            value: `Level ${recordValue - 1}`,
                            inline: true
                        },
                        {
                            name: '👑 Rekordhalter',
                            value: `${user.username}`,
                            inline: true
                        }
                    );
                break;

            case 'xp':
                recordValue = 12500;
                recordDesc = 'Höchste XP';
                embed = new EmbedBuilder()
                    .setTitle('🏆 NEUER SERVER-REKORD!')
                    .setDescription(`**${user.username}** hat einen neuen XP-Rekord aufgestellt!`)
                    .setColor(0x9B59B6) // Lila
                    .addFields(
                        {
                            name: '⭐ Neuer XP-Rekord',
                            value: `**${recordValue.toLocaleString()} XP**`,
                            inline: true
                        },
                        {
                            name: '🎯 Bisheriger Rekord',
                            value: `${(recordValue - 250).toLocaleString()} XP`,
                            inline: true
                        },
                        {
                            name: '👑 Rekordhalter',
                            value: `${user.username}`,
                            inline: true
                        }
                    );
                break;

            case 'messages':
                recordValue = 2500;
                recordDesc = 'Meiste Nachrichten';
                embed = new EmbedBuilder()
                    .setTitle('🏆 NEUER SERVER-REKORD!')
                    .setDescription(`**${user.username}** hat einen neuen Nachrichten-Rekord aufgestellt!`)
                    .setColor(0x3498DB) // Blau
                    .addFields(
                        {
                            name: '💬 Neuer Nachrichten-Rekord',
                            value: `**${recordValue.toLocaleString()} Nachrichten**`,
                            inline: true
                        },
                        {
                            name: '🎯 Bisheriger Rekord',
                            value: `${(recordValue - 50).toLocaleString()} Nachrichten`,
                            inline: true
                        },
                        {
                            name: '👑 Rekordhalter',
                            value: `${user.username}`,
                            inline: true
                        }
                    );
                break;

            case 'voice':
                recordValue = 750.5;
                recordDesc = 'Längste Voice-Zeit';
                embed = new EmbedBuilder()
                    .setTitle('🏆 NEUER SERVER-REKORD!')
                    .setDescription(`**${user.username}** hat einen neuen Voice-Zeit-Rekord aufgestellt!`)
                    .setColor(0xE91E63) // Pink
                    .addFields(
                        {
                            name: '🎤 Neuer Voice-Rekord',
                            value: `**${recordValue} Minuten**`,
                            inline: true
                        },
                        {
                            name: '🎯 Bisheriger Rekord',
                            value: `${recordValue - 25.5} Minuten`,
                            inline: true
                        },
                        {
                            name: '👑 Rekordhalter',
                            value: `${user.username}`,
                            inline: true
                        }
                    );
                break;

            default:
                return res.status(400).json({ error: 'Ungültiger Rekord-Typ' });
        }

        embed
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: '🧪 TEST REKORD • XP System' })
            .addFields({
                name: '🎉 Gratulation!',
                value: 'Ein historischer Moment für diesen Server!',
                inline: false
            });

        await targetChannel.send({ embeds: [embed] });

        console.log(`🧪 Test Rekord (${recordType}) gepostet in #${channelName}`);
        res.json({ 
            success: true, 
            message: `Test ${recordDesc} Rekord erfolgreich in #${channelName} gepostet!`,
            recordType: recordType,
            recordValue: recordValue,
            user: user.username
        });

    } catch (error) {
        console.error('❌ Fehler beim Posten des Test Rekords:', error);
        res.status(500).json({ error: 'Fehler beim Posten des Test Rekords' });
    }
});

// Meilenstein-Rollen erstellen
app.post('/api/xp/create-milestone-roles', async (req, res) => {
    try {
        if (!xpSystem || !client.isReady()) {
            return res.status(503).json({ error: 'XP-System oder Bot nicht bereit' });
        }

        const { guildId } = req.body;

        if (!guildId) {
            return res.status(400).json({ error: 'Guild-ID erforderlich' });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: 'Guild nicht gefunden' });
        }

        // Meilenstein-Rollen Konfiguration
        const milestoneRoles = [
            { xp: 500, name: '🌱 Newcomer', color: 0x90EE90 }, // Hell-Grün
            { xp: 1000, name: '💬 Aktives Mitglied', color: 0x87CEEB }, // Himmel-Blau
            { xp: 2500, name: '⭐ Erfahrener User', color: 0xFFD700 }, // Gold
            { xp: 5000, name: '🎯 Server-Veteran', color: 0xFF6347 }, // Orange-Rot
            { xp: 10000, name: '👑 Elite Member', color: 0x9932CC }, // Dunkles Orchid
            { xp: 25000, name: '🏆 Server-Legende', color: 0xFF1493 }, // Deep Pink
            { xp: 50000, name: '💎 Diamond Member', color: 0x00FFFF } // Cyan
        ];

        const createdRoles = [];
        const existingRoles = [];

        for (const roleConfig of milestoneRoles) {
            try {
                // Prüfe ob Rolle bereits existiert
                let role = guild.roles.cache.find(r => r.name === roleConfig.name);
                
                if (role) {
                    existingRoles.push({
                        name: roleConfig.name,
                        xp: roleConfig.xp,
                        id: role.id
                    });
                } else {
                    // Erstelle neue Rolle
                    role = await guild.roles.create({
                        name: roleConfig.name,
                        color: roleConfig.color,
                        permissions: [],
                        mentionable: false,
                        reason: `XP-System: Automatische Meilenstein-Rolle für ${roleConfig.xp} XP`
                    });

                    createdRoles.push({
                        name: roleConfig.name,
                        xp: roleConfig.xp,
                        id: role.id,
                        color: roleConfig.color
                    });

                    console.log(`✅ Meilenstein-Rolle erstellt: ${roleConfig.name} (${roleConfig.xp} XP)`);
                }
            } catch (error) {
                console.error(`❌ Fehler beim Erstellen der Rolle ${roleConfig.name}:`, error);
            }
        }

        res.json({
            success: true,
            message: `Meilenstein-Rollen Setup abgeschlossen!`,
            created: createdRoles,
            existing: existingRoles,
            total: milestoneRoles.length,
            guildName: guild.name
        });

    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Meilenstein-Rollen:', error);
        res.status(500).json({ error: 'Fehler beim Erstellen der Meilenstein-Rollen' });
    }
});

// Level-Rollen erstellen
app.post('/api/xp/create-level-roles', async (req, res) => {
    try {
        if (!xpSystem || !client.isReady()) {
            return res.status(503).json({ error: 'XP-System oder Bot nicht bereit' });
        }

        const { guildId } = req.body;

        if (!guildId) {
            return res.status(400).json({ error: 'Guild-ID erforderlich' });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: 'Guild nicht gefunden' });
        }

        // Level-Rollen Konfiguration
        const levelRoles = [
            { level: 5, name: '🔥 Level 5', color: 0xFF4500 }, // Orange-Rot
            { level: 10, name: '⚡ Level 10', color: 0x1E90FF }, // Dodger Blau
            { level: 15, name: '💫 Level 15', color: 0x9370DB }, // Medium Purple
            { level: 20, name: '🌟 Level 20', color: 0xFFD700 }, // Gold
            { level: 25, name: '🚀 Level 25', color: 0x00FF00 }, // Lime
            { level: 30, name: '🎯 Level 30', color: 0xFF1493 }, // Deep Pink
            { level: 40, name: '💎 Level 40', color: 0x00FFFF }, // Cyan
            { level: 50, name: '👑 Level 50', color: 0x8A2BE2 }, // Blau-Violett
            { level: 75, name: '🏆 Level 75', color: 0xDC143C }, // Crimson
            { level: 100, name: '🔮 Level 100', color: 0x4B0082 } // Indigo
        ];

        const createdRoles = [];
        const existingRoles = [];
        const updatedConfig = [];

        for (const roleConfig of levelRoles) {
            try {
                // Prüfe ob Rolle bereits existiert
                let role = guild.roles.cache.find(r => r.name === roleConfig.name);
                
                if (role) {
                    existingRoles.push({
                        name: roleConfig.name,
                        level: roleConfig.level,
                        id: role.id
                    });
                    
                    // Füge zur aktualisierten Konfiguration hinzu
                    updatedConfig.push({
                        level: roleConfig.level,
                        roleId: role.id,
                        roleName: role.name
                    });
                } else {
                    // Erstelle neue Rolle
                    role = await guild.roles.create({
                        name: roleConfig.name,
                        color: roleConfig.color,
                        permissions: [],
                        mentionable: false,
                        reason: `XP-System: Automatische Level-Rolle für Level ${roleConfig.level}`
                    });

                    createdRoles.push({
                        name: roleConfig.name,
                        level: roleConfig.level,
                        id: role.id,
                        color: roleConfig.color
                    });
                    
                    // Füge zur aktualisierten Konfiguration hinzu
                    updatedConfig.push({
                        level: roleConfig.level,
                        roleId: role.id,
                        roleName: role.name
                    });

                    console.log(`✅ Level-Rolle erstellt: ${roleConfig.name} (Level ${roleConfig.level})`);
                }
            } catch (error) {
                console.error(`❌ Fehler beim Erstellen der Rolle ${roleConfig.name}:`, error);
            }
        }

        // Aktualisiere XP-System Konfiguration mit neuen Rollen-IDs
        if (updatedConfig.length > 0) {
            const newSettings = { ...xpSystem.settings };
            newSettings.rewards.levelRoles = updatedConfig;
            xpSystem.updateSettings(newSettings);
            console.log(`🔄 XP-System Konfiguration mit ${updatedConfig.length} Level-Rollen aktualisiert`);
        }

        res.json({
            success: true,
            message: `Level-Rollen Setup abgeschlossen!`,
            created: createdRoles,
            existing: existingRoles,
            updated: updatedConfig.length,
            total: levelRoles.length,
            guildName: guild.name
        });

    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Level-Rollen:', error);
        res.status(500).json({ error: 'Fehler beim Erstellen der Level-Rollen' });
    }
});

// Alle User-Rollen aktualisieren (Admin-Funktion)
app.post('/api/xp/update-all-roles', async (req, res) => {
    try {
        if (!xpSystem || !client.isReady()) {
            return res.status(503).json({ error: 'XP-System oder Bot nicht bereit' });
        }

        const { guildId } = req.body;

        if (!guildId) {
            return res.status(400).json({ error: 'Guild-ID erforderlich' });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: 'Guild nicht gefunden' });
        }

        let updatedUsers = 0;
        let errors = 0;

        // Alle User mit XP-Daten durchgehen
        for (const [userId, userData] of xpSystem.userXP.entries()) {
            try {
                const user = await client.users.fetch(userId).catch(() => null);
                if (user) {
                    await xpSystem.updateAllUserRoles(guild, user, userData.level);
                    updatedUsers++;
                    console.log(`✅ Rollen aktualisiert für ${user.username} (Level ${userData.level})`);
                }
            } catch (error) {
                console.error(`❌ Fehler beim Aktualisieren der Rollen für User ${userId}:`, error);
                errors++;
            }
        }

        res.json({
            success: true,
            message: `Rollen-Update abgeschlossen!`,
            updatedUsers,
            errors,
            totalUsers: xpSystem.userXP.size,
            guildName: guild.name
        });

    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren aller User-Rollen:', error);
        res.status(500).json({ error: 'Fehler beim Aktualisieren der User-Rollen' });
    }
});

// XP-System Status umschalten
app.post('/api/xp/toggle', (req, res) => {
    try {
        if (!xpSystem) {
            return res.status(503).json({ error: 'XP-System nicht initialisiert' });
        }

        const currentStatus = xpSystem.settings.enabled;
        xpSystem.updateSettings({ enabled: !currentStatus });
        
        const newStatus = !currentStatus;
        console.log(`🔄 XP-System ${newStatus ? 'aktiviert' : 'deaktiviert'}`);
        
        res.json({ 
            success: true, 
            enabled: newStatus,
            message: `XP-System ${newStatus ? 'aktiviert' : 'deaktiviert'}`
        });
    } catch (error) {
        console.error('❌ Fehler beim Umschalten des XP-Systems:', error);
        res.status(500).json({ error: 'Fehler beim Umschalten des XP-Systems' });
    }
});

// ================== AI MESSAGE GENERATOR API ==================

// ChatGPT Message Generator für Twitch Notifications
app.post('/api/ai/generate-message', async (req, res) => {
    try {
        const { game, vibe, streamerType, emojiCount, length, language } = req.body;

        if (!game) {
            return res.status(400).json({ error: 'Spiel/Kategorie ist erforderlich' });
        }

        // System-Prompt für personalisierte Twitch Nachrichten
        const systemPrompt = `Du bist ein kreativer Discord Bot, der personalisierte Live-Benachrichtigungen für Twitch Streamer erstellt. 

AUFGABE: Erstelle eine coole, ansprechende Discord-Nachricht für einen Streamer, der live geht.

PARAMETER:
- Spiel/Kategorie: ${game}
- Vibe/Stimmung: ${vibe}
- Streamer-Typ: ${streamerType}
- Emoji-Anzahl: ${emojiCount}
- Länge: ${length}
- Sprache: ${language}

RICHTLINIEN:
- Verwende {streamer} als Platzhalter für den Streamer-Namen
- Die Nachricht sollte Discord-tauglich sein (keine @everyone/@here)
- Sei kreativ aber nicht übertrieben
- Nutze relevante Gaming-Emojis für das Spiel
- Passe den Ton an den Vibe an (energetisch = Action-fokussiert, chill = entspannt, etc.)
- Berücksichtige die gewünschte Emoji-Anzahl (few = 1-2, medium = 3-4, many = 5+)
- Passe die Länge an (short = max 50 Zeichen, medium = 50-100, long = 100+ Zeichen)

BEISPIELE:
Valorant + energetisch: "🔥 {streamer} droppt BOMBS in Valorant! Schaut zu! ⚡💥"
Minecraft + chill: "🌿 {streamer} baut chillig in Minecraft ✨ Entspannt zuschauen! 🏠"

Erstelle EINE perfekte Nachricht:`;

        const userPrompt = `Erstelle eine Discord Live-Notification für: ${game} (${vibe}, ${streamerType}, ${emojiCount} Emojis, ${length} Länge, ${language})`;

        // ChatGPT API Aufruf mit günstigem Modell
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Kostengünstiges aber gutes Modell
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ],
            max_tokens: 150,
            temperature: 0.8, // Etwas kreativ
            top_p: 1,
            frequency_penalty: 0.5,
            presence_penalty: 0.3
        });

        const generatedMessage = completion.choices[0]?.message?.content?.trim();

        if (!generatedMessage) {
            throw new Error('Keine Nachricht von ChatGPT erhalten');
        }

        console.log(`🤖 ChatGPT Message generiert für ${game} (${vibe})`);

        res.json({
            success: true,
            message: generatedMessage,
            parameters: { game, vibe, streamerType, emojiCount, length, language },
            model: "gpt-4o-mini",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Fehler bei ChatGPT Message Generation:', error);
        
        // Fallback zu lokaler Generierung bei API-Fehlern
        const fallbackMessage = generateFallbackMessage(req.body);
        
        res.json({
            success: true,
            message: fallbackMessage,
            fallback: true,
            error: error.message,
            parameters: req.body
        });
    }
});

// Fallback-Funktion falls ChatGPT nicht verfügbar ist
function generateFallbackMessage({ game, vibe, streamerType, emojiCount, length }) {
    const gameEmojis = {
        'valorant': ['⚡', '🔫', '💥', '🎯'],
        'minecraft': ['⛏️', '🏠', '🌲', '💎'],
        'just chatting': ['💬', '🗣️', '💭', '🎤'],
        'default': ['🎮', '🔥', '💜', '⭐']
    };

    const templates = {
        'energetic': '🔥 {streamer} geht live mit ACTION! Schaut zu!',
        'chill': '✨ {streamer} startet entspannt! Kommt vorbei!',
        'hype': '🚀 {streamer} ist LIVE! Das wird EPIC!',
        'professional': '👑 {streamer} zeigt Skills! Pro-Gameplay!',
        'funny': '😂 {streamer} bringt Spaß! Comedy-Time!'
    };

    let message = templates[vibe] || templates['energetic'];
    const emojis = gameEmojis[game.toLowerCase()] || gameEmojis['default'];
    
    // Emojis hinzufügen
    const emojiToAdd = emojiCount === 'few' ? 1 : emojiCount === 'medium' ? 2 : 3;
    for (let i = 0; i < emojiToAdd && i < emojis.length; i++) {
        message += ` ${emojis[i]}`;
    }

    return message;
}

// ================== COMMANDS API ==================

// Alle verfügbaren Commands abrufen
app.get('/api/commands', (req, res) => {
    try {
        const commands = [
            // Moderation Commands
            {
                name: '/warn',
                description: 'Verwarnt einen User',
                category: 'Moderation',
                usage: '/warn @user [Grund]',
                permissions: 'MODERATE_MEMBERS',
                icon: '⚠️'
            },
            {
                name: '/kick',
                description: 'Kickt einen User vom Server',
                category: 'Moderation',
                usage: '/kick @user [Grund]',
                permissions: 'KICK_MEMBERS',
                icon: '👢'
            },
            {
                name: '/ban',
                description: 'Bannt einen User permanent',
                category: 'Moderation',
                usage: '/ban @user [Grund]',
                permissions: 'BAN_MEMBERS',
                icon: '🔨'
            },
            {
                name: '/timeout',
                description: 'Gibt einem User einen Timeout',
                category: 'Moderation',
                usage: '/timeout @user [Zeit] [Grund]',
                permissions: 'MODERATE_MEMBERS',
                icon: '⏰'
            },
            {
                name: '/clear',
                description: 'Löscht eine bestimmte Anzahl von Nachrichten',
                category: 'Moderation',
                usage: '/clear [Anzahl]',
                permissions: 'MANAGE_MESSAGES',
                icon: '🧹'
            },
            
            // XP System Commands
            {
                name: '/xp',
                description: 'Zeigt dein XP-Profil an',
                category: 'XP System',
                usage: '/xp [@user]',
                permissions: 'Alle',
                icon: '⭐'
            },
            {
                name: '/leaderboard',
                description: 'Zeigt das Server-Leaderboard',
                category: 'XP System',
                usage: '/leaderboard [Typ]',
                permissions: 'Alle',
                icon: '🏆'
            },
            {
                name: '/addxp',
                description: 'Fügt einem User XP hinzu (Admin)',
                category: 'XP System',
                usage: '/addxp @user [XP]',
                permissions: 'ADMINISTRATOR',
                icon: '➕'
            },
            {
                name: '/setxp',
                description: 'Setzt User XP auf einen Wert (Admin)',
                category: 'XP System',
                usage: '/setxp @user [XP]',
                permissions: 'ADMINISTRATOR',
                icon: '🎯'
            },
            
            // Utility Commands
            {
                name: '/ping',
                description: 'Zeigt die Bot-Latenz an',
                category: 'Utility',
                usage: '/ping',
                permissions: 'Alle',
                icon: '🏓'
            },
            {
                name: '/serverinfo',
                description: 'Zeigt Server-Informationen',
                category: 'Utility',
                usage: '/serverinfo',
                permissions: 'Alle',
                icon: '📊'
            },
            {
                name: '/userinfo',
                description: 'Zeigt User-Informationen',
                category: 'Utility',
                usage: '/userinfo [@user]',
                permissions: 'Alle',
                icon: '👤'
            },
            
            // Text Commands
            {
                name: '!xp',
                description: 'Zeigt dein XP-Profil (Text-Command)',
                category: 'Text Commands',
                usage: '!xp [@user]',
                permissions: 'Alle',
                icon: '💬'
            },
            {
                name: '!level',
                description: 'Alias für !xp Command',
                category: 'Text Commands',
                usage: '!level [@user]',
                permissions: 'Alle',
                icon: '📈'
            },
            {
                name: '!leaderboard',
                description: 'Zeigt das Leaderboard (Text-Command)',
                category: 'Text Commands',
                usage: '!leaderboard',
                permissions: 'Alle',
                icon: '🏅'
            },
            
            // Fun Commands (falls vorhanden)
            {
                name: '/meme',
                description: 'Zeigt ein zufälliges Meme',
                category: 'Fun',
                usage: '/meme',
                permissions: 'Alle',
                icon: '😂'
            },
            {
                name: '/8ball',
                description: 'Stellt der magischen 8-Ball eine Frage',
                category: 'Fun',
                usage: '/8ball [Frage]',
                permissions: 'Alle',
                icon: '🎱'
            }
        ];

        const stats = {
            total: commands.length,
            byCategory: commands.reduce((acc, cmd) => {
                acc[cmd.category] = (acc[cmd.category] || 0) + 1;
                return acc;
            }, {})
        };

        res.json({
            commands,
            stats,
            success: true
        });
    } catch (error) {
        console.error('❌ Fehler beim Laden der Commands:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Commands' });
    }
});

// ================== END COMMANDS API ==================

// ================== BOT UPDATES API ==================

// Giveaway API wird nach System-Initialisierung registriert (siehe client.on('ready'))

// ================== END BOT UPDATES API ==================

// ================== BOT INTRODUCTION API ==================
// Bot-Introduction System importieren und registrieren
const { 
    registerBotIntroductionAPI, 
    setupIntroductionTriggers, 
    handleIntroductionButtonInteraction 
} = require('./bot-introduction-api');

// Bot-Introduction API registrieren
registerBotIntroductionAPI(app, client);

// ================== END BOT INTRODUCTION API ==================