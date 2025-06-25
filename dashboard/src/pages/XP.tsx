import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

import { AlertCircle, Trophy, Users, MessageSquare, Mic, Star, Settings, Plus, Trash2, Save, RotateCcw, Send, Clock, Zap, Crown, RefreshCw } from 'lucide-react';
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

interface XPSettings {
  enabled: boolean;
  messageXP: {
    min: number;
    max: number;
    cooldown: number;
  };
  voiceXP: {
    baseXP: number;
    afkChannelXP: number;
    soloChannelXP: number;
    cooldown: number;
    intervalMinutes: number;
  };
  levelSystem: {
    baseXP: number;
    multiplier: number;
    maxLevel: number;
  };
  channels: {
    levelUpChannel: string;
    leaderboardChannel: string;
    xpBlacklist: string[];
    voiceBlacklist: string[];
  };
  autoLeaderboard: {
    enabled: boolean;
    time: string;
    timezone: string;
    channelName: string;
    types: string[];
    limit: number;
    lastPosted: number;
    autoDeleteOld: boolean;
  };
  rewards: {
    levelRoles: Array<{
      level: number;
      roleId: string;
      roleName: string;
    }>;
    milestoneRewards: Array<{
      xp: number;
      reward: string;
    }>;
  };
  announcements: {
    levelUp: boolean;
    milestones: boolean;
    newRecord: boolean;
  };
  display: {
    showRank: boolean;
    showProgress: boolean;
    embedColor: string;
    leaderboardSize: number;
  };
  levelUpEmbed: {
    enabled: boolean;
    title: string;
    color: string;
    animation: {
      enabled: boolean;
      style: string;
      duration: number;
    };
    fields: {
      showStats: boolean;
      showNextLevel: boolean;
      showRank: boolean;
      customMessage: string;
    };
    footer: {
      enabled: boolean;
      text: string;
    };
  };
}

interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string;
  level: number;
  totalXP: number;
  messageCount: number;
  voiceTime: number;
  xp: number;
}

interface XPStats {
  totalUsers: number;
  totalXP: number;
  totalMessages: number;
  totalVoiceTime: number;
  averageLevel: number;
  maxLevel: number;
  activeUsers: number;
  topUsers: LeaderboardUser[];
  isEnabled: boolean;
}

interface Role {
  id: string;
  name: string;
  color: string;
  guildId: string;
  guildName: string;
}

interface Channel {
  id: string;
  name: string;
  guildId: string;
  guildName: string;
}

