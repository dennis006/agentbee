import { useState, useEffect } from 'react';
import { Target, Copy, Download, Settings, Eye, Check, RotateCcw, Star, Sliders, AlertCircle, Share2, MessageSquare, ThumbsUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { useToast, ToastContainer } from '../components/ui/toast';
import { cn } from '../lib/utils';

// Einfache Benachrichtigungsfunktion
const useNotification = () => {
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const NotificationComponent = () => {
    if (!notification || !notification.visible) return null;
    
    return (
      <div className={`fixed bottom-4 right-4 p-3 rounded-md shadow-lg flex items-center gap-2 ${
        notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
      } text-white transition-opacity duration-300 z-50`}>
        {notification.type === 'success' ? 
          <Check className="h-5 w-5" /> : 
          <Eye className="h-5 w-5" />
        }
        <span>{notification.message}</span>
      </div>
    );
  };

  return { showNotification, NotificationComponent };
};

// Farben für das Fadenkreuz - KORRIGIERTE Index-Werte
const COLORS = [
  { name: "Weiß", value: "white", code: 0 },
  { name: "Grün", value: "green", code: 1 },
  { name: "Gelb-Grün", value: "yellowish-green", code: 2 },
  { name: "Grün-Gelb", value: "greenish-yellow", code: 3 },
  { name: "Türkis", value: "cyan", code: 4 },
  { name: "Pink", value: "pink", code: 5 },
  { name: "Rot", value: "red", code: 6 },
  { name: "Benutzerdefiniert", value: "custom", code: 7 }
];

// KORREKTE Valorant Code-Generierung basierend auf echten Pro-Codes
const generateValorantCrosshairCode = (settings: CrosshairSettings): string => {
  try {
    // VCRDB-konforme Code-Generierung
    const colorMap: Record<string, number> = {
      'white': 0, 'custom': 5
    };
    
    const color = colorMap.hasOwnProperty(settings.primaryColor) ? colorMap[settings.primaryColor] : 1;
    
    // Basis-Struktur: 0;s;1;P;...
    let code = "0;s;1;P";
    
    // Primäre Parameter in korrekter Reihenfolge
    code += `;c;${color}`; // Color
    code += `;h;${settings.outlineShow ? 1 : 0}`; // Outline on/off
    code += `;f;${settings.fadeCrosshairWithFiringError ? 1 : 0}`; // Firing error
    
    // Center Dot
    code += `;d;${settings.centerDotShow ? 1 : 0}`; // Dot on/off
    if (settings.centerDotShow && settings.centerDotThickness > 0) {
      code += `;z;${settings.centerDotThickness}`; // Dot size
    }
    
    // Movement error (optional)
    if (settings.movementErrorShow) {
      code += ";m;1";
    }
    
    // INNER LINES (0x) - IMMER alle Parameter setzen!
    const innerLength = (settings.innerLinesShow && settings.innerLinesLength > 0) ? settings.innerLinesLength : 0;
    const innerOffset = settings.innerLinesShow ? settings.innerLinesOffset : 0;
    const innerAlpha = settings.innerLinesShow ? Math.round(settings.innerLinesOpacity / 255) : 0;
    const innerThickness = settings.innerLinesShow ? settings.innerLinesThickness : 0;
    
    code += `;0l;${innerLength}`;
    code += `;0o;${innerOffset}`;
    code += `;0a;${innerAlpha}`;
    code += `;0t;${innerThickness}`;
    code += ";0m;0;0f;0"; // Movement + Fade immer 0
    
    // OUTER LINES (1x) - TEMPORARILY DISABLED (Coming Soon)
    // TODO: Fix outer lines parameter compatibility
    const outerLength = 0; // Temporarily disabled
    const outerOffset = 0;
    const outerAlpha = 0;
    const outerThickness = 0;
    
    code += `;1l;${outerLength}`;
    code += `;1o;${outerOffset}`;
    code += `;1a;${outerAlpha}`;
    code += `;1t;${outerThickness}`;
    code += ";1m;0;1f;0"; // Movement + Fade immer 0
    
    // Standard end
    code += ";1b;0";
    
    return code;
  } catch (error) {
    // Fallback: Funktionierender Code mit sichtbaren Outer Lines
    return "0;s;1;P;c;1;h;0;f;0;d;1;z;2;0l;0;0o;0;0a;0;0t;0;0m;0;0f;0;1l;4;1o;3;1a;1;1t;2;1m;0;1f;0;1b;0";
  }
};

interface CrosshairSettings {
  primaryColor: string;
  customColor: string;
  centerDotShow: boolean;
  centerDotThickness: number;
  centerDotOpacity: number;
  outerLinesShow: boolean;
  outerLinesLength: number;
  outerLinesThickness: number;
  outerLinesOffset: number;
  outerLinesOpacity: number;
  innerLinesShow: boolean;
  innerLinesLength: number;
  innerLinesThickness: number;
  innerLinesOffset: number;
  innerLinesOpacity: number;
  outlineShow: boolean;
  outlineOpacity: number;
  outlineThickness: number;
  firingErrorShow: boolean;
  movementErrorShow: boolean;
  fadeCrosshairWithFiringError: boolean;
}

const CrosshairCreator = () => {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [crosshairCode, setCrosshairCode] = useState('');
  
  // Toast System
  const { toasts, success, error, removeToast } = useToast();
  const { showNotification, NotificationComponent } = useNotification();

  // Erweiterte Crosshair Settings
  const [settings, setSettings] = useState<CrosshairSettings>({
    primaryColor: 'white',
    customColor: '#FF0000',
    centerDotShow: true,
    centerDotThickness: 2,
    centerDotOpacity: 255,
    outerLinesShow: false, // Disabled - Coming Soon
    outerLinesLength: 0,
    outerLinesThickness: 0,
    outerLinesOffset: 0,
    outerLinesOpacity: 255,
    innerLinesShow: true, // Enable Inner Lines instead
    innerLinesLength: 4,
    innerLinesThickness: 2,
    innerLinesOffset: 1,
    innerLinesOpacity: 255,
    outlineShow: false,
    outlineOpacity: 255,
    outlineThickness: 1,
    firingErrorShow: false,
    movementErrorShow: false,
    fadeCrosshairWithFiringError: false
  });

  // 🎨 SIMPLIFIED COLOR SYSTEM - Nur Weiß und Custom
  const colorMap: Record<string, number> = {
    'white': 0, 'custom': 5
  };

  const presetColors = [
    { name: 'white', value: 'white', color: '#FFFFFF', label: 'Weiß' },
    { name: 'custom', value: 'custom', color: settings.customColor || '#FF0000', label: '🎨 Custom Color' }
  ];

  // Update Setting
  const updateSetting = (key: keyof CrosshairSettings, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      return newSettings;
    });
  };

  // Random Crosshair Generator
  const generateRandomCrosshair = (mode: 'pro' | 'fun' = 'pro') => {
    const getRandomColor = () => {
      const colors = ['#FF4656', '#00D4AA', '#FFBC40', '#B19CD9', '#FE8C8A', '#50FA7B', '#FF79C6', '#8BE9FD', '#F1FA8C', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    if (mode === 'pro') {
      // VCRDB-basierte realistische Pro-Range Zufallswerte
      const centerDotShow = Math.random() > 0.4; // 60% haben Center Dot
      const outerLinesShow = false; // Temporarily disabled - Coming Soon
      const innerLinesShow = Math.random() > 0.5; // 50% haben Inner Lines (mehr wegen Outer Lines disabled)
      const outlineShow = Math.random() > 0.7; // 30% outline
      
      // VCRDB Pro-Ranges (basierend auf echten Valorant Parameter)
      const centerDotThickness = centerDotShow ? Math.floor(Math.random() * 6) + 1 : 0; // 1-6 (VCRDB)
      const centerDotOpacity = centerDotShow ? Math.floor((Math.random() * 0.5 + 0.5) * 255) : 255; // 0.5-1.0 alpha
      
      const outerLinesLength = Math.floor(Math.random() * 10) + 1; // 1-10 (VCRDB, min 1 für Sichtbarkeit)
      const outerLinesThickness = Math.floor(Math.random() * 10) + 1; // 1-10 (VCRDB, min 1 für Sichtbarkeit)
      const outerLinesOffset = Math.floor(Math.random() * 41); // 0-40 (VCRDB 1:1)
      const outerLinesOpacity = Math.floor((Math.random() * 0.6 + 0.4) * 255); // 0.4-1.0 alpha
      
      const innerLinesLength = Math.floor(Math.random() * 16) + 2; // 2-17 (0-20 aber min 2)
      const innerLinesThickness = Math.floor(Math.random() * 6) + 1; // 1-6 (0-10 aber praktischer)
      const innerLinesOffset = Math.floor(Math.random() * 15); // 0-15 (0-20 aber praktischer)
      const innerLinesOpacity = Math.floor((Math.random() * 0.5 + 0.5) * 255); // 0.5-1.0 alpha
      
      // Outline Parameter (VCRDB)
      const outlineThickness = Math.floor(Math.random() * 6) + 1; // 1-6 (VCRDB)
      const outlineOpacity = Math.floor((Math.random() * 0.4 + 0.3) * 255); // 0.3-0.7 alpha
      
      // Beschreibung des generierten Typs (Outer Lines disabled)
      let crosshairType = '';
      if (centerDotShow && !innerLinesShow) crosshairType = 'Center Dot';
      else if (!centerDotShow && innerLinesShow) crosshairType = 'Inner Lines';
      else if (centerDotShow && innerLinesShow) crosshairType = 'Hybrid Dot+Inner';
      else crosshairType = 'Minimal';
      
      setSettings(prev => ({
        ...prev,
        primaryColor: Math.random() > 0.3 ? 'custom' : 'white', // 70% custom colors
        customColor: getRandomColor(),
        centerDotShow,
        centerDotThickness,
        centerDotOpacity,
        outerLinesShow,
        outerLinesLength,
        outerLinesThickness,
        outerLinesOffset,
        outerLinesOpacity,
        innerLinesShow,
        innerLinesLength,
        innerLinesThickness,
        innerLinesOffset,
        innerLinesOpacity,
        outlineShow,
        outlineOpacity,
        outlineThickness,
        firingErrorShow: Math.random() > 0.6, // 40% firing error
        movementErrorShow: Math.random() > 0.7, // 30% movement error
        fadeCrosshairWithFiringError: Math.random() > 0.9 // 10% fade (sehr selten)
      }));
      
      showNotification(`🏆 ${crosshairType} Pro Style generiert!`);
      
    } else {
      // Fun Mode - Ausgewogener aber trotzdem kreativ
      const creativeModes = ['Neon', 'Retro', 'Minimal', 'Thick', 'Dotty', 'Lines', 'Glow'];
      const selectedMode = creativeModes[Math.floor(Math.random() * creativeModes.length)];
      
      let funConfig;
      
      switch(selectedMode) {
        case 'Neon':
          funConfig = {
            centerDotShow: true,
            centerDotThickness: Math.floor(Math.random() * 4) + 3, // 3-6 (VCRDB max)
            outerLinesShow: false, // Disabled - Coming Soon
            outerLinesLength: 0,
            outerLinesThickness: 0,
            outerLinesOffset: 0,
            innerLinesShow: true, // Focus on Inner Lines
            innerLinesLength: Math.floor(Math.random() * 10) + 6, // 6-15 (VCRDB)
            color: getRandomColor()
          };
          break;
        case 'Retro':
          funConfig = {
            centerDotShow: Math.random() > 0.5,
            centerDotThickness: Math.floor(Math.random() * 3) + 1, // 1-3
            outerLinesShow: false, // Disabled - Coming Soon
            outerLinesLength: 0,
            outerLinesThickness: 0,
            outerLinesOffset: 0,
            innerLinesShow: Math.random() > 0.3, // More Inner Lines usage
            color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FECA57'][Math.floor(Math.random() * 4)]
          };
          break;
        case 'Minimal':
          funConfig = {
            centerDotShow: true,
            centerDotThickness: Math.floor(Math.random() * 2) + 1, // 1-2
            outerLinesShow: false, // Disabled - Coming Soon
            outerLinesLength: 0,
            outerLinesThickness: 0,
            outerLinesOffset: 0,
            innerLinesShow: Math.random() > 0.6, // Sometimes Inner Lines
            color: getRandomColor()
          };
          break;
        case 'Thick':
          funConfig = {
            centerDotShow: Math.random() > 0.4,
            centerDotThickness: Math.floor(Math.random() * 3) + 4, // 4-6 (VCRDB max)
            outerLinesShow: false, // Disabled - Coming Soon
            outerLinesLength: 0,
            outerLinesThickness: 0,
            outerLinesOffset: 0,
            innerLinesShow: true, // Focus on thick Inner Lines
            color: getRandomColor()
          };
          break;
        case 'Dotty':
          funConfig = {
            centerDotShow: true,
            centerDotThickness: Math.floor(Math.random() * 3) + 4, // 4-6 (VCRDB max)
            outerLinesShow: false, // Disabled - Coming Soon
            outerLinesLength: 0,
            outerLinesThickness: 0,
            outerLinesOffset: 0,
            innerLinesShow: false, // Focus on center dot only
            color: getRandomColor()
          };
          break;
        default:
          funConfig = {
            centerDotShow: Math.random() > 0.4,
            centerDotThickness: Math.floor(Math.random() * 6) + 1, // 1-6 (VCRDB full range)
            outerLinesShow: false, // Disabled - Coming Soon
            outerLinesLength: 0,
            outerLinesThickness: 0,
            outerLinesOffset: 0,
            innerLinesShow: Math.random() > 0.3, // More Inner Lines
            innerLinesLength: Math.floor(Math.random() * 18) + 2, // 2-20 (VCRDB)
            color: getRandomColor()
          };
      }
      
      setSettings(prev => ({
        ...prev,
        primaryColor: 'custom',
        customColor: funConfig.color,
        centerDotShow: funConfig.centerDotShow,
        centerDotThickness: funConfig.centerDotThickness,
        centerDotOpacity: Math.floor((Math.random() * 0.5 + 0.5) * 255), // 0.5-1.0 alpha (sichtbar)
        outerLinesShow: funConfig.outerLinesShow,
        outerLinesLength: funConfig.outerLinesLength,
        outerLinesThickness: funConfig.outerLinesThickness,
        outerLinesOffset: funConfig.outerLinesOffset,
        outerLinesOpacity: Math.floor((Math.random() * 0.6 + 0.4) * 255), // 0.4-1.0 alpha
        innerLinesShow: funConfig.innerLinesShow || false,
        innerLinesLength: funConfig.innerLinesLength || Math.floor(Math.random() * 12) + 3, // 3-14 (VCRDB range)
        innerLinesThickness: Math.floor(Math.random() * 6) + 1, // 1-6 (VCRDB)
        innerLinesOffset: Math.floor(Math.random() * 15), // 0-15 (VCRDB)
        innerLinesOpacity: Math.floor((Math.random() * 0.5 + 0.5) * 255), // 0.5-1.0 alpha
        outlineShow: Math.random() > 0.5, // 50% outline (mehr bei Fun)
        outlineOpacity: Math.floor((Math.random() * 0.5 + 0.3) * 255), // 0.3-0.8 alpha
        outlineThickness: Math.floor(Math.random() * 6) + 1, // 1-6 (VCRDB)
        firingErrorShow: Math.random() > 0.6,
        movementErrorShow: Math.random() > 0.7,
        fadeCrosshairWithFiringError: Math.random() > 0.8
      }));
      
      showNotification(`🎨 ${selectedMode} Style generiert!`);
    }
  };

  // Generate Crosshair Code - Nutzt alle erweiterten Einstellungen
  const generateCrosshairCode = () => {
    // Verwende die erweiterte Funktion mit allen Settings
    const code = generateValorantCrosshairCode(settings);
    
    setCrosshairCode(code);
    return code;
  };

  // Copy Code
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(crosshairCode);
      showNotification("Crosshair-Code wurde kopiert! In Valorant: Einstellungen → Fadenkreuz → Importieren");
    } catch (err) {
      showNotification("Code konnte nicht kopiert werden.", "error");
    }
  };

  // Generate Image for Download (uses real preview if available)
  const generateImage = async () => {
    // If we already have a real preview, use that for download
    if (realPreviewImage) {
      setGeneratedImage(realPreviewImage);
      showNotification("Aktuelles Crosshair-Bild bereit zum Download.");
      return;
    }

    // Otherwise generate fresh image
    setLoading(true);
    try {
      const code = crosshairCode || generateCrosshairCode();
      
      // Use Railway Backend as Proxy (CORS-Safe)
      const response = await fetch(`/api/crosshair/generate?code=${encodeURIComponent(code)}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setGeneratedImage(imageUrl);
        showNotification("Dein Crosshair-Bild wurde erfolgreich erstellt.");
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unbekannter Fehler' }));
        throw new Error(errorData.message || `API Fehler: ${response.status}`);
      }
    } catch (err) {
      showNotification(`Das Crosshair-Bild konnte nicht erstellt werden: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Download Image
  const downloadImage = () => {
    const imageToDownload = generatedImage || realPreviewImage;
    if (!imageToDownload) return;
    
    const a = document.createElement('a');
    a.href = imageToDownload;
    a.download = 'valorant-crosshair.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showNotification("Dein Crosshair wird heruntergeladen.");
  };

  // Get Color Value - Custom Color System
  const getColorValue = (colorName: string) => {
    if (colorName === 'custom') {
      return settings.customColor;
    }
    const colors: Record<string, string> = {
      'white': '#FFFFFF',
    };
    const result = colors[colorName] || settings.customColor;
    return result;
  };

  // Auto-generate real crosshair image with debouncing
  const [realPreviewImage, setRealPreviewImage] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Debounced effect for real-time preview
  useEffect(() => {
    generateCrosshairCode();

    // Debounce API calls for real preview (wait 800ms after last change)
    const timeoutId = setTimeout(() => {
      generateRealPreview();
    }, 800);

    return () => clearTimeout(timeoutId);
    }, [settings]);

  // Initial load of real preview
  useEffect(() => {
    generateRealPreview();
  }, []);

  // Generate real crosshair preview via API
  const generateRealPreview = async () => {
    setPreviewLoading(true);
    try {
      const code = generateValorantCrosshairCode(settings);
      
      const response = await fetch(`/api/crosshair/generate?code=${encodeURIComponent(code)}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        
        // Clean up old image URL
        if (realPreviewImage) {
          URL.revokeObjectURL(realPreviewImage);
        }
        
        setRealPreviewImage(imageUrl);
      } else {
        console.warn('Real preview failed, using CSS fallback');
        setRealPreviewImage(null);
      }
    } catch (err) {
      console.warn('Real preview error:', err);
      setRealPreviewImage(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (realPreviewImage) {
        URL.revokeObjectURL(realPreviewImage);
      }
      if (generatedImage && generatedImage !== realPreviewImage) {
        URL.revokeObjectURL(generatedImage);
      }
    };
  }, []);

  // 🔗 Share Crosshair to Discord
  const shareCrosshair = async () => {
    try {
      setLoading(true);
      
      // Get available guilds first using repaired crosshair endpoint
      const guildsResponse = await fetch('/api/crosshair/discord/guilds');
      const guildsData = await guildsResponse.json();
      
      if (!guildsData.success || !guildsData.guilds || guildsData.guilds.length === 0) {
        throw new Error('Keine Discord Server verfügbar. Stelle sicher, dass der Bot Token konfiguriert ist.');
      }

      // Use first available guild for now (TODO: Let user choose)
      const selectedGuild = guildsData.guilds[0];
      
      // TODO: Replace with real Discord OAuth user data
      const mockUser = {
        id: '123456789012345678',
        username: 'Anonymous User',
        avatar: 'https://cdn.discordapp.com/embed/avatars/0.png'
      };

      // Detect crosshair type
      const getCrosshairType = () => {
        if (settings.centerDotShow && settings.innerLinesShow) return 'Hybrid';
        if (settings.centerDotShow && !settings.innerLinesShow) return 'Center Dot';
        if (!settings.centerDotShow && settings.innerLinesShow) return 'Compact';
        return 'Custom';
      };

      // Get primary color
      const getPrimaryColor = () => {
        if (settings.primaryColor === 'custom') {
          return settings.customColor;
        }
        return '#FFFFFF'; // Default white
      };

      const shareData = {
        user_id: mockUser.id,
        username: mockUser.username,
        user_avatar: mockUser.avatar,
        guild_id: selectedGuild.id,
        crosshair_code: crosshairCode || generateValorantCrosshairCode(settings),
        crosshair_name: `${getCrosshairType()} Crosshair`,
        description: `Created with AgentBee Crosshair Creator`,
        crosshair_type: getCrosshairType(),
        color_hex: getPrimaryColor(),
        tags: [getCrosshairType().toLowerCase(), 'agentbee']
      };

      console.log('🎯 Sharing crosshair:', shareData);
      const response = await fetch('/api/crosshair/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shareData)
      });

      const result = await response.json();

      if (result.success) {
        showNotification(
          `🎯 Crosshair erfolgreich geteilt! ${result.discord_posted ? '📤 In Discord gepostet!' : '💾 Gespeichert!'}`, 
          'success'
        );
      } else {
        throw new Error(result.message || 'Sharing failed');
      }

    } catch (error) {
      console.error('❌ Share error:', error);
      showNotification(
        '❌ Fehler beim Teilen. Stelle sicher, dass Discord konfiguriert ist.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Custom animations using inline styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes crosshair-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      @keyframes crosshair-glow {
        0%, 100% { filter: drop-shadow(0 0 5px rgba(168, 85, 247, 0.5)); }
        50% { filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.8)); }
      }
      @keyframes crosshair-gradient {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes crosshair-fade-up {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes crosshair-fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes crosshair-slide-left {
        from { opacity: 0; transform: translateX(-50px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes crosshair-slide-right {
        from { opacity: 0; transform: translateX(50px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes crosshair-spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes valorant-grid {
        0%, 100% { opacity: 0.02; }
        50% { opacity: 0.08; }
      }
      @keyframes subtle-glow {
        0%, 100% { opacity: 0.1; }
        50% { opacity: 0.3; }
      }
      @keyframes corner-scan {
        0% { transform: scaleX(0); }
        50% { transform: scaleX(1); }
        100% { transform: scaleX(0); }
      }
      .valorant-bg {
        background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #111827 100%);
      }
      .animate-float { animation: crosshair-float 3s ease-in-out infinite; }
      .animate-glow { animation: crosshair-glow 2s ease-in-out infinite; }
      .animate-gradient-x { 
        background-size: 400% 400%;
        animation: crosshair-gradient 3s ease infinite;
      }
      .animate-fade-in-up { animation: crosshair-fade-up 0.6s ease-out forwards; }
      .animate-fade-in { animation: crosshair-fade 0.6s ease-out forwards; }
      .animate-slide-in-left { animation: crosshair-slide-left 0.6s ease-out forwards; }
      .animate-slide-in-right { animation: crosshair-slide-right 0.6s ease-out forwards; }
      .animate-spin-slow { animation: crosshair-spin-slow 4s linear infinite; }
      .valorant-grid { animation: valorant-grid 8s ease-in-out infinite; }
      .subtle-glow { animation: subtle-glow 6s ease-in-out infinite; }
      .corner-scan { animation: corner-scan 4s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Particle System Canvas Effect
  useEffect(() => {
    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle class
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Keep within bounds
        this.x = Math.max(0, Math.min(canvas.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height, this.y));
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${this.opacity})`;
        ctx.fill();
      }
    }

    // Create particles
    const particles: Particle[] = [];
    const particleCount = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
    
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Mouse interaction
    let mouse = { x: 0, y: 0 };
    
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Draw connections
    const drawConnections = () => {
      const maxDistance = 120;
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.3;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Mouse connections
        const dx = particles[i].x - mouse.x;
        const dy = particles[i].y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          const opacity = (1 - distance / 150) * 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(34, 211, 238, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections
      drawConnections();

      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen valorant-bg text-white relative overflow-hidden">
      {/* Connected Particle Background */}
      <canvas
        id="particle-canvas"
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #111827 100%)' }}
      />
      
      {/* Corner UI Elements (Valorant Style) */}
      <div className="absolute inset-0 z-1 pointer-events-none">
        <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-gray-400/20"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-gray-400/20"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-gray-400/20"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-gray-400/20"></div>
      </div>
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <NotificationComponent />
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8 p-8 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-purple-500/20 shadow-2xl animate-fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="w-12 h-12 text-purple-400 animate-pulse hover:animate-spin transition-all duration-300 hover:scale-110" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
              Valorant Crosshair Creator
            </h1>
          </div>
          <p className="text-xl text-purple-200 mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
            Erstelle dein perfektes Crosshair mit Custom Color System
          </p>
        </div>

        {/* Side-by-Side Layout */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-purple-500/20 rounded-2xl p-8 shadow-xl animate-fade-in-up hover:shadow-2xl transition-all duration-500" style={{ animationDelay: '300ms' }}>
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-3">
            <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-3 animate-slide-in-left">
              <Sliders className="w-6 h-6 animate-bounce hover:animate-spin transition-all duration-300" />
              Crosshair Creator
            </h2>

          </div>

          {/* Side-by-Side: Vorschau links, Einstellungen rechts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Live Vorschau - Links */}
            <div className="lg:col-span-5 animate-slide-in-left" style={{ animationDelay: '500ms' }}>
              <div className="sticky top-8">
                <div className="p-6 bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-xl hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20 animate-float">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <h3 className="text-lg font-bold text-green-400 flex items-center gap-2 animate-glow">
                      <Eye className="w-5 h-5 animate-pulse" />
                      {realPreviewImage ? '🎯 Echtzeit Vorschau' : 'Live Vorschau'}
                    </h3>
                    <div className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1 font-medium ${
                      realPreviewImage ? 'text-green-300 bg-green-800/30 border border-green-600/30' : 'text-orange-300 bg-orange-800/30 border border-orange-600/30'
                    }`}>
                      {previewLoading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                          Lädt...
                        </>
                      ) : realPreviewImage ? (
                        <>✅ AgentBee</>
                      ) : (
                        <>⚠️ CSS Fallback</>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full h-64 bg-gradient-to-b from-gray-900 to-black rounded-xl flex items-center justify-center relative overflow-hidden border border-green-600/20 shadow-inner">
                    {/* Real Valorant Preview */}
                    {realPreviewImage ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                          src={realPreviewImage}
                          alt="Real Valorant Crosshair Preview"
                          className="max-w-full max-h-full object-contain rounded"
                          style={{ 
                            imageRendering: 'pixelated',
                            filter: 'contrast(1.1) brightness(1.1)'
                          }}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-green-400 bg-black/50 px-2 py-1 rounded">
                          AgentBee ✅
                      </div>
                      </div>
                    ) : (
                      <>
                        {/* Valorant-ähnlicher Hintergrund */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="w-full h-full" style={{
                            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2px, transparent 0),
                                             radial-gradient(circle at 75px 75px, rgba(255,255,255,0.05) 1px, transparent 0)`,
                            backgroundSize: '100px 100px'
                          }}></div>
                </div>

                        {/* CSS Fallback Preview */}
                        <div className="relative w-32 h-32 z-10">
                          {/* Outer Lines - DISABLED (Coming Soon) */}
                          {/* TODO: Re-enable when parameter compatibility is fixed */}

                          {/* Inner Lines */}
                          {settings.innerLinesShow && (
                            <>
                              {/* Horizontal Inner Lines */}
                              <div 
                                className="absolute top-1/2 transform -translate-y-1/2"
                                style={{
                                  backgroundColor: getColorValue(settings.primaryColor),
                                  width: `${settings.innerLinesLength * 2}px`,
                                  height: `${settings.innerLinesThickness}px`,
                                  left: `${64 + settings.innerLinesOffset * 2}px`,
                                  opacity: settings.innerLinesOpacity / 255
                                }}
                              />
                              <div 
                                className="absolute top-1/2 transform -translate-y-1/2"
                                style={{
                                  backgroundColor: getColorValue(settings.primaryColor),
                                  width: `${settings.innerLinesLength * 2}px`,
                                  height: `${settings.innerLinesThickness}px`,
                                  right: `${64 + settings.innerLinesOffset * 2}px`,
                                  opacity: settings.innerLinesOpacity / 255
                                }}
                              />
                              
                              {/* Vertical Inner Lines */}
                              <div 
                                className="absolute left-1/2 transform -translate-x-1/2"
                                style={{
                                  backgroundColor: getColorValue(settings.primaryColor),
                                  width: `${settings.innerLinesThickness}px`,
                                  height: `${settings.innerLinesLength * 2}px`,
                                  top: `${64 + settings.innerLinesOffset * 2}px`,
                                  opacity: settings.innerLinesOpacity / 255
                                }}
                              />
                              <div 
                                className="absolute left-1/2 transform -translate-x-1/2"
                                style={{
                                  backgroundColor: getColorValue(settings.primaryColor),
                                  width: `${settings.innerLinesThickness}px`,
                                  height: `${settings.innerLinesLength * 2}px`,
                                  bottom: `${64 + settings.innerLinesOffset * 2}px`,
                                  opacity: settings.innerLinesOpacity / 255
                                }}
                              />
                            </>
                          )}

                          {/* Center Dot */}
                          {settings.centerDotShow && settings.centerDotThickness > 0 && (
                            <div 
                              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
                              style={{
                                backgroundColor: getColorValue(settings.primaryColor),
                                width: `${Math.max(1, settings.centerDotThickness * 1.5)}px`,
                                height: `${Math.max(1, settings.centerDotThickness * 1.5)}px`,
                                opacity: settings.centerDotOpacity / 255,
                                boxShadow: settings.outlineShow ? `0 0 0 1px rgba(0,0,0,0.8)` : 'none'
                              }}
                            />
                          )}
                        </div>
                        
                        {/* Loading Overlay */}
                        {previewLoading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                            <div className="flex items-center gap-3 text-purple-300">
                              <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-sm font-medium">Lade echte Vorschau...</span>
                      </div>
                          </div>
                        )}
                      </>
                    )}
                    </div>
                  </div>
                </div>
              </div>

            {/* Crosshair Einstellungen - Rechts */}
            <div className="lg:col-span-7 space-y-6 animate-slide-in-right" style={{ animationDelay: '700ms' }}>
              {/* Crosshair Details - Oben */}
              <div>
                <h3 className="text-xl font-bold text-purple-400 mb-6 flex items-center gap-2 animate-glow">
                  <Settings className="w-5 h-5 animate-spin-slow" />
                  Crosshair Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Center Dot */}
                  <div className="p-4 bg-purple-600/10 border border-purple-500/20 rounded-lg hover:bg-purple-600/20 hover:border-purple-400/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 animate-fade-in" style={{ animationDelay: '900ms' }}>
                    <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="centerDotShow"
                    checked={settings.centerDotShow}
                    onCheckedChange={(checked) => updateSetting('centerDotShow', checked)}
                  />
                  <label htmlFor="centerDotShow" className="text-purple-200 font-medium">
                        Center Dot
                  </label>
                </div>

                {settings.centerDotShow && (
                      <div className="space-y-3">
                    <div>
                      <label className="block text-purple-200 text-sm mb-2">
                        Dicke: {settings.centerDotThickness}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="6"
                        value={settings.centerDotThickness}
                        onChange={(e) => updateSetting('centerDotThickness', parseInt(e.target.value))}
                        className="w-full h-2 bg-purple-800 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    <div>
                      <label className="block text-purple-200 text-sm mb-2">
                        Transparenz: {settings.centerDotOpacity}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={settings.centerDotOpacity}
                        onChange={(e) => updateSetting('centerDotOpacity', parseInt(e.target.value))}
                        className="w-full h-2 bg-purple-800 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Outer Lines - COMING SOON */}
                  <div className="p-4 bg-gray-600/10 border border-gray-500/20 rounded-lg opacity-60 animate-fade-in" style={{ animationDelay: '1000ms' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-400 rounded opacity-30"></div>
                        <label className="text-gray-400 font-medium">
                          Äußere Linien
                        </label>
                      </div>
                      <div className="bg-orange-500/20 border border-orange-400/30 px-3 py-1 rounded-full">
                        <span className="text-orange-300 text-xs font-medium">🚧 Coming Soon</span>
                      </div>
                    </div>
                    
                    <div className="text-center py-6">
                      <div className="text-gray-400 text-sm mb-2">⚠️ Äußere Linien werden aktuell überarbeitet</div>
                      <div className="text-gray-500 text-xs">Parameter-Kompatibilität wird optimiert...</div>
                    </div>
              </div>

              {/* Inner Lines */}
                  <div className="lg:col-span-2 p-4 bg-cyan-600/10 border border-cyan-500/20 rounded-lg hover:bg-cyan-600/20 hover:border-cyan-400/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 animate-fade-in" style={{ animationDelay: '1100ms' }}>
                    <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="innerLinesShow"
                    checked={settings.innerLinesShow}
                    onCheckedChange={(checked) => updateSetting('innerLinesShow', checked)}
                  />
                      <label htmlFor="innerLinesShow" className="text-cyan-200 font-medium">
                        Innere Linien
                  </label>
                </div>

                {settings.innerLinesShow && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                          <label className="block text-cyan-200 text-sm mb-2">
                        Länge: {settings.innerLinesLength}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="15"
                        value={settings.innerLinesLength}
                        onChange={(e) => updateSetting('innerLinesLength', parseInt(e.target.value))}
                            className="w-full h-2 bg-cyan-800 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    <div>
                          <label className="block text-cyan-200 text-sm mb-2">
                        Dicke: {settings.innerLinesThickness}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={settings.innerLinesThickness}
                        onChange={(e) => updateSetting('innerLinesThickness', parseInt(e.target.value))}
                            className="w-full h-2 bg-cyan-800 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    <div>
                          <label className="block text-cyan-200 text-sm mb-2">
                        Abstand: {settings.innerLinesOffset}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={settings.innerLinesOffset}
                        onChange={(e) => updateSetting('innerLinesOffset', parseInt(e.target.value))}
                            className="w-full h-2 bg-cyan-800 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    <div>
                          <label className="block text-cyan-200 text-sm mb-2">
                        Transparenz: {settings.innerLinesOpacity}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={settings.innerLinesOpacity}
                        onChange={(e) => updateSetting('innerLinesOpacity', parseInt(e.target.value))}
                            className="w-full h-2 bg-cyan-800 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
                  </div>
                  
              {/* Farbauswahl - Unten */}
              <div className="animate-fade-in" style={{ animationDelay: '1200ms' }}>
                <h3 className="text-xl font-bold text-pink-400 mb-6 flex items-center gap-2 animate-glow">
                  <Star className="w-5 h-5 animate-spin-slow" />
                  Farbauswahl
                </h3>
                <div className="p-6 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-pink-500/20">
                  <div className="mb-6">
                    <label className="block text-pink-200 font-medium mb-4">
                      Primärfarbe 
                      <span className="text-sm text-pink-300 ml-2">
                        (Aktuell: {settings.primaryColor} → {getColorValue(settings.primaryColor)})
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {presetColors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => {
                            updateSetting('primaryColor', color.value);
                          }}
                          className={`relative p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                            settings.primaryColor === color.value
                              ? 'border-pink-400 bg-pink-500/20 shadow-lg'
                              : 'border-pink-600/30 hover:border-pink-400/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded border-2 border-white/20"
                              style={{ backgroundColor: color.color }}
                            />
                            <span className="text-pink-200 font-medium">{color.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Color Picker */}
                  <div className="p-4 bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-lg border border-orange-500/30">
                    <label className="block text-orange-300 font-medium mb-3">
                      🎨 Custom Color Picker
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Farbe wählen</label>
                        <input
                          type="color"
                          value={settings.customColor}
                          onChange={(e) => {
                            updateSetting('customColor', e.target.value);
                            updateSetting('primaryColor', 'custom');
                          }}
                          className="w-full h-12 rounded border border-orange-500/30 bg-transparent cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Hex-Code</label>
                        <input
                          type="text"
                          value={settings.customColor}
                          onChange={(e) => {
                            updateSetting('customColor', e.target.value);
                            updateSetting('primaryColor', 'custom');
                          }}
                          className="w-full px-3 py-2 bg-black/30 border border-orange-500/30 rounded text-orange-100 placeholder-orange-400"
                          placeholder="#FF0000"
                        />
                        <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-yellow-300 font-medium">🔥 WICHTIGE ANLEITUNG:</p>
                            <button
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(settings.customColor);
                                  showNotification(`Hex-Code ${settings.customColor} kopiert!`);
                                } catch (err) {
                                  showNotification("Kopieren fehlgeschlagen", "error");
                                }
                              }}
                              className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-xs font-medium"
                              title="Hex-Code kopieren"
                            >
                              📋 {settings.customColor}
                            </button>
                          </div>
                          <ol className="text-xs text-yellow-200 space-y-1">
                            <li>1. Wähle deine Farbe (z.B. #F90606)</li>
                            <li>2. Kopiere den generierten Code</li>
                            <li>3. In Valorant: Code importieren</li>
                            <li>4. In Valorant: Settings → Crosshair → Primary → Color → Custom → <span className="bg-black/30 px-1 rounded">{settings.customColor}</span></li>
                          </ol>
                          <p className="text-xs text-yellow-300 mt-2 font-medium">⚠️ Custom Color muss separat in Valorant gesetzt werden!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Randomizer Section */}
        <div className="mt-8 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-md border border-amber-500/20 rounded-2xl p-6 shadow-xl animate-fade-in-up hover:shadow-2xl transition-all duration-500" style={{ animationDelay: '1400ms' }}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-amber-400 animate-glow mb-2 flex items-center gap-2">
                🎲 Crosshair Randomizer
              </h3>
              <p className="text-amber-200 text-sm">
                Lass den Zufall entscheiden! Generiere automatisch neue Crosshair-Designs.
              </p>
                  </div>
            <div className="flex flex-col sm:flex-row gap-3 animate-slide-in-right" style={{ animationDelay: '1600ms' }}>
              <div className="group relative">
                <Button
                  onClick={() => generateRandomCrosshair('pro')}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30"
                >
                  <Star className="w-4 h-4 mr-2 animate-spin-slow" />
                  🏆 Pro Random
                </Button>
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  Realistische Pro-Player Settings
                </div>
              </div>
              <div className="group relative">
                <Button
                  onClick={() => generateRandomCrosshair('fun')}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/30"
                >
                  <Star className="w-4 h-4 mr-2 animate-bounce" />
                  🎨 Fun Random
                </Button>
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  Wilde & experimentelle Crosshairs
                </div>
              </div>
              <div className="group relative">
                <Button
                  onClick={() => {
                    let count = 0;
                    const interval = setInterval(() => {
                      generateRandomCrosshair(Math.random() > 0.5 ? 'pro' : 'fun');
                      count++;
                      if (count >= 5) {
                        clearInterval(interval);
                        showNotification('🎲✨ Auto-Random Spree abgeschlossen!');
                      }
                    }, 1500);
                    showNotification('🔥 Auto-Random Spree gestartet! (5x in Folge)');
                  }}
                  variant="outline"
                  className="border-amber-500 text-amber-400 hover:bg-amber-500/20 transition-all duration-300 hover:scale-105"
                >
                  <Target className="w-4 h-4 mr-2 animate-pulse" />
                  🔥 Spree
                </Button>
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  5 Random Crosshairs hintereinander
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Code und Actions */}
        <div className="mt-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-purple-500/20 rounded-2xl p-8 shadow-xl animate-fade-in-up hover:shadow-2xl transition-all duration-500" style={{ animationDelay: '1500ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-purple-400 animate-glow">Dein Crosshair Code</h3>
            <div className="flex gap-3 animate-slide-in-right" style={{ animationDelay: '1700ms' }}>
              <Button
                onClick={() => setSettings({
                  primaryColor: 'white',
                  customColor: '#FF0000',
                  centerDotShow: true,
                  centerDotThickness: 2,
                  centerDotOpacity: 255,
                  outerLinesShow: false, // Disabled - Coming Soon
                  outerLinesLength: 0,
                  outerLinesThickness: 0,
                  outerLinesOffset: 0,
                  outerLinesOpacity: 255,
                  innerLinesShow: true, // Enable Inner Lines instead
                  innerLinesLength: 4,
                  innerLinesThickness: 2,
                  innerLinesOffset: 1,
                  innerLinesOpacity: 255,
                  outlineShow: false,
                  outlineOpacity: 255,
                  outlineThickness: 1,
                  firingErrorShow: false,
                  movementErrorShow: false,
                  fadeCrosshairWithFiringError: false
                })}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500/20"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={generateImage}
                disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {loading ? (
                  <>
                    <Download className="w-4 h-4 mr-2 animate-spin" />
                    Generiere...
                  </>
                ) : realPreviewImage ? (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Für Download bereit
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Bild Generieren
                  </>
                )}
              </Button>
              <Button 
                onClick={shareCrosshair}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/30"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Teilen...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    🔗 Discord Teilen
                  </>
                )}
              </Button>
              <Button onClick={copyCode} className="bg-green-600 hover:bg-green-700">
                <Copy className="w-4 h-4 mr-2" />
                Code Kopieren
              </Button>
            </div>
          </div>
          
          <div className="bg-black/30 p-4 rounded-lg font-mono text-sm break-all text-purple-100 mb-4 hover:bg-black/40 transition-all duration-300 animate-fade-in hover:shadow-inner border border-purple-800/30" style={{ animationDelay: '1800ms' }}>
            {crosshairCode || "Wähle ein Preset oder passe die Einstellungen an..."}
          </div>

          {(generatedImage || realPreviewImage) && (
            <div className="mt-6 text-center">
              <h4 className="text-purple-300 font-medium mb-4">
                {realPreviewImage ? '🎯 Valorant Crosshair (Live Preview)' : 'Generiertes Crosshair'}
              </h4>
              <div className="inline-block bg-black/30 p-4 rounded-lg">
                <img 
                  src={generatedImage || realPreviewImage} 
                  alt="Valorant Crosshair" 
                  className="max-w-xs mx-auto rounded"
                  style={{ 
                    imageRendering: 'pixelated',
                    filter: 'contrast(1.1) brightness(1.1)'
                  }}
                />
                <Button 
                  onClick={downloadImage}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Crosshair Herunterladen
                </Button>
                {realPreviewImage && (
                  <p className="text-xs text-green-400 mt-2">
                    ✅ Powered by AgentBee • 1:1 wie in Valorant
                  </p>
                )}
              </div>
            </div>
          )}

          {settings.primaryColor === 'custom' && (
            <div className="mt-6 p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-400 mb-2">Custom Color - Zwei Schritte erforderlich!</h4>
                  <div className="text-sm text-orange-300 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">1</span>
                      <span>Code oben kopieren und in Valorant importieren</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">2</span>
                      <span>In Valorant: Settings → Crosshair → Primary → Color → Custom → <code className="bg-black/30 px-1 rounded">{settings.customColor}</code></span>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(settings.customColor);
                            showNotification(`Hex-Code ${settings.customColor} für Valorant kopiert!`);
                          } catch (err) {
                            showNotification("Kopieren fehlgeschlagen", "error");
                          }
                        }}
                        className="text-xs bg-orange-500 hover:bg-orange-600 px-2 py-1 rounded text-white"
                      >
                        📋 Kopieren
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default CrosshairCreator; 