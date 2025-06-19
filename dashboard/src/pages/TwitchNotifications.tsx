import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

import { Textarea } from '../components/ui/textarea';
import { Settings, Plus, Trash2, Save, Play, Pause, TestTube, Users, MessageSquare, Clock, Smile, Monitor, Zap, Edit3 } from 'lucide-react';
import { useToast, ToastContainer } from '../components/ui/toast';
import EmojiPicker from '../components/ui/emoji-picker';

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



// Interfaces
interface TwitchSettings {
  enabled: boolean;
  checkInterval: number;
  clientId: string;
  clientSecret: string;
  channels: {
    notificationChannel: string;
    roleToMention: string;
    mentionEveryone: boolean;
  };
  embed: {
    color: string;
    showThumbnail: boolean;
    showViewerCount: boolean;
    showCategory: boolean;
    showUptime: boolean;
    customMessage: string;
    includeEmojis: boolean;
    customEmojis: string[];
  };
  notifications: {
    onlyFirstTime: boolean;
    cooldown: number;
    offlineNotification: boolean;
    streamEndedMessage: string;
  };
  filters: {
    minViewers: number;
    allowedCategories: string[];
    blockedCategories: string[];
    onlyFollowers: boolean;
  };
}

interface Streamer {
  id: string;
  username: string;
  displayName: string;
  customMessage: string;
  enabled: boolean;
  addedAt: string;
  notifications: {
    live: boolean;
    offline: boolean;
  };
  lastLive: string | null;
  totalNotifications: number;
}

interface TwitchStats {
  totalStreamers: number;
  activeStreamers: number;
  totalNotifications: number;
  currentlyLive: number;
  systemEnabled: boolean;
  lastCheck: string | null;
}

interface Role {
  id: string;
  name: string;
  color: string;
  guildId: string;
  guildName: string;
}



