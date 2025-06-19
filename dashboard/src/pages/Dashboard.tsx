import { useState, useEffect } from 'react'
import { Play, Square, RotateCcw, Activity, Zap, Users, MessageSquare, Shield, X, Search, UserPlus } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useToast, ToastContainer } from '../components/ui/toast'
// Matrix Blocks Komponente direkt hier

interface BotStatus {
  isRunning: boolean;
  uptime: string;
  guilds: number;
  status: 'online' | 'offline' | 'starting' | 'stopping' | 'connecting' | 'error';
}

interface Command {
  name: string;
  description: string;
  category: string;
  usage: string;
  permissions: string;
  icon: string;
}

interface CommandsData {
  commands: Command[];
  stats: {
    total: number;
    byCategory: Record<string, number>;
  };
}

// Cooles Cyberpunk Flame SVG
const CyberFlame = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    className="inline-block ml-2"
    style={{filter: 'drop-shadow(0 0 8px #e879f9)'}}
  >
    <path 
      d="M12 2C8 6 6 10 8 14c1 2 3 3 4 4 1-1 3-2 4-4 2-4 0-8-4-12z" 
      fill="url(#flameGradient1)"
      className="animate-pulse-slow"
    />
    <path 
      d="M12 4C10 7 9 9 10 12c0.5 1.5 1.5 2 2 2.5 0.5-0.5 1.5-1 2-2.5 1-3 0-5-2-8z" 
      fill="url(#flameGradient2)"
    />
    <path 
      d="M12 6C11 8 10.5 9 11 11c0.3 1 1 1.5 1 1.5s0.7-0.5 1-1.5c0.5-2 0-3-1-5z" 
      fill="url(#flameCore)"
    />
    <circle cx="10" cy="8" r="0.5" fill="#e879f9" opacity="0.8">
      <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="14" cy="9" r="0.3" fill="#8b5cf6" opacity="0.6">
      <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="11" cy="11" r="0.4" fill="#c084fc" opacity="0.7">
      <animate attributeName="opacity" values="0;1;0" dur="1.8s" repeatCount="indefinite"/>
    </circle>
    
    <defs>
      <linearGradient id="flameGradient1" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#e879f9"/>
        <stop offset="50%" stopColor="#c084fc"/>
        <stop offset="100%" stopColor="#8b5cf6"/>
      </linearGradient>
      <linearGradient id="flameGradient2" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#c084fc"/>
        <stop offset="100%" stopColor="#a855f7"/>
      </linearGradient>
      <linearGradient id="flameCore" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#a855f7"/>
        <stop offset="100%" stopColor="#8b5cf6"/>
      </linearGradient>
    </defs>
  </svg>
);

// Robot SVG
const RobotIcon = () => (
  <svg 
    width="60" 
    height="60" 
    viewBox="0 0 100 100" 
    className="inline-block mr-4 animate-bounce-slow"
    style={{filter: 'drop-shadow(0 0 15px #e879f9)'}}
  >
    <rect x="20" y="35" width="60" height="50" rx="8" fill="url(#robotGradient)" stroke="#e879f9" strokeWidth="2"/>
    <rect x="25" y="15" width="50" height="35" rx="6" fill="url(#headGradient)" stroke="#e879f9" strokeWidth="2"/>
    <circle cx="35" cy="28" r="4" fill="#e879f9" className="animate-pulse">
      <animate attributeName="fill" values="#e879f9;#8b5cf6;#e879f9" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="65" cy="28" r="4" fill="#e879f9" className="animate-pulse">
      <animate attributeName="fill" values="#e879f9;#8b5cf6;#e879f9" dur="2s" repeatCount="indefinite"/>
    </circle>
    <rect x="40" y="38" width="20" height="3" rx="2" fill="#e879f9"/>
    <line x1="40" y1="15" x2="40" y2="8" stroke="#e879f9" strokeWidth="2"/>
    <line x1="60" y1="15" x2="60" y2="8" stroke="#e879f9" strokeWidth="2"/>
    <circle cx="40" cy="8" r="2" fill="#e879f9"/>
    <circle cx="60" cy="8" r="2" fill="#e879f9"/>
    <rect x="10" y="45" width="15" height="8" rx="4" fill="url(#robotGradient)" stroke="#e879f9" strokeWidth="1"/>
    <rect x="75" y="45" width="15" height="8" rx="4" fill="url(#robotGradient)" stroke="#e879f9" strokeWidth="1"/>
    <rect x="30" y="85" width="12" height="10" rx="2" fill="url(#robotGradient)" stroke="#e879f9" strokeWidth="1"/>
    <rect x="58" y="85" width="12" height="10" rx="2" fill="url(#robotGradient)" stroke="#e879f9" strokeWidth="1"/>
    <rect x="35" y="50" width="30" height="20" rx="3" fill="#1a1a2e" stroke="#8b5cf6" strokeWidth="1"/>
    <circle cx="42" cy="57" r="2" fill="#22c55e"/>
    <circle cx="50" cy="57" r="2" fill="#eab308"/>
    <circle cx="58" cy="57" r="2" fill="#ef4444"/>
    <rect x="38" y="65" width="24" height="2" rx="1" fill="#8b5cf6"/>
    
    <defs>
      <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1a1a2e"/>
        <stop offset="50%" stopColor="#16213e"/>
        <stop offset="100%" stopColor="#0a0a0f"/>
      </linearGradient>
      <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1a1a2e"/>
        <stop offset="100%" stopColor="#16213e"/>
      </linearGradient>
    </defs>
  </svg>
);

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

