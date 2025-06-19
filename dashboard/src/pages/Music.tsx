import { useState, useEffect } from 'react';
import { Music as MusicIcon, Play, Pause, SkipForward, Volume2, List, Settings, Plus, Trash2, Search, Mic, Users, Shuffle, Radio, Save } from 'lucide-react';
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

// Card components
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-dark-surface/90 backdrop-blur-xl border border-purple-primary/30 shadow-purple-glow rounded-lg ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 pb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-xl font-bold text-dark-text ${className}`}>
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

// Button component
const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string; 
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}> = ({ children, onClick, className = '', disabled = false, variant = 'default' }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variantClasses = {
    default: "bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white shadow-neon hover:scale-105",
    destructive: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-neon hover:scale-105",
    outline: "border border-purple-primary/30 bg-transparent hover:bg-purple-primary/20 text-dark-text",
    secondary: "bg-dark-surface/50 hover:bg-dark-surface text-dark-text",
    ghost: "hover:bg-purple-primary/20 text-dark-text",
    link: "text-purple-primary underline-offset-4 hover:underline"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} px-4 py-2 ${className}`}
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
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  id?: string;
}> = ({ type = 'text', placeholder, value, onChange, onKeyPress, className = '', ...props }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onKeyPress={onKeyPress}
    className={`bg-dark-bg/70 border border-purple-primary/30 text-dark-text focus:border-neon-purple rounded-lg px-3 py-2 w-full transition-colors duration-200 ${className}`}
    {...props}
  />
);

// Interfaces
interface MusicSettings {
  enabled: boolean;
  defaultVolume: number;
  maxQueueLength: number;
  autoJoinVoice: boolean;
  voiceChannels: {
    autoJoin: string[];
    preferred: string;
    blacklist: string[];
  };
  commands: {
    enabled: boolean;
    prefix: string;
    djRole: string;
    allowEveryone: boolean;
  };
  queue: {
    autoplay: boolean;
    shuffle: boolean;
    repeat: string;
    clearOnEmpty: boolean;
  };
  filters: {
    bass: boolean;
    nightcore: boolean;
    vaporwave: boolean;
    lowpass: boolean;
  };
  youtube: {
    quality: string;
    maxLength: number;
    playlistLimit: number;
  };
  announcements: {
    nowPlaying: boolean;
    queueAdd: boolean;
    channelId: string;
  };
  embedColor: string;
  songRequests: {
    enabled: boolean;
    channels: string[];
    prefix: string;
    embedColor: string;
    requireDJRole: boolean;
    maxRequestsPerUser: number;
    cooldownMinutes: number;
    rateLimit: {
      enabled: boolean;
      maxRequests: number;
      timeWindow: number; // in minutes
      timeUnit: 'minutes' | 'hours' | 'days';
    };
    interactivePanel: {
      enabled: boolean;
      channelId: string;
      messageId: string;
      autoUpdate: boolean;
      showQueue: boolean;
      maxQueueDisplay: number;
      requireDJForControls: boolean;
      autoJoinLeave: boolean;
      adminRole: string;
    };
  };
  radio?: {
    enabled: boolean;
    stations: RadioStation[];
    defaultStation: string;
    autoStop: boolean;
    showNowPlaying: boolean;
    embedColor: string;
  };
}

interface Song {
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
  author: string;
  requestedBy?: string;
}

interface Queue {
  currentSong: Song | null;
  songs: Song[];
  volume: number;
  repeat: string;
  shuffle: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
}

interface RequestTrackingData {
  userId: string;
  username: string;
  requestsUsed: number;
  remainingRequests: number;
  resetTime: number | null;
  lastRequest: number | null;
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

// CSS Animation für Progress Bar
const progressBarStyles = `
  @keyframes progressSlide {
    0% { transform: translateX(-100%) skewX(-12deg); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateX(400%) skewX(-12deg); opacity: 0; }
  }
  
  @keyframes progressGlow {
    0%, 100% { box-shadow: 0 0 15px rgba(147, 51, 234, 0.8), 0 0 30px rgba(147, 51, 234, 0.4); }
    50% { box-shadow: 0 0 25px rgba(147, 51, 234, 1), 0 0 50px rgba(147, 51, 234, 0.6); }
  }
`;

const Music: React.FC = () => {
  // API Base URL
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('player');
  
import { useState, useEffect } from 'react';
import { Music as MusicIcon, Play, Pause, SkipForward, Volume2, List, Settings, Plus, Trash2, Search, Mic, Users, Shuffle, Radio, Save } from 'lucide-react';
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

// Card components
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-dark-surface/90 backdrop-blur-xl border border-purple-primary/30 shadow-purple-glow rounded-lg ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 pb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-xl font-bold text-dark-text ${className}`}>
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

// Button component
const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string; 
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}> = ({ children, onClick, className = '', disabled = false, variant = 'default' }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variantClasses = {
    default: "bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white shadow-neon hover:scale-105",
    destructive: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-neon hover:scale-105",
    outline: "border border-purple-primary/30 bg-transparent hover:bg-purple-primary/20 text-dark-text",
    secondary: "bg-dark-surface/50 hover:bg-dark-surface text-dark-text",
    ghost: "hover:bg-purple-primary/20 text-dark-text",
    link: "text-purple-primary underline-offset-4 hover:underline"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} px-4 py-2 ${className}`}
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
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  id?: string;
}> = ({ type = 'text', placeholder, value, onChange, onKeyPress, className = '', ...props }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onKeyPress={onKeyPress}
    className={`bg-dark-bg/70 border border-purple-primary/30 text-dark-text focus:border-neon-purple rounded-lg px-3 py-2 w-full transition-colors duration-200 ${className}`}
    {...props}
  />
);

// Interfaces
interface MusicSettings {
  enabled: boolean;
  defaultVolume: number;
  maxQueueLength: number;
  autoJoinVoice: boolean;
  voiceChannels: {
    autoJoin: string[];
    preferred: string;
    blacklist: string[];
  };
  commands: {
    enabled: boolean;
    prefix: string;
    djRole: string;
    allowEveryone: boolean;
  };
  queue: {
    autoplay: boolean;
    shuffle: boolean;
    repeat: string;
    clearOnEmpty: boolean;
  };
  filters: {
    bass: boolean;
    nightcore: boolean;
    vaporwave: boolean;
    lowpass: boolean;
  };
  youtube: {
    quality: string;
    maxLength: number;
    playlistLimit: number;
  };
  announcements: {
    nowPlaying: boolean;
    queueAdd: boolean;
    channelId: string;
  };
  embedColor: string;
  songRequests: {
    enabled: boolean;
    channels: string[];
    prefix: string;
    embedColor: string;
    requireDJRole: boolean;
    maxRequestsPerUser: number;
    cooldownMinutes: number;
    rateLimit: {
      enabled: boolean;
      maxRequests: number;
      timeWindow: number; // in minutes
      timeUnit: 'minutes' | 'hours' | 'days';
    };
    interactivePanel: {
      enabled: boolean;
      channelId: string;
      messageId: string;
      autoUpdate: boolean;
      showQueue: boolean;
      maxQueueDisplay: number;
      requireDJForControls: boolean;
      autoJoinLeave: boolean;
      adminRole: string;
    };
  };
  radio?: {
    enabled: boolean;
    stations: RadioStation[];
    defaultStation: string;
    autoStop: boolean;
    showNowPlaying: boolean;
    embedColor: string;
  };
}

interface Song {
  title: string;
  url: string;
  duration: number;
  thumbnail: string;
  author: string;
  requestedBy?: string;
}

interface Queue {
  currentSong: Song | null;
  songs: Song[];
  volume: number;
  repeat: string;
  shuffle: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
}

