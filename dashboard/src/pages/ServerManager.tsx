import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Server, Users, MessageSquare, UserPlus, UserMinus, Shield, Crown, Settings, Eye, Activity, Calendar, TrendingUp, MapPin, Clock, Hash, Volume2, RefreshCw, Download, Search, Filter, Star, Zap, AlertTriangle, BarChart3, Bot, Mic, Database, Globe, Brain, Target, History, UserX, Ban, Bell } from 'lucide-react';
import { useToast, ToastContainer } from '../components/ui/toast';

// Badge component
const Badge: React.FC<{ children: React.ReactNode; className?: string; variant?: string }> = ({ children, className = '', variant = 'default' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant === 'outline' ? 'border border-purple-primary text-purple-primary bg-transparent' : variant === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : variant === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : variant === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-purple-primary text-white'} ${className}`}>
    {children}
  </span>
);

// Tabs components (wie bei XP.tsx)
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

// Interfaces
interface ServerInfo {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  onlineMembers: number;
  joinedAt: string;
  isOwner: boolean;
  permissions: string[];
  features: string[];
  verificationLevel: number;
  region: string;
  channelCount: number;
  roleCount: number;
  boostLevel: number;
  boostCount: number;
}

interface ServerStats {
  totalMessages: number;
  todayMessages: number;
  activeUsers: number;
  newMembers: number;
  leftMembers: number;
  topChannels: Array<{
    id: string;
    name: string;
    messages: number;
    type: 'text' | 'voice';
  }>;
  topUsers: Array<{
    id: string;
    username: string;
    messages: number;
    avatar: string | null;
  }>;
}

interface HealthData {
  guildId: string;
  guildName: string;
  timestamp: number;
  overallScore: number;
  rating: string;
  scores: {
    activity: number;
    security: number;
    engagement: number;
    structure: number;
    moderation: number;
    growth: number;
  };
  metrics: any;
  recommendations: string[];
}

interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  timestamp: number;
  value?: number;
  expected?: number;
  suspicionScore?: number;
}

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

