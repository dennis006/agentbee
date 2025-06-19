# 🚀 Quick Start Deployment (5 Minuten)

## 📋 Voraussetzungen
- GitHub Account
- Discord Bot Token 
- Alle API Keys bereit

## ⚡ SCHRITT 1: Railway (2 Min)
1. **[railway.app](https://railway.app)** → Sign up with GitHub
2. **"Deploy from GitHub repo"** → Wähle dein Repository
3. **Variables** setzen:
   ```
   DISCORD_TOKEN=dein_token
   DISCORD_CLIENT_ID=deine_id  
   DISCORD_CLIENT_SECRET=dein_secret
   OPENAI_API_KEY=dein_key
   NODE_ENV=production
   ```
4. **Notiere Railway URL**: `https://xyz.railway.app`

## ⚡ SCHRITT 2: Netlify (2 Min)
1. **[netlify.com](https://netlify.com)** → Sign up with GitHub
2. **"New site from Git"** → Wähle Repository
3. **Build Settings**:
   - Base directory: `dashboard`
   - Build command: `npm run build` 
   - Publish directory: `dist`
4. **Environment variables**:
   ```
   VITE_API_BASE_URL=https://deine-railway-url.railway.app
   ```
5. **Notiere Netlify URL**: `https://xyz.netlify.app`

## ⚡ SCHRITT 3: Verknüpfen (1 Min)
1. **Railway** → Variables → Hinzufügen:
   ```
   FRONTEND_URL=https://deine-netlify-url.netlify.app
   ```
2. **Discord Developer Portal** → OAuth2 → Redirects:
   ```
   https://deine-netlify-url.netlify.app/verify
   ```

## ✅ Fertig!
- **Health Check**: `https://railway-url.railway.app/api/health`
- **Dashboard**: `https://netlify-url.netlify.app`

---

## 🔧 Alle Environment Variables für Railway:

```env
# Discord (REQUIRED)
DISCORD_TOKEN=dein_discord_bot_token
DISCORD_CLIENT_ID=deine_discord_client_id
DISCORD_CLIENT_SECRET=dein_discord_client_secret

# OpenAI (REQUIRED)
OPENAI_API_KEY=dein_openai_api_key

# Optional APIs
TWITCH_CLIENT_ID=dein_twitch_client_id
TWITCH_CLIENT_SECRET=dein_twitch_client_secret
VALORANT_API_TOKEN=dein_valorant_token
YOUTUBE_API_KEY=dein_youtube_key

# Production Config (REQUIRED)
NODE_ENV=production
FRONTEND_URL=https://deine-netlify-domain.netlify.app
```

## 🎯 Bei Problemen:
1. **Railway Logs** → Deployments → View Logs
2. **Netlify Logs** → Deploys → [Latest] → View Logs  
3. **CORS Errors** → Prüfe `FRONTEND_URL` in Railway
4. **Health Check** → `https://api-url.com/api/health`

## 🔄 Updates deployen:
```bash
git add .
git commit -m "Update"
git push
# Automatisches Deployment auf beiden Plattformen!
```

**Das war's! 🎉** 