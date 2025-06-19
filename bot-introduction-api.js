const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

// Globale Variablen
let openaiClient = null;

// OpenAI Client aus der globalen Variable holen (wird in index.js initialisiert)
function getOpenAIClient() {
    // Verwende die globale openai Variable aus index.js
    if (global.openai) {
        console.log('🤖 OpenAI Client aus globaler Variable verfügbar');
        return global.openai;
    }
    
    // Fallback: Versuche selbst zu initialisieren
    if (!openaiClient) {
        try {
            const { OpenAI } = require('openai');
            const apiKeys = JSON.parse(fs.readFileSync('./api-keys.json', 'utf8'));
            if (apiKeys.openai) {
                openaiClient = new OpenAI({
                    apiKey: apiKeys.openai
                });
                console.log('🤖 OpenAI Client für Mitglieder-Antworten initialisiert');
            } else {
                console.log('⚠️ OpenAI konnte nicht initialisiert werden - Mitglieder-Antworten ohne AI');
            }
        } catch (error) {
            console.error('❌ Fehler beim Initialisieren von OpenAI:', error);
        }
    }
    return openaiClient;
}

// Standard-Einstellungen für Bot-Vorstellungen
const defaultIntroductionSettings = {
    enabled: true,
    channelName: 'vorstellungen',
    autoPost: true,
    triggers: {
        onChannelCreate: true,
        onChannelMention: true,
        onKeywords: true,
        onCommand: true,
        manual: true
    },
    keywords: ['bot vorstellen', 'bot introduction', 'wer bist du', 'stell dich vor'],
    cooldown: {
        enabled: true,
        duration: 3600000, // 1 Stunde in ms
        perChannel: true
    },
    embed: {
        title: '🤖 Hallo! Ich bin {botName}',
        description: 'Schön dich kennenzulernen! Ich bin dein freundlicher Discord-Bot und helfe dir bei vielen Aufgaben auf diesem Server.',
        color: '0x00FF7F',
        thumbnail: 'bot',
        customThumbnail: '',
        footer: 'Entwickelt mit ❤️ • {timestamp}',
        author: {
            enabled: true,
            name: '{botName} - Dein Discord Assistent',
            iconUrl: ''
        },
        fields: [
            {
                name: '🎯 Meine Hauptfunktionen',
                value: '• **Moderation** - Halte den Server sauber\n• **Willkommensnachrichten** - Begrüße neue Mitglieder\n• **XP-System** - Belohne aktive Nutzer\n• **Spiele-Integration** - Valorant, Twitch & mehr\n• **Verifizierung** - Sichere Server-Zugang',
                inline: false
            },
            {
                name: '⚡ Schnellstart',
                value: 'Nutze `/help` um alle Befehle zu sehen oder schaue im Dashboard vorbei!',
                inline: true
            },
            {
                name: '🔧 Dashboard',
                value: 'Konfiguriere mich über das Web-Dashboard für maximale Flexibilität!',
                inline: true
            },
            {
                name: '💬 Support',
                value: 'Bei Fragen wende dich an die Administratoren oder nutze `/support`',
                inline: false
            }
        ]
    },
    buttons: {
        enabled: false,
        buttons: []
    },
    personalizedGreeting: {
        enabled: true,
        useUserName: true,
        greetingVariations: [
            'Hallo {user}! 👋',
            'Hey {user}! Schön dich zu sehen! 😊',
            'Hi {user}! Willkommen! 🎉',
            'Servus {user}! 🤖',
            'Moin {user}! Wie geht\'s? 😄'
        ]
    },
    statistics: {
        showInEmbed: true,
        fields: {
            serverCount: true,
            memberCount: true,
            uptime: true,
            commandsExecuted: false,
            version: true
        }
    },
    aiIntegration: {
        enabled: false,
        generatePersonalizedMessage: false,
        useContextFromChannel: false,
        maxTokens: 150
    },
    memberIntroductionResponse: {
        enabled: true,
        autoReact: true,
        autoReply: true,
        reactions: ['👋', '🎉', '😊', '🤖'],
        maxReactions: 3, // Anzahl der zufälligen Reaktionen
        aiResponse: {
            enabled: true,
            personalizedMessages: true,
            useOpenAI: true,
            maxTokens: 200,
            temperature: 0.8,
            systemPrompt: 'Du bist ein freundlicher Discord-Bot namens AgentBee. Antworte kurz und herzlich auf Mitglieder-Vorstellungen. Sei einladend, positiv und erwähne relevante Server-Features. Antworte auf Deutsch und halte es unter 150 Wörtern.'
        },
        detectionKeywords: [
            'hallo', 'hi', 'hey', 'moin', 'servus',
            'ich bin', 'mein name', 'heiße', 'vorstellen',
            'neu hier', 'neues mitglied', 'gerade beigetreten',
            'freue mich', 'schön hier zu sein', 'grüße'
        ],
        minimumWordCount: 3,
        cooldown: {
            enabled: true,
            duration: 300000, // 5 Minuten
            perUser: true
        },
        xpBonus: {
            enabled: true,
            onlyFirstTime: true,
            amount: 100,
            message: '🎉 Du hast {amount} XP für deine Vorstellung erhalten!',
            autoDelete: {
                enabled: true,
                delaySeconds: 10
            }
        }
    }
};

