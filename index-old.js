const { Client, Events, GatewayIntentBits, Collection, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

// ======================= MODULE IMPORTS =======================
const moderation = require('./modules/moderation');
const welcome = require('./modules/welcome');
const verification = require('./modules/verification');
const utils = require('./modules/utils');
const apiRoutes = require('./modules/api-routes');
const XPSystem = require('./xp-system');

// ======================= EXPRESS SERVER SETUP =======================
const app = express();
app.use(cors());
app.use(express.json());

// Multer für Datei-Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = './dashboard/public/images/welcome/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = require('path').extname(file.originalname);
        cb(null, 'welcome-' + uniqueSuffix + extension);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Nur Bilddateien sind erlaubt!'), false);
        }
    }
});

app.use('/images', express.static('./dashboard/public/images'));

// ======================= DISCORD CLIENT SETUP =======================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages
    ]
});

// ======================= GLOBAL VARIABLES =======================
let xpSystem = null;
let botSettings = {
    prefix: '!',
    autoModeration: true,
    antiSpam: true
};

// ======================= MODULE INITIALIZATION =======================
function initializeModules() {
    console.log('🔧 Initialisiere Module...');
    
    // Client an alle Module weitergeben
    moderation.setClient(client);
    welcome.setClient(client);
    verification.setClient(client);
    
    // Module-Daten laden
    moderation.loadModerationSettings();
    moderation.loadModerationLogs();
    moderation.loadMuteDatabase();
    
    welcome.loadWelcomeSettings();
    welcome.loadRulesSettings();
    
    verification.loadVerificationSettings();
    verification.loadVerifiedUsers();
    verification.loadVerificationStats();
    
    // XP-System initialisieren
    try {
        xpSystem = new XPSystem();
        console.log('✅ XP-System initialisiert');
    } catch (error) {
        console.error('❌ Fehler beim Initialisieren des XP-Systems:', error);
    }
    
    console.log('✅ Alle Module initialisiert');
}

// ======================= API ROUTES SETUP =======================
function setupAPI() {
    // Basis-API Routes
    app.get('/api/info', (req, res) => {
        res.json({
            name: 'Discord Bot API',
            version: '2.0.0',
            modules: ['moderation', 'welcome', 'verification', 'xp-system'],
            status: client.isReady() ? 'online' : 'offline'
        });
    });

    // Bot Settings API
    app.get('/api/bot/settings', (req, res) => {
        try {
            const settings = utils.safeReadJSON('./bot-settings.json', {
                botName: 'CyberBot',
                prefix: '!',
                autoModeration: true,
                antiSpam: true
            });
            res.json(settings);
        } catch (error) {
            res.status(500).json({ error: 'Fehler beim Laden der Bot-Einstellungen' });
        }
    });

    app.post('/api/bot/settings', async (req, res) => {
        try {
            utils.safeWriteJSON('./bot-settings.json', req.body);
            botSettings = { ...botSettings, ...req.body };
            await applyBotSettings(req.body);
            res.json({ success: true, message: 'Bot-Einstellungen gespeichert' });
        } catch (error) {
            res.status(500).json({ error: 'Fehler beim Speichern der Bot-Einstellungen' });
        }
    });

    // Image Upload API
    app.post('/api/welcome/upload-image', upload.single('image'), (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Keine Datei hochgeladen' });
            }
            
            const filename = req.file.filename;
            const path = `/images/welcome/${filename}`;
            
            res.json({
                success: true,
                message: 'Bild erfolgreich hochgeladen',
                filename: filename,
                path: path
            });
        } catch (error) {
            res.status(500).json({ error: 'Fehler beim Upload' });
        }
    });

    // Setup Module API Routes
    apiRoutes.setupAPIRoutes(app, client, {
        moderation,
        welcome,
        verification,
        xpSystem
    });
    
    console.log('✅ API Routes eingerichtet');
}

// ======================= BOT SETTINGS =======================
function loadBotSettings() {
    try {
        botSettings = utils.safeReadJSON('./bot-settings.json', botSettings);
        console.log('✅ Bot-Einstellungen geladen');
    } catch (error) {
        console.error('❌ Fehler beim Laden der Bot-Einstellungen:', error);
    }
}

async function applyBotSettings(settings) {
    try {
        if (settings.botStatus && client.isReady()) {
            await client.user.setStatus(settings.botStatus);
        }
        
        if (settings.activityText && settings.activityType && client.isReady()) {
            await client.user.setActivity(settings.activityText, { 
                type: settings.activityType.toUpperCase() 
            });
        }
        
        console.log('✅ Bot-Einstellungen angewendet');
    } catch (error) {
        console.error('❌ Fehler beim Anwenden der Bot-Einstellungen:', error);
    }
}

