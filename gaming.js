// ================================================================
// 🎮 GAMING SYSTEM - LFG RESPONSE HANDLER
// ================================================================
// Erweiterte LFG Funktionalität mit Team-Building und Antworten
// Features: LFG Responses, Team Formation, Auto-Voice Channels

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

// ================================================================
// LFG RESPONSE SYSTEM
// ================================================================

// Aktive LFG Posts (In-Memory Cache)
const activeLFGPosts = new Map();

// LFG Post Struktur
class LFGPost {
    constructor(messageId, authorId, game, description, maxPlayers = 5) {
        this.messageId = messageId;
        this.authorId = authorId;
        this.game = game;
        this.description = description;
        this.maxPlayers = maxPlayers;
        this.joinedPlayers = [authorId]; // Creator ist automatisch dabei
        this.createdAt = new Date();
        this.status = 'open'; // open, full, closed
    }

    addPlayer(userId) {
        if (!this.joinedPlayers.includes(userId) && this.joinedPlayers.length < this.maxPlayers) {
            this.joinedPlayers.push(userId);
            if (this.joinedPlayers.length >= this.maxPlayers) {
                this.status = 'full';
            }
            return true;
        }
        return false;
    }

    removePlayer(userId) {
        const index = this.joinedPlayers.indexOf(userId);
        if (index > 0) { // Index 0 ist der Creator, kann nicht entfernt werden
            this.joinedPlayers.splice(index, 1);
            this.status = 'open';
            return true;
        }
        return false;
    }

    isFull() {
        return this.joinedPlayers.length >= this.maxPlayers;
    }

    getPlayerCount() {
        return `${this.joinedPlayers.length}/${this.maxPlayers}`;
    }
}

// ================================================================
// LFG MESSAGE HANDLER MIT RESPONSE SYSTEM
// ================================================================

async function handleLFGMessageWithResponses(message) {
    try {
        // Lade LFG Settings aus Supabase
        const { loadLFGSettings } = require('./lfg-supabase-api');
        const settings = await loadLFGSettings(message.guild.id);
        
        console.log(`🔍 LFG Message Check - User: ${message.author.tag}, Channel: ${message.channel.name}, Content: "${message.content}"`);
        console.log(`🔧 LFG Settings - Enabled: ${settings.enabled}, Channel: ${settings.channelName}, Role: ${settings.roleName}`);
        
        if (!settings.enabled) {
            console.log('⚠️ LFG System ist deaktiviert');
            return;
        }
        
        // Prüfe ob Nachricht im LFG Channel ist
        const isCorrectChannel = message.channel.name === settings.channelName || message.channel.id === settings.channelId;
        console.log(`📍 Channel Check - Aktuell: ${message.channel.name} (${message.channel.id}), Erwartet: ${settings.channelName} (${settings.channelId}), Match: ${isCorrectChannel}`);
        
        if (!isCorrectChannel) {
            console.log('⚠️ Nachricht nicht im LFG Channel');
            return;
        }
        
        // Prüfe ob User die LFG Role erwähnt
        const lfgRoleMention = `<@&${settings.roleId}>`;
        const hasRoleMention = message.content.includes(lfgRoleMention) || message.content.includes(`@${settings.roleName}`);
        console.log(`🏷️ Role Check - Erwartet: ${lfgRoleMention} oder @${settings.roleName}, Content: "${message.content}", Match: ${hasRoleMention}`);
        
        if (!hasRoleMention) {
            console.log('⚠️ Keine LFG Rolle erwähnt');
            return;
        }
        
        console.log(`🎮 LFG Request erkannt von ${message.author.tag}: ${message.content}`);
        
        // Parse LFG Message für Spiel-Info
        const gameInfo = parseLFGMessage(message.content, settings.allowedGames, settings);
        console.log(`🎯 Parsed Game Info:`, gameInfo);
        
        // Erstelle LFG Post Object
        const lfgPost = new LFGPost(
            message.id,
            message.author.id,
            gameInfo.game,
            gameInfo.description,
            gameInfo.maxPlayers
        );
        
        // Speichere in aktivem Cache
        activeLFGPosts.set(message.id, lfgPost);
        console.log(`💾 LFG Post gespeichert - ID: ${message.id}, Active Posts: ${activeLFGPosts.size}`);
        
        // Speichere auch in Supabase für Persistenz
        const { saveActiveLFGPost } = require('./lfg-supabase-api');
        await saveActiveLFGPost(lfgPost, message.guild.id, message.channel.id, message.author.displayName);
        
        // Erstelle Interactive Embed mit Buttons
        const embed = createLFGEmbed(lfgPost, message.author, settings);
        const buttons = settings.enableButtons ? createLFGButtons(lfgPost, settings) : null;
        console.log(`🔧 Button Settings - enableButtons: ${settings.enableButtons}, buttons created: ${!!buttons}`);
        
        // Sende LFG Embed mit Buttons
        const messageOptions = { embeds: [embed] };
        if (buttons) {
            messageOptions.components = [buttons];
            console.log(`✅ Buttons hinzugefügt zu LFG Message`);
        } else {
            console.log(`⚠️ Keine Buttons erstellt - enableButtons: ${settings.enableButtons}`);
        }
        const lfgMessage = await message.channel.send(messageOptions);
        console.log(`📤 LFG Embed gesendet - Message ID: ${lfgMessage.id}`);
        
        // Lösche ursprüngliche Nachricht
        await message.delete();
        console.log(`🗑️ Ursprüngliche Nachricht gelöscht`);
        
        // Auto-Delete Timer
        if (settings.autoDeleteAfterHours > 0) {
            setTimeout(async () => {
                try {
                    await lfgMessage.delete();
                    activeLFGPosts.delete(message.id);
                    console.log(`⏰ LFG Post automatisch gelöscht nach ${settings.autoDeleteAfterHours} Stunden`);
                } catch (error) {
                    console.log('LFG Auto-Delete Fehler:', error.message);
                }
            }, settings.autoDeleteAfterHours * 60 * 60 * 1000);
        }
        
    } catch (error) {
        console.error('❌ Fehler beim LFG Message Handling:', error);
    }
}

