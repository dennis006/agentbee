# 🎤 LFG Auto Voice Join - Anleitung

## Überblick

Die **Auto Voice Join** Funktion ermöglicht es, dass neue Spieler automatisch in den Voice Channel des Team Owners verschoben werden, wenn dieser bereits in einem Voice Channel ist.

## 🚀 Funktionsweise

### Automatischer Ablauf:

1. **Spieler erstellt LFG Post**: Team Owner postet ein LFG in den konfigurierten Channel
2. **Owner tritt Voice Channel bei**: Der Team Owner ist bereits in einem Voice Channel
3. **Neuer Spieler tritt Team bei**: Ein anderer Spieler klickt auf "Beitreten" Button
4. **Automatische Verschiebung**: Der neue Spieler wird automatisch in den Voice Channel des Owners verschoben

### Intelligente Logik:

- ✅ **Berechtigung prüfen**: Prüft ob neuer Spieler dem Voice Channel beitreten darf
- ✅ **Bereits verbunden**: Ignoriert Spieler die bereits in einem Voice Channel sind
- ✅ **Feedback**: Sendet informative Nachrichten an beide Spieler
- ✅ **Fehlerbehandlung**: Graceful handling wenn etwas schiefgeht

## 🛠️ Konfiguration

### Dashboard Settings

Gehe zu **Dashboard → Gaming → Erweiterte Konfiguration → Interactive Features**

**Auto Voice Join Toggle:**
- **Ein**: Neue Spieler werden automatisch verschoben
- **Aus**: Keine automatische Verschiebung

### Voraussetzungen

1. **LFG System aktiviert**: Grundlegendes LFG System muss funktionieren
2. **Button Interaktionen**: `enableButtons` muss aktiviert sein
3. **Bot Berechtigung**: Bot braucht "Move Members" Permission

## 📋 Benutzer-Erfahrung

### Für den neuen Spieler:

**Erfolgreiche Verschiebung:**
```
🎤 Automatisch verbunden!

Du wurdest automatisch zu Allgemein verschoben, da der Team Owner Marvin Beellgrounder bereits dort ist.

Viel Spaß beim Gaming! 🎮
```

**Keine Berechtigung:**
```
🎤 Voice Channel Info

Der Team Owner Marvin Beellgrounder ist bereits in Allgemein, aber du hast keine Berechtigung diesem Channel beizutreten.

Bitte den Owner um Einladung oder nutze den Voice Channel Button.
```

### Für den Team Owner:

**DM Benachrichtigung:**
```
🎤 Auto Voice Join!
Nico wurde automatisch zu deinem Voice Channel verschoben!

📍 Voice Channel: Allgemein
🎮 Team: Valorant (3 Spieler)
```

## 🔧 Technische Details

### Code-Integration

**gaming.js - handleLFGJoin():**
```javascript
// Prüfe Auto Voice Join (wenn Owner bereits in Voice Channel ist)
if (settings.enableAutoVoiceJoin) {
    await checkAndJoinOwnerVoiceChannel(interaction, lfgPost, userId);
}
```

**Neue Funktion:**
```javascript
async function checkAndJoinOwnerVoiceChannel(interaction, lfgPost, newUserId)
```

### Supabase Schema

**Neues Feld in `lfg_settings`:**
```sql
enable_auto_voice_join BOOLEAN DEFAULT true
```

### Dashboard Integration

**Gaming.tsx - Neue Switch:**
```typescript
enableAutoVoiceJoin: boolean;
```

## 🎯 Anwendungsfälle

### Perfekt für:
- **Valorant Teams**: 5er Teams die schnell zusammenfinden wollen
- **CS2 Matches**: Direkt in Voice Channel für Taktik-Besprechung
- **League of Legends**: Koordination vor dem Match
- **Spontane Sessions**: Schneller Einstieg ohne manuelle Voice-Navigation

### Beispiel-Szenario:

1. **Marvin** postet: "Valorant suchen noch 4/5 ranked"
2. **Marvin** tritt seinem Voice Channel "Gaming Lobby 1" bei
3. **Nico** klickt "Beitreten" → wird automatisch zu "Gaming Lobby 1" verschoben
4. **Mettiface** klickt "Beitreten" → wird automatisch zu "Gaming Lobby 1" verschoben
5. **Team ist komplett** und kann sofort loslegen!

## 🔒 Sicherheit & Berechtigungen

### Bot Permissions:
- `MOVE_MEMBERS`: Zum Verschieben von Usern zwischen Voice Channels
- `VIEW_CHANNEL`: Zum Prüfen der Voice Channel Berechtigungen
- `SEND_MESSAGES`: Für Feedback-Nachrichten

### User Permissions:
- Neue Spieler müssen `CONNECT` Permission für Owner Voice Channel haben
- Respektiert alle bestehenden Channel-Berechtigungen
- Keine Umgehung von Server-Sicherheitsregeln

## 🐛 Troubleshooting

### Häufige Probleme:

**"Konnte nicht verschieben":**
- Bot hat keine Move Members Permission
- User ist bereits in anderem Voice Channel
- Voice Channel ist voll (User Limit erreicht)

**"Keine Berechtigung":**
- Voice Channel ist privat/rolle-beschränkt
- User hat Connect Permission nicht
- Channel ist passwort-geschützt

### Debug-Logs:

```
🔍 Team Owner nicht im Server gefunden
🔍 Team Owner ist nicht in einem Voice Channel  
🔍 Neuer Spieler ist bereits in einem Voice Channel
🔍 Neuer Spieler hat keine Berechtigung für Owner Voice Channel
✅ MaxMustermann automatisch zu Gaming Lobby verschoben
```

## 📊 Statistiken

Die Funktion integriert sich nahtlos in das bestehende LFG-Statistik-System:
- Tracking von erfolgreichen Auto-Joins
- Fehler-Monitoring
- User-Activity-Logs

## 🚀 Zukunfts-Features

Mögliche Erweiterungen:
- **Smart Channel Detection**: Automatische Erkennung des besten Voice Channels
- **Queue System**: Warteschlange wenn Voice Channel voll ist
- **Team Preferences**: User können Auto-Join per User deaktivieren
- **Advanced Notifications**: Mehr detaillierte Benachrichtigungen

---

**Entwickelt für AgentBee Discord Bot**  
*Maximiere die Gaming-Experience deines Servers! 🐝* 