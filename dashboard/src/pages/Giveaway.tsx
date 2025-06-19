import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

import { Gift, Trophy, Users, MessageSquare, Clock, Star, Settings, Plus, Trash2, Save, RotateCcw, Send, Zap, Crown, RefreshCw, Shield, CheckCircle, X, Server, StopCircle, History } from 'lucide-react';
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

// Alert components
const Alert: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 ${className}`}>
    {children}
  </div>
);

const AlertDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`text-sm text-yellow-200 ${className}`}>
    {children}
  </div>
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

// Live Timer Komponente für Echtzeit-Countdown
const LiveTimer: React.FC<{ endTime: number }> = ({ endTime }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);
    };

    // Sofort aktualisieren
    updateTimer();

    // Alle Sekunde aktualisieren
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const formatDuration = (ms: number): string => {
    if (ms <= 0) return 'Beendet';

    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getTimeColor = () => {
    if (timeRemaining <= 0) return 'text-red-400';
    if (timeRemaining < 60 * 60 * 1000) return 'text-orange-400'; // Weniger als 1 Stunde
    if (timeRemaining < 24 * 60 * 60 * 1000) return 'text-yellow-400'; // Weniger als 1 Tag
    return 'text-purple-400';
  };

  return (
    <p className={`font-medium ${getTimeColor()} transition-colors duration-300`}>
      {formatDuration(timeRemaining)}
      {timeRemaining > 0 && timeRemaining < 60 * 1000 && (
        <span className="ml-1 animate-pulse">⏰</span>
      )}
    </p>
  );
};

// Interfaces
interface GiveawaySettings {
  enabled: boolean;
  defaultChannel: string;
  embedColor: string;
  endedEmbedColor: string;
  winnerDmColor: string;
  managerRoles: string[];
  notifications: {
    newGiveaway: boolean;
    giveawayEnd: boolean;
    giveawayWin: boolean;
  };
  limits: {
    maxActiveGiveaways: number;
    maxWinners: number;
    minDuration: number;
    maxDuration: number;
  };
  antiCheat: {
    preventSelfInvite: boolean;
    preventBotAccounts: boolean;
    minAccountAge: number;
    preventMultipleEntries: boolean;
  };
  leaderboard?: {
    autoCreate: boolean;
    updateInterval: number;
    autoUpdate: boolean;
    showUsernames: boolean;
    autoPost: {
      enabled: boolean;
      time: string;
      timezone: string;
      channelName: string;
      limit: number;
      lastPosted: number;
      autoDeleteOld: boolean;
    };
  };
}

interface GiveawayData {
  id: string;
  type: string;
  title: string;
  description: string;
  prize: string;
  duration: number;
  winners: number;
  channelId: string;
  channelName: string;
  messageId: string;
  participants: string[];
  status: string;
  createdAt: number;
  endTime: number;
  timeRemaining: number;
  host: {
    id: string;
    username: string;
  };
  requirements?: any;
  winnerList?: Array<{
    id: string;
    username: string;
    discriminator?: string;
    avatar?: string;
  }>;
}

interface GiveawayStats {
  totalGiveaways: number;
  activeGiveaways: number;
  endedGiveaways: number;
  totalParticipants: number;
  totalInvites: number;
  averageParticipants: number;
}

interface Channel {
  id: string;
  name: string;
  guildId: string;
  guildName: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
  guildId: string;
  guildName: string;
}

interface InviteData {
  userId: string;
  username: string;
  totalInvites: number;
  activeCodes: number;
}

interface DetailedInviteTracking {
  userId: string;
  username: string;
  inviteCount: number;
  invitedUserIds: string[];
  invitedUsersWithDetails: { id: string; username: string }[];
  activeCodes: { code: string; uses: number; url: string }[];
  totalGlobalInvites: number;
}

interface AdminTrackingData {
  giveawayId: string;
  giveawayTitle: string;
  giveawayType: string;
  status: string;
  participants: number;
  totalInvitedUsers: number;
  totalActiveCodes: number;
  leaderboard: DetailedInviteTracking[];
  inviteRequirement: number;
}

interface ParticipantData {
  id: string;
  username: string;
  discriminator?: string;
  avatar?: string;
  joinedAt?: number;
  roles: { id: string; name: string; color: string }[];
  leftServer?: boolean;
}

interface ParticipantsResponse {
  giveawayId: string;
  giveawayTitle: string;
  giveawayType: string;
  status: string;
  totalParticipants: number;
  participants: ParticipantData[];
}

const Giveaway: React.FC = () => {
  const { toasts, success, error: showError, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('settings');

  const [settings, setSettings] = useState<GiveawaySettings>({
    enabled: true,
    defaultChannel: 'giveaways',
    embedColor: '0x00FF7F',
    endedEmbedColor: '0xFFD700',
    winnerDmColor: '0xFFD700',
    managerRoles: [],
    notifications: {
      newGiveaway: true,
      giveawayEnd: true,
      giveawayWin: true
    },
    limits: {
      maxActiveGiveaways: 5,
      maxWinners: 10,
      minDuration: 300000,
      maxDuration: 2592000000
    },
    antiCheat: {
      preventSelfInvite: true,
      preventBotAccounts: true,
      minAccountAge: 604800000,
      preventMultipleEntries: true
    },
    leaderboard: {
      autoCreate: true,
      updateInterval: 30,
      autoUpdate: true,
      showUsernames: true
    }
  });

  const [activeGiveaways, setActiveGiveaways] = useState<GiveawayData[]>([]);
  const [giveawayHistory, setGiveawayHistory] = useState<GiveawayData[]>([]);
  const [stats, setStats] = useState<GiveawayStats | null>(null);
  const [inviteStats, setInviteStats] = useState<InviteData[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [winnerModal, setWinnerModal] = useState<{
    show: boolean;
    giveaway: GiveawayData | null;
    winners: any[];
  }>({
    show: false,
    giveaway: null,
    winners: []
  });

  const [messageModal, setMessageModal] = useState<{
    show: boolean;
    userId: string;
    username: string;
    message: string;
  }>({
    show: false,
    userId: '',
    username: '',
    message: ''
  });

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: 'delete' | 'end' | 'deleteHistory';
    title: string;
    message: string;
    giveawayId: string;
    giveawayTitle: string;
  }>({
    show: false,
    type: '',
    title: '',
    message: '',
    giveawayId: '',
    giveawayTitle: ''
  });

  // Pagination für Historie
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 10;

  // Neues Giveaway Formular
  const [newGiveaway, setNewGiveaway] = useState({
    type: 'classic',
    title: '',
    description: '',
    prize: '',
    duration: 3600000,
    durationValue: 1,
    durationUnit: 'hours',
    winners: 1,
    channelName: '',
    requirements: {
      minAccountAge: 0,
      minXP: 0,
      minInvites: 0,
      requiredRoles: [],
      preventBots: true,
      preventMultiple: true,
      checkMembership: true,
      preventDuplicateIPs: false
    }
  });

  const [adminTracking, setAdminTracking] = useState<{ [giveawayId: string]: AdminTrackingData }>({});
  const [selectedGiveawayForTracking, setSelectedGiveawayForTracking] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [participantsModal, setParticipantsModal] = useState<{
    show: boolean;
    giveaway: GiveawayData | null;
    participants: ParticipantData[];
  }>({
    show: false,
    giveaway: null,
    participants: []
  });

  useEffect(() => {
    loadData();
    
    // Intelligenteres Reload-System: Nur Live-Daten alle 60 Sekunden
    const interval = setInterval(() => {
      loadLiveData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Separate Funktion für Live-Daten (nur das was sich häufig ändert)
  const loadLiveData = async () => {
    try {
      // Nur die sich ändernden Daten laden - keine Settings/Channels/Roles
      const [
        activeResponse,
        statsResponse,
        invitesResponse
      ] = await Promise.all([
        fetch('/api/giveaway/active'),
        fetch('/api/giveaway/stats'),
        fetch('/api/giveaway/invites')
      ]);

      if (activeResponse.ok) {
        const data = await activeResponse.json();
        const newGiveaways = data.giveaways || [];
        
        // Nur updaten wenn sich was geändert hat
        if (JSON.stringify(newGiveaways) !== JSON.stringify(activeGiveaways)) {
          setActiveGiveaways(newGiveaways);
        }
      }

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }

      if (invitesResponse.ok) {
        const data = await invitesResponse.json();
        const newInvites = data.invites || [];
        
        // Nur updaten wenn sich was geändert hat
        if (JSON.stringify(newInvites) !== JSON.stringify(inviteStats)) {
          setInviteStats(newInvites);
        }
      }

      // Update-Zeit aktualisieren
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Fehler beim Laden der Live-Daten:', error);
      // Keine Toast-Nachricht für Live-Updates um nicht zu stören
    }
  };

  // Manuelle Refresh-Funktion
  const manualRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
      setLastUpdate(new Date());
      success('🔄 Daten erfolgreich aktualisiert!');
    } catch (error) {
      showError('Fehler beim Aktualisieren der Daten');
    } finally {
      setRefreshing(false);
    }
  };

  // Anti-Cheat Einstellungen mit Basis-Einstellungen synchronisieren
  useEffect(() => {
    if (settings.antiCheat) {
      setNewGiveaway(prev => ({
        ...prev,
        requirements: {
          ...prev.requirements,
          preventBots: settings.antiCheat.preventBotAccounts !== false,
          preventMultiple: settings.antiCheat.preventMultipleEntries !== false,
          checkMembership: settings.antiCheat.checkMembership !== false,
          preventDuplicateIPs: settings.antiCheat.preventDuplicateIPs || false,
          minAccountAge: settings.antiCheat.minAccountAge || 0
        }
      }));
    }
  }, [settings.antiCheat]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [
        settingsResponse,
        activeResponse,
        historyResponse,
        statsResponse,
        invitesResponse,
        channelsResponse,
        rolesResponse,
        categoriesResponse
      ] = await Promise.all([
        fetch('/api/giveaway/settings'),
        fetch('/api/giveaway/active'),
        fetch('/api/giveaway/history'),
        fetch('/api/giveaway/stats'),
        fetch('/api/giveaway/invites'),
        fetch('/api/discord/channels'),
        fetch('/api/discord/roles'),
        fetch('/api/giveaway/categories')
      ]);

      if (settingsResponse.ok) {
        const data = await settingsResponse.json();
        setSettings(data);
      }

      if (activeResponse.ok) {
        const data = await activeResponse.json();
        setActiveGiveaways(data.giveaways || []);
      }

      if (historyResponse.ok) {
        const data = await historyResponse.json();
        setGiveawayHistory(data.giveaways || []);
      }

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }

      if (invitesResponse.ok) {
        const data = await invitesResponse.json();
        setInviteStats(data.invites || []);
      }

      if (channelsResponse.ok) {
        const data = await channelsResponse.json();
        setChannels(data.channels || []);
      } else {
        console.warn('Channels API nicht verfügbar, verwende Fallback');
        setChannels([]);
      }

      if (rolesResponse.ok) {
        const data = await rolesResponse.json();
        setRoles(data.roles || []);
      } else {
        console.warn('Roles API nicht verfügbar, verwende Fallback');
        setRoles([]);
      }

      if (categoriesResponse.ok) {
        const data = await categoriesResponse.json();
        setAvailableCategories(data.categories?.map((cat: any) => cat.name) || []);
      } else {
        console.warn('Categories API nicht verfügbar, verwende Fallback');
        setAvailableCategories([]);
      }

    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      showError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminTracking = async (giveawayId: string) => {
    try {
      const response = await fetch(`/api/giveaway/${giveawayId}/admin-tracking`);
      if (response.ok) {
        const data = await response.json();
        setAdminTracking(prev => ({
          ...prev,
          [giveawayId]: data
        }));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Admin-Tracking Daten:', error);
      showError('Fehler beim Laden der Tracking-Daten');
    }
  };



  const createLeaderboardChannel = async (giveawayId: string) => {
    try {
      const response = await fetch(`/api/giveaway/${giveawayId}/create-leaderboard-channel`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        success(data.isNew ? 
          `Leaderboard-Channel "${data.channelName}" erstellt!` : 
          `Leaderboard "${data.channelName}" aktualisiert!`
        );
        loadData(); // Reload data to update any changes
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Fehler beim Erstellen des Leaderboard-Channels');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Leaderboard-Channels:', error);
      showError('Fehler beim Erstellen des Leaderboard-Channels');
    }
  };

  const deleteLeaderboardChannel = async (giveawayId: string) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/giveaway/${giveawayId}/leaderboard-channel`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        success('🗑️ Leaderboard-Channel erfolgreich gelöscht!');
        loadData(); // Reload data to update any changes
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Fehler beim Löschen des Leaderboard-Channels');
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Leaderboard-Channels:', error);
      showError('Fehler beim Löschen des Leaderboard-Channels');
    } finally {
      setSaving(false);
    }
  };

  const testAutoLeaderboard = async () => {
    try {
      const response = await fetch('/api/giveaway/test-auto-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const result = await response.json();
        success(`✅ ${result.count} Auto-Leaderboard-Channel(s) erfolgreich erstellt/aktualisiert!`);
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Fehler beim Erstellen der Test-Channels');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Test-Channels:', error);
      showError('Fehler beim Erstellen der Test-Channels');
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/giveaway/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        success('✅ Giveaway-Einstellungen gespeichert!');
        loadData();
      } else {
        showError('❌ Fehler beim Speichern der Einstellungen');
      }
    } catch (err) {
      showError('❌ Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  const createGiveaway = async () => {
    if (!newGiveaway.title || !newGiveaway.prize || !newGiveaway.channelName) {
      showError('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    try {
      const response = await fetch('/api/giveaway/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGiveaway)
      });

      if (response.ok) {
        success('🎉 Giveaway erstellt!');
        setNewGiveaway({
          type: 'classic',
          title: '',
          description: '',
          prize: '',
          duration: 3600000,
          durationValue: 1,
          durationUnit: 'hours',
          winners: 1,
          channelName: '',
          requirements: {
            minAccountAge: 0,
            minXP: 0,
            minInvites: 0,
            requiredRoles: [],
            preventBots: true,
            preventMultiple: true,
            checkMembership: true,
            preventDuplicateIPs: false
          }
        });
        loadData();
      } else {
        const data = await response.json();
        showError(`❌ ${data.error}`);
      }
    } catch (err) {
      showError('❌ Fehler beim Erstellen des Giveaways');
    }
  };

  const testGiveaway = async () => {
    try {
      const response = await fetch('/api/giveaway/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: newGiveaway.channelName || settings.defaultChannel
        })
      });

      if (response.ok) {
        success('🧪 Test-Giveaway erstellt!');
      } else {
        showError('❌ Fehler beim Erstellen des Test-Giveaways');
      }
    } catch (err) {
      showError('❌ Fehler beim Test-Giveaway');
    }
  };

  const openDeleteConfirm = (giveawayId: string, giveawayTitle: string) => {
    setConfirmModal({
      show: true,
      type: 'delete',
      title: 'Giveaway löschen',
      message: `Bist du sicher, dass du das Giveaway "${giveawayTitle}" löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.`,
      giveawayId,
      giveawayTitle
    });
  };

  const deleteGiveaway = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/giveaway/${confirmModal.giveawayId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        success(`🗑️ Giveaway "${confirmModal.giveawayTitle}" wurde erfolgreich gelöscht!`);
        setConfirmModal({ show: false, type: '', title: '', message: '', giveawayId: '', giveawayTitle: '' });
        loadData(); // Daten neu laden
    } else {
        const data = await response.json();
        showError(`❌ Fehler beim Löschen von "${confirmModal.giveawayTitle}": ${data.error}`);
      }
    } catch (err) {
      console.error('Fehler beim Löschen des Giveaways:', err);
      showError(`❌ Netzwerkfehler beim Löschen von "${confirmModal.giveawayTitle}"!`);
    } finally {
      setSaving(false);
    }
  };

  const openEndConfirm = (giveawayId: string, giveawayTitle: string) => {
    setConfirmModal({
      show: true,
      type: 'end',
      title: 'Giveaway beenden',
      message: `Bist du sicher, dass du das Giveaway "${giveawayTitle}" vorzeitig beenden möchtest? Die Gewinner werden automatisch ermittelt.`,
      giveawayId,
      giveawayTitle
    });
  };

  const endGiveaway = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/giveaway/${confirmModal.giveawayId}/end`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        success(`🏆 Giveaway "${confirmModal.giveawayTitle}" wurde erfolgreich beendet! ${data.winners ? `${data.winners.length} Gewinner ermittelt.` : ''}`);
        setConfirmModal({ show: false, type: '', title: '', message: '', giveawayId: '', giveawayTitle: '' });
        loadData(); // Daten neu laden
      } else {
        const data = await response.json();
        showError(`❌ Fehler beim Beenden von "${confirmModal.giveawayTitle}": ${data.error}`);
      }
    } catch (err) {
      console.error('Fehler beim Beenden des Giveaways:', err);
      showError(`❌ Netzwerkfehler beim Beenden von "${confirmModal.giveawayTitle}"!`);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteHistoryConfirm = (giveawayId: string, giveawayTitle: string) => {
    setConfirmModal({
      show: true,
      type: 'deleteHistory',
      title: 'Giveaway aus Historie löschen',
      message: `Möchtest du das Giveaway "${giveawayTitle}" dauerhaft aus der Historie entfernen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      giveawayId,
      giveawayTitle
    });
  };

  const deleteFromHistory = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/giveaway/history/${confirmModal.giveawayId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        success(`🗑️ Giveaway "${confirmModal.giveawayTitle}" wurde erfolgreich aus der Historie entfernt!`);
        setConfirmModal({ show: false, type: '', title: '', message: '', giveawayId: '', giveawayTitle: '' });
        loadData(); // Daten neu laden
      } else {
        const data = await response.json();
        showError(`❌ Fehler beim Entfernen aus der Historie: ${data.error}`);
      }
    } catch (err) {
      console.error('Fehler beim Entfernen aus der Historie:', err);
      showError(`❌ Netzwerkfehler beim Entfernen aus der Historie!`);
    } finally {
      setSaving(false);
    }
  };

  const showWinners = async (giveaway: GiveawayData) => {
    try {
      const response = await fetch(`/api/giveaway/${giveaway.id}/winners`);
      if (response.ok) {
        const data = await response.json();
        setWinnerModal({
          show: true,
          giveaway: giveaway,
          winners: data.winners || []
        });
      } else {
        showError('❌ Gewinner konnten nicht geladen werden');
      }
    } catch (err) {
      console.error('Fehler beim Laden der Gewinner:', err);
      showError('❌ Netzwerkfehler beim Laden der Gewinner');
    }
  };

  const openMessageModal = (userId: string, username: string) => {
    setMessageModal({
      show: true,
      userId,
      username,
      message: `Hallo ${username}! 🎉`
    });
  };

  const sendMessage = async () => {
    if (!messageModal.message.trim()) {
      showError('❌ Bitte gib eine Nachricht ein');
      return;
    }

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: messageModal.userId, 
          message: messageModal.message 
        })
      });

      if (response.ok) {
        success(`📨 Nachricht an @${messageModal.username} wurde erfolgreich gesendet!`);
        setMessageModal({ show: false, userId: '', username: '', message: '' });
      } else {
        const data = await response.json();
        showError(`❌ Fehler beim Senden der Nachricht: ${data.error}`);
      }
    } catch (err) {
      console.error('Fehler beim Senden der Nachricht:', err);
      showError('❌ Netzwerkfehler beim Senden der Nachricht');
    }
  };

  const autoSaveAntiCheatSettings = async (newSettings: GiveawaySettings) => {
    try {
      await fetch('/api/giveaway/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      success('✅ Anti-Cheat Einstellung automatisch gespeichert');
    } catch (error) {
      console.error('Fehler beim Auto-Speichern:', error);
      showError('❌ Fehler beim Speichern der Anti-Cheat Einstellung');
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 60000) {
      return `${Math.floor(ms / 1000)}s`;
    } else if (ms < 3600000) {
      return `${Math.floor(ms / 60000)}min`;
    } else if (ms < 86400000) {
      return `${Math.floor(ms / 3600000)}h`;
    } else if (ms < 604800000) {
      return `${Math.floor(ms / 86400000)}d`;
    } else if (ms < 2592000000) {
      return `${Math.floor(ms / 604800000)}w`;
    } else {
      return `${Math.floor(ms / 2592000000)}mo`;
    }
  };

  const getGiveawayTypeIcon = (type: string) => {
    switch (type) {
      case 'classic': return '🎁';
      case 'invite': return '📨';
      case 'fish': return '🐠';
      case 'rock-paper-scissors': return '✂️';
      case 'treasure-hunt': return '🗺️';
      case 'quiz': return '🧠';
      default: return '🎉';
    }
  };

  const showParticipants = async (giveaway: GiveawayData) => {
    try {
      const response = await fetch(`/api/giveaway/${giveaway.id}/participants`);
      if (response.ok) {
        const data: ParticipantsResponse = await response.json();
        setParticipantsModal({
          show: true,
          giveaway,
          participants: data.participants
        });
      } else {
        showError('Fehler beim Laden der Teilnehmer');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Teilnehmer:', error);
      showError('Fehler beim Laden der Teilnehmer');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Giveaway-System...</div>
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
          <Gift className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            Giveaway System Management
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Verwalte spektakuläre Giveaways und belohne deine Community! 
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
      <div className="flex justify-center gap-4">
        <Button 
          onClick={manualRefresh} 
          disabled={refreshing} 
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Aktualisiere...' : 'Daten aktualisieren'}</span>
        </Button>
        
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
      <div className="flex justify-center gap-4">
        <Badge variant={settings.enabled ? "default" : "outline"} className="text-lg py-2 px-4">
          {settings.enabled ? '✅ System Aktiviert' : '❌ System Deaktiviert'}
        </Badge>
        
        <div className="text-sm text-dark-muted flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Letzte Aktualisierung: {lastUpdate.toLocaleTimeString('de-DE')}</span>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Giveaways</CardTitle>
              <Gift className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{stats.totalGiveaways}</div>
              <p className="text-xs text-dark-muted">
                {stats.activeGiveaways} aktiv
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Teilnehmer</CardTitle>
              <Users className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{stats.totalParticipants}</div>
              <p className="text-xs text-dark-muted">
                Ø {Math.round(stats.averageParticipants)} pro Giveaway
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Einladungen</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{stats.totalInvites}</div>
              <p className="text-xs text-dark-muted">
                Invite-basierte Teilnahmen
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Beendet</CardTitle>
              <Trophy className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{stats.endedGiveaways}</div>
              <p className="text-xs text-dark-muted">
                Erfolgreich abgeschlossen
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30">
          <TabsTrigger 
            value="settings" 
            className={`flex items-center space-x-2 ${activeTab === 'settings' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="h-4 w-4" />
            <span>Einstellungen</span>
          </TabsTrigger>
          <TabsTrigger 
            value="create" 
            className={`flex items-center space-x-2 ${activeTab === 'create' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('create')}
          >
            <Plus className="h-4 w-4" />
            <span>Erstellen</span>
          </TabsTrigger>
          <TabsTrigger 
            value="active" 
            className={`flex items-center space-x-2 ${activeTab === 'active' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('active')}
          >
            <Star className="h-4 w-4" />
            <span>Aktiv</span>
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className={`flex items-center space-x-2 ${activeTab === 'history' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('history')}
          >
            <Clock className="h-4 w-4" />
            <span>Historie</span>
          </TabsTrigger>
          <TabsTrigger 
            value="admin" 
            className={`flex items-center space-x-2 ${activeTab === 'admin' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('admin')}
          >
            <Shield className="h-4 w-4" />
            <span>Admin</span>
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6" activeTab={activeTab}>
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-accent" />
                Basis-Einstellungen
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Grundkonfiguration des Giveaway-Systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-dark-text">Giveaway-System aktiviert</label>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">Standard-Channel</label>
                <Input
                  value={settings.defaultChannel}
                  onChange={(e) => setSettings(prev => ({ ...prev, defaultChannel: e.target.value }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                  placeholder="giveaways"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">Embed Farbe</label>
                <div className="flex gap-3 items-center">
                  {/* Color Picker */}
                  <div className="relative">
                    <input
                      type="color"
                      value={settings.embedColor.startsWith('0x') ? `#${settings.embedColor.slice(2)}` : settings.embedColor.startsWith('#') ? settings.embedColor : '#00FF7F'}
                      onChange={(e) => {
                        const hexColor = e.target.value;
                        const discordColor = `0x${hexColor.slice(1).toUpperCase()}`;
                        setSettings(prev => ({ ...prev, embedColor: discordColor }));
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
                      value={settings.embedColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, embedColor: e.target.value }))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple font-mono"
                      placeholder="0x00FF7F"
                    />
                  </div>

                  {/* Color Preview */}
                  <div 
                    className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                    style={{
                      backgroundColor: settings.embedColor.startsWith('0x') ? `#${settings.embedColor.slice(2)}` : settings.embedColor.startsWith('#') ? settings.embedColor : '#00FF7F',
                      filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                    }}
                  >
                    🎁
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
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          embedColor: preset.color
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

              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">🎊 Beendet Embed Farbe</label>
                <div className="flex gap-3 items-center">
                  {/* Color Picker */}
                  <div className="relative">
                    <input
                      type="color"
                      value={settings.endedEmbedColor?.startsWith('0x') ? `#${settings.endedEmbedColor.slice(2)}` : settings.endedEmbedColor?.startsWith('#') ? settings.endedEmbedColor : '#FFD700'}
                      onChange={(e) => {
                        const hexColor = e.target.value;
                        const discordColor = `0x${hexColor.slice(1).toUpperCase()}`;
                        setSettings(prev => ({ ...prev, endedEmbedColor: discordColor }));
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
                      value={settings.endedEmbedColor || '0xFFD700'}
                      onChange={(e) => setSettings(prev => ({ ...prev, endedEmbedColor: e.target.value }))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple font-mono"
                      placeholder="0xFFD700"
                    />
                  </div>

                  {/* Color Preview */}
                  <div 
                    className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                    style={{
                      backgroundColor: settings.endedEmbedColor?.startsWith('0x') ? `#${settings.endedEmbedColor.slice(2)}` : settings.endedEmbedColor?.startsWith('#') ? settings.endedEmbedColor : '#FFD700',
                      filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                    }}
                  >
                    🎊
                  </div>
                </div>
                
                {/* Preset Colors für Beendet */}
                <div className="mt-3">
                  <p className="text-xs text-dark-muted mb-2">Beliebte Farben für beendete Giveaways:</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { name: 'Gold', color: '0xFFD700' },
                      { name: 'Orange', color: '0xFF8C00' },
                      { name: 'Rot', color: '0xFF4500' },
                      { name: 'Lila', color: '0x9932CC' },
                      { name: 'Grün', color: '0x32CD32' },
                      { name: 'Pink', color: '0xFF69B4' },
                      { name: 'Blau', color: '0x4169E1' },
                      { name: 'Silber', color: '0xC0C0C0' },
                    ].map((preset) => (
                      <button
                        key={`ended-${preset.name}`}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          endedEmbedColor: preset.color
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
                <p className="text-xs text-dark-muted mt-2">Diese Farbe wird für das "🎊 Giveaway Beendet!" Embed verwendet</p>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">📨 Winner DM Farbe</label>
                <div className="flex gap-3 items-center">
                  {/* Color Picker */}
                  <div className="relative">
                    <input
                      type="color"
                      value={settings.winnerDmColor?.startsWith('0x') ? `#${settings.winnerDmColor.slice(2)}` : settings.winnerDmColor?.startsWith('#') ? settings.winnerDmColor : '#FFD700'}
                      onChange={(e) => {
                        const hexColor = e.target.value;
                        const discordColor = `0x${hexColor.slice(1).toUpperCase()}`;
                        setSettings(prev => ({ ...prev, winnerDmColor: discordColor }));
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
                      value={settings.winnerDmColor || '0xFFD700'}
                      onChange={(e) => setSettings(prev => ({ ...prev, winnerDmColor: e.target.value }))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple font-mono"
                      placeholder="0xFFD700"
                    />
                  </div>

                  {/* Color Preview */}
                  <div 
                    className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                    style={{
                      backgroundColor: settings.winnerDmColor?.startsWith('0x') ? `#${settings.winnerDmColor.slice(2)}` : settings.winnerDmColor?.startsWith('#') ? settings.winnerDmColor : '#FFD700',
                      filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                    }}
                  >
                    📨
                  </div>
                </div>
                
                {/* Preset Colors für Winner DMs */}
                <div className="mt-3">
                  <p className="text-xs text-dark-muted mb-2">Beliebte Farben für Gewinner-DMs:</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { name: 'Gold', color: '0xFFD700' },
                      { name: 'Grün', color: '0x00FF00' },
                      { name: 'Blau', color: '0x0099FF' },
                      { name: 'Lila', color: '0x9966FF' },
                      { name: 'Pink', color: '0xFF69B4' },
                      { name: 'Orange', color: '0xFF6600' },
                      { name: 'Rot', color: '0xFF3333' },
                      { name: 'Türkis', color: '0x00FFCC' },
                    ].map((preset) => (
                      <button
                        key={`dm-${preset.name}`}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          winnerDmColor: preset.color
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
                <p className="text-xs text-dark-muted mt-2">Diese Farbe wird für die privaten Gewinner-Nachrichten verwendet</p>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard Settings */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-accent" />
                🏆 Leaderboard-Einstellungen
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Konfiguration der automatischen Leaderboard-Channels für Invite-Giveaways
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-dark-text">Automatische Leaderboard-Channel Erstellung</label>
                <Switch
                  checked={settings.leaderboard?.autoCreate ?? true}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    leaderboard: { ...prev.leaderboard, autoCreate: checked } as any
                  }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-dark-text">Automatische Updates aktiviert</label>
                <Switch
                  checked={settings.leaderboard?.autoUpdate ?? true}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    leaderboard: { ...prev.leaderboard, autoUpdate: checked } as any
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-dark-text">Usernamen anzeigen (statt nur IDs)</label>
                <Switch
                  checked={settings.leaderboard?.showUsernames ?? true}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    leaderboard: { ...prev.leaderboard, showUsernames: checked } as any
                  }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-dark-text mb-2 block">Update-Intervall (Sekunden)</label>
                <Input
                  type="number"
                  min="10"
                  max="300"
                  value={settings.leaderboard?.updateInterval ?? 30}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    leaderboard: { ...prev.leaderboard, updateInterval: parseInt(e.target.value) || 30 } as any
                  }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                  placeholder="30"
                />
                <p className="text-xs text-dark-muted mt-1">
                  Wie oft sollen die Leaderboards automatisch aktualisiert werden? (10-300 Sekunden)
                </p>
              </div>

              {/* Automatisches Leaderboard-Posting */}
              <div className="mt-6 p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-green-300 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Automatisches Leaderboard-Posting
                      <Tooltip 
                        title="⏰ Auto-Posting erklärt:"
                        content={
                          <div>
                            <div>Automatische Leaderboard-Posts:</div>
                            <div>• Automatische Channel-Erstellung: Erstellt eigene Channels bei Giveaway-Start</div>
                            <div>• Live-Updates: Channels werden im konfigurierten Intervall aktualisiert</div>
                            <div>• Auto-Löschung: Channels werden automatisch beim Giveaway-Ende gelöscht</div>
                            <div>• Smart-Kategorien: Channels werden unter der konfigurierten Kategorie erstellt</div>
                            <div>• Funktioniert parallel zu normalen Leaderboard-Channels</div>
                          </div>
                        }
                      />
                    </h4>
                    <p className="text-sm text-green-200">Erstellt automatisch eigene Channels für Leaderboards bei Giveaway-Start und aktualisiert sie regelmäßig</p>
                  </div>
                  <Switch
                    checked={settings.leaderboard?.autoPost?.enabled ?? false}
                    onCheckedChange={(checked) => setSettings(prev => ({ 
                      ...prev, 
                      leaderboard: { 
                        ...prev.leaderboard, 
                        autoPost: { 
                          ...prev.leaderboard?.autoPost,
                          enabled: checked,
                          time: prev.leaderboard?.autoPost?.time || '20:00',
                          timezone: prev.leaderboard?.autoPost?.timezone || 'Europe/Berlin',
                          channelName: prev.leaderboard?.autoPost?.channelName || 'leaderboard',
                          limit: prev.leaderboard?.autoPost?.limit || 10,
                          lastPosted: prev.leaderboard?.autoPost?.lastPosted || 0,
                          autoDeleteOld: prev.leaderboard?.autoPost?.autoDeleteOld ?? true
                        }
                      } as any
                    }))}
                  />
                </div>

                {settings.leaderboard?.autoPost?.enabled && (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      {/* Kategorie-Auswahl */}
                      <div>
                        <label className="text-sm font-medium text-green-300 mb-2 block">Kategorie-Name</label>
                        <Input
                          value={settings.leaderboard?.autoPost?.categoryName || 'giveaway'}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            leaderboard: { 
                              ...prev.leaderboard, 
                              autoPost: { ...prev.leaderboard?.autoPost, categoryName: e.target.value }
                            } as any
                          }))}
                          className="bg-dark-bg/70 border-green-500/30 text-dark-text focus:border-green-400"
                          placeholder="giveaway"
                        />
                        <p className="text-xs text-green-200/70 mt-1">
                          Name der Discord-Kategorie unter der Auto-Leaderboard-Channels erstellt werden sollen
                        </p>
                        {availableCategories.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-green-300 mb-1">📂 Verfügbare Kategorien:</p>
                            <div className="flex flex-wrap gap-1">
                              {availableCategories.map((category) => (
                                <button
                                  key={category}
                                  onClick={() => setSettings(prev => ({ 
                                    ...prev, 
                                    leaderboard: { 
                                      ...prev.leaderboard, 
                                      autoPost: { ...prev.leaderboard?.autoPost, categoryName: category }
                                    } as any
                                  }))}
                                  className="px-2 py-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded border border-green-500/30 transition-colors"
                                >
                                  {category}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Automatische Konfiguration */}
                      <div className="p-4 bg-dark-bg/30 rounded-lg border border-green-500/20">
                        <h5 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                          ⚙️ Automatische Konfiguration
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-green-200">Channel-Erstellung:</span>
                              <span className="text-green-300 font-medium">Automatisch</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-green-200">Update-Intervall:</span>
                              <span className="text-green-300 font-medium">{settings.leaderboard?.updateInterval || 30}s</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-green-200">Channel-Name:</span>
                              <span className="text-green-300 font-medium">leaderboard</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-green-200">Kategorie:</span>
                              <span className="text-green-300 font-medium">{settings.leaderboard?.autoPost?.categoryName || 'giveaway'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-green-200">Auto-Löschung:</span>
                              <span className="text-green-300 font-medium">Bei Giveaway-Ende</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {(settings.leaderboard?.autoPost?.lastPosted || 0) > 0 && (
                      <div className="p-3 bg-dark-bg/30 rounded-lg border border-green-500/20">
                        <p className="text-sm text-green-200">
                          <Clock className="w-4 h-4 inline mr-2" />
                          Letztes Channel-Update: {new Date(settings.leaderboard.autoPost.lastPosted).toLocaleString('de-DE')}
                        </p>
                        <p className="text-xs text-green-200/70 mt-1">
                          Automatische Updates alle {settings.leaderboard?.updateInterval || 30} Sekunden
                        </p>
                      </div>
                    )}

                    {/* Test Button für Auto-Leaderboard */}
                    <div className="p-3 bg-gradient-to-r from-blue-600/20 to-blue-700/20 rounded-lg border border-blue-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-semibold text-blue-400 mb-1 flex items-center gap-2">
                            🧪 Auto-Channels testen
                          </h5>
                          <p className="text-xs text-blue-200">Erstelle Test-Channels für aktive Invite-Giveaways</p>
                        </div>
                        <Button
                          onClick={testAutoLeaderboard}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105"
                        >
                          <Send className="w-4 h-4" />
                          Test erstellen
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <h5 className="font-bold text-blue-300 mb-2">ℹ️ Leaderboard-Info:</h5>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• <strong>Dedicated Channels:</strong> Erstellt `🏆-[giveaway-titel]-leaderboard` Channels (werden beim Giveaway-Ende gelöscht)</li>
                  <li>• <strong>Auto-Posts:</strong> Postet täglich Leaderboards in einen dauerhaften Channel zur angegebenen Uhrzeit</li>
                  <li>• <strong>Live-Updates:</strong> Dedicated Channels zeigen in Echtzeit wer die meisten Einladungen hat</li>
                  <li>• <strong>Smart Namen:</strong> Titel werden automatisch Discord-kompatibel formatiert</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Tab */}
        <TabsContent value="create" className="space-y-6" activeTab={activeTab}>
          {/* Giveaway Type Selection */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-accent" />
                Giveaway-Typ auswählen
                <Tooltip 
                  title="🎁 Giveaway-Typen erklärt:"
                  content={
                    <div>
                      <div>• Classic: Standard Button-Giveaway</div>
                      <div>• Invite: Einladungsbasiert mit persönlichen Codes</div>
                      <div>• Fisch: Virtuelle Angel-Challenge (Coming Soon)</div>
                      <div>• Schnick Schnack Schnuck: Bester von 3 gewinnt (Coming Soon)</div>
                      <div>• Schatzsuche: Folge Hinweisen zum Schatz (Coming Soon)</div>
                      <div>• Quiz Master: Fragen beantworten (Coming Soon)</div>
                    </div>
                  }
                />
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Wähle den Typ des Giveaways basierend auf deinen Anforderungen. Neue Typen sind in Entwicklung! 🚧
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'classic', icon: '🎁', title: 'Classic Giveaway', desc: 'Standard Button-basiertes Giveaway', available: true },
                  { value: 'invite', icon: '📨', title: 'Invite Giveaway', desc: 'Einladungsbasiert mit Tracking', available: true },
                  { value: 'fish', icon: '🐠', title: 'Fisch Giveaway', desc: 'Fange den besten Fisch!', available: false },
                  { value: 'rock-paper-scissors', icon: '✂️', title: 'Schnick Schnack Schnuck', desc: 'Bester von 3 Runden gewinnt!', available: false },
                  { value: 'treasure-hunt', icon: '🗺️', title: 'Schatzsuche Giveaway', desc: 'Folge den Hinweisen zum Schatz!', available: false },
                  { value: 'quiz', icon: '🧠', title: 'Quiz Master Giveaway', desc: 'Beantworte Fragen und gewinne!', available: false }
                ].map((type) => (
                  <div
                    key={type.value}
                    onClick={() => type.available && setNewGiveaway(prev => ({ ...prev, type: type.value }))}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 relative ${
                      type.available
                        ? `cursor-pointer hover:scale-105 ${
                      newGiveaway.type === type.value 
                        ? 'border-purple-primary bg-purple-primary/20 shadow-purple-glow' 
                        : 'border-purple-primary/30 bg-dark-bg/50 hover:border-purple-primary/60'
                          }`
                        : 'cursor-not-allowed border-gray-500/30 bg-gray-800/30 opacity-60'
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <h3 className="font-bold text-dark-text">{type.title}</h3>
                    <p className="text-sm text-dark-muted">{type.desc}</p>
                    
                    {!type.available && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg backdrop-blur-sm">
                        <div className="text-center animate-pulse">
                          <div className="text-yellow-400 font-bold text-lg mb-1 animate-bounce">🚧 Coming Soon!</div>
                          <div className="text-xs text-gray-300">Bald verfügbar</div>
                          <div className="mt-2 text-2xl animate-spin-slow">⏳</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Basic Configuration */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-accent" />
                Basis-Konfiguration
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Grundlegende Einstellungen für dein Giveaway
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-dark-text">Titel *</label>
                    <Tooltip 
                      title="📝 Giveaway Titel:"
                      content="Der Haupttitel deines Giveaways (wird in Discord angezeigt)"
                    />
                  </div>
                  <Input
                    value={newGiveaway.title}
                    onChange={(e) => setNewGiveaway(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    placeholder="z.B. Discord Nitro Mega Giveaway 🎉"
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-dark-text">Preis *</label>
                    <Tooltip 
                      title="🎁 Giveaway Preis:"
                      content="Was wird verlost? Sei spezifisch und attraktiv!"
                    />
                  </div>
                  <Input
                    value={newGiveaway.prize}
                    onChange={(e) => setNewGiveaway(prev => ({ ...prev, prize: e.target.value }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    placeholder="z.B. Discord Nitro (3 Monate) + Steam Gift Card (50€)"
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-dark-text">Channel *</label>
                    <Tooltip 
                      title="📺 Giveaway Channel:"
                      content="In welchem Channel soll das Giveaway gepostet werden?"
                    />
                  </div>
                  <Select value={newGiveaway.channelName} onValueChange={(value) => setNewGiveaway(prev => ({ ...prev, channelName: value }))}>
                    <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple">
                      <SelectValue placeholder="Channel wählen..." />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-purple-primary/30">
                      {channels.map(channel => (
                        <SelectItem key={channel.id} value={channel.name} className="text-dark-text hover:bg-purple-primary/20">
                          #{channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-dark-text">Anzahl Gewinner</label>
                    <Tooltip 
                      title="🏆 Gewinner-Anzahl:"
                      content="Wie viele Gewinner soll es geben? (1-10)"
                    />
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max={settings.limits.maxWinners}
                    value={newGiveaway.winners}
                    onChange={(e) => setNewGiveaway(prev => ({ ...prev, winners: parseInt(e.target.value) || 1 }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-dark-text">Dauer</label>
                    <Tooltip 
                      title="⏰ Giveaway Dauer:"
                      content="Wie lange soll das Giveaway laufen? Wähle Zeitraum und Einheit."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={newGiveaway.durationValue || 1}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        const unit = newGiveaway.durationUnit || 'hours';
                        const multiplier = {
                          'minutes': 60000,
                          'hours': 3600000,
                          'days': 86400000,
                          'weeks': 604800000,
                          'months': 2592000000
                        };
                        setNewGiveaway(prev => ({ 
                          ...prev, 
                          durationValue: value,
                          duration: value * multiplier[unit]
                        }));
                      }}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple flex-1"
                    />
                    <Select 
                      value={newGiveaway.durationUnit || 'hours'} 
                      onValueChange={(unit) => {
                        const value = newGiveaway.durationValue || 1;
                        const multiplier = {
                          'minutes': 60000,
                          'hours': 3600000,
                          'days': 86400000,
                          'weeks': 604800000,
                          'months': 2592000000
                        };
                        setNewGiveaway(prev => ({ 
                          ...prev, 
                          durationUnit: unit,
                          duration: value * multiplier[unit]
                        }));
                      }}
                    >
                      <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-surface border-purple-primary/30">
                        <SelectItem value="minutes" className="text-dark-text hover:bg-purple-primary/20">Minuten</SelectItem>
                        <SelectItem value="hours" className="text-dark-text hover:bg-purple-primary/20">Stunden</SelectItem>
                        <SelectItem value="days" className="text-dark-text hover:bg-purple-primary/20">Tage</SelectItem>
                        <SelectItem value="weeks" className="text-dark-text hover:bg-purple-primary/20">Wochen</SelectItem>
                        <SelectItem value="months" className="text-dark-text hover:bg-purple-primary/20">Monate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-dark-text">Mindest-Account Alter (Tage)</label>
                    <Tooltip 
                      title="🔒 Anti-Cheat:"
                      content="Wie alt muss der Discord-Account mindestens sein? (verhindert Alt-Accounts)"
                    />
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="365"
                    value={Math.floor((newGiveaway.requirements?.minAccountAge || 0) / (24 * 60 * 60 * 1000))}
                    onChange={(e) => setNewGiveaway(prev => ({ 
                      ...prev, 
                      requirements: { 
                        ...prev.requirements, 
                        minAccountAge: parseInt(e.target.value) * 24 * 60 * 60 * 1000 
                      }
                    }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-dark-text">Beschreibung</label>
                  <Tooltip 
                    title="📄 Giveaway Beschreibung:"
                    content="Zusätzliche Informationen, Regeln oder Motivationstext für die Teilnehmer"
                  />
                </div>
                <textarea
                  value={newGiveaway.description}
                  onChange={(e) => setNewGiveaway(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full h-24 p-3 bg-dark-bg/70 border border-purple-primary/30 text-dark-text focus:border-neon-purple rounded-lg resize-none"
                  placeholder="🎉 Mega Giveaway Zeit! Nimm teil und gewinne tolle Preise! Viel Glück allen Teilnehmern! 🍀"
                />
              </div>
            </CardContent>
          </Card>

          {/* General Requirements */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-accent" />
                Allgemeine Anforderungen
                <Tooltip 
                  title="📋 Teilnahme-Anforderungen:"
                  content="Diese Anforderungen gelten für alle Teilnehmer dieses Giveaways, unabhängig vom Typ."
                />
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Lege fest, welche Bedingungen Teilnehmer erfüllen müssen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Server Requirements */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Server-Anforderungen
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Server-Mitglied seit (Tage)</label>
                      <p className="text-xs text-dark-muted">Mindestzeit der Server-Mitgliedschaft</p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={Math.floor((newGiveaway.requirements?.minServerAge || 0) / (24 * 60 * 60 * 1000))}
                      onChange={(e) => setNewGiveaway(prev => ({ 
                        ...prev, 
                        requirements: { 
                          ...prev.requirements, 
                          minServerAge: parseInt(e.target.value) * 24 * 60 * 60 * 1000 
                        }
                      }))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple w-20"
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Mindest-Level (falls XP System aktiv)</label>
                      <p className="text-xs text-dark-muted">Benötigtes Level im Server</p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="999"
                      value={newGiveaway.requirements?.minLevel || 0}
                      onChange={(e) => setNewGiveaway(prev => ({ 
                        ...prev, 
                        requirements: { 
                          ...prev.requirements, 
                          minLevel: parseInt(e.target.value) || 0
                        }
                      }))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple w-20"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Min. Nachrichten im Server</label>
                      <p className="text-xs text-dark-muted">Mindestanzahl gesendeter Nachrichten</p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="9999"
                      value={newGiveaway.requirements?.minMessages || 0}
                      onChange={(e) => setNewGiveaway(prev => ({ 
                        ...prev, 
                        requirements: { 
                          ...prev.requirements, 
                          minMessages: parseInt(e.target.value) || 0
                        }
                      }))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple w-20"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Min. Voice-Zeit (Minuten)</label>
                      <p className="text-xs text-dark-muted">Mindest-Sprachkanalzeit im Server</p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="99999"
                      value={newGiveaway.requirements?.minVoiceTime || 0}
                      onChange={(e) => setNewGiveaway(prev => ({ 
                        ...prev, 
                        requirements: { 
                          ...prev.requirements, 
                          minVoiceTime: parseInt(e.target.value) || 0
                        }
                      }))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple w-20"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Role Requirements */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Rollen-Anforderungen
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Benötigte Rollen (mind. eine)</label>
                      <p className="text-xs text-dark-muted">User müssen mindestens eine dieser Rollen haben</p>
                    </div>
                    <Select 
                      value={newGiveaway.requirements?.requiredRoles?.[0] || ''} 
                      onValueChange={(value) => {
                        if (value && !newGiveaway.requirements?.requiredRoles?.includes(value)) {
                          setNewGiveaway(prev => ({ 
                            ...prev, 
                            requirements: { 
                              ...prev.requirements, 
                              requiredRoles: [...(prev.requirements?.requiredRoles || []), value]
                            }
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple w-48">
                        <SelectValue placeholder="Rolle hinzufügen..." />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-surface border-purple-primary/30">
                        {roles.filter(role => !newGiveaway.requirements?.requiredRoles?.includes(role.id)).map(role => (
                          <SelectItem key={role.id} value={role.id} className="text-dark-text hover:bg-purple-primary/20">
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Display selected required roles */}
                  {newGiveaway.requirements?.requiredRoles && newGiveaway.requirements.requiredRoles.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-dark-bg/30 rounded-lg border border-purple-primary/20">
                      {newGiveaway.requirements.requiredRoles.map(roleId => {
                        const role = roles.find(r => r.id === roleId);
                        return role ? (
                          <span 
                            key={roleId}
                            className="px-2 py-1 bg-purple-primary/20 text-purple-300 rounded text-xs flex items-center gap-1"
                          >
                            {role.name}
                            <X 
                              className="w-3 h-3 cursor-pointer hover:text-red-400" 
                              onClick={() => setNewGiveaway(prev => ({ 
                                ...prev, 
                                requirements: { 
                                  ...prev.requirements, 
                                  requiredRoles: prev.requirements?.requiredRoles?.filter(id => id !== roleId) || []
                                }
                              }))}
                            />
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Verbotene Rollen</label>
                      <p className="text-xs text-dark-muted">User mit diesen Rollen können nicht teilnehmen</p>
                    </div>
                    <Select 
                      value={''} 
                      onValueChange={(value) => {
                        if (value && !newGiveaway.requirements?.blockedRoles?.includes(value)) {
                          setNewGiveaway(prev => ({ 
                            ...prev, 
                            requirements: { 
                              ...prev.requirements, 
                              blockedRoles: [...(prev.requirements?.blockedRoles || []), value]
                            }
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple w-48">
                        <SelectValue placeholder="Rolle sperren..." />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-surface border-purple-primary/30">
                        {roles.filter(role => !newGiveaway.requirements?.blockedRoles?.includes(role.id)).map(role => (
                          <SelectItem key={role.id} value={role.id} className="text-dark-text hover:bg-purple-primary/20">
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                                     {/* Display blocked roles */}
                   {newGiveaway.requirements?.blockedRoles && newGiveaway.requirements.blockedRoles.length > 0 && (
                     <div className="flex flex-wrap gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                       {newGiveaway.requirements.blockedRoles.map(roleId => {
                         const role = roles.find(r => r.id === roleId);
                         return role ? (
                           <span 
                             key={roleId}
                             className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-xs flex items-center gap-1"
                           >
                             {role.name}
                             <X 
                               className="w-3 h-3 cursor-pointer hover:text-red-200" 
                               onClick={() => setNewGiveaway(prev => ({ 
                                 ...prev, 
                                 requirements: { 
                                   ...prev.requirements, 
                                   blockedRoles: prev.requirements?.blockedRoles?.filter(id => id !== roleId) || []
                                 }
                               }))}
                             />
                           </span>
                         ) : null;
                       })}
                     </div>
                   )}
                </div>
              </div>

              {/* Additional Requirements */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Zusätzliche Bedingungen
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Discord Nitro erforderlich</label>
                      <p className="text-xs text-dark-muted">Nur Nitro-User können teilnehmen</p>
                    </div>
                    <Switch
                      checked={newGiveaway.requirements?.requiresNitro || false}
                      onCheckedChange={(checked) => setNewGiveaway(prev => ({ 
                        ...prev, 
                        requirements: { ...prev.requirements, requiresNitro: checked }
                      }))}
                      className="data-[state=checked]:bg-purple-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Profilbild erforderlich</label>
                      <p className="text-xs text-dark-muted">User müssen ein Profilbild haben</p>
                    </div>
                    <Switch
                      checked={newGiveaway.requirements?.requiresAvatar || false}
                      onCheckedChange={(checked) => setNewGiveaway(prev => ({ 
                        ...prev, 
                        requirements: { ...prev.requirements, requiresAvatar: checked }
                      }))}
                      className="data-[state=checked]:bg-purple-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                    <div>
                      <label className="text-sm font-medium text-dark-text">Verifizierte E-Mail erforderlich</label>
                      <p className="text-xs text-dark-muted">Discord Account muss verifiziert sein</p>
                    </div>
                    <Switch
                      checked={newGiveaway.requirements?.requiresVerifiedEmail || false}
                      onCheckedChange={(checked) => setNewGiveaway(prev => ({ 
                        ...prev, 
                        requirements: { ...prev.requirements, requiresVerifiedEmail: checked }
                      }))}
                      className="data-[state=checked]:bg-purple-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                    <div>
                      <label className="text-sm font-medium text-dark-text">2FA erforderlich</label>
                      <p className="text-xs text-dark-muted">Zwei-Faktor-Authentifizierung nötig</p>
                    </div>
                    <Switch
                      checked={newGiveaway.requirements?.requires2FA || false}
                      onCheckedChange={(checked) => setNewGiveaway(prev => ({ 
                        ...prev, 
                        requirements: { ...prev.requirements, requires2FA: checked }
                      }))}
                      className="data-[state=checked]:bg-purple-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Whitelist/Blacklist */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  User-Listen
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-dark-text">Whitelist (nur diese User)</label>
                    <div className="flex gap-2">
                      <Input
                        value={newGiveaway.requirements?.whitelistInput || ''}
                        onChange={(e) => setNewGiveaway(prev => ({ 
                          ...prev, 
                          requirements: { ...prev.requirements, whitelistInput: e.target.value }
                        }))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple flex-1"
                        placeholder="User ID oder @username"
                      />
                      <Button
                        onClick={() => {
                          const input = newGiveaway.requirements?.whitelistInput?.trim();
                          if (input && !newGiveaway.requirements?.whitelist?.includes(input)) {
                            setNewGiveaway(prev => ({ 
                              ...prev, 
                              requirements: { 
                                ...prev.requirements, 
                                whitelist: [...(prev.requirements?.whitelist || []), input],
                                whitelistInput: ''
                              }
                            }));
                          }
                        }}
                        className="bg-green-500 hover:bg-green-600 px-3"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {newGiveaway.requirements?.whitelist && newGiveaway.requirements.whitelist.length > 0 && (
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {newGiveaway.requirements.whitelist.map((user, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs flex items-center gap-1"
                          >
                            {user}
                            <X 
                              className="w-3 h-3 cursor-pointer hover:text-green-200" 
                              onClick={() => setNewGiveaway(prev => ({ 
                                ...prev, 
                                requirements: { 
                                  ...prev.requirements, 
                                  whitelist: prev.requirements?.whitelist?.filter((_, i) => i !== index) || []
                                }
                              }))}
                            />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-dark-text">Blacklist (gesperrte User)</label>
                    <div className="flex gap-2">
                      <Input
                        value={newGiveaway.requirements?.blacklistInput || ''}
                        onChange={(e) => setNewGiveaway(prev => ({ 
                          ...prev, 
                          requirements: { ...prev.requirements, blacklistInput: e.target.value }
                        }))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple flex-1"
                        placeholder="User ID oder @username"
                      />
                      <Button
                        onClick={() => {
                          const input = newGiveaway.requirements?.blacklistInput?.trim();
                          if (input && !newGiveaway.requirements?.blacklist?.includes(input)) {
                            setNewGiveaway(prev => ({ 
                              ...prev, 
                              requirements: { 
                                ...prev.requirements, 
                                blacklist: [...(prev.requirements?.blacklist || []), input],
                                blacklistInput: ''
                              }
                            }));
                          }
                        }}
                        className="bg-red-500 hover:bg-red-600 px-3"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {newGiveaway.requirements?.blacklist && newGiveaway.requirements.blacklist.length > 0 && (
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {newGiveaway.requirements.blacklist.map((user, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs flex items-center gap-1"
                          >
                            {user}
                            <X 
                              className="w-3 h-3 cursor-pointer hover:text-red-200" 
                              onClick={() => setNewGiveaway(prev => ({ 
                                ...prev, 
                                requirements: { 
                                  ...prev.requirements, 
                                  blacklist: prev.requirements?.blacklist?.filter((_, i) => i !== index) || []
                                }
                              }))}
                            />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Requirements Summary */}
              {(newGiveaway.requirements && Object.keys(newGiveaway.requirements).some(key => 
                key !== 'whitelistInput' && key !== 'blacklistInput' && newGiveaway.requirements[key] && 
                (typeof newGiveaway.requirements[key] !== 'object' || 
                 (Array.isArray(newGiveaway.requirements[key]) && newGiveaway.requirements[key].length > 0) ||
                 (!Array.isArray(newGiveaway.requirements[key]) && Object.keys(newGiveaway.requirements[key]).length > 0))
              )) && (
                <div className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-primary/30 rounded-lg">
                  <h4 className="font-bold text-purple-300 mb-3 flex items-center gap-2">
                    📋 Aktive Anforderungen - Zusammenfassung
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-dark-text">
                    {newGiveaway.requirements?.minAccountAge > 0 && (
                      <div>• Account älter als {Math.floor(newGiveaway.requirements.minAccountAge / (24 * 60 * 60 * 1000))} Tage</div>
                    )}
                    {newGiveaway.requirements?.minServerAge > 0 && (
                      <div>• Server-Mitglied seit {Math.floor(newGiveaway.requirements.minServerAge / (24 * 60 * 60 * 1000))} Tagen</div>
                    )}
                    {newGiveaway.requirements?.minLevel > 0 && (
                      <div>• Mindest-Level: {newGiveaway.requirements.minLevel}</div>
                    )}
                    {newGiveaway.requirements?.minMessages > 0 && (
                      <div>• Mindestens {newGiveaway.requirements.minMessages} Nachrichten</div>
                    )}
                    {newGiveaway.requirements?.minVoiceTime > 0 && (
                      <div>• Mindestens {newGiveaway.requirements.minVoiceTime} Min. Voice-Zeit</div>
                    )}
                    {newGiveaway.requirements?.requiredRoles?.length > 0 && (
                      <div>• Benötigt eine der Rollen: {newGiveaway.requirements.requiredRoles.length}</div>
                    )}
                    {newGiveaway.requirements?.blockedRoles?.length > 0 && (
                      <div>• Gesperrte Rollen: {newGiveaway.requirements.blockedRoles.length}</div>
                    )}
                    {newGiveaway.requirements?.requiresNitro && (
                      <div>• Discord Nitro erforderlich</div>
                    )}
                    {newGiveaway.requirements?.requiresAvatar && (
                      <div>• Profilbild erforderlich</div>
                    )}
                    {newGiveaway.requirements?.requiresVerifiedEmail && (
                      <div>• Verifizierte E-Mail erforderlich</div>
                    )}
                    {newGiveaway.requirements?.requires2FA && (
                      <div>• 2FA erforderlich</div>
                    )}
                    {newGiveaway.requirements?.whitelist?.length > 0 && (
                      <div>• Nur Whitelist-User ({newGiveaway.requirements.whitelist.length})</div>
                    )}
                    {newGiveaway.requirements?.blacklist?.length > 0 && (
                      <div>• Blacklist-User ausgeschlossen ({newGiveaway.requirements.blacklist.length})</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advanced Requirements */}
          {(newGiveaway.type === 'xp' || newGiveaway.type === 'role' || newGiveaway.type === 'invite') && (
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-accent" />
                  Typ-spezifische Anforderungen
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Spezielle Anforderungen für den gewählten Giveaway-Typ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              {newGiveaway.type === 'xp' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-dark-text">Mindest XP-Level</label>
                      <Tooltip 
                        title="⭐ XP-Anforderung:"
                        content="Nur User mit diesem XP-Level oder höher können teilnehmen"
                      />
                    </div>
                    <Input
                      type="number"
                      min="1"
                      value={newGiveaway.requirements?.minXP || 100}
                      onChange={(e) => setNewGiveaway(prev => ({ 
                        ...prev, 
                        requirements: { ...prev.requirements, minXP: parseInt(e.target.value) || 100 }
                      }))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      placeholder="z.B. 1000"
                    />
                  </div>
                )}

                {newGiveaway.type === 'role' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-dark-text">Erforderliche Rollen (zusätzlich)</label>
                      <Tooltip 
                        title="👑 Rollen-Anforderung:"
                        content="User müssen mindestens eine dieser Rollen haben um teilnehmen zu können"
                      />
                    </div>
                    <Select 
                      value={newGiveaway.requirements?.roleSpecificRoles?.[0] || ''} 
                      onValueChange={(value) => setNewGiveaway(prev => ({ 
                        ...prev, 
                        requirements: { ...prev.requirements, roleSpecificRoles: [value] }
                      }))}
                    >
                      <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple">
                        <SelectValue placeholder="Rolle wählen..." />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-surface border-purple-primary/30">
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id} className="text-dark-text hover:bg-purple-primary/20">
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newGiveaway.type === 'invite' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-primary/30 rounded-lg">
                      <h4 className="font-bold text-purple-300 mb-3 flex items-center gap-2">
                        📨 Invite Giveaway - Funktionsweise
                      </h4>
                      <div className="space-y-2 text-sm text-dark-text">
                        <p><strong className="text-purple-400">1.</strong> Jeder Teilnehmer erhält einen persönlichen Invite-Link</p>
                        <p><strong className="text-purple-400">2.</strong> Über diesen Link können neue Mitglieder eingeladen werden</p>
                        <p><strong className="text-purple-400">3.</strong> Das System trackt automatisch wer wen eingeladen hat</p>
                        <p><strong className="text-purple-400">4.</strong> Der User mit den meisten gültigen Einladungen gewinnt!</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-sm font-medium text-dark-text">Mindest-Einladungen zum Teilnehmen</label>
                          <Tooltip 
                            title="📨 Teilnahme-Anforderung:"
                            content="Wie viele Personen muss ein User mindestens einladen um überhaupt am Giveaway teilnehmen zu können?"
                          />
                        </div>
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          value={newGiveaway.requirements?.minInvites || 0}
                          onChange={(e) => setNewGiveaway(prev => ({ 
                            ...prev, 
                            requirements: { ...prev.requirements, minInvites: parseInt(e.target.value) || 0 }
                          }))}
                          className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                          placeholder="z.B. 3"
                        />
                        <p className="text-xs text-dark-muted mt-1">0 = Jeder kann teilnehmen, auch ohne Einladungen</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-sm font-medium text-dark-text">Max. Invite-Links pro User</label>
                          <Tooltip 
                            title="🔗 Link-Limit:"
                            content="Wie viele persönliche Invite-Links kann ein User maximal erstellen?"
                          />
                        </div>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={newGiveaway.requirements?.maxInviteLinks || 3}
                          onChange={(e) => setNewGiveaway(prev => ({ 
                            ...prev, 
                            requirements: { ...prev.requirements, maxInviteLinks: parseInt(e.target.value) || 3 }
                          }))}
                          className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                          placeholder="z.B. 3"
                        />
                        <p className="text-xs text-dark-muted mt-1">Empfohlen: 1-3 Links pro User</p>
                      </div>
                    </div>

                    <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <h5 className="font-bold text-green-300 mb-2">✨ Giveaway-Regeln:</h5>
                      <ul className="text-sm text-green-200 space-y-1">
                        <li>• Nur Einladungen von neuen Mitgliedern zählen</li>
                        <li>• Selbst-Einladungen werden automatisch erkannt und ausgeschlossen</li>
                        <li>• Bot-Accounts zählen nicht als gültige Einladungen</li>
                        <li>• Der Gewinner wird am Ende automatisch ermittelt</li>
                        <li>• Bei Gleichstand entscheidet der Zufall</li>
                      </ul>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
          )}

          {/* Anti-Cheat Settings */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-accent" />
                Anti-Cheat Einstellungen
                <Tooltip 
                  title="🛡️ Anti-Cheat System:"
                  content="Diese Einstellungen gelten als Standard für neue Giveaways und werden automatisch gespeichert."
                />
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Schutz vor unfairem Verhalten und Bot-Accounts (wird automatisch gespeichert)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-dark-text">Bot-Accounts verhindern</label>
                    <p className="text-xs text-dark-muted">Verhindert Teilnahme von Discord-Bots</p>
                  </div>
                  <Switch
                    checked={settings.antiCheat?.preventBotAccounts || false}
                    onCheckedChange={async (checked) => {
                      const newSettings = { 
                        ...settings, 
                        antiCheat: { 
                          ...settings.antiCheat, 
                          preventBotAccounts: checked 
                        }
                      };
                      setSettings(newSettings);
                      setNewGiveaway(prev => ({ 
                        ...prev, 
                        requirements: { ...prev.requirements, preventBots: checked }
                      }));
                      // Automatisch speichern
                      await autoSaveAntiCheatSettings(newSettings);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-dark-text">Mehrfach-Teilnahme verhindern</label>
                    <p className="text-xs text-dark-muted">Ein User kann nur einmal teilnehmen</p>
                  </div>
                  <Switch
                    checked={settings.antiCheat?.preventMultipleEntries !== false}
                    onCheckedChange={async (checked) => {
                      const newSettings = { 
                        ...settings, 
                        antiCheat: { 
                          ...settings.antiCheat, 
                          preventMultipleEntries: checked 
                        }
                      };
                      setSettings(newSettings);
                      setNewGiveaway(prev => ({ 
                        ...prev, 
                        requirements: { ...prev.requirements, preventMultiple: checked }
                      }));
                      // Automatisch speichern
                      await autoSaveAntiCheatSettings(newSettings);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-dark-text">Server-Mitgliedschaft prüfen</label>
                    <p className="text-xs text-dark-muted">Nur aktuelle Server-Mitglieder können gewinnen</p>
                  </div>
                  <Switch
                    checked={settings.antiCheat?.checkMembership !== false}
                    onCheckedChange={async (checked) => {
                      const newSettings = { 
                        ...settings, 
                        antiCheat: { 
                          ...settings.antiCheat, 
                          checkMembership: checked 
                        }
                      };
                      setSettings(newSettings);
                      setNewGiveaway(prev => ({ 
                        ...prev, 
                        requirements: { ...prev.requirements, checkMembership: checked }
                      }));
                      // Automatisch speichern
                      await autoSaveAntiCheatSettings(newSettings);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-dark-text">Selbst-Einladungen verhindern</label>
                    <p className="text-xs text-dark-muted">Verhindert dass User sich selbst einladen</p>
                  </div>
                  <Switch
                    checked={settings.antiCheat?.preventSelfInvite !== false}
                    onCheckedChange={async (checked) => {
                      const newSettings = { 
                        ...settings, 
                        antiCheat: { 
                          ...settings.antiCheat, 
                          preventSelfInvite: checked 
                        }
                      };
                      setSettings(newSettings);
                      // Automatisch speichern
                      await autoSaveAntiCheatSettings(newSettings);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-dark-text">Alt-Account Erkennung</label>
                    <p className="text-xs text-dark-muted">Erkennt verdächtige Account-Muster und koordinierte Joins</p>
                  </div>
                  <Switch
                    checked={settings.antiCheat?.preventDuplicateIPs === true}
                    onCheckedChange={async (checked) => {
                      const newSettings = { 
                        ...settings, 
                        antiCheat: { 
                          ...settings.antiCheat, 
                          preventDuplicateIPs: checked 
                        }
                      };
                      setSettings(newSettings);
                      setNewGiveaway(prev => ({ 
                        ...prev, 
                        requirements: { ...prev.requirements, preventDuplicateIPs: checked }
                      }));
                      // Automatisch speichern
                      await autoSaveAntiCheatSettings(newSettings);
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-dark-text">Mindest-Account-Alter (Tage)</label>
                    <Tooltip 
                      title="🔒 Account-Alter:"
                      content="Accounts müssen mindestens so alt sein um teilnehmen zu können"
                    />
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="365"
                    value={Math.floor((settings.antiCheat?.minAccountAge || 0) / (24 * 60 * 60 * 1000))}
                    onChange={async (e) => {
                      const days = parseInt(e.target.value) || 0;
                      const milliseconds = days * 24 * 60 * 60 * 1000;
                      const newSettings = { 
                        ...settings, 
                        antiCheat: { 
                          ...settings.antiCheat, 
                          minAccountAge: milliseconds 
                        }
                      };
                      setSettings(newSettings);
                      setNewGiveaway(prev => ({ 
                        ...prev, 
                        requirements: { ...prev.requirements, minAccountAge: milliseconds }
                      }));
                      // Automatisch speichern (mit Debounce)
                      clearTimeout(window.accountAgeTimeout);
                      window.accountAgeTimeout = setTimeout(async () => {
                        try {
                          await fetch('/api/giveaway/settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newSettings)
                          });
                        } catch (error) {
                          console.error('Fehler beim Auto-Speichern:', error);
                        }
                      }, 1000); // 1 Sekunde Debounce
                    }}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    placeholder="z.B. 7"
                  />
                  <p className="text-xs text-dark-muted mt-1">Standard: 7 Tage (verhindert neue Alt-Accounts)</p>
                </div>
              </div>

              <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <h5 className="font-bold text-blue-300 mb-2">🛡️ Anti-Cheat Features:</h5>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• <strong>Bot-Accounts:</strong> Verhindert Teilnahme von Discord-Bots</li>
                  <li>• <strong>Selbst-Einladungen:</strong> User können sich nicht selbst einladen</li>
                  <li>• <strong>Mehrfach-Einladungen:</strong> Dieselbe Person kann nicht mehrmals eingeladen werden</li>
                  <li>• <strong>Account-Alter:</strong> Mindest-Alter verhindert frische Alt-Accounts</li>
                  <li>• <strong>Alt-Account Erkennung:</strong> Erkennt verdächtige Usernamen und koordinierte Joins</li>
                  <li>• <strong>Automatisch:</strong> Alle Prüfungen erfolgen in Echtzeit bei Einladungen</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardContent className="p-6">
              <div className="flex justify-end gap-3">
                <Button
                  onClick={testGiveaway}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Test-Giveaway
                </Button>
                <Button
                  onClick={createGiveaway}
                  disabled={!newGiveaway.title || !newGiveaway.prize || !newGiveaway.channelName}
                  className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Gift className="w-4 h-4" />
                  {newGiveaway.type === 'classic' ? '🎁 Classic Giveaway' :
                   newGiveaway.type === 'invite' ? '📨 Invite Giveaway' :
                   newGiveaway.type === 'reaction' ? '⚡ Reaction Giveaway' :
                   newGiveaway.type === 'xp' ? '⭐ XP Giveaway' :
                   newGiveaway.type === 'role' ? '👑 Role Giveaway' :
                   newGiveaway.type === 'multi' ? '🏆 Multi Giveaway' : 'Giveaway'} erstellen
                </Button>
              </div>
              
              {/* Validation Messages */}
              {(!newGiveaway.title || !newGiveaway.prize || !newGiveaway.channelName) && (
                <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-300">
                    ⚠️ <strong>Fehlende Angaben:</strong>
                    {!newGiveaway.title && ' Titel'}
                    {!newGiveaway.prize && ' Preis'}
                    {!newGiveaway.channelName && ' Channel'}
                  </p>
                </div>
              )}

              {/* Giveaway Preview */}
              {newGiveaway.title && newGiveaway.prize && (
                <div className="mt-4 p-4 bg-dark-bg/50 border border-purple-primary/30 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-400 mb-2">🎉 Giveaway Vorschau:</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong className="text-dark-text">Typ:</strong> <span className="text-purple-300">{
                      newGiveaway.type === 'classic' ? '🎁 Classic' :
                      newGiveaway.type === 'invite' ? '📨 Invite-basiert' :
                      newGiveaway.type === 'reaction' ? '⚡ Reaktions-basiert' :
                      newGiveaway.type === 'xp' ? '⭐ XP-basiert' :
                      newGiveaway.type === 'role' ? '👑 Rollen-basiert' :
                      newGiveaway.type === 'multi' ? '🏆 Multi-Gewinner' : newGiveaway.type
                    }</span></div>
                    <div><strong className="text-dark-text">Titel:</strong> <span className="text-dark-muted">{newGiveaway.title}</span></div>
                    <div><strong className="text-dark-text">Preis:</strong> <span className="text-dark-muted">{newGiveaway.prize}</span></div>
                    <div><strong className="text-dark-text">Dauer:</strong> <span className="text-dark-muted">{newGiveaway.durationValue} {
                      newGiveaway.durationUnit === 'minutes' ? 'Minuten' :
                      newGiveaway.durationUnit === 'hours' ? 'Stunden' :
                      newGiveaway.durationUnit === 'days' ? 'Tage' :
                      newGiveaway.durationUnit === 'weeks' ? 'Wochen' :
                      newGiveaway.durationUnit === 'months' ? 'Monate' : ''
                    }</span></div>
                    <div><strong className="text-dark-text">Gewinner:</strong> <span className="text-dark-muted">{newGiveaway.winners}</span></div>
                    {newGiveaway.requirements?.minAccountAge && (
                      <div><strong className="text-dark-text">Min. Account-Alter:</strong> <span className="text-dark-muted">{Math.floor(newGiveaway.requirements.minAccountAge / (24 * 60 * 60 * 1000))} Tage</span></div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Tab */}
        <TabsContent value="active" className="space-y-6" activeTab={activeTab}>
          {activeGiveaways.length === 0 ? (
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardContent className="p-8 text-center">
                <Gift className="w-16 h-16 text-purple-accent mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-dark-text mb-2">Keine aktiven Giveaways</h3>
                <p className="text-dark-muted">Erstelle dein erstes Giveaway im "Erstellen" Tab!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeGiveaways.map(giveaway => (
                <Card key={giveaway.id} className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{getGiveawayTypeIcon(giveaway.type)}</span>
                          <h3 className="text-lg font-bold text-dark-text">{giveaway.title}</h3>
                          <Badge className="ml-2">Aktiv</Badge>
                        </div>
                        <p className="text-dark-muted mb-3">{giveaway.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-dark-muted">Preis:</span>
                            <p className="font-medium text-dark-text">{giveaway.prize}</p>
                          </div>
                          <div>
                            <span className="text-dark-muted">Teilnehmer:</span>
                            <p className="font-medium text-neon-purple cursor-pointer hover:text-purple-300 transition-colors" 
                               onClick={() => showParticipants(giveaway)}
                               title="Klicken zum Anzeigen der Teilnehmer">
                              {giveaway.participants.length} 👥
                            </p>
                          </div>
                          <div>
                            <span className="text-dark-muted">Gewinner:</span>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-green-400 cursor-pointer hover:text-green-300 transition-colors" 
                                 onClick={() => showWinners(giveaway)}
                                 title="Klicken zum Anzeigen der Gewinner">
                                {giveaway.winners} 🏆
                              </p>
                            </div>
                          </div>
                          <div>
                            <span className="text-dark-muted">Channel:</span>
                            <p className="font-medium text-dark-text">#{giveaway.channelName}</p>
                          </div>
                        </div>
                        
                        {/* Zeit bis Ende */}
                        <div className="mt-3 text-sm">
                          <span className="text-dark-muted">Zeit verbleibend:</span>
                          <LiveTimer endTime={giveaway.endTime} />
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          onClick={() => openEndConfirm(giveaway.id, giveaway.title)}
                          disabled={saving}
                          className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 text-xs"
                        >
                          <StopCircle className="w-3 h-3" />
                          Beenden
                        </Button>
                        <Button
                          onClick={() => openDeleteConfirm(giveaway.id, giveaway.title)}
                          disabled={saving}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          Löschen
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6" activeTab={activeTab}>
          {giveawayHistory.length === 0 ? (
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardContent className="p-8 text-center">
                <Clock className="w-16 h-16 text-purple-accent mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-dark-text mb-2">Keine Historie verfügbar</h3>
                <p className="text-dark-muted">Hier erscheinen beendete Giveaways</p>
              </CardContent>
            </Card>
          ) : (
            <>
            <div className="space-y-4">
                {giveawayHistory
                  .slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage)
                  .map(giveaway => (
                <Card key={giveaway.id} className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
                  <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                      <span className="text-xl">{getGiveawayTypeIcon(giveaway.type)}</span>
                      <h3 className="text-lg font-bold text-dark-text">{giveaway.title}</h3>
                      <Badge variant="outline">Beendet</Badge>
                    </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              onClick={() => showWinners(giveaway)}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm"
                            >
                              <Crown className="w-4 h-4" />
                              Gewinner
                            </Button>
                            <Button
                              onClick={() => openDeleteHistoryConfirm(giveaway.id, giveaway.title)}
                              disabled={saving}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              Löschen
                            </Button>
                          </div>
                        </div>
                        
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-dark-muted">Preis:</span>
                        <p className="font-medium text-dark-text">{giveaway.prize}</p>
                      </div>
                      <div>
                        <span className="text-dark-muted">Teilnehmer:</span>
                        <p className="font-medium text-neon-purple cursor-pointer hover:text-purple-300 transition-colors" 
                           onClick={() => showParticipants(giveaway)}
                           title="Klicken zum Anzeigen der Teilnehmer">
                          {giveaway.participants.length} 👥
                        </p>
                      </div>
                      <div>
                        <span className="text-dark-muted">Gewinner:</span>
                            <p className="font-medium text-green-400 cursor-pointer hover:text-green-300 transition-colors" 
                               onClick={() => showWinners(giveaway)}
                               title="Klicken zum Anzeigen der Gewinner">
                              {giveaway.winners} 🏆
                            </p>
                      </div>
                      <div>
                        <span className="text-dark-muted">Erstellt:</span>
                        <p className="font-medium text-dark-text">{new Date(giveaway.createdAt).toLocaleDateString('de-DE')}</p>
                      </div>
                      <div>
                        <span className="text-dark-muted">Channel:</span>
                        <p className="font-medium text-dark-text">#{giveaway.channelName}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>

              {/* Pagination */}
              {giveawayHistory.length > historyPerPage && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <Button
                    onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                    disabled={historyPage === 1}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Vorherige
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-dark-muted">Seite</span>
                    <span className="font-bold text-purple-400">{historyPage}</span>
                    <span className="text-dark-muted">von</span>
                    <span className="font-bold text-purple-400">{Math.ceil(giveawayHistory.length / historyPerPage)}</span>
                  </div>
                  
                  <Button
                    onClick={() => setHistoryPage(prev => Math.min(Math.ceil(giveawayHistory.length / historyPerPage), prev + 1))}
                    disabled={historyPage >= Math.ceil(giveawayHistory.length / historyPerPage)}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Nächste →
                  </Button>
            </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Admin-Tracking Tab */}
        <TabsContent value="admin" className="space-y-6" activeTab={activeTab}>
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-neon flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-accent" />
                Admin Invite-Tracking
              </CardTitle>
              <p className="text-dark-muted">
                Detaillierte Einblicke in alle Invite-Giveaways und wer wen eingeladen hat
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Giveaway-Auswahl */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <label className="text-sm font-medium text-dark-text">Invite-Giveaway auswählen:</label>
                  </div>
                  <select
                    value={selectedGiveawayForTracking}
                    onChange={(e) => {
                      setSelectedGiveawayForTracking(e.target.value);
                      if (e.target.value) {
                        loadAdminTracking(e.target.value);
                      }
                    }}
                    className="w-full p-3 bg-dark-bg/70 border border-purple-primary/30 rounded-lg text-dark-text focus:border-neon-purple focus:outline-none"
                  >
                    <option value="">Giveaway auswählen...</option>
                    {[...activeGiveaways, ...giveawayHistory]
                      .filter(g => g.type === 'invite')
                      .reduce((unique, giveaway) => {
                        // Entferne Duplikate basierend auf ID
                        if (!unique.find(g => g.id === giveaway.id)) {
                          unique.push(giveaway);
                        }
                        return unique;
                      }, [] as GiveawayData[])
                      .map(giveaway => (
                        <option key={`${giveaway.id}-${giveaway.status}`} value={giveaway.id}>
                          {giveaway.title} ({giveaway.status === 'active' ? '🟢 Aktiv' : '🔴 Beendet'})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Tracking-Daten anzeigen */}
                {selectedGiveawayForTracking && adminTracking[selectedGiveawayForTracking] && (
                  <div className="space-y-6">
                    {(() => {
                      const data = adminTracking[selectedGiveawayForTracking];
                      return (
                        <>
                          {/* Giveaway-Übersicht */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-4 rounded-lg border border-purple-primary/30">
                              <div className="text-2xl font-bold text-neon-purple">{data.participants}</div>
                              <div className="text-sm text-dark-muted">Teilnehmer</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 p-4 rounded-lg border border-green-500/30">
                              <div className="text-2xl font-bold text-green-400">{data.totalInvitedUsers}</div>
                              <div className="text-sm text-dark-muted">Eingeladene User</div>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4 rounded-lg border border-yellow-500/30">
                              <div className="text-2xl font-bold text-yellow-400">{data.totalActiveCodes}</div>
                              <div className="text-sm text-dark-muted">Aktive Invite-Links</div>
                            </div>
                            <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 p-4 rounded-lg border border-red-500/30">
                              <div className="text-2xl font-bold text-red-400">{data.inviteRequirement}</div>
                              <div className="text-sm text-dark-muted">Mindest-Einladungen</div>
                            </div>
                          </div>

                          {/* Leaderboard-Channel Buttons */}
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-primary/30 rounded-lg">
                            <div>
                              <h4 className="font-bold text-purple-300">🏆 Leaderboard-Channel</h4>
                              <p className="text-sm text-dark-muted">
                                Erstelle oder aktualisiere einen dedizierten Channel mit Live-Leaderboard
                                {(() => {
                                  const giveaway = activeGiveaways.find(g => g.id === selectedGiveawayForTracking);
                                  return giveaway?.leaderboardChannelId ? (
                                    <span className="block text-green-400 text-xs mt-1">
                                      ✅ Channel bereits erstellt
                                    </span>
                                  ) : null;
                                })()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => createLeaderboardChannel(selectedGiveawayForTracking)}
                                className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105"
                              >
                                🏆 Channel erstellen
                              </Button>
                              {(() => {
                                const giveaway = activeGiveaways.find(g => g.id === selectedGiveawayForTracking);
                                return giveaway?.leaderboardChannelId ? (
                                  <Button
                                    onClick={() => deleteLeaderboardChannel(selectedGiveawayForTracking)}
                                    disabled={saving}
                                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {saving ? '⏳' : '🗑️'} Löschen
                                  </Button>
                                ) : null;
                              })()}
                            </div>
                          </div>



                          {/* Detailliertes Leaderboard */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-bold text-purple-300 flex items-center gap-2">
                              📊 Detailliertes Invite-Leaderboard
                            </h3>
                            
                            {data.leaderboard.length > 0 ? (
                              <div className="space-y-3">
                                {data.leaderboard.map((entry, index) => (
                                  <div key={entry.userId} className="bg-dark-bg/50 p-4 rounded-lg border border-purple-primary/20">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="text-2xl">
                                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                        </div>
                                        <div>
                                          <div className="font-bold text-dark-text">
                                            {entry.username}
                                            {entry.inviteCount >= data.inviteRequirement ? (
                                              <span className="ml-2 text-green-400">✅ Qualifiziert</span>
                                            ) : (
                                              <span className="ml-2 text-red-400">❌ Nicht qualifiziert</span>
                                            )}
                                          </div>
                                          <div className="text-sm text-dark-muted">User ID: {entry.userId}</div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-lg font-bold text-neon-purple">{entry.inviteCount} Einladungen</div>
                                        <div className="text-sm text-dark-muted">Global: {entry.totalGlobalInvites}</div>
                                      </div>
                                    </div>

                                    {/* Eingeladene User */}
                                    {entry.invitedUsersWithDetails && entry.invitedUsersWithDetails.length > 0 && (
                                      <div className="mb-3">
                                        <div className="text-sm font-medium text-purple-300 mb-2">
                                          👥 Eingeladene User ({entry.invitedUsersWithDetails.length}):
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {entry.invitedUsersWithDetails.slice(0, 10).map(user => (
                                            <span 
                                              key={user.id} 
                                              className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30"
                                              title={`User ID: ${user.id}`}
                                            >
                                              {user.username} ({user.id})
                                            </span>
                                          ))}
                                          {entry.invitedUsersWithDetails.length > 10 && (
                                            <span className="px-2 py-1 bg-dark-surface text-dark-muted text-xs rounded">
                                              +{entry.invitedUsersWithDetails.length - 10} weitere
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Aktive Invite-Links */}
                                    {entry.activeCodes.length > 0 && (
                                      <div>
                                        <div className="text-sm font-medium text-blue-300 mb-2">
                                          🔗 Aktive Invite-Links ({entry.activeCodes.length}):
                                        </div>
                                        <div className="space-y-1">
                                          {entry.activeCodes.map(code => (
                                            <div key={code.code} className="flex items-center justify-between bg-dark-surface/50 p-2 rounded border border-blue-500/20">
                                              <code className="text-blue-300 text-sm">{code.url}</code>
                                              <span className="text-sm text-dark-muted">{code.uses} Uses</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-dark-muted">
                                Noch keine Invite-Daten für dieses Giveaway vorhanden.
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Gewinner Modal */}
      {winnerModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl p-6 max-w-2xl mx-4 shadow-purple-glow transform transition-all duration-300 scale-100 max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-dark-text mb-2">
                🏆 Giveaway Gewinner
              </h3>
              
              <div className="bg-dark-bg/50 rounded-lg p-3 mb-4">
                <h4 className="font-bold text-purple-400 text-lg">{winnerModal.giveaway?.title}</h4>
                <p className="text-dark-muted text-sm">Preis: {winnerModal.giveaway?.prize}</p>
                <p className="text-dark-muted text-xs">
                  Beendet am {winnerModal.giveaway?.endTime ? new Date(winnerModal.giveaway.endTime).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Unbekannt'}
                </p>
              </div>
            </div>
            
            {/* Gewinner Liste */}
            {winnerModal.winners.length > 0 ? (
              <div className="space-y-3 mb-6">
                <h5 className="text-lg font-bold text-green-400 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  {winnerModal.winners.length} {winnerModal.winners.length === 1 ? 'Gewinner' : 'Gewinner'}
                </h5>
                
                <div className="grid gap-3">
                  {winnerModal.winners.map((winner, index) => (
                    <div 
                      key={winner.id || index}
                      className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1)}
                        </div>
                        
                        <div>
                          <div className="font-bold text-dark-text flex items-center gap-2">
                            <span>{winner.username || `Benutzer ${winner.id}`}</span>
                            {winner.discriminator && (
                              <span className="text-dark-muted text-sm">#{winner.discriminator}</span>
                            )}
                          </div>
                          <div className="text-xs text-dark-muted">
                            ID: {winner.id}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                                                      onClick={() => openMessageModal(winner.id, winner.username || 'Benutzer')}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 text-xs"
                      >
                        <Send className="w-3 h-3" />
                        Nachricht
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">😔</div>
                <p className="text-dark-muted">Keine Gewinner gefunden oder Giveaway wurde ohne gültige Teilnehmer beendet.</p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setWinnerModal({ show: false, giveaway: null, winners: [] })}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Schließen
              </Button>
              
              {winnerModal.winners.length > 0 && (
                <Button
                  onClick={() => {
                    const allMessages = winnerModal.winners.map((winner, index) => 
                      `${index + 1}. @${winner.username || `User-${winner.id}`} (${winner.id})`
                    ).join('\n');
                    
                    const message = `🏆 Gewinner des Giveaways "${winnerModal.giveaway?.title}":\n\n${allMessages}\n\nPreis: ${winnerModal.giveaway?.prize}`;
                    
                    navigator.clipboard.writeText(message).then(() => {
                      success('📋 Gewinnerliste wurde in die Zwischenablage kopiert!');
                    }).catch(() => {
                      showError('❌ Fehler beim Kopieren in die Zwischenablage');
                    });
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Liste kopieren
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bestätigungs Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl p-6 max-w-md mx-4 shadow-purple-glow transform transition-all duration-300 scale-100">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                confirmModal.type === 'delete' || confirmModal.type === 'deleteHistory'
                  ? 'bg-gradient-to-br from-red-400 to-red-600' 
                  : 'bg-gradient-to-br from-yellow-400 to-orange-500'
              }`}>
                {confirmModal.type === 'delete' || confirmModal.type === 'deleteHistory' ? (
                  <Trash2 className="w-8 h-8 text-white" />
                ) : (
                  <StopCircle className="w-8 h-8 text-white" />
                )}
              </div>
              
              <h3 className="text-xl font-bold text-dark-text mb-2">
                {confirmModal.type === 'delete' || confirmModal.type === 'deleteHistory' ? '🗑️' : '⏹️'} {confirmModal.title}
              </h3>
              
              <p className="text-dark-muted text-sm">
                {confirmModal.message}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setConfirmModal({ show: false, type: '', title: '', message: '', giveawayId: '', giveawayTitle: '' })}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Abbrechen
              </Button>
              
              <Button
                onClick={
                  confirmModal.type === 'delete' ? deleteGiveaway :
                  confirmModal.type === 'deleteHistory' ? deleteFromHistory :
                  endGiveaway
                }
                disabled={saving}
                className={`${
                  confirmModal.type === 'delete' || confirmModal.type === 'deleteHistory'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                } text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {confirmModal.type === 'delete' || confirmModal.type === 'deleteHistory' ? (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {saving ? 'Lösche...' : 'Löschen'}
                  </>
                ) : (
                  <>
                    <StopCircle className="w-4 h-4" />
                    {saving ? 'Beende...' : 'Beenden'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Nachrichten Modal */}
      {messageModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl p-6 max-w-md mx-4 shadow-purple-glow transform transition-all duration-300 scale-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                <Send className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-dark-text mb-2">
                📨 Nachricht senden
              </h3>
              
              <p className="text-dark-muted text-sm">
                An: <span className="text-purple-400 font-medium">@{messageModal.username}</span>
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Nachricht
                </label>
                <textarea
                  value={messageModal.message}
                  onChange={(e) => setMessageModal(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full p-3 bg-dark-bg border border-purple-primary/30 rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-purple-primary transition-all duration-200 min-h-[100px] resize-none"
                  placeholder="Deine Nachricht hier..."
                  maxLength={2000}
                />
                <div className="text-xs text-dark-muted mt-1">
                  {messageModal.message.length}/2000 Zeichen
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 justify-center mt-6">
              <Button
                onClick={() => setMessageModal({ show: false, userId: '', username: '', message: '' })}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Abbrechen
              </Button>
              
              <Button
                onClick={sendMessage}
                disabled={!messageModal.message.trim()}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Senden
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Teilnehmer Modal */}
      {participantsModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl p-6 max-w-2xl mx-4 shadow-purple-glow transform transition-all duration-300 scale-100 max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-dark-text mb-2">
                🏆 Giveaway Teilnehmer
              </h3>
              
              <div className="bg-dark-bg/50 rounded-lg p-3 mb-4">
                <h4 className="font-bold text-purple-400 text-lg">{participantsModal.giveaway?.title}</h4>
                <p className="text-dark-muted text-sm">Preis: {participantsModal.giveaway?.prize}</p>
                <p className="text-dark-muted text-xs">
                  Beendet am {participantsModal.giveaway?.endTime ? new Date(participantsModal.giveaway.endTime).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Unbekannt'}
                </p>
              </div>
            </div>
            
            {/* Teilnehmer Liste */}
            {participantsModal.participants.length > 0 ? (
              <div className="space-y-3 mb-6">
                <h5 className="text-lg font-bold text-green-400 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  {participantsModal.participants.length} {participantsModal.participants.length === 1 ? 'Teilnehmer' : 'Teilnehmer'}
                </h5>
                
                <div className="grid gap-3">
                  {participantsModal.participants.map((participant, index) => (
                    <div 
                      key={participant.id || index}
                      className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1)}
                        </div>
                        
                        <div>
                          <div className="font-bold text-dark-text flex items-center gap-2">
                            <span>{participant.username || `Benutzer ${participant.id}`}</span>
                            {participant.discriminator && (
                              <span className="text-dark-muted text-sm">#{participant.discriminator}</span>
                            )}
                          </div>
                          <div className="text-xs text-dark-muted">
                            ID: {participant.id}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                                                      onClick={() => openMessageModal(participant.id, participant.username || 'Benutzer')}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 text-xs"
                      >
                        <Send className="w-3 h-3" />
                        Nachricht
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">😔</div>
                <p className="text-dark-muted">Keine Teilnehmer gefunden oder Giveaway wurde ohne gültige Teilnehmer beendet.</p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setParticipantsModal({ show: false, giveaway: null, participants: [] })}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Schließen
              </Button>
              
              {participantsModal.participants.length > 0 && (
                <Button
                  onClick={() => {
                    const allMessages = participantsModal.participants.map((participant, index) => 
                      `${index + 1}. @${participant.username || `User-${participant.id}`} (${participant.id})`
                    ).join('\n');
                    
                    const message = `🏆 Teilnehmer des Giveaways "${participantsModal.giveaway?.title}":\n\n${allMessages}\n\nPreis: ${participantsModal.giveaway?.prize}`;
                    
                    navigator.clipboard.writeText(message).then(() => {
                      success('📋 Teilnehmerliste wurde in die Zwischenablage kopiert!');
                    }).catch(() => {
                      showError('❌ Fehler beim Kopieren in die Zwischenablage');
                    });
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Liste kopieren
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Giveaway; 