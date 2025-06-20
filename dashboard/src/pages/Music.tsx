import { useState, useEffect } from 'react';
import { Music, Play, Pause, Upload, Trash2, Settings, Save, Radio } from 'lucide-react';
import { useToast, ToastContainer } from '../components/ui/toast';

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

const MusicCombined: React.FC = () => {
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [activeTab, setActiveTab] = useState('mp3');
  const [loading, setLoading] = useState(false);

  const { addToast, toasts, removeToast } = useToast();
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    addToast({ title: type === 'error' ? 'Fehler' : type === 'success' ? 'Erfolg' : 'Info', message, type });
  };

  // Daten laden
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

      // Musik-Dateien laden
      const filesResponse = await fetch('/api/music/files');
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        if (filesData.success) {
          setMusicFiles(filesData.files);
        }
      }

      // Radio-Sender laden (zusätzlicher API-Call falls verfügbar)
      try {
        const radioResponse = await fetch('/api/music/radio/stations');
        if (radioResponse.ok) {
          const radioData = await radioResponse.json();
          if (radioData.success) {
            setRadioStations(radioData.stations);
          }
        }
      } catch (error) {
        // Fallback zu Einstellungen wenn API nicht verfügbar
        console.log('Radio API nicht verfügbar, verwende Einstellungen');
      }

      // Channels laden
      const channelsResponse = await fetch('/api/discord/voice-channels');
      if (channelsResponse.ok) {
        const channelsData = await channelsResponse.json();
        if (channelsData.success) {
          setChannels(channelsData.channels);
        }
      }

      // Aktueller Song (lokale MP3)
      const currentResponse = await fetch('/api/music/current/1382473264839917785');
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        if (currentData.success) {
          setCurrentSong(currentData.currentSong);
          setIsPlaying(currentData.isPlaying);
        }
      }

      // Radio-Status
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
        console.log('Radio Status API nicht verfügbar');
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      showToast('Fehler beim Laden der Daten', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Einstellungen speichern
  const saveSettings = async () => {
    try {
      const response = await fetch('/api/music/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      if (data.success) {
        showToast('Einstellungen gespeichert', 'success');
      } else {
        showToast('Fehler beim Speichern', 'error');
      }
    } catch (error) {
      showToast('Fehler beim Speichern', 'error');
    }
  };

  // Voice-Channel beitreten
  const joinVoiceChannel = async () => {
    if (!selectedChannel) {
      showToast('Bitte wähle einen Voice-Channel aus', 'error');
      return;
    }

    try {
      const response = await fetch('/api/music/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: '1382473264839917785',
          channelId: selectedChannel
        })
      });

      const data = await response.json();
      if (data.success) {
        setIsConnected(true);
        showToast(data.message, 'success');
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Fehler beim Beitreten', 'error');
    }
  };

  // Voice-Channel verlassen
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
        setIsConnected(false);
        setIsPlaying(false);
        setCurrentSong(null);
        setRadioStatus({ isPlaying: false, currentStation: null });
        showToast(data.message, 'success');
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Fehler beim Verlassen', 'error');
    }
  };

  // Lokale Musik abspielen
  const playMusic = async (songId: string) => {
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
        setIsPlaying(true);
        setRadioStatus({ isPlaying: false, currentStation: null }); // Radio stoppen
        await loadData(); // Aktuellen Song neu laden
        showToast(data.message, 'success');
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Fehler beim Abspielen', 'error');
    }
  };

  // Radio abspielen
  const playRadioStation = async (stationId: string) => {
    try {
      const response = await fetch(`/api/music/radio/1382473264839917785/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentSong(null); // Lokale Musik stoppen
        setIsPlaying(false);
        await loadData(); // Status neu laden
        showToast(data.message, 'success');
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Fehler beim Abspielen des Radio-Senders', 'error');
    }
  };

  // Musik/Radio stoppen
  const stopMusic = async () => {
    try {
      // Lokale Musik stoppen
      if (currentSong) {
        const response = await fetch('/api/music/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guildId: '1382473264839917785'
          })
        });

        const data = await response.json();
        if (data.success) {
          setIsPlaying(false);
          setCurrentSong(null);
          showToast(data.message, 'success');
        }
      }

      // Radio stoppen
      if (radioStatus.isPlaying) {
        const response = await fetch('/api/music/radio/1382473264839917785/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        if (data.success) {
          setRadioStatus({ isPlaying: false, currentStation: null });
          showToast(data.message, 'success');
        }
      }
    } catch (error) {
      showToast('Fehler beim Stoppen', 'error');
    }
  };

  // Datei-Upload (Frontend-Teil)
  const handleFileUpload = () => {
    showToast('Upload-Anleitung: Lade MP3-Dateien in den ./music Ordner hoch und pushe zu Git/Railway', 'info');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-dark-text text-xl">Lade Musik-System...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text p-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-primary mb-2 flex items-center gap-3">
          <Music className="w-8 h-8" />
          Musik-System (MP3 + Radio)
        </h1>
        <p className="text-dark-muted">
          Spiele lokale MP3-Dateien oder Radio-Sender in Voice-Channels ab
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-dark-surface/50 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setActiveTab('mp3')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'mp3' 
                ? 'bg-purple-primary text-white' 
                : 'text-dark-text hover:bg-purple-primary/20'
            }`}
          >
            🎵 Lokale MP3s
          </button>
          <button
            onClick={() => setActiveTab('radio')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'radio' 
                ? 'bg-purple-primary text-white' 
                : 'text-dark-text hover:bg-purple-primary/20'
            }`}
          >
            📻 Radio-Sender
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'settings' 
                ? 'bg-purple-primary text-white' 
                : 'text-dark-text hover:bg-purple-primary/20'
            }`}
          >
            ⚙️ Einstellungen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Voice-Channel Controls */}
        <div className="bg-dark-surface/90 backdrop-blur-xl border border-purple-primary/30 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🔊 Voice-Channel
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Voice-Channel auswählen:</label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full bg-dark-bg border border-purple-primary/30 rounded-lg px-3 py-2"
              >
                <option value="">-- Channel auswählen --</option>
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={joinVoiceChannel}
                disabled={isConnected}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                Beitreten
              </button>
              <button
                onClick={leaveVoiceChannel}
                disabled={!isConnected}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                Verlassen
              </button>
            </div>

            <div className="text-center">
              Status: <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? 'Verbunden' : 'Nicht verbunden'}
              </span>
            </div>
          </div>
        </div>

        {/* Aktuell spielt */}
        <div className="bg-dark-surface/90 backdrop-blur-xl border border-purple-primary/30 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🎵 Aktuell spielt
          </h2>
          
          {currentSong || radioStatus.currentStation ? (
            <div className="space-y-3">
              {currentSong && (
                <>
                  <div className="text-lg font-medium">🎵 {currentSong.name}</div>
                  <div className="text-sm text-dark-muted">MP3-Datei: {currentSong.filename}</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                    <span>{isPlaying ? 'Spielt ab' : 'Pausiert'}</span>
                  </div>
                </>
              )}
              
              {radioStatus.currentStation && (
                <>
                  <div className="text-lg font-medium">📻 {radioStatus.currentStation.name}</div>
                  <div className="text-sm text-dark-muted">{radioStatus.currentStation.description}</div>
                  <div className="text-sm text-dark-muted">Genre: {radioStatus.currentStation.genre}</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${radioStatus.isPlaying ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                    <span>{radioStatus.isPlaying ? 'Radio läuft' : 'Radio pausiert'}</span>
                  </div>
                </>
              )}
              
              <button
                onClick={stopMusic}
                className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Stoppen
              </button>
            </div>
          ) : (
            <div className="text-center text-dark-muted py-8">
              Keine Musik wird abgespielt
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'mp3' && (
        <div className="bg-dark-surface/90 backdrop-blur-xl border border-purple-primary/30 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              🎵 Lokale MP3-Bibliothek
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleFileUpload}
                className="bg-purple-primary hover:bg-purple-secondary px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload-Anleitung
              </button>
              <button
                onClick={loadData}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                Aktualisieren
              </button>
            </div>
          </div>

          {musicFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {musicFiles.map(file => (
                <div key={file.id} className="bg-dark-bg/50 border border-purple-primary/20 rounded-lg p-4">
                  <div className="font-medium mb-2">{file.name}</div>
                  <div className="text-sm text-dark-muted mb-2">
                    Datei: {file.filename}
                  </div>
                  <div className="text-sm text-dark-muted mb-3">
                    Größe: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <button
                    onClick={() => playMusic(file.id)}
                    disabled={!isConnected}
                    className="w-full bg-purple-primary hover:bg-purple-secondary disabled:bg-gray-600 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Abspielen
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-dark-muted py-8">
              <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <div>Keine MP3-Dateien gefunden</div>
              <div className="text-sm mt-2">
                Lade MP3-Dateien in den ./music Ordner hoch und pushe zu Git
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'radio' && (
        <div className="bg-dark-surface/90 backdrop-blur-xl border border-purple-primary/30 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              📻 Radio-Sender
            </h2>
            <button
              onClick={loadData}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Aktualisieren
            </button>
          </div>

          {radioStations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {radioStations.map(station => (
                <div key={station.id} className="bg-dark-bg/50 border border-purple-primary/20 rounded-lg p-4">
                  <div className="font-medium mb-2">{station.name}</div>
                  <div className="text-sm text-dark-muted mb-2">
                    Genre: {station.genre}
                  </div>
                  <div className="text-sm text-dark-muted mb-2">
                    Land: {station.country}
                  </div>
                  <div className="text-sm text-dark-muted mb-3">
                    {station.description}
                  </div>
                  <button
                    onClick={() => playRadioStation(station.id)}
                    disabled={!isConnected}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Radio className="w-4 h-4" />
                    Radio starten
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-dark-muted py-8">
              <Radio className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <div>Keine Radio-Sender konfiguriert</div>
              <div className="text-sm mt-2">
                Radio-Sender werden aus den Backend-Einstellungen geladen
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-dark-surface/90 backdrop-blur-xl border border-purple-primary/30 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Einstellungen
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Musik-Ordner:</label>
              <input
                type="text"
                value={settings.localMusic.musicFolder}
                onChange={(e) => setSettings({
                  ...settings,
                  localMusic: { ...settings.localMusic, musicFolder: e.target.value }
                })}
                className="w-full bg-dark-bg border border-purple-primary/30 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Standard-Lautstärke:</label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.localMusic.defaultVolume}
                onChange={(e) => setSettings({
                  ...settings,
                  localMusic: { ...settings.localMusic, defaultVolume: parseInt(e.target.value) }
                })}
                className="w-full"
              />
              <div className="text-sm text-dark-muted mt-1">{settings.localMusic.defaultVolume}%</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ankündigungs-Channel:</label>
              <select
                value={settings.announcements.channelId}
                onChange={(e) => setSettings({
                  ...settings,
                  announcements: { ...settings.announcements, channelId: e.target.value }
                })}
                className="w-full bg-dark-bg border border-purple-primary/30 rounded-lg px-3 py-2"
              >
                <option value="">-- Deaktiviert --</option>
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="shuffle"
                checked={settings.localMusic.shuffle}
                onChange={(e) => setSettings({
                  ...settings,
                  localMusic: { ...settings.localMusic, shuffle: e.target.checked }
                })}
                className="rounded"
              />
              <label htmlFor="shuffle" className="text-sm font-medium">Zufallswiedergabe</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="radioEnabled"
                checked={settings.radio.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  radio: { ...settings.radio, enabled: e.target.checked }
                })}
                className="rounded"
              />
              <label htmlFor="radioEnabled" className="text-sm font-medium">Radio-Sender aktiviert</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showNowPlaying"
                checked={settings.radio.showNowPlaying}
                onChange={(e) => setSettings({
                  ...settings,
                  radio: { ...settings.radio, showNowPlaying: e.target.checked }
                })}
                className="rounded"
              />
              <label htmlFor="showNowPlaying" className="text-sm font-medium">Now-Playing Nachrichten</label>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={saveSettings}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Einstellungen speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicCombined;