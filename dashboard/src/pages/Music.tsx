import { useState, useEffect } from 'react';
import { Radio, Play, Pause, Settings, Save, Mic, Users, Plus, Trash2, Edit, GripVertical, Upload, Music as MusicIcon, Waves, StopCircle } from 'lucide-react';
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

// Genre-Liste
const musicGenres = [
  'Hip-Hop', 'Rap', 'Trap', 'Lofi', 'Chill', 'Electronic', 'House', 'Techno',
  'Dubstep', 'Bass', 'Jazz', 'Blues', 'Rock', 'Pop', 'Classical', 'Ambient',
  'Gaming', 'Synthwave', 'Retrowave', 'R&B', 'Soul', 'Funk', 'Reggae',
  'Country', 'Folk', 'Metal', 'Punk', 'Indie', 'Alternative', 'Experimental'
];

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

// Button component mit besseren Animationen
const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string; 
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
}> = ({ children, onClick, className = '', disabled = false, variant = 'default' }) => {
  const variantClasses = {
    default: "bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white shadow-neon hover:scale-105",
    destructive: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-neon hover:scale-105",
    outline: "border border-purple-primary/30 bg-transparent hover:bg-purple-primary/20 text-dark-text",
    secondary: "bg-dark-surface/50 hover:bg-dark-surface text-dark-text",
    ghost: "hover:bg-purple-primary/20 text-dark-text"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2 ${variantClasses[variant]} hover:scale-105 active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
};

// Input component
const Input: React.FC<{ 
  type?: string; 
  placeholder?: string; 
  value?: string; 
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  onKeyPress?: (e: React.KeyboardEvent) => void;
}> = ({ type = 'text', placeholder, value, onChange, className = '', onKeyPress, ...props }) => (
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

// Select component
const Select: React.FC<{
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ value, onChange, children, className = '' }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`bg-dark-bg/70 border border-purple-primary/30 text-dark-text focus:border-neon-purple rounded-lg px-3 py-2 w-full transition-all duration-300 focus:scale-105 hover:shadow-neon ${className}`}
  >
    {children}
  </select>
);

// Drag & Drop Component
const DragDropSong: React.FC<{
  song: Song;
  index: number;
  onRemove: (index: number) => void;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
}> = ({ song, index, onRemove, isDragging, onDragStart, onDragOver, onDrop }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart?.(e, index)}
    onDragOver={onDragOver}
    onDrop={(e) => onDrop?.(e, index)}
    className={`flex items-center gap-3 p-3 bg-dark-surface/50 rounded-lg border transition-all duration-300 hover:border-purple-primary/50 ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'}`}
  >
    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white truncate">{song.title}</p>
      <p className="text-xs text-gray-400 truncate">{song.artist}</p>
    </div>
    <div className="text-xs text-gray-500">
      {Math.round(song.size / 1024 / 1024)}MB
    </div>
    <Button
      variant="destructive"
      onClick={() => onRemove(index)}
      className="px-2 py-1 text-xs"
    >
      <Trash2 className="w-3 h-3" />
    </Button>
  </div>
);

// Interfaces
interface Song {
  id: string;
  filename: string;
  title: string;
  artist: string;
  duration: number;
  size: number;
  path: string;
}

