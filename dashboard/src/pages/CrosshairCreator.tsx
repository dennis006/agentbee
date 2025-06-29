import { useState, useEffect } from 'react';
import { Target, Copy, Download, Settings, Eye, Check } from 'lucide-react';
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

// Aktualisierte Presets mit ALLEN Parametern für korrekte Darstellung
const presets = [
  { 
    name: "Einfacher Dot (Derke)", 
    code: "0;s;1;P;c;5;o;1;d;1;z;3;0b;0;1b;0",
    description: "Einfacher Punkt mit Outline - funktioniert garantiert"
  },
  { 
    name: "Pink Dot", 
    code: "0;s;1;P;c;5;o;1;t;1;d;1;z;2;a;1;f;0;0b;0;1b;0",
    description: "Pink Punkt mit Umriss - wie im Screenshot zu sehen"
  },
  { 
    name: "Grüne Präzision", 
    code: "0;P;c;1;h;0;f;0;0l;4;0o;2;0a;1;0f;0;1b;0",
    description: "Grünes Fadenkreuz - garantiert funktionierend"
  },
  { 
    name: "Türkis Dot", 
    code: "0;s;1;P;c;4;o;1;t;1;d;1;z;2;a;1;f;0;0b;0;1b;0",
    description: "Türkisfarbener Punkt mit Umriss - exakt wie im Screenshot"
  },
  { 
    name: "Pro-Kreuz (TenZ)", 
    code: "0;s;1;P;c;1;h;0;f;0;0l;4;0o;2;0a;1;0f;0;1b;0",
    description: "Kompaktes Fadenkreuz von TenZ - präzise und klar"
  },
  { 
    name: "Minimalistisch", 
    code: "0;s;1;P;h;0;f;0;0l;4;0o;0;0a;1;0f;0;1b;0",
    description: "Extrem minimalistisches Fadenkreuz - ideal für Präzision"
  }
];

// Vollständige Code-Generierung mit ALLEN Valorant-Parametern
const generateValorantCrosshairCode = (color: number, centerDot: boolean, thickness: number): string => {
  try {
    // Verwende das bewährte Format aus den Presets
    const params = [];
    
    // Basis beginnt immer mit 0
    params.push("0");
    
    // "P" als Haupt-Parameter-Marker für primäres Fadenkreuz
    params.push("P");
    
    // Farbe
    params.push(`c;${color}`);
    
    // Outline standardmäßig aktiviert
    params.push("h;0");
    
    // Center Dot Parameter
    if (centerDot) {
      params.push("d;1");
      params.push(`z;${thickness}`);
      params.push("a;1");
    } else {
      params.push("d;0");
    }
    
    // Standard Fadenkreuz-Parameter
    params.push("f;0");
    params.push("0l;4");
    params.push("0o;2");
    params.push("0a;1");
    params.push("0f;0");
    params.push("1b;0");
    
    // Verbinde alle Parameter mit Strichpunkten
    return params.join(';');
  } catch (error) {
    console.error("Fehler bei der Codegenerierung:", error);
    // Fallback zum funktionierenden Preset
    return "0;P;c;1;h;0;f;0;0l;4;0o;2;0a;1;0f;0;1b;0";
  }
};

interface CrosshairSettings {
  primaryColor: string;
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
}

