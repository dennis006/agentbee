import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertCircle, Trophy, Target, Zap, Settings, Save, RotateCcw, Search, Clock, Star, Crown, TrendingUp, Users, Play, Pause, MessageCircle, Smile, Plus, Trash2, Eye } from 'lucide-react';
import { useToast, ToastContainer } from '../components/ui/toast';
import EmojiPicker from '../components/ui/emoji-picker';
import axios from 'axios';

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
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-purple-primary/30 rounded-lg text-xs text-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
      {title && <div className="font-medium text-blue-400 mb-1">{title}</div>}
      <div>{content}</div>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
    </div>
  </div>
);

// Alert components
const Alert: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 ${className}`}>
    {children}
  </div>
);

const AlertDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`text-sm text-yellow-200 ${className}`}>
    {children}
  </div>
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

// Interfaces
interface ValorantSettings {
  enabled: boolean;
  defaultRegion: string;
  refreshInterval: number;
  rateLimit: {
    current: number;
    limit: number;
    resetTime: number;
  };
  features: {
    mmrTracking: boolean;
    matchHistory: boolean;
    leaderboard: boolean;
    playerStats: boolean;
  };
  notifications: {
    rankUpdates: boolean;
    newMatches: boolean;
    channelName: string;
    autoPost: boolean;
  };
  outputFormat: {
    mode: 'embed' | 'card' | 'both';
    embedEnabled: boolean;
    cardEnabled: boolean;
  };
  visibility: {
    public: boolean;
    allowUserChoice: boolean;
  };
  rankRewards: {
    enabled: boolean;
    autoCreateRoles: boolean;
    removeOldRoles: boolean;
    rolePrefix: string;
    ranks: Array<{
      name: string;
      tierId: number;
      color: string;
      enabled: boolean;
      roleId: string | null;
    }>;
  };
  embed: {
    title: string;
    description: string;
    color: string;
    footer: string;
    thumbnail: 'valorant' | 'user' | 'custom' | 'none';
    customThumbnail: string;
    author: {
      enabled: boolean;
      name: string;
      iconUrl: string;
    };
    fields: Array<{
      name: string;
      value: string;
      inline: boolean;
    }>;
  };
  playerStatsEmbed: {
    title: string;
    description: string;
    color: string;
    footer: string;
    thumbnail: 'valorant' | 'user' | 'custom' | 'none';
    customThumbnail: string;
    author: {
      enabled: boolean;
      name: string;
      iconUrl: string;
    };
    fields: {
      [key: string]: {
        enabled: boolean;
        name: string;
        value: string;
        inline: boolean;
      };
      currentRank: {
        enabled: boolean;
        name: string;
        value: string;
        inline: boolean;
      };
      peakRank: {
        enabled: boolean;
        name: string;
        value: string;
        inline: boolean;
      };
      lastChange: {
        enabled: boolean;
        name: string;
        value: string;
        inline: boolean;
      };
      leaderboard: {
        enabled: boolean;
        name: string;
        value: string;
        inline: boolean;
      };
      matchStats: {
        enabled: boolean;
        name: string;
        value: string;
        inline: boolean;
      };
      kda: {
        enabled: boolean;
        name: string;
        value: string;
        inline: boolean;
      };
      precision: {
        enabled: boolean;
        name: string;
        value: string;
        inline: boolean;
      };
      damage: {
        enabled: boolean;
        name: string;
        value: string;
        inline: boolean;
      };
      seasonStats: {
        enabled: boolean;
        name: string;
        value: string;
        inline: boolean;
      };
    };
  };
}

interface PlayerStats {
  account: {
    name: string;
    tag: string;
    puuid: string;
  };
  current: {
    tier: {
      id: number;
      name: string;
    };
    rr: number;
    last_change: number;
    elo: number;
    leaderboard_placement?: {
      rank: number;
      updated_at: string;
    };
  };
  peak: {
    tier: {
      id: number;
      name: string;
    };
    season: {
      short: string;
    };
  };
}

interface MatchHistory {
  match_id: string;
  tier: {
    id: number;
    name: string;
  };
  map: {
    name: string;
  };
  rr: number;
  last_change: number;
  date: string;
}

interface ValorantStats {
  totalPlayers: number;
  activeTracking: number;
  totalSearches: number;
  apiCalls: number;
  systemEnabled: boolean;
  lastUpdate: string | null;
}

// Rate Limiter für API-Calls
class ValorantAPIRateLimit {
  private requests: number[] = [];
  private readonly limit = 30; // 30 Requests pro Minute
  private readonly window = 60000; // 1 Minute in ms

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.window);
    return this.requests.length < this.limit;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getRemaining(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.window);
    return Math.max(0, this.limit - this.requests.length);
  }

  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    return Math.max(0, this.window - (Date.now() - this.requests[0]));
  }
}

const Valorant: React.FC = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [settings, setSettings] = useState<ValorantSettings>({
    enabled: false,
    defaultRegion: 'eu',
    refreshInterval: 5,
    rateLimit: {
      current: 0,
      limit: 30,
      resetTime: 0
    },
    features: {
      mmrTracking: true,
      matchHistory: true,
      leaderboard: false,
      playerStats: true
    },
    notifications: {
      rankUpdates: false,
      newMatches: false,
      channelName: '',
      autoPost: false
    },
    outputFormat: {
      mode: 'both',
      embedEnabled: true,
      cardEnabled: true
    },
    visibility: {
      public: true,
      allowUserChoice: true
    },
    rankRewards: {
      enabled: false,
      autoCreateRoles: true,
      removeOldRoles: true,
      rolePrefix: 'Valorant',
      ranks: []
    },
    embed: {
      title: '🎯 Valorant Spielersuche',
      description: 'Klicke auf eine Region um deine Valorant-Statistiken abzurufen!',
      color: '0xFF4655',
      footer: 'Powered by HenrikDev API • {timestamp}',
      thumbnail: 'valorant',
      customThumbnail: '',
      author: {
        enabled: true,
        name: 'Valorant Stats Bot',
        iconUrl: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png'
      },
      fields: [
        {
          name: '🌍 Verfügbare Regionen',
          value: '🇪🇺 **EU** - Europa\n🇺🇸 **NA** - Nordamerika\n🌏 **AP** - Asien-Pazifik',
          inline: true
        },
        {
          name: '📊 Features',
          value: '• Aktueller Rang & RR\n• Peak Rang\n• Headshot-Rate\n• K/D Ratio\n• Win-Rate',
          inline: true
        },
        {
          name: '⚡ Rate-Limit',
          value: '30 Requests pro Minute\nFaire Nutzung für alle!',
          inline: true
        }
      ]
    },
    playerStatsEmbed: {
      title: '🎯 {playerName}#{playerTag}',
      description: '**Region:** {region} • **Plattform:** PC{level}',
      color: 'dynamic',
      footer: '🔥 Powered by HenrikDev API • Verbleibende Requests: {remainingRequests}/30 • {timestamp}',
      thumbnail: 'valorant',
      customThumbnail: '',
      author: {
        enabled: false,
        name: 'Valorant Player Stats',
        iconUrl: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png'
      },
      fields: {
        currentRank: {
          enabled: true,
          name: '🏆 Aktueller Rang',
          value: '**{currentRankName}**\n{currentRR} RR',
          inline: true
        },
        peakRank: {
          enabled: true,
          name: '⭐ Peak Rang',
          value: '**{peakRankName}**\nSeason {peakSeason}',
          inline: true
        },
        lastChange: {
          enabled: true,
          name: '📊 Letzte Änderung',
          value: '{lastChangePrefix}{lastChange} RR',
          inline: true
        },
        leaderboard: {
          enabled: true,
          name: '🏅 Leaderboard Position',
          value: '#{leaderboardPosition}',
          inline: true
        },
        matchStats: {
          enabled: true,
          name: '🎮 Match-Statistiken',
          value: '**Matches:** {totalMatches} ({wins}W/{losses}L)\n**Win-Rate:** {winRate}%',
          inline: true
        },
        kda: {
          enabled: true,
          name: '⚔️ K/D/A',
          value: '**K/D:** {kd}\n**Kills:** {kills} | **Deaths:** {deaths}\n**Assists:** {assists}',
          inline: true
        },
        precision: {
          enabled: true,
          name: '🎯 Präzision',
          value: '**Headshot-Rate:** {headshotRate}%\n**Headshots:** {headshots}\n**Body/Leg:** {bodyshots}/{legshots}',
          inline: true
        },
        damage: {
          enabled: true,
          name: '💥 Damage & Score',
          value: '**ADR:** {adr}\n**Total Damage:** {totalDamage}\n**Avg Score:** {averageScore}',
          inline: true
        },
        seasonStats: {
          enabled: true,
          name: '🏆 Season-Statistiken',
          value: '**Wins:** {seasonWins}\n**Games:** {seasonGames}\n**Win-Rate:** {seasonWinRate}%',
          inline: true
        }
      }
    }
  });

  const [stats, setStats] = useState<ValorantStats>({
    totalPlayers: 0,
    activeTracking: 0,
    totalSearches: 0,
    apiCalls: 0,
    systemEnabled: false,
    lastUpdate: null
  });

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  
  // Search Form States
  const [playerName, setPlayerName] = useState('');
  const [playerTag, setPlayerTag] = useState('');

  // Embed Configuration States
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const rateLimiter = new ValorantAPIRateLimit();
  const { toasts, removeToast, success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Parallel laden
      const [settingsRes, tokenRes] = await Promise.all([
        fetch('/api/valorant-settings'),
        fetch('/api/valorant/token-status')
      ]);

      const settingsData = await settingsRes.json();
      const tokenData = await tokenRes.json();

      if (settingsData.success) {
        // Standard-playerStatsEmbed-Konfiguration falls nicht vorhanden
        const defaultPlayerStatsEmbed = {
          title: '🎯 {playerName}#{playerTag}',
          description: '**Region:** {region} • **Plattform:** PC{level}',
          color: 'dynamic',
          footer: '🔥 Powered by HenrikDev API • Verbleibende Requests: {remainingRequests}/30 • {timestamp}',
          thumbnail: 'valorant',
          customThumbnail: '',
          author: {
            enabled: false,
            name: 'Valorant Player Stats',
            iconUrl: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png'
          },
          fields: {
            currentRank: {
              enabled: true,
              name: '🏆 Aktueller Rang',
              value: '**{currentRankName}**\n{currentRR} RR',
              inline: true
            },
            peakRank: {
              enabled: true,
              name: '⭐ Peak Rang',
              value: '**{peakRankName}**\nSeason {peakSeason}',
              inline: true
            },
            lastChange: {
              enabled: true,
              name: '📊 Letzte Änderung',
              value: '{lastChangePrefix}{lastChange} RR',
              inline: true
            },
            leaderboard: {
              enabled: true,
              name: '🏅 Leaderboard Position',
              value: '#{leaderboardPosition}',
              inline: true
            },
            matchStats: {
              enabled: true,
              name: '🎮 Match-Statistiken',
              value: '**Matches:** {totalMatches} ({wins}W/{losses}L)\n**Win-Rate:** {winRate}%',
              inline: true
            },
            kda: {
              enabled: true,
              name: '⚔️ K/D/A',
              value: '**K/D:** {kd}\n**Kills:** {kills} | **Deaths:** {deaths}\n**Assists:** {assists}',
              inline: true
            },
            precision: {
              enabled: true,
              name: '🎯 Präzision',
              value: '**Headshot-Rate:** {headshotRate}%\n**Headshots:** {headshots}\n**Body/Leg:** {bodyshots}/{legshots}',
              inline: true
            },
            damage: {
              enabled: true,
              name: '💥 Damage & Score',
              value: '**ADR:** {adr}\n**Total Damage:** {totalDamage}\n**Avg Score:** {averageScore}',
              inline: true
            },
            seasonStats: {
              enabled: true,
              name: '🏆 Season-Statistiken',
              value: '**Wins:** {seasonWins}\n**Games:** {seasonGames}\n**Win-Rate:** {seasonWinRate}%',
              inline: true
            }
          }
        };

        // Merge mit Standard-Einstellungen um fehlende Felder zu vermeiden
        setSettings(prev => ({
          ...prev,
          ...settingsData.settings,
          notifications: {
            ...prev.notifications,
            ...settingsData.settings.notifications
          },
          embed: {
            ...prev.embed,
            ...settingsData.settings.embed,
            author: {
              ...prev.embed.author,
              ...settingsData.settings.embed?.author
            },
            fields: settingsData.settings.embed?.fields || prev.embed.fields
          },
          playerStatsEmbed: {
            ...defaultPlayerStatsEmbed,
            ...settingsData.settings.playerStatsEmbed,
            author: {
              ...defaultPlayerStatsEmbed.author,
              ...settingsData.settings.playerStatsEmbed?.author
            },
            fields: {
              ...defaultPlayerStatsEmbed.fields,
              ...settingsData.settings.playerStatsEmbed?.fields
            }
          }
        }));
      }

      if (tokenData.success && tokenData.valid) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
      }

      // Echte Statistiken laden
      try {
        const statsRes = await fetch('/api/valorant/stats');
        const statsData = await statsRes.json();
        
        if (statsData.success) {
          setStats({
            totalPlayers: statsData.stats.totalPlayers,
            activeTracking: statsData.stats.activeTracking,
            totalSearches: statsData.stats.totalSearches,
            apiCalls: statsData.stats.apiCalls,
            systemEnabled: statsData.stats.systemEnabled,
            lastUpdate: statsData.stats.lastUpdate
          });
        } else {
          // Fallback zu Standard-Werten
          const currentSettings = settingsData.success ? settingsData.settings : settingsData;
          setStats({
            totalPlayers: 0,
            activeTracking: 0,
            totalSearches: 0,
            apiCalls: rateLimiter.getRemaining(),
            systemEnabled: currentSettings?.enabled || false,
            lastUpdate: new Date().toISOString()
          });
        }
      } catch (statsError) {
        console.warn('❌ Fehler beim Laden der Valorant-Statistiken:', statsError);
        // Fallback zu Standard-Werten
        const currentSettings = settingsData.success ? settingsData.settings : settingsData;
        setStats({
          totalPlayers: 0,
          activeTracking: 0,
          totalSearches: 0,
          apiCalls: rateLimiter.getRemaining(),
          systemEnabled: currentSettings?.enabled || false,
          lastUpdate: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('❌ Fehler beim Laden der Valorant-Daten:', error);
      showMessage('error', 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/valorant-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.success || response.ok) {
        showMessage('success', 'Valorant-Einstellungen gespeichert!');
        await loadData();
      } else {
        showMessage('error', data.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      showMessage('error', 'Fehler beim Speichern der Einstellungen');
    }
  };

  const toggleValorantSystem = async () => {
    try {
      const newEnabled = !settings.enabled;
      setSettings(prev => ({ ...prev, enabled: newEnabled }));
      
      showMessage('success', newEnabled ? 'Valorant-System aktiviert!' : 'Valorant-System deaktiviert!');
      await loadData();
    } catch (error) {
      console.error('❌ Fehler beim Umschalten:', error);
      showMessage('error', 'Fehler beim Umschalten des Systems');
    }
  };

  const searchPlayer = async () => {
    if (!playerName.trim() || !playerTag.trim()) {
      showMessage('error', 'Bitte Spielername und Tag eingeben');
      return;
    }

    if (!rateLimiter.canMakeRequest()) {
      showMessage('error', 'Rate-Limit erreicht. Bitte warte einen Moment.');
      return;
    }

    try {
      setSearchLoading(true);
      setApiError('');
      rateLimiter.recordRequest();

      // MMR-Daten abrufen
      const mmrResponse = await fetch(`/api/valorant/mmr/${settings.defaultRegion}/pc/${playerName}/${playerTag}`);
      const mmrData = await mmrResponse.json();

      if (mmrData.success && mmrData.data) {
        setPlayerStats(mmrData.data);
        showMessage('success', `Spielerdaten für ${playerName}#${playerTag} geladen!`);
        
        // Statistiken nach erfolgreicher Suche neu laden
        setTimeout(() => {
          loadData();
        }, 1000);

        // Match-Historie abrufen
        try {
          const historyResponse = await fetch(`/api/valorant/history/${settings.defaultRegion}/pc/${playerName}/${playerTag}`);
          const historyData = await historyResponse.json();
          
          if (historyData.success && historyData.data) {
            setMatchHistory(historyData.data.slice(0, 10)); // Nur die letzten 10 Matches
          }
        } catch (historyError) {
          console.warn('Match-Historie konnte nicht geladen werden:', historyError);
        }

      } else {
        const errorMsg = mmrData.error || 'Spieler nicht gefunden oder API-Token nicht konfiguriert';
        setApiError(errorMsg);
        setPlayerStats(null);
        setMatchHistory([]);
        showMessage('error', errorMsg);
      }

    } catch (error) {
      console.error('❌ Fehler bei der Spielersuche:', error);
      setApiError('Fehler bei der API-Anfrage');
      setPlayerStats(null);
      setMatchHistory([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      showSuccess(text);
    } else {
      showError(text);
    }
  };

  // Alle Valorant-Rollen erstellen
  const createValorantRoles = async () => {
    if (searchLoading) return;
    
    try {
      setSearchLoading(true);
      
      const response = await fetch('/api/valorant/create-rank-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rolePrefix: settings.rankRewards.rolePrefix || 'Valorant',
          enabledRanks: settings.rankRewards.ranks.filter(rank => rank.enabled)
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        showMessage('success', 
          `🎯 Valorant-Rollen Setup abgeschlossen! ` +
          `${data.created.length} neue Rollen erstellt, ${data.existing.length} bereits vorhanden.`
        );
        console.log('Erstellte Valorant-Rollen:', data.created);
        console.log('Bereits vorhandene Rollen:', data.existing);
        
        // Settings neu laden, um die Role-IDs zu aktualisieren
        loadData();
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Fehler beim Erstellen der Valorant-Rollen');
      }
    } catch (error) {
      showMessage('error', 'Verbindungsfehler beim Erstellen der Valorant-Rollen');
    } finally {
      setSearchLoading(false);
    }
  };

  const postInteractiveMessage = async () => {
    if (!settings.notifications.channelName?.trim()) {
      showMessage('error', 'Bitte gib einen Channel-Namen ein!');
      return;
    }

    try {
      const response = await fetch('/api/valorant/post-interactive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          channelName: settings.notifications.channelName 
        })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', `Interaktive Nachricht in #${settings.notifications.channelName} gepostet!`);
      } else {
        showMessage('error', data.error || 'Fehler beim Posten der Nachricht');
      }
    } catch (error) {
      console.error('❌ Fehler beim Posten der interaktiven Nachricht:', error);
      showMessage('error', 'Fehler beim Posten der Nachricht');
    }
  };

  const getRankColor = (tierId: number): string => {
    const colors: Record<number, string> = {
      0: 'text-gray-400',      // Unranked
      3: 'text-yellow-600',    // Iron
      6: 'text-yellow-500',    // Bronze
      9: 'text-gray-300',      // Silver
      12: 'text-yellow-400',   // Gold
      15: 'text-cyan-400',     // Platinum
      18: 'text-blue-400',     // Diamond
      21: 'text-red-400',      // Ascendant
      24: 'text-purple-400',   // Immortal
      27: 'text-yellow-300'    // Radiant
    };
    return colors[tierId] || 'text-gray-400';
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    if (diffHours > 0) return `vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`;
    return 'vor wenigen Minuten';
  };

  const formatLastUpdate = (lastUpdate: string | null) => {
    if (!lastUpdate) return 'Noch nie';
    const date = new Date(lastUpdate);
    return date.toLocaleString('de-DE');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg relative overflow-hidden">
        <MatrixBlocks />
        <div className="relative z-10 p-8">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-primary mx-auto"></div>
              <p className="text-dark-text mt-4">Lade Valorant-Daten...</p>
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
          <Target className="w-12 h-12 text-purple-primary animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-primary to-purple-secondary">
            Valorant Tracker
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Verfolge deine Valorant-Statistiken, MMR und Match-Historie.
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
      <div className="flex justify-center gap-4 flex-wrap">
        <Button
          onClick={toggleValorantSystem}
          className={`${settings.enabled ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent'} text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2`}
        >
          {settings.enabled ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          <span>{settings.enabled ? 'System Deaktivieren' : 'System Aktivieren'}</span>
        </Button>
        <Button 
          onClick={saveSettings} 
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>Einstellungen Speichern</span>
        </Button>
        <Button 
          onClick={postInteractiveMessage}
          disabled={!settings.notifications.channelName?.trim()}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:hover:scale-100"
        >
          <Target className="h-5 w-5" />
          <span>Interaktive Nachricht Posten</span>
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
              <CardTitle className="text-sm font-medium text-dark-text">API Requests</CardTitle>
              <Zap className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{rateLimiter.getRemaining()}/30</div>
              <p className="text-xs text-dark-muted">
                verbleibend
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Spieler Suchen</CardTitle>
              <Search className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{stats.totalSearches}</div>
              <p className="text-xs text-dark-muted">
                insgesamt
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Aktive Tracker</CardTitle>
              <Users className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{stats.activeTracking}</div>
              <p className="text-xs text-dark-muted">
                überwacht
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Letzte Aktualisierung</CardTitle>
              <Clock className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{formatLastUpdate(stats.lastUpdate)}</div>
              <p className="text-xs text-dark-muted">
                alle {settings.refreshInterval} Min.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Token Warning */}
      {!tokenValid && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Valorant API-Token nicht konfiguriert!</strong><br />
            Gehe zu <strong>Settings &gt; API Keys</strong> und füge deinen Valorant API-Token hinzu, um die Spielersuche zu aktivieren.
            <br />
            <span className="text-sm opacity-75">
              Du kannst einen kostenlosen API-Token im HenrikDev Discord Server (#get-a-key) erhalten.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="search" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30">
          <TabsTrigger 
            value="search" 
            className={`flex items-center space-x-2 ${activeTab === 'search' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('search')}
          >
            <Search className="h-4 w-4" />
            <span>Suche</span>
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
            value="output" 
            className={`flex items-center space-x-2 ${activeTab === 'output' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('output')}
          >
            <Target className="h-4 w-4" />
            <span>Output</span>
          </TabsTrigger>
          <TabsTrigger 
            value="rewards" 
            className={`flex items-center space-x-2 ${activeTab === 'rewards' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('rewards')}
          >
            <Crown className="h-4 w-4" />
            <span>Belohnungen</span>
          </TabsTrigger>
          <TabsTrigger 
            value="embeds" 
            className={`flex items-center space-x-2 ${activeTab === 'embeds' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('embeds')}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Embeds</span>
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6" activeTab={activeTab}>
      {/* Player Search */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-accent" />
            Spieler Suchen
            <Tooltip 
              title="🔍 Spielersuche erklärt:"
              content={
                <div>
                  <div>Suche nach Valorant-Spielern über die HenrikDev API</div>
                  <div>• Rate-Limit: 30 Requests pro Minute</div>
                  <div>• Unterstützte Regionen: EU, NA, AP, KR</div>
                </div>
              }
            />
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Durchsuche Valorant-Spielerdaten und MMR-Statistiken
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Region</Label>
                <Tooltip 
                  title="🌍 Region erklärt:"
                  content={
                    <div>
                      <div>Wähle die Valorant-Region des Spielers</div>
                      <div>• EU: Europa • NA: Nordamerika</div>
                      <div>• AP: Asien-Pazifik • KR: Korea</div>
                    </div>
                  }
                />
              </div>
              <Select 
                value={settings.defaultRegion} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, defaultRegion: value }))}
              >
                <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eu">Europe</SelectItem>
                  <SelectItem value="na">North America</SelectItem>
                  <SelectItem value="ap">Asia Pacific</SelectItem>
                  <SelectItem value="kr">Korea</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Spielername</Label>
                <Tooltip 
                  title="👤 Spielername erklärt:"
                  content="Der Valorant-Spielername (ohne #Tag)"
                />
              </div>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="z.B. Henrik3"
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
              />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Tag</Label>
                <Tooltip 
                  title="🏷️ Tag erklärt:"
                  content="Der Valorant-Tag (ohne # Symbol)"
                />
              </div>
              <Input
                value={playerTag}
                onChange={(e) => setPlayerTag(e.target.value)}
                placeholder="z.B. VALO"
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
              />
            </div>
            
            <div>
              <Label>&nbsp;</Label>
              <Button
                onClick={searchPlayer}
                disabled={searchLoading || !settings.enabled || !tokenValid}
                className="w-full bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-2 px-4 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                {searchLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Suche...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Suchen
                  </div>
                )}
              </Button>
            </div>
          </div>
          
          {apiError && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                {apiError}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Player Stats Display */}
      {playerStats && (
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-accent" />
              Spieler Statistiken
            </CardTitle>
            <CardDescription className="text-dark-muted">
              Aktuelle Rang- und Leistungsdaten für {playerStats.account.name}#{playerStats.account.tag}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Rank */}
              <div className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <Crown className={`w-6 h-6 ${getRankColor(playerStats.current.tier.id)}`} />
                  <div>
                    <h3 className="font-medium text-dark-text">Aktueller Rang</h3>
                    <p className={`text-lg font-bold ${getRankColor(playerStats.current.tier.id)}`}>
                      {playerStats.current.tier.name}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-dark-muted">RR:</span>
                    <span className="text-dark-text font-medium">{playerStats.current.rr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Letzte Änderung:</span>
                    <span className={`font-medium ${
                      playerStats.current.last_change > 0 ? 'text-green-400' : 
                      playerStats.current.last_change < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {playerStats.current.last_change > 0 ? '+' : ''}{playerStats.current.last_change}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-muted">ELO:</span>
                    <span className="text-dark-text font-medium">{playerStats.current.elo}</span>
                  </div>
                </div>
              </div>

              {/* Peak Rank */}
              <div className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <Star className={`w-6 h-6 ${getRankColor(playerStats.peak.tier.id)}`} />
                  <div>
                    <h3 className="font-medium text-dark-text">Höchster Rang</h3>
                    <p className={`text-lg font-bold ${getRankColor(playerStats.peak.tier.id)}`}>
                      {playerStats.peak.tier.name}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Season:</span>
                    <span className="text-dark-text font-medium">{playerStats.peak.season.short}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match History */}
      {matchHistory.length > 0 && (
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-accent" />
              Match Historie
            </CardTitle>
            <CardDescription className="text-dark-muted">
              Die letzten {matchHistory.length} Competitive Matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matchHistory.map((match, index) => (
                <div key={match.match_id} className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        match.last_change > 0 ? 'bg-green-500' : 
                        match.last_change < 0 ? 'bg-red-500' : 'bg-gray-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-dark-text">{match.map.name}</p>
                        <p className="text-sm text-dark-muted">{formatTimeAgo(match.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getRankColor(match.tier.id)}`}>
                        {match.tier.name}
                      </p>
                      <p className={`text-sm font-medium ${
                        match.last_change > 0 ? 'text-green-400' : 
                        match.last_change < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {match.last_change > 0 ? '+' : ''}{match.last_change} RR
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6" activeTab={activeTab}>
      {/* System Settings */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-accent" />
            System Einstellungen
            <Tooltip 
              title="⚙️ System Einstellungen erklärt:"
              content={
                <div>
                  <div>Konfiguration für das Valorant-Tracking System</div>
                  <div>• Features: Aktiviere/Deaktiviere Funktionen</div>
                  <div>• Benachrichtigungen: Discord-Notifications</div>
                </div>
              }
            />
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere die Valorant-Integration und Features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Features */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white">Features</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.features.mmrTracking}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    features: { ...prev.features, mmrTracking: checked }
                  }))}
                />
                <div className="flex items-center gap-2">
                  <Label>MMR Tracking</Label>
                  <Tooltip 
                    title="📊 MMR Tracking erklärt:"
                    content="Verfolgt automatisch MMR-Änderungen der Spieler"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.features.matchHistory}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    features: { ...prev.features, matchHistory: checked }
                  }))}
                />
                <div className="flex items-center gap-2">
                  <Label>Match Historie</Label>
                  <Tooltip 
                    title="📈 Match Historie erklärt:"
                    content="Zeigt die letzten Competitive Matches an"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.features.playerStats}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    features: { ...prev.features, playerStats: checked }
                  }))}
                />
                <div className="flex items-center gap-2">
                  <Label>Spieler Statistiken</Label>
                  <Tooltip 
                    title="📋 Spieler Stats erklärt:"
                    content="Detaillierte Statistiken und Rang-Informationen"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.features.leaderboard}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    features: { ...prev.features, leaderboard: checked }
                  }))}
                />
                <div className="flex items-center gap-2">
                  <Label>Leaderboard</Label>
                  <Tooltip 
                    title="🏆 Leaderboard erklärt:"
                    content="Server-Rangliste der besten Spieler"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Refresh Interval */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label>Aktualisierungsintervall (Minuten)</Label>
              <Tooltip 
                title="⏰ Aktualisierung erklärt:"
                content={
                  <div>
                    <div>Wie oft das System nach Updates suchen soll</div>
                    <div>Beachte das API Rate-Limit von 30/min</div>
                  </div>
                }
              />
            </div>
            <select
              value={settings.refreshInterval}
              onChange={(e) => setSettings({...settings, refreshInterval: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-dark-bg/70 border border-purple-primary/30 rounded-md text-dark-text focus:border-purple-primary focus:outline-none"
            >
              <option value={5}>5 Minuten</option>
              <option value={10}>10 Minuten</option>
              <option value={15}>15 Minuten</option>
              <option value={30}>30 Minuten</option>
              <option value={60}>1 Stunde</option>
            </select>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white">Benachrichtigungen</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.notifications.rankUpdates}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, rankUpdates: checked }
                  }))}
                />
                <div className="flex items-center gap-2">
                  <Label>Rang Updates</Label>
                  <Tooltip 
                    title="🔔 Rang Updates erklärt:"
                    content="Benachrichtigung bei Rang-Änderungen"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.notifications.newMatches}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, newMatches: checked }
                  }))}
                />
                <div className="flex items-center gap-2">
                  <Label>Neue Matches</Label>
                  <Tooltip 
                    title="🎮 Neue Matches erklärt:"
                    content="Benachrichtigung bei neuen Competitive Matches"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Benachrichtigungs-Channel</Label>
                <Tooltip 
                  title="📺 Channel erklärt:"
                  content="Discord-Channel für Valorant-Benachrichtigungen"
                />
              </div>
              <Input
                value={settings.notifications.channelName}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, channelName: e.target.value }
                }))}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                placeholder="valorant-updates"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.notifications.autoPost}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, autoPost: checked }
                }))}
              />
              <div className="flex items-center gap-2">
                <Label>Auto-Post Interaktive Nachricht</Label>
                <Tooltip 
                  title="🤖 Auto-Post erklärt:"
                  content={
                    <div>
                      <div>Bot postet automatisch eine interaktive Nachricht</div>
                      <div>• Spieler können Region, Name & Tag eingeben</div>
                      <div>• Rate-Limit: 30 Requests pro Minute</div>
                      <div>• Automatische Statistik-Anzeige</div>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Output Tab */}
        <TabsContent value="output" className="space-y-6" activeTab={activeTab}>
          {/* Output Format Configuration */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-accent" />
            Output Format Konfiguration
            <Tooltip 
              title="🎨 Output Format erklärt:"
              content={
                <div>
                  <div>Wähle, wie Valorant-Statistiken angezeigt werden sollen</div>
                  <div>• Discord Embed: Klassische Discord-Nachricht</div>
                  <div>• Valorant Card: Generiertes Bild im Valorant-Design</div>
                  <div>• Beide: Sowohl Embed als auch Card</div>
                </div>
              }
            />
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere, ob Discord Embeds, Valorant Cards oder beides gesendet werden soll
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Output Mode Selection */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm font-medium text-dark-text">Output Modus</label>
              <Tooltip 
                title="📤 Output Modus erklärt:"
                content={
                  <div>
                    <div>• Discord Embed: Nur klassische Discord-Nachricht</div>
                    <div>• Valorant Card: Nur generiertes Bild</div>
                    <div>• Beide: Discord Embed + Valorant Card</div>
                  </div>
                }
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Discord Embed Option */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  settings.outputFormat?.mode === 'embed' 
                    ? 'border-purple-primary bg-purple-primary/10 shadow-purple-glow' 
                    : 'border-purple-primary/30 bg-dark-bg/50 hover:border-purple-accent'
                }`}
                onClick={() => setSettings(prev => ({
                  ...prev,
                  outputFormat: { mode: 'embed', embedEnabled: true, cardEnabled: false }
                }))}
              >
                <div className="text-center">
                  {/* Preview Image */}
                  <div className="mb-3 mx-auto w-full max-w-[200px] h-[130px] rounded-lg overflow-hidden border border-purple-primary/20">
                    <img 
                      src="/images/valorant-previews/discord-embed-preview.svg" 
                      alt="Discord Embed Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <MessageCircle className="w-6 h-6 text-purple-accent mx-auto mb-2" />
                  <h4 className="font-semibold text-dark-text mb-1">Discord Embed</h4>
                  <p className="text-xs text-dark-muted">Klassische Discord-Nachricht mit Feldern</p>
                </div>
              </div>

              {/* Valorant Card Option */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  settings.outputFormat?.mode === 'card' 
                    ? 'border-purple-primary bg-purple-primary/10 shadow-purple-glow' 
                    : 'border-purple-primary/30 bg-dark-bg/50 hover:border-purple-accent'
                }`}
                onClick={() => setSettings(prev => ({
                  ...prev,
                  outputFormat: { mode: 'card', embedEnabled: false, cardEnabled: true }
                }))}
              >
                <div className="text-center">
                  {/* Preview Image */}
                  <div className="mb-3 mx-auto w-full max-w-[200px] h-[130px] rounded-lg overflow-hidden border border-purple-primary/20">
                    <img 
                      src="/images/valorant-previews/valorant-card-preview.svg" 
                      alt="Valorant Card Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Target className="w-6 h-6 text-purple-accent mx-auto mb-2" />
                  <h4 className="font-semibold text-dark-text mb-1">Valorant Card</h4>
                  <p className="text-xs text-dark-muted">SVG-basiertes Bild mit echten Rang-Icons & Agenten</p>
                </div>
              </div>

              {/* Both Option */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  settings.outputFormat?.mode === 'both' 
                    ? 'border-purple-primary bg-purple-primary/10 shadow-purple-glow' 
                    : 'border-purple-primary/30 bg-dark-bg/50 hover:border-purple-accent'
                }`}
                onClick={() => setSettings(prev => ({
                  ...prev,
                  outputFormat: { mode: 'both', embedEnabled: true, cardEnabled: true }
                }))}
              >
                <div className="text-center">
                  {/* Preview Image */}
                  <div className="mb-3 mx-auto w-full max-w-[200px] h-[130px] rounded-lg overflow-hidden border border-purple-primary/20">
                    <img 
                      src="/images/valorant-previews/both-preview.svg" 
                      alt="Both Formats Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex justify-center items-center gap-1 mb-2">
                    <MessageCircle className="w-5 h-5 text-purple-accent" />
                    <Plus className="w-4 h-4 text-dark-muted" />
                    <Target className="w-5 h-5 text-purple-accent" />
                  </div>
                  <h4 className="font-semibold text-dark-text mb-1">Beide</h4>
                  <p className="text-xs text-dark-muted">Discord Embed + Valorant Card</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Information */}
          <div className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-purple-accent" />
              <span className="text-sm font-medium text-dark-text">Aktueller Modus:</span>
            </div>
            <div className="text-sm text-dark-muted">
              {settings.outputFormat?.mode === 'embed' && (
                <span>📝 Nur Discord Embed wird gesendet</span>
              )}
              {settings.outputFormat?.mode === 'card' && (
                <span>🖼️ Nur Valorant Card (SVG-basiert mit echten Icons) wird gesendet</span>
              )}
              {settings.outputFormat?.mode === 'both' && (
                <span>📝🖼️ Sowohl Discord Embed als auch Valorant Card (SVG-basiert) werden gesendet</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visibility Settings */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-accent" />
            Sichtbarkeits-Einstellungen
            <Tooltip 
              title="👁️ Sichtbarkeit erklärt:"
              content={
                <div>
                  <div>Bestimme, wer die Valorant Cards sehen kann:</div>
                  <div>• Öffentlich: Alle im Channel können sie sehen</div>
                  <div>• Privat: Nur der Benutzer sieht sie</div>
                  <div>• Benutzer-Wahl: Benutzer kann selbst entscheiden</div>
                </div>
              }
            />
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere, ob Valorant Cards öffentlich oder privat angezeigt werden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Default Visibility */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-dark-text">Standard-Sichtbarkeit</Label>
                <p className="text-xs text-dark-muted mt-1">
                  Wie werden Valorant Cards standardmäßig angezeigt?
                </p>
              </div>
              <Switch
                checked={settings.visibility.public}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  visibility: { ...prev.visibility, public: checked }
                }))}
              />
            </div>
            
            <div className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${settings.visibility.public ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-dark-text">
                  {settings.visibility.public ? '🌍 Öffentlich - Alle können die Cards sehen' : '🔒 Privat - Nur der Benutzer sieht die Cards'}
                </span>
              </div>
            </div>
          </div>

          {/* User Choice */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-dark-text">Benutzer-Wahl erlauben</Label>
                <p className="text-xs text-dark-muted mt-1">
                  Sollen Benutzer selbst entscheiden können, ob ihre Cards öffentlich oder privat sind?
                </p>
              </div>
              <Switch
                checked={settings.visibility.allowUserChoice}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  visibility: { ...prev.visibility, allowUserChoice: checked }
                }))}
              />
            </div>
            
            {settings.visibility.allowUserChoice && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-400 text-sm">
                  <span>ℹ️</span>
                  <span>Benutzer können mit einem Button zwischen öffentlich/privat wechseln</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6" activeTab={activeTab}>
          {/* Rank Rewards System */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-accent" />
                Rang-Belohnungssystem
                <Tooltip 
                  title="👑 Rang-Belohnungen erklärt:"
                  content={
                    <div>
                      <div>Automatische Discord-Rollen basierend auf Valorant-Rängen</div>
                      <div>• Erstellt Rollen für jeden Valorant-Rang</div>
                      <div>• Vergibt Rollen automatisch bei Stats-Abfrage</div>
                      <div>• Entfernt alte Rollen bei Rang-Änderungen</div>
                    </div>
                  }
                />
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Automatische Discord-Rollen basierend auf Valorant-Rängen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* System Enable/Disable */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg font-medium text-dark-text">Rang-Belohnungssystem aktivieren</Label>
                  <p className="text-sm text-dark-muted mt-1">
                    Automatische Discord-Rollen basierend auf Valorant-Rängen
                  </p>
                </div>
                <Switch
                  checked={settings.rankRewards.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    rankRewards: { ...prev.rankRewards, enabled: checked }
                  }))}
                />
              </div>

              {settings.rankRewards.enabled && (
                <>
                  {/* Role Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-dark-text mb-2 block">Rollen-Präfix</Label>
                      <Input
                        value={settings.rankRewards.rolePrefix}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          rankRewards: { ...prev.rankRewards, rolePrefix: e.target.value }
                        }))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                        placeholder="Valorant"
                      />
                      <p className="text-xs text-dark-muted mt-1">
                        Beispiel: "Valorant" → "Valorant Gold 1"
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-dark-text">Rollen automatisch erstellen</Label>
                        <Switch
                          checked={settings.rankRewards.autoCreateRoles}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            rankRewards: { ...prev.rankRewards, autoCreateRoles: checked }
                          }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-dark-text">Alte Rollen entfernen</Label>
                        <Switch
                          checked={settings.rankRewards.removeOldRoles}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            rankRewards: { ...prev.rankRewards, removeOldRoles: checked }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Automatische Valorant-Rollen */}
                  <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-primary/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-dark-text flex items-center gap-2">
                          🎯 Automatische Valorant-Rollen
                          <Tooltip 
                            title="🎯 Automatische Rollen erklärt:"
                            content={
                              <div>
                                <div>Erstellt automatisch Discord-Rollen für alle Valorant-Ränge:</div>
                                <div>• 🥉 Iron 1-3 (Grau-Braun)</div>
                                <div>• 🥈 Bronze 1-3 (Bronze)</div>
                                <div>• 🥇 Silver 1-3 (Silber)</div>
                                <div>• 🏅 Gold 1-3 (Gold)</div>
                                <div>• 💎 Platinum 1-3 (Platin)</div>
                                <div>• 💠 Diamond 1-3 (Diamant)</div>
                                <div>• ⚡ Ascendant 1-3 (Grün)</div>
                                <div>• 🔥 Immortal 1-3 (Rot)</div>
                                <div>• ⭐ Radiant (Gold)</div>
                                <br/>
                                <div>System vergibt automatisch die entsprechende Rang-Rolle!</div>
                              </div>
                            }
                          />
                        </h4>
                        <p className="text-dark-muted text-sm">
                          Erstellt automatisch alle 27 Valorant-Rang-Rollen mit authentischen Farben
                        </p>
                      </div>
                      <Button
                        onClick={createValorantRoles}
                        disabled={searchLoading || !settings.rankRewards.enabled}
                        className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-primary text-white font-bold py-2 px-4 rounded-xl neon-shadow transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                      >
                        {searchLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Erstelle...</span>
                          </>
                        ) : (
                          <>
                            <Crown className="h-5 w-5" />
                            <span>Valorant-Rollen erstellen</span>
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Rollen-Vorschau */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                        <span className="text-dark-text">🥉 Iron 1-3</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-amber-600"></div>
                        <span className="text-dark-text">🥈 Bronze 1-3</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span className="text-dark-text">🥇 Silver 1-3</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-dark-text">🏅 Gold 1-3</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                        <span className="text-dark-text">💎 Platinum 1-3</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                        <span className="text-dark-text">💠 Diamond 1-3</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span className="text-dark-text">⚡ Ascendant 1-3</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-dark-text">🔥 Immortal 1-3</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <span className="text-dark-text">⭐ Radiant</span>
                      </div>
                    </div>
                  </div>

                  {/* Rank List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-purple-accent">🏆 Valorant Ränge</h3>
                      <Badge variant="outline" className="text-xs">
                        {settings.rankRewards.ranks.filter(rank => rank.enabled).length} / {settings.rankRewards.ranks.length} aktiv
                      </Badge>
                    </div>
                    
                    <div className="bg-dark-bg/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {settings.rankRewards.ranks.map((rank, index) => (
                          <div key={rank.tierId} className="bg-dark-surface/50 rounded-lg p-3 border border-purple-primary/20">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full border border-purple-primary/30"
                                  style={{ backgroundColor: rank.color }}
                                ></div>
                                <span className="text-sm font-medium text-dark-text">{rank.name}</span>
                              </div>
                              <Switch
                                checked={rank.enabled}
                                onCheckedChange={(checked) => {
                                  const newRanks = [...settings.rankRewards.ranks];
                                  newRanks[index].enabled = checked;
                                  setSettings(prev => ({
                                    ...prev,
                                    rankRewards: { ...prev.rankRewards, ranks: newRanks }
                                  }));
                                }}
                              />
                            </div>
                            
                            <div className="text-xs text-dark-muted">
                              <div>Tier ID: {rank.tierId}</div>
                              <div>Rolle: {rank.roleId ? '✅ Erstellt' : '⏳ Wird erstellt'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-400 text-lg">ℹ️</span>
                      <div className="text-sm text-blue-200">
                        <div className="font-medium mb-2">Wie funktioniert das Rang-Belohnungssystem?</div>
                        <ul className="space-y-1 text-xs">
                          <li>• Wenn ein Benutzer seine Valorant-Stats abruft, wird sein Rang erkannt</li>
                          <li>• Der Bot erstellt automatisch eine Discord-Rolle für diesen Rang (falls nicht vorhanden)</li>
                          <li>• Der Benutzer erhält die entsprechende Rang-Rolle</li>
                          <li>• Bei Rang-Änderungen wird die alte Rolle entfernt und die neue vergeben</li>
                          <li>• Rollen haben die gleichen Farben wie die Valorant-Ränge</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Embeds Tab */}
        <TabsContent value="embeds" className="space-y-6" activeTab={activeTab}>
      {/* Embed Configuration */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-accent" />
            Discord Embed Konfiguration
            <Tooltip 
              title="🎨 Embed Konfiguration erklärt:"
              content={
                <div>
                  <div>Anpassung der Discord-Nachricht für interaktive Valorant-Suche</div>
                  <div>• Titel, Beschreibung, Farbe und Footer</div>
                  <div>• Thumbnail und Author-Einstellungen</div>
                  <div>• Embed-Felder für zusätzliche Informationen</div>
                </div>
              }
            />
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere das Aussehen der interaktiven Valorant-Nachrichten in Discord
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Basic Embed Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Embed Titel</label>
              <div className="relative">
                <Input
                  value={settings.embed.title}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    embed: { ...prev.embed, title: e.target.value }
                  }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary pr-10"
                  placeholder="🎯 Valorant Spielersuche"
                />
                <button
                  onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'title' ? null : 'title')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-purple-accent transition-colors duration-200 hover:scale-110"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-dark-text">Embed Farbe</label>
                <Tooltip 
                  title="🎨 Embed Farbe erklärt:"
                  content="Die Farbe des seitlichen Balkens in der Discord Nachricht"
                />
              </div>
              <div className="flex gap-3 items-center">
                {/* Color Picker */}
                <div className="relative">
                  <input
                    type="color"
                    value={settings.embed.color.startsWith('0x') ? `#${settings.embed.color.slice(2)}` : settings.embed.color.startsWith('#') ? settings.embed.color : '#FF4655'}
                    onChange={(e) => {
                      const hexColor = e.target.value;
                      const discordColor = `0x${hexColor.slice(1).toUpperCase()}`;
                      setSettings(prev => ({
                        ...prev,
                        embed: { ...prev.embed, color: discordColor }
                      }));
                    }}
                    className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 bg-dark-bg cursor-pointer hover:border-purple-accent transition-all duration-300 hover:scale-105"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-accent to-purple-secondary rounded-full animate-ping opacity-60"></div>
                </div>
                
                {/* Hex Input */}
                <div className="flex-1">
                  <Input
                    value={settings.embed.color}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      embed: { ...prev.embed, color: e.target.value }
                    }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-accent font-mono"
                    placeholder="0xFF4655"
                  />
                </div>

                {/* Color Preview */}
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                  style={{
                    backgroundColor: settings.embed.color.startsWith('0x') ? `#${settings.embed.color.slice(2)}` : settings.embed.color.startsWith('#') ? settings.embed.color : '#FF4655',
                    filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                  }}
                >
                  🎯
                </div>
              </div>
              
              {/* Preset Colors */}
              <div className="mt-3">
                <p className="text-xs text-dark-muted mb-2">Valorant Farben:</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { name: 'Valorant Rot', color: '0xFF4655' },
                    { name: 'Sage Grün', color: '0x5FB85F' },
                    { name: 'Jett Blau', color: '0x0F1B3C' },
                    { name: 'Phoenix Orange', color: '0xFF8C00' },
                    { name: 'Viper Grün', color: '0x00FF41' },
                    { name: 'Reyna Lila', color: '0x8A2BE2' },
                    { name: 'Omen Blau', color: '0x4169E1' },
                    { name: 'Radiant Gold', color: '0xFFD700' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        embed: { ...prev.embed, color: preset.color }
                      }))}
                      className="w-8 h-8 rounded-lg border border-purple-primary/30 hover:border-purple-accent transition-all duration-300 hover:scale-110 relative group"
                      style={{
                        backgroundColor: `#${preset.color.slice(2)}`,
                        filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.2))'
                      }}
                      title={preset.name}
                    >
                      <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-dark-text mb-2 block">Embed Beschreibung</label>
            <div className="relative">
              <Textarea
                value={settings.embed.description}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  embed: { ...prev.embed, description: e.target.value }
                }))}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary pr-10"
                placeholder="Klicke auf eine Region um deine Valorant-Statistiken abzurufen!"
                rows={3}
              />
              <button
                onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'description' ? null : 'description')}
                className="absolute right-2 top-2 text-dark-muted hover:text-purple-accent transition-colors duration-200 hover:scale-110"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div>
            <label className="text-sm font-medium text-dark-text mb-2 block">Footer Text</label>
            <Input
              value={settings.embed.footer}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                embed: { ...prev.embed, footer: e.target.value }
              }))}
              className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
              placeholder="Powered by HenrikDev API • {timestamp}"
            />
            <p className="text-xs text-dark-muted mt-1">
              Verfügbare Platzhalter: <code>{'{timestamp}'}</code>, <code>{'{date}'}</code>, <code>{'{time}'}</code>
            </p>
          </div>

          {/* Thumbnail Settings */}
          <div>
            <label className="text-sm font-medium text-dark-text mb-3 block">Thumbnail</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'none', label: 'Kein Thumbnail', emoji: '🚫' },
                { value: 'valorant', label: 'Valorant Logo', emoji: '🎯' },
                { value: 'user', label: 'Bot Avatar', emoji: '🤖' },
                { value: 'custom', label: 'Eigene URL', emoji: '🖼️' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    embed: { ...prev.embed, thumbnail: option.value as any }
                  }))}
                  className={`p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                    settings.embed.thumbnail === option.value
                      ? 'border-purple-accent bg-purple-accent/20 shadow-purple-glow'
                      : 'border-purple-primary/30 bg-dark-bg/50 hover:border-purple-accent/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.emoji}</div>
                  <div className="text-xs text-dark-text font-medium">{option.label}</div>
                </button>
              ))}
            </div>

            {settings.embed.thumbnail === 'custom' && (
              <div className="mt-4">
                <label className="text-sm font-medium text-dark-text mb-2 block">Custom Thumbnail URL</label>
                <Input
                  value={settings.embed.customThumbnail}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    embed: { ...prev.embed, customThumbnail: e.target.value }
                  }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                  placeholder="https://example.com/thumbnail.png"
                />
              </div>
            )}
          </div>

          {/* Author Settings */}
          <div className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-dark-text">Author Einstellungen</h4>
              <Switch
                checked={settings.embed.author.enabled}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  embed: { 
                    ...prev.embed, 
                    author: { ...prev.embed.author, enabled: checked }
                  }
                }))}
              />
            </div>
            
            {settings.embed.author.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Author Name</label>
                  <Input
                    value={settings.embed.author.name}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      embed: { 
                        ...prev.embed, 
                        author: { ...prev.embed.author, name: e.target.value }
                      }
                    }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                    placeholder="Valorant Stats Bot"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Author Icon URL</label>
                  <Input
                    value={settings.embed.author.iconUrl}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      embed: { 
                        ...prev.embed, 
                        author: { ...prev.embed.author, iconUrl: e.target.value }
                      }
                    }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                    placeholder="https://example.com/icon.png"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Embed Fields Configuration */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-accent" />
            Embed-Felder
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Füge zusätzliche Informations-Felder zu deiner interaktiven Valorant-Nachricht hinzu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-purple-accent">📝 Nachrichtenfelder</h3>
            <Button 
              onClick={() => setSettings(prev => ({
                ...prev,
                embed: {
                  ...prev.embed,
                  fields: [...prev.embed.fields, { name: 'Neues Feld', value: 'Beschreibung hier...', inline: false }]
                }
              }))}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-neon transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Feld hinzufügen
            </Button>
          </div>

          <div className="space-y-4">
            {settings.embed.fields.map((field, index) => (
              <div key={index} className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  <div className="md:col-span-3">
                    <label className="text-xs text-dark-muted mb-1 block">Feld Name</label>
                    <div className="relative">
                    <Input
                      value={field.name}
                      onChange={(e) => {
                        const newFields = [...settings.embed.fields];
                        newFields[index].name = e.target.value;
                        setSettings(prev => ({
                          ...prev,
                          embed: { ...prev.embed, fields: newFields }
                        }));
                      }}
                        className="bg-dark-bg border-purple-primary/30 text-dark-text focus:border-purple-accent pr-10"
                      placeholder="Feld Name"
                    />
                      <button
                        onClick={() => setEmojiPickerOpen(`embedFieldName-${index}`)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-purple-accent transition-colors duration-200 hover:scale-110"
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-6">
                    <label className="text-xs text-dark-muted mb-1 block">Feld Inhalt</label>
                    <div className="relative">
                    <Textarea
                      value={field.value}
                      onChange={(e) => {
                        const newFields = [...settings.embed.fields];
                        newFields[index].value = e.target.value;
                        setSettings(prev => ({
                          ...prev,
                          embed: { ...prev.embed, fields: newFields }
                        }));
                      }}
                        className="bg-dark-bg border-purple-primary/30 text-dark-text resize-none focus:border-purple-accent pr-10"
                      placeholder="Feld Inhalt..."
                      rows={2}
                    />
                      <button
                        onClick={() => setEmojiPickerOpen(`embedFieldValue-${index}`)}
                        className="absolute right-2 top-2 text-dark-muted hover:text-purple-accent transition-colors duration-200 hover:scale-110"
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-center justify-center">
                    <div className="flex items-center space-x-2 relative group">
                      <input
                        type="checkbox"
                        id={`inline-${index}`}
                        checked={field.inline}
                        onChange={(e) => {
                          const newFields = [...settings.embed.fields];
                          newFields[index].inline = e.target.checked;
                          setSettings(prev => ({
                            ...prev,
                            embed: { ...prev.embed, fields: newFields }
                          }));
                        }}
                        className="w-4 h-4 text-purple-accent bg-dark-bg border-purple-primary/30 rounded focus:ring-purple-accent focus:ring-2"
                      />
                      <label htmlFor={`inline-${index}`} className="text-xs text-dark-text">
                        Inline
                      </label>
                      <Tooltip 
                        title="💡 Inline erklärt:"
                        content={
                          <div>
                            <div>✅ AN: Felder nebeneinander (max. 3 pro Zeile)</div>
                            <div>❌ AUS: Felder untereinander</div>
                          </div>
                        }
                      />
                    </div>
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <Button 
                      onClick={() => {
                        const newFields = settings.embed.fields.filter((_, i) => i !== index);
                        setSettings(prev => ({
                          ...prev,
                          embed: { ...prev.embed, fields: newFields }
                        }));
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Player Stats Embed Configuration */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-accent" />
            Spielerstatistik-Embed Design
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere das Design der Valorant-Spielerstatistik-Embeds (wird angezeigt, wenn Spieler ihre Stats abrufen)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-sm font-medium text-dark-text">Titel Template</Label>
                <Tooltip 
                  title="🎯 Titel-Template erklärt:"
                  content={
                    <div>
                      <div>Verfügbare Platzhalter:</div>
                      <div>• {"{playerName}"} - Spielername</div>
                      <div>• {"{playerTag}"} - Spieler-Tag</div>
                    </div>
                  }
                />
              </div>
              <div className="relative">
                <Input
                  value={settings.playerStatsEmbed.title}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    playerStatsEmbed: { ...prev.playerStatsEmbed, title: e.target.value }
                  }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary pr-10"
                  placeholder="🎯 {playerName}#{playerTag}"
                />
                <button
                  onClick={() => setEmojiPickerOpen('playerStatsTitle')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-purple-accent transition-colors duration-200 hover:scale-110"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-sm font-medium text-dark-text">Beschreibung Template</Label>
                <Tooltip 
                  title="📝 Beschreibung-Template erklärt:"
                  content={
                    <div>
                      <div>Verfügbare Platzhalter:</div>
                      <div>• {"{region}"} - Region (EU/NA/AP)</div>
                      <div>• {"{level}"} - Account Level</div>
                    </div>
                  }
                />
              </div>
              <div className="relative">
                <Textarea
                  value={settings.playerStatsEmbed.description}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    playerStatsEmbed: { ...prev.playerStatsEmbed, description: e.target.value }
                  }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary pr-10 resize-none"
                  rows={2}
                  placeholder="**Region:** {region} • **Plattform:** PC{level}"
                />
                <button
                  onClick={() => setEmojiPickerOpen('playerStatsDescription')}
                  className="absolute right-2 top-2 text-dark-muted hover:text-purple-accent transition-colors duration-200 hover:scale-110"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Color & Thumbnail */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-dark-text">Embed Farbe</label>
                <Tooltip 
                  title="🎨 Embed Farbe erklärt:"
                  content="Die Farbe des seitlichen Balkens in der Discord Spieler-Statistik"
                />
              </div>
              <div className="flex gap-3 items-center">
                {/* Color Picker */}
                <div className="relative">
                  <input
                    type="color"
                    value={settings.playerStatsEmbed.color === 'dynamic' ? '#FF4655' : (settings.playerStatsEmbed.color.startsWith('0x') ? `#${settings.playerStatsEmbed.color.slice(2)}` : settings.playerStatsEmbed.color.startsWith('#') ? settings.playerStatsEmbed.color : '#FF4655')}
                    onChange={(e) => {
                      const hexColor = e.target.value;
                      const discordColor = `0x${hexColor.slice(1).toUpperCase()}`;
                      setSettings(prev => ({
                        ...prev,
                        playerStatsEmbed: { ...prev.playerStatsEmbed, color: discordColor }
                      }));
                    }}
                    className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 bg-dark-bg cursor-pointer hover:border-purple-accent transition-all duration-300 hover:scale-105"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-accent to-purple-secondary rounded-full animate-ping opacity-60"></div>
                </div>
                
                {/* Hex Input */}
                <div className="flex-1">
                  <Input
                    value={settings.playerStatsEmbed.color === 'dynamic' ? 'dynamic' : settings.playerStatsEmbed.color}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      playerStatsEmbed: { ...prev.playerStatsEmbed, color: e.target.value }
                    }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-accent font-mono"
                    placeholder="0xFF4655 oder 'dynamic'"
                  />
                </div>

                {/* Color Preview */}
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                  style={{
                    backgroundColor: settings.playerStatsEmbed.color === 'dynamic' ? '#FF4655' : (settings.playerStatsEmbed.color.startsWith('0x') ? `#${settings.playerStatsEmbed.color.slice(2)}` : settings.playerStatsEmbed.color.startsWith('#') ? settings.playerStatsEmbed.color : '#FF4655'),
                    filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                  }}
                >
                  📊
                </div>
              </div>
              
              {/* Preset Colors */}
              <div className="mt-3">
                <p className="text-xs text-dark-muted mb-2">Spieler Stats Farben:</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { name: 'Dynamisch (Rang)', color: 'dynamic' },
                    { name: 'Valorant Rot', color: '0xFF4655' },
                    { name: 'Sage Grün', color: '0x5FB85F' },
                    { name: 'Jett Blau', color: '0x0F1B3C' },
                    { name: 'Phoenix Orange', color: '0xFF8C00' },
                    { name: 'Viper Grün', color: '0x00FF41' },
                    { name: 'Reyna Lila', color: '0x8A2BE2' },
                    { name: 'Omen Blau', color: '0x4169E1' },
                    { name: 'Radiant Gold', color: '0xFFD700' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        playerStatsEmbed: { ...prev.playerStatsEmbed, color: preset.color }
                      }))}
                      className={`w-8 h-8 rounded-lg border transition-all duration-300 hover:scale-110 relative group ${
                        preset.color === 'dynamic' 
                          ? 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 border-purple-accent' 
                          : 'border-purple-primary/30 hover:border-purple-accent'
                      }`}
                      style={preset.color !== 'dynamic' ? {
                        backgroundColor: `#${preset.color.slice(2)}`,
                        filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.2))'
                      } : {
                        filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.2))'
                      }}
                      title={preset.name}
                    >
                      {preset.color === 'dynamic' && (
                        <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">🎨</div>
                      )}
                      <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-dark-text mb-2 block">Thumbnail</Label>
              <select
                value={settings.playerStatsEmbed.thumbnail}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  playerStatsEmbed: { ...prev.playerStatsEmbed, thumbnail: e.target.value as any }
                }))}
                className="w-full px-3 py-2 bg-dark-bg/70 border border-purple-primary/30 rounded-md text-dark-text focus:border-purple-primary focus:outline-none"
              >
                <option value="none">❌ Kein Thumbnail</option>
                <option value="valorant">🎯 Valorant Icon</option>
                <option value="user">🤖 Bot Avatar</option>
                <option value="custom">🖼️ Custom URL</option>
              </select>
            </div>

            {settings.playerStatsEmbed.thumbnail === 'custom' && (
              <div>
                <Label className="text-sm font-medium text-dark-text mb-2 block">Custom Thumbnail URL</Label>
                <Input
                  value={settings.playerStatsEmbed.customThumbnail}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    playerStatsEmbed: { ...prev.playerStatsEmbed, customThumbnail: e.target.value }
                  }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                  placeholder="https://example.com/image.png"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-sm font-medium text-dark-text">Footer Template</Label>
              <Tooltip 
                title="📄 Footer-Template erklärt:"
                content={
                  <div>
                    <div>Verfügbare Platzhalter:</div>
                    <div>• {"{remainingRequests}"} - Verbleibende API-Requests</div>
                    <div>• {"{timestamp}"} - Aktueller Zeitstempel</div>
                  </div>
                }
              />
            </div>
            <div className="relative">
              <Input
                value={settings.playerStatsEmbed.footer}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  playerStatsEmbed: { ...prev.playerStatsEmbed, footer: e.target.value }
                }))}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary pr-10"
                placeholder="🔥 Powered by HenrikDev API • {remainingRequests}/30 • {timestamp}"
              />
              <button
                onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'playerStatsFooter' ? null : 'playerStatsFooter')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-purple-accent transition-colors duration-200 hover:scale-110"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Author Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={settings.playerStatsEmbed.author.enabled}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  playerStatsEmbed: { 
                    ...prev.playerStatsEmbed, 
                    author: { ...prev.playerStatsEmbed.author, enabled: checked }
                  }
                }))}
              />
              <Label className="text-sm font-medium text-dark-text">Author anzeigen</Label>
            </div>
            
            {settings.playerStatsEmbed.author.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Author Name</label>
                  <Input
                    value={settings.playerStatsEmbed.author.name}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      playerStatsEmbed: { 
                        ...prev.playerStatsEmbed, 
                        author: { ...prev.playerStatsEmbed.author, name: e.target.value }
                      }
                    }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                    placeholder="Valorant Player Stats"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Author Icon URL</label>
                  <Input
                    value={settings.playerStatsEmbed.author.iconUrl}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      playerStatsEmbed: { 
                        ...prev.playerStatsEmbed, 
                        author: { ...prev.playerStatsEmbed.author, iconUrl: e.target.value }
                      }
                    }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                    placeholder="https://example.com/icon.png"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Player Stats Fields Configuration */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-accent" />
            Statistik-Felder
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere welche Statistiken in den Spieler-Embeds angezeigt werden sollen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {Object.entries(settings.playerStatsEmbed.fields).map(([fieldKey, field]) => (
            <div key={fieldKey} className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={field.enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      playerStatsEmbed: {
                        ...prev.playerStatsEmbed,
                        fields: {
                          ...prev.playerStatsEmbed.fields,
                          [fieldKey]: { ...field, enabled: checked }
                        }
                      }
                    }))}
                  />
                  <h4 className="text-md font-semibold text-purple-accent capitalize">{fieldKey.replace(/([A-Z])/g, ' $1').trim()}</h4>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-xs text-dark-muted">Inline</label>
                  <input
                    type="checkbox"
                    checked={field.inline}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      playerStatsEmbed: {
                        ...prev.playerStatsEmbed,
                        fields: {
                          ...prev.playerStatsEmbed.fields,
                          [fieldKey]: { ...field, inline: e.target.checked }
                        }
                      }
                    }))}
                    className="w-4 h-4 text-purple-accent bg-dark-bg border-purple-primary/30 rounded focus:ring-purple-accent focus:ring-2"
                  />
                  <Tooltip 
                    title="💡 Inline erklärt:"
                    content={
                      <div>
                        <div>✅ AN: Felder nebeneinander (max. 3 pro Zeile)</div>
                        <div>❌ AUS: Felder untereinander</div>
                      </div>
                    }
                  />
                </div>
              </div>
              
                              {field.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-dark-muted mb-1 block">Feld Name</label>
                      <div className="relative">
                        <Input
                          value={field.name}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            playerStatsEmbed: {
                              ...prev.playerStatsEmbed,
                              fields: {
                                ...prev.playerStatsEmbed.fields,
                                [fieldKey]: { ...field, name: e.target.value }
                              }
                            }
                          }))}
                          className="bg-dark-bg border-purple-primary/30 text-dark-text focus:border-purple-accent text-sm pr-10"
                          placeholder="Feld Name"
                        />
                        <button
                          onClick={() => setEmojiPickerOpen(emojiPickerOpen === `fieldName-${fieldKey}` ? null : `fieldName-${fieldKey}`)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-purple-accent transition-colors duration-200 hover:scale-110"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-dark-muted mb-1 block">Feld Template</label>
                      <div className="relative">
                        <Textarea
                          value={field.value}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            playerStatsEmbed: {
                              ...prev.playerStatsEmbed,
                              fields: {
                                ...prev.playerStatsEmbed.fields,
                                [fieldKey]: { ...field, value: e.target.value }
                              }
                            }
                          }))}
                          className="bg-dark-bg border-purple-primary/30 text-dark-text resize-none focus:border-purple-accent text-sm pr-10"
                          placeholder="Template mit Platzhaltern..."
                          rows={2}
                        />
                        <button
                          onClick={() => setEmojiPickerOpen(emojiPickerOpen === `fieldValue-${fieldKey}` ? null : `fieldValue-${fieldKey}`)}
                          className="absolute right-2 top-2 text-dark-muted hover:text-purple-accent transition-colors duration-200 hover:scale-110"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button 
          onClick={() => setPreviewMode(!previewMode)}
          className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105"
        >
          <Eye className="w-5 h-5 mr-2" />
          {previewMode ? 'Preview verbergen' : 'Embed Preview'}
        </Button>
        
        <Button 
          onClick={saveSettings}
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-4 px-8 rounded-xl shadow-neon-strong transition-all duration-300 hover:scale-105 text-lg"
        >
          💾 Einstellungen speichern
        </Button>
      </div>

      {/* Embed Preview */}
      {previewMode && (
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-accent/30 shadow-purple-glow animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-accent" />
              Discord Embed Preview
            </CardTitle>
            <CardDescription className="text-dark-muted">
              So wird deine interaktive Valorant-Nachricht in Discord aussehen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="bg-dark-bg/70 rounded-xl p-6 border-l-4 max-w-md"
              style={{
                borderLeftColor: settings.embed.color.startsWith('0x') ? `#${settings.embed.color.slice(2)}` : settings.embed.color
              }}
            >
              
              {/* Author */}
              {settings.embed.author.enabled && (
                <div className="flex items-center gap-2 mb-3">
                  {settings.embed.author.iconUrl && (
                    <img 
                      src={settings.embed.author.iconUrl} 
                      alt="Author Icon" 
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  <span className="text-sm font-medium text-dark-text">{settings.embed.author.name}</span>
                </div>
              )}

              {/* Title */}
              <h3 className="font-bold text-lg text-dark-text mb-4">
                {settings.embed.title}
              </h3>

              {/* Thumbnail */}
              {settings.embed.thumbnail !== 'none' && (
                <div className="mb-4">
                  <div className="w-20 h-20 rounded-lg border-2 border-purple-primary/30 bg-dark-bg shadow-purple-glow flex items-center justify-center">
                    {settings.embed.thumbnail === 'valorant' && (
                      <div className="text-2xl">🎯</div>
                    )}
                    {settings.embed.thumbnail === 'user' && (
                      <div className="text-2xl">🤖</div>
                    )}
                    {settings.embed.thumbnail === 'custom' && settings.embed.customThumbnail ? (
                      <img 
                        src={settings.embed.customThumbnail} 
                        alt="Custom Thumbnail" 
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="text-2xl">🖼️</div>';
                          }
                        }}
                      />
                    ) : settings.embed.thumbnail === 'custom' && (
                      <div className="text-2xl">🖼️</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Description */}
              <p className="text-dark-text mb-4">
                {settings.embed.description}
              </p>

              {/* Fields */}
              {settings.embed.fields.map((field, index) => (
                <div key={index} className={`mb-3 ${field.inline ? 'inline-block w-1/2 pr-2' : 'block'}`}>
                  <h4 className="font-semibold text-sm text-dark-text">{field.name}</h4>
                  <p className="text-xs text-dark-muted whitespace-pre-line">{field.value}</p>
                </div>
              ))}

              {/* Buttons Preview */}
              <div className="mt-4 space-y-2">
                <div className="text-xs text-dark-muted mb-2">Interaktive Buttons:</div>
                <div className="flex gap-2 flex-wrap">
                  <div className="bg-blue-600 text-white px-3 py-1 rounded text-xs">🇪🇺 EU</div>
                  <div className="bg-blue-600 text-white px-3 py-1 rounded text-xs">🇺🇸 NA</div>
                  <div className="bg-blue-600 text-white px-3 py-1 rounded text-xs">🌏 AP</div>
                </div>
              </div>

              {/* Footer */}
              {settings.embed.footer && (
                <div className="text-xs text-dark-muted mt-4 pt-2 border-t border-purple-primary/20">
                  {settings.embed.footer
                    .replace('{timestamp}', new Date().toLocaleString('de-DE'))
                    .replace('{date}', new Date().toLocaleDateString('de-DE'))
                    .replace('{time}', new Date().toLocaleTimeString('de-DE'))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emoji Picker Overlays */}
      {emojiPickerOpen === 'title' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setSettings(prev => ({
                  ...prev,
                  embed: { ...prev.embed, title: prev.embed.title + emoji }
                }));
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'description' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setSettings(prev => ({
                  ...prev,
                  embed: { ...prev.embed, description: prev.embed.description + emoji }
                }));
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'playerStatsTitle' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setSettings(prev => ({
                  ...prev,
                  playerStatsEmbed: { ...prev.playerStatsEmbed, title: prev.playerStatsEmbed.title + emoji }
                }));
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'playerStatsDescription' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setSettings(prev => ({
                  ...prev,
                  playerStatsEmbed: { ...prev.playerStatsEmbed, description: prev.playerStatsEmbed.description + emoji }
                }));
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'playerStatsFooter' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setSettings(prev => ({
                  ...prev,
                  playerStatsEmbed: { ...prev.playerStatsEmbed, footer: prev.playerStatsEmbed.footer + emoji }
                }));
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {/* Field Name Emoji Pickers */}
      {Object.keys(settings.playerStatsEmbed.fields).map(fieldKey => 
        emojiPickerOpen === `fieldName-${fieldKey}` && (
          <div key={`fieldName-${fieldKey}`} className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
            <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  setSettings(prev => ({
                    ...prev,
                    playerStatsEmbed: {
                      ...prev.playerStatsEmbed,
                      fields: {
                        ...prev.playerStatsEmbed.fields,
                        [fieldKey]: { 
                          ...prev.playerStatsEmbed.fields[fieldKey], 
                          name: prev.playerStatsEmbed.fields[fieldKey].name + emoji 
                        }
                      }
                    }
                  }));
                  setEmojiPickerOpen(null);
                }}
                onClose={() => setEmojiPickerOpen(null)}
              />
            </div>
          </div>
        )
      )}

      {/* Field Value Emoji Pickers */}
      {Object.keys(settings.playerStatsEmbed.fields).map(fieldKey => 
        emojiPickerOpen === `fieldValue-${fieldKey}` && (
          <div key={`fieldValue-${fieldKey}`} className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
            <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  setSettings(prev => ({
                    ...prev,
                    playerStatsEmbed: {
                      ...prev.playerStatsEmbed,
                      fields: {
                        ...prev.playerStatsEmbed.fields,
                        [fieldKey]: { 
                          ...prev.playerStatsEmbed.fields[fieldKey], 
                          value: prev.playerStatsEmbed.fields[fieldKey].value + emoji 
                        }
                      }
                    }
                  }));
                  setEmojiPickerOpen(null);
                }}
                onClose={() => setEmojiPickerOpen(null)}
              />
            </div>
          </div>
        )
      )}

      {/* Embed Field Name Emoji Pickers */}
      {settings.embed.fields.map((field, index) => 
        emojiPickerOpen === `embedFieldName-${index}` && (
          <div key={`embedFieldName-${index}`} className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
            <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  const newFields = [...settings.embed.fields];
                  newFields[index].name = newFields[index].name + emoji;
                  setSettings(prev => ({
                    ...prev,
                    embed: { ...prev.embed, fields: newFields }
                  }));
                  setEmojiPickerOpen(null);
                }}
                onClose={() => setEmojiPickerOpen(null)}
              />
            </div>
          </div>
        )
      )}

      {/* Embed Field Value Emoji Pickers */}
      {settings.embed.fields.map((field, index) => 
        emojiPickerOpen === `embedFieldValue-${index}` && (
          <div key={`embedFieldValue-${index}`} className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
            <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  const newFields = [...settings.embed.fields];
                  newFields[index].value = newFields[index].value + emoji;
                  setSettings(prev => ({
                    ...prev,
                    embed: { ...prev.embed, fields: newFields }
                  }));
                  setEmojiPickerOpen(null);
                }}
                onClose={() => setEmojiPickerOpen(null)}
              />
            </div>
          </div>
        )
      )}
        </TabsContent>

        </Tabs>

      {/* Emoji Picker Overlays */}
      {emojiPickerOpen === 'title' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setSettings(prev => ({
                  ...prev,
                  embed: { ...prev.embed, title: prev.embed.title + emoji }
                }));
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'description' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setSettings(prev => ({
                  ...prev,
                  embed: { ...prev.embed, description: prev.embed.description + emoji }
                }));
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'playerStatsTitle' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setSettings(prev => ({
                  ...prev,
                  playerStatsEmbed: { ...prev.playerStatsEmbed, title: prev.playerStatsEmbed.title + emoji }
                }));
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'playerStatsDescription' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setSettings(prev => ({
                  ...prev,
                  playerStatsEmbed: { ...prev.playerStatsEmbed, description: prev.playerStatsEmbed.description + emoji }
                }));
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'playerStatsFooter' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setSettings(prev => ({
                  ...prev,
                  playerStatsEmbed: { ...prev.playerStatsEmbed, footer: prev.playerStatsEmbed.footer + emoji }
                }));
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {/* Field Name Emoji Pickers */}
      {Object.keys(settings.playerStatsEmbed.fields).map(fieldKey => 
        emojiPickerOpen === `fieldName-${fieldKey}` && (
          <div key={`fieldName-${fieldKey}`} className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
            <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  setSettings(prev => ({
                    ...prev,
                    playerStatsEmbed: {
                      ...prev.playerStatsEmbed,
                      fields: {
                        ...prev.playerStatsEmbed.fields,
                        [fieldKey]: { 
                          ...prev.playerStatsEmbed.fields[fieldKey], 
                          name: prev.playerStatsEmbed.fields[fieldKey].name + emoji 
                        }
                      }
                    }
                  }));
                  setEmojiPickerOpen(null);
                }}
                onClose={() => setEmojiPickerOpen(null)}
              />
            </div>
          </div>
        )
      )}

      {/* Field Value Emoji Pickers */}
      {Object.keys(settings.playerStatsEmbed.fields).map(fieldKey => 
        emojiPickerOpen === `fieldValue-${fieldKey}` && (
          <div key={`fieldValue-${fieldKey}`} className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
            <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  setSettings(prev => ({
                    ...prev,
                    playerStatsEmbed: {
                      ...prev.playerStatsEmbed,
                      fields: {
                        ...prev.playerStatsEmbed.fields,
                        [fieldKey]: { 
                          ...prev.playerStatsEmbed.fields[fieldKey], 
                          value: prev.playerStatsEmbed.fields[fieldKey].value + emoji 
                        }
                      }
                    }
                  }));
                  setEmojiPickerOpen(null);
                }}
                onClose={() => setEmojiPickerOpen(null)}
              />
            </div>
          </div>
        )
      )}

      {/* Embed Field Name Emoji Pickers */}
      {settings.embed.fields.map((field, index) => 
        emojiPickerOpen === `embedFieldName-${index}` && (
          <div key={`embedFieldName-${index}`} className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
            <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  const newFields = [...settings.embed.fields];
                  newFields[index].name = newFields[index].name + emoji;
                  setSettings(prev => ({
                    ...prev,
                    embed: { ...prev.embed, fields: newFields }
                  }));
                  setEmojiPickerOpen(null);
                }}
                onClose={() => setEmojiPickerOpen(null)}
              />
            </div>
          </div>
        )
      )}

      {/* Embed Field Value Emoji Pickers */}
      {settings.embed.fields.map((field, index) => 
        emojiPickerOpen === `embedFieldValue-${index}` && (
          <div key={`embedFieldValue-${index}`} className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
            <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  const newFields = [...settings.embed.fields];
                  newFields[index].value = newFields[index].value + emoji;
                  setSettings(prev => ({
                    ...prev,
                    embed: { ...prev.embed, fields: newFields }
                  }));
                  setEmojiPickerOpen(null);
                }}
                onClose={() => setEmojiPickerOpen(null)}
              />
            </div>
          </div>
        )
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Valorant;