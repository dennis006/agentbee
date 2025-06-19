import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Shield, AlertTriangle, CheckCircle, Users, Lock, Eye, EyeOff, Settings, RefreshCw, Server, Ban, UserX, Activity, Clock, FileText, Download, Trash2, Search } from 'lucide-react';
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
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant === 'outline' ? 'border border-purple-primary text-purple-primary bg-transparent' : variant === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : variant === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : variant === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-purple-primary text-white'} ${className}`}>
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
    className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-green-500' : 'bg-dark-bg'} ${className}`}
  >
    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

// Interfaces
interface SecuritySettings {
  autoMod: {
    enabled: boolean;
    filterSpam: boolean;
    filterToxicity: boolean;
    filterLinks: boolean;
    filterCaps: boolean;
    maxWarnings: number;
    timeoutDuration: number;
  };
  rateLimit: {
    enabled: boolean;
    maxMessages: number;
    timeWindow: number;
    punishment: 'warn' | 'timeout' | 'kick' | 'ban';
  };
  verification: {
    enabled: boolean;
    level: 'low' | 'medium' | 'high' | 'extreme';
    requireCaptcha: boolean;
    minAccountAge: number;
  };
  logging: {
    enabled: boolean;
    logChannel: string;
    logJoins: boolean;
    logLeaves: boolean;
    logDeletes: boolean;
    logEdits: boolean;
    logBans: boolean;
  };
  backup: {
    enabled: boolean;
    interval: number;
    maxBackups: number;
    lastBackup: number;
  };
}

interface SecurityStats {
  totalEvents: number;
  blockedThreats: number;
  autoModActions: number;
  uptime: string;
  riskLevel: 'low' | 'medium' | 'high';
  lastScan: string;
}

interface SecurityLog {
  id: string;
  timestamp: number;
  type: 'warning' | 'block' | 'ban' | 'kick' | 'timeout';
  user: {
    id: string;
    username: string;
  };
  reason: string;
  action: string;
  severity: 'low' | 'medium' | 'high';
}

const Security: React.FC = () => {
  const { toasts, success, error: showError, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState<SecuritySettings>({
    autoMod: {
      enabled: true,
      filterSpam: true,
      filterToxicity: true,
      filterLinks: false,
      filterCaps: true,
      maxWarnings: 3,
      timeoutDuration: 300
    },
    rateLimit: {
      enabled: true,
      maxMessages: 5,
      timeWindow: 10,
      punishment: 'timeout'
    },
    verification: {
      enabled: false,
      level: 'medium',
      requireCaptcha: false,
      minAccountAge: 7
    },
    logging: {
      enabled: true,
      logChannel: 'security-logs',
      logJoins: true,
      logLeaves: true,
      logDeletes: true,
      logEdits: false,
      logBans: true
    },
    backup: {
      enabled: true,
      interval: 24,
      maxBackups: 7,
      lastBackup: Date.now() - 86400000
    }
  });

  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 1247,
    blockedThreats: 89,
    autoModActions: 156,
    uptime: '99.8%',
    riskLevel: 'low',
    lastScan: new Date().toISOString()
  });

  const [logs, setLogs] = useState<SecurityLog[]>([
    {
      id: '1',
      timestamp: Date.now() - 3600000,
      type: 'block',
      user: { id: '123', username: 'TestUser' },
      reason: 'Spam detection',
      action: 'Message deleted',
      severity: 'medium'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Hier würden normalerweise API-Calls stattfinden
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      showError('Fehler beim Laden der Security-Daten');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      // API Call würde hier stattfinden
      await new Promise(resolve => setTimeout(resolve, 1000));
      success('🛡️ Security-Einstellungen erfolgreich gespeichert!');
    } catch (error) {
      showError('Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  const runSecurityScan = async () => {
    try {
      success('🔍 Security-Scan gestartet...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      success('✅ Security-Scan abgeschlossen - Keine Bedrohungen gefunden!');
      setStats(prev => ({ ...prev, lastScan: new Date().toISOString() }));
    } catch (error) {
      showError('Fehler beim Security-Scan');
    }
  };

  const createBackup = async () => {
    try {
      success('💾 Backup wird erstellt...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      success('✅ Backup erfolgreich erstellt!');
      setSettings(prev => ({
        ...prev,
        backup: { ...prev.backup, lastBackup: Date.now() }
      }));
    } catch (error) {
      showError('Fehler beim Erstellen des Backups');
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-500/20 text-blue-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredLogs = logs.filter(log => 
    log.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Security Center...</div>
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
          <Shield className="w-12 h-12 text-green-400 animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
            Security Center
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Schütze deinen Discord Server vor Bedrohungen und halte alles unter Kontrolle! 
          <span className="ml-2 inline-block relative">
            🛡️
          </span>
        </div>
        <div className="w-32 h-1 bg-gradient-to-r from-green-400 to-emerald-500 mx-auto mt-4 rounded-full animate-glow"></div>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-green-500/30 shadow-green-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Bedrohungen blockiert</CardTitle>
            <Shield className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.blockedThreats}</div>
            <p className="text-xs text-dark-muted">
              Letzte 30 Tage
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-blue-500/30 shadow-blue-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">AutoMod Aktionen</CardTitle>
            <Activity className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.autoModActions}</div>
            <p className="text-xs text-dark-muted">
              Automatische Moderationen
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-purple-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-accent">{stats.uptime}</div>
            <p className="text-xs text-dark-muted">
              System-Verfügbarkeit
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface/90 backdrop-blur-xl border-yellow-500/30 shadow-yellow-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Risiko-Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskLevelColor(stats.riskLevel)}`}>
              {stats.riskLevel.toUpperCase()}
            </div>
            <p className="text-xs text-dark-muted">
              Aktuelle Bedrohungslage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <Button 
          onClick={runSecurityScan} 
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Security-Scan</span>
        </Button>
        
        <Button 
          onClick={createBackup} 
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Download className="h-5 w-5" />
          <span>Backup erstellen</span>
        </Button>
        
        <Button 
          onClick={saveSettings} 
          disabled={saving} 
          className="bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105 flex items-center space-x-2"
        >
          <Settings className="h-5 w-5" />
          <span>{saving ? 'Speichere...' : 'Einstellungen speichern'}</span>
        </Button>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Security; 