interface Station {
  id: string;
  name: string;
  genre: string;
  description: string;
  playlist: Song[];
  logo: string;
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
  localMusic: {
    enabled: boolean;
    musicDirectory: string;
    stations: Station[];
    defaultStation: string;
    autoStop: boolean;
    showNowPlaying: boolean;
    embedColor: string;
  };
  voiceChannel: {
    preferredChannelId: string;
    autoJoin: boolean;
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
}

interface MusicStatus {
  isPlaying: boolean;
  currentSong: Song | null;
  currentStation: Station | null;
}



const Music: React.FC = () => {
  // API Base URL
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'radio' | 'local' | 'settings'>('settings');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  
  // State
  const [settings, setSettings] = useState<MusicSettings>({
    enabled: true,
    radio: {
      enabled: true,
      stations: [],
      defaultStation: 'lofi',
      autoStop: false,
      showNowPlaying: true,
      embedColor: '#FF6B6B'
    },
    localMusic: {
      enabled: true,
      musicDirectory: './music',
      stations: [],
      defaultStation: 'custom1',
      autoStop: false,
      showNowPlaying: true,
      embedColor: '#FF6B6B'
    },
    voiceChannel: {
      preferredChannelId: '',
      autoJoin: true
    },
    announcements: {
      channelId: ''
    },
    interactivePanel: {
      enabled: true,
      channelId: '',
      messageId: '',
      autoUpdate: true,
      embedColor: '#FF6B6B'
    }
  });

  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [radioStations, setRadioStations] = useState<RadioStation[]>([]);
  const [musicStatus, setMusicStatus] = useState<MusicStatus>({
    isPlaying: false,
    currentSong: null,
    currentStation: null
  });
  const [radioStatus, setRadioStatus] = useState({
    isPlaying: false,
    currentStation: null as RadioStation | null
  });
  const [guildId, setGuildId] = useState<string | null>(null);

  // Station Creation State
  const [isCreatingStation, setIsCreatingStation] = useState(false);
  const [newStation, setNewStation] = useState({
    name: '',
    genre: 'Hip-Hop',
    description: '',
    playlist: [] as Song[]
  });

  // Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Guild & Channel State
  const [guildInfo, setGuildInfo] = useState<{
    id: string;
    name: string;
    icon: string | null;
  } | null>(null);
  const [channels, setChannels] = useState<{
    text: Array<{ id: string; name: string; position: number }>;
    voice: Array<{ id: string; name: string; position: number; members: number; joinable: boolean }>;
  }>({ text: [], voice: [] });
  


  // Load Guild Channels
  const loadGuildChannels = async (targetGuildId: string) => {
    try {
      console.log(`🔄 Lade Channels für Guild: ${targetGuildId}`);
      
      const response = await fetch(`${apiUrl}/api/music/guild/${targetGuildId}/channels`);
      if (response.ok) {
        const data = await response.json();
        setGuildInfo(data.guild);
        setChannels(data.channels);
        console.log(`✅ Guild-Channels geladen: ${data.channels.text.length} Text, ${data.channels.voice.length} Voice`);
      } else {
        console.warn('⚠️ Fehler beim Laden der Guild-Channels');
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Guild-Channels:', error);
    }
  };

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Lade Musik-System Daten...');
      
      // Guild ID aus URL oder localStorage
      const params = new URLSearchParams(window.location.search);
      const urlGuildId = params.get('guild') || params.get('guildId');
      
      // Auch aus localStorage versuchen
      const storedGuildId = localStorage.getItem('selectedGuildId');
      
      const finalGuildId = urlGuildId || storedGuildId;
      
      console.log('🔍 Guild ID Suche:', {
        urlGuildId,
        storedGuildId,
        finalGuildId,
        currentUrl: window.location.href
      });
      
      if (finalGuildId) {
        setGuildId(finalGuildId);
        localStorage.setItem('selectedGuildId', finalGuildId);
        console.log(`🏠 Guild ID gesetzt: ${finalGuildId}`);
        
        // Lade Guild-Channels
        await loadGuildChannels(finalGuildId);
      } else {
        console.log('⚠️ Keine Guild ID gefunden');
        // Versuche eine Standard-Guild-ID vom Server zu holen
        try {
          const guildResponse = await fetch(`${apiUrl}/api/guilds`);
          if (guildResponse.ok) {
            const guildData = await guildResponse.json();
            console.log('📡 Guild Antwort vom Server:', guildData);
            if (guildData.primaryGuild) {
              setGuildId(guildData.primaryGuild);
              localStorage.setItem('selectedGuildId', guildData.primaryGuild);
              console.log(`🏠 Primary Guild ID gesetzt: ${guildData.primaryGuild}`);
              await loadGuildChannels(guildData.primaryGuild);
            } else if (guildData.guilds && guildData.guilds.length > 0) {
              const firstGuild = guildData.guilds[0];
              setGuildId(firstGuild.id);
              localStorage.setItem('selectedGuildId', firstGuild.id);
              console.log(`🏠 Erste verfügbare Guild ID gesetzt: ${firstGuild.id} (${firstGuild.name})`);
              await loadGuildChannels(firstGuild.id);
            }
          }
        } catch (error) {
          console.warn('Konnte keine Guilds vom Server laden:', error);
        }
      }

      // Settings laden
      const response = await fetch(`${apiUrl}/api/music/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }

      // Verfügbare Songs und Radio-Stationen laden
      await loadAvailableSongs();
      await loadRadioStations();

      // Status laden
      const currentGuildId = guildId || finalGuildId;
      if (currentGuildId) {
        await loadMusicStatus(currentGuildId);
        await loadRadioStatus(currentGuildId);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      showError('Lade Fehler', 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSongs = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/music/songs`);
      if (response.ok) {
        const data = await response.json();
        setAvailableSongs(data.songs || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Songs:', error);
    }
  };

  const loadRadioStations = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/music/radio/stations`);
      if (response.ok) {
        const data = await response.json();
        setRadioStations(data.stations || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Radio-Stationen:', error);
    }
  };



  const loadMusicStatus = async (guildId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/music/status/${guildId}`);
      if (response.ok) {
        const data = await response.json();
        setMusicStatus({
          isPlaying: data.isPlaying || false,
          currentSong: data.currentSong || null,
          currentStation: data.currentStation || null
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden des Music Status:', error);
    }
  };

  const loadRadioStatus = async (guildId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/music/radio/${guildId}/status`);
      if (response.ok) {
        const data = await response.json();
        setRadioStatus({
          isPlaying: data.isPlaying || false,
          currentStation: data.currentStation || null
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden des Radio Status:', error);
    }
  };

  // Save Settings
  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${apiUrl}/api/music/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        showSuccess('Musik', '🎵 Einstellungen erfolgreich gespeichert!');
      } else {
        showError('Speicher Fehler', '❌ Fehler beim Speichern der Einstellungen');
      }
    } catch (error) {
      showError('Speicher Fehler', 'Verbindungsfehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  // Music Controls
  const playSong = async (songId: string) => {
    if (!guildId) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/music/play/${guildId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId })
      });
      
      if (response.ok) {
        const data = await response.json();
        showSuccess('Musik', data.message);
        await loadMusicStatus(guildId);
      } else {
        const data = await response.json();
        showError('Musik Fehler', data.error || 'Fehler beim Abspielen');
      }
    } catch (error) {
      showError('Musik Fehler', 'Verbindungsfehler beim Abspielen');
    }
  };

  const playStation = async (stationId: string) => {
    if (!guildId) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/music/station/${guildId}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId })
      });

      if (response.ok) {
      const data = await response.json();
        showSuccess('Musik', data.message);
        await loadMusicStatus(guildId);
      } else {
        const data = await response.json();
        showError('Musik Fehler', data.error || 'Fehler beim Abspielen der Station');
      }
    } catch (error) {
      showError('Musik Fehler', 'Verbindungsfehler beim Abspielen der Station');
    }
  };

  const stopMusic = async () => {
    if (!guildId) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/music/stop/${guildId}`, {
            method: 'POST'
          });

      if (response.ok) {
        const data = await response.json();
        showSuccess('Musik', data.message);
        await loadMusicStatus(guildId);
      } else {
        showError('Musik Fehler', 'Fehler beim Stoppen der Musik');
      }
    } catch (error) {
      showError('Musik Fehler', 'Verbindungsfehler beim Stoppen');
    }
  };

