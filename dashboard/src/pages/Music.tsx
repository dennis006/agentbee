import { useState, useEffect } from 'react';
import { Radio, Play, Pause, Settings, Save, Mic, Users, Plus, Trash2 } from 'lucide-react';
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

// Card components mit Animationen
const Card: React.FC<{ children: React.ReactNode; className?: string; animate?: boolean }> = ({ children, className = '', animate = true }) => (
  <div className={`bg-dark-surface/90 backdrop-blur-xl border border-purple-primary/30 shadow-purple-glow rounded-lg ${animate ? 'animate-fade-in-up hover:scale-[1.01] transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 pb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode; className?: string; animated?: boolean }> = ({ children, className = '', animated = true }) => (
  <h3 className={`text-xl font-bold text-dark-text ${animated ? 'animate-pulse-slow' : ''} ${className}`}>
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

// Button component mit besseren Animationen
const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string; 
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  animated?: boolean;
}> = ({ children, onClick, className = '', disabled = false, variant = 'default', animated = true }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variantClasses = {
    default: "bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white shadow-neon hover:scale-105",
    destructive: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-neon hover:scale-105",
    outline: "border border-purple-primary/30 bg-transparent hover:bg-purple-primary/20 text-dark-text",
    secondary: "bg-dark-surface/50 hover:bg-dark-surface text-dark-text",
    ghost: "hover:bg-purple-primary/20 text-dark-text",
    link: "text-purple-primary underline-offset-4 hover:underline"
  };

  const animatedClasses = animated ? 'transform transition-all duration-300 hover:scale-105 hover:rotate-1 active:scale-95' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${animatedClasses} px-4 py-2 ${className}`}
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
  id?: string;
}> = ({ type = 'text', placeholder, value, onChange, onKeyPress, className = '', ...props }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onKeyPress={onKeyPress}
    className={`bg-dark-bg/70 border border-purple-primary/30 text-dark-text focus:border-neon-purple rounded-lg px-3 py-2 w-full transition-all duration-300 focus:scale-105 hover:shadow-neon ${className}`}
    {...props}
  />
);

// Interfaces - Erweitert für Playlist-System
interface MusicSettings {
  enabled: boolean;
  radio: {
    enabled: boolean;
    stations: RadioStation[];
    defaultStation: string;
    autoStop: boolean;
    showNowPlaying: boolean;
    embedColor: string;
  };
  announcements: {
    channelId: string;
  };
  interactivePanel: {
    enabled: boolean;
    channelId: string;
    messageId: string;
    autoUpdate: boolean;
    embedColor: string;
  };
  playlists: {
    enabled: boolean;
    customPlaylists: Playlist[];
    autoQueue: boolean;
    crossfade: number;
    voting: {
      enabled: boolean;
      votingTime: number;
      skipThreshold: number;
    };
    schedule: {
      enabled: boolean;
      timeZone: string;
      schedules: ScheduleEntry[];
    };
  };
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

interface Channel {
  id: string;
  name: string;
  type: string;
}

// Playlist Interfaces
interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  thumbnail: string;
  addedAt: string;
  order: number;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  songs: Song[];
  thumbnail: string;
  genre: string;
  tags: string[];
  isPublic: boolean;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  createdAt: string;
  updatedAt: string;
  playCount: number;
  totalDuration: number;
}

interface PlaylistStatus {
  isPlaying: boolean;
  playlist: Playlist | null;
  currentSong: Song | null;
  queue: Song[];
  queueLength: number;
  history: Song[];
  voting: VotingSession | null;
  repeat: 'none' | 'one' | 'all';
  shuffle: boolean;
}

interface VotingSession {
  id: string;
  type: 'skip' | 'add_song' | 'remove_song';
  data: any;
  startTime: number;
  endTime: number;
  isActive: boolean;
}

interface ScheduleEntry {
  id: string;
  name: string;
  playlistId: string;
  timeSlots: {
    start: string; // HH:mm format
    end: string;
    days: number[]; // 0-6 (Sunday-Saturday)
  }[];
  enabled: boolean;
}

interface YouTubeSearchResult {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  thumbnail: string;
  views: number;
  uploadDate: string;
}

