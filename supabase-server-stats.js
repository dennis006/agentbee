const { createClient } = require('@supabase/supabase-js');
const { ChannelType, PermissionFlagsBits } = require('discord.js');

// Supabase Client
let supabase = null;
let client = null;
let updateInterval = null;

// Guild ID vom Bot (mit Fallback auf Standard-Guild)
const PRIMARY_GUILD_ID = process.env.GUILD_ID || '1203994020779532348';

// ============================
// 1. SUPABASE INITIALISIERUNG
// ============================

function initializeSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Supabase Umgebungsvariablen fehlen!');
    return false;
  }
  
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  console.log('✅ Supabase für Server Stats initialisiert');
  return true;
}

// ============================
// 2. KONFIGURATIONSMANAGEMENT
// ============================

// Lade Server Stats Konfiguration aus Supabase
async function loadServerStatsSettings(guildId = PRIMARY_GUILD_ID) {
  try {
    if (!supabase) {
      console.error('❌ Supabase nicht initialisiert');
      return null;
    }
    
    const { data, error } = await supabase
      .rpc('get_server_stats_config', { p_guild_id: guildId });
    
    if (error) {
      console.error('❌ Fehler beim Laden der Server Stats Konfiguration:', error);
      return null;
    }

    if (!data) {
      // Erstelle Standard-Konfiguration wenn keine vorhanden
      await initializeDefaultServerStats(guildId);
      return await loadServerStatsSettings(guildId);
    }

    console.log(`📊 Server Stats Konfiguration geladen für Guild: ${guildId}`);
    return data;
    
  } catch (error) {
    console.error('❌ Fehler beim Laden der Server Stats Einstellungen:', error);
    return null;
  }
}

// Speichere Server Stats Konfiguration in Supabase
async function saveServerStatsSettings(settings, guildId = PRIMARY_GUILD_ID) {
  try {
    if (!supabase) {
      console.error('❌ Supabase nicht initialisiert');
      return false;
    }
    
    const { data, error } = await supabase
      .rpc('save_server_stats_config', { 
        p_guild_id: guildId, 
        p_config: settings 
      });
    
    if (error) {
      console.error('❌ Fehler beim Speichern der Server Stats Konfiguration:', error);
      return false;
    }
    
    // Log the activity
    await logServerStatsActivity(
      guildId,
      'config_update',
      '',
      '',
      '',
      JSON.stringify(settings),
      true,
      '',
      0,
      'system'
    );

    console.log(`💾 Server Stats Konfiguration gespeichert für Guild: ${guildId}`);
    return true;
    
  } catch (error) {
    console.error('❌ Fehler beim Speichern der Server Stats Einstellungen:', error);
    return false;
  }
}

// Initialisiere Standard Server Stats für eine Guild
async function initializeDefaultServerStats(guildId) {
  try {
    if (!supabase) {
      console.error('❌ Supabase nicht initialisiert');
      return false;
    }

    const { data, error } = await supabase
      .rpc('initialize_default_server_stats', { p_guild_id: guildId });

    if (error) {
      console.error('❌ Fehler beim Initialisieren der Standard Server Stats:', error);
      return false;
    }

    console.log(`🎉 Standard Server Stats initialisiert für Guild: ${guildId}`);
    return true;

  } catch (error) {
    console.error('❌ Fehler beim Initialisieren der Standard Server Stats:', error);
    return false;
  }
}

// ============================
// 3. AKTUELLE STATS MANAGEMENT
// ============================