// ======================= SLASH COMMANDS =======================
async function registerSlashCommands() {
    const commands = [
        // Moderation Commands
        new SlashCommandBuilder()
            .setName('warn')
            .setDescription('Verwarnt einen User')
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('Der zu verwarnende User')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('grund')
                    .setDescription('Grund für die Verwarnung')
                    .setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
            
        new SlashCommandBuilder()
            .setName('kick')
            .setDescription('Kickt einen User vom Server')
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('Der zu kickende User')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('grund')
                    .setDescription('Grund für den Kick')
                    .setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
            
        new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Bannt einen User permanent')
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('Der zu bannende User')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('grund')
                    .setDescription('Grund für den Ban')
                    .setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
            
        // XP Commands
        new SlashCommandBuilder()
            .setName('xp')
            .setDescription('Zeigt dein XP-Profil an')
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('User dessen Profil angezeigt werden soll')
                    .setRequired(false)),
                    
        new SlashCommandBuilder()
            .setName('leaderboard')
            .setDescription('Zeigt das Server-Leaderboard')
            .addStringOption(option =>
                option.setName('typ')
                    .setDescription('Art des Leaderboards')
                    .addChoices(
                        { name: 'Total XP', value: 'total' },
                        { name: 'Level', value: 'level' },
                        { name: 'Nachrichten', value: 'messages' },
                        { name: 'Voice Zeit', value: 'voice' }
                    )
                    .setRequired(false)),
                    
        // Utility Commands
        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Zeigt die Bot-Latenz an'),
            
        new SlashCommandBuilder()
            .setName('serverinfo')
            .setDescription('Zeigt Server-Informationen'),
    ];

    try {
        console.log('🔄 Registriere Slash Commands...');
        
        // Registriere Commands global
        await client.application.commands.set(commands);
        
        console.log('✅ Slash Commands registriert');
    } catch (error) {
        console.error('❌ Fehler beim Registrieren der Slash Commands:', error);
    }
}

// ======================= EVENT HANDLERS =======================
client.once(Events.ClientReady, async () => {
    console.log(`🚀 Bot ist online als ${client.user.tag}!`);
    
    // Module initialisieren
    initializeModules();
    
    // API Setup
    setupAPI();
    
    // Bot-Einstellungen laden und anwenden
    loadBotSettings();
    await applyBotSettings(botSettings);
    
    // Slash Commands registrieren
    await registerSlashCommands();
    
    // Timer starten
    utils.startDailyResetTimer();
    welcome.startAutoRulesTimer();
    
    // Express Server starten
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`🌐 API Server läuft auf Port ${PORT}`);
    });
    
    console.log('✅ Bot vollständig initialisiert!');
});

// Guild Member Add (Welcome & Verification)
client.on(Events.GuildMemberAdd, async (member) => {
    console.log(`👋 Neuer Member: ${member.user.username} in ${member.guild.name}`);
    
    // Welcome-System
    await welcome.handleWelcome(member);
    
    // Verification-System
    await verification.handleMemberJoin(member);
});

// Message Events (XP, Moderation, Text Commands)
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    
    try {
        // Anti-Spam Check
        if (moderation.checkSpam(message.author.id, message.content, message.id)) {
            await message.delete();
            
            const embed = new EmbedBuilder()
                .setTitle('🚨 Spam erkannt')
                .setDescription(`${message.author}, bitte vermeide Spam!`)
                .setColor('#ff0000')
                .setTimestamp();
                
            const warning = await message.channel.send({ embeds: [embed] });
            setTimeout(() => warning.delete().catch(() => {}), 5000);
            
            // Auto-Mute bei wiederholtem Spam
            const moderationSettings = moderation.getModerationSettings();
            if (moderationSettings.autoMute) {
                try {
                    await moderation.muteUser(
                        message.guild,
                        message.author,
                        'Automatisch: Spam erkannt',
                        client.user,
                        moderationSettings.muteDuration
                    );
                } catch (error) {
                    console.error('❌ Fehler beim Auto-Mute:', error);
                }
            }
            return;
        }
        
        // XP für Nachrichten vergeben
        if (xpSystem && xpSystem.settings.enabled) {
            xpSystem.handleMessage(message);
        }
        
        // Text Commands
        if (message.content.startsWith(botSettings.prefix)) {
            const args = message.content.slice(botSettings.prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            
            switch (command) {
                case 'xp':
                case 'level':
                    if (xpSystem) {
                        const targetUser = message.mentions.users.first() || message.author;
                        const embed = xpSystem.createProfileEmbed(targetUser.id, message.guild);
                        await message.reply({ embeds: [embed] });
                    }
                    break;
                    
                case 'leaderboard':
                    if (xpSystem) {
                        const leaderboard = xpSystem.getLeaderboard(10, 'total');
                        const embed = xpSystem.createLeaderboardEmbed(leaderboard, 'total', message.guild);
                        await message.reply({ embeds: [embed] });
                    }
                    break;
            }
        }
        
    } catch (error) {
        console.error('❌ Fehler bei Message-Event:', error);
    }
});

