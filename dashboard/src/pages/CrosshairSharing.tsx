import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast, ToastContainer } from '../components/ui/toast';
import { Save, Target, MessageSquare, Users, Settings, Shield, BarChart3, ArrowUpDown, Copy, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, ExternalLink, Info } from 'lucide-react';

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
    
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-purple-primary/30 rounded-lg text-xs text-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-lg min-w-max">
      {title && <div className="font-medium text-blue-400 mb-1">{title}</div>}
      <div>{content}</div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
    </div>
  </div>
);

// Vote component placeholder
const Vote = ({ className }: { className?: string }) => (
  <ArrowUpDown className={className} />
);

interface CrosshairSettings {
  guild_id: string;
  guild_name: string;
  crosshair_channel_id: string;
  crosshair_channel_name: string;
  // Interactive Panel Settings
  panel_enabled: boolean;
  panel_channel_id: string;
  panel_channel_name: string;
  panel_message_id?: string;
  panel_embed_color: string;
  auto_post_enabled: boolean;
  voting_enabled: boolean;
  require_approval: boolean;
  moderator_role_id: string;
  featured_role_id: string;
  min_votes_for_featured: number;
  webhook_url: string;
  notification_settings: Record<string, any>;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  position: number;
}

interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
}

interface CrosshairShare {
  id: string;
  username: string;
  user_avatar: string;
  crosshair_name: string;
  crosshair_type: string;
  color_hex: string;
  upvotes: number;
  downvotes: number;
  vote_score: number;
  copy_count: number;
  is_featured: boolean;
  created_at: string;
}

