import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Settings, Plus, Trash2, Save, Play, Pause, TestTube, Users, MessageSquare, Clock, Smile, Bot, Zap, Edit3, Monitor, Hash, Power, Link } from 'lucide-react';
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

// Label component
const Label: React.FC<{ children: React.ReactNode; htmlFor?: string; className?: string }> = ({ children, htmlFor, className = '' }) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium text-dark-text leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
    {children}
  </label>
);

// Interfaces
interface TwitchBotSettings {
  botEnabled: boolean;
  botUsername: string;
  oauthToken: string;
  autoConnect: boolean;
  reconnectAttempts: number;
  commandPrefix: string;
  modCommandsOnly: boolean;
  allowedRoles: string[];
  blockedUsers: string[];
  globalCooldown: number;
}

interface TwitchBotChannel {
  id: string;
  channelName: string;
  channelId: string;
  enabled: boolean;
  autoJoin: boolean;
  discordChannelId: string;
  syncMessages: boolean;
  welcomeMessage: string;
  followMessage: string;
  subMessage: string;
  donationMessage: string;
  raidMessage: string;
  hostMessage: string;
  totalCommands: number;
}

interface TwitchBotStats {
  totalChannels: number;
  activeChannels: number;
  totalCommands: number;
  messagesLast24h: number;
  commandsUsedLast24h: number;
  isConnected: boolean;
  uptime: string;
}

