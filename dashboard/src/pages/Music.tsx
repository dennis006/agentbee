import { useState, useEffect } from 'react';
import { Music, Play, Pause, Upload, Trash2, Settings, Save, Radio, Mic, Users, Plus } from 'lucide-react';
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
  className?: string;
  id?: string;
}> = ({ type = 'text', placeholder, value, onChange, className = '', ...props }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`bg-dark-bg/70 border border-purple-primary/30 text-dark-text focus:border-neon-purple rounded-lg px-3 py-2 w-full transition-all duration-300 focus:scale-105 hover:shadow-neon ${className}`}
    {...props}
  />
);

// Erweiterte Interfaces für kombiniertes System
interface MusicFile {
  id: string;
  name: string;
  filename: string;
  path: string;
  size: number;
  duration: number | null;
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
  localMusic: {
    enabled: boolean;
    musicFolder: string;
    allowedFormats: string[];
    defaultVolume: number;
    shuffle: boolean;
    loop: boolean;
  };
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
}

interface CurrentSong {
  id: string;
  name: string;
  filename?: string;
  startTime: number;
  isLocal: boolean;
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

const MusicSystem: React.FC = () => {
  const [settings, setSettings] = useState<MusicSettings>({
    enabled: true,
    localMusic: {
      enabled: true,
      musicFolder: './music',
      allowedFormats: ['.mp3', '.wav', '.ogg'],
      defaultVolume: 50,
      shuffle: false,
      loop: false
    },
    radio: {
      enabled: true,
      stations: [],
      defaultStation: '',
      autoStop: false,
      showNowPlaying: true,
      embedColor: '#FF6B6B'
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

  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const [radioStations, setRadioStations] = useState<RadioStation[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentSong, setCurrentSong] = useState<CurrentSong | null>(null);
  const [radioStatus, setRadioStatus] = useState<RadioStatus>({ isPlaying: false, currentStation: null });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('radio');
  const [newStationData, setNewStationData] = useState({
    name: '',
    url: '',
    genre: '',
    country: 'Deutschland',
    description: ''
  });

  const { addToast, toasts, removeToast } = useToast();

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    addToast({ title: type === 'error' ? 'Fehler' : type === 'success' ? 'Erfolg' : 'Info', message, type });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Einstellungen laden
      const settingsResponse = await fetch('/api/music/settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData.success) {
          setSettings(settingsData.settings);
          if (settingsData.settings.radio?.stations) {
            setRadioStations(settingsData.settings.radio.stations);
          }
        }
      }

      // MP3-Dateien laden
      try {
        const filesResponse = await fetch('/api/music/files');
        if (filesResponse.ok) {
          const filesData = await filesResponse.json();
          if (filesData.success) {
            setMusicFiles(filesData.files);
          }
        }
      } catch (error) {
        console.log('MP3-API nicht verfügbar');
      }

      // Radio-Sender laden
      const radioResponse = await fetch('/api/music/radio/stations');
      if (radioResponse.ok) {
        const radioData = await radioResponse.json();
        if (radioData.success) {
          setRadioStations(radioData.stations);
        }
      }

      // Voice-Channels laden
      const channelsResponse = await fetch('/api/discord/voice-channels');
      if (channelsResponse.ok) {
        const channelsData = await channelsResponse.json();
        if (channelsData.success) {
          setChannels(channelsData.channels);
        }
      }

      // Radio-Status laden
      await loadRadioStatus();
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      showToast('Fehler beim Laden der Daten', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRadioStatus = async () => {
    try {
      const radioStatusResponse = await fetch('/api/music/radio/1382473264839917785/status');
      if (radioStatusResponse.ok) {
        const radioStatusData = await radioStatusResponse.json();
        if (radioStatusData.success) {
          setRadioStatus({
            isPlaying: radioStatusData.isPlaying,
            currentStation: radioStatusData.currentStation
          });
        }
      }
    } catch (error) {
      console.log('Radio Status nicht verfügbar');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/music/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      if (data.success) {
        showToast('Einstellungen erfolgreich gespeichert!', 'success');
      } else {
        showToast('Fehler beim Speichern der Einstellungen', 'error');
      }
    } catch (error) {
      showToast('Netzwerkfehler beim Speichern', 'error');
    }
  };

  const joinVoiceChannel = async (channelId: string) => {
    try {
      const response = await fetch('/api/music/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: '1382473264839917785',
          channelId
        })
      });

      const data = await response.json();
      if (data.success) {
        showToast(data.message, 'success');
        await loadRadioStatus();
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Verbindungsfehler', 'error');
    }
  };

  const leaveVoiceChannel = async () => {
    try {
      const response = await fetch('/api/music/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: '1382473264839917785'
        })
      });

      const data = await response.json();
      if (data.success) {
        showToast(data.message, 'success');
        setRadioStatus({ isPlaying: false, currentStation: null });
        setCurrentSong(null);
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Verbindungsfehler', 'error');
    }
  };

