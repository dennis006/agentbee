const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Vereinfachte Tabellenerstellung für sofortige Funktionalität
const QUICK_TABLES_SQL = `
-- Quick Fix: Basis Tabellen für Twitch Bot
-- Diese erstellt nur die essentiellen Tabellen für sofortige Funktionalität

-- Basis Bot Settings
CREATE TABLE IF NOT EXISTS twitch_bot_settings (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    bot_enabled BOOLEAN DEFAULT false,
    bot_username TEXT DEFAULT '',
    oauth_token TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id)
);

-- Channel Management (wichtigste Tabelle)
CREATE TABLE IF NOT EXISTS twitch_bot_channels (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    channel_name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    discord_channel_id TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id, channel_name)
);

-- Stream Events Settings (neue Funktion)
CREATE TABLE IF NOT EXISTS twitch_bot_stream_events (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    stream_start_enabled BOOLEAN DEFAULT false,
    stream_start_message TEXT DEFAULT '🔴 Stream startet! Lasst uns Spaß haben! 🎮',
    stream_end_enabled BOOLEAN DEFAULT false,
    stream_end_message TEXT DEFAULT '📴 Stream beendet! Danke fürs Zuschauen! ❤️',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guild_id)
);

-- Event History
CREATE TABLE IF NOT EXISTS twitch_bot_events (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL DEFAULT 'default',
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS aktivieren
ALTER TABLE twitch_bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_stream_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_bot_events ENABLE ROW LEVEL SECURITY;

-- Policies für Zugriff
DROP POLICY IF EXISTS "Allow all on twitch_bot_settings" ON twitch_bot_settings;
CREATE POLICY "Allow all on twitch_bot_settings" ON twitch_bot_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on twitch_bot_channels" ON twitch_bot_channels;
CREATE POLICY "Allow all on twitch_bot_channels" ON twitch_bot_channels FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on twitch_bot_stream_events" ON twitch_bot_stream_events;
CREATE POLICY "Allow all on twitch_bot_stream_events" ON twitch_bot_stream_events FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on twitch_bot_events" ON twitch_bot_events;
CREATE POLICY "Allow all on twitch_bot_events" ON twitch_bot_events FOR ALL USING (true);

-- Standard-Daten einfügen
INSERT INTO twitch_bot_settings (guild_id, bot_enabled) 
VALUES ('default', false) 
ON CONFLICT (guild_id) DO NOTHING;

INSERT INTO twitch_bot_stream_events (guild_id, stream_start_enabled, stream_start_message) 
VALUES ('default', false, '🔴 Stream startet! Lasst uns Spaß haben! 🎮') 
ON CONFLICT (guild_id) DO NOTHING;
`;

async function quickFixTwitchSetup() {
    console.log('🚀 Quick Fix: Twitch Bot Setup...');
    console.log('📝 Erstelle Basis-Tabellen für sofortige Funktionalität');
    console.log('');
    
    console.log('🔧 Aktion erforderlich:');
    console.log('1. Gehe zu deinem Supabase Dashboard');
    console.log('2. Öffne SQL Editor');
    console.log('3. Kopiere das SQL unten');
    console.log('4. Führe es aus');
    console.log('');
    
    console.log('📋 SQL zum Kopieren:');
    console.log('================================');
    console.log(QUICK_TABLES_SQL);
    console.log('================================');
    console.log('');
    
    console.log('✅ Nach der Ausführung sollten verfügbar sein:');
    console.log('   • Channel Management (Basis-Features)');
    console.log('   • Stream Events (komplett)');
    console.log('   • Bot Settings (Basis)');
    console.log('');
    
    console.log('🔄 Für vollständige Features führe später aus:');
    console.log('   • twitch_system_supabase_migration.sql (alle Features)');
    console.log('');
    
    console.log('💡 Tipp: Nach SQL-Ausführung Dashboard neu laden!');
    
    // SQL in temporäre Datei schreiben für einfaches Kopieren
    const tempFile = path.join(__dirname, 'temp_quick_fix.sql');
    fs.writeFileSync(tempFile, QUICK_TABLES_SQL);
    console.log(`📄 SQL auch gespeichert in: ${tempFile}`);
    
    return QUICK_TABLES_SQL;
}

if (require.main === module) {
    quickFixTwitchSetup();
}

module.exports = quickFixTwitchSetup; 