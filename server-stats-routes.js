const express = require('express');
const router = express.Router();
const ServerStatsSupabase = require('./supabase-server-stats');

// GET - Lade Server-Stats Einstellungen aus Supabase
router.get('/api/server-stats', async (req, res) => {
  try {
    console.log('📋 Lade Server-Stats Einstellungen aus Supabase...');
    
    const guildId = req.query.guild_id || process.env.GUILD_ID;
    const settings = await ServerStatsSupabase.loadServerStatsSettings(guildId);
    
    if (!settings) {
      console.log('⚠️ Server-Stats Einstellungen nicht gefunden, initialisiere Standards...');
      await ServerStatsSupabase.initializeDefaultServerStats(guildId);
      const defaultSettings = await ServerStatsSupabase.loadServerStatsSettings(guildId);
      return res.json(defaultSettings);
    }
    
    const enabledChannels = Object.entries(settings?.channels || {}).filter(([_, config]) => config.enabled).length;
    console.log(`✅ Server-Stats Einstellungen aus Supabase geladen: ${enabledChannels} Channels aktiv`);
    
    res.json({
      ...settings,
      _loadTimestamp: new Date().toISOString(),
      _source: 'supabase'
    });
  } catch (error) {
    console.error('❌ Fehler beim Laden der Server-Stats Einstellungen aus Supabase:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Einstellungen: ' + error.message });
  }
});

// POST - Speichere Server-Stats Einstellungen in Supabase
router.post('/api/server-stats', async (req, res) => {
  try {
    const newSettings = req.body;
    
    // Validierung
    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({ error: 'Ungültige Einstellungen' });
    }
    
    console.log('📝 Empfange Server-Stats Update für Supabase...');
    console.log(`💾 Speichere ${Object.keys(newSettings).length} Einstellungen in Supabase...`);
    
    const guildId = newSettings.guild_id || req.body.guild_id || process.env.GUILD_ID;
    
    // Speichere in Supabase
    const saveSuccess = await ServerStatsSupabase.saveServerStatsSettings(newSettings, guildId);
    
    if (!saveSuccess) {
      console.error('❌ Fehler beim Speichern der Server-Stats in Supabase');
      return res.status(500).json({ error: 'Fehler beim Speichern in Supabase' });
    }
    
    // Restart Stats Updater wenn enabled geändert wurde
    if (newSettings.hasOwnProperty('enabled')) {
      if (newSettings.enabled) {
        ServerStatsSupabase.startStatsUpdater(newSettings);
        console.log('🔄 Stats-Updater mit Supabase gestartet');
      } else {
        ServerStatsSupabase.stopStatsUpdater();
        console.log('⏸️ Stats-Updater gestoppt');
      }
    }
    
    const enabledChannels = Object.entries(newSettings.channels || {}).filter(([_, config]) => config.enabled).length;
    console.log(`✅ Server-Stats erfolgreich in Supabase gespeichert: ${enabledChannels} Channels aktiv`);
    
    res.json({ 
      success: true, 
      message: 'Server-Stats Einstellungen erfolgreich in Supabase gespeichert!',
      settings: newSettings,
      timestamp: new Date().toISOString(),
      _source: 'supabase'
    });
  } catch (error) {
    console.error('❌ Fehler beim Speichern der Server-Stats Einstellungen in Supabase:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Einstellungen: ' + error.message });
  }
});

// POST - Validiere und repariere Stats-Channels (weiterhin unterstützt)
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
    
    // Log Activity in Supabase
    await ServerStatsSupabase.logServerStatsActivity(
      guild.id,
      'validate',
      '',
      '',
      '',
      '',
      true,
      '',
      0,
      'dashboard'
    );
    
    // Hinweis: Diese Funktion existiert noch nicht in der neuen API
    // Müsste implementiert werden oder durch andere Methoden ersetzt werden
    console.log('⚠️ Channel-Validierung noch nicht in Supabase API implementiert');
    
    res.json({ 
      success: true, 
      message: 'Channel-Validierung mit Supabase - noch in Entwicklung',
      note: 'Diese Funktion wird in der nächsten Version implementiert'
    });
  } catch (error) {
    console.error('❌ Fehler bei der Channel-Validierung:', error);
    res.status(500).json({ error: 'Fehler bei der Channel-Validierung' });
  }
});

