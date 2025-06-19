const express = require('express');
const router = express.Router();
const ServerStats = require('./server-stats-api');

// GET - Lade Server-Stats Einstellungen
router.get('/api/server-stats', (req, res) => {
  try {
    console.log('📋 Lade Server-Stats Einstellungen für Dashboard...');
    
    // Stelle sicher dass das Server-Stats-System initialisiert ist
    if (!ServerStats.serverStatsSettings) {
      console.log('⚠️ Server-Stats Einstellungen nicht geladen, versuche neu zu laden...');
      ServerStats.loadServerStatsSettings();
    }
    
    const settings = ServerStats.serverStatsSettings;
    const enabledChannels = Object.entries(settings?.channels || {}).filter(([_, config]) => config.enabled).length;
    console.log(`✅ Server-Stats Einstellungen geladen: ${enabledChannels} Channels aktiv`);
    
    res.json({
      ...settings,
      _loadTimestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Fehler beim Laden der Server-Stats Einstellungen:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Einstellungen: ' + error.message });
  }
});

// POST - Speichere Server-Stats Einstellungen
router.post('/api/server-stats', async (req, res) => {
  try {
    const newSettings = req.body;
    
    // Validierung
    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({ error: 'Ungültige Einstellungen' });
    }
    
    console.log('📝 Empfange Server-Stats Update...');
    console.log(`💾 Speichere ${Object.keys(newSettings).length} Einstellungen...`);
    
    // KOMPLETT ERSETZEN - keine Defaults verwenden!
    ServerStats.serverStatsSettings = newSettings;
    
    const enabledChannels = Object.entries(ServerStats.serverStatsSettings.channels || {}).filter(([_, config]) => config.enabled).length;
    console.log(`✅ Server-Stats aktualisiert: ${enabledChannels} Channels aktiv`);
    
    // Explizit speichern und Erfolg prüfen
    const saveSuccess = ServerStats.saveServerStatsSettings();
    
    if (!saveSuccess) {
      console.error('❌ Fehler beim Speichern der Server-Stats auf Disk');
      return res.status(500).json({ error: 'Fehler beim Speichern auf Disk' });
    }
    
    // Restart Stats Updater wenn enabled geändert wurde
    if (newSettings.hasOwnProperty('enabled')) {
      if (newSettings.enabled) {
        ServerStats.startStatsUpdater();
        console.log('🔄 Stats-Updater gestartet');
      } else {
        ServerStats.stopStatsUpdater();
        console.log('⏸️ Stats-Updater gestoppt');
      }
    }
    
    console.log('✅ Server-Stats Einstellungen erfolgreich gespeichert');
    res.json({ 
      success: true, 
      message: 'Server-Stats Einstellungen erfolgreich gespeichert!',
      settings: ServerStats.serverStatsSettings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Fehler beim Speichern der Server-Stats Einstellungen:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Einstellungen: ' + error.message });
  }
});

// POST - Validiere und repariere Stats-Channels
router.post('/api/server-stats/validate-channels', async (req, res) => {
  try {
    const client = req.app.get('discordClient');
    if (!client || !client.guilds) {
      return res.status(500).json({ error: 'Discord Client nicht verfügbar' });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({ error: 'Kein Server gefunden' });
    }
    
    // Verwende die neue Validierungsfunktion
    await ServerStats.validateAndRepairStatsChannels();
    
    res.json({ 
      success: true, 
      message: 'Stats-Channels validiert und repariert!' 
    });
  } catch (error) {
    console.error('❌ Fehler bei der Channel-Validierung:', error);
    res.status(500).json({ error: 'Fehler bei der Channel-Validierung' });
  }
});

// GET - Liste alle Stats-Channels auf
router.get('/api/server-stats/list-channels', (req, res) => {
  try {
    const client = req.app.get('discordClient');
    if (!client || !client.guilds) {
      return res.status(500).json({ error: 'Discord Client nicht verfügbar' });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({ error: 'Kein Server gefunden' });
    }
    
    // Finde alle Stats-Kategorien
    const statsCategories = guild.channels.cache.filter(ch => 
      ch.type === 4 && // GuildCategory
      (ch.name.includes('Server Statistiken') || 
       ch.name.includes('📊') ||
       ch.name.toLowerCase().includes('statistik') ||
       ch.name.toLowerCase().includes('stats'))
    );
    
    // Finde alle Stats-Channels
    const statsChannelPatterns = ['👥 Mitglieder:', '🟢 Online:', '🚀 Boosts:', '📺 Kanäle:', '🎭 Rollen:', '⭐ Level:', '📅 Erstellt:', '🤖 Bots:'];
    const statsChannels = guild.channels.cache.filter(ch => 
      ch.type === 2 && // GuildVoice
      statsChannelPatterns.some(pattern => ch.name.includes(pattern))
    );
    
    const result = {
      categories: statsCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        createdAt: cat.createdAt.toISOString(),
        channelsInside: guild.channels.cache.filter(ch => ch.parentId === cat.id).size
      })),
      channels: statsChannels.map(ch => ({
        id: ch.id,
        name: ch.name,
        createdAt: ch.createdAt.toISOString(),
        categoryId: ch.parentId,
        categoryName: ch.parent?.name || 'Keine Kategorie'
      }))
    };
    
    res.json({
      success: true,
      ...result,
      totalCategories: result.categories.length,
      totalChannels: result.channels.length
    });
  } catch (error) {
    console.error('❌ Fehler beim Auflisten der Stats-Channels:', error);
    res.status(500).json({ error: 'Fehler beim Auflisten der Channels' });
  }
});

