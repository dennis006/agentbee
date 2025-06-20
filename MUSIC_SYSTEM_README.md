# 🎵 Lokales MP3-Musik-System

## Übersicht

Das YouTube Live-Stream Feature wurde durch ein einfacheres lokales MP3-System ersetzt. Du kannst jetzt MP3-Dateien manuell herunterladen und direkt in dem Bot verwenden.

## ✅ Was funktioniert jetzt:
- Lokale MP3-Dateien abspielen
- Voice-Channel Management
- Einfache Web-Oberfläche
- Datei-Management

## ❌ Was entfernt wurde:
- YouTube Live-Stream Integration
- Komplexe Radio-Stationen
- YouTube-URL Downloads
- play-dl Abhängigkeiten

## 📁 Datei-Upload bei Railway

**Ja, du kannst MP3-Dateien bei Railway hochladen!** Hier sind die Optionen:

### Option 1: Über Git (Empfohlen)
```bash
# 1. MP3-Dateien in den music/ Ordner legen
mkdir music
cp /path/to/your/songs/*.mp3 ./music/

# 2. Dateien zu Git hinzufügen
git add music/
git commit -m "Neue MP3-Dateien hinzugefügt"
git push

# 3. Railway deployt automatisch
```

### Option 2: Über Railway CLI
```bash
# Railway CLI installieren
npm install -g @railway/cli

# Dateien hochladen
railway run --mount /music:/app/music
```

### Option 3: Über FTP/SFTP
Railway bietet auch direkten Dateizugriff über ihre CLI Tools.

## 🔧 Setup-Anweisungen

### 1. Alte Dateien sichern/entfernen
```bash
# Sichere die alten Dateien (falls nötig)
mv music-api.js music-api-old.js
mv dashboard/src/pages/Music.tsx dashboard/src/pages/Music-old.tsx
```

### 2. Neue Dateien aktivieren
```bash
# Benenne die neuen Dateien um
mv music-api-simple.js music-api.js
mv dashboard/src/pages/Music-Simple.tsx dashboard/src/pages/Music.tsx
```

### 3. Dependencies bereinigen
Entferne diese Pakete aus `package.json` (falls nicht mehr benötigt):
```json
{
  "dependencies": {
    "play-dl": "1.9.7",  // ← Kann entfernt werden
    "yt-dlp-wrap": "^2.2.0"  // ← Kann entfernt werden
  }
}
```

### 4. Musik-Ordner erstellen
```bash
mkdir music
echo "Lege hier deine MP3-Dateien ab" > music/README.txt
```

## 🎵 Unterstützte Dateiformate
- `.mp3` (Empfohlen)
- `.wav` (Hohe Qualität)
- `.ogg` (Open Source)

## 📝 Datei-Benennungskonventionen
```
music/
├── Bon_Jovi_-_Livin_on_a_Prayer.mp3
├── Queen_-_Bohemian_Rhapsody.mp3
├── AC_DC_-_Thunderstruck.mp3
└── ...
```

**Tipps:**
- Verwende Unterstriche statt Leerzeichen
- Format: `Artist_-_Song_Title.mp3`
- Vermeide Sonderzeichen: `äöüß@#$%`

## 🚀 Deployment auf Railway

### Standard-Deployment (mit Git)
```bash
# 1. MP3-Dateien hinzufügen
git add music/*.mp3

# 2. Commit erstellen
git commit -m "🎵 MP3-Dateien hinzugefügt: $(ls music/*.mp3 | wc -l) Songs"

# 3. Push zu Railway
git push origin main
```

### Große Dateien (über 100MB)
Für sehr große MP3-Sammlungen:
```bash
# Git LFS verwenden (falls nötig)
git lfs track "*.mp3"
git add .gitattributes
git add music/
git commit -m "🎵 Große MP3-Dateien mit LFS"
git push
```

## ⚙️ Konfiguration

