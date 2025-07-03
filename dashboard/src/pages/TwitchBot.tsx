import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Settings, Plus, Trash2, Save, Play, Pause, TestTube, Users, MessageSquare, Clock, Smile, Bot, Zap, Edit3, Monitor, Hash, Power, Link } from 'lucide-react';
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

// Interfaces
interface TwitchBotSettings {
  botEnabled: boolean;
  botUsername: string;
  oauthToken: string;
  autoConnect: boolean;
  reconnectAttempts: number;
  commandPrefix: string;
  modCommandsOnly: boolean;
  allowedRoles: string[];
  blockedUsers: string[];
  globalCooldown: number;
  liveNotificationsEnabled: boolean;
  liveMessageCooldown: number;
}

interface TwitchBotChannel {
  id: string;
  channelName: string;
  channelId: string;
  enabled: boolean;
  autoJoin: boolean;
  discordChannelId: string;
  syncMessages: boolean;
  welcomeMessage: string;
  followMessage: string;
  subMessage: string;
  donationMessage: string;
  raidMessage: string;
  hostMessage: string;
  liveMessageEnabled: boolean;
  liveMessageTemplate: string;
  useCustomLiveMessage: boolean;
  liveMessageVariables: { [key: string]: boolean };
  totalCommands: number;
}

interface TwitchBotStats {
  totalChannels: number;
  activeChannels: number;
  totalCommands: number;
  messagesLast24h: number;
  commandsUsedLast24h: number;
  isConnected: boolean;
  uptime: string;
}

interface LiveMessageTemplate {
  id: string;
  name: string;
  template: string;
  description: string;
  category: string;
  variables: string[];
  usageCount: number;
  isDefault: boolean;
  enabled: boolean;
  createdAt: string;
}

// Commands Interface
interface Command {
  id: string;
  commandName: string;
  responseText: string;
  description: string;
  enabled: boolean;
  cooldownSeconds: number;
  usesCount: number;
  modOnly: boolean;
  vipOnly: boolean;
  subscriberOnly: boolean;
  category: {
    name: string;
    icon: string;
    color: string;
  };
  createdBy: string;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
}

