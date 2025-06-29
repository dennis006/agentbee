import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Target, Settings, MessageSquare, Users, Vote, Copy, Check, X, ExternalLink, AlertCircle, Info } from 'lucide-react';
import { useToast } from '../components/ui/toast';

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
  const { success, error } = useToast();

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
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <Target className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">Crosshair Sharing Settings</h1>
          <p className="text-gray-300 mb-8">Discord Server für Crosshair Sharing konfigurieren</p>
          
          <div className="max-w-md mx-auto">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Discord Server auswählen
            </label>
            
            {guildsLoading ? (
              <div className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-400 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400 mr-2"></div>
                Lade Discord Server...
              </div>
            ) : guilds.length === 0 ? (
              <div className="w-full px-4 py-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-center">
                <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                Keine Discord Server gefunden oder Bot Token fehlt
              </div>
            ) : (
              <select 
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <p className="text-xs text-gray-400 mt-2">
                {guilds.length} Server verfügbar • Nur Server mit Admin-Rechten
              </p> 
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Einstellungen werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <Target className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Crosshair Sharing Settings</h1>
        <p className="text-gray-300">
          Konfiguration für <span className="text-purple-400 font-medium">{settings?.guild_name}</span>
        </p>
        <Button
          onClick={() => setSelectedGuild('')}
          variant="outline"
          className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          Server wechseln
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Basic Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Grundeinstellungen</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Crosshair Channel
                  </label>
                  {channels.length > 0 ? (
                    <select
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    <div className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400 mr-2"></div>
                      Lade Channels...
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Channel wo Crosshairs automatisch gepostet werden
                  </p>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Discord Webhook URL
                  </label>
                  <input
                    type="url"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={settings?.webhook_url || ''}
                    onChange={(e) => updateSetting('webhook_url', e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Webhook für das automatische Posten von Crosshairs
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Auto-Post
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings?.auto_post_enabled || false}
                        onChange={(e) => updateSetting('auto_post_enabled', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-300">Aktiviert</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Voting
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings?.voting_enabled || false}
                        onChange={(e) => updateSetting('voting_enabled', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-300">Aktiviert</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Moderation Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Moderation</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Moderation erforderlich
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings?.require_approval || false}
                      onChange={(e) => updateSetting('require_approval', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">Crosshairs müssen genehmigt werden</span>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Moderator Role
                  </label>
                  {roles.length > 0 ? (
                    <select
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <div className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
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
    </div>
  );
};

export default CrosshairSharing; 