const CrosshairSharing = () => {
  const [settings, setSettings] = useState<CrosshairSettings | null>(null);
  const [crosshairs, setCrosshairs] = useState<CrosshairShare[]>([]);
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [guildsLoading, setGuildsLoading] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedGuild, setSelectedGuild] = useState('');
  const { toasts, success, error, removeToast } = useToast();

  // Load Discord guilds on component mount
  useEffect(() => {
    loadDiscordGuilds();
  }, []);

  // Load guild-specific data when guild is selected
  useEffect(() => {
    if (selectedGuild) {
      loadSettings();
      loadCrosshairs();
      loadDiscordChannels();
      loadDiscordRoles();
    }
  }, [selectedGuild]);

  const loadDiscordGuilds = async () => {
    try {
      setGuildsLoading(true);
      
      const response = await fetch('/api/crosshair/discord/guilds');
      const data = await response.json();
      
      if (data.success && data.guilds) {
        setGuilds(data.guilds);
      } else {
        console.warn('❌ Guild loading failed:', data.message);
        setGuilds([]);
        error('Discord Server konnten nicht geladen werden. Stelle sicher, dass der Bot Token konfiguriert ist.');
      }
    } catch (err) {
      console.error('❌ Guild loading error:', err);
      setGuilds([]);
      error('Fehler beim Laden der Discord Server. Prüfe die Bot-Konfiguration.');
          } finally {
        setGuildsLoading(false);
      }
  };

  const loadDiscordChannels = async () => {
    if (!selectedGuild) return;
    
    try {
      setLoadingChannels(true);
      
      console.log('🔄 Loading channels for guild:', selectedGuild);
      const response = await fetch(`/api/crosshair/discord/guilds/${selectedGuild}/channels`);
      const data = await response.json();
      
      console.log('📡 Channels response:', data);
      
      if (data.success && data.channels && Array.isArray(data.channels)) {
        // Filter nur Text-Channels (type 0)
        const textChannels = data.channels.filter(channel => channel.type === 0);
        setChannels(textChannels);
        console.log('✅ Channels loaded:', textChannels.length);
        
        if (textChannels.length === 0) {
          error('Keine Text-Channels gefunden. Bot benötigt "View Channels" Permission.');
        }
      } else {
        console.warn('❌ Channel loading failed:', data.message || 'Unknown error');
        setChannels([]);
        error(data.message || 'Fehler beim Laden der Channels. Prüfe Bot Token und Permissions.');
      }
    } catch (err) {
      console.error('❌ Channel loading error:', err);
      setChannels([]);
      error('Netzwerkfehler beim Laden der Channels. Prüfe API-Verbindung.');
    } finally {
      setLoadingChannels(false);
    }
  };

  const loadDiscordRoles = async () => {
    if (!selectedGuild) return;
    
    try {
      setLoadingRoles(true);
      
      const response = await fetch(`/api/crosshair/discord/guilds/${selectedGuild}/roles`);
      const data = await response.json();
      
      if (data.success && data.roles) {
        setRoles(data.roles);
      } else {
        setRoles([]);
      }
    } catch (err) {
      console.error('❌ Role loading error:', err);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crosshair/settings/${selectedGuild}`);
      const data = await response.json();
      
      if (data.success && data.settings) {
        // Nur laden, wenn noch keine Settings existieren oder sie explizit leer sind
        if (!settings || !settings.crosshair_channel_id) {
          console.log('📥 Loading settings from server:', data.settings);
        setSettings(data.settings);
      } else {
          console.log('🔒 Keeping current settings to preserve user selection');
          // Aktualisiere nur die Server-spezifischen Felder, behalte User-Auswahl
          setSettings(prevSettings => ({
            ...prevSettings,
            guild_id: selectedGuild,
            guild_name: data.settings.guild_name || prevSettings?.guild_name || 'Unknown Guild',
            // Behalte die aktuellen Channel-Settings wenn User bereits etwas ausgewählt hat
            crosshair_channel_id: prevSettings?.crosshair_channel_id || data.settings.crosshair_channel_id || '',
            crosshair_channel_name: prevSettings?.crosshair_channel_name || data.settings.crosshair_channel_name || '',
            // Panel Settings
            panel_enabled: data.settings.panel_enabled ?? false,
            panel_channel_id: prevSettings?.panel_channel_id || data.settings.panel_channel_id || '',
            panel_channel_name: prevSettings?.panel_channel_name || data.settings.panel_channel_name || '',
            panel_message_id: data.settings.panel_message_id || '',
            panel_embed_color: data.settings.panel_embed_color || '#00D4AA',
            // Aber lade andere Settings vom Server
            auto_post_enabled: data.settings.auto_post_enabled ?? true,
            voting_enabled: data.settings.voting_enabled ?? true,
            require_approval: data.settings.require_approval ?? false,
            moderator_role_id: data.settings.moderator_role_id || '',
            featured_role_id: data.settings.featured_role_id || '',
            min_votes_for_featured: data.settings.min_votes_for_featured || 10,
            webhook_url: data.settings.webhook_url || '',
            notification_settings: data.settings.notification_settings || {}
          }));
        }
      } else {
        // Nur Default-Settings setzen, wenn noch keine existieren
        if (!settings) {
        const selectedGuildData = guilds.find(g => g.id === selectedGuild);
          console.log('📝 Setting default settings for new guild');
        setSettings({
          guild_id: selectedGuild,
          guild_name: selectedGuildData?.name || 'Unknown Guild',
          crosshair_channel_id: '',
          crosshair_channel_name: '',
            // Panel Settings
            panel_enabled: false,
            panel_channel_id: '',
            panel_channel_name: '',
            panel_message_id: '',
            panel_embed_color: '#00D4AA',
          auto_post_enabled: true,
          voting_enabled: true,
          require_approval: false,
          moderator_role_id: '',
          featured_role_id: '',
          min_votes_for_featured: 10,
          webhook_url: '',
          notification_settings: {}
        });
        }
      }
    } catch (err) {
      error('Fehler beim Laden der Einstellungen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCrosshairs = async () => {
    try {
      const response = await fetch(`/api/crosshair/list/${selectedGuild}?limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setCrosshairs(data.crosshairs);
      }
    } catch (err) {
      console.error('Error loading crosshairs:', err);
    }
  };

  const saveSettings = async (): Promise<boolean> => {
    if (!settings) return false;

    const MAX_RETRIES = 3;
    let attempt = 0;

    const trySaveSettings = async (): Promise<boolean> => {
    try {
        attempt++;
      setSaving(true);
        
        console.log(`💾 Saving settings (Attempt ${attempt}/${MAX_RETRIES})...`);
        
        const response = await fetch(`/api/crosshair/settings/${selectedGuild}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
          body: JSON.stringify(settings),
          // Timeout nach 10 Sekunden
          signal: AbortSignal.timeout(10000)
      });

        console.log(`📡 Save response: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const data = await response.json();
      if (data.success) {
            success('✅ Einstellungen erfolgreich gespeichert!');
        setSettings(data.settings);
            return true;
      } else {
            throw new Error(data.message || 'Unbekannter Server-Fehler');
          }
        } else {
          // Spezielle Behandlung für verschiedene HTTP-Status-Codes
          if (response.status === 503) {
            throw new Error('Server temporär nicht verfügbar (503). Backend könnte neu starten.');
          } else if (response.status === 500) {
            throw new Error('Interner Server-Fehler (500). Backend hat ein Problem.');
          } else if (response.status === 404) {
            throw new Error('API-Endpoint nicht gefunden (404). Falscher Server?');
          } else if (response.status === 429) {
            throw new Error('Zu viele Anfragen (429). Bitte warte einen Moment.');
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }
      } catch (err: any) {
        console.error(`❌ Save attempt ${attempt} failed:`, err);
        
        if (err.name === 'TimeoutError') {
          throw new Error('Anfrage-Timeout nach 10 Sekunden. Server antwortet nicht.');
        }
        
        throw err;
      }
    };

    // Retry-Logik
    while (attempt < MAX_RETRIES) {
      try {
        const success = await trySaveSettings();
        if (success) {
          return true; // Erfolgreich gespeichert - Boolean zurückgeben!
        }
      } catch (err: any) {
        console.error(`💥 Save attempt ${attempt} failed:`, err.message);
        
        if (attempt < MAX_RETRIES) {
          // Warte zwischen Versuchen (Exponential Backoff)
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          console.log(`⏳ Retry in ${delay}ms...`);
          error(`Versuch ${attempt} fehlgeschlagen. Retry in ${delay/1000}s...`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Alle Versuche fehlgeschlagen
          const errorMessage = err.message || 'Unbekannter Fehler';
          error(`❌ Speichern fehlgeschlagen nach ${MAX_RETRIES} Versuchen: ${errorMessage}`);
          
          // Zeige hilfreiche Tipps
          if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
            setTimeout(() => {
              error('💡 Tipp: Backend könnte neu starten. Versuche es in 1-2 Minuten erneut.');
            }, 2000);
          }
          
          return false; // Fehlgeschlagen - Boolean zurückgeben!
        }
    } finally {
      setSaving(false);
    }
    }
    
    return false; // Fallback: Falls alle Versuche fehlschlagen
  };

  const updateSetting = (key: keyof CrosshairSettings, value: any) => {
    if (!settings) return;
    
    console.log(`🔄 Updating setting: ${key} = ${value}`);
    const newSettings = {
      ...settings,
      [key]: value
    };
    
    setSettings(newSettings);
    
    // Bei Channel-Auswahl sofort Debug-Info
    if (key === 'crosshair_channel_id' || key === 'crosshair_channel_name') {
      console.log('🎯 Channel updated:', { 
        channel_id: newSettings.crosshair_channel_id, 
        channel_name: newSettings.crosshair_channel_name 
      });
    }
  };

  // Spezielle Funktion für Channel-Updates - beide Werte gleichzeitig setzen
  const updateChannelSelection = (channelId: string, channelName: string) => {
    if (!settings) return;
    
    console.log(`🎯 Updating channel selection: ID=${channelId}, Name=${channelName}`);
    const newSettings = {
      ...settings,
      crosshair_channel_id: channelId,
      crosshair_channel_name: channelName
    };
    
    setSettings(newSettings);
    
    console.log('✅ Channel selection updated:', { 
      channel_id: newSettings.crosshair_channel_id, 
      channel_name: newSettings.crosshair_channel_name 
    });
  };

  // Panel Channel Update
  const updatePanelChannelSelection = (channelId: string, channelName: string) => {
    if (!settings) return;
    
    console.log(`🎛️ Updating panel channel selection: ID=${channelId}, Name=${channelName}`);
    const newSettings = {
      ...settings,
      panel_channel_id: channelId,
      panel_channel_name: channelName
    };
    
    setSettings(newSettings);
    
    console.log('✅ Panel channel selection updated:', { 
      panel_channel_id: newSettings.panel_channel_id, 
      panel_channel_name: newSettings.panel_channel_name 
    });
  };

  // Post Interactive Panel to Discord
  const [postingPanel, setPostingPanel] = useState(false);
  const postInteractivePanel = async () => {
    if (!settings?.panel_channel_id?.trim()) {
      error('❌ Bitte zuerst einen Channel für das Interactive Panel konfigurieren!');
      return;
    }

    setPostingPanel(true);
    try {
      // First save settings
      const saveSuccess = await saveSettings();
      if (!saveSuccess) {
        error('❌ Einstellungen konnten nicht gespeichert werden. Panel wird nicht gepostet.');
        return;
      }

      const response = await fetch('/api/crosshair/interactive-panel/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: selectedGuild,
          channelId: settings.panel_channel_id,
          embedColor: settings.panel_embed_color || '#00D4AA'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const actionText = settings.panel_message_id ? 'aktualisiert' : 'erstellt';
        success(`✅ Crosshair Interactive Panel erfolgreich ${actionText}!`);
        
        // Reload settings to get potential new message ID
        loadSettings();
      } else {
        const data = await response.json().catch(() => ({ error: 'Unbekannter Server-Fehler' }));
        error(data.error || 'Fehler beim Verwalten des Interactive Panels');
      }
    } catch (err) {
      console.error('❌ Panel posting error:', err);
      error('Verbindungsfehler beim Erstellen des Interactive Panels');
    } finally {
      setPostingPanel(false);
    }
  };

  if (!selectedGuild) {
    return (
      <div className="space-y-8 p-6 animate-fade-in relative">
        <MatrixBlocks density={20} />
        
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="w-12 h-12 text-purple-accent animate-pulse" />
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
              Crosshair Sharing System
            </h1>
          </div>
          <div className="text-dark-text text-lg max-w-2xl mx-auto">
            Konfiguriere das Discord Crosshair Sharing System für deinen Server wie ein Boss!
          </div>
          <div className="w-32 h-1 bg-gradient-neon mx-auto mt-4 rounded-full animate-glow"></div>
        </div>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-accent" />
              Discord Server auswählen
            </CardTitle>
            <CardDescription className="text-dark-muted">
              Wähle den Server für das Crosshair Sharing System
            </CardDescription>
          </CardHeader>
          <CardContent>
            {guildsLoading ? (
              <div className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-muted rounded-lg p-3 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-accent mr-2"></div>
                Lade Discord Server...
              </div>
            ) : guilds.length === 0 ? (
              <div className="w-full bg-red-900/20 border border-red-500/30 text-red-300 rounded-lg p-3 text-center">
                <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                Keine Discord Server gefunden oder Bot Token fehlt
              </div>
            ) : (
              <select 
                className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text focus:border-neon-purple rounded-lg p-3"
                value={selectedGuild}
                onChange={(e) => setSelectedGuild(e.target.value)}
              >
                <option value="">-- Server auswählen --</option>
                {guilds.map(guild => (
                  <option key={guild.id} value={guild.id}>
                    {guild.icon && '🖼️ '}{guild.name} {guild.owner && '👑'}
                  </option>
                ))}
              </select>
            )}
            
            {guilds.length > 0 && (
              <p className="text-xs text-dark-muted mt-2">
                {guilds.length} Server verfügbar • Nur Server mit Admin-Rechten
              </p> 
            )}
          </CardContent>
        </Card>

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8 p-6 animate-fade-in relative">
        <MatrixBlocks density={20} />
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-accent mx-auto mb-4"></div>
            <p className="text-dark-text text-lg">Einstellungen werden geladen...</p>
          </div>
        </div>

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 animate-fade-in relative">
      <MatrixBlocks density={20} />
      
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Target className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            Crosshair Sharing System
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Verwalte das Discord Crosshair Sharing System für deinen Server wie ein Boss! 
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
        <div className="w-32 h-1 bg-gradient-neon mx-auto mt-4 rounded-full animate-glow"></div>
        
        <div className="mt-6 p-4 bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow rounded-xl max-w-md mx-auto">
          <p className="text-dark-text text-sm mb-2">
            Konfiguration für
          </p>
          <p className="text-purple-accent font-medium text-lg">
            {settings?.guild_name}
          </p>
          <Button
            onClick={() => setSelectedGuild('')}
            className="mt-3 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-2 px-4 rounded-lg shadow-neon transition-all duration-300 hover:scale-105"
          >
            Server wechseln
          </Button>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>{saving ? 'Speichere...' : 'Einstellungen Speichern'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-accent" />
                Grundeinstellungen
                <Tooltip 
                  title="⚙️ Grundeinstellungen erklärt:"
                  content={
                    <div>
                      <div>Basis-Konfiguration für das Crosshair Sharing:</div>
                      <div>• Channel: Wo Crosshairs automatisch gepostet werden</div>
                      <div>• Webhook: Für automatisches Posten ohne Bot-Status</div>
                      <div>• Auto-Post: Crosshairs automatisch posten</div>
                      <div>• Voting: Abstimmungssystem aktivieren</div>
                    </div>
                  }
                />
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Basis-Konfiguration für das Crosshair-System
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block flex items-center justify-between">
                    <span>Crosshair Channel</span>
                    <button
                      onClick={() => {
                        if (selectedGuild) {
                          loadDiscordChannels();
                          success('Channels werden neu geladen...');
                        }
                      }}
                      className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors"
                      disabled={loadingChannels}
                    >
                      {loadingChannels ? '🔄' : '🔄 Refresh'}
                    </button>
                  </label>
                  
                  {loadingChannels ? (
                    <div className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-muted rounded-lg p-2 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-accent mr-2"></div>
                      Lade Channels... (Guild: {selectedGuild?.slice(-4)})
                    </div>
                  ) : channels.length > 0 ? (
                    <div>
                    <select
                      className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text focus:border-neon-purple rounded-lg p-2"
                      value={settings?.crosshair_channel_id || ''}
                      onChange={(e) => {
                        const selectedChannel = channels.find(c => c.id === e.target.value);
                          const channelName = selectedChannel?.name || '';
                          
                          // Verwende die neue Funktion für beide Werte gleichzeitig
                          updateChannelSelection(e.target.value, channelName);
                          
                          if (selectedChannel) {
                            success(`Channel #${selectedChannel.name} ausgewählt!`);
                          }
                      }}
                    >
                      <option value="">-- Channel auswählen --</option>
                      {channels.map(channel => (
                        <option key={channel.id} value={channel.id}>
                          #{channel.name}
                        </option>
                      ))}
                    </select>
                      <p className="text-xs text-dark-muted mt-1">
                        {channels.length} Text-Channels verfügbar • Bot benötigt "View Channels" Permission
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-full bg-orange-900/20 border border-orange-500/30 text-orange-300 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">Keine Channels gefunden</span>
                        </div>
                        <div className="text-xs space-y-1">
                          <div>• Bot Token konfiguriert?</div>
                          <div>• Bot im Server hinzugefügt?</div>
                          <div>• "View Channels" Permission?</div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          if (selectedGuild) {
                            loadDiscordChannels();
                          } else {
                            error('Bitte wähle zuerst einen Discord Server aus.');
                          }
                        }}
                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        disabled={loadingChannels}
                      >
                        🔄 Channels erneut laden
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">
                    Webhook URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={settings?.webhook_url || ''}
                    onChange={(e) => updateSetting('webhook_url', e.target.value)}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                  />
                </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-dark-text">Auto-Post aktiviert</label>
                    <Switch
                      checked={settings?.auto_post_enabled || false}
                      onCheckedChange={(checked) => updateSetting('auto_post_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-dark-text">Voting System aktiviert</label>
                    <Switch
                      checked={settings?.voting_enabled || false}
                      onCheckedChange={(checked) => updateSetting('voting_enabled', checked)}
                    />
                  </div>
                </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-cyan-500/30 shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                Interactive Panel
                <Tooltip 
                  title="🎛️ Interactive Panel erklärt:"
                  content={
                    <div>
                      <div>Discord Panel mit interaktiven Buttons:</div>
                      <div>• 🎯 Crosshair Creator direkt in Discord</div>
                      <div>• 👥 Community Voting & Sharing</div>
                      <div>• 📤 Direktes Posten in separatem Channel</div>
                      <div>• 🔄 Real-time Updates</div>
                    </div>
                  }
                />
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Interaktives Discord Panel für Crosshair-Management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-dark-text">Panel aktiviert</label>
                    <p className="text-xs text-dark-muted">Interactive Discord Panel einschalten</p>
                  </div>
                  <Switch
                    checked={settings?.panel_enabled || false}
                    onCheckedChange={(checked) => updateSetting('panel_enabled', checked)}
                  />
                </div>

                {settings?.panel_enabled && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block flex items-center justify-between">
                        <span>Panel Channel</span>
                        <button
                          onClick={() => {
                            if (selectedGuild) {
                              loadDiscordChannels();
                              success('Channels werden neu geladen...');
                            }
                          }}
                          className="text-xs px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-white transition-colors"
                          disabled={loadingChannels}
                        >
                          {loadingChannels ? '🔄' : '🔄 Refresh'}
                        </button>
                      </label>
                      
                      {loadingChannels ? (
                        <div className="w-full bg-dark-bg/70 border border-cyan-500/30 text-dark-muted rounded-lg p-2 flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400 mr-2"></div>
                          Lade Channels...
                        </div>
                      ) : channels.length > 0 ? (
                        <div>
                          <select
                            className="w-full bg-dark-bg/70 border border-cyan-500/30 text-dark-text focus:border-cyan-400 rounded-lg p-2"
                            value={settings?.panel_channel_id || ''}
                            onChange={(e) => {
                              const selectedChannel = channels.find(c => c.id === e.target.value);
                              const channelName = selectedChannel?.name || '';
                              
                              updatePanelChannelSelection(e.target.value, channelName);
                              
                              if (selectedChannel) {
                                success(`Panel Channel #${selectedChannel.name} ausgewählt!`);
                              }
                            }}
                          >
                            <option value="">-- Panel Channel auswählen --</option>
                            {channels.map(channel => (
                              <option key={channel.id} value={channel.id}>
                                #{channel.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-dark-muted mt-1">
                            {channels.length} Text-Channels verfügbar • Panel wird hier gepostet
                          </p>
                        </div>
                      ) : (
                        <div className="w-full bg-orange-900/20 border border-orange-500/30 text-orange-300 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">Keine Channels gefunden</span>
                          </div>
                          <div className="text-xs">Bot benötigt "View Channels" Permission</div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-dark-text mb-2 block">
                        Panel Farbe
                      </label>
                      <input
                        type="color"
                        value={settings?.panel_embed_color || '#00D4AA'}
                        onChange={(e) => updateSetting('panel_embed_color', e.target.value)}
                        className="w-full h-10 rounded-lg cursor-pointer"
                      />
                      <p className="text-xs text-dark-muted mt-1">
                        Farbe für das Discord Embed des Panels
                      </p>
                    </div>

                    {settings?.panel_message_id && (
                      <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-medium">Panel aktiv</span>
                        </div>
                        <p className="text-xs text-green-300">
                          Message ID: {settings.panel_message_id}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        onClick={postInteractivePanel}
                        disabled={postingPanel || !settings?.panel_channel_id}
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-neon transition-all duration-300 hover:scale-105"
                      >
                        {postingPanel ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Poste Panel...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {settings?.panel_message_id ? 'Panel aktualisieren' : 'Panel posten'}
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-accent" />
                Moderation
                <Tooltip 
                  title="🛡️ Moderation erklärt:"
                  content={
                    <div>
                      <div>Moderations-Einstellungen für Crosshairs:</div>
                      <div>• Approval: Crosshairs müssen genehmigt werden</div>
                      <div>• Moderator Role: Rolle mit Moderations-Rechten</div>
                      <div>• Featured Role: Rolle für Featured Crosshairs</div>
                      <div>• Min Votes: Mindest-Votes für Auto-Featured</div>
                    </div>
                  }
                />
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Moderations-Einstellungen und Rollen-Konfiguration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-dark-text">Moderation erforderlich</label>
                    <p className="text-xs text-dark-muted">Crosshairs müssen genehmigt werden</p>
                  </div>
                  <Switch
                    checked={settings?.require_approval || false}
                    onCheckedChange={(checked) => updateSetting('require_approval', checked)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">
                    Moderator Role
                  </label>
                  {roles.length > 0 ? (
                    <select
                      className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text focus:border-neon-purple rounded-lg p-2"
                      value={settings?.moderator_role_id || ''}
                      onChange={(e) => updateSetting('moderator_role_id', e.target.value)}
                    >
                      <option value="">-- Keine Moderator Role --</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          @{role.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-muted rounded-lg p-2 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-accent mr-2"></div>
                      Lade Rollen...
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Featured Role
                  </label>
                  {roles.length > 0 ? (
                    <select
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={settings?.featured_role_id || ''}
                      onChange={(e) => updateSetting('featured_role_id', e.target.value)}
                    >
                      <option value="">-- Keine Featured Role --</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          @{role.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                      Lade Rollen...
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    User mit dieser Role können Crosshairs als Featured markieren
                  </p>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Min. Votes für Featured
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={settings?.min_votes_for_featured || 10}
                    onChange={(e) => updateSetting('min_votes_for_featured', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={saveSettings}
            disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Speichern...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Einstellungen speichern
              </>
            )}
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-green-400" />
                  <CardTitle className="text-xl font-bold text-white">Neueste Crosshairs</CardTitle>
                </div>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Alle anzeigen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {crosshairs.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">Noch keine Crosshairs geteilt</p>
                    <p className="text-sm text-gray-500 mt-1">Crosshairs erscheinen hier nach dem ersten Share</p>
                  </div>
                ) : (
                  crosshairs.map((crosshair) => (
                    <div key={crosshair.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <Target className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{crosshair.crosshair_name || 'Unnamed'}</span>
                            {crosshair.is_featured && (
                              <span className="px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded-full">
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            von {crosshair.username} • {crosshair.crosshair_type}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-green-400">
                          <Vote className="w-4 h-4" />
                          <span>{crosshair.vote_score}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-400">
                          <Copy className="w-4 h-4" />
                          <span>{crosshair.copy_count}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-900/20 border-blue-500/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6 text-blue-400" />
                <CardTitle className="text-xl font-bold text-white">Setup Anleitung</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <p className="text-white font-medium">Discord Webhook erstellen</p>
                    <p className="text-gray-300">Server Settings → Integrations → Webhooks → New Webhook</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <p className="text-white font-medium">Channel ID kopieren</p>
                    <p className="text-gray-300">Rechtsklick auf Channel → Copy ID (Developer Mode erforderlich)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <p className="text-white font-medium">Bot Permissions</p>
                    <p className="text-gray-300">Send Messages, Embed Links, Attach Files, Add Reactions</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <div>
                    <p className="text-white font-medium">Einstellungen speichern</p>
                    <p className="text-gray-300">Webhook URL und Channel ID eingeben und speichern</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {(!settings?.webhook_url || !settings?.crosshair_channel_id) && (
            <Card className="bg-orange-900/20 border-orange-500/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-orange-400" />
                  <CardTitle className="text-lg font-bold text-white">Konfiguration unvollständig</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-orange-200">
                  Webhook URL und Channel ID sind erforderlich für das automatische Posten von Crosshairs.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default CrosshairSharing; 