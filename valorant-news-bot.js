// Valorant News Bot für Discord (deutsch, Embed, keine Dopplungen)
// Läuft als eigenständiges Script (node valorant-news-bot.js)

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// ENV: Discord Token, Supabase, Henrik API-Key
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const HENRIK_API_KEY = process.env.HENRIK_API_KEY;

const GUILD_ID = process.env.GUILD_ID || '1325050102477488169'; // ggf. anpassen
const CHANNEL_NAME = '📢ankündigungen';
const COUNTRY_CODE = 'de-de';
const NEWS_API = `https://api.henrikdev.xyz/valorant/v1/website/${COUNTRY_CODE}`;

if (!DISCORD_TOKEN || !SUPABASE_URL || !SUPABASE_KEY || !HENRIK_API_KEY) {
  console.error('❌ Fehlende Umgebungsvariablen!');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchNews() {
  const res = await fetch(NEWS_API, {
    headers: { 'Authorization': HENRIK_API_KEY }
  });
  if (!res.ok) throw new Error('Fehler beim Abrufen der News');
  const data = await res.json();
  return data.data || [];
}

async function getPostedNewsIds() {
  const { data, error } = await supabase
    .from('valorant_news_posts')
    .select('news_id')
    .eq('guild_id', GUILD_ID);
  if (error) {
    console.error('❌ Supabase-Fehler:', error);
    return [];
  }
  return data.map(row => row.news_id);
}

async function savePostedNews(news, channelId) {
  const { error } = await supabase.from('valorant_news_posts').insert({
    news_id: news.id || news.slug || news.title,
    title: news.title,
    url: news.url,
    guild_id: GUILD_ID,
    channel_id: channelId
  });
  if (error) console.error('❌ Fehler beim Speichern in Supabase:', error);
}

function buildNewsEmbed(news) {
  return new EmbedBuilder()
    .setTitle(news.title)
    .setURL(news.url)
    .setDescription(news.description?.slice(0, 300) || 'Valorant News')
    .setImage(news.banner_url || news.banner || null)
    .setTimestamp(new Date(news.date || Date.now()))
    .setColor(0xE74C3C)
    .setFooter({ text: 'VALORANT News • AgentBee' });
}

async function postNewNews() {
  try {
    const newsList = await fetchNews();
    const postedIds = await getPostedNewsIds();
    const guild = await client.guilds.fetch(GUILD_ID);
    const channel = guild.channels.cache.find(c => c.name === CHANNEL_NAME || c.name.replace(/[^a-zA-Z]/g, '') === 'ankündigungen');
    if (!channel) {
      console.error('❌ Channel nicht gefunden:', CHANNEL_NAME);
      return;
    }
    let newCount = 0;
    for (const news of newsList) {
      const newsId = news.id || news.slug || news.title;
      if (!postedIds.includes(newsId)) {
        const embed = buildNewsEmbed(news);
        await channel.send({ embeds: [embed] });
        await savePostedNews(news, channel.id);
        console.log('✅ Neue News gepostet:', news.title);
        newCount++;
      }
    }
    if (newCount === 0) {
      console.log('ℹ️ Keine neuen News zum Posten.');
    }
  } catch (err) {
    console.error('❌ Fehler beim News-Post:', err);
  }
}

// Exportiere Funktionen für API-Integration
module.exports = {
  postNewNews,
  client
};

// Starte Bot nur, wenn direkt ausgeführt (nicht beim Import für API)
if (require.main === module) {
  client.once('ready', () => {
    console.log(`🤖 Valorant News Bot online als ${client.user.tag}`);
    // Initial sofort prüfen
    postNewNews();
    // Dann alle 60 Minuten
    setInterval(postNewNews, 60 * 60 * 1000);
  });

  client.login(DISCORD_TOKEN);
} 