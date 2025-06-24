const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');

// Ticket System Settings
let ticketSettings = {
  enabled: true,
  categoryId: '',
  supportRoles: [],
  staffRoles: [],
  autoClose: {
    enabled: true,
    inactivityTime: 24 * 60 * 60 * 1000,
    warningTime: 2 * 60 * 60 * 1000
  },
  embed: {
    title: '🎫 Support Ticket System',
    description: 'Brauchst du Hilfe? Erstelle ein Ticket und unser Team wird dir helfen!',
    color: '0x7289DA',
    footer: 'Klicke auf einen Button um ein Ticket zu erstellen'
  },
  buttons: [
    {
      id: 'general_support',
      label: 'Allgemeine Hilfe',
      emoji: '❓',
      style: 'PRIMARY'
    },
    {
      id: 'technical_support', 
      label: 'Technischer Support',
      emoji: '🔧',
      style: 'SECONDARY'
    },
    {
      id: 'giveaway_winner',
      label: 'Giveaway Gewonnen',
      emoji: '🎉',
      style: 'SUCCESS'
    },
    {
      id: 'report_user',
      label: 'User Melden', 
      emoji: '⚠️',
      style: 'DANGER'
    }
  ],
  transcripts: {
    enabled: true,
    channelId: ''
  },
  notifications: {
    newTicket: {
      enabled: true,
      channelId: '',
      mention: true
    }
  }
};

let activeTickets = new Map();
let ticketCounter = 1;
let ticketStats = {
  totalTickets: 0,
  openTickets: 0,
  closedTickets: 0
};

const TICKET_SETTINGS_FILE = path.join(__dirname, 'ticket-settings.json');
const TICKET_STATS_FILE = path.join(__dirname, 'ticket-stats.json');

// Flag um sicherzustellen, dass Settings nur einmal geladen werden
let ticketSettingsLoaded = false;

function loadTicketSettings() {
  try {
    if (fs.existsSync(TICKET_SETTINGS_FILE)) {
      const data = fs.readFileSync(TICKET_SETTINGS_FILE, 'utf8');
      const savedSettings = JSON.parse(data);
      console.log('🎫 Lade Ticket-Einstellungen...');
      
      // KOMPLETT ERSETZEN - keine Defaults verwenden!
      ticketSettings = savedSettings;
      ticketSettingsLoaded = true;
      
      console.log(`✅ Ticket-System geladen: ${ticketSettings.buttons.length} Buttons, Farbe: ${ticketSettings.embed.color}`);
      
      // Debug: Zeige Ticket-System Status
      console.log(`🔍 Ticket-System Details: enabled=${ticketSettings.enabled}, autoClose=${ticketSettings.autoClose.enabled}`);
      
    } else {
      console.log('🎫 Keine gespeicherten Ticket-Einstellungen gefunden, verwende Defaults');
      ticketSettingsLoaded = true;
    }
  } catch (error) {
    console.error('❌ Fehler beim Laden der Ticket-Einstellungen:', error);
    ticketSettingsLoaded = true;
  }
}

function saveTicketSettings() {
  try {
    console.log(`💾 Speichere Ticket-System: ${ticketSettings.buttons.length} Buttons, Farbe: ${ticketSettings.embed.color}`);
    
    // DEBUG: Zeige komplette Einstellungen vor dem Speichern
    console.log('🔍 DEBUG - Komplette Settings vor Speichern:', {
      enabled: ticketSettings.enabled,
      supportRoles: ticketSettings.supportRoles,
      staffRoles: ticketSettings.staffRoles,
      embedColor: ticketSettings.embed.color,
      buttonsCount: ticketSettings.buttons.length
    });
    
    fs.writeFileSync(TICKET_SETTINGS_FILE, JSON.stringify(ticketSettings, null, 2));
    console.log('✅ Ticket-Einstellungen gespeichert');
    
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Speichern der Ticket-Einstellungen:', error);
    return false;
  }
}

