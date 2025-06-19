import React, { useState, useEffect } from 'react';
import { FileText, Clock, Zap, Shield, Ban, Volume2, VolumeX, AlertTriangle, User, Calendar, Filter, Search, RefreshCw, Eye, EyeOff, RotateCcw, Timer } from 'lucide-react';

interface ModerationLog {
  id: string;
  timestamp: string;
  action: string;
  targetUser: {
    id: string;
    username: string;
    displayName: string;
    avatarURL: string | null;
  };
  moderator: {
    id: string;
    username: string;
    displayName: string;
    avatarURL: string | null;
  };
  reason: string;
  guild: {
    id: string;
    name: string;
  };
  duration?: number;
  formattedDuration?: string;
  warningCount?: number;
  spamType?: string;
  messageCount?: number;
  content?: string;
  badWord?: string;
}

interface ModerationStats {
  totalActions: number;
  actionCounts: Record<string, number>;
  topModerators: Record<string, number>;
  recentActivity: ModerationLog[];
}

interface ActiveMute {
  userId: string;
  username: string;
  mutedAt: string;
  until: string;
  reason: string;
  moderator: string;
  remainingTime: number;
}

const Logs = () => {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [activeMutes, setActiveMutes] = useState<ActiveMute[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter State
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('');
  const [filterDays, setFilterDays] = useState('');
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  
  // Reset System State
  const [resetStats, setResetStats] = useState<any>(null);
  const [showResetSection, setShowResetSection] = useState(false);

  const actionIcons: Record<string, any> = {
    mute: VolumeX,
    unmute: Volume2,
    warn: AlertTriangle,
    kick: User,
    ban: Ban,
    unban: Shield,
    spam_delete: Zap,
    language_filter: EyeOff
  };

  const actionColors: Record<string, string> = {
    mute: 'text-red-400',
    unmute: 'text-green-400',
    warn: 'text-yellow-400',
    kick: 'text-orange-400',
    ban: 'text-red-600',
    unban: 'text-green-500',
    spam_delete: 'text-purple-400',
    language_filter: 'text-pink-400'
  };

  const actionLabels: Record<string, string> = {
    mute: 'Mute',
    unmute: 'Unmute',
    warn: 'Warnung',
    kick: 'Kick',
    ban: 'Ban',
    unban: 'Unban',
    spam_delete: 'Spam gelöscht',
    language_filter: 'Sprach-Filter'
  };

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filterAction !== 'all' && { action: filterAction }),
        ...(filterUser && { user: filterUser }),
        ...(filterDays && { days: filterDays })
      });

      const response = await fetch(`http://localhost:3001/api/moderation/logs?${params}`);
      const data = await response.json();
      
      setLogs(data.logs || []);
      setCurrentPage(data.pagination?.currentPage || 1);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Fehler beim Laden der Logs:', error);
      setLogs([]); // Fallback zu leerem Array
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/moderation/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error);
      setStats(null); // Fallback zu null
    }
  };

  const fetchActiveMutes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/moderation/muted');
      const data = await response.json();
      setActiveMutes(data.activeMutes || []);
    } catch (error) {
      console.error('Fehler beim Laden der aktiven Mutes:', error);
      setActiveMutes([]); // Fallback zu leerem Array
    }
  };

  const fetchResetStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/moderation/reset-stats');
      const data = await response.json();
      setResetStats(data);
    } catch (error) {
      console.error('Fehler beim Laden der Reset-Statistiken:', error);
      setResetStats(null);
    }
  };

  const handleManualReset = async () => {
    const currentWarnings = resetStats?.currentStats?.currentWarnings || 0;
    
    if (currentWarnings === 0) {
      const confirmed = confirm(
        `Aktuell sind keine aktiven Warnungen vorhanden.\n\n` +
        `Möchtest du trotzdem einen Reset durchführen?\n\n` +
        `Dies wird als Admin-Aktion geloggt und setzt das Reset-Datum auf heute.`
      );
      
      if (!confirmed) return;
    } else {
      const confirmed = confirm(
        `Möchtest du wirklich alle aktuellen Warnungen zurücksetzen?\n\n` +
        `${currentWarnings} Warnungen von ${resetStats.currentStats.usersWithWarnings} Usern werden gelöscht.\n\n` +
        `Die Logs bleiben zur Einsicht erhalten.`
      );

      if (!confirmed) return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/moderation/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmReset: true })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        // Aktualisiere alle Daten
        await Promise.all([
          fetchResetStats(),
          fetchStats(),
          fetchLogs(1)
        ]);
      } else {
        alert(`Fehler: ${data.error}`);
      }
    } catch (error) {
      console.error('Fehler beim manuellen Reset:', error);
      alert('Fehler beim Reset');
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
    fetchActiveMutes();
    fetchResetStats();
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [filterAction, filterUser, filterDays]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
    if (hours > 0) return `vor ${hours} Stunde${hours > 1 ? 'n' : ''}`;
    if (minutes > 0) return `vor ${minutes} Minute${minutes > 1 ? 'n' : ''}`;
    return 'gerade eben';
  };

  const formatRemainingTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const toggleDetails = (logId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const handleUnmute = async (userId: string, username: string) => {
    if (!confirm(`Möchtest du ${username} wirklich entmuten?`)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/moderation/unmute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          reason: 'Manually unmuted via dashboard'
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${username} wurde erfolgreich entmutet!`);
        // Aktualisiere die Listen
        fetchActiveMutes();
        fetchLogs(currentPage);
        fetchStats();
      } else {
        alert(`Fehler beim Entmuten: ${result.message}`);
      }
    } catch (error) {
      console.error('Fehler beim Entmuten:', error);
      alert('Fehler beim Entmuten des Users');
    }
  };

  return (
    <div className="space-y-8 p-6 animate-fade-in relative">
      {/* Matrix Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="matrix-blocks opacity-20">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="matrix-block"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Page Header */}
      <div className="text-center py-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            Moderations-Logs
          </h1>
        </div>
        <p className="text-dark-text text-lg max-w-2xl mx-auto">
          Vollständige Übersicht aller Moderations-Aktionen und Server-Events 📊
        </p>
        <div className="w-24 h-1 bg-gradient-neon mx-auto mt-4 rounded-full animate-glow"></div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-surface/90 backdrop-blur-xl rounded-xl border border-purple-primary/30 p-6 shadow-purple-glow">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-accent" />
              <div>
                <h3 className="text-white font-bold text-lg">{stats.totalActions}</h3>
                <p className="text-dark-text text-sm">Gesamt Aktionen</p>
              </div>
            </div>
          </div>
          
          <div className="bg-dark-surface/90 backdrop-blur-xl rounded-xl border border-purple-primary/30 p-6 shadow-purple-glow">
            <div className="flex items-center gap-3">
              <VolumeX className="w-8 h-8 text-red-400" />
              <div>
                <h3 className="text-white font-bold text-lg">{stats.actionCounts.mute || 0}</h3>
                <p className="text-dark-text text-sm">Mutes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-dark-surface/90 backdrop-blur-xl rounded-xl border border-purple-primary/30 p-6 shadow-purple-glow">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
              <div>
                <h3 className="text-white font-bold text-lg">{stats.actionCounts.warn || 0}</h3>
                <p className="text-dark-text text-sm">Warnungen</p>
              </div>
            </div>
          </div>
          
          <div className="bg-dark-surface/90 backdrop-blur-xl rounded-xl border border-purple-primary/30 p-6 shadow-purple-glow">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-purple-400" />
              <div>
                <h3 className="text-white font-bold text-lg">{stats.actionCounts.spam_delete || 0}</h3>
                <p className="text-dark-text text-sm">Spam gelöscht</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Mutes */}
      {activeMutes && activeMutes.length > 0 && (
        <div className="bg-dark-surface/90 backdrop-blur-xl rounded-xl border border-red-500/30 p-6 shadow-red-glow mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <VolumeX className="w-6 h-6 text-red-400" />
            Aktive Mutes ({activeMutes.length})
          </h2>
          <div className="space-y-3">
            {activeMutes.map((mute) => (
              <div key={mute.userId} className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{mute.username}</span>
                      <span className="text-gray-400 text-xs font-mono">ID: {mute.userId}</span>
                    </div>
                    <div className="text-dark-text text-sm">
                      <span className="text-orange-400">Grund:</span> {mute.reason}
                    </div>
                    <div className="text-dark-text text-sm">
                      <span className="text-blue-400">Von:</span> {mute.moderator} • 
                      <span className="text-purple-400 ml-1">Seit:</span> {formatDate(mute.mutedAt)}
                    </div>
                  </div>
                  <div className="text-right flex flex-col gap-2">
                    <div>
                      <span className="text-red-400 font-medium">
                        noch {formatRemainingTime(mute.remainingTime)}
                      </span>
                      <div className="text-dark-text text-sm">
                        bis {formatDate(mute.until)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnmute(mute.userId, mute.username)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" />
                      Unmute
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Reset System */}
      <div className="bg-dark-surface/90 backdrop-blur-xl rounded-xl border border-green-500/30 p-6 shadow-green-glow mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">Daily Reset System</h2>
          </div>
          <button
            onClick={() => setShowResetSection(!showResetSection)}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
          >
            {showResetSection ? 'Ausblenden' : 'Details anzeigen'}
          </button>
        </div>
        
        {resetStats && (
          <div className="space-y-4">
            {/* Info Panel */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                System-Status
              </h3>
              <p className="text-dark-text text-sm">
                <strong>Aktive Warnungen:</strong> {resetStats.currentStats?.currentWarnings || 0} (werden bei Reset zurückgesetzt) • 
                <strong className="ml-2">Log-Historie:</strong> {stats?.actionCounts?.warn || 0} (bleiben permanent gespeichert)
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-green-400" />
                    <div>
                      <h3 className="text-white font-bold">{resetStats.currentStats?.currentWarnings || 0}</h3>
                      <p className="text-dark-text text-sm">Aktive Warnungen</p>
                      <p className="text-xs text-gray-400">(werden bei Reset gelöscht)</p>
                    </div>
                  </div>
                </div>
              
                              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" />
                    <div>
                      <h3 className="text-white font-bold">{resetStats.currentStats?.usersWithWarnings || 0}</h3>
                      <p className="text-dark-text text-sm">User mit aktiven Warnungen</p>
                      <p className="text-xs text-gray-400">(bekommen fresh start bei Reset)</p>
                    </div>
                  </div>
                </div>
              
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="text-white font-bold text-sm">
                      {resetStats.currentStats?.nextResetTime 
                        ? new Date(resetStats.currentStats.nextResetTime).toLocaleString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Mitternacht'
                      }
                    </h3>
                    <p className="text-dark-text text-sm">Nächster Reset</p>
                  </div>
                </div>
              </div>
            </div>

            {showResetSection && (
              <div className="space-y-4">
                {/* Reset Description */}
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h3 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Wie funktioniert der Daily Reset?
                  </h3>
                  <ul className="text-dark-text text-sm space-y-1">
                    <li>• <strong>Automatisch:</strong> Jeden Tag um Mitternacht werden alle Warnungen zurückgesetzt</li>
                    <li>• <strong>Fresh Start:</strong> User bekommen täglich eine neue Chance</li>
                    <li>• <strong>Logs bleiben:</strong> Die Historie wird für Admins weiterhin gespeichert</li>
                    <li>• <strong>Mutes unberührt:</strong> Aktive Mutes werden NICHT zurückgesetzt</li>
                  </ul>
                </div>

                {/* Manual Reset Button */}
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <h3 className="text-red-400 font-bold mb-3">⚠️ Manueller Reset</h3>
                  <p className="text-dark-text text-sm mb-4">
                    Du kannst alle aktiven Warnungen sofort zurücksetzen. 
                    Dies wird als Admin-Aktion geloggt.
                  </p>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                    <h4 className="text-blue-400 font-bold text-sm mb-1">ℹ️ Status-Erklärung:</h4>
                    <p className="text-dark-text text-xs">
                      <strong>Aktive Warnungen:</strong> {resetStats.currentStats?.currentWarnings || 0} (können zurückgesetzt werden)<br />
                      <strong>Log-Historie:</strong> {stats?.actionCounts?.warn || 0} (bleiben immer erhalten)
                    </p>
                  </div>
                  <button
                    onClick={handleManualReset}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {resetStats.currentStats?.currentWarnings > 0 
                      ? `${resetStats.currentStats.currentWarnings} aktive Warnungen zurücksetzen`
                      : 'Reset durchführen (keine aktiven Warnungen)'
                    }
                  </button>
                </div>

                {/* Reset History */}
                {resetStats.resetHistory && resetStats.resetHistory.length > 0 && (
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                    <h3 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Reset-Historie (letzte 7 Tage)
                    </h3>
                    <div className="space-y-2">
                      {resetStats.resetHistory.map((reset: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-dark-text">
                            {new Date(reset.resetTime).toLocaleDateString('de-DE')}
                          </span>
                          <span className="text-white">
                            {reset.totalWarnings} Warnungen • {reset.usersWithWarnings} User
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Controls */}
      <div className="bg-dark-surface/90 backdrop-blur-xl rounded-xl border border-purple-primary/30 p-6 shadow-purple-glow">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-purple-accent" />
          <h2 className="text-lg font-bold text-white">Filter & Suche</h2>
          <button
            onClick={() => fetchLogs(currentPage)}
            className="ml-auto p-2 rounded-lg bg-purple-primary/20 hover:bg-purple-primary/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-purple-accent" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-dark-text text-sm mb-2">Aktion</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full p-3 bg-dark-bg border border-purple-primary/30 rounded-lg text-white focus:border-purple-accent focus:outline-none"
            >
              <option value="all">Alle Aktionen</option>
              <option value="mute">Mutes</option>
              <option value="warn">Warnungen</option>
              <option value="kick">Kicks</option>
              <option value="ban">Bans</option>
              <option value="spam_delete">Spam gelöscht</option>
              <option value="language_filter">Sprach-Filter</option>
            </select>
          </div>
          
          <div>
            <label className="block text-dark-text text-sm mb-2">Benutzer</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-text" />
              <input
                type="text"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                placeholder="Benutzername suchen..."
                className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-purple-primary/30 rounded-lg text-white placeholder-dark-text focus:border-purple-accent focus:outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-dark-text text-sm mb-2">Zeitraum</label>
            <select
              value={filterDays}
              onChange={(e) => setFilterDays(e.target.value)}
              className="w-full p-3 bg-dark-bg border border-purple-primary/30 rounded-lg text-white focus:border-purple-accent focus:outline-none"
            >
              <option value="">Alle Zeit</option>
              <option value="1">Letzte 24h</option>
              <option value="7">Letzte 7 Tage</option>
              <option value="30">Letzte 30 Tage</option>
              <option value="90">Letzte 90 Tage</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterAction('all');
                setFilterUser('');
                setFilterDays('');
              }}
              className="w-full p-3 bg-purple-primary/20 hover:bg-purple-primary/30 text-purple-accent rounded-lg transition-colors"
            >
              Filter zurücksetzen
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-dark-surface/90 backdrop-blur-xl rounded-xl border border-purple-primary/30 shadow-purple-glow overflow-hidden">
        <div className="p-6 border-b border-purple-primary/30">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-accent" />
            Moderations-Verlauf
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-purple-accent animate-spin mx-auto mb-4" />
            <p className="text-dark-text">Lade Logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-dark-text mx-auto mb-4 opacity-50" />
            <p className="text-dark-text">Keine Logs gefunden</p>
          </div>
        ) : (
          <div className="divide-y divide-purple-primary/20">
            {logs.map((log) => {
              const ActionIcon = actionIcons[log.action] || Shield;
              const isExpanded = showDetails[log.id];
              
              return (
                <div key={log.id} className="p-6 hover:bg-purple-primary/5 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg bg-gray-800 ${actionColors[log.action]}`}>
                      <ActionIcon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-medium ${actionColors[log.action]}`}>
                          {actionLabels[log.action] || log.action}
                        </span>
                        <span className="text-dark-text">•</span>
                        <span className="text-white font-medium">{log.targetUser.displayName}</span>
                        {log.moderator.id !== 'system' && (
                          <>
                            <span className="text-dark-text">von</span>
                            <span className="text-purple-accent">{log.moderator.displayName}</span>
                          </>
                        )}
                        <span className="text-dark-text ml-auto text-sm">
                          {formatTimeAgo(log.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-dark-text text-sm mb-2">{log.reason}</p>
                      
                      {(log.formattedDuration || log.warningCount !== undefined || log.content) && (
                        <div className="flex items-center gap-4 text-sm">
                          {log.formattedDuration && (
                            <span className="text-yellow-400">
                              <Clock className="w-4 h-4 inline mr-1" />
                              {log.formattedDuration}
                            </span>
                          )}
                          {log.warningCount !== undefined && (
                            <span className="text-orange-400">
                              <AlertTriangle className="w-4 h-4 inline mr-1" />
                              {log.warningCount} Warnungen
                            </span>
                          )}
                          {log.content && (
                            <button
                              onClick={() => toggleDetails(log.id)}
                              className="text-purple-accent hover:text-purple-light transition-colors"
                            >
                              <Eye className="w-4 h-4 inline mr-1" />
                              {isExpanded ? 'Weniger' : 'Details'}
                            </button>
                          )}
                        </div>
                      )}
                      
                      {isExpanded && log.content && (
                        <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                          <p className="text-sm text-dark-text">
                            <strong>Nachrichteninhalt:</strong>
                          </p>
                          <p className="text-sm text-white font-mono bg-black/30 p-2 rounded mt-2 break-words">
                            "{log.content}"
                          </p>
                          {log.spamType && (
                            <p className="text-sm text-purple-accent mt-2">
                              <strong>Spam-Typ:</strong> {log.spamType}
                            </p>
                          )}
                          {log.badWord && (
                            <p className="text-sm text-red-400 mt-2">
                              <strong>Erkanntes Wort:</strong> {log.badWord}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right text-sm text-dark-text">
                      {formatDate(log.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-purple-primary/30 flex items-center justify-between">
            <span className="text-dark-text text-sm">
              Seite {currentPage} von {totalPages}
            </span>
            
            <div className="flex gap-2">
              <button
                onClick={() => fetchLogs(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-purple-primary/20 hover:bg-purple-primary/30 disabled:opacity-50 disabled:hover:bg-purple-primary/20 text-purple-accent rounded-lg transition-colors"
              >
                Zurück
              </button>
              <button
                onClick={() => fetchLogs(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-purple-primary/20 hover:bg-purple-primary/30 disabled:opacity-50 disabled:hover:bg-purple-primary/20 text-purple-accent rounded-lg transition-colors"
              >
                Weiter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs; 