import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Settings, Plus, Trash2, Save, Play, TestTube, Users, MessageSquare, Clock, Zap, Bot, Eye, X, Star } from 'lucide-react';
import { useToast, ToastContainer } from '../components/ui/toast';
// import EmojiPicker from '../components/ui/emoji-picker';

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

// UI Komponenten
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
  <label htmlFor={htmlFor} className={`text-sm font-medium text-dark-text leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
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

// Interfaces
interface IntroductionSettings {
  enabled: boolean;
  channelName: string;
  autoPost: boolean;
  triggers: {
    onChannelCreate: boolean;
    onChannelMention: boolean;
    onKeywords: boolean;
    onCommand: boolean;
    manual: boolean;
  };
  keywords: string[];
  cooldown: {
    enabled: boolean;
    duration: number;
    perChannel: boolean;
  };
  embed: {
    title: string;
    description: string;
    color: string;
    thumbnail: 'bot' | 'server' | 'custom' | 'none';
    customThumbnail: string;
    footer: string;
    author: {
      enabled: boolean;
      name: string;
      iconUrl: string;
    };
    fields: Array<{
      name: string;
      value: string;
      inline: boolean;
    }>;
  };
  buttons: {
    enabled: boolean;
    buttons: Array<{
      label: string;
      style: 'primary' | 'secondary' | 'success' | 'danger' | 'link';
      customId?: string;
      url?: string;
      emoji: string;
    }>;
  };
  personalizedGreeting: {
    enabled: boolean;
    useUserName: boolean;
    greetingVariations: string[];
  };
  statistics: {
    showInEmbed: boolean;
    fields: {
      serverCount: boolean;
      memberCount: boolean;
      uptime: boolean;
      commandsExecuted: boolean;
      version: boolean;
    };
  };
  aiIntegration: {
    enabled: boolean;
    generatePersonalizedMessage: boolean;
    useContextFromChannel: boolean;
    maxTokens: number;
  };
  memberIntroductionResponse: {
    enabled: boolean;
    autoReact: boolean;
    autoReply: boolean;
    reactions: string[];
    maxReactions: number;
    customResponses: string[];
    detectionKeywords: string[];
    minimumWordCount: number;
    cooldown: {
      enabled: boolean;
      duration: number;
      perUser: boolean;
    };
    xpBonus: XPBonusSettings;
  };
}

interface IntroductionStats {
  totalIntroductions: number;
  triggerStats: {
    manual: number;
    channelCreate: number;
    channelMention: number;
    keywords: number;
    command: number;
  };
  lastIntroduction: string | null;
  buttonInteractions: {
    help: number;
    commands: number;
    dashboard: number;
  };
}

interface XPBonusSettings {
  enabled: boolean;
  amount: number;
  onlyFirstTime: boolean;
  message: string;
  autoDelete: {
    enabled: boolean;
    delaySeconds: number;
  };
}

const BotIntroduction: React.FC = () => {
  const [settings, setSettings] = useState<IntroductionSettings>({
    enabled: true,
    channelName: 'vorstellungen',
    autoPost: true,
    triggers: {
      onChannelCreate: true,
      onChannelMention: true,
      onKeywords: true,
      onCommand: true,
      manual: true
    },
    keywords: ['bot vorstellen', 'bot introduction', 'wer bist du', 'stell dich vor'],
    cooldown: {
      enabled: true,
      duration: 3600000,
      perChannel: true
    },
    embed: {
      title: '🤖 Hallo! Ich bin {botName}',
      description: 'Dein intelligenter Discord-Assistent für Gaming, Moderation und Entertainment! Ich bringe deinen Server auf das nächste Level! 🚀',
      color: '0x9333EA',
      thumbnail: 'bot',
      customThumbnail: '',
      footer: 'Entwickelt mit ❤️ • {version} • {timestamp}',
      author: {
        enabled: true,
        name: '{botName} - Dein Discord Assistent',
        iconUrl: ''
      },
      fields: [
        {
          name: '🎯 Moderation & Verwaltung',
          value: '• **Moderation** - Auto-Filter, Warns & Mutes mit Supabase\n• **Ticket-System** - Support-Channels mit V2-Integration\n• **Welcome-System** - Personalisierte Begrüßungen\n• **Verifizierung** - Captcha & Game-Authentifizierung\n• **Spam-Schutz** - Intelligente Raid-Erkennung',
          inline: false
        },
        {
          name: '📈 Community Features',
          value: '• **XP-System** - Level-Belohnungen & Leaderboards (Supabase-persistent)\n• **Giveaways** - Faire Verlosungen mit Anti-Cheat\n• **Server-Stats** - Live-Channels & Analytics\n• **Rules-System** - Automatische Regel-Posts',
          inline: true
        },
        {
          name: '🎮 Gaming Integration',
          value: '• **Valorant** - Rang-Tracking & Match-History mit Cards\n• **Twitch-Alerts** - Live-Stream Benachrichtigungen mit AI\n• **Game-Roles** - Automatische Rollen-Zuweisung',
          inline: true
        },
        {
          name: '🎵 Musik & Entertainment',
          value: '• **Simple Music Panel** - Benutzerfreundliche Musik-Steuerung\n• **YouTube Radio** - Streaming-Integration\n• **Song-Requests** - Community-Playlists\n• **Voice-XP** - Belohnungen für Voice-Aktivität',
          inline: false
        },
        {
          name: '🤖 AI & Technologie',
          value: '• **OpenAI Integration** - Smart-Responses & Personalisierung\n• **Supabase Backend** - Moderne Datenbank-Persistierung\n• **Web-Dashboard** - Vollständige Bot-Konfiguration\n• **API-Management** - Zentrale Schlüssel-Verwaltung',
          inline: false
        },
        {
          name: '⚡ Schnellstart',
          value: 'Nutze `/help` um alle Befehle zu sehen oder besuche das **Web-Dashboard** für erweiterte Konfiguration!',
          inline: true
        },
        {
          name: '🔧 Dashboard',
          value: 'Komplette Bot-Verwaltung über das moderne React-Dashboard mit Echtzeit-Updates!',
          inline: true
        }
      ]
    },
    buttons: {
      enabled: false,
      buttons: []
    },
    personalizedGreeting: {
      enabled: true,
      useUserName: true,
      greetingVariations: [
        'Hallo {user}! 👋',
        'Hey {user}! Schön dich zu sehen! 😊',
        'Hi {user}! Willkommen! 🎉'
      ]
    },
    statistics: {
      showInEmbed: true,
      fields: {
        serverCount: true,
        memberCount: true,
        uptime: true,
        commandsExecuted: false,
        version: true
      }
    },
    aiIntegration: {
      enabled: false,
      generatePersonalizedMessage: false,
      useContextFromChannel: false,
      maxTokens: 150
    },
    memberIntroductionResponse: {
      enabled: true,
      autoReact: true,
      autoReply: true,
      reactions: ['👋', '🎉', '😊', '🤖', '🔥', '💜', '✨', '🎊', '🙌', '❤️'],
      maxReactions: 3,
      customResponses: [
        "Hallo {user}! 👋 Herzlich willkommen auf **{server}**! Schön, dass du dich vorgestellt hast. Wir freuen uns, dich in unserer Community begrüßen zu dürfen! Falls du Fragen hast oder Hilfe brauchst, zögere nicht zu fragen. Viel Spaß beim Entdecken unseres Servers! 🎉",
        "Hey {user}! 😊 Super, dass du zu **{server}** gefunden hast! Es ist immer toll, neue Gesichter in unserer Community zu sehen. Nimm dir gerne die Zeit, dich umzuschauen und lerne die anderen Mitglieder kennen. Bei Fragen sind wir alle da um zu helfen. Willkommen im Team! ✨",
        "Hi {user}! 🤖 Willkommen auf **{server}**! Deine Vorstellung war sehr nett zu lesen. Wir haben hier eine tolle Gemeinschaft und ich bin sicher, du wirst dich schnell einleben. Scheue dich nicht, in den verschiedenen Channels aktiv zu werden. Viel Spaß! 🚀",
        "Servus {user}! 🎊 Was für eine schöne Vorstellung! Wir heißen dich herzlich in unserer **{server}**-Familie willkommen. Hier gibt es viel zu entdecken und tolle Leute kennenzulernen. Falls du dich irgendwo nicht zurechtfindest oder Fragen hast, melde dich einfach. Schön, dass du da bist! 💜",
        "Moin {user}! 🌟 Willkommen in der **{server}** Community! Deine Vorstellung hat uns sehr gefreut. Hier findest du bestimmt schnell Anschluss und neue Freunde. Lass dich von der guten Stimmung anstecken und hab eine tolle Zeit bei uns! 🎯",
        "Heyho {user}! 🔥 Perfekte Vorstellung! **{server}** hat einen neuen Star bekommen! Wir sind eine super aktive und hilfsbereite Community. Du wirst hier bestimmt viel Spaß haben. Welcome to the family! 👨‍👩‍👧‍👦",
        "Hi hi {user}! 🎮 Level up! Achievement unlocked: Welcome to **{server}**! 🏆 Deine Vorstellung war richtig cool. Hier gibt es Gaming, Fun und jede Menge nette Leute. Ready für das Abenteuer? Let's go! ⚡",
        "Hey hey {user}! 🎯 Mega dass du zu **{server}** gefunden hast! Wir sind eine richtig coole Community und du passt perfekt dazu. Mach es dir gemütlich und entdecke all die tollen Channels. Bei Fragen einfach fragen! 🚀",
        "Willkommen {user}! 🌈 **{server}** wird noch bunter mit dir dabei! Deine Vorstellung war super sympathisch. Hier herrscht immer gute Laune und jeder hilft jedem. Du wirst dich bestimmt schnell wie zuhause fühlen! ✨",
        "Aloha {user}! 🏝️ Paradise gefunden? Ja, **{server}** ist der beste Ort im Discord-Universum! Deine Vorstellung war richtig nice. Hier ist immer was los und du wirst bestimmt schnell Teil unserer großen Familie! 🌺",
        "Yo {user}! 💫 **{server}** hat gerade einen neuen Superhelden bekommen! Deine Vorstellung war mega. Hier findest du Gaming, Spaß, gute Gespräche und die besten Leute. Welcome to the squad! 🦸‍♂️",
        "Grüß dich {user}! 🎪 Willkommen in der **{server}** Zirkus-Familie! Hier ist immer Action und gute Stimmung. Deine Vorstellung war der perfekte Auftritt! Lass die Show beginnen und hab eine grandiose Zeit! 🎭",
        "Salut {user}! 🎨 **{server}** wird noch kreativer mit dir! Deine Vorstellung war wie ein kleines Kunstwerk. Hier kannst du dich ausleben, neue Sachen lernen und tolle Menschen kennenlernen. Viel Inspiration! 🖌️",
        "Hallo {user}! 🚀 Houston, wir haben einen neuen Astronauten für **{server}**! Deine Vorstellung war out of this world! Hier erwarten dich unendliche Möglichkeiten und galaktisch gute Freunde. Ready for takeoff? 🌌",
        "Hey {user}! 🎸 **{server}** rockt noch mehr mit dir dabei! Deine Vorstellung war wie ein Hit-Song. Hier ist die Musik immer gut und die Stimmung noch besser. Let the good times roll! 🎵",
        "Hi {user}! 🔮 Magic happens - du bist jetzt Teil von **{server}**! Deine Vorstellung war verzaubernd. Hier erwarten dich magische Momente und fantastische Freundschaften. Abracadabra - Welcome! ✨",
        "Moin {user}! ⚡ BOOM! **{server}** hat gerade neue Power bekommen! Deine Vorstellung war energiegeladen. Hier ist immer Hochspannung und du wirst bestimmt voll aufgeladen. Electricity in the air! 🌩️",
        "Hey {user}! 🏆 Volltreffer! **{server}** hat den perfekten neuen Member gefunden! Deine Vorstellung war Champions League! Hier spielen wir alle in der obersten Liga der Freundschaft. Game on! ⚽",
        "Heyho {user}! 🎊 **{server}** feiert heute - du bist da! Deine Vorstellung war wie Feuerwerk am Himmel. Hier ist jeden Tag Party und du bist der neue Star auf der Tanzfläche! Let's celebrate! 💃",
        "Welcome {user}! 🌟 **{server}** strahlt noch heller mit dir! Deine Vorstellung war wie ein Leuchtturm - einfach strahlend! Hier findest du deinen Hafen und jede Menge treue Matrosen. Ahoy! ⚓"
      ],
      detectionKeywords: [
        'hallo', 'hi', 'hey', 'moin', 'servus', 'guten tag', 'nabend',
        'ich bin', 'mein name', 'heiße', 'vorstellen', 'stelle mich vor',
        'neu hier', 'neues mitglied', 'gerade beigetreten', 'bin neu',
        'freue mich', 'schön hier zu sein', 'grüße', 'liebe grüße',
        'komme aus', 'wohne in', 'bin aus', 'lebe in',
        'hobbys', 'interessen', 'mag gerne', 'spiele gerne',
        'alter', 'jahre alt', 'bin', 'student', 'arbeite',
        'discord', 'server', 'community', 'kennenlernen'
      ],
      minimumWordCount: 3,
      cooldown: {
        enabled: true,
        duration: 60000, // 1 Minute
        perUser: true
      },
      xpBonus: {
        enabled: true,
        amount: 100,
        onlyFirstTime: true,
        message: '🎉 Bonus! Du hast {amount} XP für deine erste Vorstellung erhalten!',
        autoDelete: {
          enabled: true,
          delaySeconds: 300
        }
      }
    }
  });

  const [stats, setStats] = useState<IntroductionStats>({
    totalIntroductions: 0,
    triggerStats: {
      manual: 0,
      channelCreate: 0,
      channelMention: 0,
      keywords: 0,
      command: 0
    },
    lastIntroduction: null,
    buttonInteractions: {
      help: 0,
      commands: 0,
      dashboard: 0
    }
  });

  const [loading, setLoading] = useState(true);
  // const [emojiPickerOpen, setEmojiPickerOpen] = useState<string | null>(null);
  // const [previewMode, setPreviewMode] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newGreeting, setNewGreeting] = useState('');

  const { toasts, success, error: showError, removeToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Einstellungen laden
      const settingsResponse = await fetch('/api/bot-introduction/settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      } else {
        showError('❌ Fehler beim Laden der Einstellungen');
      }
      
      // Statistiken laden
      const statsResponse = await fetch('/api/bot-introduction/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        showError('❌ Fehler beim Laden der Statistiken');
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der Daten:', error);
      showError('❌ Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/bot-introduction/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        success('✅ Bot-Vorstellungs-Einstellungen gespeichert!');
        
        // Einstellungen neu laden um sicherzustellen, dass sie korrekt gespeichert wurden
        setTimeout(() => {
          loadData();
        }, 500);
      } else {
        showError('❌ Fehler beim Speichern der Einstellungen');
      }
    } catch (error) {
      showError('❌ Netzwerkfehler beim Speichern');
    }
  };

  const testIntroduction = async () => {
    try {
      const response = await fetch('/api/bot-introduction/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: settings.channelName })
      });

      if (response.ok) {
        const data = await response.json();
        success('🧪 Test-Vorstellung gesendet!');
        loadData(); // Statistiken aktualisieren
      } else {
        const errorData = await response.json();
        showError(`❌ ${errorData.error || 'Fehler beim Senden der Test-Vorstellung'}`);
      }
    } catch (error) {
      console.error('Test Introduction Error:', error);
      showError('❌ Fehler beim Testen der Vorstellung');
    }
  };

  const postIntroduction = async () => {
    try {
      const response = await fetch('/api/bot-introduction/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          channelName: settings.channelName 
        })
      });

      if (response.ok) {
        const data = await response.json();
        success('🤖 Bot-Vorstellung gepostet!');
        loadData(); // Statistiken aktualisieren
      } else {
        const errorData = await response.json();
        showError(`❌ ${errorData.error || 'Fehler beim Posten der Vorstellung'}`);
      }
    } catch (error) {
      console.error('Post Introduction Error:', error);
      showError('❌ Fehler beim Posten der Vorstellung');
    }
  };

  // Hilfsfunktionen
  const addKeyword = () => {
    if (newKeyword.trim() && !settings.keywords.includes(newKeyword.trim())) {
      setSettings(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (index: number) => {
    setSettings(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }));
  };

  const addGreeting = () => {
    if (newGreeting.trim() && !settings.personalizedGreeting.greetingVariations.includes(newGreeting.trim())) {
      setSettings(prev => ({
        ...prev,
        personalizedGreeting: {
          ...prev.personalizedGreeting,
          greetingVariations: [...prev.personalizedGreeting.greetingVariations, newGreeting.trim()]
        }
      }));
      setNewGreeting('');
    }
  };

  const removeGreeting = (index: number) => {
    setSettings(prev => ({
      ...prev,
      personalizedGreeting: {
        ...prev.personalizedGreeting,
        greetingVariations: prev.personalizedGreeting.greetingVariations.filter((_, i) => i !== index)
      }
    }));
  };

  const addField = () => {
    setSettings(prev => ({
      ...prev,
      embed: {
        ...prev.embed,
        fields: [...prev.embed.fields, {
          name: 'Neues Feld',
          value: 'Beschreibung hier...',
          inline: false
        }]
      }
    }));
  };

  const removeField = (index: number) => {
    setSettings(prev => ({
      ...prev,
      embed: {
        ...prev.embed,
        fields: prev.embed.fields.filter((_, i) => i !== index)
      }
    }));
  };

  const updateField = (index: number, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      embed: {
        ...prev.embed,
        fields: prev.embed.fields.map((f, i) => 
          i === index ? { ...f, [field]: value } : f
        )
      }
    }));
  };

  const addButton = () => {
    setSettings(prev => ({
      ...prev,
      buttons: {
        ...prev.buttons,
        buttons: [...prev.buttons.buttons, {
          label: 'Neuer Button',
          style: 'secondary',
          customId: 'new_button',
          emoji: '🔘'
        }]
      }
    }));
  };

  const removeButton = (index: number) => {
    setSettings(prev => ({
      ...prev,
      buttons: {
        ...prev.buttons,
        buttons: prev.buttons.buttons.filter((_, i) => i !== index)
      }
    }));
  };

  const updateButton = (index: number, field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      buttons: {
        ...prev.buttons,
        buttons: prev.buttons.buttons.map((b, i) => 
          i === index ? { ...b, [field]: value } : b
        )
      }
    }));
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nie';
    return new Date(dateString).toLocaleString('de-DE');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Bot-Vorstellungs-System...</div>
        </div>
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
          <Bot className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            Bot-Vorstellungs-System
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Konfiguriere automatische Bot-Vorstellungen und Mitglieder-Antworten.
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

      {/* Quick Actions */}
      <div className="flex justify-center gap-4 flex-wrap">
        <Button
          onClick={saveSettings}
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>Einstellungen speichern</span>
        </Button>
        <Button
          onClick={testIntroduction}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <TestTube className="h-5 w-5" />
          <span>Test-Vorstellung</span>
        </Button>
        <Button
          onClick={postIntroduction}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Play className="h-5 w-5" />
          <span>Jetzt vorstellen</span>
        </Button>
      </div>

      {/* System Status Badge */}
      <div className="flex justify-center">
        <Badge variant={settings.enabled ? "default" : "outline"} className="text-lg py-2 px-4">
          {settings.enabled ? '✅ System Aktiviert' : '❌ System Deaktiviert'}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Gesamt Vorstellungen</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">{stats.totalIntroductions}</div>
            <p className="text-xs text-dark-muted">
              Total ausgeführt
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Button-Interaktionen</CardTitle>
            <Users className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-purple">
              {stats.buttonInteractions.help + stats.buttonInteractions.commands + stats.buttonInteractions.dashboard}
            </div>
            <p className="text-xs text-dark-muted">
              Benutzer-Interaktionen
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Letzte Vorstellung</CardTitle>
            <Clock className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-neon-purple">{formatDate(stats.lastIntroduction)}</div>
            <p className="text-xs text-dark-muted">
              Zuletzt ausgeführt
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">System Status</CardTitle>
            <Settings className={`h-4 w-4 ${settings.enabled ? 'text-green-400' : 'text-red-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${settings.enabled ? 'text-green-400' : 'text-red-400'}`}>
              {settings.enabled ? 'Aktiv' : 'Inaktiv'}
            </div>
            <p className="text-xs text-dark-muted">
              Aktueller Status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Haupteinstellungen */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-accent" />
            Grundeinstellungen
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Aktiviere und konfiguriere das automatische Bot-Vorstellungs-System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                />
                <Label>System aktiviert</Label>
                <Tooltip content="Aktiviert oder deaktiviert das gesamte Bot-Vorstellungs-System" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.autoPost}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoPost: checked }))}
                />
                <Label>Automatisches Posten</Label>
                <Tooltip content="Postet automatisch Vorstellungen basierend auf den konfigurierten Triggern" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vorstellungs-Channel</Label>
              <Input
                value={settings.channelName}
                onChange={(e) => setSettings(prev => ({ ...prev, channelName: e.target.value }))}
                placeholder="vorstellungen"
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
              />
            </div>

            <div className="space-y-2">
              <Label>Cooldown-Dauer</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={Math.floor(settings.cooldown.duration / 60000)}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    cooldown: { ...prev.cooldown, duration: parseInt(e.target.value) * 60000 }
                  }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                />
                <span className="text-dark-muted">Minuten</span>
              </div>
            </div>
          </div>

          {/* Trigger-Einstellungen */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dark-text">Trigger-Einstellungen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(settings.triggers).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      triggers: { ...prev.triggers, [key]: checked }
                    }))}
                  />
                  <Label className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dark-text">Trigger-Keywords</h3>
            <div className="flex space-x-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Neues Keyword hinzufügen..."
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              />
              <Button onClick={addKeyword} className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.keywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="flex items-center space-x-1">
                  <span>{keyword}</span>
                  <button
                    onClick={() => removeKeyword(index)}
                    className="ml-1 text-red-400 hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mitglieder-Antworten */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-accent" />
            Automatische Mitglieder-Antworten
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Reagiere automatisch auf Mitglieder-Vorstellungen mit konfigurierbaren Antworten und Emoji-Reaktionen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.memberIntroductionResponse?.enabled || false}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    memberIntroductionResponse: { ...prev.memberIntroductionResponse, enabled: checked }
                  }))}
                />
                <Label>Mitglieder-Antworten aktiviert</Label>
                <Tooltip content="Aktiviert automatische Reaktionen und Antworten auf Mitglieder-Vorstellungen" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.memberIntroductionResponse?.autoReact || false}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    memberIntroductionResponse: { ...prev.memberIntroductionResponse, autoReact: checked }
                  }))}
                />
                <Label>Automatische Reaktionen</Label>
                <Tooltip content="Fügt automatisch Emoji-Reaktionen zu Vorstellungen hinzu" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.memberIntroductionResponse?.autoReply || false}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    memberIntroductionResponse: { ...prev.memberIntroductionResponse, autoReply: checked }
                  }))}
                />
                <Label>Automatische Antworten</Label>
                <Tooltip content="Sendet automatisch personalisierte Antworten auf Vorstellungen" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mindest-Wortanzahl</Label>
              <Input
                type="number"
                value={settings.memberIntroductionResponse?.minimumWordCount || 3}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  memberIntroductionResponse: {
                    ...prev.memberIntroductionResponse,
                    minimumWordCount: parseInt(e.target.value) || 3
                  }
                }))}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
              />
            </div>

            <div className="space-y-2">
              <Label>Cooldown (Minuten)</Label>
              <Input
                type="number"
                value={Math.floor((settings.memberIntroductionResponse?.cooldown?.duration || 300000) / 60000)}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  memberIntroductionResponse: {
                    ...prev.memberIntroductionResponse,
                    cooldown: {
                      ...prev.memberIntroductionResponse.cooldown,
                      duration: parseInt(e.target.value) * 60000
                    }
                  }
                }))}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
              />
            </div>
          </div>

          {/* Reaktions-Emojis */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dark-text">Reaktions-Emojis</h3>
            
            {/* Anzahl der zufälligen Reaktionen */}
            <div className="space-y-2">
              <Label>Anzahl zufälliger Reaktionen</Label>
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.memberIntroductionResponse?.maxReactions || 3}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    memberIntroductionResponse: {
                      ...prev.memberIntroductionResponse,
                      maxReactions: parseInt(e.target.value) || 3
                    }
                  }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple w-20"
                />
                <span className="text-dark-muted text-sm">
                  Der Bot wählt {settings.memberIntroductionResponse?.maxReactions || 3} zufällige Emojis aus der Liste
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {(settings.memberIntroductionResponse?.reactions || []).map((reaction, index) => (
                <Badge key={index} variant="outline" className="flex items-center space-x-1 text-lg">
                  <span>{reaction}</span>
                  <button
                    onClick={() => {
                      const newReactions = [...(settings.memberIntroductionResponse?.reactions || [])];
                      newReactions.splice(index, 1);
                      setSettings(prev => ({
                        ...prev,
                        memberIntroductionResponse: {
                          ...prev.memberIntroductionResponse,
                          reactions: newReactions
                        }
                      }));
                    }}
                    className="ml-1 text-red-400 hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Emoji hinzufügen (z.B. 👋)"
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    const emoji = input.value.trim();
                    if (emoji && !(settings.memberIntroductionResponse?.reactions || []).includes(emoji)) {
                      setSettings(prev => ({
                        ...prev,
                        memberIntroductionResponse: {
                          ...prev.memberIntroductionResponse,
                          reactions: [...(prev.memberIntroductionResponse?.reactions || []), emoji]
                        }
                      }));
                      input.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Erkennungs-Keywords */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dark-text">Erkennungs-Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {(settings.memberIntroductionResponse?.detectionKeywords || []).map((keyword, index) => (
                <Badge key={index} variant="outline" className="flex items-center space-x-1">
                  <span>{keyword}</span>
                  <button
                    onClick={() => {
                      const newKeywords = [...(settings.memberIntroductionResponse?.detectionKeywords || [])];
                      newKeywords.splice(index, 1);
                      setSettings(prev => ({
                        ...prev,
                        memberIntroductionResponse: {
                          ...prev.memberIntroductionResponse,
                          detectionKeywords: newKeywords
                        }
                      }));
                    }}
                    className="ml-1 text-red-400 hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Neues Keyword hinzufügen..."
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    const keyword = input.value.trim().toLowerCase();
                    if (keyword && !(settings.memberIntroductionResponse?.detectionKeywords || []).includes(keyword)) {
                      setSettings(prev => ({
                        ...prev,
                        memberIntroductionResponse: {
                          ...prev.memberIntroductionResponse,
                          detectionKeywords: [...(prev.memberIntroductionResponse?.detectionKeywords || []), keyword]
                        }
                      }));
                      input.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Benutzerdefinierte Antworten */}
          <div className="space-y-4 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
            <h3 className="text-lg font-semibold text-dark-text flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-green-400" />
              <span>Benutzerdefinierte Antworten</span>
              <Badge variant="outline" className="text-green-400 border-green-400">
                🎲 {(settings.memberIntroductionResponse?.customResponses || []).length} Variationen
              </Badge>
            </h3>
            
            {/* Random Funktion Erklärung */}
            <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>🎲 Zufällige Antwort-Auswahl</span>
              </h4>
              <p className="text-xs text-dark-muted mb-2">
                Der Bot wählt <strong>automatisch zufällig</strong> eine der {(settings.memberIntroductionResponse?.customResponses || []).length} Antworten aus. 
                Jede Vorstellung bekommt eine andere, abwechslungsreiche Antwort!
              </p>
              <Button
                onClick={() => {
                  const responses = settings.memberIntroductionResponse?.customResponses || [];
                  if (responses.length > 0) {
                    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                    const previewText = randomResponse
                      .replace(/{user}/g, 'Max Mustermann')
                      .replace(/{username}/g, 'maxmuster')
                      .replace(/{server}/g, 'Gaming Cave')
                      .replace(/{channel}/g, 'vorstellungen');
                    
                    success(`🎲 Zufällige Vorschau: "${previewText}"`);
                  }
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xs px-3 py-1 rounded-md transition-all duration-300 hover:scale-105"
              >
                <Eye className="w-3 h-3 mr-1" />
                Zufällige Vorschau
              </Button>
            </div>
            
            <p className="text-dark-muted text-sm">
              Definiere eigene Antworttexte für Mitglieder-Vorstellungen. Verwende Platzhalter für dynamische Inhalte.
            </p>
            
            <div className="space-y-3">
              {(settings.memberIntroductionResponse?.customResponses || []).map((response, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/30">
                  <div className="flex-1">
                    <textarea
                      value={response}
                      onChange={(e) => {
                        const newResponses = [...(settings.memberIntroductionResponse?.customResponses || [])];
                        newResponses[index] = e.target.value;
                        setSettings(prev => ({
                          ...prev,
                          memberIntroductionResponse: {
                            ...prev.memberIntroductionResponse,
                            customResponses: newResponses
                          }
                        }));
                      }}
                      className="w-full h-20 p-2 bg-dark-bg/70 border border-purple-primary/30 rounded-md text-dark-text text-sm resize-none focus:border-neon-purple"
                      placeholder="Antworttext eingeben... (verwende {user} für den Benutzernamen)"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newResponses = [...(settings.memberIntroductionResponse?.customResponses || [])];
                      newResponses.splice(index, 1);
                      setSettings(prev => ({
                        ...prev,
                        memberIntroductionResponse: {
                          ...prev.memberIntroductionResponse,
                          customResponses: newResponses
                        }
                      }));
                    }}
                    className="text-red-400 hover:text-red-300 p-1 transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <Button
                onClick={() => {
                  const defaultResponses = [
                    "Hallo {user}! 👋 Herzlich willkommen auf **{server}**! Schön, dass du dich vorgestellt hast. Wir freuen uns, dich in unserer Community begrüßen zu dürfen! Falls du Fragen hast oder Hilfe brauchst, zögere nicht zu fragen. Viel Spaß beim Entdecken unseres Servers! 🎉",
                    "Hey {user}! 😊 Super, dass du zu **{server}** gefunden hast! Es ist immer toll, neue Gesichter in unserer Community zu sehen. Nimm dir gerne die Zeit, dich umzuschauen und lerne die anderen Mitglieder kennen. Bei Fragen sind wir alle da um zu helfen. Willkommen im Team! ✨",
                    "Hi {user}! 🤖 Willkommen auf **{server}**! Deine Vorstellung war sehr nett zu lesen. Wir haben hier eine tolle Gemeinschaft und ich bin sicher, du wirst dich schnell einleben. Scheue dich nicht, in den verschiedenen Channels aktiv zu werden. Viel Spaß! 🚀",
                    "Servus {user}! 🎊 Was für eine schöne Vorstellung! Wir heißen dich herzlich in unserer **{server}**-Familie willkommen. Hier gibt es viel zu entdecken und tolle Leute kennenzulernen. Falls du dich irgendwo nicht zurechtfindest oder Fragen hast, melde dich einfach. Schön, dass du da bist! 💜",
                    "Moin {user}! 🌟 Willkommen in der **{server}** Community! Deine Vorstellung hat uns sehr gefreut. Hier findest du bestimmt schnell Anschluss und neue Freunde. Lass dich von der guten Stimmung anstecken und hab eine tolle Zeit bei uns! 🎯",
                    "Heyho {user}! 🔥 Perfekte Vorstellung! **{server}** hat einen neuen Star bekommen! Wir sind eine super aktive und hilfsbereite Community. Du wirst hier bestimmt viel Spaß haben. Welcome to the family! 👨‍👩‍👧‍👦",
                    "Hi hi {user}! 🎮 Level up! Achievement unlocked: Welcome to **{server}**! 🏆 Deine Vorstellung war richtig cool. Hier gibt es Gaming, Fun und jede Menge nette Leute. Ready für das Abenteuer? Let's go! ⚡",
                    "Hey hey {user}! 🎯 Mega dass du zu **{server}** gefunden hast! Wir sind eine richtig coole Community und du passt perfekt dazu. Mach es dir gemütlich und entdecke all die tollen Channels. Bei Fragen einfach fragen! 🚀",
                    "Willkommen {user}! 🌈 **{server}** wird noch bunter mit dir dabei! Deine Vorstellung war super sympathisch. Hier herrscht immer gute Laune und jeder hilft jedem. Du wirst dich bestimmt schnell wie zuhause fühlen! ✨",
                    "Aloha {user}! 🏝️ Paradise gefunden? Ja, **{server}** ist der beste Ort im Discord-Universum! Deine Vorstellung war richtig nice. Hier ist immer was los und du wirst bestimmt schnell Teil unserer großen Familie! 🌺",
                    "Yo {user}! 💫 **{server}** hat gerade einen neuen Superhelden bekommen! Deine Vorstellung war mega. Hier findest du Gaming, Spaß, gute Gespräche und die besten Leute. Welcome to the squad! 🦸‍♂️",
                    "Grüß dich {user}! 🎪 Willkommen in der **{server}** Zirkus-Familie! Hier ist immer Action und gute Stimmung. Deine Vorstellung war der perfekte Auftritt! Lass die Show beginnen und hab eine grandiose Zeit! 🎭",
                    "Salut {user}! 🎨 **{server}** wird noch kreativer mit dir! Deine Vorstellung war wie ein kleines Kunstwerk. Hier kannst du dich ausleben, neue Sachen lernen und tolle Menschen kennenlernen. Viel Inspiration! 🖌️",
                    "Hallo {user}! 🚀 Houston, wir haben einen neuen Astronauten für **{server}**! Deine Vorstellung war out of this world! Hier erwarten dich unendliche Möglichkeiten und galaktisch gute Freunde. Ready for takeoff? 🌌",
                    "Hey {user}! 🎸 **{server}** rockt noch mehr mit dir dabei! Deine Vorstellung war wie ein Hit-Song. Hier ist die Musik immer gut und die Stimmung noch besser. Let the good times roll! 🎵",
                    "Hi {user}! 🔮 Magic happens - du bist jetzt Teil von **{server}**! Deine Vorstellung war verzaubernd. Hier erwarten dich magische Momente und fantastische Freundschaften. Abracadabra - Welcome! ✨",
                    "Moin {user}! ⚡ BOOM! **{server}** hat gerade neue Power bekommen! Deine Vorstellung war energiegeladen. Hier ist immer Hochspannung und du wirst bestimmt voll aufgeladen. Electricity in the air! 🌩️",
                    "Hey {user}! 🏆 Volltreffer! **{server}** hat den perfekten neuen Member gefunden! Deine Vorstellung war Champions League! Hier spielen wir alle in der obersten Liga der Freundschaft. Game on! ⚽",
                    "Heyho {user}! 🎊 **{server}** feiert heute - du bist da! Deine Vorstellung war wie Feuerwerk am Himmel. Hier ist jeden Tag Party und du bist der neue Star auf der Tanzfläche! Let's celebrate! 💃",
                    "Welcome {user}! 🌟 **{server}** strahlt noch heller mit dir! Deine Vorstellung war wie ein Leuchtturm - einfach strahlend! Hier findest du deinen Hafen und jede Menge treue Matrosen. Ahoy! ⚓"
                  ];
                  
                  const randomDefault = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
                  
                  setSettings(prev => ({
                    ...prev,
                    memberIntroductionResponse: {
                      ...prev.memberIntroductionResponse,
                      customResponses: [...(prev.memberIntroductionResponse?.customResponses || []), randomDefault]
                    }
                  }));
                }}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Neue Antwort hinzufügen
              </Button>
              
              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <h4 className="text-sm font-medium text-blue-400 mb-2">Verfügbare Platzhalter:</h4>
                <div className="text-xs text-dark-muted space-y-1">
                  <div><code className="bg-dark-bg px-1 rounded text-blue-300">{'{user}'}</code> - Benutzername/Display Name</div>
                  <div><code className="bg-dark-bg px-1 rounded text-blue-300">{'{username}'}</code> - Discord Username</div>
                  <div><code className="bg-dark-bg px-1 rounded text-blue-300">{'{server}'}</code> - Server Name</div>
                  <div><code className="bg-dark-bg px-1 rounded text-blue-300">{'{channel}'}</code> - Channel Name</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* XP-Bonus System */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            XP-Bonus für Vorstellungen
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              🎯 Einmalig
            </Badge>
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Belohne User mit extra XP für ihre erste Vorstellung auf dem Server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* XP-Bonus aktivieren */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg border border-yellow-500/30">
            <div>
              <h4 className="text-lg font-semibold text-yellow-400 mb-1">XP-Bonus aktiviert</h4>
              <p className="text-sm text-dark-muted">
                User erhalten automatisch Bonus-XP für ihre erste Vorstellung
              </p>
            </div>
            <Switch
              checked={settings.memberIntroductionResponse?.xpBonus?.enabled || false}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                memberIntroductionResponse: {
                  ...prev.memberIntroductionResponse,
                  xpBonus: {
                    ...prev.memberIntroductionResponse?.xpBonus,
                    enabled: checked
                  }
                }
              }))}
              className="data-[state=checked]:bg-yellow-500"
            />
          </div>

          {/* XP-Bonus Konfiguration */}
          {settings.memberIntroductionResponse?.xpBonus?.enabled && (
            <div className="space-y-4">
              {/* XP-Menge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">
                    Bonus XP-Menge
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.memberIntroductionResponse?.xpBonus?.amount || 100}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      memberIntroductionResponse: {
                        ...prev.memberIntroductionResponse,
                        xpBonus: {
                          ...prev.memberIntroductionResponse?.xpBonus,
                          amount: parseInt(e.target.value) || 100
                        }
                      }
                    }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    placeholder="100"
                  />
                  <p className="text-xs text-dark-muted mt-1">
                    Empfohlen: 50-200 XP (je nach Server-Größe)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">
                    Nur einmalig pro User
                  </label>
                  <div className="flex items-center space-x-3 p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                    <Switch
                      checked={settings.memberIntroductionResponse?.xpBonus?.onlyFirstTime || true}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        memberIntroductionResponse: {
                          ...prev.memberIntroductionResponse,
                          xpBonus: {
                            ...prev.memberIntroductionResponse?.xpBonus,
                            onlyFirstTime: checked
                          }
                        }
                      }))}
                      className="data-[state=checked]:bg-purple-primary"
                    />
                    <div>
                      <p className="text-sm text-dark-text font-medium">
                        {settings.memberIntroductionResponse?.xpBonus?.onlyFirstTime ? 'Einmalig' : 'Jedes Mal'}
                      </p>
                      <p className="text-xs text-dark-muted">
                        {settings.memberIntroductionResponse?.xpBonus?.onlyFirstTime 
                          ? 'User erhalten nur einmal Bonus-XP' 
                          : 'User erhalten bei jeder Vorstellung Bonus-XP'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bonus-Nachricht */}
              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">
                  Bonus-Nachricht (Optional)
                </label>
                <Textarea
                  value={settings.memberIntroductionResponse?.xpBonus?.message || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    memberIntroductionResponse: {
                      ...prev.memberIntroductionResponse,
                      xpBonus: {
                        ...prev.memberIntroductionResponse?.xpBonus,
                        message: e.target.value
                      }
                    }
                  }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple resize-none"
                  rows={3}
                  placeholder="🎉 Bonus! Du hast {amount} XP für deine erste Vorstellung erhalten!"
                />
                <div className="mt-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <h5 className="text-sm font-medium text-blue-400 mb-2">Verfügbare Platzhalter:</h5>
                  <div className="text-xs text-dark-muted space-y-1">
                    <div><code className="bg-dark-bg px-1 rounded text-blue-300">{'{amount}'}</code> - XP-Bonus-Menge</div>
                    <div><code className="bg-dark-bg px-1 rounded text-blue-300">{'{user}'}</code> - Benutzername</div>
                    <div><code className="bg-dark-bg px-1 rounded text-blue-300">{'{server}'}</code> - Server-Name</div>
                  </div>
                </div>
              </div>

              {/* Auto-Delete Konfiguration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-lg border border-red-500/30">
                  <div>
                    <h4 className="text-lg font-semibold text-red-400 mb-1">Nachricht automatisch löschen</h4>
                    <p className="text-sm text-dark-muted">
                      Bonus-Nachricht nach bestimmter Zeit automatisch entfernen
                    </p>
                  </div>
                  <Switch
                    checked={settings.memberIntroductionResponse?.xpBonus?.autoDelete?.enabled || false}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      memberIntroductionResponse: {
                        ...prev.memberIntroductionResponse,
                        xpBonus: {
                          ...prev.memberIntroductionResponse?.xpBonus,
                          autoDelete: {
                            ...prev.memberIntroductionResponse?.xpBonus?.autoDelete,
                            enabled: checked
                          }
                        }
                      }
                    }))}
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>

                {settings.memberIntroductionResponse?.xpBonus?.autoDelete?.enabled && (
                  <div>
                    <label className="text-sm font-medium text-dark-text mb-2 block">
                      Löschzeit (Sekunden)
                    </label>
                    <Input
                      type="number"
                      min="5"
                      max="300"
                      value={settings.memberIntroductionResponse?.xpBonus?.autoDelete?.delaySeconds || 10}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        memberIntroductionResponse: {
                          ...prev.memberIntroductionResponse,
                          xpBonus: {
                            ...prev.memberIntroductionResponse?.xpBonus,
                            autoDelete: {
                              ...prev.memberIntroductionResponse?.xpBonus?.autoDelete,
                              delaySeconds: Math.max(5, Math.min(300, parseInt(e.target.value) || 10))
                            }
                          }
                        }
                      }))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      placeholder="10"
                    />
                    <div className="text-xs text-dark-muted mt-1 flex items-center space-x-2">
                      <span>Empfohlen: 10-30 Sekunden (Min: 5, Max: 300)</span>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            memberIntroductionResponse: {
                              ...prev.memberIntroductionResponse,
                              xpBonus: {
                                ...prev.memberIntroductionResponse?.xpBonus,
                                autoDelete: {
                                  ...prev.memberIntroductionResponse?.xpBonus?.autoDelete,
                                  delaySeconds: 10
                                }
                              }
                            }
                          }))}
                          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                        >
                          10s
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            memberIntroductionResponse: {
                              ...prev.memberIntroductionResponse,
                              xpBonus: {
                                ...prev.memberIntroductionResponse?.xpBonus,
                                autoDelete: {
                                  ...prev.memberIntroductionResponse?.xpBonus?.autoDelete,
                                  delaySeconds: 30
                                }
                              }
                            }
                          }))}
                          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                        >
                          30s
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            memberIntroductionResponse: {
                              ...prev.memberIntroductionResponse,
                              xpBonus: {
                                ...prev.memberIntroductionResponse?.xpBonus,
                                autoDelete: {
                                  ...prev.memberIntroductionResponse?.xpBonus?.autoDelete,
                                  delaySeconds: 60
                                }
                              }
                            }
                          }))}
                          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                        >
                          60s
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* XP-System Integration Hinweis */}
              <div className="p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30">
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-semibold text-purple-400 mb-1">
                      🔗 XP-System Integration
                    </h5>
                    <p className="text-xs text-dark-muted mb-2">
                      Das XP-Bonus-System ist automatisch mit dem Server-XP-System verbunden:
                    </p>
                    <ul className="text-xs text-dark-muted space-y-1">
                      <li>• ✅ Automatische Level-Ups möglich</li>
                      <li>• ✅ Rollen-Vergabe bei Level-Erreichen</li>
                      <li>• ✅ Meilenstein-Belohnungen</li>
                      <li>• ✅ Leaderboard-Integration</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Embed-Konfiguration */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-accent" />
            Bot-Vorstellungs-Embed konfigurieren
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              📝 Editierbar
            </Badge>
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Passe den Inhalt und das Aussehen der automatischen Bot-Vorstellung an deine Server-Features an
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Embed Grundeinstellungen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Embed-Titel</Label>
              <Input
                value={settings.embed.title}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  embed: { ...prev.embed, title: e.target.value }
                }))}
                className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                placeholder="🤖 Hallo! Ich bin {botName}"
              />
              <p className="text-xs text-dark-muted">
                Verwende <code className="bg-dark-bg px-1 rounded text-blue-300">{'{botName}'}</code> für den Bot-Namen
              </p>
            </div>

            <div className="space-y-2">
              <Label>Embed-Farbe</Label>
              <div className="flex space-x-2">
                <Input
                  value={settings.embed.color}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    embed: { ...prev.embed, color: e.target.value }
                  }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                  placeholder="0x9333EA"
                />
                <div 
                  className="w-12 h-10 rounded border border-purple-primary/30 flex-shrink-0"
                  style={{ backgroundColor: `#${settings.embed.color.replace('0x', '')}` }}
                />
              </div>
              <div className="flex space-x-1 text-xs">
                {['0x9333EA', '0x00FF7F', '0xFF6B6B', '0x4ECDC4', '0xFFE66D', '0xFF8A65'].map(color => (
                  <button
                    key={color}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      embed: { ...prev.embed, color }
                    }))}
                    className="w-6 h-6 rounded border border-white/20 hover:scale-110 transition-transform"
                    style={{ backgroundColor: `#${color.replace('0x', '')}` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Embed-Beschreibung */}
          <div className="space-y-2">
            <Label>Hauptbeschreibung</Label>
            <Textarea
              value={settings.embed.description}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                embed: { ...prev.embed, description: e.target.value }
              }))}
              className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple resize-none"
              rows={3}
              placeholder="Schön dich kennenzulernen! Ich bin dein freundlicher Discord-Bot..."
            />
          </div>

          {/* Footer */}
          <div className="space-y-2">
            <Label>Footer-Text</Label>
            <Input
              value={settings.embed.footer}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                embed: { ...prev.embed, footer: e.target.value }
              }))}
              className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
              placeholder="Entwickelt mit ❤️ • {version} • {timestamp}"
            />
            <p className="text-xs text-dark-muted">
              Verwende <code className="bg-dark-bg px-1 rounded text-blue-300">{'{version}'}</code> für die Version und <code className="bg-dark-bg px-1 rounded text-blue-300">{'{timestamp}'}</code> für die aktuelle Zeit
            </p>
          </div>

          {/* Author-Einstellungen */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.embed.author.enabled}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  embed: { 
                    ...prev.embed, 
                    author: { ...prev.embed.author, enabled: checked }
                  }
                }))}
              />
              <Label>Author-Zeile aktiviert</Label>
              <Tooltip content="Zeigt eine Author-Zeile oberhalb des Embeds" />
            </div>

            {settings.embed.author.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label>Author-Name</Label>
                  <Input
                    value={settings.embed.author.name}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      embed: { 
                        ...prev.embed, 
                        author: { ...prev.embed.author, name: e.target.value }
                      }
                    }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    placeholder="{botName} - Dein Discord Assistent"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Author-Icon URL (Optional)</Label>
                  <Input
                    value={settings.embed.author.iconUrl}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      embed: { 
                        ...prev.embed, 
                        author: { ...prev.embed.author, iconUrl: e.target.value }
                      }
                    }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Embed-Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark-text">Embed-Felder</h3>
              <Button
                onClick={addField}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Feld hinzufügen
              </Button>
            </div>

            <div className="space-y-4">
              {settings.embed.fields.map((field, index) => (
                <div key={index} className="p-4 bg-dark-bg/50 rounded-lg border border-purple-primary/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-dark-text">Feld {index + 1}</h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.inline}
                          onCheckedChange={(checked) => updateField(index, 'inline', checked)}
                        />
                        <Label className="text-sm">Inline</Label>
                      </div>
                      <button
                        onClick={() => removeField(index)}
                        className="text-red-400 hover:text-red-300 p-1 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Feld-Name</Label>
                      <Input
                        value={field.name}
                        onChange={(e) => updateField(index, 'name', e.target.value)}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                        placeholder="🛡️ Meine Hauptfunktionen"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label>Feld-Inhalt</Label>
                    <Textarea
                      value={field.value}
                      onChange={(e) => updateField(index, 'value', e.target.value)}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple resize-none"
                      rows={4}
                      placeholder="• **Feature 1** - Beschreibung&#10;• **Feature 2** - Beschreibung"
                    />
                    <p className="text-xs text-dark-muted">
                      Verwende ** für fette Schrift und • für Aufzählungen. Neue Zeile: \n
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {settings.embed.fields.length === 0 && (
              <div className="text-center py-8 text-dark-muted">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Keine Embed-Felder konfiguriert</p>
                <p className="text-sm">Klicke auf "Feld hinzufügen" um zu starten</p>
              </div>
            )}
          </div>

          {/* Vorschau-Hinweis */}
          <div className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30">
            <div className="flex items-start space-x-3">
              <Eye className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h5 className="text-sm font-semibold text-blue-400 mb-1">
                  📝 Embed-Vorschau
                </h5>
                <p className="text-xs text-dark-muted mb-2">
                  Nutze die "Test-Vorstellung" Funktion um deine Änderungen zu testen
                </p>
                <ul className="text-xs text-dark-muted space-y-1">
                  <li>• 💾 Speichere zuerst deine Änderungen</li>
                  <li>• 🧪 Klicke dann auf "Test-Vorstellung"</li>
                  <li>• 👀 Überprüfe das Ergebnis im konfigurierten Channel</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick-Actions für Embed */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setSettings(prev => ({
                  ...prev,
                  embed: {
                    ...prev.embed,
                                         title: '🤖 Hallo! Ich bin {botName}',
                     description: 'Dein intelligenter Discord-Assistent für Gaming, Moderation und Entertainment! Ich bringe deinen Server auf das nächste Level! 🚀',
                     color: '0x9333EA',
                    footer: 'Entwickelt mit ❤️ • {version} • {timestamp}',
                    author: {
                      enabled: true,
                      name: '{botName} - Dein Discord Assistent',
                      iconUrl: ''
                    },
                    fields: [
                      {
                        name: '🎯 Moderation & Verwaltung',
                        value: '• **Moderation** - Auto-Filter, Warns & Mutes mit Supabase\n• **Ticket-System** - Support-Channels mit V2-Integration\n• **Welcome-System** - Personalisierte Begrüßungen\n• **Verifizierung** - Captcha & Game-Authentifizierung\n• **Spam-Schutz** - Intelligente Raid-Erkennung',
                        inline: false
                      },
                      {
                        name: '📈 Community Features',
                        value: '• **XP-System** - Level-Belohnungen & Leaderboards (Supabase-persistent)\n• **Giveaways** - Faire Verlosungen mit Anti-Cheat\n• **Server-Stats** - Live-Channels & Analytics\n• **Rules-System** - Automatische Regel-Posts',
                        inline: true
                      },
                      {
                        name: '🎮 Gaming Integration',
                        value: '• **Valorant** - Rang-Tracking & Match-History mit Cards\n• **Twitch-Alerts** - Live-Stream Benachrichtigungen mit AI\n• **Game-Roles** - Automatische Rollen-Zuweisung',
                        inline: true
                      },
                      {
                        name: '🎵 Musik & Entertainment',
                        value: '• **Simple Music Panel** - Benutzerfreundliche Musik-Steuerung\n• **YouTube Radio** - Streaming-Integration\n• **Song-Requests** - Community-Playlists\n• **Voice-XP** - Belohnungen für Voice-Aktivität',
                        inline: false
                      },
                      {
                        name: '🤖 AI & Technologie',
                        value: '• **OpenAI Integration** - Smart-Responses & Personalisierung\n• **Supabase Backend** - Moderne Datenbank-Persistierung\n• **Web-Dashboard** - Vollständige Bot-Konfiguration\n• **API-Management** - Zentrale Schlüssel-Verwaltung',
                        inline: false
                      },
                      {
                        name: '⚡ Schnellstart',
                        value: 'Nutze `/help` um alle Befehle zu sehen oder besuche das **Web-Dashboard** für erweiterte Konfiguration!',
                        inline: true
                      },
                      {
                        name: '🔧 Dashboard',
                        value: 'Komplette Bot-Verwaltung über das moderne React-Dashboard mit Echtzeit-Updates!',
                        inline: true
                      }
                    ]
                  }
                }));
                success('✅ Standard-Embed wiederhergestellt!');
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105"
            >
              🔄 Standard wiederherstellen
            </Button>

            <Button
              onClick={() => {
                const randomColors = ['0x9333EA', '0x00FF7F', '0xFF6B6B', '0x4ECDC4', '0xFFE66D', '0xFF8A65'];
                const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)];
                setSettings(prev => ({
                  ...prev,
                  embed: { ...prev.embed, color: randomColor }
                }));
                success(`🎨 Zufällige Farbe gesetzt: ${randomColor}`);
              }}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105"
            >
              🎨 Zufällige Farbe
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Toast Container */}
      <ToastContainer 
        toasts={toasts} 
        removeToast={removeToast} 
      />
    </div>
  );
};

export default BotIntroduction; 