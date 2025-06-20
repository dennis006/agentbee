# 🍪 YouTube-Cookies Setup für Discord Bot

## 🎯 Lösung gegen YouTube Anti-Bot-Maßnahmen

Diese Anleitung zeigt dir, wie du deine eigenen YouTube-Cookies verwendest, um YouTube's Anti-Bot-Schutz zu umgehen und wieder problemlos Musik zu streamen.

## 📋 Voraussetzungen

- **Browser-Erweiterung:** EditThisCookie (Chrome/Edge) oder ähnliche
- **YouTube-Account:** Eingeloggt in YouTube
- **Railway Account:** Für Environment Variables

## 🔧 Schritt 1: YouTube-Cookies extrahieren

### A) Mit EditThisCookie (empfohlen)

1. **Installiere EditThisCookie:**
   - Chrome: [EditThisCookie Extension](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg)
   - Edge: Über Chrome Web Store installierbar

2. **Gehe zu YouTube:**
   - Öffne [youtube.com](https://youtube.com) 
   - **Wichtig:** Stelle sicher, dass du eingeloggt bist!

3. **Öffne EditThisCookie:**
   - Klicke auf das Cookie-Symbol in der Browser-Toolbar
   - Du siehst eine Liste aller YouTube-Cookies

4. **Benötigte Cookies kopieren:**
   
   Kopiere die **Values** (nicht die Namen!) folgender Cookies:
   
   | Cookie-Name | Beschreibung | Beispiel |
   |-------------|-------------|----------|
   | `SID` | Session ID | `g.a000yAqIg-skZZRGgp2i7aZVKuEaEqGC...` |
   | `SSID` | Secure Session ID | `AwkmwQhOJcUcwog0` |
   | `HSID` | HTTP Session ID | `ASQGqhZ3jKr0A-Mh8` |
   | `APISID` | API Session ID | `vid0UYuz29c7AMAn/AP...` |
   | `SAPISID` | Secure API Session ID | `VCFXW7bm_awLwPKY/AZYZsUAKE_DbQJdRA` |
   | `LOGIN_INFO` | Login Information | `AFmmF2swRQIgMr4aDDzpuVkCkMDLfs0MxZV...` |

### B) Alternative: Browser DevTools

1. **Öffne DevTools:** `F12` oder `Ctrl+Shift+I`
2. **Gehe zu Application/Storage Tab**
3. **Erweitere Cookies → https://youtube.com**
4. **Kopiere die Values der benötigten Cookies**

## 🚀 Schritt 2: Railway Environment Variables setzen

### 1. Railway Dashboard öffnen
- Gehe zu [railway.app](https://railway.app)
- Öffne dein Bot-Projekt

### 2. Environment Variables hinzufügen
- Klicke auf **Variables** Tab
- Füge folgende Variables hinzu:

```env
YOUTUBE_SID=g.a000yAqIg-skZZRGgp2i7aZVKuEaEqGC-ClOVR424D1U39_kFwVFLlv...
YOUTUBE_SSID=AwkmwQhOJcUcwog0
YOUTUBE_HSID=ASQGqhZ3jKr0A-Mh8
YOUTUBE_APISID=vid0UYuz29c7AMAn/AP--Ne3JwVkGwLHGt
YOUTUBE_SAPISID=VCFXW7bm_awLwPKY/AZYZsUAKE_DbQJdRA
YOUTUBE_LOGIN_INFO=AFmmF2swRQIgMr4aDDzpuVkCkMDLfs0MxZVpF6FgCTxxwVHqkURZl6wCIQC7ZinlDQ_x-8KB_yHwF9ySDOW9y4RaEPDYAVJLRQrtEg:QUQ3MjNmeXF0b0JxVzZuSXB4MHJ5ZjZvZEdwSFpwWFB3LUs0RTV4cGNBcFRRQ3hiR2JlTUNIRjJYY3h6R0VZYjRBck1BX1BvX3IwRWJVVFJSNkpmLXBjQno2c3U2V0psQlVPQUg1dlNWeURRTUNlWFV6ZklzZ0VHY09hUzRHakNrVWxRTDYzNG5jYTJtM1NITl9xQzRqZmJIbWR2UTVaVWM1NjNFTDd0UjNNYU5LY3pqOHdBckhweVdoSHpvOW5CM2NaTnNjcUF0WXB6R3pmUjVlQUxHVk40c0pHWWNPZ01NZw==
```

### 3. Bot neu starten
- Klicke auf **Deploy** oder warte auf automatischen Neustart
- Der Bot verwendet jetzt deine Cookies für YouTube-Zugriff

## ✅ Schritt 3: Testen

### Was du sehen solltest:
```
🎵 Initialisiere play-dl mit YouTube-Cookies...
🍪 YouTube-Cookies gefunden - setze Cookie-Authentifizierung...
🔧 Cookies gesetzt für: SID, SSID, HSID, APISID, SAPISID, LOGIN_INFO
✅ play-dl mit YouTube-Cookies initialisiert
🔓 YouTube Anti-Bot-Schutz erfolgreich umgangen!
🎯 Bot kann jetzt authentifizierte YouTube-Anfragen stellen
```

### Test-Befehl:
```
!play Shape of You Ed Sheeran
```

## 🔄 Cookie-Aktualisierung

### Wann Cookies erneuern?
- **YouTube meldet Fehler:** "Sign in to confirm you're not a bot"
- **Regelmäßig:** Alle 1-2 Wochen zur Sicherheit
- **Nach Passwort-Änderung:** Sofort neue Cookies extrahieren

### Schnelle Aktualisierung:
1. Neue Cookies aus Browser extrahieren
2. Railway Variables mit neuen Werten überschreiben
3. Bot automatisch neu starten lassen

## 🛡️ Sicherheit

### ✅ Sicher:
- **Railway Environment Variables** sind privat und verschlüsselt
- **Nur dein Bot** hat Zugriff auf die Cookies
- **Keine Logs** der Cookie-Werte in Railway

### ⚠️ Wichtig:
- **Teile deine Cookies niemals** in Discord/GitHub/öffentlich
- **Nutze einen separaten YouTube-Account** (empfohlen)
- **Ändere Passwort** wenn Cookies kompromittiert wurden

## 🔧 Troubleshooting

### Problem: "YouTube-Cookies nicht vollständig"
**Lösung:** Prüfe ob alle 6 Environment Variables gesetzt sind

### Problem: "Cookie-Initialisierung fehlgeschlagen"
**Lösung:** 
1. Cookies neu extrahieren (möglicherweise abgelaufen)
2. YouTube-Account-Status prüfen
3. 5-10 Minuten warten und erneut versuchen

### Problem: Immer noch "Sign in to confirm you're not a bot"
**Lösung:**
1. **Mit anderem Browser** neue Cookies extrahieren
2. **YouTube-Account wechseln** (falls der aktuelle Account Probleme hat)
3. **VPN verwenden** beim Cookie-Extrahieren (falls IP-geblockt)

## 📊 Erwartete Verbesserung

### Vorher (ohne Cookies):
```
❌ Sign in to confirm you're not a bot
❌ UnrecoverableError: Video unavailable  
📻 Radio-Fallback aktiviert
```

### Nachher (mit Cookies):
```
✅ YouTube Video gefunden: Shape of You - Ed Sheeran
✅ play-dl Stream erfolgreich erstellt
🎵 Spielt jetzt: Shape of You - Ed Sheeran
```

## 🎉 Erfolgsmeldung

Wenn alles funktioniert, solltest du diese Logs sehen:
```
🍪 YouTube-Cookies gefunden - setze Cookie-Authentifizierung...
✅ play-dl mit YouTube-Cookies initialisiert
🔓 YouTube Anti-Bot-Schutz erfolgreich umgangen!
📡 Versuche play-dl Stream (Versuch 1/3)...
✅ play-dl Stream erfolgreich erstellt (Versuch 1, Qualität 2)
🎵 Spielt jetzt: [Dein Song]
```

---

## 💡 Pro-Tipps

1. **Backup-Account:** Verwende einen zweiten YouTube-Account als Backup
2. **Automatisierung:** Scripte können Cookies automatisch erneuern (fortgeschritten)
3. **Monitoring:** Überwache Bot-Logs auf Cookie-Probleme
4. **Updates:** Halte play-dl aktuell für beste Kompatibilität

---

**🎯 Ziel erreicht:** Dein Bot kann jetzt wieder problemlos YouTube-Musik streamen! 🎉 