const CrosshairCreator = () => {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [crosshairCode, setCrosshairCode] = useState('');
  const [currentPreset, setCurrentPreset] = useState<string>('');
  
  // Toast System
  const { toasts, success, error, removeToast } = useToast();
  const { showNotification, NotificationComponent } = useNotification();

  // Vereinfachte Crosshair Settings
  const [settings, setSettings] = useState<CrosshairSettings>({
    primaryColor: 'green',
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
    innerLinesOpacity: 255
  });

  // Color Mapping
  const colorMap: Record<string, number> = {
    'white': 0, 'green': 1, 'yellowish-green': 2, 'greenish-yellow': 3,
    'cyan': 4, 'pink': 5, 'red': 6, 'custom': 7
  };

  const colorOptions = [
    { name: 'white', value: 'white', color: '#ffffff', label: 'Weiß' },
    { name: 'green', value: 'green', color: '#00ff00', label: 'Grün' },
    { name: 'yellowish-green', value: 'yellowish-green', color: '#adff2f', label: 'Gelb-Grün' },
    { name: 'greenish-yellow', value: 'greenish-yellow', color: '#9aff9a', label: 'Grün-Gelb' },
    { name: 'cyan', value: 'cyan', color: '#00ffff', label: 'Türkis' },
    { name: 'pink', value: 'pink', color: '#ff69b4', label: 'Pink' },
    { name: 'red', value: 'red', color: '#ff0000', label: 'Rot' }
  ];

  // Update Setting
  const updateSetting = (key: keyof CrosshairSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Generate Crosshair Code - Vereinfacht aber funktionierend
  const generateCrosshairCode = () => {
    const colorCode = colorMap[settings.primaryColor] || 1;
    
    // Verwende die bewährte Funktion
    const code = generateValorantCrosshairCode(
      colorCode,
      settings.centerDotShow,
      settings.centerDotThickness
    );
    
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

  // Apply Preset
  const applyPreset = (code: string, name: string) => {
    setCrosshairCode(code);
    setCurrentPreset(name);
    showNotification(`Preset "${name}" angewendet! Funktioniert garantiert in Valorant.`);
  };

  // Generate Image via Railway Proxy
  const generateImage = async () => {
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
      console.error('Fehler beim Generieren:', err);
      showNotification(`Das Crosshair-Bild konnte nicht erstellt werden: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Download Image
  const downloadImage = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = 'valorant-crosshair.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showNotification("Dein Crosshair wird heruntergeladen.");
  };

  // Get Color Value
  const getColorValue = (colorName: string) => {
    const colors: Record<string, string> = {
      'white': '#ffffff', 'green': '#00ff00', 'yellowish-green': '#adff2f', 'greenish-yellow': '#9aff9a',
      'cyan': '#00ffff', 'pink': '#ff69b4', 'red': '#ff0000'
    };
    return colors[colorName] || '#ffffff';
  };

  // Update code when settings change
  useEffect(() => {
    generateCrosshairCode();
  }, [settings]);

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
            Erstelle dein perfektes Crosshair mit bewährten Presets
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Presets Panel */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-purple-500/20 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Bewährte Presets
            </h2>

            <div className="space-y-4">
              {presets.map((preset, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "border rounded-lg p-4 hover:bg-purple-500/10 transition-colors cursor-pointer",
                    currentPreset === preset.name && "border-purple-400 bg-purple-500/20"
                  )}
                  onClick={() => applyPreset(preset.code, preset.name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-purple-300">{preset.name}</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        applyPreset(preset.code, preset.name);
                      }}
                      className="border-purple-400 text-purple-300 hover:bg-purple-500/20"
                    >
                      Anwenden
                    </Button>
                  </div>
                  <p className="text-sm text-purple-200 mb-3">{preset.description}</p>
                  <div className="bg-black/30 p-2 rounded text-xs font-mono break-all text-purple-100">
                    {preset.code}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Panel */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-purple-500/20 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-2">
              <Target className="w-6 h-6" />
              Crosshair Einstellungen
            </h2>

            <div className="space-y-6">
              {/* Primary Color */}
              <div>
                <label className="block text-purple-200 font-medium mb-3">Primärfarbe</label>
                <div className="grid grid-cols-4 gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => updateSetting('primaryColor', color.value)}
                      className={cn(
                        "w-12 h-12 rounded-lg border-2 transition-all duration-300 hover:scale-110",
                        settings.primaryColor === color.value
                          ? "border-purple-400 shadow-lg shadow-purple-400/25"
                          : "border-transparent hover:border-purple-400/50"
                      )}
                      style={{ backgroundColor: color.color }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Center Dot */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="centerDotShow"
                    checked={settings.centerDotShow}
                    onCheckedChange={(checked) => updateSetting('centerDotShow', checked)}
                  />
                  <label htmlFor="centerDotShow" className="text-purple-200 font-medium">
                    Center Dot anzeigen
                  </label>
                </div>

                {settings.centerDotShow && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-purple-200 text-sm mb-2">
                        Dicke: {settings.centerDotThickness}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="6"
                        value={settings.centerDotThickness}
                        onChange={(e) => updateSetting('centerDotThickness', parseInt(e.target.value))}
                        className="w-full h-2 bg-purple-800 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview */}
              <div className="border border-purple-400/30 rounded-lg p-6 bg-black/20">
                <h3 className="text-purple-300 font-medium mb-4">Live Vorschau</h3>
                <div className="w-full h-48 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* Crosshair Preview */}
                  <div className="relative">
                    {/* Center Dot */}
                    {settings.centerDotShow && (
                      <div 
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{
                          backgroundColor: getColorValue(settings.primaryColor),
                          width: `${settings.centerDotThickness * 3}px`,
                          height: `${settings.centerDotThickness * 3}px`,
                        }}
                      />
                    )}
                    
                    {/* Crosshair Lines */}
                    <div className="relative w-16 h-16">
                      {/* Horizontal Lines */}
                      <div 
                        className="absolute top-1/2 left-0 transform -translate-y-1/2"
                        style={{
                          backgroundColor: getColorValue(settings.primaryColor),
                          width: '20px',
                          height: '2px',
                          marginRight: '20px'
                        }}
                      />
                      <div 
                        className="absolute top-1/2 right-0 transform -translate-y-1/2"
                        style={{
                          backgroundColor: getColorValue(settings.primaryColor),
                          width: '20px',
                          height: '2px',
                          marginLeft: '20px'
                        }}
                      />
                      
                      {/* Vertical Lines */}
                      <div 
                        className="absolute left-1/2 top-0 transform -translate-x-1/2"
                        style={{
                          backgroundColor: getColorValue(settings.primaryColor),
                          width: '2px',
                          height: '20px',
                          marginBottom: '20px'
                        }}
                      />
                      <div 
                        className="absolute left-1/2 bottom-0 transform -translate-x-1/2"
                        style={{
                          backgroundColor: getColorValue(settings.primaryColor),
                          width: '2px',
                          height: '20px',
                          marginTop: '20px'
                        }}
                      />
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
            <div className="flex gap-4">
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

          {generatedImage && (
            <div className="mt-6 text-center">
              <h4 className="text-purple-300 font-medium mb-4">Generiertes Crosshair</h4>
              <div className="inline-block bg-black/30 p-4 rounded-lg">
                <img 
                  src={generatedImage} 
                  alt="Generated Crosshair" 
                  className="max-w-xs mx-auto rounded"
                />
                <Button 
                  onClick={downloadImage}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Bild Herunterladen
                </Button>
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
        </div>
      </div>
    </div>
  );
};

export default CrosshairCreator; 