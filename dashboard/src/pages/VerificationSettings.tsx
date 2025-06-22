import { useState, useEffect } from 'react';
import { Settings, Save, Eye, Users, BarChart3, AlertCircle, CheckCircle, Shield, Plus, Trash2, Smile, Monitor, Calendar, GamepadIcon, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useToast, ToastContainer } from '../components/ui/toast';
import EmojiPicker from '../components/ui/emoji-picker';

interface VerificationConfig {
  enabled: boolean;
  requireCaptcha: boolean;
  allowedGames: { id: string; label: string; emoji: string; role?: string }[];
  allowedPlatforms: { id: string; label: string; emoji: string; role?: string }[];
  defaultRoles: string[];
  welcomeMessage: string;
  embedColor: string;
  logChannel: string;
  verificationChannel: string;
  verificationMessage: {
    title: string;
    description: string;
    buttonText: string;
    steps: string[];
  };
  autoAssignRoles: boolean;

}

interface VerificationStats {
  totalVerifications: number;
  todayVerifications: number;
  failedAttempts: number;
  popularGames: { game: string; count: number }[];
  platformStats: { platform: string; count: number }[];
  recentUsers: VerifiedUser[];
  totalUsers: number;
  activeToday: number;
  mostPopularGame: string;
  mostPopularPlatform: string;
}

interface VerifiedUser {
  discordId: string;
  username: string;
  discriminator?: string;
  avatar?: string;
  games: string[];
  platform: string;
  agents: string[];
  assignedRoles: string[];
  verificationDate: string;
  guildId: string;
  guildName: string;
}

interface VerifiedUsersData {
  users: VerifiedUser[];
  totalCount: number;
  lastUpdated: string;
}

interface ValorantAgent {
  id: string;
  name: string;
  uuid: string;
  display_name: string;
  role_type: string;
  role_color: string;
  enabled: boolean;
  sort_order: number;
  icon?: string;
}

interface ValorantAgentRole {
  id: string;
  role_name: string;
  display_name: string;
  color: string;
  enabled: boolean;
  sort_order: number;
}

// Matrix Blocks Komponente
// Custom Refresh SVG Component
const RefreshIcon = ({ className = "w-5 h-5", animate = false }: { className?: string; animate?: boolean }) => (
  <svg 
    className={`${className} ${animate ? 'animate-spin' : 'transition-transform duration-300 group-hover:rotate-180'}`} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="refreshGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00D4FF" />
        <stop offset="50%" stopColor="#9333EA" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
    </defs>
    <path 
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2A8.001 8.001 0 0019.418 15m0 0H15" 
      stroke="url(#refreshGradient)" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle 
      cx="12" 
      cy="12" 
      r="2" 
      fill="url(#refreshGradient)"
      className="opacity-60"
    />
  </svg>
);

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

