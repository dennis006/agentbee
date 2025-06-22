const { ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase Client
let supabase = null;

// Initialisiere Supabase
function initializeSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('🤔 Supabase nicht konfiguriert - verwende JSON-Fallback');
    return false;
  }
  
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  console.log('✅ Supabase für Server Stats initialisiert');
  return true;
}

// Server Stats Settings
let serverStatsSettings = {
  enabled: true,
  updateInterval: 300000, // 5 Minuten
  channels: {
    memberCount: {
      enabled: true,
      channelId: '',
      name: '👥 Mitglieder: {count}',
      position: 0
    },
    onlineCount: {
      enabled: true,
      channelId: '',
      name: '🟢 Online: {count}',
      position: 1
    },
    boostCount: {
      enabled: true,
      channelId: '',
      name: '🚀 Boosts: {count}',
      position: 2
    },
    channelCount: {
      enabled: false,
      channelId: '',
      name: '📺 Kanäle: {count}',
      position: 3
    },
    roleCount: {
      enabled: false,
      channelId: '',
      name: '🎭 Rollen: {count}',
      position: 4
    },
    serverLevel: {
      enabled: false,
      channelId: '',
      name: '⭐ Level: {count}',
      position: 5
    },
    createdDate: {
      enabled: false,
      channelId: '',
      name: '📅 Erstellt: {date}',
      position: 6
    },
    botCount: {
      enabled: false,
      channelId: '',
      name: '🤖 Bots: {count}',
      position: 7
    },
    valorantSeason: {
      enabled: true,
      channelId: '',
      name: '🎮 Valorant Season Start: {countdown}',
      position: 8
    }
  },
  categoryId: '',
  categoryName: '📊 Server Statistiken',
  permissions: {
    viewChannel: true,
    connect: false,
    speak: false,
    useVAD: false
  },
  design: {
    emoji: '📊',
    color: '0x00FF7F',
    separator: ' • ',
    format: 'modern' // modern, classic, minimal
  }
};

const STATS_SETTINGS_FILE = path.join(__dirname, 'server-stats-settings.json');
let updateInterval = null;
let client = null;
let lastUpdateTime = null;

// Flag um sicherzustellen, dass Settings nur einmal geladen werden
let settingsLoaded = false;

// Lade Einstellungen (Supabase - erkennt beide Strukturen)
async function loadServerStatsSettings() {
  try {
    // Versuche zuerst Supabase
    if (supabase) {
      // Versuche neue JSONB-Struktur (ohne guild_id)
      const { data: jsonbData, error: jsonbError } = await supabase
        .from('server_stats_config')
        .select('*')
        .limit(1)
        .single();

      if (jsonbData && !jsonbError && jsonbData.config) {
        // Neue JSONB-Struktur gefunden
        serverStatsSettings = jsonbData.config;
        settingsLoaded = true;
        const enabledChannels = Object.entries(serverStatsSettings.channels).filter(([_, config]) => config.enabled).length;
        console.log(`📊 Server-Stats aus Supabase JSONB geladen: ${enabledChannels} Channels aktiv`);
        return serverStatsSettings;
      }

      // Fallback: Versuche alte normalisierte Struktur (mit guild_id)
      const guildId = process.env.GUILD_ID || '1203994020779532348';
      
      // Lade Basis-Konfiguration
      const { data: configData, error: configError } = await supabase
        .from('server_stats_config')
        .select('*')
        .eq('guild_id', guildId)
        .single();

      // Lade Channels
      const { data: channelsData, error: channelsError } = await supabase
        .from('server_stats_channels')
        .select('*')
        .eq('guild_id', guildId)
        .order('position');

      if (configData && !configError) {
        // Rekonstruiere aus alter normalisierter Struktur
        serverStatsSettings = {
          enabled: configData.enabled || false,
          updateInterval: configData.update_interval || 300000,
          categoryId: configData.category_id || '',
          categoryName: configData.category_name || '📊 Server Statistiken',
          permissions: {
            viewChannel: configData.permission_view_channel ?? true,
            connect: configData.permission_connect ?? false,
            speak: configData.permission_speak ?? false,
            useVAD: configData.permission_use_vad ?? false
          },
          design: {
            emoji: configData.design_emoji || '📊',
            color: configData.design_color || '0x00FF7F',
            separator: configData.design_separator || ' • ',
            format: configData.design_format || 'modern'
          },
          channels: {}
        };

        // Füge Channels hinzu
        if (channelsData && !channelsError) {
          for (const channel of channelsData) {
            serverStatsSettings.channels[channel.channel_type] = {
              enabled: channel.enabled,
              channelId: channel.channel_id,
              name: channel.channel_name,
              position: channel.position
            };
          }
        }

        settingsLoaded = true;
        const enabledChannels = Object.entries(serverStatsSettings.channels).filter(([_, config]) => config.enabled).length;
        console.log(`📊 Server-Stats aus Supabase normalisiert geladen: ${enabledChannels} Channels aktiv`);
        return serverStatsSettings;
      }
    }

    // Fallback auf JSON
    if (fs.existsSync(STATS_SETTINGS_FILE)) {
      const data = fs.readFileSync(STATS_SETTINGS_FILE, 'utf8');
      const savedSettings = JSON.parse(data);
      
      // KOMPLETT ERSETZEN - keine Defaults verwenden!
      serverStatsSettings = savedSettings;
      settingsLoaded = true;
      
      const enabledChannels = Object.entries(serverStatsSettings.channels).filter(([_, config]) => config.enabled).length;
      console.log(`📊 Server-Stats aus JSON geladen: ${enabledChannels} Channels aktiv`);
      return serverStatsSettings;
      
    } else {
      settingsLoaded = true;
      console.log(`📊 Server-Stats: Verwende Standard-Einstellungen`);
      return serverStatsSettings;
    }
  } catch (error) {
    console.error('🤔 Fehler beim Laden der Server-Stats Einstellungen:', error);
    settingsLoaded = true;
    return serverStatsSettings;
  }
}

