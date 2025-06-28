import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Users, 
  Settings, 
  Save,
  RotateCcw,
  Plus,
  MessageSquare,
  Hash,
  UserPlus,
  Clock,
  Shield,
  TestTube
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
const Badge: React.FC<{ children: React.ReactNode; className?: string; variant?: string; style?: React.CSSProperties }> = ({ children, className = '', variant = 'default', style }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant === 'outline' ? 'border border-purple-primary text-purple-primary bg-transparent' : 'bg-purple-primary text-white'} ${className}`} style={style}>
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

interface LFGSettings {
  enabled: boolean;
  channelId: string;
  channelName: string;
  roleId: string;
  roleName: string;
  roleColor: string;
  allowedGames: string[];
  cooldownMinutes: number;
  maxPingsPerDay: number;
  requireReason: boolean;
  autoDeleteAfterHours: number;
  
  // 🎮 Interactive Features Configuration
  enableButtons: boolean;
  enableVoiceCreation: boolean;
  enableDmNotifications: boolean;
  enableAutoVoiceCleanup: boolean;
  voiceCleanupHours: number;
  
  // 🏗️ Voice Channel Configuration
  voiceCategoryName: string;
  voiceAutoCreateCategory: boolean;
  voiceUserLimitOverride: number | null;
  voiceChannelPrefix: string;
  
  // 🎯 Game-Specific Settings
  gameTeamSizes: Record<string, number>;
  
  // 🔧 Advanced Features
  enableTeamSizeDetection: boolean;
  enableGameDetection: boolean;
  enableCreatorProtection: boolean;
  maxTeamSize: number;
  minTeamSize: number;
  
  // 📊 Analytics & Tracking
  trackTeamStatistics: boolean;
  trackUserActivity: boolean;
  enableLeaderboards: boolean;
}

interface LFGStats {
  totalLFGPosts: number;
  activePlayers: number;
  todayPosts: number;
  popularGame: string;
}

const LFGSystem: React.FC = () => {
  const { toasts, success, error, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<LFGSettings>({
    enabled: false,
    channelId: '',
    channelName: 'lfg-suche',
    roleId: '',
    roleName: 'LFG',
    roleColor: '#9333ea',
    allowedGames: [
      'Valorant',
      'League of Legends', 
      'Overwatch 2',
      'Counter-Strike 2',
      'Apex Legends',
      'Rocket League',
      'Call of Duty',
      'Fortnite'
    ],
    cooldownMinutes: 30,
    maxPingsPerDay: 10,
    requireReason: true,
    autoDeleteAfterHours: 24,
    
    // 🎮 Interactive Features Configuration
    enableButtons: true,
    enableVoiceCreation: true,
    enableDmNotifications: true,
    enableAutoVoiceCleanup: true,
    voiceCleanupHours: 2,
    
    // 🏗️ Voice Channel Configuration
    voiceCategoryName: '🎮 Gaming Lobbys',
    voiceAutoCreateCategory: true,
    voiceUserLimitOverride: null,
    voiceChannelPrefix: '',
    
    // 🎯 Game-Specific Settings
    gameTeamSizes: {
      'Valorant': 5,
      'League of Legends': 5,
      'Overwatch 2': 6,
      'Counter-Strike 2': 5,
      'CS2': 5,
      'Apex Legends': 3,
      'Rocket League': 3,
      'Call of Duty': 6,
      'Fortnite': 4
    },
    
    // 🔧 Advanced Features
    enableTeamSizeDetection: true,
    enableGameDetection: true,
    enableCreatorProtection: true,
    maxTeamSize: 10,
    minTeamSize: 2,
    
    // 📊 Analytics & Tracking
    trackTeamStatistics: true,
    trackUserActivity: true,
    enableLeaderboards: false
  });

  const [stats, setStats] = useState<LFGStats>({
    totalLFGPosts: 0,
    activePlayers: 0,
    todayPosts: 0,
    popularGame: 'Valorant'
  });

  // Test Ping State
  const [testGame, setTestGame] = useState('');
  const [testReason, setTestReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/lfg/status');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
        setStats(data.stats || stats);
      } else {
        // Fallback wenn API nicht verfügbar ist
        console.log('LFG API nicht verfügbar, verwende lokale Einstellungen');
      }
    } catch (error) {
      console.error('Fehler beim Laden der LFG-Daten:', error);
      // Verwende lokale Einstellungen als Fallback
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/lfg/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        showMessage('success', '✅ LFG Einstellungen gespeichert!');
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

  const toggleLFGSystem = async () => {
    try {
      const response = await fetch('/api/lfg/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, enabled: data.enabled }));
        showMessage('success', `✅ ${data.message}`);
      } else {
        showMessage('error', '❌ Fehler beim Umschalten des LFG Systems');
      }
    } catch (err) {
      showMessage('error', '❌ Fehler beim Umschalten des LFG Systems');
    }
  };

  const setupLFG = async () => {
    try {
      const response = await fetch('/api/lfg/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        showMessage('success', `✅ ${data.message}`);
      } else {
        showMessage('error', '❌ Fehler beim LFG Setup');
      }
    } catch (error) {
      showMessage('error', '❌ Fehler beim LFG Setup');
    }
  };

  const testPing = async () => {
    if (!testGame.trim()) {
      showMessage('error', '❌ Bitte wähle ein Spiel aus');
      return;
    }

    if (settings.requireReason && !testReason.trim()) {
      showMessage('error', '❌ Bitte gib einen Grund an');
      return;
    }

    try {
      const response = await fetch('/api/lfg/test-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game: testGame, reason: testReason })
      });

      if (response.ok) {
        const data = await response.json();
        showMessage('success', `✅ ${data.message}`);
        setTestGame('');
        setTestReason('');
      } else {
        const data = await response.json();
        showMessage('error', `❌ ${data.error}`);
      }
    } catch (error) {
      showMessage('error', '❌ Fehler beim Test Ping');
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
          <div className="text-lg">Lade LFG System...</div>
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
          <Users className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            LFG System
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Einfaches Looking For Group System - Ein Channel, eine Rolle, maximale Effizienz! 🎮
        </div>
        <div className="w-32 h-1 bg-gradient-neon mx-auto mt-4 rounded-full animate-glow"></div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={toggleLFGSystem}
          className={`${settings.enabled ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent'} text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2`}
        >
          {settings.enabled ? <RotateCcw className="h-5 w-5" /> : <Users className="h-5 w-5" />}
          <span>{settings.enabled ? 'LFG System Deaktivieren' : 'LFG System Aktivieren'}</span>
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
          {settings.enabled ? '✅ LFG System Aktiviert' : '❌ LFG System Deaktiviert'}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Gesamt LFG Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">{stats.totalLFGPosts}</div>
            <p className="text-xs text-dark-muted">
              Alle Zeit
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Aktive Spieler</CardTitle>
            <Users className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">{stats.activePlayers}</div>
            <p className="text-xs text-dark-muted">
              Mit @{settings.roleName} Rolle
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Heute</CardTitle>
            <Clock className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">{stats.todayPosts}</div>
            <p className="text-xs text-dark-muted">
              LFG Posts heute
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Beliebtestes Spiel</CardTitle>
            <Users className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">{stats.popularGame}</div>
            <p className="text-xs text-dark-muted">
              Diese Woche
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <div className="space-y-4">
        <div className="grid w-full grid-cols-4 bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 p-2 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'overview' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Übersicht</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'settings' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Basis</span>
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'advanced' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Erweitert</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'test' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'
            }`}
          >
            <TestTube className="h-4 w-4" />
            <span>Test</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-accent" />
                  LFG System Übersicht
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Einfaches und effektives Looking For Group System
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* System Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-dark-text">System Info</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
                        <span className="text-sm text-dark-text">Channel:</span>
                        <Badge variant="outline">#{settings.channelName}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
                        <span className="text-sm text-dark-text">Rolle:</span>
                        <Badge className="text-white" style={{ backgroundColor: settings.roleColor }}>@{settings.roleName}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
                        <span className="text-sm text-dark-text">Cooldown:</span>
                        <span className="text-sm text-dark-muted">{settings.cooldownMinutes} Minuten</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
                        <span className="text-sm text-dark-text">Max Pings/Tag:</span>
                        <span className="text-sm text-dark-muted">{settings.maxPingsPerDay}</span>
                      </div>
                    </div>
                  </div>

                  {/* Supported Games */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-dark-text">Unterstützte Spiele</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {settings.allowedGames.map(game => (
                        <Badge key={game} variant="outline" className="justify-center py-2">
                          {game}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Setup Button */}
                <div className="text-center pt-4">
                  <Button
                    onClick={setupLFG}
                    className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-8 rounded-xl shadow-neon transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    LFG Channel & Rolle Einrichten
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-accent" />
                  LFG Einstellungen
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Konfiguriere dein LFG System nach deinen Wünschen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-dark-text">Grundeinstellungen</h3>
                    
                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Channel Name</label>
                      <Input
                        value={settings.channelName}
                        onChange={(e) => setSettings(prev => ({ ...prev, channelName: e.target.value }))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text"
                        placeholder="lfg-suche"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Rollen Name</label>
                      <Input
                        value={settings.roleName}
                        onChange={(e) => setSettings(prev => ({ ...prev, roleName: e.target.value }))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text"
                        placeholder="LFG"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Rollen Farbe</label>
                      <Input
                        type="color"
                        value={settings.roleColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, roleColor: e.target.value }))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text h-12"
                      />
                    </div>
                  </div>

                  {/* Restrictions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-dark-text">Beschränkungen</h3>
                    
                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Cooldown (Minuten)</label>
                      <Input
                        type="number"
                        min="1"
                        max="1440"
                        value={settings.cooldownMinutes}
                        onChange={(e) => setSettings(prev => ({ ...prev, cooldownMinutes: parseInt(e.target.value) || 30 }))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Max Pings pro Tag</label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={settings.maxPingsPerDay}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxPingsPerDay: parseInt(e.target.value) || 10 }))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Auto-Löschung nach (Stunden)</label>
                      <Input
                        type="number"
                        min="1"
                        max="168"
                        value={settings.autoDeleteAfterHours}
                        onChange={(e) => setSettings(prev => ({ ...prev, autoDeleteAfterHours: parseInt(e.target.value) || 24 }))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text"
                      />
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-dark-text">Optionen</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Grund erforderlich</label>
                      <p className="text-xs text-dark-muted">User müssen einen Grund für LFG angeben</p>
                    </div>
                    <Switch
                      checked={settings.requireReason}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireReason: checked }))}
                    />
                  </div>
                </div>

                {/* Games List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-dark-text">Erlaubte Spiele</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {settings.allowedGames.map((game, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-dark-bg/50 rounded border border-purple-primary/20">
                        <span className="text-sm text-dark-text">{game}</span>
                        <button
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            allowedGames: prev.allowedGames.filter((_, i) => i !== index)
                          }))}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-accent" />
                  Erweiterte Konfiguration
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Konfiguriere die interaktiven Features und Team-Funktionen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                
                {/* Interactive Features */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-dark-text">🎮 Interactive Features</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Button Interaktionen</label>
                      <p className="text-xs text-dark-muted">Aktiviert Beitreten/Verlassen/Voice/Schließen Buttons</p>
                    </div>
                    <Switch
                      checked={settings.enableButtons}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableButtons: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Voice Channel Erstellung</label>
                      <p className="text-xs text-dark-muted">Automatische Voice Channel Erstellung für Teams</p>
                    </div>
                    <Switch
                      checked={settings.enableVoiceCreation}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableVoiceCreation: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-dark-text">DM Benachrichtigungen</label>
                      <p className="text-xs text-dark-muted">Team Creator bekommt DM wenn Spieler beitreten</p>
                    </div>
                    <Switch
                      checked={settings.enableDmNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableDmNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Auto Voice Cleanup</label>
                      <p className="text-xs text-dark-muted">Leere Voice Channels automatisch löschen</p>
                    </div>
                    <Switch
                      checked={settings.enableAutoVoiceCleanup}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableAutoVoiceCleanup: checked }))}
                    />
                  </div>

                  {settings.enableAutoVoiceCleanup && (
                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Voice Cleanup nach (Stunden)</label>
                      <Input
                        type="number"
                        min="1"
                        max="24"
                        value={settings.voiceCleanupHours}
                        onChange={(e) => setSettings(prev => ({ ...prev, voiceCleanupHours: parseInt(e.target.value) || 2 }))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text"
                      />
                    </div>
                  )}
                </div>

                {/* Voice Channel Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-dark-text">🏗️ Voice Channel Konfiguration</h3>
                  
                  <div>
                    <label className="text-sm font-medium text-dark-text mb-2 block">Voice Category Name</label>
                    <Input
                      value={settings.voiceCategoryName}
                      onChange={(e) => setSettings(prev => ({ ...prev, voiceCategoryName: e.target.value }))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text"
                      placeholder="🎮 Gaming Lobbys"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Auto-Category Erstellung</label>
                      <p className="text-xs text-dark-muted">Category automatisch erstellen falls nicht vorhanden</p>
                    </div>
                    <Switch
                      checked={settings.voiceAutoCreateCategory}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, voiceAutoCreateCategory: checked }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-dark-text mb-2 block">Voice Channel Prefix</label>
                    <Input
                      value={settings.voiceChannelPrefix}
                      onChange={(e) => setSettings(prev => ({ ...prev, voiceChannelPrefix: e.target.value }))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text"
                      placeholder="z.B. 'Team-' für 'Team-Valorant'"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-dark-text mb-2 block">Voice User Limit Override</label>
                    <Input
                      type="number"
                      min="0"
                      max="99"
                      value={settings.voiceUserLimitOverride || ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        voiceUserLimitOverride: e.target.value ? parseInt(e.target.value) : null 
                      }))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text"
                      placeholder="Leer = Spiel-spezifische Limits"
                    />
                    <p className="text-xs text-dark-muted mt-1">
                      Überschreibt alle Spiel-spezifischen Team-Größen (0 = unbegrenzt)
                    </p>
                  </div>
                </div>

                {/* Game-Specific Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-dark-text">🎯 Spiel-spezifische Team-Größen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(settings.gameTeamSizes).map(([game, size]) => (
                      <div key={game} className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
                        <span className="text-sm text-dark-text font-medium">{game}</span>
                        <Input
                          type="number"
                          min="2"
                          max="20"
                          value={size}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            gameTeamSizes: {
                              ...prev.gameTeamSizes,
                              [game]: parseInt(e.target.value) || 5
                            }
                          }))}
                          className="w-20 bg-dark-bg/70 border-purple-primary/30 text-dark-text text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced Features */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-dark-text">🔧 Erweiterte Features</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Team-Größen Erkennung</label>
                      <p className="text-xs text-dark-muted">Automatische Erkennung von "5 Spieler" aus Nachrichten</p>
                    </div>
                    <Switch
                      checked={settings.enableTeamSizeDetection}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableTeamSizeDetection: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Spiel-Erkennung</label>
                      <p className="text-xs text-dark-muted">Automatische Erkennung des Spiels aus Nachrichten</p>
                    </div>
                    <Switch
                      checked={settings.enableGameDetection}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableGameDetection: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Creator Schutz</label>
                      <p className="text-xs text-dark-muted">Team Creator kann Team nicht verlassen (nur schließen)</p>
                    </div>
                    <Switch
                      checked={settings.enableCreatorProtection}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableCreatorProtection: checked }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Min Team-Größe</label>
                      <Input
                        type="number"
                        min="2"
                        max="10"
                        value={settings.minTeamSize}
                        onChange={(e) => setSettings(prev => ({ ...prev, minTeamSize: parseInt(e.target.value) || 2 }))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Max Team-Größe</label>
                      <Input
                        type="number"
                        min="2"
                        max="20"
                        value={settings.maxTeamSize}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxTeamSize: parseInt(e.target.value) || 10 }))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text"
                      />
                    </div>
                  </div>
                </div>

                {/* Analytics & Tracking */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-dark-text">📊 Analytics & Tracking</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Team Statistiken</label>
                      <p className="text-xs text-dark-muted">Sammle Daten über Team-Bildung und Erfolg</p>
                    </div>
                    <Switch
                      checked={settings.trackTeamStatistics}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, trackTeamStatistics: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-dark-text">User Aktivität</label>
                      <p className="text-xs text-dark-muted">Verfolge individuelle LFG Nutzung</p>
                    </div>
                    <Switch
                      checked={settings.trackUserActivity}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, trackUserActivity: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Leaderboards</label>
                      <p className="text-xs text-dark-muted">Zeige Top LFG User und beliebte Spiele</p>
                    </div>
                    <Switch
                      checked={settings.enableLeaderboards}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableLeaderboards: checked }))}
                    />
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'test' && (
          <div className="space-y-6">
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-purple-accent" />
                  LFG Test Ping
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Teste das LFG System mit einem Beispiel-Ping
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="max-w-md mx-auto space-y-4">
                  <div>
                    <label className="text-sm font-medium text-dark-text mb-2 block">Spiel auswählen</label>
                    <Select value={testGame} onValueChange={setTestGame}>
                      <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text">
                        <SelectValue placeholder="Wähle ein Spiel..." />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-surface border-purple-primary/30">
                        {settings.allowedGames.map(game => (
                          <SelectItem key={game} value={game} className="text-dark-text hover:bg-purple-primary/20">
                            {game}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.requireReason && (
                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Grund/Nachricht</label>
                      <Input
                        value={testReason}
                        onChange={(e) => setTestReason(e.target.value)}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text"
                        placeholder="z.B. Suche 2 Spieler für Ranked"
                      />
                    </div>
                  )}

                  <Button
                    onClick={testPing}
                    disabled={!settings.enabled}
                    className="w-full bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105"
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Test Ping Senden
                  </Button>

                  {!settings.enabled && (
                    <p className="text-center text-sm text-red-400">
                      LFG System muss aktiviert sein um Test Pings zu senden
                    </p>
                  )}
                </div>

                {/* Preview */}
                <div className="mt-8">
                  <h4 className="text-md font-semibold text-dark-text mb-4">Ping Vorschau:</h4>
                  <div className="p-4 bg-dark-bg/50 rounded-lg border border-purple-primary/30">
                    <div className="text-sm text-dark-text">
                      <span className="text-purple-400">@{settings.roleName}</span> 
                      {testGame && (
                        <>
                          {' '}- <strong>{testGame}</strong>
                          {testReason && (
                            <>: {testReason}</>
                          )}
                        </>
                      )}
                    </div>
                  </div>
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

export default LFGSystem; 