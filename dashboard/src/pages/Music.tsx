import { useState, useEffect } from 'react';
import { Play, Pause, Settings, Save, Mic, Users, Plus, Trash2, Edit, GripVertical, Upload, Music as MusicIcon, Waves, StopCircle } from 'lucide-react';
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

// Card components
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

// Button component
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

// Interfaces für MP3-System
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

interface MusicSettings {
  enabled: boolean;
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

// Haupt-Komponente
const Music: React.FC = () => {
  const [activeTab, setActiveTab] = useState('mp3');
  const [settings, setSettings] = useState<MusicSettings>({
    enabled: true,
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
  const [musicStatus, setMusicStatus] = useState<MusicStatus>({
    isPlaying: false,
    currentSong: null,
    currentStation: null
  });
  const [guildId, setGuildId] = useState<string | null>(null);
  const [guildChannels, setGuildChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(50);
  const [selectedGuild, setSelectedGuild] = useState<string>('');
  const [newStationName, setNewStationName] = useState('');
  const [newStationGenre, setNewStationGenre] = useState('Hip-Hop');
  const [newStationDescription, setNewStationDescription] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingStation, setEditingStation] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { addToast, toasts, removeToast } = useToast();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Daten laden
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSettings(),
        loadAvailableSongs(),
        loadMusicStatus()
      ]);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      addToast({ title: 'Fehler', message: 'Fehler beim Laden der Daten', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/music/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
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

  const loadMusicStatus = async () => {
    if (!guildId) return;
    try {
      const response = await fetch(`${apiUrl}/api/music/local/${guildId}/status`);
      if (response.ok) {
        const data = await response.json();
        setMusicStatus({
          isPlaying: data.isPlaying,
          currentSong: data.currentSong,
          currentStation: data.currentStation
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden des Musik-Status:', error);
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
        addToast({ title: 'Erfolg', message: 'Einstellungen gespeichert', type: 'success' });
      } else {
        addToast({ title: 'Fehler', message: 'Fehler beim Speichern', type: 'error' });
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      addToast({ title: 'Fehler', message: 'Fehler beim Speichern', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const playSong = async (songId: string) => {
    if (!guildId) return;
    try {
      const response = await fetch(`${apiUrl}/api/music/local/${guildId}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId })
      });

      if (response.ok) {
        addToast({ title: 'Musik', message: 'Song wird abgespielt', type: 'success' });
        loadMusicStatus();
      } else {
        addToast({ title: 'Fehler', message: 'Fehler beim Abspielen', type: 'error' });
      }
    } catch (error) {
      console.error('Fehler beim Abspielen:', error);
      addToast({ title: 'Fehler', message: 'Fehler beim Abspielen', type: 'error' });
    }
  };

  const stopMusic = async () => {
    if (!guildId) return;
    try {
      const response = await fetch(`${apiUrl}/api/music/local/${guildId}/stop`, {
        method: 'POST'
      });

      if (response.ok) {
        addToast({ title: 'Musik', message: 'Musik gestoppt', type: 'success' });
        loadMusicStatus();
      } else {
        addToast({ title: 'Fehler', message: 'Fehler beim Stoppen', type: 'error' });
      }
    } catch (error) {
      console.error('Fehler beim Stoppen:', error);
      addToast({ title: 'Fehler', message: 'Fehler beim Stoppen', type: 'error' });
    }
  };

  const setVolume = async (newVolume: number) => {
    if (!guildId) return;
    try {
      const response = await fetch(`${apiUrl}/api/music/volume/${guildId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: newVolume })
      });

      if (response.ok) {
        setVolumeState(newVolume);
        addToast({ title: 'Lautstärke', message: `Lautstärke: ${newVolume}%`, type: 'success' });
      }
    } catch (error) {
      console.error('Fehler beim Setzen der Lautstärke:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg relative overflow-hidden">
        <MatrixBlocks />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-primary mx-auto mb-4"></div>
            <p className="text-dark-text">Lade Musik-System...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg relative overflow-hidden">
      <MatrixBlocks />
      
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-dark-text mb-2 animate-glow">
              🎵 Musik-System
            </h1>
            <p className="text-dark-muted">Lokale MP3-Bibliothek und Playlists</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="mp3" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger 
                value="mp3" 
                onClick={() => setActiveTab('mp3')}
                className={activeTab === 'mp3' ? 'bg-purple-primary text-white' : ''}
              >
                <MusicIcon className="w-4 h-4 mr-2" />
                MP3 Bibliothek
              </TabsTrigger>
              <TabsTrigger 
                value="playlists" 
                onClick={() => setActiveTab('playlists')}
                className={activeTab === 'playlists' ? 'bg-purple-primary text-white' : ''}
              >
                <Waves className="w-4 h-4 mr-2" />
                Playlists
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                onClick={() => setActiveTab('settings')}
                className={activeTab === 'settings' ? 'bg-purple-primary text-white' : ''}
              >
                <Settings className="w-4 h-4 mr-2" />
                Einstellungen
              </TabsTrigger>
            </TabsList>

            {/* MP3 Bibliothek Tab */}
            <TabsContent value="mp3" activeTab={activeTab}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Verfügbare Songs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MusicIcon className="w-5 h-5" />
                      Verfügbare MP3s ({availableSongs.length})
                    </CardTitle>
                    <CardDescription>
                      Alle MP3-Dateien aus dem Musik-Ordner
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {availableSongs.map((song) => (
                        <div key={song.id} className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{song.title}</p>
                            <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {Math.round(song.size / 1024 / 1024)}MB
                            </span>
                            <Button
                              onClick={() => playSong(song.id)}
                              variant="outline"
                              className="p-2"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {availableSongs.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <MusicIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Keine MP3-Dateien gefunden</p>
                          <p className="text-xs mt-1">Lege MP3-Dateien in den ./music/ Ordner</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Aktuelle Wiedergabe */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Waves className="w-5 h-5" />
                      Aktuelle Wiedergabe
                    </CardTitle>
                    <CardDescription>
                      Status und Kontrolle
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {musicStatus.currentSong ? (
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                          <div className="text-lg font-bold text-white mb-1">
                            {musicStatus.currentSong.title}
                          </div>
                          <div className="text-sm text-gray-300">
                            {musicStatus.currentSong.artist}
                          </div>
                        </div>
                        
                        <div className="flex justify-center gap-2">
                          <Button
                            onClick={stopMusic}
                            variant="destructive"
                            className="flex items-center gap-2"
                          >
                            <StopCircle className="w-4 h-4" />
                            Stop
                          </Button>
                        </div>

                        {/* Volume Control */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Lautstärke</span>
                            <span className="text-sm font-medium text-white">{volume}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => setVolume(parseInt(e.target.value))}
                            className="w-full h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Pause className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Keine Musik läuft</p>
                        <p className="text-xs mt-1">Wähle einen Song zum Abspielen</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Playlists Tab */}
            <TabsContent value="playlists" activeTab={activeTab}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Waves className="w-5 h-5" />
                    Playlists
                  </CardTitle>
                  <CardDescription>
                    Erstelle und verwalte deine Musik-Playlists
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-400">
                    <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Playlist-Funktionen kommen bald</p>
                    <p className="text-xs mt-1">Erstelle benutzerdefinierte Playlists</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Einstellungen Tab */}
            <TabsContent value="settings" activeTab={activeTab}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Allgemeine Einstellungen</CardTitle>
                    <CardDescription>
                      Grundkonfiguration des Musik-Systems
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-dark-text">Musik-System aktiviert</label>
                        <p className="text-xs text-dark-muted">Aktiviere/deaktiviere das gesamte Musik-System</p>
                      </div>
                      <Switch
                        checked={settings.enabled}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-dark-text">Auto-Join Voice</label>
                        <p className="text-xs text-dark-muted">Bot tritt automatisch Voice-Channels bei</p>
                      </div>
                      <Switch
                        checked={settings.voiceChannel.autoJoin}
                        onCheckedChange={(checked) => setSettings(prev => ({ 
                          ...prev, 
                          voiceChannel: { ...prev.voiceChannel, autoJoin: checked }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-dark-text">Now-Playing anzeigen</label>
                        <p className="text-xs text-dark-muted">Zeige aktuelle Songs in Chat an</p>
                      </div>
                      <Switch
                        checked={settings.localMusic.showNowPlaying}
                        onCheckedChange={(checked) => setSettings(prev => ({ 
                          ...prev, 
                          localMusic: { ...prev.localMusic, showNowPlaying: checked }
                        }))}
                      />
                    </div>

                    <div className="pt-4">
                      <Button onClick={saveSettings} disabled={saving} className="w-full">
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Speichere...' : 'Einstellungen speichern'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Musik-Ordner</CardTitle>
                    <CardDescription>
                      Konfiguration des MP3-Ordners
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Musik-Verzeichnis</label>
                      <Input
                        value={settings.localMusic.musicDirectory}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          localMusic: { ...prev.localMusic, musicDirectory: e.target.value }
                        }))}
                        placeholder="./music"
                      />
                      <p className="text-xs text-dark-muted mt-1">Pfad zum Ordner mit MP3-Dateien</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">Embed-Farbe</label>
                      <Input
                        type="color"
                        value={settings.localMusic.embedColor}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          localMusic: { ...prev.localMusic, embedColor: e.target.value }
                        }))}
                        className="h-10"
                      />
                      <p className="text-xs text-dark-muted mt-1">Farbe für Discord-Embeds</p>
                    </div>

                    <div className="pt-4 text-center">
                      <div className="text-sm text-gray-400">
                        <MusicIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p><strong>{availableSongs.length}</strong> MP3-Dateien gefunden</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Music;