// Einstellungen laden
function loadIntroductionSettings() {
    try {
        if (fs.existsSync('./bot-introduction-settings.json')) {
            const settings = JSON.parse(fs.readFileSync('./bot-introduction-settings.json', 'utf8'));
            // Merge mit Default-Settings für neue Features
            return { ...defaultIntroductionSettings, ...settings };
        }
        return defaultIntroductionSettings;
    } catch (error) {
        console.error('❌ Fehler beim Laden der Bot-Vorstellungs-Einstellungen:', error);
        return defaultIntroductionSettings;
    }
}

// Einstellungen speichern
function saveIntroductionSettings(settings) {
    try {
        fs.writeFileSync('./bot-introduction-settings.json', JSON.stringify(settings, null, 2));
        console.log('💾 Bot-Vorstellungs-Einstellungen gespeichert');
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Bot-Vorstellungs-Einstellungen:', error);
        return false;
    }
}

// Cooldown-Verwaltung
const cooldownCache = new Map();
const memberResponseCooldowns = new Map();

function isOnCooldown(channelId, settings) {
    if (!settings.cooldown.enabled) return false;
    
    const key = settings.cooldown.perChannel ? channelId : 'global';
    const lastUsed = cooldownCache.get(key);
    
    if (!lastUsed) return false;
    
    const timePassed = Date.now() - lastUsed;
    return timePassed < settings.cooldown.duration;
}

function setCooldown(channelId, settings) {
    const key = settings.cooldown.perChannel ? channelId : 'global';
    cooldownCache.set(key, Date.now());
}

function getRemainingCooldown(channelId, settings) {
    if (!settings.cooldown.enabled) return 0;
    
    const key = settings.cooldown.perChannel ? channelId : 'global';
    const lastUsed = cooldownCache.get(key);
    
    if (!lastUsed) return 0;
    
    const timePassed = Date.now() - lastUsed;
    const remaining = settings.cooldown.duration - timePassed;
    
    return Math.max(0, remaining);
}

