# 🔐 Discord Verifizierungssystem - Setup

## Übersicht

Das Verifizierungssystem ermöglicht es neuen Discord-Mitgliedern, sich über eine sichere Web-Oberfläche zu verifizieren. Es umfasst:

- **🌐 Öffentliche Verifizierungsseite** (`/verify`) - Zugänglich für alle Discord-User
- **⚙️ Admin-Dashboard** (`/dashboard`) - Nur für Administratoren
- **🔗 Discord OAuth2** - Sichere Authentifizierung
- **🛡️ Captcha-Schutz** - Bot-Schutz durch Emoji-Auswahl
- **🎮 Spiele-Auswahl** - Automatic Rollenzuweisung basierend auf Spielen
- **💻 Plattform-Auswahl** - Zusätzliche Kategorisierung
- **📊 Statistiken** - Detaillierte Einblicke in Verifizierungen

## 🔧 Einrichtung

### 1. Discord Application erstellen

1. Gehe zu [Discord Developer Portal](https://discord.com/developers/applications)
2. Erstelle eine neue Application oder verwende eine bestehende
3. Navigiere zu **OAuth2** → **General**
4. Kopiere die **Client ID** und **Client Secret**

### 2. OAuth2 Redirect URI konfigurieren

Füge folgende Redirect URIs in den OAuth2-Einstellungen hinzu:
```
http://localhost:5173/verify    (für Entwicklung)
https://yourdomain.com/verify   (für Produktion)
```

### 3. Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei im `dashboard` Ordner:

```env
# Discord OAuth2 Configuration
VITE_DISCORD_CLIENT_ID=deine_discord_client_id
VITE_DISCORD_CLIENT_SECRET=deine_discord_client_secret
VITE_DISCORD_REDIRECT_URI=http://localhost:5173/verify

# API Configuration  
VITE_API_BASE_URL=http://localhost:3000/api

# Bot Configuration (optional für erweiterte Features)
VITE_BOT_TOKEN=dein_bot_token
```

### 4. Dependencies installieren

```bash
cd dashboard
npm install
```

### 5. Bot-API erweitern

Die Bot-API wurde bereits um die Verifizierungs-Endpunkte erweitert:

- `GET /api/verification/config` - Lade Konfiguration
- `POST /api/verification/config` - Speichere Konfiguration  
- `GET /api/verification/stats` - Lade Statistiken
- `POST /api/verification` - Verarbeite neue Verifizierung

### 6. Server-Rollen erstellen

Erstelle folgende Rollen in deinem Discord-Server:

**Standard-Rollen:**
- `Member` - Basis-Rolle für verifizierte Mitglieder
- `Verified` - Zusätzliche Verifizierungs-Rolle

**Spiele-Rollen:**
- `Valorant Player`
- `LoL Player` 
- `Minecraft Player`
- `Fortnite Player`
- `CS2 Player`
- `Apex Player`

**Plattform-Rollen:**
- `PC Gamer`
- `PlayStation Gamer`
- `Xbox Gamer`
- `Switch Gamer`
- `Mobile Gamer`

### 7. Log-Kanal erstellen

Erstelle einen Kanal namens `verification-logs` für Logging (optional).

## 🚀 Verwendung

### Entwicklung starten

```bash
# Bot starten
npm start

# Dashboard starten (separates Terminal)
cd dashboard
npm run dev
```

### URLs

- **Dashboard:** `http://localhost:5173/dashboard`
- **Verifizierung:** `http://localhost:5173/verify`
- **Bot-API:** `http://localhost:3000/api`

## 📋 Features

### Verifizierungsflow

1. **Discord Login** - OAuth2 Authentifizierung
2. **Captcha** - Bot-Schutz durch Emoji-Auswahl
3. **Spiele-Auswahl** - Checkbox-basierte Auswahl
4. **Valorant Agenten** - Zusätzliche Auswahl wenn Valorant gewählt
5. **Plattform** - Radio-Button Auswahl
6. **Regeln akzeptieren** - Server-Regeln bestätigen
7. **Abschluss** - Automatische Rollenzuweisung

### Admin-Features

- **Konfiguration** - Alle Einstellungen anpassbar
- **Statistiken** - Detaillierte Analytics
- **Vorschau** - Live-Preview der Verifizierungsseite
- **Rollenverwaltung** - Automatische Zuweisung konfigurieren

## ⚙️ Konfiguration

### Verifizierungseinstellungen

```json
{
  "enabled": true,
  "requireCaptcha": true, 
  "allowedGames": ["valorant", "lol", "minecraft"],
  "defaultRoles": ["Member"],
  "welcomeMessage": "Willkommen!",
  "logChannel": "verification-logs",
  "autoAssignRoles": true
}
```

### Spiele & Rollen Mapping

Das System weist automatisch Rollen basierend auf gewählten Spielen zu:

```json
{
  "gameRoles": {
    "valorant": "Valorant Player",
    "lol": "LoL Player"
  },
  "platformRoles": {
    "pc": "PC Gamer",
    "ps5": "PlayStation Gamer"
  }
}
```

## 🔒 Sicherheit

- **OAuth2** - Sichere Discord-Authentifizierung
- **Captcha** - Bot-Schutz durch Emoji-Auswahl
- **Server-Validierung** - Alle Verifizierungen werden server-seitig validiert
- **Rate Limiting** - Schutz vor Spam-Angriffen
- **Rollenberechtigung** - Nur Bot kann Rollen zuweisen

## 🐛 Troubleshooting

### Häufige Probleme

**Discord OAuth Fehler:**
- Überprüfe Client ID und Secret
- Stelle sicher, dass Redirect URI korrekt konfiguriert ist

**Rollen werden nicht zugewiesen:**
- Überprüfe Bot-Berechtigungen
- Stelle sicher, dass Bot-Rolle höher als zuzuweisende Rollen ist
- Überprüfe Rollennamen in der Konfiguration

**API-Verbindung fehlgeschlagen:**
- Stelle sicher, dass Bot läuft
- Überprüfe API_BASE_URL in .env

### Logs prüfen

```bash
# Bot-Logs
npm start

# Browser-Konsole für Frontend-Fehler
F12 → Console
```

## 📝 Lizenz

Dieses Projekt ist Teil des AgentBee Discord Bot Systems. 