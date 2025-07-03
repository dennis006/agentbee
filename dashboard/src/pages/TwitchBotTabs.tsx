import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Settings, Play, Pause, Users, MessageSquare, Bot, Zap, Monitor, Hash, Video, User, RotateCcw, Save } from 'lucide-react';
import { useToast, ToastContainer } from '../components/ui/toast';

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

const Badge: React.FC<{ children: React.ReactNode; className?: string; variant?: string }> = ({ children, className = '', variant = 'default' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant === 'outline' ? 'border border-purple-primary text-purple-primary bg-transparent' : 'bg-purple-primary text-white'} ${className}`}>
    {children}
  </span>
);

const Tabs: React.FC<{ children: React.ReactNode; defaultValue?: string; className?: string }> = ({ children, defaultValue, className = '' }) => (
  <div className={className} data-default-value={defaultValue}>
    {children}
  </div>
);

const TabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-dark-surface/50 p-1 ${className}`}>
    {children}
  </div>
);

const TabsTrigger: React.FC<{ children: React.ReactNode; value: string; className?: string; onClick?: () => void }> = ({ children, value, className = '', onClick }) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-purple-primary/20 text-dark-text ${className}`}
    data-value={value}
    onClick={onClick}
  >
    {children}
  </button>
);

const TabsContent: React.FC<{ children: React.ReactNode; value: string; className?: string; activeTab?: string }> = ({ children, value, className = '', activeTab }) => (
  activeTab === value ? (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`} data-value={value}>
      {children}
    </div>
  ) : null
);

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

interface TwitchBotStats {
  totalChannels: number;
  activeChannels: number;
  totalCommands: number;
  messagesLast24h: number;
  commandsUsedLast24h: number;
  isConnected: boolean;
  uptime: string;
}

interface TwitchBotSettings {
  botEnabled: boolean;
  botUsername: string;
  oauthToken: string;
}

const TwitchBotTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState<TwitchBotStats>({
    totalChannels: 1,
    activeChannels: 1,
    totalCommands: 0,
    messagesLast24h: 0,
    commandsUsedLast24h: 0,
    isConnected: false,
    uptime: '1h 51m'
  });

  const [settings, setSettings] = useState<TwitchBotSettings>({
    botEnabled: false,
    botUsername: 'agentbeebot',
    oauthToken: ''
  });

  const { toasts, removeToast, success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Lade Bot Stats
      const statsRes = await fetch('/api/twitch-bot/stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data.success) {
          setStats(data.stats);
        }
      }

      // Lade Bot Settings
      const settingsRes = await fetch('/api/twitch-bot/settings');
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.success) {
          setSettings(data.settings);
        }
      }

    } catch (error) {
      console.error('❌ Fehler beim Laden der Twitch Bot Daten:', error);
      showError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const toggleBot = async () => {
    try {
      const res = await fetch('/api/twitch-bot/toggle', {
        method: 'POST'
      });

      const data = await res.json();
      
      if (data.success) {
        showSuccess(data.message);
        loadData();
      } else {
        showError(data.error || 'Fehler beim Umschalten');
      }
    } catch (error) {
      console.error('❌ Fehler beim Umschalten:', error);
      showError('Fehler beim Umschalten des Bots');
    }
  };

  const tabs = [
    { 
      id: 'overview', 
      label: 'Übersicht', 
      icon: <Monitor className="w-4 h-4" />,
      description: 'Bot Status und Statistiken'
    },
    { 
      id: 'settings', 
      label: 'Bot Einstellungen', 
      icon: <Settings className="w-4 h-4" />,
      description: 'Grundlegende Bot-Konfiguration'
    },
    { 
      id: 'channels', 
      label: 'Channels', 
      icon: <Hash className="w-4 h-4" />,
      description: 'Twitch Channel Management'
    },
    { 
      id: 'stream-events', 
      label: 'Stream Events', 
      icon: <Video className="w-4 h-4" />,
      description: 'Automatische Stream-Nachrichten'
    },
    { 
      id: 'commands', 
      label: 'Commands', 
      icon: <MessageSquare className="w-4 h-4" />,
      description: 'Custom Bot Commands'
    },
    { 
      id: 'moderators', 
      label: 'Moderatoren', 
      icon: <User className="w-4 h-4" />,
      description: 'Bot Moderator Management'
    }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dark-text">Aktive Channels</CardTitle>
                  <Hash className="h-4 w-4 text-purple-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-neon-purple">{stats.totalChannels}</div>
                  <p className="text-xs text-dark-muted">
                    von {stats.totalChannels} Channels
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dark-text">Bot Commands</CardTitle>
                  <Zap className="h-4 w-4 text-purple-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-neon-purple">{stats.totalCommands}</div>
                  <p className="text-xs text-dark-muted">
                    verfügbare Commands
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dark-text">Nachrichten (24h)</CardTitle>
                  <MessageSquare className="h-4 w-4 text-purple-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-neon-purple">{stats.messagesLast24h}</div>
                  <p className="text-xs text-dark-muted">
                    {stats.commandsUsedLast24h} Commands verwendet
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-dark-text">Uptime</CardTitle>
                  <Monitor className="h-4 w-4 text-purple-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-neon-purple">{stats.uptime}</div>
                  <p className="text-xs text-dark-muted">
                    Bot Laufzeit
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-accent" />
                    Bot Status
                    <Tooltip 
                      title="🤖 Bot Status erklärt:"
                      content={
                        <div>
                          <div>Twitch Bot Verbindungsstatus:</div>
                          <div>• Online: Bot ist mit Twitch Chat verbunden</div>
                          <div>• Offline: Bot ist nicht verbunden</div>
                          <div>• Uptime: Wie lange der Bot bereits läuft</div>
                        </div>
                      }
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Status:</span>
                    <Badge variant={stats.isConnected ? 'default' : 'outline'}>
                      {stats.isConnected ? '🟢 Online' : '🔴 Offline'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Uptime:</span>
                    <span className="text-sm">{stats.uptime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Bot Name:</span>
                    <span className="text-sm font-medium">{settings.botUsername || 'Nicht konfiguriert'}</span>
                  </div>
                  <div className="pt-2">
                    <Button 
                      onClick={toggleBot}
                      className={`w-full ${settings.botEnabled ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'} text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2`}
                    >
                      {settings.botEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{settings.botEnabled ? 'Bot Stoppen' : 'Bot Starten'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-accent" />
                    Quick Actions
                    <Tooltip 
                      title="⚡ Quick Actions erklärt:"
                      content={
                        <div>
                          <div>Schnelle Navigation zu wichtigen Bereichen:</div>
                          <div>• Stream Events: Automatische Nachrichten</div>
                          <div>• Channels: Channel-Verwaltung</div>
                          <div>• Commands: Bot-Befehle</div>
                          <div>• Settings: Bot-Konfiguration</div>
                        </div>
                      }
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('stream-events')}
                      className="flex flex-col gap-2 h-auto py-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-primary/30 hover:border-purple-primary/60 text-dark-text hover:text-white transition-all duration-300 hover:scale-105"
                    >
                      <Video className="w-6 h-6 text-purple-accent" />
                      <span>Stream Events</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('channels')}
                      className="flex flex-col gap-2 h-auto py-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-purple-primary/30 hover:border-purple-primary/60 text-dark-text hover:text-white transition-all duration-300 hover:scale-105"
                    >
                      <Hash className="w-6 h-6 text-blue-400" />
                      <span>Channels</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('commands')}
                      className="flex flex-col gap-2 h-auto py-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-purple-primary/30 hover:border-purple-primary/60 text-dark-text hover:text-white transition-all duration-300 hover:scale-105"
                    >
                      <MessageSquare className="w-6 h-6 text-green-400" />
                      <span>Commands</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('settings')}
                      className="flex flex-col gap-2 h-auto py-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-purple-primary/30 hover:border-purple-primary/60 text-dark-text hover:text-white transition-all duration-300 hover:scale-105"
                    >
                      <Settings className="w-6 h-6 text-yellow-400" />
                      <span>Einstellungen</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'stream-events':
        return (
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-accent" />
                🎯 Stream Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Video className="w-16 h-16 mx-auto text-purple-primary mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">🎯 Stream Events</h3>
                <p className="text-gray-400 mb-4">
                  Stream-Start Nachrichten Feature ist verfügbar!
                </p>
                <div className="space-y-2 text-sm text-gray-500 mb-6">
                  <p>• Automatische Stream-Start Nachrichten</p>
                  <p>• Stream-Ende Nachrichten</p>
                  <p>• Follow, Sub, Raid Messages</p>
                  <p>• Event Historie & Logging</p>
                </div>
                <div className="p-4 bg-purple-primary/10 rounded-lg border border-purple-primary/20 max-w-md mx-auto">
                  <p className="text-sm text-purple-primary font-medium">
                    ⚡ Führe zuerst die Supabase Migration aus:
                  </p>
                  <code className="text-xs text-gray-400 block mt-1">
                    twitch_bot_stream_events_simple_migration.sql
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'settings':
        return (
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-accent" />
                Bot Einstellungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="w-16 h-16 mx-auto text-purple-primary mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">Bot Einstellungen</h3>
                <p className="text-gray-400 mb-4">
                  Bot Konfiguration ist über die alte Oberfläche verfügbar.
                </p>
                <p className="text-sm text-gray-500">
                  Vollständige Einstellungen werden nach Migration integriert.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 'channels':
        return (
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Hash className="w-5 h-5 text-purple-accent" />
                Channel Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Hash className="w-16 h-16 mx-auto text-purple-primary mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">Channel Management</h3>
                <p className="text-gray-400 mb-4">
                  Multi-Channel Verwaltung verfügbar nach Migration.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• Channels hinzufügen/entfernen</p>
                  <p>• Discord Integration</p>
                  <p>• Auto-Join Konfiguration</p>
                  <p>• Channel-spezifische Einstellungen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'commands':
        return (
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-accent" />
                Custom Commands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">Custom Commands</h3>
                <p className="text-gray-400 mb-4">
                  Diese Funktion wird in einem zukünftigen Update verfügbar sein.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• Eigene Commands erstellen</p>
                  <p>• Cooldowns konfigurieren</p>
                  <p>• Moderator-only Commands</p>
                  <p>• Verwendungsstatistiken</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'moderators':
        return (
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <User className="w-5 h-5 text-purple-accent" />
                Moderator System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">Moderator System</h3>
                <p className="text-gray-400 mb-4">
                  Diese Funktion wird in einem zukünftigen Update verfügbar sein.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• Bot-Moderatoren hinzufügen</p>
                  <p>• Berechtigungen verwalten</p>
                  <p>• Event-Trigger Zugriff</p>
                  <p>• Command-Management</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-accent" />
                Unbekannter Tab
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Bot className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">Tab nicht gefunden</h3>
                <p className="text-gray-400">Bitte wähle einen gültigen Tab aus.</p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6 animate-fade-in relative">
        <MatrixBlocks density={20} />
        <div className="flex items-center justify-center h-64 relative z-10">
          <div className="text-lg text-dark-text">Lade Twitch Bot System...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 animate-fade-in relative">
      <MatrixBlocks density={20} />
      
      <div className="text-center py-8 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Bot className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            🤖 Twitch Bot System
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Multi-Channel Twitch Chat Bot mit erweiterten Features! 
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

      <div className="flex justify-center gap-4 relative z-10">
        <Button
          onClick={toggleBot}
          className={`${settings.botEnabled ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent'} text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2`}
        >
          {settings.botEnabled ? <RotateCcw className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
          <span>{settings.botEnabled ? 'Bot Deaktivieren' : 'Bot Aktivieren'}</span>
        </Button>
        <Button 
          onClick={() => loadData()} 
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>Daten Aktualisieren</span>
        </Button>
      </div>

      <div className="flex justify-center relative z-10">
        <Badge variant={settings.botEnabled ? "default" : "outline"} className="text-lg py-2 px-4">
          {settings.botEnabled ? '✅ Bot Aktiviert' : '❌ Bot Deaktiviert'}
        </Badge>
      </div>

      <div className="relative z-10">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30">
            <TabsTrigger 
              value="overview" 
              className={`flex items-center space-x-2 ${activeTab === 'overview' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
              onClick={() => setActiveTab('overview')}
            >
              <Monitor className="h-4 w-4" />
              <span>Übersicht</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className={`flex items-center space-x-2 ${activeTab === 'settings' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="h-4 w-4" />
              <span>Einstellungen</span>
            </TabsTrigger>
            <TabsTrigger 
              value="channels" 
              className={`flex items-center space-x-2 ${activeTab === 'channels' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
              onClick={() => setActiveTab('channels')}
            >
              <Hash className="h-4 w-4" />
              <span>Channels</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stream-events" 
              className={`flex items-center space-x-2 ${activeTab === 'stream-events' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
              onClick={() => setActiveTab('stream-events')}
            >
              <Video className="h-4 w-4" />
              <span>Stream Events</span>
            </TabsTrigger>
            <TabsTrigger 
              value="commands" 
              className={`flex items-center space-x-2 ${activeTab === 'commands' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
              onClick={() => setActiveTab('commands')}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Commands</span>
            </TabsTrigger>
            <TabsTrigger 
              value="moderators" 
              className={`flex items-center space-x-2 ${activeTab === 'moderators' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
              onClick={() => setActiveTab('moderators')}
            >
              <User className="h-4 w-4" />
              <span>Moderatoren</span>
            </TabsTrigger>
          </TabsList>

          {currentTab && (
            <div className="p-3 bg-purple-primary/10 rounded-lg border border-purple-primary/20">
              <p className="text-sm text-gray-400">
                <strong className="text-purple-primary">{currentTab.label}:</strong> {currentTab.description}
              </p>
            </div>
          )}

          {/* Tab Content wird direkt basierend auf activeTab gerendert */}
          <div className="space-y-6">
            {renderTabContent()}
          </div>
        </Tabs>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default TwitchBotTabs; 