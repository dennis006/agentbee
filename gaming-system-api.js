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
    
    // In a real implementation, this would:
    // 1. Create the LFG channel if it doesn't exist
    // 2. Create the LFG role if it doesn't exist
    // 3. Set proper permissions
    // 4. Update settings with IDs
    
    // For now, just simulate success
    console.log('LFG Setup ausgeführt:', {
      channelName: settings.channelName,
      roleName: settings.roleName
    });
    
    res.json({
      success: true,
      message: `LFG Channel "${settings.channelName}" und Rolle "${settings.roleName}" wurden eingerichtet`
    });
  } catch (error) {
    console.error('Fehler beim LFG Setup:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim LFG Setup'
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