const TwitchNotifications: React.FC = () => {
  const [settings, setSettings] = useState<TwitchSettings>({
    enabled: true,
    checkInterval: 5,
    clientId: '',
    clientSecret: '',
    channels: {
      notificationChannel: 'live-streams',
      roleToMention: '',
      mentionEveryone: false
    },
    embed: {
      color: '0x00FF7F',
      showThumbnail: true,
      showViewerCount: true,
      showCategory: true,
      showUptime: true,
      customMessage: '🔴 **{{streamer}}** ist jetzt LIVE!',
      includeEmojis: true,
      customEmojis: ['🎮', '🔥', '💜', '⭐', '🚀']
    },
    notifications: {
      onlyFirstTime: false,
      cooldown: 30,
      offlineNotification: false,
      streamEndedMessage: '📴 **{{streamer}}** hat den Stream beendet!'
    },
    filters: {
      minViewers: 0,
      allowedCategories: [],
      blockedCategories: [],
      onlyFollowers: false
    }
  });

  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [stats, setStats] = useState<TwitchStats>({
    totalStreamers: 0,
    activeStreamers: 0,
    totalNotifications: 0,
    currentlyLive: 0,
    systemEnabled: false,
    lastCheck: null
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [newStreamer, setNewStreamer] = useState({
    username: '',
    displayName: '',
    customMessage: '',
    offlineNotifications: false
  });

  const [newCategory, setNewCategory] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<string | null>(null);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [aiGeneratorParams, setAiGeneratorParams] = useState({
    game: '',
    vibe: 'energetic',
    streamerType: 'gamer',
    emojiCount: 'medium',
    length: 'medium',
    language: 'deutsch'
  });
  
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    streamerId: string;
    streamerName: string;
  }>({
    show: false,
    streamerId: '',
    streamerName: ''
  });
  
  const [editModal, setEditModal] = useState<{
    show: boolean;
    streamer: Streamer | null;
  }>({
    show: false,
    streamer: null
  });
  
  const [editData, setEditData] = useState({
    displayName: '',
    customMessage: '',
    offlineNotifications: false
  });
  
  const [editAiGeneratorOpen, setEditAiGeneratorOpen] = useState(false);

  const { toasts, removeToast, success: showSuccess, error: showError } = useToast();

  // URL zu Username extrahieren (https://www.twitch.tv/mindofdennis95 -> mindofdennis95)
  const extractUsernameFromUrl = (input: string): string => {
    const twitchUrlPattern = /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/i;
    const match = input.match(twitchUrlPattern);
    return match ? match[1] : input.trim();
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Parallel laden
      const [settingsRes, streamersRes, statsRes, rolesRes] = await Promise.all([
        fetch('/api/twitch/settings'),
        fetch('/api/twitch/streamers'),
        fetch('/api/twitch/stats'),
        fetch('/api/twitch/roles')
      ]);

      const settingsData = await settingsRes.json();
      const streamersData = await streamersRes.json();
      const statsData = await statsRes.json();
      const rolesData = await rolesRes.json();

      if (settingsData.success) {
        setSettings(settingsData.settings);
      }

      if (streamersData.success) {
        setStreamers(streamersData.streamers);
      }

      if (statsData.success) {
        setStats(statsData.stats);
      }

      if (rolesData.success) {
        setRoles(rolesData.roles);
      }

    } catch (error) {
      console.error('❌ Fehler beim Laden der Twitch-Daten:', error);
      showMessage('error', 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/twitch/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'Twitch-Einstellungen gespeichert!');
        await loadData(); // Neu laden für aktuelle Stats
      } else {
        showMessage('error', data.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      showMessage('error', 'Fehler beim Speichern der Einstellungen');
    }
  };

  const toggleSystem = async () => {
    try {
      const response = await fetch('/api/twitch/toggle', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        setSettings(prev => ({ ...prev, enabled: data.enabled }));
        showMessage('success', data.message);
        await loadData();
      } else {
        showMessage('error', data.error || 'Fehler beim Umschalten');
      }
    } catch (error) {
      console.error('❌ Fehler beim Umschalten:', error);
      showMessage('error', 'Fehler beim Umschalten des Systems');
    }
  };

  const addStreamer = async () => {
    if (!newStreamer.username.trim()) {
      showMessage('error', 'Bitte Twitch-Username oder URL eingeben');
      return;
    }

    // Username aus URL extrahieren falls nötig
    const extractedUsername = extractUsernameFromUrl(newStreamer.username);

    try {
      const streamerData = {
        ...newStreamer,
        username: extractedUsername,
        displayName: newStreamer.displayName || extractedUsername
      };

      const response = await fetch('/api/twitch/streamers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(streamerData)
      });

      const data = await response.json();

      if (data.success) {
        setStreamers(prev => [...prev, data.streamer]);
        setNewStreamer({
          username: '',
          displayName: '',
          customMessage: '',
          offlineNotifications: false
        });
        showMessage('success', `Streamer ${newStreamer.username} hinzugefügt!`);
        await loadData();
      } else {
        showMessage('error', data.error || 'Fehler beim Hinzufügen');
      }
    } catch (error) {
      console.error('❌ Fehler beim Hinzufügen:', error);
      showMessage('error', 'Fehler beim Hinzufügen des Streamers');
    }
  };

  const removeStreamer = (streamerId: string, streamerName: string) => {
    setDeleteModal({
      show: true,
      streamerId,
      streamerName
    });
  };
  
  const confirmDelete = async () => {
    const { streamerId } = deleteModal;
    
    try {
      const response = await fetch(`/api/twitch/streamers/${streamerId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setStreamers(prev => prev.filter(s => s.id !== streamerId));
        showMessage('success', 'Streamer entfernt!');
        await loadData();
      } else {
        showMessage('error', data.error || 'Fehler beim Entfernen');
      }
    } catch (error) {
      console.error('❌ Fehler beim Entfernen:', error);
      showMessage('error', 'Fehler beim Entfernen des Streamers');
    }
    
    setDeleteModal({ show: false, streamerId: '', streamerName: '' });
  };
  
  const openEditModal = (streamer: Streamer) => {
    setEditData({
      displayName: streamer.displayName || streamer.username,
      customMessage: streamer.customMessage || '',
      offlineNotifications: streamer.notifications.offline
    });
    setEditModal({
      show: true,
      streamer
    });
  };
  
  const saveStreamerEdit = async () => {
    if (!editModal.streamer) return;
    
    try {
      const updates = {
        displayName: editData.displayName,
        customMessage: editData.customMessage,
        notifications: {
          live: editModal.streamer.notifications.live,
          offline: editData.offlineNotifications
        }
      };
      
      await updateStreamer(editModal.streamer.id, updates);
      setEditModal({ show: false, streamer: null });
      showMessage('success', 'Streamer aktualisiert!');
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      showMessage('error', 'Fehler beim Speichern der Änderungen');
    }
  };

  const updateStreamer = async (streamerId: string, updates: Partial<Streamer>) => {
    try {
      const response = await fetch(`/api/twitch/streamers/${streamerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (data.success) {
        setStreamers(prev => prev.map(s => s.id === streamerId ? data.streamer : s));
        showMessage('success', 'Streamer aktualisiert!');
      } else {
        showMessage('error', data.error || 'Fehler beim Aktualisieren');
      }
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren:', error);
      showMessage('error', 'Fehler beim Aktualisieren des Streamers');
    }
  };

  const testNotification = async (streamerId: string) => {
    try {
      const response = await fetch(`/api/twitch/test/${streamerId}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'Test-Benachrichtigung gesendet!');
      } else {
        showMessage('error', data.error || 'Fehler beim Testen');
      }
    } catch (error) {
      console.error('❌ Fehler beim Testen:', error);
      showMessage('error', 'Fehler beim Senden der Test-Benachrichtigung');
    }
  };

  const addCategory = (type: 'allowed' | 'blocked') => {
    if (!newCategory.trim()) return;

    setSettings(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [type === 'allowed' ? 'allowedCategories' : 'blockedCategories']: [
          ...prev.filters[type === 'allowed' ? 'allowedCategories' : 'blockedCategories'],
          newCategory.trim()
        ]
      }
    }));

    setNewCategory('');
  };

  const removeCategory = (type: 'allowed' | 'blocked', index: number) => {
    setSettings(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [type === 'allowed' ? 'allowedCategories' : 'blockedCategories']: 
          prev.filters[type === 'allowed' ? 'allowedCategories' : 'blockedCategories'].filter((_, i) => i !== index)
      }
    }));
  };

  const addEmoji = (emoji: string, target: string) => {
    if (target === 'custom') {
      setSettings(prev => ({
        ...prev,
        embed: {
          ...prev.embed,
          customEmojis: [...prev.embed.customEmojis, emoji]
        }
      }));
    } else if (target === 'message') {
      setSettings(prev => ({
        ...prev,
        embed: {
          ...prev.embed,
          customMessage: prev.embed.customMessage + emoji
        }
      }));
    } else if (target === 'endMessage') {
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          streamEndedMessage: prev.notifications.streamEndedMessage + emoji
        }
      }));
    } else if (target === 'newStreamerMessage') {
      setNewStreamer(prev => ({
        ...prev,
        customMessage: prev.customMessage + emoji
      }));
    } else if (target === 'editStreamerMessage') {
      setEditData(prev => ({
        ...prev,
        customMessage: prev.customMessage + emoji
      }));
    }
    
    setEmojiPickerOpen(null);
  };

  const removeEmoji = (index: number) => {
    setSettings(prev => ({
      ...prev,
      embed: {
        ...prev.embed,
        customEmojis: prev.embed.customEmojis.filter((_, i) => i !== index)
      }
    }));
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      showSuccess(text);
    } else {
      showError(text);
    }
  };

  const generateAIMessage = async () => {
    const { game, vibe, streamerType, emojiCount, length, language } = aiGeneratorParams;
    
    try {
      // Loading-Status anzeigen
      showMessage('success', '🤖 ChatGPT generiert deine Message...');
      
      // ChatGPT API aufrufen
      const response = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          game,
          vibe,
          streamerType,
          emojiCount,
          length,
          language
        })
      });

      const data = await response.json();
      
      if (data.success && data.message) {
        // Generierte Message ins Feld setzen
        setNewStreamer(prev => ({ ...prev, customMessage: data.message }));
        setAiGeneratorOpen(false);
        
        if (data.fallback) {
          showSuccess('💡 Fallback-Message generiert (ChatGPT nicht verfügbar)!');
        } else {
          showSuccess(`✨ ChatGPT Message generiert! (${data.model})`);
        }
      } else {
        throw new Error(data.error || 'Unbekannter Fehler');
      }
      
    } catch (error) {
      console.error('Fehler bei ChatGPT Generation:', error);
      
      // Fallback zur lokalen Generierung
      const fallbackMessage = generateLocalFallback();
      setNewStreamer(prev => ({ ...prev, customMessage: fallbackMessage }));
      setAiGeneratorOpen(false);
      showError('❌ ChatGPT Fehler - Fallback-Message verwendet');
    }
  };
  
  const generateAIMessageForEdit = async () => {
    const { game, vibe, streamerType, emojiCount, length, language } = aiGeneratorParams;
    
    try {
      // Loading-Status anzeigen
      showMessage('success', '🤖 ChatGPT generiert Custom Message...');
      
      // ChatGPT API aufrufen
      const response = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          game,
          vibe,
          streamerType,
          emojiCount,
          length,
          language
        })
      });

      const data = await response.json();
      
      if (data.success && data.message) {
        // Generierte Message ins Edit-Feld setzen
        setEditData(prev => ({ ...prev, customMessage: data.message }));
        setEditAiGeneratorOpen(false);
        
        if (data.fallback) {
          showSuccess('💡 Fallback-Message generiert (ChatGPT nicht verfügbar)!');
        } else {
          showSuccess(`✨ ChatGPT Message generiert! (${data.model})`);
        }
      } else {
        // Fallback verwenden
        const fallbackMessage = generateLocalFallback();
        setEditData(prev => ({ ...prev, customMessage: fallbackMessage }));
        setEditAiGeneratorOpen(false);
        showSuccess('💡 Fallback-Message generiert!');
      }
    } catch (error) {
      console.error('❌ Fehler beim Generieren:', error);
      
      // Fallback verwenden
      const fallbackMessage = generateLocalFallback();
      setEditData(prev => ({ ...prev, customMessage: fallbackMessage }));
      setEditAiGeneratorOpen(false);
      showSuccess('💡 Fallback-Message generiert!');
    }
  };

  const generateLocalFallback = () => {
    const { game, vibe, emojiCount } = aiGeneratorParams;
    
    const gameEmojis: Record<string, string[]> = {
      'valorant': ['⚡', '🔫', '💥', '🎯'],
      'minecraft': ['⛏️', '🏠', '🌲', '💎'],
      'just chatting': ['💬', '🗣️', '💭', '🎤'],
      'default': ['🎮', '🔥', '💜', '⭐']
    };

    const templates: Record<string, string> = {
      'energetic': '🔥 {streamer} geht live mit ACTION! Schaut zu!',
      'chill': '✨ {streamer} startet entspannt! Kommt vorbei!',
      'hype': '🚀 {streamer} ist LIVE! Das wird EPIC!',
      'professional': '👑 {streamer} zeigt Skills! Pro-Gameplay!',
      'funny': '😂 {streamer} bringt Spaß! Comedy-Time!'
    };

    let message = templates[vibe] || templates['energetic'];
    const emojis = gameEmojis[game.toLowerCase()] || gameEmojis['default'];
    
    // Emojis hinzufügen
    const emojiToAdd = emojiCount === 'few' ? 1 : emojiCount === 'medium' ? 2 : 3;
    for (let i = 0; i < emojiToAdd && i < emojis.length; i++) {
      message += ` ${emojis[i]}`;
    }

    return message;
  };

  const formatLastCheck = (lastCheck: string | null) => {
    if (!lastCheck) return 'Noch nie';
    const date = new Date(lastCheck);
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
              <p className="text-dark-text mt-4">Lade Twitch-Daten...</p>
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
          <Monitor className="w-12 h-12 text-purple-primary animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-primary to-purple-secondary">
            Twitch Live Notifications
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          <span className="relative inline-flex items-center mr-2">
            <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 animate-pulse"></span>
          </span>
          Automatische Benachrichtigungen wenn deine Lieblings-Streamer live gehen! 
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
      <div className="flex justify-center gap-4">
        <Button
          onClick={toggleSystem}
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
              <CardTitle className="text-sm font-medium text-dark-text">Aktive Streamer</CardTitle>
              <Users className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{stats.totalStreamers}</div>
              <p className="text-xs text-dark-muted">
                {stats.activeStreamers} überwacht
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Benachrichtigungen</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{stats.totalNotifications}</div>
              <p className="text-xs text-dark-muted">
                insgesamt gesendet
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Aktuell Live</CardTitle>
              <Play className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{stats.currentlyLive}</div>
              <p className="text-xs text-dark-muted">
                Streamer online
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Letzte Prüfung</CardTitle>
              <Clock className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{formatLastCheck(stats.lastCheck)}</div>
              <p className="text-xs text-dark-muted">
                alle {settings.checkInterval} Min.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Settings */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-accent" />
            Grundeinstellungen
            <Tooltip 
              title="⚙️ Grundeinstellungen erklärt:"
              content={
                <div>
                  <div>Basis-Konfiguration für das Twitch System</div>
                  <div>• Prüfintervall: Wie oft nach Live-Streams gesucht wird</div>
                  <div>• Kürzere Intervalle = Schnellere Benachrichtigungen</div>
                </div>
              }
            />
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere die Basis-Einstellungen für Twitch Live Notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable & Channel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enabled"
                checked={settings.enabled}
                onChange={(e) => setSettings({...settings, enabled: e.target.checked})}
                className="w-5 h-5 text-purple-primary bg-dark-bg border-purple-primary/30 rounded focus:ring-purple-primary focus:ring-2"
              />
              <label htmlFor="enabled" className="text-sm font-medium text-dark-text">
                Twitch System aktiviert
              </label>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-dark-text">Benachrichtigungs-Channel</label>
                <Tooltip 
                  title="📺 Channel erklärt:"
                  content={
                    <div>
                      <div>Der Channel, in dem Live-Benachrichtigungen</div>
                      <div>gepostet werden (z.B. "live-streams")</div>
                    </div>
                  }
                />
              </div>
              <Input
                value={settings.channels.notificationChannel}
                onChange={(e) => setSettings({...settings, channels: {...settings.channels, notificationChannel: e.target.value}})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                placeholder="live-streams"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-dark-text">Prüfintervall (Minuten)</label>
                <Tooltip 
                  title="⏰ Prüfintervall erklärt:"
                  content={
                    <div>
                      <div>Wie oft das System nach neuen</div>
                      <div>Live-Streams suchen soll</div>
                    </div>
                  }
                />
              </div>
              <select
                value={settings.checkInterval}
                onChange={(e) => setSettings({...settings, checkInterval: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-dark-bg/70 border border-purple-primary/30 rounded-md text-dark-text focus:border-purple-primary focus:outline-none"
              >
                <option value={1}>1 Minute</option>
                <option value={3}>3 Minuten</option>
                <option value={5}>5 Minuten</option>
                <option value={10}>10 Minuten</option>
                <option value={15}>15 Minuten</option>
                <option value={30}>30 Minuten</option>
              </select>
            </div>
          </div>

          {/* Role & Mention Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-dark-text">Rolle erwähnen</label>
                <Tooltip 
                  title="👥 Rolle erwähnen erklärt:"
                  content={
                    <div>
                      <div>Wähle eine Rolle aus, die bei</div>
                      <div>Live-Benachrichtigungen erwähnt wird</div>
                    </div>
                  }
                />
              </div>
              <select
                value={settings.channels.roleToMention || "none"}
                onChange={(e) => setSettings({...settings, channels: {...settings.channels, roleToMention: e.target.value === "none" ? "" : e.target.value}})}
                className="w-full px-3 py-2 bg-dark-bg/70 border border-purple-primary/30 rounded-md text-dark-text focus:border-purple-primary focus:outline-none"
              >
                <option value="none">Keine Rolle</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({role.guildName})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <input
                type="checkbox"
                id="mentionEveryone"
                checked={settings.channels.mentionEveryone}
                onChange={(e) => setSettings({...settings, channels: {...settings.channels, mentionEveryone: e.target.checked}})}
                className="w-5 h-5 text-purple-primary bg-dark-bg border-purple-primary/30 rounded focus:ring-purple-primary focus:ring-2"
              />
              <label htmlFor="mentionEveryone" className="text-sm font-medium text-dark-text">
                @everyone erwähnen
              </label>
              <Tooltip 
                title="⚠️ @everyone warnung:"
                content={
                  <div>
                    <div>Wenn aktiviert, wird bei jeder</div>
                    <div>Live-Benachrichtigung @everyone erwähnt</div>
                  </div>
                }
              />
            </div>
          </div>



            </CardContent>
          </Card>

          {/* Embed Einstellungen */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-accent" />
                Embed Design
                <Tooltip 
                  title="🎨 Embed Design erklärt:"
                  content={
                    <div>
                      <div>Anpassung der Discord-Embeds für Live-Benachrichtigungen</div>
                      <div>• Embed Farbe: Rahmenfarbe des Discord-Embeds</div>
                      <div>• Custom Messages: Verwende {'{'}streamer{'}'} als Platzhalter</div>
                    </div>
                  }
                />
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Passe das Aussehen der Live-Benachrichtigungen an
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Embed Color */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-dark-text">Embed Farbe</label>
                  <Tooltip 
                    title="🎨 Embed Farbe erklärt:"
                    content={
                      <div>
                        <div>Die Farbe des seitlichen Balkens</div>
                        <div>in der Discord Nachricht</div>
                      </div>
                    }
                  />
                </div>
                <div className="flex gap-3 items-center">
                  {/* Color Picker */}
                  <div className="relative">
                    <input
                      type="color"
                      value={settings.embed.color.startsWith('0x') ? `#${settings.embed.color.slice(2)}` : settings.embed.color.startsWith('#') ? settings.embed.color : '#00FF7F'}
                      onChange={(e) => {
                        const hexColor = e.target.value;
                        const discordColor = `0x${hexColor.slice(1).toUpperCase()}`;
                        setSettings(prev => ({...prev, embed: {...prev.embed, color: discordColor}}));
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
                      value={settings.embed.color}
                      onChange={(e) => setSettings(prev => ({...prev, embed: {...prev.embed, color: e.target.value}}))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary font-mono"
                      placeholder="0x00FF7F"
                    />
                  </div>

                  {/* Color Preview */}
                  <div 
                    className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                    style={{
                      backgroundColor: settings.embed.color.startsWith('0x') ? `#${settings.embed.color.slice(2)}` : settings.embed.color.startsWith('#') ? settings.embed.color : '#00FF7F',
                      filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.3))'
                    }}
                  >
                    🎮
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
                        onClick={() => setSettings(prev => ({...prev, embed: {...prev.embed, color: preset.color}}))}
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

              {/* Custom Messages */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Live-Nachricht</Label>
                    <Tooltip 
                      title="📬 Live-Nachricht erklärt:"
                      content={
                        <div>
                          <div>Die Nachricht, die über dem Embed angezeigt wird</div>
                          <div>Verwende {'{'}streamer{'}'} als Platzhalter</div>
                        </div>
                      }
                    />
                  </div>
                  <div className="relative">
                    <Textarea
                      value={settings.embed.customMessage}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        embed: { ...prev.embed, customMessage: e.target.value }
                      }))}
                      placeholder="🔴 **{{streamer}}** ist jetzt LIVE!"
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary pr-10"
                      rows={2}
                    />
                    <button
                      onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'message' ? null : 'message')}
                      className="absolute right-2 top-2 text-dark-muted hover:text-neon-purple transition-colors duration-200 hover:scale-110"
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Stream-Ende Nachricht</Label>
                    <Tooltip 
                      title="📴 Stream-Ende erklärt:"
                      content={
                        <div>
                          <div>Die Nachricht wenn ein Stream beendet wird</div>
                          <div>(nur wenn Offline-Benachrichtigungen aktiviert)</div>
                        </div>
                      }
                    />
                  </div>
                  <div className="relative">
                    <Textarea
                      value={settings.notifications.streamEndedMessage}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, streamEndedMessage: e.target.value }
                      }))}
                      placeholder="📴 **{{streamer}}** hat den Stream beendet!"
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary pr-10"
                      rows={2}
                    />
                    <button
                      onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'endMessage' ? null : 'endMessage')}
                      className="absolute right-2 top-2 text-dark-muted hover:text-neon-purple transition-colors duration-200 hover:scale-110"
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                  </div>
                </div>
              </div>

              {/* Embed Features */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-white">Embed Inhalte</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.embed.showThumbnail}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        embed: { ...prev.embed, showThumbnail: checked }
                      }))}
                    />
                    <div className="flex items-center gap-2">
                      <Label>Stream Thumbnail anzeigen</Label>
                      <Tooltip 
                        title="🖼️ Thumbnail erklärt:"
                        content="Zeigt ein Vorschaubild des Streams im Embed"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.embed.showViewerCount}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        embed: { ...prev.embed, showViewerCount: checked }
                      }))}
                    />
                    <div className="flex items-center gap-2">
                      <Label>Zuschauerzahl anzeigen</Label>
                      <Tooltip 
                        title="👥 Zuschauerzahl erklärt:"
                        content="Zeigt die aktuelle Anzahl der Zuschauer"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.embed.showCategory}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        embed: { ...prev.embed, showCategory: checked }
                      }))}
                    />
                    <div className="flex items-center gap-2">
                      <Label>Spiel/Kategorie anzeigen</Label>
                      <Tooltip 
                        title="🎮 Kategorie erklärt:"
                        content="Zeigt das aktuelle Spiel oder die Kategorie des Streams"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.embed.showUptime}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        embed: { ...prev.embed, showUptime: checked }
                      }))}
                    />
                    <div className="flex items-center gap-2">
                      <Label>Live-Zeit anzeigen</Label>
                      <Tooltip 
                        title="⏰ Live-Zeit erklärt:"
                        content="Zeigt wie lange der Stream bereits läuft"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.embed.includeEmojis}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      embed: { ...prev.embed, includeEmojis: checked }
                    }))}
                  />
                  <div className="flex items-center gap-2">
                    <Label>Zufällige Emojis hinzufügen</Label>
                    <Tooltip 
                      title="🎲 Zufällige Emojis erklärt:"
                      content="Fügt zufällige Emojis aus der Liste zu den Nachrichten hinzu"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Emojis */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Custom Emojis</Label>
                  <Tooltip 
                    title="😀 Custom Emojis erklärt:"
                    content="Liste von Emojis, die zufällig zu Nachrichten hinzugefügt werden"
                  />
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'custom' ? null : 'custom')}
                      className="border-purple-primary text-purple-primary hover:bg-purple-primary hover:text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>

                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-dark-bg/50 rounded border border-purple-primary/30">
                  {settings.embed.customEmojis.map((emoji, index) => (
                    <Badge key={index} className="flex items-center gap-1">
                      {emoji}
                      <button
                        onClick={() => removeEmoji(index)}
                        className="ml-1 text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {settings.embed.customEmojis.length === 0 && (
                    <span className="text-dark-text/50 text-sm">Keine Emojis hinzugefügt</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benachrichtigungs Einstellungen */}
          <Card className="border-purple-primary/30 bg-dark-surface/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">🔔 Benachrichtigungs-Einstellungen</CardTitle>
              <CardDescription className="text-dark-text">
                Konfiguriere wann und wie Benachrichtigungen gesendet werden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.notifications.onlyFirstTime}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, onlyFirstTime: checked }
                      }))}
                    />
                    <div className="flex items-center gap-2">
                      <Label>Nur einmal pro Stream</Label>
                      <Tooltip 
                        title="🔂 Einmal pro Stream erklärt:"
                        content={
                          <div>
                            <div>Sendet nur beim ersten Mal eine Benachrichtigung</div>
                            <div>Nicht wenn der Stream neu gestartet wird</div>
                          </div>
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.notifications.offlineNotification}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, offlineNotification: checked }
                      }))}
                    />
                    <div className="flex items-center gap-2">
                      <Label>Offline-Benachrichtigungen</Label>
                      <Tooltip 
                        title="📴 Offline-Benachrichtigungen erklärt:"
                        content="Sendet eine Benachrichtigung wenn ein Stream beendet wird"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Cooldown (Minuten)</Label>
                    <Tooltip 
                      title="⏱️ Cooldown erklärt:"
                      content={
                        <div>
                          <div>Mindestzeit zwischen wiederholten</div>
                          <div>Benachrichtigungen für denselben Streamer</div>
                        </div>
                      }
                    />
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="1440"
                    value={settings.notifications.cooldown}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, cooldown: parseInt(e.target.value) || 0 }
                    }))}
                    className="bg-dark-bg border-purple-primary/30 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter Einstellungen */}
          <Card className="border-purple-primary/30 bg-dark-surface/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">🎯 Filter & Regeln</CardTitle>
              <CardDescription className="text-dark-text">
                Bestimme welche Streams Benachrichtigungen auslösen sollen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Mindest-Zuschauerzahl</Label>
                  <Tooltip 
                    title="👥 Mindest-Zuschauer erklärt:"
                    content={
                      <div>
                        <div>Streams mit weniger Zuschauern werden ignoriert</div>
                        <div>0 = alle Streams</div>
                      </div>
                    }
                  />
                </div>
                <Input
                  type="number"
                  min="0"
                  value={settings.filters.minViewers}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    filters: { ...prev.filters, minViewers: parseInt(e.target.value) || 0 }
                  }))}
                  className="bg-dark-bg border-purple-primary/30 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Erlaubte Kategorien */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Erlaubte Kategorien</Label>
                    <Tooltip 
                      title="✅ Erlaubte Kategorien erklärt:"
                      content={
                        <div>
                          <div>Nur Streams in diesen Kategorien werden gemeldet</div>
                          <div>Leer = alle erlaubt</div>
                        </div>
                      }
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="z.B. Just Chatting"
                      className="bg-dark-bg border-purple-primary/30 text-white flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addCategory('allowed')}
                    />
                    <Button
                      onClick={() => addCategory('allowed')}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {settings.filters.allowedCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between bg-dark-bg/50 p-2 rounded">
                        <span className="text-dark-text text-sm">{category}</span>
                        <Button
                          onClick={() => removeCategory('allowed', index)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {settings.filters.allowedCategories.length === 0 && (
                      <p className="text-dark-text/50 text-sm p-2">Alle Kategorien erlaubt</p>
                    )}
                  </div>
                </div>

                {/* Blockierte Kategorien */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Blockierte Kategorien</Label>
                    <Tooltip 
                      title="❌ Blockierte Kategorien erklärt:"
                      content="Streams in diesen Kategorien werden ignoriert"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="z.B. Pools, Hot Tubs, and Beaches"
                      className="bg-dark-bg border-purple-primary/30 text-white flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addCategory('blocked')}
                    />
                    <Button
                      onClick={() => addCategory('blocked')}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {settings.filters.blockedCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between bg-dark-bg/50 p-2 rounded">
                        <span className="text-dark-text text-sm">{category}</span>
                        <Button
                          onClick={() => removeCategory('blocked', index)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {settings.filters.blockedCategories.length === 0 && (
                      <p className="text-dark-text/50 text-sm p-2">Keine Kategorien blockiert</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Streamer Management */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-accent" />
                Streamer Management
                <Tooltip 
                  title="👥 Streamer Management erklärt:"
                  content={
                    <div>
                      <div>Verwalte die Streamer, die überwacht werden sollen</div>
                      <div>• URLs werden automatisch erkannt und umgewandelt</div>
                      <div>• Jeder Streamer kann individuelle Einstellungen haben</div>
                    </div>
                  }
                />
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Verwalte die Liste der Streamer, die überwacht werden sollen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Neuen Streamer hinzufügen */}
              <div className="p-4 bg-dark-bg/30 rounded-lg border border-purple-primary/20">
                <h4 className="text-md font-semibold text-white mb-4">Neuen Streamer hinzufügen</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Twitch Username oder URL *</Label>
                      <Tooltip 
                        title="🔗 Twitch Username erklärt:"
                        content={
                          <div>
                            <div>Der Twitch-Username oder die komplette URL</div>
                            <div>(z.B. https://www.twitch.tv/mindofdennis95)</div>
                          </div>
                        }
                      />
                    </div>
                    <Input
                      value={newStreamer.username}
                      onChange={(e) => setNewStreamer(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="z.B. mindofdennis95 oder https://www.twitch.tv/mindofdennis95"
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Anzeigename</Label>
                      <Tooltip 
                        title="👤 Anzeigename erklärt:"
                        content={
                          <div>
                            <div>Optionaler Name für die Anzeige</div>
                            <div>Wenn leer, wird der Username verwendet</div>
                          </div>
                        }
                      />
                    </div>
                    <Input
                      value={newStreamer.displayName}
                      onChange={(e) => setNewStreamer(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="z.B. MontanaBlack"
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <Label>Custom Nachricht</Label>
                      <Tooltip 
                        title="💬 Custom Nachricht erklärt:"
                        content={
                          <div>
                            <div>Spezielle Nachricht nur für diesen Streamer</div>
                            <div>Wenn leer, wird die Standard-Nachricht verwendet</div>
                          </div>
                        }
                      />
                    </div>
                    <Button
                      onClick={() => setAiGeneratorOpen(true)}
                      size="sm"
                      className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-2 px-4 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center gap-1"
                    >
                      <Zap className="w-4 h-4" />
                      KI Generator
                    </Button>
                  </div>
                  <div className="relative">
                    <Textarea
                      value={newStreamer.customMessage}
                      onChange={(e) => setNewStreamer(prev => ({ ...prev, customMessage: e.target.value }))}
                      placeholder="z.B. 🔥 Der König ist LIVE! 🔥"
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary pr-10"
                      rows={2}
                    />
                    <button
                      onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'newStreamerMessage' ? null : 'newStreamerMessage')}
                      className="absolute right-2 top-2 text-dark-muted hover:text-neon-purple transition-colors duration-200 hover:scale-110"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    checked={newStreamer.offlineNotifications}
                    onCheckedChange={(checked) => setNewStreamer(prev => ({ ...prev, offlineNotifications: checked }))}
                  />
                  <div className="flex items-center gap-2">
                    <Label>Offline-Benachrichtigungen für diesen Streamer</Label>
                    <Tooltip content="Sendet auch eine Nachricht wenn dieser Streamer offline geht" />
                  </div>
                </div>

                <Button
                  onClick={addStreamer}
                  className="bg-purple-primary hover:bg-purple-primary/80"
                  disabled={!newStreamer.username.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Streamer hinzufügen
                </Button>
              </div>

              {/* Streamer Liste */}
              <div className="space-y-3">
                <h4 className="text-md font-semibold text-white">
                  Überwachte Streamer ({streamers.length})
                </h4>

                {streamers.length === 0 ? (
                  <div className="text-center py-8 text-dark-text/70">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Streamer hinzugefügt</p>
                    <p className="text-sm">Füge deinen ersten Streamer hinzu, um loszulegen!</p>
                  </div>
                ) : (
                                     <div className="grid grid-cols-1 gap-3">
                     {streamers.map((streamer) => (
                       <div key={streamer.id} className="bg-dark-bg/50 p-4 rounded-lg border border-purple-primary/20 streamer-card-hover">
                        <div className="flex items-center justify-between mb-3">
                                                     <div className="flex items-center gap-3">
                             <div className={`w-3 h-3 rounded-full ${streamer.enabled ? 'bg-green-500 twitch-live-indicator' : 'bg-red-500'}`}></div>
                            <div>
                              <h5 className="font-semibold text-white">
                                {streamer.displayName || streamer.username}
                              </h5>
                              <p className="text-sm text-dark-text/70">
                                @{streamer.username} • {streamer.totalNotifications} Benachrichtigungen
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative group">
                              <Button
                                onClick={() => testNotification(streamer.id)}
                                size="sm"
                                variant="outline"
                                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                              >
                                <TestTube className="w-4 h-4" />
                              </Button>
                              {/* Hover Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-yellow-500/30 rounded-lg text-xs text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                🧪 Test-Benachrichtigung senden
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
                              </div>
                            </div>

                            <div className="relative group">
                              <Switch
                                checked={streamer.enabled}
                                onCheckedChange={(checked) => updateStreamer(streamer.id, { enabled: checked })}
                              />
                              {/* Hover Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-purple-primary/30 rounded-lg text-xs text-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                {streamer.enabled ? '✅ Überwachung aktiviert' : '❌ Überwachung deaktiviert'}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
                              </div>
                            </div>

                            <div className="relative group">
                              <Button
                                onClick={() => openEditModal(streamer)}
                                size="sm"
                                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold transition-all duration-300 hover:scale-105 shadow-blue-glow"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              {/* Hover Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-blue-500/30 rounded-lg text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                ✏️ Streamer bearbeiten
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
                              </div>
                            </div>

                            <div className="relative group">
                              <Button
                                onClick={() => removeStreamer(streamer.id, streamer.displayName || streamer.username)}
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              {/* Hover Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-red-500/30 rounded-lg text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                🗑️ Streamer entfernen
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {streamer.customMessage && (
                          <div className="text-sm text-dark-text/80 bg-dark-bg/30 p-2 rounded">
                            <strong>Custom Message:</strong> {streamer.customMessage}
                          </div>
                        )}

                        {streamer.lastLive && (
                          <div className="text-xs text-dark-text/60 mt-2">
                            Zuletzt live: {new Date(streamer.lastLive).toLocaleString('de-DE')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>



      {/* KI Message Generator Modal */}
      {aiGeneratorOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-purple-glow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-purple-primary" />
                🤖 KI Message Generator
              </h3>
              <button
                onClick={() => setAiGeneratorOpen(false)}
                className="text-dark-muted hover:text-white transition-colors duration-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Spiel/Kategorie */}
              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">🎮 Spiel/Kategorie</label>
                <Input
                  value={aiGeneratorParams.game}
                  onChange={(e) => setAiGeneratorParams(prev => ({ ...prev, game: e.target.value }))}
                  placeholder="z.B. Valorant, Minecraft, Just Chatting..."
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                />
              </div>

              {/* Vibe */}
              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">🎭 Vibe/Stimmung</label>
                <select
                  value={aiGeneratorParams.vibe}
                  onChange={(e) => setAiGeneratorParams(prev => ({ ...prev, vibe: e.target.value }))}
                  className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text rounded-lg px-3 py-2 focus:border-purple-primary"
                >
                  <option value="energetic">⚡ Energetisch</option>
                  <option value="chill">😎 Entspannt</option>
                  <option value="hype">🔥 Hype</option>
                  <option value="professional">👑 Professionell</option>
                  <option value="funny">😂 Lustig</option>
                </select>
              </div>

              {/* Streamer Typ */}
              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">👤 Streamer-Typ</label>
                <select
                  value={aiGeneratorParams.streamerType}
                  onChange={(e) => setAiGeneratorParams(prev => ({ ...prev, streamerType: e.target.value }))}
                  className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text rounded-lg px-3 py-2 focus:border-purple-primary"
                >
                  <option value="gamer">🎮 Pro Gamer</option>
                  <option value="variety">🎭 Variety Streamer</option>
                  <option value="content">📺 Content Creator</option>
                  <option value="community">👥 Community Focused</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Emoji Anzahl */}
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">😀 Emoji Anzahl</label>
                  <select
                    value={aiGeneratorParams.emojiCount}
                    onChange={(e) => setAiGeneratorParams(prev => ({ ...prev, emojiCount: e.target.value }))}
                    className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text rounded-lg px-3 py-2 focus:border-purple-primary"
                  >
                    <option value="few">🙂 Wenige (1-2)</option>
                    <option value="medium">😊 Normal (3-4)</option>
                    <option value="many">🤩 Viele (5+)</option>
                  </select>
                </div>

                {/* Länge */}
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">📏 Nachrichtenlänge</label>
                  <select
                    value={aiGeneratorParams.length}
                    onChange={(e) => setAiGeneratorParams(prev => ({ ...prev, length: e.target.value }))}
                    className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text rounded-lg px-3 py-2 focus:border-purple-primary"
                  >
                    <option value="short">📝 Kurz</option>
                    <option value="medium">📄 Normal</option>
                    <option value="long">📋 Lang</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              {aiGeneratorParams.game && (
                <div className="bg-dark-bg/50 p-4 rounded-lg border border-purple-primary/20">
                  <p className="text-xs text-dark-muted mb-2">🔮 Vorschau-Stil:</p>
                  <p className="text-sm text-purple-accent">
                    {aiGeneratorParams.vibe === 'energetic' && '⚡ Energetische Message mit Action-Fokus'}
                    {aiGeneratorParams.vibe === 'chill' && '😎 Entspannte Message für gemütliche Streams'}
                    {aiGeneratorParams.vibe === 'hype' && '🔥 Hype Message die richtig Aufmerksamkeit zieht'}
                    {aiGeneratorParams.vibe === 'professional' && '👑 Professionelle Message für ernsthafte Streams'}
                    {aiGeneratorParams.vibe === 'funny' && '😂 Lustige Message die zum Lachen bringt'}
                  </p>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => setAiGeneratorOpen(false)}
                variant="outline"
                className="border-dark-muted text-dark-muted hover:bg-dark-muted hover:text-white"
              >
                Abbrechen
              </Button>
              <Button
                onClick={generateAIMessage}
                className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold flex items-center gap-2"
                disabled={!aiGeneratorParams.game.trim()}
              >
                <Zap className="w-4 h-4" />
                Message Generieren
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl p-6 max-w-md mx-4 shadow-purple-glow transform transition-all duration-300 scale-100">
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-dark-text mb-2">
                Streamer entfernen
              </h3>
              
              {/* Message */}
              <p className="text-dark-muted mb-6">
                Möchtest du den Streamer "{deleteModal.streamerName}" wirklich entfernen?
              </p>
              
              {/* Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteModal({ show: false, streamerId: '', streamerName: '' })}
                  className="px-6 py-2 bg-dark-bg border border-purple-primary/30 text-dark-text rounded-lg hover:bg-dark-bg/70 transition-all duration-200"
                >
                  Abbrechen
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Entfernen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Streamer Modal */}
      {editModal.show && editModal.streamer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl p-6 max-w-2xl mx-4 shadow-purple-glow transform transition-all duration-300 scale-100">
            <div className="text-center mb-6">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Edit3 className="w-8 h-8 text-blue-400" />
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-dark-text mb-2">
                Streamer bearbeiten
              </h3>
              
              {/* Subtitle */}
              <p className="text-dark-muted">
                {editModal.streamer.username} ({editModal.streamer.displayName})
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">📺 Anzeigename</label>
                <Input
                  value={editData.displayName}
                  onChange={(e) => setEditData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Anzeigename für Discord..."
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                />
              </div>

                             {/* Custom Message */}
               <div>
                 <div className="flex items-center justify-between mb-2">
                   <label className="text-sm font-medium text-dark-text">💬 Custom Message</label>
                   <Button
                     onClick={() => setEditAiGeneratorOpen(true)}
                     size="sm"
                     className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold transition-all duration-300 hover:scale-105 flex items-center gap-2 text-xs px-3 py-1"
                   >
                     <Zap className="w-3 h-3" />
                     🤖 KI Generator
                   </Button>
                 </div>
                 <div className="relative">
                   <Textarea
                     value={editData.customMessage}
                     onChange={(e) => setEditData(prev => ({ ...prev, customMessage: e.target.value }))}
                     placeholder="Individuelle Nachricht für diesen Streamer (optional)..."
                     rows={3}
                     className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary resize-none pr-10"
                   />
                   <button
                     onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'editStreamerMessage' ? null : 'editStreamerMessage')}
                     className="absolute right-2 top-2 text-dark-muted hover:text-neon-purple transition-colors duration-200 hover:scale-110"
                   >
                     <Smile className="w-5 h-5" />
                   </button>
                 </div>
                 <p className="text-xs text-dark-muted mt-1">
                   Leer lassen um die globale Nachricht zu verwenden
                 </p>
               </div>

              {/* Offline Notifications */}
              <div className="flex items-center justify-between p-4 bg-dark-bg/30 rounded-lg border border-purple-primary/20">
                <div>
                  <Label htmlFor="offline-notifications" className="text-dark-text font-medium">
                    📱 Offline-Benachrichtigungen
                  </Label>
                  <p className="text-xs text-dark-muted mt-1">
                    Benachrichtigung senden wenn Stream beendet wird
                  </p>
                </div>
                <Switch
                  id="offline-notifications"
                  checked={editData.offlineNotifications}
                  onCheckedChange={(checked) => setEditData(prev => ({ ...prev, offlineNotifications: checked }))}
                />
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={() => setEditModal({ show: false, streamer: null })}
                className="px-6 py-2 bg-dark-bg border border-purple-primary/30 text-dark-text rounded-lg hover:bg-dark-bg/70 transition-all duration-200"
              >
                Abbrechen
              </button>
              <button
                onClick={saveStreamerEdit}
                className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-2 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Speichern</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit KI Message Generator Modal */}
      {editAiGeneratorOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-purple-glow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-purple-primary" />
                🤖 KI Custom Message Generator
              </h3>
              <button
                onClick={() => setEditAiGeneratorOpen(false)}
                className="text-dark-muted hover:text-white transition-colors duration-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Spiel/Kategorie */}
              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">🎮 Spiel/Kategorie</label>
                <Input
                  value={aiGeneratorParams.game}
                  onChange={(e) => setAiGeneratorParams(prev => ({ ...prev, game: e.target.value }))}
                  placeholder="z.B. Valorant, Minecraft, Just Chatting..."
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                />
              </div>

              {/* Vibe */}
              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">🎭 Vibe/Stimmung</label>
                <select
                  value={aiGeneratorParams.vibe}
                  onChange={(e) => setAiGeneratorParams(prev => ({ ...prev, vibe: e.target.value }))}
                  className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text rounded-lg px-3 py-2 focus:border-purple-primary"
                >
                  <option value="energetic">⚡ Energetisch</option>
                  <option value="chill">😎 Entspannt</option>
                  <option value="hype">🔥 Hype</option>
                  <option value="professional">👑 Professionell</option>
                  <option value="funny">😂 Lustig</option>
                </select>
              </div>

              {/* Streamer Typ */}
              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">👤 Streamer-Typ</label>
                <select
                  value={aiGeneratorParams.streamerType}
                  onChange={(e) => setAiGeneratorParams(prev => ({ ...prev, streamerType: e.target.value }))}
                  className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text rounded-lg px-3 py-2 focus:border-purple-primary"
                >
                  <option value="gamer">🎮 Pro Gamer</option>
                  <option value="variety">🎭 Variety Streamer</option>
                  <option value="content">📺 Content Creator</option>
                  <option value="community">👥 Community Focused</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Emoji Anzahl */}
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">😀 Emoji Anzahl</label>
                  <select
                    value={aiGeneratorParams.emojiCount}
                    onChange={(e) => setAiGeneratorParams(prev => ({ ...prev, emojiCount: e.target.value }))}
                    className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text rounded-lg px-3 py-2 focus:border-purple-primary"
                  >
                    <option value="few">🙂 Wenige (1-2)</option>
                    <option value="medium">😊 Normal (3-4)</option>
                    <option value="many">🤩 Viele (5+)</option>
                  </select>
                </div>

                {/* Länge */}
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">📏 Nachrichtenlänge</label>
                  <select
                    value={aiGeneratorParams.length}
                    onChange={(e) => setAiGeneratorParams(prev => ({ ...prev, length: e.target.value }))}
                    className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text rounded-lg px-3 py-2 focus:border-purple-primary"
                  >
                    <option value="short">📝 Kurz</option>
                    <option value="medium">📄 Normal</option>
                    <option value="long">📋 Lang</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              {aiGeneratorParams.game && (
                <div className="bg-dark-bg/50 p-4 rounded-lg border border-purple-primary/20">
                  <p className="text-xs text-dark-muted mb-2">🔮 Vorschau-Stil:</p>
                  <p className="text-sm text-purple-accent">
                    {aiGeneratorParams.vibe === 'energetic' && '⚡ Energetische Message mit Action-Fokus'}
                    {aiGeneratorParams.vibe === 'chill' && '😎 Entspannte Message für gemütliche Streams'}
                    {aiGeneratorParams.vibe === 'hype' && '🔥 Hype Message die richtig Aufmerksamkeit zieht'}
                    {aiGeneratorParams.vibe === 'professional' && '👑 Professionelle Message für ernsthafte Streams'}
                    {aiGeneratorParams.vibe === 'funny' && '😂 Lustige Message die zum Lachen bringt'}
                  </p>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => setEditAiGeneratorOpen(false)}
                variant="outline"
                className="border-dark-muted text-dark-muted hover:bg-dark-muted hover:text-white"
              >
                Abbrechen
              </Button>
              <Button
                onClick={generateAIMessageForEdit}
                className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold flex items-center gap-2"
                disabled={!aiGeneratorParams.game.trim()}
              >
                <Zap className="w-4 h-4" />
                Message Generieren
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker Overlays */}
      {emojiPickerOpen === 'message' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                addEmoji(emoji, 'message');
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'endMessage' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                addEmoji(emoji, 'endMessage');
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'custom' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                addEmoji(emoji, 'custom');
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'newStreamerMessage' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                addEmoji(emoji, 'newStreamerMessage');
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'editStreamerMessage' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                addEmoji(emoji, 'editStreamerMessage');
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default TwitchNotifications; 