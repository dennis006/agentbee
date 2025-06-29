import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast, ToastContainer } from '../components/ui/toast';
import { Save, Target, MessageSquare, Users, Settings, Shield, BarChart3, ArrowUpDown, Copy, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

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
    
    {/* Tooltip */}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-purple-primary/30 rounded-lg text-xs text-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-lg min-w-max">
      {title && <div className="font-medium text-blue-400 mb-1">{title}</div>}
      <div>{content}</div>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
    </div>
  </div>
);

interface CrosshairSettings {
  guild_id: string;
  guild_name: string;
  crosshair_channel_id: string;
  crosshair_channel_name: string;
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
      const apiUrl = import.meta.env.VITE_API_URL || 'https://agentbee.up.railway.app';
      
      // Use repaired crosshair-specific guilds endpoint
      const response = await fetch(`${apiUrl}/api/crosshair/discord/guilds`);
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
      const apiUrl = import.meta.env.VITE_API_URL || 'https://agentbee.up.railway.app';
      
      // Use crosshair-specific channels endpoint
      const response = await fetch(`${apiUrl}/api/crosshair/discord/guilds/${selectedGuild}/channels`);
      const data = await response.json();
      
      if (data.success && data.channels) {
        setChannels(data.channels);
      } else {
        setChannels([]);
      }
    } catch (err) {
      console.error('❌ Channel loading error:', err);
      setChannels([]);
    } finally {
      setLoadingChannels(false);
    }
  };

  const loadDiscordRoles = async () => {
    if (!selectedGuild) return;
    
    try {
      setLoadingRoles(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'https://agentbee.up.railway.app';
      
      // Use crosshair-specific roles endpoint
      const response = await fetch(`${apiUrl}/api/crosshair/discord/guilds/${selectedGuild}/roles`);
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
      const apiUrl = import.meta.env.VITE_API_URL || 'https://agentbee.up.railway.app';
      const response = await fetch(`${apiUrl}/api/crosshair/settings/${selectedGuild}`);
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
      } else {
        // No settings found, use defaults
        const selectedGuildData = guilds.find(g => g.id === selectedGuild);
        setSettings({
          guild_id: selectedGuild,
          guild_name: selectedGuildData?.name || 'Unknown Guild',
          crosshair_channel_id: '',
          crosshair_channel_name: '',
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
    } catch (err) {
      error('Fehler beim Laden der Einstellungen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCrosshairs = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://agentbee.up.railway.app';
      const response = await fetch(`${apiUrl}/api/crosshair/list/${selectedGuild}?limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setCrosshairs(data.crosshairs);
      }
    } catch (err) {
      console.error('Error loading crosshairs:', err);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'https://agentbee.up.railway.app';
      const response = await fetch(`${apiUrl}/api/crosshair/settings/${selectedGuild}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.success) {
        success('Einstellungen erfolgreich gespeichert!');
        setSettings(data.settings);
      } else {
        error(data.message || 'Fehler beim Speichern');
      }
    } catch (err) {
      error('Fehler beim Speichern der Einstellungen');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof CrosshairSettings, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: value
    });
  };

  if (!selectedGuild) {
    return (
      <div className="space-y-8 p-6 animate-fade-in relative">
        {/* Matrix Background Effects */}
        <MatrixBlocks density={20} />
        
        {/* Page Header */}
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

        {/* Guild Selection */}
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

        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8 p-6 animate-fade-in relative">
        {/* Matrix Background Effects */}
        <MatrixBlocks density={20} />
        
        {/* Loading */}
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-accent mx-auto mb-4"></div>
            <p className="text-dark-text text-lg">Einstellungen werden geladen...</p>
          </div>
        </div>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
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
        
        {/* Guild Info */}
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

      {/* Quick Actions */}
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
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Basic Settings */}
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
                  <label className="text-sm font-medium text-dark-text mb-2 block">
                    Crosshair Channel
                  </label>
                  {channels.length > 0 ? (
                    <select
                      className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text focus:border-neon-purple rounded-lg p-2"
                      value={settings?.crosshair_channel_id || ''}
                      onChange={(e) => {
                        const selectedChannel = channels.find(c => c.id === e.target.value);
                        updateSetting('crosshair_channel_id', e.target.value);
                        updateSetting('crosshair_channel_name', selectedChannel?.name || '');
                      }}
                    >
                      <option value="">-- Channel auswählen --</option>
                      {channels.map(channel => (
                        <option key={channel.id} value={channel.id}>
                          #{channel.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-muted rounded-lg p-2 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-accent mr-2"></div>
                      Lade Channels...
                    </div>
                  )}
                  <p className="text-xs text-dark-muted mt-1">
                    Channel wo Crosshairs automatisch gepostet werden
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">
                    Discord Webhook URL
                  </label>
                  <Input
                    type="url"
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={settings?.webhook_url || ''}
                    onChange={(e) => updateSetting('webhook_url', e.target.value)}
                  />
                  <p className="text-xs text-dark-muted mt-1">
                    Webhook für das automatische Posten von Crosshairs
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Moderation Settings */}
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
            </div>
          </Card>

          {/* Save Button */}
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
                <Check className="w-4 h-4 mr-2" />
                Einstellungen speichern
              </>
            )}
          </Button>
        </div>

        {/* Preview & Stats */}
        <div className="space-y-6">
          {/* Recent Crosshairs */}
          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-green-400" />
                  <h2 className="text-xl font-bold text-white">Neueste Crosshairs</h2>
                </div>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Alle anzeigen
                </Button>
              </div>

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
            </div>
          </Card>

          {/* Setup Guide */}
          <Card className="bg-blue-900/20 border-blue-500/30">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Setup Anleitung</h2>
              </div>

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
            </div>
          </Card>

          {/* Warning */}
          {(!settings?.webhook_url || !settings?.crosshair_channel_id) && (
            <Card className="bg-orange-900/20 border-orange-500/30">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="w-6 h-6 text-orange-400" />
                  <h3 className="text-lg font-bold text-white">Konfiguration unvollständig</h3>
                </div>
                <p className="text-orange-200">
                  Webhook URL und Channel ID sind erforderlich für das automatische Posten von Crosshairs.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default CrosshairSharing; 