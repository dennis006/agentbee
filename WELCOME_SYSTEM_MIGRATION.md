# 🎉 Welcome System - Supabase Migration

## Übersicht

Das Welcome System wurde erfolgreich von JSON-Dateien zu Supabase migriert. Diese Migration bringt viele Vorteile:

- ✅ **Bessere Performance** durch Caching
- ✅ **Skalierbarkeit** für große Server
- ✅ **Backup & Recovery** durch Supabase
- ✅ **Real-time Updates** möglich
- ✅ **Konsistente Daten** zwischen Instanzen
- ✅ **Erweiterte Bild-Verwaltung** mit Ordner-Support

## Migration Schritte

### 1. Supabase Tabellen erstellen

Führe das SQL-Script `welcome_system_supabase_migration.sql` in deinem Supabase Dashboard aus:

```bash
# In Supabase Dashboard -> SQL Editor
# Kopiere den Inhalt von welcome_system_supabase_migration.sql
# Und führe es aus
```

### 2. Bestehende Daten migrieren (Optional)

Falls du bereits Welcome-Einstellungen in `welcome.json` hast, werden diese automatisch als Fallback verwendet, bis du sie in Supabase überträgst.

## Neue Features

### 🖼️ Erweiterte Bild-Verwaltung

#### Ordner-System
- Bilder können jetzt in Ordnern organisiert werden
- Standard-Ordner: `general`
- Benutzerdefinierte Ordner: `valorant`, `minecraft`, `beellgrounds`, etc.

#### Bild-Rotation
```javascript
// Automatische Bild-Rotation aktivieren
{
  "imageRotation": {
    "enabled": true,
    "mode": "random",
    "folder": "valorant" // Optional: nur aus bestimmtem Ordner
  }
}
```

#### Drag & Drop zwischen Ordnern
- Bilder können per Drag & Drop zwischen Ordnern verschoben werden
- Automatische URL-Aktualisierung
- Echtzeit-Updates im Dashboard

### 📝 Vollständige Welcome Settings

#### Grundeinstellungen
- `enabled`: Willkommensnachrichten aktiviert/deaktiviert
- `channelName`: Name des Willkommens-Channels
- `title`: Titel der Willkommensnachricht
- `description`: Beschreibung mit Platzhaltern
- `color`: Embed-Farbe (Discord Hex-Format)
- `autoRole`: Automatische Rollenvergabe
- `mentionUser`: Benutzer erwähnen
- `deleteAfter`: Nachricht nach X Sekunden löschen

#### Embed-Felder
```javascript
"fields": [
  {
    "name": "📋 Erste Schritte", 
    "value": "Schaue dir unsere Regeln an!",
    "inline": false
  }
]
```

#### Bild-Einstellungen
- `thumbnail`: 'user' | 'server' | 'custom' | 'none'
- `customThumbnail`: URL zu eigenem Bild
- `imageRotation`: Rotation aus Bildergalerie

#### DM-Nachrichten
```javascript
"dmMessage": {
  "enabled": false,
  "message": "Willkommen! Schau gerne im Server vorbei! 😊"
}
```

#### Abschiedsnachrichten
```javascript
"leaveMessage": {
  "enabled": true,
  "channelName": "verlassen",
  "title": "👋 Tschüss!",
  "description": "**{user}** hat den Server verlassen.",
  "color": "0xFF6B6B",
  "mentionUser": false,
  "deleteAfter": 0
}
```

## API-Endpunkte

### Welcome Settings
```javascript
// Laden
GET /api/welcome

// Speichern  
POST /api/welcome
{
  "enabled": true,
  "channelName": "willkommen",
  // ... weitere Einstellungen
}

// Test-Nachricht senden
POST /api/welcome/test

// Test-Abschiedsnachricht senden  
POST /api/welcome/test-leave
```

### Bild-Verwaltung
```javascript
// Alle Bilder laden
GET /api/welcome/images

// Bild hochladen
POST /api/welcome/upload
FormData: { welcomeImage: File, folder: "general" }

// Bild löschen
DELETE /api/welcome/images/:folder/:filename
DELETE /api/welcome/images/:filename // Legacy

// Bild zwischen Ordnern verschieben
POST /api/welcome/images/move
{
  "filename": "image.png",
  "sourceFolder": "general", 
  "targetFolder": "valorant"
}
```

### Ordner-Verwaltung
```javascript
// Ordner erstellen
POST /api/welcome/folders
{ "folderName": "minecraft" }

// Ordner löschen
DELETE /api/welcome/folders/:folderName
```

## Technische Details

### Supabase Tabellen

#### `welcome_settings`
- Speichert komplette Konfiguration als JSONB
- Ein Eintrag pro Bot-Instanz
- Automatische Timestamps

#### `welcome_images`  
- Verwaltet alle hochgeladenen Bilder
- Ordner-Support mit `folder` Feld
- Metadaten: `size`, `original_name`, etc.
- Unique Constraint auf `filename + folder`

#### `welcome_folders`
- Verwaltet verfügbare Ordner
- Standard-Ordner: `general`

### Caching-System
- 5-Minuten Cache für Settings und Bilder
- Automatische Cache-Invalidierung bei Updates
- Fallback auf JSON-Dateien wenn Supabase nicht verfügbar

### Fallback-Mechanismus
```javascript
// Automatischer Fallback
if (!supabase) {
  console.log('⚠️ Supabase nicht verfügbar, verwende JSON-Fallback');
  return loadWelcomeSettingsFromJSON();
}
```

## Platzhalter

Verfügbare Platzhalter in Texten:
- `{user}`: Benutzername/Mention
- `{server}`: Servername  
- `{memberCount}`: Aktuelle Mitgliederzahl

## Emoji-Unterstützung

- Vollständige Unicode-Emoji-Unterstützung
- Emoji-Picker im Dashboard
- Custom Discord-Emojis unterstützt

## Performance-Optimierungen

### Caching
- Einstellungen: 5 Minuten Cache
- Bilder: 5 Minuten Cache  
- Automatische Invalidierung bei Änderungen

### Indizes
- Optimiert für häufige Abfragen
- Zeitbasierte Sortierung für Bilder
- Ordner-basierte Filterung

### Lazy Loading
- Bilder werden nur bei Bedarf geladen
- Ordner werden dynamisch erweitert

## Migration Status

- ✅ JSON → Supabase Migration
- ✅ Alle API-Endpunkte aktualisiert
- ✅ Fallback-Mechanismus implementiert
- ✅ Erweiterte Bild-Verwaltung
- ✅ Ordner-System
- ✅ Caching-System
- ✅ Performance-Optimierungen
- ✅ Dokumentation erstellt

## Troubleshooting

### Häufige Probleme

#### Supabase Connection Error
```bash
⚠️ Supabase nicht initialisiert, verwende JSON-Fallback
```
**Lösung**: Prüfe `SUPABASE_URL` und `SUPABASE_ANON_KEY` Environment Variables

#### Images not loading
**Lösung**: Prüfe ob Ordner im Dateisystem und Supabase existieren

#### Settings not saving
**Lösung**: Prüfe Supabase-Verbindung und Tabellen-Permissions

## Support

Bei Problemen oder Fragen zur Migration:
1. Prüfe Supabase Dashboard für Fehlermeldungen
2. Schaue in Bot-Logs nach Fehlern  
3. Verwende JSON-Fallback als Backup

---

**Migration erfolgreich abgeschlossen! 🎉**

*Das Welcome System ist jetzt vollständig auf Supabase migriert und bietet erweiterte Funktionen sowie bessere Performance.* 