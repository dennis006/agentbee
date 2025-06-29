import { useState, useEffect } from 'react';
import { Target, Copy, Download, Settings, Eye, Check, RotateCcw, Star, Sliders, AlertCircle } from 'lucide-react';
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
    // 🎨 CUSTOM COLOR SYSTEM - verwendet Index 5 für alle custom colors
    const colorMap: Record<string, number> = {
      'white': 0, 'custom': 5
    };
    
    const color = colorMap.hasOwnProperty(settings.primaryColor) ? colorMap[settings.primaryColor] : 1;
    
    let code = "0"; // Start
    
    // Scaling (optional, für modernere Codes)
    if (settings.centerDotShow || settings.outerLinesShow || settings.innerLinesShow) {
      code += ";s;1";
    }
    
    // Primary Crosshair Marker
    code += ";P";
    
    // Color
    code += `;c;${color}`;
    
    // Outline/Border
    code += `;h;${settings.outlineShow ? 1 : 0}`;
    
    // Center Dot
    if (settings.centerDotShow && settings.centerDotThickness > 0) {
      code += ";o;1"; // outline on
      code += ";d;1"; // dot on
      code += `;z;${settings.centerDotThickness}`; // dot size
    } else {
      code += ";d;0"; // dot off
    }
    
    // Firing error fade
    code += `;f;${settings.fadeCrosshairWithFiringError ? 1 : 0}`;
    
    // Movement error
    if (settings.movementErrorShow) {
      code += ";m;1";
    }
    
    // Outer Lines (0x parameters)
    if (settings.outerLinesShow) {
      code += `;0l;${settings.outerLinesLength}`; // outer length
      code += `;0o;${settings.outerLinesOffset}`; // outer offset
      code += `;0a;${Math.round(settings.outerLinesOpacity / 255)}`; // outer alpha (0 or 1)
      code += `;0f;0`; // outer fade
      if (settings.outerLinesThickness !== 1) {
        code += `;0t;${settings.outerLinesThickness}`; // outer thickness
      }
    } else {
      code += ";0l;0;0o;0;0a;0;0f;0";
    }
    
    // Inner Lines (1x parameters)  
    if (settings.innerLinesShow) {
      code += `;1l;${settings.innerLinesLength}`; // inner length
      code += `;1o;${settings.innerLinesOffset}`; // inner offset
      code += `;1a;${Math.round(settings.innerLinesOpacity / 255)}`; // inner alpha
      if (settings.innerLinesThickness !== 1) {
        code += `;1t;${settings.innerLinesThickness}`; // inner thickness
      }
      code += ";1m;0;1f;0"; // inner movement, fade
    }
    
    // Standard end
    code += ";1b;0";
    
    return code;
  } catch (error) {
    // Fallback zu funktionierendem TenZ-Code
    return "0;s;1;P;c;1;h;0;f;0;0l;4;0o;2;0a;1;0f;0;1b;0";
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
    outerLinesShow: true,
    outerLinesLength: 7,
    outerLinesThickness: 2,
    outerLinesOffset: 3,
    outerLinesOpacity: 255,
    innerLinesShow: false,
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
      const apiUrl = import.meta.env.VITE_API_URL || 'https://agentbee.up.railway.app';
      const response = await fetch(`${apiUrl}/api/crosshair/generate?code=${encodeURIComponent(code)}`);
      
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
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://agentbee.up.railway.app';
      const response = await fetch(`${apiUrl}/api/crosshair/generate?code=${encodeURIComponent(code)}`);
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <NotificationComponent />
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8 p-8 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-purple-500/20 shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="w-12 h-12 text-purple-400 animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Valorant Crosshair Creator
            </h1>
          </div>
          <p className="text-xl text-purple-200 mb-6">
            Erstelle dein perfektes Crosshair mit Custom Color System
          </p>
        </div>

        {/* Side-by-Side Layout */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-purple-500/20 rounded-2xl p-8 shadow-xl">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-3">
            <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-3">
              <Sliders className="w-6 h-6" />
              Crosshair Creator
            </h2>
            <div className="text-sm text-purple-300 bg-purple-900/20 px-3 py-1.5 rounded-lg border border-purple-600/30">
              💡 Vorschau + Einstellungen nebeneinander - kein Scrollen!
            </div>
          </div>

          {/* Side-by-Side: Vorschau links, Einstellungen rechts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Live Vorschau - Links */}
            <div className="lg:col-span-5">
              <div className="sticky top-8">
                <div className="p-6 bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                      <Eye className="w-5 h-5" />
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
                        <>✅ Henrik API</>
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
                          Henrik API ✅
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
                          {/* Outer Lines */}
                          {settings.outerLinesShow && (
                            <>
                              {/* Horizontal Outer Lines */}
                              <div 
                                className="absolute top-1/2 transform -translate-y-1/2"
                                style={{
                                  backgroundColor: getColorValue(settings.primaryColor),
                                  width: `${settings.outerLinesLength * 2}px`,
                                  height: `${settings.outerLinesThickness}px`,
                                  left: `${64 + settings.outerLinesOffset * 2}px`,
                                  opacity: settings.outerLinesOpacity / 255
                                }}
                              />
                              <div 
                                className="absolute top-1/2 transform -translate-y-1/2"
                                style={{
                                  backgroundColor: getColorValue(settings.primaryColor),
                                  width: `${settings.outerLinesLength * 2}px`,
                                  height: `${settings.outerLinesThickness}px`,
                                  right: `${64 + settings.outerLinesOffset * 2}px`,
                                  opacity: settings.outerLinesOpacity / 255
                                }}
                              />
                              
                              {/* Vertical Outer Lines */}
                              <div 
                                className="absolute left-1/2 transform -translate-x-1/2"
                                style={{
                                  backgroundColor: getColorValue(settings.primaryColor),
                                  width: `${settings.outerLinesThickness}px`,
                                  height: `${settings.outerLinesLength * 2}px`,
                                  top: `${64 + settings.outerLinesOffset * 2}px`,
                                  opacity: settings.outerLinesOpacity / 255
                                }}
                              />
                              <div 
                                className="absolute left-1/2 transform -translate-x-1/2"
                                style={{
                                  backgroundColor: getColorValue(settings.primaryColor),
                                  width: `${settings.outerLinesThickness}px`,
                                  height: `${settings.outerLinesLength * 2}px`,
                                  bottom: `${64 + settings.outerLinesOffset * 2}px`,
                                  opacity: settings.outerLinesOpacity / 255
                                }}
                              />
                            </>
                          )}

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
            <div className="lg:col-span-7 space-y-6">
              {/* Crosshair Details - Oben */}
              <div>
                <h3 className="text-xl font-bold text-purple-400 mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Crosshair Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Center Dot */}
                  <div className="p-4 bg-purple-600/10 border border-purple-500/20 rounded-lg">
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

                  {/* Outer Lines */}
                  <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="outerLinesShow"
                        checked={settings.outerLinesShow}
                        onCheckedChange={(checked) => updateSetting('outerLinesShow', checked)}
                      />
                      <label htmlFor="outerLinesShow" className="text-blue-200 font-medium">
                        Äußere Linien
                      </label>
                    </div>

                    {settings.outerLinesShow && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-blue-200 text-sm mb-2">
                            Länge: {settings.outerLinesLength}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={settings.outerLinesLength}
                            onChange={(e) => updateSetting('outerLinesLength', parseInt(e.target.value))}
                            className="w-full h-2 bg-blue-800 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>

                        <div>
                          <label className="block text-blue-200 text-sm mb-2">
                            Dicke: {settings.outerLinesThickness}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={settings.outerLinesThickness}
                            onChange={(e) => updateSetting('outerLinesThickness', parseInt(e.target.value))}
                            className="w-full h-2 bg-blue-800 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>

                        <div>
                          <label className="block text-blue-200 text-sm mb-2">
                            Abstand: {settings.outerLinesOffset}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="15"
                            value={settings.outerLinesOffset}
                            onChange={(e) => updateSetting('outerLinesOffset', parseInt(e.target.value))}
                            className="w-full h-2 bg-blue-800 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>

                        <div>
                          <label className="block text-blue-200 text-sm mb-2">
                            Transparenz: {settings.outerLinesOpacity}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="255"
                            value={settings.outerLinesOpacity}
                            onChange={(e) => updateSetting('outerLinesOpacity', parseInt(e.target.value))}
                            className="w-full h-2 bg-blue-800 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Inner Lines */}
                  <div className="lg:col-span-2 p-4 bg-cyan-600/10 border border-cyan-500/20 rounded-lg">
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
              <div>
                <h3 className="text-xl font-bold text-pink-400 mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Farbauswahl
                </h3>
                <div className="p-6 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl">
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

        {/* Code und Actions */}
        <div className="mt-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-purple-500/20 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-purple-400">Dein Crosshair Code</h3>
            <div className="flex gap-3">
              <Button
                onClick={() => setSettings({
                  primaryColor: 'white',
                  customColor: '#FF0000',
                  centerDotShow: true,
                  centerDotThickness: 2,
                  centerDotOpacity: 255,
                  outerLinesShow: true,
                  outerLinesLength: 7,
                  outerLinesThickness: 2,
                  outerLinesOffset: 3,
                  outerLinesOpacity: 255,
                  innerLinesShow: false,
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
              <Button onClick={copyCode} className="bg-green-600 hover:bg-green-700">
                <Copy className="w-4 h-4 mr-2" />
                Code Kopieren
              </Button>
            </div>
          </div>
          
          <div className="bg-black/30 p-4 rounded-lg font-mono text-sm break-all text-purple-100 mb-4">
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
                    ✅ Automatisch generiert • 1:1 wie in Valorant
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

          <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-400 mb-2">Bewährte Codes</h4>
                <p className="text-sm text-green-300">
                  Alle Presets sind von der Community getestet und funktionieren garantiert in Valorant. 
                  Kopiere den Code und füge ihn unter Einstellungen → Fadenkreuz → Importieren ein.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-400 mb-2">🚀 Kompaktes All-in-One Design!</h4>
                <p className="text-sm text-blue-300">
                  Jetzt alles auf einen Blick! Die <strong>Echtzeit-Vorschau</strong> ist direkt über den Einstellungen 
                  integriert - so siehst du sofort wie dein Crosshair aussieht, ohne zu scrollen. 
                  Kompakt, praktisch und <strong>genau 1:1 wie in Valorant</strong>!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrosshairCreator; 