# 🎯 Valorant Crosshair System

Ein neues Discord-Bot-System zur Generierung von Valorant Crosshair-Bildern mit der HenrikDev-API.

## ✨ Features

- **Crosshair-Generierung**: Erstellt 1024x1024 Pixel Bilder von Valorant Crosshairs
- **Flexible Input**: Unterstützt sowohl einfache IDs als auch vollständige Crosshair-Codes
- **API-Integration**: Nutzt die bewährte HenrikDev-API (bereits für Valorant Stats verwendet)
- **Fehlerbehandlung**: Umfassende Fehlerbehandlung und benutzerfreundliche Nachrichten
- **Rate-Limiting**: Respektiert API-Limits (30-90 Requests/min je nach Key-Typ)

## 🚀 Setup

### 1. API-Key Konfiguration
Der Bot verwendet den bereits vorhandenen `HENRIKDEV_API_KEY` aus den Railway-Umgebungsvariablen.

### 2. Installation
Das System ist bereits vollständig integriert in:
- `valorant-crosshair-system.js` - Neue eigenständige Datei
- `index.js` - Integration in die Haupt-Bot-Datei

## 📋 Commands

### `/crosshair`
Generiert ein Valorant Crosshair-Bild aus einer ID oder einem Code.

**Parameter:**
- `id` (erforderlich): Crosshair-ID oder vollständiger Crosshair-Code

**Beispiele:**
```
/crosshair id:0;p=0;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0
/crosshair id:simple_crosshair_id
```

## 🔧 API-Details

### HenrikDev-API Endpoint
- **URL**: `https://api.henrikdev.xyz/valorant/v1/crosshair/generate`
- **Method**: GET
- **Parameter**: `id` (query parameter)
- **Response**: PNG-Bild (1024x1024px)

### Error-Codes
- **400**: Ungültige Crosshair-ID oder Parameter
- **403**: API-Zugriff verweigert (Wartung oder Rate-Limit)
- **404**: Crosshair nicht gefunden
- **408**: Timeout beim Abrufen der Daten
- **429**: Rate-Limit erreicht
- **503**: Valorant-API vorübergehend nicht verfügbar

## 🎮 Verwendung

1. **Crosshair-Code aus Valorant kopieren**:
   - In Valorant: Einstellungen → Crosshair → Code kopieren
   - Format: `0;p=0;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0`

2. **Discord-Command verwenden**:
   ```
   /crosshair id:0;p=0;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0
   ```

3. **Ergebnis**:
   - Embed mit Crosshair-Informationen
   - Hochauflösendes PNG-Bild des Crosshairs
   - Timestamp und User-Info

## 🔒 Sicherheit

- **Rate-Limiting**: Automatische Einhaltung der API-Limits
- **Input-Validation**: Überprüfung der Crosshair-Codes
- **Error-Handling**: Sichere Behandlung aller API-Fehler
- **Timeout-Protection**: 15-Sekunden-Timeout für API-Requests

## 📊 Logging

Das System loggt alle wichtigen Ereignisse:
- ✅ Erfolgreiche Crosshair-Generierung
- ❌ API-Fehler und deren Details
- 🔄 System-Initialisierung
- ⚠️ Fehlende API-Keys

## 🚀 Deployment

Das System ist bereits vollständig in die bestehende Bot-Infrastruktur integriert:
- Automatische Command-Registrierung beim Bot-Start
- Integration in die Event-Handler
- Nutzung der bestehenden Railway-Umgebungsvariablen

## 🆕 Changelog

### Version 1.0.0 (2025-01)
- ✨ Initiale Implementierung
- 🎯 Crosshair-Generierung mit HenrikDev-API
- 📋 `/crosshair` Slash-Command
- 🔧 Vollständige Integration in Bot-System
- 📚 Dokumentation und Error-Handling 