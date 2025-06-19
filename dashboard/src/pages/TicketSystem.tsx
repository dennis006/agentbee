import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Ticket, Settings, Plus, Trash2, Save, Send, Users, MessageSquare, Clock, BarChart3, Shield, Smile } from 'lucide-react';
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

// UI Components
const Badge: React.FC<{ children: React.ReactNode; className?: string; variant?: string }> = ({ children, className = '', variant = 'default' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant === 'outline' ? 'border border-purple-primary text-purple-primary bg-transparent' : 'bg-purple-primary text-white'} ${className}`}>
    {children}
  </span>
);

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

const Label: React.FC<{ children: React.ReactNode; htmlFor?: string; className?: string }> = ({ children, htmlFor, className = '' }) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-dark-text ${className}`}>
    {children}
  </label>
);

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

interface TicketButton {
  id: string;
  label: string;
  emoji: string;
  style: 'PRIMARY' | 'SECONDARY' | 'SUCCESS' | 'DANGER';
  description: string;
}

interface TicketSettings {
  enabled: boolean;
  categoryId: string;
  supportRoles: string[];
  staffRoles: string[];
  autoClose: {
    enabled: boolean;
    inactivityTime: number;
    warningTime: number;
  };
  embed: {
    title: string;
    description: string;
    color: string;
    footer: string;
    thumbnail: string;
  };
  buttons: TicketButton[];
  transcripts: {
    enabled: boolean;
    channelId: string;
    saveToFile: boolean;
  };
  notifications: {
    newTicket: {
      enabled: boolean;
      channelId: string;
      mention: boolean;
    };
    ticketClosed: {
      enabled: boolean;
      dmUser: boolean;
    };
  };
}

interface TicketStats {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  averageResponseTime: number;
  ticketsByType: { [key: string]: number };
  recentTickets: Array<{
    id: string;
    type: string;
    user: string;
    status: string;
    createdAt: string;
  }>;
}

interface Role {
  id: string;
  name: string;
  color: string;
}

interface Channel {
  id: string;
  name: string;
}

