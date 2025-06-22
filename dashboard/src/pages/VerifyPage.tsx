import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, CheckCircle, Users, Gamepad2, Monitor, Send, Zap, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import CaptchaChallenge from '../components/CaptchaChallenge';
import CelebrationBee from '../components/CelebrationBee';
import CyberBee from '../components/CyberBee';
import { discordAuth } from '../lib/discord';
import type { DiscordUser, VerificationData } from '../types/discord';
import { cn } from '../lib/utils';

const VerifyPage = () => {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepAnimationKey, setStepAnimationKey] = useState(0);
  const [showMatrixParticles, setShowMatrixParticles] = useState(false);

  
  // Verhindere doppelte Code-Verwendung
  const processedCodes = useRef(new Set<string>());

  // Matrix Partikel Effect
  const createMatrixParticles = () => {
    const particles = [];
    for (let i = 0; i < 15; i++) {
      particles.push(
        <div
          key={i}
          className="matrix-particle absolute w-1 h-1 bg-neon-purple rounded-full animate-matrix-float"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }}
        />
      );
    }
    return particles;
  };

  // Form-Daten
  const [formData, setFormData] = useState({
    games: [] as string[],
    platform: '',
    agents: [] as string[],
    rulesAccepted: false,
  });

  const [gameOptions, setGameOptions] = useState<{ id: string; label: string; emoji: string; role?: string }[]>([]);

  // 🎯 Valorant Agenten nach Rollen kategorisiert mit Icons
  const valorantAgentRoles = {
    'Duelist': {
      emoji: '⚔️',
      color: 'from-red-500 to-orange-500',
      agents: [
        { name: 'Jett', icon: '💨' },
        { name: 'Phoenix', icon: '🔥' },
        { name: 'Reyna', icon: '💜' },
        { name: 'Raze', icon: '💥' },
        { name: 'Yoru', icon: '👻' },
        { name: 'Neon', icon: '⚡' },
        { name: 'Iso', icon: '🔮' },
        { name: 'Waylay', icon: '🌪️' }
      ]
    },
    'Sentinel': {
      emoji: '🛡️',
      color: 'from-green-500 to-blue-500',
      agents: [
        { name: 'Killjoy', icon: '🤖' },
        { name: 'Cypher', icon: '👁️' },
        { name: 'Sage', icon: '🌸' },
        { name: 'Chamber', icon: '🎯' },
        { name: 'Deadlock', icon: '🔗' },
        { name: 'Vyse', icon: '🔒' }
      ]
    },
    'Initiator': {
      emoji: '🔍',
      color: 'from-purple-500 to-pink-500',
      agents: [
        { name: 'Sova', icon: '🏹' },
        { name: 'Breach', icon: '👊' },
        { name: 'Skye', icon: '🦅' },
        { name: 'Fade', icon: '🌙' },
        { name: 'KAY/O', icon: '🤖' },
        { name: 'Gekko', icon: '🦎' },
        { name: 'Tejo', icon: '💎' }
      ]
    },
    'Controller': {
      emoji: '🌊',
      color: 'from-blue-500 to-cyan-500',
      agents: [
        { name: 'Brimstone', icon: '🚀' },
        { name: 'Viper', icon: '🐍' },
        { name: 'Omen', icon: '👤' },
        { name: 'Astra', icon: '⭐' },
        { name: 'Harbor', icon: '🌊' },
        { name: 'Clove', icon: '☘️' }
      ]
    }
  };

  // Legacy Support - alle Agenten in einem Array (nur Namen)
  const valorantAgents = Object.values(valorantAgentRoles).flatMap(role => role.agents.map(agent => agent.name));

  const [platformOptions, setPlatformOptions] = useState<{ id: string; label: string; emoji: string; role?: string }[]>([]);

  const [verificationConfig, setVerificationConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const steps = [
    { title: 'Discord Login', icon: Users, description: 'Authentifizierung mit Discord' },
    { title: 'Bot-Schutz', icon: Shield, description: 'Captcha-Verifikation' },
    { title: 'Spiele-Auswahl', icon: Gamepad2, description: 'Wähle deine Lieblingsspiele' },
    { title: 'Plattform', icon: Monitor, description: 'Deine Gaming-Plattform' },
    { title: 'Bestätigung', icon: Send, description: 'Abschluss der Verifizierung' },
  ];

  // Helper für Step-Wechsel mit Animation
  const changeStep = (newStep: number) => {
    setStepAnimationKey(prev => prev + 1);
    setCurrentStep(newStep);
  };

  // Lade Verification-Konfiguration
  const loadVerificationConfig = async () => {
    setConfigLoading(true);
    try {
      const response = await fetch('/api/verification/config');
      
      if (response.ok) {
        const config = await response.json();
        
        console.log('📋 Verification Config geladen:', config);
        
        // Aktualisiere gameOptions mit Backend-Daten
        if (config.allowedGames && Array.isArray(config.allowedGames)) {
          console.log('🎮 Spiele geladen:', config.allowedGames);
          setGameOptions(config.allowedGames);
        }
        
        // Aktualisiere platformOptions mit Backend-Daten
        if (config.allowedPlatforms && Array.isArray(config.allowedPlatforms)) {
          console.log('💻 Plattformen geladen:', config.allowedPlatforms);
          setPlatformOptions(config.allowedPlatforms);
        }

        // Speichere die komplette Config für Bot-Updates
        setVerificationConfig(config);
      } else {
        console.error('❌ Fehler beim Laden der Verification Config:', response.status);
      }
    } catch (error) {
      console.error('❌ Netzwerkfehler beim Laden der Config:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  // Config laden
  useEffect(() => {
    // Lade aktuelle Verification-Konfiguration
    loadVerificationConfig();
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
      const userData = await discordAuth.authenticateWithCode(code);
      
      setUser(userData);
      changeStep(1); // Zu Captcha-Step mit Animation
      
      // Entferne den Code aus der URL, damit er nicht nochmal verwendet wird
      window.history.replaceState({}, '', '/verify');
      
    } catch (err: any) {
      setError(`Discord-Authentifizierung fehlgeschlagen: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startDiscordLogin = () => {
    const authUrl = discordAuth.getAuthUrl();
    window.location.href = authUrl;
  };

  // Form Handlers
  const handleGameToggle = (gameId: string) => {
    setFormData(prev => ({
      ...prev,
      games: prev.games.includes(gameId)
        ? prev.games.filter(g => g !== gameId)
        : [...prev.games, gameId]
    }));
  };

  const handleAgentToggle = (agentName: string) => {
    setFormData(prev => ({
      ...prev,
      agents: prev.agents.includes(agentName)
        ? prev.agents.filter(a => a !== agentName)
        : [...prev.agents, agentName]
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    const verificationData: VerificationData = {
      discordId: user.id,
      games: formData.games,
      platform: formData.platform,
      agents: formData.games.includes('valorant') ? formData.agents : undefined,
    };

    try {
      const success = await discordAuth.submitVerification(verificationData);
      if (success) {
        changeStep(5); // Success step mit Animation
      } else {
        setError('Verifizierung fehlgeschlagen. Bitte versuche es später erneut.');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Steps
  const renderStep = () => {
    const stepContent = (() => {
      switch (currentStep) {
        case 0: // Discord Login
          return (
            <div className="text-center max-w-md mx-auto">
              <div className="mb-8 relative">
                {/* Floating Icons */}
                <div className="absolute -top-4 -left-4 animate-float">
                  <Zap className="w-6 h-6 text-yellow-400 opacity-70 animate-pulse" style={{animationDuration: '0.8s', animationTimingFunction: 'cubic-bezier(0.4, 0, 0.6, 1)'}} />
                </div>
                <div className="absolute -top-2 -right-6 animate-float [animation-delay:0.5s]">
                  <Star className="w-4 h-4 text-blue-400 opacity-60 animate-spin" style={{animationDuration: '4s'}} />
                </div>
                
                <Users className="w-16 h-16 text-neon-purple mx-auto mb-4 animate-glow-pulse hover:scale-110 transition-transform duration-300 cursor-pointer animate-bounce-gentle" />
                <div className="absolute inset-0 w-16 h-16 mx-auto animate-ping opacity-20 pointer-events-none">
                  <Users className="w-16 h-16 text-neon-purple" />
                </div>
                <h2 className="text-2xl font-bold text-neon-purple mb-2 animate-typewriter">Discord Anmeldung</h2>
                <p className="text-dark-text animate-slide-in-left delay-300">
                  Melde dich mit deinem Discord-Account an, um die Verifizierung zu starten.
                </p>
                <div className="text-dark-muted text-sm mt-2 animate-slide-in-right delay-500 flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4 animate-pulse hover:scale-110 transition-transform duration-300 cursor-pointer" />
                  <span>Sichere Authentifizierung</span>
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
                  onMouseEnter={() => setShowMatrixParticles(true)}
                  onMouseLeave={() => setShowMatrixParticles(false)}
                >
                  <span className="relative z-10 select-none">
                    {loading ? '🔄 Lädt...' : '🔗 Mit Discord anmelden'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:animate-shimmer pointer-events-none"></div>
                  {showMatrixParticles && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      {createMatrixParticles()}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          );

        case 1: // Captcha
          return (
            <div className="animate-fade-in-up">
              <CaptchaChallenge
                onSuccess={() => changeStep(2)}
                onReset={() => setError(null)}
              />
            </div>
          );

        case 2: // Games Selection
          return (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8 relative">
                {/* Orbiting Elements */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="animate-orbit-slow">
                    <div className="w-3 h-3 bg-neon-purple rounded-full absolute top-4 left-1/2 shadow-neon"></div>
                  </div>
                  <div className="animate-orbit-reverse">
                    <div className="w-2 h-2 bg-pink-400 rounded-full absolute top-8 left-1/2 opacity-70"></div>
                  </div>
                </div>
                
                <div className="relative mb-6">
                  <Gamepad2 className="w-16 h-16 text-neon-purple mx-auto mb-4 animate-glow-pulse hover:scale-110 transition-transform duration-300 cursor-pointer hover:animate-bounce" />
                  <div className="absolute inset-0 w-16 h-16 mx-auto animate-ping opacity-20 pointer-events-none">
                    <Gamepad2 className="w-16 h-16 text-neon-purple" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-neon-purple mb-2 animate-typewriter">Spiele-Auswahl</h2>
                <p className="text-dark-text animate-slide-in-left delay-300">Wähle die Spiele aus, die du spielst (mehrere möglich):</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {gameOptions.map((game, index) => (
                  <label
                    key={game.id}
                    className={cn(
                      "cyber-card p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-neon-sm animate-fade-in-up group",
                      formData.games.includes(game.id) && "ring-2 ring-neon-purple shadow-neon scale-105"
                    )}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-3 relative">
                      <Checkbox
                        checked={formData.games.includes(game.id)}
                        onCheckedChange={() => handleGameToggle(game.id)}
                      />
                      <span className="text-2xl transition-transform duration-300 group-hover:scale-125 group-hover:animate-bounce emoji-glow cursor-pointer">{game.emoji}</span>
                      <span className="text-dark-text font-medium">{game.label}</span>
                      
                      {/* Energy Pulse für ausgewählte Items */}
                      {formData.games.includes(game.id) && (
                        <div className="absolute inset-0 border border-neon-purple rounded-lg animate-pulse-border pointer-events-none"></div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {/* Valorant Agents - Kategorisiert nach Rollen */}
              {formData.games.includes('valorant') && (
                <div className="mb-8 animate-fade-in-up [animation-delay:0.3s]">
                  <h3 className="text-lg font-bold text-neon-purple mb-6 flex items-center gap-2 animate-pulse-subtle cyber-text-glow">
                    🎯 Valorant Agenten (optional):
                    <span className="text-sm text-dark-muted font-normal">
                      - Wähle deine Lieblings-Agenten
                    </span>
                  </h3>
                  
                  <div className="space-y-6">
                    {Object.entries(valorantAgentRoles).map(([roleName, roleData], roleIndex) => (
                      <div key={roleName} className="cyber-card p-4 border border-purple-primary/30 animate-fade-in-up" style={{ animationDelay: `${0.4 + roleIndex * 0.1}s` }}>
                        <h4 className={cn(
                          "text-md font-bold mb-3 flex items-center gap-2 bg-gradient-to-r bg-clip-text text-transparent",
                          roleData.color
                        )}>
                          <span className="text-lg animate-bounce-gentle emoji-glow" style={{ animationDelay: `${roleIndex * 0.2}s` }}>{roleData.emoji}</span>
                          {roleName}
                          <span className="text-xs text-dark-muted font-normal ml-2">
                            ({roleData.agents.length} Agenten)
                          </span>
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {roleData.agents.map((agent, agentIndex) => (
                            <label
                              key={agent.name}
                              className={cn(
                                "p-3 text-sm border rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 group animate-fade-in-up cyber-micro-card",
                                formData.agents.includes(agent.name)
                                  ? "border-neon-purple bg-purple-primary/20 text-neon-purple shadow-md"
                                  : "border-purple-primary/30 bg-dark-surface/50 text-dark-text hover:border-neon-purple hover:bg-purple-primary/10"
                              )}
                              style={{ animationDelay: `${0.5 + agentIndex * 0.05}s` }}
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={formData.agents.includes(agent.name)}
                                  onCheckedChange={() => handleAgentToggle(agent.name)}
                                  className="w-3 h-3 flex-shrink-0"
                                />
                                <span className="text-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-125 group-hover:animate-pulse emoji-glow cursor-pointer">{agent.icon}</span>
                                <span className="truncate text-xs font-medium">{agent.name}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Ausgewählte Agenten Anzeige */}
                  {formData.agents.length > 0 && (
                    <div className="mt-4 p-3 bg-purple-primary/10 border border-purple-primary/30 rounded-lg animate-fade-in-up [animation-delay:0.7s] cyber-summary">
                      <p className="text-sm text-neon-purple font-medium mb-2 animate-pulse-subtle cyber-text-glow">
                        Ausgewählt ({formData.agents.length}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {formData.agents.map((agentName, index) => {
                          // Finde das Icon für den Agenten
                          let agentIcon = '🎯';
                          Object.values(valorantAgentRoles).forEach(roleData => {
                            const agent = roleData.agents.find(a => a.name === agentName);
                            if (agent) agentIcon = agent.icon;
                          });
                          
                          return (
                            <span 
                              key={agentName}
                              className="px-2 py-1 bg-purple-primary/20 text-neon-purple text-xs rounded-full border border-purple-primary/50 flex items-center gap-1 animate-fade-in-scale hover:scale-110 transition-transform duration-300 cyber-tag"
                              style={{ animationDelay: `${index * 0.05}s` }}
                            >
                              <span className="emoji-glow">{agentIcon}</span>
                              <span>{agentName}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={() => changeStep(3)}
                disabled={formData.games.length === 0}
                variant="cyber"
                className="w-full animate-fade-in-up [animation-delay:0.8s] hover:scale-105 transition-transform duration-300 cyber-button-enhanced"
              >
                Weiter zur Plattform-Auswahl
              </Button>
            </div>
          );

        case 3: // Platform Selection
          return (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="relative mb-6">
                  <Monitor className="w-16 h-16 text-neon-purple mx-auto mb-4 animate-glow-pulse hover:scale-110 transition-transform duration-300 cursor-pointer hover:animate-pulse" />
                  <div className="absolute inset-0 w-16 h-16 mx-auto animate-ping opacity-20 pointer-events-none">
                    <Monitor className="w-16 h-16 text-neon-purple" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-neon-purple mb-2 animate-typewriter">Gaming-Plattform</h2>
                <p className="text-dark-text animate-slide-in-left delay-300">Auf welcher Plattform spielst du hauptsächlich?</p>
              </div>

              <div className="space-y-4 mb-8">
                {platformOptions.map((platform, index) => (
                  <label
                    key={platform.id}
                    className={cn(
                      "cyber-card p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-neon-sm block group animate-fade-in-up",
                      formData.platform === platform.id && "ring-2 ring-neon-purple shadow-neon scale-105"
                    )}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="platform"
                        value={platform.id}
                        checked={formData.platform === platform.id}
                        onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                        className="sr-only"
                      />
                      <span className="text-2xl transition-transform duration-300 group-hover:scale-125 group-hover:animate-bounce emoji-glow cursor-pointer">{platform.emoji}</span>
                      <span className="text-dark-text font-medium">{platform.label}</span>
                    </div>
                  </label>
                ))}
              </div>

              <Button
                onClick={() => changeStep(4)}
                disabled={!formData.platform}
                variant="cyber"
                className="w-full animate-fade-in-up [animation-delay:0.6s] hover:scale-105 transition-transform duration-300 cyber-button-enhanced"
              >
                Zur Bestätigung
              </Button>
            </div>
          );

        case 4: // Confirmation
          return (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="relative mb-6">
                  <Send className="w-16 h-16 text-neon-purple mx-auto mb-4 animate-glow-pulse hover:scale-110 transition-transform duration-300 cursor-pointer hover:animate-bounce" />
                  <div className="absolute inset-0 w-16 h-16 mx-auto animate-ping opacity-20 pointer-events-none">
                    <Send className="w-16 h-16 text-neon-purple" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-neon-purple mb-2 animate-typewriter">Bestätigung</h2>
                <p className="text-dark-text animate-slide-in-left delay-300">Überprüfe deine Angaben und akzeptiere die Regeln:</p>
              </div>

              {/* User Info */}
              {user && (
                <div className="cyber-card p-4 mb-6 animate-fade-in-up [animation-delay:0.2s]">
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={discordAuth.getAvatarUrl(user)}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full border-2 border-purple-primary animate-fade-in-scale hover:scale-110 transition-transform duration-300 cyber-avatar"
                    />
                    <div>
                      <div className="text-neon-purple font-medium cyber-text-glow">{user.username}</div>
                      <div className="text-dark-muted text-sm">Discord ID: {user.id}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="cyber-card p-4 mb-6 space-y-2 animate-fade-in-up [animation-delay:0.3s]">
                <div>
                  <span className="text-neon-purple font-medium cyber-text-glow">Spiele: </span>
                  <span className="text-dark-text">
                    {formData.games.map(g => gameOptions.find(go => go.id === g)?.label).join(', ')}
                  </span>
                </div>
                
                <div>
                  <span className="text-neon-purple font-medium cyber-text-glow">Plattform: </span>
                  <span className="text-dark-text">
                    {platformOptions.find(p => p.id === formData.platform)?.label}
                  </span>
                </div>

                {formData.agents.length > 0 && (
                  <div className="space-y-2">
                    <div>
                      <span className="text-neon-purple font-medium cyber-text-glow">Valorant Agenten: </span>
                      <span className="text-dark-text">{formData.agents.join(', ')}</span>
                    </div>
                  </div>
                )}

                {/* Zeige alle erhaltenen Rollen an */}
                {(() => {
                  const allRoles = new Set<string>();
                  
                  // Basis-Rollen aus Verification Config
                  if (verificationConfig?.defaultRoles) {
                    verificationConfig.defaultRoles.forEach((role: string) => allRoles.add(role));
                  }
                  
                  // Game-Rollen hinzufügen
                  formData.games.forEach(gameId => {
                    const game = gameOptions.find(g => g.id === gameId);
                    if (game?.role && game.role.trim()) {
                      allRoles.add(game.role);
                    }
                  });
                  
                  // Plattform-Rolle hinzufügen
                  const platform = platformOptions.find(p => p.id === formData.platform);
                  if (platform?.role && platform.role.trim()) {
                    allRoles.add(platform.role);
                  }
                  
                  // Valorant-Rollen basierend auf Agenten
                  if (formData.agents.length > 0) {
                    allRoles.add('Valorant');
                    
                    formData.agents.forEach(agentName => {
                      Object.entries(valorantAgentRoles).forEach(([roleName, roleData]) => {
                        if (roleData.agents.some(agent => agent.name === agentName)) {
                          allRoles.add(roleName);
                        }
                      });
                    });
                  }
                  
                  if (allRoles.size > 0) {
                    return (
                      <div className="space-y-2">
                        <div>
                          <span className="text-neon-purple font-medium cyber-text-glow">Erhaltene Rollen: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Array.from(allRoles).map((role, index) => {
                              // Bestimme Farbe basierend auf Rolle
                              let colorClass = "bg-blue-500/20 text-blue-400 border-blue-500/50";
                              
                              if (role === 'Valorant') colorClass = "bg-red-500/20 text-red-400 border-red-500/50";
                              else if (role === 'Duelist') colorClass = "bg-red-500/20 text-red-400 border-red-500/50";
                              else if (role === 'Sentinel') colorClass = "bg-green-500/20 text-green-400 border-green-500/50";
                              else if (role === 'Initiator') colorClass = "bg-purple-500/20 text-purple-400 border-purple-500/50";
                              else if (role === 'Controller') colorClass = "bg-blue-500/20 text-blue-400 border-blue-500/50";
                              else if (verificationConfig?.defaultRoles?.includes(role)) colorClass = "bg-green-500/20 text-green-400 border-green-500/50";
                              else if (gameOptions.some(g => (g as any).role === role)) colorClass = "bg-orange-500/20 text-orange-400 border-orange-500/50";
                              else if (platformOptions.some(p => (p as any).role === role)) colorClass = "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
                              
                              // Finde passendes Emoji
                              let emoji = '🎮';
                              if (role === 'Valorant') emoji = '🎯';
                              else if (valorantAgentRoles[role as keyof typeof valorantAgentRoles]) {
                                emoji = valorantAgentRoles[role as keyof typeof valorantAgentRoles].emoji;
                              } else {
                                const game = gameOptions.find(g => (g as any).role === role);
                                const platform = platformOptions.find(p => (p as any).role === role);
                                if (game) emoji = game.emoji;
                                else if (platform) emoji = platform.emoji;
                              }
                              
                              return (
                                <span 
                                  key={role}
                                  className={cn(
                                    "px-2 py-1 text-xs rounded-full border animate-fade-in-scale hover:scale-110 transition-transform duration-300 cyber-tag",
                                    colorClass
                                  )}
                                  style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                  <span className="emoji-glow">{emoji}</span> {role}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Rules Acceptance */}
              <div className="cyber-card p-4 mb-6 animate-fade-in-up [animation-delay:0.4s]">
                <h3 className="text-lg font-bold text-neon-purple mb-4 animate-pulse-subtle cyber-text-glow">📜 Server-Regeln</h3>
                <div className="space-y-2 text-sm text-dark-text mb-4 max-h-32 overflow-y-auto custom-scrollbar">
                  <p className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>1️⃣ Sei respektvoll und freundlich zu allen Mitgliedern</p>
                  <p className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>2️⃣ Kein Spam, keine Werbung oder Eigenwerbung</p>
                  <p className="animate-fade-in-up" style={{ animationDelay: '0.7s' }}>3️⃣ Keine beleidigenden, diskriminierenden oder NSFW Inhalte</p>
                  <p className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>4️⃣ Nutze die entsprechenden Kanäle für verschiedene Themen</p>
                  <p className="animate-fade-in-up" style={{ animationDelay: '0.9s' }}>5️⃣ Halte dich an die Discord Community Guidelines</p>
                  <p className="animate-fade-in-up" style={{ animationDelay: '1.0s' }}>6️⃣ Respektiere Mods und Admins</p>
                  <p className="animate-fade-in-up" style={{ animationDelay: '1.1s' }}>7️⃣ Deutsche Sprache bevorzugt im Chat</p>
                  <p className="animate-fade-in-up" style={{ animationDelay: '1.2s' }}>8️⃣ Verstöße können zu Verwarnungen oder Bans führen</p>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group animate-fade-in-up [animation-delay:1.3s]">
                    <Checkbox
                      checked={formData.rulesAccepted}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, rulesAccepted: !!checked }))
                      }
                    />
                    <span className="text-dark-text group-hover:text-neon-purple transition-colors duration-300">
                      Ich akzeptiere die Server-Regeln und stimme zu, mich daran zu halten.
                    </span>
                  </label>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 animate-shake">
                  {error}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!formData.rulesAccepted || isSubmitting}
                variant="cyber"
                className="w-full animate-fade-in-up [animation-delay:1.4s] hover:scale-105 transition-transform duration-300 cyber-button-enhanced"
              >
                {isSubmitting ? '🔄 Wird übermittelt...' : '✅ Verifizierung abschließen'}
              </Button>
            </div>
          );

        case 5: // Success
          return (
            <div className="text-center max-w-md mx-auto">
              {/* Celebration Bees */}
              <CelebrationBee />
              
              {/* Success Animation */}
              <div className="relative mb-6">
                <CheckCircle className="w-20 h-20 text-green-400 mx-auto animate-bounce" />
                <div className="absolute inset-0 w-20 h-20 mx-auto">
                  <div className="w-full h-full rounded-full bg-green-400/20 animate-ping"></div>
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-8 bg-green-400/30 rounded-full animate-pulse"></div>
                </div>
                
                {/* Orbiting Success Elements */}
                <div className="absolute inset-0 animate-orbit-success">
                  <div className="w-2 h-2 bg-green-400 rounded-full absolute top-2 left-1/2"></div>
                </div>
                <div className="absolute inset-0 animate-orbit-success-reverse">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full absolute top-4 left-1/2"></div>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-green-400 mb-4 animate-celebrate">
                🎉 Verifizierung erfolgreich!
              </h2>
              <div className="cyber-card p-6 mb-6 animate-scale-in">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={discordAuth.getAvatarUrl(user!)}
                    alt="Avatar"
                    className="w-12 h-12 rounded-full border-2 border-green-500 animate-glow-border"
                  />
                  <div className="animate-slide-in-right">
                    <div className="text-green-400 font-medium">{user!.username}</div>
                    <div className="text-dark-muted text-sm">Verifizierung abgeschlossen</div>
                  </div>
                </div>
                <p className="text-dark-text animate-typewriter-slow">
                  Willkommen auf dem Server! Du hast erfolgreich die Verifizierung abgeschlossen.
                </p>
                <p className="text-dark-muted text-sm mt-2">
                  Du erhältst jetzt Zugang zu allen Kanälen und kannst am Server-Leben teilnehmen.
                </p>
                <p className="text-yellow-400 text-sm mt-3 animate-pulse emoji-glow">
                  🐝 Die AgentBees feiern mit dir! 🎊
                </p>
              </div>
              <Button
                onClick={() => window.close()}
                variant="cyber"
                className="w-full animate-fade-in-up [animation-delay:0.4s] hover:scale-105 transition-transform duration-300 cyber-button-enhanced"
              >
                🏠 Zurück zu Discord
              </Button>
            </div>
          );

        default:
          return null;
      }
    })();

    return (
      <div key={stepAnimationKey} className="animate-slide-in-from-right">
        {stepContent}
      </div>
    );
  };

  if (loading || configLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-purple-primary/30 border-t-neon-purple rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-secondary rounded-full animate-spin mx-auto animate-reverse"></div>
            <div className="absolute inset-2 w-12 h-12 border-2 border-transparent border-t-neon-purple rounded-full animate-spin mx-auto" style={{animationDuration: '0.8s'}}></div>
          </div>
          <p className="text-dark-text animate-pulse">
            {loading ? 'Discord-Authentifizierung läuft...' : 'Lade Verification-Konfiguration...'}
          </p>
          <p className="text-dark-muted text-sm mt-2 animate-fade-in-out">
            {loading ? 'Überprüfe Discord-Login und Berechtigung' : 'Lade Spiele und Plattformen aus der Datenbank'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 bg-mesh-purple opacity-20 animate-gradient bg-[length:400%_400%]"></div>
      
      {/* Enhanced Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-particle particle-1"></div>
        <div className="floating-particle particle-2"></div>
        <div className="floating-particle particle-3"></div>
        <div className="floating-particle particle-4"></div>
        <div className="floating-particle particle-5"></div>
        <div className="floating-particle particle-6"></div>
        <div className="floating-particle particle-7"></div>
        <div className="floating-particle particle-8"></div>
        <div className="floating-particle particle-9"></div>
        <div className="floating-particle particle-10"></div>
      </div>
      
      {/* Additional Cyber Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-neon-purple/40 rounded-full animate-float-random opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
      
      {/* Floating Micro Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-slow"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${12 + Math.random() * 6}s`
            }}
          >
            {i % 3 === 0 && <div className="w-2 h-2 bg-purple-400/50 rounded-full animate-pulse" style={{animationDuration: `${2 + Math.random() * 2}s`}} />}
            {i % 3 === 1 && <div className="w-1 h-1 bg-blue-400/60 rounded-full animate-ping" style={{animationDuration: `${3 + Math.random() * 2}s`}} />}
            {i % 3 === 2 && <div className="w-1.5 h-1.5 bg-cyan-400/40 rounded-full animate-bounce" style={{animationDuration: `${4 + Math.random() * 2}s`}} />}
          </div>
        ))}
      </div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full bg-grid-pattern animate-grid-flow"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 relative animate-fade-in">
          <div className="relative orbit-container">
            {/* Orbiting Bee */}
            <div className="animate-orbit pointer-events-none">
              <CyberBee size={35} glowing={true} animated={true} />
            </div>
            
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon px-16 py-8 relative z-10 animate-title-glow">
              AgentBee Verifizierung
            </h1>
          </div>
          <p className="text-dark-muted mt-4 animate-slide-in-up delay-200">Sichere Discord-Server Verifizierung</p>
        </div>

        {/* Enhanced Stepper */}
        {currentStep < 5 && (
          <div className="max-w-4xl mx-auto mb-12 animate-fade-in-up [animation-delay:0.3s]">
            <div className="flex items-center justify-between relative">
              {/* Energy Flow Background */}
              {/* <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-purple-primary/50 to-transparent animate-energy-flow top-6"></div> */}
              
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1 relative z-10">
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 group relative backdrop-blur-sm",
                      isActive ? "bg-gradient-to-r from-purple-primary to-neon-purple text-white shadow-lg shadow-purple-primary/50 scale-110" :
                      isCompleted ? "bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-lg shadow-green-500/30" :
                      "bg-dark-surface/80 border border-purple-primary/30 text-dark-muted hover:border-purple-primary/60 hover:bg-dark-surface"
                    )}>
                      {isCompleted ? (
                        <CheckCircle className="w-7 h-7 animate-bounce" />
                      ) : (
                        <Icon className={cn(
                          "w-7 h-7 transition-all duration-300",
                          isActive ? "animate-pulse scale-110" : "group-hover:scale-110 group-hover:animate-bounce"
                        )} />
                      )}
                      
                      {/* Active Step Glow Ring */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-primary to-neon-purple animate-ping opacity-30"></div>
                      )}
                    </div>
                    
                    <div className="mt-3 text-center">
                      <div className={cn(
                        "text-sm font-medium transition-colors duration-300",
                        isActive ? "text-neon-purple" :
                        isCompleted ? "text-green-400" :
                        "text-dark-muted"
                      )}>
                        {step.title}
                      </div>
                      <div className="text-xs text-dark-muted hidden sm:block opacity-70">
                        {step.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="max-w-4xl mx-auto animate-content-appear">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;