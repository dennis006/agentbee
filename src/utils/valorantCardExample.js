const { makeValorantCard } = require('./valorantCard');
const { AttachmentBuilder } = require('discord.js');

/**
 * Beispiel-Integration für Discord.js
 * Zeigt, wie die Valorant-Karte in Discord-Befehlen verwendet werden kann
 */

/**
 * Erstellt eine Valorant-Karte und sendet sie als Discord-Attachment
 * @param {Object} interaction - Discord Interaction
 * @param {Object} playerStats - Spieler-Statistiken
 */
async function sendValorantCard(interaction, playerStats) {
  try {
    // Lade-Nachricht senden
    await interaction.deferReply();
    
    // Valorant-Karte erstellen
    const cardBuffer = await makeValorantCard(playerStats);
    
    // Discord-Attachment erstellen
    const attachment = new AttachmentBuilder(cardBuffer, { 
      name: `valorant-stats-${playerStats.name}-${playerStats.tag}.png` 
    });
    
    // Karte senden
    await interaction.editReply({
      content: `🎯 **Valorant-Statistiken für ${playerStats.name}#${playerStats.tag}**`,
      files: [attachment]
    });
    
  } catch (error) {
    console.error('Fehler beim Senden der Valorant-Karte:', error);
    
    await interaction.editReply({
      content: '❌ Fehler beim Erstellen der Statistik-Karte. Bitte versuche es später erneut.',
      ephemeral: true
    });
  }
}

/**
 * Beispiel-Slash-Command Handler
 * @param {Object} interaction 
 */
async function handleValorantStatsCommand(interaction) {
  const playerName = interaction.options.getString('name');
  const playerTag = interaction.options.getString('tag');
  
  // Hier würdest du normalerweise die echten Statistiken von der Valorant-API abrufen
  // Für dieses Beispiel verwenden wir Mock-Daten
  const mockStats = {
    name: playerName,
    tag: playerTag,
    level: Math.floor(Math.random() * 100) + 1,
    currentRank: ['Iron 1', 'Bronze 2', 'Silver 3', 'Gold 1', 'Platinum 2'][Math.floor(Math.random() * 5)],
    rr: Math.floor(Math.random() * 100),
    peakRank: 'Diamond 1',
    kills: Math.floor(Math.random() * 30) + 10,
    deaths: Math.floor(Math.random() * 20) + 5,
    assists: Math.floor(Math.random() * 15) + 3,
    adr: Math.floor(Math.random() * 100) + 120,
    hsRate: Math.floor(Math.random() * 40) + 15,
    agentIconUrl: 'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png'
  };
  
  await sendValorantCard(interaction, mockStats);
}

/**
 * Beispiel für die Integration in den Hauptbot
 * Diese Funktion zeigt, wie du die Karte in deinen bestehenden Bot integrieren kannst
 */
function integrateValorantCard(client) {
  // Slash-Command registrieren
  const command = {
    name: 'valorant-stats',
    description: 'Zeigt Valorant-Statistiken als schöne Karte an',
    options: [
      {
        name: 'name',
        description: 'Valorant-Spielername',
        type: 3, // STRING
        required: true
      },
      {
        name: 'tag',
        description: 'Valorant-Tag (ohne #)',
        type: 3, // STRING
        required: true
      }
    ]
  };
  
  // Command Handler
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'valorant-stats') {
      await handleValorantStatsCommand(interaction);
    }
  });
  
  console.log('✅ Valorant-Karten-Integration aktiviert!');
  return command;
}

/**
 * Beispiel für die Verwendung in bestehenden Valorant-Funktionen
 * @param {Object} playerData - Daten von der Valorant-API
 * @returns {Buffer} - Bild-Buffer
 */
async function createCardFromApiData(playerData) {
  // Konvertiere API-Daten in das erwartete Format
  const stats = {
    name: playerData.account?.name || 'Unknown',
    tag: playerData.account?.tag || '0000',
    level: playerData.account?.level || 1,
    currentRank: playerData.current?.tier?.name || 'Unranked',
    rr: playerData.current?.rr || 0,
    peakRank: playerData.peak?.tier?.name || 'Unranked',
    kills: playerData.stats?.kills || 0,
    deaths: playerData.stats?.deaths || 0,
    assists: playerData.stats?.assists || 0,
    adr: playerData.stats?.adr || 0,
    hsRate: playerData.stats?.headshot_rate || 0,
    agentIconUrl: playerData.stats?.most_played_agent?.icon || null
  };
  
  return await makeValorantCard(stats);
}

module.exports = {
  sendValorantCard,
  handleValorantStatsCommand,
  integrateValorantCard,
  createCardFromApiData
}; 