// Neue sichere Update-Funktion
function updateTicketSettings(newSettings) {
  try {
    console.log('🔄 Sichere Ticket-Settings Update...');
    console.log('🔍 DEBUG - Empfangene neue Settings:', {
      enabled: newSettings.enabled,
      supportRoles: newSettings.supportRoles,
      staffRoles: newSettings.staffRoles,
      embedColor: newSettings.embed?.color,
      buttonsCount: newSettings.buttons?.length
    });
    
    // KOMPLETT ERSETZEN - keine Defaults verwenden!
    ticketSettings = newSettings;
    
    console.log('🔍 DEBUG - Settings nach Update:', {
      enabled: ticketSettings.enabled,
      supportRoles: ticketSettings.supportRoles,
      staffRoles: ticketSettings.staffRoles,
      embedColor: ticketSettings.embed?.color,
      buttonsCount: ticketSettings.buttons?.length
    });
    
    // Sofort speichern
    const saveResult = saveTicketSettings();
    
    if (saveResult) {
      console.log('✅ Ticket-Settings erfolgreich aktualisiert und gespeichert');
      
      // Gib die aktualisierten Settings zurück (nicht die globale Variable)
      return {
        success: true,
        settings: ticketSettings  // Die gerade aktualisierten Settings
      };
    } else {
      console.error('❌ Fehler beim Speichern nach Update');
      return {
        success: false,
        settings: null
      };
    }
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Ticket-Settings:', error);
    return {
      success: false,
      settings: null
    };
  }
}