interface RequestTrackingData {
  userId: string;
  username: string;
  requestsUsed: number;
  remainingRequests: number;
  resetTime: number | null;
  lastRequest: number | null;
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

// CSS Animation für Progress Bar
const progressBarStyles = `
  @keyframes progressSlide {
    0% { transform: translateX(-100%) skewX(-12deg); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateX(400%) skewX(-12deg); opacity: 0; }
  }
  
  @keyframes progressGlow {
    0%, 100% { box-shadow: 0 0 15px rgba(147, 51, 234, 0.8), 0 0 30px rgba(147, 51, 234, 0.4); }
    50% { box-shadow: 0 0 25px rgba(147, 51, 234, 1), 0 0 50px rgba(147, 51, 234, 0.6); }
  }
`;

const Music: React.FC = () => {
  // API Base URL
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('player');
  
  // Settings State
  const [settings, setSettings] = useState<MusicSettings>({
    enabled: true,
    defaultVolume: 50,
    maxQueueLength: 100,
    autoJoinVoice: true,
    voiceChannels: {
      autoJoin: [],
      preferred: "",
      blacklist: []
    },
    commands: {
      enabled: true,
      prefix: "!",
      djRole: "",
      allowEveryone: true
    },
    queue: {
      autoplay: false,
      shuffle: false,
      repeat: "off",
      clearOnEmpty: true
    },
    filters: {
      bass: false,
      nightcore: false,
      vaporwave: false,
      lowpass: false
    },
    youtube: {
      quality: "highestaudio",
      maxLength: 600,
      playlistLimit: 50
    },
    announcements: {
      nowPlaying: true,
      queueAdd: true,
      channelId: ""
    },
    embedColor: "#9333EA",
    songRequests: {
      enabled: true,
      channels: [],
      prefix: "!play",
      embedColor: "#9333EA",
      requireDJRole: false,
      maxRequestsPerUser: 5,
      cooldownMinutes: 1,
      rateLimit: {
        enabled: true,
        maxRequests: 5,
        timeWindow: 60,
        timeUnit: 'minutes'
      },
      interactivePanel: {
        enabled: true,
        channelId: "",
        messageId: "",
        autoUpdate: true,
        showQueue: true,
        maxQueueDisplay: 5,
        requireDJForControls: false,
        autoJoinLeave: false,
        adminRole: ""
      }
    }
  });

  // Queue State
  const [queue, setQueue] = useState<Queue>({
    currentSong: null,
    songs: [],
    volume: 50,
    repeat: "off",
    shuffle: false
  });

  // Search State
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Player Progress State
  const [progress, setProgress] = useState({
    currentTime: 0,
    duration: 0,
    currentTimeFormatted: '0:00',
    durationFormatted: '0:00',
    percentage: 0
  });
  const [searching, setSearching] = useState(false);

  // Channels und Roles
  const [channels, setChannels] = useState<Channel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  // Guild ID State
  const [guildId, setGuildId] = useState<string | null>(null);

  // Request Tracking State
  const [requestTracking, setRequestTracking] = useState<RequestTrackingData[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  
  // Auto-Update State
  const [autoUpdateActive, setAutoUpdateActive] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);

  // Radio State
  const [radioStations, setRadioStations] = useState<RadioStation[]>([]);
  const [radioStatus, setRadioStatus] = useState<RadioStatus>({
    isPlaying: false,
    currentStation: null
  });
  const [radioLoading, setRadioLoading] = useState(false);
  const [newStation, setNewStation] = useState({
    name: '',
    url: '',
    genre: '',
    country: '',
    description: '',
    logo: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Zuerst Guild-ID laden
      const guildsRes = await fetch(`${apiUrl}/api/guilds`);
      let currentGuildId = null;
      
      if (guildsRes.ok) {
        const guildsData = await guildsRes.json();
        currentGuildId = guildsData.primaryGuild;
        setGuildId(currentGuildId);
      }

      if (!currentGuildId) {
        showError('Guild Fehler', '❌ Keine Guild-ID gefunden. Bot möglicherweise offline.');
        return;
      }

      // Load all data in parallel
      const [settingsRes, channelsRes, rolesRes, queueRes] = await Promise.all([
        fetch(`${apiUrl}/api/music/settings`),
        fetch(`${apiUrl}/api/channels`),
        fetch(`${apiUrl}/api/roles`),
        fetch(`${apiUrl}/api/music/queue/${currentGuildId}`)
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings);
      }

      if (channelsRes.ok) {
        const data = await channelsRes.json();
        setChannels(data.channels || []);
      }

      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setRoles(data.roles || []);
      }

      if (queueRes.ok) {
        const data = await queueRes.json();
        setQueue(data.queue);
      }

      // Load request tracking data
      await loadRequestTracking();

    } catch (err) {
      console.error('Fehler beim Laden der Daten:', err);
      showError('Lade Fehler', 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const loadRequestTracking = async () => {
    try {
      setTrackingLoading(true);
      const response = await fetch(`${apiUrl}/api/music/request-tracking`);
      if (response.ok) {
        const data = await response.json();
        setRequestTracking(data.trackingData || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Request-Tracking Daten:', error);
    } finally {
      setTrackingLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${apiUrl}/api/music/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        success('🎵 Musik-Einstellungen erfolgreich gespeichert!');
      } else {
        error('❌ Fehler beim Speichern der Einstellungen');
      }
    } catch (err) {
      console.error('Speicherfehler:', err);
      error('❌ Netzwerkfehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const searchYouTube = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch(`${apiUrl}/api/music/search?query=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results);
      }
    } catch (err) {
      error('❌ Fehler bei der YouTube-Suche');
    } finally {
      setSearching(false);
    }
  };

  const addToQueue = async (song: Song) => {
    if (!guildId) {
      error('❌ Keine Guild-ID verfügbar');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/music/queue/${guildId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: song.url, requestedBy: 'Dashboard' })
      });

      if (response.ok) {
        success(`🎵 "${song.title}" zur Queue hinzugefügt!`);
        loadData(); // Refresh queue
      } else {
        error('❌ Fehler beim Hinzufügen zur Queue');
      }
    } catch (err) {
      error('❌ Netzwerkfehler');
    }
  };

  const controlPlayback = async (action: string) => {
    if (!guildId) {
      error('❌ Keine Guild-ID verfügbar');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/music/control/${guildId}/${action}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        success(data.message || `🎵 ${action} ausgeführt!`);
        loadData(); // Refresh queue
      } else {
        const errorData = await response.json();
        error(errorData.error || `❌ Fehler bei ${action}`);
      }
    } catch (err) {
      error('❌ Netzwerkfehler');
    }
  };

