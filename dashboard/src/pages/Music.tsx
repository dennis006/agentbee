import React, { useState, useEffect } from 'react';
import { Music as MusicIcon, Play, Pause, SkipForward, Volume2, List, Settings, Plus, Trash2, Search, Mic, Users, Shuffle, Radio, Save } from 'lucide-react';
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
    
    {/* Tooltip */}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-purple-primary/30 rounded-lg text-xs text-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-lg min-w-max">
      {title && <div className="font-medium text-blue-400 mb-1">{title}</div>}
      <div>{content}</div>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
    </div>
  </div>
);

// Card components
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-dark-surface/90 backdrop-blur-xl border border-purple-primary/30 shadow-purple-glow rounded-lg ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 pb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-xl font-bold text-dark-text ${className}`}>
    {children}
  </h3>
);

const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-dark-muted text-sm mt-1 ${className}`}>
    {children}
  </p>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

// Button component
const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string; 
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}> = ({ children, onClick, className = '', disabled = false, variant = 'default' }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variantClasses = {
    default: "bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white shadow-neon hover:scale-105",
    destructive: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-neon hover:scale-105",
    outline: "border border-purple-primary/30 bg-transparent hover:bg-purple-primary/20 text-dark-text",
    secondary: "bg-dark-surface/50 hover:bg-dark-surface text-dark-text",
    ghost: "hover:bg-purple-primary/20 text-dark-text",
    link: "text-purple-primary underline-offset-4 hover:underline"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} px-4 py-2 ${className}`}
    >
      {children}
    </button>
  );
};

// Input component
const Input: React.FC<{ 
  type?: string; 
  placeholder?: string; 
  value?: string | number; 
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  id?: string;
}> = ({ type = 'text', placeholder, value, onChange, onKeyPress, className = '', ...props }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onKeyPress={onKeyPress}
    className={`bg-dark-bg/70 border border-purple-primary/30 text-dark-text focus:border-neon-purple rounded-lg px-3 py-2 w-full transition-colors duration-200 ${className}`}
    {...props}
  />
);

// Interfaces
interface MusicSettings {
  enabled: boolean;
  defaultVolume: number;
  maxQueueLength: number;
  autoJoinVoice: boolean;
  voiceChannels: {
    autoJoin: string[];
    preferred: string;
    blacklist: string[];
  };
  commands: {
    enabled: boolean;
    prefix: string;
    djRole: string;
    allowEveryone: boolean;
  };
  queue: {
    autoplay: boolean;
    shuffle: boolean;
    repeat: string;
    clearOnEmpty: boolean;
  };
  filters: {
    bass: boolean;
    nightcore: boolean;
    vaporwave: boolean;
    lowpass: boolean;
  };
  youtube: {
    quality: string;
    maxLength: number;
    playlistLimit: number;
  };
  announcements: {
    nowPlaying: boolean;
    queueAdd: boolean;
    channelId: string;
  };
  embedColor: string;
  songRequests: {
    enabled: boolean;
    channels: string[];
    prefix: string;
    embedColor: string;
    requireDJRole: boolean;
    maxRequestsPerUser: number;
    cooldownMinutes: number;
    rateLimit: {
      enabled: boolean;
      maxRequests: number;
      timeWindow: number;
      timeUnit: 'minutes' | 'hours' | 'days';
    };
    interactivePanel: {
      enabled: boolean;
      channelId: string;
      messageId: string;
      autoUpdate: boolean;
      showQueue: boolean;
      maxQueueDisplay: number;
      requireDJForControls: boolean;
      autoJoinLeave: boolean;
      adminRole: string;
    };
  };
  radio?: {
    enabled: boolean;
    stations: RadioStation[];
    defaultStation: string;
    autoStop: boolean;
    showNowPlaying: boolean;
    embedColor: string;
  };
}

interface Song {
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
  author: string;
  requestedBy?: string;
}

interface Queue {
  currentSong: Song | null;
  songs: Song[];
  volume: number;
  repeat: string;
  shuffle: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
}

interface RequestTrackingData {
  userId: string;
  username: string;
  requestsUsed: number;
  remainingRequests: number;
  resetTime: number | null;
  lastRequest: number | null;
}

interface RadioStation {
  id: string;
  name: string;
  url: string;
  genre: string;
  country: string;
  description: string;
  logo: string;
}

interface RadioStatus {
  isPlaying: boolean;
  currentStation: RadioStation | null;
}

// CSS Animation für Progress Bar
const progressBarStyles = `
  @keyframes progressSlide {
    0% { transform: translateX(-100%) skewX(-12deg); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateX(400%) skewX(-12deg); opacity: 0; }
  }
  
  @keyframes progressGlow {
    0%, 100% { box-shadow: 0 0 15px rgba(147, 51, 234, 0.8), 0 0 30px rgba(147, 51, 234, 0.4); }
    50% { box-shadow: 0 0 25px rgba(147, 51, 234, 1), 0 0 50px rgba(147, 51, 234, 0.6); }
  }
`;

// Hauptkomponente
const Music: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const { toasts, showSuccess, showError, removeToast } = useToast();
  
  // State Variablen
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('player');
  
  // Settings State
  const [settings, setSettings] = useState<MusicSettings>({
    enabled: true,
    defaultVolume: 50,
    maxQueueLength: 100,
    autoJoinVoice: true,
    voiceChannels: {
      autoJoin: [],
      preferred: "",
      blacklist: []
    },
    commands: {
      enabled: true,
      prefix: "!",
      djRole: "",
      allowEveryone: true
    },
    queue: {
      autoplay: false,
      shuffle: false,
      repeat: "off",
      clearOnEmpty: true
    },
    filters: {
      bass: false,
      nightcore: false,
      vaporwave: false,
      lowpass: false
    },
    youtube: {
      quality: "highestaudio",
      maxLength: 600,
      playlistLimit: 50
    },
    announcements: {
      nowPlaying: true,
      queueAdd: true,
      channelId: ""
    },
    embedColor: "#9333EA",
    songRequests: {
      enabled: true,
      channels: [],
      prefix: "!play",
      embedColor: "#9333EA",
      requireDJRole: false,
      maxRequestsPerUser: 5,
      cooldownMinutes: 1,
      rateLimit: {
        enabled: true,
        maxRequests: 5,
        timeWindow: 60,
        timeUnit: 'minutes'
      },
      interactivePanel: {
        enabled: true,
        channelId: "",
        messageId: "",
        autoUpdate: true,
        showQueue: true,
        maxQueueDisplay: 5,
        requireDJForControls: false,
        autoJoinLeave: false,
        adminRole: ""
      }
    }
  });

  // Queue State
  const [queue, setQueue] = useState<Queue>({
    currentSong: null,
    songs: [],
    volume: 50,
    repeat: "off",
    shuffle: false
  });

  // Weitere State Variablen
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [progress, setProgress] = useState({
    currentTime: 0,
    duration: 0,
    currentTimeFormatted: '0:00',
    durationFormatted: '0:00',
    percentage: 0
  });
  const [searching, setSearching] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [guildId, setGuildId] = useState<string | null>(null);
  const [requestTracking, setRequestTracking] = useState<RequestTrackingData[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [autoUpdateActive, setAutoUpdateActive] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [radioStations, setRadioStations] = useState<RadioStation[]>([]);
  const [radioStatus, setRadioStatus] = useState<RadioStatus>({
    isPlaying: false,
    currentStation: null
  });
  const [radioLoading, setRadioLoading] = useState(false);
  const [newStation, setNewStation] = useState({
    name: '',
    url: '',
    genre: '',
    country: '',
    description: '',
    logo: ''
  });

  // API Funktionen
  const loadData = async () => {
    try {
      setLoading(true);
      
      const guildsRes = await fetch(`${apiUrl}/api/guilds`);
      let currentGuildId = null;
      
      if (guildsRes.ok) {
        const guildsData = await guildsRes.json();
        currentGuildId = guildsData.primaryGuild;
        setGuildId(currentGuildId);
      }

      if (!currentGuildId) {
        showError('Guild Fehler', '❌ Keine Guild-ID gefunden. Bot möglicherweise offline.');
        return;
      }

      const [settingsRes, channelsRes, rolesRes, queueRes] = await Promise.all([
        fetch(`${apiUrl}/api/music/settings`),
        fetch(`${apiUrl}/api/channels`),
        fetch(`${apiUrl}/api/roles`),
        fetch(`${apiUrl}/api/music/queue/${currentGuildId}`)
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings);
      }

      if (channelsRes.ok) {
        const data = await channelsRes.json();
        setChannels(data.channels || []);
      }

      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setRoles(data.roles || []);
      }

      if (queueRes.ok) {
        const data = await queueRes.json();
        setQueue(data.queue);
      }

      await loadRequestTracking();

    } catch (err) {
      console.error('Fehler beim Laden der Daten:', err);
      showError('Lade Fehler', 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const loadRequestTracking = async () => {
    try {
      setTrackingLoading(true);
      const response = await fetch(`${apiUrl}/api/music/request-tracking`);
      if (response.ok) {
        const data = await response.json();
        setRequestTracking(data.trackingData || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Request-Tracking Daten:', error);
    } finally {
      setTrackingLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${apiUrl}/api/music/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        showSuccess('Musik Einstellungen', '🎵 Musik-Einstellungen erfolgreich gespeichert!');
      } else {
        showError('Speicher Fehler', '❌ Fehler beim Speichern der Einstellungen');
      }
    } catch (err) {
      console.error('Speicherfehler:', err);
      showError('Netzwerk Fehler', '❌ Netzwerkfehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const searchYouTube = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch(`${apiUrl}/api/music/search?query=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results);
      }
    } catch (err) {
      showError('YouTube Suche', '❌ Fehler bei der YouTube-Suche');
    } finally {
      setSearching(false);
    }
  };

  const addToQueue = async (song: Song) => {
    if (!guildId) {
      showError('Guild Fehler', '❌ Keine Guild-ID verfügbar');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/music/queue/${guildId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: song.url, requestedBy: 'Dashboard' })
      });

      if (response.ok) {
        showSuccess('Queue Update', `🎵 "${song.title}" zur Queue hinzugefügt!`);
        loadData();
      } else {
        showError('Queue Fehler', '❌ Fehler beim Hinzufügen zur Queue');
      }
    } catch (err) {
      showError('Netzwerk Fehler', '❌ Netzwerkfehler');
    }
  };

  const controlPlayback = async (action: string) => {
    if (!guildId) {
      showError('Guild Fehler', '❌ Keine Guild-ID verfügbar');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/music/control/${guildId}/${action}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess('Player Kontrolle', data.message || `🎵 ${action} ausgeführt!`);
        loadData();
      } else {
        const errorData = await response.json();
        showError('Player Fehler', errorData.error || `❌ Fehler bei ${action}`);
      }
    } catch (err) {
      showError('Netzwerk Fehler', '❌ Netzwerkfehler');
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // useEffect Hooks
  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Musik-System...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 animate-fade-in relative">
      <style dangerouslySetInnerHTML={{ __html: progressBarStyles }} />
      
      <MatrixBlocks density={20} />
      
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <MusicIcon className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            Musik Bot Management
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Verwalte deinen Discord Musik-Bot wie ein Boss! 
        </div>
        <div className="w-32 h-1 bg-gradient-neon mx-auto mt-4 rounded-full animate-glow"></div>
      </div>

      <div className="flex justify-center gap-4">
        <Button 
          onClick={saveSettings} 
          disabled={saving} 
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>{saving ? 'Speichere...' : 'Einstellungen speichern'}</span>
        </Button>
      </div>

      <div className="flex justify-center gap-4 items-center">
        <Badge variant={settings.enabled ? "default" : "outline"} className="text-lg py-2 px-4">
          {settings.enabled ? '✅ Musik-Bot Aktiviert' : '❌ Musik-Bot Deaktiviert'}
        </Badge>
      </div>

      <Tabs defaultValue="player" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30">
          <TabsTrigger 
            value="player" 
            className={`flex items-center space-x-2 ${activeTab === 'player' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('player')}
          >
            <Play className="h-4 w-4" />
            <span>Player</span>
          </TabsTrigger>
          <TabsTrigger 
            value="radio" 
            className={`flex items-center space-x-2 ${activeTab === 'radio' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('radio')}
          >
            <Radio className="h-4 w-4" />
            <span>Radio</span>
          </TabsTrigger>
          <TabsTrigger 
            value="requests" 
            className={`flex items-center space-x-2 ${activeTab === 'requests' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('requests')}
          >
            <Plus className="h-4 w-4" />
            <span>Song-Requests</span>
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

        <TabsContent value="player" className="space-y-6" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-purple-accent" />
                Player Kontrolle
              </CardTitle>
              <CardDescription>
                Direkte Kontrolle über die Musik-Wiedergabe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Button
                  onClick={() => controlPlayback('play')}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3"
                >
                  <Play className="w-5 h-5" />
                </Button>
                
                <Button
                  onClick={() => controlPlayback('pause')}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white p-3"
                >
                  <Pause className="w-5 h-5" />
                </Button>
                
                <Button
                  onClick={() => controlPlayback('skip')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-3"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
                
                <Button
                  onClick={() => controlPlayback('clear')}
                  variant="destructive"
                  className="p-3"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-accent" />
                YouTube Suche
              </CardTitle>
              <CardDescription>
                Suche nach Songs und füge sie zur Wiedergabeliste hinzu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchYouTube()}
                  placeholder="Nach Musik suchen..."
                  className="flex-1"
                />
                <Button
                  onClick={searchYouTube}
                  disabled={searching}
                >
                  {searching ? 'Suche...' : 'Suchen'}
                </Button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((song, index) => (
                  <div key={index} className="bg-purple-500/10 rounded-lg p-4 flex items-center gap-4">
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-sm">{song.title}</h4>
                      <p className="text-purple-200 text-xs">{song.author} • {formatDuration(song.duration)}</p>
                    </div>
                    <Button
                      onClick={() => addToQueue(song)}
                      className="p-2"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="w-5 h-5 text-purple-accent" />
                Aktuelle Queue ({queue.songs.length} Songs)
              </CardTitle>
              <CardDescription>
                Übersicht über alle Songs in der Warteschlange
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queue.songs.length === 0 ? (
                <div className="text-center py-8">
                  <MusicIcon className="w-16 h-16 text-purple-300 mx-auto mb-4 opacity-50" />
                  <p className="text-purple-300">Keine Songs in der Queue</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {queue.songs.map((song, index) => (
                    <div key={index} className="bg-purple-500/10 rounded-lg p-4 flex items-center gap-4">
                      <span className="text-purple-300 font-mono text-sm w-8">{index + 1}</span>
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{song.title}</h4>
                        <p className="text-purple-200 text-sm">{song.author} • {formatDuration(song.duration)}</p>
                        {song.requestedBy && (
                          <p className="text-purple-300 text-xs">Angefragt von: {song.requestedBy}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="radio" className="space-y-6" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-400" />
                Radio System
              </CardTitle>
              <CardDescription>
                Radio-Funktionen werden in Zukunft verfügbar sein
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-dark-muted">
                <Radio className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p>Radio-Features kommen bald!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-accent" />
                Song-Request System
              </CardTitle>
              <CardDescription>
                Konfiguriere das Song-Request System für deine Community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg">
                <div>
                  <label className="text-white font-medium">Song-Requests aktivieren</label>
                  <p className="text-purple-300 text-sm">Erlaubt Mitgliedern Songs über Discord-Commands zu requesten</p>
                </div>
                <Switch
                  checked={settings.songRequests.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    songRequests: { ...prev.songRequests, enabled: checked }
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-accent" />
                Erweiterte Einstellungen
              </CardTitle>
              <CardDescription>
                Konfiguriere erweiterte Funktionen des Musik-Bots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-dark-text text-sm font-medium mb-2">
                    Maximale Queue-Länge
                  </label>
                  <Input
                    type="number"
                    min="10"
                    max="1000"
                    value={settings.maxQueueLength}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxQueueLength: parseInt(e.target.value) }))}
                  />
                  <p className="text-dark-muted text-xs mt-1">Maximale Anzahl Songs die in der Queue gespeichert werden können</p>
                </div>

                <div className="border-t border-purple-primary/20 pt-6">
                  <h4 className="text-dark-text font-semibold mb-4">YouTube Einstellungen</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-dark-text text-sm font-medium mb-2">
                        Audio-Qualität
                      </label>
                      <select
                        value={settings.youtube.quality}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          youtube: { ...prev.youtube, quality: e.target.value }
                        }))}
                        className="bg-dark-bg/70 border border-purple-primary/30 text-dark-text focus:border-neon-purple rounded-lg px-3 py-2 w-full transition-colors duration-200"
                      >
                        <option value="highestaudio">Höchste Qualität</option>
                        <option value="lowestaudio">Niedrigste Qualität</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-dark-text text-sm font-medium mb-2">
                        Max. Song-Länge (Minuten)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="120"
                        value={settings.youtube.maxLength / 60}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          youtube: { ...prev.youtube, maxLength: parseInt(e.target.value) * 60 }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Music; 