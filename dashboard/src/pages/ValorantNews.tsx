import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useToast, ToastContainer } from '../components/ui/toast'
import { 
  Newspaper, 
  RefreshCw, 
  Settings, 
  Activity, 
  Clock, 
  Hash, 
  BarChart3,
  CheckCircle2,
  XCircle,
  Calendar,
  MessageSquare,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'

interface NewsStats {
  total: number;
  posted: number;
  pending: number;
  lastUpdate: string;
  autoUpdateActive: boolean;
  targetChannel: string;
  updateInterval: string;
  nextUpdate: string;
}

const ValorantNews = () => {
  const { toasts, removeToast, addToast } = useToast()
  const [newsStats, setNewsStats] = useState<NewsStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Lade News-Statistiken
  const fetchNewsStats = async () => {
    try {
      setLoading(true)
      const apiUrl = import.meta.env.VITE_API_URL || 'https://agentbee.up.railway.app'
      
      const response = await fetch(`${apiUrl}/api/valorant/news`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNewsStats(data.stats)
          addToast('News-Statistiken geladen', 'success')
        } else {
          addToast('Fehler beim Laden der News-Statistiken', 'error')
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Fehler beim Laden der News-Statistiken:', error)
      addToast('Fehler beim Laden der News-Statistiken', 'error')
    } finally {
      setLoading(false)
    }
  }

  // News manuell aktualisieren
  const forceUpdateNews = async () => {
    try {
      setUpdating(true)
      const apiUrl = import.meta.env.VITE_API_URL || 'https://agentbee.up.railway.app'
      
      const response = await fetch(`${apiUrl}/api/valorant/news/update`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          addToast(`News aktualisiert! ${data.newNewsCount || 0} neue News gefunden`, 'success')
          // Statistiken neu laden
          setTimeout(() => {
            fetchNewsStats()
          }, 1000)
        } else {
          addToast(data.message || 'Fehler beim Aktualisieren der News', 'error')
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der News:', error)
      addToast('Fehler beim Aktualisieren der News', 'error')
    } finally {
      setUpdating(false)
    }
  }

  // Beim Laden der Komponente
  useEffect(() => {
    fetchNewsStats()
    
    // Auto-refresh alle 30 Sekunden
    const interval = setInterval(fetchNewsStats, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6 p-6 pb-20 animate-fade-in min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-neon flex items-center gap-3">
            <Newspaper className="w-8 h-8 text-purple-accent animate-pulse" />
            Valorant News System
          </h1>
          <p className="text-dark-muted mt-2">
            Automatische Valorant News Updates für deinen Discord Server
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={fetchNewsStats}
            disabled={loading}
            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-400/30 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
          
          <Button
            onClick={forceUpdateNews}
            disabled={updating}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl shadow-purple-glow hover:shadow-purple-glow-strong transition-all duration-300"
          >
            <TrendingUp className={`w-4 h-4 mr-2 ${updating ? 'animate-bounce' : ''}`} />
            {updating ? 'Updating...' : 'News Update'}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Gesamt News */}
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-neon hover:shadow-neon-strong transition-all duration-300 animate-fade-in hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Gesamt News</CardTitle>
            <BarChart3 className="h-6 w-6 text-purple-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neon-purple">
              {newsStats?.total || 0}
            </div>
            <p className="text-xs text-dark-muted">
              📰 Alle verfügbaren News
            </p>
          </CardContent>
        </Card>

        {/* Gepostete News */}
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-green-400/30 shadow-neon hover:shadow-neon-strong transition-all duration-300 animate-fade-in hover:scale-105" style={{animationDelay: '0.1s'}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Gepostete News</CardTitle>
            <CheckCircle2 className="h-6 w-6 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">
              {newsStats?.posted || 0}
            </div>
            <p className="text-xs text-dark-muted">
              ✅ Erfolgreich gepostet
            </p>
          </CardContent>
        </Card>

        {/* Ausstehende News */}
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-yellow-400/30 shadow-neon hover:shadow-neon-strong transition-all duration-300 animate-fade-in hover:scale-105" style={{animationDelay: '0.2s'}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Ausstehend</CardTitle>
            <Clock className="h-6 w-6 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">
              {newsStats?.pending || 0}
            </div>
            <p className="text-xs text-dark-muted">
              ⏳ Wartend auf Posting
            </p>
          </CardContent>
        </Card>

        {/* Auto-Update Status */}
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-blue-400/30 shadow-neon hover:shadow-neon-strong transition-all duration-300 animate-fade-in hover:scale-105" style={{animationDelay: '0.3s'}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dark-text">Auto-Update</CardTitle>
            <Activity className={`h-6 w-6 ${newsStats?.autoUpdateActive ? 'text-green-400 animate-pulse' : 'text-red-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${newsStats?.autoUpdateActive ? 'text-green-400' : 'text-red-400'}`}>
              {newsStats?.autoUpdateActive ? 'AKTIV' : 'INAKTIV'}
            </div>
            <p className="text-xs text-dark-muted">
              🤖 Automatische Updates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Konfiguration & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Konfiguration */}
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow animate-fade-in" style={{animationDelay: '0.4s'}}>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
              <Settings className="text-purple-primary" />
              Konfiguration
            </CardTitle>
            <CardDescription className="text-dark-muted">
              Aktuelle Einstellungen des News-Systems
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Ziel-Channel */}
            <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-purple-accent" />
                <div>
                  <div className="text-sm font-medium text-dark-text">Ziel-Channel</div>
                  <div className="text-xs text-dark-muted">News werden hier gepostet</div>
                </div>
              </div>
              <div className="text-sm font-mono text-neon-purple">
                #{newsStats?.targetChannel || 'nicht-konfiguriert'}
              </div>
            </div>

            {/* Update-Intervall */}
            <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm font-medium text-dark-text">Update-Intervall</div>
                  <div className="text-xs text-dark-muted">Wie oft nach News gesucht wird</div>
                </div>
              </div>
              <div className="text-sm font-mono text-blue-400">
                {newsStats?.updateInterval || 'unbekannt'}
              </div>
            </div>

            {/* Nächstes Update */}
            <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-purple-primary/20">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-sm font-medium text-dark-text">Nächstes Update</div>
                  <div className="text-xs text-dark-muted">Wann das nächste Update stattfindet</div>
                </div>
              </div>
              <div className="text-sm font-mono text-yellow-400">
                {newsStats?.nextUpdate || 'Nie'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System-Status */}
        <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow animate-fade-in" style={{animationDelay: '0.5s'}}>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
              <Activity className="text-green-400" />
              System-Status
            </CardTitle>
            <CardDescription className="text-dark-muted">
              Übersicht über die News-System Performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Letztes Update */}
            <div className="flex items-center justify-between p-3 bg-dark-bg/50 rounded-lg border border-green-400/20">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-sm font-medium text-dark-text">Letztes Update</div>
                  <div className="text-xs text-dark-muted">Wann zuletzt nach News gesucht wurde</div>
                </div>
              </div>
              <div className="text-sm font-mono text-green-400">
                {newsStats?.lastUpdate || 'Nie'}
              </div>
            </div>

            {/* System Health */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-dark-text mb-2">System Health</div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-dark-muted">🔄 Auto-Update System</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  newsStats?.autoUpdateActive 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {newsStats?.autoUpdateActive ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-dark-muted">📡 API Verbindung</span>
                <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                  Verbunden
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-dark-muted">💾 Datenbank</span>
                <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                  Aktiv
                </span>
              </div>
            </div>

            {/* Statistiken */}
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-blue-600/20 border border-purple-primary/30 rounded-lg">
              <div className="text-sm font-medium text-purple-accent mb-2">📊 Performance</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-dark-muted">
                  Erfolgsrate: <span className="text-green-400 font-mono">
                    {newsStats && newsStats.total > 0 
                      ? Math.round((newsStats.posted / newsStats.total) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="text-dark-muted">
                  Warteschlange: <span className="text-yellow-400 font-mono">
                    {newsStats?.pending || 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border border-blue-500/30 animate-fade-in" style={{animationDelay: '0.6s'}}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-blue-400 mb-2">
                ℹ️ Valorant News System Information
              </h3>
              <div className="text-dark-muted text-sm space-y-2">
                <p>
                  • Das System prüft automatisch alle paar Minuten nach neuen Valorant News von Riot Games
                </p>
                <p>
                  • Neue News werden automatisch in den konfigurierten Discord-Channel gepostet
                </p>
                <p>
                  • Du kannst jederzeit manuell nach Updates suchen mit dem "News Update" Button
                </p>
                <p>
                  • Die Statistiken werden in Echtzeit aktualisiert und zeigen die aktuelle Performance
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4 text-xs">
                <span className="bg-blue-500/20 px-3 py-1 rounded-full text-blue-300">
                  🎮 Valorant Integration
                </span>
                <span className="bg-purple-500/20 px-3 py-1 rounded-full text-purple-300">
                  🤖 Vollautomatisch
                </span>
                <span className="bg-green-500/20 px-3 py-1 rounded-full text-green-300">
                  ⚡ Echtzeit Updates
                </span>
                <span className="bg-yellow-500/20 px-3 py-1 rounded-full text-yellow-300">
                  📊 Live Statistiken
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

export default ValorantNews 