// GET - Liste alle Stats-Channels aus Supabase auf
router.get('/api/server-stats/list-channels', async (req, res) => {
  try {
    const guildId = req.query.guild_id || process.env.GUILD_ID;
    const activeChannels = await ServerStatsSupabase.getActiveChannels(guildId);
    
    const client = req.app.get('discordClient');
    if (!client || !client.guilds) {
      return res.status(500).json({ error: 'Discord Client nicht verfügbar' });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({ error: 'Kein Server gefunden' });
    }
    
    // Erweitere mit Discord-Daten
    const channelsWithDiscordData = activeChannels.map(ch => {
      const discordChannel = guild.channels.cache.get(ch.channel_id);
      return {
        ...ch,
        exists: !!discordChannel,
        discordName: discordChannel?.name || 'Channel nicht gefunden',
        createdAt: discordChannel?.createdAt?.toISOString() || null,
        categoryName: discordChannel?.parent?.name || 'Keine Kategorie'
      };
    });
    
    res.json({
      success: true,
      channels: channelsWithDiscordData,
      totalChannels: channelsWithDiscordData.length,
      activeChannels: channelsWithDiscordData.filter(ch => ch.enabled).length,
      _source: 'supabase'
    });
  } catch (error) {
    console.error('❌ Fehler beim Auflisten der Stats-Channels aus Supabase:', error);
    res.status(500).json({ error: 'Fehler beim Auflisten der Channels' });
  }
});

// POST - Bereinige doppelte Stats-Channels (Legacy-Support)
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
    
    // Log Activity in Supabase
    await ServerStatsSupabase.logServerStatsActivity(
      guild.id,
      'cleanup',
      '',
      '',
      '',
      '',
      true,
      '',
      0,
      'dashboard'
    );
    
    // Diese Funktionen müssten in der neuen API implementiert werden
    console.log('⚠️ Cleanup-Funktionen noch nicht in neuer Supabase API implementiert');
    
    res.json({ 
      success: true, 
      message: '🧹 Cleanup-Funktion mit Supabase - noch in Entwicklung',
      duplicatesRemoved: 0,
      note: 'Diese Funktion wird in der nächsten Version implementiert'
    });
  } catch (error) {
    console.error('❌ Fehler bei der Bereinigung doppelter Channels:', error);
    res.status(500).json({ error: 'Fehler bei der Bereinigung doppelter Channels' });
  }
});

// POST - Kompletter Reset aller Stats-Channels (Legacy-Support)
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
    
    // Log Activity in Supabase
    await ServerStatsSupabase.logServerStatsActivity(
      guild.id,
      'reset',
      '',
      '',
      '',
      '',
      true,
      '',
      0,
      'dashboard'
    );
    
    console.log('⚠️ Reset-Funktionen noch nicht in neuer Supabase API implementiert');
    
    res.json({ 
      success: true, 
      message: '🔄 Reset-Funktion mit Supabase - noch in Entwicklung',
      deletedCount: 0,
      note: 'Diese Funktion wird in der nächsten Version implementiert'
    });
  } catch (error) {
    console.error('❌ Fehler beim kompletten Reset:', error);
    res.status(500).json({ error: 'Fehler beim kompletten Reset' });
  }
});

// POST - Erstelle alle Stats-Channels (Legacy-Support)
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
    
    // Log Activity in Supabase
    await ServerStatsSupabase.logServerStatsActivity(
      guild.id,
      'create',
      '',
      '',
      '',
      '',
      true,
      '',
      0,
      'dashboard'
    );
    
    console.log('⚠️ Channel-Erstellung noch nicht in neuer Supabase API implementiert');
    
    res.json({ 
      success: true, 
      message: 'Channel-Erstellung mit Supabase - noch in Entwicklung',
      note: 'Diese Funktion wird in der nächsten Version implementiert'
    });
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Stats-Channels:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Channels' });
  }
});