async function createTicketChannel(interaction, ticketType) {
  try {
    const guild = interaction.guild;
    const user = interaction.user;
    
    const ticketId = `ticket-${ticketCounter++}`;
    const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${ticketCounter - 1}`;

    let category = null;
    if (ticketSettings.categoryId) {
      category = guild.channels.cache.get(ticketSettings.categoryId);
    }

    const permissions = [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory
        ]
      }
    ];

    // Support-Rollen basierend auf Namen hinzufügen
    for (const roleName of ticketSettings.supportRoles) {
      if (roleName && roleName.trim()) {
        const role = guild.roles.cache.find(role => role.name === roleName.trim());
        if (role) {
          permissions.push({
            id: role.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages
            ]
          });
        }
      }
    }

    // Staff-Rollen basierend auf Namen hinzufügen
    for (const roleName of ticketSettings.staffRoles) {
      if (roleName && roleName.trim()) {
        const role = guild.roles.cache.find(role => role.name === roleName.trim());
        if (role) {
          permissions.push({
            id: role.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          });
        }
      }
    }

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category,
      permissionOverwrites: permissions
    });

    const ticketData = {
      id: ticketId,
      type: ticketType,
      userId: user.id,
      channelId: ticketChannel.id,
      createdAt: Date.now(),
      status: 'open'
    };

    activeTickets.set(ticketId, ticketData);
    updateTicketStats('created');

    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`🎫 Ticket #${ticketCounter - 1}`)
      .setDescription(`Hallo ${user}! Unser Team wird dir bald helfen.`)
      .setColor(parseInt(ticketSettings.embed.color.replace('0x', ''), 16));

    const closeButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_close_${ticketId}`)
          .setLabel('Ticket Schließen')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger)
      );

    await ticketChannel.send({
      content: `${user} Willkommen in deinem Ticket!`,
      embeds: [welcomeEmbed],
      components: [closeButton]
    });

    return { success: true, channelId: ticketChannel.id };
  } catch (error) {
    console.error('Fehler beim Erstellen des Tickets:', error);
    return { success: false, error: error.message };
  }
}

// Erweiterte Ticket-Erstellung mit Betreff und Beschreibung
async function createTicketChannelWithDetails(interaction, ticketType, subject, description) {
  try {
    const guild = interaction.guild;
    const user = interaction.user;
    
    const ticketId = `ticket-${ticketCounter++}`;
    const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${ticketCounter - 1}`;

    let category = null;
    if (ticketSettings.categoryId) {
      category = guild.channels.cache.get(ticketSettings.categoryId);
    }

    const permissions = [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory
        ]
      }
    ];

    // Support-Rollen basierend auf Namen hinzufügen
    for (const roleName of ticketSettings.supportRoles) {
      if (roleName && roleName.trim()) {
        const role = guild.roles.cache.find(role => role.name === roleName.trim());
        if (role) {
          permissions.push({
            id: role.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages
            ]
          });
        }
      }
    }

    // Staff-Rollen basierend auf Namen hinzufügen
    for (const roleName of ticketSettings.staffRoles) {
      if (roleName && roleName.trim()) {
        const role = guild.roles.cache.find(role => role.name === roleName.trim());
        if (role) {
          permissions.push({
            id: role.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          });
        }
      }
    }

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category,
      permissionOverwrites: permissions
    });

    const ticketData = {
      id: ticketId,
      type: ticketType,
      userId: user.id,
      channelId: ticketChannel.id,
      createdAt: Date.now(),
      status: 'open',
      subject: subject,
      description: description
    };

    activeTickets.set(ticketId, ticketData);
    updateTicketStats('created');

    // Finde Button-Konfiguration
    const buttonConfig = ticketSettings.buttons.find(btn => btn.id === ticketType);
    const buttonLabel = buttonConfig ? buttonConfig.label : 'Support';
    const buttonEmoji = buttonConfig ? buttonConfig.emoji : '🎫';

    // Erweiterte Welcome-Embed mit Betreff und Beschreibung
    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`${buttonEmoji} Ticket #${ticketCounter - 1} - ${buttonLabel}`)
      .setDescription(`Hallo ${user}! ${ticketType === 'giveaway_winner' ? 'Herzlichen Glückwunsch zu deinem Giveaway-Gewinn! 🎉' : 'Unser Team wird dir bald helfen.'}`)
      .addFields(
        { name: '📝 Betreff', value: subject, inline: false },
        { name: '📋 Beschreibung', value: description.length > 1024 ? description.substring(0, 1021) + '...' : description, inline: false },
        { name: '👤 Erstellt von', value: `${user.tag} (${user.id})`, inline: true },
        { name: '📅 Erstellt am', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: '🏷️ Kategorie', value: buttonLabel, inline: true }
      )
      .setColor(ticketType === 'giveaway_winner' ? parseInt('FFD700', 16) : parseInt(ticketSettings.embed.color.replace('0x', ''), 16))
      .setTimestamp()
      .setThumbnail(user.displayAvatarURL({ dynamic: true }));

    // Zusätzliche Giveaway-spezifische Felder
    if (ticketType === 'giveaway_winner') {
      welcomeEmbed.addFields({
        name: '🎁 Wichtige Informationen für Giveaway-Gewinner',
        value: '• Teile einen Screenshot deiner Gewinner-DM mit\n' +
               '• Gib den Namen des Giveaways an\n' +
               '• Unser Team wird deinen Gewinn schnellstmöglich bearbeiten\n' +
               '• Bei Fragen zum Preis, frag einfach nach!',
        inline: false
      });
    }

    const closeButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_close_${ticketId}`)
          .setLabel('Ticket Schließen')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger)
      );

    await ticketChannel.send({
      content: `${user} Willkommen in deinem Ticket! 🎫`,
      embeds: [welcomeEmbed],
      components: [closeButton]
    });

    return { success: true, channelId: ticketChannel.id };
  } catch (error) {
    console.error('Fehler beim Erstellen des Tickets mit Details:', error);
    return { success: false, error: error.message };
  }
}

// Ticket mit Grund schließen und PN senden
async function closeTicketWithReason(interaction, ticketId, closeReason, isTicketOwner) {
  try {
    const guild = interaction.guild;
    const ticketData = activeTickets.get(ticketId);
    
    if (!ticketData) {
      return { success: false, error: 'Ticket nicht gefunden' };
    }

    const channel = guild.channels.cache.get(ticketData.channelId);
    const ticketOwner = await guild.members.fetch(ticketData.userId).catch(() => null);
    const closedBy = interaction.user;
    
    // Bestimme wer das Ticket schließt
    const closerRole = isTicketOwner ? 'Ticket-Ersteller' : 'Support-Team';
    
    // Erstelle detaillierte Schließ-Embed
    const closeEmbed = new EmbedBuilder()
      .setTitle('🔒 Ticket geschlossen')
      .setDescription(`Dieses Ticket wurde geschlossen.`)
      .addFields(
        { name: '👤 Geschlossen von', value: `${closedBy.tag} (${closerRole})`, inline: true },
        { name: '📅 Geschlossen am', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: '📝 Grund', value: closeReason, inline: false }
      )
      .setColor(parseInt('FF0000', 16))
      .setTimestamp()
      .setThumbnail(closedBy.displayAvatarURL({ dynamic: true }));

    // Sende Schließ-Nachricht im Channel
    if (channel) {
      await channel.send({ embeds: [closeEmbed] });
    }

    // Sende PN an Ticket-Ersteller (falls nicht selbst geschlossen)
    let dmSent = false;
    let dmError = null;
    if (ticketOwner && !isTicketOwner) {
      try {
        // Finde Button-Konfiguration für bessere Info
        const buttonConfig = ticketSettings.buttons.find(btn => btn.id === ticketData.type);
        const ticketCategory = buttonConfig ? buttonConfig.label : 'Support';
        
        const dmEmbed = new EmbedBuilder()
          .setTitle('🔒 Dein Ticket wurde geschlossen')
          .setDescription(`Dein Ticket im Server **${guild.name}** wurde vom Support-Team geschlossen.`)
          .addFields(
            { name: '🎫 Ticket-Info', value: `**Kategorie:** ${ticketCategory}\n**Betreff:** ${ticketData.subject || 'Nicht angegeben'}`, inline: false },
            { name: '👤 Geschlossen von', value: `${closedBy.tag}`, inline: true },
            { name: '📅 Geschlossen am', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
            { name: '📝 Grund der Schließung', value: closeReason, inline: false },
            { name: '💬 Weitere Hilfe?', value: 'Falls du weitere Fragen hast, erstelle einfach ein neues Ticket!', inline: false }
          )
          .setColor(parseInt(ticketSettings.embed.color.replace('0x', ''), 16))
          .setTimestamp()
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .setFooter({ text: `${guild.name} - Ticket-System`, iconURL: guild.iconURL({ dynamic: true }) });

        await ticketOwner.send({ embeds: [dmEmbed] });
        dmSent = true;
        console.log(`✅ Ticket-Schließungs-PN erfolgreich an ${ticketOwner.user.tag} gesendet`);
      } catch (error) {
        console.error(`❌ Fehler beim Senden der PN an ${ticketOwner.user.tag}:`, error);
        console.error(`🔍 Error-Details:`, {
          code: error.code,
          message: error.message,
          name: error.name,
          stack: error.stack?.split('\n')[0]
        });
        dmSent = false;
        
        // Erweiterte Fehlercode-Erkennung
        if (error.code === 50007 || error.message?.includes('Cannot send messages to this user')) {
          dmError = 'Der User hat private Nachrichten deaktiviert';
        } else if (error.code === 50013 || error.message?.includes('Missing Permissions')) {
          dmError = 'Bot hat keine Berechtigung DMs zu senden';
        } else if (error.code === 50001 || error.message?.includes('Missing Access')) {
          dmError = 'Bot kann nicht auf den User zugreifen';
        } else if (error.message?.includes('Unknown User')) {
          dmError = 'User nicht mehr verfügbar';
        } else if (error.message?.includes('blocked')) {
          dmError = 'Bot wurde vom User blockiert';
        } else {
          dmError = `Fehler beim Senden der PN: ${error.message || 'Unbekannter Grund'} (Code: ${error.code || 'N/A'})`;
        }
        
        // Versuche alternative Benachrichtigung im Channel zu senden (falls noch offen)
        try {
          if (channel && !channel.deleted) {
            const fallbackEmbed = new EmbedBuilder()
              .setTitle('📬 PN-Benachrichtigung fehlgeschlagen')
              .setDescription(`${ticketOwner}, dir konnte keine private Nachricht über die Ticket-Schließung gesendet werden.`)
              .addFields(
                { name: '📝 Grund der Schließung', value: closeReason, inline: false },
                { name: '❌ Problem', value: dmError, inline: false },
                { name: '💡 Lösungen', value: '• **Discord-Einstellungen** → Privatsphäre & Sicherheit → Direkte Nachrichten aktivieren\n• **Server-Einstellungen** → Nachrichten von Server-Mitgliedern zulassen\n• Prüfe ob du den Bot blockiert hast', inline: false },
                { name: '🔧 Support', value: 'Bei weiteren Fragen erstelle einfach ein neues Ticket!', inline: false }
              )
              .setColor(parseInt('FFA500', 16))
              .setTimestamp()
              .setFooter({ text: 'Diese Nachricht wird in 30 Sekunden gelöscht', iconURL: guild.iconURL({ dynamic: true }) });
            
            const fallbackMessage = await channel.send({ embeds: [fallbackEmbed] });
            console.log(`📬 Erweiterte Fallback-Benachrichtigung im Channel gesendet für ${ticketOwner.user.tag}`);
            
            // Lösche Fallback-Nachricht nach 30 Sekunden
            setTimeout(async () => {
              try {
                await fallbackMessage.delete();
                console.log(`🗑️ Fallback-Nachricht nach 30s gelöscht`);
              } catch (deleteError) {
                console.log(`⚠️ Fallback-Nachricht konnte nicht gelöscht werden:`, deleteError.message);
              }
            }, 30000);
            
          }
        } catch (fallbackError) {
          console.error('❌ Auch Fallback-Benachrichtigung fehlgeschlagen:', fallbackError);
        }
      }
    } else if (isTicketOwner) {
      // Ticket-Ersteller schließt selbst - keine PN nötig
      dmSent = true; // Als "erfolgreich" markieren
    }

    // Warte kurz und lösche dann den Channel
    setTimeout(async () => {
      try {
        if (channel) {
          await channel.delete(`Ticket geschlossen: ${closeReason}`);
        }
      } catch (error) {
        console.error('❌ Fehler beim Löschen des Ticket-Channels:', error);
      }
    }, 8000); // 8 Sekunden warten für bessere UX

    // Ticket aus activeTickets entfernen
    activeTickets.delete(ticketId);
    
    // Statistiken aktualisieren
    updateTicketStats('closed');

    return { 
      success: true, 
      dmSent: dmSent,
      dmError: dmError,
      message: `Ticket wurde erfolgreich geschlossen. Channel wird in 8 Sekunden gelöscht.`
    };

  } catch (error) {
    console.error('❌ Fehler beim Schließen des Tickets mit Grund:', error);
    return { success: false, error: error.message };
  }
}

function updateTicketStats(action) {
  if (action === 'created') {
    ticketStats.totalTickets++;
    ticketStats.openTickets++;
  } else if (action === 'closed') {
    ticketStats.openTickets--;
    ticketStats.closedTickets++;
  }
  
  try {
    fs.writeFileSync(TICKET_STATS_FILE, JSON.stringify(ticketStats, null, 2));
  } catch (error) {
    console.error('Fehler beim Speichern der Statistiken:', error);
  }
}

function initializeTicketSystem() {
  console.log('🎫 Initialisiere Ticket-System...');
  
  // Lade Einstellungen nur wenn noch nicht geladen
  if (!ticketSettingsLoaded) {
    loadTicketSettings();
  } else {
    console.log('🎫 Ticket-Einstellungen bereits geladen, überspringe Neuladung');
    console.log(`✅ Verwende bereits geladene Einstellungen: ${ticketSettings.buttons.length} Buttons`);
  }
  
  // Lade auch Statistiken
  try {
    if (fs.existsSync(TICKET_STATS_FILE)) {
      const statsData = fs.readFileSync(TICKET_STATS_FILE, 'utf8');
      const savedStats = JSON.parse(statsData);
      ticketStats = { ...ticketStats, ...savedStats };
      console.log('📊 Ticket-Statistiken geladen:', ticketStats);
    }
  } catch (error) {
    console.error('❌ Fehler beim Laden der Ticket-Statistiken:', error);
  }
  
  console.log('✅ Ticket-System erfolgreich initialisiert');
  console.log('🎫 Aktuelle Ticket-Einstellungen:', {
    enabled: ticketSettings.enabled,
    embedColor: ticketSettings.embed.color,
    buttonsCount: ticketSettings.buttons.length,
    autoCloseEnabled: ticketSettings.autoClose.enabled
  });
}

module.exports = {
  initializeTicketSystem,
  createTicketChannel,
  createTicketChannelWithDetails,
  closeTicketWithReason,
  ticketSettings,
  ticketStats,
  activeTickets,
  updateTicketStats,
  loadTicketSettings,
  saveTicketSettings,
  updateTicketSettings
}; 