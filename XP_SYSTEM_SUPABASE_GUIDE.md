# 🎯 XP-System mit Supabase Integration

Dieses Dokument beschreibt das erweiterte XP-System mit vollständiger Supabase-Integration für Settings, User-Daten, Level-Rollen und Meilenstein-Belohnungen.

## 🚀 Features

### ✅ Vollständige Supabase Integration
- **Settings**: Alle XP-Einstellungen werden in Supabase gespeichert
- **User-Daten**: XP, Level, Statistiken persistent in der Datenbank
- **Level-Rollen**: Dashboard-verwaltbare Level-Rollen mit automatischer Zuweisung
- **Meilenstein-Belohnungen**: Dynamische Belohnungen für XP-Meilensteine

### 🔄 Automatischer Fallback
- **JSON-Kompatibilität**: Funktioniert weiterhin ohne Supabase
- **Automatische Migration**: Bestehende JSON-Daten werden erkannt
- **Fehlerresistenz**: Bei Supabase-Problemen Fallback zu JSON

### 🎮 Dashboard-Integration
- **Live-Bearbeitung**: Level-Rollen und Meilensteine über Dashboard verwalten
- **Echtzeit-Updates**: Änderungen werden sofort gespeichert
- **Validierung**: Keine Duplikate, automatische Sortierung
- **API-Endpunkte**: REST-API für CRUD-Operationen

## 📋 Setup-Anleitung

### 1. SQL-Migration ausführen

```sql
-- Führe BEIDE Migrationen in Supabase aus:
-- 1. xp_users_supabase_migration.sql (für User-Daten)
-- 2. xp_settings_supabase_migration.sql (für Settings, Rollen, Meilensteine)
```

### 2. Environment Variables setzen

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
# Oder alternativ:
SUPABASE_ANON_KEY=your_anon_key
```

### 3. Verbindung testen

```bash
# Teste ob alle Tabellen existieren und Supabase funktioniert
node test-xp-supabase.js
```

### 4. Bot neustarten

Der Bot erkennt automatisch Supabase und migriert zu Hybrid-Modus.

## 🗄️ Datenbank-Schema

### `xp_settings` - Haupt-Settings
```sql
CREATE TABLE xp_settings (
    id UUID PRIMARY KEY,
    guild_id TEXT UNIQUE,
    enabled BOOLEAN DEFAULT true,
    -- Message XP Settings
    message_xp_min INTEGER DEFAULT 5,
    message_xp_max INTEGER DEFAULT 15,
    message_xp_cooldown INTEGER DEFAULT 60000,
    -- Voice XP Settings
    voice_xp_base INTEGER DEFAULT 2,
    -- Level System
    level_system_base_xp INTEGER DEFAULT 100,
    level_system_multiplier DECIMAL(3,2) DEFAULT 1.5,
    -- ... weitere Felder
);
```

### `xp_level_roles` - Level-Rollen
```sql
CREATE TABLE xp_level_roles (
    id UUID PRIMARY KEY,
    guild_id TEXT,
    level INTEGER,
    role_id TEXT,
    role_name TEXT,
    UNIQUE(guild_id, level),
    UNIQUE(guild_id, role_id)
);
```

### `xp_milestone_rewards` - Meilenstein-Belohnungen
```sql
CREATE TABLE xp_milestone_rewards (
    id UUID PRIMARY KEY,
    guild_id TEXT,
    xp_required INTEGER,
    reward_name TEXT,
    UNIQUE(guild_id, xp_required)
);
```

## 🔧 API-Endpunkte

### Level-Rollen verwalten

```javascript
// Level-Rolle hinzufügen
POST /api/xp/level-roles
{
    "level": 10,
    "roleId": "1234567890123456789",
    "roleName": "⚡ Level 10"
}

// Level-Rolle entfernen
DELETE /api/xp/level-roles/10
```

### Meilenstein-Belohnungen verwalten

```javascript
// Meilenstein-Belohnung hinzufügen
POST /api/xp/milestone-rewards
{
    "xp": 1000,
    "reward": "💬 Aktives Mitglied"
}

// Meilenstein-Belohnung entfernen
DELETE /api/xp/milestone-rewards/1000
```

### Settings speichern

```javascript
// Alle Settings speichern
POST /api/xp/settings
{
    "enabled": true,
    "messageXP": { "min": 5, "max": 15 },
    "rewards": {
        "levelRoles": [...],
        "milestoneRewards": [...]
    }
    // ... weitere Settings
}
```

## 🎯 Dashboard-Integration

### Level-Rollen Verwaltung

```typescript
// Level-Rolle hinzufügen (React Component)
const addLevelRole = async () => {
    const response = await fetch('/api/xp/level-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            level: newRole.level,
            roleId: newRole.roleId,
            roleName: newRole.roleName
        })
    });
    
    if (response.ok) {
        const data = await response.json();
        setLevelRoles(data.levelRoles);
        showSuccess('Level-Rolle hinzugefügt!');
    }
};

