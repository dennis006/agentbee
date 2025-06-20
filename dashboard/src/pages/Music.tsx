import { useState, useEffect, useRef } from 'react';
import { Radio, Play, Pause, Settings, Save, Mic, Users, Plus, Trash2, Search, MoreVertical, Heart, ThumbsUp, ThumbsDown, SkipForward, Shuffle, Repeat, Volume2, Music as MusicIcon } from 'lucide-react';
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

// Drag & Drop Context
interface DragItem {
  id: string;
  index: number;
  type: 'song' | 'playlist';
}

// Enhanced Types
interface YouTubeSong {
  id: string;
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
  channel: string;
  views: number;
  addedBy: string;
  addedAt: number;
  playCount: number;
  skipCount: number;
  rating: number;
  tags: string[];
  mood: string;
}

interface YouTubePlaylist {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  tags: string[];
  mood: string;
  songs: YouTubeSong[];
  isPublic: boolean;
  createdBy: string;
  createdAt: number;
  playCount: number;
  duration: number;
  settings: {
    shuffle: boolean;
    repeat: 'off' | 'one' | 'all';
    crossfade: boolean;
    autoQueue: boolean;
  };
}

interface PlaylistStatus {
  isPlaying: boolean;
  currentPlaylist: YouTubePlaylist | null;
  currentSong: YouTubeSong | null;
  autoDJ: any;
}

// Drag & Drop Components
const DraggableSong: React.FC<{
  song: YouTubeSong;
  index: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (songId: string) => void;
  isPlaying?: boolean;
}> = ({ song, index, onMove, onRemove, isPlaying = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: song.id,
      index,
      type: 'song'
    }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dragData: DragItem = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (dragData.type === 'song' && dragData.index !== index) {
        onMove(dragData.index, index);
      }
    } catch (error) {
      console.error('Drop error:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`group relative bg-gradient-to-r from-dark-surface/90 to-dark-bg/90 backdrop-blur-xl border border-purple-primary/30 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-glow cursor-move ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isPlaying ? 'border-green-400/60 shadow-green-500/25' : ''}`}
    >
      {/* Drag Handle */}
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Song Info */}
      <div className="flex items-center gap-4 ml-6">
        {/* Thumbnail */}
        <div className="relative">
          <img
            src={song.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iOCIgZmlsbD0iI0ZGMDAwMCIvPgo8dGV4dCB4PSIzMCIgeT0iMzQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPllUPC90ZXh0Pgo8L3N2Zz4K'}
            alt={song.title}
            className="w-15 h-15 rounded-lg object-cover border border-gray-600/50"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iOCIgZmlsbD0iI0ZGMDAwMCIvPgo8dGV4dCB4PSIzMCIgeT0iMzQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPllUPC90ZXh0Pgo8L3N2Zz4K';
            }}
          />
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>

        {/* Song Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate" title={song.title}>
            {song.title}
          </h4>
          <p className="text-sm text-gray-400 truncate">{song.channel}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-500">{formatDuration(song.duration)}</span>
            <span className="text-xs text-gray-500">👁️ {song.views?.toLocaleString() || 0}</span>
            {song.playCount > 0 && (
              <span className="text-xs text-green-400">▶️ {song.playCount}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => window.open(song.url, '_blank')}
            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
            title="Bei YouTube öffnen"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </button>
          <button
            onClick={() => onRemove(song.id)}
            className="p-2 text-red-400 hover:text-red-300 transition-colors"
            title="Aus Playlist entfernen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar (wenn spielend) */}
      {isPlaying && (
        <div className="mt-3 w-full bg-gray-700 rounded-full h-1">
          <div className="bg-green-400 h-1 rounded-full animate-pulse" style={{ width: '45%' }}></div>
        </div>
      )}
    </div>
  );
};