// ================================================================
// LFG MESSAGE PARSING
// ================================================================

function parseLFGMessage(content, allowedGames, settings) {
    // Entferne Role Mentions
    let cleanContent = content.replace(/<@&\d+>/g, '').replace(/@\w+/g, '').trim();
    
    // Suche nach Spiel in der Nachricht (wenn aktiviert)
    let detectedGame = 'Unbekannt';
    if (settings.enableGameDetection) {
        for (const game of allowedGames) {
            if (cleanContent.toLowerCase().includes(game.toLowerCase())) {
                detectedGame = game;
                break;
            }
        }
    }
    
    // Extrahiere Spieleranzahl aus Nachricht (wenn aktiviert)
    let maxPlayers = 5; // Default
    if (settings.enableTeamSizeDetection) {
        const playerMatch = cleanContent.match(/(\d+)\s*(spieler|player|man|mann)/i);
        if (playerMatch) {
            const detectedSize = parseInt(playerMatch[1]);
            maxPlayers = Math.max(settings.minTeamSize, Math.min(detectedSize, settings.maxTeamSize));
        }
    }
    
    // Verwende konfigurierte Team-Größen
    if (settings.gameTeamSizes && settings.gameTeamSizes[detectedGame]) {
        maxPlayers = settings.gameTeamSizes[detectedGame];
    }
    
    // Override mit globaler Einstellung falls gesetzt
    if (settings.voiceUserLimitOverride) {
        maxPlayers = Math.max(settings.minTeamSize, Math.min(settings.voiceUserLimitOverride, settings.maxTeamSize));
    }
    
    return {
        game: detectedGame,
        description: cleanContent,
        maxPlayers: maxPlayers
    };
}

// ================================================================
// LFG EMBED CREATION
// ================================================================