### Musik-Einstellungen anpassen
```javascript
// music-settings.json wird automatisch erstellt
{
  "enabled": true,
  "localMusic": {
    "enabled": true,
    "musicFolder": "./music",
    "allowedFormats": [".mp3", ".wav", ".ogg"],
    "defaultVolume": 50,
    "shuffle": false,
    "loop": false
  }
}
```

### Railway-spezifische Konfiguration
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false
  },
  "volume": {
    "mountPath": "/app/music",
    "size": "5GB"
  }
}
```

## 🔄 Migration von altem System

### Automatisches Migrations-Script
```javascript
// migration-script.js
const fs = require('fs');

// Alte Radio-Stationen zu lokalen Favoriten-Liste
const oldStations = require('./music-settings.json').radio?.stations || [];
const favoritesList = oldStations.map(station => ({
  name: station.name,
  genre: station.genre,
  note: `Former radio station: ${station.description}`
}));

fs.writeFileSync('./music-favorites.json', JSON.stringify(favoritesList, null, 2));
console.log('Migration completed! Check music-favorites.json');
```

## 📊 Web-Interface Features

### Dashboard-Funktionen:
1. **Voice-Channel Management**
   - Channel auswählen und beitreten
   - Connection-Status anzeigen
   - Automatisches Verlassen

2. **Musik-Bibliothek**
   - Alle MP3-Dateien anzeigen
   - Song-Details (Name, Größe)
   - Play/Stop Controls

3. **Einstellungen**
   - Lautstärke einstellen
   - Ankündigungs-Channel wählen
   - Zufallswiedergabe aktivieren

## 🐛 Troubleshooting

### Problem: "Keine Musik-Dateien gefunden"
```bash
# 1. Prüfe ob Ordner existiert
ls -la music/

# 2. Prüfe Dateiformate
file music/*.mp3

# 3. Prüfe Berechtigungen
chmod 644 music/*.mp3
```

### Problem: "Voice-Connection Fehler"
```bash
# 1. Prüfe Bot-Permissions
# 2. Teste mit einem anderen Channel
# 3. Restart den Bot
```

### Problem: "Railway Deployment Fehler"
```bash
# 1. Prüfe Dateigrößen
du -sh music/

# 2. Prüfe Git-Status
git status

# 3. Use Git LFS für große Dateien
git lfs track "*.mp3"
```

## 💡 Empfohlener Workflow

### 1. Songs herunterladen (manuell)
```bash
# Verwende yt-dlp lokal (nicht auf Railway)
yt-dlp -x --audio-format mp3 "https://youtube.com/watch?v=..."
```

### 2. Dateien umbenennen
```bash
# Beispiel-Script
for file in *.mp3; do
  clean_name=$(echo "$file" | sed 's/[^a-zA-Z0-9._-]/_/g')
  mv "$file" "$clean_name"
done
```

### 3. Upload zu Railway
```bash
cp *.mp3 ./music/
git add music/
git commit -m "🎵 Neue Songs hinzugefügt"
git push
```

## 📈 Vorteile des neuen Systems

✅ **Einfacher**: Keine komplexen YouTube-APIs  
✅ **Zuverlässiger**: Lokale Dateien = keine Stream-Ausfälle  
✅ **Schneller**: Direkter Dateizugriff  
✅ **Kontrollierbar**: Du entscheidest welche Songs verfügbar sind  
✅ **Railway-kompatibel**: Perfekt für Railway's Dateisystem  

## 🔮 Zukünftige Erweiterungen

- [ ] Playlist-Funktionen
- [ ] Auto-Shuffle Modi
- [ ] Musik-Metadaten anzeigen
- [ ] Upload-Interface im Dashboard
- [ ] Favoriten-System
- [ ] Musik-Such-Funktion

---

**🚀 Railway Deployment Ready!** Das neue System ist speziell für Railway optimiert und funktioniert out-of-the-box. 