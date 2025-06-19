# 🚀 Deployment Guide

Dieses Guide hilft dir beim Deployment deines Discord Bots und Dashboards.

## 📋 Übersicht

- **Backend + Discord Bot**: Railway.com
- **Frontend Dashboard**: Netlify.com
- **Domain für API**: Automatisch von Railway

## 🔧 **SCHRITT 1: Railway.com Setup (Backend)**

### 1.1 Account & Projekt erstellen
1. Gehe zu [railway.app](https://railway.app)
2. Registriere dich mit GitHub
3. Klicke "New Project" → "Deploy from GitHub repo"
4. Wähle dein Repository aus

### 1.2 Environment Variables setzen
In Railway → dein Projekt → Variables Tab:

```env
# DISCORD BOT CONFIGURATION
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here

# OPENAI API
OPENAI_API_KEY=your_openai_api_key_here

# TWITCH API
TWITCH_CLIENT_ID=your_twitch_client_id_here
TWITCH_CLIENT_SECRET=your_twitch_client_secret_here

# VALORANT API
VALORANT_API_TOKEN=your_valorant_api_token_here

# YOUTUBE API
YOUTUBE_API_KEY=your_youtube_api_key_here

# SERVER CONFIGURATION
PORT=3001
NODE_ENV=production

# CORS ORIGINS
FRONTEND_URL=https://your-dashboard-domain.netlify.app
```

### 1.3 Custom Domain (Optional aber empfohlen)
1. Railway → dein Projekt → Settings → Domains
2. Klicke "Custom Domain"
3. Füge deine Domain hinzu (z.B. `api.yourdomain.com`)
4. Folge den DNS-Anweisungen

### 1.4 Deployment überwachen
- Railway deployed automatisch bei jedem Git Push
- Logs einsehen: Railway → dein Projekt → Deployments → [Latest] → View Logs

## 🌐 **SCHRITT 2: Netlify.com Setup (Frontend)**

### 2.1 Dashboard für Netlify vorbereiten
Erstelle eine Netlify-Konfiguration im Dashboard-Ordner.

### 2.2 Account & Site erstellen
1. Gehe zu [netlify.com](https://netlify.com)
2. Registriere dich mit GitHub
3. "New site from Git" → GitHub → Repository auswählen
4. Build settings:
   - **Base directory**: `dashboard`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### 2.3 Environment Variables setzen
Netlify → Site settings → Environment variables:

```env
VITE_API_BASE_URL=https://your-railway-domain.railway.app
VITE_NODE_ENV=production
```

### 2.4 Build & Deploy Settings
```toml
# netlify.toml im dashboard/ Ordner
[build]
  base = "dashboard/"
  command = "npm run build"
  publish = "dist/"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🔗 **SCHRITT 3: URLs konfigurieren**

### 3.1 Backend API URLs
Nach Railway Deployment erhältst du eine URL wie:
`https://your-project-name.railway.app`

### 3.2 Frontend Dashboard URL
Nach Netlify Deployment erhältst du eine URL wie:
`https://amazing-site-name.netlify.app`

### 3.3 Custom Domains (Optional)
- **API**: `api.yourdomain.com` → Railway
- **Dashboard**: `dashboard.yourdomain.com` → Netlify

## ⚙️ **SCHRITT 4: Discord Bot Konfiguration**

### 4.1 Discord Developer Portal
1. Gehe zu [discord.com/developers/applications](https://discord.com/developers/applications)
2. Wähle deine Bot-Anwendung
3. OAuth2 → Redirects → Füge hinzu:
   - `https://your-netlify-domain.netlify.app/verify`
   - `https://your-custom-domain.com/verify` (falls Custom Domain)

### 4.2 Bot Permissions
Stelle sicher, dass dein Bot alle nötigen Permissions hat:
- Administrator (oder spezifische Permissions)
- Message Content Intent aktiviert

## 🔄 **SCHRITT 5: Deployment Workflow**

### 5.1 Development
```bash
# Lokal testen
npm run dev-all  # Backend + Frontend gleichzeitig
```

### 5.2 Production Updates
```bash
git add .
git commit -m "Update: neue Features"
git push origin main  # Triggert automatisch:
                      # - Railway Deployment (Backend)
                      # - Netlify Deployment (Frontend)
```

## 🐛 **Troubleshooting**

### Häufige Probleme:

1. **CORS Errors**
   - Prüfe FRONTEND_URL in Railway Environment Variables
   - Prüfe CORS_ORIGINS Konfiguration

2. **API nicht erreichbar**
   - Prüfe Railway Logs für Fehler
   - Prüfe Environment Variables

3. **Build Failures Netlify**
   - Prüfe Node.js Version (sollte 18+ sein)
   - Prüfe Build Command: `npm run build`
   - Prüfe Base Directory: `dashboard`

4. **Discord Bot offline**
   - Prüfe DISCORD_TOKEN in Railway
   - Prüfe Railway Logs für Discord Connection Errors

## 📊 **Monitoring**

### Railway Monitoring
- Logs: Railway → Projekt → Deployments → View Logs
- Metrics: Railway → Projekt → Metrics
- Health: `https://your-api-domain.com/api/health`

### Netlify Monitoring
- Functions: Netlify → Site → Functions
- Analytics: Netlify → Site → Analytics
- Deploy Logs: Netlify → Site → Deploys

## 💡 **Optimierungen**

### Performance
- Railway: Upgrade auf Pro Plan für bessere Performance
- Netlify: Edge Functions für API Caching
- CDN: Automatisch durch beide Plattformen

### Sicherheit
- Environment Variables niemals in Code committen
- API Keys regelmäßig rotieren
- HTTPS überall verwenden

### Monitoring & Alerts
- Railway: Slack/Discord Webhook für Deploy Notifications
- Netlify: Deploy Notifications per Email/Slack
- Uptime Monitoring Tools verwenden 