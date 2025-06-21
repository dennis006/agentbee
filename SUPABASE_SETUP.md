# 🗄️ Supabase Setup für Discord Bot

## Warum Supabase?
Das alte System mit lokalen JSON-Dateien hatte das Problem, dass bei jedem Server-Neustart alle Einstellungen verloren gingen. Mit Supabase haben wir eine **persistente Datenbank**, die alle Einstellungen dauerhaft speichert.

## 📋 Setup-Schritte

### 1. Supabase Projekt erstellen
1. Gehe zu [supabase.com](https://supabase.com)
2. Klicke auf "Start your project"
3. Melde dich an oder erstelle einen Account
4. Klicke auf "New Project"
5. Wähle deine Organisation
6. Gib einen Projektnamen ein (z.B. "discord-bot-db")
7. Erstelle ein sicheres Datenbank-Passwort
8. Wähle eine Region (am besten Europa für bessere Performance)
9. Klicke auf "Create new project"

### 2. Datenbank-Tabellen erstellen
1. Gehe zu deinem Supabase-Dashboard
2. Klicke auf "SQL Editor" in der Seitenleiste
3. Klicke auf "New query"
4. Kopiere den gesamten Inhalt aus `music_system_tables.sql` 
5. Füge ihn in den SQL-Editor ein
6. Klicke auf "Run" (oder Strg+Enter)

### 3. API-Schlüssel kopieren
1. Gehe zu "Settings" → "API" in deinem Supabase-Dashboard
2. Kopiere die **Project URL** (z.B. `https://abcdefghijk.supabase.co`)
3. Kopiere den **anon public** Schlüssel (beginnt mit `eyJ...`)

### 4. Railway Umgebungsvariablen einrichten
1. Gehe zu deinem Railway-Projekt
2. Klicke auf "Variables"
3. Füge diese neuen Variablen hinzu:

```
SUPABASE_URL=https://deine-projekt-url.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Wichtig:** Ersetze die Werte mit deinen echten Supabase-Daten!

### 5. Dependencies installieren
Die Supabase-Abhängigkeit wurde bereits zur `package.json` hinzugefügt:
```json
"@supabase/supabase-js": "^2.48.0"
```

### 6. Bot neu starten
1. Gehe zu Railway
2. Klicke auf "Deploy" oder warte auf den automatischen Deploy
3. Der Bot wird automatisch die neuen Umgebungsvariablen laden

## 🔧 Wie es funktioniert

### Automatischer Fallback
Das System funktioniert mit einem intelligenten Fallback:
1. **Primär**: Versucht Daten aus Supabase zu laden/speichern
2. **Fallback**: Falls Supabase nicht verfügbar ist, verwendet es lokale JSON-Dateien
3. **Backup**: Lokale JSON-Dateien werden immer als Backup erstellt

### Musik-System Tabellen
- **`music_settings`**: Alle Einstellungen pro Discord-Server
- **`music_stations`**: Benutzerdefinierte Playlists/Stationen
- **`music_station_songs`**: Songs in den Playlists
- **`music_stats`**: Statistiken und aktuelle Spielstände
- **`music_files`**: Cache der verfügbaren MP3-Dateien
- **`music_logs`**: Logs aller Musik-Aktionen

### Automatische Features
- ✅ **Auto-Backup**: Lokale JSON-Dateien als Backup
- ✅ **Auto-Sync**: Einstellungen werden automatisch synchronisiert
- ✅ **Multi-Guild**: Jeder Discord-Server hat separate Einstellungen
- ✅ **Logging**: Alle Aktionen werden geloggt
- ✅ **Migration**: Alte Einstellungen werden automatisch übertragen

## 🔍 Überprüfung

### Logs überprüfen
Nach dem Neustart solltest du diese Logs sehen:
```
✅ Supabase für Musik-System initialisiert
🎵 Versuche Musik-Einstellungen aus Supabase zu laden...
✅ Musik-Einstellungen aus Supabase geladen
```

### Datenbank überprüfen
1. Gehe zu Supabase → "Table Editor"
2. Du solltest alle Tabellen sehen: `music_settings`, `music_stations`, etc.
3. Klicke auf `music_settings` - dort sollte ein Eintrag für deine Guild sein

### Einstellungen testen
1. Gehe zum Bot-Dashboard
2. Ändere eine Musik-Einstellung
3. Starte den Bot neu
4. Die Einstellung sollte erhalten bleiben! 🎉

## 🚨 Troubleshooting

### "Supabase Umgebungsvariablen fehlen"
- Überprüfe, ob `SUPABASE_URL` und `SUPABASE_ANON_KEY` in Railway gesetzt sind
- Stelle sicher, dass keine Leerzeichen in den Werten sind

### "Fehler beim Laden der Musik-Einstellungen"
- Überprüfe die Supabase-Verbindung
- Gehe zu Supabase → "Logs" für detaillierte Fehlermeldungen
- Das System sollte automatisch auf lokale JSON-Dateien zurückfallen

### Tabellen nicht gefunden
- Führe das SQL-Script aus `music_system_tables.sql` erneut aus
- Überprüfe, ob alle Tabellen in Supabase → "Table Editor" vorhanden sind

## 🎯 Nächste Schritte

Nach dem Setup kannst du:
1. **Alle anderen Systeme** auf Supabase migrieren (Tickets, XP, etc.)
2. **Dashboard-Statistiken** mit echten Daten aus der Datenbank erstellen
3. **Erweiterte Features** wie Musik-Statistiken und Playlist-Sharing hinzufügen

## 📊 Vorteile

### Vorher (JSON-Dateien)
- ❌ Daten gehen bei Neustart verloren
- ❌ Keine Backups
- ❌ Schwer zu debuggen
- ❌ Keine Statistiken

### Nachher (Supabase)
- ✅ **Persistente Speicherung** - nie wieder Datenverlust!
- ✅ **Automatische Backups** durch Supabase
- ✅ **Real-time Sync** zwischen Dashboard und Bot
- ✅ **Erweiterte Statistiken** und Logs
- ✅ **Skalierbar** für mehrere Discord-Server
- ✅ **Professionelle Datenbank** mit SQL-Support

Das ist ein riesiger Upgrade für deinen Bot! 🚀 