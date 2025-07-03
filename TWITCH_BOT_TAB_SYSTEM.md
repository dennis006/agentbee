# 🤖 Twitch Bot Tab-System

## 📋 Übersicht

Das neue Twitch Bot Tab-System bietet eine vollständige modulare Verwaltung des Twitch Bots mit erweiterten Features für Stream Events.

## 🎯 Features

### 📺 **Stream Events (Hauptfeature)**
- **Stream-Start Nachrichten**: Automatische Nachrichten wenn der Stream startet
- **Stream-Ende Nachrichten**: Automatische Nachrichten wenn der Stream endet
- **Verzögerung konfigurierbar**: 0-300 Sekunden Delay
- **Test-Buttons**: Manuelle Trigger für Tests
- **Event Historie**: Alle Stream Events werden geloggt

### 🎪 **Interactive Events**
- **Follow Nachrichten**: Automatische Begrüßung neuer Follower
- **Subscription Nachrichten**: Willkommensnachrichten für Subscriber
- **Raid Nachrichten**: Begrüßung bei Raids
- **Donation Nachrichten**: Dankesnachrichten für Spenden
- **Variable Unterstützung**: `{username}`, `{raiders}`, `{amount}`

## 🗂️ Tab-System

### 1. **Übersicht Tab**
- Bot Status (Online/Offline)
- Uptime Anzeige
- Statistiken Dashboard
- Quick Actions
- Real-time Metriken

### 2. **Bot Einstellungen Tab**
- Bot Username Konfiguration
- OAuth Token Management
- Command Prefix Einstellung
- Cooldown Konfiguration
- Moderator-only Commands

### 3. **Channels Tab**
- Multi-Channel Support
- Channel hinzufügen/entfernen
- Discord Integration
- Auto-Join Konfiguration
- Channel Status Übersicht

### 4. **Stream Events Tab** ⭐
- Stream-Start/Ende Nachrichten
- Interactive Event Messages
- Event Historie
- Test-Funktionen
- Vollständige Konfiguration

### 5. **Commands Tab** (Coming Soon)
- Custom Commands erstellen
- Cooldown Management
- Moderator-only Commands
- Usage Statistics

### 6. **Moderatoren Tab** (Coming Soon)
- Bot-Moderatoren verwalten
- Berechtigungen konfigurieren
- Event-Trigger Zugriff
- Command Management

## 🔧 Backend APIs

### Stream Events API
```
GET    /api/twitch-bot/stream-events/settings      # Einstellungen abrufen
POST   /api/twitch-bot/stream-events/settings      # Einstellungen speichern
POST   /api/twitch-bot/stream-events/trigger/start # Stream-Start triggern
POST   /api/twitch-bot/stream-events/trigger/end   # Stream-Ende triggern
GET    /api/twitch-bot/stream-events/history       # Event Historie
```

### Bestehende Bot APIs
```
GET    /api/twitch-bot/settings                    # Bot Einstellungen
POST   /api/twitch-bot/settings                    # Bot Einstellungen speichern
POST   /api/twitch-bot/toggle                      # Bot Ein/Aus
GET    /api/twitch-bot/channels                    # Channels abrufen
POST   /api/twitch-bot/channels                    # Channel hinzufügen
DELETE /api/twitch-bot/channels/:id               # Channel entfernen
GET    /api/twitch-bot/stats                       # Bot Statistiken
```

## 🗄️ Supabase Tabellen

### Stream Events Tabellen
- `twitch_bot_stream_events`: Event Einstellungen
- `twitch_bot_events`: Event Historie & Logging
- `twitch_bot_auto_voice`: Auto Voice Channel (Future)
- `twitch_bot_custom_commands`: Custom Commands (Future)
- `twitch_bot_moderators`: Bot Moderatoren (Future)

## 🚀 Deployment

### Neue Dateien
- `twitch-bot-stream-events-api.js`: Stream Events Backend
- `twitch_bot_stream_events_migration.sql`: Supabase Migration
- `dashboard/src/pages/TwitchBotTabs.tsx`: Frontend Tab-System

### Integration
- Stream Events API in `twitch-bot-supabase-api.js` integriert
- Tab-System vollständig modular aufgebaut
- Bestehende Bot-Funktionen bleiben erhalten

## 📖 Verwendung

### 1. Stream Events konfigurieren
1. Gehe zum **Stream Events Tab**
2. Aktiviere Stream-Start/Ende Nachrichten
3. Konfiguriere die Nachrichten
4. Setze Verzögerung (optional)
5. Speichere Einstellungen

### 2. Stream-Start triggern
1. Klicke "Stream-Start Test" Button
2. Nachricht wird an alle aktiven Channels gesendet
3. Event wird in Historie geloggt

### 3. Interactive Events aktivieren
1. Aktiviere gewünschte Events (Follow, Sub, Raid, Donation)
2. Passe Nachrichten an
3. Verwende Variablen: `{username}`, `{raiders}`, `{amount}`
4. Speichere alle Events

## 🔮 Zukunftige Features

### Custom Commands System
- Eigene Commands erstellen
- Cooldown Management
- Moderator-Beschränkungen
- Usage Analytics

### Moderator System
- Bot-Moderatoren hinzufügen
- Granulare Berechtigungen
- Event-Trigger Zugriff
- Command-Management

### Auto Voice Channels
- Automatische Voice Channel Erstellung
- Stream-Start Integration
- Dynamische Namen
- Discord Voice API

## 🎯 Nächste Schritte

1. **Supabase Migration ausführen**:
   ```sql
   -- twitch_bot_stream_events_migration.sql in Supabase ausführen
   ```

2. **TwitchBotTabs Komponente einbinden**:
   - In Router als neue Route hinzufügen
   - Oder bestehende TwitchBot.tsx ersetzen

3. **Stream Events testen**:
   - Bot konfigurieren und starten
   - Stream Events aktivieren
   - Test-Buttons verwenden

## 🛠️ Development

Das System ist vollständig modular aufgebaut:
- Neue Tabs können einfach hinzugefügt werden
- APIs sind erweiterbar
- Supabase Tabellen vorbereitet für Future Features
- TypeScript Interfaces definiert

## 📝 Notes

- Alle bestehenden Bot-Funktionen bleiben erhalten
- Stream Events funktionieren mit Multi-Channel Support
- Event Historie für Debugging und Analytics
- Test-Funktionen für einfache Entwicklung
- Vollständige Supabase Integration 