// Slash Command Handler
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;
    
    try {
        const { commandName } = interaction;
        
        switch (commandName) {
            case 'warn':
                const warnUser = interaction.options.getUser('user');
                const warnReason = interaction.options.getString('grund') || 'Kein Grund angegeben';
                
                const { warning, warningCount } = await moderation.addWarning(
                    interaction.guild,
                    warnUser,
                    warnReason,
                    interaction.user
                );
                
                const warnEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Verwarnung erteilt')
                    .addFields(
                        { name: 'User', value: `${warnUser.username}`, inline: true },
                        { name: 'Grund', value: warnReason, inline: true },
                        { name: 'Anzahl Verwarnungen', value: `${warningCount}`, inline: true }
                    )
                    .setColor('#ffff00')
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [warnEmbed] });
                break;
                
            case 'kick':
                const kickUser = interaction.options.getUser('user');
                const kickReason = interaction.options.getString('grund') || 'Kein Grund angegeben';
                
                const member = await interaction.guild.members.fetch(kickUser.id);
                await member.kick(kickReason);
                
                await moderation.logModerationAction(
                    interaction.guild,
                    'kick',
                    kickUser,
                    interaction.user,
                    kickReason
                );
                
                const kickEmbed = new EmbedBuilder()
                    .setTitle('👢 User gekickt')
                    .addFields(
                        { name: 'User', value: `${kickUser.username}`, inline: true },
                        { name: 'Grund', value: kickReason, inline: true }
                    )
                    .setColor('#ff8000')
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [kickEmbed] });
                break;
                
            case 'ban':
                const banUser = interaction.options.getUser('user');
                const banReason = interaction.options.getString('grund') || 'Kein Grund angegeben';
                
                await interaction.guild.members.ban(banUser, { reason: banReason });
                
                await moderation.logModerationAction(
                    interaction.guild,
                    'ban',
                    banUser,
                    interaction.user,
                    banReason
                );
                
                const banEmbed = new EmbedBuilder()
                    .setTitle('🔨 User gebannt')
                    .addFields(
                        { name: 'User', value: `${banUser.username}`, inline: true },
                        { name: 'Grund', value: banReason, inline: true }
                    )
                    .setColor('#ff0000')
                    .setTimestamp();
                    
                await interaction.reply({ embeds: [banEmbed] });
                break;
                
            case 'xp':
                if (xpSystem) {
                    const targetUser = interaction.options.getUser('user') || interaction.user;
                    const embed = xpSystem.createProfileEmbed(targetUser.id, interaction.guild);
                    await interaction.reply({ embeds: [embed] });
                }
                break;
                
            case 'leaderboard':
                if (xpSystem) {
                    const type = interaction.options.getString('typ') || 'total';
                    const leaderboard = xpSystem.getLeaderboard(10, type);
                    const embed = xpSystem.createLeaderboardEmbed(leaderboard, type, interaction.guild);
                    await interaction.reply({ embeds: [embed] });
                }
                break;
                
            case 'ping':
                const ping = client.ws.ping;
                const pingEmbed = new EmbedBuilder()
                    .setTitle('🏓 Pong!')
                    .setDescription(`Latenz: ${ping}ms`)
                    .setColor('#00ff00')
                    .setTimestamp();
                await interaction.reply({ embeds: [pingEmbed] });
                break;
                
            case 'serverinfo':
                const guild = interaction.guild;
                const serverEmbed = new EmbedBuilder()
                    .setTitle(`📊 ${guild.name}`)
                    .setThumbnail(guild.iconURL({ dynamic: true }))
                    .addFields(
                        { name: '👥 Mitglieder', value: `${guild.memberCount}`, inline: true },
                        { name: '🎭 Rollen', value: `${guild.roles.cache.size}`, inline: true },
                        { name: '📅 Erstellt', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
                    )
                    .setColor('#7B68EE')
                    .setTimestamp();
                await interaction.reply({ embeds: [serverEmbed] });
                break;
        }
        
    } catch (error) {
        console.error('❌ Fehler bei Slash Command:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Fehler')
            .setDescription('Ein Fehler ist aufgetreten beim Ausführen des Commands.')
            .setColor('#ff0000');
            
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
});

// Voice State Update (XP für Voice)
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    if (xpSystem && xpSystem.settings.enabled) {
        xpSystem.handleVoiceStateUpdate(oldState, newState);
    }
});

// Error Handling
client.on('error', (error) => {
    console.error('❌ Discord Client Error:', error);
    utils.logError(error, 'Discord Client');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    utils.logError(new Error(reason), 'Unhandled Rejection');
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    utils.logError(error, 'Uncaught Exception');
    process.exit(1);
});

// ======================= BOT LOGIN =======================
console.log('🔄 Starte Discord Bot...');
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Fehler beim Bot-Login:', error);
    process.exit(1);
});