// Template-Variablen ersetzen
function replaceTemplateVariables(text, variables) {
    let result = text;
    
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{${key}}`, 'g');
        result = result.replace(regex, value);
    }
    
    return result;
}

// Bot-Statistiken sammeln
function getBotStatistics(client) {
    const stats = {
        serverCount: client.guilds.cache.size,
        memberCount: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
        uptime: formatUptime(client.uptime),
        version: 'v1.0.20', // Aus package.json oder statisch
        commandsExecuted: 0 // Könnte aus einer Statistik-DB kommen
    };
    
    return stats;
}

function formatUptime(uptime) {
    if (!uptime) return 'Gerade gestartet';
    
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// Personalisierte Begrüßung generieren
function generatePersonalizedGreeting(user, settings) {
    if (!settings.personalizedGreeting.enabled) {
        return null;
    }
    
    const variations = settings.personalizedGreeting.greetingVariations;
    const randomGreeting = variations[Math.floor(Math.random() * variations.length)];
    
    const userName = settings.personalizedGreeting.useUserName ? user.displayName || user.username : 'Freund';
    
    return replaceTemplateVariables(randomGreeting, { user: userName });
}

// ================== MITGLIEDER-VORSTELLUNGS-SYSTEM ==================

// Prüfen ob Nachricht eine Mitglieder-Vorstellung ist
function isMemberIntroduction(message, settings) {
    if (message.author.bot) return false;
    
    const content = message.content.toLowerCase();
    const words = content.split(/\s+/).filter(word => word.length > 0); // Alle Wörter zählen
    
    console.log(`🔍 Vorstellungs-Analyse für "${content}"`);
    console.log(`   - Alle Wörter: ${words.length} (${words.join(', ')})`);
    console.log(`   - Minimum erforderlich: ${settings.memberIntroductionResponse.minimumWordCount}`);
    
    // Mindestanzahl Wörter prüfen
    if (words.length < settings.memberIntroductionResponse.minimumWordCount) {
        console.log(`   ❌ Zu wenige Wörter: ${words.length} < ${settings.memberIntroductionResponse.minimumWordCount}`);
        return false;
    }
    
    // Keywords prüfen
    const hasKeywords = settings.memberIntroductionResponse.detectionKeywords.some(keyword => 
        content.includes(keyword.toLowerCase())
    );
    console.log(`   - Keywords gefunden: ${hasKeywords}`);
    
    // Channel-Name prüfen (sollte "vorstellungen" oder ähnlich sein)
    const isIntroductionChannel = message.channel.name.toLowerCase().includes('vorstell') ||
                                 message.channel.name.toLowerCase().includes('introduction') ||
                                 message.channel.name.toLowerCase().includes('intro');
    console.log(`   - Vorstellungs-Channel: ${isIntroductionChannel} (Channel: #${message.channel.name})`);
    
    const result = hasKeywords && isIntroductionChannel;
    console.log(`   🎯 Endergebnis: ${result ? '✅ VORSTELLUNG ERKANNT' : '❌ KEINE VORSTELLUNG'}`);
    
    return result;
}

// Cooldown für Mitglieder-Antworten prüfen
function isMemberResponseOnCooldown(userId, settings) {
    if (!settings.memberIntroductionResponse.cooldown.enabled) return false;
    
    const key = settings.memberIntroductionResponse.cooldown.perUser ? userId : 'global';
    const lastUsed = memberResponseCooldowns.get(key);
    
    if (!lastUsed) return false;
    
    const timePassed = Date.now() - lastUsed;
    return timePassed < settings.memberIntroductionResponse.cooldown.duration;
}

// Cooldown für Mitglieder-Antworten setzen
function setMemberResponseCooldown(userId, settings) {
    const key = settings.memberIntroductionResponse.cooldown.perUser ? userId : 'global';
    memberResponseCooldowns.set(key, Date.now());
}

// AI-Antwort generieren
async function generateAIResponse(message, settings) {
    const client = getOpenAIClient();
    if (!client || !settings.memberIntroductionResponse.aiResponse.enabled) {
        return null;
    }
    
    try {
        const userContent = message.content;
        const userName = message.author.displayName || message.author.username;
        const serverName = message.guild.name;
        
        const prompt = `Nachricht von ${userName} im Server "${serverName}": "${userContent}"
        
Antworte freundlich und persönlich auf diese Vorstellung. Erwähne den Namen der Person und heiße sie willkommen.`;

        const completion = await client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: settings.memberIntroductionResponse.aiResponse.systemPrompt
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: settings.memberIntroductionResponse.aiResponse.maxTokens,
            temperature: settings.memberIntroductionResponse.aiResponse.temperature
        });
        
        return completion.choices[0].message.content.trim();
        
    } catch (error) {
        console.error('❌ Fehler bei AI-Antwort-Generierung:', error);
        return null;
    }
}

// Auf Mitglieder-Vorstellung reagieren
async function respondToMemberIntroduction(message, settings) {
    try {
        console.log(`🎯 Starte Antwort auf Vorstellung von ${message.author.username}`);
        
        // Cooldown prüfen
        if (isMemberResponseOnCooldown(message.author.id, settings)) {
            console.log(`⏰ Cooldown aktiv für ${message.author.username}`);
            return;
        }
        
        // Reaktionen hinzufügen
        if (settings.memberIntroductionResponse.autoReact) {
            const maxReactions = settings.memberIntroductionResponse.maxReactions || 3;
            const availableReactions = [...settings.memberIntroductionResponse.reactions];
            
            // Zufällige Auswahl der Reaktionen
            const selectedReactions = [];
            for (let i = 0; i < Math.min(maxReactions, availableReactions.length); i++) {
                const randomIndex = Math.floor(Math.random() * availableReactions.length);
                selectedReactions.push(availableReactions.splice(randomIndex, 1)[0]);
            }
            
            console.log(`😊 Füge ${selectedReactions.length} zufällige Reaktionen hinzu: ${selectedReactions.join(' ')}`);
            
            for (const reaction of selectedReactions) {
                try {
                    await message.react(reaction);
                    console.log(`✅ Reaktion hinzugefügt: ${reaction}`);
                    await new Promise(resolve => setTimeout(resolve, 500)); // Kurze Pause zwischen Reaktionen
                } catch (error) {
                    console.log(`⚠️ Konnte Reaktion nicht hinzufügen: ${reaction} - ${error.message}`);
                }
            }
        }
        
        // Konfigurierbare automatische Antwort senden
        if (settings.memberIntroductionResponse.autoReply) {
            console.log(`💬 Sende konfigurierbare Antwort...`);
            
            const customResponses = settings.memberIntroductionResponse.customResponses || [];
            
            if (customResponses.length === 0) {
                console.log(`⚠️ Keine benutzerdefinierten Antworten konfiguriert!`);
                return;
            }
            
            // Zufällige Antwort aus den konfigurierten Antworten wählen
            const randomResponseTemplate = customResponses[Math.floor(Math.random() * customResponses.length)];
            
            // Template-Variablen ersetzen
            const variables = {
                user: message.author.displayName || message.author.username,
                username: message.author.username,
                server: message.guild.name,
                channel: message.channel.name
            };
            
            const randomResponse = replaceTemplateVariables(randomResponseTemplate, variables);
            
            // Kurze Verzögerung für natürlicheres Verhalten
            const delay = Math.random() * 2000 + 1000; // 1-3 Sekunden
            console.log(`⏱️ Warte ${Math.round(delay/1000)}s vor Antwort`);
            
            setTimeout(async () => {
                try {
                    await message.reply({
                        content: randomResponse,
                        allowedMentions: { repliedUser: true }
                    });
                    
                    // Statistiken aktualisieren
                    const stats = loadIntroductionStats();
                    stats.memberResponses = (stats.memberResponses || 0) + 1;
                    stats.lastMemberResponse = Date.now();
                    saveIntroductionStats(stats);
                    
                    console.log(`✅ Auf Vorstellung von ${message.author.username} geantwortet`);
                    
                    // XP-Bonus für Vorstellung vergeben (falls aktiviert)
                    await handleIntroductionXPBonus(message, settings);
                    
                } catch (error) {
                    console.error('❌ Fehler beim Senden der Antwort:', error);
                }
            }, delay);
        }
        
        // Cooldown setzen
        setMemberResponseCooldown(message.author.id, settings);
        console.log(`⏰ Cooldown gesetzt für ${message.author.username}`);
        
    } catch (error) {
        console.error('❌ Fehler beim Antworten auf Mitglieder-Vorstellung:', error);
    }
}

