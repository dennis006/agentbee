import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BarChart3, Settings, Plus, Trash2, Save, RefreshCw, Users, Activity, Zap, RotateCcw } from 'lucide-react';
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

// UI Components

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

const Label: React.FC<{ children: React.ReactNode; htmlFor?: string; className?: string }> = ({ children, htmlFor, className = '' }) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-dark-text ${className}`}>
    {children}
  </label>
);

interface ServerStatsChannel {
  enabled: boolean;
  channelId: string;
  name: string;
  position: number;
}

interface ServerStatsSettings {
  enabled: boolean;
  updateInterval: number;
  channels: {
    [key: string]: ServerStatsChannel;
  };
  categoryId: string;
  categoryName: string;
  permissions: {
    viewChannel: boolean;
    connect: boolean;
    speak: boolean;
    useVAD: boolean;
  };
  design: {
    emoji: string;
    color: string;
    separator: string;
    format: string;
  };
}

interface CurrentStats {
  memberCount: number;
  onlineCount: number;
  boostCount: number;
  channelCount: number;
  roleCount: number;
  serverLevel: number;
  createdDate: string;
  botCount: number;
}

const ServerStats: React.FC = () => {
  const { toasts, showSuccess, showError, removeToast } = useToast();
  
  // Wrapper functions for easier usage
  const success = (message: string) => showSuccess('Erfolg', message);
  const showErrorMsg = (message: string) => showError('Fehler', message);
  
  const [loading, setLoading] = useState(true);
  const [currentStats, setCurrentStats] = useState<CurrentStats | null>(null);
  const [serverInfo, setServerInfo] = useState<{ name: string; icon: string | null } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [settings, setSettings] = useState<ServerStatsSettings | null>(null);
  
  // Timer-Bar States
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  // API-Funktionen
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Lade Einstellungen
      const settingsRes = await fetch('/api/server-stats');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        // KOMPLETT ERSETZEN - keine Defaults verwenden!
        setSettings(settingsData.settings || settingsData);
      }
      
      // Lade aktuelle Stats
      const statsRes = await fetch('/api/server-stats/current');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setCurrentStats(statsData.stats);
        setServerInfo({
          name: statsData.serverName,
          icon: statsData.serverIcon
        });
      }
      
      // Lade Timer-Status vom Bot
      const timerRes = await fetch('/api/server-stats/timer-status');
      if (timerRes.ok) {
        const timerData = await timerRes.json();
        if (timerData.enabled) {
          setTotalTime(timerData.totalInterval);
          setTimeRemaining(timerData.timeRemaining);
          setIsTimerActive(true);
        } else {
          setIsTimerActive(false);
        }
      }
      
      // Update timestamp
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      showErrorMsg('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/server-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        showSuccess('Gespeichert', 'Server-Stats Einstellungen gespeichert!');
        // Lade die Daten neu, um sicherzustellen, dass sie korrekt gespeichert wurden
        await loadData();
      } else {
        const errorData = await response.json();
        showErrorMsg(`${errorData.error || 'Fehler beim Speichern der Einstellungen'}`);
      }
    } catch (error) {
      showErrorMsg('Netzwerkfehler beim Speichern');
    }
  };

  const createAllChannels = async () => {
    try {
      const response = await fetch('/api/server-stats/create-channels', {
        method: 'POST'
      });

      if (response.ok) {
        success('🎉 Alle Stats-Channels erfolgreich erstellt!');
        await loadData();
      } else {
        const errorData = await response.json();
        showErrorMsg(`${errorData.error || 'Fehler beim Erstellen der Channels'}`);
      }
    } catch (error) {
      showErrorMsg('Netzwerkfehler beim Erstellen der Channels');
    }
  };

  const deleteAllChannels = async () => {
    if (!confirm('Möchten Sie wirklich ALLE Stats-Channels löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
      return;
    }

    try {
      const response = await fetch('/api/server-stats/delete-channels', {
        method: 'DELETE'
      });

      if (response.ok) {
        success('🗑️ Alle Stats-Channels erfolgreich gelöscht!');
        await loadData();
      } else {
        const errorData = await response.json();
        showErrorMsg(`${errorData.error || 'Fehler beim Löschen der Channels'}`);
      }
    } catch (error) {
      showErrorMsg('Netzwerkfehler beim Löschen der Channels');
    }
  };

  const updateStatsNow = async () => {
    try {
      const response = await fetch('/api/server-stats/update-now', {
        method: 'POST'
      });

      if (response.ok) {
        success('🔄 Server-Stats erfolgreich aktualisiert!');
        await loadData(); // Lädt auch Timer-Status
        // Zusätzliche Timer-Synchronisation nach manuellem Update
        setTimeout(() => loadTimerStatus(), 1000);
      } else {
        showErrorMsg('Fehler beim Aktualisieren der Stats');
      }
    } catch (error) {
      showErrorMsg('Netzwerkfehler beim Aktualisieren');
    }
  };

  const validateChannels = async () => {
    try {
      const response = await fetch('/api/server-stats/validate-channels', {
        method: 'POST'
      });

      if (response.ok) {
        success('🔧 Stats-Channels validiert und repariert!');
        await loadData();
      } else {
        const errorData = await response.json();
        showErrorMsg(`${errorData.error || 'Fehler bei der Channel-Validierung'}`);
      }
    } catch (error) {
      showErrorMsg('Netzwerkfehler bei der Channel-Validierung');
    }
  };

  const cleanupDuplicates = async () => {
    if (!confirm('Möchten Sie alle doppelten Stats-Channels und -Kategorien löschen? Es wird nur die neueste Version behalten.')) {
      return;
    }

    try {
      const response = await fetch('/api/server-stats/cleanup-duplicates', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        success(data.message);
        await loadData();
      } else {
        const errorData = await response.json();
        showErrorMsg(`${errorData.error || 'Fehler bei der Bereinigung'}`);
      }
    } catch (error) {
      showErrorMsg('Netzwerkfehler bei der Bereinigung');
    }
  };

  const completeReset = async () => {
    if (!confirm('⚠️ ACHTUNG: Möchten Sie ALLE Stats-Channels und -Kategorien komplett löschen und neu erstellen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
      return;
    }

    if (!confirm('🔄 Sind Sie sich WIRKLICH sicher? Alle bestehenden Stats-Channels werden gelöscht und komplett neu erstellt!')) {
      return;
    }

    try {
      const response = await fetch('/api/server-stats/complete-reset', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        success(data.message);
        await loadData();
      } else {
        const errorData = await response.json();
        showErrorMsg(`${errorData.error || 'Fehler beim kompletten Reset'}`);
      }
    } catch (error) {
      showErrorMsg('Netzwerkfehler beim kompletten Reset');
    }
  };

  const testChannel = async (statType: string) => {
    try {
      const response = await fetch(`/api/server-stats/test-channel/${statType}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        success(`✅ ${statType} Channel getestet! Wert: ${data.value}`);
      } else {
        showErrorMsg(`Fehler beim Testen des ${statType} Channels`);
      }
    } catch (error) {
      showErrorMsg('Netzwerkfehler beim Testen');
    }
  };

  const updateChannelSetting = (channelType: string, field: string, value: any) => {
    setSettings(prev => prev ? ({
      ...prev,
      channels: {
        ...prev.channels,
        [channelType]: {
          ...prev.channels[channelType],
          [field]: value
        }
      }
    }) : null);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getStatIcon = (statType: string) => {
    const icons: { [key: string]: string } = {
      memberCount: '👥',
      onlineCount: '🟢',
      boostCount: '🚀',
      channelCount: '📺',
      roleCount: '🎭',
      serverLevel: '⭐',
      createdDate: '📅',
      botCount: '🤖'
    };
    return icons[statType] || '📊';
  };

  const getStatDisplayName = (statType: string) => {
    const names: { [key: string]: string } = {
      memberCount: 'Mitglieder',
      onlineCount: 'Online',
      boostCount: 'Boosts',
      channelCount: 'Kanäle',
      roleCount: 'Rollen',
      serverLevel: 'Server Level',
      createdDate: 'Erstellt am',
      botCount: 'Bots'
    };
    return names[statType] || statType;
  };

  // Timer-Bar Komponente
  const TimerBar = () => {
    if (!settings?.enabled || !isTimerActive) return null;

    const progress = ((totalTime - timeRemaining) / totalTime) * 100;
    const remainingSeconds = Math.ceil(timeRemaining / 1000);
    const totalSeconds = Math.ceil(totalTime / 1000);
    
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className={`bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow rounded-xl p-6 mb-6 transition-all duration-500 ${progress > 90 ? 'timer-glow' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <RefreshCw className={`w-6 h-6 text-green-400 transition-all duration-300 ${progress > 90 ? 'animate-spin text-yellow-400' : ''}`} />
              {progress > 90 && (
                <div className="absolute inset-0 animate-ping">
                  <RefreshCw className="w-6 h-6 text-yellow-500 opacity-30" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
                Nächstes Update
                {progress > 90 && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full animate-pulse">
                    Bald!
                  </span>
                )}
              </h3>
              <p className="text-sm text-dark-muted">Automatische Aktualisierung der Server-Statistiken</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold transition-all duration-300 ${progress > 90 ? 'text-yellow-400 animate-pulse' : 'text-neon-purple'}`}>
              {formatTime(remainingSeconds)}
            </div>
            <div className="text-xs text-dark-muted">von {formatTime(totalSeconds)}</div>
          </div>
        </div>
        
                {/* Progress Bar */}
        <div className="relative">
          <div className={`w-full bg-dark-bg/50 rounded-full h-4 overflow-hidden border transition-all duration-300 ${progress > 90 ? 'border-yellow-400/50 shadow-lg shadow-yellow-400/20' : 'border-purple-primary/20'}`}>
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-linear relative overflow-hidden ${
                progress > 90 
                  ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500' 
                  : 'bg-gradient-to-r from-green-400 via-blue-500 to-purple-600'
              }`}
              style={{ width: `${progress}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              
              {/* Moving highlight */}
              <div 
                className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                style={{
                  animation: 'slideHighlight 3s infinite linear',
                  animationDelay: `${(progress / 100) * 3}s`
                }}
              ></div>
              
              {/* Sparkle effects when near completion */}
              {progress > 80 && (
                <>
                  <div className="absolute top-1 right-2 w-1 h-1 bg-white rounded-full animate-ping"></div>
                  <div className="absolute bottom-1 right-4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute top-1 right-6 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                </>
              )}
            </div>
          </div>
          
          {/* Progress percentage */}
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-dark-muted">0%</span>
            <span className="text-sm font-medium text-purple-accent">{progress.toFixed(1)}%</span>
            <span className="text-xs text-dark-muted">100%</span>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center justify-center mt-4 gap-2">
          <div className="relative">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              progress > 90 ? 'bg-yellow-400 animate-pulse' : 
              progress > 50 ? 'bg-blue-400' : 'bg-green-400'
            }`}></div>
            {progress > 90 && (
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-yellow-400 animate-ping opacity-50"></div>
            )}
          </div>
          <span className={`text-xs transition-all duration-300 ${
            progress > 90 ? 'text-yellow-400 font-medium' : 'text-dark-muted'
          }`}>
            {progress > 90 ? '⚡ Update steht bevor...' : 
             progress > 50 ? '🔄 Timer läuft...' : '✅ Timer aktiv'}
          </span>
        </div>
        
        
      </div>
    );
  };

  // Timer-Bar Logic mit Bot-Synchronisation
  useEffect(() => {
    if (!settings?.enabled || !settings?.updateInterval) return;

    // Lokaler Timer für UI-Updates
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          // Timer fast abgelaufen, synchronisiere mit Bot
          loadTimerStatus();
          return prev;
        }
        return prev - 1000;
      });
    }, 1000);

    // Synchronisiere alle 10 Sekunden mit dem Bot
    const syncTimer = setInterval(() => {
      loadTimerStatus();
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(syncTimer);
    };
  }, [settings?.updateInterval, settings?.enabled]);

  // Lade Timer-Status vom Bot
  const loadTimerStatus = async () => {
    try {
      const timerRes = await fetch('/api/server-stats/timer-status');
      if (timerRes.ok) {
        const timerData = await timerRes.json();
        if (timerData.enabled) {
          setTotalTime(timerData.totalInterval);
          setTimeRemaining(timerData.timeRemaining);
          setIsTimerActive(true);
        } else {
          setIsTimerActive(false);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden des Timer-Status:', error);
    }
  };

  // Auto-Update System wie im Dashboard
  useEffect(() => {
    const fetchData = async (retryCount = 3) => {
      try {
        await loadData();
        // Timer wird automatisch durch loadData() synchronisiert
      } catch (error) {
        if (retryCount > 0) {
          setTimeout(() => fetchData(retryCount - 1), 1000);
        } else {
          console.error('Fehler beim automatischen Laden der Server Stats:', error);
        }
      }
    };

    // Initiales Laden nach kurzer Verzögerung
    setTimeout(() => fetchData(), 1000);
    
    // Automatisches Update alle 30 Sekunden (Server Stats ändern sich nicht so häufig wie Bot Status)
    const interval = setInterval(() => fetchData(), 30000);
    
    return () => clearInterval(interval);
  }, [settings?.updateInterval]);

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">📊</div>
          <div className="text-dark-text">Lade Server-Stats...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 animate-fade-in relative">
      {/* CSS Animations */}
      <style>{`
        @keyframes slideHighlight {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        
        @keyframes timerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .timer-glow {
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
        }
      `}</style>
      
      {/* Matrix Background Effects */}
      <MatrixBlocks density={25} />
      
      {/* Page Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BarChart3 className="w-12 h-12 text-green-400 animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-600">
            Server Statistiken
          </h1>
          <div className="relative">
            <Activity className="w-8 h-8 text-blue-400 animate-bounce" />
            <div className="absolute inset-0 animate-ping">
              <Activity className="w-8 h-8 text-blue-500 opacity-30" />
            </div>
          </div>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Zeige Live-Statistiken deines Servers in Voice-Channels an! 
          <span className="ml-2 inline-block relative">
            <svg 
              className="w-6 h-6 animate-pulse hover:animate-bounce text-green-400 hover:text-green-300 transition-all duration-300 hover:scale-110 drop-shadow-lg" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            <div className="absolute inset-0 animate-ping">
              <svg 
                className="w-6 h-6 text-green-500 opacity-30" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
            </div>
          </span>
        </div>
        <div className="w-32 h-1 bg-gradient-to-r from-green-400 to-blue-600 mx-auto mt-4 rounded-full animate-glow"></div>
      </div>

      {/* Timer Bar */}
      <TimerBar />

      {/* Current Server Stats */}
      {currentStats && serverInfo && (
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Aktuelle Server-Statistiken
              {serverInfo.icon && (
                <img src={serverInfo.icon} alt="Server Icon" className="w-6 h-6 rounded-full ml-2" />
              )}
              <span className="text-green-400">{serverInfo.name}</span>
              <div className="ml-auto flex items-center gap-2 text-sm">
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-dark-muted">Auto-Update aktiv</span>
              </div>
            </CardTitle>
            <CardDescription className="text-dark-muted flex items-center justify-between">
              <span>Live-Daten deines Discord-Servers</span>
              {lastUpdated && (
                <span className="text-xs text-purple-accent">
                  🕒 Zuletzt aktualisiert: {lastUpdated.toLocaleTimeString('de-DE')}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(currentStats).map(([key, value]) => (
                <div key={key} className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-neon-purple">{value}</div>
                      <div className="text-sm text-dark-muted">{getStatDisplayName(key)}</div>
                    </div>
                    <div className="text-2xl">{getStatIcon(key)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Settings */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-accent" />
            Grundeinstellungen
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere die Basis-Einstellungen für Server-Statistiken
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Enable/Disable & Update Interval */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
              <div>
                <Label className="text-base font-medium text-dark-text">Server-Stats aktiviert</Label>
                <p className="text-sm text-dark-muted mt-1">Automatische Aktualisierung der Stats</p>
              </div>
              <Switch
                checked={settings?.enabled || false}
                onCheckedChange={(checked) => setSettings(prev => prev ? ({ ...prev, enabled: checked }) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label>Update-Intervall</Label>
              <Select 
                value={settings?.updateInterval?.toString() || '300000'} 
                onValueChange={(value) => setSettings(prev => prev ? ({ ...prev, updateInterval: parseInt(value) }) : null)}
              >
                <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-surface border-purple-primary/30">
                  <SelectItem value="60000" className="text-dark-text hover:bg-purple-primary/20">1 Minute</SelectItem>
                  <SelectItem value="300000" className="text-dark-text hover:bg-purple-primary/20">5 Minuten</SelectItem>
                  <SelectItem value="600000" className="text-dark-text hover:bg-purple-primary/20">10 Minuten</SelectItem>
                  <SelectItem value="1800000" className="text-dark-text hover:bg-purple-primary/20">30 Minuten</SelectItem>
                  <SelectItem value="3600000" className="text-dark-text hover:bg-purple-primary/20">1 Stunde</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-dark-muted">Aktuell: {settings?.updateInterval ? formatDuration(settings.updateInterval) : '5 Minuten'}</p>
            </div>

            <div className="space-y-2">
              <Label>Kategorie-Name</Label>
              <Input
                value={settings?.categoryName || ''}
                onChange={(e) => setSettings(prev => prev ? ({ ...prev, categoryName: e.target.value }) : null)}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                placeholder="📊 Server Statistiken"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Channels Configuration */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-accent" />
            Stats-Channels
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere welche Statistiken als Voice-Channels angezeigt werden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settings?.channels ? Object.entries(settings.channels).map(([channelType, channelConfig]) => (
              <div key={channelType} className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getStatIcon(channelType)}</span>
                    <div>
                      <h4 className="font-medium text-dark-text">{getStatDisplayName(channelType)}</h4>
                      <p className="text-xs text-dark-muted">
                        {currentStats && `Aktuell: ${currentStats[channelType as keyof CurrentStats]}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={channelConfig.enabled}
                      onCheckedChange={(checked) => updateChannelSetting(channelType, 'enabled', checked)}
                    />
                    {channelConfig.enabled && (
                      <Button
                        onClick={() => testChannel(channelType)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2"
                        title="Channel testen"
                      >
                        <Zap className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {channelConfig.enabled && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-dark-muted">Channel-Name Template</Label>
                      <Input
                        value={channelConfig.name}
                        onChange={(e) => updateChannelSetting(channelType, 'name', e.target.value)}
                        className="bg-dark-bg border-purple-primary/30 text-dark-text focus:border-neon-purple"
                        placeholder={`${getStatIcon(channelType)} ${getStatDisplayName(channelType)}: {count}`}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-dark-muted">Position</Label>
                      <Input
                        type="number"
                        value={channelConfig.position}
                        onChange={(e) => updateChannelSetting(channelType, 'position', parseInt(e.target.value) || 0)}
                        className="bg-dark-bg border-purple-primary/30 text-dark-text focus:border-neon-purple"
                        min="0"
                        max="50"
                      />
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center text-dark-muted py-8">
                <p>Lade Konfiguration...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button 
          onClick={updateStatsNow}
          className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Stats jetzt aktualisieren
        </Button>
        
        <Button 
          onClick={validateChannels}
          className="bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105"
        >
          <Settings className="w-5 h-5 mr-2" />
          Channels reparieren
        </Button>
        
        <Button 
          onClick={cleanupDuplicates}
          className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          Duplikate bereinigen
        </Button>
        
        <Button 
          onClick={completeReset}
          className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 border-2 border-red-400"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Kompletter Reset
        </Button>
        
        <Button 
          onClick={createAllChannels}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105"
        >
          <Plus className="w-5 h-5 mr-2" />
          Alle Channels erstellen
        </Button>
        
        <Button 
          onClick={deleteAllChannels}
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          Alle Channels löschen
        </Button>
        
        <Button 
          onClick={saveSettings}
          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl shadow-neon-strong transition-all duration-300 hover:scale-105 text-lg"
        >
          <Save className="w-5 h-5 mr-2" />
          Einstellungen speichern
        </Button>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ServerStats; 