  const playRadioStation = async (stationId: string) => {
    try {
      const response = await fetch(`/api/music/radio/1382473264839917785/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId })
      });

      const data = await response.json();
      if (data.success) {
        showToast(data.message, 'success');
        await loadRadioStatus();
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Fehler beim Abspielen', 'error');
    }
  };

  const playMP3 = async (songId: string) => {
    try {
      const response = await fetch('/api/music/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: '1382473264839917785',
          songId
        })
      });

      const data = await response.json();
      if (data.success) {
        showToast(data.message, 'success');
        setRadioStatus({ isPlaying: false, currentStation: null });
        await loadData();
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Fehler beim Abspielen der MP3', 'error');
    }
  };

  const stopRadio = async () => {
    try {
      const response = await fetch('/api/music/radio/1382473264839917785/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        showToast(data.message, 'success');
        setRadioStatus({ isPlaying: false, currentStation: null });
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Fehler beim Stoppen', 'error');
    }
  };

  const postInteractivePanel = async () => {
    if (!settings.interactivePanel.channelId) {
      showToast('Bitte wähle zuerst einen Channel für das interaktive Panel', 'error');
      return;
    }

    try {
      const response = await fetch('/api/music/panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: '1382473264839917785',
          channelId: settings.interactivePanel.channelId
        })
      });

      const data = await response.json();
      if (data.success) {
        setSettings(prev => ({
          ...prev,
          interactivePanel: {
            ...prev.interactivePanel,
            messageId: data.messageId
          }
        }));
        showToast('Interaktives Panel wurde erfolgreich gepostet!', 'success');
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Fehler beim Posten des Panels', 'error');
    }
  };

  const removeRadioStation = async (stationId: string) => {
    try {
      const updatedStations = radioStations.filter(station => station.id !== stationId);
      const newSettings = {
        ...settings,
        radio: {
          ...settings.radio,
          stations: updatedStations
        }
      };

      const response = await fetch('/api/music/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        setSettings(newSettings);
        setRadioStations(updatedStations);
        showToast('Radio-Sender entfernt', 'success');
      } else {
        showToast('Fehler beim Entfernen', 'error');
      }
    } catch (error) {
      showToast('Fehler beim Entfernen', 'error');
    }
  };

  const addCustomRadioStation = async () => {
    if (!newStationData.name || !newStationData.url) {
      showToast('Bitte Name und URL eingeben', 'error');
      return;
    }

    try {
      const newStation: RadioStation = {
        id: Date.now().toString(),
        name: newStationData.name,
        url: newStationData.url,
        genre: newStationData.genre || 'Unbekannt',
        country: newStationData.country,
        description: newStationData.description || `${newStationData.name} Radio-Stream`,
        logo: '📻'
      };

      const updatedStations = [...radioStations, newStation];
      const newSettings = {
        ...settings,
        radio: {
          ...settings.radio,
          stations: updatedStations
        }
      };

      const response = await fetch('/api/music/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        setSettings(newSettings);
        setRadioStations(updatedStations);
        setNewStationData({ name: '', url: '', genre: '', country: 'Deutschland', description: '' });
        showToast('Radio-Sender hinzugefügt!', 'success');
      } else {
        showToast('Fehler beim Hinzufügen', 'error');
      }
    } catch (error) {
      showToast('Fehler beim Hinzufügen', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg to-purple-primary/10 relative overflow-hidden">
        <MatrixBlocks density={15} />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-primary mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-dark-text">Lade Musik-System...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg to-purple-primary/10 relative overflow-hidden">
      <MatrixBlocks />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-purple-primary mb-2 animate-pulse-slow">
            🎵 Musik-System
          </h1>
          <p className="text-dark-muted text-lg">
            Radio-Sender & MP3-Dateien für Voice-Channels
          </p>
        </div>

        <Tabs defaultValue="radio" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger 
              value="radio" 
              onClick={() => setActiveTab('radio')}
              className={activeTab === 'radio' ? 'bg-purple-primary text-white' : ''}
            >
              <Radio className="w-4 h-4 mr-2" />
              Radio-Sender
            </TabsTrigger>
            <TabsTrigger 
              value="mp3" 
              onClick={() => setActiveTab('mp3')}
              className={activeTab === 'mp3' ? 'bg-purple-primary text-white' : ''}
            >
              <Music className="w-4 h-4 mr-2" />
              MP3-Dateien
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

          <TabsContent value="radio" activeTab={activeTab}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Voice-Channel Kontrolle */}
              <Card>
                <CardHeader>
                  <CardTitle animated>
                    <Mic className="w-5 h-5 inline mr-2" />
                    Voice-Channel Kontrolle
                  </CardTitle>
                  <CardDescription>
                    Tritt einem Voice-Channel bei um Musik zu spielen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {channels.map(channel => (
                      <Button
                        key={channel.id}
                        onClick={() => joinVoiceChannel(channel.id)}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        {channel.name}
                      </Button>
                    ))}
                    <Button
                      onClick={leaveVoiceChannel}
                      variant="destructive"
                      className="w-full"
                    >
                      Voice-Channel verlassen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Aktuell spielt */}
              <Card>
                <CardHeader>
                  <CardTitle animated>
                    <Play className="w-5 h-5 inline mr-2" />
                    Aktuell spielt
                  </CardTitle>
                  <CardDescription>
                    Status der aktuellen Wiedergabe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {radioStatus.isPlaying && radioStatus.currentStation ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400 font-medium">Live</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{radioStatus.currentStation.name}</h3>
                        <p className="text-dark-muted">{radioStatus.currentStation.description}</p>
                        <Badge variant="outline" className="mt-2">
                          {radioStatus.currentStation.genre}
                        </Badge>
                      </div>
                      <Button onClick={stopRadio} variant="destructive" className="w-full">
                        <Pause className="w-4 h-4 mr-2" />
                        Stoppen
                      </Button>
                    </div>
                  ) : currentSong ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-blue-400 font-medium">MP3</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{currentSong.name}</h3>
                        <p className="text-dark-muted">{currentSong.filename}</p>
                      </div>
                      <Button onClick={stopRadio} variant="destructive" className="w-full">
                        <Pause className="w-4 h-4 mr-2" />
                        Stoppen
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-dark-muted">
                      <Radio className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Keine Musik wird abgespielt</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Radio-Sender Liste */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle animated>
                  <Radio className="w-5 h-5 inline mr-2" />
                  Radio-Sender
                </CardTitle>
                <CardDescription>
                  Verfügbare Radio-Streams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {radioStations.map(station => (
                    <Card key={station.id} animate={false} className="hover:scale-105 transition-transform">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold">{station.name}</h4>
                                                         <Button
                               variant="ghost"
                               onClick={() => removeRadioStation(station.id)}
                             >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-dark-muted">{station.description}</p>
                          <div className="flex gap-2">
                            <Badge variant="outline">{station.genre}</Badge>
                            <Badge variant="outline">{station.country}</Badge>
                          </div>
                          <Button 
                            onClick={() => playRadioStation(station.id)}
                            className="w-full"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Abspielen
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Neuen Sender hinzufügen */}
                <Card className="mt-6" animate={false}>
                  <CardHeader>
                    <CardTitle animated={false}>
                      <Plus className="w-5 h-5 inline mr-2" />
                      Radio-Sender hinzufügen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Sender-Name"
                        value={newStationData.name}
                        onChange={(e) => setNewStationData({...newStationData, name: e.target.value})}
                      />
                      <Input
                        placeholder="Stream-URL"
                        value={newStationData.url}
                        onChange={(e) => setNewStationData({...newStationData, url: e.target.value})}
                      />
                      <Input
                        placeholder="Genre"
                        value={newStationData.genre}
                        onChange={(e) => setNewStationData({...newStationData, genre: e.target.value})}
                      />
                      <Input
                        placeholder="Land"
                        value={newStationData.country}
                        onChange={(e) => setNewStationData({...newStationData, country: e.target.value})}
                      />
                      <div className="md:col-span-2">
                        <Input
                          placeholder="Beschreibung"
                          value={newStationData.description}
                          onChange={(e) => setNewStationData({...newStationData, description: e.target.value})}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button onClick={addCustomRadioStation}>
                          <Plus className="w-4 h-4 mr-2" />
                          Sender hinzufügen
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mp3" activeTab={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle animated>
                  <Music className="w-5 h-5 inline mr-2" />
                  MP3-Bibliothek
                </CardTitle>
                <CardDescription>
                  Deine lokalen MP3-Dateien
                </CardDescription>
              </CardHeader>
              <CardContent>
                {musicFiles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {musicFiles.map(file => (
                      <Card key={file.id} animate={false} className="hover:scale-105 transition-transform">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <h4 className="font-bold">{file.name}</h4>
                            <p className="text-sm text-dark-muted">Datei: {file.filename}</p>
                            <p className="text-sm text-dark-muted">
                              Größe: {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <Button 
                              onClick={() => playMP3(file.id)}
                              className="w-full"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Abspielen
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Music className="w-16 h-16 mx-auto mb-4 text-dark-muted opacity-50" />
                    <h3 className="text-xl font-bold mb-2">Keine MP3-Dateien gefunden</h3>
                    <p className="text-dark-muted mb-4">
                      Lade MP3-Dateien in den ./music Ordner hoch und pushe zu Git
                    </p>
                    <div className="bg-dark-surface/50 rounded-lg p-4 text-left max-w-md mx-auto">
                      <h4 className="font-bold mb-2">📁 Upload-Anleitung:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>MP3-Dateien in ./music/ Ordner kopieren</li>
                        <li>Format: Artist_-_Song_Title.mp3</li>
                        <li>git add . && git commit && git push</li>
                        <li>Railway deployed automatisch</li>
                      </ol>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" activeTab={activeTab}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle animated>
                    <Settings className="w-5 h-5 inline mr-2" />
                    Allgemeine Einstellungen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Musik-System aktiviert</label>
                      <Switch 
                        checked={settings.enabled}
                        onCheckedChange={(checked) => setSettings({...settings, enabled: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Radio-Sender aktiviert</label>
                      <Switch 
                        checked={settings.radio.enabled}
                        onCheckedChange={(checked) => setSettings({
                          ...settings, 
                          radio: {...settings.radio, enabled: checked}
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">MP3-Dateien aktiviert</label>
                      <Switch 
                        checked={settings.localMusic.enabled}
                        onCheckedChange={(checked) => setSettings({
                          ...settings, 
                          localMusic: {...settings.localMusic, enabled: checked}
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Now-Playing Nachrichten</label>
                      <Switch 
                        checked={settings.radio.showNowPlaying}
                        onCheckedChange={(checked) => setSettings({
                          ...settings, 
                          radio: {...settings.radio, showNowPlaying: checked}
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle animated>
                    <Mic className="w-5 h-5 inline mr-2" />
                    Channel-Einstellungen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Ankündigungs-Channel</label>
                      <select
                        value={settings.announcements.channelId}
                        onChange={(e) => setSettings({
                          ...settings,
                          announcements: {...settings.announcements, channelId: e.target.value}
                        })}
                        className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text rounded-lg px-3 py-2"
                      >
                        <option value="">-- Deaktiviert --</option>
                        {channels.map(channel => (
                          <option key={channel.id} value={channel.id}>
                            {channel.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Interaktives Panel Channel</label>
                      <select
                        value={settings.interactivePanel.channelId}
                        onChange={(e) => setSettings({
                          ...settings,
                          interactivePanel: {...settings.interactivePanel, channelId: e.target.value}
                        })}
                        className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text rounded-lg px-3 py-2"
                      >
                        <option value="">-- Wähle Channel --</option>
                        {channels.map(channel => (
                          <option key={channel.id} value={channel.id}>
                            {channel.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button onClick={postInteractivePanel} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Interaktives Panel posten
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 text-center">
              <Button onClick={saveSettings} variant="default" className="px-8">
                <Save className="w-4 h-4 mr-2" />
                Einstellungen speichern
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MusicSystem;