function createLFGEmbed(lfgPost, author, settings) {
    const gameEmojis = {
        'Valorant': '🎯',
        'League of Legends': '⭐',
        'Overwatch 2': '🧡',
        'Counter-Strike 2': '🔫',
        'CS2': '🔫',
        'Apex Legends': '🔺',
        'Rocket League': '🚗',
        'Call of Duty': '🎖️',
        'Fortnite': '🏗️',
        'Fragpunk': '🎮'
    };
    
    const gameEmoji = gameEmojis[lfgPost.game] || '🎮';
    const statusEmoji = lfgPost.status === 'full' ? '✅' : lfgPost.status === 'open' ? '🟢' : '🔴';
    
    const embed = new EmbedBuilder()
        .setColor(parseInt(settings.roleColor.replace('#', ''), 16))
        .setTitle(`${gameEmoji} ${lfgPost.game} - LFG Request`)
        .setDescription(lfgPost.description)
        .setAuthor({
            name: author.displayName,
            iconURL: author.displayAvatarURL()
        })
        .addFields(
            {
                name: '👥 Spieler',
                value: `${statusEmoji} ${lfgPost.getPlayerCount()}`,
                inline: true
            },
            {
                name: '🎮 Spiel',
                value: lfgPost.game,
                inline: true
            },
            {
                name: '⏰ Status',
                value: lfgPost.status === 'open' ? 'Offen' : 
                       lfgPost.status === 'full' ? 'Voll' : 'Geschlossen',
                inline: true
            }
        )
        .setTimestamp()
        .setFooter({
            text: `LFG System • Auto-Delete nach ${settings.autoDeleteAfterHours}h`
        });
    
    // Zeige beigetretene Spieler
    if (lfgPost.joinedPlayers.length > 1) {
        const playerList = lfgPost.joinedPlayers.map(id => `<@${id}>`).join('\n');
        embed.addFields({
            name: '✅ Beigetreten',
            value: playerList,
            inline: false
        });
    }
    
    return embed;
}

// ================================================================
// LFG BUTTONS CREATION
// ================================================================

function createLFGButtons(lfgPost, settings) {
    const buttons = [];
    
    // Beitreten Button (immer anzeigen)
    const joinButton = new ButtonBuilder()
        .setCustomId(`lfg_join_${lfgPost.messageId}`)
        .setLabel(`Beitreten (${lfgPost.getPlayerCount()})`)
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success)
        .setDisabled(lfgPost.isFull());
    buttons.push(joinButton);
    
    // Verlassen Button
    const leaveButton = new ButtonBuilder()
        .setCustomId(`lfg_leave_${lfgPost.messageId}`)
        .setLabel('Verlassen')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger);
    buttons.push(leaveButton);
    
    // Voice Channel Button (nur wenn aktiviert)
    if (settings.enableVoiceCreation) {
        const voiceButton = new ButtonBuilder()
            .setCustomId(`lfg_voice_${lfgPost.messageId}`)
            .setLabel('Voice Channel')
            .setEmoji('🎤')
            .setStyle(ButtonStyle.Primary);
        buttons.push(voiceButton);
    }
    
    // Schließen Button
    const closeButton = new ButtonBuilder()
        .setCustomId(`lfg_close_${lfgPost.messageId}`)
        .setLabel('Schließen')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Secondary);
    buttons.push(closeButton);
    
    return new ActionRowBuilder().addComponents(...buttons);
}

// ================================================================
// BUTTON INTERACTION HANDLER
// ================================================================

async function handleLFGButtonInteraction(interaction) {
    try {
        const [action, messageId] = interaction.customId.split('_').slice(1);
        const lfgPost = activeLFGPosts.get(messageId);
        
        if (!lfgPost) {
            return await interaction.reply({
                content: '❌ Dieser LFG Post ist nicht mehr aktiv.',
                ephemeral: true
            });
        }
        
        const userId = interaction.user.id;
        
        switch (action) {
            case 'join':
                await handleLFGJoin(interaction, lfgPost, userId);
                break;
            case 'leave':
                await handleLFGLeave(interaction, lfgPost, userId);
                break;
            case 'voice':
                await handleLFGVoice(interaction, lfgPost);
                break;
            case 'close':
                await handleLFGClose(interaction, lfgPost, userId);
                break;
        }
        
    } catch (error) {
        console.error('Fehler beim LFG Button Handling:', error);
        await interaction.reply({
            content: '❌ Ein Fehler ist aufgetreten.',
            ephemeral: true
        });
    }
}

// ================================================================
// LFG JOIN HANDLER
// ================================================================