// Berechne Server-Statistiken (wie bisher)
function calculateServerStats(guild) {
  // Verbesserte Online-Nutzer Berechnung
  let onlineCount = 0;
  
  try {
    // Versuche zuerst über Presences
    onlineCount = guild.members.cache.filter(member => {
      if (!member.presence) return false;
      return member.presence.status === 'online' || 
             member.presence.status === 'idle' || 
             member.presence.status === 'dnd';
    }).size;
    
    // Fallback: Wenn keine Presences verfügbar, schätze basierend auf Voice-Channels
    if (onlineCount === 0) {
      const voiceChannelMembers = guild.channels.cache
        .filter(channel => channel.type === ChannelType.GuildVoice)
        .reduce((count, channel) => count + channel.members.size, 0);
      
      // Schätze Online-Nutzer als mindestens die in Voice-Channels + 20% der Gesamtmitglieder
      onlineCount = Math.max(voiceChannelMembers, Math.floor(guild.memberCount * 0.2));
    }
  } catch (error) {
    console.error('❌ Fehler beim Berechnen der Online-Nutzer:', error);
    // Fallback: 20% der Gesamtmitglieder als Schätzung
    onlineCount = Math.floor(guild.memberCount * 0.2);
  }
  
  const stats = {
    serverName: guild.name,
    serverIcon: guild.iconURL(),
    memberCount: guild.memberCount,
    onlineCount: onlineCount,
    boostCount: guild.premiumSubscriptionCount || 0,
    channelCount: guild.channels.cache.filter(channel => 
      channel.type === ChannelType.GuildText || 
      channel.type === ChannelType.GuildVoice
    ).size,
    roleCount: guild.roles.cache.size - 1, // -1 für @everyone
    serverLevel: guild.premiumTier,
    createdDate: guild.createdAt.toLocaleDateString('de-DE'),
    botCount: guild.members.cache.filter(member => member.user.bot).size,
    voiceChannelCount: guild.channels.cache.filter(ch => ch.type === ChannelType.GuildVoice).size,
    textChannelCount: guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText).size,
    categoryCount: guild.channels.cache.filter(ch => ch.type === ChannelType.GuildCategory).size
  };
  
  return stats;
}

