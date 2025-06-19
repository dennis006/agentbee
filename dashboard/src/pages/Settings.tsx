import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Cog, Wrench, Sliders, Save, Shield, MessageSquare, Crown, Eye, Bot, Timer, Bell, RefreshCw, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { useToast, ToastContainer } from '../components/ui/toast'

// Matrix Blocks Komponente
const MatrixBlocks = ({ density = 30 }: { density?: number }) => {
  const blocks = Array.from({ length: density }, (_, i) => (
    <div
      key={i}
      className="matrix-block"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${2 + Math.random() * 3}s`
      }}
    />
  ));
  return <div className="matrix-blocks">{blocks}</div>;
};

interface BotSettings {
  // Bot Grundeinstellungen
  botName: string;
  botStatus: 'online' | 'idle' | 'dnd' | 'invisible';
  activityType: 'playing' | 'listening' | 'watching' | 'streaming';
  activityText: string;
  prefix: string;
  
  // Moderation
  autoModeration: boolean;
  antiSpam: boolean;
  maxWarnings: number;
  muteRole: string;
  logChannel: string;
  

  
  // Permissions
  adminRoles: string[];
  moderatorRoles: string[];
  djRole: string;
  
  // Advanced
  commandCooldown: number;
  deleteCommands: boolean;
  dmCommands: boolean;
  debugMode: boolean;
}

const Settings = () => {
  const { toasts, success, error: showError, removeToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [settings, setSettings] = useState<BotSettings>({
    // Bot Grundeinstellungen
    botName: 'CyberBot',
    botStatus: 'online',
    activityType: 'playing',
    activityText: 'mit dem Discord Server',
    prefix: '!',
    
    // Moderation
    autoModeration: true,
    antiSpam: true,
    maxWarnings: 3,
    muteRole: 'Muted',
    logChannel: 'mod-log',
    

    
    // Permissions
    adminRoles: ['Admin', 'Owner'],
    moderatorRoles: ['Moderator', 'Helper'],
    djRole: 'DJ',
    
    // Advanced
    commandCooldown: 3,
    deleteCommands: false,
    dmCommands: true,
    debugMode: false,
  });

  const [newAdminRole, setNewAdminRole] = useState('');
  const [newModRole, setNewModRole] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/bot/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Bot-Einstellungen:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const response = await fetch('/api/bot/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        success('🤖 Bot-Einstellungen erfolgreich gespeichert!');
      } else {
        showError('❌ Fehler beim Speichern der Bot-Einstellungen');
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      showError('❌ Netzwerkfehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const addAdminRole = () => {
    if (!newAdminRole.trim() || settings.adminRoles.includes(newAdminRole.trim())) return;
    setSettings({
      ...settings,
      adminRoles: [...settings.adminRoles, newAdminRole.trim()]
    });
    setNewAdminRole('');
  };

  const removeAdminRole = (role: string) => {
    setSettings({
      ...settings,
      adminRoles: settings.adminRoles.filter(r => r !== role)
    });
  };

  const addModRole = () => {
    if (!newModRole.trim() || settings.moderatorRoles.includes(newModRole.trim())) return;
    setSettings({
      ...settings,
      moderatorRoles: [...settings.moderatorRoles, newModRole.trim()]
    });
    setNewModRole('');
  };

  const removeModRole = (role: string) => {
    setSettings({
      ...settings,
      moderatorRoles: settings.moderatorRoles.filter(r => r !== role)
    });
  };

  return (
    <div className="space-y-8 p-6 animate-fade-in relative">
      {/* Matrix Background Effects */}
      <MatrixBlocks density={15} />
      
      {/* Page Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <SettingsIcon className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            Bot Settings
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Konfiguriere alle Aspekte deines Discord Bots! 
          <span className="ml-2 inline-block relative">
            <svg 
              className="w-6 h-6 animate-pulse hover:animate-bounce text-purple-400 hover:text-purple-300 transition-all duration-300 hover:scale-110 drop-shadow-lg" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <div className="absolute inset-0 animate-ping">
              <svg 
                className="w-6 h-6 text-purple-500 opacity-30" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </span>
        </div>
        <div className="w-32 h-1 bg-gradient-neon mx-auto mt-4 rounded-full animate-glow"></div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button
          onClick={saveSettings}
          disabled={loading}
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Speichere...</span>
            </>
          ) : saved ? (
            <>
              <CheckCircle className="h-5 w-5" />
              <span>Gespeichert!</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>Einstellungen Speichern</span>
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bot Grundeinstellungen */}
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
              <Bot className="w-6 h-6 text-cyan-400" />
              Bot Grundeinstellungen
            </CardTitle>
            <CardDescription className="text-dark-muted">
              Konfiguriere Name, Status und Aktivität des Bots
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Bot Name</label>
              <Input
                value={settings.botName}
                onChange={(e) => setSettings({...settings, botName: e.target.value})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-cyan-400"
                placeholder="CyberBot"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Bot Status</label>
              <select
                value={settings.botStatus}
                onChange={(e) => setSettings({...settings, botStatus: e.target.value as any})}
                className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text rounded-lg px-3 py-2 focus:border-cyan-400"
              >
                <option value="online">🟢 Online</option>
                <option value="idle">🟡 Abwesend</option>
                <option value="dnd">🔴 Nicht stören</option>
                <option value="invisible">⚫ Unsichtbar</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Aktivitäts-Typ</label>
              <select
                value={settings.activityType}
                onChange={(e) => setSettings({...settings, activityType: e.target.value as any})}
                className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text rounded-lg px-3 py-2 focus:border-cyan-400"
              >
                <option value="playing">🎮 Spielt</option>
                <option value="listening">🎵 Hört zu</option>
                <option value="watching">👀 Schaut</option>
                <option value="streaming">📺 Streamt</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Aktivitäts-Text</label>
              <Input
                value={settings.activityText}
                onChange={(e) => setSettings({...settings, activityText: e.target.value})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-cyan-400"
                placeholder="mit dem Discord Server"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Command Prefix</label>
              <Input
                value={settings.prefix}
                onChange={(e) => setSettings({...settings, prefix: e.target.value})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-cyan-400"
                placeholder="!"
                maxLength={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Moderation */}
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-400" />
              Moderation
            </CardTitle>
            <CardDescription className="text-dark-muted">
              Auto-Moderation und Sicherheitseinstellungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
              <div>
                <h4 className="font-medium text-dark-text">Auto-Moderation</h4>
                <p className="text-sm text-dark-muted">Automatische Überwachung von Nachrichten</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoModeration}
                onChange={(e) => setSettings({...settings, autoModeration: e.target.checked})}
                className="w-5 h-5 text-purple-primary bg-dark-bg border-purple-primary/30 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
              <div>
                <h4 className="font-medium text-dark-text">Anti-Spam</h4>
                <p className="text-sm text-dark-muted">Schutz vor Spam-Nachrichten</p>
              </div>
              <input
                type="checkbox"
                checked={settings.antiSpam}
                onChange={(e) => setSettings({...settings, antiSpam: e.target.checked})}
                className="w-5 h-5 text-purple-primary bg-dark-bg border-purple-primary/30 rounded"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Max. Verwarnungen</label>
              <Input
                type="number"
                value={settings.maxWarnings}
                onChange={(e) => setSettings({...settings, maxWarnings: parseInt(e.target.value) || 3})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-red-400"
                min="1"
                max="10"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Mute-Rolle</label>
              <Input
                value={settings.muteRole}
                onChange={(e) => setSettings({...settings, muteRole: e.target.value})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-red-400"
                placeholder="Muted"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Log-Channel</label>
              <Input
                value={settings.logChannel}
                onChange={(e) => setSettings({...settings, logChannel: e.target.value})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-red-400"
                placeholder="mod-log"
              />
            </div>
          </CardContent>
        </Card>



        {/* Berechtigungen */}
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
              <Crown className="w-6 h-6 text-orange-400" />
              Berechtigungen
            </CardTitle>
            <CardDescription className="text-dark-muted">
              Verwalte Rollen und Zugriffsrechte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Admin Rollen */}
            <div>
              <h4 className="font-medium text-dark-text mb-3">Admin-Rollen</h4>
              <div className="space-y-2 mb-3">
                {settings.adminRoles.map((role, index) => (
                  <div key={index} className="flex items-center justify-between bg-dark-bg/50 rounded-lg px-3 py-2">
                    <span className="text-dark-text">{role}</span>
                    <button
                      onClick={() => removeAdminRole(role)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value)}
                  className="flex-1 bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-orange-400"
                  placeholder="Neue Admin-Rolle..."
                  onKeyPress={(e) => e.key === 'Enter' && addAdminRole()}
                />
                <Button
                  onClick={addAdminRole}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={!newAdminRole.trim()}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Moderator Rollen */}
            <div>
              <h4 className="font-medium text-dark-text mb-3">Moderator-Rollen</h4>
              <div className="space-y-2 mb-3">
                {settings.moderatorRoles.map((role, index) => (
                  <div key={index} className="flex items-center justify-between bg-dark-bg/50 rounded-lg px-3 py-2">
                    <span className="text-dark-text">{role}</span>
                    <button
                      onClick={() => removeModRole(role)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newModRole}
                  onChange={(e) => setNewModRole(e.target.value)}
                  className="flex-1 bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-blue-400"
                  placeholder="Neue Moderator-Rolle..."
                  onKeyPress={(e) => e.key === 'Enter' && addModRole()}
                />
                <Button
                  onClick={addModRole}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!newModRole.trim()}
                >
                  +
                </Button>
              </div>
            </div>

            {/* DJ Rolle */}
            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">DJ-Rolle (für Musik-Commands)</label>
              <Input
                value={settings.djRole}
                onChange={(e) => setSettings({...settings, djRole: e.target.value})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-400"
                placeholder="DJ"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Settings */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Sliders className="w-6 h-6 text-cyan-400" />
            Erweiterte Einstellungen
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Feinabstimmung für erfahrene Nutzer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Command Cooldown (Sekunden)
              </label>
              <Input
                type="number"
                value={settings.commandCooldown}
                onChange={(e) => setSettings({...settings, commandCooldown: parseInt(e.target.value) || 3})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-cyan-400"
                min="0"
                max="60"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
              <div>
                <h4 className="font-medium text-dark-text flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Commands löschen
                </h4>
                <p className="text-sm text-dark-muted">Commands nach Ausführung entfernen</p>
              </div>
              <input
                type="checkbox"
                checked={settings.deleteCommands}
                onChange={(e) => setSettings({...settings, deleteCommands: e.target.checked})}
                className="w-5 h-5 text-cyan-400 bg-dark-bg border-purple-primary/30 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
              <div>
                <h4 className="font-medium text-dark-text flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  DM Commands
                </h4>
                <p className="text-sm text-dark-muted">Commands in privaten Nachrichten</p>
              </div>
              <input
                type="checkbox"
                checked={settings.dmCommands}
                onChange={(e) => setSettings({...settings, dmCommands: e.target.checked})}
                className="w-5 h-5 text-green-400 bg-dark-bg border-purple-primary/30 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
              <div>
                <h4 className="font-medium text-dark-text flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Debug-Modus
                </h4>
                <p className="text-sm text-dark-muted">Erweiterte Logs und Debugging</p>
              </div>
              <input
                type="checkbox"
                checked={settings.debugMode}
                onChange={(e) => setSettings({...settings, debugMode: e.target.checked})}
                className="w-5 h-5 text-yellow-400 bg-dark-bg border-purple-primary/30 rounded"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

export default Settings 