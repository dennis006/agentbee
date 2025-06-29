import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Target, BarChart3, Calendar, MessageSquare, CheckCircle2, Settings, Eye, Crosshair, Activity, Send, Save, RotateCcw, Star, Plus, Trash2, AlertCircle, Crown, Download, Copy, TestTube, Image, Code } from 'lucide-react';
import { useToast, ToastContainer } from '../components/ui/toast';

// Matrix Blocks Component
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

// Tabs components
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
    
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-purple-primary/30 rounded-lg text-xs text-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-lg min-w-max">
      {title && <div className="font-medium text-blue-400 mb-1">{title}</div>}
      <div>{content}</div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
    </div>
  </div>
);

interface CrosshairStats {
  totalGenerated: number;
  todayGenerated: number;
  uniqueUsers: number;
  apiStatus: 'online' | 'offline' | 'limited';
  remainingRequests: number;
  popularCodes: Array<{
    code: string;
    count: number;
    lastUsed: string;
  }>;
}

interface CrosshairSettings {
  enabled: boolean;
  rateLimitWarning: boolean;
  defaultChannel: string;
  saveHistory: boolean;
  maxHistoryEntries: number;
}

interface Channel {
  id: string;
  name: string;
  guildId: string;
  guildName: string;
}

const ValorantCrosshair: React.FC = () => {
  const { toasts, success, error, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // States
  const [stats, setStats] = useState<CrosshairStats | null>(null);
  const [settings, setSettings] = useState<CrosshairSettings>({
    enabled: true,
    rateLimitWarning: true,
    defaultChannel: '',
    saveHistory: true,
    maxHistoryEntries: 100
  });
  const [channels, setChannels] = useState<{ text: Channel[] }>({ text: [] });
  
  // Preview & Creator States
  const [previewCode, setPreviewCode] = useState('0;p=0;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [sendChannelName, setSendChannelName] = useState('');
  
  // Crosshair Creator Config
  const [crosshairConfig, setCrosshairConfig] = useState({
    primaryColor: 0, // 0-7 (Weiß, Rot, Grün, Gelb, Blau, Cyan, Pink, Orange)
    outlineOpacity: 1,
    fadeWithFiring: false,
    centerDot: true,
    centerDotThickness: 2,
    centerDotOpacity: 1,
    innerLines: false,
    innerLineOpacity: 1,
    innerLineLength: 6,
    innerLineThickness: 2,
    innerLineOffset: 3,
    outerLines: true,
    outerLineOpacity: 1,
    outerLineLength: 6,
    outerLineThickness: 2,
    outerLineOffset: 3
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, settingsRes, channelsRes] = await Promise.all([
        fetch('/api/valorant/crosshair/stats'),
        fetch('/api/valorant/crosshair/settings'),
        fetch('/api/xp/channels') // Reuse channels from XP API
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || statsData);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData.settings || settingsData);
      }

      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();
        setChannels(channelsData);
      }

    } catch (error) {
      console.error('Fehler beim Laden der Crosshair-Daten:', error);
      showMessage('error', 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/valorant/crosshair/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        showMessage('success', '✅ Crosshair-Einstellungen gespeichert!');
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

  const showMessage = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      success(text);
    } else {
      error(text);
    }
  };

  // Rest of the component will be added in next step...
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Valorant Crosshair System...</div>
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
          <Target className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            Valorant Crosshair System
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Erstelle und verwalte perfekte Valorant Crosshairs wie ein Pro! 
          <span className="ml-2 inline-block relative">🎯</span>
        </div>
        <div className="w-32 h-1 bg-gradient-neon mx-auto mt-4 rounded-full animate-glow"></div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>{saving ? 'Speichere...' : 'Einstellungen speichern'}</span>
        </Button>
        <Button 
          onClick={loadData} 
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <RotateCcw className="h-5 w-5" />
          <span>Aktualisieren</span>
        </Button>
      </div>

      {/* System Status Badge */}
      <div className="flex justify-center">
        <Badge variant={settings.enabled ? "default" : "outline"} className="text-lg py-2 px-4">
          {settings.enabled ? '✅ System Aktiviert' : '❌ System Deaktiviert'}
        </Badge>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Generiert Gesamt</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{stats.totalGenerated}</div>
              <p className="text-xs text-dark-muted">Crosshairs erstellt</p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Heute</CardTitle>
              <Calendar className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{stats.todayGenerated}</div>
              <p className="text-xs text-dark-muted">Heute generiert</p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Aktive User</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{stats.uniqueUsers}</div>
              <p className="text-xs text-dark-muted">Verschiedene User</p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">API Status</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">
                {stats.apiStatus === 'online' ? 'Online' : stats.apiStatus === 'limited' ? 'Limitiert' : 'Offline'}
              </div>
              <p className="text-xs text-dark-muted">{stats.remainingRequests} Requests übrig</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30">
          <TabsTrigger 
            value="overview" 
            className={`flex items-center space-x-2 ${activeTab === 'overview' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity className="h-4 w-4" />
            <span>Übersicht</span>
          </TabsTrigger>
          <TabsTrigger 
            value="creator" 
            className={`flex items-center space-x-2 ${activeTab === 'creator' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('creator')}
          >
            <Crosshair className="h-4 w-4" />
            <span>Creator</span>
          </TabsTrigger>
          <TabsTrigger 
            value="preview" 
            className={`flex items-center space-x-2 ${activeTab === 'preview' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('preview')}
          >
            <Eye className="h-4 w-4" />
            <span>Vorschau</span>
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className={`flex items-center space-x-2 ${activeTab === 'settings' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="h-4 w-4" />
            <span>Einstellungen</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6" activeTab={activeTab}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Crosshairs */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-accent" />
                  Beliebte Crosshairs
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Die am häufigsten verwendeten Crosshair-Codes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.popularCodes?.map((code, index) => (
                    <div key={index} className="p-3 rounded-lg bg-dark-bg/50 border border-purple-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm text-dark-text">{code.code}</div>
                        <div className="text-xs text-dark-muted">{code.count}x verwendet</div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-dark-muted">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Keine Daten verfügbar</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Panel Posting */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Send className="w-5 h-5 text-purple-accent" />
                  Panel senden
                  <Tooltip 
                    title="📤 Panel senden erklärt:"
                    content={
                      <div>
                        <div>Sendet ein interaktives Crosshair-Panel in Discord:</div>
                        <div>• 🎨 Crosshair Creator Button</div>
                        <div>• 📋 Code Input Button</div>
                        <div>• ❓ Hilfe und Beispiele</div>
                        <div>• Funktioniert in jedem Text-Channel</div>
                      </div>
                    }
                  />
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Sende das interaktive Crosshair-Panel in einen Discord Channel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Ziel-Channel wählen</label>
                  <Select value={sendChannelName} onValueChange={setSendChannelName}>
                    <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple">
                      <SelectValue placeholder="Channel auswählen..." />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-purple-primary/30 max-h-[300px] overflow-y-auto">
                      {channels.text.map(channel => (
                        <SelectItem key={channel.id} value={channel.name} className="text-dark-text hover:bg-purple-primary/20 py-2">
                          #{channel.name} ({channel.guildName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={async () => {
                    if (!sendChannelName) {
                      showMessage('error', 'Bitte wähle einen Channel aus');
                      return;
                    }
                    try {
                      const response = await fetch('/api/valorant/crosshair/send-panel', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ channelName: sendChannelName })
                      });
                      if (response.ok) {
                        showMessage('success', `Panel erfolgreich in #${sendChannelName} gesendet!`);
                      } else {
                        const error = await response.json();
                        showMessage('error', error.error || 'Fehler beim Senden des Panels');
                      }
                    } catch (error) {
                      showMessage('error', 'Fehler beim Senden des Panels');
                    }
                  }}
                  disabled={!sendChannelName}
                  className="w-full bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Send className="h-5 w-5" />
                  <span>Panel in #{sendChannelName || 'Channel'} senden</span>
                </Button>

                {!sendChannelName && (
                  <p className="text-xs text-yellow-400 mt-2">
                    ⚠️ Bitte wähle einen Channel aus
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Creator Tab */}
        <TabsContent value="creator" className="space-y-6" activeTab={activeTab}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Crosshair Creator */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Crosshair className="w-5 h-5 text-purple-accent" />
                  Crosshair Creator
                  <Tooltip 
                    title="🎨 Crosshair Creator erklärt:"
                    content={
                      <div>
                        <div>Erstelle dein eigenes Crosshair:</div>
                        <div>• Farbe: 8 verschiedene Valorant-Farben</div>
                        <div>• Dicke, Länge und Offset anpassbar</div>
                        <div>• Mittelpunkt ein-/ausschaltbar</div>
                        <div>• Inner/Outer Lines konfigurierbar</div>
                      </div>
                    }
                  />
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Stelle dein perfektes Crosshair zusammen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Primary Color */}
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Primärfarbe</label>
                  <Select 
                    value={crosshairConfig.primaryColor.toString()} 
                    onValueChange={(value) => setCrosshairConfig(prev => ({...prev, primaryColor: parseInt(value)}))}
                  >
                    <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-purple-primary/30">
                      <SelectItem value="0" className="text-dark-text hover:bg-purple-primary/20">🤍 Weiß</SelectItem>
                      <SelectItem value="1" className="text-dark-text hover:bg-purple-primary/20">🔴 Rot</SelectItem>
                      <SelectItem value="2" className="text-dark-text hover:bg-purple-primary/20">🟢 Grün</SelectItem>
                      <SelectItem value="3" className="text-dark-text hover:bg-purple-primary/20">🟡 Gelb</SelectItem>
                      <SelectItem value="4" className="text-dark-text hover:bg-purple-primary/20">🔵 Blau</SelectItem>
                      <SelectItem value="5" className="text-dark-text hover:bg-purple-primary/20">🟣 Cyan</SelectItem>
                      <SelectItem value="6" className="text-dark-text hover:bg-purple-primary/20">🩷 Pink</SelectItem>
                      <SelectItem value="7" className="text-dark-text hover:bg-purple-primary/20">🟠 Orange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Center Dot */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-text">Mittelpunkt anzeigen</label>
                  <Switch
                    checked={crosshairConfig.centerDot}
                    onCheckedChange={(checked) => setCrosshairConfig(prev => ({...prev, centerDot: checked}))}
                  />
                </div>

                {crosshairConfig.centerDot && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Mittelpunkt Dicke</label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={crosshairConfig.centerDotThickness}
                        onChange={(e) => setCrosshairConfig(prev => ({...prev, centerDotThickness: parseInt(e.target.value) || 1}))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Mittelpunkt Opazität</label>
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={crosshairConfig.centerDotOpacity}
                        onChange={(e) => setCrosshairConfig(prev => ({...prev, centerDotOpacity: parseFloat(e.target.value) || 0}))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      />
                    </div>
                  </div>
                )}

                {/* Outer Lines */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-text">Äußere Linien</label>
                  <Switch
                    checked={crosshairConfig.outerLines}
                    onCheckedChange={(checked) => setCrosshairConfig(prev => ({...prev, outerLines: checked}))}
                  />
                </div>

                {crosshairConfig.outerLines && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Äußere Länge</label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={crosshairConfig.outerLineLength}
                        onChange={(e) => setCrosshairConfig(prev => ({...prev, outerLineLength: parseInt(e.target.value) || 1}))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Äußere Dicke</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={crosshairConfig.outerLineThickness}
                        onChange={(e) => setCrosshairConfig(prev => ({...prev, outerLineThickness: parseInt(e.target.value) || 1}))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Äußerer Offset</label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={crosshairConfig.outerLineOffset}
                        onChange={(e) => setCrosshairConfig(prev => ({...prev, outerLineOffset: parseInt(e.target.value) || 0}))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Äußere Opazität</label>
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={crosshairConfig.outerLineOpacity}
                        onChange={(e) => setCrosshairConfig(prev => ({...prev, outerLineOpacity: parseFloat(e.target.value) || 0}))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      />
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={async () => {
                    try {
                      setGenerating(true);
                      const response = await fetch('/api/valorant/crosshair/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ config: crosshairConfig })
                      });
                      
                      if (response.ok) {
                        const data = await response.json();
                        setPreviewCode(data.code);
                        setPreviewImage(data.imageUrl);
                        showMessage('success', `Crosshair erstellt! Code: ${data.code}`);
                      } else {
                        const error = await response.json();
                        showMessage('error', error.error || 'Fehler beim Erstellen des Crosshairs');
                      }
                    } catch (error) {
                      showMessage('error', 'Fehler beim Erstellen des Crosshairs');
                    } finally {
                      setGenerating(false);
                    }
                  }}
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Crosshair className="h-5 w-5" />
                  <span>{generating ? 'Erstelle...' : 'Crosshair erstellen'}</span>
                </Button>
              </CardContent>
            </Card>

            {/* Creator Preview */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-accent" />
                  Live Vorschau
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Sieh dein Crosshair in Echtzeit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {previewImage ? (
                  <div className="text-center">
                    <img 
                      src={previewImage} 
                      alt="Crosshair Preview" 
                      className="mx-auto w-64 h-64 border border-purple-primary/30 rounded-lg bg-dark-bg/50"
                    />
                    <div className="mt-4 p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                      <div className="text-sm font-mono text-dark-text break-all">{previewCode}</div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(previewCode);
                            showMessage('success', 'Code in Zwischenablage kopiert!');
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Code kopieren
                        </Button>
                        <Button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = previewImage;
                            link.download = `valorant-crosshair-${Date.now()}.png`;
                            link.click();
                            showMessage('success', 'Bild heruntergeladen!');
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Bild speichern
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-dark-muted">
                    <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Erstelle ein Crosshair um die Vorschau zu sehen</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6" activeTab={activeTab}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Code Input */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Code className="w-5 h-5 text-purple-accent" />
                  Crosshair Code eingeben
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Generiere eine Vorschau von einem bestehenden Crosshair-Code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Valorant Crosshair Code</label>
                  <Input
                    value={previewCode}
                    onChange={(e) => setPreviewCode(e.target.value)}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple font-mono"
                    placeholder="0;p=0;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0"
                  />
                  <p className="text-xs text-dark-muted mt-1">
                    Format: 0;p=0;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0
                  </p>
                </div>

                <Button
                  onClick={async () => {
                    if (!previewCode || !previewCode.startsWith('0;')) {
                      showMessage('error', 'Ungültiger Crosshair-Code! Code muss mit "0;" beginnen.');
                      return;
                    }
                    try {
                      setGenerating(true);
                      const response = await fetch('/api/valorant/crosshair/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: previewCode })
                      });
                      
                      if (response.ok) {
                        const blob = await response.blob();
                        const imageUrl = URL.createObjectURL(blob);
                        setPreviewImage(imageUrl);
                        showMessage('success', 'Crosshair-Vorschau generiert!');
                      } else {
                        const error = await response.json();
                        showMessage('error', error.error || 'Fehler bei der Generierung');
                      }
                    } catch (error) {
                      showMessage('error', 'Fehler bei der Generierung');
                    } finally {
                      setGenerating(false);
                    }
                  }}
                  disabled={generating || !previewCode}
                  className="w-full bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Image className="h-5 w-5" />
                  <span>{generating ? 'Generiere...' : 'Vorschau generieren'}</span>
                </Button>

                {/* Beispiel-Codes */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg border border-blue-500/30">
                  <h5 className="text-sm font-semibold text-blue-400 mb-3">📋 Beliebte Crosshair-Codes:</h5>
                  <div className="space-y-2">
                    {[
                      { name: 'TenZ', code: '0;s=1;P=c;c=5;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0' },
                      { name: 'Shroud', code: '0;p=0;o=1;f=0;0t=1;0l=3;0o=2;0a=1;0f=0;1b=0' },
                      { name: 'ScreaM', code: '0;s=1;P=h;c=1;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0' }
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setPreviewCode(example.code)}
                        className="w-full text-left p-2 rounded bg-dark-bg/50 hover:bg-dark-bg/70 border border-purple-primary/20 hover:border-purple-primary/40 transition-all duration-200"
                      >
                        <div className="text-xs font-semibold text-blue-400">{example.name}</div>
                        <div className="text-xs font-mono text-dark-text break-all">{example.code}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Image */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-accent" />
                  Crosshair Vorschau
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  So sieht dein Crosshair in Valorant aus
                </CardDescription>
              </CardHeader>
              <CardContent>
                {previewImage ? (
                  <div className="text-center">
                    <img 
                      src={previewImage} 
                      alt="Crosshair Preview" 
                      className="mx-auto w-64 h-64 border border-purple-primary/30 rounded-lg bg-dark-bg/50"
                    />
                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(previewCode);
                          showMessage('success', 'Code in Zwischenablage kopiert!');
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Code kopieren
                      </Button>
                      <Button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = previewImage;
                          link.download = `valorant-crosshair-${Date.now()}.png`;
                          link.click();
                          showMessage('success', 'Bild heruntergeladen!');
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Bild speichern
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-dark-muted">
                    <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Gib einen Crosshair-Code ein um die Vorschau zu sehen</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6" activeTab={activeTab}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Einstellungen */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-accent" />
                  System Einstellungen
                  <Tooltip 
                    title="⚙️ System Einstellungen erklärt:"
                    content={
                      <div>
                        <div>Allgemeine Crosshair-System Konfiguration:</div>
                        <div>• System aktivieren/deaktivieren</div>
                        <div>• Rate-Limit Warnungen</div>
                        <div>• Standard-Channel für Panels</div>
                        <div>• Verlauf speichern</div>
                      </div>
                    }
                  />
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Konfiguriere das Valorant Crosshair System
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-text">System aktiviert</label>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({...prev, enabled: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-text">Rate-Limit Warnungen anzeigen</label>
                  <Switch
                    checked={settings.rateLimitWarning}
                    onCheckedChange={(checked) => setSettings(prev => ({...prev, rateLimitWarning: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-text">Verlauf speichern</label>
                  <Switch
                    checked={settings.saveHistory}
                    onCheckedChange={(checked) => setSettings(prev => ({...prev, saveHistory: checked}))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Standard-Channel</label>
                  <Select value={settings.defaultChannel} onValueChange={(value) => setSettings(prev => ({...prev, defaultChannel: value}))}>
                    <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple">
                      <SelectValue placeholder="Channel wählen..." />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-purple-primary/30 max-h-[300px] overflow-y-auto">
                      {channels.text.map(channel => (
                        <SelectItem key={channel.id} value={channel.name} className="text-dark-text hover:bg-purple-primary/20 py-2">
                          #{channel.name} ({channel.guildName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {settings.saveHistory && (
                  <div>
                    <label className="text-sm font-medium text-dark-text mb-2 block">Max. Verlauf-Einträge</label>
                    <Input
                      type="number"
                      min="10"
                      max="1000"
                      value={settings.maxHistoryEntries}
                      onChange={(e) => setSettings(prev => ({...prev, maxHistoryEntries: parseInt(e.target.value) || 100}))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* API Status & Info */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-accent" />
                  API Status & Info
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  HenrikDev API Status und Rate-Limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                    <div className="text-2xl font-bold text-neon-purple">{stats?.apiStatus === 'online' ? '🟢' : '🔴'}</div>
                    <div className="text-sm text-dark-text">API Status</div>
                    <div className="text-xs text-dark-muted">{stats?.apiStatus || 'Unbekannt'}</div>
                  </div>
                  <div className="text-center p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                    <div className="text-2xl font-bold text-neon-purple">{stats?.remainingRequests || 0}</div>
                    <div className="text-sm text-dark-text">Verbleibende Requests</div>
                    <div className="text-xs text-dark-muted">Heute verfügbar</div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-primary/30">
                  <h5 className="text-sm font-semibold text-purple-400 mb-2">ℹ️ HenrikDev API Info:</h5>
                  <div className="text-xs text-dark-text space-y-1">
                    <div>• Endpoint: <code className="bg-dark-bg/50 px-1 rounded">valorant/v1/crosshair/generate</code></div>
                    <div>• Rate Limit: 30-90 Requests/Minute</div>
                    <div>• Ausgabe: 1024x1024px PNG-Bilder</div>
                    <div>• Timeout: 15 Sekunden pro Request</div>
                  </div>
                </div>

                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/valorant/crosshair/stats');
                      if (response.ok) {
                        const data = await response.json();
                        setStats(data.stats || data);
                        showMessage('success', 'API Status aktualisiert!');
                      } else {
                        showMessage('error', 'Fehler beim Aktualisieren des API Status');
                      }
                    } catch (error) {
                      showMessage('error', 'Fehler beim Aktualisieren des API Status');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  API Status aktualisieren
                </Button>
              </CardContent>
            </Card>

            {/* Test-Panel */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-purple-accent" />
                  System-Tests
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Teste verschiedene Crosshair-System Funktionen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/valorant/crosshair/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: '0;p=0;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0' })
                      });
                      
                      if (response.ok) {
                        showMessage('success', '✅ API Test erfolgreich!');
                      } else {
                        const error = await response.json();
                        showMessage('error', `❌ API Test fehlgeschlagen: ${error.error}`);
                      }
                    } catch (error) {
                      showMessage('error', '❌ API Test fehlgeschlagen: Verbindungsfehler');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  API Verbindung testen
                </Button>

                <Button
                  onClick={async () => {
                    if (!settings.defaultChannel) {
                      showMessage('error', 'Bitte zuerst einen Standard-Channel konfigurieren');
                      return;
                    }
                    try {
                      const response = await fetch('/api/valorant/crosshair/send-panel', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ channelName: settings.defaultChannel })
                      });
                      
                      if (response.ok) {
                        showMessage('success', `✅ Test-Panel in #${settings.defaultChannel} gesendet!`);
                      } else {
                        const error = await response.json();
                        showMessage('error', `❌ Panel-Test fehlgeschlagen: ${error.error}`);
                      }
                    } catch (error) {
                      showMessage('error', '❌ Panel-Test fehlgeschlagen: Verbindungsfehler');
                    }
                  }}
                  disabled={!settings.defaultChannel}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Test-Panel senden
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ValorantCrosshair; 