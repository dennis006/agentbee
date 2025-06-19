import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Users, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import CyberBee from '../components/CyberBee';
import AnimatedWarning from '../components/AnimatedWarning';
import { discordAuth } from '../lib/discord';
import { useAuth } from '../contexts/AuthContext';
import type { DiscordUser } from '../types/discord';
import { cn } from '../lib/utils';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  // Verhindere doppelte Code-Verwendung
  const processedCodes = useRef(new Set<string>());

  // Initialization
  useEffect(() => {
    // Login page loaded
  }, []);

  // Discord OAuth Handling
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (error) {
      setError(`Discord OAuth Fehler: ${error}`);
      return;
    }
    
    // Prüfe, ob Code bereits verarbeitet wurde
    if (code && processedCodes.current.has(code)) {
      return;
    }
    
    // Nur ausführen wenn: Code vorhanden, kein User gesetzt, nicht am laden
    if (code && !user && !loading) {
      processedCodes.current.add(code); // Code als verarbeitet markieren
      handleDiscordCallback(code);
    }
  }, [searchParams.get('code'), user, loading]);

  const handleDiscordCallback = async (code: string) => {
    // Verhindere mehrfache Ausführung
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 1. Erstmal normal authentifizieren (mit Login-Redirect-URI)
      const loginRedirectUri = `${window.location.origin}/login`;
      const userData = await discordAuth.authenticateWithCode(code, loginRedirectUri);
      
      console.log('🔍 Discord User Data:', userData);
      setUser(userData);
      setIsAuthenticated(true);
      
      // 2. Admin-Status prüfen
      await checkAdminStatus(userData.id);
      
      // Entferne den Code aus der URL, damit er nicht nochmal verwendet wird
      window.history.replaceState({}, '', '/login');
      
    } catch (err: any) {
      setError(`Discord-Authentifizierung fehlgeschlagen: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      console.log(`🔍 Checking admin status for userId: ${userId}`);
      console.log(`🔍 API URL: ${apiUrl}/api/auth/check-admin`);
      
      const response = await fetch(`${apiUrl}/api/auth/check-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Admin check response:', data);
        
        if (data.isAdmin) {
          setIsAdmin(true);
          // Nutze AuthContext für Login
          login(user!, true);
          // Nach kurzer Verzögerung zum Dashboard weiterleiten
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setError('❌ Zugriff verweigert: Du benötigst Admin-Berechtigung für das Dashboard');
        }
      } else {
        const errorData = await response.json();
        setError(`Admin-Überprüfung fehlgeschlagen: ${errorData.error}`);
      }
    } catch (err: any) {
      setError('Fehler bei der Admin-Überprüfung');
    }
  };

  const startDiscordLogin = () => {
    // Erstelle spezielle OAuth-URL für Dashboard-Login
    const dashboardRedirectUri = `${window.location.origin}/login`;
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_DISCORD_CLIENT_ID || '',
      redirect_uri: dashboardRedirectUri,
      response_type: 'code',
      scope: 'identify guilds',
    });

    const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    window.location.href = authUrl;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-purple-primary/30 border-t-neon-purple rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-secondary rounded-full animate-spin mx-auto animate-reverse"></div>
            <div className="absolute inset-2 w-12 h-12 border-2 border-transparent border-t-neon-purple rounded-full animate-spin mx-auto" style={{animationDuration: '0.8s'}}></div>
          </div>
          <p className="text-dark-text animate-pulse">Authentifizierung läuft...</p>
          <p className="text-dark-muted text-sm mt-2 animate-fade-in-out">Überprüfe Discord-Login und Admin-Berechtigung</p>
        </div>
      );
    }

    if (isAuthenticated && isAdmin) {
      return (
        <div className="text-center">
          <div className="relative mb-6">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto animate-bounce" />
            <div className="absolute inset-0 w-20 h-20 mx-auto">
              <div className="w-full h-full rounded-full bg-green-400/20 animate-ping"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-green-400/30 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-green-400 mb-4 animate-celebrate">
            🎉 Willkommen, Admin!
          </h2>
          <div className="cyber-card p-6 mb-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={discordAuth.getAvatarUrl(user!)}
                alt="Avatar"
                className="w-12 h-12 rounded-full border-2 border-purple-primary animate-glow-border"
              />
              <div className="animate-slide-in-right">
                <div className="text-neon-purple font-medium">{user!.username}</div>
                <div className="text-dark-muted text-sm">Admin-Zugriff gewährt</div>
              </div>
            </div>
            <p className="text-dark-text animate-typewriter-slow">
              Du wirst automatisch zum Dashboard weitergeleitet...
            </p>
          </div>
        </div>
      );
    }

    if (isAuthenticated && !isAdmin) {
      return (
        <div className="text-center">
          <div className="animate-pulse">
            <AlertCircle className="w-20 h-20 text-red-400 mx-auto mb-6 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-4 animate-fade-in">
            ❌ Zugriff verweigert
          </h2>
          <div className="cyber-card p-6 mb-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={discordAuth.getAvatarUrl(user!)}
                alt="Avatar"
                className="w-12 h-12 rounded-full border-2 border-red-500 animate-pulse"
              />
              <div>
                <div className="text-red-400 font-medium">{user!.username}</div>
                <div className="text-dark-muted text-sm">Keine Admin-Berechtigung</div>
              </div>
            </div>
            <p className="text-dark-text mb-4">
              Du benötigst die <span className="text-red-400 font-bold">"Admin"</span> Rolle auf dem Discord-Server, 
              um auf das Dashboard zugreifen zu können.
            </p>
            <p className="text-dark-muted text-sm">
              Kontaktiere einen Server-Administrator, falls du glaubst, dass dies ein Fehler ist.
            </p>
          </div>
          <Button
            onClick={() => {
              setUser(null);
              setIsAuthenticated(false);
              setIsAdmin(false);
              setError(null);
            }}
            variant="secondary"
            className="w-full"
          >
            🔄 Erneut versuchen
          </Button>
        </div>
      );
    }

    // Normale Login-Ansicht
    return (
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8 animate-slide-in-down">
          <div className="relative mb-6">
            <Shield className="w-16 h-16 text-neon-purple mx-auto mb-4 animate-glow-pulse" />
            <div className="absolute inset-0 w-16 h-16 mx-auto animate-ping opacity-20 pointer-events-none">
              <Shield className="w-16 h-16 text-neon-purple" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-neon-purple mb-2 animate-typewriter">Dashboard Login</h2>
          <p className="text-dark-text animate-slide-in-left delay-300">
            Melde dich mit deinem Discord-Account an, um auf das AgentBee Dashboard zuzugreifen.
          </p>
          <div className="text-dark-muted text-sm mt-2 animate-slide-in-right delay-500 flex items-center justify-center gap-2">
            <AnimatedWarning size={16} variant="pulse" />
            <span>Nur Administratoren haben Zugriff</span>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 animate-shake">
            {error}
          </div>
        )}

        <div className="relative mb-4">
          {/* Background Glow Effect - behind button */}
          <div className="absolute inset-0 rounded-xl bg-purple-primary/20 blur-md animate-pulse opacity-50 pointer-events-none"></div>
          
          <Button
            onClick={startDiscordLogin}
            disabled={loading}
            variant="cyber"
            className="w-full relative overflow-hidden group animate-button-glow z-20 cursor-pointer min-h-[48px]"
          >
            <span className="relative z-10 select-none">
              {loading ? '🔄 Lädt...' : '🔗 Mit Discord anmelden'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:animate-shimmer pointer-events-none"></div>
          </Button>
        </div>

        <div className="text-center text-dark-muted text-xs animate-fade-in-up delay-700">
          <p>Benötigst du Hilfe? Kontaktiere einen Server-Administrator.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 bg-mesh-purple opacity-20 animate-gradient bg-[length:400%_400%]"></div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-particle particle-1"></div>
        <div className="floating-particle particle-2"></div>
        <div className="floating-particle particle-3"></div>
        <div className="floating-particle particle-4"></div>
        <div className="floating-particle particle-5"></div>
        <div className="floating-particle particle-6"></div>
      </div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full bg-grid-pattern animate-grid-flow"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        {/* Header */}
        <div className="w-full max-w-md">
          <div className="text-center mb-8 relative animate-fade-in">
            <div className="relative orbit-container">
              {/* Orbiting Bee */}
              <div className="animate-orbit pointer-events-none">
                <CyberBee size={35} glowing={true} animated={true} />
              </div>
              
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon px-16 py-8 relative z-10 animate-title-glow">
                AgentBee Dashboard
              </h1>
            </div>
            <p className="text-dark-muted mt-4 animate-slide-in-up delay-200">AgentBee Bot Control Center</p>
          </div>

          {/* Login Content */}
          <div className="max-w-md mx-auto animate-content-appear">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 