async function handleLFGJoin(interaction, lfgPost, userId) {
    if (lfgPost.joinedPlayers.includes(userId)) {
        return await interaction.reply({
            content: '❌ Du bist bereits in diesem Team!',
            ephemeral: true
        });
    }
    
    if (lfgPost.isFull()) {
        return await interaction.reply({
            content: '❌ Das Team ist bereits voll!',
            ephemeral: true
        });
    }
    
    // Füge Spieler hinzu
    lfgPost.addPlayer(userId);
    
    // Aktualisiere auch in Supabase
    const { updateActiveLFGPost } = require('./lfg-supabase-api');
    await updateActiveLFGPost(lfgPost.messageId, lfgPost.joinedPlayers, lfgPost.status);
    
    // Aktualisiere Embed und Buttons
    const author = await interaction.client.users.fetch(lfgPost.authorId);
    const settings = await require('./lfg-supabase-api').loadLFGSettings(interaction.guild.id);
    
    const updatedEmbed = createLFGEmbed(lfgPost, author, settings);
    const updatedButtons = createLFGButtons(lfgPost, settings);
    
    await interaction.update({
        embeds: [updatedEmbed],
        components: [updatedButtons]
    });
    
    // Benachrichtige Team Creator per DM (wenn aktiviert)
    if (settings.enableDmNotifications) {
        try {
            const creator = await interaction.client.users.fetch(lfgPost.authorId);
            const joinEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎮 Neuer Spieler beigetreten!')
                .setDescription(`**${interaction.user.displayName}** ist deinem **${lfgPost.game}** Team beigetreten!`)
                .addFields(
                    {
                        name: '👥 Team Status',
                        value: `${lfgPost.getPlayerCount()} Spieler`,
                        inline: true
                    },
                    {
                        name: '🎮 Spiel',
                        value: lfgPost.game,
                        inline: true
                    }
                )
                .setTimestamp();
            
            await creator.send({ embeds: [joinEmbed] });
        } catch (error) {
            console.log('Konnte Creator nicht benachrichtigen:', error.message);
        }
    }
    
    // Prüfe Auto Voice Join (wenn Owner bereits in Voice Channel ist)
    if (settings.enableAutoVoiceJoin) {
        await checkAndJoinOwnerVoiceChannel(interaction, lfgPost, userId);
    }
    
    // Wenn Team voll ist, erstelle automatisch Voice Channel
    if (lfgPost.isFull()) {
        await createAutoVoiceChannel(interaction, lfgPost);
    }
}

// ================================================================
// AUTO VOICE JOIN HANDLER
// ================================================================

