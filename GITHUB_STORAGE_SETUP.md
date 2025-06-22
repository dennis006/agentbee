# GitHub Storage Setup für Welcome Images

## Übersicht

Das Discord Bot System nutzt jetzt GitHub als persistente Storage-Lösung für Welcome Images. Dies löst das Problem mit der ephemeren Natur von Railway-Containern.

## Vorteile der GitHub Integration

- ✅ **Persistente Storage**: Bilder gehen nicht bei Container-Restarts verloren
- ✅ **CDN-Performance**: GitHub + jsDelivr CDN für schnelle Auslieferung
- ✅ **Kostenlos**: Keine zusätzlichen Storage-Kosten
- ✅ **Versionskontrolle**: Automatisches Backup und Historien
- ✅ **Globale Verfügbarkeit**: CDN-Verteilung weltweit

## Setup Anleitung

### 1. GitHub Personal Access Token erstellen

1. Gehe zu GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Klicke "Generate new token (classic)"
3. Setze diese Permissions:
   - `repo` (Full control of private repositories)
   - `contents` (Repository contents)
4. Kopiere den Token (wird nur einmal angezeigt!)

### 2. API-Keys konfigurieren

Füge in `api-keys.json` hinzu:

```json
{
  "github": {
    "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "username": "dein-github-username",
    "repository": "discordbot"
  }
}
```

### 3. Repository Struktur

Das System erstellt automatisch diese Ordner-Struktur:

```
public/images/welcome/
├── general/
├── valorant/
├── minecraft/
├── gaming/
├── anime/
├── memes/
└── seasonal/
```

## Verwendung

### Image URLs

Hochgeladene Bilder werden über jsDelivr CDN ausgeliefert:

```
https://cdn.jsdelivr.net/gh/USERNAME/REPO@main/public/images/welcome/FOLDER/FILENAME
```

### Dashboard Integration

Das Dashboard funktioniert automatisch mit der GitHub-Integration:

1. **Upload**: Bilder werden zu GitHub hochgeladen und in Supabase registriert
2. **Display**: Images werden über CDN URLs angezeigt
3. **Delete**: Löschen entfernt Bilder von GitHub und aus Supabase
4. **Fallback**: Bei GitHub-Problemen wird lokaler Storage verwendet

### Ordner Management

Standard-Ordner werden automatisch erstellt:
- `general` - Allgemeine Welcome Images
- `valorant` - Valorant-spezifische Bilder
- `minecraft` - Minecraft-Thema
- `gaming` - Gaming-allgemein
- `anime` - Anime/Manga Bilder
- `memes` - Memes und lustige Bilder
- `seasonal` - Saisonale/Event-Bilder

## Fehlerbehebung

### "GitHub Token nicht konfiguriert"

1. Überprüfe `api-keys.json` auf korrekten GitHub-Eintrag
2. Stelle sicher, dass der Token die richtigen Permissions hat
3. Verifiziere Username und Repository-Name

### Upload-Fehler

1. Überprüfe Internet-Verbindung
2. Validiere GitHub Token
3. Prüfe Repository-Permissions
4. Bei Problemen wird automatisch lokaler Fallback verwendet

### Images nicht sichtbar

1. Warte 1-2 Minuten (CDN-Propagation)
2. Überprüfe GitHub Repository für hochgeladene Dateien
3. Teste direkte CDN-URL im Browser

## Migration bestehender Images

Bestehende lokale Images können manuell zu GitHub migriert werden:

1. Lade Images über Dashboard erneut hoch
2. Oder: Kopiere Images direkt ins GitHub Repository
3. Registriere sie in Supabase über API

## Performance

- **Upload**: 2-5 Sekunden (abhängig von Bildgröße)
- **Display**: <1 Sekunde (CDN-Cache)
- **Global CDN**: Optimierte Auslieferung weltweit

## Sicherheit

- Personal Access Token werden verschlüsselt in Railway gespeichert
- Repository kann private oder public sein
- Nur authorized Apps können auf Token zugreifen

## Support

Bei Problemen:
1. Überprüfe Console-Logs für Details
2. Teste API-Endpoints direkt
3. Verifiziere GitHub Repository-Zugriff
4. Fallback auf lokalen Storage funktioniert immer 