const TicketSystem: React.FC = () => {
  const { toasts, success, error: showError, removeToast } = useToast();
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [settings, setSettings] = useState<TicketSettings | null>(null);

  const [stats, setStats] = useState<TicketStats>({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    averageResponseTime: 0,
    ticketsByType: {},
    recentTickets: []
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Channel[]>([]);
  const [postChannelName, setPostChannelName] = useState('');

  // Data Loading
  const loadData = async () => {
    try {
      setLoading(true);
      
      const [settingsRes, statsRes, rolesRes, channelsRes, categoriesRes] = await Promise.all([
        fetch('/api/tickets'),
        fetch('/api/tickets/stats'),
        fetch('/api/xp/roles'),
        fetch('/api/xp/channels'),
        fetch('/api/categories')
      ]);

      if (settingsRes.ok) {
        const response = await settingsRes.json();
        
        // V2 API hat die Settings in response.settings
        const settingsData = response.settings || response;
        
        // KOMPLETT ERSETZEN - keine Defaults verwenden!
        setSettings(settingsData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.roles || []);
      }

      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();
        setChannels(channelsData.text || []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Daten:', err);
      showError('❌ Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Settings
  const saveSettings = async () => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.version === '2.0') {
          success('🎫 Ticket-System Einstellungen gespeichert (V2)!');
        } else {
          success('🎫 Ticket-System Einstellungen gespeichert!');
        }
        
        // Setze die aktualisierten Einstellungen direkt im State
        if (result.settings) {
          setSettings(result.settings);
        }
        
        // Zusätzlich: Lade die Daten neu nach kurzer Verzögerung
        setTimeout(async () => {
          await loadData();
        }, 500);
      } else {
        const errorData = await response.json();
        showError(`❌ ${errorData.error || 'Fehler beim Speichern der Einstellungen'}`);
      }
    } catch (err) {
      showError('❌ Netzwerkfehler beim Speichern');
    }
  };

  // Test Functions
  const postTicketMessage = async () => {
    if (!postChannelName) {
      showError('❌ Bitte wähle einen Channel aus');
      return;
    }

    try {
      const response = await fetch('/api/tickets/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channelName: postChannelName }),
      });

      if (response.ok) {
        success(`📨 Ticket-Nachricht erfolgreich in #${postChannelName} gepostet!`);
      } else {
        const error = await response.json();
        showError(error.error || '❌ Fehler beim Posten der Nachricht');
      }
    } catch (err) {
      showError('❌ Fehler beim Posten der Nachricht');
    }
  };

  // Button Management
  const addButton = () => {
    if (!settings) return;
    const newButton: TicketButton = {
      id: `custom_${Date.now()}`,
      label: 'Neuer Button',
      emoji: '🎫',
      style: 'PRIMARY',
      description: 'Beschreibung hier...'
    };
    setSettings(prev => prev ? ({
      ...prev,
      buttons: [...prev.buttons, newButton]
    }) : null);
  };

  const removeButton = (index: number) => {
    setSettings(prev => prev ? ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index)
    }) : null);
  };

  const updateButton = (index: number, field: keyof TicketButton, value: string) => {
    setSettings(prev => prev ? ({
      ...prev,
      buttons: prev.buttons.map((button, i) => 
        i === index ? { ...button, [field]: value } : button
      )
    }) : null);
  };

  // Utility Functions
  const formatDuration = (ms: number) => {
    // Validierung für ungültige oder fehlende Werte
    if (!ms || ms === 0 || isNaN(ms) || ms < 0) {
      return 'Keine Daten';
    }

    // Konvertierung zu Zeiteinheiten
    const totalSeconds = Math.floor(ms / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    // Verbleibende Werte nach größerer Einheit
    const remainingHours = totalHours % 24;
    const remainingMinutes = totalMinutes % 60;
    const remainingSeconds = totalSeconds % 60;

    // Intelligente Formatierung basierend auf Größe
    if (totalDays > 0) {
      if (remainingHours > 0) {
        return `${totalDays}d ${remainingHours}h`;
      }
      return `${totalDays} Tag${totalDays !== 1 ? 'e' : ''}`;
    }
    
    if (totalHours > 0) {
      if (remainingMinutes > 0) {
        return `${totalHours}h ${remainingMinutes}m`;
      }
      return `${totalHours} Stunde${totalHours !== 1 ? 'n' : ''}`;
    }
    
    if (totalMinutes > 0) {
      if (remainingSeconds > 0 && totalMinutes < 10) {
        return `${totalMinutes}m ${remainingSeconds}s`;
      }
      return `${totalMinutes} Minute${totalMinutes !== 1 ? 'n' : ''}`;
    }
    
    return `${totalSeconds} Sekunde${totalSeconds !== 1 ? 'n' : ''}`;
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-primary mx-auto mb-4"></div>
          <p className="text-dark-text">Lade Ticket-System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 animate-fade-in relative">
      <MatrixBlocks density={20} />
      
      {/* Page Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Ticket className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            Ticket System Management
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Verwalte dein Ticket-System wie ein Boss! Private Chats für perfekten Support.
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
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Gesamt Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">{stats.totalTickets}</div>
            <p className="text-xs text-dark-muted">
              Alle erstellten Tickets
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Offene Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">{stats.openTickets}</div>
            <p className="text-xs text-dark-muted">
              Aktive Support-Tickets
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Geschlossene Tickets</CardTitle>
            <Shield className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">{stats.closedTickets}</div>
            <p className="text-xs text-dark-muted">
              Erfolgreich bearbeitet
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Antwortzeit</CardTitle>
            <Clock className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">{formatDuration(stats.averageResponseTime)}</div>
            <p className="text-xs text-dark-muted">
              Durchschnittliche Bearbeitungszeit
            </p>
          </CardContent>
        </Card>
      </div>

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
                  <div>Basis-Konfiguration des Ticket-Systems:</div>
                  <div>• System aktivieren/deaktivieren</div>
                  <div>• Kategorie für neue Tickets</div>
                  <div>• Support-Rollen mit Ticket-Zugriff</div>
                </div>
              }
            />
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere die Basis-Einstellungen deines Ticket-Systems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-dark-surface/30 rounded-xl border border-purple-primary/20">
            <div>
              <Label className="text-base font-medium">Ticket-System aktiviert</Label>
              <p className="text-sm text-dark-text/70 mt-1">Aktiviere oder deaktiviere das gesamte Ticket-System</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Ticket-Kategorie 
              <Tooltip content="Wähle die Kategorie aus, in der neue Tickets erstellt werden sollen" />
            </Label>
            <Select value={settings.categoryId} onValueChange={(value) => setSettings(prev => ({ ...prev, categoryId: value }))}>
              <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple">
                <SelectValue placeholder="Kategorie auswählen..." />
              </SelectTrigger>
              <SelectContent className="bg-dark-surface border-purple-primary/30">
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id} className="text-dark-text hover:bg-purple-primary/20">
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Support Roles */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-sm font-medium text-dark-text">Support-Rollen</Label>
              <Tooltip 
                title="👮‍♂️ Support-Rollen erklärt:"
                content={
                  <div>
                    <div>Rollen die Zugriff auf alle Tickets haben:</div>
                    <div>• Gib die exakten Rollen-Namen ein (z.B. "Admin", "Moderator")</div>
                    <div>• Diese Rollen können alle Tickets sehen und bearbeiten</div>
                    <div>• Groß-/Kleinschreibung beachten!</div>
                  </div>
                }
              />
            </div>
            <div className="space-y-2">
              {settings.supportRoles.map((roleName, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={roleName}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    onChange={(e) => {
                      const newRoles = [...settings.supportRoles];
                      newRoles[index] = e.target.value;
                      setSettings(prev => ({
                        ...prev,
                        supportRoles: newRoles
                      }));
                    }}
                    placeholder="Rollen-Name (z.B. Admin, Moderator)"
                  />
                  <Button
                    onClick={() => {
                      const newRoles = settings.supportRoles.filter((_, i) => i !== index);
                      setSettings(prev => ({
                        ...prev,
                        supportRoles: newRoles
                      }));
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => {
                  setSettings(prev => ({
                    ...prev,
                    supportRoles: [...prev.supportRoles, '']
                  }));
                }}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Support-Rolle hinzufügen</span>
              </Button>
            </div>
          </div>

          {/* Staff Roles */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-sm font-medium text-dark-text">Staff-Rollen</Label>
              <Tooltip 
                title="🛠️ Staff-Rollen erklärt:"
                content={
                  <div>
                    <div>Rollen mit erweiterten Ticket-Rechten:</div>
                    <div>• Können Tickets schließen und verwalten</div>
                    <div>• Sehen Ticket-Logs und Statistiken</div>
                    <div>• Z.B. "Support", "Helper", "Staff"</div>
                  </div>
                }
              />
            </div>
            <div className="space-y-2">
              {settings.staffRoles.map((roleName, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={roleName}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    onChange={(e) => {
                      const newRoles = [...settings.staffRoles];
                      newRoles[index] = e.target.value;
                      setSettings(prev => ({
                        ...prev,
                        staffRoles: newRoles
                      }));
                    }}
                    placeholder="Rollen-Name (z.B. Support, Helper)"
                  />
                  <Button
                    onClick={() => {
                      const newRoles = settings.staffRoles.filter((_, i) => i !== index);
                      setSettings(prev => ({
                        ...prev,
                        staffRoles: newRoles
                      }));
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => {
                  setSettings(prev => ({
                    ...prev,
                    staffRoles: [...prev.staffRoles, '']
                  }));
                }}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Staff-Rolle hinzufügen</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embed Settings */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-accent" />
            Embed-Einstellungen
            <Tooltip 
              title="💬 Embed-Einstellungen erklärt:"
              content={
                <div>
                  <div>Passe die Ticket-Nachricht an:</div>
                  <div>• Titel: Überschrift der Ticket-Nachricht</div>
                  <div>• Farbe: Embed-Farbe (Hex-Code)</div>
                  <div>• Beschreibung: Haupttext der Nachricht</div>
                  <div>• Footer: Fußzeile der Nachricht</div>
                </div>
              }
            />
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere das Aussehen der Ticket-Nachricht
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <div className="relative">
                <Input
                  value={settings.embed.title}
                  onChange={(e) => setSettings(prev => ({ ...prev, embed: { ...prev.embed, title: e.target.value } }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple pr-10"
                  placeholder="🎫 Support Ticket System"
                />
                <button
                  onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'embed-title' ? null : 'embed-title')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-neon-purple transition-colors duration-200 hover:scale-110"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              {emojiPickerOpen === 'embed-title' && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEmojiPickerOpen(null)}>
                  <div onClick={(e) => e.stopPropagation()}>
                    <EmojiPicker
                      onEmojiSelect={(emoji) => {
                        setSettings(prev => ({ ...prev, embed: { ...prev.embed, title: prev.embed.title + emoji } }));
                        setEmojiPickerOpen(null);
                      }}
                      onClose={() => setEmojiPickerOpen(null)}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Label>Embed Farbe</Label>
                <Tooltip 
                  title="🎨 Embed Farbe erklärt:"
                  content={
                    <div>
                      <div>Die Farbe des seitlichen Balkens</div>
                      <div>in der Discord Ticket-Nachricht</div>
                    </div>
                  }
                />
              </div>
              <div className="flex gap-3 items-center">
                {/* Color Picker */}
                <div className="relative">
                  <input
                    type="color"
                    value={settings.embed.color.startsWith('0x') ? `#${settings.embed.color.slice(2)}` : settings.embed.color.startsWith('#') ? settings.embed.color : '#7289DA'}
                    onChange={(e) => {
                      const hexColor = e.target.value;
                      const discordColor = `0x${hexColor.slice(1).toUpperCase()}`;
                      setSettings(prev => ({
                        ...prev,
                        embed: { ...prev.embed, color: discordColor }
                      }));
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
                    onChange={(e) => setSettings(prev => ({ ...prev, embed: { ...prev.embed, color: e.target.value } }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple font-mono"
                    placeholder="0x7289DA"
                  />
                </div>

                {/* Color Preview */}
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                  style={{
                    backgroundColor: settings.embed.color.startsWith('0x') ? `#${settings.embed.color.slice(2)}` : settings.embed.color.startsWith('#') ? settings.embed.color : '#7289DA',
                    filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                  }}
                >
                  🎫
                </div>
              </div>
              
              {/* Preset Colors */}
              <div className="mt-3">
                <p className="text-xs text-dark-muted mb-2">Beliebte Discord Farben:</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { name: 'Discord Blau', color: '0x7289DA' },
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
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        embed: { ...prev.embed, color: preset.color }
                      }))}
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
          </div>

          <div className="space-y-2">
            <Label>Beschreibung</Label>
            <div className="relative">
              <Textarea
                value={settings.embed.description}
                onChange={(e) => setSettings(prev => ({ ...prev, embed: { ...prev.embed, description: e.target.value } }))}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple min-h-[100px] pr-10"
                placeholder="Brauchst du Hilfe? Erstelle ein Ticket..."
              />
              <button
                onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'embed-description' ? null : 'embed-description')}
                className="absolute right-2 top-2 text-dark-muted hover:text-neon-purple transition-colors duration-200 hover:scale-110"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
            {emojiPickerOpen === 'embed-description' && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEmojiPickerOpen(null)}>
                <div onClick={(e) => e.stopPropagation()}>
                  <EmojiPicker
                    onEmojiSelect={(emoji) => {
                      setSettings(prev => ({ ...prev, embed: { ...prev.embed, description: prev.embed.description + emoji } }));
                      setEmojiPickerOpen(null);
                    }}
                    onClose={() => setEmojiPickerOpen(null)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Footer</Label>
            <div className="relative">
              <Input
                value={settings.embed.footer}
                onChange={(e) => setSettings(prev => ({ ...prev, embed: { ...prev.embed, footer: e.target.value } }))}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple pr-10"
                placeholder="Klicke auf einen Button..."
              />
              <button
                onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'embed-footer' ? null : 'embed-footer')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-neon-purple transition-colors duration-200 hover:scale-110"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
            {emojiPickerOpen === 'embed-footer' && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEmojiPickerOpen(null)}>
                <div onClick={(e) => e.stopPropagation()}>
                  <EmojiPicker
                    onEmojiSelect={(emoji) => {
                      setSettings(prev => ({ ...prev, embed: { ...prev.embed, footer: prev.embed.footer + emoji } }));
                      setEmojiPickerOpen(null);
                    }}
                    onClose={() => setEmojiPickerOpen(null)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Buttons Configuration */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-accent" />
            Ticket-Buttons
            <Tooltip 
              title="🎯 Ticket-Buttons erklärt:"
              content={
                <div>
                  <div>Konfiguriere die Ticket-Buttons:</div>
                  <div>• Label: Text auf dem Button</div>
                  <div>• Emoji: Icon für den Button</div>
                  <div>• Stil: Farbe des Buttons</div>
                  <div>• Beschreibung: Interne Notiz</div>
                </div>
              }
            />
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere die Buttons für verschiedene Ticket-Typen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button 
              onClick={addButton}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Button hinzufügen</span>
            </Button>
          </div>
          
          <div className="space-y-4">
            {settings.buttons.map((button, index) => (
              <div key={index} className="p-4 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                      value={button.label}
                      onChange={(e) => updateButton(index, 'label', e.target.value)}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Emoji</Label>
                    <div className="relative">
                      <Input
                        value={button.emoji}
                        onChange={(e) => updateButton(index, 'emoji', e.target.value)}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple pr-10"
                      />
                      <button
                        onClick={() => setEmojiPickerOpen(emojiPickerOpen === `button-${index}` ? null : `button-${index}`)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-neon-purple transition-colors duration-200 hover:scale-110"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>
                    {emojiPickerOpen === `button-${index}` && (
                      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEmojiPickerOpen(null)}>
                        <div onClick={(e) => e.stopPropagation()}>
                          <EmojiPicker
                            onEmojiSelect={(emoji) => {
                              updateButton(index, 'emoji', emoji);
                              setEmojiPickerOpen(null);
                            }}
                            onClose={() => setEmojiPickerOpen(null)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Stil</Label>
                    <Select 
                      value={button.style} 
                      onValueChange={(value) => updateButton(index, 'style', value as any)}
                    >
                      <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-surface border-purple-primary/30">
                        <SelectItem value="PRIMARY" className="text-dark-text hover:bg-purple-primary/20">Primary (Blau)</SelectItem>
                        <SelectItem value="SECONDARY" className="text-dark-text hover:bg-purple-primary/20">Secondary (Grau)</SelectItem>
                        <SelectItem value="SUCCESS" className="text-dark-text hover:bg-purple-primary/20">Success (Grün)</SelectItem>
                        <SelectItem value="DANGER" className="text-dark-text hover:bg-purple-primary/20">Danger (Rot)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={() => removeButton(index)}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label>Beschreibung</Label>
                  <Textarea
                    value={button.description}
                    onChange={(e) => updateButton(index, 'description', e.target.value)}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    placeholder="Beschreibung für diesen Button-Typ..."
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Close Settings */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-accent" />
            Auto-Close Einstellungen
            <Tooltip 
              title="⏰ Auto-Close erklärt:"
              content={
                <div>
                  <div>Automatisches Schließen inaktiver Tickets:</div>
                  <div>• Inaktivitätszeit: Wie lange ohne Antwort</div>
                  <div>• Warnzeit: Warnung vor automatischem Schließen</div>
                  <div>• Spart Administrationsaufwand</div>
                </div>
              }
            />
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere das automatische Schließen inaktiver Tickets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
            <div>
              <Label className="text-base font-medium text-dark-text">Auto-Close aktiviert</Label>
              <p className="text-sm text-dark-muted mt-1">Tickets automatisch bei Inaktivität schließen</p>
            </div>
            <Switch
              checked={settings.autoClose.enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ 
                ...prev, 
                autoClose: { ...prev.autoClose, enabled: checked } 
              }))}
            />
          </div>

          {settings.autoClose.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Inaktivitätszeit (Stunden)</Label>
                <Input
                  type="number"
                  value={settings.autoClose.inactivityTime / (1000 * 60 * 60)}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    autoClose: { 
                      ...prev.autoClose, 
                      inactivityTime: parseInt(e.target.value) * 1000 * 60 * 60 
                    } 
                  }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                />
              </div>
              <div className="space-y-2">
                <Label>Warnzeit (Stunden)</Label>
                <Input
                  type="number"
                  value={settings.autoClose.warningTime / (1000 * 60 * 60)}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    autoClose: { 
                      ...prev.autoClose, 
                      warningTime: parseInt(e.target.value) * 1000 * 60 * 60 
                    } 
                  }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post Ticket Message */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Send className="w-5 h-5 text-purple-accent" />
            Ticket-Nachricht posten
            <Tooltip 
              title="📨 Ticket-Nachricht posten erklärt:"
              content={
                <div>
                  <div>Postet die Ticket-Nachricht mit Buttons:</div>
                  <div>• Wähle den Ziel-Channel aus</div>
                  <div>• Die Nachricht enthält alle konfigurierten Buttons</div>
                  <div>• User können dann Tickets erstellen</div>
                </div>
              }
            />
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Wähle einen Channel um die Ticket-Nachricht zu posten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label>Ziel-Channel</Label>
              <Select value={postChannelName} onValueChange={setPostChannelName}>
                <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple">
                  <SelectValue placeholder="Channel auswählen..." />
                </SelectTrigger>
                <SelectContent className="bg-dark-surface border-purple-primary/30">
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.name} className="text-dark-text hover:bg-purple-primary/20">
                      #{channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={postTicketMessage}
                disabled={!postChannelName}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
                <span>Nachricht posten</span>
              </Button>
            </div>
          </div>
          {!postChannelName && (
            <p className="text-xs text-yellow-400">
              ⚠️ Bitte wähle einen Channel aus um die Ticket-Nachricht zu posten
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save Settings */}
      <div className="flex justify-center">
        <Button
          onClick={saveSettings}
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>Einstellungen speichern</span>
        </Button>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default TicketSystem; 