-- Valorant News System Supabase Migration
-- Tabelle für Valorant News von Henrik API

-- 1. Haupttabelle für Valorant News
CREATE TABLE IF NOT EXISTS valorant_news (
    id BIGSERIAL PRIMARY KEY,
    news_id VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    category VARCHAR(100),
    url TEXT,
    banner_url TEXT,
    author VARCHAR(255) DEFAULT 'Riot Games',
    tags JSONB DEFAULT '[]',
    posted_to_discord BOOLEAN DEFAULT FALSE,
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_valorant_news_news_id ON valorant_news(news_id);
CREATE INDEX IF NOT EXISTS idx_valorant_news_date ON valorant_news(date DESC);
CREATE INDEX IF NOT EXISTS idx_valorant_news_posted ON valorant_news(posted_to_discord);
CREATE INDEX IF NOT EXISTS idx_valorant_news_category ON valorant_news(category);
CREATE INDEX IF NOT EXISTS idx_valorant_news_created_at ON valorant_news(created_at DESC);

-- 3. RLS (Row Level Security) aktivieren
ALTER TABLE valorant_news ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Lesen für alle authentifizierten User erlauben
CREATE POLICY "Allow read access for all authenticated users" ON valorant_news
    FOR SELECT USING (auth.role() = 'authenticated');

-- Schreiben nur für Service Role
CREATE POLICY "Allow insert/update for service role" ON valorant_news
    FOR ALL USING (auth.role() = 'service_role');

-- 5. Trigger für automatische updated_at
CREATE OR REPLACE FUNCTION update_valorant_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_valorant_news_updated_at
    BEFORE UPDATE ON valorant_news
    FOR EACH ROW
    EXECUTE FUNCTION update_valorant_news_updated_at();

-- 6. Funktionen für News Management

-- Funktion: Ungepostete News abrufen
CREATE OR REPLACE FUNCTION get_unposted_valorant_news(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id BIGINT,
    news_id VARCHAR(255),
    title TEXT,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE,
    category VARCHAR(100),
    url TEXT,
    banner_url TEXT,
    author VARCHAR(255),
    tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vn.id,
        vn.news_id,
        vn.title,
        vn.description,
        vn.date,
        vn.category,
        vn.url,
        vn.banner_url,
        vn.author,
        vn.tags,
        vn.created_at
    FROM valorant_news vn
    WHERE vn.posted_to_discord = FALSE
    ORDER BY vn.date DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: News Statistics
CREATE OR REPLACE FUNCTION get_valorant_news_stats()
RETURNS TABLE (
    total_news BIGINT,
    posted_news BIGINT,
    pending_news BIGINT,
    latest_news_date TIMESTAMP WITH TIME ZONE,
    oldest_news_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_news,
        COUNT(*) FILTER (WHERE posted_to_discord = TRUE) as posted_news,
        COUNT(*) FILTER (WHERE posted_to_discord = FALSE) as pending_news,
        MAX(date) as latest_news_date,
        MIN(date) as oldest_news_date
    FROM valorant_news;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: News als gepostet markieren
CREATE OR REPLACE FUNCTION mark_valorant_news_as_posted(news_id_param VARCHAR(255))
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE valorant_news 
    SET 
        posted_to_discord = TRUE,
        posted_at = NOW(),
        updated_at = NOW()
    WHERE news_id = news_id_param;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion: Alte News bereinigen (älter als 6 Monate)
CREATE OR REPLACE FUNCTION cleanup_old_valorant_news()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM valorant_news 
    WHERE date < NOW() - INTERVAL '6 months';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Beispiel-Daten einfügen (optional für Testing)
INSERT INTO valorant_news (
    news_id, 
    title, 
    description, 
    date, 
    category, 
    url, 
    banner_url, 
    author,
    tags
) VALUES (
    'example_news_1',
    'Willkommen beim Valorant News System',
    'Dies ist ein Beispiel-Artikel um das News System zu testen.',
    NOW(),
    'System',
    'https://playvalorant.com/',
    'https://media.valorant-api.com/logo/v_color.png',
    'AgentBee Bot',
    '["System", "Test", "News"]'::jsonb
) ON CONFLICT (news_id) DO NOTHING;

-- 8. Views für einfachere Abfragen

-- View: Aktuelle News (letzten 30 Tage)
CREATE OR REPLACE VIEW recent_valorant_news AS
SELECT 
    news_id,
    title,
    description,
    date,
    category,
    url,
    banner_url,
    author,
    tags,
    posted_to_discord,
    posted_at,
    created_at
FROM valorant_news
WHERE date >= NOW() - INTERVAL '30 days'
ORDER BY date DESC;

-- View: News Statistics Dashboard
CREATE OR REPLACE VIEW valorant_news_dashboard AS
SELECT 
    category,
    COUNT(*) as total_articles,
    COUNT(*) FILTER (WHERE posted_to_discord = TRUE) as posted_articles,
    COUNT(*) FILTER (WHERE posted_to_discord = FALSE) as pending_articles,
    MAX(date) as latest_article_date,
    MIN(date) as oldest_article_date
FROM valorant_news
GROUP BY category
ORDER BY total_articles DESC;

-- Kommentare für bessere Dokumentation
COMMENT ON TABLE valorant_news IS 'Speichert Valorant News von der Henrik API';
COMMENT ON COLUMN valorant_news.news_id IS 'Eindeutige ID des News-Artikels von der API';
COMMENT ON COLUMN valorant_news.title IS 'Titel des News-Artikels';
COMMENT ON COLUMN valorant_news.description IS 'Beschreibung/Inhalt des Artikels';
COMMENT ON COLUMN valorant_news.date IS 'Veröffentlichungsdatum des Artikels';
COMMENT ON COLUMN valorant_news.category IS 'Kategorie des Artikels (Game Updates, Esports, etc.)';
COMMENT ON COLUMN valorant_news.url IS 'Original URL des Artikels';
COMMENT ON COLUMN valorant_news.banner_url IS 'URL des Banner-Bildes';
COMMENT ON COLUMN valorant_news.author IS 'Autor des Artikels';
COMMENT ON COLUMN valorant_news.tags IS 'Tags/Schlagwörter als JSON Array';
COMMENT ON COLUMN valorant_news.posted_to_discord IS 'Wurde bereits in Discord gepostet';
COMMENT ON COLUMN valorant_news.posted_at IS 'Zeitpunkt der Discord-Veröffentlichung';

-- Migration erfolgreich
SELECT 'Valorant News System Supabase Migration completed successfully!' AS status; 