// DELETE - Lösche alle Stats-Channels (Legacy-Support)
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
    
    // Log Activity in Supabase
    await ServerStatsSupabase.logServerStatsActivity(
      guild.id,
      'delete',
      '',
      '',
      '',
      '',
      true,
      '',
      0,
      'dashboard'
    );
    
    console.log('⚠️ Channel-Löschung noch nicht in neuer Supabase API implementiert');
    
    res.json({ 
      success: true, 
      message: 'Channel-Löschung mit Supabase - noch in Entwicklung',
      note: 'Diese Funktion wird in der nächsten Version implementiert'
    });
  } catch (error) {
    console.error('❌ Fehler beim Löschen der Stats-Channels:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Channels' });
  }
});

// POST - Update Stats sofort
router.post('/api/server-stats/update-now', async (req, res) => {
  try {
    console.log('🔄 Starte manuelles Server-Stats Update über Supabase...');
    await ServerStatsSupabase.updateAllServerStats();
    
    res.json({ 
      success: true, 
      message: 'Server-Stats erfolgreich über Supabase aktualisiert!',
      timestamp: new Date().toISOString(),
      _source: 'supabase'
    });
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Stats über Supabase:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Stats' });
  }
});

// GET - Aktuelle Server-Statistiken aus Supabase
router.get('/api/server-stats/current', async (req, res) => {
  try {
    const client = req.app.get('discordClient');
    if (!client || !client.guilds) {
      return res.status(500).json({ error: 'Discord Client nicht verfügbar' });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({ error: 'Kein Server gefunden' });
    }
    
    const guildId = req.query.guild_id || guild.id;
    
    // Lade aus Supabase oder berechne neu
    let stats = await ServerStatsSupabase.getCurrentStats(guildId);
    
    if (!stats) {
      // Berechne Stats und speichere in Supabase
      const calculatedStats = ServerStatsSupabase.calculateServerStats(guild);
      await ServerStatsSupabase.updateCurrentStats(calculatedStats, guildId);
      stats = await ServerStatsSupabase.getCurrentStats(guildId);
    }
    
    res.json({
      success: true,
      stats: {
        memberCount: stats.member_count,
        onlineCount: stats.online_count,
        boostCount: stats.boost_count,
        channelCount: stats.channel_count,
        roleCount: stats.role_count,
        serverLevel: stats.server_level,
        createdDate: stats.created_date,
        botCount: stats.bot_count
      },
      serverName: stats.server_name || guild.name,
      serverIcon: stats.server_icon || guild.iconURL({ dynamic: true }),
      lastUpdated: stats.updated_at || new Date().toISOString(),
      _source: 'supabase'
    });
  } catch (error) {
    console.error('❌ Fehler beim Laden der aktuellen Stats aus Supabase:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Stats' });
  }
});

// GET - Timer-Status aus Supabase
router.get('/api/server-stats/timer-status', async (req, res) => {
  try {
    const guildId = req.query.guild_id || process.env.GUILD_ID;
    const timerStatus = await ServerStatsSupabase.getTimerStatus(guildId);
    
    res.json({
      success: true,
      ...timerStatus,
      _source: 'supabase'
    });
  } catch (error) {
    console.error('❌ Fehler beim Laden des Timer-Status aus Supabase:', error);
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
    
    const guildId = guild.id;
    
    // Lade Channel-Konfiguration aus Supabase
    const activeChannels = await ServerStatsSupabase.getActiveChannels(guildId);
    const channelConfig = activeChannels.find(ch => ch.stat_type === statType);
    
    if (!channelConfig) {
      return res.status(400).json({ error: 'Stats-Channel nicht in Supabase gefunden' });
    }
    
    const stats = ServerStatsSupabase.calculateServerStats(guild);
    const statValue = stats[statType];
    
    // Teste Channel-Update
    await ServerStatsSupabase.updateStatsChannel(guild, statType, statValue, channelConfig);
    
    // Log Activity in Supabase
    await ServerStatsSupabase.logServerStatsActivity(
      guildId,
      'test',
      statType,
      channelConfig.channel_id,
      '',
      statValue.toString(),
      true,
      '',
      0,
      'dashboard'
    );
    
    res.json({ 
      success: true, 
      message: `${statType} Channel erfolgreich über Supabase getestet!`,
      value: statValue,
      _source: 'supabase'
    });
  } catch (error) {
    console.error(`❌ Fehler beim Testen des ${req.params.statType} Channels über Supabase:`, error);
    res.status(500).json({ error: 'Fehler beim Testen des Channels' });
  }
});

module.exports = router; 