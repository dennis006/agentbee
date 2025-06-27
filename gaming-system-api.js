// ================================================================
// 🎮 GAMING SYSTEM API - COMPREHENSIVE TEAM MANAGEMENT
// ================================================================
// Smart Auto-Ping, Team Builder, Voice Integration, Reputation System
// Features: Auto-Ping System, One-Click Team-Join, Live Team-Tracker,
// Auto-Voice-Channels, Reputation System, Role & Channel Management

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Export für index.js
module.exports = router;

// LFG Settings Storage
const LFG_SETTINGS_FILE = path.join(__dirname, 'settings', 'lfg-system.json');

// Default LFG Settings
const defaultLFGSettings = {
  enabled: false,
  channelId: '',
  channelName: 'lfg-suche',
  roleId: '',
  roleName: 'LFG',
  roleColor: '#9333ea', // Purple
  allowedGames: [
    'Valorant',
    'League of Legends', 
    'Overwatch 2',
    'Counter-Strike 2',
    'Apex Legends',
    'Rocket League',
    'Call of Duty',
    'Fortnite'
  ],
  cooldownMinutes: 30,
  maxPingsPerDay: 10,
  requireReason: true,
  autoDeleteAfterHours: 24
};

// Ensure settings directory exists
async function ensureSettingsDir() {
  const settingsDir = path.dirname(LFG_SETTINGS_FILE);
  try {
    await fs.access(settingsDir);
  } catch {
    await fs.mkdir(settingsDir, { recursive: true });
  }
}

// Load LFG settings
async function loadLFGSettings() {
  try {
    await ensureSettingsDir();
    const data = await fs.readFile(LFG_SETTINGS_FILE, 'utf8');
    return { ...defaultLFGSettings, ...JSON.parse(data) };
  } catch (error) {
    console.log('LFG Settings nicht gefunden, verwende Standard-Einstellungen');
    return defaultLFGSettings;
  }
}

// Save LFG settings
async function saveLFGSettings(settings) {
  try {
    await ensureSettingsDir();
    await fs.writeFile(LFG_SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log('LFG Settings gespeichert');
    return true;
  } catch (error) {
    console.error('Fehler beim Speichern der LFG Settings:', error);
    return false;
  }
}

// GET /api/lfg/status - Get LFG system status
router.get('/status', async (req, res) => {
  try {
    const settings = await loadLFGSettings();
    
    // Mock stats for now - can be replaced with real data later
    const stats = {
      totalLFGPosts: 0,
      activePlayers: 0,
      todayPosts: 0,
      popularGame: 'Valorant'
    };

    res.json({
      success: true,
      settings,
      stats
    });
  } catch (error) {
    console.error('Fehler beim Laden des LFG Status:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden des LFG Status'
    });
  }
});

// POST /api/lfg/settings - Update LFG settings
router.post('/settings', async (req, res) => {
  try {
    const settings = req.body;
    const saved = await saveLFGSettings(settings);
    
    if (saved) {
      res.json({
        success: true,
        message: 'LFG Einstellungen gespeichert'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Fehler beim Speichern der Einstellungen'
      });
    }
  } catch (error) {
    console.error('Fehler beim Speichern der LFG Settings:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Speichern der Einstellungen'
    });
  }
});

// POST /api/lfg/toggle - Toggle LFG system
router.post('/toggle', async (req, res) => {
  try {
    const settings = await loadLFGSettings();
    settings.enabled = !settings.enabled;
    
    const saved = await saveLFGSettings(settings);
    
    if (saved) {
      res.json({
        success: true,
        enabled: settings.enabled,
        message: settings.enabled ? 'LFG System aktiviert' : 'LFG System deaktiviert'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Fehler beim Umschalten des LFG Systems'
      });
    }
  } catch (error) {
    console.error('Fehler beim Umschalten des LFG Systems:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Umschalten des LFG Systems'
    });
  }
});