const VerificationSettings = () => {
  const { toasts, showSuccess, showError, removeToast } = useToast();
  
  // Wrapper functions for backward compatibility
  const success = (message: string) => showSuccess('Erfolgreich', message);
  const error = (message: string) => showError('Fehler', message);
  const [config, setConfig] = useState<VerificationConfig>({
    enabled: true,
    requireCaptcha: true,
    allowedGames: [],
    allowedPlatforms: [],
    defaultRoles: [],
    welcomeMessage: '',
    embedColor: '0x00FF7F',
    logChannel: '',
    verificationChannel: '',
    verificationMessage: {
      title: '',
      description: '',
      buttonText: '',
      steps: []
    },
    autoAssignRoles: true
  });

  const [stats, setStats] = useState<VerificationStats>({
    totalVerifications: 0,
    todayVerifications: 0,
    failedAttempts: 0,
    popularGames: [],
    platformStats: [],
    recentUsers: [],
    totalUsers: 0,
    activeToday: 0,
    mostPopularGame: '',
    mostPopularPlatform: ''
  });

  const [usersData, setUsersData] = useState<VerifiedUsersData>({ users: [], totalCount: 0, lastUpdated: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [creatingRoles, setCreatingRoles] = useState(false);
  const [postingVerification, setPostingVerification] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'statistics' | 'users' | 'valorant'>('settings');
  
  // 🎯 Valorant Agents States
  const [valorantAgents, setValorantAgents] = useState<ValorantAgent[]>([]);
  const [valorantAgentRoles, setValorantAgentRoles] = useState<ValorantAgentRole[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  
  // 🎯 Agent Management States
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<ValorantAgent | null>(null);
  const [agentEmojiPickerOpen, setAgentEmojiPickerOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    display_name: '',
    uuid: '',
    role_type: 'Duelist',
    enabled: true,
    sort_order: 0,
    icon: '🎯'
  });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<VerifiedUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'username'>('date');
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    userId: string;
    username: string;
  }>({
    show: false,
    userId: '',
    username: ''
  });
  
  // UI States für Add-Forms
  const [newGameName, setNewGameName] = useState('');
  const [newGameEmoji, setNewGameEmoji] = useState('🎮');
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformEmoji, setNewPlatformEmoji] = useState('💻');
  const [newRole, setNewRole] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [platformEmojiPickerOpen, setPlatformEmojiPickerOpen] = useState(false);
  const [messageEmojiPickerOpen, setMessageEmojiPickerOpen] = useState<'title' | 'button' | 'description' | 'welcomeMessage' | 'newStep' | number | null>(null);
  const [newStep, setNewStep] = useState('');

  // Step Management
  const addStep = () => {
    if (!newStep.trim()) return;
    
    setConfig(prev => ({
      ...prev,
      verificationMessage: {
        ...prev.verificationMessage,
        steps: [...(prev.verificationMessage?.steps || []), newStep.trim()]
      }
    }));
    
    setNewStep('');
  };

  const updateStep = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      verificationMessage: {
        ...prev.verificationMessage,
        steps: prev.verificationMessage?.steps?.map((step, i) => i === index ? value : step) || []
      }
    }));
  };

  const removeStep = (index: number) => {
    setConfig(prev => ({
      ...prev,
      verificationMessage: {
        ...prev.verificationMessage,
        steps: prev.verificationMessage?.steps?.filter((_, i) => i !== index) || []
      }
    }));
  };

  // 🎯 Valorant Agents Loading
  const loadValorantAgents = async () => {
    try {
      setLoadingAgents(true);
      
      const [agentsResponse, rolesResponse] = await Promise.all([
        fetch('/api/valorant/agents'),
        fetch('/api/valorant/agent-roles')
      ]);
      
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json();
        setValorantAgents(agentsData.agents || []);
        console.log('✅ Valorant Agenten geladen:', agentsData.agents?.length || 0);
      } else {
        console.error('❌ Fehler beim Laden der Valorant Agenten');
      }
      
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setValorantAgentRoles(rolesData.roles || []);
        console.log('✅ Valorant Agent-Rollen geladen:', rolesData.roles?.length || 0);
      } else {
        console.error('❌ Fehler beim Laden der Valorant Agent-Rollen');
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der Valorant Daten:', error);
    } finally {
      setLoadingAgents(false);
    }
  };

  useEffect(() => {
    // Lade Konfiguration vom Server
    loadConfig();
    loadStats();
    loadUsers();
    loadValorantAgents();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/verification/config');
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('❌ Netzwerkfehler beim Laden der Config:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/verification/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      // Silent fail für Stats
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/verification/users');
      const data = await response.json();
      setUsersData(data);
    } catch (error) {
      // Silent fail für User-Liste
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const response = await fetch('/api/verification/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        success('💾 Verification-Einstellungen erfolgreich gespeichert!');
      } else {
        const error = await response.json();
                error(`❌ Fehler beim Speichern: ${error.error}`);
      }
      
    } catch (error) {
      error('❌ Netzwerkfehler beim Speichern der Konfiguration');
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Valorant Agent Management Functions
  const saveAgent = async () => {
    try {
      const agentData = {
        ...newAgent,
        sort_order: newAgent.sort_order || valorantAgents.length + 1
      };

      const url = editingAgent ? `/api/valorant/agents/${editingAgent.id}` : '/api/valorant/agents';
      const method = editingAgent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });

      if (response.ok) {
        success(editingAgent ? '✅ Agent erfolgreich aktualisiert!' : '✅ Agent erfolgreich hinzugefügt!');
        setShowAddAgentModal(false);
        setEditingAgent(null);
        setNewAgent({
          name: '',
          display_name: '',
          uuid: '',
          role_type: 'Duelist',
          enabled: true,
          sort_order: 0,
          icon: '🎯'
        });
        // Lade Agenten neu
        loadValorantAgents();
      } else {
        const errorData = await response.json();
        error(`❌ Fehler: ${errorData.error || 'Unbekannter Fehler'}`);
      }
    } catch (err) {
      error('❌ Netzwerkfehler beim Speichern des Agenten');
    }
  };

  const deleteAgent = async (agent: ValorantAgent) => {
    if (!confirm(`Möchtest du den Agenten "${agent.display_name}" wirklich löschen?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/valorant/agents/${agent.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        success('✅ Agent erfolgreich gelöscht!');
        loadValorantAgents();
      } else {
        const errorData = await response.json();
        error(`❌ Fehler: ${errorData.error || 'Unbekannter Fehler'}`);
      }
    } catch (err) {
      error('❌ Netzwerkfehler beim Löschen des Agenten');
    }
  };

  const toggleAgentEnabled = async (agent: ValorantAgent) => {
    try {
      const response = await fetch(`/api/valorant/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...agent, enabled: !agent.enabled })
      });

      if (response.ok) {
        success(`✅ Agent ${!agent.enabled ? 'aktiviert' : 'deaktiviert'}!`);
        loadValorantAgents();
      } else {
        const errorData = await response.json();
        error(`❌ Fehler: ${errorData.error || 'Unbekannter Fehler'}`);
      }
    } catch (err) {
      error('❌ Netzwerkfehler beim Aktualisieren des Agenten');
    }
  };

  const openEditAgent = (agent: ValorantAgent) => {
    setEditingAgent(agent);
    setNewAgent({
      name: agent.name,
      display_name: agent.display_name,
      uuid: agent.uuid,
      role_type: agent.role_type,
      enabled: agent.enabled,
      sort_order: agent.sort_order,
      icon: agent.icon || '🎯'
    });
    setShowAddAgentModal(true);
  };

  // Game Management
  const addGame = () => {
    if (!newGameName.trim()) return;
    
    const gameId = newGameName.toLowerCase().replace(/\s+/g, '-');
    const newGame = {
      id: gameId,
      label: newGameName.trim(),
      emoji: newGameEmoji
    };
    
    setConfig(prev => ({
      ...prev,
      allowedGames: [...(prev.allowedGames || []), newGame]
    }));
    
    setNewGameName('');
    setNewGameEmoji('🎮');
  };

  const removeGame = (gameId: string) => {
    setConfig(prev => ({
      ...prev,
      allowedGames: (prev.allowedGames || []).filter(g => g.id !== gameId)
    }));
  };

  // Platform Management
  const addPlatform = () => {
    if (!newPlatformName.trim()) return;
    
    const platformId = newPlatformName.toLowerCase().replace(/\s+/g, '-');
    const newPlatform = {
      id: platformId,
      label: newPlatformName.trim(),
      emoji: newPlatformEmoji
    };
    
    setConfig(prev => ({
      ...prev,
      allowedPlatforms: [...(prev.allowedPlatforms || []), newPlatform]
    }));
    
    setNewPlatformName('');
    setNewPlatformEmoji('💻');
  };

  const removePlatform = (platformId: string) => {
    setConfig(prev => ({
      ...prev,
      allowedPlatforms: (prev.allowedPlatforms || []).filter(p => p.id !== platformId)
    }));
  };

  // Role Management
  const addRole = () => {
    if (!newRole.trim()) return;
    
    setConfig(prev => ({
      ...prev,
      defaultRoles: [...(prev.defaultRoles || []), newRole.trim()]
    }));
    
    setNewRole('');
  };

  const removeRole = (role: string) => {
    setConfig(prev => ({
      ...prev,
      defaultRoles: (prev.defaultRoles || []).filter(r => r !== role)
    }));
  };

  // Helper functions for Statistics and User Management
  const getGameEmoji = (gameId: string) => {
    const gameEmojis: { [key: string]: string } = {
      'valorant': '🎯',
      'league-of-legends': '⭐',
      'world-of-warcraft': '⚔️',
      'minecraft': '🧱',
      'fortnite': '🪂',
      'cs2': '💥',
      'apex': '🚀'
    };
    return gameEmojis[gameId] || '🎮';
  };

  const getPlatformEmoji = (platform: string) => {
    const platformEmojis: { [key: string]: string } = {
      'pc': '💻',
      'ps5': '🎮',
      'xbox': '❎',
      'switch': '🎮',
      'mobile': '📱'
    };
    return platformEmojis[platform] || '🖥️';
  };

  const getAvatarUrl = (user: VerifiedUser) => {
    if (user.avatar) {
      return `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  const deleteUser = async (discordId: string, username: string) => {
    setDeleteModal({
      show: true,
      userId: discordId,
      username: username
    });
  };

  const confirmDelete = async () => {
    const { userId, username } = deleteModal;
    
    setDeleting(userId);
    try {
      const response = await fetch(`/api/verification/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadUsers();
        await loadStats(); // Refresh stats too
        success(`🗑️ Verifizierung von "${username}" erfolgreich gelöscht!`);
      } else {
        const error = await response.json();
        error(`❌ Fehler: ${error.message || 'Löschen fehlgeschlagen'}`);
      }
    } catch (error) {
      error('❌ Fehler beim Löschen der Verifizierung');
    } finally {
      setDeleting(null);
      setDeleteModal({ show: false, userId: '', username: '' });
    }
  };

  const postVerificationMessage = async () => {
    if (!config.verificationChannel?.trim()) {
      error('❌ Bitte gib einen Channel-Namen ein');
      return;
    }

    setPostingVerification(true);
    try {
      const response = await fetch('/api/verification/post-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          channel: config.verificationChannel.replace('#', ''),
          embedColor: config.embedColor || '0x00FF7F',
          title: config.verificationMessage?.title || '🛡️ Server Verifizierung',
          description: config.verificationMessage?.description || 'Willkommen auf dem Server! Um Zugang zu allen Channels zu erhalten, musst du dich verifizieren.',
          buttonText: config.verificationMessage?.buttonText || '🚀 Jetzt verifizieren'
        }),
      });

      if (response.ok) {
        success(`✅ Verifizierungsnachricht erfolgreich in #${config.verificationChannel} gepostet!`);
      } else {
        const error = await response.json();
        error(`❌ Fehler beim Posten: ${error.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      error('❌ Netzwerkfehler beim Posten der Nachricht');
    } finally {
      setPostingVerification(false);
    }
  };

  const createVerificationRoles = async () => {
    setCreatingRoles(true);
    try {
      const allRoles = [
        ...config.defaultRoles,
        ...config.allowedGames.filter(g => g.role && g.role.trim()).map(g => g.role!.trim()),
        ...config.allowedPlatforms.filter(p => p.role && p.role.trim()).map(p => p.role!.trim())
      ];
      

      
      // 🎯 Valorant-Rollen hinzufügen (dynamisch aus Supabase)
      const valorantBaseRoles = ['Valorant'];
      
      // Agent-Rollen (Duelist, Sentinel, etc.)
      const dynamicAgentRoles = valorantAgentRoles
        .filter(role => role.enabled)
        .map(role => role.display_name);
      
      // Individuelle Agenten-Rollen (aus Supabase)
      const dynamicValorantAgents = valorantAgents
        .filter(agent => agent.enabled)
        .map(agent => agent.display_name);
      
      allRoles.push(
        ...valorantBaseRoles, 
        ...dynamicAgentRoles, 
        ...dynamicValorantAgents
      );

      const response = await fetch('/api/verification/create-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: allRoles })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.createdRoles.length > 0) {
          success(`✅ ${result.createdRoles.length} Verification-Rollen erstellt: ${result.createdRoles.join(', ')}`);
        } else {
          success('✅ Alle Verification-Rollen existieren bereits!');
        }
        
        if (result.failedRoles.length > 0) {
          error(`⚠️ Fehler bei ${result.failedRoles.length} Rollen: ${result.failedRoles.join(', ')}`);
        }
      } else {
        const errorData = await response.json();
        error(`❌ ${errorData.error || 'Fehler beim Erstellen der Rollen'}`);
      }
    } catch (error) {
      error('❌ Fehler beim Erstellen der Verification-Rollen');
    } finally {
      setCreatingRoles(false);
    }
  };

  const filteredUsers = (usersData.users || [])
    .filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = filterPlatform === 'all' || user.platform === filterPlatform;
      return matchesSearch && matchesPlatform;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.verificationDate).getTime() - new Date(a.verificationDate).getTime();
      } else {
        return a.username.localeCompare(b.username);
      }
    });

  const uniquePlatforms = [...new Set((usersData.users || []).map(u => u.platform))];

  return (
    <div className="space-y-8 p-6 animate-fade-in relative">
      {/* Matrix Background Effects */}
      <MatrixBlocks density={20} />
      
      {/* Page Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            Verification System
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Verwalte die Discord-Verifizierung wie ein Boss! 
          <span className="ml-2 inline-block relative">
            <svg 
              className="w-6 h-6 animate-pulse hover:animate-bounce text-blue-400 hover:text-blue-300 transition-all duration-300 hover:scale-110 drop-shadow-lg" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <div className="absolute inset-0 animate-ping">
              <svg 
                className="w-6 h-6 text-blue-500 opacity-30" 
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

      {/* Action Buttons */}
      <div className="flex justify-center gap-3 mb-8">
        <Button
          onClick={() => window.open('/verify', '_blank')}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Eye className="h-5 w-5" />
          <span>Vorschau</span>
        </Button>
        
        <Button
          onClick={saveConfig}
          disabled={loading}
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          {loading ? '🔄' : saved ? <CheckCircle className="h-5 w-5" /> : <Save className="h-5 w-5" />}
          <span>{loading ? 'Speichert...' : saved ? 'Gespeichert!' : 'Speichern'}</span>
        </Button>
        
        <Button
          onClick={createVerificationRoles}
          disabled={creatingRoles}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          {creatingRoles ? '🔄' : <Settings className="h-5 w-5" />}
          <span>{creatingRoles ? 'Erstellt...' : 'Rollen erstellen'}</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-8">
        {[
          { id: 'settings', label: 'Einstellungen', icon: Settings },
          { id: 'statistics', label: 'Statistiken', icon: BarChart3 },
          { id: 'users', label: `Verifizierte User (${usersData.totalCount})`, icon: Users },
          { id: 'valorant', label: `🎯 Valorant Agenten (${valorantAgents.length})`, icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'settings' | 'statistics' | 'users' | 'valorant')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 font-medium ${
                activeTab === tab.id
                  ? 'bg-purple-primary text-white shadow-neon animate-glow'
                  : 'bg-dark-surface/90 backdrop-blur-xl text-dark-text hover:bg-purple-primary/20 border border-purple-primary/30'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Allgemeine Einstellungen */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-accent" />
                Allgemeine Einstellungen
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Grundlegende Konfiguration der Verifizierung
              </CardDescription>
            </CardHeader>
            <CardContent>

            <div className="space-y-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={config.enabled}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, enabled: !!checked }))
                  }
                />
                <div>
                  <div className="text-dark-text font-medium">Verifizierung aktiviert</div>
                  <div className="text-dark-muted text-sm">
                    Neue Mitglieder müssen die Verifizierung durchlaufen
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={config.requireCaptcha}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, requireCaptcha: !!checked }))
                  }
                />
                <div>
                  <div className="text-dark-text font-medium">Captcha erforderlich</div>
                  <div className="text-dark-muted text-sm">
                    Bot-Schutz durch Captcha-Verifikation
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={config.autoAssignRoles}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, autoAssignRoles: !!checked }))
                  }
                />
                <div>
                  <div className="text-dark-text font-medium">Automatische Rollenzuweisung</div>
                  <div className="text-dark-muted text-sm">
                    Rollen automatisch basierend auf Spielen zuweisen
                  </div>
                </div>
              </label>
            </div>
            </CardContent>
          </Card>

          {/* Willkommensnachricht */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                💬 Willkommensnachricht
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Nachricht und Logging-Einstellungen
              </CardDescription>
            </CardHeader>
            <CardContent>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-dark-text font-medium">
                    Nachricht nach erfolgreicher Verifizierung:
                  </label>
                  <button
                    onClick={() => setMessageEmojiPickerOpen(messageEmojiPickerOpen === 'welcomeMessage' ? null : 'welcomeMessage')}
                    className="text-dark-muted hover:text-pink-400 transition-colors duration-200 hover:scale-110 p-2"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
                <Textarea
                  value={config.welcomeMessage}
                  onChange={(e) => setConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple h-24 resize-none"
                  placeholder="Willkommensnachricht eingeben..."
                />
              </div>

              {/* Embed Farbe */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-dark-text">Embed Farbe</label>
                  <div className="relative group">
                    <button
                      type="button"
                      className="text-blue-400 hover:text-blue-300 text-xs transition-colors duration-200"
                    >
                      ❓
                    </button>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-surface border border-purple-primary/30 rounded-lg text-xs text-dark-text opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                      <div className="font-medium text-blue-400 mb-1">🎨 Embed Farbe erklärt:</div>
                      <div>Die Farbe des seitlichen Balkens</div>
                      <div>in der Discord Nachricht</div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-surface"></div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  {/* Color Picker */}
                  <div className="relative">
                    <input
                      type="color"
                      value={config.embedColor?.startsWith('0x') ? `#${config.embedColor.slice(2)}` : config.embedColor?.startsWith('#') ? config.embedColor : '#00FF7F'}
                      onChange={(e) => {
                        const hexColor = e.target.value;
                        const discordColor = `0x${hexColor.slice(1).toUpperCase()}`;
                        setConfig(prev => ({ ...prev, embedColor: discordColor }));
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
                      value={config.embedColor || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, embedColor: e.target.value }))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple font-mono"
                      placeholder="0x00FF7F"
                    />
                  </div>

                  {/* Color Preview */}
                  <div 
                    className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                    style={{
                      backgroundColor: config.embedColor?.startsWith('0x') ? `#${config.embedColor.slice(2)}` : config.embedColor?.startsWith('#') ? config.embedColor : '#00FF7F',
                      filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                    }}
                  >
                    ✅
                  </div>
                </div>
                
                {/* Beliebte Discord Farben */}
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
                        onClick={() => setConfig(prev => ({ ...prev, embedColor: preset.color }))}
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
                <label className="block text-dark-text font-medium mb-2">
                  Log-Kanal (ohne #):
                </label>
                <Input
                  value={config.logChannel}
                  onChange={(e) => setConfig(prev => ({ ...prev, logChannel: e.target.value }))}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                  placeholder="z.B. verification-logs"
                />
                <p className="text-dark-muted text-xs mt-1">
                  Kanal wo Verifizierungen geloggt werden (leer = kein Logging)
                </p>
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Verifizierungsnachricht posten */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                🚀 Verifizierungsnachricht posten
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Poste eine Nachricht mit dem Verifizierungsbutton in einen Channel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Nachrichteninhalt bearbeiten */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-dark-text font-medium mb-2">
                    Titel der Nachricht:
                  </label>
                  <div className="relative">
                    <Input
                      value={config.verificationMessage?.title || ''}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        verificationMessage: { 
                          ...prev.verificationMessage, 
                          title: e.target.value 
                        } 
                      }))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple pr-10"
                      placeholder="🛡️ Server Verifizierung"
                    />
                    <button
                      onClick={() => setMessageEmojiPickerOpen(messageEmojiPickerOpen === 'title' ? null : 'title')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-pink-400 transition-colors duration-200 hover:scale-110"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    {messageEmojiPickerOpen === 'title' && (
                      <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in"
                        onClick={() => setMessageEmojiPickerOpen(null)}
                      >
                        <div 
                          className="relative animate-scale-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <EmojiPicker
                            onEmojiSelect={(emoji) => {
                              setConfig(prev => ({ 
                                ...prev, 
                                verificationMessage: { 
                                  ...prev.verificationMessage, 
                                  title: (prev.verificationMessage?.title || '') + emoji 
                                } 
                              }));
                              setMessageEmojiPickerOpen(null);
                            }}
                            onClose={() => setMessageEmojiPickerOpen(null)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-dark-text font-medium mb-2">
                    Button-Text:
                  </label>
                  <div className="relative">
                    <Input
                      value={config.verificationMessage?.buttonText || ''}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        verificationMessage: { 
                          ...prev.verificationMessage, 
                          buttonText: e.target.value 
                        } 
                      }))}
                      className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple pr-10"
                      placeholder="🚀 Jetzt verifizieren"
                    />
                    <button
                      onClick={() => setMessageEmojiPickerOpen(messageEmojiPickerOpen === 'button' ? null : 'button')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-pink-400 transition-colors duration-200 hover:scale-110"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    {messageEmojiPickerOpen === 'button' && (
                      <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in"
                        onClick={() => setMessageEmojiPickerOpen(null)}
                      >
                        <div 
                          className="relative animate-scale-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <EmojiPicker
                            onEmojiSelect={(emoji) => {
                              setConfig(prev => ({ 
                                ...prev, 
                                verificationMessage: { 
                                  ...prev.verificationMessage, 
                                  buttonText: (prev.verificationMessage?.buttonText || '') + emoji 
                                } 
                              }));
                              setMessageEmojiPickerOpen(null);
                            }}
                            onClose={() => setMessageEmojiPickerOpen(null)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-dark-text font-medium mb-2">
                  Beschreibung:
                </label>
                <div className="relative">
                  <Textarea
                    value={config.verificationMessage?.description || ''}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      verificationMessage: { 
                        ...prev.verificationMessage, 
                        description: e.target.value 
                      } 
                    }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple h-20 resize-none pr-10"
                    placeholder="Willkommen auf dem Server! Um Zugang zu allen Channels zu erhalten, musst du dich verifizieren."
                  />
                  <button
                    onClick={() => setMessageEmojiPickerOpen(messageEmojiPickerOpen === 'description' ? null : 'description')}
                    className="absolute right-2 top-2 text-dark-muted hover:text-pink-400 transition-colors duration-200 hover:scale-110"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  {messageEmojiPickerOpen === 'description' && (
                    <div 
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in"
                      onClick={() => setMessageEmojiPickerOpen(null)}
                    >
                      <div 
                        className="relative animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EmojiPicker
                          onEmojiSelect={(emoji) => {
                            setConfig(prev => ({ 
                              ...prev, 
                              verificationMessage: { 
                                ...prev.verificationMessage, 
                                description: (prev.verificationMessage?.description || '') + emoji 
                              } 
                            }));
                            setMessageEmojiPickerOpen(null);
                          }}
                          onClose={() => setMessageEmojiPickerOpen(null)}
                        />
                      </div>
                    </div>
                  )}
                </div>
                            </div>
              
              {/* Verifizierungsschritte bearbeiten */}
              <div className="mb-6 p-4 bg-purple-primary/10 border border-purple-primary/30 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-dark-text font-medium flex items-center gap-2">
                    📋 Verifizierungsschritte bearbeiten:
                  </h4>
                  <span className="text-xs text-dark-muted">
                    {config.verificationMessage?.steps?.length || 0} Schritte
                  </span>
                </div>
                
                {/* Bestehende Schritte */}
                <div className="space-y-3 mb-4">
                  {(config.verificationMessage?.steps || []).map((step, index) => (
                    <div key={index} className="bg-dark-bg/50 rounded-lg p-3 border border-purple-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-primary/20 rounded-lg flex items-center justify-center text-purple-light text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 relative">
                          <Input
                            value={step}
                            onChange={(e) => updateStep(index, e.target.value)}
                            className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple pr-10"
                            placeholder={`Schritt ${index + 1} beschreiben...`}
                          />
                          <button
                            onClick={() => setMessageEmojiPickerOpen(messageEmojiPickerOpen === index ? null : index)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-pink-400 transition-colors duration-200 hover:scale-110"
                          >
                            <Smile className="w-5 h-5" />
                          </button>
                          {messageEmojiPickerOpen === index && (
                            <div 
                              className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in"
                              onClick={() => setMessageEmojiPickerOpen(null)}
                            >
                              <div 
                                className="relative animate-scale-in"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <EmojiPicker
                                  onEmojiSelect={(emoji) => {
                                    updateStep(index, step + emoji);
                                    setMessageEmojiPickerOpen(null);
                                  }}
                                  onClose={() => setMessageEmojiPickerOpen(null)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => removeStep(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border-red-400/30 hover:border-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Neuen Schritt hinzufügen */}
                <div className="border-t border-purple-primary/20 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-dark-text text-sm font-medium">Neuen Schritt hinzufügen:</h5>
                    <button
                      onClick={() => setMessageEmojiPickerOpen(messageEmojiPickerOpen === 'newStep' ? null : 'newStep')}
                      className="text-dark-muted hover:text-pink-400 transition-colors duration-200 hover:scale-110 p-2"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newStep}
                      onChange={(e) => setNewStep(e.target.value)}
                      className="flex-1 bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                      placeholder="📝 Beschreibe den neuen Schritt..."
                      onKeyPress={(e) => e.key === 'Enter' && addStep()}
                    />
                    <Button
                      onClick={addStep}
                      disabled={!newStep.trim()}
                      variant="cyber"
                      className="shadow-neon"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Hinzufügen
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                <div className="lg:col-span-2">
                  <label className="block text-dark-text font-medium mb-2">
                    Channel (ohne #):
                  </label>
                  <Input
                    value={config.verificationChannel || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, verificationChannel: e.target.value }))}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                    placeholder="z.B. verification oder willkommen"
                  />
                  <p className="text-dark-muted text-xs mt-1">
                    Der Channel wo die Verifizierungsnachricht gepostet werden soll
                  </p>
                </div>
                <div>
                  <Button
                    onClick={postVerificationMessage}
                    disabled={postingVerification || !config.verificationChannel?.trim()}
                    variant="cyber"
                    className="w-full shadow-neon"
                  >
                    {postingVerification ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Poste...
                      </>
                    ) : (
                      <>
                        🚀 Nachricht posten
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Vorschau der Nachricht */}
              <div className="mt-6 p-4 bg-dark-bg/50 border border-purple-primary/30 rounded-lg">
                <h4 className="text-dark-text font-medium mb-3 flex items-center gap-2">
                  👁️ Nachrichtenvorschau:
                </h4>
                <div className="bg-dark-surface/80 p-4 rounded-lg border-l-4" style={{ borderLeftColor: config.embedColor?.startsWith('0x') ? `#${config.embedColor.slice(2)}` : config.embedColor?.startsWith('#') ? config.embedColor : '#00FF7F' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-6 h-6 text-purple-accent" />
                    <h3 className="text-lg font-bold text-white">{config.verificationMessage?.title || '🛡️ Server Verifizierung'}</h3>
                  </div>
                  <p className="text-dark-text mb-4">
                    {config.verificationMessage?.description || 'Willkommen auf dem Server! Um Zugang zu allen Channels zu erhalten, musst du dich verifizieren.'}
                  </p>
                  <div className="bg-purple-primary/20 p-3 rounded-lg mb-4">
                    <p className="text-purple-light text-sm">
                      {(config.verificationMessage?.steps && config.verificationMessage.steps.length > 0) ? (
                        config.verificationMessage.steps.map((step, index) => (
                          <span key={index}>
                            {step}
                            {index < config.verificationMessage.steps.length - 1 && <br/>}
                          </span>
                        ))
                      ) : (
                        <>
                          ✅ Wähle deine Lieblingsspiele<br/>
                          💻 Gib deine Gaming-Plattform an<br/>
                          🎯 Erhalte passende Rollen automatisch
                        </>
                      )}
                    </p>
                  </div>
                  <div className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center cursor-pointer transition-colors inline-block">
                    {config.verificationMessage?.buttonText || '🚀 Jetzt verifizieren'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verfügbare Spiele */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                🎮 Verfügbare Spiele
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Wähle welche Spiele zur Auswahl stehen
              </CardDescription>
            </CardHeader>
            <CardContent>

            {/* Spiel hinzufügen */}
            <div className="mb-6 p-4 bg-purple-primary/10 border border-purple-primary/30 rounded-lg">
              <h4 className="text-dark-text font-medium mb-3">Neues Spiel hinzufügen:</h4>
              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                    variant="outline"
                    className="h-10 w-12 text-xl border-purple-primary/30 hover:border-neon-purple"
                  >
                    {newGameEmoji}
                  </Button>
                  {emojiPickerOpen && (
                    <div 
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in"
                      onClick={() => setEmojiPickerOpen(false)}
                    >
                      <div 
                        className="relative animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EmojiPicker
                          onEmojiSelect={(emoji) => {
                            setNewGameEmoji(emoji);
                            setEmojiPickerOpen(false);
                          }}
                          onClose={() => setEmojiPickerOpen(false)}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <Input
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  placeholder="Spiel-Name (z.B. Rocket League)"
                  className="flex-1 bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                  onKeyPress={(e) => e.key === 'Enter' && addGame()}
                />
                <Button
                  onClick={addGame}
                  variant="cyber"
                  disabled={!newGameName.trim()}
                  className="shadow-neon"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Hinzufügen
                </Button>
              </div>
            </div>

            {/* Aktuelle Spiele */}
            <div className="space-y-3">
              {(config.allowedGames || []).map(game => (
                <div
                  key={game.id}
                  className="p-4 rounded-lg border border-purple-primary/30 hover:border-neon-purple transition-all duration-300 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{game.emoji}</span>
                      <span className="text-dark-text font-medium">{game.label}</span>
                      <span className="text-dark-muted text-sm">({game.id})</span>
                    </div>
                    <Button
                      onClick={() => removeGame(game.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-400 border-red-400/30 hover:border-red-400 hover:bg-red-400/20 group"
                    >
                      <Trash2 className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:text-red-300" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-dark-muted text-sm min-w-fit">Rolle:</label>
                    <Input
                      value={game.role || ''}
                      onChange={(e) => {
                        const updatedGames = (config.allowedGames || []).map(g => 
                          g.id === game.id ? { ...g, role: e.target.value } : g
                        );
                        setConfig(prev => ({ ...prev, allowedGames: updatedGames }));
                      }}
                      placeholder={`${game.label} Rolle (z.B. ${game.label} Player)`}
                      className="bg-dark-bg/50 border-purple-primary/20 text-dark-text text-sm focus:border-neon-purple"
                    />
                  </div>
                </div>
              ))}
              
              {(config.allowedGames || []).length === 0 && (
                <div className="text-center py-8 text-dark-muted">
                  <Smile className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Noch keine Spiele hinzugefügt
                </div>
              )}
            </div>
            </CardContent>
          </Card>

          {/* Verfügbare Plattformen */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                💻 Verfügbare Plattformen
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Wähle welche Gaming-Plattformen zur Auswahl stehen
              </CardDescription>
            </CardHeader>
            <CardContent>

            {/* Plattform hinzufügen */}
            <div className="mb-6 p-4 bg-purple-primary/10 border border-purple-primary/30 rounded-lg">
              <h4 className="text-dark-text font-medium mb-3">Neue Plattform hinzufügen:</h4>
              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    onClick={() => setPlatformEmojiPickerOpen(!platformEmojiPickerOpen)}
                    variant="outline"
                    className="h-10 w-12 text-xl border-purple-primary/30 hover:border-neon-purple"
                  >
                    {newPlatformEmoji}
                  </Button>
                  {platformEmojiPickerOpen && (
                    <div 
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in"
                      onClick={() => setPlatformEmojiPickerOpen(false)}
                    >
                      <div 
                        className="relative animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EmojiPicker
                          onEmojiSelect={(emoji) => {
                            setNewPlatformEmoji(emoji);
                            setPlatformEmojiPickerOpen(false);
                          }}
                          onClose={() => setPlatformEmojiPickerOpen(false)}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <Input
                  value={newPlatformName}
                  onChange={(e) => setNewPlatformName(e.target.value)}
                  placeholder="Plattform-Name (z.B. Steam Deck)"
                  className="flex-1 bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                  onKeyPress={(e) => e.key === 'Enter' && addPlatform()}
                />
                <Button
                  onClick={addPlatform}
                  variant="cyber"
                  disabled={!newPlatformName.trim()}
                  className="shadow-neon"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Hinzufügen
                </Button>
              </div>
            </div>

            {/* Aktuelle Plattformen */}
            <div className="space-y-3">
              {(config.allowedPlatforms || []).map(platform => (
                <div
                  key={platform.id}
                  className="p-4 rounded-lg border border-purple-primary/30 hover:border-neon-purple transition-all duration-300 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{platform.emoji}</span>
                      <span className="text-dark-text font-medium">{platform.label}</span>
                      <span className="text-dark-muted text-sm">({platform.id})</span>
                    </div>
                    <Button
                      onClick={() => removePlatform(platform.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-400 border-red-400/30 hover:border-red-400 hover:bg-red-400/20 group"
                    >
                      <Trash2 className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:text-red-300" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-dark-muted text-sm min-w-fit">Rolle:</label>
                    <Input
                      value={platform.role || ''}
                      onChange={(e) => {
                        const updatedPlatforms = (config.allowedPlatforms || []).map(p => 
                          p.id === platform.id ? { ...p, role: e.target.value } : p
                        );
                        setConfig(prev => ({ ...prev, allowedPlatforms: updatedPlatforms }));
                      }}
                      placeholder={`${platform.label} Rolle (z.B. ${platform.label} User)`}
                      className="bg-dark-bg/50 border-purple-primary/20 text-dark-text text-sm focus:border-neon-purple"
                    />
                  </div>
                </div>
              ))}
              
              {(config.allowedPlatforms || []).length === 0 && (
                <div className="text-center py-8 text-dark-muted">
                  <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Noch keine Plattformen hinzugefügt
                </div>
              )}
            </div>
            </CardContent>
          </Card>



          {/* Standard-Rollen */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                👥 Standard-Rollen
              </CardTitle>
              <CardDescription className="text-dark-muted">
                Rollen die automatisch zugewiesen werden
              </CardDescription>
            </CardHeader>
            <CardContent>

            {/* Rolle hinzufügen */}
            <div className="mb-6 p-4 bg-purple-primary/10 border border-purple-primary/30 rounded-lg">
              <h4 className="text-dark-text font-medium mb-3">Neue Rolle hinzufügen:</h4>
              <div className="flex gap-2">
                <Input
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Rollen-Name (z.B. Gamer)"
                  className="flex-1 bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
                  onKeyPress={(e) => e.key === 'Enter' && addRole()}
                />
                <Button
                  onClick={addRole}
                  variant="cyber"
                  disabled={!newRole.trim()}
                  className="shadow-neon"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Hinzufügen
                </Button>
              </div>
            </div>

            {/* Aktuelle Rollen */}
            <div className="space-y-2">
              {(config.defaultRoles || []).map(role => (
                <div
                  key={role}
                  className="flex items-center justify-between p-3 rounded-lg border border-purple-primary/30 hover:border-neon-purple transition-all duration-300"
                >
                  <span className="text-dark-text font-medium">{role}</span>
                  <Button
                    onClick={() => removeRole(role)}
                    variant="outline"
                    size="sm"
                    className="text-red-400 border-red-400/30 hover:border-red-400 hover:bg-red-400/20 group"
                  >
                    <Trash2 className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:text-red-300" />
                  </Button>
                </div>
              ))}
              
              {(config.defaultRoles || []).length === 0 && (
                <div className="text-center py-8 text-dark-muted">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Noch keine Standard-Rollen definiert
                </div>
              )}
            </div>

            {/* Info-Boxen */}
            <div className="mt-6 space-y-3">
              <div className="p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Standard-Rollen</span>
                </div>
                <p className="text-blue-300 text-sm mt-1">
                  Diese Rollen werden automatisch allen verifizierten Mitgliedern zugewiesen.
                </p>
              </div>

              <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                <div className="flex items-center gap-2 text-green-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Spielspezifische Rollen</span>
                </div>
                <p className="text-green-300 text-sm mt-1">
                  Bei jedem Spiel und jeder Plattform können individuelle Rollen konfiguriert werden. 
                  Nur wenn ein User ein bestimmtes Spiel auswählt, bekommt er die zugehörige Rolle.
                </p>
              </div>

              <div className="p-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                <div className="flex items-center gap-2 text-purple-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Beispiel</span>
                </div>
                <p className="text-purple-300 text-sm mt-1">
                  User wählt "Valorant" + "PC" → bekommt "Valorant Player" + "PC Gamer" + alle Standard-Rollen
                </p>
              </div>
            </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'statistics' && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-neon-blue" />
                  <div>
                    <div className="text-3xl font-bold text-white">{stats.totalVerifications}</div>
                    <div className="text-sm text-dark-muted">Gesamt Verifizierungen</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-green-400" />
                  <div>
                    <div className="text-3xl font-bold text-white">{stats.todayVerifications}</div>
                    <div className="text-sm text-dark-muted">Heute verifiziert</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                  <div>
                    <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                    <div className="text-sm text-dark-muted">Aktive User</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Beliebte Spiele */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <GamepadIcon className="w-6 h-6 text-neon-purple" />
                  Beliebte Spiele
                </CardTitle>
              </CardHeader>
              <CardContent>
                            <div className="space-y-4">
              {(stats.popularGames || []).slice(0, 5).map((game, index) => {
                const percentage = stats.totalUsers > 0 ? (game.count / stats.totalUsers) * 100 : 0;
                return (
                  <div key={game.game} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-dark-muted">#{index + 1}</span>
                        <span className="text-white">{getGameEmoji(game.game)} {game.game}</span>
                      </div>
                      <span className="text-neon-purple font-bold">{game.count}</span>
                    </div>
                    <div className="w-full bg-dark-surface rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-primary to-neon-purple h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              
              {(!stats.popularGames || stats.popularGames.length === 0) && (
                <div className="text-center py-6 text-dark-muted">
                  <GamepadIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Noch keine Spiele-Statistiken verfügbar</p>
                </div>
              )}
                </div>
              </CardContent>
            </Card>

            {/* Plattformen */}
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Monitor className="w-6 h-6 text-neon-blue" />
                  Plattformen
                </CardTitle>
              </CardHeader>
              <CardContent>
                            <div className="space-y-4">
              {(stats.platformStats || []).slice(0, 5).map((platform, index) => {
                const percentage = stats.totalUsers > 0 ? (platform.count / stats.totalUsers) * 100 : 0;
                return (
                  <div key={platform.platform} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-dark-muted">#{index + 1}</span>
                        <span className="text-white">{getPlatformEmoji(platform.platform)} {platform.platform.toUpperCase()}</span>
                      </div>
                      <span className="text-neon-blue font-bold">{platform.count}</span>
                    </div>
                    <div className="w-full bg-dark-surface rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-neon-blue h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              
              {(!stats.platformStats || stats.platformStats.length === 0) && (
                <div className="text-center py-6 text-dark-muted">
                  <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Noch keine Plattform-Statistiken verfügbar</p>
                </div>
              )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Users */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Users className="w-6 h-6 text-green-400" />
                Neueste Verifizierungen
              </CardTitle>
            </CardHeader>
            <CardContent>
                          <div className="space-y-3">
              {(stats.recentUsers || []).slice(0, 5).map((user) => (
                <div key={user.discordId} className="flex items-center gap-4 p-3 bg-dark-surface/50 rounded-lg">
                  <img 
                    src={getAvatarUrl(user)}
                    alt={user.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">{user.username}</div>
                    <div className="text-sm text-dark-muted">
                      {(user.games || []).map(game => getGameEmoji(game)).join(' ')} • {getPlatformEmoji(user.platform)} {user.platform.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-xs text-dark-muted">
                    {new Date(user.verificationDate).toLocaleDateString('de-DE')}
                  </div>
                </div>
              ))}
              
              {(!stats.recentUsers || stats.recentUsers.length === 0) && (
                <div className="text-center py-6 text-dark-muted">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Noch keine Verifizierungen vorhanden</p>
                </div>
              )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Filter Controls */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">Suche</label>
                  <Input
                    type="text"
                    placeholder="Username suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-dark-bg/70 border-purple-primary/30 text-white placeholder-dark-muted focus:border-neon-purple"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">Plattform</label>
                  <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                    <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-white focus:border-neon-purple">
                      <SelectValue placeholder="Alle Plattformen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Plattformen</SelectItem>
                      {uniquePlatforms.map(platform => (
                        <SelectItem key={platform} value={platform}>
                          {getPlatformEmoji(platform)} {platform.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">Sortierung</label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'username')}>
                    <SelectTrigger className="bg-dark-bg/70 border-purple-primary/30 text-white focus:border-neon-purple">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Nach Datum</SelectItem>
                      <SelectItem value="username">Nach Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={() => { loadUsers(); loadStats(); }}
                    variant="cyber"
                    className="w-full group"
                  >
                    <RefreshIcon className="w-5 h-5 mr-2" />
                    Aktualisieren
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text">
                Verifizierte User ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-surface">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">Spiele</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">Plattform</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">Rollen</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">Datum</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-dark-muted uppercase tracking-wider">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-primary/20">
                    {filteredUsers.map((user) => (
                      <tr key={user.discordId} className="hover:bg-dark-surface/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <img 
                              src={getAvatarUrl(user)} 
                              alt={user.username}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <div className="text-sm font-medium text-white">{user.username}</div>
                              <div className="text-sm text-dark-muted">#{user.discriminator || '0000'}</div>
                            </div>
                          </div>
                        </td>
                        
                                              <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(user.games || []).map((game) => (
                            <span key={game} className="text-sm bg-purple-primary/20 text-purple-light px-2 py-1 rounded">
                              {getGameEmoji(game)} {game}
                            </span>
                          ))}
                        </div>
                      </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-white">
                            {getPlatformEmoji(user.platform)} {user.platform.toUpperCase()}
                          </span>
                        </td>
                        
                                              <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(user.assignedRoles || []).map((role) => (
                            <span key={role} className="text-xs bg-green-400/20 text-green-400 px-2 py-1 rounded">
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                          {formatDate(user.verificationDate)}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => setSelectedUser(user)}
                              variant="outline"
                              size="sm"
                              className="text-neon-blue border-neon-blue/30 hover:bg-blue-500/20"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              onClick={() => deleteUser(user.discordId, user.username)}
                              disabled={deleting === user.discordId}
                              variant="outline"
                              size="sm"
                              className="text-red-400 border-red-400/30 hover:bg-red-500/20 disabled:opacity-50 group"
                            >
                              {deleting === user.discordId ? (
                                <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:text-red-300" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-dark-muted mx-auto mb-4" />
                    <p className="text-dark-muted">Keine User gefunden</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Detail Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto bg-dark-surface/95 backdrop-blur-xl border-purple-primary/30">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white">User Details</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <img 
                      src={getAvatarUrl(selectedUser)} 
                      alt={selectedUser.username}
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <h4 className="text-xl font-bold text-white">{selectedUser.username}</h4>
                      <p className="text-dark-muted">#{selectedUser.discriminator || '0000'}</p>
                      <p className="text-sm text-dark-muted">ID: {selectedUser.discordId}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                       <div>
                     <h5 className="font-medium text-white mb-2">🎮 Spiele</h5>
                     <div className="space-y-1">
                       {(selectedUser.games || []).map((game) => (
                         <div key={game} className="text-sm text-dark-text">
                           {getGameEmoji(game)} {game}
                         </div>
                       ))}
                     </div>
                   </div>
                    
                    <div>
                      <h5 className="font-medium text-white mb-2">💻 Plattform</h5>
                      <div className="text-sm text-dark-text">
                        {getPlatformEmoji(selectedUser.platform)} {selectedUser.platform.toUpperCase()}
                      </div>
                    </div>
                    
                                       <div>
                     <h5 className="font-medium text-white mb-2">👥 Rollen</h5>
                     <div className="space-y-1">
                       {(selectedUser.assignedRoles || []).map((role) => (
                         <div key={role} className="text-sm bg-green-400/20 text-green-400 px-2 py-1 rounded inline-block mr-1">
                           {role}
                         </div>
                       ))}
                     </div>
                   </div>
                    
                    <div>
                      <h5 className="font-medium text-white mb-2">📅 Verifiziert am</h5>
                      <div className="text-sm text-dark-text">
                        {formatDate(selectedUser.verificationDate)}
                      </div>
                    </div>
                    
                                         {selectedUser.agents && selectedUser.agents.length > 0 && (
                       <div className="md:col-span-2">
                         <h5 className="font-medium text-white mb-2">🎯 Valorant Agenten</h5>
                         <div className="flex flex-wrap gap-2">
                           {(selectedUser.agents || []).map((agent) => (
                             <span key={agent} className="text-sm bg-purple-primary/20 text-purple-light px-2 py-1 rounded">
                               {agent}
                             </span>
                           ))}
                         </div>
                       </div>
                     )}
                  </div>
                </CardContent>
                
                <div className="p-6 border-t border-purple-primary/30 flex justify-end">
                  <Button
                    onClick={() => setSelectedUser(null)}
                    variant="cyber"
                  >
                    Schließen
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Valorant Agenten Management */}
      {activeTab === 'valorant' && (
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-neon mb-4">
              🎯 Valorant Agenten Verwaltung
            </h2>
            <p className="text-dark-text max-w-2xl mx-auto">
              Verwalte alle Valorant Agenten und ihre Rollen-Kategorien. Änderungen werden sofort im Verification-System übernommen.
            </p>
          </div>

          {/* Loading State */}
          {loadingAgents ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-primary mb-4"></div>
              <p className="text-dark-muted">Lade Valorant Agenten...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Agent Rollen */}
              <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                    🛡️ Agent Rollen
                  </CardTitle>
                  <CardDescription className="text-dark-muted">
                    Rolle-Kategorien (Duelist, Sentinel, etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {valorantAgentRoles.map((role) => (
                      <div 
                        key={role.id}
                        className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg border border-purple-primary/20"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: role.color }}
                          />
                          <div>
                            <div className="font-medium text-dark-text">{role.display_name}</div>
                            <div className="text-sm text-dark-muted">
                              {valorantAgents.filter(a => a.role_type === role.role_name && a.enabled).length} Agenten
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            role.enabled 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {role.enabled ? 'Aktiv' : 'Deaktiviert'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

                             {/* Agenten Liste */}
               <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
                 <CardHeader>
                   <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                     👥 Alle Agenten ({valorantAgents.length})
                     <Button
                       onClick={() => setShowAddAgentModal(true)}
                       className="ml-auto bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 h-8"
                     >
                       + Neuer Agent
                     </Button>
                   </CardTitle>
                   <CardDescription className="text-dark-muted">
                     Verwaltung der individuellen Agenten
                   </CardDescription>
                 </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {valorantAgents
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((agent) => (
                        <div 
                          key={agent.id}
                          className="flex items-center justify-between p-3 bg-dark-bg/30 rounded-lg border border-purple-primary/10 hover:border-purple-primary/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{agent.icon || '🎯'}</div>
                            <div className="flex flex-col">
                              <div className="font-medium text-dark-text">{agent.display_name}</div>
                              <div className="text-sm text-dark-muted flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  agent.role_type === 'Duelist' ? 'bg-red-500/20 text-red-400' :
                                  agent.role_type === 'Sentinel' ? 'bg-green-500/20 text-green-400' :
                                  agent.role_type === 'Initiator' ? 'bg-purple-500/20 text-purple-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {agent.role_type}
                                </span>
                                <span>#{agent.sort_order}</span>
                              </div>
                            </div>
                          </div>
                                                     <div className="flex items-center gap-2">
                             <button
                               onClick={() => toggleAgentEnabled(agent)}
                               className={`px-2 py-1 rounded text-xs transition-colors ${
                                 agent.enabled 
                                   ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                                   : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                               }`}
                             >
                               {agent.enabled ? 'Aktiv' : 'Deaktiviert'}
                             </button>
                             <button
                               onClick={() => openEditAgent(agent)}
                               className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/20 transition-colors"
                               title="Bearbeiten"
                             >
                               ✏️
                             </button>
                             <button
                               onClick={() => deleteAgent(agent)}
                               className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/20 transition-colors"
                               title="Löschen"
                             >
                               🗑️
                             </button>
                           </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Statistiken */}
              <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow xl:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                    📊 Valorant Statistiken
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-neon-purple">{valorantAgents.length}</div>
                      <div className="text-sm text-dark-muted">Gesamt Agenten</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {valorantAgents.filter(a => a.enabled).length}
                      </div>
                      <div className="text-sm text-dark-muted">Aktive Agenten</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{valorantAgentRoles.length}</div>
                      <div className="text-sm text-dark-muted">Rollen-Typen</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {usersData.users.filter(u => u.agents && u.agents.length > 0).length}
                      </div>
                      <div className="text-sm text-dark-muted">User mit Agenten</div>
                    </div>
                  </div>

                  {/* Agenten nach Rollen */}
                  <div className="mt-8">
                    <h4 className="font-medium text-dark-text mb-4">Agenten nach Rollen:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {valorantAgentRoles.map((role) => {
                        const roleAgents = valorantAgents.filter(a => a.role_type === role.role_name && a.enabled);
                        return (
                          <div key={role.id} className="p-4 bg-dark-bg/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: role.color }}
                              />
                              <span className="font-medium text-dark-text">{role.display_name}</span>
                              <span className="text-sm text-dark-muted">({roleAgents.length})</span>
                            </div>
                            <div className="text-sm text-dark-muted">
                              {roleAgents.map(a => a.display_name).join(', ') || 'Keine aktiven Agenten'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Refresh Button */}
          <div className="text-center">
            <Button
              onClick={loadValorantAgents}
              disabled={loadingAgents}
              className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2 mx-auto"
            >
              <RefreshIcon animate={loadingAgents} />
              <span>{loadingAgents ? 'Lädt...' : 'Agenten neu laden'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Agent Modal */}
      {showAddAgentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-purple-glow">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingAgent ? '✏️ Agent bearbeiten' : '➕ Neuen Agent hinzufügen'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-dark-text font-medium mb-2">Agent Icon:</label>
                <div className="flex gap-2">
                  <div className="relative">
                    <Button
                      onClick={() => setAgentEmojiPickerOpen(!agentEmojiPickerOpen)}
                      variant="outline"
                      className="h-10 w-12 text-xl border-purple-primary/30 hover:border-neon-purple"
                    >
                      {newAgent.icon}
                    </Button>
                    {agentEmojiPickerOpen && (
                      <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in"
                        onClick={() => setAgentEmojiPickerOpen(false)}
                      >
                        <div 
                          className="relative animate-scale-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <EmojiPicker
                            onEmojiSelect={(emoji) => {
                              setNewAgent(prev => ({ ...prev, icon: emoji }));
                              setAgentEmojiPickerOpen(false);
                            }}
                            onClose={() => setAgentEmojiPickerOpen(false)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-dark-muted text-sm flex items-center">
                    Klicke um ein Emoji zu wählen
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-dark-text font-medium mb-2">Agent Name (technisch):</label>
                <input
                  type="text"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-dark-bg/70 border border-purple-primary/30 rounded-lg px-3 py-2 text-dark-text focus:border-neon-purple"
                  placeholder="z.B. Jett"
                />
              </div>
              
              <div>
                <label className="block text-dark-text font-medium mb-2">Anzeigename:</label>
                <input
                  type="text"
                  value={newAgent.display_name}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, display_name: e.target.value }))}
                  className="w-full bg-dark-bg/70 border border-purple-primary/30 rounded-lg px-3 py-2 text-dark-text focus:border-neon-purple"
                  placeholder="z.B. Jett"
                />
              </div>
              
              <div>
                <label className="block text-dark-text font-medium mb-2">UUID (optional):</label>
                <input
                  type="text"
                  value={newAgent.uuid}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, uuid: e.target.value }))}
                  className="w-full bg-dark-bg/70 border border-purple-primary/30 rounded-lg px-3 py-2 text-dark-text focus:border-neon-purple"
                  placeholder="z.B. a3bfb853-43b2-7238-a4f1-ad90e9e46bcc"
                />
              </div>
              
              <div>
                <label className="block text-dark-text font-medium mb-2">Rollen-Typ:</label>
                <select
                  value={newAgent.role_type}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, role_type: e.target.value }))}
                  className="w-full bg-dark-bg/70 border border-purple-primary/30 rounded-lg px-3 py-2 text-dark-text focus:border-neon-purple"
                >
                  <option value="Duelist">Duelist</option>
                  <option value="Sentinel">Sentinel</option>
                  <option value="Initiator">Initiator</option>
                  <option value="Controller">Controller</option>
                </select>
              </div>
              
              <div>
                <label className="block text-dark-text font-medium mb-2">Sortierreihenfolge:</label>
                <input
                  type="number"
                  value={newAgent.sort_order}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-dark-bg/70 border border-purple-primary/30 rounded-lg px-3 py-2 text-dark-text focus:border-neon-purple"
                  placeholder="0"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="agentEnabled"
                  checked={newAgent.enabled}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="agentEnabled" className="text-dark-text">Agent aktiviert</label>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <Button
                onClick={() => {
                  setShowAddAgentModal(false);
                  setEditingAgent(null);
                  setNewAgent({
                    name: '',
                    display_name: '',
                    uuid: '',
                    role_type: 'Duelist',
                    enabled: true,
                    sort_order: 0,
                    icon: '🎯'
                  });
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Abbrechen
              </Button>
              <Button
                onClick={saveAgent}
                disabled={!newAgent.name || !newAgent.display_name}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {editingAgent ? 'Aktualisieren' : 'Hinzufügen'}
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
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse hover:animate-bounce cursor-default">
                <Trash2 className="w-8 h-8 text-red-400 animate-bounce" />
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-2">
                Verifizierung löschen
              </h3>
              
              {/* Message */}
              <p className="text-dark-text mb-2">
                Möchtest du wirklich die Verifizierung von
              </p>
              <p className="text-neon-purple font-bold text-lg mb-4">
                "{deleteModal.username}"
              </p>
              <p className="text-dark-muted mb-6 text-sm">
                ⚠️ Dies entfernt auch alle zugewiesenen Rollen!<br/>
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              
              {/* Buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setDeleteModal({ show: false, userId: '', username: '' })}
                  className="bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 hover:border-gray-500 transition-all duration-200"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={confirmDelete}
                  disabled={deleting === deleteModal.userId}
                  className="bg-red-600 hover:bg-red-700 text-white hover:scale-105 transition-all duration-200 group"
                >
                  {deleting === deleteModal.userId ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Lösche...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                      Löschen
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Emoji Picker Overlays */}
      {messageEmojiPickerOpen === 'welcomeMessage' && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in"
          onClick={() => setMessageEmojiPickerOpen(null)}
        >
          <div 
            className="relative animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setConfig(prev => ({ ...prev, welcomeMessage: prev.welcomeMessage + emoji }));
                setMessageEmojiPickerOpen(null);
              }}
              onClose={() => setMessageEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {messageEmojiPickerOpen === 'newStep' && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in"
          onClick={() => setMessageEmojiPickerOpen(null)}
        >
          <div 
            className="relative animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setNewStep(prev => prev + emoji);
                setMessageEmojiPickerOpen(null);
              }}
              onClose={() => setMessageEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default VerificationSettings; 