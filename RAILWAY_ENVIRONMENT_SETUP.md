# Railway Environment Variables Setup

## 🚨 Kritische Environment Variables für Valorant News

Gehen Sie zu Ihrem Railway Dashboard und setzen Sie folgende Environment Variables:

### ✅ Supabase (ERFORDERLICH für News-System)
```
SUPABASE_URL=https://ihr-projekt.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ✅ Valorant API (BEREITS FUNKTIONIERT)
```
HENRIK_API_KEY=HDEV-xyz...
# ODER
VALORANT_API_TOKEN=HDEV-xyz...
```

## 🔍 Wie finde ich meine Supabase Credentials?

1. **Supabase Dashboard**: https://app.supabase.com
2. **Projekt auswählen**
3. **Settings → API**
4. **Project URL** = SUPABASE_URL
5. **service_role key** = SUPABASE_SERVICE_KEY  
6. **anon public key** = SUPABASE_ANON_KEY

## 🚀 Nach dem Setzen der Variables:

1. **Railway Deployment neu starten**
2. **Valorant News System funktioniert automatisch**
3. **Keine weiteren Emergency Fixes nötig**

## ⚡ Test-Befehle nach Setup:

```bash
# Supabase-Verbindung testen
node test-xp-supabase.js

# Valorant News System testen  
node test-valorant-news-debug.js
```

## 📋 Status Check:
- ✅ Henrik API: FUNKTIONIERT (488 News verfügbar)
- ❌ Supabase: FEHLT (Railway Environment Variables setzen)
- ✅ Discord Bot: FUNKTIONIERT (News wurden gepostet)

**Nach dem Setzen der Supabase Variables funktioniert alles automatisch!** 