async function checkAndJoinOwnerVoiceChannel(interaction, lfgPost, newUserId) {
    try {
        const guild = interaction.guild;
        
        // Finde den Team Owner (Creator) im Guild
        const ownerMember = await guild.members.fetch(lfgPost.authorId).catch(() => null);
        if (!ownerMember) {
            console.log('🔍 Team Owner nicht im Server gefunden');
            return;
        }
        
        // Prüfe ob Owner in einem Voice Channel ist
        const ownerVoiceChannel = ownerMember.voice.channel;
        if (!ownerVoiceChannel) {
            console.log('🔍 Team Owner ist nicht in einem Voice Channel');
            return;
        }
        
        // Finde den neuen Spieler im Guild
        const newMember = await guild.members.fetch(newUserId).catch(() => null);
        if (!newMember) {
            console.log('🔍 Neuer Spieler nicht im Server gefunden');
            return;
        }
        
        // Prüfe ob neuer Spieler bereits in einem Voice Channel ist
        if (newMember.voice.channel) {
            console.log('🔍 Neuer Spieler ist bereits in einem Voice Channel');
            return;
        }
        
        // Prüfe ob der neue Spieler dem Voice Channel beitreten kann
        const permissions = ownerVoiceChannel.permissionsFor(newMember);
        if (!permissions || !permissions.has('Connect')) {
            console.log('🔍 Neuer Spieler hat keine Berechtigung für Owner Voice Channel');
            
            // Sende Nachricht an neuen Spieler
            await interaction.followUp({
                content: `🎤 **Voice Channel Info**\n\nDer Team Owner **${ownerMember.displayName}** ist bereits in **${ownerVoiceChannel.name}**, aber du hast keine Berechtigung diesem Channel beizutreten.\n\n*Bitte den Owner um Einladung oder nutze den Voice Channel Button.*`,
                ephemeral: true
            });
            return;
        }
        
        // Versuche den neuen Spieler zu verschieben
        await newMember.voice.setChannel(ownerVoiceChannel, 
            `Auto-Join: ${newMember.displayName} ist ${lfgPost.game} Team beigetreten`
        );
        
        console.log(`✅ ${newMember.displayName} automatisch zu ${ownerVoiceChannel.name} verschoben`);
        
        // Sende Erfolgs-Nachricht an neuen Spieler
        await interaction.followUp({
            content: `🎤 **Automatisch verbunden!**\n\nDu wurdest automatisch zu **${ownerVoiceChannel.name}** verschoben, da der Team Owner **${ownerMember.displayName}** bereits dort ist.\n\n*Viel Spaß beim Gaming! 🎮*`,
            ephemeral: true
        });
        
        // Optional: Benachrichtige auch den Owner
        try {
            const ownerUser = await interaction.client.users.fetch(lfgPost.authorId);
            const ownerNotification = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎤 Auto Voice Join!')
                .setDescription(`**${newMember.displayName}** wurde automatisch zu deinem Voice Channel verschoben!`)
                .addFields(
                    {
                        name: '📍 Voice Channel',
                        value: ownerVoiceChannel.name,
                        inline: true
                    },
                    {
                        name: '🎮 Team',
                        value: `${lfgPost.game} (${lfgPost.getPlayerCount()} Spieler)`,
                        inline: true
                    }
                )
                .setTimestamp();
            
            await ownerUser.send({ embeds: [ownerNotification] });
        } catch (error) {
            console.log('Konnte Owner über Auto Voice Join nicht benachrichtigen:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Fehler beim Auto Voice Join:', error);
        
        // Sende Fehler-Nachricht an neuen Spieler
        await interaction.followUp({
            content: `🎤 **Voice Channel Info**\n\nDer Team Owner ist in einem Voice Channel, aber ich konnte dich nicht automatisch verschieben.\n\n*Nutze den Voice Channel Button oder tritt manuell bei.*`,
            ephemeral: true
        }).catch(() => {
            console.log('Konnte Fehler-Nachricht nicht senden');
        });
    }
}

// ================================================================
// LFG LEAVE HANDLER
// ================================================================

async function handleLFGLeave(interaction, lfgPost, userId) {
    if (!lfgPost.joinedPlayers.includes(userId)) {
        return await interaction.reply({
            content: '❌ Du bist nicht in diesem Team!',
            ephemeral: true
        });
    }
    
    // Lade Settings für Creator Protection Check
    const settings = await require('./lfg-supabase-api').loadLFGSettings(interaction.guild.id);
    
    if (userId === lfgPost.authorId && settings.enableCreatorProtection) {
        return await interaction.reply({
            content: '❌ Als Team Creator kannst du das Team nicht verlassen. Nutze "Schließen" um das Team aufzulösen.',
            ephemeral: true
        });
    }
    
    // Entferne Spieler
    lfgPost.removePlayer(userId);
    
    // Aktualisiere auch in Supabase
    const { updateActiveLFGPost } = require('./lfg-supabase-api');
    await updateActiveLFGPost(lfgPost.messageId, lfgPost.joinedPlayers, lfgPost.status);
    
    // Aktualisiere Embed und Buttons
    const author = await interaction.client.users.fetch(lfgPost.authorId);
    
    const updatedEmbed = createLFGEmbed(lfgPost, author, settings);
    const updatedButtons = createLFGButtons(lfgPost, settings);
    
    await interaction.update({
        embeds: [updatedEmbed],
        components: [updatedButtons]
    });
    
    await interaction.followUp({
        content: '✅ Du hast das Team verlassen.',
        ephemeral: true
    });
}

// ================================================================
// AUTO VOICE CHANNEL CREATION
// ================================================================

async function createAutoVoiceChannel(interaction, lfgPost) {
    try {
        const guild = interaction.guild;
        const settings = await require('./lfg-supabase-api').loadLFGSettings(interaction.guild.id);
        
        // Prüfe ob Voice Creation aktiviert ist
        if (!settings.enableVoiceCreation) {
            return;
        }
        
        // Finde oder erstelle Gaming Category
        let category = guild.channels.cache.find(c => 
            c.type === ChannelType.GuildCategory && 
            c.name === settings.voiceCategoryName
        );
        
        if (!category && settings.voiceAutoCreateCategory) {
            category = await guild.channels.create({
                name: settings.voiceCategoryName,
                type: ChannelType.GuildCategory,
                reason: 'Auto-erstellte Gaming Category für LFG System'
            });
        }
        
        // Erstelle Voice Channel
        const gameEmojis = {
            'Valorant': '🎯',
            'League of Legends': '⭐',
            'Overwatch 2': '🧡',
            'Counter-Strike 2': '🔫',
            'CS2': '🔫',
            'Apex Legends': '🔺',
            'Rocket League': '🚗',
            'Call of Duty': '🎖️',
            'Fortnite': '🏗️',
            'Fragpunk': '🎮'
        };
        
        const gameEmoji = gameEmojis[lfgPost.game] || '🎮';
        const channelName = `${settings.voiceChannelPrefix}${gameEmoji} ${lfgPost.game} Team`;
        
        // Bestimme User Limit
        let userLimit = lfgPost.maxPlayers;
        if (settings.voiceUserLimitOverride !== null) {
            userLimit = settings.voiceUserLimitOverride;
        }
        
        const voiceChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildVoice,
            parent: category ? category.id : null,
            userLimit: userLimit === 0 ? null : userLimit, // 0 = unbegrenzt
            reason: `Auto-erstellter Voice Channel für LFG Team`,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ['Connect']
                },
                ...lfgPost.joinedPlayers.map(userId => ({
                    id: userId,
                    allow: ['Connect', 'Speak', 'UseVAD']
                }))
            ]
        });
        
        // Benachrichtige alle Team Members
        const teamEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎤 Voice Channel erstellt!')
            .setDescription(`Euer **${lfgPost.game}** Team ist vollständig!\n\nVoice Channel: ${voiceChannel}`)
            .addFields(
                {
                    name: '👥 Team Members',
                    value: lfgPost.joinedPlayers.map(id => `<@${id}>`).join('\n'),
                    inline: false
                }
            )
            .setTimestamp();
        
        await interaction.followUp({
            embeds: [teamEmbed]
        });
        
        // Auto-Delete Voice Channel wenn aktiviert
        if (settings.enableAutoVoiceCleanup) {
            setTimeout(async () => {
                try {
                    const channel = guild.channels.cache.get(voiceChannel.id);
                    if (channel && channel.members.size === 0) {
                        await channel.delete(`Auto-Delete: Voice Channel war ${settings.voiceCleanupHours} Stunden leer`);
                    }
                } catch (error) {
                    console.log('Voice Channel Auto-Delete Fehler:', error.message);
                }
            }, settings.voiceCleanupHours * 60 * 60 * 1000);
        }
        
    } catch (error) {
        console.error('Fehler beim Erstellen des Voice Channels:', error);
    }
}

