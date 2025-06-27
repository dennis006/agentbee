import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Gamepad2, 
  Users, 
  Mic, 
  Star, 
  Settings, 
  Activity, 
  BarChart3,
  Save,
  RotateCcw,
  Zap,
  Plus,
  Trophy,
  Target,
  Volume2,
  Shield,
  Calendar
} from 'lucide-react';
import { useToast, ToastContainer } from '../components/ui/toast';

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

// Badge component
const Badge: React.FC<{ children: React.ReactNode; className?: string; variant?: string }> = ({ children, className = '', variant = 'default' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant === 'outline' ? 'border border-purple-primary text-purple-primary bg-transparent' : 'bg-purple-primary text-white'} ${className}`}>
    {children}
  </span>
);

// Switch component
const Switch: React.FC<{ checked: boolean; onCheckedChange: (checked: boolean) => void; className?: string; id?: string }> = ({ checked, onCheckedChange, className = '', id }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    id={id}
    onClick={() => onCheckedChange(!checked)}
    className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-purple-primary' : 'bg-dark-bg'} ${className}`}
  >
    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

// Tooltip component
const Tooltip: React.FC<{ content: React.ReactNode; title?: string }> = ({ content, title }) => (
  <div className="relative group">
    <button
      type="button"
      className="text-blue-400 hover:text-blue-300 text-xs transition-colors duration-200"
    >
      ❓
    </button>
    
    {/* Tooltip */}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-purple-primary/30 rounded-lg text-xs text-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-lg min-w-max">
      {title && <div className="font-medium text-blue-400 mb-1">{title}</div>}
      <div>{content}</div>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
    </div>
  </div>
);

interface GamingSettings {
  enabled: boolean;
  autoChannelCreation: boolean;
  autoRoleCreation: boolean;
  
  // Smart Auto-Ping System
  autoPing: {
    enabled: boolean;
    minRank: string;
    maxPingRadius: number;
    cooldown: number;
    maxPingsPerHour: number;
    smartMatching: boolean;
    respectDND: boolean;
  };
  
  // One-Click Team-Join System
  quickJoin: {
    enabled: boolean;
    autoVoiceJoin: boolean;
    maxTeamSize: number;
    allowSpectators: boolean;
    autoRoleAssignment: boolean;
  };
  
  // Live Team-Tracker
  teamTracker: {
    enabled: boolean;
    showProgress: boolean;
    liveUpdates: boolean;
    trackStats: boolean;
    displayChannel: string;
  };
  
  // Auto-Voice-Channels
  voiceChannels: {
    enabled: boolean;
    autoCreate: boolean;
    autoDelete: boolean;
    namingScheme: string;
    maxChannels: number;
    categoryName: string;
  };
  
  // Reputation System
  reputation: {
    enabled: boolean;
    startingPoints: number;
    maxPoints: number;
    minPoints: number;
    goodTeammateReward: number;
    badTeammateDeduction: number;
    winBonus: number;
    lossDeduction: number;
    displayBadges: boolean;
    requireMinGames: number;
  };
}

interface GamingStats {
  systemEnabled: boolean;
  activeTeams: number;
  totalPlayers: number;
  scheduledGames: number;
  supportedGames: number;
  reputationEnabled: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: string;
  guildId: string;
  guildName: string;
}

