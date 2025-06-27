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
  Clock, 
  Hash, 
  BarChart3,
  CheckCircle2,
  XCircle,
  Calendar,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Save,
  Send,
  RotateCcw,
  Crown,
  Zap,
  Plus,
  Trash2,
  RefreshCw,
  Trophy,
  Target,
  Volume2,
  Shield
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
const Badge: React.FC<{ children: React.ReactNode; className?: string; variant?: string }> = ({ 
  children, 
  className = '', 
  variant = 'default' 
}) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    variant === 'outline' 
      ? 'border border-purple-primary text-purple-primary bg-transparent' 
      : 'bg-purple-primary text-white'
  } ${className}`}>
    {children}
  </span>
);

// Switch component
const Switch: React.FC<{ 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void; 
  className?: string; 
  id?: string 
}> = ({ checked, onCheckedChange, className = '', id }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    id={id}
    onClick={() => onCheckedChange(!checked)}
    className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
      checked ? 'bg-purple-primary' : 'bg-dark-bg'
    } ${className}`}
  >
    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
      checked ? 'translate-x-5' : 'translate-x-0'
    }`} />
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
    
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-purple-primary/30 rounded-lg text-xs text-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-lg min-w-max">
      {title && <div className="font-medium text-blue-400 mb-1">{title}</div>}
      <div>{content}</div>
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

  const [settings, setSettings] = useState<GamingSettings>({
    enabled: true,
    autoChannelCreation: true,
    autoRoleCreation: true,
    
    autoPing: {
      enabled: true,
      minRank: 'Bronze',
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

  const [gamingStats, setGamingStats] = useState<GamingStats | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, channelsRes] = await Promise.all([
        fetch('/api/gaming/status'),
        fetch('/api/channels')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setGamingStats(statsData.stats);
          if (statsData.settings) {
            setSettings(statsData.settings);
          }
        }
      }

      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();
        const textChannels = channelsData.channels?.filter((ch: Channel) => ch.type === 'text') || [];
        setChannels(textChannels);
      }

    } catch (error) {
      console.error('Fehler beim Laden der Gaming Daten:', error);
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
        const data = await response.json();
        if (data.success) {
          showMessage('success', 'Gaming System Einstellungen gespeichert');
          setSettings(data.settings);
        } else {
          showMessage('error', data.error || 'Fehler beim Speichern');
        }
      } else {
        showMessage('error', 'Server Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      showMessage('error', 'Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  const toggleGamingSystem = async () => {
    try {
      const response = await fetch('/api/gaming/toggle', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(prev => ({ ...prev, enabled: data.enabled }));
          showMessage('success', `Gaming System ${data.enabled ? 'aktiviert' : 'deaktiviert'}`);
        } else {
          showMessage('error', data.error || 'Fehler beim Umschalten');
        }
      }
    } catch (error) {
      console.error('Gaming Toggle Error:', error);
      showMessage('error', 'Fehler beim Umschalten des Gaming Systems');
    }
  };

  const setupGameChannels = async (game: string) => {
    try {
      const response = await fetch(`/api/gaming/setup/${game}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showMessage('success', `${game} Setup erfolgreich abgeschlossen`);
          loadData(); // Reload data to see new channels
        } else {
          showMessage('error', data.error || 'Fehler beim Setup');
        }
      }
    } catch (error) {
      console.error('Game Setup Error:', error);
      showMessage('error', 'Fehler beim Setup der Game Channels');
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
      <div className="min-h-screen bg-dark-bg text-dark-text relative overflow-hidden">
        <MatrixBlocks density={20} />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-primary" />
              <p className="text-dark-text-secondary">Gaming System lädt...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text relative overflow-hidden">
      <MatrixBlocks density={25} />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-purple-primary to-blue-500 rounded-lg">
                <Gamepad2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-primary to-blue-500 bg-clip-text text-transparent">
                  🎮 Gaming System
                </h1>
                <p className="text-dark-text-secondary">
                  Smart Auto-Ping • Team Management • Voice Integration • Reputation System
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-dark-text-secondary">System Status:</span>
                <Badge variant={settings.enabled ? 'default' : 'outline'}>
                  {settings.enabled ? '🟢 Aktiv' : '🔴 Inaktiv'}
                </Badge>
              </div>
              
              <Button
                onClick={toggleGamingSystem}
                variant={settings.enabled ? 'outline' : 'default'}
                size="sm"
                className={`transition-all duration-200 ${
                  settings.enabled 
                    ? 'hover:bg-red-500/20 hover:border-red-500 hover:text-red-400' 
                    : 'hover:bg-green-500/20 hover:border-green-500 hover:text-green-400'
                }`}
              >
                {settings.enabled ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Deaktivieren
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aktivieren
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {gamingStats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <Card className="bg-dark-surface/50 border-purple-primary/20 hover:border-purple-primary/40 transition-all duration-200">
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-dark-text">{gamingStats.activeTeams}</div>
                  <div className="text-xs text-dark-text-secondary">Aktive Teams</div>
                </CardContent>
              </Card>
              
              <Card className="bg-dark-surface/50 border-purple-primary/20 hover:border-purple-primary/40 transition-all duration-200">
                <CardContent className="p-4 text-center">
                  <Target className="h-6 w-6 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-dark-text">{gamingStats.totalPlayers}</div>
                  <div className="text-xs text-dark-text-secondary">Spieler Online</div>
                </CardContent>
              </Card>
              
              <Card className="bg-dark-surface/50 border-purple-primary/20 hover:border-purple-primary/40 transition-all duration-200">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-dark-text">{gamingStats.scheduledGames}</div>
                  <div className="text-xs text-dark-text-secondary">Geplante Games</div>
                </CardContent>
              </Card>
              
              <Card className="bg-dark-surface/50 border-purple-primary/20 hover:border-purple-primary/40 transition-all duration-200">
                <CardContent className="p-4 text-center">
                  <Gamepad2 className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-dark-text">{gamingStats.supportedGames}</div>
                  <div className="text-xs text-dark-text-secondary">Spiele</div>
                </CardContent>
              </Card>
              
              <Card className="bg-dark-surface/50 border-purple-primary/20 hover:border-purple-primary/40 transition-all duration-200">
                <CardContent className="p-4 text-center">
                  <Star className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-dark-text">{gamingStats.reputationEnabled ? '✅' : '❌'}</div>
                  <div className="text-xs text-dark-text-secondary">Reputation</div>
                </CardContent>
              </Card>
              
              <Card className="bg-dark-surface/50 border-purple-primary/20 hover:border-purple-primary/40 transition-all duration-200">
                <CardContent className="p-4 text-center">
                  <Activity className="h-6 w-6 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-dark-text">{settings.enabled ? 'ON' : 'OFF'}</div>
                  <div className="text-xs text-dark-text-secondary">System Status</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 bg-dark-surface/30 p-2 rounded-lg">
          {[
            { id: 'overview', label: '📊 Übersicht', icon: BarChart3 },
            { id: 'autoping', label: '🤖 Auto-Ping', icon: Zap },
            { id: 'teams', label: '⚡ Team-Join', icon: Users },
            { id: 'tracker', label: '📊 Team-Tracker', icon: Activity },
            { id: 'voice', label: '🎤 Voice-Channels', icon: Mic },
            { id: 'reputation', label: '⭐ Reputation', icon: Star },
            { id: 'games', label: '🎮 Games Setup', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-purple-primary text-white shadow-lg'
                  : 'text-dark-text-secondary hover:text-dark-text hover:bg-dark-surface/50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Feature Overview Cards */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-purple-primary/10 to-blue-500/10 border-purple-primary/30">
                <CardHeader>
                  <CardTitle className="text-purple-primary flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    🤖 Smart Auto-Ping System
                    <Tooltip content="Pingt automatisch passende Spieler basierend auf Rang und Preferences" />
                  </CardTitle>
                  <CardDescription>
                    Automatisches Matching von Spielern mit ähnlichem Skill-Level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-dark-text-secondary">Status:</span>
                      <Badge variant={settings.autoPing.enabled ? 'default' : 'outline'}>
                        {settings.autoPing.enabled ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-dark-text-secondary">Max Ping Radius:</span>
                      <span className="text-sm font-mono">{settings.autoPing.maxPingRadius} Ränge</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-dark-text-secondary">Cooldown:</span>
                      <span className="text-sm font-mono">{settings.autoPing.cooldown / 1000}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    ⚡ One-Click Team-Join
                    <Tooltip content="Instant-Buttons für schnelles Team-Beitreten mit Auto-Voice-Join" />
                  </CardTitle>
                  <CardDescription>
                    Sofortiges Beitreten zu Teams mit einem Klick
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-dark-text-secondary">Auto Voice-Join:</span>
                      <Badge variant={settings.quickJoin.autoVoiceJoin ? 'default' : 'outline'}>
                        {settings.quickJoin.autoVoiceJoin ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-dark-text-secondary">Max Team-Größe:</span>
                      <span className="text-sm font-mono">{settings.quickJoin.maxTeamSize} Spieler</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-dark-text-secondary">Spectators:</span>
                      <Badge variant={settings.quickJoin.allowSpectators ? 'default' : 'outline'}>
                        {settings.quickJoin.allowSpectators ? 'Erlaubt' : 'Nicht erlaubt'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-blue-400 flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    📊 Live Team-Tracker
                    <Tooltip content="Verfolge Team-Progress in Echtzeit mit Live-Updates" />
                  </CardTitle>
                  <CardDescription>
                    Echtzeit-Verfolgung von Team-Aktivitäten und Progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-dark-text-secondary">Live Updates:</span>
                      <Badge variant={settings.teamTracker.liveUpdates ? 'default' : 'outline'}>
                        {settings.teamTracker.liveUpdates ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-dark-text-secondary">Stats Tracking:</span>
                      <Badge variant={settings.teamTracker.trackStats ? 'default' : 'outline'}>
                        {settings.teamTracker.trackStats ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-dark-text-secondary">Display Channel:</span>
                      <span className="text-sm font-mono">#{settings.teamTracker.displayChannel}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
                <CardHeader>
                  <CardTitle className="text-orange-400 flex items-center">
                    <Mic className="h-5 w-5 mr-2" />
                    🎤 Auto-Voice-Channels
                    <Tooltip content="Automatische Erstellung und Löschung von Voice-Channels für Teams" />
                  </CardTitle>
                  <CardDescription>
                    Automatische Voice-Channel-Verwaltung für Gaming-Teams
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-dark-text-secondary">Auto-Create:</span>
                      <Badge variant={settings.voiceChannels.autoCreate ? 'default' : 'outline'}>
                        {settings.voiceChannels.autoCreate ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-dark-text-secondary">Auto-Delete:</span>
                      <Badge variant={settings.voiceChannels.autoDelete ? 'default' : 'outline'}>
                        {settings.voiceChannels.autoDelete ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-dark-text-secondary">Max Channels:</span>
                      <span className="text-sm font-mono">{settings.voiceChannels.maxChannels}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reputation System Overview */}
            <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-yellow-400 flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  ⭐ Reputation System Overview
                  <Tooltip content="Community-basiertes Bewertungssystem für Teamplay und Verhalten" />
                </CardTitle>
                <CardDescription>
                  Community-basierte Spielerbewertung und Reputation-Management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-dark-surface/30 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">{settings.reputation.startingPoints}</div>
                    <div className="text-xs text-dark-text-secondary">Start-Punkte</div>
                  </div>
                  <div className="text-center p-4 bg-dark-surface/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">+{settings.reputation.goodTeammateReward}</div>
                    <div className="text-xs text-dark-text-secondary">Guter Teammate</div>
                  </div>
                  <div className="text-center p-4 bg-dark-surface/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">+{settings.reputation.winBonus}</div>
                    <div className="text-xs text-dark-text-secondary">Win Bonus</div>
                  </div>
                  <div className="text-center p-4 bg-dark-surface/30 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">{settings.reputation.maxPoints}</div>
                    <div className="text-xs text-dark-text-secondary">Max Punkte</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Save Button */}
        <div className="fixed bottom-6 right-6 z-20">
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-gradient-to-r from-purple-primary to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Speichert...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Einstellungen speichern
              </>
            )}
          </Button>
        </div>

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );
};

export default Gaming; 