const XP: React.FC = () => {
  const { toasts, success, error, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('settings');

  const [settings, setSettings] = useState<XPSettings>({
    enabled: true,
    messageXP: { min: 5, max: 15, cooldown: 60000 },
    voiceXP: { baseXP: 2, afkChannelXP: 0, soloChannelXP: 1, cooldown: 60000, intervalMinutes: 1 },
    levelSystem: { baseXP: 100, multiplier: 1.5, maxLevel: 100 },
    channels: { levelUpChannel: 'level-up', leaderboardChannel: 'leaderboard', xpBlacklist: [], voiceBlacklist: [] },
    autoLeaderboard: { enabled: true, time: '20:00', timezone: 'Europe/Berlin', channelName: 'leaderboard', types: ['total'], limit: 10, lastPosted: 0, lastMessageIds: [], autoDeleteOld: true },
    rewards: { levelRoles: [], milestoneRewards: [] },
    announcements: { levelUp: true, milestones: true, newRecord: true },
    display: { showRank: true, showProgress: true, embedColor: '0x00FF7F', leaderboardSize: 10 },
    levelUpEmbed: {
      enabled: true,
      title: '🎉 Level Up!',
      color: '0x00FF7F',
      animation: {
        enabled: true,
        style: 'celebration',
        duration: 5000
      },
      fields: {
        showStats: true,
        showNextLevel: true,
        showRank: true,
        customMessage: ''
      },
      footer: {
        enabled: true,
        text: '🎉 Herzlichen Glückwunsch!'
      }
    }
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [stats, setStats] = useState<XPStats | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<{ text: Channel[], voice: Channel[] }>({ text: [], voice: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states for adding rewards
  const [newLevelRole, setNewLevelRole] = useState({ level: 1, roleId: '', roleName: '' });
  const [newMilestone, setNewMilestone] = useState({ xp: 1000, reward: '' });
  const [leaderboardType, setLeaderboardType] = useState<'total' | 'level' | 'messages' | 'voice'>('total');
  const [postChannelName, setPostChannelName] = useState('');

  // User management states
  const [userManagement, setUserManagement] = useState({
    userId: '',
    xpAmount: 0,
    addUserId: '',
    addXpAmount: 0,
    resetUserId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [settingsRes, leaderboardRes, statsRes, rolesRes, channelsRes] = await Promise.all([
        fetch('/api/xp/settings'),
        fetch('/api/xp/leaderboard?limit=50'),
        fetch('/api/xp/stats'),
        fetch('/api/xp/roles'),
        fetch('/api/xp/channels')
      ]);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }

      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        setLeaderboard(leaderboardData.leaderboard);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.roles);
      }

      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();
        setChannels(channelsData);
      }

    } catch (error) {
      console.error('Fehler beim Laden der XP-Daten:', error);
      showMessage('error', 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/xp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        showMessage('success', '✅ XP-Einstellungen gespeichert!');
        loadData(); // Reload to get updated stats
      } else {
        showMessage('error', '❌ Fehler beim Speichern der Einstellungen');
      }
    } catch (err) {
      showMessage('error', '❌ Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  const toggleXPSystem = async () => {
    try {
      const response = await fetch('/api/xp/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, enabled: data.enabled }));
        showMessage('success', `✅ ${data.message}`);
      } else {
        showMessage('error', '❌ Fehler beim Umschalten des XP-Systems');
      }
    } catch (err) {
      showMessage('error', '❌ Fehler beim Umschalten des XP-Systems');
    }
  };

  const addLevelRole = () => {
    if (newLevelRole.level > 0 && newLevelRole.roleName) {
      setSettings(prev => ({
        ...prev,
        rewards: {
          ...prev.rewards,
          levelRoles: [...prev.rewards.levelRoles, { ...newLevelRole }]
        }
      }));
      setNewLevelRole({ level: 1, roleId: '', roleName: '' });
    }
  };

  const removeLevelRole = (index: number) => {
    setSettings(prev => ({
      ...prev,
      rewards: {
        ...prev.rewards,
        levelRoles: prev.rewards.levelRoles.filter((_, i) => i !== index)
      }
    }));
  };

  const addMilestone = () => {
    if (newMilestone.xp > 0 && newMilestone.reward) {
      setSettings(prev => ({
        ...prev,
        rewards: {
          ...prev.rewards,
          milestoneRewards: [...prev.rewards.milestoneRewards, { ...newMilestone }]
        }
      }));
      setNewMilestone({ xp: 1000, reward: '' });
    }
  };

  const removeMilestone = (index: number) => {
    setSettings(prev => ({
      ...prev,
      rewards: {
        ...prev.rewards,
        milestoneRewards: prev.rewards.milestoneRewards.filter((_, i) => i !== index)
      }
    }));
  };

  const postLeaderboard = async () => {
    if (!postChannelName) {
      showMessage('error', 'Bitte wähle einen Channel aus');
      return;
    }

    try {
      const response = await fetch('/api/xp/post-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: postChannelName,
          type: leaderboardType,
          limit: 10
        })
      });

      if (response.ok) {
        showMessage('success', `Leaderboard erfolgreich in #${postChannelName} gepostet!`);
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Fehler beim Posten des Leaderboards');
      }
    } catch (error) {
      showMessage('error', 'Fehler beim Posten des Leaderboards');
    }
  };

  // Auto-Leaderboard testen
  const testAutoLeaderboard = async () => {
    if (!settings.autoLeaderboard.channelName || settings.autoLeaderboard.types.length === 0) {
      showMessage('error', 'Bitte Channel-Name und mindestens einen Leaderboard-Typ auswählen');
      return;
    }

    try {
      const response = await fetch('/api/xp/test-auto-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: settings.autoLeaderboard.channelName,
          types: settings.autoLeaderboard.types,
          limit: settings.autoLeaderboard.limit
        })
      });

      if (response.ok) {
        const result = await response.json();
        showMessage('success', `✅ Test-Leaderboard(s) erfolgreich in #${settings.autoLeaderboard.channelName} gepostet! (${result.count} ${result.count === 1 ? 'Embed' : 'Embeds'})`);
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Fehler beim Posten des Test-Leaderboards');
      }
    } catch (error) {
      showMessage('error', 'Fehler beim Posten des Test-Leaderboards');
    }
  };

  // Level-Up-Embed testen
  const testLevelUp = async () => {
    if (!settings.channels.levelUpChannel) {
      showMessage('error', 'Bitte Level-Up-Channel konfigurieren');
      return;
    }

    try {
      const response = await fetch('/api/xp/test-levelup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: settings.channels.levelUpChannel
        })
      });

      if (response.ok) {
        const result = await response.json();
        showMessage('success', `🎉 Test Level-Up erfolgreich in #${settings.channels.levelUpChannel} gepostet! (${result.user}: Level ${result.oldLevel} → ${result.newLevel})`);
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Fehler beim Posten des Test Level-Ups');
      }
    } catch (error) {
      showMessage('error', 'Fehler beim Posten des Test Level-Ups');
    }
  };

  // Meilenstein-Ankündigung testen
  const testMilestone = async () => {
    if (!settings.channels.levelUpChannel) {
      showMessage('error', 'Bitte Level-Up-Channel konfigurieren');
      return;
    }

    try {
      // Verwende ersten Meilenstein oder Standard-Wert
      const milestoneXP = settings.rewards.milestoneRewards[0]?.xp || 5000;

      const response = await fetch('/api/xp/test-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: settings.channels.levelUpChannel,
          milestoneXP: milestoneXP
        })
      });

      if (response.ok) {
        const result = await response.json();
        showMessage('success', `🎯 Test Meilenstein erfolgreich in #${settings.channels.levelUpChannel} gepostet! (${result.milestone.toLocaleString()} XP)`);
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Fehler beim Posten des Test Meilensteins');
      }
    } catch (error) {
      showMessage('error', 'Fehler beim Posten des Test Meilensteins');
    }
  };

  // Neuer Rekord testen
  const testRecord = async (recordType: 'level' | 'xp' | 'messages' | 'voice') => {
    if (!settings.channels.levelUpChannel) {
      showMessage('error', 'Bitte Level-Up-Channel konfigurieren');
      return;
    }

    try {
      const response = await fetch('/api/xp/test-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: settings.channels.levelUpChannel,
          recordType: recordType
        })
      });

      if (response.ok) {
        const result = await response.json();
        const recordTypeNames = {
          level: 'Level',
          xp: 'XP',
          messages: 'Nachrichten',
          voice: 'Voice-Zeit'
        };
        showMessage('success', `🏆 Test ${recordTypeNames[recordType]} Rekord erfolgreich in #${settings.channels.levelUpChannel} gepostet! (${result.recordValue})`);
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Fehler beim Posten des Test Rekords');
      }
    } catch (error) {
      showMessage('error', 'Fehler beim Posten des Test Rekords');
    }
  };

  // Meilenstein-Rollen erstellen
  const createMilestoneRoles = async () => {
    if (loading) return;
    
    try {
      // Nimm die erste verfügbare Guild-ID (normalerweise vom ersten Text-Kanal)
      const guildId = channels.text.length > 0 ? channels.text[0].guildId : null;
      
      if (!guildId) {
        showMessage('error', 'Keine Guild gefunden. Bot muss mit einem Discord-Server verbunden sein.');
        return;
      }

      const response = await fetch('/api/xp/create-milestone-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId })
      });
      
      if (response.ok) {
        const data = await response.json();
        showMessage('success', 
          `🎯 Meilenstein-Rollen Setup abgeschlossen! ` +
          `${data.created.length} neue Rollen erstellt, ${data.existing.length} bereits vorhanden.`
        );
        console.log('Erstellte Rollen:', data.created);
        console.log('Bereits vorhandene Rollen:', data.existing);
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Fehler beim Erstellen der Meilenstein-Rollen');
      }
    } catch (error) {
      showMessage('error', 'Verbindungsfehler beim Erstellen der Meilenstein-Rollen');
    }
  };

  // Level-Rollen erstellen
  const createLevelRoles = async () => {
    if (loading) return;
    
    try {
      // Nimm die erste verfügbare Guild-ID (normalerweise vom ersten Text-Kanal)
      const guildId = channels.text.length > 0 ? channels.text[0].guildId : null;
      
      if (!guildId) {
        showMessage('error', 'Keine Guild gefunden. Bot muss mit einem Discord-Server verbunden sein.');
        return;
      }

      const response = await fetch('/api/xp/create-level-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId })
      });
      
      if (response.ok) {
        const data = await response.json();
        showMessage('success', 
          `📈 Level-Rollen Setup abgeschlossen! ` +
          `${data.created.length} neue Rollen erstellt, ${data.existing.length} bereits vorhanden.`
        );
        console.log('Erstellte Level-Rollen:', data.created);
        console.log('Bereits vorhandene Level-Rollen:', data.existing);
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Fehler beim Erstellen der Level-Rollen');
      }
    } catch (error) {
      showMessage('error', 'Verbindungsfehler beim Erstellen der Level-Rollen');
    }
  };

  // Alle User-Rollen aktualisieren
  const updateAllRoles = async () => {
    if (loading) return;
    
    try {
      // Nimm die erste verfügbare Guild-ID (normalerweise vom ersten Text-Kanal)
      const guildId = channels.text.length > 0 ? channels.text[0].guildId : null;
      
      if (!guildId) {
        showMessage('error', 'Keine Guild gefunden. Bot muss mit einem Discord-Server verbunden sein.');
        return;
      }

      const response = await fetch('/api/xp/update-all-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId })
      });
      
      if (response.ok) {
        const data = await response.json();
        showMessage('success', 
          `🔄 Alle Rollen aktualisiert! ` +
          `${data.updatedUsers} User aktualisiert, ${data.errors} Fehler.`
        );
        console.log('Rollen-Update Ergebnis:', data);
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Fehler beim Aktualisieren der Rollen');
      }
    } catch (error) {
      showMessage('error', 'Verbindungsfehler beim Aktualisieren der Rollen');
    }
  };



  const resetAllXP = async () => {
    if (!confirm('Möchtest du wirklich ALLE XP-Daten zurücksetzen? Dies kann nicht rückgängig gemacht werden!')) {
      return;
    }

    try {
      const response = await fetch('/api/xp/reset-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmReset: true })
      });

      if (response.ok) {
        showMessage('success', 'Alle XP-Daten wurden zurückgesetzt!');
        loadData();
      } else {
        showMessage('error', 'Fehler beim Zurücksetzen der XP-Daten');
      }
    } catch (error) {
      showMessage('error', 'Fehler beim Zurücksetzen der XP-Daten');
    }
  };

  // User XP setzen
  const setUserXP = async () => {
    if (!userManagement.userId) return;

    try {
      const response = await fetch(`/api/xp/user/${userManagement.userId}/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xp: userManagement.xpAmount
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.levelUp) {
          showMessage('success', `🎉 XP gesetzt und Level Up! ${userManagement.userId} ist jetzt Level ${result.levelUp.newLevel}!`);
        } else {
          showMessage('success', `XP für User ${userManagement.userId} auf ${userManagement.xpAmount} gesetzt!`);
        }
        setUserManagement(prev => ({ ...prev, userId: '', xpAmount: 0 }));
        loadData();
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Fehler beim Setzen der User-XP');
      }
    } catch (error) {
      showMessage('error', 'Fehler beim Setzen der User-XP');
    }
  };

  // User XP hinzufügen
  const addUserXP = async () => {
    if (!userManagement.addUserId) return;

    try {
      const response = await fetch(`/api/xp/user/${userManagement.addUserId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xp: userManagement.addXpAmount
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.levelUp) {
          showMessage('success', `🎉 ${userManagement.addXpAmount} XP hinzugefügt und Level Up! User ist jetzt Level ${result.levelUp.newLevel}!`);
        } else {
          showMessage('success', `${userManagement.addXpAmount} XP zu User ${userManagement.addUserId} hinzugefügt!`);
        }
        setUserManagement(prev => ({ ...prev, addUserId: '', addXpAmount: 0 }));
        loadData();
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Fehler beim Hinzufügen der User-XP');
      }
    } catch (error) {
      showMessage('error', 'Fehler beim Hinzufügen der User-XP');
    }
  };

  // User zurücksetzen mit verbesserter Logik
  const resetUser = async () => {
    if (!userManagement.resetUserId) return;
    
    const confirmed = confirm(
      `🗑️ User Reset: Möchtest du wirklich alle XP-Daten für User ${userManagement.resetUserId} löschen?\n\n` +
      'Dies entfernt:\n' +
      '• Alle XP-Punkte und Level\n' +
      '• Discord-Rollen (Level & Meilenstein)\n' +
      '• Statistiken (Nachrichten, Voice-Zeit)\n\n' +
      'Diese Aktion kann NICHT rückgängig gemacht werden!'
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/xp/user/${userManagement.resetUserId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 
          `✅ User ${userManagement.resetUserId} wurde erfolgreich zurückgesetzt! ` +
          `${data.rolesRemoved} Discord-Rollen entfernt.`
        );
        setUserManagement(prev => ({ ...prev, resetUserId: '' }));
        
        // Debug-Status prüfen nach Reset
        setTimeout(async () => {
          try {
            const debugResponse = await fetch('/api/xp/debug-status');
            const debugData = await debugResponse.json();
            console.log('🔍 Nach User-Reset Debug Status:', debugData);
            
            if (debugData.discrepancies.hasDiscrepancies) {
              showMessage('error', 
                `⚠️ Warnung: Nach User-Reset wurden Diskrepanzen erkannt! ` +
                `Bitte Emergency Reset verwenden falls das Problem bestehen bleibt.`
              );
            }
          } catch (debugError) {
            console.error('Debug-Status nach User-Reset fehlgeschlagen:', debugError);
          }
        }, 2000);
        
        loadData();
      } else {
        showMessage('error', data.error || 'Fehler beim Zurücksetzen des Users');
      }
    } catch (error) {
      showMessage('error', 'Fehler beim Zurücksetzen des Users');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      success(text);
    } else {
      error(text);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}min ${seconds}s`;
  };

  const getLeaderboardIcon = (type: string) => {
    switch (type) {
      case 'total': return <Star className="h-4 w-4" />;
      case 'level': return <Trophy className="h-4 w-4" />;
      case 'messages': return <MessageSquare className="h-4 w-4" />;
      case 'voice': return <Mic className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade XP-System...</div>
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
          <Star className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            XP System Management
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Verwalte das Experience & Leveling System deines Servers wie ein Boss! 
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
          onClick={toggleXPSystem}
          className={`${settings.enabled ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent'} text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2`}
        >
          {settings.enabled ? <RotateCcw className="h-5 w-5" /> : <Star className="h-5 w-5" />}
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
              <CardTitle className="text-sm font-medium text-dark-text">Aktive User</CardTitle>
              <Users className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{stats.totalUsers}</div>
              <p className="text-xs text-dark-muted">
                {stats.activeUsers} aktiv (&gt;100 XP)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Gesamt XP</CardTitle>
              <Star className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{stats.totalXP.toLocaleString()}</div>
              <p className="text-xs text-dark-muted">
                Ø {Math.round(stats.averageLevel)} Level
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Nachrichten</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{stats.totalMessages.toLocaleString()}</div>
              <p className="text-xs text-dark-muted">
                Nachrichten insgesamt
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark-text">Voice Zeit</CardTitle>
              <Mic className="h-4 w-4 text-purple-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-purple">{Math.round(stats.totalVoiceTime)} min</div>
              <p className="text-xs text-dark-muted">
                Max Level: {stats.maxLevel}
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
            value="levelup" 
            className={`flex items-center space-x-2 ${activeTab === 'levelup' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('levelup')}
          >
            <Zap className="h-4 w-4" />
            <span>Level-Up</span>
          </TabsTrigger>
          <TabsTrigger 
            value="leaderboard" 
            className={`flex items-center space-x-2 ${activeTab === 'leaderboard' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            <Trophy className="h-4 w-4" />
            <span>Leaderboard</span>
          </TabsTrigger>
          <TabsTrigger 
            value="rewards" 
            className={`flex items-center space-x-2 ${activeTab === 'rewards' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('rewards')}
          >
            <Star className="h-4 w-4" />
            <span>Belohnungen</span>
          </TabsTrigger>
          <TabsTrigger 
            value="management" 
            className={`flex items-center space-x-2 ${activeTab === 'management' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('management')}
          >
            <Users className="h-4 w-4" />
            <span>Verwaltung</span>
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6" activeTab={activeTab}>
          
          {/* Level Progression Overview */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-accent" />
                Level Progression
                <Tooltip 
                  title="📊 Level Progression erklärt:"
                  content={
                    <div>
                      <div>Zeigt XP-Anforderungen für jedes Level:</div>
                      <div>• Basis XP: Startwert für Level 1</div>
                      <div>• Multiplikator: Steigerung pro Level</div>
                      <div>• Formel: Level N = Basis × (Multiplikator^(N-1))</div>
                      <div>• Kumulative XP = Summe aller vorherigen Level</div>
                    </div>
                  }
                />
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Übersicht der XP-Anforderungen für die ersten 20 Level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                {Array.from({ length: 20 }, (_, i) => {
                  const level = i + 1;
                  // Berechne XP für dieses Level (exponentiell)
                  const xpForLevel = Math.floor(settings.levelSystem.baseXP * Math.pow(settings.levelSystem.multiplier, level - 1));
                  
                  // Berechne kumulative XP (Gesamte XP die man braucht um dieses Level zu erreichen)
                  let cumulativeXP = 0;
                  for (let j = 1; j <= level; j++) {
                    cumulativeXP += Math.floor(settings.levelSystem.baseXP * Math.pow(settings.levelSystem.multiplier, j - 1));
                  }
                  
                  // Level-spezifische Farben
                  const getLevelColor = (lvl: number) => {
                    if (lvl <= 5) return 'text-green-400 border-green-400/30 bg-green-400/10';
                    if (lvl <= 10) return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
                    if (lvl <= 15) return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
                    return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
                  };

                  return (
                    <div 
                      key={level} 
                      className={`p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${getLevelColor(level)}`}
                    >
                      <div className="text-center">
                        <div className="font-bold text-lg mb-1">
                          Level {level}
                        </div>
                        <div className="text-xs opacity-80 mb-2">
                          {xpForLevel.toLocaleString()} XP
                        </div>
                        <div className="text-xs font-mono opacity-60">
                          Total: {cumulativeXP.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Level Progression Stats */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-accent">
                    {settings.levelSystem.baseXP.toLocaleString()}
                  </div>
                  <div className="text-sm text-dark-muted">Basis XP</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-accent">
                    {settings.levelSystem.multiplier}x
                  </div>
                  <div className="text-sm text-dark-muted">Multiplikator</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-accent">
                    {(() => {
                      let total = 0;
                      for (let i = 1; i <= 10; i++) {
                        total += Math.floor(settings.levelSystem.baseXP * Math.pow(settings.levelSystem.multiplier, i - 1));
                      }
                      return total.toLocaleString();
                    })()}
                  </div>
                  <div className="text-sm text-dark-muted">XP für Level 10</div>
                </div>
              </div>

              {/* Level Calculator */}
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-primary/30">
                <h5 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                  🧮 Level Rechner
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-dark-muted mb-2 block">XP eingeben um Level zu berechnen:</label>
                    <Input
                      type="number"
                      placeholder="XP eingeben..."
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      onChange={(e) => {
                        const inputXP = parseInt(e.target.value) || 0;
                        let level = 1;
                        let totalXP = 0;
                        
                        // Berechne Level basierend auf eingegeben XP
                        while (totalXP < inputXP && level <= settings.levelSystem.maxLevel) {
                          const xpForCurrentLevel = Math.floor(settings.levelSystem.baseXP * Math.pow(settings.levelSystem.multiplier, level - 1));
                          if (totalXP + xpForCurrentLevel <= inputXP) {
                            totalXP += xpForCurrentLevel;
                            level++;
                          } else {
                            break;
                          }
                        }
                        
                        const resultDiv = document.getElementById('level-calculator-result');
                        if (resultDiv) {
                          if (inputXP === 0) {
                            resultDiv.innerHTML = '<span class="text-dark-muted">Gib XP ein...</span>';
                          } else {
                            const progress = inputXP - totalXP;
                            const nextLevelXP = Math.floor(settings.levelSystem.baseXP * Math.pow(settings.levelSystem.multiplier, level - 1));
                            const remaining = nextLevelXP - progress;
                            
                            resultDiv.innerHTML = `
                              <div class="text-purple-400 font-bold">Level ${level - 1}</div>
                              <div class="text-xs text-dark-muted">
                                ${progress.toLocaleString()}/${nextLevelXP.toLocaleString()} XP zum nächsten Level
                              </div>
                              <div class="text-xs text-yellow-400">
                                Noch ${remaining.toLocaleString()} XP bis Level ${level}
                              </div>
                            `;
                          }
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dark-muted mb-2 block">Ergebnis:</label>
                    <div 
                      id="level-calculator-result" 
                      className="p-3 bg-dark-bg/70 border border-purple-primary/30 rounded-lg min-h-[42px] flex flex-col justify-center"
                    >
                      <span className="text-dark-muted">Gib XP ein...</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Message XP Settings */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-accent" />
                  Nachrichten XP
                  <Tooltip 
                    title="💬 Nachrichten XP erklärt:"
                    content={
                      <div>
                        <div>User bekommen XP für jede gesendete Nachricht</div>
                        <div>• Min/Max: Zufällige XP-Menge pro Nachricht</div>
                        <div>• Cooldown: Verhindert XP-Spam</div>
                      </div>
                    }
                  />
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Konfiguriere XP-Vergabe für Nachrichten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-text mb-2 block">Min XP</label>
                    <Input
                      id="minXP"
                      type="number"
                      value={settings.messageXP.min}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      onChange={(e: any) => setSettings(prev => ({
                        ...prev,
                        messageXP: { ...prev.messageXP, min: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-text mb-2 block">Max XP</label>
                    <Input
                      id="maxXP"
                      type="number"
                      value={settings.messageXP.max}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      onChange={(e: any) => setSettings(prev => ({
                        ...prev,
                        messageXP: { ...prev.messageXP, max: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-dark-text">Cooldown (Sekunden)</label>
                    <Tooltip 
                      title="⏱️ Cooldown erklärt:"
                      content={
                        <div>
                          <div>Verhindert XP-Spam:</div>
                          <div>• User kann nur alle X Sekunden XP bekommen</div>
                          <div>• Empfohlen: 30-60 Sekunden</div>
                          <div>• Verhindert Bot-ähnliches Verhalten</div>
                        </div>
                      }
                    />
                  </div>
                  <Input
                    id="msgCooldown"
                    type="number"
                    value={settings.messageXP.cooldown / 1000}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      messageXP: { ...prev.messageXP, cooldown: (parseInt(e.target.value) || 0) * 1000 }
                    }))}
                  />
                  <p className="text-sm text-dark-muted mt-1">
                    Aktuell: {formatDuration(settings.messageXP.cooldown)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Voice XP Settings */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Mic className="w-5 h-5 text-purple-accent" />
                  Voice XP
                  <Tooltip 
                    title="🎤 Voice XP erklärt:"
                    content={
                      <div>
                        <div>User bekommen XP für Zeit in Voice-Channels</div>
                        <div>• Basis XP: XP pro Vergabe</div>
                        <div>• Intervall: Alle X Minuten XP vergeben</div>
                        <div>• AFK/Solo: Reduzierte XP-Modifier</div>
                      </div>
                    }
                  />
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Konfiguriere XP-Vergabe für Voice-Channels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Basis XP pro Vergabe</label>
                  <Input
                    id="voiceBaseXP"
                    type="number"
                    value={settings.voiceXP.baseXP}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      voiceXP: { ...prev.voiceXP, baseXP: parseInt(e.target.value) || 0 }
                    }))}
                  />
                  <p className="text-sm text-dark-muted mt-1">
                    XP die bei jeder Vergabe gegeben werden
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">XP Intervall (Minuten)</label>
                  <Input
                    id="voiceInterval"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.voiceXP.intervalMinutes}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      voiceXP: { ...prev.voiceXP, intervalMinutes: parseInt(e.target.value) || 1 }
                    }))}
                  />
                  <p className="text-sm text-dark-muted mt-1">
                    XP wird alle {settings.voiceXP.intervalMinutes} Minute(n) vergeben
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-text mb-2 block">AFK Channel XP</label>
                    <Input
                      id="afkXP"
                      type="number"
                      value={settings.voiceXP.afkChannelXP}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      onChange={(e: any) => setSettings(prev => ({
                        ...prev,
                        voiceXP: { ...prev.voiceXP, afkChannelXP: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-text mb-2 block">Solo Channel XP</label>
                    <Input
                      id="soloXP"
                      type="number"
                      value={settings.voiceXP.soloChannelXP}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      onChange={(e: any) => setSettings(prev => ({
                        ...prev,
                        voiceXP: { ...prev.voiceXP, soloChannelXP: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Level System Settings */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-accent" />
                  Level System
                  <Tooltip 
                    title="🏆 Level System erklärt:"
                    content={
                      <div>
                        <div>Wie das Level-System funktioniert:</div>
                        <div>• Basis XP: XP für Level 1 (z.B. 100)</div>
                        <div>• Multiplikator: Steigerung pro Level (z.B. 1.5x)</div>
                        <div>• Level 2 = 150 XP, Level 3 = 225 XP, usw.</div>
                      </div>
                    }
                  />
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Konfiguriere das Level-System
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Basis XP für Level 1</label>
                  <Input
                    id="baseXP"
                    type="number"
                    value={settings.levelSystem.baseXP}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      levelSystem: { ...prev.levelSystem, baseXP: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                                  <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-dark-text">Multiplikator</label>
                    <Tooltip 
                      title="📈 Multiplikator erklärt:"
                      content={
                        <div>
                          <div>Level-Schwierigkeit:</div>
                          <div>• 1.0 = Gleichbleibend (100, 100, 100...)</div>
                          <div>• 1.5 = Moderat (100, 150, 225...)</div>
                          <div>• 2.0 = Schwer (100, 200, 400...)</div>
                        </div>
                      }
                    />
                  </div>
                  <Input
                    id="multiplier"
                    type="number"
                    step="0.1"
                    value={settings.levelSystem.multiplier}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      levelSystem: { ...prev.levelSystem, multiplier: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
                  <div>
                    <label className="text-sm font-medium text-dark-text mb-2 block">Max Level</label>
                    <Input
                      id="maxLevel"
                      type="number"
                      value={settings.levelSystem.maxLevel}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      onChange={(e: any) => setSettings(prev => ({
                        ...prev,
                        levelSystem: { ...prev.levelSystem, maxLevel: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Channel Settings */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-accent" />
                  Channel Konfiguration
                  <Tooltip 
                    title="⚙️ Channel Settings erklärt:"
                    content={
                      <div>
                        <div>Channel-Konfiguration:</div>
                        <div>• Level-Up: Wo Level-Up Nachrichten gepostet werden</div>
                        <div>• XP-Blacklist: Channels ohne XP-Vergabe</div>
                        <div>• Voice-Blacklist: Voice-Channels ohne XP</div>
                      </div>
                    }
                  />
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Konfiguriere Channels für XP-Features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Level-Up Channel</label>
                  <Input
                    id="levelUpChannel"
                    value={settings.channels.levelUpChannel}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      channels: { ...prev.channels, levelUpChannel: e.target.value }
                    }))}
                    placeholder="level-up"
                  />
                </div>

                {/* XP Blacklist Channels */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-dark-text">XP-Blacklist Channels</label>
                    <Tooltip 
                      title="🚫 XP-Blacklist erklärt:"
                      content={
                        <div>
                          <div>Channels ohne XP-Vergabe:</div>
                          <div>• Text-Channels wo keine XP vergeben werden</div>
                          <div>• Z.B. spam, bot-commands, support</div>
                          <div>• Channel-Namen eingeben (ohne #)</div>
                        </div>
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    {settings.channels.xpBlacklist.map((channel, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={channel}
                          className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                          onChange={(e: any) => {
                            const newBlacklist = [...settings.channels.xpBlacklist];
                            newBlacklist[index] = e.target.value;
                            setSettings(prev => ({
                              ...prev,
                              channels: { ...prev.channels, xpBlacklist: newBlacklist }
                            }));
                          }}
                          placeholder="channel-name"
                        />
                        <Button
                          onClick={() => {
                            const newBlacklist = settings.channels.xpBlacklist.filter((_, i) => i !== index);
                            setSettings(prev => ({
                              ...prev,
                              channels: { ...prev.channels, xpBlacklist: newBlacklist }
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
                          channels: { ...prev.channels, xpBlacklist: [...prev.channels.xpBlacklist, ''] }
                        }));
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Channel hinzufügen</span>
                    </Button>
                  </div>
                </div>

                {/* Voice Blacklist Channels */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-dark-text">Voice-Blacklist Channels</label>
                    <Tooltip 
                      title="🔇 Voice-Blacklist erklärt:"
                      content={
                        <div>
                          <div>Voice-Channels ohne XP:</div>
                          <div>• Voice-Channels wo keine XP vergeben werden</div>
                          <div>• Z.B. afk, musik-bot, temp-channels</div>
                          <div>• Channel-Namen eingeben</div>
                        </div>
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    {settings.channels.voiceBlacklist.map((channel, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={channel}
                          className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                          onChange={(e: any) => {
                            const newBlacklist = [...settings.channels.voiceBlacklist];
                            newBlacklist[index] = e.target.value;
                            setSettings(prev => ({
                              ...prev,
                              channels: { ...prev.channels, voiceBlacklist: newBlacklist }
                            }));
                          }}
                          placeholder="voice-channel-name"
                        />
                        <Button
                          onClick={() => {
                            const newBlacklist = settings.channels.voiceBlacklist.filter((_, i) => i !== index);
                            setSettings(prev => ({
                              ...prev,
                              channels: { ...prev.channels, voiceBlacklist: newBlacklist }
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
                          channels: { ...prev.channels, voiceBlacklist: [...prev.channels.voiceBlacklist, ''] }
                        }));
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Voice-Channel hinzufügen</span>
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Leaderboard Channel</label>
                  <Input
                    id="leaderboardChannel"
                    value={settings.channels.leaderboardChannel}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      channels: { ...prev.channels, leaderboardChannel: e.target.value }
                    }))}
                    placeholder="leaderboard"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Auto-Leaderboard Settings */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-accent" />
                Automatisches Leaderboard
                <Tooltip 
                  title="⏰ Auto-Leaderboard erklärt:"
                  content={
                    <div>
                      <div>Automatische Leaderboard-Posts:</div>
                      <div>• Uhrzeit: Täglich zu bestimmter Uhrzeit posten</div>
                      <div>• Zeitzone: Auswahl der relevanten Zeitzone</div>
                      <div>• Channel: Ziel-Channel Name</div>
                      <div>• Typen: Mehrere Leaderboards gleichzeitig</div>
                      <div>• Limit: Anzahl gezeigter User (5-25)</div>
                    </div>
                  }
                />
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Konfiguriere das automatische Leaderboard-Posting zu einer bestimmten Uhrzeit täglich
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-dark-text">Automatisches Posting aktiviert</label>
                <Switch
                  id="autoLeaderboardEnabled"
                  checked={settings.autoLeaderboard.enabled}
                  onCheckedChange={(checked: any) => setSettings(prev => ({
                    ...prev,
                    autoLeaderboard: { ...prev.autoLeaderboard, enabled: checked }
                  }))}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Channel Name</label>
                  <Input
                    id="autoChannelName"
                    value={settings.autoLeaderboard.channelName}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      autoLeaderboard: { ...prev.autoLeaderboard, channelName: e.target.value }
                    }))}
                    placeholder="leaderboard"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Leaderboard Typen</label>
                  <div className="space-y-2">
                    {[
                      { value: 'total', label: '🏆 XP Leaderboard' },
                      { value: 'level', label: '📈 Level Ranking' },
                      { value: 'messages', label: '💬 Message Champions' },
                      { value: 'voice', label: '🎤 Voice Heroes' }
                    ].map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`autoType-${type.value}`}
                          checked={settings.autoLeaderboard.types?.includes(type.value) || false}
                                                      onChange={(e) => {
                            const checked = e.target.checked;
                            setSettings(prev => ({
                              ...prev,
                              autoLeaderboard: {
                                ...prev.autoLeaderboard,
                                types: checked
                                  ? [...(prev.autoLeaderboard.types || []), type.value]
                                  : (prev.autoLeaderboard.types || []).filter(t => t !== type.value)
                              }
                            }));
                          }}
                          className="w-4 h-4 text-purple-accent bg-dark-bg border-purple-primary/30 rounded focus:ring-purple-accent"
                        />
                        <label htmlFor={`autoType-${type.value}`} className="text-sm text-dark-text">
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Uhrzeit (HH:MM)</label>
                  <Input
                    id="autoTime"
                    type="time"
                    value={settings.autoLeaderboard.time}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      autoLeaderboard: { ...prev.autoLeaderboard, time: e.target.value }
                    }))}
                    placeholder="20:00"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Zeitzone</label>
                  <select
                    id="autoTimezone"
                    value={settings.autoLeaderboard.timezone}
                    className="w-full bg-dark-bg/70 border border-purple-primary/30 text-dark-text focus:border-neon-purple rounded-lg p-2"
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      autoLeaderboard: { ...prev.autoLeaderboard, timezone: e.target.value }
                    }))}
                  >
                    <option value="Europe/Berlin">Deutschland (Europe/Berlin)</option>
                    <option value="Europe/London">UK (Europe/London)</option>
                    <option value="Europe/Paris">Frankreich (Europe/Paris)</option>
                    <option value="Europe/Rome">Italien (Europe/Rome)</option>
                    <option value="Europe/Vienna">Österreich (Europe/Vienna)</option>
                    <option value="Europe/Zurich">Schweiz (Europe/Zurich)</option>
                    <option value="America/New_York">New York (America/New_York)</option>
                    <option value="America/Los_Angeles">Los Angeles (America/Los_Angeles)</option>
                    <option value="Asia/Tokyo">Tokyo (Asia/Tokyo)</option>
                    <option value="Australia/Sydney">Sydney (Australia/Sydney)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Anzahl Einträge</label>
                  <Input
                    id="autoLimit"
                    type="number"
                    min="5"
                    max="25"
                    value={settings.autoLeaderboard.limit}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      autoLeaderboard: { ...prev.autoLeaderboard, limit: parseInt(e.target.value) || 10 }
                    }))}
                    placeholder="10"
                  />
                </div>
                
                <div className="flex flex-col justify-end">
                  <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-dark-text">Alte Leaderboards löschen</label>
                      <p className="text-xs text-dark-muted">Entfernt automatisch das vorherige Leaderboard</p>
                    </div>
                    <Switch
                      id="autoDeleteOld"
                      checked={settings.autoLeaderboard.autoDeleteOld}
                      onCheckedChange={(checked: any) => setSettings(prev => ({
                        ...prev,
                        autoLeaderboard: { ...prev.autoLeaderboard, autoDeleteOld: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>
              
              {settings.autoLeaderboard.lastPosted > 0 && (
                <div className="p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                  <p className="text-sm text-dark-muted">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Letztes Posting: {new Date(settings.autoLeaderboard.lastPosted).toLocaleString('de-DE')}
                  </p>
                  <p className="text-xs text-dark-muted mt-1">
                    Nächstes Posting: Täglich um {settings.autoLeaderboard.time} ({settings.autoLeaderboard.timezone})
                  </p>
                </div>
              )}

              {/* Test Button für Auto-Leaderboard */}
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-600/20 to-blue-700/20 rounded-lg border border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-blue-400 mb-1 flex items-center gap-2">
                      🧪 Leaderboard testen
                    </h5>
                    <p className="text-xs text-dark-muted">Poste ein Test-Leaderboard um zu sehen wie es im Discord aussieht</p>
                    {settings.autoLeaderboard.autoDeleteOld && (
                      <p className="text-xs text-green-400 mt-1">
                        🗑️ Auto-Delete aktiviert - alte Leaderboards werden automatisch gelöscht
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={testAutoLeaderboard}
                    disabled={!settings.autoLeaderboard.channelName || settings.autoLeaderboard.types.length === 0}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    Jetzt testen
                  </Button>
                </div>
                {(!settings.autoLeaderboard.channelName || settings.autoLeaderboard.types.length === 0) && (
                  <p className="text-xs text-yellow-400 mt-2">
                    ⚠️ Bitte Channel-Name und mindestens einen Leaderboard-Typ auswählen
                  </p>
                )}
              </div>
              
              {/* Debug/Status Info für Auto-Delete */}
              {settings.autoLeaderboard.enabled && (
                <div className="mt-4 p-3 bg-gradient-to-r from-purple-600/20 to-purple-700/20 rounded-lg border border-purple-500/30">
                  <div>
                    <h5 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                      ⚙️ Auto-Leaderboard Status
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-dark-muted">System aktiv:</span>
                        <span className={settings.autoLeaderboard.enabled ? "text-green-400" : "text-red-400"}>
                          {settings.autoLeaderboard.enabled ? "✅ JA" : "❌ NEIN"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-dark-muted">Auto-Delete:</span>
                        <span className={settings.autoLeaderboard.autoDeleteOld ? "text-green-400" : "text-yellow-400"}>
                          {settings.autoLeaderboard.autoDeleteOld ? "✅ EIN" : "⚠️ AUS"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-dark-muted">Channel:</span>
                        <span className="text-purple-300">#{settings.autoLeaderboard.channelName || 'nicht-gesetzt'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-dark-muted">Posting-Zeit:</span>
                        <span className="text-purple-300">{settings.autoLeaderboard.time || '20:00'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-dark-muted">Anzahl Typen:</span>
                        <span className="text-purple-300">{settings.autoLeaderboard.types?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-dark-muted">Letztes Posting:</span>
                        <span className="text-purple-300">
                          {settings.autoLeaderboard.lastPosted > 0 
                            ? new Date(settings.autoLeaderboard.lastPosted).toLocaleDateString('de-DE')
                            : 'Nie'
                          }
                        </span>
                      </div>
                    </div>
                    
                    {!settings.autoLeaderboard.autoDeleteOld && (
                      <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                        <p className="text-xs text-yellow-300">
                          ⚠️ <strong>Auto-Delete ist deaktiviert!</strong> Alte Leaderboards werden nicht automatisch gelöscht.
                          <br />
                          Aktiviere "Alte Leaderboards löschen" für einen sauberen Channel.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Announcements and Display Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-accent" />
                  Ankündigungen
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Konfiguriere automatische Ankündigungen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-text">Level-Up Ankündigungen</label>
                  <Switch
                    id="levelUpAnnounce"
                    checked={settings.announcements.levelUp}
                    onCheckedChange={(checked: any) => setSettings(prev => ({
                      ...prev,
                      announcements: { ...prev.announcements, levelUp: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-text">Meilenstein Ankündigungen</label>
                  <Switch
                    id="milestoneAnnounce"
                    checked={settings.announcements.milestones}
                    onCheckedChange={(checked: any) => setSettings(prev => ({
                      ...prev,
                      announcements: { ...prev.announcements, milestones: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-text">Neue Rekorde</label>
                  <Switch
                    id="recordAnnounce"
                    checked={settings.announcements.newRecord}
                    onCheckedChange={(checked: any) => setSettings(prev => ({
                      ...prev,
                      announcements: { ...prev.announcements, newRecord: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-accent" />
                  Anzeige Einstellungen
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Konfiguriere die Darstellung des XP-Systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Embed Farbe</label>
                  <div className="flex gap-3 items-center">
                    {/* Color Picker */}
                    <div className="relative">
                      <input
                        type="color"
                        value={settings.display.embedColor.startsWith('0x') ? `#${settings.display.embedColor.slice(2)}` : settings.display.embedColor.startsWith('#') ? settings.display.embedColor : '#00FF7F'}
                        onChange={(e) => {
                          const hexColor = e.target.value;
                          const discordColor = `0x${hexColor.slice(1).toUpperCase()}`;
                          setSettings(prev => ({
                            ...prev,
                            display: { ...prev.display, embedColor: discordColor }
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
                        id="embedColor"
                        value={settings.display.embedColor}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple font-mono"
                        onChange={(e: any) => setSettings(prev => ({
                          ...prev,
                          display: { ...prev.display, embedColor: e.target.value }
                        }))}
                        placeholder="0x00FF7F"
                      />
                    </div>

                    {/* Color Preview */}
                    <div 
                      className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                      style={{
                        backgroundColor: settings.display.embedColor.startsWith('0x') ? `#${settings.display.embedColor.slice(2)}` : settings.display.embedColor.startsWith('#') ? settings.display.embedColor : '#00FF7F',
                        filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                      }}
                    >
                      🎨
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
                            display: { ...prev.display, embedColor: preset.color }
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
                  <label className="text-sm font-medium text-dark-text mb-2 block">Leaderboard Größe</label>
                  <Input
                    id="leaderboardSize"
                    type="number"
                    value={settings.display.leaderboardSize}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      display: { ...prev.display, leaderboardSize: parseInt(e.target.value) || 10 }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-dark-text">Rang anzeigen</label>
                    <Tooltip 
                      title="🏆 Rang anzeigen erklärt:"
                      content={
                        <div>
                          <div>XP-Profile Einstellung:</div>
                          <div>• AN: Zeigt Rang in XP-Profilen an (#1, #2, etc.)</div>
                          <div>• AUS: Versteckt Rang-Information</div>
                          <div>• Betrifft !xp und /xp Befehle</div>
                        </div>
                      }
                    />
                  </div>
                  <Switch
                    id="showRank"
                    checked={settings.display.showRank}
                    onCheckedChange={(checked: any) => setSettings(prev => ({
                      ...prev,
                      display: { ...prev.display, showRank: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-dark-text">Fortschritt anzeigen</label>
                    <Tooltip 
                      title="📊 Fortschritt anzeigen erklärt:"
                      content={
                        <div>
                          <div>XP-Profile Einstellung:</div>
                          <div>• AN: Zeigt Fortschrittsbalken zum nächsten Level</div>
                          <div>• AUS: Versteckt Fortschrittsbalken</div>
                          <div>• Hilfreich für cleane Profile</div>
                        </div>
                      }
                    />
                  </div>
                  <Switch
                    id="showProgress"
                    checked={settings.display.showProgress}
                    onCheckedChange={(checked: any) => setSettings(prev => ({
                      ...prev,
                      display: { ...prev.display, showProgress: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

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
        </TabsContent>

        {/* Level-Up Embed Tab */}
        <TabsContent value="levelup" className="space-y-6" activeTab={activeTab}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basis Konfiguration */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-accent" />
                  Level-Up Embeds
                  <Tooltip 
                    title="🎉 Level-Up Embeds erklärt:"
                    content={
                      <div>
                        <div>Passe Level-Up-Nachrichten an:</div>
                        <div>• Titel: Überschrift der Level-Up-Nachricht</div>
                        <div>• Farbe: Embed-Farbe (Hex-Code)</div>
                        <div>• Felder: Welche Infos angezeigt werden</div>
                        <div>• Custom Message: Eigene Nachricht mit Platzhaltern</div>
                      </div>
                    }
                  />
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Konfiguriere das Aussehen von Level-Up-Nachrichten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-text">Level-Up Embeds aktiviert</label>
                  <Switch
                    checked={settings.levelUpEmbed.enabled}
                    onCheckedChange={(checked: any) => setSettings(prev => ({
                      ...prev,
                      levelUpEmbed: { ...prev.levelUpEmbed, enabled: checked }
                    }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Embed-Titel</label>
                  <Input
                    value={settings.levelUpEmbed.title}
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      levelUpEmbed: { ...prev.levelUpEmbed, title: e.target.value }
                    }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    placeholder="🎉 Level Up!"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-dark-text">Embed Farbe</label>
                    <Tooltip 
                      title="🎨 Embed Farbe erklärt:"
                      content={
                        <div>
                          <div>Die Farbe des seitlichen Balkens</div>
                          <div>in der Discord Level-Up-Nachricht</div>
                        </div>
                      }
                    />
                  </div>
                  <div className="flex gap-3 items-center">
                    {/* Color Picker */}
                    <div className="relative">
                      <input
                        type="color"
                        value={settings.levelUpEmbed.color.startsWith('0x') ? `#${settings.levelUpEmbed.color.slice(2)}` : settings.levelUpEmbed.color.startsWith('#') ? settings.levelUpEmbed.color : '#00FF7F'}
                        onChange={(e) => {
                          const hexColor = e.target.value;
                          const discordColor = `0x${hexColor.slice(1).toUpperCase()}`;
                          setSettings(prev => ({...prev, levelUpEmbed: {...prev.levelUpEmbed, color: discordColor}}));
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
                        value={settings.levelUpEmbed.color}
                        onChange={(e: any) => setSettings(prev => ({...prev, levelUpEmbed: {...prev.levelUpEmbed, color: e.target.value}}))}
                        className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-purple-primary font-mono"
                        placeholder="0x00FF7F"
                      />
                    </div>

                    {/* Color Preview */}
                    <div 
                      className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                      style={{
                        backgroundColor: settings.levelUpEmbed.color.startsWith('0x') ? `#${settings.levelUpEmbed.color.slice(2)}` : settings.levelUpEmbed.color.startsWith('#') ? settings.levelUpEmbed.color : '#00FF7F',
                        filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.3))'
                      }}
                    >
                      🎉
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
                          onClick={() => setSettings(prev => ({...prev, levelUpEmbed: {...prev.levelUpEmbed, color: preset.color}}))}
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
                  <label className="text-sm font-medium text-dark-text mb-2 block">Custom Message (Optional)</label>
                  <textarea
                    value={settings.levelUpEmbed.fields.customMessage}
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      levelUpEmbed: { 
                        ...prev.levelUpEmbed, 
                        fields: { ...prev.levelUpEmbed.fields, customMessage: e.target.value }
                      }
                    }))}
                    className="w-full h-20 p-3 bg-dark-bg/70 border border-purple-primary/30 text-dark-text focus:border-neon-purple rounded-lg resize-none"
                    placeholder="**{username}** ist jetzt **Level {newLevel}**!"
                  />
                  <p className="text-xs text-dark-muted mt-1">
                    Platzhalter: {'{username}'}, {'{oldLevel}'}, {'{newLevel}'}, {'{totalXP}'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Animation Konfiguration */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-accent" />
                  Animationen
                  <Tooltip 
                    title="✨ Animationen erklärt:"
                    content={
                      <div>
                        <div>Level-Up Animationseffekte:</div>
                        <div>• Celebration: Countdown + Confetti-Reaktionen</div>
                        <div>• Gradient: Farbwechsel durch das Spektrum</div>
                        <div>• Pulse: Pulsierender Weiß-Effekt</div>
                        <div>• Rainbow: Schnelle Rainbow-Animation</div>
                      </div>
                    }
                  />
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Spezielle Animationseffekte für Level-Ups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-text">Animationen aktiviert</label>
                  <Switch
                    checked={settings.levelUpEmbed.animation.enabled}
                    onCheckedChange={(checked: any) => setSettings(prev => ({
                      ...prev,
                      levelUpEmbed: { 
                        ...prev.levelUpEmbed, 
                        animation: { ...prev.levelUpEmbed.animation, enabled: checked }
                      }
                    }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Animations-Stil</label>
                  <Select 
                    value={settings.levelUpEmbed.animation.style} 
                    onValueChange={(value: any) => setSettings(prev => ({
                      ...prev,
                      levelUpEmbed: { 
                        ...prev.levelUpEmbed, 
                        animation: { ...prev.levelUpEmbed.animation, style: value }
                      }
                    }))}
                  >
                    <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-purple-primary/30">
                      <SelectItem value="celebration" className="text-dark-text hover:bg-purple-primary/20">
                        🎉 Celebration (Countdown + Confetti)
                      </SelectItem>
                      <SelectItem value="gradient" className="text-dark-text hover:bg-purple-primary/20">
                        🌈 Gradient (Farbwechsel)
                      </SelectItem>
                      <SelectItem value="pulse" className="text-dark-text hover:bg-purple-primary/20">
                        💫 Pulse (Pulsierender Effekt)
                      </SelectItem>
                      <SelectItem value="rainbow" className="text-dark-text hover:bg-purple-primary/20">
                        🌈 Rainbow (Schnelle Rainbow-Animation)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">
                    Animations-Dauer (Millisekunden)
                  </label>
                  <Input
                    type="number"
                    value={settings.levelUpEmbed.animation.duration}
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      levelUpEmbed: { 
                        ...prev.levelUpEmbed, 
                        animation: { ...prev.levelUpEmbed.animation, duration: parseInt(e.target.value) || 5000 }
                      }
                    }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    min="1000"
                    max="30000"
                  />
                  <p className="text-xs text-dark-muted mt-1">
                    Dauer der Animation (1000-30000ms)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Embed-Felder Konfiguration */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-accent" />
                  Embed-Felder
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Wähle welche Informationen im Level-Up-Embed angezeigt werden
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-text">Statistiken anzeigen</label>
                  <Switch
                    checked={settings.levelUpEmbed.fields.showStats}
                    onCheckedChange={(checked: any) => setSettings(prev => ({
                      ...prev,
                      levelUpEmbed: { 
                        ...prev.levelUpEmbed, 
                        fields: { ...prev.levelUpEmbed.fields, showStats: checked }
                      }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-text">Nächstes Level anzeigen</label>
                  <Switch
                    checked={settings.levelUpEmbed.fields.showNextLevel}
                    onCheckedChange={(checked: any) => setSettings(prev => ({
                      ...prev,
                      levelUpEmbed: { 
                        ...prev.levelUpEmbed, 
                        fields: { ...prev.levelUpEmbed.fields, showNextLevel: checked }
                      }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-text">Server-Rang anzeigen</label>
                  <Switch
                    checked={settings.levelUpEmbed.fields.showRank}
                    onCheckedChange={(checked: any) => setSettings(prev => ({
                      ...prev,
                      levelUpEmbed: { 
                        ...prev.levelUpEmbed, 
                        fields: { ...prev.levelUpEmbed.fields, showRank: checked }
                      }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Footer Konfiguration */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-accent" />
                  Footer
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Footer-Text für Level-Up-Embeds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-text">Footer aktiviert</label>
                  <Switch
                    checked={settings.levelUpEmbed.footer.enabled}
                    onCheckedChange={(checked: any) => setSettings(prev => ({
                      ...prev,
                      levelUpEmbed: { 
                        ...prev.levelUpEmbed, 
                        footer: { ...prev.levelUpEmbed.footer, enabled: checked }
                      }
                    }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-dark-text mb-2 block">Footer-Text</label>
                  <Input
                    value={settings.levelUpEmbed.footer.text}
                    onChange={(e: any) => setSettings(prev => ({
                      ...prev,
                      levelUpEmbed: { 
                        ...prev.levelUpEmbed, 
                        footer: { ...prev.levelUpEmbed.footer, text: e.target.value }
                      }
                    }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    placeholder="🎉 Herzlichen Glückwunsch!"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Test-Bereich für alle Ankündigungen */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-accent" />
                  Ankündigungen testen
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Teste alle XP-System Ankündigungen in Discord
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Level-Up Test */}
                <div className="p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-semibold text-purple-400 mb-1 flex items-center gap-2">
                        🎉 Level-Up Vorschau
                      </h5>
                      <p className="text-xs text-dark-muted mb-2">
                        Teste Level-Up-Embed in #{settings.channels.levelUpChannel || 'nicht-konfiguriert'}
                      </p>
                      {settings.levelUpEmbed.animation.enabled && (
                        <p className="text-xs text-purple-300">
                          ✨ Animation: {settings.levelUpEmbed.animation.style} ({settings.levelUpEmbed.animation.duration}ms)
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={testLevelUp}
                      disabled={!settings.channels.levelUpChannel || !settings.levelUpEmbed.enabled}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      Level-Up
                    </Button>
                  </div>
                </div>

                {/* Meilenstein Test */}
                <div className="p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg border border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-semibold text-blue-400 mb-1 flex items-center gap-2">
                        🎯 Meilenstein Vorschau
                      </h5>
                      <p className="text-xs text-dark-muted mb-2">
                        Teste Meilenstein-Ankündigung ({settings.rewards.milestoneRewards[0]?.xp?.toLocaleString() || '5.000'} XP)
                      </p>
                      <p className="text-xs text-blue-300">
                        Aktiviert: {settings.announcements.milestones ? '✅' : '❌'}
                      </p>
                    </div>
                    <Button
                      onClick={testMilestone}
                      disabled={!settings.channels.levelUpChannel || !settings.announcements.milestones}
                      className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      Meilenstein
                    </Button>
                  </div>
                </div>

                {/* Rekord Tests */}
                <div className="p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg border border-yellow-500/30">
                  <div className="mb-3">
                    <h5 className="text-sm font-semibold text-yellow-400 mb-1 flex items-center gap-2">
                      🏆 Neue Rekorde Vorschau
                    </h5>
                    <p className="text-xs text-dark-muted mb-2">
                      Teste Server-Rekord Ankündigungen für verschiedene Kategorien
                    </p>
                    <p className="text-xs text-yellow-300">
                      Aktiviert: {settings.announcements.newRecord ? '✅' : '❌'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button
                      onClick={() => testRecord('level')}
                      disabled={!settings.channels.levelUpChannel || !settings.announcements.newRecord}
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-2 px-3 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                    >
                      📈 Level
                    </Button>
                    <Button
                      onClick={() => testRecord('xp')}
                      disabled={!settings.channels.levelUpChannel || !settings.announcements.newRecord}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-2 px-3 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                    >
                      ⭐ XP
                    </Button>
                    <Button
                      onClick={() => testRecord('messages')}
                      disabled={!settings.channels.levelUpChannel || !settings.announcements.newRecord}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-3 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                    >
                      💬 Messages
                    </Button>
                    <Button
                      onClick={() => testRecord('voice')}
                      disabled={!settings.channels.levelUpChannel || !settings.announcements.newRecord}
                      className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-2 px-3 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                    >
                      🎤 Voice
                    </Button>
                  </div>
                </div>

                {/* Warnung falls nicht konfiguriert */}
                {(!settings.channels.levelUpChannel || (!settings.levelUpEmbed.enabled && !settings.announcements.milestones && !settings.announcements.newRecord)) && (
                  <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-xs text-yellow-300">
                      {!settings.channels.levelUpChannel && '⚠️ Level-Up Channel nicht konfiguriert. '}
                      {!settings.levelUpEmbed.enabled && '⚠️ Level-Up Embeds deaktiviert. '}
                      {!settings.announcements.milestones && '⚠️ Meilenstein-Ankündigungen deaktiviert. '}
                      {!settings.announcements.newRecord && '⚠️ Rekord-Ankündigungen deaktiviert. '}
                      Bitte in den Einstellungen konfigurieren.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6" activeTab={activeTab}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Select value={leaderboardType} onValueChange={(value: any) => setLeaderboardType(value)}>
                <SelectTrigger className="w-48 bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-surface border-purple-primary/30">
                  <SelectItem value="total" className="text-dark-text hover:bg-purple-primary/20">🏆 XP Leaderboard</SelectItem>
                  <SelectItem value="level" className="text-dark-text hover:bg-purple-primary/20">📈 Level Ranking</SelectItem>
                  <SelectItem value="messages" className="text-dark-text hover:bg-purple-primary/20">💬 Message Champions</SelectItem>
                  <SelectItem value="voice" className="text-dark-text hover:bg-purple-primary/20">🎤 Voice Heroes</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => loadData()} 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-neon transition-all duration-300 hover:scale-105"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={postChannelName} onValueChange={setPostChannelName}>
                <SelectTrigger className="w-48 bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple">
                  <SelectValue placeholder="Channel wählen..." />
                </SelectTrigger>
                <SelectContent className="bg-dark-surface border-purple-primary/30">
                  {channels.text.map(channel => (
                    <SelectItem key={channel.id} value={channel.name} className="text-dark-text hover:bg-purple-primary/20">
                      #{channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={postLeaderboard} 
                disabled={!postChannelName}
                className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-2 px-4 rounded-lg shadow-neon transition-all duration-300 hover:scale-105"
              >
                <Send className="h-4 w-4 mr-2" />
                Posten
              </Button>
            </div>
          </div>

          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                {getLeaderboardIcon(leaderboardType)}
                <span>
                  {leaderboardType === 'total' && '🏆 XP Leaderboard'}
                  {leaderboardType === 'level' && '📈 Level Ranking'}
                  {leaderboardType === 'messages' && '💬 Message Champions'}
                  {leaderboardType === 'voice' && '🎤 Voice Heroes'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard
                  .sort((a, b) => {
                    switch (leaderboardType) {
                      case 'total': 
                        return b.totalXP - a.totalXP;
                      case 'level': 
                        // Erst nach Level sortieren, dann bei gleichem Level nach totalXP
                        if (b.level !== a.level) {
                          return b.level - a.level;
                        }
                        return b.totalXP - a.totalXP;
                      case 'messages': 
                        // Erst nach Messages, dann bei gleichen Messages nach totalXP
                        if (b.messageCount !== a.messageCount) {
                          return b.messageCount - a.messageCount;
                        }
                        return b.totalXP - a.totalXP;
                      case 'voice': 
                        // Erst nach Voice-Zeit, dann bei gleicher Zeit nach totalXP
                        if (b.voiceTime !== a.voiceTime) {
                          return b.voiceTime - a.voiceTime;
                        }
                        return b.totalXP - a.totalXP;
                      default: 
                        return b.totalXP - a.totalXP;
                    }
                  })
                  .slice(0, 25)
                  .map((user, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    
                    let primaryValue = '';
                    let secondaryValue = '';
                    
                    switch (leaderboardType) {
                      case 'total':
                        primaryValue = `${user.totalXP.toLocaleString()} XP`;
                        secondaryValue = `Level ${user.level}`;
                        break;
                      case 'level':
                        primaryValue = `Level ${user.level}`;
                        secondaryValue = `${user.totalXP.toLocaleString()} XP`;
                        break;
                      case 'messages':
                        primaryValue = `${user.messageCount.toLocaleString()} Nachrichten`;
                        secondaryValue = `Level ${user.level}`;
                        break;
                      case 'voice':
                        primaryValue = `${user.voiceTime.toFixed(1)} min`;
                        secondaryValue = `Level ${user.level}`;
                        break;
                    }

                    return (
                      <div key={user.userId} className="flex items-center justify-between p-4 rounded-lg bg-dark-bg/50 border border-purple-primary/20 hover:border-purple-primary/40 transition-all duration-200">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold w-8 text-neon-purple">{medal}</span>
                          <div>
                            <div className="font-semibold text-dark-text">{user.username}</div>
                            <div className="text-sm text-dark-muted">{secondaryValue}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-neon-purple">{primaryValue}</div>
                          <div className="text-sm text-dark-muted">
                            {user.messageCount} Nachrichten • {user.voiceTime.toFixed(1)}min Voice
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6" activeTab={activeTab}>
          {/* Level Roles */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-accent" />
                  Level Rollen
                </CardTitle>
                <CardDescription className="text-dark-muted">
                  Rollen die automatisch bei bestimmten Leveln vergeben werden
                </CardDescription>

              </CardHeader>
              <CardContent className="space-y-6">
                {/* Manuelle Level-Rollen */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-dark-text flex items-center gap-2">
                    ⚙️ Benutzerdefinierte Level-Rollen
                    <Tooltip 
                      title="⚙️ Benutzerdefinierte Level-Rollen:"
                      content={
                        <div>
                          <div>Hier können Sie eigene Level-Rollen hinzufügen:</div>
                          <div>• Wählen Sie ein Level und eine existierende Discord-Rolle</div>
                          <div>• Diese Rollen werden automatisch vergeben wenn das Level erreicht wird</div>
                          <div>• Funktioniert zusätzlich zu den automatischen Level-Rollen</div>
                        </div>
                      }
                    />
                  </h4>
                  <p className="text-dark-muted text-sm">
                    Fügen Sie eigene Discord-Rollen hinzu, die bei bestimmten Leveln vergeben werden
                  </p>

                  {/* Liste der konfigurierten Level-Rollen */}
                  <div className="space-y-2">
                    {settings.rewards.levelRoles.map((role, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-dark-bg/50 border border-purple-primary/20">
                        <span className="text-dark-text font-medium">Level {role.level}: {role.roleName}</span>
                        <Button
                          onClick={() => removeLevelRole(index)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all duration-300 hover:scale-105"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Neue Level-Rolle hinzufügen */}
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Level"
                      value={newLevelRole.level}
                      className="w-20 bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      onChange={(e: any) => setNewLevelRole(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                    />
                    <Select value={newLevelRole.roleId} onValueChange={(value: any) => {
                      const role = roles.find(r => r.id === value);
                      setNewLevelRole(prev => ({ 
                        ...prev, 
                        roleId: value,
                        roleName: role?.name || '' 
                      }));
                    }}>
                      <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple">
                        <SelectValue placeholder="Rolle wählen..." />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-surface border-purple-primary/30 max-h-[300px] overflow-y-auto">
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id} className="text-dark-text hover:bg-purple-primary/20 py-2">
                            {role.name} ({role.guildName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={addLevelRole} 
                      disabled={!newLevelRole.roleName}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold p-3 rounded-lg shadow-neon transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Automatische Level-Rollen */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-primary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-dark-text flex items-center gap-2">
                        🏆 Automatische Level-Rollen
                        <Tooltip 
                          title="🏆 Automatische Level-Rollen erklärt:"
                          content={
                            <div>
                              <div>Erstellt automatisch Discord-Rollen für Level-Meilensteine:</div>
                              <div>• 🔥 Level 5 (Orange-Rot)</div>
                              <div>• ⚡ Level 10 (Dodger Blau)</div>
                              <div>• 💫 Level 15 (Medium Purple)</div>
                              <div>• 🌟 Level 20 (Gold)</div>
                              <div>• 🚀 Level 25 (Lime)</div>
                              <div>• 🎯 Level 30 (Deep Pink)</div>
                              <div>• 💎 Level 40 (Cyan)</div>
                              <div>• 👑 Level 50 (Blau-Violett)</div>
                              <div>• 🏆 Level 75 (Crimson)</div>
                              <div>• 🔮 Level 100 (Indigo)</div>
                              <br/>
                              <div>System vergibt automatisch die höchste erreichte Level-Rolle!</div>
                            </div>
                          }
                        />
                      </h4>
                      <p className="text-dark-muted text-sm">
                        Erstellt automatisch 10 farbige Discord-Rollen für Level-Meilensteine (Level 5 - 100)
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={createLevelRoles}
                        disabled={loading}
                        className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-primary text-white font-bold py-2 px-4 rounded-xl neon-shadow transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                      >
                        <Trophy className="h-5 w-5" />
                        <span>Level-Rollen erstellen</span>
                      </Button>
                      <Button
                        onClick={updateAllRoles}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-xl neon-shadow transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                      >
                        <RefreshCw className="h-5 w-5" />
                        <span>Alle Rollen aktualisieren</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Rollen-Vorschau */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-dark-text">🔥 Level 5</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-dark-text">⚡ Level 10</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-dark-text">💫 Level 15</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-dark-text">🌟 Level 20</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-dark-text">🚀 Level 25</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                      <span className="text-dark-text">🎯 Level 30</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                      <span className="text-dark-text">💎 Level 40</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                      <span className="text-dark-text">👑 Level 50</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-red-600"></div>
                      <span className="text-dark-text">🏆 Level 75</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                      <span className="text-dark-text">🔮 Level 100</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Milestone Rewards */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-accent" />
                Meilenstein Belohnungen
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Besondere Belohnungen für XP-Meilensteine
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {settings.rewards.milestoneRewards.map((milestone, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-dark-bg/50 border border-purple-primary/20">
                    <span className="text-dark-text font-medium">{milestone.xp.toLocaleString()} XP: {milestone.reward}</span>
                    <Button
                      onClick={() => removeMilestone(index)}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="XP"
                  value={newMilestone.xp}
                  className="w-24 bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                  onChange={(e: any) => setNewMilestone(prev => ({ ...prev, xp: parseInt(e.target.value) || 1000 }))}
                />
                <Input
                  placeholder="Belohnung"
                  value={newMilestone.reward}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                  onChange={(e: any) => setNewMilestone(prev => ({ ...prev, reward: e.target.value }))}
                />
                <Button 
                  onClick={addMilestone} 
                  disabled={!newMilestone.reward}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold p-3 rounded-lg shadow-neon transition-all duration-300 hover:scale-105"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Automatische Meilenstein-Rollen */}
              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-dark-text flex items-center gap-2">
                      🎯 Automatische Meilenstein-Rollen
                      <Tooltip 
                        title="🎯 Automatische Rollen erklärt:"
                        content={
                          <div>
                            <div>Erstellt automatisch Discord-Rollen für Meilensteine:</div>
                            <div>• 🌱 500 XP: Newcomer (Hell-Grün)</div>
                            <div>• 💬 1.000 XP: Aktives Mitglied (Himmel-Blau)</div>
                            <div>• ⭐ 2.500 XP: Erfahrener User (Gold)</div>
                            <div>• 🎯 5.000 XP: Server-Veteran (Orange-Rot)</div>
                            <div>• 👑 10.000 XP: Elite Member (Dunkles Orchid)</div>
                            <div>• 🏆 25.000 XP: Server-Legende (Deep Pink)</div>
                            <div>• 💎 50.000 XP: Diamond Member (Cyan)</div>
                            <br/>
                            <div>System vergibt automatisch die höchste erreichte Rolle!</div>
                          </div>
                        }
                      />
                    </h4>
                    <p className="text-dark-muted text-sm">
                      Erstellt automatisch 7 farbige Discord-Rollen für XP-Meilensteine (500 - 50.000 XP)
                    </p>
                  </div>
                  <Button
                    onClick={createMilestoneRoles}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-primary text-white font-bold py-2 px-4 rounded-xl neon-shadow transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                  >
                    <Crown className="h-5 w-5" />
                    <span>Meilenstein-Rollen erstellen</span>
                  </Button>
                </div>
                
                {/* Rollen-Vorschau */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-dark-text">🌱 Newcomer (500 XP)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-sky-400"></div>
                    <span className="text-dark-text">💬 Aktives Mitglied (1.000 XP)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <span className="text-dark-text">⭐ Erfahrener User (2.500 XP)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                    <span className="text-dark-text">🎯 Server-Veteran (5.000 XP)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                    <span className="text-dark-text">👑 Elite Member (10.000 XP)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-pink-400"></div>
                    <span className="text-dark-text">🏆 Server-Legende (25.000 XP)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                    <span className="text-dark-text">💎 Diamond Member (50.000 XP)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Management Tab */}
        <TabsContent value="management" className="space-y-6" activeTab={activeTab}>
          {/* User Management */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-accent" />
                User-Verwaltung
                <Tooltip 
                  title="👤 User-Verwaltung erklärt:"
                  content={
                    <div>
                      <div>Admin-Tools für XP-Management:</div>
                      <div>• User XP setzen: Direkter XP-Wert setzen</div>
                      <div>• User XP hinzufügen: XP zu bestehendem Wert addieren</div>
                      <div>• User zurücksetzen: Kompletten User-Progress löschen</div>
                    </div>
                  }
                />
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Verwalte XP für einzelne User (Admin-Tools)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Set User XP */}
              <div className="p-4 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                <h4 className="text-lg font-semibold text-dark-text mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-accent" />
                  User XP setzen
                </h4>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                     <Input
                       placeholder="User ID (Discord ID)"
                       value={userManagement.userId}
                       onChange={(e: any) => setUserManagement(prev => ({ ...prev, userId: e.target.value }))}
                       className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                     />
                     <p className="text-xs text-dark-muted mt-1">💡 Tipp: Rechtsklick auf User → ID kopieren</p>
                   </div>
                  <Input
                    type="number"
                    placeholder="XP Amount"
                    value={userManagement.xpAmount}
                    onChange={(e: any) => setUserManagement(prev => ({ ...prev, xpAmount: parseInt(e.target.value) || 0 }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                  />
                  <Button
                    onClick={setUserXP}
                    disabled={!userManagement.userId}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                  >
                    XP setzen
                  </Button>
                </div>
              </div>

              {/* Add User XP */}
              <div className="p-4 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
                <h4 className="text-lg font-semibold text-dark-text mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-400" />
                  User XP hinzufügen
                </h4>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                     <Input
                       placeholder="User ID (Discord ID)"
                       value={userManagement.addUserId}
                       onChange={(e: any) => setUserManagement(prev => ({ ...prev, addUserId: e.target.value }))}
                       className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                     />
                     <p className="text-xs text-dark-muted mt-1">💡 Tipp: Rechtsklick auf User → ID kopieren</p>
                   </div>
                  <Input
                    type="number"
                    placeholder="XP hinzufügen"
                    value={userManagement.addXpAmount}
                    onChange={(e: any) => setUserManagement(prev => ({ ...prev, addXpAmount: parseInt(e.target.value) || 0 }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                  />
                  <Button
                    onClick={addUserXP}
                    disabled={!userManagement.addUserId}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 px-4 rounded-lg"
                  >
                    XP hinzufügen
                  </Button>
                </div>
              </div>

              {/* Reset User */}
              <div className="p-4 bg-dark-bg/50 rounded-lg border border-red-500/30">
                <h4 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  User zurücksetzen
                </h4>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <Input
                       placeholder="User ID zum Zurücksetzen"
                       value={userManagement.resetUserId}
                       onChange={(e: any) => setUserManagement(prev => ({ ...prev, resetUserId: e.target.value }))}
                       className="bg-dark-bg/70 border-red-500/30 text-dark-text focus:border-red-400"
                     />
                     <p className="text-xs text-red-300 mt-1">⚠️ Achtung: Dies löscht alle XP-Daten des Users permanent!</p>
                   </div>
                  <Button
                    onClick={resetUser}
                    disabled={!userManagement.resetUserId}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 px-4 rounded-lg"
                  >
                    User zurücksetzen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dangerous Actions */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-red-500/30 shadow-red-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Gefährliche Aktionen
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Diese Aktionen können nicht rückgängig gemacht werden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-yellow-500/30 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200">
                  Das Zurücksetzen aller XP-Daten löscht alle Benutzer-Level, XP-Punkte und Statistiken permanent.
                </AlertDescription>
              </Alert>
              
              {/* Debug Status Button */}
              <div className="p-4 bg-blue-600/20 rounded-lg border border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-blue-400 mb-1 flex items-center gap-2">
                      🔍 System Debug Status
                    </h5>
                    <p className="text-xs text-dark-muted">
                      Prüfe Memory-Cache vs JSON-Datei Unterschiede
                    </p>
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/xp/debug-status');
                        const data = await response.json();
                        console.log('🔍 XP Debug Status:', data);
                        
                        if (data.discrepancies.hasDiscrepancies) {
                          showMessage('error', 
                            `⚠️ Diskrepanzen gefunden! Memory: ${data.memory.count}, JSON: ${data.json.count}. ` +
                            `Nur in Memory: ${data.discrepancies.onlyInMemory.length}, Nur in JSON: ${data.discrepancies.onlyInJSON.length}`
                          );
                        } else {
                          showMessage('success', 
                            `✅ Keine Diskrepanzen! Memory und JSON sind synchron (${data.memory.count} User)`
                          );
                        }
                      } catch (error) {
                        showMessage('error', 'Fehler beim Debug-Status abrufen');
                      }
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Debug Status
                  </Button>
                </div>
              </div>

              {/* Emergency Reset Button */}
              <div className="p-4 bg-red-600/20 rounded-lg border border-red-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-red-400 mb-1 flex items-center gap-2">
                      🚨 Emergency Reset
                    </h5>
                    <p className="text-xs text-dark-muted">
                      Garantierte komplette XP-Daten Löschung mit mehrfacher Verifikation
                    </p>
                  </div>
                  <Button
                    onClick={async () => {
                      const confirmed = confirm(
                        '🚨 EMERGENCY RESET: Möchten Sie WIRKLICH alle XP-Daten KOMPLETT löschen?\n\n' +
                        'Dies verwendet eine verbesserte Lösch-Logik mit mehrfacher Verifikation.\n' +
                        'Ein Backup wird automatisch erstellt.\n\n' +
                        'Diese Aktion kann NICHT rückgängig gemacht werden!'
                      );
                      
                      if (confirmed) {
                        try {
                          const response = await fetch('/api/xp/emergency-reset', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ confirmEmergency: 'EMERGENCY_RESET_CONFIRMED' })
                          });
                          
                          const data = await response.json();
                          
                          if (data.success) {
                            showMessage('success', 
                              `✅ Emergency Reset erfolgreich! ${data.usersCleared} User entfernt. ` +
                              `Backup: ${data.backup}`
                            );
                            loadData(); // Neu laden
                          } else {
                            showMessage('error', 
                              `❌ Emergency Reset fehlgeschlagen: ${data.error}`
                            );
                          }
                        } catch (error) {
                          showMessage('error', 'Fehler beim Emergency Reset');
                        }
                      }
                    }}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2 px-4 rounded-lg"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Emergency Reset
                  </Button>
                </div>
              </div>
              
              {/* Normal Reset Button */}
              <Button 
                onClick={resetAllXP} 
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
              >
                <RotateCcw className="h-5 w-5" />
                <span>Alle XP-Daten zurücksetzen (Normal)</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default XP;