const Gaming: React.FC = () => {
  const { toasts, success, error, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<GamingSettings>({
    enabled: true,
    autoChannelCreation: true,
    autoRoleCreation: true,
    autoPing: {
      enabled: true,
      minRank: 'Bronze 1',
      maxPingRadius: 5,
      cooldown: 30000,
      maxPingsPerHour: 10,
      smartMatching: true,
      respectDND: true
    },
    quickJoin: {
      enabled: true,
      autoVoiceJoin: true,
      maxTeamSize: 5,
      allowSpectators: true,
      autoRoleAssignment: true
    },
    teamTracker: {
      enabled: true,
      showProgress: true,
      liveUpdates: true,
      trackStats: true,
      displayChannel: 'team-status'
    },
    voiceChannels: {
      enabled: true,
      autoCreate: true,
      autoDelete: true,
      namingScheme: '{emoji} {game} Team #{number}',
      maxChannels: 10,
      categoryName: '🎮 Gaming Lobbys'
    },
    reputation: {
      enabled: true,
      startingPoints: 100,
      maxPoints: 1000,
      minPoints: 0,
      goodTeammateReward: 5,
      badTeammateDeduction: 10,
      winBonus: 3,
      lossDeduction: 1,
      displayBadges: true,
      requireMinGames: 5
    }
  });

  const [gamingStats, setGamingStats] = useState<GamingStats>({
    systemEnabled: true,
    activeTeams: 3,
    totalPlayers: 12,
    scheduledGames: 5,
    supportedGames: 4,
    reputationEnabled: true
  });

  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/gaming/status');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setGamingStats(data.stats);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Gaming-Daten:', error);
      showMessage('error', 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/gaming/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        showMessage('success', '✅ Gaming System Einstellungen gespeichert!');
        loadData();
      } else {
        showMessage('error', '❌ Fehler beim Speichern der Einstellungen');
      }
    } catch (err) {
      showMessage('error', '❌ Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  const toggleGamingSystem = async () => {
    try {
      const response = await fetch('/api/gaming/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, enabled: data.enabled }));
        showMessage('success', `✅ ${data.message}`);
      } else {
        showMessage('error', '❌ Fehler beim Umschalten des Gaming Systems');
      }
    } catch (err) {
      showMessage('error', '❌ Fehler beim Umschalten des Gaming Systems');
    }
  };

  const setupGameChannels = async (game: string) => {
    try {
      const response = await fetch(`/api/gaming/setup/${game}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        showMessage('success', `✅ ${data.message}`);
      } else {
        showMessage('error', '❌ Fehler beim Game Setup');
      }
    } catch (error) {
      showMessage('error', '❌ Fehler beim Game Setup');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      success(text);
    } else {
      error(text);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Gaming System...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 animate-fade-in relative">
      {/* Matrix Background Effects */}
      <MatrixBlocks density={20} />
      
      {/* Page Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Gamepad2 className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            Gaming System Management
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Verwalte das ultimative Gaming & Team System deines Servers wie ein Pro! 
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

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={toggleGamingSystem}
          className={`${settings.enabled ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent'} text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2`}
        >
          {settings.enabled ? <RotateCcw className="h-5 w-5" /> : <Gamepad2 className="h-5 w-5" />}
          <span>{settings.enabled ? 'Gaming System Deaktivieren' : 'Gaming System Aktivieren'}</span>
        </Button>
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-8 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>{saving ? 'Speichere...' : 'Einstellungen Speichern'}</span>
        </Button>
      </div>

      {/* System Status Badge */}
      <div className="flex justify-center">
        <Badge variant={settings.enabled ? "default" : "outline"} className="text-lg py-2 px-4">
          {settings.enabled ? '✅ Gaming System Aktiviert' : '❌ Gaming System Deaktiviert'}
        </Badge>
      </div>

      {/* Statistics Cards */}
      {gamingStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Aktive Teams</CardTitle>
              <Users className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{gamingStats.activeTeams}</div>
              <p className="text-xs text-dark-muted">
                {gamingStats.totalPlayers} Spieler online
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Unterstützte Spiele</CardTitle>
              <Gamepad2 className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{gamingStats.supportedGames}</div>
              <p className="text-xs text-dark-muted">
                Valorant, LoL, OW2, CS2
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Geplante Games</CardTitle>
              <Calendar className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{gamingStats.scheduledGames}</div>
              <p className="text-xs text-dark-muted">
                Automatische Planung
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Reputation System</CardTitle>
              <Star className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{gamingStats.reputationEnabled ? '✅' : '❌'}</div>
              <p className="text-xs text-dark-muted">
                Community basiert
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <div className="space-y-4">
        <div className="grid w-full grid-cols-7 bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 p-2 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'overview' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Übersicht</span>
          </button>
          <button
            onClick={() => setActiveTab('autoping')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'autoping' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Auto-Ping</span>
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'teams' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Team-Join</span>
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'tracker' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Team-Tracker</span>
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'voice' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'
            }`}
          >
            <Mic className="h-4 w-4" />
            <span>Voice-Channels</span>
          </button>
          <button
            onClick={() => setActiveTab('reputation')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'reputation' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'
            }`}
          >
            <Star className="h-4 w-4" />
            <span>Reputation</span>
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'games' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Games Setup</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-accent" />
                  Gaming System Übersicht
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Alle Gaming Features auf einen Blick
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-primary/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-6 h-6 text-purple-400" />
                      <h3 className="font-semibold text-dark-text">Smart Auto-Ping</h3>
                    </div>
                    <p className="text-sm text-dark-muted mb-2">Automatisches Matching von Spielern basierend auf Rang</p>
                    <div className="text-xs text-purple-300">
                      Status: {settings.autoPing.enabled ? '✅ Aktiv' : '❌ Inaktiv'}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg border border-green-primary/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-6 h-6 text-green-400" />
                      <h3 className="font-semibold text-dark-text">One-Click Team-Join</h3>
                    </div>
                    <p className="text-sm text-dark-muted mb-2">Sofortiges Beitreten zu Teams mit Voice-Integration</p>
                    <div className="text-xs text-green-300">
                      Status: {settings.quickJoin.enabled ? '✅ Aktiv' : '❌ Inaktiv'}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-lg border border-orange-primary/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="w-6 h-6 text-orange-400" />
                      <h3 className="font-semibold text-dark-text">Live Team-Tracker</h3>
                    </div>
                    <p className="text-sm text-dark-muted mb-2">Echtzeit-Verfolgung von Team-Progress und Statistiken</p>
                    <div className="text-xs text-orange-300">
                      Status: {settings.teamTracker.enabled ? '✅ Aktiv' : '❌ Inaktiv'}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg border border-blue-primary/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Mic className="w-6 h-6 text-blue-400" />
                      <h3 className="font-semibold text-dark-text">Auto-Voice-Channels</h3>
                    </div>
                    <p className="text-sm text-dark-muted mb-2">Automatische Voice-Channel Erstellung und Verwaltung</p>
                    <div className="text-xs text-blue-300">
                      Status: {settings.voiceChannels.enabled ? '✅ Aktiv' : '❌ Inaktiv'}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg border border-yellow-primary/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Star className="w-6 h-6 text-yellow-400" />
                      <h3 className="font-semibold text-dark-text">Reputation System</h3>
                    </div>
                    <p className="text-sm text-dark-muted mb-2">Community-basiertes Bewertungssystem für Spieler</p>
                    <div className="text-xs text-yellow-300">
                      Status: {settings.reputation.enabled ? '✅ Aktiv' : '❌ Inaktiv'}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-pink-600/20 to-purple-600/20 rounded-lg border border-pink-primary/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Settings className="w-6 h-6 text-pink-400" />
                      <h3 className="font-semibold text-dark-text">Games Setup</h3>
                    </div>
                    <p className="text-sm text-dark-muted mb-2">Automatische Channel und Rollen-Erstellung für Spiele</p>
                    <div className="text-xs text-pink-300">
                      Verfügbar: Valorant, LoL, OW2, CS2
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="space-y-6">
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-accent" />
                  🎮 Games Setup
                  <Tooltip 
                    title="🎮 Games Setup erklärt:"
                    content={
                      <div>
                        <div>Automatische Erstellung von Game-spezifischen Channels und Rollen:</div>
                        <div>• Erstellt Text- und Voice-Channels für jedes Spiel</div>
                        <div>• Erstellt Rollen für verschiedene Spieler-Positionen</div>
                        <div>• Konfiguriert Permissions für optimales Gaming-Erlebnis</div>
                        <div>• Fügt Emojis und passende Channel-Namen hinzu</div>
                      </div>
                    }
                  />
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Erstelle automatisch Channels und Rollen für unterstützte Spiele
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Auto Creation Settings */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Auto Channel-Erstellung</label>
                      <p className="text-xs text-dark-muted">Automatische Channel-Erstellung für Games</p>
                    </div>
                    <Switch
                      checked={settings.autoChannelCreation}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        autoChannelCreation: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Auto Rollen-Erstellung</label>
                      <p className="text-xs text-dark-muted">Automatische Rollen-Erstellung für Games</p>
                    </div>
                    <Switch
                      checked={settings.autoRoleCreation}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        autoRoleCreation: checked
                      }))}
                    />
                  </div>
                </div>

                {/* Supported Games */}
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { 
                      id: 'valorant', 
                      name: 'Valorant', 
                      emoji: '🎯', 
                      description: '5v5 Tactical Shooter',
                      roles: ['Controller', 'Duelist', 'Initiator', 'Sentinel']
                    },
                    { 
                      id: 'lol', 
                      name: 'League of Legends', 
                      emoji: '⭐', 
                      description: '5v5 MOBA',
                      roles: ['Top', 'Jungle', 'Mid', 'ADC', 'Support']
                    },
                    { 
                      id: 'overwatch', 
                      name: 'Overwatch 2', 
                      emoji: '🧡', 
                      description: '6v6 Hero Shooter',
                      roles: ['Tank', 'Damage', 'Support']
                    },
                    { 
                      id: 'csgo', 
                      name: 'Counter-Strike 2', 
                      emoji: '🔫', 
                      description: '5v5 Tactical FPS',
                      roles: ['IGL', 'Entry', 'Support', 'AWPer', 'Lurker']
                    }
                  ].map(game => (
                    <Card key={game.id} className="bg-dark-bg/50 border-purple-primary/20 hover:border-purple-primary/40 transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{game.emoji}</span>
                            <div>
                              <h3 className="font-medium text-dark-text">{game.name}</h3>
                              <p className="text-xs text-dark-muted">{game.description}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="text-xs text-dark-muted">Rollen:</div>
                          <div className="flex flex-wrap gap-1">
                            {game.roles.map(role => (
                              <Badge key={role} variant="outline" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button
                          onClick={() => setupGameChannels(game.id)}
                          className="w-full bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-2 px-4 rounded-lg shadow-neon transition-all duration-300 hover:scale-105"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Setup {game.name}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Andere Tabs können hier hinzugefügt werden */}
        {activeTab !== 'overview' && activeTab !== 'games' && (
          <div className="space-y-6">
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text">
                  {activeTab === 'autoping' && '🤖 Smart Auto-Ping System'}
                  {activeTab === 'teams' && '⚡ One-Click Team-Join'}
                  {activeTab === 'tracker' && '📊 Live Team-Tracker'}
                  {activeTab === 'voice' && '🎤 Auto-Voice-Channels'}
                  {activeTab === 'reputation' && '⭐ Reputation System'}
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Konfiguration für {activeTab} wird hier implementiert
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-dark-muted">Diese Konfiguration wird in der nächsten Version implementiert.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Gaming; 