// Embed erstellen
function createIntroductionEmbed(client, settings, context = {}) {
    const { user, guild, channel } = context;
    
    // Template-Variablen sammeln
    const botStats = getBotStatistics(client);
    const variables = {
        botName: client.user.displayName || client.user.username,
        serverName: guild?.name || 'diesem Server',
        channelName: channel?.name || 'diesem Channel',
        memberCount: guild?.memberCount || 'unbekannt',
        timestamp: new Date().toLocaleString('de-DE'),
        ...botStats
    };
    
    // Embed erstellen
    const embed = new EmbedBuilder()
        .setTitle(replaceTemplateVariables(settings.embed.title, variables))
        .setDescription(replaceTemplateVariables(settings.embed.description, variables))
        .setColor(parseInt(settings.embed.color.replace('0x', ''), 16))
        .setTimestamp();
    
    // Thumbnail
    if (settings.embed.thumbnail === 'bot') {
        embed.setThumbnail(client.user.displayAvatarURL());
    } else if (settings.embed.thumbnail === 'server' && guild) {
        embed.setThumbnail(guild.iconURL());
    } else if (settings.embed.thumbnail === 'custom' && settings.embed.customThumbnail) {
        embed.setThumbnail(settings.embed.customThumbnail);
    }
    
    // Author
    if (settings.embed.author.enabled) {
        embed.setAuthor({
            name: replaceTemplateVariables(settings.embed.author.name, variables),
            iconURL: settings.embed.author.iconUrl || client.user.displayAvatarURL()
        });
    }
    
    // Fields
    settings.embed.fields.forEach(field => {
        embed.addFields({
            name: replaceTemplateVariables(field.name, variables),
            value: replaceTemplateVariables(field.value, variables),
            inline: field.inline
        });
    });
    
    // Statistiken hinzufügen
    if (settings.statistics.showInEmbed) {
        const statsFields = [];
        
        if (settings.statistics.fields.serverCount) {
            statsFields.push(`🏠 **${botStats.serverCount}** Server`);
        }
        if (settings.statistics.fields.memberCount) {
            statsFields.push(`👥 **${botStats.memberCount}** Nutzer`);
        }
        if (settings.statistics.fields.uptime) {
            statsFields.push(`⏱️ **${botStats.uptime}** Online`);
        }
        if (settings.statistics.fields.version) {
            statsFields.push(`📦 **${botStats.version}** Version`);
        }
        
        if (statsFields.length > 0) {
            embed.addFields({
                name: '📊 Bot-Statistiken',
                value: statsFields.join('\n'),
                inline: true
            });
        }
    }
    
    // Personalisierte Begrüßung
    if (user && settings.personalizedGreeting.enabled) {
        const greeting = generatePersonalizedGreeting(user, settings);
        if (greeting) {
            embed.setDescription(greeting + '\n\n' + embed.data.description);
        }
    }
    
    // Footer
    embed.setFooter({
        text: replaceTemplateVariables(settings.embed.footer, variables),
        iconURL: client.user.displayAvatarURL()
    });
    
    return embed;
}

