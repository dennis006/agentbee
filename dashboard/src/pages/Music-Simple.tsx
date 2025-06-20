import { useState, useEffect } from 'react';
import { Music, Play, Pause, Upload, Trash2, Settings, Save } from 'lucide-react';
import { useToast, ToastContainer } from '../components/ui/toast';

// Vereinfachte Interfaces
interface MusicFile {
  id: string;
  name: string;
  filename: string;
  path: string;
  size: number;
  duration: number | null;
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
  filename: string;
  startTime: number;
  isLocal: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: string;
}

const MusicSimple: React.FC = () => {
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
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentSong, setCurrentSong] = useState<CurrentSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

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

      // Channels laden
      const channelsResponse = await fetch('/api/discord/voice-channels');
      if (channelsResponse.ok) {
        const channelsData = await channelsResponse.json();
        if (channelsData.success) {
          setChannels(channelsData.channels);
        }
      }

      // Aktueller Song
      const currentResponse = await fetch('/api/music/current/1382473264839917785');
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        if (currentData.success) {
          setCurrentSong(currentData.currentSong);
          setIsPlaying(currentData.isPlaying);
        }
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
        showToast(data.message, 'success');
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Fehler beim Verlassen', 'error');
    }
  };

  // Musik abspielen
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
        await loadData(); // Aktuellen Song neu laden
        showToast(data.message, 'success');
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Fehler beim Abspielen', 'error');
    }
  };

  // Musik stoppen
  const stopMusic = async () => {
    try {
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
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Fehler beim Stoppen', 'error');
    }
  };

  // Datei-Upload (Frontend-Teil)
  const handleFileUpload = () => {
    showToast('Datei-Upload: Bitte lade MP3-Dateien manuell in den ./music Ordner hoch', 'info');
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
      <ToastContainer />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-primary mb-2 flex items-center gap-3">
          <Music className="w-8 h-8" />
          Musik-System (Lokale MP3-Dateien)
        </h1>
        <p className="text-dark-muted">
          Verwalte und spiele lokale MP3-Dateien in Voice-Channels ab
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Aktueller Song */}
        <div className="bg-dark-surface/90 backdrop-blur-xl border border-purple-primary/30 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🎵 Aktuell spielt
          </h2>
          
          {currentSong ? (
            <div className="space-y-3">
              <div className="text-lg font-medium">{currentSong.name}</div>
              <div className="text-sm text-dark-muted">Datei: {currentSong.filename}</div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                <span>{isPlaying ? 'Spielt ab' : 'Pausiert'}</span>
              </div>
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

      {/* Musik-Bibliothek */}
      <div className="mt-6 bg-dark-surface/90 backdrop-blur-xl border border-purple-primary/30 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            📚 Musik-Bibliothek
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleFileUpload}
              className="bg-purple-primary hover:bg-purple-secondary px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Dateien hochladen
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
            <div>Keine Musik-Dateien gefunden</div>
            <div className="text-sm mt-2">
              Lade MP3-Dateien in den ./music Ordner hoch
            </div>
          </div>
        )}
      </div>

      {/* Einstellungen */}
      <div className="mt-6 bg-dark-surface/90 backdrop-blur-xl border border-purple-primary/30 rounded-lg p-6">
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
    </div>
  );
};

export default MusicSimple;