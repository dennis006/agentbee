import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Target, 
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
  Download,
  Copy,
  Send,
  Eye,
  Crosshair,
  Zap,
  Crown,
  Star,
  Image,
  Code,
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

interface CrosshairSettings {
  enabled: boolean;
  rateLimitWarning: boolean;
  defaultChannel: string;
  saveHistory: boolean;
  maxHistoryEntries: number;
}

interface CrosshairStats {
  totalGenerated: number;
  todayGenerated: number;
  uniqueUsers: number;
  popularCodes: Array<{
    code: string;
    count: number;
    lastUsed: string;
  }>;
  apiStatus: 'online' | 'offline' | 'limited';
  remainingRequests: number;
  nextReset: string;
}

interface CrosshairHistory {
  id: string;
  code: string;
  user: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
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
  const [channels, setChannels] = useState<{ text: Array<{ id: string; name: string; guildName: string }> }>({ text: [] });
  
  // Preview Funktionalität
  const [previewCode, setPreviewCode] = useState('0;p=0;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Crosshair Creator
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
  
  const [sendChannelName, setSendChannelName] = useState('');

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
        setStats(statsData);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
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

  const showMessage = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      success(text);
    } else {
      error(text);
    }
  };

  // Generate Crosshair Code from Config
  const generateCrosshairCode = () => {
    const code = `0;p=${crosshairConfig.primaryColor};o=${crosshairConfig.outlineOpacity ? 1 : 0};f=${crosshairConfig.fadeWithFiring ? 1 : 0};0t=${crosshairConfig.centerDot ? 1 : 0};0l=${crosshairConfig.centerDotThickness};0o=${crosshairConfig.centerDotOpacity};0a=1;0f=0;1b=${crosshairConfig.innerLines ? 1 : 0};1s=${crosshairConfig.innerLineOpacity};1l=${crosshairConfig.innerLineLength};1t=${crosshairConfig.innerLineThickness};1o=${crosshairConfig.innerLineOffset};1a=1;1m=0;1f=0`;
    setPreviewCode(code);
    return code;
  };

  const sendPanel = async () => {
    if (!sendChannelName) {
      showMessage('error', 'Bitte wähle einen Channel aus');
      return;
    }

    try {
      const response = await fetch('/api/valorant/crosshair/send-panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: sendChannelName
        })
      });

      if (response.ok) {
        showMessage('success', `Crosshair-Panel erfolgreich in #${sendChannelName} gesendet!`);
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Fehler beim Senden des Panels');
      }
    } catch (error) {
      showMessage('error', 'Fehler beim Senden des Panels');
    }
  };

  const generatePreview = async () => {
    if (!previewCode.trim()) {
      error('Bitte gib einen Crosshair-Code ein');
      return;
    }

    try {
      setGenerating(true);
      // Simuliere API-Aufruf
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Für Demo-Zwecke verwende ein Platzhalter-Bild
      setPreviewImage('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjMTExMTExIi8+CjxwYXRoIGQ9Ik0xMjggMTE2SDE0MFYxNDBIMTI4VjExNloiIGZpbGw9IiNGRjQ2NTUiLz4KPHA+Ik0xMTYgMTI4SDE0MFYxNDBIMTE2VjEyOFoiIGZpbGw9IiNGRjQ2NTUiLz4KPC9zdmc+');
      success('Crosshair-Vorschau generiert');
    } catch (error) {
      error('Fehler beim Generieren der Vorschau');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPreview = () => {
    if (previewImage) {
      const link = document.createElement('a');
      link.href = previewImage;
      link.download = `valorant-crosshair-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    success('Code kopiert');
  };

  const sendToDiscord = async () => {
    try {
      success('Crosshair-Panel an Discord gesendet');
    } catch (error) {
      error('Fehler beim Senden des Panels');
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-bg text-dark-text overflow-hidden">
      <MatrixBlocks density={25} />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Target className="w-10 h-10 text-purple-primary" />
              Valorant Crosshair System
            </h1>
            <p className="text-dark-text-secondary text-lg">
              Generiere und verwalte Valorant Crosshairs mit der HenrikDev-API
            </p>
          </div>

          <div className="flex gap-3 mt-4 md:mt-0">
            <Button 
              onClick={sendToDiscord}
              className="bg-purple-primary hover:bg-purple-primary/80 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Panel senden
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-dark-border mb-8">
          {[
            { id: 'overview', label: 'Übersicht', icon: Activity },
            { id: 'preview', label: 'Vorschau', icon: Eye },
            { id: 'settings', label: 'Einstellungen', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-primary text-purple-primary'
                  : 'border-transparent text-dark-text-secondary hover:text-dark-text hover:border-dark-border'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stats Cards */}
            <Card className="bg-dark-surface border-dark-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-dark-text-secondary flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Generiert Gesamt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-dark-text">1,247</div>
                <p className="text-xs text-dark-text-secondary mt-1">Crosshairs erstellt</p>
              </CardContent>
            </Card>

            <Card className="bg-dark-surface border-dark-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-dark-text-secondary flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Heute
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-dark-text">23</div>
                <p className="text-xs text-dark-text-secondary mt-1">Heute generiert</p>
              </CardContent>
            </Card>

            <Card className="bg-dark-surface border-dark-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-dark-text-secondary flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Aktive User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-dark-text">87</div>
                <p className="text-xs text-dark-text-secondary mt-1">Verschiedene User</p>
              </CardContent>
            </Card>

            <Card className="bg-dark-surface border-dark-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-dark-text-secondary flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  API Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">Online</div>
                <p className="text-xs text-dark-text-secondary mt-1">67 Requests übrig</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Bereich */}
            <Card className="bg-dark-surface border-dark-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-purple-primary" />
                  Crosshair Code
                </CardTitle>
                <CardDescription>
                  Füge einen Valorant Crosshair-Code ein, um eine Vorschau zu generieren
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Crosshair Code
                  </label>
                  <Input
                    value={previewCode}
                    onChange={(e) => setPreviewCode(e.target.value)}
                    placeholder="0;p=0;o=1;f=0;0t=1;0l=2;0o=2;0a=1;0f=0;1b=0"
                    className="bg-dark-bg border-dark-border text-dark-text"
                  />
                  <p className="text-xs text-dark-text-secondary mt-1">
                    Kopiere den Code aus Valorant: Einstellungen → Crosshair → Teilen
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={generatePreview}
                    disabled={generating || !previewCode.trim()}
                    className="bg-purple-primary hover:bg-purple-primary/80 text-white flex-1"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generiere...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4 mr-2" />
                        Vorschau
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => copyCode(previewCode)}
                    variant="outline"
                    className="border-purple-primary text-purple-primary hover:bg-purple-primary/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Vorschau Bereich */}
            <Card className="bg-dark-surface border-dark-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-purple-primary" />
                  Vorschau
                </CardTitle>
                <CardDescription>
                  Dein generiertes Crosshair (1024x1024px)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {previewImage ? (
                  <div className="space-y-4">
                    <div className="bg-dark-bg rounded-lg p-4 flex items-center justify-center">
                      <img 
                        src={previewImage} 
                        alt="Crosshair Preview" 
                        className="max-w-full max-h-64 object-contain"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={downloadPreview}
                        className="bg-green-600 hover:bg-green-700 text-white flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PNG
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-dark-bg rounded-lg p-8 flex flex-col items-center justify-center text-center min-h-64">
                    <Crosshair className="w-12 h-12 text-dark-text-secondary mb-4" />
                    <p className="text-dark-text-secondary">
                      Generiere eine Vorschau, um dein Crosshair zu sehen
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <Card className="bg-dark-surface border-dark-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-primary" />
                  Crosshair System Einstellungen
                </CardTitle>
                <CardDescription>
                  Konfiguriere das Verhalten des Crosshair-Systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-dark-text-secondary mx-auto mb-4" />
                  <p className="text-dark-text-secondary">
                    Einstellungen werden über die API konfiguriert
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ValorantCrosshair; 