// Buttons erstellen
function createIntroductionButtons(settings, context = {}) {
    if (!settings.buttons.enabled || !settings.buttons.buttons.length) {
        return null;
    }
    
    const { user, guild } = context;
    let buttonsToShow = [...settings.buttons.buttons];
    
    // Admin-Dashboard-Button hinzufügen, wenn User Admin ist
    if (user && guild) {
        try {
            const member = guild.members.cache.get(user.id);
            if (member && (member.permissions.has('Administrator') || member.permissions.has('ManageGuild'))) {
                // Dashboard-Button für Admins hinzufügen
                buttonsToShow.unshift({
                    label: '📊 Dashboard',
                    style: 'link',
                    url: 'http://localhost:5173',
                    emoji: '📊'
                });
            }
        } catch (error) {
            console.log('⚠️ Konnte Admin-Status nicht prüfen:', error.message);
        }
    }
    
    const buttons = buttonsToShow.map(buttonConfig => {
        const button = new ButtonBuilder()
            .setLabel(buttonConfig.label);
        
        if (buttonConfig.emoji) {
            button.setEmoji(buttonConfig.emoji);
        }
        
        if (buttonConfig.style === 'link') {
            button.setStyle(ButtonStyle.Link)
                  .setURL(buttonConfig.url);
        } else {
            const styleMap = {
                'primary': ButtonStyle.Primary,
                'secondary': ButtonStyle.Secondary,
                'success': ButtonStyle.Success,
                'danger': ButtonStyle.Danger
            };
            
            button.setStyle(styleMap[buttonConfig.style] || ButtonStyle.Secondary)
                  .setCustomId(buttonConfig.customId);
        }
        
        return button;
    });
    
    return new ActionRowBuilder().addComponents(buttons);
}

// Hauptfunktion: Bot-Vorstellung posten
async function postBotIntroduction(client, context = {}) {
    try {
        const settings = loadIntroductionSettings();
        
        // Nur prüfen ob das System grundsätzlich aktiviert ist
        // autoPost nur für automatische Trigger relevant, nicht für manuelle
        if (!settings.enabled) {
            console.log('🤖 Bot-Vorstellungen sind deaktiviert');
            return { success: false, error: 'Bot-Vorstellungen sind deaktiviert' };
        }
        
        // autoPost nur bei automatischen Triggern prüfen, nicht bei manuellen
        const isAutomatic = context.trigger && context.trigger !== 'manual';
        if (isAutomatic && !settings.autoPost) {
            console.log('🤖 Automatische Bot-Vorstellungen sind deaktiviert');
            return { success: false, error: 'Automatische Bot-Vorstellungen sind deaktiviert' };
        }
        
        const { channel, user, trigger } = context;
        let targetChannel = channel;
        
        // Channel finden falls nicht übergeben
        if (!targetChannel) {
            for (const guild of client.guilds.cache.values()) {
                const foundChannel = guild.channels.cache.find(ch => 
                    ch.name === settings.channelName && ch.type === 0
                );
                if (foundChannel) {
                    targetChannel = foundChannel;
                    break;
                }
            }
        }
        
        if (!targetChannel) {
            console.error(`❌ Vorstellungs-Channel "${settings.channelName}" nicht gefunden`);
            return { success: false, error: `Vorstellungs-Channel "${settings.channelName}" nicht gefunden` };
        }
        
        // Cooldown prüfen (nur wenn aktiviert)
        if (settings.cooldown.enabled && isOnCooldown(targetChannel.id, settings)) {
            const remaining = getRemainingCooldown(targetChannel.id, settings);
            const minutes = Math.ceil(remaining / 60000);
            console.log(`🕒 Bot-Vorstellung auf Cooldown (noch ${minutes} Minuten)`);
            return { success: false, error: `Bot-Vorstellung auf Cooldown (noch ${minutes} Minuten)` };
        }
        
        // Embed und Buttons erstellen
        const embed = createIntroductionEmbed(client, settings, {
            user,
            guild: targetChannel.guild,
            channel: targetChannel
        });
        
        const buttons = createIntroductionButtons(settings, {
            user,
            guild: targetChannel.guild,
            channel: targetChannel
        });
        
        // Nachricht senden
        const messageOptions = { embeds: [embed] };
        if (buttons) {
            messageOptions.components = [buttons];
        }
        
        await targetChannel.send(messageOptions);
        
        // Cooldown setzen (nur wenn aktiviert)
        if (settings.cooldown.enabled) {
            setCooldown(targetChannel.id, settings);
        }
        
        // Statistiken aktualisieren
        updateIntroductionStats(trigger || 'manual');
        
        console.log(`✅ Bot-Vorstellung gepostet in #${targetChannel.name} (Trigger: ${trigger || 'manual'})`);
        return { success: true, message: 'Bot-Vorstellung erfolgreich gepostet' };
        
    } catch (error) {
        console.error('❌ Fehler beim Posten der Bot-Vorstellung:', error);
        return { success: false, error: 'Fehler beim Posten der Bot-Vorstellung: ' + error.message };
    }
}