// YouTube Search Component mit URL Support
const YouTubeSearch: React.FC<{
  onAddSong: (song: YouTubeSong) => void;
  isLoading: boolean;
}> = ({ onAddSong, isLoading }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeSong[]>([]);
  const [searching, setSearching] = useState(false);
  const { showSuccess, showError } = useToast();

  // Check if input is YouTube URL
  const isYouTubeUrl = (text: string) => {
    return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/.test(text);
  };

  const addDirectUrl = async () => {
    if (!isYouTubeUrl(query)) return false;

    setSearching(true);
    try {
      const response = await fetch(`${window.location.origin}/api/music/youtube/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: query })
      });

      const data = await response.json();
      
      if (response.ok && data.song) {
        onAddSong(data.song);
        showSuccess('YouTube URL hinzugefügt', `"${data.song.title}" zur Playlist hinzugefügt`);
        setQuery('');
        return true;
      } else {
        showError('YouTube URL', data.error || 'Fehler beim Laden der Video-Informationen');
        return false;
      }
    } catch (error) {
      showError('YouTube URL', 'Verbindungsfehler');
      return false;
    } finally {
      setSearching(false);
    }
  };

  const searchSongs = async () => {
    if (!query.trim()) return;

    // Try direct URL first
    if (isYouTubeUrl(query)) {
      const success = await addDirectUrl();
      if (success) return;
    }

    // Otherwise search
    setSearching(true);
    try {
      const response = await fetch(`${window.location.origin}/api/music/youtube/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, maxResults: 8 })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data.results || []);
        if (data.apiSource === 'youtube_api') {
          showSuccess('YouTube API', '🔑 Verwende offizielle YouTube API!');
        }
      } else {
        showError('YouTube Search', data.error || 'Fehler bei der Suche');
      }
    } catch (error) {
      showError('YouTube Search', 'Verbindungsfehler');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchSongs();
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={isYouTubeUrl(query) ? "📺 YouTube URL erkannt! Enter drücken..." : "YouTube Songs suchen oder URL eingeben..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className={`w-full pl-10 pr-16 py-3 bg-dark-bg/70 border rounded-xl text-white focus:ring-2 transition-all duration-300 ${
              isYouTubeUrl(query) 
                ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20 bg-gradient-to-r from-red-900/10 to-pink-900/10' 
                : 'border-purple-primary/30 focus:border-purple-primary focus:ring-purple-primary/20'
            }`}
          />
          {isYouTubeUrl(query) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <span className="text-red-400 font-bold text-sm animate-pulse">📺</span>
              <span className="text-red-400 text-xs font-medium">URL</span>
            </div>
          )}
        </div>
        <button
          onClick={searchSongs}
          disabled={searching || !query.trim()}
          className={`px-6 py-3 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
            isYouTubeUrl(query) 
              ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600' 
              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
          }`}
        >
          {searching ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : isYouTubeUrl(query) ? (
            <div className="flex items-center gap-1">
              <span className="text-lg">📺</span>
            </div>
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(searchResults || []).map((song) => (
            <div
              key={song.id}
              className="group bg-dark-surface/50 rounded-xl p-4 border border-gray-600/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <img
                  src={song.thumbnail}
                  alt={song.title}
                  className="w-12 h-12 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0ZGMDAwMCIvPgo8dGV4dCB4PSIyNCIgeT0iMjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPllUPC90ZXh0Pgo8L3N2Zz4K';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate" title={song.title}>
                    {song.title}
                  </h4>
                  <p className="text-sm text-gray-400 truncate">{song.channel}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{formatDuration(song.duration)}</span>
                    <span className="text-xs text-gray-500">👁️ {song.views?.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onAddSong(song);
                    showSuccess('Song hinzugefügt', `"${song.title}" zur Playlist hinzugefügt`);
                  }}
                  disabled={isLoading}
                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  title="Zur Playlist hinzufügen"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Playlist Editor Component
const PlaylistEditor: React.FC<{
  playlist: YouTubePlaylist | null;
  onUpdate: (updates: Partial<YouTubePlaylist>) => void;
  onSave: () => void;
  isLoading: boolean;
}> = ({ playlist, onUpdate, onSave, isLoading }) => {
  const { showSuccess, showError } = useToast();

  if (!playlist) {
    return (
      <div className="text-center py-12">
        <MusicIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <p className="text-gray-400">Wähle eine Playlist zum Bearbeiten</p>
      </div>
    );
  }

  const moveSong = (fromIndex: number, toIndex: number) => {
    if (!playlist?.songs) return;
    const newSongs = [...playlist.songs];
    const song = newSongs.splice(fromIndex, 1)[0];
    newSongs.splice(toIndex, 0, song);
    onUpdate({ songs: newSongs });
  };

  const removeSong = (songId: string) => {
    if (!playlist?.songs) return;
    const newSongs = playlist.songs.filter(song => song.id !== songId);
    onUpdate({ songs: newSongs });
  };

  const addSong = (song: YouTubeSong) => {
    if (!playlist) return;
    const newSongs = [...(playlist.songs || []), song];
    onUpdate({ songs: newSongs });
  };

  const getTotalDuration = () => {
    if (!playlist?.songs) return '0m';
    const totalSeconds = playlist.songs.reduce((total, song) => total + (song.duration || 0), 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Playlist Header */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-6 border border-purple-primary/30">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <MusicIcon className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={playlist.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="text-2xl font-bold bg-transparent border-none text-white placeholder-gray-400 w-full focus:outline-none"
              placeholder="Playlist Name"
            />
            <textarea
              value={playlist.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              className="mt-2 bg-transparent border-none text-gray-300 placeholder-gray-500 w-full resize-none focus:outline-none"
              placeholder="Beschreibung hinzufügen..."
              rows={2}
            />
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
              <span>🎵 {playlist.songs?.length || 0} Songs</span>
              <span>⏱️ {getTotalDuration()}</span>
              <span>▶️ {playlist.playCount || 0} Plays</span>
            </div>
          </div>
        </div>

        {/* Playlist Settings */}
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={playlist.settings.shuffle}
              onChange={(e) => onUpdate({ 
                settings: { ...playlist.settings, shuffle: e.target.checked }
              })}
              className="rounded text-purple-500 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300">🔀 Shuffle</span>
          </label>
          
          <select
            value={playlist.settings.repeat}
            onChange={(e) => onUpdate({ 
              settings: { ...playlist.settings, repeat: e.target.value as 'off' | 'one' | 'all' }
            })}
            className="bg-dark-bg border border-gray-600 rounded-lg px-3 py-1 text-sm text-white"
          >
            <option value="off">🔄 Kein Repeat</option>
            <option value="one">🔂 Song wiederholen</option>
            <option value="all">🔁 Playlist wiederholen</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={playlist.settings.crossfade}
              onChange={(e) => onUpdate({ 
                settings: { ...playlist.settings, crossfade: e.target.checked }
              })}
              className="rounded text-purple-500 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300">🌊 Crossfade</span>
          </label>
        </div>
      </div>

      {/* YouTube Search */}
      <div className="bg-dark-surface/50 rounded-xl p-6 border border-blue-primary/30">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-400" />
          Songs zur Playlist hinzufügen
        </h3>
        <YouTubeSearch onAddSong={addSong} isLoading={isLoading} />
      </div>

      {/* Songs List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MusicIcon className="w-5 h-5 text-purple-400" />
            Playlist Songs ({playlist.songs.length})
          </h3>
          <button
            onClick={onSave}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Speichere...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Playlist speichern
              </div>
            )}
          </button>
        </div>

        {playlist.songs.length === 0 ? (
          <div className="text-center py-12 bg-dark-surface/30 rounded-xl border border-gray-600/30">
            <MusicIcon className="w-12 h-12 mx-auto text-gray-500 mb-3" />
            <p className="text-gray-400">Keine Songs in dieser Playlist</p>
            <p className="text-sm text-gray-500 mt-1">Suche oben nach YouTube-Songs um sie hinzuzufügen</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(playlist.songs || []).map((song, index) => (
              <DraggableSong
                key={song.id}
                song={song}
                index={index}
                onMove={moveSong}
                onRemove={removeSong}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
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

// Interfaces - Vereinfacht für YouTube Radio-System
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

// Playlists Overview Component 🎵
const PlaylistsOverview: React.FC<{
  playlists: YouTubePlaylist[];
  onSelectPlaylist: (playlist: YouTubePlaylist) => void;
  onCreatePlaylist: () => void;
  onDeletePlaylist: (playlistId: string) => void;
  onStartPlaylist: (playlistId: string) => void;
  isLoading: boolean;
  playlistStatus: PlaylistStatus;
}> = ({ playlists, onSelectPlaylist, onCreatePlaylist, onDeletePlaylist, onStartPlaylist, isLoading, playlistStatus }) => {
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('de-DE');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Deine Playlists</h2>
          <p className="text-gray-400 mt-1">Verwalte deine YouTube Playlists und starte den Auto-DJ</p>
        </div>
        <button
          onClick={onCreatePlaylist}
          disabled={isLoading}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          Neue Playlist
        </button>
      </div>

      {/* Current Playing Status */}
      {playlistStatus.isPlaying && playlistStatus.currentPlaylist && (
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-6 border border-green-400/30 animate-pulse-slow">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">🎵 Aktuelle Playlist</h3>
              <p className="text-green-400 font-medium">{playlistStatus.currentPlaylist.name}</p>
              {playlistStatus.currentSong && (
                <p className="text-gray-300 text-sm">Aktuell: {playlistStatus.currentSong.title}</p>
              )}
            </div>
            <div className="text-green-400">
              <Volume2 className="w-8 h-8 animate-bounce" />
            </div>
          </div>
        </div>
      )}

      {/* Playlists Grid */}
      {playlists.length === 0 ? (
        <div className="text-center py-16 bg-dark-surface/30 rounded-xl border border-gray-600/30">
          <MusicIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Keine Playlists vorhanden</h3>
          <p className="text-gray-500 mb-6">Erstelle deine erste YouTube Playlist!</p>
          <button
            onClick={onCreatePlaylist}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Playlist erstellen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(playlists || []).map((playlist, index) => (
            <div
              key={playlist.id}
              className={`group bg-gradient-to-br from-dark-surface/90 to-dark-bg/90 backdrop-blur-xl border rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl fade-in-delay-${index % 3 + 1} ${
                playlistStatus.currentPlaylist?.id === playlist.id && playlistStatus.isPlaying
                  ? 'border-green-400/60 shadow-green-500/25'
                  : 'border-purple-primary/30 hover:border-purple-primary/60 hover:shadow-purple-glow'
              }`}
            >
              {/* Playlist Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MusicIcon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate" title={playlist.name}>
                    {playlist.name}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                    {playlist.description || 'Keine Beschreibung'}
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onDeletePlaylist(playlist.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                    title="Playlist löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Playlist Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span>🎵 {playlist.songs.length} Songs</span>
                <span>⏱️ {formatDuration(playlist.duration)}</span>
                <span>▶️ {playlist.playCount}</span>
              </div>

              {/* Playlist Tags */}
              {playlist.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {playlist.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {playlist.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">
                      +{playlist.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onSelectPlaylist(playlist)}
                  className="flex-1 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Bearbeiten
                </button>
                <button
                  onClick={() => onStartPlaylist(playlist.id)}
                  disabled={isLoading || (playlistStatus.isPlaying && playlistStatus.currentPlaylist?.id === playlist.id)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
                >
                  {playlistStatus.isPlaying && playlistStatus.currentPlaylist?.id === playlist.id ? (
                    <>
                      <Pause className="w-4 h-4 inline mr-2" />
                      Läuft
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 inline mr-2" />
                      Abspielen
                    </>
                  )}
                </button>
              </div>

              {/* Created Date */}
              <div className="mt-3 pt-3 border-t border-gray-600/30 text-xs text-gray-500">
                Erstellt: {formatDate(playlist.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Live Control Component 🔴
const LiveControl: React.FC<{
  playlistStatus: PlaylistStatus;
  onStop: () => void;
  onSkip: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}> = ({ playlistStatus, onStop, onSkip, onRefresh, isLoading }) => {
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!playlistStatus.isPlaying || !playlistStatus.currentPlaylist) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center mb-6">
          <Pause className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-400 mb-3">Keine Playlist aktiv</h2>
        <p className="text-gray-500 mb-6">Starte eine Playlist um sie hier zu kontrollieren</p>
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-300 hover:scale-105"
        >
          Aktualisieren
        </button>
      </div>
    );
  }

  const { currentPlaylist, currentSong } = playlistStatus;

  return (
    <div className="space-y-8">
      {/* Now Playing Hero */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl p-8 border border-purple-primary/30 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 animate-gradient-x"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-green-400 mb-4 animate-pulse">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-sm font-medium">LIVE PLAYING</span>
          </div>

          <div className="flex items-start gap-6">
            {/* Song Thumbnail */}
            <div className="relative">
              <img
                src={currentSong?.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iMTIiIGZpbGw9IiNGRjAwMDAiLz4KPHR4dCB4PSI2MCIgeT0iNjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPllUPC90ZXh0Pgo8L3N2Zz4K'}
                alt={currentSong?.title}
                className="w-32 h-32 rounded-xl object-cover border-2 border-white/20 shadow-2xl"
              />
              <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center">
                <div className="w-8 h-8 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Song Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2" title={currentSong?.title}>
                {currentSong?.title || 'Unbekannter Titel'}
              </h1>
              <p className="text-xl text-gray-300 mb-4">{currentSong?.channel || 'Unbekannter Kanal'}</p>
              
              <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
                <span>⏱️ {formatDuration(currentSong?.duration || 0)}</span>
                <span>👁️ {currentSong?.views?.toLocaleString() || 0}</span>
                <span>▶️ {currentSong?.playCount || 0} Plays</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-1000" style={{ width: '45%' }}></div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={onSkip}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
                >
                  <SkipForward className="w-5 h-5 inline mr-2" />
                  Skip
                </button>
                <button
                  onClick={onStop}
                  disabled={isLoading}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
                >
                  <Pause className="w-5 h-5 inline mr-2" />
                  Stop
                </button>
                <button
                  onClick={onRefresh}
                  className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Playlist */}
        <div className="bg-dark-surface/50 rounded-xl p-6 border border-purple-primary/30">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MusicIcon className="w-5 h-5 text-purple-400" />
            Aktuelle Playlist
          </h3>
          
          <div className="space-y-3">
            <h4 className="font-medium text-white">{currentPlaylist.name}</h4>
            <p className="text-sm text-gray-400">{currentPlaylist.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Songs:</span>
                <span className="text-white ml-2">{currentPlaylist.songs.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Dauer:</span>
                <span className="text-white ml-2">{formatDuration(currentPlaylist.duration)}</span>
              </div>
              <div>
                <span className="text-gray-500">Shuffle:</span>
                <span className="text-white ml-2">{currentPlaylist.settings.shuffle ? '🔀 An' : '📑 Aus'}</span>
              </div>
              <div>
                <span className="text-gray-500">Repeat:</span>
                <span className="text-white ml-2">
                  {currentPlaylist.settings.repeat === 'all' ? '🔁 All' : 
                   currentPlaylist.settings.repeat === 'one' ? '🔂 One' : '⏹️ Off'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Voting System */}
        <div className="bg-dark-surface/50 rounded-xl p-6 border border-blue-primary/30">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-blue-400" />
            Song Voting
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Aktueller Song:</span>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span>12</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                  <ThumbsDown className="w-4 h-4" />
                  <span>3</span>
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Bei 3+ Downvotes wird automatisch geskippt
            </div>
          </div>
        </div>
      </div>

      {/* Queue Preview */}
      <div className="bg-dark-surface/50 rounded-xl p-6 border border-green-primary/30">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <SkipForward className="w-5 h-5 text-green-400" />
          Nächste Songs (5)
        </h3>
        
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-dark-bg/50 rounded-lg">
              <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center text-sm text-gray-400">
                {i}
              </div>
              <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="text-sm text-gray-500">3:42</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Classic Radio Component 📻
const ClassicRadio: React.FC<{
  settings: any;
  radioStatus: any;
  interactivePanelData: any;
  onUpdateSettings: (settings: any) => void;
  isLoading: boolean;
}> = ({ settings, radioStatus, interactivePanelData, onUpdateSettings, isLoading }) => {
  
  return (
    <div className="space-y-6">
      <div className="text-center py-16">
        <Radio className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-400 mb-3">Classic Radio (Legacy)</h2>
        <p className="text-gray-500 mb-6">Die alte Radio-Funktionalität. Nutze die neuen Playlists für bessere Features!</p>
        <button className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-300 hover:scale-105">
          Zu Playlists wechseln
        </button>
      </div>
    </div>
  );
};

// Main Music Component - MEGA VERSION! 🚀
export default function Music() {
  const [settings, setSettings] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [radioStatus, setRadioStatus] = useState<any>({});
  const [interactivePanelData, setInteractivePanelData] = useState<any>({});
  const { showSuccess, showError } = useToast();

  // NEW PLAYLIST STATE 🎵
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<YouTubePlaylist | null>(null);
  const [playlistStatus, setPlaylistStatus] = useState<PlaylistStatus>({
    isPlaying: false,
    currentPlaylist: null,
    currentSong: null,
    autoDJ: null
  });
  const [activeTab, setActiveTab] = useState<'radio' | 'playlists' | 'editor' | 'live'>('playlists');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);

  // Load everything
  useEffect(() => {
    Promise.all([
      loadSettings(),
      loadPlaylists(),
      loadPlaylistStatus()
    ]);
  }, []);

  // Auto-refresh playlist status
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'live' && playlistStatus.isPlaying) {
        loadPlaylistStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab, playlistStatus.isPlaying]);

  const loadSettings = async () => {
    try {
      const response = await fetch(`${window.location.origin}/api/music/settings`);
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
        setRadioStatus(data.radioStatus || {});
        setInteractivePanelData(data.interactivePanelData || {});
      }
    } catch (error) {
      console.error('Settings laden fehlgeschlagen:', error);
    }
  };

  const loadPlaylists = async () => {
    try {
      const response = await fetch(`${window.location.origin}/api/music/playlists`);
        const data = await response.json();
      
      if (data.success) {
        setPlaylists(data.playlists || []);
      }
    } catch (error) {
      console.error('Playlists laden fehlgeschlagen:', error);
    }
  };

  const loadPlaylistStatus = async () => {
    try {
      const guildId = '123456789'; // Hier würde die echte Guild ID stehen
      const response = await fetch(`${window.location.origin}/api/music/playlist/${guildId}/status`);
        const data = await response.json();
      
      if (data.success) {
        setPlaylistStatus({
          isPlaying: data.isPlaying,
          currentPlaylist: data.currentPlaylist,
          currentSong: data.currentSong,
          autoDJ: data.autoDJ
        });
      }
    } catch (error) {
      console.error('Playlist Status laden fehlgeschlagen:', error);
    }
  };

  // PLAYLIST FUNCTIONS 🎵
  const createNewPlaylist = async (name: string, description: string = '') => {
    setIsLoading(true);
    try {
      const response = await fetch(`${window.location.origin}/api/music/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          mood: 'default',
          tags: [],
          isPublic: false
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess('Playlist erstellt', data.message);
        await loadPlaylists();
        setSelectedPlaylist(data.playlist);
        setActiveTab('editor');
        setShowCreatePlaylist(false);
      } else {
        showError('Fehler', data.error);
      }
    } catch (error) {
      showError('Fehler', 'Verbindungsfehler');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlaylist = (updates: Partial<YouTubePlaylist>) => {
    if (selectedPlaylist) {
      const updatedPlaylist = { ...selectedPlaylist, ...updates };
      setSelectedPlaylist(updatedPlaylist);
      
      // Update in playlists array
      setPlaylists(prev => 
        (prev || []).map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p)
      );
    }
  };

  const savePlaylist = async () => {
    if (!selectedPlaylist) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${window.location.origin}/api/music/playlists/${selectedPlaylist.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedPlaylist)
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess('Playlist gespeichert', data.message);
        await loadPlaylists();
      } else {
        showError('Fehler', data.error);
      }
    } catch (error) {
      showError('Fehler', 'Speichern fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${window.location.origin}/api/music/playlists/${playlistId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess('Playlist gelöscht', data.message);
        await loadPlaylists();
        if (selectedPlaylist?.id === playlistId) {
          setSelectedPlaylist(null);
        }
      } else {
        showError('Fehler', data.error);
      }
    } catch (error) {
      showError('Fehler', 'Löschen fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const startPlaylist = async (playlistId: string) => {
    setIsLoading(true);
    try {
      const guildId = '123456789'; // Hier würde die echte Guild ID stehen
      const response = await fetch(`${window.location.origin}/api/music/autodj/${guildId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId })
      });

        const data = await response.json();
      
      if (data.success) {
        showSuccess('Auto-DJ gestartet', data.message);
        await loadPlaylistStatus();
        setActiveTab('live');
      } else {
        showError('Fehler', data.error);
      }
    } catch (error) {
      showError('Fehler', 'Start fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const stopPlaylist = async () => {
    setIsLoading(true);
    try {
      const guildId = '123456789'; // Hier würde die echte Guild ID stehen
      const response = await fetch(`${window.location.origin}/api/music/autodj/${guildId}/stop`, {
        method: 'POST'
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess('Auto-DJ gestoppt', data.message);
        await loadPlaylistStatus();
      } else {
        showError('Fehler', data.error);
      }
    } catch (error) {
      showError('Fehler', 'Stop fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const skipSong = async () => {
    try {
      const guildId = '123456789'; // Hier würde die echte Guild ID stehen
      const response = await fetch(`${window.location.origin}/api/music/autodj/${guildId}/skip`, {
        method: 'POST'
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess('Song übersprungen', data.message);
        await loadPlaylistStatus();
      } else {
        showError('Fehler', data.error);
      }
    } catch (error) {
      showError('Fehler', 'Skip fehlgeschlagen');
    }
  };

  // Create Playlist Modal
  const CreatePlaylistModal = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    return showCreatePlaylist ? (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-dark-surface rounded-2xl p-6 w-full max-w-md border border-purple-primary/30">
          <h3 className="text-xl font-bold text-white mb-4">Neue Playlist erstellen</h3>
          
          <div className="space-y-4">
                <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-xl text-white focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20"
                placeholder="Meine coole Playlist"
                  />
                </div>
                
                <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Beschreibung (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-xl text-white focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20 resize-none"
                placeholder="Eine Beschreibung deiner Playlist..."
                rows={3}
                  />
                </div>
                </div>
                
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowCreatePlaylist(false)}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={() => name && createNewPlaylist(name, description)}
              disabled={!name || isLoading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl transition-all disabled:opacity-50"
            >
              {isLoading ? 'Erstelle...' : 'Erstellen'}
            </button>
              </div>
                  </div>
                </div>
    ) : null;
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg">
      {/* Matrix Background */}
      <MatrixBlocks density={25} />
      
      {/* Main Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-8 fade-in">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 mb-2 animate-gradient-x">
            🎵 YouTube Playlist Radio 🚀
          </h1>
          <p className="text-gray-400">Erstelle coole Custom Playlists, Auto-DJ, Drag & Drop und mehr!</p>
                    </div>

        {/* Tab Navigation */}
        <div className="mb-8 fade-in-delay-1">
          <div className="flex flex-wrap gap-2 bg-dark-surface/50 backdrop-blur-xl rounded-2xl p-2 border border-purple-primary/30">
            {[
              { id: 'playlists', label: '📁 Playlists', icon: '🎵' },
              { id: 'editor', label: '✏️ Editor', icon: '🛠️' },
              { id: 'live', label: '🔴 Live Control', icon: '⚡' },
              { id: 'radio', label: '📻 Classic Radio', icon: '📡' }
            ].map((tab, index) => (
                            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 fade-in-delay-${index + 2} ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-dark-bg/50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                            </button>
                          ))}
                      </div>
                    </div>

        {/* Tab Content */}
        {activeTab === 'playlists' && (
          <div className="fade-in-delay-3">
            <PlaylistsOverview 
              playlists={playlists}
              onSelectPlaylist={(playlist) => {
                setSelectedPlaylist(playlist);
                setActiveTab('editor');
              }}
              onCreatePlaylist={() => setShowCreatePlaylist(true)}
              onDeletePlaylist={deletePlaylist}
              onStartPlaylist={startPlaylist}
              isLoading={isLoading}
              playlistStatus={playlistStatus}
                        />
                      </div>
        )}

        {activeTab === 'editor' && (
          <div className="fade-in-delay-3">
            <PlaylistEditor
              playlist={selectedPlaylist}
              onUpdate={updatePlaylist}
              onSave={savePlaylist}
              isLoading={isLoading}
                            />
                          </div>
        )}

        {activeTab === 'live' && (
          <div className="fade-in-delay-3">
            <LiveControl
              playlistStatus={playlistStatus}
              onStop={stopPlaylist}
              onSkip={skipSong}
              onRefresh={loadPlaylistStatus}
              isLoading={isLoading}
            />
                              </div>
        )}

        {activeTab === 'radio' && (
          <div className="fade-in-delay-3">
            <ClassicRadio
              settings={settings}
              radioStatus={radioStatus}
              interactivePanelData={interactivePanelData}
              onUpdateSettings={setSettings}
              isLoading={isLoading}
                                />
                              </div>
                            )}
                          </div>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
