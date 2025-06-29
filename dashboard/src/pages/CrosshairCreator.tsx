import { useState, useEffect } from 'react';
import { Target, Copy, Download, Settings, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { useToast, ToastContainer } from '../components/ui/toast';
import { cn } from '../lib/utils';

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
  
  // Toast System
  const { toasts, success, error, removeToast } = useToast();

  // Crosshair Settings State
  const [settings, setSettings] = useState<CrosshairSettings>({
    primaryColor: 'white',
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
    'white': 1, 'green': 2, 'yellow': 3, 'cyan': 4,
    'red': 5, 'purple': 6, 'blue': 7, 'pink': 8
  };

  const colorOptions = [
    { name: 'white', value: 'white', color: '#ffffff', label: 'Weiß' },
    { name: 'green', value: 'green', color: '#00ff00', label: 'Grün' },
    { name: 'yellow', value: 'yellow', color: '#ffff00', label: 'Gelb' },
    { name: 'cyan', value: 'cyan', color: '#00ffff', label: 'Cyan' },
    { name: 'red', value: 'red', color: '#ff0000', label: 'Rot' },
    { name: 'purple', value: 'purple', color: '#ff00ff', label: 'Lila' },
    { name: 'blue', value: 'blue', color: '#0000ff', label: 'Blau' },
    { name: 'pink', value: 'pink', color: '#ff69b4', label: 'Rosa' }
  ];

  // Update Setting
  const updateSetting = (key: keyof CrosshairSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Generate Crosshair Code - Vereinfachte Version
  const generateCrosshairCode = () => {
    const colorCode = colorMap[settings.primaryColor] || 1;
    
    // Vereinfachter Valorant Crosshair Code
    const code = `0;p;0;s;1;P;c;${colorCode};o;${settings.centerDotOpacity};d;${settings.centerDotShow ? 1 : 0};z;1;0t;${settings.outerLinesThickness};0l;${settings.outerLinesLength};0o;${settings.outerLinesOffset};0a;${settings.outerLinesOpacity};0f;0;1t;${settings.innerLinesThickness};1l;${settings.innerLinesLength};1o;${settings.innerLinesOffset};1a;${settings.innerLinesOpacity};1m;0;1f;0`;
    
    setCrosshairCode(code);
    return code;
  };

  // Copy Code
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(crosshairCode);
      success("Der Crosshair-Code wurde kopiert.");
    } catch (err) {
      error("Code konnte nicht kopiert werden.");
    }
  };

  // Generate Image via Railway Proxy
  const generateImage = async () => {
    setLoading(true);
    try {
      const code = generateCrosshairCode();
      
      // Use Railway Backend as Proxy (CORS-Safe)
      const apiUrl = import.meta.env.VITE_API_URL || 'https://agentbee.up.railway.app';
      const response = await fetch(`${apiUrl}/api/crosshair/generate?code=${encodeURIComponent(code)}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setGeneratedImage(imageUrl);
        success("Dein Crosshair-Bild wurde erfolgreich erstellt.");
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unbekannter Fehler' }));
        throw new Error(errorData.message || `API Fehler: ${response.status}`);
      }
    } catch (err) {
      console.error('Fehler beim Generieren:', err);
      error(`Das Crosshair-Bild konnte nicht erstellt werden: ${err.message}`);
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
    success("Dein Crosshair wird heruntergeladen.");
  };

  // Get Color Value
  const getColorValue = (colorName: string) => {
    const colors: Record<string, string> = {
      'white': '#ffffff', 'green': '#00ff00', 'yellow': '#ffff00', 'cyan': '#00ffff',
      'red': '#ff0000', 'purple': '#ff00ff', 'blue': '#0000ff', 'pink': '#ff69b4'
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
            Erstelle dein perfektes Crosshair mit Live-Vorschau
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-purple-500/20 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6" />
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
                    Mittelpunkt anzeigen
                  </label>
                </div>

                {settings.centerDotShow && (
                  <>
                    <div>
                      <label className="block text-purple-200 font-medium mb-2">
                        Mittelpunkt Dicke: {settings.centerDotThickness}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={settings.centerDotThickness}
                        onChange={(e) => updateSetting('centerDotThickness', parseInt(e.target.value))}
                        className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-purple-200 font-medium mb-2">
                        Mittelpunkt Transparenz: {settings.centerDotOpacity}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={settings.centerDotOpacity}
                        onChange={(e) => updateSetting('centerDotOpacity', parseInt(e.target.value))}
                        className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Outer Lines */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="outerLinesShow"
                    checked={settings.outerLinesShow}
                    onCheckedChange={(checked) => updateSetting('outerLinesShow', checked)}
                  />
                  <label htmlFor="outerLinesShow" className="text-purple-200 font-medium">
                    Äußere Linien anzeigen
                  </label>
                </div>

                {settings.outerLinesShow && (
                  <>
                    <div>
                      <label className="block text-purple-200 font-medium mb-2">
                        Länge: {settings.outerLinesLength}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={settings.outerLinesLength}
                        onChange={(e) => updateSetting('outerLinesLength', parseInt(e.target.value))}
                        className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-purple-200 font-medium mb-2">
                        Dicke: {settings.outerLinesThickness}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={settings.outerLinesThickness}
                        onChange={(e) => updateSetting('outerLinesThickness', parseInt(e.target.value))}
                        className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-purple-200 font-medium mb-2">
                        Abstand: {settings.outerLinesOffset}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        value={settings.outerLinesOffset}
                        onChange={(e) => updateSetting('outerLinesOffset', parseInt(e.target.value))}
                        className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-purple-200 font-medium mb-2">
                        Transparenz: {settings.outerLinesOpacity}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={settings.outerLinesOpacity}
                        onChange={(e) => updateSetting('outerLinesOpacity', parseInt(e.target.value))}
                        className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Inner Lines */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="innerLinesShow"
                    checked={settings.innerLinesShow}
                    onCheckedChange={(checked) => updateSetting('innerLinesShow', checked)}
                  />
                  <label htmlFor="innerLinesShow" className="text-purple-200 font-medium">
                    Innere Linien anzeigen
                  </label>
                </div>

                {settings.innerLinesShow && (
                  <>
                    <div>
                      <label className="block text-purple-200 font-medium mb-2">
                        Länge: {settings.innerLinesLength}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="15"
                        value={settings.innerLinesLength}
                        onChange={(e) => updateSetting('innerLinesLength', parseInt(e.target.value))}
                        className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-purple-200 font-medium mb-2">
                        Dicke: {settings.innerLinesThickness}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={settings.innerLinesThickness}
                        onChange={(e) => updateSetting('innerLinesThickness', parseInt(e.target.value))}
                        className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-purple-200 font-medium mb-2">
                        Abstand: {settings.innerLinesOffset}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={settings.innerLinesOffset}
                        onChange={(e) => updateSetting('innerLinesOffset', parseInt(e.target.value))}
                        className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-purple-200 font-medium mb-2">
                        Transparenz: {settings.innerLinesOpacity}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={settings.innerLinesOpacity}
                        onChange={(e) => updateSetting('innerLinesOpacity', parseInt(e.target.value))}
                        className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-purple-500/20 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-2">
              <Eye className="w-6 h-6" />
              Live Vorschau
            </h2>

            <div className="text-center">
              {/* Crosshair Preview */}
              <div className="relative w-80 h-80 bg-gray-800 rounded-xl border border-purple-500/30 overflow-hidden mx-auto mb-6">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  
                  {/* Center Dot */}
                  {settings.centerDotShow && (
                    <div
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        width: settings.centerDotThickness + 'px',
                        height: settings.centerDotThickness + 'px',
                        backgroundColor: getColorValue(settings.primaryColor),
                        opacity: settings.centerDotOpacity / 255
                      }}
                    />
                  )}
                  
                  {/* Outer Lines */}
                  {settings.outerLinesShow && (
                    <>
                      {/* Top Line */}
                      <div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2"
                        style={{
                          width: settings.outerLinesThickness + 'px',
                          height: settings.outerLinesLength + 'px',
                          backgroundColor: getColorValue(settings.primaryColor),
                          opacity: settings.outerLinesOpacity / 255,
                          top: `calc(50% - ${settings.outerLinesLength + settings.outerLinesOffset}px)`
                        }}
                      />
                      
                      {/* Bottom Line */}
                      <div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2"
                        style={{
                          width: settings.outerLinesThickness + 'px',
                          height: settings.outerLinesLength + 'px',
                          backgroundColor: getColorValue(settings.primaryColor),
                          opacity: settings.outerLinesOpacity / 255,
                          top: `calc(50% + ${settings.outerLinesOffset}px)`
                        }}
                      />
                      
                      {/* Left Line */}
                      <div
                        className="absolute top-1/2 left-1/2 transform -translate-y-1/2"
                        style={{
                          width: settings.outerLinesLength + 'px',
                          height: settings.outerLinesThickness + 'px',
                          backgroundColor: getColorValue(settings.primaryColor),
                          opacity: settings.outerLinesOpacity / 255,
                          left: `calc(50% - ${settings.outerLinesLength + settings.outerLinesOffset}px)`
                        }}
                      />
                      
                      {/* Right Line */}
                      <div
                        className="absolute top-1/2 left-1/2 transform -translate-y-1/2"
                        style={{
                          width: settings.outerLinesLength + 'px',
                          height: settings.outerLinesThickness + 'px',
                          backgroundColor: getColorValue(settings.primaryColor),
                          opacity: settings.outerLinesOpacity / 255,
                          left: `calc(50% + ${settings.outerLinesOffset}px)`
                        }}
                      />
                    </>
                  )}
                  
                  {/* Inner Lines */}
                  {settings.innerLinesShow && (
                    <>
                      {/* Top Inner Line */}
                      <div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2"
                        style={{
                          width: settings.innerLinesThickness + 'px',
                          height: settings.innerLinesLength + 'px',
                          backgroundColor: getColorValue(settings.primaryColor),
                          opacity: settings.innerLinesOpacity / 255,
                          top: `calc(50% - ${settings.innerLinesLength + settings.innerLinesOffset}px)`
                        }}
                      />
                      
                      {/* Bottom Inner Line */}
                      <div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2"
                        style={{
                          width: settings.innerLinesThickness + 'px',
                          height: settings.innerLinesLength + 'px',
                          backgroundColor: getColorValue(settings.primaryColor),
                          opacity: settings.innerLinesOpacity / 255,
                          top: `calc(50% + ${settings.innerLinesOffset}px)`
                        }}
                      />
                      
                      {/* Left Inner Line */}
                      <div
                        className="absolute top-1/2 left-1/2 transform -translate-y-1/2"
                        style={{
                          width: settings.innerLinesLength + 'px',
                          height: settings.innerLinesThickness + 'px',
                          backgroundColor: getColorValue(settings.primaryColor),
                          opacity: settings.innerLinesOpacity / 255,
                          left: `calc(50% - ${settings.innerLinesLength + settings.innerLinesOffset}px)`
                        }}
                      />
                      
                      {/* Right Inner Line */}
                      <div
                        className="absolute top-1/2 left-1/2 transform -translate-y-1/2"
                        style={{
                          width: settings.innerLinesLength + 'px',
                          height: settings.innerLinesThickness + 'px',
                          backgroundColor: getColorValue(settings.primaryColor),
                          opacity: settings.innerLinesOpacity / 255,
                          left: `calc(50% + ${settings.innerLinesOffset}px)`
                        }}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={generateImage}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02]"
                >
                  {loading ? (
                    <>🔄 Generiere...</>
                  ) : (
                    <>🎯 Bild Generieren</>
                  )}
                </Button>

                <Button
                  onClick={copyCode}
                  variant="outline"
                  className="w-full border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 hover:text-white transition-all duration-300"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Code Kopieren
                </Button>
              </div>

              {/* Generated Image */}
              {generatedImage && (
                <div className="mt-6 p-4 bg-black/30 rounded-xl border border-purple-500/30">
                  <h3 className="text-lg font-bold text-purple-400 mb-3">📸 Generiertes Crosshair</h3>
                  <img
                    src={generatedImage}
                    alt="Generated Crosshair"
                    className="max-w-full rounded-lg border border-purple-500/30 mx-auto"
                  />
                  <Button
                    onClick={downloadImage}
                    className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}

              {/* Code Display */}
              <div className="mt-6 p-4 bg-black/50 rounded-xl border border-purple-500/30 text-left">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-purple-400">📋 Crosshair Code</h3>
                  <Button
                    onClick={copyCode}
                    size="sm"
                    variant="ghost"
                    className="text-purple-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <code className="text-sm text-purple-200 font-mono break-all">
                  {crosshairCode}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrosshairCreator; 