const Music: React.FC = () => {
  // API Base URL
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('radio');
  
  // Settings State
  const [settings, setSettings] = useState<MusicSettings>({
    enabled: true,
    radio: {
      enabled: true,
      stations: [],
      defaultStation: "lofi",
      autoStop: false,
      showNowPlaying: true,
      embedColor: "#FF6B6B"
    },
    announcements: {
      channelId: ""
    },
    interactivePanel: {
      enabled: true,
      channelId: "",
      messageId: "",
      autoUpdate: true,
      embedColor: "#FF6B6B"
    },
    playlists: {
      enabled: true,
      customPlaylists: [],
      autoQueue: true,
      crossfade: 3000,
      voting: {
        enabled: true,
        votingTime: 30000,
        skipThreshold: 0.5
      },
      schedule: {
        enabled: false,
        timeZone: "Europe/Berlin",
        schedules: []
      }
    }
  });

  // Radio State
  const [radioStations, setRadioStations] = useState<RadioStation[]>([]);
  const [radioStatus, setRadioStatus] = useState<RadioStatus>({
    isPlaying: false,
    currentStation: null
  });
  const [radioLoading, setRadioLoading] = useState(false);

  // Playlist State
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistStatus, setPlaylistStatus] = useState<PlaylistStatus>({
    isPlaying: false,
    playlist: null,
    currentSong: null,
    queue: [],
    queueLength: 0,
    history: [],
    voting: null,
    repeat: 'none',
    shuffle: false
  });
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Channels
  const [channels, setChannels] = useState<Channel[]>([]);
  
  // Guild ID State
  const [guildId, setGuildId] = useState<string | null>(null);

  // New Station State
  const [newStation, setNewStation] = useState({
    name: '',
    url: '',
    genre: '',
    country: '',
    description: '',
    logo: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Guild-ID laden
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

      // Load data
      const [settingsRes, channelsRes, playlistsRes] = await Promise.all([
        fetch(`${apiUrl}/api/music/settings`),
        fetch(`${apiUrl}/api/channels`),
        fetch(`${apiUrl}/api/music/playlists`)
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings);
      }

      if (channelsRes.ok) {
        const data = await channelsRes.json();
        setChannels(data.channels || []);
      }

      if (playlistsRes.ok) {
        const data = await playlistsRes.json();
        setPlaylists(data.playlists || []);
      }

    } catch (err) {
      console.error('Fehler beim Laden der Daten:', err);
      showError('Lade Fehler', 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
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
        showSuccess('YouTube Radio', '🎵 Einstellungen erfolgreich gespeichert!');
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

  const joinVoiceChannel = async (channelId: string) => {
    if (!guildId) {
      showError('Guild Fehler', '❌ Keine Guild-ID verfügbar');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/music/voice/${guildId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId })
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess('Voice Channel', data.message);
      } else {
        showError('Voice Fehler', '❌ Fehler beim Beitreten des Voice-Channels');
      }
    } catch (err) {
      showError('Netzwerk Fehler', '❌ Netzwerkfehler');
    }
  };

  const leaveVoiceChannel = async () => {
    if (!guildId) {
      showError('Guild Fehler', '❌ Keine Guild-ID verfügbar');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/music/voice/${guildId}/leave`, {
        method: 'POST'
      });

      if (response.ok) {
        showSuccess('Voice Channel', '👋 Voice-Channel verlassen');
      }
    } catch (err) {
      showError('Netzwerk Fehler', '❌ Netzwerkfehler');
    }
  };

  // Radio Functions
  const loadRadioStations = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/music/radio/stations`);
      if (response.ok) {
        const data = await response.json();
        setRadioStations(data.stations || []);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Radio-Sender:', err);
      showError('Radio Stations', 'Fehler beim Laden der Radio-Sender');
    }
  };

  const loadRadioStatus = async () => {
    if (!guildId) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/music/radio/${guildId}/status`);
      if (response.ok) {
        const data = await response.json();
        setRadioStatus({
          isPlaying: data.isPlaying,
          currentStation: data.currentStation
        });
      }
    } catch (err) {
      console.error('Fehler beim Laden des Radio-Status:', err);
    }
  };

  const playRadioStation = async (stationId: string) => {
    if (!guildId) {
      showError('Guild Fehler', 'Keine Guild-ID verfügbar');
      return;
    }

    try {
      setRadioLoading(true);
      const response = await fetch(`${apiUrl}/api/music/radio/${guildId}/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stationId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        showSuccess('YouTube Radio', data.message);
        await loadRadioStatus();
        
        // Update Discord Interactive Panel
        try {
          await fetch(`${apiUrl}/api/music/interactive-panel/${guildId}/update`, {
            method: 'POST'
          });
        } catch (updateErr) {
          console.log('Panel Update Fehler:', updateErr);
        }
      } else {
        showError('Radio Fehler', data.error || 'Fehler beim Starten des Radio-Senders');
      }
    } catch (err) {
      console.error('Fehler beim Starten des Radio-Senders:', err);
      showError('Radio Fehler', 'Fehler beim Starten des Radio-Senders');
    } finally {
      setRadioLoading(false);
    }
  };

  const stopRadio = async () => {
    if (!guildId) {
      showError('Guild Fehler', 'Keine Guild-ID verfügbar');
      return;
    }

    try {
      setRadioLoading(true);
      const response = await fetch(`${apiUrl}/api/music/radio/${guildId}/stop`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (response.ok) {
        showSuccess('Radio', data.message);
        await loadRadioStatus();
        
        // Update Discord Interactive Panel
        try {
          await fetch(`${apiUrl}/api/music/interactive-panel/${guildId}/update`, {
            method: 'POST'
          });
        } catch (updateErr) {
          console.log('Panel Update Fehler:', updateErr);
        }
      } else {
        showError('Radio Fehler', data.error || 'Fehler beim Stoppen des Radios');
      }
    } catch (err) {
      console.error('Fehler beim Stoppen des Radios:', err);
      showError('Radio Fehler', 'Fehler beim Stoppen des Radios');
    } finally {
      setRadioLoading(false);
    }
  };

  const postInteractivePanel = async () => {
    if (!guildId) {
      showError('Guild Fehler', '❌ Keine Guild-ID verfügbar');
      return;
    }

    if (!settings.interactivePanel.channelId) {
      showError('Channel Fehler', '❌ Kein Channel für Interactive Panel ausgewählt');
      return;
    }

    try {
      // Save settings first
      const saveResponse = await fetch(`${apiUrl}/api/music/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!saveResponse.ok) {
        showError('Settings Fehler', '❌ Fehler beim Speichern der Settings');
        return;
      }

      // Post panel
      const response = await fetch(`${apiUrl}/api/music/interactive-panel/${guildId}/post`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess('YouTube Radio Panel', `🎵 ${data.message}`);
        loadData(); // Reload to get message ID
      } else {
        const errorData = await response.json();
        showError('Panel Fehler', errorData.error || '❌ Fehler beim Posten des Panels');
      }
    } catch (err) {
      console.error('Panel Post Error:', err);
      showError('Netzwerk Fehler', '❌ Netzwerkfehler');
    }
  };

  const removeRadioStation = async (stationId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/music/radio/stations/${stationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Radio Station', 'Station erfolgreich entfernt');
        await loadRadioStations();
      } else {
        showError('Radio Fehler', 'Fehler beim Entfernen der Station');
      }
    } catch (err) {
      showError('Radio Fehler', 'Fehler beim Entfernen der Station');
    }
  };

  const addCustomRadioStation = async () => {
    if (!newStation.name || !newStation.url) {
      showError('Radio Station', 'Name und URL sind erforderlich');
      return;
    }

    // YouTube URL Validierung und Verbesserung
    let processedStation = { ...newStation };
    
    if (newStation.url.includes('youtube.com') || newStation.url.includes('youtu.be')) {
      // YouTube URL erkannt
      if (!processedStation.logo) {
        // Standard YouTube Logo setzen falls kein Custom Logo vorhanden
        processedStation.logo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0ZGMDAwMCIvPgo8dGV4dCB4PSIyNCIgeT0iMjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPllUPC90ZXh0Pgo8L3N2Zz4K';
      }
      
      // Automatische Metadaten für YouTube
      if (!processedStation.genre) {
        processedStation.genre = 'YouTube Stream';
      }
      if (!processedStation.country) {
        processedStation.country = 'International';
      }
      if (!processedStation.description) {
        processedStation.description = 'YouTube Live-Stream';
      }
    } else {
      // Normale Radio-URL
      if (!processedStation.logo) {
        processedStation.logo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzY2NjY2NiIvPgo8dGV4dCB4PSIyNCIgeT0iMjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfk7s8L3RleHQ+Cjwvc3ZnPgo=';
      }
    }

    // Generate unique ID und erweitere das Object
    const stationWithId = {
      ...processedStation,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    try {
      setRadioLoading(true);
      
      const response = await fetch(`${apiUrl}/api/music/radio/stations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stationWithId)
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess('YouTube Radio', `${stationWithId.url.includes('youtube.com') ? 'YouTube-Stream' : 'Radio-Station'} "${stationWithId.name}" erfolgreich hinzugefügt!`);
        
        // Reset form mit Animation
        setNewStation({
          name: '',
          url: '',
          genre: '',
          country: '',
          description: '',
          logo: ''
        });
        
        await loadRadioStations();
      } else {
        showError('Radio Fehler', data.error || 'Fehler beim Hinzufügen der Station');
      }
    } catch (err) {
      console.error('Fehler beim Hinzufügen der Station:', err);
      showError('Radio Fehler', 'Verbindungsfehler beim Hinzufügen der Station');
    } finally {
      setRadioLoading(false);
    }
  };

  // ========================================
  // PLAYLIST FUNCTIONS
  // ========================================

  const loadPlaylistStatus = async () => {
    if (!guildId) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/music/playlists/${guildId}/status`);
      if (response.ok) {
        const data = await response.json();
        setPlaylistStatus(data.status);
      }
    } catch (err) {
      console.error('Fehler beim Laden des Playlist-Status:', err);
    }
  };

  const searchYouTube = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      setSearchLoading(true);
      const response = await fetch(`${apiUrl}/api/music/search?query=${encodeURIComponent(query)}&limit=20`);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        showError('YouTube Suche', 'Fehler bei der YouTube-Suche');
      }
    } catch (err) {
      console.error('Fehler bei der YouTube-Suche:', err);
      showError('YouTube Suche', 'Verbindungsfehler bei der Suche');
    } finally {
      setSearchLoading(false);
    }
  };

  const createNewPlaylist = async (playlistData: Partial<Playlist>) => {
    try {
      setPlaylistLoading(true);
      const response = await fetch(`${apiUrl}/api/music/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playlistData)
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess('Playlist', `Playlist "${data.playlist.name}" erstellt!`);
        loadData(); // Reload playlists
        return data.playlist;
      } else {
        showError('Playlist Fehler', 'Fehler beim Erstellen der Playlist');
      }
    } catch (err) {
      console.error('Fehler beim Erstellen der Playlist:', err);
      showError('Playlist Fehler', 'Verbindungsfehler');
    } finally {
      setPlaylistLoading(false);
    }
  };

  const playPlaylist = async (playlistId: string, options = {}) => {
    if (!guildId) {
      showError('Guild Fehler', 'Keine Guild-ID verfügbar');
      return;
    }

    try {
      setPlaylistLoading(true);
      const response = await fetch(`${apiUrl}/api/music/playlists/${playlistId}/play/${guildId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });

      const data = await response.json();
      
      if (response.ok) {
        showSuccess('Playlist', `Playlist "${data.playlist.name}" wird abgespielt!`);
        await loadPlaylistStatus();
      } else {
        showError('Playlist Fehler', data.error || 'Fehler beim Abspielen der Playlist');
      }
    } catch (err) {
      console.error('Fehler beim Abspielen der Playlist:', err);
      showError('Playlist Fehler', 'Verbindungsfehler');
    } finally {
      setPlaylistLoading(false);
    }
  };

  const stopPlaylist = async () => {
    if (!guildId) {
      showError('Guild Fehler', 'Keine Guild-ID verfügbar');
      return;
    }

    try {
      setPlaylistLoading(true);
      const response = await fetch(`${apiUrl}/api/music/playlists/${guildId}/stop`, {
        method: 'POST'
      });

      const data = await response.json();
      
      if (response.ok) {
        showSuccess('Playlist', 'Playlist gestoppt!');
        await loadPlaylistStatus();
      } else {
        showError('Playlist Fehler', data.error || 'Fehler beim Stoppen der Playlist');
      }
    } catch (err) {
      console.error('Fehler beim Stoppen der Playlist:', err);
      showError('Playlist Fehler', 'Verbindungsfehler');
    } finally {
      setPlaylistLoading(false);
    }
  };

  const skipToNextSong = async () => {
    if (!guildId) {
      showError('Guild Fehler', 'Keine Guild-ID verfügbar');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/music/playlists/${guildId}/skip`, {
        method: 'POST'
      });

      if (response.ok) {
        showSuccess('Playlist', 'Song übersprungen!');
        await loadPlaylistStatus();
      } else {
        showError('Skip Fehler', 'Fehler beim Überspringen des Songs');
      }
    } catch (err) {
      console.error('Fehler beim Überspringen:', err);
      showError('Skip Fehler', 'Verbindungsfehler');
    }
  };

  const addSongToPlaylist = async (playlistId: string, song: YouTubeSearchResult) => {
    try {
      const response = await fetch(`${apiUrl}/api/music/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: song.title,
          artist: song.artist,
          url: song.url,
          duration: song.duration,
          thumbnail: song.thumbnail
        })
      });

      if (response.ok) {
        showSuccess('Song hinzugefügt', `"${song.title}" zur Playlist hinzugefügt!`);
        loadData(); // Reload playlists
      } else {
        showError('Song Fehler', 'Fehler beim Hinzufügen des Songs');
      }
    } catch (err) {
      console.error('Fehler beim Hinzufügen des Songs:', err);
      showError('Song Fehler', 'Verbindungsfehler');
    }
  };

  const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/music/playlists/${playlistId}/songs/${songId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Song entfernt', 'Song aus Playlist entfernt!');
        loadData(); // Reload playlists
      } else {
        showError('Song Fehler', 'Fehler beim Entfernen des Songs');
      }
    } catch (err) {
      console.error('Fehler beim Entfernen des Songs:', err);
      showError('Song Fehler', 'Verbindungsfehler');
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/music/playlists/${playlistId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Playlist gelöscht', 'Playlist erfolgreich gelöscht!');
        loadData(); // Reload playlists
      } else {
        showError('Playlist Fehler', 'Fehler beim Löschen der Playlist');
      }
    } catch (err) {
      console.error('Fehler beim Löschen der Playlist:', err);
      showError('Playlist Fehler', 'Verbindungsfehler');
    }
  };

  useEffect(() => {
    loadData();
    loadRadioStations();
  }, []);

  useEffect(() => {
    if (guildId) {
      loadRadioStatus();
      loadPlaylistStatus();
      
      // Auto-update status
      const interval = setInterval(() => {
        loadRadioStatus();
        loadPlaylistStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [guildId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade YouTube Radio System...</div>
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
          <Radio className="w-12 h-12 text-red-400 animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            YouTube Radio Bot
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Einfaches YouTube Radio System für Discord! 
          <span className="ml-2 inline-block relative">
            <svg 
              className="w-6 h-6 animate-pulse hover:animate-bounce text-purple-400 hover:text-purple-300 transition-all duration-300 hover:scale-110 drop-shadow-lg" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            <div className="absolute inset-0 animate-ping">
              <svg 
                className="w-6 h-6 text-purple-500 opacity-30" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          </span>
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
      </div>

      {/* System Status Badge */}
      <div className="flex justify-center gap-4 items-center">
        <Badge variant={settings.enabled ? "default" : "outline"} className="text-lg py-2 px-4">
          {settings.enabled ? '✅ YouTube Radio Aktiviert' : '❌ YouTube Radio Deaktiviert'}
        </Badge>
        
        {/* Radio Status Indikator */}
        <div className="flex items-center gap-2 bg-dark-surface/90 backdrop-blur-xl border border-red-primary/30 rounded-lg px-3 py-2">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${radioStatus.isPlaying ? 'bg-red-400 animate-pulse' : 'bg-gray-500'}`}></div>
          <span className="text-sm text-dark-muted">
            {radioStatus.isPlaying ? `Live: ${radioStatus.currentStation?.name}` : 'Kein Radio aktiv'}
          </span>
          <div className="text-xs text-red-accent">
            📻 YouTube Radio
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="radio" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30">
          <TabsTrigger 
            value="radio" 
            className={`flex items-center space-x-2 ${activeTab === 'radio' ? 'bg-red-500 text-white' : 'hover:bg-red-500/20 text-dark-text'}`}
            onClick={() => setActiveTab('radio')}
          >
            <Radio className="h-4 w-4" />
            <span>📻 Radio</span>
          </TabsTrigger>
          <TabsTrigger 
            value="playlists" 
            className={`flex items-center space-x-2 ${activeTab === 'playlists' ? 'bg-green-500 text-white' : 'hover:bg-green-500/20 text-dark-text'}`}
            onClick={() => setActiveTab('playlists')}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            <span>🎵 Playlists</span>
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className={`flex items-center space-x-2 ${activeTab === 'settings' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="h-4 w-4" />
            <span>⚙️ Einstellungen</span>
          </TabsTrigger>
        </TabsList>

        {/* Radio Tab */}
        <TabsContent value="radio" className="space-y-6" activeTab={activeTab}>
          {/* Radio Status mit Animation */}
          <Card animate={true} className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-purple-500/5 animate-gradient-x"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 animated={true}">
                <div className={`p-2 rounded-full ${radioStatus.isPlaying ? 'bg-red-500/20 animate-pulse' : 'bg-gray-500/20'} transition-all duration-500`}>
                  <Radio className={`w-5 h-5 ${radioStatus.isPlaying ? 'text-red-400' : 'text-gray-400'} transition-colors duration-500`} />
                </div>
                <span className="bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                  📻 Radio Status
                </span>
                {radioStatus.isPlaying && (
                  <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white animate-bounce shadow-neon">
                    <span className="animate-pulse">🎵 LIVE</span>
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-gray-300">
                Aktueller Radio-Status und Steuerung
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {radioStatus.currentStation ? (
                <div className="bg-gradient-to-r from-red-500/20 to-purple-500/20 rounded-xl p-6 border border-red-400/40 shadow-2xl backdrop-blur-sm animate-fade-in-up">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                    <img 
                      src={radioStatus.currentStation.logo} 
                      alt={radioStatus.currentStation.name}
                        className="w-20 h-20 rounded-xl object-cover border-2 border-red-400/50 shadow-lg animate-float"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM2NjY2NjYiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5O7PC90ZXh0Pgo8L3N2Zz4K';
                      }}
                    />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white animate-pulse-slow bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">
                        🎵 {radioStatus.currentStation.name}
                      </h3>
                      <p className="text-red-300 text-lg mt-1 animate-fade-in">{radioStatus.currentStation.description}</p>
                      <div className="flex gap-3 mt-3">
                        <Badge variant="outline" className="text-red-400 border-red-400/60 bg-red-500/10 animate-bounce-slow">
                          🎵 {radioStatus.currentStation.genre}
                        </Badge>
                        <Badge variant="outline" className="text-purple-400 border-purple-400/60 bg-purple-500/10 animate-bounce-slow delay-100">
                          🌍 {radioStatus.currentStation.country}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={stopRadio}
                      disabled={radioLoading}
                      variant="destructive"
                      className="flex items-center gap-2 shadow-xl hover:shadow-red-500/25 animate-pulse-subtle"
                      animated={true}
                    >
                      <Pause className="w-5 h-5 animate-pulse" />
                      {radioLoading ? 'Stoppe...' : 'Radio stoppen'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-dark-muted animate-fade-in">
                  <div className="relative inline-block">
                    <Radio className="w-16 h-16 mx-auto mb-6 text-gray-500 animate-bounce-slow" />
                    <div className="absolute inset-0 w-16 h-16 mx-auto border-2 border-gray-500/30 rounded-full animate-ping"></div>
                  </div>
                  <p className="text-lg font-medium">Kein Radio-Sender aktiv</p>
                  <p className="text-sm mt-2 animate-pulse">Wähle einen Sender aus der Liste unten</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Radio Stations - Kategorisiert */}
          <div className="space-y-6">
            {/* Radio-Sender Kategorie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-purple-accent" />
                  🎵 Radio-Sender
                </CardTitle>
                <CardDescription>
                  Traditionelle Radio-Streams aus Deutschland und international
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {radioStations
                    .filter(station => !station.url.includes('youtube.com'))
                    .map((station) => (
                    <div
                      key={station.id}
                      className={`bg-dark-surface/50 rounded-lg p-4 border transition-all duration-300 hover:scale-105 ${
                        radioStatus.currentStation?.id === station.id
                          ? 'border-red-400 bg-red-500/10'
                          : 'border-purple-primary/30 hover:border-purple-primary'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={station.logo} 
                          alt={station.name}
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzY2NjY2NiIvPgo8dGV4dCB4PSIyNCIgeT0iMjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfk7s8L3RleHQ+Cjwvc3ZnPgo=';
                          }}
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-white">{station.name}</h4>
                          <p className="text-sm text-dark-muted">{station.genre}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-dark-text mb-3">{station.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          🌍 {station.country}
                        </Badge>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => playRadioStation(station.id)}
                            disabled={radioLoading || radioStatus.currentStation?.id === station.id}
                            className="flex items-center gap-2 px-3 py-1 text-sm"
                          >
                            {radioStatus.currentStation?.id === station.id ? (
                              <>
                                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                                Live
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                {radioLoading ? 'Starte...' : 'Abspielen'}
                              </>
                            )}
                          </Button>
                          
                          {/* Lösch-Button nur für custom Sender anzeigen (nicht für vordefinierte) */}
                          {!['1live', 'swr3', 'antenne', 'bigfm', 'ndr2', 'ffn', 'energy', 'sunshine', 'deutschrap1', 'rapstation', 'hiphopradio', 'urbanradio', 'gtaradio', 'oldschool', 'synthwave', 'phonkradio'].includes(station.id) && (
                            <Button
                              onClick={() => removeRadioStation(station.id)}
                              disabled={radioLoading}
                              variant="destructive"
                              className="px-2 py-1 text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* YouTube Live-Streams Kategorie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  🎵 YouTube Live-Streams
                </CardTitle>
                <CardDescription>
                  24/7 YouTube Live-Streams für verschiedene Musikrichtungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {radioStations
                    .filter(station => station.url.includes('youtube.com'))
                    .map((station) => (
                    <div
                      key={station.id}
                      className={`bg-dark-surface/50 rounded-lg p-4 border transition-all duration-300 hover:scale-105 ${
                        radioStatus.currentStation?.id === station.id
                          ? 'border-red-400 bg-red-500/10'
                          : 'border-purple-primary/30 hover:border-purple-primary'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={station.logo} 
                          alt={station.name}
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0ZGMDAwMCIvPgo8dGV4dCB4PSIyNCIgeT0iMjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPllUPC90ZXh0Pgo8L3N2Zz4K';
                          }}
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-white flex items-center gap-2">
                            {station.name}
                            <span className="text-red-500 text-xs">🎵 LIVE</span>
                          </h4>
                          <p className="text-sm text-dark-muted">{station.genre}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-dark-text mb-3">{station.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/30 text-red-400">
                          🌍 {station.country}
                        </Badge>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => playRadioStation(station.id)}
                            disabled={radioLoading || radioStatus.currentStation?.id === station.id}
                            className="flex items-center gap-2 px-3 py-1 text-sm"
                          >
                            {radioStatus.currentStation?.id === station.id ? (
                              <>
                                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                                Live
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                {radioLoading ? 'Starte...' : 'Abspielen'}
                              </>
                            )}
                          </Button>
                          
                          {/* Lösch-Button nur für custom Sender anzeigen (nicht für vordefinierte) */}
                          {!['lofi', 'chillhop', 'deephouse', 'trapmusic', 'gaming', 'jazzhop', 'retrowave', 'bassmusic'].includes(station.id) && (
                            <Button
                              onClick={() => removeRadioStation(station.id)}
                              disabled={radioLoading}
                              variant="destructive"
                              className="px-2 py-1 text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Custom Radio Station mit verbesserter YouTube-Unterstützung */}
          <Card animate={true} className="relative overflow-hidden border-green-500/30">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 animate-gradient-x"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3" animated={true}>
                <div className="p-2 rounded-full bg-green-500/20 animate-pulse">
                  <Plus className="w-5 h-5 text-green-400 animate-bounce-slow" />
                </div>
                <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  🎵 YouTube Radio-Sender hinzufügen
                </span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Füge eigene YouTube Live-Streams oder Radio-Streams hinzu
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-400/30 mb-6 animate-fade-in-up">
                <h4 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube-Unterstützung
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>YouTube Live-Streams (z.B. 24/7 Lofi Radio)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Normale Radio-Streams (.mp3, .m3u8)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Automatische YouTube-Metadaten</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Custom Logo-Upload unterstützt</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="animate-fade-in-right delay-100">
                    <label className="block text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                      🎵 Sender-Name *
                  </label>
                  <Input
                      placeholder="z.B. Mein Lofi Radio"
                    value={newStation.name}
                    onChange={(e) => setNewStation(prev => ({ ...prev, name: e.target.value }))}
                      className="border-green-500/30 focus:border-green-400"
                  />
                </div>
                
                  <div className="animate-fade-in-right delay-200">
                    <label className="block text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                      🌐 Stream-URL * 
                      <span className="text-xs text-gray-400">(YouTube oder direkte URL)</span>
                  </label>
                  <Input
                      placeholder="https://youtube.com/watch?v=... oder https://stream.radio.com/..."
                    value={newStation.url}
                    onChange={(e) => setNewStation(prev => ({ ...prev, url: e.target.value }))}
                      className="border-blue-500/30 focus:border-blue-400"
                  />
                    {newStation.url.includes('youtube.com') && (
                      <p className="text-xs text-green-400 mt-1 animate-pulse">✓ YouTube-Link erkannt</p>
                    )}
                </div>
                
                  <div className="animate-fade-in-right delay-300">
                    <label className="block text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
                      🎭 Genre
                  </label>
                  <Input
                      placeholder="z.B. Lofi Hip Hop, Electronic, Rock"
                    value={newStation.genre}
                    onChange={(e) => setNewStation(prev => ({ ...prev, genre: e.target.value }))}
                      className="border-purple-500/30 focus:border-purple-400"
                  />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="animate-fade-in-left delay-100">
                    <label className="block text-sm font-medium text-orange-400 mb-2 flex items-center gap-2">
                      🌍 Land/Region
                  </label>
                  <Input
                      placeholder="z.B. Deutschland, International, USA"
                    value={newStation.country}
                    onChange={(e) => setNewStation(prev => ({ ...prev, country: e.target.value }))}
                      className="border-orange-500/30 focus:border-orange-400"
                  />
                </div>
                
                  <div className="animate-fade-in-left delay-200">
                    <label className="block text-sm font-medium text-cyan-400 mb-2 flex items-center gap-2">
                      📝 Beschreibung
                  </label>
                  <Input
                    placeholder="Kurze Beschreibung des Senders"
                    value={newStation.description}
                    onChange={(e) => setNewStation(prev => ({ ...prev, description: e.target.value }))}
                      className="border-cyan-500/30 focus:border-cyan-400"
                  />
                </div>
                
                  <div className="animate-fade-in-left delay-300">
                    <label className="block text-sm font-medium text-pink-400 mb-2 flex items-center gap-2">
                      🖼️ Logo-URL (optional)
                  </label>
                  <Input
                    placeholder="https://example.com/logo.png"
                    value={newStation.logo}
                    onChange={(e) => setNewStation(prev => ({ ...prev, logo: e.target.value }))}
                      className="border-pink-500/30 focus:border-pink-400"
                    />
                    {newStation.logo && (
                      <div className="mt-2">
                        <img 
                          src={newStation.logo} 
                          alt="Logo Preview" 
                          className="w-12 h-12 rounded-lg object-cover border border-pink-400/50 animate-fade-in"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-8 animate-fade-in-up delay-500">
                <Button
                  onClick={addCustomRadioStation}
                  disabled={radioLoading || !newStation.name || !newStation.url}
                  className="flex items-center gap-3 px-8 py-3 text-lg bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-xl hover:shadow-green-500/25"
                  animated={true}
                >
                  <Plus className="w-5 h-5 animate-spin-slow" />
                  {radioLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Füge hinzu...
                    </span>
                  ) : (
                    'YouTube Radio hinzufügen'
                  )}
                </Button>
              </div>

              {/* Hilfe-Sektion */}
              <div className="mt-6 p-4 bg-dark-surface/50 rounded-lg border border-gray-600/30 animate-fade-in delay-700">
                <h5 className="text-sm font-medium text-gray-300 mb-2">💡 Tipps für YouTube-Links:</h5>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Verwende YouTube Live-Stream URLs für 24/7 Radio</li>
                  <li>• Normale YouTube-Videos funktionieren auch</li>
                  <li>• Der Bot extrahiert automatisch Audio vom Video</li>
                  <li>• Für beste Qualität verwende offizielle Radio-Streams</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Playlists Tab - MEGA GEILE Features! 🔥 */}
        <TabsContent value="playlists" className="space-y-6" activeTab={activeTab}>
          {/* Playlist Status */}
          <Card animate={true} className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 animate-gradient-x"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3" animated={true}>
                <div className={`p-2 rounded-full ${playlistStatus.isPlaying ? 'bg-green-500/20 animate-pulse' : 'bg-gray-500/20'} transition-all duration-500`}>
                  <svg className={`w-5 h-5 ${playlistStatus.isPlaying ? 'text-green-400' : 'text-gray-400'} transition-colors duration-500`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
                  🎵 Playlist Status
                </span>
                {playlistStatus.isPlaying && (
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white animate-bounce shadow-neon">
                    <span className="animate-pulse">🎵 PLAYING</span>
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-gray-300">
                Aktueller Playlist-Status und Wiedergabe-Steuerung
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {playlistStatus.currentSong ? (
                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-6 border border-green-400/40 shadow-2xl backdrop-blur-sm animate-fade-in-up">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <img 
                        src={playlistStatus.currentSong.thumbnail} 
                        alt={playlistStatus.currentSong.title}
                        className="w-20 h-20 rounded-xl object-cover border-2 border-green-400/50 shadow-lg animate-float"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM2NjY2NjYiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5O7PC90ZXh0Pgo8L3N2Zz4K';
                        }}
                      />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white animate-pulse-slow bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                        🎵 {playlistStatus.currentSong.title}
                      </h3>
                      <p className="text-green-300 text-lg mt-1 animate-fade-in">{playlistStatus.currentSong.artist}</p>
                      <div className="flex gap-3 mt-3">
                        <Badge variant="outline" className="text-green-400 border-green-400/60 bg-green-500/10 animate-bounce-slow">
                          🎵 {playlistStatus.playlist?.name}
                        </Badge>
                        <Badge variant="outline" className="text-blue-400 border-blue-400/60 bg-blue-500/10 animate-bounce-slow delay-100">
                          📀 {playlistStatus.queueLength} in Queue
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={skipToNextSong}
                        disabled={playlistLoading}
                        className="flex items-center gap-2 shadow-xl hover:shadow-green-500/25 animate-pulse-subtle"
                        animated={true}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
                        </svg>
                        Skip
                      </Button>
                      <Button
                        onClick={stopPlaylist}
                        disabled={playlistLoading}
                        variant="destructive"
                        className="flex items-center gap-2 shadow-xl hover:shadow-red-500/25 animate-pulse-subtle"
                        animated={true}
                      >
                        <Pause className="w-5 h-5" />
                        Stop
                      </Button>
                    </div>
                  </div>
                  
                  {/* Queue Preview */}
                  {playlistStatus.queue.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-green-400/30">
                      <h4 className="text-lg font-bold text-green-300 mb-3 flex items-center gap-2">
                        📋 Nächste Songs
                        <Badge className="bg-green-500/20 text-green-300">
                          {playlistStatus.queueLength}
                        </Badge>
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {playlistStatus.queue.slice(0, 5).map((song, index) => (
                          <div key={song.id} className="flex items-center gap-3 bg-dark-surface/50 rounded-lg p-2">
                            <span className="text-green-400 font-mono text-sm w-6">{index + 1}.</span>
                            <img 
                              src={song.thumbnail} 
                              alt={song.title}
                              className="w-8 h-8 rounded object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzY2NjY2NiIvPgo8dGV4dCB4PSIxNiIgeT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfk7s8L3RleHQ+Cjwvc3ZnPgo=';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{song.title}</p>
                              <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                            </div>
                          </div>
                        ))}
                        {playlistStatus.queueLength > 5 && (
                          <div className="text-center text-gray-400 text-sm py-2">
                            ... und {playlistStatus.queueLength - 5} weitere Songs
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-dark-muted animate-fade-in">
                  <div className="relative inline-block">
                    <svg className="w-16 h-16 mx-auto mb-6 text-gray-500 animate-bounce-slow" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    <div className="absolute inset-0 w-16 h-16 mx-auto border-2 border-gray-500/30 rounded-full animate-ping"></div>
                  </div>
                  <p className="text-lg font-medium">Keine Playlist aktiv</p>
                  <p className="text-sm mt-2 animate-pulse">Erstelle oder wähle eine Playlist aus!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* YouTube Search Integration */}
          <Card animate={true} className="relative overflow-hidden border-blue-500/30">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-gradient-x"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3" animated={true}>
                <div className="p-2 rounded-full bg-blue-500/20 animate-pulse">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                  </svg>
                </div>
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  🔍 YouTube Suche
                </span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Suche nach YouTube-Videos und füge sie zu deinen Playlists hinzu
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex gap-3 mb-6">
                <Input
                  type="text"
                  placeholder="Suche nach Songs, Künstlern oder Alben..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchYouTube(searchQuery)}
                  className="flex-1 border-blue-500/30 focus:border-blue-400"
                />
                <Button
                  onClick={() => searchYouTube(searchQuery)}
                  disabled={searchLoading || !searchQuery.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  animated={true}
                >
                  {searchLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                    </svg>
                  )}
                  Suchen
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <h4 className="text-lg font-bold text-blue-300 flex items-center gap-2">
                    🎵 Suchergebnisse
                    <Badge className="bg-blue-500/20 text-blue-300">
                      {searchResults.length}
                    </Badge>
                  </h4>
                  {searchResults.map((result) => (
                    <div key={result.id} className="bg-dark-surface/50 rounded-lg p-4 hover:bg-dark-surface/70 transition-all duration-300 border border-blue-500/20 hover:border-blue-500/40">
                      <div className="flex items-center gap-4">
                        <img 
                          src={result.thumbnail} 
                          alt={result.title}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM2NjY2NjYiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5O7PC90ZXh0Pgo8L3N2Zz4K';
                          }}
                        />
                        <div className="flex-1">
                          <h5 className="font-bold text-white text-lg">{result.title}</h5>
                          <p className="text-gray-400">{result.artist}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              ⏱️ {Math.floor(result.duration / 60)}:{(result.duration % 60).toString().padStart(2, '0')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              👁️ {result.views?.toLocaleString() || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {playlists.map((playlist) => (
                            <Button
                              key={playlist.id}
                              onClick={() => addSongToPlaylist(playlist.id, result)}
                              className="text-xs px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                              animated={true}
                            >
                              📋 {playlist.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Playlists */}
          <Card animate={true}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  🎵 Meine Playlists
                </div>
                <Button
                  onClick={() => createNewPlaylist({ 
                    name: `Neue Playlist ${playlists.length + 1}`,
                    description: 'Automatisch erstellte Playlist'
                  })}
                  className="bg-gradient-to-r from-green-500 to-green-600"
                  animated={true}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Playlist
                </Button>
              </CardTitle>
              <CardDescription>
                Deine eigenen YouTube-Playlists mit Drag & Drop Editor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {playlists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:scale-105"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <img 
                          src={playlist.thumbnail} 
                          alt={playlist.name}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM2NjMzOTkiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5O7PC90ZXh0Pgo8L3N2Zz4K';
                          }}
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-lg">{playlist.name}</h4>
                          <p className="text-gray-400 text-sm">{playlist.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mb-4">
                        <Badge variant="outline" className="text-xs">
                          🎵 {playlist.songs.length} Songs
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ▶️ {playlist.playCount} Plays
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          🏷️ {playlist.genre}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => playPlaylist(playlist.id)}
                          disabled={playlistLoading || playlist.songs.length === 0}
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                          animated={true}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {playlistLoading ? 'Starte...' : 'Abspielen'}
                        </Button>
                        <Button
                          onClick={() => deletePlaylist(playlist.id)}
                          variant="destructive"
                          className="px-3"
                          animated={true}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Playlist Songs Preview */}
                      {playlist.songs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-green-500/20">
                          <h5 className="text-sm font-medium text-green-300 mb-2">Vorschau:</h5>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {playlist.songs.slice(0, 3).map((song) => (
                              <div key={song.id} className="flex items-center gap-2 text-xs">
                                <img 
                                  src={song.thumbnail} 
                                  alt={song.title}
                                  className="w-6 h-6 rounded object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzY2NjY2NiIvPgo8dGV4dCB4PSIxMiIgeT0iMTQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+TuzwvdGV4dD4KPC9zdmc+Cg==';
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white truncate">{song.title}</p>
                                  <p className="text-gray-400 truncate">{song.artist}</p>
                                </div>
                                <Button
                                  onClick={() => removeSongFromPlaylist(playlist.id, song.id)}
                                  className="w-5 h-5 p-0 bg-red-500/20 hover:bg-red-500/40 text-red-400"
                                  animated={true}
                                >
                                  ✕
                                </Button>
                              </div>
                            ))}
                            {playlist.songs.length > 3 && (
                              <div className="text-center text-gray-400 text-xs py-1">
                                ... und {playlist.songs.length - 3} weitere
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-dark-muted">
                  <div className="relative inline-block">
                    <svg className="w-16 h-16 mx-auto mb-6 text-gray-500 animate-bounce-slow" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    <div className="absolute inset-0 w-16 h-16 mx-auto border-2 border-gray-500/30 rounded-full animate-ping"></div>
                  </div>
                  <p className="text-lg font-medium">Keine Playlists vorhanden</p>
                  <p className="text-sm mt-2 animate-pulse">Erstelle deine erste Playlist!</p>
                  <Button
                    onClick={() => createNewPlaylist({ 
                      name: 'Meine erste Playlist',
                      description: 'Automatisch erstellte Playlist'
                    })}
                    className="mt-6 bg-gradient-to-r from-green-500 to-green-600"
                    animated={true}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Erste Playlist erstellen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-accent" />
                YouTube Radio Einstellungen
              </CardTitle>
              <CardDescription>
                Konfiguriere dein einfaches YouTube Radio-System
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Radio aktivieren/deaktivieren */}
                <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg">
                  <div>
                    <label className="text-white font-medium">📻 YouTube Radio aktivieren</label>
                    <p className="text-red-300 text-sm">Hauptschalter für das gesamte Radio-System</p>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>

                {/* Radio-spezifische Einstellungen */}
                {settings.enabled && (
                  <>
                    <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg">
                      <div>
                        <label className="text-white font-medium">🔊 Now Playing anzeigen</label>
                        <p className="text-purple-300 text-sm">Zeigt aktuell gespielten Radio-Stream im Chat</p>
                      </div>
                      <Switch
                        checked={settings.radio.showNowPlaying}
                        onCheckedChange={(checked) => setSettings(prev => ({ 
                          ...prev, 
                          radio: { ...prev.radio, showNowPlaying: checked }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-orange-500/10 rounded-lg">
                      <div>
                        <label className="text-white font-medium">⏹️ Auto-Stop bei Disconnect</label>
                        <p className="text-orange-300 text-sm">Stoppt Radio automatisch wenn alle User den Voice-Channel verlassen</p>
                      </div>
                      <Switch
                        checked={settings.radio.autoStop}
                        onCheckedChange={(checked) => setSettings(prev => ({ 
                          ...prev, 
                          radio: { ...prev.radio, autoStop: checked }
                        }))}
                      />
                    </div>

                    {/* Embed Farbe - Schönes Design wie XP.tsx */}
                    <div>
                      <label className="block text-dark-text text-sm font-medium mb-2">
                        🎨 Radio Embed Farbe
                      </label>
                      <div className="flex gap-3 items-center">
                        {/* Color Picker */}
                        <div className="relative">
                          <input
                            type="color"
                            value={settings.radio.embedColor?.startsWith?.('#') ? settings.radio.embedColor : '#FF6B6B'}
                            onChange={(e) => {
                              const hexColor = e.target.value;
                              setSettings(prev => ({ 
                                ...prev, 
                                radio: { ...prev.radio, embedColor: hexColor }
                              }));
                            }}
                            className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 bg-dark-bg cursor-pointer hover:border-neon-purple transition-all duration-300 hover:scale-105"
                            style={{
                              filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                            }}
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-neon rounded-full animate-ping opacity-60"></div>
                        </div>
                        
                        {/* Hex Input */}
                        <div className="flex-1">
                          <Input
                            type="text"
                            value={settings.radio.embedColor || '#FF6B6B'}
                            onChange={(e) => setSettings(prev => ({ 
                              ...prev, 
                              radio: { ...prev.radio, embedColor: e.target.value }
                            }))}
                            className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple font-mono"
                            placeholder="#FF6B6B"
                          />
                        </div>

                        {/* Color Preview */}
                        <div 
                          className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                          style={{
                            backgroundColor: settings.radio.embedColor?.startsWith?.('#') ? settings.radio.embedColor : '#FF6B6B',
                            filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                          }}
                        >
                          📻
                        </div>
                      </div>
                      
                      {/* Preset Colors */}
                      <div className="mt-3">
                        <p className="text-xs text-dark-muted mb-2">Beliebte Radio Farben:</p>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { name: 'Radio Rot', color: '#FF6B6B' },
                            { name: 'YouTube Rot', color: '#FF0000' },
                            { name: 'Orange', color: '#FF8C00' },
                            { name: 'Lila', color: '#9B59B6' },
                            { name: 'Blau', color: '#3498DB' },
                            { name: 'Grün', color: '#2ECC71' },
                            { name: 'Pink', color: '#E91E63' },
                            { name: 'Cyan', color: '#1ABC9C' },
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              onClick={() => setSettings(prev => ({ 
                                ...prev, 
                                radio: { ...prev.radio, embedColor: preset.color }
                              }))}
                              className="w-8 h-8 rounded-lg border border-purple-primary/30 hover:border-neon-purple transition-all duration-300 hover:scale-110 relative group"
                              style={{
                                backgroundColor: preset.color,
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

                    {/* Ankündigungs-Channel */}
                    <div>
                      <label className="block text-dark-text text-sm font-medium mb-2">
                        📢 Ankündigungs-Channel (optional)
                      </label>
                      <select
                        value={settings.announcements.channelId}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          announcements: { ...prev.announcements, channelId: e.target.value }
                        }))}
                        className="bg-dark-bg border border-purple-primary/30 text-dark-text rounded-lg px-4 py-2 w-full focus:border-neon-purple focus:outline-none"
                      >
                        <option value="">Kein Ankündigungs-Channel</option>
                        {channels.filter(ch => ch.type === 'text').map(channel => (
                          <option key={channel.id} value={channel.id}>
                            #{channel.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-dark-muted text-xs mt-1">
                        Channel für Radio-Start/Stop Ankündigungen
                      </p>
                    </div>
                    
                    {/* Interactive Panel */}
                    <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-primary/20">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-white font-medium">🎛️ Interactive Radio Panel</h4>
                          <p className="text-purple-300 text-sm">Discord Panel mit Radio-Auswahl Buttons</p>
                        </div>
                        <Switch
                          checked={settings.interactivePanel.enabled}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            interactivePanel: { ...prev.interactivePanel, enabled: checked }
                          }))}
                        />
                      </div>

                      {settings.interactivePanel.enabled && (
                        <div className="space-y-4 pt-4 border-t border-purple-primary/20">
                          <div>
                            <label className="block text-purple-200 text-sm font-medium mb-2">
                              📺 Panel-Channel
                            </label>
                            <select
                              value={settings.interactivePanel.channelId}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                interactivePanel: { ...prev.interactivePanel, channelId: e.target.value }
                              }))}
                              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white w-full focus:border-purple-primary focus:outline-none"
                            >
                              <option value="">Channel auswählen...</option>
                              {channels.filter(ch => ch.type === 'text').map(channel => (
                                <option key={channel.id} value={channel.id}>
                                  #{channel.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-purple-200 text-sm">🔄 Auto-Update</span>
                            <Switch
                              checked={settings.interactivePanel.autoUpdate}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                interactivePanel: { ...prev.interactivePanel, autoUpdate: checked }
                              }))}
                            />
                          </div>

                          {/* Interactive Panel Embed Farbe */}
                          <div>
                            <label className="block text-purple-200 text-sm font-medium mb-2">
                              🎨 Panel Embed Farbe
                            </label>
                            <div className="flex gap-3 items-center">
                              {/* Color Picker */}
                              <div className="relative">
                                <input
                                  type="color"
                                  value={settings.interactivePanel.embedColor?.startsWith?.('#') ? settings.interactivePanel.embedColor : '#FF6B6B'}
                                  onChange={(e) => {
                                    const hexColor = e.target.value;
                                    setSettings(prev => ({ 
                                      ...prev, 
                                      interactivePanel: { ...prev.interactivePanel, embedColor: hexColor }
                                    }));
                                  }}
                                  className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 bg-dark-bg cursor-pointer hover:border-neon-purple transition-all duration-300 hover:scale-105"
                                  style={{
                                    filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                                  }}
                                />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-neon rounded-full animate-ping opacity-60"></div>
                              </div>
                              
                              {/* Hex Input */}
                              <div className="flex-1">
                                <Input
                                  type="text"
                                  value={settings.interactivePanel.embedColor || '#FF6B6B'}
                                  onChange={(e) => setSettings(prev => ({ 
                                    ...prev, 
                                    interactivePanel: { ...prev.interactivePanel, embedColor: e.target.value }
                                  }))}
                                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple font-mono"
                                  placeholder="#FF6B6B"
                                />
                              </div>

                              {/* Color Preview */}
                              <div 
                                className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                                style={{
                                  backgroundColor: settings.interactivePanel.embedColor?.startsWith?.('#') ? settings.interactivePanel.embedColor : '#FF6B6B',
                                  filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                                }}
                              >
                                🎛️
                              </div>
                            </div>
                            
                            {/* Preset Colors */}
                            <div className="mt-3">
                              <p className="text-xs text-purple-300 mb-2">Beliebte Panel Farben:</p>
                              <div className="flex gap-2 flex-wrap">
                                {[
                                  { name: 'Panel Rot', color: '#FF6B6B' },
                                  { name: 'Discord Blau', color: '#5865F2' },
                                  { name: 'Lila', color: '#9B59B6' },
                                  { name: 'Grün', color: '#2ECC71' },
                                  { name: 'Orange', color: '#FF8C00' },
                                  { name: 'Pink', color: '#E91E63' },
                                  { name: 'Cyan', color: '#1ABC9C' },
                                  { name: 'Gold', color: '#F1C40F' },
                                ].map((preset) => (
                                  <button
                                    key={preset.name}
                                    onClick={() => setSettings(prev => ({ 
                                      ...prev, 
                                      interactivePanel: { ...prev.interactivePanel, embedColor: preset.color }
                                    }))}
                                    className="w-8 h-8 rounded-lg border border-purple-primary/30 hover:border-neon-purple transition-all duration-300 hover:scale-110 relative group"
                                    style={{
                                      backgroundColor: preset.color,
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

                          <div className="pt-4 border-t border-purple-primary/20">
                            <Button
                              onClick={postInteractivePanel}
                              disabled={!settings.interactivePanel.channelId}
                              className="w-full"
                            >
                              📻 Radio Panel posten
                            </Button>
                            {settings.interactivePanel.messageId && (
                              <p className="text-xs text-purple-300 mt-2 text-center">
                                Panel bereits gepostet (ID: {settings.interactivePanel.messageId.slice(0, 8)}...)
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Voice Channel Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-purple-accent" />
                Voice Channel Einstellungen
              </CardTitle>
              <CardDescription>
                Konfiguriere Voice-Channel Verhalten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Voice Channels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {channels.filter(c => c.type === 'voice').map(channel => (
                    <Button
                      key={channel.id}
                      onClick={() => joinVoiceChannel(channel.id)}
                      variant="outline"
                      className="justify-between"
                    >
                      <span>🔊 {channel.name}</span>
                      <Users className="w-4 h-4" />
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={leaveVoiceChannel}
                  variant="destructive"
                  className="w-full"
                >
                  👋 Voice Channel verlassen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Toast-Container für Benachrichtigungen */}
      <ToastContainer 
        toasts={toasts} 
        removeToast={removeToast} 
      />
    </div>
  );
};

export default Music; 
