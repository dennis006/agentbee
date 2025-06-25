const { EmbedBuilder } = require('discord.js');

class ValorantNewsSystem {
    constructor(client) {
        this.client = client;
        this.supabaseClient = null;
        this.henrikApiKey = process.env.HENRIK_API_KEY;
        this.newsChannelName = '📢ankündigungen';
        this.lastCheckTime = 0;
        this.checkInterval = 30 * 60 * 1000; // 30 Minuten
    }

    // Supabase initialisieren
    initializeSupabase(supabaseClient) {
        this.supabaseClient = supabaseClient;
        console.log('📰 Valorant News System: Supabase initialisiert');
    }

    // Valorant News von Henrik API abrufen
    async fetchValorantNews() {
        try {
            console.log('📰 Lade Valorant News von AgentBee...');
            
            const response = await fetch('https://api.henrikdev.xyz/valorant/v1/website/de-de', {
                headers: {
                    'Authorization': this.henrikApiKey,
                    'User-Agent': 'Discord Bot - AgentBee'
                }
            });

            if (!response.ok) {
                console.error('❌ Henrik API Fehler:', response.status, response.statusText);
                return null;
            }

            const data = await response.json();
            console.log(`✅ ${data.data?.length || 0} Valorant News Artikel geladen`);
            
            return data.data || [];
        } catch (error) {
            console.error('❌ Fehler beim Laden der Valorant News:', error);
            return null;
        }
    }

    // News in Supabase speichern
    async saveNewsToSupabase(articles) {
        if (!this.supabaseClient || !articles?.length) return false;

        try {
            console.log(`💾 Speichere ${articles.length} News Artikel in Supabase...`);

            const newsData = articles.map(article => ({
                news_id: article.id || this.generateNewsId(article),
                title: article.title,
                description: article.description || '',
                date: new Date(article.date).toISOString(),
                category: article.category || 'General',
                url: article.url || '',
                banner_url: article.banner_url || article.image || '',
                author: article.author || 'Riot Games',
                tags: JSON.stringify(article.tags || []),
                created_at: new Date().toISOString(),
                posted_to_discord: false
            }));

            const { data, error } = await this.supabaseClient
                .from('valorant_news')
                .upsert(newsData, { onConflict: 'news_id' })
                .select();

            if (error) {
                console.error('❌ Supabase News Speicher-Fehler:', error);
                return false;
            }

            console.log(`✅ ${data?.length || 0} News Artikel in Supabase gespeichert`);
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Speichern der News:', error);
            return false;
        }
    }

    // News ID generieren falls nicht vorhanden
    generateNewsId(article) {
        const titleHash = this.simpleHash(article.title);
        const dateHash = this.simpleHash(article.date.toString());
        return `valorant_${titleHash}_${dateHash}`;
    }

