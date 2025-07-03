# 🎮 AgentBee Twitch Bot Setup (Integriert)

## Übersicht
Der AgentBee Twitch Bot ist direkt in den Discord Bot integriert - ein Multi-Channel Chat Bot mit Web-Dashboard zur Verwaltung mehrerer Twitch Channels gleichzeitig. **Beide Bots laufen zusammen in einem Prozess!**

## ✨ Features
- **Multi-Channel Support**: Verwalte mehrere Twitch Channels
- **Auto-Moderation**: Anti-Spam, Wort-Filter, Caps-Limit
- **Custom Commands**: Standard + Custom Commands
- **Chat Logging**: Vollständige Chat-Historie in Supabase
- **Real-time Stats**: Live-Statistiken und Analytics
- **Web Dashboard**: Einfache Verwaltung über `/twitch`
- **Auto-Responses**: Automatische Chat-Antworten
- **Railway Integration**: Auto-Deploy bei GitHub Commits

## 🚀 Installation

### 1. Twitch Developer Setup
1. Gehe zu [Twitch Developer Console](https://dev.twitch.tv/console)
2. Erstelle eine neue Application
3. Notiere dir:
   - `Client ID`
   - `Client Secret`

### 2. Railway Environment Variables
Füge in Railway diese Environment Variables hinzu:

```env
# Twitch API
TWITCH_CLIENT_ID=deine_twitch_client_id
TWITCH_CLIENT_SECRET=deine_twitch_oauth_token

# Supabase (bereits vorhanden)
SUPABASE_URL=deine_supabase_url
SUPABASE_KEY=deine_supabase_key
```

### 3. Supabase Migration
Führe die Migration aus:
```sql
-- Führe twitch_bot_supabase_migration.sql in deiner Supabase DB aus
```

### 4. Deployment (Automatisch integriert)
```bash
# Pushe zum GitHub Repository
git add .
git commit -m "🎮 Add Twitch Bot Multi-Channel Support"
git push origin main

# Railway deployed automatisch EINEN Service:
# - Discord Bot mit integriertem Twitch Bot (Port 3001)
# - Beide Bots laufen im gleichen Prozess!
# - Twitch Dashboard verfügbar unter /twitch
```

## 📖 Verwendung

### Web Dashboard
- Besuche `/twitch` auf deiner Domain
- Verwalte Channels: Hinzufügen/Entfernen
- Überwache Bot Status und Statistiken
- Real-time Updates alle 30 Sekunden

### Channel hinzufügen
1. Gehe zu `/twitch`
2. Gib den Twitch Channel Namen ein (z.B. "shroud")
3. Klicke "Channel hinzufügen"
4. Bot tritt automatisch dem Channel bei

### Bot Commands
Der Bot reagiert auf folgende Commands:

```
!ping         - Bot Ping Test
!bot          - Bot Information  
!commands     - Liste aller Befehle
!uptime       - Bot Laufzeit
!stats        - Bot Statistiken
```

### Auto-Responses
- `hallo/hi` → Willkommensnachricht
- `discord` → Discord Server Link
- `youtube` → YouTube Channel Link

### Moderation Features
- **Anti-Spam**: Automatische Spam-Erkennung
- **Caps-Filter**: Max 70% Großbuchstaben
- **Längen-Limit**: Max 500 Zeichen
- **Wort-Filter**: Banne bestimmte Wörter
- **Auto-Timeout**: 10 Sekunden bei Spam

## 🔧 Konfiguration

### Bot Settings (Supabase)
Tabelle: `twitch_bot_settings`

```sql
-- Command Prefix ändern
UPDATE twitch_bot_settings SET prefix = '?' WHERE id = 1;

-- Moderation anpassen
UPDATE twitch_bot_settings SET 
  max_caps = 50,
  max_length = 300,
  banned_words = '{spam,scam,fake,bot,virus}'
WHERE id = 1;
```

### Custom Commands
Tabelle: `twitch_commands`

```sql
-- Neuen Command hinzufügen
INSERT INTO twitch_commands (command_name, description, response, enabled) 
VALUES ('discord', 'Discord Server Link', '📢 Join unserem Discord: https://discord.gg/yourserver', true);
```

### Channel-Spezifische Settings
```sql
-- Channel nur für bestimmte Commands aktivieren
UPDATE twitch_commands SET channels = '{"shroud","ninja"}' WHERE command_name = 'special';
```

## 📊 Database Schema

### Haupttabellen
- `twitch_bot_settings` - Bot Konfiguration
- `twitch_channels` - Verwaltete Channels
- `twitch_chat_logs` - Chat Historie
- `twitch_command_logs` - Command Usage
- `twitch_users` - User Tracking
- `twitch_commands` - Custom Commands
- `twitch_auto_responses` - Auto-Antworten
- `twitch_moderation_actions` - Moderation Logs
- `twitch_statistics` - Daily Stats

## 🛠️ API Endpoints

### Bot Status
```
GET /api/twitch/status
```

### Channel Management
```
GET    /api/twitch/channels     - Alle Channels
POST   /api/twitch/channels     - Channel hinzufügen
DELETE /api/twitch/channels/:id - Channel entfernen
```

### Statistiken
```
GET /api/twitch/stats
```

## 🔍 Monitoring

### Health Check
```
GET /health
```

### Logs
```bash
# Railway Logs anzeigen
railway logs --service twitch-bot

# Bot Status prüfen
curl https://your-domain.railway.app/api/twitch/status
```

## 🆘 Troubleshooting

### Bot verbindet nicht
1. Prüfe Twitch Credentials in Railway
2. Stelle sicher, dass OAuth Token gültig ist
3. Check Railway Logs

### Channel wird nicht hinzugefügt
1. Prüfe Channel Name (ohne #)
2. Stelle sicher, dass Channel existiert
3. Check Supabase Verbindung

### Commands funktionieren nicht
1. Prüfe Command Prefix in Settings
2. Stelle sicher, dass Commands enabled sind
3. Check Cooldown Settings

### Performance Issues
1. Monitor Supabase Usage
2. Check Railway Memory/CPU
3. Optimize Database Indexes

## 🔒 Security

### Rate Limiting
- Commands haben individuelle Cooldowns
- User-spezifische Cooldowns
- Channel-übergreifende Limits

### Data Privacy
- Nur Chat-Metadaten werden gespeichert
- User können Löschung anfordern
- GDPR-compliant Logging

## 📈 Analytics

### Daily Stats
- Nachrichten pro Channel
- Command Usage
- Unique Users
- Peak Activity

### Real-time Monitoring
- Live Chat Activity
- Bot Response Times
- Error Tracking
- Performance Metrics

## 🎯 Roadmap

### Geplante Features
- [ ] Twitch Clips Integration
- [ ] Channel Points Commands
- [ ] Subscriber-only Commands
- [ ] Advanced Analytics Dashboard
- [ ] Multi-Language Support
- [ ] Webhook Notifications
- [ ] Custom Emote Responses

## 💡 Support

### GitHub Issues
Erstelle ein Issue für:
- Bug Reports
- Feature Requests
- Documentation Updates

### Discord Community
Join unserem Discord für:
- Live Support
- Community Discussion
- Beta Testing

---

**Made with 💜 by AgentBee Technology ⚡** 