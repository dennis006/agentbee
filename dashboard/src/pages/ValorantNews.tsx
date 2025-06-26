import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Newspaper, 
  RefreshCw, 
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
  Star,
  Send,
  RotateCcw,
  Crown,
  Zap
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
    
    {/* Tooltip */}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-purple-primary/30 rounded-lg text-xs text-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-lg min-w-max">
      {title && <div className="font-medium text-blue-400 mb-1">{title}</div>}
      <div>{content}</div>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
    </div>
  </div>
);

interface NewsSettings {
  enabled: boolean;
  targetChannel: string;
  updateInterval: number; // in Minuten
  autoUpdate: boolean;
  henrikApiKey: string;
}

interface NewsStats {
  total: number;
  posted: number;
  pending: number;
  lastUpdate: string;
  autoUpdateActive: boolean;
  targetChannel: string;
  updateInterval: string;
  nextUpdate: string;
}

interface Channel {
  id: string;
  name: string;
  type: string;
  guildId: string;
  guildName: string;
}

const ValorantNews: React.FC = () => {
  const { toasts, success, error, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  const [settings, setSettings] = useState<NewsSettings>({
    enabled: true,
    targetChannel: '📢ankündigungen',
    updateInterval: 30,
    autoUpdate: true,
    henrikApiKey: ''
  });

  const [newsStats, setNewsStats] = useState<NewsStats | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, channelsRes, settingsRes] = await Promise.all([
        fetch('/api/valorant/news'),
        fetch('/api/channels'),
        fetch('/api/valorant/news/settings')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setNewsStats(statsData.stats);
        }
      }

      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();
        // Nur Text-Channels für News
        const textChannels = channelsData.channels?.filter((ch: Channel) => ch.type === 'text') || [];
        setChannels(textChannels);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.success) {
          setSettings(settingsData.settings);
        }
      }

    } catch (error) {
      console.error('Fehler beim Laden der Valorant News Daten:', error);
      showMessage('error', 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/valorant/news/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        showMessage('success', '✅ Valorant News Einstellungen gespeichert!');
        loadData(); // Reload to get updated stats
      } else {
        showMessage('error', '❌ Fehler beim Speichern der Einstellungen');
      }
    } catch (err) {
      showMessage('error', '❌ Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  const toggleNewsSystem = async () => {
    try {
      const response = await fetch('/api/valorant/news/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, enabled: data.enabled }));
        showMessage('success', `✅ ${data.message}`);
      } else {
        showMessage('error', '❌ Fehler beim Umschalten des News-Systems');
      }
    } catch (err) {
      showMessage('error', '❌ Fehler beim Umschalten des News-Systems');
    }
  };

  const forceUpdateNews = async () => {
    try {
      setUpdating(true);
      const response = await fetch('/api/valorant/news/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showMessage('success', `✅ News aktualisiert! ${data.posted || 0} neue News gepostet`);
          loadData();
        } else {
          showMessage('error', data.error || 'Fehler beim Aktualisieren der News');
        }
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || `❌ HTTP ${response.status} Fehler`);
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der News:', error);
      showMessage('error', '❌ Fehler beim Aktualisieren der News');
    } finally {
      setUpdating(false);
    }
  };

  const testNewsPosting = async () => {
    if (!settings.targetChannel) {
      showMessage('error', 'Bitte Channel konfigurieren');
      return;
    }

    try {
      const response = await fetch('/api/valorant/news/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: settings.targetChannel
        })
      });

      if (response.ok) {
        const result = await response.json();
        showMessage('success', `🎯 Test News erfolgreich in #${settings.targetChannel} gepostet!`);
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Fehler beim Posten der Test News');
      }
    } catch (error) {
      showMessage('error', 'Fehler beim Posten der Test News');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      success(text);
    } else {
      error(text);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Valorant News System...</div>
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
          <Newspaper className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            Valorant News System
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Automatische Valorant News Updates direkt von Riot Games in deinen Discord Server! 
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
          onClick={toggleNewsSystem}
          className={`${settings.enabled ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent'} text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2`}
        >
          {settings.enabled ? <RotateCcw className="h-5 w-5" /> : <Star className="h-5 w-5" />}
          <span>{settings.enabled ? 'System Deaktivieren' : 'System Aktivieren'}</span>
        </Button>
        <Button 
          onClick={forceUpdateNews}
          disabled={updating}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <TrendingUp className={`h-5 w-5 ${updating ? 'animate-bounce' : ''}`} />
          <span>{updating ? 'Updating...' : 'News Update'}</span>
        </Button>
        <Button 
          onClick={saveSettings} 
          disabled={saving} 
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>{saving ? 'Speichere...' : 'Einstellungen Speichern'}</span>
        </Button>
      </div>

      {/* System Status Badge */}
      <div className="flex justify-center">
        <Badge variant={settings.enabled ? "default" : "outline"} className="text-lg py-2 px-4">
          {settings.enabled ? '✅ System Aktiviert' : '❌ System Deaktiviert'}
        </Badge>
      </div>

      {/* Statistics Cards */}
      {newsStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Gesamt News</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{newsStats.total}</div>
              <p className="text-xs text-dark-muted">
                📰 Alle verfügbaren News
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Gepostete News</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{newsStats.posted}</div>
              <p className="text-xs text-dark-muted">
                ✅ Erfolgreich gepostet
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Ausstehend</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{newsStats.pending}</div>
              <p className="text-xs text-dark-muted">
                ⏳ Wartend auf Posting
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Auto-Update</CardTitle>
              <Activity className={`h-4 w-4 ${settings.autoUpdate ? 'text-green-400 animate-pulse' : 'text-red-400'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${settings.autoUpdate ? 'text-green-400' : 'text-red-400'}`}>
                {settings.autoUpdate ? 'AKTIV' : 'INAKTIV'}
              </div>
              <p className="text-xs text-dark-muted">
                🤖 Automatische Updates
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-accent" />
              Basis Konfiguration
              <Tooltip 
                title="⚙️ Basis Konfiguration erklärt:"
                content={
                  <div>
                    <div>Grundeinstellungen für das News System:</div>
                    <div>• Channel: Wo News gepostet werden</div>
                    <div>• Update-Intervall: Wie oft nach News gesucht wird</div>
                    <div>• Auto-Update: Automatische Updates ein/aus</div>
                  </div>
                }
              />
            </CardTitle>
            <CardDescription className="text-dark-muted">
              Grundlegende Einstellungen für das Valorant News System
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-dark-text">System aktiviert</label>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Ziel-Channel</label>
              <Select 
                value={settings.targetChannel} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, targetChannel: value }))}
              >
                <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple">
                  <SelectValue placeholder="Channel wählen..." />
                </SelectTrigger>
                <SelectContent className="bg-dark-surface border-purple-primary/30">
                  {channels.map(channel => (
                    <SelectItem key={channel.id} value={channel.name} className="text-dark-text hover:bg-purple-primary/20">
                      #{channel.name} ({channel.guildName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-dark-muted mt-1">
                Channel wo Valorant News gepostet werden
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-dark-text">Update-Intervall (Minuten)</label>
                <Tooltip 
                  title="⏱️ Update-Intervall erklärt:"
                  content={
                    <div>
                      <div>Wie oft nach neuen News gesucht wird:</div>
                      <div>• 15 min: Sehr häufig (empfohlen für aktive Server)</div>
                      <div>• 30 min: Standard (gute Balance)</div>
                      <div>• 60 min: Selten (für ruhige Server)</div>
                    </div>
                  }
                />
              </div>
              <Input
                type="number"
                min="5"
                max="240"
                value={settings.updateInterval}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  updateInterval: parseInt(e.target.value) || 30 
                }))}
              />
              <p className="text-xs text-dark-muted mt-1">
                Aktuell: {formatDuration(settings.updateInterval)}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-dark-text">Auto-Update System</label>
                <Tooltip 
                  title="🤖 Auto-Update erklärt:"
                  content={
                    <div>
                      <div>Automatische News-Updates:</div>
                      <div>• AN: System prüft automatisch nach News</div>
                      <div>• AUS: Nur manuelle Updates möglich</div>
                      <div>• Verwendet das eingestellte Update-Intervall</div>
                    </div>
                  }
                />
              </div>
              <Switch
                checked={settings.autoUpdate}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoUpdate: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              System-Status
            </CardTitle>
            <CardDescription className="text-dark-muted">
              Aktuelle Performance und Konfiguration des News-Systems
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Aktueller Channel */}
            <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-purple-accent" />
                <div>
                  <div className="text-sm font-medium text-dark-text">Ziel-Channel</div>
                  <div className="text-xs text-dark-muted">News werden hier gepostet</div>
                </div>
              </div>
              <div className="text-sm font-mono text-neon-purple">
                #{settings.targetChannel || 'nicht-konfiguriert'}
              </div>
            </div>

            {/* Update-Intervall */}
            <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm font-medium text-dark-text">Update-Intervall</div>
                  <div className="text-xs text-dark-muted">Wie oft nach News gesucht wird</div>
                </div>
              </div>
              <div className="text-sm font-mono text-blue-400">
                {formatDuration(settings.updateInterval)}
              </div>
            </div>

            {/* Letztes Update */}
            <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-sm font-medium text-dark-text">Letztes Update</div>
                  <div className="text-xs text-dark-muted">Wann zuletzt nach News gesucht wurde</div>
                </div>
              </div>
              <div className="text-sm font-mono text-yellow-400">
                {newsStats?.lastUpdate || 'Nie'}
              </div>
            </div>

            {/* System Health */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-dark-text mb-2">System Health</div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-dark-muted">🔄 Auto-Update System</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  settings.autoUpdate 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {settings.autoUpdate ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-dark-muted">📡 Henrik API</span>
                <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                  Verbunden
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-dark-muted">💾 Datenbank</span>
                <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                  Aktiv
                </span>
              </div>
            </div>

            {/* Performance Stats */}
            {newsStats && (
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-blue-600/20 border border-purple-primary/30 rounded-lg">
                <div className="text-sm font-medium text-purple-accent mb-2">📊 Performance</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-dark-muted">
                    Erfolgsrate: <span className="text-green-400 font-mono">
                      {newsStats.total > 0 
                        ? Math.round((newsStats.posted / newsStats.total) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="text-dark-muted">
                    Warteschlange: <span className="text-yellow-400 font-mono">
                      {newsStats.pending}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-accent" />
              API Konfiguration
              <Tooltip 
                title="🔑 API Konfiguration erklärt:"
                content={
                  <div>
                    <div>Henrik API Integration:</div>
                    <div>• API Key für Zugriff auf Valorant News</div>
                    <div>• Benötigt für automatische Updates</div>
                    <div>• Optional: Standardmäßig wird ein System-Key verwendet</div>
                  </div>
                }
              />
            </CardTitle>
            <CardDescription className="text-dark-muted">
              Henrik API Konfiguration für Valorant News
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Henrik API Key (Optional)</label>
              <Input
                type="password"
                value={settings.henrikApiKey}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                onChange={(e) => setSettings(prev => ({ ...prev, henrikApiKey: e.target.value }))}
                placeholder="HDEV-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
              <p className="text-xs text-dark-muted mt-1">
                Eigener API Key für höhere Rate Limits (optional)
              </p>
            </div>

            <div className="p-3 bg-blue-600/20 rounded-lg border border-blue-500/30">
              <div className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                ℹ️ Henrik API Info
              </div>
              <div className="text-xs text-dark-muted space-y-1">
                <p>• System verwendet standardmäßig einen integrierten API Key</p>
                <p>• Eigener Key nur für höhere Rate Limits nötig</p>
                <p>• API Key bekommst du kostenlos auf henrik-3.de</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Area */}
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-accent" />
              Test Bereich
            </CardTitle>
            <CardDescription className="text-dark-muted">
              Teste das News-System und Postings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Test News Posting */}
            <div className="p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-semibold text-purple-400 mb-1 flex items-center gap-2">
                    🎯 News Posting Test
                  </h5>
                  <p className="text-xs text-dark-muted mb-2">
                    Teste News-Posting in #{settings.targetChannel || 'nicht-konfiguriert'}
                  </p>
                </div>
                <Button
                  onClick={testNewsPosting}
                  disabled={!settings.targetChannel}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Test News
                </Button>
              </div>
              {!settings.targetChannel && (
                <p className="text-xs text-yellow-400 mt-2">
                  ⚠️ Bitte erst einen Channel konfigurieren
                </p>
              )}
            </div>

            {/* Manual Update */}
            <div className="p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-semibold text-blue-400 mb-1 flex items-center gap-2">
                    🔄 Manuelles Update
                  </h5>
                  <p className="text-xs text-dark-muted mb-2">
                    Suche sofort nach neuen Valorant News
                  </p>
                </div>
                <Button
                  onClick={forceUpdateNews}
                  disabled={updating}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
                  {updating ? 'Updating...' : 'Jetzt updaten'}
                </Button>
              </div>
            </div>

            {/* System Status Check */}
            <div className="p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-lg border border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-semibold text-green-400 mb-1 flex items-center gap-2">
                    ✅ System Status
                  </h5>
                  <p className="text-xs text-dark-muted mb-2">
                    Lade aktuelle System-Statistiken neu
                  </p>
                </div>
                <Button
                  onClick={loadData}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Activity className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                  Status prüfen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information Box */}
      <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-blue-400 mb-2">
                ℹ️ Valorant News System Information
              </h3>
              <div className="text-dark-muted text-sm space-y-2">
                <p>
                  • Das System prüft automatisch alle {formatDuration(settings.updateInterval)} nach neuen Valorant News von Riot Games
                </p>
                <p>
                  • Neue News werden automatisch in den konfigurierten Discord-Channel gepostet
                </p>
                <p>
                  • Du kannst jederzeit manuell nach Updates suchen mit dem "News Update" Button
                </p>
                <p>
                  • Die Statistiken werden in Echtzeit aktualisiert und zeigen die aktuelle Performance
                </p>
                <p>
                  • Channel-Auswahl und Update-Intervall sind vollständig konfigurierbar
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4 text-xs">
                <span className="bg-blue-500/20 px-3 py-1 rounded-full text-blue-300">
                  🎮 Valorant Integration
                </span>
                <span className="bg-purple-500/20 px-3 py-1 rounded-full text-purple-300">
                  🤖 Vollautomatisch
                </span>
                <span className="bg-green-500/20 px-3 py-1 rounded-full text-green-300">
                  ⚡ Echtzeit Updates
                </span>
                <span className="bg-yellow-500/20 px-3 py-1 rounded-full text-yellow-300">
                  📊 Live Statistiken
                </span>
                <span className="bg-pink-500/20 px-3 py-1 rounded-full text-pink-300">
                  ⚙️ Vollkonfigurierbar
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button 
          onClick={saveSettings} 
          disabled={saving} 
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-8 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>{saving ? 'Speichere...' : 'Einstellungen speichern'}</span>
        </Button>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ValorantNews; 