import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Home, FileText, BarChart3, Settings as SettingsIcon, Zap, Heart, Star, Play, Shield, Users, ChevronDown, Target, Key, Bot, Ticket, Activity, Gift, Music, LogOut, User, Server, Newspaper, Gamepad2 } from 'lucide-react'
import AuthProvider, { useAuth } from './contexts/AuthContext'
// Import API library to activate global fetch override
import './lib/api'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Rules from './pages/Rules'
import Logs from './pages/Logs'
import SettingsPage from './pages/Settings'
import Welcome from './pages/Welcome'
import VerifyPage from './pages/VerifyPage'
import VerificationSettings from './pages/VerificationSettings'
import XP from './pages/XP'
import TwitchNotifications from './pages/TwitchNotifications'
import Valorant from './pages/Valorant'
import ValorantNews from './pages/ValorantNews'

import Gaming from './pages/Gaming'
import APIKeys from './pages/APIKeys'
import Security from './pages/Security'
// GELÖSCHT: ServerManager entfernt

import BotIntroduction from './pages/BotIntroduction'
import TicketSystem from './pages/TicketSystem'
import ServerStats from './pages/ServerStats'
import Giveaway from './pages/Giveaway'
import MusicPage from './pages/Music'
// AFKAutoMove entfernt - verwende Discord Native AFK