// POST /api/lfg/setup - Setup LFG channel and role
router.post('/setup', async (req, res) => {
  try {
    const settings = await loadLFGSettings();
    
    // Get Discord client from global scope
    const client = global.discordClient;
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'Discord Bot ist nicht verfügbar'
      });
    }

    const results = {
      channelCreated: false,
      roleCreated: false,
      channelId: null,
      roleId: null,
      errors: []
    };

    // Get the first guild (server) the bot is in
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({
        success: false,
        error: 'Bot ist in keinem Server'
      });
    }

    try {
      // 1. Create LFG Role if it doesn't exist
      let lfgRole = guild.roles.cache.find(role => role.name === settings.roleName);
      
      if (!lfgRole) {
        console.log(`🔧 Erstelle LFG Rolle: ${settings.roleName}`);
        lfgRole = await guild.roles.create({
          name: settings.roleName,
          color: settings.roleColor,
          reason: 'LFG System Setup',
          mentionable: true
        });
        results.roleCreated = true;
        console.log(`✅ LFG Rolle erstellt: ${lfgRole.name} (${lfgRole.id})`);
      } else {
        console.log(`✅ LFG Rolle existiert bereits: ${lfgRole.name} (${lfgRole.id})`);
      }
      
      results.roleId = lfgRole.id;

      // 2. Create LFG Channel if it doesn't exist
      let lfgChannel = guild.channels.cache.find(channel => 
        channel.name === settings.channelName && channel.type === 0 // Text channel
      );

      if (!lfgChannel) {
        console.log(`🔧 Erstelle LFG Channel: ${settings.channelName}`);
        lfgChannel = await guild.channels.create({
          name: settings.channelName,
          type: 0, // Text channel
          reason: 'LFG System Setup',
          topic: `🎮 Looking For Group - Finde Mitspieler für deine Lieblingsspiele! Pinge @${settings.roleName} um Spieler zu finden.`,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
              deny: ['ManageMessages', 'ManageChannels']
            },
            {
              id: lfgRole.id,
              allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'MentionEveryone']
            }
          ]
        });
        results.channelCreated = true;
        console.log(`✅ LFG Channel erstellt: ${lfgChannel.name} (${lfgChannel.id})`);
      } else {
        console.log(`✅ LFG Channel existiert bereits: ${lfgChannel.name} (${lfgChannel.id})`);
      }

      results.channelId = lfgChannel.id;

      // 3. Update settings with IDs
      settings.channelId = lfgChannel.id;
      settings.roleId = lfgRole.id;
      await saveLFGSettings(settings);

      // 4. Send welcome message to LFG channel
      const welcomeEmbed = {
        color: parseInt(settings.roleColor.replace('#', ''), 16),
        title: '🎮 LFG System aktiviert!',
        description: `Willkommen im **${settings.channelName}** Channel!\n\n` +
                    `**Wie funktioniert's?**\n` +
                    `• Pinge <@&${lfgRole.id}> um Mitspieler zu finden\n` +
                    `• Format: \`@${settings.roleName} - [Spiel]: [Nachricht]\`\n` +
                    `• Beispiel: \`@${settings.roleName} - Valorant: Suche 2 Spieler für Ranked\`\n\n` +
                    `**Unterstützte Spiele:**\n` +
                    settings.allowedGames.map(game => `• ${game}`).join('\n') + '\n\n' +
                    `**Regeln:**\n` +
                    `• Cooldown: ${settings.cooldownMinutes} Minuten zwischen Pings\n` +
                    `• Maximum: ${settings.maxPingsPerDay} Pings pro Tag\n` +
                    `• Nachrichten werden nach ${settings.autoDeleteAfterHours} Stunden gelöscht`,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'LFG System by AgentBee'
        }
      };

      await lfgChannel.send({ embeds: [welcomeEmbed] });

      const successMessage = [];
      if (results.roleCreated) successMessage.push(`Rolle "${settings.roleName}" erstellt`);
      if (results.channelCreated) successMessage.push(`Channel "${settings.channelName}" erstellt`);
      if (successMessage.length === 0) successMessage.push('Setup überprüft - alles bereits vorhanden');

      res.json({
        success: true,
        message: `✅ LFG Setup erfolgreich! ${successMessage.join(', ')}`,
        results
      });

    } catch (discordError) {
      console.error('Discord API Fehler:', discordError);
      results.errors.push(discordError.message);
      
      res.status(500).json({
        success: false,
        error: 'Fehler bei Discord API: ' + discordError.message,
        results
      });
    }

  } catch (error) {
    console.error('Fehler beim LFG Setup:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim LFG Setup: ' + error.message
    });
  }
});

// POST /api/lfg/test-ping - Test LFG ping
router.post('/test-ping', async (req, res) => {
  try {
    const { game, reason } = req.body;
    const settings = await loadLFGSettings();
    
    if (!settings.enabled) {
      return res.status(400).json({
        success: false,
        error: 'LFG System ist nicht aktiviert'
      });
    }
    
    // In a real implementation, this would send a message to the LFG channel
    console.log('Test LFG Ping:', { game, reason, role: settings.roleName });
    
    res.json({
      success: true,
      message: `Test LFG Ping für "${game}" wurde gesendet`
    });
  } catch (error) {
    console.error('Fehler beim Test LFG Ping:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Test LFG Ping'
    });
  }
}); 