// Level-Rolle entfernen
const removeLevelRole = async (level) => {
    const response = await fetch(`/api/xp/level-roles/${level}`, {
        method: 'DELETE'
    });
    
    if (response.ok) {
        const data = await response.json();
        setLevelRoles(data.levelRoles);
        showSuccess(`Level-Rolle für Level ${level} entfernt!`);
    }
};
```

### Meilenstein-Belohnungen Verwaltung

```typescript
// Meilenstein hinzufügen
const addMilestone = async () => {
    const response = await fetch('/api/xp/milestone-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            xp: newMilestone.xp,
            reward: newMilestone.reward
        })
    });
    
    if (response.ok) {
        const data = await response.json();
        setMilestoneRewards(data.milestoneRewards);
        showSuccess('Meilenstein-Belohnung hinzugefügt!');
    }
};
```

## 💾 Speicherungs-Hierarchie

### 1. Supabase (Priorität 1)
- **Settings**: `xp_settings`, `xp_level_roles`, `xp_milestone_rewards` Tabellen
- **User-Daten**: `xp_users` Tabelle
- **Performance**: Einzelne User-Updates, Batch-Settings-Updates
- **Skalierung**: Multi-Guild Support, RLS Policies

### 2. JSON-Fallback (Priorität 2)
- **Settings**: `xp-settings.json`
- **User-Daten**: `xp-data.json`
- **Kompatibilität**: Bestehende Installationen funktionieren weiter
- **Migration**: Automatisch wenn Supabase verfügbar wird

## 🔄 Migration & Kompatibilität

### Automatische Migration
```javascript
// Das System erkennt automatisch:
// 1. Supabase verfügbar? -> Migriere zu Hybrid-Modus
// 2. Bestehende JSON-Daten? -> Importiere in Supabase
// 3. Supabase Fehler? -> Fallback zu JSON
// 4. Neue Installation? -> Verwende Supabase wenn verfügbar
```

### Rückwärtskompatibilität
- **Alle bestehenden Funktionen** bleiben erhalten
- **JSON-Settings** werden weiterhin unterstützt
- **Keine Breaking Changes** für bestehende Installationen
- **Schrittweise Migration** möglich

## 📊 Performance-Optimierungen

### Supabase-Optimierungen
- **Indexierte Queries**: Optimierte Datenbankabfragen
- **RLS Policies**: Row Level Security für Sicherheit
- **Batch Operations**: Effiziente Level-Rollen/Meilenstein-Updates
- **Connection Pooling**: Wiederverwendung von Datenbankverbindungen

### Memory-Cache
- **User-Daten**: In-Memory Cache für schnelle XP-Updates
- **Settings-Cache**: Reduzierte Datenbankabfragen
- **Dirty Flag**: Nur geänderte Daten werden gespeichert

## 🧪 Testing

### Verbindungstest
```bash
node test-xp-supabase.js
```

### Dashboard-Test
1. Gehe zu `/xp` Dashboard-Seite
2. Teste Level-Rollen hinzufügen/entfernen
3. Teste Meilenstein-Belohnungen verwalten
4. Speichere Settings und prüfe Supabase

### Bot-Test
1. Schreibe Nachrichten für XP
2. Prüfe Level-Up-Nachrichten
3. Prüfe Rollen-Zuweisung
4. Prüfe Meilenstein-Ankündigungen

## ❓ Troubleshooting

### Supabase-Verbindung fehlt
```bash
# Prüfe Environment Variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# Teste Verbindung
node test-xp-supabase.js
```

### Tabellen fehlen
```sql
-- Führe Migrationen aus:
-- 1. xp_users_supabase_migration.sql
-- 2. xp_settings_supabase_migration.sql
```

### Level-Up-Nachrichten funktionieren nicht
```javascript
// Debug-Logs prüfen:
// "🎉 Level-Up erkannt: Username 1 -> 2"
// "handleLevelUp aufgerufen: Username 1 -> 2"
// "Gefundener Channel: general"
```

### Dashboard-Fehler
```javascript
// Browser-Konsole prüfen
// Netzwerk-Tab für API-Fehler überprüfen
// Bot-Logs für Backend-Fehler checken
```

## 🎉 Erfolg!

Nach der Einrichtung hast du:
- ✅ **Persistente XP-Daten** die Server-Neustarts überleben
- ✅ **Dashboard-verwaltbare Level-Rollen** ohne Code-Änderungen
- ✅ **Flexible Meilenstein-Belohnungen** für Community-Engagement
- ✅ **Skalierbare Multi-Guild-Architektur** für Bot-Wachstum
- ✅ **Automatische Fallbacks** für maximale Zuverlässigkeit

Das XP-System ist jetzt production-ready und skaliert mit deinem Discord-Bot! 🚀 