// Commands Section Component
const TwitchBotCommandsSection: React.FC = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    commandName: '',
    responseText: '',
    description: '',
    enabled: true,
    cooldownSeconds: 0,
    modOnly: false,
    vipOnly: false,
    subscriberOnly: false,
    categoryId: 6
  });

  useEffect(() => {
    loadCommands();
    loadCategories();
  }, []);

  const loadCommands = async () => {
    try {
      const response = await fetch('/api/twitch-bot/commands');
      const data = await response.json();
      
      if (data.success) {
        setCommands(data.commands || []);
      }
    } catch (error) {
      console.error('Error loading commands:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/twitch-bot/command-categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.commandName.trim() || !formData.responseText.trim()) {
      alert('Command-Name und Response-Text sind erforderlich');
      return;
    }

    try {
      const url = editingCommand 
        ? `/api/twitch-bot/commands/${editingCommand.id}` 
        : '/api/twitch-bot/commands';
      
      const method = editingCommand ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setShowModal(false);
        resetForm();
        loadCommands();
      } else {
        alert(`Fehler: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving command:', error);
      alert('Fehler beim Speichern des Commands');
    }
  };

  const handleDelete = async (commandId: string, commandName: string) => {
    if (!confirm(`Command !${commandName} wirklich löschen?`)) return;

    try {
      const response = await fetch(`/api/twitch-bot/commands/${commandId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        loadCommands();
      } else {
        alert(`Fehler: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting command:', error);
      alert('Fehler beim Löschen des Commands');
    }
  };

  const handleEdit = (command: Command) => {
    setEditingCommand(command);
    setFormData({
      commandName: command.commandName,
      responseText: command.responseText,
      description: command.description,
      enabled: command.enabled,
      cooldownSeconds: command.cooldownSeconds,
      modOnly: command.modOnly,
      vipOnly: command.vipOnly,
      subscriberOnly: command.subscriberOnly,
      categoryId: categories.find(cat => cat.name === command.category.name)?.id || 6
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCommand(null);
    setFormData({
      commandName: '',
      responseText: '',
      description: '',
      enabled: true,
      cooldownSeconds: 0,
      modOnly: false,
      vipOnly: false,
      subscriberOnly: false,
      categoryId: 6
    });
  };

  const filteredCommands = commands.filter(cmd => 
    cmd.commandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-primary mx-auto mb-4"></div>
            <p className="text-dark-text">Lade Commands...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-accent" />
            Custom Commands
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Verwalte benutzerdefinierte Commands für den Twitch Bot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search & Add */}
          <div className="flex gap-4 items-center justify-between">
            <Input
              placeholder="Commands durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
            />
            
            <Button 
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-purple-primary hover:bg-purple-primary/80"
            >
              <Plus className="w-4 h-4 mr-2" />
              Neuer Command
            </Button>
          </div>

          {/* Commands Grid */}
          {filteredCommands.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 mx-auto mb-4 text-purple-accent/50" />
              <h3 className="text-lg font-semibold text-dark-text mb-2">
                {searchTerm ? 'Keine Commands gefunden' : 'Keine Commands erstellt'}
              </h3>
              <p className="text-dark-muted mb-4">
                {searchTerm 
                  ? 'Versuche andere Suchbegriffe oder erstelle einen neuen Command'
                  : 'Erstelle deinen ersten Custom Command für den Bot'
                }
              </p>
              <Button 
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="bg-purple-primary hover:bg-purple-primary/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ersten Command erstellen
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCommands.map((command) => (
                <div key={command.id} className="bg-dark-bg/50 p-4 rounded-lg border border-purple-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{command.category.icon}</span>
                      <h3 className="font-bold text-white">!{command.commandName}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {!command.enabled && (
                        <Badge variant="outline" className="text-xs text-red-400 border-red-400">
                          Deaktiviert
                        </Badge>
                      )}
                      {command.createdBy === 'system' && (
                        <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500">
                          System
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-dark-muted mb-3">{command.description}</p>

                  <div className="bg-dark-bg/30 p-3 rounded mb-3">
                    <p className="text-sm text-dark-text line-clamp-2">
                      {command.responseText.length > 80 
                        ? `${command.responseText.substring(0, 80)}...` 
                        : command.responseText
                      }
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-muted">Cooldown:</span>
                      <span className="text-dark-text">{command.cooldownSeconds}s</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-muted">Nutzung:</span>
                      <span className="text-dark-text">{command.usesCount}x</span>
                    </div>

                    {/* Permissions */}
                    <div className="flex gap-1 flex-wrap">
                      {command.modOnly && (
                        <Badge variant="outline" className="text-xs text-red-400 border-red-400">
                          🛡️ Mod
                        </Badge>
                      )}
                      {command.vipOnly && (
                        <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                          ⭐ VIP
                        </Badge>
                      )}
                      {command.subscriberOnly && (
                        <Badge variant="outline" className="text-xs text-purple-400 border-purple-400">
                          💎 Sub
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-purple-primary/20">
                    <Button
                      onClick={() => handleEdit(command)}
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Bearbeiten
                    </Button>
                    
                    {command.createdBy !== 'system' && (
                      <Button
                        onClick={() => handleDelete(command.id, command.commandName)}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Command Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-dark-surface rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-purple-primary/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingCommand ? '✏️ Command bearbeiten' : '➕ Neuer Command'}
              </h2>
              <Button 
                onClick={() => setShowModal(false)}
                className="text-dark-muted hover:text-white"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-dark-text">Command Name *</Label>
                  <Input
                    value={formData.commandName}
                    onChange={(e) => setFormData(prev => ({ ...prev, commandName: e.target.value }))}
                    placeholder="discord"
                    disabled={!!editingCommand}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                    required
                  />
                  <p className="text-xs text-dark-muted mt-1">Ohne ! - nur Buchstaben, Zahlen, _</p>
                </div>

                <div>
                  <Label className="text-dark-text">Kategorie</Label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-dark-bg/70 border border-purple-primary/30 rounded-md text-dark-text focus:border-purple-primary"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-dark-text">Response Text *</Label>
                <Textarea
                  value={formData.responseText}
                  onChange={(e) => setFormData(prev => ({ ...prev, responseText: e.target.value }))}
                  placeholder="Join unseren Discord: https://discord.gg/example"
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                  rows={3}
                  required
                />
                <p className="text-xs text-dark-muted mt-1">
                  Verfügbare Variablen: {"`{{user}}, {{channel}}, {{time}}, {{date}}`"}
                </p>
              </div>

              <div>
                <Label className="text-dark-text">Beschreibung</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Discord Server Link"
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-dark-text">Cooldown (Sekunden)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.cooldownSeconds}
                    onChange={(e) => setFormData(prev => ({ ...prev, cooldownSeconds: parseInt(e.target.value) || 0 }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                    placeholder="0 = kein Cooldown"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                  />
                  <Label className="text-dark-text">Aktiviert</Label>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Berechtigungen</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.modOnly}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, modOnly: checked }))}
                    />
                    <Label className="text-dark-text">🛡️ Nur Mods</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.vipOnly}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, vipOnly: checked }))}
                    />
                    <Label className="text-dark-text">⭐ Nur VIPs</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.subscriberOnly}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, subscriberOnly: checked }))}
                    />
                    <Label className="text-dark-text">💎 Nur Subs</Label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-purple-primary/20">
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-purple-primary hover:bg-purple-primary/80 text-white"
                >
                  {editingCommand ? 'Aktualisieren' : 'Erstellen'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TwitchBot: React.FC = () => {
  const [settings, setSettings] = useState<TwitchBotSettings>({
    botEnabled: false,
    botUsername: '',
    oauthToken: '',
    autoConnect: true,
    reconnectAttempts: 3,
    commandPrefix: '!',
    modCommandsOnly: false,
    allowedRoles: [],
    blockedUsers: [],
    globalCooldown: 3,
    liveNotificationsEnabled: true,
    liveMessageCooldown: 0
  });

  const [channels, setChannels] = useState<TwitchBotChannel[]>([]);
  const [liveTemplates, setLiveTemplates] = useState<LiveMessageTemplate[]>([]);
  const [stats, setStats] = useState<TwitchBotStats>({
    totalChannels: 0,
    activeChannels: 0,
    totalCommands: 0,
    messagesLast24h: 0,
    commandsUsedLast24h: 0,
    isConnected: false,
    uptime: '0s'
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newChannel, setNewChannel] = useState({
    channelName: '',
    discordChannelId: '',
    syncMessages: false,
    liveMessageEnabled: true,
    liveMessageTemplate: '🔴 Stream ist LIVE! Willkommen alle! 🎉',
    useCustomLiveMessage: false
  });

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    template: '',
    description: '',
    category: 'custom'
  });

  const [editingTemplate, setEditingTemplate] = useState<LiveMessageTemplate | null>(null);

  const { toasts, removeToast, success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Parallel alle Daten laden
      const [settingsRes, channelsRes, statsRes, templatesRes] = await Promise.all([
        fetch('/api/twitch-bot/settings'),
        fetch('/api/twitch-bot/channels'),
        fetch('/api/twitch-bot/stats'),
        fetch('/api/twitch-bot/live-templates')
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.success) {
          setSettings(data.settings);
        }
      }

      if (channelsRes.ok) {
        const data = await channelsRes.json();
        if (data.success) {
          setChannels(data.channels);
        }
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data.success) {
          setStats(data.stats);
        }
      }

      if (templatesRes.ok) {
        const data = await templatesRes.json();
        if (data.success) {
          setLiveTemplates(data.templates);
        }
      }

    } catch (error) {
      console.error('❌ Fehler beim Laden der Twitch Bot Daten:', error);
      showError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const res = await fetch('/api/twitch-bot/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await res.json();
      
      if (data.success) {
        showSuccess('Bot-Einstellungen erfolgreich gespeichert!');
      } else {
        showError(data.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      showError('Fehler beim Speichern der Einstellungen');
    }
  };

  const toggleBot = async () => {
    try {
      const res = await fetch('/api/twitch-bot/toggle', {
        method: 'POST'
      });

      const data = await res.json();
      
      if (data.success) {
        setSettings(prev => ({ ...prev, botEnabled: data.enabled }));
        showSuccess(data.message);
        // Stats nach Toggle aktualisieren
        loadData();
      } else {
        showError(data.error || 'Fehler beim Bot-Toggle');
      }
    } catch (error) {
      console.error('❌ Fehler beim Bot-Toggle:', error);
      showError('Fehler beim Ein-/Ausschalten des Bots');
    }
  };

  const addChannel = async () => {
    if (!newChannel.channelName.trim()) {
      showError('Channel-Name ist erforderlich');
      return;
    }

    try {
      const res = await fetch('/api/twitch-bot/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChannel)
      });

      const data = await res.json();
      
      if (data.success) {
        setChannels(prev => [...prev, data.channel]);
        setNewChannel({
          channelName: '',
          discordChannelId: '',
          syncMessages: false,
          liveMessageEnabled: true,
          liveMessageTemplate: '🔴 Stream ist LIVE! Willkommen alle! 🎉',
          useCustomLiveMessage: false
        });
        showSuccess(data.message);
        await loadData(); // Reload für aktuelle Stats
      } else {
        showError(data.error || 'Fehler beim Hinzufügen des Channels');
      }
    } catch (error) {
      console.error('❌ Fehler beim Hinzufügen des Channels:', error);
      showError('Fehler beim Hinzufügen des Channels');
    }
  };

  const removeChannel = async (channelId: string) => {
    try {
      const res = await fetch(`/api/twitch-bot/channels/${channelId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      
      if (data.success) {
        setChannels(prev => prev.filter(c => c.id !== channelId));
        showSuccess(data.message);
      } else {
        showError(data.error || 'Fehler beim Entfernen des Channels');
      }
    } catch (error) {
      console.error('❌ Fehler beim Entfernen des Channels:', error);
      showError('Fehler beim Entfernen des Channels');
    }
  };

  // =============================================
  // LIVE MESSAGE TEMPLATE FUNKTIONEN
  // =============================================
  
  const createTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.template.trim()) {
      showError('Name und Template sind erforderlich');
      return;
    }

    try {
      const res = await fetch('/api/twitch-bot/live-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });

      const data = await res.json();
      
      if (data.success) {
        setLiveTemplates(prev => [...prev, data.template]);
        setNewTemplate({
          name: '',
          template: '',
          description: '',
          category: 'custom'
        });
        showSuccess(data.message);
      } else {
        showError(data.error || 'Fehler beim Erstellen des Templates');
      }
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Templates:', error);
      showError('Fehler beim Erstellen des Templates');
    }
  };

  const updateTemplate = async (templateId: string, updates: Partial<LiveMessageTemplate>) => {
    try {
      const res = await fetch(`/api/twitch-bot/live-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await res.json();
      
      if (data.success) {
        setLiveTemplates(prev => prev.map(t => 
          t.id === templateId ? data.template : t
        ));
        showSuccess(data.message);
        setEditingTemplate(null);
      } else {
        showError(data.error || 'Fehler beim Aktualisieren des Templates');
      }
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren des Templates:', error);
      showError('Fehler beim Aktualisieren des Templates');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Template wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/twitch-bot/live-templates/${templateId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      
      if (data.success) {
        setLiveTemplates(prev => prev.filter(t => t.id !== templateId));
        showSuccess(data.message);
      } else {
        showError(data.error || 'Fehler beim Löschen des Templates');
      }
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Templates:', error);
      showError('Fehler beim Löschen des Templates');
    }
  };

  const triggerLiveMessage = async (channelId: string) => {
    try {
      const res = await fetch(`/api/twitch-bot/trigger-live/${channelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamerInfo: {
            displayName: 'TestStreamer',
            gameName: 'Just Chatting',
            title: 'Test Stream für Live Message',
            viewerCount: 42
          }
        })
      });

      const data = await res.json();
      
      if (data.success) {
        showSuccess(data.message);
      } else {
        showError(data.error || 'Fehler beim Senden der Live-Nachricht');
      }
    } catch (error) {
      console.error('❌ Fehler beim Senden der Live-Nachricht:', error);
      showError('Fehler beim Senden der Live-Nachricht');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg relative overflow-hidden">
        <MatrixBlocks />
        <div className="relative z-10 p-8">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-primary mx-auto"></div>
              <p className="text-dark-text mt-4">Lade Twitch Bot Daten...</p>
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
          <Bot className="w-12 h-12 text-purple-primary animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-primary to-purple-secondary">
            Twitch Bot System
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          <span className="relative inline-flex items-center mr-2">
            <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600 animate-pulse"></span>
          </span>
          Multi-Channel Twitch Chat Bot mit erweiterten Features! 
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
          onClick={toggleBot}
          className={`${settings.botEnabled ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent'} text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2`}
        >
          {settings.botEnabled ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          <span>{settings.botEnabled ? 'Bot Stoppen' : 'Bot Starten'}</span>
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
        <Badge variant={stats.isConnected ? "default" : "outline"} className="text-lg py-2 px-4">
          {stats.isConnected ? '✅ Bot Verbunden' : '❌ Bot Offline'}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Aktive Channels</CardTitle>
            <Hash className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">{channels.filter(c => c.enabled).length}</div>
            <p className="text-xs text-dark-muted">
              von {channels.length} Channels
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Bot Commands</CardTitle>
            <Zap className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">{stats.totalCommands}</div>
            <p className="text-xs text-dark-muted">
              verfügbare Commands
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Nachrichten (24h)</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">{stats.messagesLast24h}</div>
            <p className="text-xs text-dark-muted">
              {stats.commandsUsedLast24h} Commands verwendet
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">{stats.uptime}</div>
            <p className="text-xs text-dark-muted">
              Bot Laufzeit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-dark-surface/50 p-1 rounded-lg mb-6">
        {['overview', 'settings', 'channels', 'commands', 'live-messages'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-purple-primary text-white shadow-lg'
                : 'text-dark-text hover:text-white hover:bg-dark-bg/50'
            }`}
          >
            {tab === 'overview' && 'Übersicht'}
            {tab === 'settings' && 'Einstellungen'}
            {tab === 'channels' && 'Channels'}
            {tab === 'commands' && 'Commands'}
            {tab === 'live-messages' && 'Live Messages'}
          </button>
        ))}
      </div>

      {/* Bot Settings */}
      {activeTab === 'settings' && (
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-accent" />
            Bot Grundeinstellungen
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere die Basis-Einstellungen für den Twitch Bot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-dark-text">Bot Username</Label>
              <Input
                value={settings.botUsername}
                onChange={(e) => setSettings({...settings, botUsername: e.target.value})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                placeholder="TwitchBotUsername"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-dark-text">Command Prefix</Label>
              <Input
                value={settings.commandPrefix}
                onChange={(e) => setSettings({...settings, commandPrefix: e.target.value})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                placeholder="!"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-dark-text">OAuth Token</Label>
            <Input
              type="password"
              value={settings.oauthToken}
              onChange={(e) => setSettings({...settings, oauthToken: e.target.value})}
              className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
              placeholder="oauth:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <p className="text-xs text-dark-muted">
              🔑 Twitch OAuth Token von{' '}
              <a 
                href="https://twitchapps.com/tmi/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-accent hover:text-purple-primary underline"
              >
                twitchapps.com/tmi
              </a>
              {' '}generieren<br/>
              💡 <strong>Optional:</strong> Kann auch als <code className="bg-dark-bg px-1 rounded text-purple-accent">TWITCH_BOT_OAUTH</code> Environment Variable in Railway gesetzt werden
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Switch
                checked={settings.botEnabled}
                onCheckedChange={(checked) => setSettings({...settings, botEnabled: checked})}
              />
              <Label>Bot aktiviert</Label>
            </div>

            <div className="flex items-center space-x-3">
              <Switch
                checked={settings.autoConnect}
                onCheckedChange={(checked) => setSettings({...settings, autoConnect: checked})}
              />
              <Label>Auto-Connect</Label>
            </div>

            <div className="flex items-center space-x-3">
              <Switch
                checked={settings.modCommandsOnly}
                onCheckedChange={(checked) => setSettings({...settings, modCommandsOnly: checked})}
              />
              <Label>Nur Mods</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-dark-text">Reconnect Attempts</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={settings.reconnectAttempts}
                onChange={(e) => setSettings({...settings, reconnectAttempts: parseInt(e.target.value) || 3})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-dark-text">Global Cooldown (Sekunden)</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={settings.globalCooldown}
                onChange={(e) => setSettings({...settings, globalCooldown: parseInt(e.target.value) || 3})}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Channel Management */}
      {activeTab === 'channels' && (
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Hash className="w-5 h-5 text-purple-accent" />
            Channel Management
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Verwalte die Twitch Channels, die der Bot überwachen soll
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Neuen Channel hinzufügen */}
          <div className="p-4 bg-dark-bg/30 rounded-lg border border-purple-primary/20">
            <h4 className="text-md font-semibold text-white mb-4">Neuen Channel hinzufügen</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label>Twitch Channel Name *</Label>
                <Input
                  value={newChannel.channelName}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, channelName: e.target.value }))}
                  placeholder="twitchusername"
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                />
              </div>

              <div>
                <Label>Discord Channel ID</Label>
                <Input
                  value={newChannel.discordChannelId}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, discordChannelId: e.target.value }))}
                  placeholder="123456789012345678"
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                />
              </div>

              <div className="flex items-center space-x-3 mt-6">
                <Switch
                  checked={newChannel.syncMessages}
                  onCheckedChange={(checked) => setNewChannel(prev => ({ ...prev, syncMessages: checked }))}
                />
                <Label>Discord Sync</Label>
              </div>
            </div>

            <Button
              onClick={addChannel}
              className="bg-purple-primary hover:bg-purple-primary/80"
              disabled={!newChannel.channelName.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Channel hinzufügen
            </Button>
          </div>

          {/* Channel Liste */}
          <div className="space-y-3">
            <h4 className="text-md font-semibold text-white">
              Bot Channels ({channels.length})
            </h4>

            {channels.length === 0 ? (
              <div className="text-center py-8 text-dark-text/70">
                <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Channels hinzugefügt</p>
                <p className="text-sm">Füge deinen ersten Twitch Channel hinzu!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {channels.map((channel) => (
                  <div key={channel.id} className="bg-dark-bg/50 p-4 rounded-lg border border-purple-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${channel.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <h5 className="font-semibold text-white flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            {channel.channelName}
                          </h5>
                          <p className="text-sm text-dark-text/70">
                            {channel.totalCommands} Commands • {channel.syncMessages ? 'Discord Sync ✅' : 'Discord Sync ❌'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={channel.enabled}
                          onCheckedChange={(checked) => {
                            setChannels(prev => prev.map(c => 
                              c.id === channel.id ? { ...c, enabled: checked } : c
                            ));
                          }}
                        />

                        <Button
                          onClick={() => removeChannel(channel.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {channel.discordChannelId && (
                      <div className="text-sm text-dark-text/80 bg-dark-bg/30 p-2 rounded">
                        <strong>Discord Channel:</strong> {channel.discordChannelId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Commands Tab */}
      {activeTab === 'commands' && <TwitchBotCommandsSection />}

      {/* Live Messages Tab */}
      {activeTab === 'live-messages' && (
        <div className="space-y-6">
          {/* Live Message Settings */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-accent" />
                Live Message Einstellungen
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Konfiguriere automatische Nachrichten wenn Streams live gehen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={settings.liveNotificationsEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, liveNotificationsEnabled: checked})}
                  />
                  <div>
                    <Label className="text-sm font-medium">Live Messages aktiviert</Label>
                    <p className="text-xs text-dark-muted">Automatische Chat-Nachrichten wenn Stream live geht</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-dark-text">Message Cooldown (Minuten)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="120"
                    value={settings.liveMessageCooldown}
                    onChange={(e) => setSettings({...settings, liveMessageCooldown: parseInt(e.target.value) || 0})}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                    placeholder="0 = kein Cooldown"
                  />
                  <p className="text-xs text-dark-muted mt-1">Mindestabstand zwischen automatischen Nachrichten (0 = kein Cooldown)</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={saveSettings} className="bg-purple-primary hover:bg-purple-primary/80">
                  <Save className="w-4 h-4 mr-2" />
                  Einstellungen speichern
                </Button>
                
                <Button onClick={toggleBot} variant="outline" className={`${settings.botEnabled ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-green-500/20 border-green-500 text-green-400'}`}>
                  {settings.botEnabled ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {settings.botEnabled ? 'Bot stoppen' : 'Bot starten'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Message Templates */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-accent" />
                Live Message Templates
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Verwalte Vorlagen für automatische Live-Nachrichten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Neues Template erstellen */}
              <div className="p-4 bg-dark-bg/30 rounded-lg border border-purple-primary/20">
                <h4 className="text-md font-semibold text-white mb-4">Neues Template erstellen</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Template Name *</Label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Mein Live Template"
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                    />
                  </div>

                  <div>
                    <Label>Kategorie</Label>
                    <select
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-dark-bg/70 border border-purple-primary/30 rounded-md text-dark-text focus:border-purple-primary"
                    >
                      <option value="general">Allgemein</option>
                      <option value="gaming">Gaming</option>
                      <option value="special">Besonders</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <Label>Template Text *</Label>
                  <Textarea
                    value={newTemplate.template}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, template: e.target.value }))}
                    placeholder="🔴 {{username}} ist LIVE mit {{game}}! 🎮 {{title}}"
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                    rows={3}
                  />
                  <p className="text-xs text-dark-muted mt-1">
                    Verfügbare Variablen: {"{{username}}, {{streamer}}, {{game}}, {{title}}, {{viewers}}"}
                  </p>
                </div>

                <div className="mb-4">
                  <Label>Beschreibung</Label>
                  <Input
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Beschreibung des Templates..."
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                  />
                </div>

                <Button
                  onClick={createTemplate}
                  className="bg-purple-primary hover:bg-purple-primary/80"
                  disabled={!newTemplate.name.trim() || !newTemplate.template.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Template erstellen
                </Button>
              </div>

              {/* Template Liste */}
              <div className="space-y-3">
                <h4 className="text-md font-semibold text-white">
                  Templates ({liveTemplates.length})
                </h4>

                {liveTemplates.length === 0 ? (
                  <div className="text-center py-8 text-dark-text/70">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Templates erstellt</p>
                    <p className="text-sm">Erstelle dein erstes Live Message Template!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {liveTemplates.map((template) => (
                      <div key={template.id} className="bg-dark-bg/50 p-4 rounded-lg border border-purple-primary/20">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="font-semibold text-white">{template.name}</h5>
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                              {template.isDefault && (
                                <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500">
                                  Standard
                                </Badge>
                              )}
                            </div>
                            
                            <div className="bg-dark-bg/50 p-3 rounded mb-2">
                              <code className="text-purple-accent text-sm">{template.template}</code>
                            </div>
                            
                            {template.description && (
                              <p className="text-sm text-dark-text/70 mb-2">{template.description}</p>
                            )}
                            
                            <p className="text-xs text-dark-muted">
                              Verwendet: {template.usageCount}x
                            </p>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <Switch
                              checked={template.enabled}
                              onCheckedChange={(checked) => updateTemplate(template.id, { enabled: checked })}
                            />

                            {!template.isDefault && (
                              <>
                                <Button
                                  onClick={() => setEditingTemplate(template)}
                                  size="sm"
                                  variant="outline"
                                  className="border-purple-primary/30"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                
                                <Button
                                  onClick={() => deleteTemplate(template.id)}
                                  size="sm"
                                  variant="destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test Live Messages */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <TestTube className="w-5 h-5 text-purple-accent" />
                Live Message Tests
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Teste Live-Nachrichten für deine Channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {channels.filter(c => c.enabled).map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg border border-purple-primary/20">
                    <div className="flex items-center gap-3">
                      <Hash className="w-4 h-4 text-purple-accent" />
                      <span className="text-white font-medium">{channel.channelName}</span>
                      {channel.liveMessageEnabled ? (
                        <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500">Live Messages ✅</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-red-400 border-red-500">Live Messages ❌</Badge>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => triggerLiveMessage(channel.id)}
                      size="sm"
                      className="bg-purple-primary hover:bg-purple-primary/80"
                      disabled={!channel.liveMessageEnabled || !stats.isConnected}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Test Message
                    </Button>
                  </div>
                ))}
                
                {channels.filter(c => c.enabled).length === 0 && (
                  <div className="text-center py-8 text-dark-text/70">
                    <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Keine aktiven Channels für Tests</p>
                    <p className="text-sm">Aktiviere zuerst einen Channel im Channels-Tab</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Settings Button für Settings Tab */}
      {activeTab === 'settings' && (
        <div className="flex gap-3 mt-6">
          <Button onClick={saveSettings} className="bg-purple-primary hover:bg-purple-primary/80">
            <Save className="w-4 h-4 mr-2" />
            Einstellungen speichern
          </Button>
          
          <Button onClick={toggleBot} variant="outline" className={`${settings.botEnabled ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-green-500/20 border-green-500 text-green-400'}`}>
            {settings.botEnabled ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {settings.botEnabled ? 'Bot stoppen' : 'Bot starten'}
          </Button>
        </div>
      )}

      {/* Template Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-surface/95 backdrop-blur-xl p-6 rounded-xl border border-purple-primary/30 shadow-purple-glow w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Template bearbeiten</h3>
              <Button
                onClick={() => setEditingTemplate(null)}
                size="sm"
                variant="outline"
                className="border-purple-primary/30"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                />
              </div>

              <div>
                <Label>Kategorie</Label>
                <select
                  value={editingTemplate.category}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, category: e.target.value } : null)}
                  className="w-full px-3 py-2 bg-dark-bg/70 border border-purple-primary/30 rounded-md text-dark-text focus:border-purple-primary"
                >
                  <option value="general">Allgemein</option>
                  <option value="gaming">Gaming</option>
                  <option value="special">Besonders</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <Label>Template Text *</Label>
                <Textarea
                  value={editingTemplate.template}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, template: e.target.value } : null)}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                  rows={3}
                />
                                                  <p className="text-xs text-dark-muted mt-1">
                   Verfügbare Variablen: {"{{username}}, {{streamer}}, {{game}}, {{title}}, {{viewers}}"}
                 </p>
              </div>

              <div>
                <Label>Beschreibung</Label>
                <Input
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => updateTemplate(editingTemplate.id, {
                    name: editingTemplate.name,
                    template: editingTemplate.template,
                    description: editingTemplate.description,
                    category: editingTemplate.category
                  })}
                  className="bg-purple-primary hover:bg-purple-primary/80 flex-1"
                  disabled={!editingTemplate.name.trim() || !editingTemplate.template.trim()}
                >
                  Speichern
                </Button>
                <Button
                  onClick={() => setEditingTemplate(null)}
                  variant="outline"
                  className="border-purple-primary/30"
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default TwitchBot; 