  // Radio Controls
  const playRadioStation = async (stationId: string) => {
    if (!guildId) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/music/radio/${guildId}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId })
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess('Radio', data.message);
        await loadRadioStatus(guildId);
      } else {
        const data = await response.json();
        showError('Radio Fehler', data.error || 'Fehler beim Abspielen');
      }
    } catch (error) {
      showError('Radio Fehler', 'Verbindungsfehler beim Abspielen');
    }
  };

  const stopRadio = async () => {
    if (!guildId) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/music/radio/${guildId}/stop`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess('Radio', data.message);
        await loadRadioStatus(guildId);
      } else {
        showError('Radio Fehler', 'Fehler beim Stoppen des Radios');
      }
    } catch (error) {
      showError('Radio Fehler', 'Verbindungsfehler beim Stoppen');
    }
  };

  // Station Management
  const createStation = async () => {
    if (!newStation.name.trim()) {
      showError('Station Fehler', 'Station-Name ist erforderlich');
      return;
    }

    const stationWithId = {
      ...newStation,
      id: `station_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM2NjMzOTkiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+🎵</text></svg>'
    };

    const updatedStations = [...settings.localMusic.stations, stationWithId];
    
    setSettings(prev => ({
      ...prev,
      localMusic: {
        ...prev.localMusic,
        stations: updatedStations
      }
    }));

    await saveSettings();
    
    // Reset form
        setNewStation({
          name: '',
      genre: 'Hip-Hop',
          description: '',
      playlist: []
    });
    setIsCreatingStation(false);
    
    showSuccess('Station', `Station "${stationWithId.name}" erfolgreich erstellt!`);
  };

  const updateStationName = async (stationId: string, newName: string) => {
    const updatedStations = settings.localMusic.stations.map(station =>
      station.id === stationId ? { ...station, name: newName } : station
    );
    
    setSettings(prev => ({
      ...prev,
      localMusic: {
        ...prev.localMusic,
        stations: updatedStations
      }
    }));

    await saveSettings();
    showSuccess('Station', 'Station-Name aktualisiert!');
  };

  const deleteStation = async (stationId: string) => {
    const updatedStations = settings.localMusic.stations.filter(s => s.id !== stationId);
    
    setSettings(prev => ({
      ...prev,
      localMusic: {
        ...prev.localMusic,
        stations: updatedStations
      }
    }));

    await saveSettings();
    showSuccess('Station', 'Station gelöscht!');
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newPlaylist = [...newStation.playlist];
    const [draggedSong] = newPlaylist.splice(draggedIndex, 1);
    newPlaylist.splice(dropIndex, 0, draggedSong);
    
    setNewStation(prev => ({ ...prev, playlist: newPlaylist }));
    setDraggedIndex(null);
  };

  const addSongToPlaylist = (song: Song) => {
    if (newStation.playlist.find(s => s.id === song.id)) {
      showError('Playlist', 'Song ist bereits in der Playlist');
      return;
    }
    
    setNewStation(prev => ({
      ...prev,
      playlist: [...prev.playlist, song]
    }));
  };

  const removeSongFromPlaylist = (index: number) => {
    setNewStation(prev => ({
      ...prev,
      playlist: prev.playlist.filter((_, i) => i !== index)
    }));
  };

  // Interactive Panel Functions
  const postInteractivePanel = async () => {
    if (!settings.interactivePanel.channelId.trim()) {
      showError('Panel Fehler', 'Bitte zuerst einen Channel für das Interactive Panel konfigurieren!');
      return;
    }
    
    try {
      // Zuerst Einstellungen speichern
      await saveSettings();
      
      // Guild ID ermitteln - fallback auf eine Standard-ID
      let targetGuildId = guildId;
      
      if (!targetGuildId) {
        // Versuche aus verschiedenen Quellen zu lesen
        const params = new URLSearchParams(window.location.search);
        targetGuildId = params.get('guild') || params.get('guildId') || localStorage.getItem('selectedGuildId');
        
        if (!targetGuildId) {
          // Als letzter Ausweg: Versuche die erste verfügbare Guild vom Server zu holen
          showError('Panel Fehler', 'Keine Guild ID gefunden. Bitte über das Server-Management Dashboard navigieren.');
          return;
        }
        
        setGuildId(targetGuildId);
        localStorage.setItem('selectedGuildId', targetGuildId);
      }
      
      console.log(`🏠 Verwende Guild ID: ${targetGuildId}`);
      
      const response = await fetch(`${apiUrl}/api/music/interactive-panel/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: settings.interactivePanel.channelId,
          embedColor: settings.interactivePanel.embedColor
        })
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const actionText = settings.interactivePanel.messageId ? 'aktualisiert' : 'erstellt';
        showSuccess('Interactive Panel', `🎛️ Interactive Panel erfolgreich ${actionText}!`);
        
        // Lade Settings neu um eventuelle neue message ID zu bekommen
        await loadData();
      } else {
        const data = await response.json().catch(() => ({ error: 'Unbekannter Server-Fehler' }));
        showError('Panel Fehler', data.error || 'Fehler beim Verwalten des Interactive Panels');
        console.error('Panel API Response:', {
          status: response.status,
          statusText: response.statusText,
          error: data
        });
      }
    } catch (error) {
      console.error('Panel Fehler:', error);
      showError('Panel Fehler', 'Verbindungsfehler beim Erstellen des Interactive Panels');
    }
  };

  const updateInteractivePanel = async () => {
    if (!guildId) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/music/interactive-panel/${guildId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        showSuccess('Interactive Panel', '🔄 Interactive Panel erfolgreich aktualisiert!');
      } else {
        const data = await response.json();
        showError('Panel Fehler', data.error || 'Fehler beim Aktualisieren des Interactive Panels');
      }
    } catch (error) {
      showError('Panel Fehler', 'Verbindungsfehler beim Aktualisieren des Interactive Panels');
    }
  };

  // Auto-Save Effect
  useEffect(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    const timer = setTimeout(() => {
      saveSettings();
    }, 2000); // Auto-save nach 2 Sekunden
    
    setAutoSaveTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [settings]);

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Musik System...</div>
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
          <Radio className="w-12 h-12 text-purple-400 animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            Musik System
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Radio-Streams & lokale MP3-Sammlung in einem System! 
          <span className="ml-2 inline-block relative">
            🎵📻
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-dark-surface/50 rounded-lg p-1 flex gap-1">
          <Button
            onClick={() => setActiveTab('radio')}
            variant={activeTab === 'radio' ? 'default' : 'ghost'}
            className="flex items-center gap-2"
          >
            <Radio className="w-4 h-4" />
            Radio Streams
          </Button>
          <Button
            onClick={() => setActiveTab('local')}
            variant={activeTab === 'local' ? 'default' : 'ghost'}
            className="flex items-center gap-2"
          >
            <MusicIcon className="w-4 h-4" />
            Lokale MP3s
          </Button>
          <Button
            onClick={() => setActiveTab('settings')}
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Einstellungen
          </Button>
            </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <Button 
          onClick={saveSettings} 
          disabled={saving} 
          className="flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>{saving ? 'Speichere...' : 'Einstellungen speichern'}</span>
        </Button>
        
        {autoSaveTimer && (
          <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-300">Auto-Save aktiv</span>
          </div>
        )}
      </div>

      {/* System Status */}
      <div className="flex justify-center gap-4 items-center flex-wrap">
        <Badge variant={settings.enabled ? "default" : "outline"} className="text-lg py-2 px-4">
          {settings.enabled ? '✅ Musik System Aktiviert' : '❌ Musik System Deaktiviert'}
        </Badge>
        
        {/* Guild Status */}
        <div className="flex items-center gap-2 bg-dark-surface/90 backdrop-blur-xl border border-blue-primary/30 rounded-lg px-3 py-2">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${guildInfo ? 'bg-blue-400 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm text-dark-muted">
            {guildInfo 
              ? `🏠 Server: ${guildInfo.name}` 
              : guildId 
                ? `🔄 Lade Server: ${guildId.slice(0, 8)}...`
                : '❌ Kein Server verbunden'
            }
          </span>
        </div>
        
        {/* Music Status */}
        <div className="flex items-center gap-2 bg-dark-surface/90 backdrop-blur-xl border border-purple-primary/30 rounded-lg px-3 py-2">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${musicStatus.isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
          <span className="text-sm text-dark-muted">
            {musicStatus.isPlaying 
              ? `🎵 ${musicStatus.currentSong?.title || 'Unbekannt'}` 
              : 'Keine Musik aktiv'
            }
          </span>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'settings' ? (
        /* Settings Tab Content */
          <div className="space-y-6">
          {/* System Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" />
                System Einstellungen
                </CardTitle>
                <CardDescription>
                Grundlegende Musik-System Konfiguration
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">🎵 Musik System aktivieren</h4>
                  <p className="text-sm text-gray-400">Aktiviert das gesamte Musik-System für den Server</p>
                        </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                />
                      </div>
                      
                      <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">📻 Radio System aktivieren</h4>
                  <p className="text-sm text-gray-400">Aktiviert die Radio-Stream Funktionen</p>
                        </div>
                <Switch
                  checked={settings.radio.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    radio: { ...prev.radio, enabled: checked }
                  }))}
                  />
                </div>
                
              <div className="flex items-center justify-between">
                  <div>
                  <h4 className="font-medium text-white">🎵 Lokale MP3s aktivieren</h4>
                  <p className="text-sm text-gray-400">Aktiviert das lokale MP3-System</p>
                  </div>
                  <Switch
                  checked={settings.localMusic.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    localMusic: { ...prev.localMusic, enabled: checked }
                  }))}
                  />
                </div>

              <div className="flex items-center justify-between">
                      <div>
                  <h4 className="font-medium text-white">🔄 Auto-Stop aktivieren</h4>
                  <p className="text-sm text-gray-400">Stoppt Musik automatisch wenn alle User den Channel verlassen</p>
                      </div>
                      <Switch
                  checked={settings.radio.autoStop}
                        onCheckedChange={(checked) => setSettings(prev => ({ 
                          ...prev, 
                    radio: { ...prev.radio, autoStop: checked },
                    localMusic: { ...prev.localMusic, autoStop: checked }
                        }))}
                      />
                    </div>

              <div className="flex items-center justify-between">
                      <div>
                  <h4 className="font-medium text-white">📢 Now-Playing Nachrichten</h4>
                  <p className="text-sm text-gray-400">Zeigt aktuelle Songs in einem Text-Channel an</p>
                      </div>
                      <Switch
                  checked={settings.radio.showNowPlaying}
                        onCheckedChange={(checked) => setSettings(prev => ({ 
                          ...prev, 
                    radio: { ...prev.radio, showNowPlaying: checked },
                    localMusic: { ...prev.localMusic, showNowPlaying: checked }
                        }))}
                      />
                    </div>
            </CardContent>
          </Card>

          {/* Channel Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-green-400" />
                Channel Einstellungen
              </CardTitle>
              <CardDescription>
                Konfiguriere Voice-Channel für Musik und Text-Channels für Ankündigungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">🔊 Voice-Channel für Musik</label>
                <Select
                  value={settings.voiceChannel.preferredChannelId}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    voiceChannel: { ...prev.voiceChannel, preferredChannelId: value }
                  }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                >
                  <option value="">Channel auswählen...</option>
                  {channels.voice.map(channel => (
                    <option key={channel.id} value={channel.id}>
                      🔊 {channel.name} {channel.members > 0 ? `(${channel.members} Mitglieder)` : ''}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Bevorzugter Voice-Channel für automatische Bot-Verbindung bei Musik-Wiedergabe
                </p>
                
                <div className="flex items-center justify-between mt-3 p-2 bg-dark-surface/50 rounded-lg border border-purple-primary/20">
                  <div>
                    <h4 className="text-sm font-medium text-white">🔄 Auto-Join aktivieren</h4>
                    <p className="text-xs text-gray-400">Bot verbindet sich automatisch beim Musik-Start</p>
                  </div>
                  <Switch
                    checked={settings.voiceChannel.autoJoin}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      voiceChannel: { ...prev.voiceChannel, autoJoin: checked }
                    }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">📢 Ankündigungs-Channel</label>
                <Select
                  value={settings.announcements.channelId}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    announcements: { ...prev.announcements, channelId: value }
                  }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                >
                  <option value="">Channel auswählen...</option>
                  {channels.text.map(channel => (
                    <option key={channel.id} value={channel.id}>
                      # {channel.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Channel für Now-Playing Nachrichten und Musik-Updates
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">🎛️ Interactive Panel Channel</label>
                <Select
                  value={settings.interactivePanel.channelId}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    interactivePanel: { ...prev.interactivePanel, channelId: value }
                  }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                >
                  <option value="">Channel auswählen...</option>
                  {channels.text.map(channel => (
                    <option key={channel.id} value={channel.id}>
                      # {channel.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Channel für das interaktive Musik-Control Panel
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Panel Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Interactive Panel
              </CardTitle>
              <CardDescription>
                Konfiguriere das interaktive Discord-Panel für Musik-Controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                        <div>
                  <h4 className="font-medium text-white">🎛️ Interactive Panel aktivieren</h4>
                  <p className="text-sm text-gray-400">Erstellt ein interaktives Panel mit Buttons in Discord</p>
                        </div>
                        <Switch
                          checked={settings.interactivePanel.enabled}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            interactivePanel: { ...prev.interactivePanel, enabled: checked }
                          }))}
                        />
                      </div>

              <div className="flex items-center justify-between">
                          <div>
                  <h4 className="font-medium text-white">🔄 Auto-Update Panel</h4>
                  <p className="text-sm text-gray-400">Aktualisiert das Panel automatisch bei Änderungen</p>
                          </div>
                            <Switch
                              checked={settings.interactivePanel.autoUpdate}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                interactivePanel: { ...prev.interactivePanel, autoUpdate: checked }
                              }))}
                            />
                          </div>

              {settings.interactivePanel.messageId && (
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-300">
                    ✅ Interactive Panel aktiv
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Message ID: {settings.interactivePanel.messageId}
                  </p>
                </div>
              )}

              {/* Interactive Panel Actions */}
              <div className="space-y-3">
                <Button
                  onClick={postInteractivePanel}
                  disabled={!settings.interactivePanel.channelId || !guildId}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Users className="w-4 h-4" />
                  {settings.interactivePanel.messageId 
                    ? 'Interactive Panel aktualisieren' 
                    : 'Interactive Panel erstellen'
                  }
                </Button>
                
                {settings.interactivePanel.messageId && (
                  <Button
                    onClick={updateInteractivePanel}
                    disabled={!settings.interactivePanel.enabled || !guildId}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Settings className="w-4 h-4" />
                    Panel aktualisieren
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-pink-400" />
                Erscheinungsbild
              </CardTitle>
              <CardDescription>
                Passe die Farben und das Aussehen der Musik-Embeds an
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">🎨 Embed Farbe</label>
                <div className="flex gap-3 items-center">
                  {/* Color Picker */}
                  <div className="relative">
                    <input
                      type="color"
                      value={settings.radio.embedColor.startsWith('0x') ? `#${settings.radio.embedColor.slice(2)}` : settings.radio.embedColor.startsWith('#') ? settings.radio.embedColor : '#00FF7F'}
                      onChange={(e) => {
                        const hexColor = e.target.value;
                        const discordColor = `0x${hexColor.slice(1).toUpperCase()}`;
                        setSettings(prev => ({
                          ...prev,
                          radio: { ...prev.radio, embedColor: discordColor },
                          localMusic: { ...prev.localMusic, embedColor: discordColor },
                          interactivePanel: { ...prev.interactivePanel, embedColor: discordColor }
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
                      value={settings.radio.embedColor}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple font-mono"
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        radio: { ...prev.radio, embedColor: e.target.value },
                        localMusic: { ...prev.localMusic, embedColor: e.target.value },
                        interactivePanel: { ...prev.interactivePanel, embedColor: e.target.value }
                      }))}
                      placeholder="0x00FF7F"
                    />
                  </div>

                  {/* Color Preview */}
                  <div 
                    className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                    style={{
                      backgroundColor: settings.radio.embedColor.startsWith('0x') ? `#${settings.radio.embedColor.slice(2)}` : settings.radio.embedColor.startsWith('#') ? settings.radio.embedColor : '#00FF7F',
                      filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                    }}
                  >
                    🎵
                  </div>
                </div>
                
                {/* Preset Colors */}
                <div className="mt-3">
                  <p className="text-xs text-dark-muted mb-2">Beliebte Discord Farben:</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { name: 'Blau', color: '0x3498DB' },
                      { name: 'Grün', color: '0x2ECC71' },
                      { name: 'Rot', color: '0xE74C3C' },
                      { name: 'Lila', color: '0x9B59B6' },
                      { name: 'Orange', color: '0xE67E22' },
                      { name: 'Pink', color: '0xE91E63' },
                      { name: 'Cyan', color: '0x1ABC9C' },
                      { name: 'Gelb', color: '0xF1C40F' },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          radio: { ...prev.radio, embedColor: preset.color },
                          localMusic: { ...prev.localMusic, embedColor: preset.color },
                          interactivePanel: { ...prev.interactivePanel, embedColor: preset.color }
                        }))}
                        className="w-8 h-8 rounded-lg border border-purple-primary/30 hover:border-neon-purple transition-all duration-300 hover:scale-110 relative group"
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
            </CardContent>
          </Card>
        </div>
      ) : activeTab === 'radio' ? (
        /* Radio Tab Content */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radio Stations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-400" />
                Radio Streams
              </CardTitle>
              <CardDescription>
                {radioStations.length} Radio-Stationen verfügbar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {radioStations.map((station) => (
                  <div
                    key={station.id}
                    className="flex items-center gap-3 p-3 bg-dark-bg/50 rounded-lg border border-gray-600/30 hover:border-blue-primary/50 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      {station.logo ? (
                        <img src={station.logo} alt={station.name} className="w-full h-full object-cover" />
                      ) : (
                        <Radio className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{station.name}</p>
                      <p className="text-xs text-blue-400 truncate">{station.genre}</p>
                      <p className="text-xs text-gray-400 truncate">{station.description}</p>
                      </div>
                    <div className="flex items-center gap-2">
                            <Button
                        onClick={() => playRadioStation(station.id)}
                        disabled={radioStatus.currentStation?.id === station.id}
                        className="px-3 py-1 text-xs"
                      >
                        {radioStatus.currentStation?.id === station.id ? (
                          <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                            </Button>
                  </div>
                </div>
                ))}
                  </div>
              
              {radioStations.length === 0 && (
                <div className="text-center py-8">
                  <Radio className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">Keine Radio-Stationen verfügbar</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Radio Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Waves className="w-5 h-5 text-green-400" />
                Radio Status
                </CardTitle>
              </CardHeader>
              <CardContent>
              {radioStatus.isPlaying ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                      <p className="font-semibold text-blue-300">📻 Läuft gerade</p>
                      <p className="text-sm text-white">{radioStatus.currentStation?.name}</p>
                      <p className="text-xs text-gray-400">{radioStatus.currentStation?.description}</p>
                          </div>
                        </div>
                      
                          <Button
                    onClick={stopRadio}
                              variant="destructive"
                    className="w-full flex items-center gap-2"
                            >
                    <StopCircle className="w-4 h-4" />
                    Radio stoppen
                            </Button>
                        </div>
              ) : (
                <div className="text-center py-8">
                  <Radio className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 mb-4">Kein Radio aktiv</p>
                  <p className="text-xs text-gray-500">Wähle eine Station zum Abspielen</p>
                      </div>
              )}
              </CardContent>
            </Card>
                    </div>
      ) : (
        /* Local Music Tab Content */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Songs Library */}
        <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-400" />
              MP3 Bibliothek
                </CardTitle>
                <CardDescription>
              {availableSongs.length} Songs verfügbar
                </CardDescription>
              </CardHeader>
              <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableSongs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-2 p-2 bg-dark-bg/50 rounded-lg border border-gray-600/30 hover:border-purple-primary/50 transition-all duration-300"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{song.title}</p>
                    <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                        </div>
                  <div className="flex items-center gap-1">
                          <Button
                      onClick={() => playSong(song.id)}
                      disabled={musicStatus.currentSong?.id === song.id}
                      className="px-2 py-1 text-xs"
                    >
                      {musicStatus.currentSong?.id === song.id ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                                <Play className="w-3 h-3" />
                            )}
                          </Button>
                    {isCreatingStation && (
                            <Button
                        onClick={() => addSongToPlaylist(song)}
                        variant="outline"
                              className="px-2 py-1 text-xs"
                            >
                        <Plus className="w-3 h-3" />
                            </Button>
                )}
              </div>
                    </div>
                  ))}
                </div>
            
            {availableSongs.length === 0 && (
              <div className="text-center py-8">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">Keine MP3-Dateien gefunden</p>
                <p className="text-xs text-gray-500 mt-1">
                  Lade MP3-Dateien in den /music Ordner hoch
                </p>
              </div>
            )}
            </CardContent>
          </Card>

        {/* Stations */}
        <Card className="lg:col-span-2">
            <CardHeader>
            <div className="flex items-center justify-between">
              <div>
              <CardTitle className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-purple-400" />
                  Meine Stationen
              </CardTitle>
              <CardDescription>
                  {settings.localMusic.stations.length} Stationen erstellt
              </CardDescription>
                  </div>
              <Button
                onClick={() => setIsCreatingStation(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Neue Station
              </Button>
                  </div>
            </CardHeader>
            <CardContent>
            {/* Station Creation Modal */}
            {isCreatingStation && (
              <div className="mb-6 p-4 bg-purple-500/10 rounded-lg border border-purple-primary/30">
                <h4 className="text-lg font-semibold text-white mb-4">✨ Neue Station erstellen</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      🎵 Station Name *
                  </label>
                  <Input
                      placeholder="z.B. Meine Chill Playlist"
                    value={newStation.name}
                    onChange={(e) => setNewStation(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      🎭 Genre
                  </label>
                    <Select
                    value={newStation.genre}
                      onChange={(value) => setNewStation(prev => ({ ...prev, genre: value }))}
                    >
                      {musicGenres.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                      📝 Beschreibung
                  </label>
                  <Input
                    placeholder="Beschreibung der Station..."
                    value={newStation.description}
                    onChange={(e) => setNewStation(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                {/* Playlist Builder mit Drag & Drop */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    🎶 Playlist ({newStation.playlist.length} Songs)
                  </label>
                  
                  {newStation.playlist.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto bg-dark-bg/30 rounded-lg p-3">
                      {newStation.playlist.map((song, index) => (
                        <DragDropSong
                          key={`${song.id}-${index}`}
                          song={song}
                          index={index}
                          onRemove={removeSongFromPlaylist}
                          isDragging={draggedIndex === index}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 border-2 border-dashed border-gray-600 rounded-lg">
                      <p className="text-gray-400">Keine Songs in der Playlist</p>
                      <p className="text-xs text-gray-500">Klicke auf + neben einem Song</p>
                      </div>
                    )}
              </div>
              
                <div className="flex gap-2">
                  <Button onClick={createStation} disabled={!newStation.name.trim()}>
                    ✨ Station Erstellen
                  </Button>
                    <Button
                      variant="outline"
                    onClick={() => {
                      setIsCreatingStation(false);
                      setNewStation({ name: '', genre: 'Hip-Hop', description: '', playlist: [] });
                    }}
                    >
                    Abbrechen
                    </Button>
              </div>
              </div>
            )}

            {/* Stations List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.localMusic.stations.map((station) => (
                <div
                  key={station.id}
                  className="p-4 bg-dark-bg/50 rounded-lg border border-gray-600/30 hover:border-purple-primary/50 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-white flex items-center gap-2">
                        {station.name}
                        <Badge variant="outline" className="text-xs">
                          {station.genre}
                        </Badge>
                      </h4>
                      <p className="text-sm text-gray-400">{station.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {station.playlist.length} Songs
                      </p>
                        </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => playStation(station.id)}
                        disabled={musicStatus.currentStation?.id === station.id}
                        className="px-2 py-1 text-xs"
                      >
                        {musicStatus.currentStation?.id === station.id ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        onClick={() => deleteStation(station.id)}
                        variant="destructive"
                        className="px-2 py-1 text-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                        </div>
                      </div>
                  ))}
                </div>

            {settings.localMusic.stations.length === 0 && !isCreatingStation && (
              <div className="text-center py-8">
                <Radio className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">Keine Stationen erstellt</p>
                <p className="text-xs text-gray-500 mt-1">
                  Erstelle deine erste Station mit eigenen Playlists
                </p>
                        </div>
                      )}
            </CardContent>
          </Card>
                </div>
      )}

      {/* Music Controls */}
      {musicStatus.isPlaying && (
        <Card className="fixed bottom-6 right-6 max-w-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {musicStatus.currentSong?.title || 'Unbekannt'}
                </p>
                <p className="text-xs text-gray-400">
                  {musicStatus.currentStation?.name || 'Einzelner Song'}
                </p>
              </div>
                <Button
                onClick={stopMusic}
                  variant="destructive"
                className="px-3 py-2"
                >
                <Pause className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
      )}

      {/* Toast Container */}
      <ToastContainer 
        toasts={toasts} 
        removeToast={removeToast} 
      />
    </div>
  );
};

export default Music; 