// Commands Modal Komponente
const CommandsModal = ({ isOpen, onClose, commands }: { isOpen: boolean; onClose: () => void; commands: CommandsData | null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen || !commands) return null;

  // Filter commands based on search and category
  const filteredCommands = commands.commands.filter(cmd => {
    const matchesSearch = cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cmd.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || cmd.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Object.keys(commands.stats.byCategory)];

  const getCategoryColor = (category: string) => {
    const colors = {
      'Moderation': 'text-red-400 border-red-400/30 bg-red-500/10',
      'XP System': 'text-purple-400 border-purple-400/30 bg-purple-500/10',
      'Utility': 'text-blue-400 border-blue-400/30 bg-blue-500/10',
      'Text Commands': 'text-green-400 border-green-400/30 bg-green-500/10',
      'Fun': 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10'
    };
    return colors[category] || 'text-gray-400 border-gray-400/30 bg-gray-500/10';
  };

  const getPermissionColor = (permission: string) => {
    if (permission === 'Alle') return 'text-green-400';
    if (permission === 'ADMINISTRATOR') return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-surface/95 backdrop-blur-xl border border-purple-primary/30 rounded-2xl shadow-purple-glow max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-primary/20">
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-neon flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-purple-accent" />
              Bot Commands ({commands.stats.total})
            </h2>
            <p className="text-dark-muted mt-1">Alle verfügbaren Befehle mit Details und Tooltips</p>
          </div>
          <Button
            onClick={onClose}
            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-400/30 rounded-xl p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-purple-primary/20">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-accent w-5 h-5" />
              <Input
                placeholder="Commands durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                      : 'bg-dark-bg/50 border-purple-primary/30 text-dark-muted hover:border-purple-accent hover:text-purple-accent'
                  }`}
                >
                  {category} {category !== 'All' && `(${commands.stats.byCategory[category]})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Commands Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-purple-accent/50 mx-auto mb-4" />
              <p className="text-dark-muted text-lg">Keine Commands gefunden</p>
              <p className="text-dark-muted/60 text-sm">Versuche einen anderen Suchbegriff oder wähle eine andere Kategorie</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCommands.map((command, index) => (
                <div
                  key={command.name}
                  className="bg-dark-bg/50 border border-purple-primary/20 rounded-xl p-4 hover:border-purple-accent/50 transition-all duration-300 hover:scale-105 group"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Command Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{command.icon}</span>
                      <code className="text-purple-accent font-bold text-lg group-hover:text-neon-purple transition-colors">
                        {command.name}
                      </code>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getCategoryColor(command.category)}`}>
                      {command.category}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-dark-text text-sm mb-3 leading-relaxed">
                    {command.description}
                  </p>

                  {/* Usage */}
                  <div className="mb-3">
                    <p className="text-xs text-purple-accent font-semibold mb-1">📝 Verwendung:</p>
                    <code className="text-xs bg-dark-surface/50 text-green-400 px-2 py-1 rounded border border-green-400/20">
                      {command.usage}
                    </code>
                  </div>

                  {/* Permissions */}
                  <div>
                    <p className="text-xs text-purple-accent font-semibold mb-1">🔐 Berechtigung:</p>
                    <span className={`text-xs font-medium ${getPermissionColor(command.permissions)}`}>
                      {command.permissions}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-purple-primary/20 bg-dark-bg/30">
          <div className="flex flex-wrap gap-4 text-sm text-dark-muted">
            <span>📊 Gesamt: <span className="text-purple-accent font-bold">{commands.stats.total}</span></span>
            <span>🔍 Gefiltert: <span className="text-neon-purple font-bold">{filteredCommands.length}</span></span>
            <span>📂 Kategorien: <span className="text-purple-accent font-bold">{Object.keys(commands.stats.byCategory).length}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  // API Base URL
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  // Toast System
  const {
    toasts,
    removeToast,
    updateToast,
    showBotStarting,
    showBotStopping,
    showBotRestarting,
    showSuccess,
    showError
  } = useToast();
  
  const [botStatus, setBotStatus] = useState<BotStatus>({
    isRunning: false,
    uptime: '0s',
    guilds: 0,
    status: 'offline'
  });

  const [commands, setCommands] = useState<CommandsData | null>(null);
  const [showCommandsModal, setShowCommandsModal] = useState(false);

  // Discord Bot Invite Link Generator
  const generateInviteLink = () => {
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || '1196189658391826483'; // Fallback
    const permissions = '8'; // Administrator permissions
    const scopes = 'bot%20applications.commands';
    
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scopes}`;
  };

  const inviteBot = () => {
    const inviteUrl = generateInviteLink();
    window.open(inviteUrl, '_blank', 'width=500,height=700');
  };

  // API-Funktionen mit schönen Toasts
  const startBot = async () => {
    const toastId = showBotStarting();
    
    try {
      // Simuliere Progress-Updates
      updateToast(toastId, { progress: 20 });
      
      const response = await fetch(`${apiUrl}/api/bot/start`, { method: 'POST' });
      
      updateToast(toastId, { progress: 60 });
      
      if (response.ok) {
        const data = await response.json();
        updateToast(toastId, { progress: 100 });
        
        // Entferne Loading-Toast und zeige Success
        setTimeout(() => {
          removeToast(toastId);
          showSuccess('Bot gestartet! 🚀', 'Der Bot ist erfolgreich online gegangen und bereit für Action!');
        }, 500);
      } else {
        removeToast(toastId);
        showError('Start fehlgeschlagen', 'Der Bot konnte nicht gestartet werden. Prüfe Railway Logs.');
      }
    } catch (error) {
      removeToast(toastId);
      showError('Verbindungsfehler', 'Keine Verbindung zu Railway möglich. Prüfe deine Internetverbindung.');
    }
  };

  const stopBot = async () => {
    const toastId = showBotStopping();
    
    try {
      updateToast(toastId, { progress: 25 });
      
      const response = await fetch(`${apiUrl}/api/bot/stop`, { method: 'POST' });
      
      updateToast(toastId, { progress: 75 });
      
      if (response.ok) {
        updateToast(toastId, { progress: 100 });
        
        setTimeout(() => {
          removeToast(toastId);
          showSuccess('Bot gestoppt! ✋', 'Der Bot wurde erfolgreich heruntergefahren.');
        }, 500);
      } else {
        removeToast(toastId);
        showError('Stop fehlgeschlagen', 'Der Bot konnte nicht gestoppt werden.');
      }
    } catch (error) {
      removeToast(toastId);
      showError('Verbindungsfehler', 'Keine Verbindung zu Railway möglich.');
    }
  };

  const restartBot = async () => {
    const toastId = showBotRestarting();
    
    try {
      updateToast(toastId, { progress: 20, message: 'Graceful Bot Restart...' });
      
      // Railway-Safe Restart
      const restartResponse = await fetch(`${apiUrl}/api/bot/restart`, { method: 'POST' });
      
      updateToast(toastId, { progress: 60, message: 'Bot wird sicher neugestartet...' });
      
      if (restartResponse.ok) {
        updateToast(toastId, { progress: 100, message: 'Railway-Safe Restart eingeleitet!' });
        
        setTimeout(() => {
          removeToast(toastId);
          showSuccess('Bot neugestartet! 🔄', 'Discord-Verbindung wurde sicher neugestartet ohne Container-Crash.');
        }, 500);
      } else {
        removeToast(toastId);
        showError('Restart fehlgeschlagen', 'Der sichere Bot-Restart ist fehlgeschlagen.');
      }
    } catch (error) {
      removeToast(toastId);
      showError('Verbindungsfehler', 'Railway Container ist möglicherweise gecrasht. Manueller Redeploy nötig.');
    }
  };

  // Commands laden
  const fetchCommands = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/commands`);
      if (response.ok) {
        const data = await response.json();
        setCommands(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Commands:', error);
    }
  };

  // Status-Updates mit verbesserter Fehlerbehandlung
  useEffect(() => {
    let retryDelay = 1000; // Start mit 1 Sekunde
    const maxRetryDelay = 30000; // Max 30 Sekunden
    let consecutiveFailures = 0;
    
    const fetchStatus = async () => {
      try {
        console.log(`🔍 Fetching bot status from: ${apiUrl}/api/bot/status`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s Timeout
        
        const response = await fetch(`${apiUrl}/api/bot/status`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
        console.log(`📄 Response Headers:`, response.headers.get('content-type'));
        
        if (response.ok) {
          // Prüfe Content-Type vor JSON parsing
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('✅ Erfolgreiche JSON Response:', data);
            setBotStatus(data);
            
            // Reset retry delay bei erfolgreichem Request
            retryDelay = 1000;
            consecutiveFailures = 0;
          } else {
            // HTML Response statt JSON
            const htmlText = await response.text();
            console.error('❌ Erhaltene HTML statt JSON:', htmlText.substring(0, 200) + '...');
            console.error('🚨 Railway sendet HTML-Fehlerseite!');
            
            setBotStatus(prev => ({ 
              ...prev, 
              status: 'error', 
              isRunning: false 
            }));
            consecutiveFailures++;
          }
        } else if (response.status === 502) {
          // 502 Bad Gateway - Railway startet noch
          console.log('🚂 Railway Container startet noch (502 Bad Gateway)');
          setBotStatus(prev => ({ 
            ...prev, 
            status: 'starting', 
            isRunning: false 
          }));
          consecutiveFailures++;
        } else if (response.status === 503) {
          // 503 Service Unavailable
          console.log('⚠️ Railway Service temporär nicht verfügbar (503)');
          setBotStatus(prev => ({ 
            ...prev, 
            status: 'connecting', 
            isRunning: false 
          }));
          consecutiveFailures++;
        } else {
          // Andere HTTP Fehler - Lass uns sehen was zurückkommt
          const errorText = await response.text();
          console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
          console.error('📄 Error Response Body:', errorText.substring(0, 300) + '...');
          consecutiveFailures++;
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('⏱️ Request timeout - Railway möglicherweise überlastet');
        } else if (error.message.includes('Unexpected token')) {
          console.error('🚨 JSON Parse Error - Railway sendet HTML statt JSON!');
          console.error('💡 Lösung: Railway Container manuell neustarten');
        } else {
          console.error('❌ Fehler beim Laden des Bot-Status:', error);
        }
        
        consecutiveFailures++;
        
        // Nach vielen Fehlern auf offline setzen
        if (consecutiveFailures >= 5) {
          console.log('🔴 Zu viele Fehler - Status auf offline gesetzt');
          setBotStatus(prev => ({ 
            ...prev, 
            status: 'offline', 
            isRunning: false 
          }));
        } else {
          setBotStatus(prev => ({ 
            ...prev, 
            status: 'connecting', 
            isRunning: false 
          }));
        }
      }
      
      // Exponential backoff bei Fehlern
      if (consecutiveFailures > 0) {
        retryDelay = Math.min(retryDelay * 1.5, maxRetryDelay);
        console.log(`⏰ Nächster Retry in ${retryDelay}ms (Attempt ${consecutiveFailures})`);
      }
    };

    // Verhindere Race Conditions mit einem single call system
    let isFetching = false;
    
    const safeFetchStatus = async () => {
      if (isFetching) {
        console.log('⏸️ Fetch bereits im Gange - überspringe Aufruf');
        return;
      }
      
      isFetching = true;
      try {
        await fetchStatus();
      } finally {
        isFetching = false;
      }
    };
    
    // Initial fetch mit Verzögerung (nur EINMAL)
    const initialTimeout = setTimeout(() => safeFetchStatus(), 2000);
    
    // Polling interval mit dynamischem Delay (mit Race Condition Schutz)
    const interval = setInterval(() => {
      safeFetchStatus();
    }, consecutiveFailures > 0 ? retryDelay : 3000); // 3s normal für schnellere Updates, exponential bei Fehlern
    
    // Commands laden (mit eigener Fehlerbehandlung)
    fetchCommands();
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'starting': return 'text-yellow-400';
      case 'stopping': return 'text-orange-400';
      case 'connecting': return 'text-blue-400';
      case 'error': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '🟢';
      case 'offline': return '🔴';
      case 'starting': return '🟡';
      case 'stopping': return '🟠';
      case 'connecting': return '🔵';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  return (
    <div className="space-y-8 p-6 animate-fade-in">
      
      {/* Header mit Effekten */}
      <div className="relative text-center py-12 overflow-hidden">
        <MatrixBlocks density={30} />
        
        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-neon mb-4 flex items-center justify-center">
            <RobotIcon />
            DISCORD BOT
          </h1>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-primary to-neon-purple">
            COMMAND CENTER
          </h2>
          <div className="text-dark-text text-lg mt-4 max-w-2xl mx-auto">
                            Kontrolliere deinen Discord Bot AgentBee wie ein echter Profi 
            <CyberFlame />
          </div>
          <div className="w-32 h-1 bg-gradient-neon mx-auto mt-4 rounded-full animate-glow"></div>
        </div>
      </div>

      {/* Bot Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Status Card */}
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-neon hover:shadow-neon-strong transition-all duration-300 animate-fade-in hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Bot Status</CardTitle>
            <div className="relative">
              <Activity className="h-6 w-6 text-purple-primary animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-primary rounded-full animate-ping"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(botStatus.status)} flex items-center gap-2`}>
              <span className="text-2xl animate-bounce-slow">{getStatusIcon(botStatus.status)}</span>
              {botStatus.status.toUpperCase()}
            </div>
            <p className="text-xs text-dark-muted mt-2">
              ⏱️ Uptime: {botStatus.uptime}
            </p>
          </CardContent>
        </Card>

        {/* Server Count */}
        <Card 
          className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-neon hover:shadow-neon-strong transition-all duration-300 animate-fade-in hover:scale-105 cursor-pointer group" 
          style={{animationDelay: '0.1s'}}
          onClick={() => {
            // Navigation innerhalb des Dashboard-Systems
            const event = new CustomEvent('navigate-to-server-manager');
            window.dispatchEvent(event);
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text group-hover:text-blue-400 transition-colors">Server</CardTitle>
            <Users className="h-6 w-6 text-purple-accent group-hover:text-blue-400 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neon-purple group-hover:text-blue-400 transition-colors animate-pulse-slow">
              {botStatus.guilds}
            </div>
            <p className="text-xs text-dark-muted group-hover:text-blue-400/70 transition-colors">
              🌐 Aktive Verbindungen
            </p>
            <div className="mt-2 text-xs text-purple-accent/70 group-hover:text-blue-400 transition-colors">
              👆 Klicken für Server Manager
            </div>
          </CardContent>
        </Card>

        {/* Commands Card */}
        <Card 
          className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-neon hover:shadow-neon-strong transition-all duration-300 animate-fade-in hover:scale-105 cursor-pointer group" 
          style={{animationDelay: '0.2s'}}
          onClick={() => setShowCommandsModal(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text group-hover:text-purple-accent transition-colors">Commands</CardTitle>
            <MessageSquare className="h-6 w-6 text-purple-secondary group-hover:text-neon-purple transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-accent group-hover:text-neon-purple transition-colors">
              {commands?.stats.total || '...'}
            </div>
            <p className="text-xs text-dark-muted group-hover:text-purple-accent transition-colors">
              ⚡ Verfügbare Befehle
            </p>
            <div className="mt-2 text-xs text-purple-accent/70 group-hover:text-purple-accent transition-colors">
              👆 Klicken für Details
            </div>
          </CardContent>
        </Card>

        {/* Security Level */}
        <Card 
          className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-neon hover:shadow-neon-strong transition-all duration-300 animate-fade-in hover:scale-105 cursor-pointer group" 
          style={{animationDelay: '0.3s'}}
          onClick={() => {
            // Navigation innerhalb des Dashboard-Systems
            const event = new CustomEvent('navigate-to-security');
            window.dispatchEvent(event);
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text group-hover:text-green-400 transition-colors">Security</CardTitle>
            <Shield className="h-6 w-6 text-green-400 group-hover:text-green-300 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400 group-hover:text-green-300 transition-colors">
              SECURE
            </div>
            <p className="text-xs text-dark-muted group-hover:text-green-400/70 transition-colors">
              🛡️ Alle Systeme aktiv
            </p>
            <div className="mt-2 text-xs text-green-400/70 group-hover:text-green-400 transition-colors">
              👆 Klicken für Security Center
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow animate-fade-in" style={{animationDelay: '0.4s'}}>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Zap className="text-neon-purple animate-pulse" />
            Bot Control Panel
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Steuere deinen Bot mit ultimativer Power! 🚀
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Control Buttons - Coming Soon */}
          <div className="flex flex-wrap gap-4">
            <Button 
              disabled={true}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 opacity-60 cursor-not-allowed"
            >
              <Play className="w-5 h-5 mr-2" />
              🚧 Start Bot - Coming Soon
            </Button>
            
            <Button 
              disabled={true}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 opacity-60 cursor-not-allowed"
            >
              <Square className="w-5 h-5 mr-2" />
              🚧 Stop Bot - Coming Soon
            </Button>
            
            <Button 
              disabled={true}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 opacity-60 cursor-not-allowed"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              🚧 Restart Bot - Coming Soon
            </Button>
          </div>
          
          {/* Coming Soon Notice */}
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-600/20 border border-yellow-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🚧</div>
              <div>
                <h4 className="text-lg font-bold text-yellow-400 mb-1">
                  Bot Control Features - Coming Soon!
                </h4>
                <p className="text-dark-muted text-sm">
                  Diese Features erfordern Railway Pro Plan für die "ALWAYS" Restart Policy. 
                  Aktuell kann der Bot manuell über Railway Dashboard neugestartet werden.
                </p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-yellow-300">
                  <span className="bg-yellow-500/20 px-2 py-1 rounded-full">💫 Pro Plan Feature</span>
                  <span className="bg-yellow-500/20 px-2 py-1 rounded-full">🔧 In Entwicklung</span>
                  <span className="bg-yellow-500/20 px-2 py-1 rounded-full">🎯 Railway Pro erforderlich</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bot Einladung Section */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2">
                  🤖 Bot zu Discord Server hinzufügen
                </h4>
                <p className="text-dark-muted text-sm">
                  Lade AgentBee auf deinen Discord Server ein und profitiere von allen Features!
                </p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-blue-300">
                  <span className="bg-blue-500/20 px-2 py-1 rounded-full">✅ Moderation</span>
                  <span className="bg-blue-500/20 px-2 py-1 rounded-full">🎮 Gaming Features</span>
                  <span className="bg-blue-500/20 px-2 py-1 rounded-full">🎯 XP System</span>
                  <span className="bg-blue-500/20 px-2 py-1 rounded-full">🎁 Giveaways</span>
                </div>
              </div>
              
              <Button 
                onClick={inviteBot}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 hover:shadow-neon-strong"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                🚀 Jetzt einladen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commands Modal */}
      <CommandsModal 
        isOpen={showCommandsModal}
        onClose={() => setShowCommandsModal(false)}
        commands={commands}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

export default Dashboard 