const TwitchBot: React.FC = () => {
  const [settings, setSettings] = useState<TwitchBotSettings>({
    botEnabled: false,
    botUsername: '',
    oauthToken: '',
    autoConnect: true,
    reconnectAttempts: 3,
    commandPrefix: '!',
    modCommandsOnly: false,
    allowedRoles: [],
    blockedUsers: [],
    globalCooldown: 3
  });

  const [channels, setChannels] = useState<TwitchBotChannel[]>([]);
  const [stats, setStats] = useState<TwitchBotStats>({
    totalChannels: 0,
    activeChannels: 0,
    totalCommands: 0,
    messagesLast24h: 0,
    commandsUsedLast24h: 0,
    isConnected: false,
    uptime: '0s'
  });

  const [loading, setLoading] = useState(true);
  const [newChannel, setNewChannel] = useState({
    channelName: '',
    discordChannelId: '',
    syncMessages: false
  });

  const { toasts, removeToast, success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Für jetzt Mock-Daten verwenden
      setSettings({
        botEnabled: false,
        botUsername: 'AgentBeeBot',
        oauthToken: '',
        autoConnect: true,
        reconnectAttempts: 3,
        commandPrefix: '!',
        modCommandsOnly: false,
        allowedRoles: [],
        blockedUsers: [],
        globalCooldown: 3
      });

      setChannels([]);
      
      setStats({
        totalChannels: 0,
        activeChannels: 0,
        totalCommands: 0,
        messagesLast24h: 0,
        commandsUsedLast24h: 0,
        isConnected: false,
        uptime: '0s'
      });

    } catch (error) {
      console.error('❌ Fehler beim Laden der Twitch Bot Daten:', error);
      showError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    showSuccess('Bot-Einstellungen gespeichert! (Demo)');
  };

  const toggleBot = async () => {
    setSettings(prev => ({ ...prev, botEnabled: !prev.botEnabled }));
    showSuccess(settings.botEnabled ? 'Bot gestoppt!' : 'Bot gestartet!');
  };

  const addChannel = async () => {
    if (!newChannel.channelName.trim()) {
      showError('Bitte Channel-Namen eingeben');
      return;
    }

    const newChannelData: TwitchBotChannel = {
      id: Date.now().toString(),
      channelName: newChannel.channelName,
      channelId: '',
      enabled: true,
      autoJoin: true,
      discordChannelId: newChannel.discordChannelId,
      syncMessages: newChannel.syncMessages,
      welcomeMessage: '',
      followMessage: '',
      subMessage: '',
      donationMessage: '',
      raidMessage: '',
      hostMessage: '',
      totalCommands: 0
    };

    setChannels(prev => [...prev, newChannelData]);
    setNewChannel({
      channelName: '',
      discordChannelId: '',
      syncMessages: false
    });
    showSuccess(`Channel ${newChannel.channelName} hinzugefügt!`);
  };

  const removeChannel = async (channelId: string) => {
    setChannels(prev => prev.filter(c => c.id !== channelId));
    showError('Channel entfernt!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg relative overflow-hidden">
        <MatrixBlocks />
        <div className="relative z-10 p-8">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-primary mx-auto"></div>
              <p className="text-dark-text mt-4">Lade Twitch Bot Daten...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 animate-fade-in relative">
      {/* Matrix Background Effects */}
      <MatrixBlocks density={25} />
      
      {/* Page Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Bot className="w-12 h-12 text-purple-primary animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-primary to-purple-secondary">
            Twitch Bot System
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          <span className="relative inline-flex items-center mr-2">
            <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600 animate-pulse"></span>
          </span>
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
        <div className="w-32 h-1 bg-gradient-to-r from-purple-primary to-purple-secondary mx-auto mt-4 rounded-full animate-glow"></div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={toggleBot}
          className={`${settings.botEnabled ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent'} text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2`}
        >
          {settings.botEnabled ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          <span>{settings.botEnabled ? 'Bot Stoppen' : 'Bot Starten'}</span>
        </Button>
        <Button 
          onClick={saveSettings} 
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>Einstellungen Speichern</span>
        </Button>
      </div>

      {/* System Status Badge */}
      <div className="flex justify-center">
        <Badge variant={stats.isConnected ? "default" : "outline"} className="text-lg py-2 px-4">
          {stats.isConnected ? '✅ Bot Verbunden' : '❌ Bot Offline'}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Aktive Channels</CardTitle>
            <Hash className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">{channels.filter(c => c.enabled).length}</div>
            <p className="text-xs text-dark-muted">
              von {channels.length} Channels
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
            <Clock className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">{stats.uptime}</div>
            <p className="text-xs text-dark-muted">
              Bot Laufzeit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bot Settings */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-accent" />
            Bot Grundeinstellungen
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere die Basis-Einstellungen für den Twitch Bot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-dark-text">Bot Username</Label>
              <Input
                value={settings.botUsername}
                onChange={(e) => setSettings({...settings, botUsername: e.target.value})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                placeholder="TwitchBotUsername"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-dark-text">Command Prefix</Label>
              <Input
                value={settings.commandPrefix}
                onChange={(e) => setSettings({...settings, commandPrefix: e.target.value})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                placeholder="!"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Switch
                checked={settings.botEnabled}
                onCheckedChange={(checked) => setSettings({...settings, botEnabled: checked})}
              />
              <Label>Bot aktiviert</Label>
            </div>

            <div className="flex items-center space-x-3">
              <Switch
                checked={settings.autoConnect}
                onCheckedChange={(checked) => setSettings({...settings, autoConnect: checked})}
              />
              <Label>Auto-Connect</Label>
            </div>

            <div className="flex items-center space-x-3">
              <Switch
                checked={settings.modCommandsOnly}
                onCheckedChange={(checked) => setSettings({...settings, modCommandsOnly: checked})}
              />
              <Label>Nur Mods</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-dark-text">Reconnect Attempts</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={settings.reconnectAttempts}
                onChange={(e) => setSettings({...settings, reconnectAttempts: parseInt(e.target.value) || 3})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-dark-text">Global Cooldown (Sekunden)</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={settings.globalCooldown}
                onChange={(e) => setSettings({...settings, globalCooldown: parseInt(e.target.value) || 3})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channel Management */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Hash className="w-5 h-5 text-purple-accent" />
            Channel Management
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Verwalte die Twitch Channels, die der Bot überwachen soll
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Neuen Channel hinzufügen */}
          <div className="p-4 bg-dark-bg/30 rounded-lg border border-purple-primary/20">
            <h4 className="text-md font-semibold text-white mb-4">Neuen Channel hinzufügen</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label>Twitch Channel Name *</Label>
                <Input
                  value={newChannel.channelName}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, channelName: e.target.value }))}
                  placeholder="twitchusername"
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                />
              </div>

              <div>
                <Label>Discord Channel ID</Label>
                <Input
                  value={newChannel.discordChannelId}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, discordChannelId: e.target.value }))}
                  placeholder="123456789012345678"
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                />
              </div>

              <div className="flex items-center space-x-3 mt-6">
                <Switch
                  checked={newChannel.syncMessages}
                  onCheckedChange={(checked) => setNewChannel(prev => ({ ...prev, syncMessages: checked }))}
                />
                <Label>Discord Sync</Label>
              </div>
            </div>

            <Button
              onClick={addChannel}
              className="bg-purple-primary hover:bg-purple-primary/80"
              disabled={!newChannel.channelName.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Channel hinzufügen
            </Button>
          </div>

          {/* Channel Liste */}
          <div className="space-y-3">
            <h4 className="text-md font-semibold text-white">
              Bot Channels ({channels.length})
            </h4>

            {channels.length === 0 ? (
              <div className="text-center py-8 text-dark-text/70">
                <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Channels hinzugefügt</p>
                <p className="text-sm">Füge deinen ersten Twitch Channel hinzu!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {channels.map((channel) => (
                  <div key={channel.id} className="bg-dark-bg/50 p-4 rounded-lg border border-purple-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${channel.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <h5 className="font-semibold text-white flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            {channel.channelName}
                          </h5>
                          <p className="text-sm text-dark-text/70">
                            {channel.totalCommands} Commands • {channel.syncMessages ? 'Discord Sync ✅' : 'Discord Sync ❌'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={channel.enabled}
                          onCheckedChange={(checked) => {
                            setChannels(prev => prev.map(c => 
                              c.id === channel.id ? { ...c, enabled: checked } : c
                            ));
                          }}
                        />

                        <Button
                          onClick={() => removeChannel(channel.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {channel.discordChannelId && (
                      <div className="text-sm text-dark-text/80 bg-dark-bg/30 p-2 rounded">
                        <strong>Discord Channel:</strong> {channel.discordChannelId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default TwitchBot; 