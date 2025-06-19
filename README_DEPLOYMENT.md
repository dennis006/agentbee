# 🚀 **Deployment Anleitung**

Du bist jetzt bereit für das Production Deployment! Hier ist eine step-by-step Anleitung:

## ✅ **Was wurde vorbereitet:**

1. **Railway-Konfiguration** - `railway.json` + `Procfile`
2. **Netlify-Konfiguration** - `dashboard/netlify.toml`
3. **Production-CORS** - Sichere Cross-Origin Requests
4. **Health-Check** - `/api/health` für Railway Monitoring
5. **Environment-Support** - PORT und HOST Variablen
6. **API-Client** - `dashboard/src/lib/api.ts`

---

## 🔧 **SCHRITT 1: Railway.com Setup**

### 1.1 Account erstellen
1. Gehe zu [railway.app](https://railway.app)
2. "Sign up with GitHub"
3. Autorisiere Railway für dein GitHub Repository

### 1.2 Projekt deployen
1. **"New Project"** → **"Deploy from GitHub repo"**
2. Wähle dein Repository aus
3. Railway erkennt automatisch Node.js und deployed

### 1.3 Environment Variables setzen
Railway → dein Projekt → **Variables** Tab:

```env
# Discord Bot Configuration
DISCORD_TOKEN=dein_discord_bot_token_hier
DISCORD_CLIENT_ID=deine_discord_client_id_hier
DISCORD_CLIENT_SECRET=dein_discord_client_secret_hier

# OpenAI API
OPENAI_API_KEY=dein_openai_api_key_hier

# Twitch API
TWITCH_CLIENT_ID=deine_twitch_client_id_hier
TWITCH_CLIENT_SECRET=dein_twitch_client_secret_hier

# Valorant API
VALORANT_API_TOKEN=dein_valorant_api_token_hier

# YouTube API
YOUTUBE_API_KEY=dein_youtube_api_key_hier

# Server Configuration
PORT=3001
NODE_ENV=production

# WICHTIG: Wird in Schritt 2 gesetzt nach Netlify Deployment
FRONTEND_URL=https://deine-netlify-domain.netlify.app
```

### 1.4 Domain erhalten
Nach dem Deployment erhältst du eine URL wie:
`https://discord-bot-production-xyz.up.railway.app`

**📋 NOTIERE DIR DIESE URL!** Du brauchst sie für Netlify.

---

## 🌐 **SCHRITT 2: Netlify.com Setup**

### 2.1 Account erstellen
1. Gehe zu [netlify.com](https://netlify.com)
2. "Sign up with GitHub"
3. Autorisiere Netlify für dein Repository

### 2.2 Site erstellen
1. **"New site from Git"** → **GitHub**
2. Wähle dein Repository aus
3. **Build settings**:
   - **Base directory**: `dashboard`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### 2.3 Environment Variables setzen
Netlify → Site settings → **Environment variables**:

```env
# API URL von Railway (aus Schritt 1.4)
VITE_API_BASE_URL=https://deine-railway-domain.railway.app

# Build Configuration
VITE_NODE_ENV=production
```

### 2.4 Domain erhalten
Nach dem Deployment erhältst du eine URL wie:
`https://amazing-dashboard-xyz.netlify.app`

---

## 🔗 **SCHRITT 3: URLs verknüpfen**

### 3.1 Railway CORS Update
Gehe zurück zu Railway → Variables und füge hinzu:
```env
FRONTEND_URL=https://deine-netlify-domain.netlify.app
```

### 3.2 Discord OAuth Update
1. Gehe zu [discord.com/developers/applications](https://discord.com/developers/applications)
2. Wähle deine Bot-Anwendung
3. **OAuth2** → **Redirects** → Füge hinzu:
   - `https://deine-netlify-domain.netlify.app/verify`

---

## ✅ **SCHRITT 4: Deployment testen**

### 4.1 Health Check
Öffne: `https://deine-railway-domain.railway.app/api/health`
Sollte zeigen:
```json
{
  "status": "healthy",
  "bot": {
    "connected": true,
    "guilds": 1
  }
}
```

### 4.2 Dashboard testen
Öffne: `https://deine-netlify-domain.netlify.app`
- Login sollte funktionieren
- API-Aufrufe sollten funktionieren
- Bot-Status sollte angezeigt werden

---

## 🔄 **SCHRITT 5: Continuous Deployment**

### Automatische Updates
```bash
git add .
git commit -m "🚀 Production ready"
git push origin main
```

Das triggert automatisch:
- **Railway**: Deployed Bot + APIs neu
- **Netlify**: Baut Dashboard neu

---

## 🐛 **Troubleshooting**

### Problem: CORS Errors
**Lösung**: Prüfe `FRONTEND_URL` in Railway Variables

### Problem: Bot offline
**Lösung**: Railway → Deployments → View Logs prüfen

### Problem: Dashboard Build Fehler
**Lösung**: Netlify → Deploys → [Failed] → View Logs

### Problem: API nicht erreichbar
**Lösung**: Health Check testen: `/api/health`

---

## 💡 **Custom Domains (Optional)**

### Railway Custom Domain
1. Railway → Settings → Domains
2. "Custom Domain" → `api.deinedomain.com`
3. DNS CNAME zu Railway URL

### Netlify Custom Domain
1. Netlify → Domain settings → Add custom domain
2. `dashboard.deinedomain.com`
3. DNS CNAME zu Netlify URL

---

## 📊 **Monitoring & Logs**

### Railway Monitoring
- **Logs**: Railway → Deployments → View Logs
- **Metrics**: Railway → Metrics
- **Health**: `https://api-url.com/api/health`

### Netlify Monitoring
- **Deploy Logs**: Netlify → Deploys
- **Functions**: Netlify → Functions

---

## 🔐 **Sicherheit Checklist**

- ✅ Environment Variables niemals in Code
- ✅ HTTPS überall aktiviert
- ✅ CORS richtig konfiguriert
- ✅ API Keys regelmäßig rotieren
- ✅ Health Checks implementiert

---

## 🎉 **Du bist fertig!**

Dein Discord Bot läuft jetzt in Production:
- **Bot + APIs**: `https://deine-railway-domain.railway.app`
- **Dashboard**: `https://deine-netlify-domain.netlify.app`

Alles wird automatisch deployed bei jedem `git push`! 🚀 