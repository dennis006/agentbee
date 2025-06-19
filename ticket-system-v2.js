const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

class TicketSystemV2 {
  constructor() {
    this.MODULE_NAME = 'ticket-system';
    this.activeTickets = new Map();
    this.ticketCounter = 1;
    this.ticketStats = {
      totalTickets: 0,
      openTickets: 0,
      closedTickets: 0
    };
    
    // Datei-Pfade (wie im Giveaway-System)
    this.settingsFile = path.join(__dirname, 'settings', 'ticket-system.json');
    this.dataFile = path.join(__dirname, 'ticket-data.json');
    
    // Standard-Einstellungen (mit korrekten Defaults)
    this.settings = this.getDefaultSettings();
    
    console.log('🎫 TicketSystemV2 initialisiert');
  }

  // SETTINGS MANAGEMENT (wie im Giveaway-System)
  loadSettings() {
    try {
      if (fs.existsSync(this.settingsFile)) {
        const fileSettings = JSON.parse(fs.readFileSync(this.settingsFile, 'utf8'));
        // Merge-Strategie: Datei-Einstellungen überschreiben Standard-Einstellungen
        this.settings = {
          ...this.settings,
          ...fileSettings,
          // Nested Objects korrekt mergen
          autoClose: { ...this.settings.autoClose, ...(fileSettings.autoClose || {}) },
          embed: { ...this.settings.embed, ...(fileSettings.embed || {}) },
          buttons: fileSettings.buttons || this.settings.buttons,
          transcripts: { ...this.settings.transcripts, ...(fileSettings.transcripts || {}) },
          notifications: { 
            ...this.settings.notifications, 
            ...(fileSettings.notifications || {}),
            newTicket: { 
              ...this.settings.notifications.newTicket, 
              ...(fileSettings.notifications?.newTicket || {}) 
            },
            ticketClosed: { 
              ...this.settings.notifications.ticketClosed, 
              ...(fileSettings.notifications?.ticketClosed || {}) 
            }
          }
        };
        console.log('✅ Ticket-Einstellungen aus separater Datei geladen:', {
          embedColor: this.settings.embed.color,
          enabled: this.settings.enabled,
          buttonsCount: this.settings.buttons?.length
        });
      } else {
        console.log('ℹ️ Keine separate Ticket-Settings-Datei gefunden, verwende Standard-Einstellungen');
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Ticket-Einstellungen:', error);
    }
  }

  saveSettings() {
    try {
      // Stelle sicher, dass das settings-Verzeichnis existiert
      const settingsDir = path.dirname(this.settingsFile);
      if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
      }
      
      fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2));
      console.log('✅ Ticket-Einstellungen gespeichert');
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Ticket-Einstellungen:', error);
    }
  }

  loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const fileData = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        
        // Lade gespeicherte Daten
        if (fileData.activeTickets) {
          this.activeTickets = new Map(Object.entries(fileData.activeTickets));
        }
        if (fileData.ticketStats) {
          this.ticketStats = { ...this.ticketStats, ...fileData.ticketStats };
        }
        if (fileData.ticketCounter) {
          this.ticketCounter = fileData.ticketCounter;
        }
        
        console.log('✅ Ticket-Daten geladen:', {
          activeTickets: this.activeTickets.size,
          totalTickets: this.ticketStats.totalTickets,
          counter: this.ticketCounter
        });
      } else {
        console.log('ℹ️ Keine Ticket-Daten gefunden, starte mit leeren Daten');
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Ticket-Daten:', error);
    }
  }

  saveData() {
    try {
      const data = {
        activeTickets: Object.fromEntries(this.activeTickets),
        ticketStats: this.ticketStats,
        ticketCounter: this.ticketCounter,
        settings: this.settings
      };
      
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Ticket-Daten:', error);
    }
  }

  getDefaultSettings() {
    return {
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
        color: '0x2ECC71',
        footer: 'Klicke auf einen Button um ein Ticket zu erstellen',
        thumbnail: ''
      },
      buttons: [
        {
          id: 'general_support',
          label: 'Allgemeine Hilfe',
          emoji: '❓',
          style: 'PRIMARY',
          description: ''
        },
        {
          id: 'technical_support', 
          label: 'Technischer Support',
          emoji: '🔧',
          style: 'SECONDARY',
          description: ''
        },
        {
          id: 'giveaway_support',
          label: 'Giveaway',
          emoji: '🎉',
          style: 'SUCCESS',
          description: ''
        },
        {
          id: 'report_user',
          label: 'User Melden', 
          emoji: '⚠️',
          style: 'DANGER',
          description: ''
        }
      ],
      transcripts: {
        enabled: true,
        channelId: '',
        saveToFile: false
      },
      notifications: {
        newTicket: {
          enabled: true,
          channelId: '',
          mention: true
        },
        ticketClosed: {
          enabled: false,
          dmUser: false
        }
      }
    };
  }

  // INITIALIZATION
  async initialize() {
    try {
      console.log('🎫 Initialisiere TicketSystemV2...');
      
      // Lade Settings und Daten
      this.loadSettings();
      this.loadData();
      
        console.log(`✅ TicketSystemV2 erfolgreich initialisiert`);
        console.log(`🎫 Aktuelle Einstellungen:`, {
        enabled: this.settings.enabled,
        embedColor: this.settings.embed?.color,
        buttonsCount: this.settings.buttons?.length,
        autoCloseEnabled: this.settings.autoClose?.enabled
        });
        
        return true;
    } catch (error) {
      console.error('❌ Fehler bei der Initialisierung des TicketSystemV2:', error);
      return false;
    }
  }

  // TICKET CREATION (erweitert)
  async createTicketChannel(interaction, ticketType) {
    try {
      const guild = interaction.guild;
      const user = interaction.user;
      
      if (!this.settings || !this.settings.enabled) {
        return { success: false, error: 'Ticket-System ist deaktiviert' };
      }
      
      // Prüfe ob User bereits ein offenes Ticket hat
      for (const [ticketId, ticketData] of this.activeTickets) {
        if (ticketData.userId === user.id && ticketData.status === 'open') {
          return { 
            success: false, 
            error: `Du hast bereits ein offenes Ticket: <#${ticketData.channelId}>` 
          };
        }
      }
      
      const ticketId = `ticket-${this.ticketCounter++}`;
      const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${this.ticketCounter - 1}`;

      let category = null;
      if (this.settings.categoryId) {
        category = guild.channels.cache.get(this.settings.categoryId);
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

      // Support-Rollen
      for (const roleName of this.settings.supportRoles || []) {
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

      // Staff-Rollen
      for (const roleName of this.settings.staffRoles || []) {
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

      this.activeTickets.set(ticketId, ticketData);
      this.updateTicketStats('created');

      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${this.ticketCounter - 1}`)
        .setDescription(`Hallo ${user}! Unser Team wird dir bald helfen.`)
        .setColor(parseInt(this.settings.embed.color.replace('0x', ''), 16));

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

      console.log(`✅ Ticket ${ticketId} erfolgreich erstellt für ${user.tag}`);
      return { success: true, channelId: ticketChannel.id };
      
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Tickets:', error);
      return { success: false, error: error.message };
    }
  }

  // TICKET CREATION mit Details (für Modal-Submissions)
  async createTicketChannelWithDetails(interaction, ticketType, subject, description) {
    try {
      const guild = interaction.guild;
      const user = interaction.user;
      
      if (!this.settings || !this.settings.enabled) {
        return { success: false, error: 'Ticket-System ist deaktiviert' };
      }
      
      // Prüfe ob User bereits ein offenes Ticket hat
      for (const [ticketId, ticketData] of this.activeTickets) {
        if (ticketData.userId === user.id && ticketData.status === 'open') {
          return { 
            success: false, 
            error: `Du hast bereits ein offenes Ticket: <#${ticketData.channelId}>` 
          };
        }
      }
      
      const ticketId = `ticket-${this.ticketCounter++}`;
      const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${this.ticketCounter - 1}`;

      let category = null;
      if (this.settings.categoryId) {
        category = guild.channels.cache.get(this.settings.categoryId);
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

      // Support-Rollen
      for (const roleName of this.settings.supportRoles || []) {
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

      // Staff-Rollen
      for (const roleName of this.settings.staffRoles || []) {
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

      // Finde Button-Konfiguration
      const buttonConfig = this.settings.buttons.find(btn => btn.id === ticketType);
      const ticketEmoji = buttonConfig?.emoji || '🎫';
      const ticketLabel = buttonConfig?.label || 'Support';

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

      this.activeTickets.set(ticketId, ticketData);
      this.updateTicketStats('created');

      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`${ticketEmoji} Ticket #${this.ticketCounter - 1} - ${ticketLabel}`)
        .setDescription(`Hallo ${user}! Unser Team wird dir bald helfen.`)
        .addFields(
          { name: '📋 Betreff', value: subject, inline: false },
          { name: '📝 Beschreibung', value: description.length > 1000 ? description.substring(0, 1000) + '...' : description, inline: false }
        )
        .setColor(parseInt(this.settings.embed.color.replace('0x', ''), 16))
        .setTimestamp();

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

      console.log(`✅ Ticket ${ticketId} erfolgreich erstellt für ${user.tag} (${ticketLabel})`);
      return { success: true, channelId: ticketChannel.id };
      
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Tickets:', error);
      return { success: false, error: error.message };
    }
  }

  // TICKET CLOSING mit Grund
  async closeTicketWithReason(interaction, ticketId, closeReason, isTicketOwner) {
    try {
      const ticketData = this.activeTickets.get(ticketId);
      
      if (!ticketData) {
        return { success: false, error: 'Ticket nicht gefunden' };
      }

      const guild = interaction.guild;
      const channel = guild.channels.cache.get(ticketData.channelId);
      
      if (!channel) {
        return { success: false, error: 'Ticket-Channel nicht gefunden' };
      }

      // Ticket als geschlossen markieren
      ticketData.status = 'closed';
      ticketData.closedAt = Date.now();
      ticketData.closedBy = interaction.user.id;
      ticketData.closeReason = closeReason;
      
      this.updateTicketStats('closed');

      // Schließungs-Embed erstellen
      const closeEmbed = new EmbedBuilder()
        .setTitle('🔒 Ticket geschlossen')
        .addFields(
          { name: '👤 Geschlossen von', value: `<@${interaction.user.id}>`, inline: true },
          { name: '📅 Geschlossen am', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true },
          { name: '📝 Grund', value: closeReason, inline: false }
        )
        .setColor(0xFF6B6B)
        .setTimestamp();

      await channel.send({ embeds: [closeEmbed] });

      // PN an Ticket-Ersteller senden (falls nicht selbst geschlossen)
      let dmSent = false;
      if (!isTicketOwner) {
        try {
          const ticketOwner = await guild.members.fetch(ticketData.userId);
          if (ticketOwner) {
            const dmEmbed = new EmbedBuilder()
              .setTitle('🔒 Dein Ticket wurde geschlossen')
              .addFields(
                { name: '🏷️ Ticket-ID', value: ticketId, inline: true },
                { name: '📅 Geschlossen am', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true },
                { name: '📝 Grund', value: closeReason, inline: false }
              )
              .setColor(0xFF6B6B)
              .setTimestamp();

            await ticketOwner.send({ embeds: [dmEmbed] });
            dmSent = true;
          }
        } catch (error) {
          console.log(`⚠️ Konnte keine PN an ${ticketData.userId} senden:`, error.message);
        }
      }

      // Channel nach 5 Sekunden löschen
      setTimeout(async () => {
        try {
          await channel.delete();
          this.activeTickets.delete(ticketId);
          this.saveData();
          console.log(`🗑️ Ticket-Channel ${ticketId} gelöscht`);
        } catch (error) {
          console.error(`❌ Fehler beim Löschen des Ticket-Channels ${ticketId}:`, error);
        }
      }, 5000);

      return { success: true, dmSent: dmSent };

    } catch (error) {
      console.error('❌ Fehler beim Schließen des Tickets:', error);
      return { success: false, error: error.message };
    }
  }

  // STATS MANAGEMENT
  updateTicketStats(action) {
    if (action === 'created') {
      this.ticketStats.totalTickets++;
      this.ticketStats.openTickets++;
    } else if (action === 'closed') {
      this.ticketStats.openTickets--;
      this.ticketStats.closedTickets++;
    }
  }

  getTicketStats() {
    // Erweiterte Statistiken mit Antwortzeit-Berechnung
    const extendedStats = {
      ...this.ticketStats,
      averageResponseTime: this.calculateAverageResponseTime(),
      ticketsByType: this.calculateTicketsByType(),
      recentTickets: this.getRecentTickets()
    };

    return extendedStats;
  }

  calculateAverageResponseTime() {
    const completedTickets = [];
    
    // Sammle alle abgeschlossenen Tickets
    for (const [ticketId, ticketData] of this.activeTickets) {
      if (ticketData.status === 'closed' && ticketData.closedAt && ticketData.createdAt) {
        const responseTime = ticketData.closedAt - ticketData.createdAt;
        completedTickets.push(responseTime);
      }
    }

    // Validierung: Keine abgeschlossenen Tickets
    if (completedTickets.length === 0) {
      return 0; // Keine Daten verfügbar
    }

    // Berechne durchschnittliche Antwortzeit
    const totalResponseTime = completedTickets.reduce((sum, time) => sum + time, 0);
    const averageTime = totalResponseTime / completedTickets.length;

    console.log(`📊 Antwortzeit-Statistik: ${completedTickets.length} Tickets, Durchschnitt: ${Math.round(averageTime / 1000)}s`);
    
    return averageTime;
  }

  calculateTicketsByType() {
    const typeCount = {};
    
    for (const [ticketId, ticketData] of this.activeTickets) {
      const type = ticketData.type || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    }

    return typeCount;
  }

  getRecentTickets() {
    const tickets = Array.from(this.activeTickets.entries())
      .map(([id, data]) => ({
        id,
        type: data.type || 'unknown',
        user: data.userId,
        status: data.status,
        createdAt: new Date(data.createdAt).toISOString()
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5); // Nur die letzten 5 Tickets

    return tickets;
  }

  // API METHODS
  async getSettings() {
    return this.settings;
  }

  async updateSettings(newSettings) {
    // Bessere Merge-Strategie für nested Objects (wie im Giveaway-System)
    this.settings = {
      ...this.settings,
      ...newSettings,
      // Nested Objects korrekt mergen
      autoClose: { ...this.settings.autoClose, ...(newSettings.autoClose || {}) },
      embed: { ...this.settings.embed, ...(newSettings.embed || {}) },
      buttons: newSettings.buttons || this.settings.buttons,
      transcripts: { ...this.settings.transcripts, ...(newSettings.transcripts || {}) },
      notifications: { 
        ...this.settings.notifications, 
        ...(newSettings.notifications || {}),
        newTicket: { 
          ...this.settings.notifications.newTicket, 
          ...(newSettings.notifications?.newTicket || {}) 
        },
        ticketClosed: { 
          ...this.settings.notifications.ticketClosed, 
          ...(newSettings.notifications?.ticketClosed || {}) 
        }
      }
    };
    
    console.log('✅ Ticket-Einstellungen aktualisiert:', {
      embedColor: this.settings.embed.color,
      enabled: this.settings.enabled,
      buttonsCount: this.settings.buttons?.length
    });
    
    this.saveSettings();
    this.saveData();
    return this.settings;
  }

  // MIGRATION FROM OLD SYSTEM
  async migrateFromOldSystem() {
    try {
      console.log('🔄 Migriere von altem Ticket-System...');
      
      const fs = require('fs');
      const path = require('path');
      
      const oldPath = path.join(__dirname, 'ticket-settings.json');
      
      if (fs.existsSync(oldPath)) {
        console.log('📂 Finde alte ticket-settings.json...');
        const data = fs.readFileSync(oldPath, 'utf8');
        const oldSettings = JSON.parse(data);
        
        // Entferne Metadaten
        const { _loadTimestamp, _metadata, ...cleanSettings } = oldSettings;
        
        // Speichere in neuem System
        const result = await this.saveSettings(cleanSettings);
        
        if (result) {
          console.log('✅ Migration erfolgreich abgeschlossen');
          
          // Backup der alten Datei
          const backupPath = oldPath + '.migrated';
          fs.renameSync(oldPath, backupPath);
          console.log(`📋 Alte Datei gesichert als: ${backupPath}`);
          
          return true;
        }
      }
      
      console.log('ℹ️ Keine alten Settings zum Migrieren gefunden');
      return false;
      
    } catch (error) {
      console.error('❌ Fehler bei der Migration:', error);
      return false;
    }
  }
}

// Singleton-Instanz
const ticketSystemV2 = new TicketSystemV2();

module.exports = ticketSystemV2; 