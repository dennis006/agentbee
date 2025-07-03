import { useState, useEffect } from 'react';
import { Play, Square, Plus, Trash2, Users, MessageCircle, Bot, Zap, Star, TrendingUp, Clock, Hash, Settings, Shield, Volume2, BarChart3, Tv } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';

// 🎮 Twitch Bot Dashboard - Multi-Channel Management
const TwitchBot = () => {
  const [botStatus, setBotStatus] = useState({
    isRunning: false,
    connectedChannels: [],
    totalMessages: 0,
    uptime: '0h 0m',
    lastActivity: null
  });

  const [channels, setChannels] = useState([]);
  const [stats, setStats] = useState({
    totalChannels: 0,
    totalMessages: 0,
    dailyMessages: 0,
    dailyCommands: 0,
    isRunning: false
  });

  const [newChannel, setNewChannel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Floating Particles Effect
  const createFloatingParticles = () => {
    const particles = [];
    for (let i = 0; i < 20; i++) {
      particles.push(
        <div
          key={i}
          className="absolute w-1 h-1 bg-purple-400/30 rounded-full animate-float-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${4 + Math.random() * 4}s`
          }}
        />
      );
    }
    return particles;
  };

  // API Base URL - Verwendet gleiche Domain wie Discord Bot
  const apiUrl = import.meta.env.VITE_API_URL || 'https://agentbee.up.railway.app';

  // Daten laden
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Bot Status laden
      const statusResponse = await fetch(`${apiUrl}/api/twitch/status`);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setBotStatus(statusData.status || {
          isRunning: false,
          connectedChannels: [],
          totalMessages: 0,
          uptime: '0h 0m',
          lastActivity: null
        });
      }

      // Channels laden
      const channelsResponse = await fetch(`${apiUrl}/api/twitch/channels`);
      if (channelsResponse.ok) {
        const channelsData = await channelsResponse.json();
        setChannels(channelsData.channels || []);
      }

      // Stats laden
      const statsResponse = await fetch(`${apiUrl}/api/twitch/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          totalChannels: (statsData.stats?.totalChannels || statsData.totalChannels) || 0,
          totalMessages: (statsData.stats?.totalMessages || statsData.totalMessages) || 0,
          dailyMessages: (statsData.stats?.dailyMessages || statsData.dailyMessages) || 0,
          dailyCommands: (statsData.stats?.dailyCommands || statsData.dailyCommands) || 0,
          isRunning: (statsData.stats?.isRunning || statsData.isRunning) || false
        });
      }

    } catch (error) {
      console.error('❌ Twitch Data Load Error:', error);
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  // Channel hinzufügen
  const addChannel = async () => {
    if (!newChannel.trim()) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${apiUrl}/api/twitch/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelName: newChannel.trim().toLowerCase()
        })
      });

      if (response.ok) {
        setSuccess(`Channel "${newChannel}" erfolgreich hinzugefügt!`);
        setNewChannel('');
        await loadData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Fehler beim Hinzufügen des Channels');
      }
    } catch (error) {
      console.error('❌ Add Channel Error:', error);
      setError('Netzwerkfehler beim Hinzufügen des Channels');
    } finally {
      setLoading(false);
    }
  };

  // Channel entfernen
  const removeChannel = async (channelName: string) => {
    if (!confirm(`Channel "${channelName}" wirklich entfernen?`)) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${apiUrl}/api/twitch/channels/${channelName}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess(`Channel "${channelName}" erfolgreich entfernt!`);
        await loadData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Fehler beim Entfernen des Channels');
      }
    } catch (error) {
      console.error('❌ Remove Channel Error:', error);
      setError('Netzwerkfehler beim Entfernen des Channels');
    } finally {
      setLoading(false);
    }
  };

  // Daten laden beim Mount und alle 30 Sekunden
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-clear Messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-mesh-purple opacity-20 animate-gradient bg-[length:400%_400%]"></div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {createFloatingParticles()}
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur opacity-30 animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-neon rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-gentle">
              <Tv className="w-10 h-10 text-dark-bg" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-neon mb-4 animate-title-glow">
            🎮 AgentBee Twitch Bot
          </h1>
          <p className="text-xl text-dark-muted mb-2 animate-slide-in-up delay-200">
            Multi-Channel Twitch Chat Bot
          </p>
          <p className="text-dark-muted animate-slide-in-up delay-300">
            Verwalte mehrere Twitch Channels gleichzeitig
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Bot Status */}
          <div className="cyber-card p-6 animate-fade-in-up [animation-delay:0.1s]">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                botStatus?.isRunning ? "bg-green-400" : "bg-red-400"
              )} />
              <Bot className="w-6 h-6 text-neon-purple" />
              <span className="font-medium text-neon-purple">Bot Status</span>
            </div>
            <div className="text-2xl font-bold text-dark-text mb-2">
              {botStatus?.isRunning ? 'Online' : 'Offline'}
            </div>
            <div className="text-sm text-dark-muted">
              Uptime: {botStatus?.uptime || '0h 0m'}
            </div>
          </div>

          {/* Channels */}
          <div className="cyber-card p-6 animate-fade-in-up [animation-delay:0.2s]">
            <div className="flex items-center gap-3 mb-4">
              <Hash className="w-6 h-6 text-purple-400" />
              <span className="font-medium text-purple-400">Channels</span>
            </div>
            <div className="text-2xl font-bold text-dark-text mb-2">
              {stats.totalChannels || 0}
            </div>
            <div className="text-sm text-dark-muted">
              Verbundene Channels
            </div>
          </div>

          {/* Messages */}
          <div className="cyber-card p-6 animate-fade-in-up [animation-delay:0.3s]">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-6 h-6 text-blue-400" />
              <span className="font-medium text-blue-400">Nachrichten</span>
            </div>
            <div className="text-2xl font-bold text-dark-text mb-2">
              {(stats.totalMessages || 0).toLocaleString()}
            </div>
            <div className="text-sm text-dark-muted">
              Heute: {stats.dailyMessages || 0}
            </div>
          </div>

          {/* Commands */}
          <div className="cyber-card p-6 animate-fade-in-up [animation-delay:0.4s]">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-yellow-400" />
              <span className="font-medium text-yellow-400">Commands</span>
            </div>
            <div className="text-2xl font-bold text-dark-text mb-2">
              {stats.dailyCommands || 0}
            </div>
            <div className="text-sm text-dark-muted">
              Heute ausgeführt
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 animate-shake">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400 animate-fade-in">
            {success}
          </div>
        )}

        {/* Channel Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Add Channel */}
          <div className="cyber-card p-8 animate-fade-in-up [animation-delay:0.5s]">
            <h2 className="text-2xl font-bold text-neon-purple mb-6 flex items-center gap-3">
              <Plus className="w-6 h-6" />
              Channel hinzufügen
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Twitch Channel Name
                </label>
                <Input
                  type="text"
                  placeholder="z.B. shroud"
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  className="bg-dark-bg/50 border-purple-primary/30 text-dark-text"
                  onKeyPress={(e) => e.key === 'Enter' && addChannel()}
                />
                <p className="text-xs text-dark-muted mt-1">
                  Der Bot tritt automatisch dem Channel bei
                </p>
              </div>
              
              <Button
                onClick={addChannel}
                disabled={loading || !newChannel.trim()}
                variant="cyber"
                className="w-full"
              >
                {loading ? '🔄 Wird hinzugefügt...' : '➕ Channel hinzufügen'}
              </Button>
            </div>
          </div>

          {/* Connected Channels */}
          <div className="cyber-card p-8 animate-fade-in-up [animation-delay:0.6s]">
            <h2 className="text-2xl font-bold text-neon-purple mb-6 flex items-center gap-3">
              <Users className="w-6 h-6" />
              Verbundene Channels ({channels?.length || 0})
            </h2>
            
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {!channels || channels.length === 0 ? (
                <div className="text-center py-8 text-dark-muted">
                  <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine Channels hinzugefügt</p>
                  <p className="text-sm mt-2">Füge deinen ersten Channel hinzu!</p>
                </div>
              ) : (
                (channels || []).map((channel: any, index) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-4 bg-dark-bg/30 rounded-lg border border-purple-primary/20 hover:border-purple-primary/40 transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        channel.enabled ? "bg-green-400 animate-pulse" : "bg-gray-400"
                      )} />
                      <Hash className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="font-medium text-dark-text">
                          {channel.channel_name}
                        </div>
                        <div className="text-xs text-dark-muted">
                          Hinzugefügt: {channel.added_at ? new Date(channel.added_at).toLocaleDateString('de-DE') : 'Unbekannt'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-dark-muted">
                        {channel.message_count || 0} Messages
                      </div>
                      <Button
                        onClick={() => removeChannel(channel.channel_name)}
                        variant="destructive"
                        size="sm"
                        className="hover:scale-110 transition-transform duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bot Features Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="cyber-card p-6 animate-fade-in-up [animation-delay:0.8s]">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-green-400" />
              <span className="font-medium text-green-400">Moderation</span>
            </div>
            <ul className="text-sm text-dark-muted space-y-2">
              <li>• Anti-Spam Schutz</li>
              <li>• Auto-Timeouts</li>
              <li>• Wort-Filter</li>
              <li>• Caps-Limit</li>
            </ul>
          </div>

          <div className="cyber-card p-6 animate-fade-in-up [animation-delay:0.9s]">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-yellow-400" />
              <span className="font-medium text-yellow-400">Commands</span>
            </div>
            <ul className="text-sm text-dark-muted space-y-2">
              <li>• !ping - Bot Test</li>
              <li>• !bot - Bot Info</li>
              <li>• !uptime - Laufzeit</li>
              <li>• !stats - Statistiken</li>
            </ul>
          </div>

          <div className="cyber-card p-6 animate-fade-in-up [animation-delay:1.0s]">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <span className="font-medium text-blue-400">Features</span>
            </div>
            <ul className="text-sm text-dark-muted space-y-2">
              <li>• Chat Logging</li>
              <li>• Auto-Responses</li>
              <li>• User Tracking</li>
              <li>• Multi-Channel</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 animate-fade-in-up [animation-delay:1.1s]">
          <p className="text-dark-muted">
            🎮 AgentBee Twitch Bot - Powered by AgentBee Technology ⚡
          </p>
          <p className="text-xs text-dark-muted mt-2">
            Multi-Channel Support | Auto-Moderation | Real-time Stats
          </p>
        </div>
      </div>
    </div>
  );
};

export default TwitchBot; 