    // Einfache Hash-Funktion
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    // Neue News aus Supabase laden die noch nicht gepostet wurden
    async getUnpostedNews() {
        if (!this.supabaseClient) return [];

        try {
            const { data, error } = await this.supabaseClient
                .from('valorant_news')
                .select('*')
                .eq('posted_to_discord', false)
                .order('date', { ascending: false })
                .limit(10);

            if (error) {
                console.error('❌ Fehler beim Laden ungeposteter News:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('❌ Fehler beim Laden der News aus Supabase:', error);
            return [];
        }
    }

    // News als gepostet markieren
    async markNewsAsPosted(newsId) {
        if (!this.supabaseClient) return false;

        try {
            const { error } = await this.supabaseClient
                .from('valorant_news')
                .update({ 
                    posted_to_discord: true,
                    posted_at: new Date().toISOString()
                })
                .eq('news_id', newsId);

            if (error) {
                console.error('❌ Fehler beim Markieren der News als gepostet:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('❌ Fehler beim Markieren der News:', error);
            return false;
        }
    }

    // News Embed erstellen
    createNewsEmbed(article) {
        const embed = new EmbedBuilder()
            .setTitle(article.title)
            .setColor(0xFF4654) // Valorant Rot
            .setTimestamp(new Date(article.date))
            .setFooter({ 
                text: 'Valorant News • Powered by AgentBee',
                iconURL: 'https://media.valorant-api.com/logo/v_color.png'
            });

        // Beschreibung hinzufügen (gekürzt für Discord)
        if (article.description) {
            const description = article.description.length > 2000 
                ? article.description.substring(0, 1997) + '...'
                : article.description;
            embed.setDescription(description);
        }

        // Banner/Bild hinzufügen
        if (article.banner_url) {
            embed.setImage(article.banner_url);
        }

        // Autor hinzufügen
        if (article.author) {
            embed.setAuthor({ 
                name: article.author,
                iconURL: 'https://media.valorant-api.com/logo/v_color.png'
            });
        }

        // Kategorie als Feld hinzufügen
        if (article.category) {
            embed.addFields({
                name: '📂 Kategorie',
                value: article.category,
                inline: true
            });
        }

        // Tags hinzufügen
        if (article.tags && Array.isArray(article.tags) && article.tags.length > 0) {
            embed.addFields({
                name: '🏷️ Tags',
                value: article.tags.slice(0, 5).join(', '),
                inline: true
            });
        }

        // URL hinzufügen
        if (article.url) {
            embed.setURL(article.url);
        }

        return embed;
    }

    // News in Discord Channel posten
    async postNewsToDiscord(articles) {
        if (!articles?.length) return 0;

        try {
            // Finde den Ankündigungs-Channel
            const channel = this.client.channels.cache.find(ch => 
                ch.name.includes(this.newsChannelName.replace('📢', '')) ||
                ch.name.includes('ankündigungen') ||
                ch.name.includes('announcements') ||
                ch.name.includes('news')
            );

            if (!channel) {
                console.error('❌ Valorant News Channel nicht gefunden:', this.newsChannelName);
                return 0;
            }

            let postedCount = 0;

            for (const article of articles) {
                try {
                    const embed = this.createNewsEmbed(article);
                    
                    await channel.send({ 
                        content: '🎯 **Neue Valorant News!**',
                        embeds: [embed] 
                    });

                    // Als gepostet markieren
                    await this.markNewsAsPosted(article.news_id);
                    
                    postedCount++;
                    console.log(`✅ News gepostet: ${article.title}`);

                    // Kurze Pause zwischen Posts
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (error) {
                    console.error(`❌ Fehler beim Posten der News "${article.title}":`, error);
                }
            }

            console.log(`📰 ${postedCount} Valorant News Artikel erfolgreich gepostet`);
            return postedCount;
        } catch (error) {
            console.error('❌ Fehler beim Posten der News:', error);
            return 0;
        }
    }

    // Kompletter News-Update Prozess
    async updateNews(force = false) {
        try {
            console.log('📰 Valorant News Update gestartet...');

            // Rate Limiting prüfen (außer bei forced update)
            if (!force && Date.now() - this.lastCheckTime < this.checkInterval) {
                const nextCheck = new Date(this.lastCheckTime + this.checkInterval);
                console.log(`⏰ Nächster News-Check: ${nextCheck.toLocaleString('de-DE')}`);
                return { success: false, message: 'Rate Limited', nextCheck };
            }

            // 1. News von API laden
            const newsArticles = await this.fetchValorantNews();
            if (!newsArticles) {
                return { success: false, message: 'API Fehler' };
            }

            // 2. In Supabase speichern
            await this.saveNewsToSupabase(newsArticles);

            // 3. Ungepostete News laden
            const unpostedNews = await this.getUnpostedNews();
            
            // 4. News in Discord posten
            const postedCount = await this.postNewsToDiscord(unpostedNews);

            this.lastCheckTime = Date.now();

            return {
                success: true,
                totalNews: newsArticles.length,
                newNews: unpostedNews.length,
                posted: postedCount,
                message: `${postedCount} neue News gepostet`
            };

        } catch (error) {
            console.error('❌ Fehler beim News Update:', error);
            return { success: false, message: error.message };
        }
    }

    // Automatische News-Updates starten
    startAutoUpdate() {
        console.log(`📰 Automatische Valorant News Updates gestartet (alle ${this.checkInterval / 60000} Minuten)`);
        
        setInterval(async () => {
            console.log('🔄 Automatischer Valorant News Check...');
            await this.updateNews(false);
        }, this.checkInterval);

        // Erste Prüfung nach 30 Sekunden
        setTimeout(async () => {
            console.log('🔄 Initiale Valorant News Prüfung...');
            await this.updateNews(false);
        }, 30000);
    }

    // Manueller News-Check (für Dashboard)
    async forceUpdateNews() {
        console.log('🔄 Manueller Valorant News Update angefordert...');
        return await this.updateNews(true);
    }

    // News Statistics aus Supabase
    async getNewsStats() {
        if (!this.supabaseClient) return null;

        try {
            const { data, error } = await this.supabaseClient
                .from('valorant_news')
                .select('news_id, posted_to_discord, created_at')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Fehler beim Laden der News Stats:', error);
                return null;
            }

            const total = data?.length || 0;
            const posted = data?.filter(n => n.posted_to_discord).length || 0;
            const pending = total - posted;
            const lastUpdate = data?.[0]?.created_at || null;

            return {
                total,
                posted,
                pending,
                lastUpdate: lastUpdate ? new Date(lastUpdate).toLocaleString('de-DE') : 'Nie'
            };
        } catch (error) {
            console.error('❌ Fehler beim Laden der News Stats:', error);
            return null;
        }
    }
}

module.exports = ValorantNewsSystem; 