import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Settings, Plus, Trash2, Save, Play, Pause, TestTube, Users, MessageSquare, Clock, Bot, Zap, Monitor, Hash, Video, User } from 'lucide-react';
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

// Tab Button Component
const TabButton: React.FC<{ children: React.ReactNode; isActive: boolean; onClick: () => void; icon?: React.ReactNode }> = ({ children, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
      isActive 
        ? 'bg-purple-primary text-white shadow-lg shadow-purple-primary/25' 
        : 'bg-dark-card text-gray-400 hover:text-white hover:bg-purple-primary/20'
    }`}
  >
    {icon}
    {children}
  </button>
);

// Interfaces
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
    totalChannels: 0,
    activeChannels: 0,
    totalCommands: 0,
    messagesLast24h: 0,
    commandsUsedLast24h: 0,
    isConnected: false,
    uptime: '0s'
  });

  const [settings, setSettings] = useState<TwitchBotSettings>({
    botEnabled: false,
    botUsername: '',
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

  // Tabs Configuration
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

  // Tab Render Functions
  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bot Status Card */}
      <Card className="bg-dark-card border-purple-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Bot Status
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
              className={`w-full ${settings.botEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {settings.botEnabled ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Bot Stoppen
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Bot Starten
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card className="bg-dark-card border-purple-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Statistiken
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-bg rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-primary">{stats.totalChannels}</div>
              <div className="text-xs text-gray-400">Gesamt Channels</div>
            </div>
            <div className="bg-dark-bg rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">{stats.activeChannels}</div>
              <div className="text-xs text-gray-400">Aktive Channels</div>
            </div>
            <div className="bg-dark-bg rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-400">{stats.messagesLast24h}</div>
              <div className="text-xs text-gray-400">Nachrichten 24h</div>
            </div>
            <div className="bg-dark-bg rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-400">{stats.commandsUsedLast24h}</div>
              <div className="text-xs text-gray-400">Commands 24h</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card className="bg-dark-card border-purple-primary/20 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => setActiveTab('stream-events')}
              className="flex flex-col gap-2 h-auto py-4"
            >
              <Video className="w-6 h-6" />
              <span>Stream Events</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('channels')}
              className="flex flex-col gap-2 h-auto py-4"
            >
              <Hash className="w-6 h-6" />
              <span>Channels</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('commands')}
              className="flex flex-col gap-2 h-auto py-4"
            >
              <MessageSquare className="w-6 h-6" />
              <span>Commands</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('settings')}
              className="flex flex-col gap-2 h-auto py-4"
            >
              <Settings className="w-6 h-6" />
              <span>Einstellungen</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStreamEventsTab = () => (
    <div className="text-center py-12">
      <Video className="w-16 h-16 mx-auto text-purple-primary mb-4" />
      <h3 className="text-lg font-medium text-gray-300 mb-2">🎯 Stream Events</h3>
      <p className="text-gray-400 mb-4">
        Stream-Start Nachrichten Feature ist verfügbar!
      </p>
      <div className="space-y-2 text-sm text-gray-500">
        <p>• Automatische Stream-Start Nachrichten</p>
        <p>• Stream-Ende Nachrichten</p>
        <p>• Follow, Sub, Raid Messages</p>
        <p>• Event Historie & Logging</p>
      </div>
      <div className="mt-6 p-4 bg-purple-primary/10 rounded-lg border border-purple-primary/20">
        <p className="text-sm text-purple-primary font-medium">
          ⚡ Führe zuerst die Supabase Migration aus:
        </p>
        <code className="text-xs text-gray-400">twitch_bot_stream_events_simple_migration.sql</code>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
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
  );

  const renderChannelsTab = () => (
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
  );

  const renderCommandsTab = () => (
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
  );

  const renderModeratorsTab = () => (
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
  );

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text relative overflow-hidden">
      <MatrixBlocks density={20} />
      
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-primary to-pink-500 bg-clip-text text-transparent">
            🤖 Twitch Bot System
          </h1>
          <p className="text-gray-400">
            Vollständige Twitch Bot Verwaltung mit Multi-Channel Support
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 p-4 bg-dark-card rounded-xl border border-purple-primary/20">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                icon={tab.icon}
              >
                {tab.label}
              </TabButton>
            ))}
          </div>
          
          {/* Tab Description */}
          {currentTab && (
            <div className="mt-4 p-3 bg-purple-primary/10 rounded-lg border border-purple-primary/20">
              <p className="text-sm text-gray-400">
                <strong className="text-purple-primary">{currentTab.label}:</strong> {currentTab.description}
              </p>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'settings' && renderSettingsTab()}
            {activeTab === 'channels' && renderChannelsTab()}
            {activeTab === 'stream-events' && renderStreamEventsTab()}
            {activeTab === 'commands' && renderCommandsTab()}
            {activeTab === 'moderators' && renderModeratorsTab()}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default TwitchBotTabs; 