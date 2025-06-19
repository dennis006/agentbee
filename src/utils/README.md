# Valorant Card Generator 🎯

Eine professionelle Canvas-basierte Bildgenerierung für Valorant-Spielerstatistiken.

## Features ✨

- **900×600 PNG-Canvas** mit authentischem Valorant-Design
- **Vollständige Datenerfassung** - alle Statistiken wie im Original
- **Peak Rang mit Icon** - separates Icon für Peak Rang wie im Original
- **Dynamische Asset-Ladung** von Riot's CDN (Rang-Badges, Agent-Icons)
- **Geometrische Hintergrund-Muster** im Valorant-Stil
- **Abgerundete Boxen** mit Valorant-Borders und Schatten-Effekten
- **Authentisches Valorant-Farbschema** (#FF4655, #0F1419, etc.)
- **Vollständige Match-Statistiken** (Wins, Games, Win-Rate)
- **Präzisions-Daten** (Headshots, Bodyshots, Legshots)
- **Damage & Score Bereich** (ADR, Total Damage, Average Score)
- **Season-Statistiken** wie im Original Discord-Embed
- **Robuste Fehlerbehandlung** mit Fallback-Systemen

## Installation 📦

```bash
npm install canvas
```

## Verwendung 🚀

### Basis-Verwendung

```javascript
const { makeValorantCard } = require('./src/utils/valorantCard');

const stats = {
  name: 'PlayerName',
  tag: '1234',
  level: 87,
  currentRank: 'Gold 2',
  rr: 42,
  peakRank: 'Platinum 1',
  kills: 18,
  deaths: 12,
  assists: 7,
  adr: 156,
  hsRate: 23.5,
  agentIconUrl: 'https://media.valorant-api.com/agents/.../displayicon.png'
};

const imageBuffer = await makeValorantCard(stats);
```

### Discord.js Integration

```javascript
const { sendValorantCard } = require('./src/utils/valorantCardExample');

// In deinem Slash-Command Handler
await sendValorantCard(interaction, playerStats);
```

### API-Daten Konvertierung

```javascript
const { createCardFromApiData } = require('./src/utils/valorantCardExample');

// Konvertiere Valorant-API Daten
const cardBuffer = await createCardFromApiData(apiResponse);
```

## Funktions-Parameter 📋

### `makeValorantCard(stats)`

| Parameter | Typ | Beschreibung | Beispiel |
|-----------|-----|--------------|----------|
| `name` | string | Spielername | `"TestPlayer"` |
| `tag` | string | Spieler-Tag | `"1234"` |
| `level` | number | Account-Level | `87` |
| `currentRank` | string | Aktueller Rang | `"Gold 2"` |
| `rr` | number | Ranked Rating | `42` |
| `peakRank` | string | Höchster Rang | `"Platinum 1"` |
| `kills` | number | Kills | `18` |
| `deaths` | number | Deaths | `12` |
| `assists` | number | Assists | `7` |
| `adr` | number | Average Damage per Round | `156` |
| `hsRate` | number | Headshot-Rate (%) | `23.5` |
| `agentIconUrl` | string | Agent-Icon URL | Riot CDN URL |

## Unterstützte Ränge 🏆

- Iron 1-3
- Bronze 1-3  
- Silver 1-3
- Gold 1-3
- Platinum 1-3
- Diamond 1-3
- Ascendant 1-3
- Immortal 1-3
- Radiant

## Design-Elemente 🎨

### Farben
- **Primary**: `#FF4655` (Valorant Rot)
- **Secondary**: `#0F1419` (Dunkles Grau)
- **Accent**: `#53212B` (Dunkles Rot)
- **Text**: `#FFFFFF` (Weiß)
- **Text Secondary**: `#ECECEC` (Helles Grau)

### Layout
- **Linke Seite**: Spieler-Info, Rang, Agent
- **Rechte Seite**: K/D/A, Performance, Match-Stats
- **Schatten**: 8-15px Blur mit rgba(0,0,0,0.5)
- **Abgerundete Ecken**: 10-15px Radius

## Fehlerbehandlung 🛡️

- **Hintergrund-Fallback**: Gradient bei 403/404 Fehlern
- **Rang-Icon-Fallback**: Farbige Box bei Lade-Fehlern
- **Agent-Icon-Fallback**: Graceful Skip bei Fehlern
- **Vollständiger Fallback**: Einfache Fehlerkarte bei kritischen Fehlern

## Performance 📊

- **Durchschnittliche Erstellungszeit**: 200-800ms
- **Bildgröße**: ~100KB PNG
- **Memory-Footprint**: Minimal durch Buffer-Rückgabe

## Testen 🧪

```bash
# Test-Karte erstellen
node src/utils/testValorantCard.js

# Ausgabe: test-valorant-card.png im Projektroot
```

## Beispiel-Output 🖼️

Die generierte Karte enthält (wie im Original-Discord-Embed):
- **Header**: Agent-Icon, Spielername#Tag, Level
- **Rang-Bereich**: Aktueller Rang mit Icon, Peak Rang mit Icon
- **Match-Statistiken**: Anzahl Matches, Win-Rate
- **Letzte Änderung**: RR-Änderung mit Farb-Kodierung
- **K/D/A Bereich**: Kills/Deaths/Assists, K/D-Ratio
- **Präzision**: Headshot-Rate, Headshots/Body/Leg-Shots
- **Damage & Score**: ADR, Total Damage, Average Score
- **Season-Statistiken**: Wins, Games, Win-Rate
- **Powered by AgentBee** Footer wie im Original

## Integration in bestehenden Bot 🔧

1. **Importiere die Funktionen**:
```javascript
const { makeValorantCard } = require('./src/utils/valorantCard');
```

2. **Verwende in Valorant-Befehlen**:
```javascript
// In deinem bestehenden Valorant-Command
const cardBuffer = await makeValorantCard(playerStats);
const attachment = new AttachmentBuilder(cardBuffer, { 
  name: `valorant-${playerName}-${playerTag}.png` 
});
```

3. **Sende als Discord-Attachment**:
```javascript
await interaction.reply({ files: [attachment] });
```

## Troubleshooting 🔧

### Canvas Installation Probleme
```bash
# Windows
npm install --global windows-build-tools
npm install canvas

# Linux
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
npm install canvas

# macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg
npm install canvas
```

### Häufige Fehler
- **403 Forbidden**: Hintergrund-URL blockiert → Fallback wird verwendet
- **Canvas not found**: `npm install canvas` ausführen
- **Memory Issues**: Buffer sofort verwenden/speichern, nicht cachen

## Lizenz 📄

MIT License - Frei verwendbar in deinen Discord-Bot-Projekten! 