// Speichere aktuelle Stats in Supabase
async function updateCurrentStats(stats, guildId = PRIMARY_GUILD_ID) {
  try {
    if (!supabase) {
      console.error('❌ Supabase nicht initialisiert');
      return false;
    }

    const { data, error } = await supabase
      .rpc('update_current_stats', { 
        p_guild_id: guildId, 
        p_stats: stats 
      });

    if (error) {
      console.error('❌ Fehler beim Aktualisieren der aktuellen Stats:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der aktuellen Stats:', error);
    return false;
  }
}

// Lade aktuelle Stats aus Supabase
async function getCurrentStats(guildId = PRIMARY_GUILD_ID) {
  try {
    if (!supabase) {
      console.error('❌ Supabase nicht initialisiert');
      return null;
    }

    const { data, error } = await supabase
      .from('server_stats_current')
      .select('*')
      .eq('guild_id', guildId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Fehler beim Laden der aktuellen Stats:', error);
      return null;
    }

    return data;

  } catch (error) {
    console.error('❌ Fehler beim Laden der aktuellen Stats:', error);
    return null;
  }
}

// ============================
// 4. TIMER MANAGEMENT  
// ============================

// Update Timer Status in Supabase
async function updateTimerStatus(timerData, guildId = PRIMARY_GUILD_ID) {
  try {
    if (!supabase) {
      console.error('❌ Supabase nicht initialisiert');
      return false;
    }

    const { data, error } = await supabase
      .rpc('update_timer_status', { 
        p_guild_id: guildId, 
        p_timer_data: timerData 
      });
    
    if (error) {
      console.error('❌ Fehler beim Aktualisieren des Timer Status:', error);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Timer Status:', error);
    return false;
  }
}

// Hole Timer Status aus Supabase
async function getTimerStatus(guildId = PRIMARY_GUILD_ID) {
  try {
    if (!supabase) {
      console.error('❌ Supabase nicht initialisiert');
      return getDefaultTimerStatus();
    }

    const { data, error } = await supabase
      .from('server_stats_timer')
      .select('*')
      .eq('guild_id', guildId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Fehler beim Laden des Timer Status:', error);
      return getDefaultTimerStatus();
    }

    if (!data) {
      return getDefaultTimerStatus();
    }

    // Berechne aktuelle Werte
    const now = Date.now();
    const timeSinceLastUpdate = now - data.last_update_time;
    const timeRemaining = Math.max(0, data.total_interval - timeSinceLastUpdate);
    const progress = Math.min(100, (timeSinceLastUpdate / data.total_interval) * 100);
    
    return {
      enabled: data.enabled,
      lastUpdateTime: data.last_update_time,
      nextUpdateTime: data.last_update_time + data.total_interval,
      timeRemaining: timeRemaining,
      totalInterval: data.total_interval,
      progress: progress,
      isRunning: data.is_running,
      currentTime: now
    };
    
  } catch (error) {
    console.error('❌ Fehler beim Laden des Timer Status:', error);
    return getDefaultTimerStatus();
  }
}

// Default Timer Status
function getDefaultTimerStatus() {
    return {
      enabled: false,
      lastUpdateTime: null,
      nextUpdateTime: null,
      timeRemaining: 0,
      totalInterval: 300000,
    progress: 0,
    isRunning: false,
    currentTime: Date.now()
  };
}

// ============================
// 5. ACTIVITY LOGGING
// ============================

// Log Server Stats Activity
async function logServerStatsActivity(
  guildId,
  activityType,
  statType = '',
  channelId = '',
  oldValue = '',
  newValue = '',
  success = true,
  errorMessage = '',
  duration = 0,
  performedBy = 'system'
) {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .rpc('log_server_stats_activity', {
        p_guild_id: guildId,
        p_activity_type: activityType,
        p_stat_type: statType,
        p_channel_id: channelId,
        p_old_value: oldValue,
        p_new_value: newValue,
        p_success: success,
        p_error_message: errorMessage,
        p_duration: duration,
        p_performed_by: performedBy
      });
    
    if (error) {
      console.error('❌ Fehler beim Logging der Activity:', error);
      return null;
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Fehler beim Logging der Activity:', error);
    return null;
  }
}

// ============================
// 6. CHANNEL MANAGEMENT
// ============================

// Lade Channel-Konfigurationen aus Supabase
async function getActiveChannels(guildId = PRIMARY_GUILD_ID) {
  try {
    if (!supabase) {
      console.error('❌ Supabase nicht initialisiert');
      return [];
    }

    const { data, error } = await supabase
      .from('view_server_stats_active_channels')
      .select('*')
      .eq('guild_id', guildId)
      .order('position');
    
    if (error) {
      console.error('❌ Fehler beim Laden der aktiven Channels:', error);
      return [];
    }
    
    return data || [];
    
  } catch (error) {
    console.error('❌ Fehler beim Laden der aktiven Channels:', error);
    return [];
  }
}

// Update Channel nach Aktualisierung
async function updateChannelStats(guildId, statType, channelId, newValue, success = true, errorMessage = '') {
  try {
    if (!supabase) return false;

    const { error } = await supabase
      .from('server_stats_channels')
      .update({
        last_value: newValue,
        last_updated: new Date().toISOString(),
        update_count: supabase.raw('update_count + 1'),
        error_count: success ? supabase.raw('error_count') : supabase.raw('error_count + 1'),
        last_error: errorMessage
      })
      .eq('guild_id', guildId)
      .eq('stat_type', statType);
    
    if (error) {
      console.error('❌ Fehler beim Aktualisieren der Channel Stats:', error);
      return false;
    }

    // Log the activity
    await logServerStatsActivity(
      guildId,
      'update',
      statType,
      channelId,
      '',
      newValue,
      success,
      errorMessage,
      0,
      'system'
    );

    return true;
    
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Channel Stats:', error);
    return false;
  }
}

// ============================
// 7. HAUPTFUNKTIONEN (wie im originalen server-stats-api.js)
// ============================

// Initialisiere Server Stats System
async function initializeServerStats(discordClient) {
  client = discordClient;
  
  // Initialisiere Supabase
  if (!initializeSupabase()) {
    console.error('❌ Server Stats System konnte nicht initialisiert werden - Supabase Fehler');
    return;
  }
  

  
  // Lade alle Mitglieder für bessere Presence-Daten
  try {
    for (const guild of client.guilds.cache.values()) {
      await guild.members.fetch();
    }
  } catch (error) {
    console.error('❌ Fehler beim Laden der Mitglieder:', error);
  }
  
  // Lade Konfiguration aus Supabase
  const settings = await loadServerStatsSettings();
  
  if (settings && settings.enabled) {
    startStatsUpdater(settings);
    console.log('📊 Server-Stats System aktiviert (Supabase-basiert)');
  } else {
    console.log('📊 Server-Stats System deaktiviert');
  }
}

// Starte automatische Updates
function startStatsUpdater(settings) {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  const intervalTime = settings.updateInterval || 300000;
  
  // Setze Timer-Status
  const timerData = {
    enabled: true,
    lastUpdateTime: Date.now(),
    nextUpdateTime: Date.now() + intervalTime,
    totalInterval: intervalTime,
    timeRemaining: intervalTime,
    progress: 0,
    isRunning: true
  };
  
  updateTimerStatus(timerData);
  
  updateInterval = setInterval(async () => {
    const startTime = Date.now();
    
    // Update Timer
    const timerUpdate = {
      enabled: true,
      lastUpdateTime: startTime,
      nextUpdateTime: startTime + intervalTime,
      totalInterval: intervalTime,
      timeRemaining: intervalTime,
      progress: 0,
      isRunning: true
    };
    
    await updateTimerStatus(timerUpdate);
    await updateAllServerStats();
    
  }, intervalTime);
  
  console.log(`📊 Auto-Updater gestartet (${intervalTime}ms Intervall)`);
}

// Stoppe automatische Updates
function stopStatsUpdater() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  
  // Update Timer Status
  updateTimerStatus({
    enabled: false,
    isRunning: false,
    timeRemaining: 0,
    progress: 0
  });
}

// Update alle Server-Stats
async function updateAllServerStats() {
  if (!client || !client.guilds) return;
  
  try {
    for (const guild of client.guilds.cache.values()) {
      // Berechne aktuelle Stats
      const stats = calculateServerStats(guild);
      
      // Speichere in Supabase
      await updateCurrentStats(stats, guild.id);
      
      // Update jeden aktivierten Channel
      const activeChannels = await getActiveChannels(guild.id);
      
      for (const channel of activeChannels) {
        if (channel.enabled && stats[channel.stat_type] !== undefined) {
          await updateStatsChannel(guild, channel.stat_type, stats[channel.stat_type], channel);
          
          // Kleine Verzögerung zwischen Updates um Rate-Limits zu vermeiden
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Server-Stats:', error);
  }
}

// Formatiere Channel-Namen (wie bisher)
function formatChannelName(template, value, statType) {
  let formatted = template.replace('{count}', value);
  formatted = formatted.replace('{date}', value);
  
  // Spezielle Formatierung für verschiedene Stat-Typen
  switch (statType) {
    case 'serverLevel':
      const levelNames = ['Keine', 'Level 1', 'Level 2', 'Level 3'];
      formatted = formatted.replace('{count}', levelNames[value] || `Level ${value}`);
      break;
    case 'boostCount':
      formatted = formatted.replace('{count}', `${value}/14`);
      break;
  }
  
  return formatted;
}

// Update einzelnen Stats-Channel
async function updateStatsChannel(guild, statType, statValue, channelConfig) {
  try {
    let channel = guild.channels.cache.get(channelConfig.channel_id);
    
    if (!channel) {
      console.log(`⚠️ Stats-Channel für ${statType} nicht gefunden (ID: ${channelConfig.channel_id})`);
      await updateChannelStats(guild.id, statType, channelConfig.channel_id, statValue, false, 'Channel nicht gefunden');
      return;
    }
    
    const newName = formatChannelName(channelConfig.name_template, statValue, statType);
    
    // Update nur wenn Name sich geändert hat
    if (channel.name !== newName) {
      await channel.setName(newName);
      await updateChannelStats(guild.id, statType, channelConfig.channel_id, statValue, true, '');
    }
    
  } catch (error) {
    console.error(`❌ Fehler beim Aktualisieren des ${statType} Channels:`, error);
    await updateChannelStats(guild.id, statType, channelConfig.channel_id, statValue, false, error.message);
  }
}

// ============================
// 8. API ENDPOINTS (für Express Server)
// ============================

// Für die Integration in den Express Server
const serverStatsRoutes = {
  
  // GET /api/server-stats - Lade Konfiguration
  async getConfig(req, res) {
    try {
      const guildId = req.query.guild_id || PRIMARY_GUILD_ID;
      const config = await loadServerStatsSettings(guildId);
      
      if (!config) {
        return res.status(404).json({ error: 'Konfiguration nicht gefunden' });
      }
      
      res.json(config);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Konfiguration:', error);
      res.status(500).json({ error: 'Serverfehler beim Laden der Konfiguration' });
    }
  },
  
  // POST /api/server-stats - Speichere Konfiguration
  async saveConfig(req, res) {
    try {
      const guildId = req.body.guild_id || PRIMARY_GUILD_ID;
      const success = await saveServerStatsSettings(req.body, guildId);
      
      if (!success) {
        return res.status(500).json({ error: 'Fehler beim Speichern der Konfiguration' });
      }
      
      // Neustart des Updaters mit neuen Einstellungen
      if (req.body.enabled) {
        startStatsUpdater(req.body);
    } else {
        stopStatsUpdater();
      }
      
      res.json({ success: true, message: 'Konfiguration erfolgreich gespeichert' });
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Konfiguration:', error);
      res.status(500).json({ error: 'Serverfehler beim Speichern der Konfiguration' });
    }
  },
  
  // GET /api/server-stats/current - Lade aktuelle Stats
  async getCurrentStats(req, res) {
    try {
      const guildId = req.query.guild_id || PRIMARY_GUILD_ID;
      const stats = await getCurrentStats(guildId);
      
      if (!stats) {
        return res.status(404).json({ error: 'Aktuelle Stats nicht gefunden' });
      }
      
      res.json({
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
        serverName: stats.server_name,
        serverIcon: stats.server_icon
      });
    } catch (error) {
      console.error('❌ Fehler beim Laden der aktuellen Stats:', error);
      res.status(500).json({ error: 'Serverfehler beim Laden der aktuellen Stats' });
    }
  },
  
  // GET /api/server-stats/timer-status - Lade Timer Status
  async getTimerStatus(req, res) {
    try {
      const guildId = req.query.guild_id || PRIMARY_GUILD_ID;
      const timerStatus = await getTimerStatus(guildId);
      
      res.json(timerStatus);
    } catch (error) {
      console.error('❌ Fehler beim Laden des Timer Status:', error);
      res.status(500).json({ error: 'Serverfehler beim Laden des Timer Status' });
    }
  },
  
  // POST /api/server-stats/update-now - Manuelles Update
  async updateNow(req, res) {
    try {
      await updateAllServerStats();
      res.json({ success: true, message: 'Server-Stats erfolgreich aktualisiert' });
  } catch (error) {
      console.error('❌ Fehler beim manuellen Update:', error);
      res.status(500).json({ error: 'Serverfehler beim manuellen Update' });
    }
  }
  
};

// ============================
// 9. EXPORT
// ============================

module.exports = {
  // Haupt-Funktionen
  initializeServerStats,
  updateAllServerStats,
  startStatsUpdater,
  stopStatsUpdater,
  
  // Konfigurations-Management
  loadServerStatsSettings,
  saveServerStatsSettings,
  initializeDefaultServerStats,
  
  // Stats Management
  calculateServerStats,
  updateCurrentStats,
  getCurrentStats,
  
  // Timer Management
  updateTimerStatus,
  getTimerStatus,
  
  // Channel Management
  getActiveChannels,
  updateChannelStats,
  formatChannelName,
  updateStatsChannel,
  
  // Activity Logging
  logServerStatsActivity,
  
  // API Routes
  serverStatsRoutes,
  
  // Utility
  initializeSupabase
};

console.log('✅ Supabase Server Stats API geladen - JSON-System ersetzt!'); 