// ================================================================
// LFG VOICE BUTTON HANDLER
// ================================================================

async function handleLFGVoice(interaction, lfgPost) {
    if (!lfgPost.joinedPlayers.includes(interaction.user.id)) {
        return await interaction.reply({
            content: '❌ Du musst dem Team beitreten um einen Voice Channel zu erstellen!',
            ephemeral: true
        });
    }
    
    await createAutoVoiceChannel(interaction, lfgPost);
    
    await interaction.reply({
        content: '🎤 Voice Channel wird erstellt...',
        ephemeral: true
    });
}

// ================================================================
// LFG CLOSE HANDLER
// ================================================================

async function handleLFGClose(interaction, lfgPost, userId) {
    if (userId !== lfgPost.authorId) {
        return await interaction.reply({
            content: '❌ Nur der Team Creator kann das Team schließen!',
            ephemeral: true
        });
    }
    
    // Markiere als geschlossen
    lfgPost.status = 'closed';
    
    // Erstelle "Geschlossen" Embed
    const closedEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🔒 LFG Team geschlossen')
        .setDescription(`Das **${lfgPost.game}** Team wurde vom Creator geschlossen.`)
        .addFields(
            {
                name: '👥 Finale Team-Größe',
                value: `${lfgPost.joinedPlayers.length} Spieler`,
                inline: true
            },
            {
                name: '⏰ Dauer',
                value: getTimeDifference(lfgPost.createdAt),
                inline: true
            }
        )
        .setTimestamp();
    
    await interaction.update({
        embeds: [closedEmbed],
        components: [] // Entferne alle Buttons
    });
    
    // Entferne aus aktivem Cache und Supabase
    activeLFGPosts.delete(lfgPost.messageId);
    
    // Lösche auch aus Supabase
    const { deleteActiveLFGPost } = require('./lfg-supabase-api');
    await deleteActiveLFGPost(lfgPost.messageId);
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

function getTimeDifference(startTime) {
    const diff = Date.now() - startTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
}

// ================================================================
// CLEANUP FUNCTIONS
// ================================================================

// Cleanup alte LFG Posts (alle 30 Minuten)
setInterval(() => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 Stunden
    
    for (const [messageId, lfgPost] of activeLFGPosts.entries()) {
        if (now - lfgPost.createdAt.getTime() > maxAge) {
            activeLFGPosts.delete(messageId);
            console.log(`🧹 Cleaned up old LFG post: ${messageId}`);
        }
    }
}, 30 * 60 * 1000);