// Statistiken verwalten
function loadIntroductionStats() {
    try {
        if (fs.existsSync('./bot-introduction-stats.json')) {
            return JSON.parse(fs.readFileSync('./bot-introduction-stats.json', 'utf8'));
        }
        return {
            totalIntroductions: 0,
            triggerStats: {
                manual: 0,
                channelCreate: 0,
                channelMention: 0,
                keywords: 0,
                command: 0
            },
            lastIntroduction: null,
            buttonInteractions: {
                help: 0,
                commands: 0,
                dashboard: 0
            }
        };
    } catch (error) {
        console.error('❌ Fehler beim Laden der Vorstellungs-Statistiken:', error);
        return {};
    }
}

function saveIntroductionStats(stats) {
    try {
        fs.writeFileSync('./bot-introduction-stats.json', JSON.stringify(stats, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Vorstellungs-Statistiken:', error);
        return false;
    }
}

function updateIntroductionStats(trigger) {
    const stats = loadIntroductionStats();
    
    stats.totalIntroductions++;
    stats.triggerStats[trigger] = (stats.triggerStats[trigger] || 0) + 1;
    stats.lastIntroduction = new Date().toISOString();
    
    saveIntroductionStats(stats);
}

// Event-Handler für verschiedene Trigger
function setupIntroductionTriggers(client) {
    console.log('🤖 Initialisiere Bot-Vorstellungs-Trigger...');
    
    // Channel-Erstellung
    client.on('channelCreate', async (channel) => {
        const settings = loadIntroductionSettings(); // Dynamisch laden
        if (!settings.enabled || !settings.triggers.onChannelCreate) return;
        
        if (channel.name === settings.channelName && channel.type === 0) {
            console.log(`📺 Channel "${channel.name}" erstellt - Bot-Vorstellung wird gepostet`);
            setTimeout(() => {
                postBotIntroduction(client, { 
                    channel, 
                    trigger: 'channelCreate' 
                });
            }, 2000); // 2 Sekunden warten
        }
    });
    
    // Nachrichten-Trigger (Keywords, Mentions, Mitglieder-Vorstellungen)
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        
        const settings = loadIntroductionSettings(); // Dynamisch laden
        if (!settings.enabled) return;
        
        const content = message.content.toLowerCase();
        
        console.log(`📝 Nachricht von ${message.author.username} in #${message.channel.name}: "${message.content.substring(0, 50)}..."`);
        
        // Mitglieder-Vorstellungen erkennen und darauf reagieren
        // Prüfe ob mindestens eine Mitglieder-Antwort-Funktion aktiviert ist
        const memberResponseActive = settings.memberIntroductionResponse.autoReact || 
                                    settings.memberIntroductionResponse.autoReply;
        
        if (memberResponseActive) {
            const isIntroduction = isMemberIntroduction(message, settings);
            console.log(`🔍 Vorstellungs-Check: ${isIntroduction ? '✅ ERKANNT' : '❌ NICHT ERKANNT'}`);
            console.log(`   - Channel: #${message.channel.name}`);
            console.log(`   - Wörter: ${message.content.split(/\s+/).length}`);
            console.log(`   - Keywords gefunden: ${settings.memberIntroductionResponse.detectionKeywords.some(keyword => content.includes(keyword.toLowerCase()))}`);
            console.log(`   - AutoReact: ${settings.memberIntroductionResponse.autoReact}`);
            console.log(`   - AutoReply: ${settings.memberIntroductionResponse.autoReply}`);
            
            if (isIntroduction) {
                console.log(`🎯 Reagiere auf Vorstellung von ${message.author.username}`);
                await respondToMemberIntroduction(message, settings);
                return; // Nicht weiter prüfen, um doppelte Reaktionen zu vermeiden
            }
        }
        
        // Bot-Mention
        if (settings.triggers.onChannelMention && message.mentions.has(client.user)) {
            console.log(`🤖 Bot wurde erwähnt von ${message.author.username}`);
            await postBotIntroduction(client, {
                channel: message.channel,
                user: message.author,
                trigger: 'channelMention'
            });
            return;
        }
        
        // Keywords
        if (settings.triggers.onKeywords) {
            const hasKeyword = settings.keywords.some(keyword => 
                content.includes(keyword.toLowerCase())
            );
            
            if (hasKeyword) {
                console.log(`🔑 Keyword erkannt von ${message.author.username}`);
                await postBotIntroduction(client, {
                    channel: message.channel,
                    user: message.author,
                    trigger: 'keywords'
                });
            }
        }
    });
    
    console.log('✅ Bot-Vorstellungs-Trigger aktiviert');
}