  const joinVoiceChannel = async (channelId: string) => {
    if (!guildId) {
      error('❌ Keine Guild-ID verfügbar');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/music/voice/${guildId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId })
      });

      if (response.ok) {
        const data = await response.json();
        success(data.message);
      } else {
        error('❌ Fehler beim Beitreten des Voice-Channels');
      }
    } catch (err) {
      error('❌ Netzwerkfehler');
    }
  };

  const leaveVoiceChannel = async () => {
    if (!guildId) {
      error('❌ Keine Guild-ID verfügbar');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/music/voice/${guildId}/leave`, {
        method: 'POST'
      });

      if (response.ok) {
        success('👋 Voice-Channel verlassen');
      }
    } catch (err) {
      error('❌ Netzwerkfehler');
    }
  };
  
  const updateVolume = async (newVolume: number) => {
    if (!guildId) {
      error('❌ Keine Guild-ID verfügbar');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/music/volume/${guildId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: newVolume })
      });

      if (response.ok) {
        const data = await response.json();
        setQueue(prev => ({ ...prev, volume: newVolume }));
        success(`🔊 ${data.message}`);
      } else {
        const errorData = await response.json();
        error(errorData.error || '❌ Fehler beim Ändern der Lautstärke');
      }
    } catch (err) {
      error('❌ Netzwerkfehler beim Ändern der Lautstärke');
    }
  };

  const updateProgress = async () => {
    if (!guildId) return;

    try {
      const response = await fetch(`${apiUrl}/api/music/voice/${guildId}/status`);
      if (response.ok) {
        const data = await response.json();
        if (data.status.progress) {
          setProgress(data.status.progress);
        }
      }
    } catch (err) {
      // Silent fail - progress updates are not critical
      console.log('Progress update failed:', err);
    }
  };

  const createDJRole = async () => {
    if (!guildId) {
      error('❌ Keine Guild-ID verfügbar');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/music/create-dj-role/${guildId}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        success(`🎭 ${data.message}`);
        loadData(); // Reload roles
      } else {
        const errorData = await response.json();
        error(errorData.error || '❌ Fehler beim Erstellen der DJ-Rolle');
      }
    } catch (err) {
      error('❌ Netzwerkfehler');
    }
  };

  const testPopularSong = async () => {
    if (!guildId) {
      error('❌ Keine Guild-ID verfügbar');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/music/test-popular-song/${guildId}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        success(`🧪 ${data.message}`);
        loadData(); // Reload queue
      } else {
        const errorData = await response.json();
        error(errorData.error || '❌ Test-Song fehlgeschlagen');
      }
    } catch (err) {
      error('❌ Netzwerkfehler');
    }
  };

  const reconnectVoice = async () => {
    if (!guildId) {
      error('❌ Keine Guild-ID verfügbar');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${apiUrl}/api/music/reconnect/${guildId}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        success(`🔄 ${data.message}`);
        // Reload queue and progress after reconnect
        setTimeout(() => {
          updateProgress();
          loadData();
        }, 2000);
      } else {
        const errorData = await response.json();
        error(errorData.error || '❌ Voice-Reconnect fehlgeschlagen');
      }
    } catch (err) {
      error('❌ Netzwerkfehler beim Voice-Reconnect');
    } finally {
      setSaving(false);
    }
  };

  const postInteractivePanel = async () => {
    if (!guildId) {
      error('❌ Keine Guild-ID verfügbar');
      return;
    }

    if (!settings.songRequests.interactivePanel.channelId) {
      error('❌ Kein Channel für Interactive Panel ausgewählt');
      return;
    }

    try {
      // First save the current settings to ensure channelId is saved
      console.log('🔄 Speichere Settings vor Panel-Post...');
      const saveResponse = await fetch(`${apiUrl}/api/music/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!saveResponse.ok) {
        error('❌ Fehler beim Speichern der Settings');
        return;
      }

      console.log('✅ Settings gespeichert, poste Interactive Panel...');

      // Then post the interactive panel
      const response = await fetch(`${apiUrl}/api/music/interactive-panel/${guildId}/post`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        success(`🎵 ${data.message}`);
        loadData(); // Reload settings to get message ID
      } else {
        const errorData = await response.json();
        error(errorData.error || '❌ Fehler beim Posten des Interactive Panels');
      }
    } catch (err) {
      console.error('Interactive Panel Post Error:', err);
      error('❌ Netzwerkfehler');
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Radio Functions
  const loadRadioStations = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/music/radio/stations`);
      if (response.ok) {
        const data = await response.json();
        setRadioStations(data.stations || []);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Radio-Sender:', err);
      error('Fehler beim Laden der Radio-Sender');
    }
  };

  const loadRadioStatus = async () => {
    if (!guildId) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/music/radio/${guildId}/status`);
      if (response.ok) {
        const data = await response.json();
        setRadioStatus({
          isPlaying: data.isPlaying,
          currentStation: data.currentStation
        });
      }
    } catch (err) {
      console.error('Fehler beim Laden des Radio-Status:', err);
    }
  };

  const playRadioStation = async (stationId: string) => {
    if (!guildId) {
      error('Keine Guild-ID verfügbar');
      return;
    }

    try {
      setRadioLoading(true);
      const response = await fetch(`${apiUrl}/api/music/radio/${guildId}/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stationId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        success(data.message);
        await loadRadioStatus();
        await loadData(); // Aktualisiere Queue
      } else {
        error(data.error || 'Fehler beim Starten des Radio-Senders');
      }
    } catch (err) {
      console.error('Fehler beim Starten des Radio-Senders:', err);
      error('Fehler beim Starten des Radio-Senders');
    } finally {
      setRadioLoading(false);
    }
  };

  const stopRadio = async () => {
    if (!guildId) {
      error('Keine Guild-ID verfügbar');
      return;
    }

    try {
      setRadioLoading(true);
      const response = await fetch(`${apiUrl}/api/music/radio/${guildId}/stop`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (response.ok) {
        success(data.message);
        await loadRadioStatus();
        await loadData(); // Aktualisiere Queue
      } else {
        error(data.error || 'Fehler beim Stoppen des Radios');
      }
    } catch (err) {
      console.error('Fehler beim Stoppen des Radios:', err);
      error('Fehler beim Stoppen des Radios');
    } finally {
      setRadioLoading(false);
    }
  };

  const addCustomRadioStation = async () => {
    if (!newStation.name || !newStation.url) {
      error('Name und URL sind erforderlich');
      return;
    }

    try {
      setRadioLoading(true);
      const response = await fetch(`${apiUrl}/api/music/radio/stations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStation),
      });

      const data = await response.json();
      
      if (response.ok) {
        success(data.message);
        setNewStation({
          name: '',
          url: '',
          genre: '',
          country: '',
          description: '',
          logo: ''
        });
        await loadRadioStations();
      } else {
        error(data.error || 'Fehler beim Hinzufügen des Radio-Senders');
      }
    } catch (err) {
      console.error('Fehler beim Hinzufügen des Radio-Senders:', err);
      error('Fehler beim Hinzufügen des Radio-Senders');
    } finally {
      setRadioLoading(false);
    }
  };

  const removeRadioStation = async (stationId: string) => {
    try {
      setRadioLoading(true);
      const response = await fetch(`${apiUrl}/api/music/radio/stations/${stationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (response.ok) {
        success(data.message);
        await loadRadioStations();
      } else {
        error(data.error || 'Fehler beim Entfernen des Radio-Senders');
      }
    } catch (err) {
      console.error('Fehler beim Entfernen des Radio-Senders:', err);
      error('Fehler beim Entfernen des Radio-Senders');
    } finally {
      setRadioLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadRadioStations();
  }, []);

  useEffect(() => {
    if (guildId) {
      loadRadioStatus();
    }
  }, [guildId]);

  // Auto-Update System - Lädt nur Queue-Daten neu (NICHT die ganze Seite)
  useEffect(() => {
    if (!autoUpdateEnabled) return;
    
    const autoUpdateInterval = setInterval(async () => {
      if (!guildId) return;
      
      setAutoUpdateActive(true);
      console.log('🔄 Auto-Update: Lade nur Queue-Daten neu...');
      
      try {
        // Nur Queue-Daten laden, NICHT die ganze loadData() Funktion
        const queueRes = await fetch(`${apiUrl}/api/music/queue/${guildId}`);
        if (queueRes.ok) {
          const data = await queueRes.json();
          setQueue(data.queue);
        }
        setLastUpdateTime(new Date());
      } catch (error) {
        console.error('Auto-Update Error:', error);
      }
      
      setTimeout(() => setAutoUpdateActive(false), 500);
    }, 15000); // Noch weniger häufig - alle 15 Sekunden

    return () => clearInterval(autoUpdateInterval);
  }, [guildId, autoUpdateEnabled]);

  // Progress Updates - Häufiger für flüssige Progress Bar
  useEffect(() => {
    const progressInterval = setInterval(() => {
      updateProgress();
    }, 1000);

    return () => clearInterval(progressInterval);
  }, [guildId]);

  // Song Change Detection - Erkennt wenn ein neuer Song startet (sanft)
  useEffect(() => {
    if (!autoUpdateEnabled) return;
    
    const songChangeInterval = setInterval(async () => {
      if (!guildId) return;
      
      try {
        const response = await fetch(`${apiUrl}/api/music/queue/${guildId}`);
        if (response.ok) {
          const data = await response.json();
          
          // Prüfe ob sich der aktuelle Song geändert hat
          if (data.queue.currentSong && queue.currentSong) {
            if (data.queue.currentSong.url !== queue.currentSong.url) {
              console.log('🎵 Song-Wechsel erkannt! Aktualisiere nur Queue...');
              setAutoUpdateActive(true);
              // Nur Queue aktualisieren, NICHT die ganze Seite
              setQueue(data.queue);
              setLastUpdateTime(new Date());
              setTimeout(() => setAutoUpdateActive(false), 500);
            }
          } else if (data.queue.currentSong !== queue.currentSong) {
            // Song gestartet oder gestoppt
            console.log('🎵 Player-Status geändert! Aktualisiere nur Queue...');
            setAutoUpdateActive(true);
            setQueue(data.queue);
            setLastUpdateTime(new Date());
            setTimeout(() => setAutoUpdateActive(false), 500);
          }
        }
      } catch (error) {
        console.error('Song Change Detection Error:', error);
      }
    }, 8000); // Noch weniger häufig - alle 8 Sekunden

    return () => clearInterval(songChangeInterval);
  }, [guildId, queue.currentSong, autoUpdateEnabled]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Musik-System...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 animate-fade-in relative">
      {/* CSS Styles für Progress Bar Animationen */}
      <style dangerouslySetInnerHTML={{ __html: progressBarStyles }} />
      
      {/* Matrix Background Effects */}
      <MatrixBlocks density={20} />
      
      {/* Page Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <MusicIcon className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            Musik Bot Management
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Verwalte deinen Discord Musik-Bot wie ein Boss! 
          <span className="ml-2 inline-block relative">
            <svg 
              className="w-6 h-6 animate-pulse hover:animate-bounce text-purple-400 hover:text-purple-300 transition-all duration-300 hover:scale-110 drop-shadow-lg" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            <div className="absolute inset-0 animate-ping">
              <svg 
                className="w-6 h-6 text-purple-500 opacity-30" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          </span>
        </div>
        <div className="w-32 h-1 bg-gradient-neon mx-auto mt-4 rounded-full animate-glow"></div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <Button 
          onClick={saveSettings} 
          disabled={saving} 
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>{saving ? 'Speichere...' : 'Einstellungen speichern'}</span>
        </Button>
      </div>

      {/* System Status Badge */}
      <div className="flex justify-center gap-4 items-center">
        <Badge variant={settings.enabled ? "default" : "outline"} className="text-lg py-2 px-4">
          {settings.enabled ? '✅ Musik-Bot Aktiviert' : '❌ Musik-Bot Deaktiviert'}
        </Badge>
        
        {/* Auto-Update Indikator */}
        <div className="flex items-center gap-2 bg-dark-surface/90 backdrop-blur-xl border border-purple-primary/30 rounded-lg px-3 py-2">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${autoUpdateActive ? 'bg-green-400 animate-pulse' : autoUpdateEnabled ? 'bg-blue-400' : 'bg-gray-500'}`}></div>
          <span className="text-sm text-dark-muted">
            {autoUpdateActive ? 'Aktualisiere...' : autoUpdateEnabled ? `Letztes Update: ${lastUpdateTime.toLocaleTimeString()}` : 'Auto-Update deaktiviert'}
          </span>
          <Switch
            checked={autoUpdateEnabled}
            onCheckedChange={setAutoUpdateEnabled}
            className="scale-75"
          />
          <div className="text-xs text-purple-accent">
            🔄 Auto-Sync
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="player" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30">
          <TabsTrigger 
            value="player" 
            className={`flex items-center space-x-2 ${activeTab === 'player' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('player')}
          >
            <Play className="h-4 w-4" />
            <span>Player</span>
          </TabsTrigger>
          <TabsTrigger 
            value="radio" 
            className={`flex items-center space-x-2 ${activeTab === 'radio' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('radio')}
          >
            <Radio className="h-4 w-4" />
            <span>Radio</span>
          </TabsTrigger>
          <TabsTrigger 
            value="requests" 
            className={`flex items-center space-x-2 ${activeTab === 'requests' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('requests')}
          >
            <Plus className="h-4 w-4" />
            <span>Song-Requests</span>
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className={`flex items-center space-x-2 ${activeTab === 'settings' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="h-4 w-4" />
            <span>Einstellungen</span>
          </TabsTrigger>
        </TabsList>

        {/* Player Tab */}
        <TabsContent value="player" className="space-y-6" activeTab={activeTab}>
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-purple-accent" />
                System Status
                <Tooltip 
                  title="🎵 System Status erklärt:"
                  content={
                    <div>
                      <div>Zeigt den aktuellen Status des Musik-Bots:</div>
                      <div>• Bot-Status (Online/Offline)</div>
                      <div>• Voice-Channel Verbindung</div>
                      <div>• Aktuelle Wiedergabe-Informationen</div>
                    </div>
                  }
                />
              </CardTitle>
              <CardDescription>
                Aktueller Status des Musik-Bot Systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant={settings.enabled ? 'default' : 'outline'}>
                    {settings.enabled ? 'Aktiv' : 'Deaktiviert'}
                  </Badge>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => {
                    setSettings(prev => ({ ...prev, enabled: checked }));
                    saveSettings();
                  }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
                  <div className="text-dark-muted text-sm">Aktuelle Queue</div>
                  <div className="text-neon-purple font-semibold text-lg">{queue.songs.length} Songs</div>
                </div>
                <div className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
                  <div className="text-dark-muted text-sm">Lautstärke</div>
                  <div className="text-neon-purple font-semibold text-lg">{queue.volume}%</div>
                </div>
                <div className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
                  <div className="text-dark-muted text-sm">Wiederholung</div>
                  <div className="text-neon-purple font-semibold text-lg capitalize">{queue.repeat}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-purple-accent" />
                Player Kontrolle
                <Tooltip 
                  title="🎮 Player Kontrolle erklärt:"
                  content={
                    <div>
                      <div>Steuere die Musik-Wiedergabe:</div>
                      <div>• Play/Pause/Skip Buttons</div>
                      <div>• Lautstärke-Regler</div>
                      <div>• Queue-Management</div>
                      <div>• Audio-Fix für Verbindungsprobleme</div>
                    </div>
                  }
                />
              </CardTitle>
              <CardDescription>
                Direkte Kontrolle über die Musik-Wiedergabe
              </CardDescription>
            </CardHeader>
            <CardContent>
          
          {queue.currentSong && (
            <div className="bg-purple-500/10 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-4 mb-3">
                <img
                  src={queue.currentSong.thumbnail}
                  alt={queue.currentSong.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="text-white font-semibold">{queue.currentSong.title}</h4>
                  <p className="text-purple-200 text-sm">{queue.currentSong.author}</p>
                  <div className="flex items-center gap-2 text-purple-300 text-xs">
                    <span>{progress.currentTimeFormatted}</span>
                    <span>/</span>
                    <span>{progress.durationFormatted}</span>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700/50 rounded-full h-3 mb-3 relative overflow-hidden shadow-inner">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full"></div>
                
                {/* Main progress bar */}
                <div 
                  className="bg-gradient-to-r from-purple-primary via-purple-accent to-purple-secondary h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden shadow-lg"
                  style={{ width: `${progress.percentage}%` }}
                >
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                  
                  {/* Moving highlight with custom animation */}
                  <div 
                    className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12"
                    style={{
                      animation: 'progressSlide 3s infinite linear',
                      animationDelay: '0.5s'
                    }}
                  ></div>
                </div>
                
                {/* Progress indicator dot */}
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-purple-primary transition-all duration-1000 ease-out animate-pulse"
                  style={{ 
                    left: `calc(${progress.percentage}% - 8px)`,
                    boxShadow: '0 0 15px rgba(147, 51, 234, 0.8), 0 0 30px rgba(147, 51, 234, 0.4)'
                  }}
                >
                  <div className="absolute inset-1 bg-gradient-to-r from-purple-primary to-purple-accent rounded-full"></div>
                </div>
                
                {/* Sparkle effects */}
                <div 
                  className="absolute top-0 h-full w-1 bg-white/60 rounded-full animate-ping"
                  style={{ 
                    left: `${Math.min(progress.percentage + 2, 100)}%`,
                    animationDuration: '2s',
                    animationDelay: '1s'
                  }}
                ></div>
              </div>
              
              {/* Volume Control */}
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-purple-accent" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={queue.volume}
                  onChange={(e) => updateVolume(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #9333ea 0%, #9333ea ${queue.volume}%, #374151 ${queue.volume}%, #374151 100%)`
                  }}
                />
                <span className="text-purple-200 text-sm min-w-[3ch]">{queue.volume}%</span>
              </div>
            </div>
          )}
          
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="relative group">
                  <Button
                    onClick={() => controlPlayback('play')}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 transition-all duration-200 hover:scale-105"
                  >
                    <Play className="w-5 h-5" />
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    ▶️ Wiedergabe starten
                  </div>
                </div>
                
                <div className="relative group">
                  <Button
                    onClick={() => controlPlayback('pause')}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white p-3 transition-all duration-200 hover:scale-105"
                  >
                    <Pause className="w-5 h-5" />
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    ⏸️ Wiedergabe pausieren
                  </div>
                </div>
                
                <div className="relative group">
                  <Button
                    onClick={() => controlPlayback('skip')}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-3 transition-all duration-200 hover:scale-105"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    ⏭️ Nächsten Song überspringen
                  </div>
                </div>
                
                <div className="relative group">
                  <Button
                    onClick={() => controlPlayback('shuffle')}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-3 transition-all duration-200 hover:scale-105"
                  >
                    <Shuffle className="w-5 h-5" />
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    🔀 Queue mischen
                  </div>
                </div>
                
                <div className="relative group">
                  <Button
                    onClick={() => controlPlayback('clear')}
                    variant="destructive"
                    className="p-3 transition-all duration-200 hover:scale-105"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    🗑️ Queue leeren
                  </div>
                </div>
                
                <div className="relative group">
                  <Button
                    onClick={testPopularSong}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-3 transition-all duration-200 hover:scale-105"
                  >
                    🧪
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    🧪 Test-Song abspielen
                  </div>
                </div>
                
                <div className="relative group">
                  <Button
                    onClick={reconnectVoice}
                    disabled={saving}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white p-3 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                  >
                    {saving ? '🔄' : '🔧'}
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    🔧 Audio-Verbindung reparieren
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* YouTube Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-accent" />
                YouTube Suche
                <Tooltip 
                  title="🔍 YouTube Suche erklärt:"
                  content={
                    <div>
                      <div>Suche und füge Songs zur Queue hinzu:</div>
                      <div>• Suche nach Song-Titel oder Artist</div>
                      <div>• Direkt zur Queue hinzufügen</div>
                      <div>• Unterstützt YouTube URLs</div>
                    </div>
                  }
                />
              </CardTitle>
              <CardDescription>
                Suche nach Songs und füge sie zur Wiedergabeliste hinzu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input
                  type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchYouTube()}
              placeholder="Nach Musik suchen..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-purple-primary focus:outline-none"
            />
            <button
              onClick={searchYouTube}
              disabled={searching}
              className="bg-gradient-to-r from-purple-primary to-purple-secondary text-white px-6 py-2 rounded-lg font-bold hover:scale-105 transition-all duration-200 disabled:opacity-50"
            >
              {searching ? 'Suche...' : 'Suchen'}
            </button>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {searchResults.map((song, index) => (
              <div key={index} className="bg-purple-500/10 rounded-lg p-4 flex items-center gap-4">
                <img
                  src={song.thumbnail}
                  alt={song.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-sm">{song.title}</h4>
                  <p className="text-purple-200 text-xs">{song.author} • {formatDuration(song.duration)}</p>
                </div>
                <button
                  onClick={() => addToQueue(song)}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
            </CardContent>
          </Card>

          {/* Voice Channel Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-purple-accent" />
                Voice Channel Kontrolle
              </CardTitle>
              <CardDescription>
                Verbinde dich mit Voice-Channels oder verlasse sie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.filter(c => c.type === 'voice').map(channel => (
              <button
                key={channel.id}
                onClick={() => joinVoiceChannel(channel.id)}
                className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-primary/20 rounded-lg p-4 text-left transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">{channel.name}</span>
                  <Users className="w-4 h-4 text-purple-accent" />
                </div>
              </button>
            ))}
            
                <Button
                  onClick={leaveVoiceChannel}
                  variant="destructive"
                  className="p-4 text-left w-full justify-between"
                >
                  <span>Voice Channel verlassen</span>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="w-5 h-5 text-purple-accent" />
                Aktuelle Queue ({queue.songs.length} Songs)
              </CardTitle>
              <CardDescription>
                Übersicht über alle Songs in der Warteschlange
              </CardDescription>
            </CardHeader>
            <CardContent>
              
              {queue.songs.length === 0 ? (
                <div className="text-center py-8">
                  <MusicIcon className="w-16 h-16 text-purple-300 mx-auto mb-4 opacity-50" />
                  <p className="text-purple-300">Keine Songs in der Queue</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {queue.songs.map((song, index) => (
                    <div key={index} className="bg-purple-500/10 rounded-lg p-4 flex items-center gap-4">
                      <span className="text-purple-300 font-mono text-sm w-8">{index + 1}</span>
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{song.title}</h4>
                        <p className="text-purple-200 text-sm">{song.author} • {formatDuration(song.duration)}</p>
                        {song.requestedBy && (
                          <p className="text-purple-300 text-xs">Angefragt von: {song.requestedBy}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Radio Tab */}
        <TabsContent value="radio" className="space-y-6" activeTab={activeTab}>
          {/* Radio Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-400" />
                Radio Status
                {radioStatus.isPlaying && (
                  <Badge className="bg-red-500 text-white animate-pulse">
                    🔴 LIVE
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Aktueller Radio-Status und Steuerung
              </CardDescription>
            </CardHeader>
            <CardContent>
              {radioStatus.currentStation ? (
                <div className="bg-gradient-to-r from-red-500/20 to-purple-500/20 rounded-lg p-6 border border-red-400/30">
                  <div className="flex items-center gap-4">
                    <img 
                      src={radioStatus.currentStation.logo} 
                      alt={radioStatus.currentStation.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM2NjY2NjYiLz4KPHRleHQgeD0iMzIiIHk9IjM4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5O7PC90ZXh0Pgo8L3N2Zz4K';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">
                        📻 {radioStatus.currentStation.name}
                      </h3>
                      <p className="text-red-300">{radioStatus.currentStation.description}</p>
                      <div className="flex gap-4 mt-2">
                        <Badge variant="outline" className="text-red-400 border-red-400">
                          🎵 {radioStatus.currentStation.genre}
                        </Badge>
                        <Badge variant="outline" className="text-red-400 border-red-400">
                          🌍 {radioStatus.currentStation.country}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={stopRadio}
                      disabled={radioLoading}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      {radioLoading ? 'Stoppe...' : 'Radio stoppen'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-dark-muted">
                  <Radio className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p>Kein Radio-Sender aktiv</p>
                  <p className="text-sm">Wähle einen Sender aus der Liste unten</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Radio Stations - Kategorisiert */}
          <div className="space-y-6">
            {/* Radio-Sender Kategorie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-purple-accent" />
                  📻 Radio-Sender
                </CardTitle>
                <CardDescription>
                  Traditionelle Radio-Streams aus Deutschland und international
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {radioStations
                    .filter(station => !station.url.includes('youtube.com'))
                    .map((station) => (
                    <div
                      key={station.id}
                      className={`bg-dark-surface/50 rounded-lg p-4 border transition-all duration-300 hover:scale-105 ${
                        radioStatus.currentStation?.id === station.id
                          ? 'border-red-400 bg-red-500/10'
                          : 'border-purple-primary/30 hover:border-purple-primary'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={station.logo} 
                          alt={station.name}
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzY2NjY2NiIvPgo8dGV4dCB4PSIyNCIgeT0iMjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfk7s8L3RleHQ+Cjwvc3ZnPgo=';
                          }}
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-white">{station.name}</h4>
                          <p className="text-sm text-dark-muted">{station.genre}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-dark-text mb-3">{station.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          🌍 {station.country}
                        </Badge>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => playRadioStation(station.id)}
                            disabled={radioLoading || radioStatus.currentStation?.id === station.id}
                            className="flex items-center gap-2 px-3 py-1 text-sm"
                          >
                            {radioStatus.currentStation?.id === station.id ? (
                              <>
                                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                                Live
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                {radioLoading ? 'Starte...' : 'Abspielen'}
                              </>
                            )}
                          </Button>
                          
                          {/* Lösch-Button nur für custom Sender anzeigen (nicht für vordefinierte) */}
                          {!['1live', 'swr3', 'antenne', 'bigfm', 'ndr2', 'ffn', 'energy', 'sunshine', 'deutschrap1', 'rapstation', 'hiphopradio', 'urbanradio', 'gtaradio', 'oldschool', 'synthwave', 'phonkradio'].includes(station.id) && (
                            <Button
                              onClick={() => removeRadioStation(station.id)}
                              disabled={radioLoading}
                              variant="destructive"
                              className="px-2 py-1 text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* YouTube Live-Streams Kategorie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  🎥 YouTube Live-Streams
                </CardTitle>
                <CardDescription>
                  24/7 YouTube Live-Streams für verschiedene Musikrichtungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {radioStations
                    .filter(station => station.url.includes('youtube.com'))
                    .map((station) => (
                    <div
                      key={station.id}
                      className={`bg-dark-surface/50 rounded-lg p-4 border transition-all duration-300 hover:scale-105 ${
                        radioStatus.currentStation?.id === station.id
                          ? 'border-red-400 bg-red-500/10'
                          : 'border-purple-primary/30 hover:border-purple-primary'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={station.logo} 
                          alt={station.name}
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0ZGMDAwMCIvPgo8dGV4dCB4PSIyNCIgeT0iMjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPllUPC90ZXh0Pgo8L3N2Zz4K';
                          }}
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-white flex items-center gap-2">
                            {station.name}
                            <span className="text-red-500 text-xs">🔴 LIVE</span>
                          </h4>
                          <p className="text-sm text-dark-muted">{station.genre}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-dark-text mb-3">{station.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/30 text-red-400">
                          🎬 {station.country}
                        </Badge>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => playRadioStation(station.id)}
                            disabled={radioLoading || radioStatus.currentStation?.id === station.id}
                            className="flex items-center gap-2 px-3 py-1 text-sm"
                          >
                            {radioStatus.currentStation?.id === station.id ? (
                              <>
                                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                                Live
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                {radioLoading ? 'Starte...' : 'Abspielen'}
                              </>
                            )}
                          </Button>
                          
                          {/* Lösch-Button nur für custom Sender anzeigen (nicht für vordefinierte) */}
                          {!['lofi', 'chillhop', 'deephouse', 'trapmusic', 'gaming', 'jazzhop', 'retrowave', 'bassmusic'].includes(station.id) && (
                            <Button
                              onClick={() => removeRadioStation(station.id)}
                              disabled={radioLoading}
                              variant="destructive"
                              className="px-2 py-1 text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Custom Radio Station */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-400" />
                Eigenen Radio-Sender hinzufügen
              </CardTitle>
              <CardDescription>
                Füge deinen eigenen Radio-Stream hinzu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Name *
                  </label>
                  <Input
                    placeholder="z.B. Mein Radio"
                    value={newStation.name}
                    onChange={(e) => setNewStation(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Stream-URL *
                  </label>
                  <Input
                    placeholder="https://stream.example.com/radio.mp3"
                    value={newStation.url}
                    onChange={(e) => setNewStation(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Genre
                  </label>
                  <Input
                    placeholder="z.B. Pop/Rock"
                    value={newStation.genre}
                    onChange={(e) => setNewStation(prev => ({ ...prev, genre: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Land
                  </label>
                  <Input
                    placeholder="z.B. Deutschland"
                    value={newStation.country}
                    onChange={(e) => setNewStation(prev => ({ ...prev, country: e.target.value }))}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Beschreibung
                  </label>
                  <Input
                    placeholder="Kurze Beschreibung des Senders"
                    value={newStation.description}
                    onChange={(e) => setNewStation(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Logo-URL
                  </label>
                  <Input
                    placeholder="https://example.com/logo.png"
                    value={newStation.logo}
                    onChange={(e) => setNewStation(prev => ({ ...prev, logo: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button
                  onClick={addCustomRadioStation}
                  disabled={radioLoading || !newStation.name || !newStation.url}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {radioLoading ? 'Füge hinzu...' : 'Radio-Sender hinzufügen'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Song-Request Tab */}
        <TabsContent value="requests" className="space-y-6" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-accent" />
                Song-Request System
              </CardTitle>
              <CardDescription>
                Konfiguriere das Song-Request System für deine Community
              </CardDescription>
            </CardHeader>
            <CardContent>
            
            <div className="space-y-6">
              {/* Enable Song Requests */}
              <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg">
                <div>
                  <label className="text-white font-medium">Song-Requests aktivieren</label>
                  <p className="text-purple-300 text-sm">Erlaubt Mitgliedern Songs über Discord-Commands zu requesten</p>
                </div>
                <Switch
                  checked={settings.songRequests.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    songRequests: { ...prev.songRequests, enabled: checked }
                  }))}
                />
              </div>

              {settings.songRequests.enabled && (
                <>

                  {/* Interactive Panel */}
                  <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-primary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-white font-medium">🎯 Interactive Panel</h4>
                        <p className="text-purple-300 text-sm">Automatisches Embed mit Buttons für Song-Requests</p>
                      </div>
                      <Switch
                        checked={settings.songRequests.interactivePanel.enabled}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          songRequests: {
                            ...prev.songRequests,
                            interactivePanel: {
                              ...prev.songRequests.interactivePanel,
                              enabled: checked
                            }
                          }
                        }))}
                      />
                    </div>

                    {settings.songRequests.interactivePanel.enabled && (
                      <div className="space-y-4 pt-4 border-t border-purple-primary/20">
                        {/* Channel Selection */}
                        <div>
                          <label className="block text-purple-200 text-sm font-medium mb-2">
                            📍 Panel-Channel
                          </label>
                          <select
                            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white w-full focus:border-purple-primary focus:outline-none"
                            value={settings.songRequests.interactivePanel.channelId}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              songRequests: {
                                ...prev.songRequests,
                                interactivePanel: {
                                  ...prev.songRequests.interactivePanel,
                                  channelId: e.target.value
                                }
                              }
                            }))}
                          >
                            <option value="">Channel auswählen...</option>
                            {channels.filter(ch => ch.type === 'text').map(channel => (
                              <option key={channel.id} value={channel.id}>
                                #{channel.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Panel Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-purple-200 text-sm">🔄 Auto-Update</span>
                            <Switch
                              checked={settings.songRequests.interactivePanel.autoUpdate}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                songRequests: {
                                  ...prev.songRequests,
                                  interactivePanel: {
                                    ...prev.songRequests.interactivePanel,
                                    autoUpdate: checked
                                  }
                                }
                              }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-purple-200 text-sm">📋 Queue anzeigen</span>
                            <Switch
                              checked={settings.songRequests.interactivePanel.showQueue}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                songRequests: {
                                  ...prev.songRequests,
                                  interactivePanel: {
                                    ...prev.songRequests.interactivePanel,
                                    showQueue: checked
                                  }
                                }
                              }))}
                            />
                          </div>
                        </div>

                        {/* Auto Join/Leave */}
                        <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-primary/20 mt-4">
                          <div>
                            <span className="text-green-200 text-sm font-medium flex items-center gap-2">
                              🚪 Auto Join/Leave Voice-Channel
                            </span>
                            <p className="text-green-300 text-xs mt-1">Bot tritt automatisch bei wenn Songs hinzugefügt werden und verlässt bei leerer Queue</p>
                          </div>
                          <Switch
                            checked={settings.songRequests.interactivePanel.autoJoinLeave || false}
                            onCheckedChange={(checked) => setSettings(prev => ({
                              ...prev,
                              songRequests: {
                                ...prev.songRequests,
                                interactivePanel: {
                                  ...prev.songRequests.interactivePanel,
                                  autoJoinLeave: checked
                                }
                              }
                            }))}
                          />
                        </div>

                        {/* Preferred Voice Channel */}
                        <div className="mt-4">
                          <label className="block text-cyan-200 text-sm font-medium mb-2 flex items-center gap-2">
                            🎯 Bevorzugter Voice-Channel
                          </label>
                          <select
                            value={settings.voiceChannels.preferred}
                            onChange={(e) => setSettings(prev => ({ 
                              ...prev, 
                              voiceChannels: { 
                                ...prev.voiceChannels, 
                                preferred: e.target.value 
                              }
                            }))}
                            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white w-full focus:border-cyan-400 focus:outline-none"
                          >
                            <option value="">Automatisch wählen</option>
                            {channels.filter(c => c.type === 'voice').map(channel => (
                              <option key={channel.id} value={channel.id}>
                                🔊 {channel.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-cyan-300 text-xs mt-2">
                            💡 Falls kein User in einem Voice-Channel ist, joint der Bot diesem bevorzugten Channel. Leer lassen für automatische Auswahl.
                          </p>
                          {settings.voiceChannels.preferred && (
                            <p className="text-cyan-200 text-xs mt-1 bg-cyan-500/10 rounded p-2 border border-cyan-400/20">
                              ✅ Bevorzugter Channel: <span className="text-white font-medium">
                                {channels.find(c => c.id === settings.voiceChannels.preferred)?.name || 'Unbekannter Channel'}
                              </span>
                            </p>
                          )}
                        </div>

                        {/* DJ Controls Restriction */}
                        <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-primary/20 mt-4">
                          <div>
                            <span className="text-purple-200 text-sm font-medium flex items-center gap-2">
                              🎧 DJ-Rolle für Player-Controls
                            </span>
                            <p className="text-purple-300 text-xs mt-1">Nur Nutzer mit DJ-Rolle können Play/Pause/Skip/Stop verwenden</p>
                          </div>
                          <Switch
                            checked={settings.songRequests.interactivePanel.requireDJForControls || false}
                            onCheckedChange={(checked) => setSettings(prev => ({
                              ...prev,
                              songRequests: {
                                ...prev.songRequests,
                                interactivePanel: {
                                  ...prev.songRequests.interactivePanel,
                                  requireDJForControls: checked
                                }
                              }
                            }))}
                          />
                        </div>

                        {/* DJ Role Selection */}
                        {settings.songRequests.interactivePanel.requireDJForControls && (
                          <div className="mt-4">
                            <label className="block text-purple-200 text-sm font-medium mb-2">
                              🎭 DJ-Rolle auswählen
                            </label>
                            <div className="flex gap-2">
                              <select
                                value={settings.commands.djRole}
                                onChange={(e) => setSettings(prev => ({ 
                                  ...prev, 
                                  commands: { ...prev.commands, djRole: e.target.value }
                                }))}
                                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white flex-1 focus:border-purple-primary focus:outline-none"
                              >
                                <option value="">Keine DJ-Rolle</option>
                                {roles.map(role => (
                                  <option key={role.id} value={role.id}>
                                    {role.name} {role.name.includes('🎵') ? '' : '🎵'}
                                  </option>
                                ))}
                              </select>
                              <Tooltip
                                content={
                                  <button
                                    onClick={createDJRole}
                                    className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 whitespace-nowrap"
                                  >
                                    🎭 DJ-Rolle erstellen
                                  </button>
                                }
                                title="Erstellt automatisch eine DJ-Rolle mit passenden Permissions"
                              />
                            </div>
                            {settings.commands.djRole && (
                              <p className="text-purple-300 text-xs mt-2">
                                ✅ Aktuelle DJ-Rolle: <span className="text-white font-medium">
                                  {roles.find(r => r.id === settings.commands.djRole)?.name || 'Unbekannte Rolle'}
                                </span>
                              </p>
                            )}
                          </div>
                        )}

                        {/* Admin Role Selection */}
                        {settings.songRequests.interactivePanel.requireDJForControls && (
                          <div className="mt-4">
                            <label className="block text-purple-200 text-sm font-medium mb-2">
                              👑 Admin-Rolle auswählen (optional)
                            </label>
                            <select
                              value={settings.songRequests.interactivePanel.adminRole}
                              onChange={(e) => setSettings(prev => ({ 
                                ...prev, 
                                songRequests: {
                                  ...prev.songRequests,
                                  interactivePanel: {
                                    ...prev.songRequests.interactivePanel,
                                    adminRole: e.target.value
                                  }
                                }
                              }))}
                              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white w-full focus:border-purple-primary focus:outline-none"
                            >
                              <option value="">Keine Admin-Rolle (nur Discord-Admins)</option>
                              {roles.map(role => (
                                <option key={role.id} value={role.id}>
                                  {role.name} {role.name.includes('👑') || role.name.toLowerCase().includes('admin') ? '' : '👑'}
                                </option>
                              ))}
                            </select>
                            {settings.songRequests.interactivePanel.adminRole && (
                              <p className="text-purple-300 text-xs mt-2">
                                ✅ Aktuelle Admin-Rolle: <span className="text-white font-medium">
                                  {roles.find(r => r.id === settings.songRequests.interactivePanel.adminRole)?.name || 'Unbekannte Rolle'}
                                </span>
                              </p>
                            )}
                            <p className="text-purple-300 text-xs mt-2">
                              💡 Admin-Rolle kann Player-Controls nutzen, auch ohne DJ-Rolle. Leer lassen für nur Discord-Administrator-Permission.
                            </p>
                          </div>
                        )}

                        {/* Max Queue Display */}
                        {settings.songRequests.interactivePanel.showQueue && (
                          <div>
                            <label className="block text-purple-200 text-sm font-medium mb-2">
                              📊 Max. Songs im Panel anzeigen
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={settings.songRequests.interactivePanel.maxQueueDisplay}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                songRequests: {
                                  ...prev.songRequests,
                                  interactivePanel: {
                                    ...prev.songRequests.interactivePanel,
                                    maxQueueDisplay: parseInt(e.target.value) || 5
                                  }
                                }
                              }))}
                              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white w-full focus:border-purple-primary focus:outline-none"
                            />
                          </div>
                        )}

                        {/* Rate Limiting */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-purple-200 text-sm font-medium">⏱️ Rate Limiting</h5>
                              <p className="text-purple-300 text-xs">Begrenzt Song-Requests pro User über Zeit</p>
                            </div>
                            <Switch
                              checked={settings.songRequests.rateLimit?.enabled || false}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                songRequests: {
                                  ...prev.songRequests,
                                  rateLimit: {
                                    ...prev.songRequests.rateLimit,
                                    enabled: checked
                                  }
                                }
                              }))}
                            />
                          </div>

                          {settings.songRequests.rateLimit?.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-purple-primary/20">
                              <div>
                                <label className="block text-purple-200 text-xs font-medium mb-2">
                                  Max. Requests pro User
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={settings.songRequests.rateLimit?.maxRequests || 5}
                                  onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    songRequests: {
                                      ...prev.songRequests,
                                      rateLimit: {
                                        ...prev.songRequests.rateLimit,
                                        maxRequests: parseInt(e.target.value) || 1
                                      }
                                    }
                                  }))}
                                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white w-full text-sm focus:border-purple-primary focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-purple-200 text-xs font-medium mb-2">
                                  Zeitfenster
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="1440"
                                  value={settings.songRequests.rateLimit?.timeWindow || 60}
                                  onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    songRequests: {
                                      ...prev.songRequests,
                                      rateLimit: {
                                        ...prev.songRequests.rateLimit,
                                        timeWindow: parseInt(e.target.value) || 1
                                      }
                                    }
                                  }))}
                                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white w-full text-sm focus:border-purple-primary focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-purple-200 text-xs font-medium mb-2">
                                  Zeiteinheit
                                </label>
                                <select
                                  value={settings.songRequests.rateLimit?.timeUnit || 'minutes'}
                                  onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    songRequests: {
                                      ...prev.songRequests,
                                      rateLimit: {
                                        ...prev.songRequests.rateLimit,
                                        timeUnit: e.target.value as 'minutes' | 'hours' | 'days'
                                      }
                                    }
                                  }))}
                                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white w-full text-sm focus:border-purple-primary focus:outline-none"
                                >
                                  <option value="minutes">Minuten</option>
                                  <option value="hours">Stunden</option>
                                  <option value="days">Tage</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {settings.songRequests.rateLimit?.enabled && (
                            <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-primary/20">
                              <p className="text-purple-200 text-xs">
                                <strong>Beispiel:</strong> {settings.songRequests.rateLimit?.maxRequests || 5} Request(s) pro User alle {settings.songRequests.rateLimit?.timeWindow || 60} {
                                  (settings.songRequests.rateLimit?.timeUnit || 'minutes') === 'minutes' ? 'Minute(n)' :
                                  (settings.songRequests.rateLimit?.timeUnit || 'minutes') === 'hours' ? 'Stunde(n)' : 'Tag(e)'
                                }
                              </p>
                              <p className="text-purple-300 text-xs mt-1">
                                💡 Tracking erfolgt per Discord User-ID
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Cooldown */}
                        <div>
                          <label className="block text-purple-200 text-sm font-medium mb-2">
                            ⏰ Cooldown zwischen Requests (Minuten)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={settings.songRequests.cooldownMinutes}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              songRequests: { ...prev.songRequests, cooldownMinutes: parseInt(e.target.value) || 0 }
                            }))}
                            className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white w-full focus:border-purple-primary focus:outline-none"
                          />
                          <p className="text-purple-300 text-xs mt-1">
                            Mindestzeit zwischen zwei Requests desselben Users
                          </p>
                        </div>

                        {/* Embed Color */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <label className="text-purple-200 text-sm font-medium">🎨 Embed Farbe</label>
                          </div>
                          <div className="flex gap-3 items-center">
                            {/* Color Picker */}
                            <div className="relative">
                              <input
                                type="color"
                                value={settings.songRequests.embedColor.startsWith('#') ? settings.songRequests.embedColor : '#8B5CF6'}
                                onChange={(e) => {
                                  const hexColor = e.target.value;
                                  setSettings(prev => ({
                                    ...prev,
                                    songRequests: { ...prev.songRequests, embedColor: hexColor }
                                  }));
                                }}
                                className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 bg-dark-bg cursor-pointer hover:border-purple-primary transition-all duration-300 hover:scale-105"
                                style={{
                                  filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                                }}
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping opacity-60"></div>
                            </div>
                            
                            {/* Hex Input */}
                            <div className="flex-1">
                              <input
                                type="text"
                                value={settings.songRequests.embedColor}
                                onChange={(e) => setSettings(prev => ({
                                  ...prev,
                                  songRequests: { ...prev.songRequests, embedColor: e.target.value }
                                }))}
                                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white w-full focus:border-purple-primary focus:outline-none font-mono"
                                placeholder="#8B5CF6"
                              />
                            </div>

                            {/* Color Preview */}
                            <div 
                              className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-lg"
                              style={{
                                backgroundColor: settings.songRequests.embedColor.startsWith('#') ? settings.songRequests.embedColor : '#8B5CF6',
                                filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                              }}
                            >
                              🎵
                            </div>
                          </div>
                          
                          {/* Preset Colors */}
                          <div className="mt-3">
                            <p className="text-xs text-purple-300 mb-2">Beliebte Discord Farben:</p>
                            <div className="flex gap-2 flex-wrap">
                              {[
                                { name: 'Lila', color: '#8B5CF6' },
                                { name: 'Blau', color: '#3B82F6' },
                                { name: 'Grün', color: '#10B981' },
                                { name: 'Rot', color: '#EF4444' },
                                { name: 'Orange', color: '#F97316' },
                                { name: 'Pink', color: '#EC4899' },
                                { name: 'Cyan', color: '#06B6D4' },
                                { name: 'Gelb', color: '#EAB308' },
                              ].map((preset) => (
                                <button
                                  key={preset.name}
                                  onClick={() => setSettings(prev => ({
                                    ...prev,
                                    songRequests: { ...prev.songRequests, embedColor: preset.color }
                                  }))}
                                  className="w-8 h-8 rounded-lg border border-purple-primary/30 hover:border-purple-primary transition-all duration-300 hover:scale-110 relative group"
                                  style={{
                                    backgroundColor: preset.color,
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

                        {/* Post Panel Button */}
                        <div className="pt-4 border-t border-purple-primary/20">
                          <button
                            onClick={postInteractivePanel}
                            disabled={!settings.songRequests.interactivePanel.channelId}
                            className="w-full bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                          >
                            🎵 Interactive Panel posten
                          </button>
                          {settings.songRequests.interactivePanel.messageId && (
                            <p className="text-xs text-purple-300 mt-2 text-center">
                              Panel bereits gepostet (ID: {settings.songRequests.interactivePanel.messageId.slice(0, 8)}...)
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>



                  {/* DJ Role Requirement */}
                  <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg">
                    <div>
                      <label className="text-white font-medium">DJ-Rolle erforderlich</label>
                      <p className="text-purple-300 text-sm">Nur Nutzer mit DJ-Rolle können Songs requesten</p>
                    </div>
                    <Switch
                      checked={settings.songRequests.requireDJRole}
                      onCheckedChange={(checked) => setSettings(prev => ({ 
                        ...prev, 
                        songRequests: { ...prev.songRequests, requireDJRole: checked }
                      }))}
                    />
                  </div>

                  {/* Request Tracking */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-accent" />
                        Request Tracking
                      </h4>
                      <button
                        onClick={loadRequestTracking}
                        disabled={trackingLoading}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm transition-all duration-200 hover:scale-105"
                      >
                        {trackingLoading ? '🔄' : '↻'} Aktualisieren
                      </button>
                    </div>
                    
                    {trackingLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-primary mx-auto"></div>
                      </div>
                    ) : requestTracking.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {requestTracking.map((user, index) => (
                          <div key={user.userId} className="bg-purple-500/10 rounded-lg p-3 border border-purple-primary/20">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium text-sm">
                                    {user.username.length > 20 ? `${user.username.slice(0, 20)}...` : user.username}
                                  </span>
                                  <Badge variant={user.remainingRequests > 0 ? 'success' : 'error'}>
                                    {user.requestsUsed} verwendet
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-xs">
                                  <span className="text-purple-300">
                                    📊 Übrig: <span className="text-white font-medium">{user.remainingRequests}</span>
                                  </span>
                                  {user.resetTime && (
                                    <span className="text-purple-300">
                                      ⏰ Reset: <span className="text-white font-medium">
                                        {new Date(user.resetTime).toLocaleString('de-DE', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-purple-300">
                                  #{index + 1}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-purple-300">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Noch keine Song-Requests vorhanden</p>
                      </div>
                    )}
                  </div>

                  {/* Interactive Panel Info */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">🎯 Interactive Panel Features</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded">🎵 Song Request</span>
                        <span className="text-purple-300">- Öffnet Modal für Song-Eingabe</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded">📋 View Queue</span>
                        <span className="text-purple-300">- Zeigt aktuelle Queue privat an</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded">⏯️ Player Controls</span>
                        <span className="text-purple-300">- Play/Pause/Skip/Stop Buttons</span>
                        {settings.songRequests.interactivePanel.requireDJForControls && (
                          <span className="bg-orange-500/20 text-orange-200 px-2 py-1 rounded text-xs">🎧 DJ-Only</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-green-500/20 text-green-200 px-2 py-1 rounded">🔄 Auto-Update</span>
                        <span className="text-purple-300">- Panel aktualisiert sich automatisch</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-accent" />
                Erweiterte Einstellungen
                <Tooltip 
                  title="⚙️ Erweiterte Einstellungen erklärt:"
                  content={
                    <div>
                      <div>Konfiguriere erweiterte Bot-Features:</div>
                      <div>• Queue-Verhalten und Limits</div>
                      <div>• YouTube-Qualität und Länge</div>
                      <div>• Autoplay und Auto-Clear</div>
                    </div>
                  }
                />
              </CardTitle>
              <CardDescription>
                Konfiguriere erweiterte Funktionen des Musik-Bots
              </CardDescription>
            </CardHeader>
            <CardContent>
            
                          <div className="space-y-6">
                {/* Max Queue Length */}
                <div>
                  <label className="block text-dark-text text-sm font-medium mb-2">
                    Maximale Queue-Länge
                  </label>
                  <Input
                    type="number"
                    min="10"
                    max="1000"
                    value={settings.maxQueueLength}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxQueueLength: parseInt(e.target.value) }))}
                  />
                  <p className="text-dark-muted text-xs mt-1">Maximale Anzahl Songs die in der Queue gespeichert werden können</p>
                </div>

                              {/* YouTube Settings */}
                <div className="border-t border-purple-primary/20 pt-6">
                  <h4 className="text-dark-text font-semibold mb-4 flex items-center gap-2">
                    🎥 YouTube Einstellungen
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-dark-text text-sm font-medium mb-2">
                        Audio-Qualität
                      </label>
                      <select
                        value={settings.youtube.quality}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          youtube: { ...prev.youtube, quality: e.target.value }
                        }))}
                        className="bg-dark-bg/70 border border-purple-primary/30 text-dark-text focus:border-neon-purple rounded-lg px-3 py-2 w-full transition-colors duration-200"
                      >
                        <option value="highestaudio">Höchste Qualität</option>
                        <option value="lowestaudio">Niedrigste Qualität</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-dark-text text-sm font-medium mb-2">
                        Max. Song-Länge (Minuten)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="180"
                        value={settings.youtube.maxLength}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          youtube: { ...prev.youtube, maxLength: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Queue Settings */}
                <div className="border-t border-purple-primary/20 pt-6">
                  <h4 className="text-dark-text font-semibold mb-4 flex items-center gap-2">
                    📋 Queue Verhalten
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-dark-text font-medium">Queue bei leerem Channel leeren</label>
                        <p className="text-dark-muted text-sm">Löscht automatisch die Queue wenn alle User den Voice-Channel verlassen</p>
                      </div>
                      <Switch
                        checked={settings.queue.clearOnEmpty}
                        onCheckedChange={(checked) => setSettings(prev => ({ 
                          ...prev, 
                          queue: { ...prev.queue, clearOnEmpty: checked }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-dark-text font-medium">Autoplay aktivieren</label>
                        <p className="text-dark-muted text-sm">Spielt automatisch ähnliche Songs wenn Queue leer ist</p>
                      </div>
                      <Switch
                        checked={settings.queue.autoplay}
                        onCheckedChange={(checked) => setSettings(prev => ({ 
                          ...prev, 
                          queue: { ...prev.queue, autoplay: checked }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button 
            onClick={saveSettings} 
            disabled={saving} 
            className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-8 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
          >
            <Save className="h-5 w-5" />
            <span>{saving ? 'Speichere...' : 'Einstellungen speichern'}</span>
          </Button>
        </div>
      </Tabs>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Music; 