// ================================================================
// LFG POSTS RESTORATION
// ================================================================

// Lade aktive LFG Posts beim Bot-Start
async function restoreActiveLFGPosts(discordClient) {
    try {
        console.log('🔄 Starte Wiederherstellung der aktiven LFG Posts...');
        
        if (!discordClient || !discordClient.guilds) {
            console.log('⚠️ Discord Client nicht verfügbar');
            return;
        }

        const { loadActiveLFGPosts } = require('./lfg-supabase-api');
        let totalRestored = 0;
        let totalFailed = 0;

        // Für jede Guild die aktiven Posts laden
        for (const [guildId, guild] of discordClient.guilds.cache) {
            try {
                console.log(`🔍 Lade aktive LFG Posts für Guild: ${guild.name} (${guildId})`);
                
                const activePosts = await loadActiveLFGPosts(guildId);
                
                if (activePosts.length === 0) {
                    console.log(`📝 Keine aktiven LFG Posts für Guild ${guild.name}`);
                    continue;
                }

                console.log(`📦 ${activePosts.length} aktive Posts gefunden für Guild ${guild.name}`);

                // Jeder Post in den Cache laden
                for (const postData of activePosts) {
                    try {
                        // Prüfe ob Discord Message noch existiert
                        const channel = guild.channels.cache.get(postData.channelId);
                        if (!channel) {
                            console.log(`⚠️ Channel ${postData.channelId} nicht gefunden, überspringe Post ${postData.messageId}`);
                            continue;
                        }

                        const message = await channel.messages.fetch(postData.messageId).catch(() => null);
                        if (!message) {
                            console.log(`⚠️ Message ${postData.messageId} nicht gefunden, überspringe Post`);
                            // Lösche aus Supabase da Message nicht mehr existiert
                            const { deleteActiveLFGPost } = require('./lfg-supabase-api');
                            await deleteActiveLFGPost(postData.messageId);
                            continue;
                        }

                        // Erstelle LFG Post Object
                        const lfgPost = new LFGPost(
                            postData.messageId,
                            postData.authorId,
                            postData.game,
                            postData.description,
                            postData.maxPlayers
                        );

                        // Setze gespeicherte Daten
                        lfgPost.joinedPlayers = postData.joinedPlayers || [postData.authorId];
                        lfgPost.status = postData.status || 'open';
                        lfgPost.createdAt = postData.createdAt || new Date();

                        // Füge zum Cache hinzu
                        activeLFGPosts.set(postData.messageId, lfgPost);
                        totalRestored++;

                        console.log(`✅ LFG Post wiederhergestellt: ${postData.messageId} (${postData.game}, ${lfgPost.joinedPlayers.length} Spieler)`);

                    } catch (error) {
                        console.error(`❌ Fehler beim Wiederherstellen von Post ${postData.messageId}:`, error);
                        totalFailed++;
                    }
                }

            } catch (error) {
                console.error(`❌ Fehler beim Laden der Posts für Guild ${guildId}:`, error);
                totalFailed++;
            }
        }

        console.log(`🎉 LFG Post Wiederherstellung abgeschlossen: ${totalRestored} erfolgreich, ${totalFailed} fehlgeschlagen`);
        console.log(`📊 Aktive LFG Posts im Cache: ${activeLFGPosts.size}`);

    } catch (error) {
        console.error('❌ Fehler bei der LFG Post Wiederherstellung:', error);
    }
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
    handleLFGMessageWithResponses,
    handleLFGButtonInteraction,
    restoreActiveLFGPosts,
    activeLFGPosts,
    LFGPost
}; 