// Speichere Einstellungen (Supabase - erkennt beide Strukturen)
async function saveServerStatsSettings() {
  try {
    // Versuche zuerst Supabase
    if (supabase) {
      // Prüfe welche Struktur existiert
      const { data: existingData } = await supabase
        .from('server_stats_config')
        .select('*')
        .limit(1)
        .single();

      if (existingData && existingData.config) {
        // Neue JSONB-Struktur - update
        const { error } = await supabase
          .from('server_stats_config')
          .update({
            config: serverStatsSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (!error) {
          console.log('✅ Server-Stats in Supabase JSONB gespeichert');
          return true;
        }
      } else {
        // Alte normalisierte Struktur oder neue JSONB erstellen
        const guildId = process.env.GUILD_ID || '1203994020779532348';
        
        // Versuche alte Struktur zu updaten
        const { data: oldConfig } = await supabase
          .from('server_stats_config')
          .select('*')
          .eq('guild_id', guildId)
          .single();

        if (oldConfig) {
          // Update alte normalisierte Struktur
          await supabase
            .from('server_stats_config')
            .update({
              enabled: serverStatsSettings.enabled,
              update_interval: serverStatsSettings.updateInterval,
              category_id: serverStatsSettings.categoryId || '',
              category_name: serverStatsSettings.categoryName || '📊 Server Statistiken',
              permission_view_channel: serverStatsSettings.permissions?.viewChannel ?? true,
              permission_connect: serverStatsSettings.permissions?.connect ?? false,
              permission_speak: serverStatsSettings.permissions?.speak ?? false,
              permission_use_vad: serverStatsSettings.permissions?.useVAD ?? false,
              design_emoji: serverStatsSettings.design?.emoji || '📊',
              design_color: serverStatsSettings.design?.color || '0x00FF7F',
              design_separator: serverStatsSettings.design?.separator || ' • ',
              design_format: serverStatsSettings.design?.format || 'modern',
              updated_at: new Date().toISOString()
            })
            .eq('guild_id', guildId);

          // Update Channels
          await supabase
            .from('server_stats_channels')
            .delete()
            .eq('guild_id', guildId);

          if (serverStatsSettings.channels) {
            const channelsToInsert = Object.entries(serverStatsSettings.channels).map(([channelType, config]) => ({
              guild_id: guildId,
              channel_type: channelType,
              channel_id: config.channelId || '',
              channel_name: config.name,
              enabled: config.enabled,
              position: config.position || 0
            }));

            await supabase
              .from('server_stats_channels')
              .insert(channelsToInsert);
          }

          console.log('✅ Server-Stats in Supabase normalisiert gespeichert');
          return true;
        } else {
          // Erstelle neue JSONB-Struktur
          const { error } = await supabase
            .from('server_stats_config')
            .insert({
              config: serverStatsSettings,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (!error) {
            console.log('✅ Server-Stats in Supabase JSONB erstellt');
            return true;
          }
        }
      }
    }

    // Fallback auf JSON
    fs.writeFileSync(STATS_SETTINGS_FILE, JSON.stringify(serverStatsSettings, null, 2));
    console.log('✅ Server-Stats in JSON gespeichert');
    return true;
  } catch (error) {
    console.error('🤔 Fehler beim Speichern der Server-Stats Einstellungen:', error);
    return false;
  }
}

// Initialisiere Server Stats System
async function initializeServerStats(discordClient) {
  client = discordClient;
  
  // Initialisiere Supabase
  initializeSupabase();
  
  // Lade Einstellungen nur wenn noch nicht geladen
  if (!settingsLoaded) {
    await loadServerStatsSettings();
  }
  
  // Lade alle Mitglieder für bessere Presence-Daten
  try {
    for (const guild of client.guilds.cache.values()) {
      await guild.members.fetch();
    }
  } catch (error) {
    console.error('🤔 Fehler beim Laden der Mitglieder:', error);
  }
  
  if (serverStatsSettings.enabled) {
    // TEMPORÄR DEAKTIVIERT: Kompletter Reset verursacht Performance-Probleme
    console.log('📊 Server-Stats System aktiviert (ohne automatischen Reset)');
    console.log('ℹ️ Verwende Dashboard für Channel-Management');
    
    // Starte nur den Updater, ohne Reset
    startStatsUpdater();
    console.log('✅ Server-Stats Updater gestartet');
  }
}

// Starte automatische Updates
function startStatsUpdater() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  // Setze die letzte Update-Zeit auf jetzt
  lastUpdateTime = Date.now();
  
  updateInterval = setInterval(async () => {
    lastUpdateTime = Date.now();
    await updateAllServerStats();
  }, serverStatsSettings.updateInterval);
  
  // ENTFERNT: Automatisches Update beim Start
  // Server-Stats Channels werden jetzt nur noch manuell über das Dashboard erstellt
  console.log('📊 Auto-Updater gestartet (ohne automatische Channel-Erstellung)');
}

// Stoppe automatische Updates
function stopStatsUpdater() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

// Erstelle Stats-Kategorie
async function createStatsCategory(guild) {
  try {
    const category = await guild.channels.create({
      name: serverStatsSettings.categoryName,
      type: ChannelType.GuildCategory,
      position: 0,
      permissionOverwrites: [
        {
          id: guild.id, // @everyone
          deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
          allow: serverStatsSettings.permissions.viewChannel ? [PermissionFlagsBits.ViewChannel] : []
        }
      ]
    });
    
    serverStatsSettings.categoryId = category.id;
    await saveServerStatsSettings();
    
    return category;
  } catch (error) {
    console.error('🤔 Fehler beim Erstellen der Stats-Kategorie:', error);
    return null;
  }
}

// Erstelle Stats-Channel
async function createStatsChannel(guild, statType, statConfig) {
  try {
    const category = guild.channels.cache.get(serverStatsSettings.categoryId);
    
    const channel = await guild.channels.create({
      name: statConfig.name,
      type: ChannelType.GuildVoice,
      parent: category,
      position: statConfig.position,
      permissionOverwrites: [
        {
          id: guild.id, // @everyone
          deny: [
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.UseVAD,
            PermissionFlagsBits.Stream
          ],
          allow: serverStatsSettings.permissions.viewChannel ? [PermissionFlagsBits.ViewChannel] : []
        }
      ]
    });
    
    serverStatsSettings.channels[statType].channelId = channel.id;
    saveServerStatsSettings();
    
    return channel;
  } catch (error) {
    console.error(`🤔 Fehler beim Erstellen des ${statType} Channels:`, error);
    return null;
  }
}

// Berechne Server-Statistiken
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
    console.error('🤔 Fehler beim Berechnen der Online-Nutzer:', error);
    // Fallback: 20% der Gesamtmitglieder als Schätzung
    onlineCount = Math.floor(guild.memberCount * 0.2);
  }
  
  const stats = {
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
    valorantSeason: calculateValorantCountdown()
  };
  
  return stats;
}

// Berechne Valorant Season Countdown
function calculateValorantCountdown() {
  // Valorant Season V25 Act 4 startet am 25. Juni 2025, 02:00-05:00 UTC (Europa)
  const nextActDate = new Date('2025-06-26T02:00:00.000Z'); // 26. Juni 2025, 02:00 UTC
  const now = new Date();
  
  const diffMs = nextActDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'LIVE!';
  }
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Formatiere Channel-Namen
function formatChannelName(template, value, statType) {
  let formatted = template.replace('{count}', value);
  formatted = formatted.replace('{date}', value);
  formatted = formatted.replace('{countdown}', value);
  
  // Spezielle Formatierung für verschiedene Stat-Typen
  switch (statType) {
    case 'serverLevel':
      const levelNames = ['Keine', 'Level 1', 'Level 2', 'Level 3'];
      formatted = formatted.replace('{count}', levelNames[value] || `Level ${value}`);
      break;
    case 'boostCount':
      formatted = formatted.replace('{count}', `${value}/14`);
      break;
    case 'valorantSeason':
      // Countdown wird bereits als String übergeben
      break;
  }
  
  return formatted;
}

// Update einzelnen Stats-Channel
async function updateStatsChannel(guild, statType, statValue) {
  try {
    const statConfig = serverStatsSettings.channels[statType];
    
    if (!statConfig.enabled) return;
    
    let channel = guild.channels.cache.get(statConfig.channelId);
    
    // GEÄNDERT: Keine automatische Channel-Erstellung mehr
    // Channels müssen manuell über das Dashboard erstellt werden
    if (!channel) {
      console.log(`🤔 Stats-Channel für ${statType} nicht gefunden (ID: ${statConfig.channelId}). Bitte über Dashboard erstellen.`);
      return;
    }
    
    const newName = formatChannelName(statConfig.name, statValue, statType);
    
    // Update nur wenn Name sich geändert hat
    if (channel.name !== newName) {
      await channel.setName(newName);
    }
    
  } catch (error) {
    console.error(`🤔 Fehler beim Aktualisieren des ${statType} Channels:`, error);
  }
}

// Update alle Server-Stats
async function updateAllServerStats() {
  if (!client || !client.guilds) return;
  
  try {
    // Aktualisiere die letzte Update-Zeit
    lastUpdateTime = Date.now();
    
    for (const guild of client.guilds.cache.values()) {
      // Aktualisiere Mitglieder-Cache alle 10 Minuten für bessere Presence-Daten
      const lastFetch = guild._lastMemberFetch || 0;
      const now = Date.now();
      if (now - lastFetch > 600000) { // 10 Minuten
        try {
          await guild.members.fetch();
          guild._lastMemberFetch = now;
        } catch (error) {
          console.error(`🤔 Fehler beim Aktualisieren der Mitglieder für ${guild.name}:`, error);
        }
      }
      
      const stats = calculateServerStats(guild);
      
      // Update jeden aktivierten Stats-Channel
      for (const [statType, statConfig] of Object.entries(serverStatsSettings.channels)) {
        if (statConfig.enabled && stats[statType] !== undefined) {
          await updateStatsChannel(guild, statType, stats[statType]);
          
          // Kleine Verzögerung zwischen Updates um Rate-Limits zu vermeiden
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  } catch (error) {
    console.error('🤔 Fehler beim Aktualisieren der Server-Stats:', error);
  }
}

// Lösche Stats-Channel
async function deleteStatsChannel(guild, statType) {
  try {
    const channelId = serverStatsSettings.channels[statType].channelId;
    const channel = guild.channels.cache.get(channelId);
    
    if (channel) {
      await channel.delete();
      console.log(`🗑️ Stats-Channel gelöscht: ${statType}`);
    }
    
    serverStatsSettings.channels[statType].channelId = '';
    saveServerStatsSettings();
    
  } catch (error) {
    console.error(`🤔 Fehler beim Löschen des ${statType} Channels:`, error);
  }
}

// Lösche alle Stats-Channels
async function deleteAllStatsChannels(guild) {
  try {
    for (const statType of Object.keys(serverStatsSettings.channels)) {
      await deleteStatsChannel(guild, statType);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Lösche auch die Kategorie
    if (serverStatsSettings.categoryId) {
      const category = guild.channels.cache.get(serverStatsSettings.categoryId);
      if (category) {
        await category.delete();
        console.log('🗑️ Stats-Kategorie gelöscht');
      }
      serverStatsSettings.categoryId = '';
      saveServerStatsSettings();
    }
    
  } catch (error) {
    console.error('🤔 Fehler beim Löschen aller Stats-Channels:', error);
  }
}

// Validiere und repariere Stats-Channels beim Bot-Start
async function validateAndRepairStatsChannels() {
  if (!client || !client.guilds) return;
  
  try {
    for (const guild of client.guilds.cache.values()) {
      console.log(`🚀 Validiere Server-Stats Channels für ${guild.name}...`);
      
      let channelsRepaired = 0;
      let channelsValid = 0;
      let duplicatesRemoved = 0;
      
      // Erst alle doppelten Stats-Kategorien und Channels löschen
      const allCategories = guild.channels.cache.filter(ch => 
        ch.type === ChannelType.GuildCategory && 
        (ch.name.includes('Server Statistiken') || 
         ch.name.includes('📊') ||
         ch.name.toLowerCase().includes('statistik'))
      );
      
      if (allCategories.size > 1) {
        console.log(`🤔 ${allCategories.size} doppelte Stats-Kategorien gefunden, lösche alte...`);
        
        // Sortiere nach Erstellungsdatum (älteste zuerst)
        const sortedCategories = allCategories.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        
        // Behalte nur die neueste Kategorie
        for (let i = 0; i < sortedCategories.size - 1; i++) {
          const oldCategory = sortedCategories.at(i);
          
          // Lösche alle Channels in der alten Kategorie
          const channelsInCategory = guild.channels.cache.filter(ch => ch.parentId === oldCategory.id);
          for (const [_, channel] of channelsInCategory) {
            try {
              await channel.delete();
              duplicatesRemoved++;
              console.log(`🗑️ Doppelten Channel gelöscht: ${channel.name}`);
            } catch (error) {
              console.error(`🤔 Fehler beim Löschen von ${channel.name}:`, error);
            }
          }
          
          // Lösche die alte Kategorie
          try {
            await oldCategory.delete();
            duplicatesRemoved++;
            console.log(`🗑️ Alte Stats-Kategorie gelöscht: ${oldCategory.name}`);
          } catch (error) {
            console.error(`🤔 Fehler beim Löschen der Kategorie:`, error);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Aktualisiere die Category-ID auf die neueste
        const newestCategory = sortedCategories.at(-1);
        serverStatsSettings.categoryId = newestCategory.id;
        saveServerStatsSettings();
      }
      
      // Prüfe Kategorie
      if (serverStatsSettings.categoryId) {
        const category = guild.channels.cache.get(serverStatsSettings.categoryId);
        if (!category) {
          console.log(`🤔 Stats-Kategorie nicht gefunden, erstelle neue...`);
          await createStatsCategory(guild);
          channelsRepaired++;
        } else {
          channelsValid++;
        }
      } else if (Object.values(serverStatsSettings.channels).some(ch => ch.enabled)) {
        // Erstelle Kategorie wenn aktivierte Channels vorhanden sind
        console.log(`🚀 Erstelle Stats-Kategorie...`);
        await createStatsCategory(guild);
        channelsRepaired++;
      }
      
      // Prüfe jeden aktivierten Channel
      for (const [statType, statConfig] of Object.entries(serverStatsSettings.channels)) {
        if (statConfig.enabled) {
          if (statConfig.channelId) {
            const channel = guild.channels.cache.get(statConfig.channelId);
            if (!channel) {
              console.log(`🤔 Stats-Channel ${statType} nicht gefunden (ID: ${statConfig.channelId}), erstelle neu...`);
              await createStatsChannel(guild, statType, statConfig);
              channelsRepaired++;
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              channelsValid++;
              console.log(`✅ Stats-Channel ${statType} ist gültig: ${channel.name}`);
            }
          } else {
            console.log(`📊 Erstelle fehlenden Stats-Channel: ${statType}`);
            await createStatsChannel(guild, statType, statConfig);
            channelsRepaired++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (duplicatesRemoved > 0) {
        console.log(`🗑️ ${duplicatesRemoved} doppelte Channels/Kategorien entfernt`);
      }
      
      if (channelsRepaired > 0) {
        console.log(`✅ ${channelsRepaired} Stats-Channels repariert, ${channelsValid} waren bereits vorhanden`);
        // Sofortiges Update nach Reparatur
        await updateAllServerStats();
      } else if (channelsValid > 0) {
        console.log(`✅ Alle ${channelsValid} Stats-Channels sind gültig`);
      } else {
        console.log(`🤔 Keine aktiven Stats-Channels konfiguriert`);
      }
    }
  } catch (error) {
    console.error('🤔 Fehler bei der Channel-Validierung:', error);
  }
}

// Erstelle alle Stats-Channels
async function createAllStatsChannels(guild) {
  try {
    // Erstelle Kategorie
    if (!serverStatsSettings.categoryId || !guild.channels.cache.get(serverStatsSettings.categoryId)) {
      await createStatsCategory(guild);
    }
    
    // Erstelle alle aktivierten Channels
    for (const [statType, statConfig] of Object.entries(serverStatsSettings.channels)) {
      if (statConfig.enabled) {
        await createStatsChannel(guild, statType, statConfig);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Sofortiges Update
    await updateAllServerStats();
    
  } catch (error) {
    console.error('🤔 Fehler beim Erstellen aller Stats-Channels:', error);
  }
}

// Kompletter Reset aller Stats-Channels (RADIKALE LÖSUNG)
async function completeStatsChannelReset(guild) {
  try {
    console.log(`🚀 Kompletter Stats-Channel Reset für ${guild.name}...`);
    
    let deletedCount = 0;
    
    // SCHRITT 1: Lösche ALLE Stats-Kategorien (egal wie sie heißen)
    const allStatsCategories = guild.channels.cache.filter(ch => 
      ch.type === ChannelType.GuildCategory && 
      (ch.name.includes('Server Statistiken') || 
       ch.name.includes('📊') ||
       ch.name.toLowerCase().includes('statistik') ||
       ch.name.toLowerCase().includes('stats'))
    );
    
    console.log(`🗑️ Lösche ${allStatsCategories.size} Stats-Kategorien...`);
    
    for (const [_, category] of allStatsCategories) {
      // Lösche alle Channels in der Kategorie
      const channelsInCategory = guild.channels.cache.filter(ch => ch.parentId === category.id);
      for (const [_, channel] of channelsInCategory) {
        try {
          await channel.delete();
          deletedCount++;
          console.log(`🗑️ Channel gelöscht: ${channel.name}`);
        } catch (error) {
          console.error(`🤔 Fehler beim Löschen von ${channel.name}:`, error);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Lösche die Kategorie
      try {
        await category.delete();
        deletedCount++;
        console.log(`��️ Kategorie gelöscht: ${category.name}`);
      } catch (error) {
        console.error(`🤔 Fehler beim Löschen der Kategorie:`, error);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // SCHRITT 2: Lösche alle verwaisten Stats-Channels (außerhalb von Kategorien)
    const statsChannelPatterns = ['👥 Mitglieder:', '🟢 Online:', '🚀 Boosts:', '📺 Kanäle:', '🎭 Rollen:', '⭐ Level:', '📅 Erstellt:', '🤖 Bots:'];
    
    for (const pattern of statsChannelPatterns) {
      const matchingChannels = guild.channels.cache.filter(ch => 
        ch.type === ChannelType.GuildVoice && 
        ch.name.includes(pattern)
      );
      
      for (const [_, channel] of matchingChannels) {
        try {
          await channel.delete();
          deletedCount++;
          console.log(`🗑️ Verwaister Stats-Channel gelöscht: ${channel.name}`);
        } catch (error) {
          console.error(`🤔 Fehler beim Löschen von ${channel.name}:`, error);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`🗑️ ${deletedCount} Channels/Kategorien gelöscht`);
    
    // SCHRITT 3: Setze alle Channel-IDs zurück
    for (const [statType, statConfig] of Object.entries(serverStatsSettings.channels)) {
      statConfig.channelId = '';
    }
    serverStatsSettings.categoryId = '';
    saveServerStatsSettings();
    
    console.log(`🚀 Channel-IDs zurückgesetzt`);
    
    // SCHRITT 4: Warte 2 Sekunden und erstelle dann alles neu
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // SCHRITT 5: Erstelle alles komplett neu
    console.log(`🚀 Erstelle Stats-Channels komplett neu...`);
    await createAllStatsChannels(guild);
    
    console.log(`✅ Kompletter Stats-Channel Reset abgeschlossen`);
    return deletedCount;
    
  } catch (error) {
    console.error('🤔 Fehler beim kompletten Stats-Channel Reset:', error);
    return 0;
  }
}

// Bereinige alle doppelten Stats-Channels
async function cleanupDuplicateStatsChannels(guild) {
  try {
    console.log(`🗑️ Bereinige doppelte Stats-Channels für ${guild.name}...`);
    
    let duplicatesRemoved = 0;
    
    // Finde ALLE Stats-Kategorien (verschiedene Varianten)
    const allCategories = guild.channels.cache.filter(ch => 
      ch.type === ChannelType.GuildCategory && 
      (ch.name.includes('Server Statistiken') || 
       ch.name.includes('📊') ||
       ch.name.toLowerCase().includes('statistik') ||
       ch.name.toLowerCase().includes('stats'))
    );
    
    console.log(`🤔 Gefundene Kategorien: ${allCategories.map(c => `"${c.name}" (ID: ${c.id})`).join(', ')}`);
    
    if (allCategories.size > 1) {
      console.log(`🤔 ${allCategories.size} Stats-Kategorien gefunden, behalte nur die neueste...`);
      
      // Sortiere nach Erstellungsdatum (älteste zuerst)
      const sortedCategories = allCategories.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
      
      // Lösche alle außer der neuesten
      for (let i = 0; i < sortedCategories.size - 1; i++) {
        const oldCategory = sortedCategories.at(i);
        console.log(`🗑️ Lösche alte Kategorie: "${oldCategory.name}" (ID: ${oldCategory.id})`);
        
        // Lösche alle Channels in der alten Kategorie
        const channelsInCategory = guild.channels.cache.filter(ch => ch.parentId === oldCategory.id);
        console.log(`🤔 Channels in alter Kategorie: ${channelsInCategory.size}`);
        
        for (const [_, channel] of channelsInCategory) {
          try {
            console.log(`🗑️ Lösche Channel: "${channel.name}" (ID: ${channel.id})`);
            await channel.delete();
            duplicatesRemoved++;
          } catch (error) {
            console.error(`🤔 Fehler beim Löschen von ${channel.name}:`, error);
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Lösche die alte Kategorie
        try {
          await oldCategory.delete();
          duplicatesRemoved++;
          console.log(`✅ Alte Stats-Kategorie gelöscht: ${oldCategory.name}`);
        } catch (error) {
          console.error(`🤔 Fehler beim Löschen der Kategorie:`, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Aktualisiere die Category-ID auf die neueste
      const newestCategory = sortedCategories.at(-1);
      console.log(`✅ Behalte neueste Kategorie: "${newestCategory.name}" (ID: ${newestCategory.id})`);
      serverStatsSettings.categoryId = newestCategory.id;
      saveServerStatsSettings();
    }
    
    // Finde auch doppelte Stats-Channels außerhalb von Kategorien oder in verschiedenen Kategorien
    const statsChannelPatterns = ['👥 Mitglieder:', '🟢 Online:', '🚀 Boosts:', '📺 Kanäle:', '🎭 Rollen:', '⭐ Level:', '📅 Erstellt:', '🤖 Bots:'];
    
    for (const pattern of statsChannelPatterns) {
      const matchingChannels = guild.channels.cache.filter(ch => 
        ch.type === ChannelType.GuildVoice && 
        ch.name.includes(pattern)
      );
      
      if (matchingChannels.size > 1) {
        console.log(`🤔 ${matchingChannels.size} doppelte "${pattern}" Channels gefunden:`);
        matchingChannels.forEach(ch => console.log(`   - "${ch.name}" (ID: ${ch.id}, Kategorie: ${ch.parent?.name || 'Keine'})`));
        
        // Sortiere nach Erstellungsdatum und behalte nur den neuesten
        const sortedChannels = matchingChannels.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        
        for (let i = 0; i < sortedChannels.size - 1; i++) {
          const oldChannel = sortedChannels.at(i);
          try {
            console.log(`🗑️ Lösche doppelten Channel: "${oldChannel.name}" (ID: ${oldChannel.id})`);
            await oldChannel.delete();
            duplicatesRemoved++;
          } catch (error) {
            console.error(`🤔 Fehler beim Löschen von ${oldChannel.name}:`, error);
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Behalte den neuesten
        const newestChannel = sortedChannels.at(-1);
        console.log(`✅ Behalte neuesten Channel: "${newestChannel.name}" (ID: ${newestChannel.id})`);
      }
    }
    
    console.log(`✅ Bereinigung abgeschlossen: ${duplicatesRemoved} doppelte Channels/Kategorien entfernt`);
    return duplicatesRemoved;
    
  } catch (error) {
    console.error('🤔 Fehler bei der Bereinigung doppelter Channels:', error);
    return 0;
  }
}

// Hole aktuellen Timer-Status
function getTimerStatus() {
  if (!serverStatsSettings.enabled || !lastUpdateTime) {
    return {
      enabled: false,
      lastUpdateTime: null,
      nextUpdateTime: null,
      timeRemaining: 0,
      totalInterval: serverStatsSettings.updateInterval || 300000,
      progress: 0
    };
  }
  
  const now = Date.now();
  const timeSinceLastUpdate = now - lastUpdateTime;
  const timeRemaining = Math.max(0, serverStatsSettings.updateInterval - timeSinceLastUpdate);
  const progress = Math.min(100, (timeSinceLastUpdate / serverStatsSettings.updateInterval) * 100);
  
  return {
    enabled: true,
    lastUpdateTime: lastUpdateTime,
    nextUpdateTime: lastUpdateTime + serverStatsSettings.updateInterval,
    timeRemaining: timeRemaining,
    totalInterval: serverStatsSettings.updateInterval,
    progress: progress,
    currentTime: now
  };
}

// ============================
// EXPRESS.JS ROUTES
// ============================

const express = require('express');
const router = express.Router();

// GET /api/server-stats - Lade Konfiguration (Single-Server)
router.get('/api/server-stats', async (req, res) => {
  try {
    await loadServerStatsSettings();
    
    res.json({
      success: true,
      settings: serverStatsSettings,
      _source: supabase ? 'supabase-hybrid' : 'json-file'
    });
  } catch (error) {
    console.error('🤔 Fehler beim Laden der Server-Stats:', error);
    res.status(500).json({ error: 'Serverfehler beim Laden der Konfiguration' });
  }
});

// POST /api/server-stats - Speichere Konfiguration (Single-Server)
router.post('/api/server-stats', async (req, res) => {
  try {
    const newSettings = req.body;
    
    // Aktualisiere globale Settings
    serverStatsSettings = newSettings;
    
    // Speichere in Supabase/JSON
    const success = await saveServerStatsSettings();
    
    if (!success) {
      return res.status(500).json({ error: 'Fehler beim Speichern der Konfiguration' });
    }
    
    // Neustart des Updaters mit neuen Einstellungen
    if (newSettings.enabled) {
      startStatsUpdater();
    } else {
      stopStatsUpdater();
    }
    
    res.json({ 
      success: true, 
      message: 'Konfiguration erfolgreich gespeichert',
      settings: serverStatsSettings,
      _source: supabase ? 'supabase-hybrid' : 'json-file'
    });
  } catch (error) {
    console.error('🤔 Fehler beim Speichern der Konfiguration:', error);
    res.status(500).json({ error: 'Serverfehler beim Speichern der Konfiguration' });
  }
});

// GET /api/server-stats/current - Lade aktuelle Stats (Single-Server)
router.get('/api/server-stats/current', async (req, res) => {
  try {
    if (!client || !client.guilds) {
      return res.json({
        success: true,
        stats: {
          memberCount: 0,
          onlineCount: 0,
          boostCount: 0,
          channelCount: 0,
          roleCount: 0,
          serverLevel: 0,
          createdDate: new Date().toLocaleDateString('de-DE'),
          botCount: 0
        },
        lastUpdated: new Date().toISOString(),
        _source: supabase ? 'supabase-hybrid' : 'json-file',
        _note: 'Discord Client nicht verfügbar'
      });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(404).json({ error: 'Kein Server gefunden' });
    }
    
    const stats = calculateServerStats(guild);
    
    res.json({
      success: true,
      guildId: guild.id,
      guildName: guild.name,
      stats: {
        memberCount: stats.memberCount || 0,
        onlineCount: stats.onlineCount || 0,
        boostCount: stats.boostCount || 0,
        channelCount: stats.channelCount || 0,
        roleCount: stats.roleCount || 0,
        serverLevel: stats.serverLevel || 0,
        createdDate: stats.createdDate || new Date().toLocaleDateString('de-DE'),
        botCount: stats.botCount || 0
      },
      serverIcon: guild.iconURL({ dynamic: true }),
      lastUpdated: new Date().toISOString(),
      _source: supabase ? 'supabase-hybrid' : 'json-file'
    });
  } catch (error) {
    console.error('🤔 Fehler beim Laden der aktuellen Stats:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Stats' });
  }
});

// GET /api/server-stats/timer-status - Lade Timer Status
router.get('/api/server-stats/timer-status', (req, res) => {
  try {
    // Fallback falls Discord Client nicht verfügbar ist
    if (!client || !client.guilds) {
      return res.json({
        success: true,
        enabled: false,
        lastUpdateTime: null,
        nextUpdateTime: null,
        timeRemaining: 0,
        totalInterval: 300000,
        progress: 0,
        currentTime: Date.now(),
        _source: supabase ? 'supabase-hybrid' : 'json-file',
        _note: 'Discord Client nicht verfügbar'
      });
    }

    const timerStatus = getTimerStatus();
    res.json({
      success: true,
      ...timerStatus,
      _source: supabase ? 'supabase-hybrid' : 'json-file'
    });
  } catch (error) {
    console.error('🤔 Fehler beim Laden des Timer Status:', error);
    res.status(500).json({ error: 'Serverfehler beim Laden des Timer Status' });
  }
});

// POST /api/server-stats/update-now - Manuelles Update
router.post('/api/server-stats/update-now', async (req, res) => {
  try {
    console.log('🚀 Starte manuelles Server-Stats Update...');
    await updateAllServerStats();
    res.json({ 
      success: true, 
      message: 'Server-Stats erfolgreich aktualisiert!',
      timestamp: new Date().toISOString(),
      _source: supabase ? 'supabase-hybrid' : 'json-file'
    });
  } catch (error) {
    console.error('🤔 Fehler beim manuellen Update:', error);
    res.status(500).json({ error: 'Serverfehler beim manuellen Update' });
  }
});

// POST /api/server-stats/create-channels - Erstelle alle Channels
router.post('/api/server-stats/create-channels', async (req, res) => {
  try {
    if (!client || !client.guilds) {
      return res.status(500).json({ error: 'Discord Client nicht verfügbar' });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({ error: 'Kein Server gefunden' });
    }
    
    await createAllStatsChannels(guild);
    res.json({ success: true, message: 'Alle Stats-Channels erfolgreich erstellt!' });
  } catch (error) {
    console.error('🤔 Fehler beim Erstellen der Stats-Channels:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Channels' });
  }
});

// DELETE /api/server-stats/delete-channels - Lösche alle Channels
router.delete('/api/server-stats/delete-channels', async (req, res) => {
  try {
    if (!client || !client.guilds) {
      return res.status(500).json({ error: 'Discord Client nicht verfügbar' });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({ error: 'Kein Server gefunden' });
    }
    
    await deleteAllStatsChannels(guild);
    res.json({ success: true, message: 'Alle Stats-Channels erfolgreich gelöscht!' });
  } catch (error) {
    console.error('🤔 Fehler beim Löschen der Stats-Channels:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Channels' });
  }
});

// POST /api/server-stats/validate-channels - Validiere und repariere Channels
router.post('/api/server-stats/validate-channels', async (req, res) => {
  try {
    await validateAndRepairStatsChannels();
    res.json({ success: true, message: 'Stats-Channels validiert und repariert!' });
  } catch (error) {
    console.error('🤔 Fehler bei der Channel-Validierung:', error);
    res.status(500).json({ error: 'Fehler bei der Channel-Validierung' });
  }
});

// POST /api/server-stats/cleanup-duplicates - Bereinige doppelte Channels
router.post('/api/server-stats/cleanup-duplicates', async (req, res) => {
  try {
    if (!client || !client.guilds) {
      return res.status(500).json({ error: 'Discord Client nicht verfügbar' });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({ error: 'Kein Server gefunden' });
    }
    
    const removedCount = await cleanupDuplicateStatsChannels(guild);
    res.json({ 
      success: true, 
      message: `${removedCount} doppelte Channels/Kategorien bereinigt!`,
      removedCount 
    });
  } catch (error) {
    console.error('🤔 Fehler bei der Bereinigung:', error);
    res.status(500).json({ error: 'Fehler bei der Bereinigung' });
  }
});

// POST /api/server-stats/complete-reset - Kompletter Reset
router.post('/api/server-stats/complete-reset', async (req, res) => {
  try {
    if (!client || !client.guilds) {
      return res.status(500).json({ error: 'Discord Client nicht verfügbar' });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({ error: 'Kein Server gefunden' });
    }
    
    const resetCount = await completeStatsChannelReset(guild);
    res.json({ 
      success: true, 
      message: `Kompletter Reset durchgeführt! ${resetCount} Channels/Kategorien zurückgesetzt.`,
      resetCount 
    });
  } catch (error) {
    console.error('🤔 Fehler beim kompletten Reset:', error);
    res.status(500).json({ error: 'Fehler beim kompletten Reset' });
  }
});

// POST /api/server-stats/test-channel/:statType - Teste einzelnen Channel
router.post('/api/server-stats/test-channel/:statType', async (req, res) => {
  try {
    const { statType } = req.params;
    
    if (!client || !client.guilds) {
      return res.status(500).json({ error: 'Discord Client nicht verfügbar' });
    }
    
    const guild = client.guilds.cache.first();
    if (!guild) {
      return res.status(500).json({ error: 'Kein Server gefunden' });
    }
    
    const stats = calculateServerStats(guild);
    const statValue = stats[statType];
    
    if (statValue === undefined) {
      return res.status(400).json({ error: 'Unbekannter Stat-Typ' });
    }
    
    // Teste Channel-Update
    await updateStatsChannel(guild, statType, statValue);
    
    res.json({ 
      success: true, 
      message: `${statType} Channel erfolgreich getestet!`,
      value: statValue 
    });
  } catch (error) {
    console.error(`🤔 Fehler beim Testen des ${req.params.statType} Channels:`, error);
    res.status(500).json({ error: 'Fehler beim Testen des Channels' });
  }
});

module.exports = {
  initializeServerStats,
  loadServerStatsSettings,
  saveServerStatsSettings,
  updateAllServerStats,
  createAllStatsChannels,
  deleteAllStatsChannels,
  deleteStatsChannel,
  startStatsUpdater,
  stopStatsUpdater,
  validateAndRepairStatsChannels,
  cleanupDuplicateStatsChannels,
  completeStatsChannelReset,
  getTimerStatus,
  serverStatsSettings,
  calculateServerStats,
  // Express Router für API-Endpunkte
  router
}; 
