const { EmbedBuilder } = require('discord.js');

class ValorantNewsSystem {
    constructor(client) {
        this.client = client;
        this.supabaseClient = null;
        // Prüfe beide möglichen Environment Variable Namen
        this.henrikApiKey = process.env.HENRIK_API_KEY || process.env.VALORANT_API_TOKEN;
        this.newsChannelName = '📢ankündigungen';
        this.lastCheckTime = 0;
        this.checkInterval = 30 * 60 * 1000; // 30 Minuten
        
        // Cutoff-Datum: Nur News ab 24.06.2025 posten (verhindert alte News beim Neustart)
        this.newsCutoffDate = new Date('2025-06-24T00:00:00.000Z');
        
        // Debug-Info für API Key Status
        console.log('📰 ValorantNewsSystem initialisiert:');
        console.log(`   - Henrik API Key: ${this.henrikApiKey ? 'GESETZT ✅' : 'FEHLT ❌'}`);
        console.log(`   - Update Intervall: ${this.checkInterval / 60000} Minuten`);
        console.log(`   - Target Channel: ${this.newsChannelName}`);
        console.log(`   - News Cutoff-Datum: ${this.newsCutoffDate.toLocaleDateString('de-DE')}`);
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
            
            // Prüfe ob API Key verfügbar ist
            if (!this.henrikApiKey || this.henrikApiKey.trim() === '') {
                console.error('❌ Henrik API Key fehlt! Prüfen Sie Railway Environment Variables:');
                console.error('   - HENRIK_API_KEY oder VALORANT_API_TOKEN setzen');
                console.error('   - API Key von https://docs.henrikdev.xyz beziehen');
                
                // Keine Demo-News mehr - echte API-Verbindung erforderlich
                return null;
            }
            
            const response = await fetch('https://api.henrikdev.xyz/valorant/v1/website/de-de', {
                headers: {
                    'Authorization': this.henrikApiKey,
                    'User-Agent': 'Discord Bot - AgentBee'
                }
            });

            if (!response.ok) {
                console.error('❌ Henrik API Fehler:', response.status, response.statusText);
                
                if (response.status === 401) {
                    console.error('❌ Henrik API Key ungültig oder abgelaufen');
                    return null;
                }
                if (response.status === 429) {
                    console.error('❌ Henrik API Rate Limit erreicht - bitte später versuchen');
                    return null;
                }
                
                console.error(`❌ Henrik API HTTP ${response.status}: ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            console.log(`✅ ${data.data?.length || 0} Valorant News Artikel von Henrik API geladen`);
            
            return data.data || [];
        } catch (error) {
            console.error('❌ Fehler beim Laden der Valorant News:', error);
            return null;
        }
    }



    // News in Supabase speichern
    async saveNewsToSupabase(articles) {
        if (!this.supabaseClient || !articles?.length) {
            console.log('⚠️ Supabase nicht verfügbar oder keine Artikel zum Speichern');
            return false;
        }

        try {
            console.log(`💾 Speichere ${articles.length} News Artikel in Supabase...`);

            const newsData = articles.map(article => {
                const newsId = article.id || this.generateNewsId(article);
                const newsEntry = {
                    news_id: newsId,
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
                };
                
                console.log(`📝 Bereite News vor: ${newsEntry.title} (ID: ${newsId})`);
                return newsEntry;
            });

            const { data, error } = await this.supabaseClient
                .from('valorant_news')
                .upsert(newsData, { onConflict: 'news_id' })
                .select();

            if (error) {
                console.error('❌ Supabase News Speicher-Fehler:', error);
                console.error('❌ Error Details:', JSON.stringify(error, null, 2));
                return false;
            }

            console.log(`✅ ${data?.length || 0} News Artikel erfolgreich in Supabase gespeichert`);
            
            // Debug: Zeige die gespeicherten News IDs
            if (data && data.length > 0) {
                data.forEach(savedNews => {
                    console.log(`📋 Gespeichert: ${savedNews.title} (ID: ${savedNews.news_id})`);
                });
            }
            
            return true;
        } catch (error) {
            console.error('❌ Kritischer Fehler beim Speichern der News:', error);
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

    // Bestehende News IDs aus Supabase laden
    async getExistingNewsIds() {
        if (!this.supabaseClient) {
            return new Set();
        }

        try {
            const { data, error } = await this.supabaseClient
                .from('valorant_news')
                .select('news_id')
                .gte('date', this.newsCutoffDate.toISOString()); // Nur News ab Cutoff-Datum

            if (error) {
                console.error('❌ Fehler beim Laden bestehender News IDs:', error);
                return new Set();
            }

            const newsIds = new Set(data?.map(row => row.news_id) || []);
            console.log(`📋 ${newsIds.size} bestehende News IDs geladen`);
            return newsIds;
        } catch (error) {
            console.error('❌ Fehler beim Laden bestehender News IDs:', error);
            return new Set();
        }
    }

    // Neue News aus Supabase laden die noch nicht gepostet wurden
    async getUnpostedNews() {
        if (!this.supabaseClient) {
            console.log('⚠️ Supabase nicht verfügbar für ungepostete News');
            return [];
        }

        try {
            const { data, error } = await this.supabaseClient
                .from('valorant_news')
                .select('*')
                .eq('posted_to_discord', false)
                .gte('date', this.newsCutoffDate.toISOString()) // Nur News ab Cutoff-Datum
                .order('date', { ascending: false })
                .limit(10);

            if (error) {
                console.error('❌ Fehler beim Laden ungeposteter News:', error);
                return [];
            }

            const filteredData = data || [];
            console.log(`📋 ${filteredData.length} ungepostete News nach ${this.newsCutoffDate.toLocaleDateString('de-DE')} gefunden`);
            
            // Zusätzliche Client-side Filterung für Sicherheit
            const recentNews = filteredData.filter(news => {
                const newsDate = new Date(news.date);
                return newsDate >= this.newsCutoffDate;
            });
            
            if (recentNews.length !== filteredData.length) {
                console.log(`🗂️ ${filteredData.length - recentNews.length} alte News herausgefiltert`);
            }
            
            return recentNews;
        } catch (error) {
            console.error('❌ Fehler beim Laden der News aus Supabase:', error);
            return [];
        }
    }

    // News als gepostet markieren
    async markNewsAsPosted(newsId) {
        if (!this.supabaseClient) {
            console.log(`⚠️ Supabase nicht verfügbar - kann News ${newsId} nicht als gepostet markieren`);
            return false;
        }

        try {
            console.log(`📝 Markiere News als gepostet: ${newsId}`);
            
            const { data, error } = await this.supabaseClient
                .from('valorant_news')
                .update({ 
                    posted_to_discord: true,
                    posted_at: new Date().toISOString()
                })
                .eq('news_id', newsId)
                .select();

            if (error) {
                console.error(`❌ Fehler beim Markieren der News ${newsId} als gepostet:`, error);
                return false;
            }

            if (data && data.length > 0) {
                console.log(`✅ News ${newsId} erfolgreich als gepostet markiert`);
                return true;
            } else {
                console.error(`❌ News ${newsId} nicht gefunden in Supabase für Update`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Fehler beim Markieren der News ${newsId}:`, error);
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
                return { 
                    success: false, 
                    message: `Rate Limited. Nächstes Update: ${nextCheck.toLocaleString('de-DE')}`, 
                    nextCheck 
                };
            }

            // 1. News von API laden
            const newsArticles = await this.fetchValorantNews();
            if (!newsArticles) {
                return { 
                    success: false, 
                    message: 'Henrik API nicht verfügbar. Prüfen Sie VALORANT_API_TOKEN in Railway Environment Variables.' 
                };
            }
            
            if (newsArticles.length === 0) {
                return { 
                    success: false, 
                    message: 'Keine neuen Valorant News von Henrik API verfügbar.' 
                };
            }

            console.log(`📰 ${newsArticles.length} News Artikel von API geladen`);

            let savedCount = 0;
            let postedCount = 0;

            // 2. Ungepostete News vor dem Speichern identifizieren
            let unpostedNews = [];
            
            if (this.supabaseClient) {
                // Erste Prüfung: Welche News sind bereits in Supabase?
                const existingNewsIds = await this.getExistingNewsIds();
                console.log(`📋 ${existingNewsIds.size} bestehende News IDs in Supabase gefunden`);
                
                // Filter: Nur wirklich neue News
                const newNewsArticles = newsArticles.filter(article => {
                    const newsId = this.generateNewsId(article);
                    const isNew = !existingNewsIds.has(newsId);
                    if (!isNew) {
                        console.log(`⏭️ News bereits vorhanden: ${article.title}`);
                    }
                    return isNew;
                });
                
                console.log(`🆕 ${newNewsArticles.length}/${newsArticles.length} wirklich neue News gefunden`);
                
                // 3. Nur neue News in Supabase speichern
                if (newNewsArticles.length > 0) {
                    const saveResult = await this.saveNewsToSupabase(newNewsArticles);
                    if (saveResult) {
                        console.log(`✅ ${newNewsArticles.length} neue News in Supabase gespeichert`);
                        savedCount = newNewsArticles.length;
                        
                        // Diese neuen News sind zum Posten bereit
                        unpostedNews = newNewsArticles
                            .filter(article => new Date(article.date) >= this.newsCutoffDate)
                            .map(article => ({
                                ...article,
                                news_id: this.generateNewsId(article)
                            }));
                    }
                } else {
                    console.log('ℹ️ Keine neuen News zum Speichern gefunden');
                }
            } else {
                console.log('⚠️ Supabase nicht verfügbar, überspringe Speicherung');
                
                // Fallback: News nach Cutoff-Datum filtern und limitieren
                const recentArticles = newsArticles.filter(article => {
                    const articleDate = new Date(article.date);
                    return articleDate >= this.newsCutoffDate;
                });
                
                console.log(`📋 ${recentArticles.length}/${newsArticles.length} News nach ${this.newsCutoffDate.toLocaleDateString('de-DE')} gefiltert`);
                
                unpostedNews = recentArticles.slice(0, 5).map((article, index) => ({
                    ...article,
                    news_id: this.generateNewsId(article)
                }));
            }
            
            console.log(`📋 ${unpostedNews.length} ungepostete News gefunden`);

            // 4. News in Discord posten
            if (unpostedNews.length > 0) {
                postedCount = await this.postNewsToDiscord(unpostedNews);
                console.log(`✅ ${postedCount} News erfolgreich gepostet`);
            } else {
                console.log('ℹ️ Keine neuen News zum Posten');
            }

            this.lastCheckTime = Date.now();

            return {
                success: true,
                totalNews: newsArticles.length,
                newNews: unpostedNews.length,
                posted: postedCount,
                message: postedCount > 0 
                    ? `${postedCount} neue News erfolgreich gepostet` 
                    : 'Keine neuen News gefunden'
            };

        } catch (error) {
            console.error('❌ Fehler beim News Update:', error);
            return { 
                success: false, 
                message: `System-Fehler: ${error.message}. Bitte Administrator kontaktieren.` 
            };
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

    // News Statistics aus Supabase oder Fallback
    async getNewsStats() {
        try {
            if (this.supabaseClient) {
                const { data, error } = await this.supabaseClient
                    .from('valorant_news')
                    .select('news_id, posted_to_discord, created_at')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('❌ Fehler beim Laden der News Stats:', error);
                    return this.getFallbackStats();
                }

                const total = data?.length || 0;
                const posted = data?.filter(n => n.posted_to_discord).length || 0;
                const pending = total - posted;
                const lastUpdate = data?.[0]?.created_at || null;

                return {
                    total,
                    posted,
                    pending,
                    lastUpdate: lastUpdate ? new Date(lastUpdate).toLocaleString('de-DE') : 'Nie',
                    autoUpdateActive: true,
                    targetChannel: this.newsChannelName,
                    updateInterval: Math.round(this.checkInterval / 60000) + ' Minuten',
                    nextUpdate: this.lastCheckTime > 0 ? 
                        new Date(this.lastCheckTime + this.checkInterval).toLocaleString('de-DE') : 
                        'Bald'
                };
            } else {
                return this.getFallbackStats();
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der News Stats:', error);
            return this.getFallbackStats();
        }
    }

    // Fallback Stats wenn Supabase nicht verfügbar
    getFallbackStats() {
        return {
            total: 0,
            posted: 0,
            pending: 0,
            lastUpdate: 'System startet...',
            autoUpdateActive: true,
            targetChannel: this.newsChannelName,
            updateInterval: Math.round(this.checkInterval / 60000) + ' Minuten',
            nextUpdate: 'Nach Systemstart',
            cutoffDate: this.newsCutoffDate.toLocaleDateString('de-DE')
        };
    }

    // Cutoff-Datum für News-Filterung aktualisieren
    updateNewsCutoffDate(newDate) {
        this.newsCutoffDate = new Date(newDate);
        console.log(`📅 News Cutoff-Datum aktualisiert auf: ${this.newsCutoffDate.toLocaleDateString('de-DE')}`);
    }
}

module.exports = ValorantNewsSystem; 