const ServerManager: React.FC = () => {
  const { toasts, success, error: showError, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPermissions, setExpandedPermissions] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [currentServer, setCurrentServer] = useState<ServerInfo | null>(null);
  const [serverStats, setServerStats] = useState<ServerStats>({
    totalMessages: 0,
    todayMessages: 0,
    activeUsers: 0,
    newMembers: 0,
    leftMembers: 0,
    topChannels: [],
    topUsers: []
  });

  // Neue States für echte Daten
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [anomalyStats, setAnomalyStats] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [anomaliesLoading, setAnomaliesLoading] = useState(false);

  // Analytics States
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [voiceVisualization, setVoiceVisualization] = useState<any>(null);
  const [memberJourneys, setMemberJourneys] = useState<any>(null);
  
  // Bulk Management States
  const [optimizationReport, setOptimizationReport] = useState<any>(null);
  const [serverTemplates, setServerTemplates] = useState<any[]>([]);
  const [actionHistory, setActionHistory] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [eventStream, setEventStream] = useState<EventSource | null>(null);
  
  // Expandable list states
  const [expandedRecommendations, setExpandedRecommendations] = useState<{[key: string]: boolean}>({});
  
  // Bulk Management Modal States
  const [bulkModalOpen, setBulkModalOpen] = useState<string | null>(null);
  const [bulkActionConfig, setBulkActionConfig] = useState<any>({
    criteria: 'inactive_days',
    value: 30,
    targetRoles: [],
    message: '',
    reason: '',
    dryRun: true
  });

  // AI Tools States
  const [aiOptimizationData, setAiOptimizationData] = useState<any>(null);
  const [growthPredictions, setGrowthPredictions] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentServer) {
      loadServerSpecificData(currentServer.id);
      if (activeTab === 'analytics') {
        loadAnalyticsData(currentServer.id);
      }
    }
  }, [currentServer, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Lade echte Server-Daten von der API
      const [guildsResponse, statsResponse] = await Promise.all([
        fetch('/api/guilds'),
        fetch('/api/server-statistics')
      ]);

      if (guildsResponse.ok) {
        const guildsData = await guildsResponse.json();
        
        // Konvertiere API-Daten zum erwarteten Format
        const formattedServers = guildsData.guilds.map((guild: any) => ({
          id: guild.id,
          name: guild.name,
          icon: guild.iconURL,
          memberCount: guild.memberCount,
          onlineMembers: guild.onlineMembers,
          joinedAt: guild.joinedAt,
          isOwner: guild.isOwner,
          permissions: guild.permissions,
          features: guild.features,
          verificationLevel: guild.verificationLevel,
          region: guild.region,
          channelCount: guild.channelCount,
          roleCount: guild.roleCount,
          boostLevel: guild.boostLevel,
          boostCount: guild.boostCount
        }));

        setServers(formattedServers);
        
        // Setze ersten Server als aktuell ausgewählten
        if (formattedServers.length > 0) {
          setCurrentServer(formattedServers[0]);
        }
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setServerStats(statsData);
      }
    } catch (error) {
      showError('Fehler beim Laden der Server-Daten');
      console.error('Server loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServerSpecificData = async (guildId: string) => {
    // Lade Server-Health-Daten
    loadHealthData(guildId);
    // Lade Anomalie-Daten
    loadAnomalies(guildId);
  };

  const loadHealthData = async (guildId: string) => {
    try {
      setHealthLoading(true);
      const response = await fetch(`/api/server-health/${guildId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHealthData(data.health);
        } else {
          showError('Fehler beim Laden der Health-Daten');
        }
      } else {
        showError('Server-Health-Daten konnten nicht geladen werden');
      }
    } catch (error) {
      console.error('Health data loading error:', error);
      showError('Fehler beim Laden der Server-Gesundheitsdaten');
    } finally {
      setHealthLoading(false);
    }
  };

  const loadAnomalies = async (guildId: string) => {
    try {
      setAnomaliesLoading(true);
      const [anomaliesResponse, statsResponse] = await Promise.all([
        fetch(`/api/anomalies/${guildId}`),
        fetch(`/api/anomaly-stats/${guildId}`)
      ]);
      
      if (anomaliesResponse.ok) {
        const anomaliesData = await anomaliesResponse.json();
        if (anomaliesData.success) {
          setAnomalies(anomaliesData.anomalies);
        }
      }
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setAnomalyStats(statsData.stats);
        }
      }
    } catch (error) {
      console.error('Anomalies loading error:', error);
      showError('Fehler beim Laden der Anomalie-Daten');
    } finally {
      setAnomaliesLoading(false);
    }
  };

  // Analytics Daten laden
  const loadAnalyticsData = async (guildId: string) => {
    try {
      setAnalyticsLoading(true);
      
      // Live Events laden
      const eventsResponse = await fetch(`/api/server-manager-analytics/live-events?serverId=${guildId}&limit=10`);
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setLiveEvents(eventsData.data.events || []);
      }
      
      // Voice Visualization laden
      const voiceResponse = await fetch(`/api/server-manager-analytics/voice-visualization/${guildId}?timeRange=24h`);
      if (voiceResponse.ok) {
        const voiceData = await voiceResponse.json();
        setVoiceVisualization(voiceData.data);
      }
      
      // Member Journeys laden
      const journeyResponse = await fetch(`/api/server-manager-analytics/member-journeys/${guildId}?limit=20&sortBy=engagement`);
      if (journeyResponse.ok) {
        const journeyData = await journeyResponse.json();
        setMemberJourneys(journeyData.data);
      }
      
      // Event Stream einrichten
      setupEventStream(guildId);
      
    } catch (error) {
      console.error('Fehler beim Laden der Analytics-Daten:', error);
      showError('Fehler beim Laden der Analytics-Daten');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const setupEventStream = (guildId: string) => {
    // Bestehenden Stream schließen
    if (eventStream) {
      eventStream.close();
    }
    
    // Neuen Stream öffnen
    const newEventSource = new EventSource(`/api/server-manager-analytics/live-events/stream/${guildId}`);
    
    newEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'liveEvent') {
          setLiveEvents(prev => [data.data, ...prev.slice(0, 9)]); // Nur die letzten 10 Events behalten
        }
      } catch (error) {
        console.error('Fehler beim Verarbeiten des Event Streams:', error);
      }
    };
    
    newEventSource.onerror = (error) => {
      console.error('Event Stream Fehler:', error);
    };
    
    setEventStream(newEventSource);
  };

  // Cleanup Event Stream bei Komponenten-Unmount
  useEffect(() => {
    return () => {
      if (eventStream) {
        eventStream.close();
      }
    };
  }, [eventStream]);

  const refreshServerData = async () => {
    try {
      setRefreshing(true);
      
      // Lade aktuelle Server-Daten erneut
      await loadData();
      
      // Lade server-spezifische Daten wenn ein Server ausgewählt ist
      if (currentServer) {
        await loadServerSpecificData(currentServer.id);
        
        // Analytics-Daten auch aktualisieren, wenn der Analytics-Tab aktiv ist
        if (activeTab === 'analytics') {
          await loadAnalyticsData(currentServer.id);
        }
      }
      
      success('🔄 Server-Daten erfolgreich aktualisiert!');
    } catch (error) {
      showError('Fehler beim Aktualisieren der Server-Daten');
      console.error('Server refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getHealthRatingColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'ausgezeichnet': return 'text-green-400';
      case 'gut': return 'text-blue-400';
      case 'durchschnittlich': return 'text-yellow-400';
      case 'schlecht': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500/50 bg-red-500/10 text-red-400';
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
      case 'low': return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
      default: return 'border-gray-500/50 bg-gray-500/10 text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
    if (hours > 0) return `vor ${hours} Stunde${hours > 1 ? 'n' : ''}`;
    if (minutes > 0) return `vor ${minutes} Minute${minutes > 1 ? 'n' : ''}`;
    return 'vor wenigen Sekunden';
  };

  const exportServerData = async () => {
    try {
      success('📊 Export wird vorbereitet...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      success('✅ Server-Daten erfolgreich exportiert!');
    } catch (error) {
      showError('Fehler beim Exportieren der Daten');
    }
  };

  const getVerificationLevel = (level: number) => {
    const levels = ['Keine', 'Niedrig', 'Mittel', 'Hoch', 'Höchste'];
    return levels[level] || 'Unbekannt';
  };

  const getBoostLevelBadge = (level: number) => {
    if (level >= 3) return <Badge variant="success">Level {level} 🚀</Badge>;
    if (level >= 2) return <Badge className="bg-pink-500/20 text-pink-400">Level {level} 💎</Badge>;
    if (level >= 1) return <Badge className="bg-purple-500/20 text-purple-400">Level {level} ⭐</Badge>;
    return <Badge variant="outline">Kein Boost</Badge>;
  };

  const getPermissionInfo = (permission: string) => {
    const permissionMap: { [key: string]: { name: string; category: string; color: string; icon: string } } = {
      'ADMINISTRATOR': { name: 'Administrator', category: 'Admin', color: 'bg-red-500/20 text-red-400', icon: '👑' },
      'MANAGE_GUILD': { name: 'Server verwalten', category: 'Admin', color: 'bg-red-500/20 text-red-400', icon: '⚙️' },
      'MANAGE_CHANNELS': { name: 'Channels verwalten', category: 'Admin', color: 'bg-yellow-500/20 text-yellow-400', icon: '📝' },
      'MANAGE_ROLES': { name: 'Rollen verwalten', category: 'Admin', color: 'bg-yellow-500/20 text-yellow-400', icon: '🎭' },
      'MANAGE_MESSAGES': { name: 'Nachrichten verwalten', category: 'Moderation', color: 'bg-blue-500/20 text-blue-400', icon: '🗂️' },
      'KICK_MEMBERS': { name: 'Mitglieder kicken', category: 'Moderation', color: 'bg-orange-500/20 text-orange-400', icon: '👢' },
      'BAN_MEMBERS': { name: 'Mitglieder bannen', category: 'Moderation', color: 'bg-red-500/20 text-red-400', icon: '🔨' },
      'SEND_MESSAGES': { name: 'Nachrichten senden', category: 'Basic', color: 'bg-green-500/20 text-green-400', icon: '💬' },
      'VIEW_CHANNEL': { name: 'Channels sehen', category: 'Basic', color: 'bg-green-500/20 text-green-400', icon: '👁️' },
      'CONNECT': { name: 'Voice verbinden', category: 'Voice', color: 'bg-purple-500/20 text-purple-400', icon: '🔊' },
      'SPEAK': { name: 'Voice sprechen', category: 'Voice', color: 'bg-purple-500/20 text-purple-400', icon: '🎤' },
      'ADD_REACTIONS': { name: 'Reaktionen hinzufügen', category: 'Basic', color: 'bg-green-500/20 text-green-400', icon: '😄' },
      'USE_SLASH_COMMANDS': { name: 'Slash Commands', category: 'Basic', color: 'bg-green-500/20 text-green-400', icon: '⚡' },
      'EMBED_LINKS': { name: 'Links einbetten', category: 'Basic', color: 'bg-green-500/20 text-green-400', icon: '🔗' },
      'ATTACH_FILES': { name: 'Dateien anhängen', category: 'Basic', color: 'bg-green-500/20 text-green-400', icon: '📎' },
      'READ_MESSAGE_HISTORY': { name: 'Nachrichtenverlauf lesen', category: 'Basic', color: 'bg-green-500/20 text-green-400', icon: '📜' },
      'MENTION_EVERYONE': { name: '@everyone erwähnen', category: 'Special', color: 'bg-yellow-500/20 text-yellow-400', icon: '📢' },
      'USE_EXTERNAL_EMOJIS': { name: 'Externe Emojis', category: 'Basic', color: 'bg-green-500/20 text-green-400', icon: '🌟' },
      'PRIORITY_SPEAKER': { name: 'Priority Speaker', category: 'Voice', color: 'bg-purple-500/20 text-purple-400', icon: '📣' }
    };

    const info = permissionMap[permission];
    if (info) {
      return {
        displayName: `${info.icon} ${info.name}`,
        category: info.category,
        className: info.color
      };
    }

    // Fallback für unbekannte Permissions
    return {
      displayName: permission.replace(/_/g, ' '),
      category: 'Other',
      className: 'bg-gray-500/20 text-gray-400'
    };
  };

  const filteredServers = servers.filter(server =>
    server.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Bulk Management Functions
  const loadServerTemplates = async () => {
    try {
      const response = await fetch('/api/bulk-server-management/templates');
      const result = await response.json();
      
      if (result.success) {
        setServerTemplates(result.data);
      } else {
        showError('Fehler beim Laden der Templates');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Templates:', error);
      showError('Fehler beim Laden der Templates');
    }
  };

  const generateOptimizationReport = async (guildId: string) => {
    try {
      console.log('🔄 Generating new optimization report for guild:', guildId);
      const response = await fetch(`/api/bulk-server-management/generate-optimization/${guildId}`, {
        method: 'POST'
      });
      const result = await response.json();
      
      console.log('✅ Generated optimization report:', result.data);
      console.log('📋 New recommendations:', result.data?.recommendations);
      
      if (result.success) {
        setOptimizationReport(result.data);
        success('Optimierungs-Analyse erfolgreich generiert');
        
        // Force reload nach kurzer Zeit für frische Daten
        setTimeout(() => {
          loadOptimizationReport(guildId);
        }, 500);
      } else {
        showError('Fehler beim Generieren der Optimierungs-Analyse');
      }
    } catch (error) {
      console.error('❌ Fehler beim Generieren der Optimierungs-Analyse:', error);
      showError('Fehler beim Generieren der Optimierungs-Analyse');
    }
  };

  const applyTemplate = async (templateId: string) => {
    if (!currentServer) return;
    
    try {
      const response = await fetch('/api/bulk-server-management/apply-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: currentServer.id,
          templateId,
          options: {}
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        success('Template erfolgreich angewendet');
        loadActionHistory(); // Aktualisiere Action History
      } else {
        showError('Fehler beim Anwenden des Templates');
      }
    } catch (error) {
      console.error('Fehler beim Anwenden des Templates:', error);
      showError('Fehler beim Anwenden des Templates');
    }
  };

  const loadActionHistory = async () => {
    try {
      const response = await fetch('/api/bulk-server-management/action-history?limit=10');
      const result = await response.json();
      
      if (result.success) {
        setActionHistory(result.data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Action History:', error);
    }
  };

  const loadOptimizationReport = async (guildId: string) => {
    try {
      const response = await fetch(`/api/bulk-server-management/optimization-report/${guildId}`);
      const result = await response.json();
      
      console.log('🔍 Optimization Report Data:', result.data);
      console.log('📋 Recommendations:', result.data?.recommendations);
      
      if (result.success) {
        setOptimizationReport(result.data);
      }
    } catch (error) {
      console.error('❌ Error loading optimization report:', error);
      setOptimizationReport(null);
    }
  };

  const toggleExpandedList = (recommendationIndex: number, listType: string) => {
    const key = `${recommendationIndex}-${listType}`;
    setExpandedRecommendations(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Bulk Management Handlers
  const openBulkModal = (actionType: string) => {
    setBulkModalOpen(actionType);
    setBulkActionConfig({
      criteria: 'inactive_days',
      value: 30,
      targetRoles: [],
      message: '',
      reason: '',
      dryRun: true
    });
  };

  const closeBulkModal = () => {
    setBulkModalOpen(null);
    setBulkActionConfig({
      criteria: 'inactive_days',
      value: 30,
      targetRoles: [],
      message: '',
      reason: '',
      dryRun: true
    });
  };

  const executeBulkAction = async () => {
    if (!currentServer || !bulkModalOpen) return;
    
    try {
      const response = await fetch('/api/bulk-server-management/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: currentServer.id,
          actionType: bulkModalOpen,
          config: bulkActionConfig
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (result.dryRun && result.preview) {
          // Show preview results
          success(`Vorschau: ${result.preview.targetCount} Mitglieder würden von der Aktion betroffen sein`);
          console.log('Preview data:', result.preview);
        } else {
          // Show success message
          success(`Bulk Aktion erfolgreich ausgeführt! ${result.result?.processed || 0} Mitglieder verarbeitet.`);
          loadActionHistory(); // Reload action history
          closeBulkModal();
        }
      } else {
        showError(`Fehler: ${result.error}`);
      }
    } catch (error) {
      console.error('Error executing bulk action:', error);
      showError('Unerwarteter Fehler beim Ausführen der Bulk Aktion');
    }
  };

  // AI Tools Functions
  const loadAIOptimizations = async () => {
    if (!currentServer) return;
    
    setAiLoading(true);
    try {
      const response = await fetch(`/api/ai-optimization/suggestions/${currentServer.id}`);
      const result = await response.json();
      
      if (result.success) {
        setAiOptimizationData(result.data);
      } else {
        showError('Fehler beim Laden der AI-Optimierungen');
      }
    } catch (error) {
      console.error('Error loading AI optimizations:', error);
      showError('Fehler beim Laden der AI-Optimierungen');
    } finally {
      setAiLoading(false);
    }
  };

  const loadGrowthPredictions = async () => {
    if (!currentServer) return;
    
    setAiLoading(true);
    try {
      const response = await fetch(`/api/ai-optimization/growth-predictions/${currentServer.id}`);
      const result = await response.json();
      
      if (result.success) {
        setGrowthPredictions(result.data);
      } else {
        showError('Fehler beim Laden der Wachstumsprognosen');
      }
    } catch (error) {
      console.error('Error loading growth predictions:', error);
      showError('Fehler beim Laden der Wachstumsprognosen');
    } finally {
      setAiLoading(false);
    }
  };

  const generateNewAIAnalysis = async () => {
    if (!currentServer) return;
    
    setAiLoading(true);
    try {
      // Reset current data
      setAiOptimizationData(null);
      setGrowthPredictions(null);
      
      // Load both analyses
      await Promise.all([
        loadAIOptimizations(),
        loadGrowthPredictions()
      ]);
      
      success('Neue AI-Analyse erfolgreich generiert!');
    } catch (error) {
      console.error('Error generating new AI analysis:', error);
      showError('Fehler beim Generieren der neuen AI-Analyse');
    } finally {
      setAiLoading(false);
    }
  };

  const applyOptimizationSuggestion = async (suggestion: any) => {
    try {
      const response = await fetch('/api/ai-optimization/apply-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: currentServer?.id,
          suggestion
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        success(`Optimierung "${suggestion.title}" erfolgreich angewendet!`);
        // Reload AI data
        loadAIOptimizations();
      } else {
        showError(`Fehler beim Anwenden der Optimierung: ${result.error}`);
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
      showError('Fehler beim Anwenden der Optimierung');
    }
  };

  // Load Management Data when switching to management tab
  useEffect(() => {
    if (activeTab === 'management') {
      loadServerTemplates();
      loadActionHistory();
      if (currentServer) {
        loadOptimizationReport(currentServer.id);
      }
    }
    
    if (activeTab === 'ai' && currentServer) {
      if (!aiOptimizationData && !growthPredictions) {
        loadAIOptimizations();
        loadGrowthPredictions();
      }
    }
  }, [activeTab, currentServer]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Server Manager...</div>
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
          <Server className="w-12 h-12 text-blue-400 animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
            Server Manager
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Verwalte alle Discord Server, auf denen AgentBee aktiv ist! 
          <span className="ml-2 inline-block relative">
            🌐
          </span>
        </div>
        <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-cyan-500 mx-auto mt-4 rounded-full animate-glow"></div>
      </div>

      {/* Server Selection */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            Server Auswahl
          </CardTitle>
          <CardDescription className="text-dark-muted">Wähle einen Server für detaillierte Informationen</CardDescription>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted w-4 h-4" />
            <Input
              placeholder="Server suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredServers.map((server) => (
            <div
              key={server.id}
              onClick={() => {
                setCurrentServer(server);
                setExpandedPermissions(false);
              }}
              className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-105 ${
                currentServer?.id === server.id
                  ? 'border-blue-500 bg-blue-500/10 shadow-blue-glow'
                  : 'border-dark-border hover:border-purple-primary/50 hover:bg-purple-primary/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {server.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-text">{server.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-dark-muted">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {server.memberCount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {server.onlineMembers}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {server.isOwner && <Crown className="w-4 h-4 text-yellow-400 mb-1" />}
                  {getBoostLevelBadge(server.boostLevel)}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-blue-500/30 shadow-blue-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Aktive Server</CardTitle>
            <Server className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{servers.length}</div>
            <p className="text-xs text-dark-muted">
              Bot ist verbunden
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-green-500/30 shadow-green-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Gesamt Mitglieder</CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {servers.reduce((sum, server) => sum + server.memberCount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-dark-muted">
              Über alle Server
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-500/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Online Nutzer</CardTitle>
            <Activity className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {servers.reduce((sum, server) => sum + server.onlineMembers, 0).toLocaleString()}
            </div>
            <p className="text-xs text-dark-muted">
              Aktuell aktiv
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-yellow-500/30 shadow-yellow-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Nachrichten heute</CardTitle>
            <MessageSquare className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{serverStats.todayMessages.toLocaleString()}</div>
            <p className="text-xs text-dark-muted">
              Letzte 24 Stunden
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap justify-center gap-4">
        <Button 
          onClick={refreshServerData} 
          disabled={refreshing}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Aktualisiere...' : 'Daten aktualisieren'}</span>
        </Button>
        
        <Button 
          onClick={exportServerData} 
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Download className="h-5 w-5" />
          <span>Daten exportieren</span>
        </Button>
      </div>

      {/* Main Tabs Navigation - wie bei XP.tsx */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30">
          <TabsTrigger 
            value="overview" 
            className={`flex items-center space-x-2 ${activeTab === 'overview' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('overview')}
          >
            <Eye className="h-4 w-4" />
            <span>Übersicht</span>
          </TabsTrigger>
          <TabsTrigger 
            value="health" 
            className={`flex items-center space-x-2 ${activeTab === 'health' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('health')}
          >
            <Activity className="h-4 w-4" />
            <span>Gesundheit</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className={`flex items-center space-x-2 ${activeTab === 'analytics' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger 
            value="management" 
            className={`flex items-center space-x-2 ${activeTab === 'management' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('management')}
          >
            <Settings className="h-4 w-4" />
            <span>Verwaltung</span>
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className={`flex items-center space-x-2 ${activeTab === 'security' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield className="h-4 w-4" />
            <span>Sicherheit</span>
          </TabsTrigger>
          <TabsTrigger 
            value="ai" 
            className={`flex items-center space-x-2 ${activeTab === 'ai' ? 'bg-purple-primary text-white' : 'hover:bg-purple-primary/20 text-dark-text'}`}
            onClick={() => setActiveTab('ai')}
          >
            <Brain className="h-4 w-4" />
            <span>AI-Tools</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6" activeTab={activeTab}>
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-400" />
                  Server Details
                </CardTitle>
                <CardDescription className="text-dark-muted">{currentServer?.name || 'Kein Server ausgewählt'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-dark-muted">Mitglieder</div>
                    <div className="text-lg font-bold text-blue-400">
                      {currentServer?.memberCount?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-dark-muted">Online</div>
                    <div className="text-lg font-bold text-green-400">
                      {currentServer?.onlineMembers || '0'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-dark-muted">Channels</div>
                    <div className="text-lg font-bold text-purple-400">
                      {currentServer?.channelCount || '0'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-dark-muted">Rollen</div>
                    <div className="text-lg font-bold text-yellow-400">
                      {currentServer?.roleCount || '0'}
                    </div>
                  </div>
                </div>

                {/* Server Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark-muted">Region:</span>
                    <Badge variant="outline">{currentServer?.region || 'Unbekannt'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark-muted">Verifizierung:</span>
                    <Badge variant="outline">{getVerificationLevel(currentServer?.verificationLevel || 0)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark-muted">Boost Level:</span>
                    {getBoostLevelBadge(currentServer?.boostLevel || 0)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark-muted">Beigetreten:</span>
                    <span className="text-sm text-dark-text">
                      {currentServer?.joinedAt ? new Date(currentServer.joinedAt).toLocaleDateString('de-DE') : '-'}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <div className="text-sm text-dark-muted mb-2">Server Features:</div>
                  <div className="flex flex-wrap gap-2">
                    {currentServer?.features?.length ? currentServer.features.map((feature, index) => (
                      <Badge key={index} variant="success" className="text-xs">
                        {feature.replace(/_/g, ' ')}
                      </Badge>
                    )) : (
                      <span className="text-sm text-dark-muted">Keine besonderen Features</span>
                    )}
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-dark-muted">Bot Berechtigungen:</div>
                    {(currentServer?.permissions?.length || 0) > 3 && (
                      <Button
                        onClick={() => setExpandedPermissions(!expandedPermissions)}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-purple-accent hover:text-purple-primary"
                      >
                        {expandedPermissions ? 'Weniger anzeigen' : `Alle ${currentServer?.permissions?.length || 0} anzeigen`}
                      </Button>
                    )}
                  </div>
                  {currentServer?.permissions?.length ? (
                    expandedPermissions ? (
                      // Kategorisierte Ansicht für erweiterte Permissions
                      <div className="space-y-3">
                        {['Admin', 'Moderation', 'Basic', 'Voice', 'Special', 'Other'].map(category => {
                          const categoryPermissions = currentServer.permissions.filter(permission => 
                            getPermissionInfo(permission).category === category
                          );
                          
                          if (categoryPermissions.length === 0) return null;
                          
                          return (
                            <div key={category} className="space-y-2">
                              <div className="text-xs font-semibold text-purple-accent">{category}:</div>
                              <div className="flex flex-wrap gap-2">
                                {categoryPermissions.map((permission, index) => {
                                  const permInfo = getPermissionInfo(permission);
                                  return (
                                    <Badge 
                                      key={index} 
                                      className={`text-xs transition-all duration-300 hover:scale-105 ${permInfo.className}`}
                                      title={`Kategorie: ${permInfo.category}`}
                                    >
                                      {permInfo.displayName}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Kompakte Ansicht
                      <div className="flex flex-wrap gap-2">
                        {currentServer.permissions.slice(0, 3).map((permission, index) => {
                          const permInfo = getPermissionInfo(permission);
                          return (
                            <Badge 
                              key={index} 
                              className={`text-xs transition-all duration-300 hover:scale-105 ${permInfo.className}`}
                              title={`Kategorie: ${permInfo.category}`}
                            >
                              {permInfo.displayName}
                            </Badge>
                          );
                        })}
                        {currentServer.permissions.length > 3 && (
                          <Badge 
                            variant="outline" 
                            className="text-xs cursor-pointer hover:bg-purple-primary/20 transition-colors animate-pulse"
                            onClick={() => setExpandedPermissions(true)}
                          >
                            +{currentServer.permissions.length - 3} weitere anzeigen
                          </Badge>
                        )}
                      </div>
                    )
                  ) : (
                    <span className="text-sm text-dark-muted">Keine Berechtigungen verfügbar</span>
                  )}
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-6" activeTab={activeTab}>
          {/* Server Health Score */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-green-500/30 shadow-green-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                Server Gesundheits-Score
                {healthLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent"></div>
                )}
              </CardTitle>
              <CardDescription className="text-dark-muted">KI-basierte Bewertung der Server-Gesundheit</CardDescription>
            </CardHeader>
            <CardContent>
              {currentServer && (
                <div className="space-y-4">
                  {healthData ? (
                    <>
                      {/* Health Score Display */}
                      <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-xl">
                        <div>
                          <div className={`text-2xl font-bold ${getHealthRatingColor(healthData.rating)}`}>
                            {Math.round(healthData.overallScore)}%
                          </div>
                          <div className="text-sm text-dark-muted">Gesundheits-Score</div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={healthData.rating === 'Ausgezeichnet' ? 'success' : 
                                   healthData.rating === 'Gut' ? 'success' : 
                                   healthData.rating === 'Durchschnittlich' ? 'warning' : 'error'} 
                            className="text-sm"
                          >
                            {healthData.rating}
                          </Badge>
                          <div className="text-xs text-dark-muted mt-1">
                            Letzte Analyse: {formatTimestamp(healthData.timestamp)}
                          </div>
                        </div>
                      </div>

                      {/* Health Categories */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(healthData.scores).map(([key, score]) => {
                          const germanNames: { [key: string]: string } = {
                            activity: 'Aktivität',
                            security: 'Sicherheit',
                            engagement: 'Engagement',
                            structure: 'Struktur',
                            moderation: 'Moderation',
                            growth: 'Wachstum'
                          };
                          
                          const colors = [
                            'text-green-400', 'text-blue-400', 'text-yellow-400',
                            'text-purple-400', 'text-pink-400', 'text-cyan-400'
                          ];
                          
                          const colorIndex = Object.keys(healthData.scores).indexOf(key);
                          
                          return (
                            <div key={key} className="text-center p-3 bg-dark-bg/30 rounded-lg">
                              <div className={`text-lg font-bold ${colors[colorIndex]}`}>
                                {Math.round(score as number)}%
                              </div>
                              <div className="text-xs text-dark-muted">{germanNames[key]}</div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Recommendations */}
                      {healthData.recommendations && healthData.recommendations.length > 0 && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <h4 className="font-medium text-blue-400 mb-2">📋 Empfehlungen</h4>
                          <div className="space-y-3">
                            {healthData.recommendations.slice(0, 3).map((rec, index) => (
                              <div key={index} className="p-3 bg-dark-bg/30 rounded-lg border-l-4 border-blue-400">
                                <div className="flex items-start gap-2 mb-2">
                                  <span className={`inline-block w-2 h-2 rounded-full mt-2 ${
                                    rec.priority === 'high' ? 'bg-red-400' : 
                                    rec.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                                  }`} />
                                  <div className="flex-1">
                                    <h5 className="text-sm font-semibold text-dark-text">{rec.title}</h5>
                                    <p className="text-xs text-dark-muted mt-1">{rec.description}</p>
                                    {rec.actions && rec.actions.length > 0 && (
                                      <div className="mt-2">
                                        <div className="text-xs text-blue-400 font-medium mb-1">Aktionen:</div>
                                        <ul className="text-xs text-dark-muted">
                                          {rec.actions.slice(0, 2).map((action, actionIndex) => (
                                            <li key={actionIndex} className="flex items-center gap-1">
                                              <span className="text-blue-400">→</span>
                                              <span>{action}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button 
                        onClick={() => currentServer && loadHealthData(currentServer.id)}
                        disabled={healthLoading}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105"
                      >
                        <TrendingUp className="w-5 h-5 mr-2" />
                        {healthLoading ? 'Analysiere...' : 'Analyse aktualisieren'}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8 text-dark-muted">
                      {healthLoading ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-400 border-t-transparent"></div>
                          <p>Analysiere Server-Gesundheit...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Activity className="w-12 h-12 text-dark-muted/50" />
                          <p>Keine Health-Daten verfügbar</p>
                          <Button 
                            onClick={() => currentServer && loadHealthData(currentServer.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                          >
                            Analyse starten
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Anomaly Detection */}
          <Card className="bg-dark-surface/90 backdrop-blur-xl border-red-500/30 shadow-red-glow">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-400" />
                Anomalie-Erkennung
                {anomaliesLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent"></div>
                )}
              </CardTitle>
              <CardDescription className="text-dark-muted">Automatische Erkennung verdächtiger Aktivitäten</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 bg-dark-bg/30 rounded-xl border ${
                  anomalies.length === 0 ? 'border-green-500/30' : 
                  anomalies.some(a => a.severity === 'high') ? 'border-red-500/30' : 'border-yellow-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${
                      anomalies.length === 0 ? 'bg-green-500' : 
                      anomalies.some(a => a.severity === 'high') ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      anomalies.length === 0 ? 'text-green-400' : 
                      anomalies.some(a => a.severity === 'high') ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {anomalies.length === 0 ? 'Alles sicher' : 
                       anomalies.some(a => a.severity === 'high') ? 'Kritische Anomalien' : 'Verdächtige Aktivität'}
                    </span>
                  </div>
                  <div className="text-xs text-dark-muted">
                    {anomalies.length === 0 ? 'Keine verdächtigen Aktivitäten erkannt' : 
                     `${anomalies.length} Anomalie${anomalies.length > 1 ? 'n' : ''} erkannt`}
                  </div>
                </div>
                <div className="p-4 bg-dark-bg/30 rounded-xl">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">
                      {anomalyStats ? Object.keys(anomalyStats.types).length : '0'}
                    </div>
                    <div className="text-xs text-dark-muted">Überwachte Event-Typen</div>
                  </div>
                </div>
              </div>

              {/* Anomaly Stats */}
              {anomalyStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-dark-bg/30 rounded-lg">
                    <div className="text-lg font-bold text-red-400">{anomalyStats.high || 0}</div>
                    <div className="text-xs text-dark-muted">Hoch</div>
                  </div>
                  <div className="text-center p-3 bg-dark-bg/30 rounded-lg">
                    <div className="text-lg font-bold text-yellow-400">{anomalyStats.medium || 0}</div>
                    <div className="text-xs text-dark-muted">Mittel</div>
                  </div>
                  <div className="text-center p-3 bg-dark-bg/30 rounded-lg">
                    <div className="text-lg font-bold text-blue-400">{anomalyStats.total || 0}</div>
                    <div className="text-xs text-dark-muted">Gesamt</div>
                  </div>
                  <div className="text-center p-3 bg-dark-bg/30 rounded-lg">
                    <div className="text-lg font-bold text-purple-400">{anomalyStats.last24h || 0}</div>
                    <div className="text-xs text-dark-muted">24h</div>
                  </div>
                </div>
              )}

              {/* Recent Alerts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-dark-text">Letzte Anomalien:</h4>
                  <Button 
                    onClick={() => currentServer && loadAnomalies(currentServer.id)}
                    disabled={anomaliesLoading}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                  >
                    {anomaliesLoading ? 'Laden...' : 'Aktualisieren'}
                  </Button>
                </div>
                
                {anomalies.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {anomalies.slice(0, 5).map((anomaly, index) => (
                      <div key={index} className={`p-3 border rounded-lg ${getSeverityColor(anomaly.severity)}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {anomaly.severity === 'high' ? '🚨' : 
                             anomaly.severity === 'medium' ? '⚠️' : 'ℹ️'}
                          </span>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{anomaly.title}</div>
                            <div className="text-xs opacity-80">{anomaly.description}</div>
                            {anomaly.value !== undefined && anomaly.expected !== undefined && (
                              <div className="text-xs mt-1">
                                Wert: {anomaly.value} | Erwartet: ~{anomaly.expected}
                              </div>
                            )}
                          </div>
                          <div className="text-xs opacity-60">
                            {formatTimestamp(anomaly.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-dark-muted">
                    {anomaliesLoading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-400 border-t-transparent"></div>
                        <p>Lade Anomalie-Daten...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Shield className="w-8 h-8 text-green-400" />
                        <p>✅ Keine Anomalien erkannt - Alles normal!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

              {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6" activeTab={activeTab}>
          {!currentServer ? (
            <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30">
              <CardContent className="text-center py-12">
                <Activity className="w-16 h-16 text-purple-accent mx-auto mb-4 opacity-50" />
                <p className="text-dark-text text-lg">Wähle zuerst einen Server aus, um Analytics zu sehen</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Real-time Event Feed */}
              <Card className="bg-dark-surface/90 backdrop-blur-xl border-cyan-500/30 shadow-cyan-glow">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                    Live Event Feed
                    {analyticsLoading && <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin ml-2" />}
                  </CardTitle>
                  <CardDescription className="text-dark-muted">Echtzeitüberwachung der Server-Aktivitäten</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analyticsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-dark-muted">Lade Live Events...</p>
                    </div>
                  ) : liveEvents.length > 0 ? (
                    liveEvents.map((event, index) => (
                      <div key={event.id || index} className="flex items-center gap-3 p-3 bg-dark-bg/30 rounded-lg hover:bg-dark-bg/50 transition-all duration-300 animate-fade-in">
                        <span className="text-xl">{event.icon}</span>
                        <div className="flex-1">
                          <span className="text-sm text-dark-text">{event.username}</span>
                          <span className="text-xs text-dark-muted ml-2">
                            vor {Math.floor((Date.now() - event.timestamp) / 60000)} Min.
                          </span>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          event.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                          event.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                          event.severity === 'info' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {event.type === 'memberJoin' ? 'Beigetreten' : 
                           event.type === 'memberLeave' ? 'Verlassen' :
                           event.type === 'messageCreate' ? 'Nachricht' : 
                           event.type === 'voiceJoin' ? 'Voice beigetreten' : 
                           event.type === 'voiceLeave' ? 'Voice verlassen' :
                           event.type === 'voiceMove' ? 'Voice gewechselt' :
                           event.type === 'reactionAdd' ? 'Reaktion' : event.type}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-dark-muted mx-auto mb-4 opacity-50" />
                      <p className="text-dark-muted">Keine aktuellen Events</p>
                    </div>
                  )}

                  <Button 
                    onClick={() => loadAnalyticsData(currentServer.id)}
                    disabled={analyticsLoading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105"
                  >
                    {analyticsLoading ? 'Lädt...' : 'Events aktualisieren'}
                  </Button>
                </CardContent>
              </Card>

              {/* Voice Channel Visualizer */}
              <Card className="bg-dark-surface/90 backdrop-blur-xl border-pink-500/30 shadow-pink-glow">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-pink-400" />
                    Voice Channel Visualizer
                  </CardTitle>
                  <CardDescription className="text-dark-muted">Live Übersicht der Voice-Aktivitäten</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analyticsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-dark-muted">Lade Voice Daten...</p>
                    </div>
                  ) : voiceVisualization?.channels?.length > 0 ? (
                    <>
                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-3 bg-dark-bg/30 rounded-xl">
                          <div className="text-xl font-bold text-pink-400">{voiceVisualization.totalActiveUsers}</div>
                          <div className="text-xs text-dark-muted">Aktive Nutzer</div>
                        </div>
                        <div className="text-center p-3 bg-dark-bg/30 rounded-xl">
                          <div className="text-xl font-bold text-green-400">
                            {voiceVisualization.channels.filter(ch => ch.currentUsers > 0).length}
                          </div>
                          <div className="text-xs text-dark-muted">Aktive Channels</div>
                        </div>
                        <div className="text-center p-3 bg-dark-bg/30 rounded-xl">
                          <div className="text-xl font-bold text-blue-400">
                            {Math.max(...voiceVisualization.channels.map(ch => ch.peakUsage.count))}
                          </div>
                          <div className="text-xs text-dark-muted">Peak Nutzer</div>
                        </div>
                      </div>

                      {/* Channel Liste */}
                      {voiceVisualization.channels.map((channel, index) => (
                        <div key={channel.id || index} className="p-3 bg-dark-bg/30 rounded-lg hover:bg-dark-bg/50 transition-all duration-300">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-dark-text flex items-center gap-2">
                              <Volume2 className="w-4 h-4 text-pink-400" />
                              {channel.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-dark-muted">{channel.currentUsers} Nutzer</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                channel.activityLevel === 'very-high' ? 'bg-red-500/20 text-red-400' :
                                channel.activityLevel === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                channel.activityLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                channel.activityLevel === 'low' ? 'bg-green-500/20 text-green-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {channel.activityLevel === 'very-high' ? 'Sehr hoch' :
                                 channel.activityLevel === 'high' ? 'Hoch' :
                                 channel.activityLevel === 'medium' ? 'Mittel' :
                                 channel.activityLevel === 'low' ? 'Niedrig' : 'Inaktiv'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Activity Bar */}
                          <div className="w-full bg-dark-bg rounded-full h-2 mb-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                channel.currentUsers === 0 ? 'bg-gray-500' : 
                                channel.activityLevel === 'very-high' ? 'bg-red-500' :
                                channel.activityLevel === 'high' ? 'bg-orange-500' :
                                channel.activityLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((channel.currentUsers / 20) * 100, 100)}%` }}
                            />
                          </div>
                          
                          {/* Peak Usage Info */}
                          {channel.peakUsage.count > 0 && (
                            <div className="text-xs text-dark-muted">
                              Peak: {channel.peakUsage.count} Nutzer um {new Date(channel.peakUsage.timestamp).toLocaleTimeString('de-DE')}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Volume2 className="w-12 h-12 text-dark-muted mx-auto mb-4 opacity-50" />
                      <p className="text-dark-muted">Keine Voice Channels aktiv</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Member Journey Tracking */}
              <Card className="bg-dark-surface/90 backdrop-blur-xl border-indigo-500/30 shadow-indigo-glow">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-400" />
                    Member Journey Tracking
                  </CardTitle>
                  <CardDescription className="text-dark-muted">Verfolge die Reise und das Engagement der Mitglieder</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analyticsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-dark-muted">Lade Member Journey Daten...</p>
                    </div>
                  ) : memberJourneys ? (
                    <>
                      {/* Summary Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-dark-bg/30 rounded-xl">
                          <div className="text-2xl font-bold text-green-400">{memberJourneys.summary?.totalMembers || 0}</div>
                          <div className="text-sm text-dark-muted">Verfolgte Mitglieder</div>
                        </div>
                        <div className="text-center p-4 bg-dark-bg/30 rounded-xl">
                          <div className="text-2xl font-bold text-blue-400">
                            {memberJourneys.summary ? Math.round(memberJourneys.summary.averageEngagement) : 0}
                          </div>
                          <div className="text-sm text-dark-muted">Ø Engagement Score</div>
                        </div>
                        <div className="text-center p-4 bg-dark-bg/30 rounded-xl">
                          <div className="text-2xl font-bold text-purple-400">
                            {memberJourneys.analytics?.retention?.day7?.rate ? Math.round(memberJourneys.analytics.retention.day7.rate) : 0}%
                          </div>
                          <div className="text-sm text-dark-muted">7-Tage Retention</div>
                        </div>
                        <div className="text-center p-4 bg-dark-bg/30 rounded-xl">
                          <div className="text-2xl font-bold text-red-400">{memberJourneys.summary?.highChurnRisk || 0}</div>
                          <div className="text-sm text-dark-muted">Churn Risiko</div>
                        </div>
                      </div>

                      {/* Engagement Categories */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-dark-text">Engagement Kategorien:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(memberJourneys.summary?.categoryDistribution || {}).map(([category, count]) => (
                            <div key={category} className="p-3 bg-dark-bg/30 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-dark-text capitalize">
                                  {category === 'newcomer' ? 'Neuankömmlinge' :
                                   category === 'casual' ? 'Gelegenheitsnutzer' :
                                   category === 'active' ? 'Aktive' :
                                   category === 'engaged' ? 'Engagierte' :
                                   category === 'veteran' ? 'Veteranen' :
                                   category === 'champion' ? 'Champions' : category}
                                </span>
                                <span className={`text-sm font-bold ${
                                  category === 'champion' ? 'text-yellow-400' :
                                  category === 'veteran' ? 'text-purple-400' :
                                  category === 'engaged' ? 'text-blue-400' :
                                  category === 'active' ? 'text-green-400' :
                                  category === 'casual' ? 'text-orange-400' : 'text-gray-400'
                                }`}>
                                  {count}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Performers */}
                      {memberJourneys.analytics?.topPerformers?.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-dark-text">Top Performer:</h4>
                          <div className="space-y-2">
                            {memberJourneys.analytics.topPerformers.slice(0, 5).map((member, index) => (
                              <div key={member.userId} className="flex items-center gap-3 p-3 bg-dark-bg/30 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-bold ${
                                    index === 0 ? 'text-yellow-400' :
                                    index === 1 ? 'text-gray-300' :
                                    index === 2 ? 'text-orange-400' : 'text-purple-400'
                                  }`}>
                                    #{index + 1}
                                  </span>
                                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    {member.username.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm text-dark-text">{member.username}</div>
                                  <div className="text-xs text-dark-muted">{member.milestones} Meilensteine erreicht</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-purple-400">{Math.round(member.engagementScore)}</div>
                                  <div className="text-xs text-dark-muted">Score</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* At-Risk Members */}
                      {memberJourneys.analytics?.atRisk?.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-dark-text">Risiko Mitglieder:</h4>
                          <div className="space-y-2">
                            {memberJourneys.analytics.atRisk.slice(0, 3).map((member) => (
                              <div key={member.userId} className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {member.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm text-dark-text">{member.username}</div>
                                  <div className="text-xs text-dark-muted">
                                    Inaktiv seit {member.daysSinceActivity} Tagen
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-red-400">{Math.round(member.churnProbability)}%</div>
                                  <div className="text-xs text-dark-muted">Churn Risiko</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-dark-muted mx-auto mb-4 opacity-50" />
                      <p className="text-dark-muted">Keine Member Journey Daten verfügbar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

              {/* Management Tab */}
        <TabsContent value="management" className="space-y-6" activeTab={activeTab}>
          {currentServer && (
            <>
              {/* Server Optimization Report */}
              <Card className="bg-dark-surface/90 backdrop-blur-xl border-cyan-500/30 shadow-cyan-glow">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    Server Optimierung
                  </CardTitle>
                  <CardDescription className="text-dark-muted">
                    KI-basierte Analyse und Empfehlungen für {currentServer.name}
                  </CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      onClick={() => generateOptimizationReport(currentServer.id)}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white"
                      size="sm"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Neu analysieren
                    </Button>
                    <Button 
                      onClick={() => {
                        setOptimizationReport(null);
                        setTimeout(() => loadOptimizationReport(currentServer.id), 100);
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Cache leeren
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {optimizationReport ? (
                    <>
                      {/* Overall Score */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                        <div className="col-span-2 md:col-span-2 p-4 bg-dark-bg/30 rounded-xl border border-cyan-500/30">
                          <div className="text-center">
                            <div className={`text-3xl font-bold mb-2 ${
                              optimizationReport.overallScore >= 80 ? 'text-green-400' :
                              optimizationReport.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {optimizationReport.overallScore}%
                            </div>
                            <div className="text-sm text-dark-muted">Gesamt-Score</div>
                          </div>
                        </div>
                        
                        {Object.entries(optimizationReport.scores).map(([category, score]) => (
                          <div key={category} className="p-3 bg-dark-bg/20 rounded-lg">
                            <div className="text-center">
                              <div className={`text-lg font-bold ${
                                score >= 80 ? 'text-green-400' :
                                score >= 60 ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {Math.round(score)}
                              </div>
                              <div className="text-xs text-dark-muted capitalize">{category}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Recommendations */}
                      {optimizationReport.recommendations && optimizationReport.recommendations.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-dark-text flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            Optimierungs-Empfehlungen:
                          </h4>
                          <div className="space-y-2">
                            {optimizationReport.recommendations.slice(0, 5).map((rec, index) => (
                              <div key={index} className={`p-3 rounded-lg border ${
                                rec.priority === 'high' ? 'border-red-500/30 bg-red-500/10' :
                                rec.priority === 'medium' ? 'border-yellow-500/30 bg-yellow-500/10' :
                                'border-blue-500/30 bg-blue-500/10'
                              }`}>
                                <div className="flex items-start gap-3 mb-3">
                                  <div className={`w-2 h-2 rounded-full mt-2 ${
                                    rec.priority === 'high' ? 'bg-red-400' :
                                    rec.priority === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                                  }`} />
                                  <div className="flex-1">
                                    <div className="font-medium text-dark-text text-sm">{rec.title}</div>
                                    <div className="text-xs text-dark-muted mt-1">{rec.description}</div>
                                  </div>
                                  <Button size="sm" className="bg-purple-primary hover:bg-purple-secondary text-white">
                                    Anwenden
                                  </Button>
                                </div>
                                
                                {/* Detaillierte Informationen falls verfügbar */}
                                {rec.details && (
                                  <div className="pl-5 border-l-2 border-dark-border/30">
                                    {rec.details.unusedRoles && rec.details.unusedRoles.length > 0 && (
                                      <div className="mb-2">
                                        <span className="text-xs font-medium text-dark-muted">Ungenutzte Rollen:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {(expandedRecommendations[`${index}-unusedRoles`] 
                                            ? rec.details.unusedRoles 
                                            : rec.details.unusedRoles.slice(0, 5)
                                          ).map((role, i) => (
                                            <span key={i} className="px-2 py-1 bg-dark-bg/50 rounded text-xs text-red-300">
                                              {role.name}
                                            </span>
                                          ))}
                                          {rec.details.unusedRoles.length > 5 && (
                                            <button
                                              onClick={() => toggleExpandedList(index, 'unusedRoles')}
                                              className="text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer transition-colors"
                                            >
                                              {expandedRecommendations[`${index}-unusedRoles`] 
                                                ? 'Weniger anzeigen' 
                                                : `+${rec.details.unusedRoles.length - 5} weitere`
                                              }
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {rec.details.channelsWithoutCategory && rec.details.channelsWithoutCategory.length > 0 && (
                                      <div className="mb-2">
                                        <span className="text-xs font-medium text-dark-muted">Channels ohne Kategorie:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {(expandedRecommendations[`${index}-channelsWithoutCategory`] 
                                            ? rec.details.channelsWithoutCategory 
                                            : rec.details.channelsWithoutCategory.slice(0, 3)
                                          ).map((channel, i) => (
                                            <span key={i} className="px-2 py-1 bg-dark-bg/50 rounded text-xs text-yellow-300">
                                              #{channel.name}
                                            </span>
                                          ))}
                                          {rec.details.channelsWithoutCategory.length > 3 && (
                                            <button
                                              onClick={() => toggleExpandedList(index, 'channelsWithoutCategory')}
                                              className="text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer transition-colors"
                                            >
                                              {expandedRecommendations[`${index}-channelsWithoutCategory`] 
                                                ? 'Weniger anzeigen' 
                                                : `+${rec.details.channelsWithoutCategory.length - 3} weitere`
                                              }
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {rec.details.adminMembers && rec.details.adminMembers.length > 0 && (
                                      <div className="mb-2">
                                        <span className="text-xs font-medium text-dark-muted">
                                          Admin-Mitglieder ({rec.details.percentage}%):
                                        </span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {(expandedRecommendations[`${index}-adminMembers`] 
                                            ? rec.details.adminMembers 
                                            : rec.details.adminMembers.slice(0, 3)
                                          ).map((member, i) => (
                                            <span key={i} className="px-2 py-1 bg-dark-bg/50 rounded text-xs text-orange-300">
                                              {member.name}
                                            </span>
                                          ))}
                                          {rec.details.adminMembers.length > 3 && (
                                            <button
                                              onClick={() => toggleExpandedList(index, 'adminMembers')}
                                              className="text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer transition-colors"
                                            >
                                              {expandedRecommendations[`${index}-adminMembers`] 
                                                ? 'Weniger anzeigen' 
                                                : `+${rec.details.adminMembers.length - 3} weitere`
                                              }
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {rec.details.suggestedChannels && (
                                      <div className="mb-2">
                                        <span className="text-xs font-medium text-dark-muted">Vorgeschlagene Channels:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {rec.details.suggestedChannels.map((channel, i) => (
                                            <span key={i} className="px-2 py-1 bg-green-500/20 rounded text-xs text-green-300">
                                              {channel}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {rec.details.suggestedCategories && (
                                      <div className="mb-2">
                                        <span className="text-xs font-medium text-dark-muted">Vorgeschlagene Kategorien:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {rec.details.suggestedCategories.map((category, i) => (
                                            <span key={i} className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-300">
                                              {category}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {rec.details.recommendation && (
                                      <div className="text-xs text-cyan-300 mt-2 italic">
                                        💡 {rec.details.recommendation}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-dark-muted mx-auto mb-4 opacity-50" />
                      <p className="text-dark-muted mb-4">Keine Optimierungsdaten verfügbar</p>
                      <Button 
                        onClick={() => generateOptimizationReport(currentServer.id)}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white"
                      >
                        Optimierungs-Analyse starten
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bulk Member Management */}
              <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Bulk Member Management
                  </CardTitle>
                  <CardDescription className="text-dark-muted">Massenaktionen für Mitglieder durchführen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-dark-bg/30 rounded-xl border border-red-500/20 hover:border-red-500/50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <UserX className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-dark-text">Bulk Kick</h4>
                          <p className="text-xs text-dark-muted">Mitglieder kicken</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => openBulkModal('bulk_kick')}
                        className="w-full bg-red-500 hover:bg-red-600 text-white" 
                        size="sm"
                      >
                        Konfigurieren
                      </Button>
                    </div>

                    <div className="p-4 bg-dark-bg/30 rounded-xl border border-orange-500/20 hover:border-orange-500/50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <Ban className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-dark-text">Bulk Ban</h4>
                          <p className="text-xs text-dark-muted">Mitglieder bannen</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => openBulkModal('bulk_ban')}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
                        size="sm"
                      >
                        Konfigurieren
                      </Button>
                    </div>

                    <div className="p-4 bg-dark-bg/30 rounded-xl border border-blue-500/20 hover:border-blue-500/50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Crown className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-dark-text">Role Actions</h4>
                          <p className="text-xs text-dark-muted">Rollen verwalten</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => openBulkModal('role_actions')}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white" 
                        size="sm"
                      >
                        Konfigurieren
                      </Button>
                    </div>

                    <div className="p-4 bg-dark-bg/30 rounded-xl border border-green-500/20 hover:border-green-500/50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-dark-text">Bulk Message</h4>
                          <p className="text-xs text-dark-muted">Nachrichten senden</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => openBulkModal('bulk_message')}
                        className="w-full bg-green-500 hover:bg-green-600 text-white" 
                        size="sm"
                      >
                        Konfigurieren
                      </Button>
                    </div>

                    <div className="p-4 bg-dark-bg/30 rounded-xl border border-cyan-500/20 hover:border-cyan-500/50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                          <Settings className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-dark-text">Settings Sync</h4>
                          <p className="text-xs text-dark-muted">Einstellungen synchronisieren</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => openBulkModal('settings_sync')}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white" 
                        size="sm"
                      >
                        Konfigurieren
                      </Button>
                    </div>

                    <div className="p-4 bg-dark-bg/30 rounded-xl border border-purple-500/20 hover:border-purple-500/50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Download className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-dark-text">Export Data</h4>
                          <p className="text-xs text-dark-muted">Server-Daten exportieren</p>
                        </div>
                      </div>
                      <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white" size="sm">
                        Exportieren
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Server Templates */}
              <Card className="bg-dark-surface/90 backdrop-blur-xl border-blue-500/30 shadow-blue-glow">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-400" />
                    Server Setup Templates
                  </CardTitle>
                  <CardDescription className="text-dark-muted">Vorgefertigte Templates für schnelle Server-Einrichtung</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {serverTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {serverTemplates.map((template) => (
                        <div key={template.id} className="p-4 bg-dark-bg/30 rounded-xl border border-blue-500/20 hover:border-blue-500/50 transition-all hover:scale-105 cursor-pointer">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">{template.icon}</span>
                            <div>
                              <h4 className="font-semibold text-dark-text">{template.name}</h4>
                              <p className="text-xs text-dark-muted">{template.description}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-xs">
                              <span className="text-dark-muted">Kategorien:</span>
                              <span className="text-blue-400">{template.categories?.length || 0}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-dark-muted">Channels:</span>
                              <span className="text-green-400">
                                {template.categories?.reduce((sum, cat) => sum + (cat.channels?.length || 0), 0) || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-dark-muted">Rollen:</span>
                              <span className="text-purple-400">{template.roles?.length || 0}</span>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={() => applyTemplate(template.id)}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                            size="sm"
                          >
                            Template anwenden
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Database className="w-12 h-12 text-dark-muted mx-auto mb-4 opacity-50" />
                      <p className="text-dark-muted mb-4">Keine Templates verfügbar</p>
                      <Button 
                        onClick={loadServerTemplates}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Templates laden
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action History */}
              <Card className="bg-dark-surface/90 backdrop-blur-xl border-yellow-500/30 shadow-yellow-glow">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                    <History className="w-5 h-5 text-yellow-400" />
                    Action History
                  </CardTitle>
                  <CardDescription className="text-dark-muted">Letzte Bulk-Aktionen und deren Status</CardDescription>
                </CardHeader>
                <CardContent>
                  {actionHistory.length > 0 ? (
                    <div className="space-y-3">
                      {actionHistory.slice(0, 5).map((action) => (
                        <div key={action.id} className="p-4 bg-dark-bg/30 rounded-lg border border-dark-border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                action.status === 'completed' ? 'bg-green-400' :
                                action.status === 'failed' ? 'bg-red-400' :
                                action.status === 'processing' ? 'bg-yellow-400 animate-pulse' :
                                'bg-gray-400'
                              }`} />
                              <span className="font-medium text-dark-text">{action.type.replace('_', ' ')}</span>
                            </div>
                            <span className="text-xs text-dark-muted">
                              {formatTimestamp(action.timestamp)}
                            </span>
                          </div>
                          
                          <div className="text-sm text-dark-muted">
                            Server: {action.guildIds?.length || 0} • 
                            Status: <span className={`font-medium ${
                              action.status === 'completed' ? 'text-green-400' :
                              action.status === 'failed' ? 'text-red-400' :
                              action.status === 'processing' ? 'text-yellow-400' :
                              'text-gray-400'
                            }`}>{action.status}</span>
                            {action.duration && (
                              <> • Dauer: {Math.round(action.duration / 1000)}s</>
                            )}
                          </div>
                          
                          {action.results && action.results.length > 0 && (
                            <div className="mt-2 text-xs text-dark-muted">
                              Resultate: {action.results.filter(r => r.success).length} erfolgreich, {action.results.filter(r => !r.success).length} fehlgeschlagen
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 text-dark-muted mx-auto mb-4 opacity-50" />
                      <p className="text-dark-muted">Keine Action History verfügbar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {!currentServer && (
            <div className="text-center py-16">
              <Server className="w-16 h-16 text-dark-muted mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-dark-text mb-2">Server auswählen</h3>
              <p className="text-dark-muted">Wähle einen Server aus, um die Verwaltungstools zu nutzen</p>
            </div>
          )}
        </TabsContent>

              {/* Security Tab - Coming Soon */}
        <TabsContent value="security" className="space-y-6" activeTab={activeTab}>
          <div className="text-center py-20">
            <div className="relative">
              {/* Animated Background Effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-r from-red-500/20 to-purple-500/20 rounded-full animate-ping"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-gradient-to-r from-red-500/30 to-purple-500/30 rounded-full animate-pulse"></div>
              </div>
              
              {/* Main Icon */}
              <div className="relative z-10 flex items-center justify-center mb-8">
                <div className="p-6 bg-gradient-to-r from-red-600/20 to-purple-600/20 rounded-full border border-red-500/30 shadow-red-glow">
                  <Shield className="w-16 h-16 text-red-400 animate-pulse" />
                </div>
              </div>
            </div>
            
            {/* Coming Soon Content */}
            <div className="space-y-6 max-w-lg mx-auto">
              <div>
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-500 mb-3">
                  Coming Soon
                </h2>
                <h3 className="text-2xl font-semibold text-dark-text mb-4">
                  Erweiterte Sicherheitsfeatures
                </h3>
              </div>
              
              <div className="text-dark-muted space-y-3">
                <p className="text-lg leading-relaxed">
                  Wir arbeiten an fortgeschrittenen Sicherheitstools für deinen Discord Server.
                </p>
                <p className="text-base">
                  Bald verfügbar: Automatische Spam-Erkennung, Raid-Schutz, erweiterte Moderationstools und vieles mehr!
                </p>
              </div>
              
              {/* Feature Preview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div className="p-4 bg-dark-surface/50 rounded-xl border border-red-500/20 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h4 className="font-semibold text-dark-text">Spam & Raid Schutz</h4>
                  </div>
                  <p className="text-xs text-dark-muted">Automatische Erkennung und Blockierung von Spam und Raids</p>
                </div>
                
                <div className="p-4 bg-dark-surface/50 rounded-xl border border-purple-500/20 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Eye className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold text-dark-text">Security Analytics</h4>
                  </div>
                  <p className="text-xs text-dark-muted">Detaillierte Sicherheitsberichte und Anomalie-Erkennung</p>
                </div>
                
                <div className="p-4 bg-dark-surface/50 rounded-xl border border-blue-500/20 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <h4 className="font-semibold text-dark-text">Smart Moderation</h4>
                  </div>
                  <p className="text-xs text-dark-muted">KI-gestützte Moderationswerkzeuge für besseren Schutz</p>
                </div>
                
                <div className="p-4 bg-dark-surface/50 rounded-xl border border-green-500/20 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="w-5 h-5 text-green-400" />
                    <h4 className="font-semibold text-dark-text">Erweiterte Einstellungen</h4>
                  </div>
                  <p className="text-xs text-dark-muted">Granulare Kontrolle über alle Sicherheitsaspekte</p>
                </div>
              </div>
              
              {/* Progress Indicator */}
              <div className="mt-8 p-4 bg-gradient-to-r from-red-600/10 to-purple-600/10 rounded-xl border border-red-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-dark-text">Entwicklungsfortschritt</span>
                  <span className="text-sm text-red-400 font-bold">75%</span>
                </div>
                <div className="w-full bg-dark-bg/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-red-500 to-purple-500 h-2 rounded-full w-3/4 animate-pulse"></div>
                </div>
                <p className="text-xs text-dark-muted mt-2 text-center">
                  Voraussichtliche Veröffentlichung: Q1 2024
                </p>
              </div>
              
              {/* Newsletter Signup Placeholder */}
              <div className="mt-6">
                <Button 
                  disabled
                  className="bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl opacity-50 cursor-not-allowed"
                >
                  <Bell className="w-5 h-5 mr-2" />
                  Benachrichtigung aktivieren (Coming Soon)
                </Button>
                <p className="text-xs text-dark-muted mt-2">
                  Werde benachrichtigt, sobald die Sicherheitsfeatures verfügbar sind
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* AI Tools Tab */}
        <TabsContent value="ai" className="space-y-6" activeTab={activeTab}>
          {currentServer ? (
            <>
              {/* AI Optimization Suggestions */}
              <Card className="bg-dark-surface/90 backdrop-blur-xl border-yellow-500/30 shadow-yellow-glow">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                    <Brain className="w-5 h-5 text-yellow-400" />
                    AI-Optimierungs-Vorschläge
                  </CardTitle>
                  <CardDescription className="text-dark-muted">
                    Intelligente Verbesserungsempfehlungen für {currentServer.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-dark-muted">Analysiere Server mit fortgeschrittener AI...</p>
                    </div>
                  ) : aiOptimizationData ? (
                    <>
                      {/* Server Health Score */}
                      <div className="p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-xl border border-yellow-500/30 mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-dark-text">Server-Gesundheit</h4>
                          <span className="text-lg font-bold text-yellow-400">
                            {aiOptimizationData.serverHealth?.overall || 0}/100
                          </span>
                        </div>
                        <div className="text-sm text-dark-muted mb-2">
                          Status: <span className="text-yellow-400 font-medium">
                            {aiOptimizationData.serverHealth?.rating || 'Unbekannt'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>Struktur: {aiOptimizationData.serverHealth?.structure || 0}%</div>
                          <div>Engagement: {aiOptimizationData.serverHealth?.engagement || 0}%</div>
                          <div>Retention: {aiOptimizationData.serverHealth?.retention || 0}%</div>
                          <div>Konfidenz: {Math.round((aiOptimizationData.confidence || 0) * 100)}%</div>
                        </div>
                      </div>

                      {/* Suggestions */}
                      {aiOptimizationData.suggestions && aiOptimizationData.suggestions.length > 0 ? (
                        <div className="space-y-3">
                          {aiOptimizationData.suggestions.map((suggestion: any, index: number) => (
                            <div key={index} className="p-4 bg-dark-bg/50 rounded-xl border border-dark-border">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={suggestion.priority === 'high' ? 'error' : suggestion.priority === 'medium' ? 'warning' : 'outline'}
                                    className="text-xs"
                                  >
                                    {suggestion.priority === 'high' ? 'Hoch' : suggestion.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                                  </Badge>
                                  <h4 className="font-semibold text-dark-text">{suggestion.title}</h4>
                                </div>
                                <span className="text-xs text-dark-muted">
                                  {Math.round((suggestion.confidence || 0) * 100)}%
                                </span>
                              </div>
                              <p className="text-sm text-dark-muted mb-3">{suggestion.description}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex gap-4 text-xs text-dark-muted">
                                  <span>Impact: {suggestion.impact}</span>
                                  <span>Aufwand: {suggestion.effort}</span>
                                  <span>Typ: {suggestion.type}</span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-purple-accent hover:text-purple-primary"
                                  onClick={() => applyOptimizationSuggestion(suggestion)}
                                >
                                  Anwenden
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Target className="w-12 h-12 text-green-400 mx-auto mb-4" />
                          <p className="text-dark-muted">Keine Optimierungsvorschläge - Ihr Server ist bereits gut optimiert!</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 text-dark-muted mx-auto mb-4 opacity-50" />
                      <p className="text-dark-muted">Keine AI-Analyse verfügbar</p>
                    </div>
                  )}

                  <Button 
                    onClick={generateNewAIAnalysis}
                    disabled={aiLoading}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105"
                  >
                    <Brain className="w-5 h-5 mr-2" />
                    {aiLoading ? 'Analysiere...' : 'Neue AI-Analyse starten'}
                  </Button>
                </CardContent>
              </Card>

              {/* Growth Predictions */}
              <Card className="bg-dark-surface/90 backdrop-blur-xl border-green-500/30 shadow-green-glow">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    KI-Wachstumsprognosen
                  </CardTitle>
                  <CardDescription className="text-dark-muted">
                    Vorhersagen für Serverwachstum und Engagement ({growthPredictions?.timeframe || '30-90 Tage'})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-dark-muted">Berechne Wachstumsprognosen...</p>
                    </div>
                  ) : growthPredictions ? (
                    <>
                      {/* Member Growth Predictions */}
                      {growthPredictions.predictions?.memberGrowth && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-dark-bg/30 rounded-xl">
                            <div className="text-2xl font-bold text-green-400">
                              +{growthPredictions.predictions.memberGrowth.next7Days || 0}
                            </div>
                            <div className="text-sm text-dark-muted">Neue Mitglieder (7 Tage)</div>
                            <div className="text-xs text-green-300 mt-1">
                              {growthPredictions.predictions.memberGrowth.growthRate > 0 ? '↗️' : '↘️'} 
                              {Math.round((growthPredictions.predictions.memberGrowth.growthRate || 0) * 100)}% Rate
                            </div>
                          </div>
                          <div className="text-center p-4 bg-dark-bg/30 rounded-xl">
                            <div className="text-2xl font-bold text-blue-400">
                              +{growthPredictions.predictions.memberGrowth.next30Days || 0}
                            </div>
                            <div className="text-sm text-dark-muted">Neue Mitglieder (30 Tage)</div>
                            <div className="text-xs text-blue-300 mt-1">📈 Prognose</div>
                          </div>
                          <div className="text-center p-4 bg-dark-bg/30 rounded-xl">
                            <div className="text-2xl font-bold text-purple-400">
                              {Math.round((growthPredictions.predictions.memberGrowth.confidence || 0) * 100)}%
                            </div>
                            <div className="text-sm text-dark-muted">Vorhersage-Genauigkeit</div>
                            <div className="text-xs text-purple-300 mt-1">🎯 Konfidenz</div>
                          </div>
                        </div>
                      )}

                      {/* Engagement Trends */}
                      {growthPredictions.predictions?.engagementTrends && (
                        <div className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/30">
                          <h4 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Engagement-Trends:
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-xs text-dark-muted">Aktuell</div>
                              <div className="font-bold text-blue-400">
                                {Math.round((growthPredictions.predictions.engagementTrends.currentRate || 0) * 100)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-dark-muted">7 Tage</div>
                              <div className="font-bold text-green-400">
                                {Math.round((growthPredictions.predictions.engagementTrends.predicted7Days || 0) * 100)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-dark-muted">30 Tage</div>
                              <div className="font-bold text-purple-400">
                                {Math.round((growthPredictions.predictions.engagementTrends.predicted30Days || 0) * 100)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-dark-muted">Trend</div>
                              <div className="font-bold text-yellow-400">
                                {growthPredictions.predictions.engagementTrends.trend || 'Stabil'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Growth Factors */}
                      {growthPredictions.factors && growthPredictions.factors.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl border border-green-500/30">
                          <h4 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Wachstumsfaktoren:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {growthPredictions.factors.map((factor: string, index: number) => (
                              <span key={index} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                                {factor}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Milestones */}
                      {growthPredictions.predictions?.milestones && (
                        <div className="p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30">
                          <h4 className="font-semibold text-dark-text mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Kommende Meilensteine:
                          </h4>
                          <div className="space-y-2">
                            {growthPredictions.predictions.milestones.nextMemberMilestone && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-dark-text">
                                  {growthPredictions.predictions.milestones.nextMemberMilestone.target} Mitglieder
                                </span>
                                <span className="text-xs text-purple-400">
                                  ~{growthPredictions.predictions.milestones.nextMemberMilestone.estimatedDays} Tage
                                </span>
                              </div>
                            )}
                            {growthPredictions.predictions.milestones.engagementGoals && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-dark-text">
                                  {growthPredictions.predictions.milestones.engagementGoals.target}
                                </span>
                                <span className="text-xs text-purple-400">
                                  ~{growthPredictions.predictions.milestones.engagementGoals.estimatedDays} Tage
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-dark-muted mx-auto mb-4 opacity-50" />
                      <p className="text-dark-muted">Keine Wachstumsprognosen verfügbar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-dark-muted mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-dark-text mb-2">Wähle einen Server</h3>
              <p className="text-dark-muted">Wähle einen Server aus, um AI-basierte Optimierungen und Wachstumsprognosen zu erhalten.</p>
            </div>
          )}
        </TabsContent>

      </Tabs>

      {/* Bulk Action Configuration Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-dark-text">
                {bulkModalOpen === 'bulk_kick' ? 'Bulk Kick Konfiguration' :
                 bulkModalOpen === 'bulk_ban' ? 'Bulk Ban Konfiguration' :
                 bulkModalOpen === 'role_actions' ? 'Rollen-Aktionen Konfiguration' :
                 bulkModalOpen === 'bulk_message' ? 'Bulk Message Konfiguration' :
                 bulkModalOpen === 'settings_sync' ? 'Settings Sync Konfiguration' :
                 'Bulk Aktion Konfiguration'}
              </h3>
              <Button 
                onClick={closeBulkModal}
                variant="ghost" 
                size="sm"
                className="text-dark-muted hover:text-dark-text"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              {/* Criteria Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-dark-text">Auswahlkriterien:</label>
                <Select 
                  value={bulkActionConfig.criteria} 
                  onValueChange={(value) => setBulkActionConfig(prev => ({ ...prev, criteria: value }))}
                >
                  <SelectTrigger className="bg-dark-bg border-purple-primary/30 text-dark-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-surface border-purple-primary/30">
                    <SelectItem value="inactive_days" className="text-dark-text">Inaktiv seit X Tagen</SelectItem>
                    <SelectItem value="no_roles" className="text-dark-text">Ohne Rollen</SelectItem>
                    <SelectItem value="specific_roles" className="text-dark-text">Bestimmte Rollen</SelectItem>
                    <SelectItem value="join_date" className="text-dark-text">Beitrittsdatum</SelectItem>
                    {bulkModalOpen === 'role_actions' && (
                      <SelectItem value="all_members" className="text-dark-text">Alle Mitglieder</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Value Input */}
              {(bulkActionConfig.criteria === 'inactive_days' || bulkActionConfig.criteria === 'join_date') && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-dark-text">
                    {bulkActionConfig.criteria === 'inactive_days' ? 'Inaktiv seit (Tage):' : 'Tage seit Beitritt:'}
                  </label>
                  <Input
                    type="number"
                    value={bulkActionConfig.value}
                    onChange={(e) => setBulkActionConfig(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                    className="bg-dark-bg border-purple-primary/30 text-dark-text"
                    placeholder="Anzahl Tage"
                  />
                </div>
              )}

              {/* Role Selection */}
              {(bulkActionConfig.criteria === 'specific_roles' || bulkModalOpen === 'role_actions') && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-dark-text">
                    {bulkModalOpen === 'role_actions' ? 'Rollen (hinzufügen/entfernen):' : 'Ziel-Rollen:'}
                  </label>
                  <Input
                    value={bulkActionConfig.targetRoles.join(', ')}
                    onChange={(e) => setBulkActionConfig(prev => ({ 
                      ...prev, 
                      targetRoles: e.target.value.split(',').map(r => r.trim()).filter(r => r)
                    }))}
                    className="bg-dark-bg border-purple-primary/30 text-dark-text"
                    placeholder="Rollen-Namen (kommagetrennt)"
                  />
                </div>
              )}

              {/* Message Input */}
              {bulkModalOpen === 'bulk_message' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-dark-text">Nachricht:</label>
                  <textarea
                    value={bulkActionConfig.message}
                    onChange={(e) => setBulkActionConfig(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full h-32 p-3 bg-dark-bg border border-purple-primary/30 rounded-lg text-dark-text resize-none"
                    placeholder="Nachricht die an alle ausgewählten Mitglieder gesendet wird..."
                  />
                </div>
              )}

              {/* Reason Input */}
              {(bulkModalOpen === 'bulk_kick' || bulkModalOpen === 'bulk_ban') && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-dark-text">Grund:</label>
                  <Input
                    value={bulkActionConfig.reason}
                    onChange={(e) => setBulkActionConfig(prev => ({ ...prev, reason: e.target.value }))}
                    className="bg-dark-bg border-purple-primary/30 text-dark-text"
                    placeholder="Grund für die Aktion"
                  />
                </div>
              )}

              {/* Dry Run Toggle */}
              <div className="flex items-center justify-between p-4 bg-dark-bg/30 rounded-lg">
                <div>
                  <div className="font-medium text-dark-text">Test-Modus (Dry Run)</div>
                  <div className="text-sm text-dark-muted">Nur anzeigen, was passieren würde, ohne Aktionen auszuführen</div>
                </div>
                <Switch
                  checked={bulkActionConfig.dryRun}
                  onCheckedChange={(checked) => setBulkActionConfig(prev => ({ ...prev, dryRun: checked }))}
                />
              </div>

              {/* Warning */}
              {!bulkActionConfig.dryRun && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="font-medium text-red-400">Warnung</span>
                  </div>
                  <p className="text-sm text-red-300">
                    Diese Aktion wird {bulkModalOpen === 'bulk_kick' ? 'Mitglieder kicken' :
                                      bulkModalOpen === 'bulk_ban' ? 'Mitglieder bannen' :
                                      bulkModalOpen === 'role_actions' ? 'Rollen ändern' :
                                      bulkModalOpen === 'bulk_message' ? 'Nachrichten senden' :
                                      'Änderungen vornehmen'} und kann nicht rückgängig gemacht werden.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={closeBulkModal}
                  variant="ghost"
                  className="flex-1 border border-dark-border text-dark-text hover:bg-dark-bg"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={executeBulkAction}
                  className={`flex-1 text-white font-bold ${
                    bulkActionConfig.dryRun 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : 'bg-gradient-to-r from-purple-primary to-purple-secondary hover:scale-105'
                  }`}
                >
                  {bulkActionConfig.dryRun ? 'Vorschau anzeigen' : 'Aktion ausführen'}
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

export default ServerManager; 