// Komponente für digitale Regen-Tropfen
const DigitalRain = () => {
  const rainDrops = Array.from({ length: 30 }, (_, i) => (
    <div
      key={i}
      className="rain-drop"
      style={{
        left: `${Math.random() * 100}%`,
        height: `${50 + Math.random() * 100}px`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${1 + Math.random() * 2}s`
      }}
    />
  ));

  return <div className="digital-rain">{rainDrops}</div>;
};

// Navigation Komponente mit Dropdown-Gruppierung
const Navigation = ({ 
  activeTab, 
  setActiveTab, 
  systemStatus 
}: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  systemStatus: {
    isOnline: boolean;
    status: string;
    uptime?: string;
  }
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const { user, logout } = useAuth()

  // Gruppierte Navigation Items
  const navGroups = [
    {
      id: 'dashboard',
      icon: Home,
      label: 'Dashboard',
      description: 'Bot Status & Control',
      isStandalone: true,
      page: 'dashboard'
    },
    {
      id: 'moderation',
      icon: Shield,
      label: 'Moderation',
      description: 'Server Management',
      items: [
        { id: 'rules', icon: FileText, label: 'Rules', description: 'Server Rules Management' },
        { id: 'logs', icon: BarChart3, label: 'Statistiken', description: 'Stats & User Management' },
        { id: 'server-stats', icon: Activity, label: 'Server Stats', description: 'Live Server Statistics' },
        // GELÖSCHT: Server Manager entfernt
        { id: 'verification', icon: Users, label: 'Verification', description: 'Verify Settings' }
      ]
    },
    {
      id: 'community',
      icon: Heart,
      label: 'Community',
      description: 'User Experience',
      items: [
        { id: 'welcome', icon: Heart, label: 'Welcome', description: 'Welcome Messages' },
        { id: 'xp', icon: Star, label: 'XP System', description: 'Experience & Leveling' },
        { id: 'giveaway', icon: Gift, label: 'Giveaways', description: 'Giveaway Management' }
      ]
    },
    {
      id: 'features',
      icon: Play,
      label: 'Features',
      description: 'Special Functions',
      items: [
        { id: 'gaming', icon: Gamepad2, label: 'Gaming System', description: 'Smart Auto-Ping & Team Management' },
        { id: 'music', icon: Music, label: 'Music Bot', description: 'YouTube Music Player & Control' },
        { id: 'tickets', icon: Ticket, label: 'Ticket System', description: 'Support & Help Desk System' },
        // AFK System entfernt - verwende Discord Native AFK
        { id: 'twitch', icon: Play, label: 'Twitch Live', description: 'Live Stream Notifications' },
        { id: 'valorant', icon: Target, label: 'Valorant', description: 'Player Stats & MMR Tracking' },
        { id: 'valorant-news', icon: Newspaper, label: 'Valorant News', description: 'Automatische News Updates' },
    
      ]
    },
    {
      id: 'settings',
      icon: SettingsIcon,
      label: 'Settings',
      description: 'Bot Configuration',
      items: [
        { id: 'settings', icon: SettingsIcon, label: 'Bot Settings', description: 'General Bot Configuration' },
        { id: 'api-keys', icon: Key, label: 'API Keys', description: 'Manage API Credentials' },
        { id: 'security', icon: Shield, label: 'Security Center', description: 'Bot Security & Protection' },
        { id: 'bot-introduction', icon: Bot, label: 'Bot Introduction', description: 'Automatic Bot Introductions' }
      ]
    }
  ]

  // Prüfen ob eine Seite in der aktuellen Gruppe aktiv ist
  const isGroupActive = (group: any) => {
    if (group.isStandalone) {
      return activeTab === group.page
    }
    return group.items?.some((item: any) => item.id === activeTab)
  }

  return (
    <nav className="bg-dark-surface/90 backdrop-blur-xl border-b border-purple-primary/30 shadow-purple-glow relative z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between py-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-neon rounded-lg flex items-center justify-center animate-pulse">
                <Zap className="w-6 h-6 text-dark-bg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-neon">
                  AgentBee Dashboard
                </h1>
                <p className="text-xs text-dark-muted">AgentBee Bot Control Center</p>
              </div>
            </div>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            {/* User Avatar & Info */}
            {user && (
              <div className="flex items-center gap-3 px-3 py-2 bg-dark-bg/50 rounded-lg border border-purple-primary/30">
                <div className="w-8 h-8 rounded-full bg-gradient-neon flex items-center justify-center">
                  <User className="w-4 h-4 text-dark-bg" />
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-neon-purple">{user.username}</div>
                  <div className="text-xs text-dark-muted">Admin</div>
                </div>
              </div>
            )}
            
            {/* Logout Button */}
            <button
              onClick={logout}
              className="group flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg border border-red-500/30 hover:border-red-500/50 transition-all duration-300 hover:scale-105"
              title="Logout"
            >
              <LogOut className="w-4 h-4 group-hover:animate-bounce" />
              <span className="hidden md:block text-sm">Logout</span>
            </button>
          </div>

          {/* Navigation Groups */}
          <div className="flex gap-2">
            {navGroups.map((group) => {
              const Icon = group.icon
              const isActive = isGroupActive(group)
              const hasDropdown = !group.isStandalone

              return (
                <div
                  key={group.id}
                  className="relative"
                  onMouseEnter={() => hasDropdown && setOpenDropdown(group.id)}
                  onMouseLeave={() => hasDropdown && setOpenDropdown(null)}
                >
                  <button
                    onClick={() => {
                      if (group.isStandalone) {
                        setActiveTab(group.page!)
                      } else {
                        // Bei Dropdown-Gruppen: Erstes Item auswählen
                        setActiveTab(group.items![0].id)
                      }
                    }}
                    className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-primary to-purple-secondary text-white shadow-neon'
                        : 'bg-dark-bg/50 text-dark-text hover:bg-purple-primary/20 hover:text-neon-purple'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : 'group-hover:animate-bounce'}`} />
                    <div className="hidden md:block">
                      <div className="font-medium text-sm flex items-center gap-1">
                        {group.label}
                        {hasDropdown && <ChevronDown className="w-3 h-3" />}
                      </div>
                      <div className="text-xs opacity-70">{group.description}</div>
                    </div>
                    
                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-neon-purple rounded-full animate-ping" />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {hasDropdown && openDropdown === group.id && (
                    <div className="absolute top-full left-0 pt-2 w-64 z-50">
                      {/* Invisible bridge to prevent gap */}
                      <div className="absolute top-0 left-0 right-0 h-2 bg-transparent"></div>
                      
                      <div className="bg-dark-surface/95 backdrop-blur-xl border border-purple-primary/30 rounded-xl shadow-purple-glow animate-fade-in">
                        <div className="p-2">
                          {group.items!.map((item) => {
                            const ItemIcon = item.icon
                            const isItemActive = activeTab === item.id
                            
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setActiveTab(item.id)
                                  setOpenDropdown(null)
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-left ${
                                  isItemActive
                                    ? 'bg-purple-primary text-white shadow-neon'
                                    : 'text-dark-text hover:bg-purple-primary/20 hover:text-neon-purple'
                                }`}
                              >
                                <ItemIcon className={`w-4 h-4 ${isItemActive ? 'animate-pulse' : ''}`} />
                                <div>
                                  <div className="font-medium text-sm">{item.label}</div>
                                  <div className="text-xs opacity-70">{item.description}</div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            {/* Desktop Version */}
            <div className="hidden lg:flex items-center gap-2 bg-dark-bg/50 rounded-lg px-3 py-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                systemStatus.isOnline 
                  ? 'bg-green-400 animate-pulse' 
                  : systemStatus.status === 'stopping' || systemStatus.status === 'starting'
                    ? 'bg-yellow-400 animate-bounce'
                    : 'bg-red-400 animate-pulse'
              }`} />
              <span className="text-xs text-dark-text">
                {systemStatus.isOnline 
                  ? 'System Online' 
                  : systemStatus.status === 'stopping'
                    ? 'Stopping...'
                    : systemStatus.status === 'starting'
                      ? 'Starting...'
                      : 'System Offline'
                }
              </span>
            </div>
            
            {/* Mobile Version */}
            <div className="flex lg:hidden items-center justify-center">
              <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                systemStatus.isOnline 
                  ? 'bg-green-400 animate-pulse' 
                  : systemStatus.status === 'stopping' || systemStatus.status === 'starting'
                    ? 'bg-yellow-400 animate-bounce'
                    : 'bg-red-400 animate-pulse'
              }`} title={
                systemStatus.isOnline 
                  ? 'System Online' 
                  : systemStatus.status === 'stopping'
                    ? 'Bot wird gestoppt...'
                    : systemStatus.status === 'starting'
                      ? 'Bot startet...'
                      : 'System Offline'
              } />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

// Dashboard Layout Komponente
const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [systemStatus, setSystemStatus] = useState<{
    isOnline: boolean;
    status: string;
    uptime?: string;
  }>({
    isOnline: false,
    status: 'offline'
  })

  // Bot Status laden
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://agentbee.up.railway.app';
    
    const fetchBotStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/bot/status`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setSystemStatus({
            isOnline: data.isRunning && data.status === 'online',
            status: data.status,
            uptime: data.uptime
          })
        } else {
          setSystemStatus({
            isOnline: false,
            status: 'offline'
          })
        }
      } catch (error) {
        // Silent error handling - only log in development
        if (import.meta.env.DEV) {
          console.error('App.tsx Bot Status Error:', error)
        }
        setSystemStatus({
          isOnline: false,
          status: 'offline'
        })
      }
    }

    // Initial laden
    fetchBotStatus()

    // Alle 10 Sekunden aktualisieren
    const interval = setInterval(fetchBotStatus, 10000)

    return () => clearInterval(interval)
  }, [])

  // Event Listener für Security-Navigation vom Dashboard
  useEffect(() => {
    const handleSecurityNavigation = () => {
      setActiveTab('security');
    };

    window.addEventListener('navigate-to-security', handleSecurityNavigation);
    
    return () => {
      window.removeEventListener('navigate-to-security', handleSecurityNavigation);
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'rules':
        return <Rules />
      case 'welcome':
        return <Welcome />
      case 'xp':
        return <XP />
      case 'giveaway':
        return <Giveaway />
      case 'gaming':
        return <Gaming />
      case 'music':
        return <MusicPage />
      case 'tickets':
        return <TicketSystem />
      // AFK Auto-Move entfernt - verwende Discord Native AFK
      case 'twitch':
        return <TwitchNotifications />
      case 'valorant':
        return <Valorant />
      case 'valorant-news':
        return <ValorantNews />

      case 'verification':
        return <VerificationSettings />
      case 'logs':
        return <Logs />
      case 'server-stats':
        return <ServerStats />
      case 'settings':
        return <SettingsPage />
      case 'api-keys':
        return <APIKeys />
      case 'security':
        return <Security />
      case 'bot-introduction':
        return <BotIntroduction />
      // GELÖSCHT: Server Manager Case entfernt
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-mesh-purple opacity-20 animate-gradient bg-[length:400%_400%]"></div>
      <DigitalRain />
      
      {/* Main Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} systemStatus={systemStatus} />
        
        {/* Page Content */}
        <div className="container mx-auto">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="text-center py-8 animate-fade-in">
          <div className="text-dark-muted text-sm">
            Made with 💜 by <span className="text-neon-purple font-bold">AgentBee</span>
          </div>
          <div className="text-xs text-dark-muted mt-2">
                            Powered by AgentBee Technology ⚡
          </div>
        </div>
      </div>
    </div>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid #7c3aed',
              borderRadius: '12px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