// Button-Interaktionen behandeln (deaktiviert)
async function handleIntroductionButtonInteraction(interaction) {
    // Buttons sind deaktiviert - keine Interaktionen mehr nötig
    await interaction.reply({
        content: '❌ Diese Funktion ist nicht mehr verfügbar.',
        ephemeral: true
    });
}

// API-Endpoints registrieren
function registerBotIntroductionAPI(app, client) {
    
    // Einstellungen laden
    app.get('/api/bot-introduction/settings', (req, res) => {
        try {
            const settings = loadIntroductionSettings();
            res.json(settings);
        } catch (error) {
            console.error('❌ Fehler beim Laden der Bot-Vorstellungs-Einstellungen:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Einstellungen' });
        }
    });
    
    // Einstellungen speichern
    app.post('/api/bot-introduction/settings', (req, res) => {
        try {
            const newSettings = req.body;
            const success = saveIntroductionSettings(newSettings);
            
            if (success) {
                res.json({ success: true, message: 'Bot-Vorstellungs-Einstellungen gespeichert' });
            } else {
                res.status(500).json({ error: 'Fehler beim Speichern der Einstellungen' });
            }
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Bot-Vorstellungs-Einstellungen:', error);
            res.status(500).json({ error: 'Fehler beim Speichern der Einstellungen' });
        }
    });
    
    // Statistiken abrufen
    app.get('/api/bot-introduction/stats', (req, res) => {
        try {
            const stats = loadIntroductionStats();
            res.json(stats);
        } catch (error) {
            console.error('❌ Fehler beim Laden der Vorstellungs-Statistiken:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Statistiken' });
        }
    });
    
    // Test-Endpunkt
    app.post('/api/bot-introduction/test', async (req, res) => {
        try {
            const { channelName } = req.body;
            const result = await postBotIntroduction(client, { channelName });
            
            if (result.success) {
                updateIntroductionStats('manual');
                res.json({ success: true, message: 'Test-Vorstellung gesendet!' });
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            console.error('❌ Fehler beim Testen der Vorstellung:', error);
            res.status(500).json({ error: 'Interner Serverfehler' });
        }
    });

    // Bot-Vorstellung posten
    app.post('/api/bot-introduction/post', async (req, res) => {
        try {
            const { channelName } = req.body;
            const result = await postBotIntroduction(client, { channelName });
            
            if (result.success) {
                updateIntroductionStats('manual');
                res.json({ success: true, message: 'Bot-Vorstellung erfolgreich gepostet!' });
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (error) {
            console.error('❌ Fehler beim Posten der Vorstellung:', error);
            res.status(500).json({ error: 'Interner Serverfehler' });
        }
    });
    
    // XP-Bonus Statistiken abrufen
    app.get('/api/bot-introduction/xp-stats', (req, res) => {
        try {
            const xpStats = getIntroductionXPStats();
            res.json(xpStats);
        } catch (error) {
            console.error('❌ Fehler beim Laden der XP-Statistiken:', error);
            res.status(500).json({ error: 'Fehler beim Laden der XP-Statistiken' });
        }
    });

    // XP-Bonus für User zurücksetzen (Admin-Funktion)
    app.post('/api/bot-introduction/reset-xp-bonus/:userId', (req, res) => {
        try {
            const { userId } = req.params;
            const tracking = loadIntroductionXPTracking();
            
            const index = tracking.usersWithIntroductionBonus.indexOf(userId);
            if (index > -1) {
                tracking.usersWithIntroductionBonus.splice(index, 1);
                saveIntroductionXPTracking(tracking);
                res.json({ success: true, message: 'XP-Bonus für User zurückgesetzt' });
            } else {
                res.status(404).json({ error: 'User hat noch keinen XP-Bonus erhalten' });
            }
        } catch (error) {
            console.error('❌ Fehler beim Zurücksetzen des XP-Bonus:', error);
            res.status(500).json({ error: 'Fehler beim Zurücksetzen des XP-Bonus' });
        }
    });

    // Alle XP-Bonus-Daten zurücksetzen (Admin-Funktion)
    app.post('/api/bot-introduction/reset-all-xp-bonus', (req, res) => {
        try {
            const resetData = {
                usersWithIntroductionBonus: [],
                lastUpdated: Date.now(),
                totalBonusesGiven: 0
            };
            saveIntroductionXPTracking(resetData);
            res.json({ success: true, message: 'Alle XP-Bonus-Daten zurückgesetzt' });
        } catch (error) {
            console.error('❌ Fehler beim Zurücksetzen aller XP-Bonus-Daten:', error);
            res.status(500).json({ error: 'Fehler beim Zurücksetzen aller XP-Bonus-Daten' });
        }
    });

    console.log('🤖 Bot-Vorstellungs-API registriert');
}

// XP-Bonus für Vorstellung handhaben
async function handleIntroductionXPBonus(message, settings) {
    try {
        // Prüfen ob XP-Bonus aktiviert ist
        if (!settings.memberIntroductionResponse?.xpBonus?.enabled) {
            return;
        }
        
        const userId = message.author.id;
        const xpBonusSettings = settings.memberIntroductionResponse.xpBonus;
        
        // Prüfen ob User bereits Bonus erhalten hat (falls onlyFirstTime aktiviert)
        if (xpBonusSettings.onlyFirstTime && hasUserReceivedIntroductionBonus(userId)) {
            console.log(`⚠️ ${message.author.username} hat bereits Vorstellungs-Bonus erhalten`);
            return;
        }
        
        // XP-System laden
        const xpSystem = global.xpSystem;
        if (!xpSystem) {
            console.log('⚠️ XP-System nicht verfügbar für Vorstellungs-Bonus');
            return;
        }
        
        // XP hinzufügen
        const bonusAmount = xpBonusSettings.amount || 100;
        xpSystem.addXP(userId, bonusAmount, message.author);
        
        // User als "Bonus erhalten" markieren
        if (xpBonusSettings.onlyFirstTime) {
            markUserAsReceivedIntroductionBonus(userId);
        }
        
        // Bonus-Nachricht senden (falls konfiguriert)
        if (xpBonusSettings.message) {
            const bonusMessage = xpBonusSettings.message.replace('{amount}', bonusAmount);
            
            // Kurze Verzögerung vor Bonus-Nachricht
            setTimeout(async () => {
                try {
                    const sentMessage = await message.reply({
                        content: bonusMessage,
                        allowedMentions: { repliedUser: false }
                    });
                    
                    // Nachricht nach konfigurierbarer Zeit automatisch löschen
                    if (xpBonusSettings.autoDelete?.enabled) {
                        const deleteDelay = (xpBonusSettings.autoDelete?.delaySeconds || 10) * 1000;
                        setTimeout(async () => {
                            try {
                                await sentMessage.delete();
                                console.log(`🗑️ XP-Bonus-Nachricht automatisch gelöscht für ${message.author.username} nach ${deleteDelay/1000}s`);
                            } catch (deleteError) {
                                console.log('⚠️ Konnte XP-Bonus-Nachricht nicht löschen (bereits gelöscht oder keine Berechtigung)');
                            }
                        }, deleteDelay);
                    }
                    
                } catch (error) {
                    console.error('❌ Fehler beim Senden der XP-Bonus-Nachricht:', error);
                }
            }, 3000); // 3 Sekunden nach der Hauptantwort
        }
        
        console.log(`🎉 ${message.author.username} hat ${bonusAmount} XP Vorstellungs-Bonus erhalten!`);
        
    } catch (error) {
        console.error('❌ Fehler beim Vergeben des Vorstellungs-XP-Bonus:', error);
    }
}

// XP-Tracking Funktionen
function loadIntroductionXPTracking() {
    try {
        const fs = require('fs');
        if (fs.existsSync('./introduction-xp-tracking.json')) {
            const data = fs.readFileSync('./introduction-xp-tracking.json', 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('❌ Fehler beim Laden der XP-Tracking-Daten:', error);
    }
    
    // Standard-Daten zurückgeben
    return {
        usersWithIntroductionBonus: [],
        lastUpdated: 0,
        totalBonusesGiven: 0
    };
}

function saveIntroductionXPTracking(data) {
    try {
        const fs = require('fs');
        data.lastUpdated = Date.now();
        fs.writeFileSync('./introduction-xp-tracking.json', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Fehler beim Speichern der XP-Tracking-Daten:', error);
    }
}

function hasUserReceivedIntroductionBonus(userId) {
    const tracking = loadIntroductionXPTracking();
    return tracking.usersWithIntroductionBonus.includes(userId);
}

function markUserAsReceivedIntroductionBonus(userId) {
    const tracking = loadIntroductionXPTracking();
    
    if (!tracking.usersWithIntroductionBonus.includes(userId)) {
        tracking.usersWithIntroductionBonus.push(userId);
        tracking.totalBonusesGiven = (tracking.totalBonusesGiven || 0) + 1;
        saveIntroductionXPTracking(tracking);
    }
}

function getIntroductionXPStats() {
    const tracking = loadIntroductionXPTracking();
    return {
        totalUsersWithBonus: tracking.usersWithIntroductionBonus.length,
        totalBonusesGiven: tracking.totalBonusesGiven || 0,
        lastUpdated: tracking.lastUpdated
    };
}

// Exports
module.exports = {
    loadIntroductionSettings,
    saveIntroductionSettings,
    postBotIntroduction,
    setupIntroductionTriggers,
    handleIntroductionButtonInteraction,
    registerBotIntroductionAPI,
    loadIntroductionStats,
    updateIntroductionStats,
    isMemberIntroduction,
    respondToMemberIntroduction
}; 