// POST - Bereinige doppelte Stats-Channels
router.post('/api/server-stats/cleanup-duplicates', async (req, res) => {
  try {
    const client = req.app.get('discordClient');
    if (!client || !client.guilds) {
      return res.status(500).json({ error: 'Discord Client nicht verfügbar' });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({ error: 'Kein Server gefunden' });
    }
    
    const duplicatesRemoved = await ServerStats.cleanupDuplicateStatsChannels(guild);
    
    res.json({ 
      success: true, 
      message: `🧹 ${duplicatesRemoved} doppelte Channels/Kategorien entfernt!`,
      duplicatesRemoved: duplicatesRemoved
    });
  } catch (error) {
    console.error('❌ Fehler bei der Bereinigung doppelter Channels:', error);
    res.status(500).json({ error: 'Fehler bei der Bereinigung doppelter Channels' });
  }
});

// POST - Kompletter Reset aller Stats-Channels
router.post('/api/server-stats/complete-reset', async (req, res) => {
  try {
    const client = req.app.get('discordClient');
    if (!client || !client.guilds) {
      return res.status(500).json({ error: 'Discord Client nicht verfügbar' });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({ error: 'Kein Server gefunden' });
    }
    
    const deletedCount = await ServerStats.completeStatsChannelReset(guild);
    
    res.json({ 
      success: true, 
      message: `🔄 Kompletter Reset durchgeführt! ${deletedCount} Channels/Kategorien gelöscht und neu erstellt!`,
      deletedCount: deletedCount
    });
  } catch (error) {
    console.error('❌ Fehler beim kompletten Reset:', error);
    res.status(500).json({ error: 'Fehler beim kompletten Reset' });
  }
});

// POST - Erstelle alle Stats-Channels
router.post('/api/server-stats/create-channels', async (req, res) => {
  try {
    const client = req.app.get('discordClient');
    if (!client || !client.guilds) {
      return res.status(500).json({ error: 'Discord Client nicht verfügbar' });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({ error: 'Kein Server gefunden' });
    }
    
    await ServerStats.createAllStatsChannels(guild);
    
    res.json({ 
      success: true, 
      message: 'Alle Stats-Channels erfolgreich erstellt!' 
    });
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Stats-Channels:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Channels' });
  }
});

// DELETE - Lösche alle Stats-Channels
router.delete('/api/server-stats/delete-channels', async (req, res) => {
  try {
    const client = req.app.get('discordClient');
    if (!client || !client.guilds) {
      return res.status(500).json({ error: 'Discord Client nicht verfügbar' });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({ error: 'Kein Server gefunden' });
    }
    
    await ServerStats.deleteAllStatsChannels(guild);
    
    res.json({ 
      success: true, 
      message: 'Alle Stats-Channels erfolgreich gelöscht!' 
    });
  } catch (error) {
    console.error('❌ Fehler beim Löschen der Stats-Channels:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Channels' });
  }
});

// POST - Update Stats sofort
router.post('/api/server-stats/update-now', async (req, res) => {
  try {
    await ServerStats.updateAllServerStats();
    
    res.json({ 
      success: true, 
      message: 'Server-Stats erfolgreich aktualisiert!' 
    });
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Stats:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Stats' });
  }
});

// GET - Aktuelle Server-Statistiken
router.get('/api/server-stats/current', (req, res) => {
  try {
    const client = req.app.get('discordClient');
    if (!client || !client.guilds) {
      return res.status(500).json({ error: 'Discord Client nicht verfügbar' });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({ error: 'Kein Server gefunden' });
    }
    
    const stats = ServerStats.calculateServerStats(guild);
    
    res.json({
      success: true,
      stats: stats,
      serverName: guild.name,
      serverIcon: guild.iconURL({ dynamic: true }),
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Fehler beim Laden der aktuellen Stats:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Stats' });
  }
});

// GET - Timer-Status
router.get('/api/server-stats/timer-status', (req, res) => {
  try {
    const timerStatus = ServerStats.getTimerStatus();
    
    res.json({
      success: true,
      ...timerStatus
    });
  } catch (error) {
    console.error('❌ Fehler beim Laden des Timer-Status:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Timer-Status' });
  }
});

// POST - Teste einzelnen Stats-Channel
router.post('/api/server-stats/test-channel/:statType', async (req, res) => {
  try {
    const { statType } = req.params;
    const client = req.app.get('discordClient');
    
    if (!client || !client.guilds) {
      return res.status(500).json({ error: 'Discord Client nicht verfügbar' });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({ error: 'Kein Server gefunden' });
    }
    
    if (!ServerStats.serverStatsSettings.channels[statType]) {
      return res.status(400).json({ error: 'Ungültiger Stats-Typ' });
    }
    
    const stats = ServerStats.calculateServerStats(guild);
    const statValue = stats[statType];
    
    // Teste Channel-Update
    await ServerStats.updateStatsChannel(guild, statType, statValue);
    
    res.json({ 
      success: true, 
      message: `${statType} Channel erfolgreich getestet!`,
      value: statValue
    });
  } catch (error) {
    console.error(`❌ Fehler beim Testen des ${req.params.statType} Channels:`, error);
    res.status(500).json({ error: 'Fehler beim Testen des Channels' });
  }
});

module.exports = router; 