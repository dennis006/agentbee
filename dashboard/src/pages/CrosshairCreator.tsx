import { useState, useEffect } from 'react';
import { Target, Copy, Download, Settings, Eye, Check, RotateCcw, Star, Sliders, AlertCircle, Share2, MessageSquare, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { useToast, ToastContainer } from '../components/ui/toast';
import { cn } from '../lib/utils';

// Valorant Color System (0-8) - COMPLETE FROM REDDIT
const VALORANT_COLORS = [
  { id: 0, name: 'Weiß', hex: '#FFFFFF' },
  { id: 1, name: 'Grün', hex: '#00FF00' },
  { id: 2, name: 'Gelb-Grün', hex: '#7FFF00' },
  { id: 3, name: 'Grün-Gelb', hex: '#DFFF00' },
  { id: 4, name: 'Gelb', hex: '#FFFF00' },
  { id: 5, name: 'Cyan', hex: '#00FFFF' },
  { id: 6, name: 'Pink', hex: '#FF00FF' },
  { id: 7, name: 'Rot', hex: '#FF0000' },
  { id: 8, name: 'Custom', hex: '#FFFFFF' }
];

// COMPLETE Valorant Crosshair Settings Interface (ALL REDDIT PARAMETERS)
interface ValorantCrosshairSettings {
  // ========== START SECTION ==========
  useAdvancedOptions: boolean;           // s (0,1) => 0
  overrideAllPrimaryCrosshair: boolean; // c (0,1) => 0  
  usePrimaryForAimDownSight: boolean;   // p (0,1) => 1

  // ========== PRIMARY SECTION ==========
  // Color & Style
  color: number;                        // c (0..8) => 0
  userColor: string;                    // u => #FFFFFF
  toggleOutlines: boolean;              // h (0,1) => 1
  outlineOpacity: number;               // o (0..1 with 3 decimals) => 0.5
  outlineThickness: number;             // t (1..6) => 1
  
  // Center Dot
  toggleCenterDot: boolean;             // d (0,1) => 0
  centerDotOpacity: number;             // a (0..1 with 3 decimals) => 1
  centerDotThickness: number;           // z (1..6) => 2
  
  // General Options
  fadeTopLinesWhenSpraying: boolean;    // f (0,1) => 0
  showSpectatorsCrosshair: boolean;     // s (0,1) => 1
  overrideFiringErrorOffsetWithCrosshairOffset: boolean; // m (0,1) => 0
  
  // Inner Lines (0x)
  showInnerLines: boolean;              // 0b (0,1) => 1
  innerLineOpacity: number;             // 0a (0..1 with 3 decimals) => 0.8
  horizontalInnerLineLength: number;    // 0l (0..20) => 6
  verticalInnerLinesLength: number;     // 0v (0..20) => 6
  independantInnerLineLength: boolean;  // 0g (0,1) => 0
  innerLineThickness: number;           // 0t (0..10) => 2
  innerLineOffset: number;              // 0o (0..20) => 3
  innerToggleMovementError: boolean;    // 0m (0,1) => 0
  innerMovementErrorMultiplier: number; // 0s (0..3 with 3 decimals) => 1
  innerFiringError: boolean;            // 0f (1,0) => 1
  innerFiringErrorMultiplier: number;   // 0e (0..3 with 3 decimals) => 1
  
  // Outer Lines (1x)
  showOuterLines: boolean;              // 1b (0,1) => 1
  outerLineOpacity: number;             // 1a (0..1 with 3 decimals) => 0.8
  horizontalOuterLineLength: number;    // 1l (0..20) => 6
  verticalOuterLinesLength: number;     // 1v (0..20) => 6
  independantOuterLineLength: boolean;  // 1g (0,1) => 0
  outerLineThickness: number;           // 1t (0..10) => 2
  outerLineOffset: number;              // 1o (0..20) => 3
  outerToggleMovementError: boolean;    // 1m (0,1) => 0
  outerMovementErrorMultiplier: number; // 1s (0..3 with 3 decimals) => 1
  outerFiringError: boolean;            // 1f (1,0) => 1
  outerFiringErrorMultiplier: number;   // 1e (0..3 with 3 decimals) => 1

  // ========== AIM DOWN SIGHT SECTION ==========
  adsColor: number;
  adsUserColor: string;
  adsToggleOutlines: boolean;
  adsOutlineOpacity: number;
  adsOutlineThickness: number;
  adsToggleCenterDot: boolean;
  adsCenterDotOpacity: number;
  adsCenterDotThickness: number;
  adsFadeTopLinesWhenSpraying: boolean;
  adsShowSpectatorsCrosshair: boolean;
  adsOverrideFiringErrorOffsetWithCrosshairOffset: boolean;
  adsShowInnerLines: boolean;
  adsInnerLineOpacity: number;
  adsHorizontalInnerLineLength: number;
  adsVerticalInnerLinesLength: number;
  adsIndependantInnerLineLength: boolean;
  adsInnerLineThickness: number;
  adsInnerLineOffset: number;
  adsInnerToggleMovementError: boolean;
  adsInnerMovementErrorMultiplier: number;
  adsInnerFiringError: boolean;
  adsInnerFiringErrorMultiplier: number;
  adsShowOuterLines: boolean;
  adsOuterLineOpacity: number;
  adsHorizontalOuterLineLength: number;
  adsVerticalOuterLinesLength: number;
  adsIndependantOuterLineLength: boolean;
  adsOuterLineThickness: number;
  adsOuterLineOffset: number;
  adsOuterToggleMovementError: boolean;
  adsOuterMovementErrorMultiplier: number;
  adsOuterFiringError: boolean;
  adsOuterFiringErrorMultiplier: number;

  // ========== SNIPER SECTION ==========
  sniperColor: number;                  // c (0..8)
  sniperUserColor: string;              // t => #FFFFFF
  sniperToggleCenterDot: boolean;       // d (1,0) => 1
  sniperCenterDotOpacity: number;       // o (0..1 with 3 decimals) => 0.75
  sniperCenterDotThickness: number;     // s (0..4 with 3 decimals) => 1
}

// Default Settings (based on Reddit defaults)
const getDefaultSettings = (): ValorantCrosshairSettings => ({
  // Start Section
  useAdvancedOptions: false,
  overrideAllPrimaryCrosshair: false,
  usePrimaryForAimDownSight: true,

  // Primary Section
  color: 0,
  userColor: '#FFFFFF',
  toggleOutlines: true,
  outlineOpacity: 0.5,
  outlineThickness: 1,
  toggleCenterDot: false,
  centerDotOpacity: 1,
  centerDotThickness: 2,
  fadeTopLinesWhenSpraying: false,
  showSpectatorsCrosshair: true,
  overrideFiringErrorOffsetWithCrosshairOffset: false,
  showInnerLines: true,
  innerLineOpacity: 0.8,
  horizontalInnerLineLength: 6,
  verticalInnerLinesLength: 6,
  independantInnerLineLength: false,
  innerLineThickness: 2,
  innerLineOffset: 3,
  innerToggleMovementError: false,
  innerMovementErrorMultiplier: 1,
  innerFiringError: true,
  innerFiringErrorMultiplier: 1,
  showOuterLines: true,
  outerLineOpacity: 0.8,
  horizontalOuterLineLength: 6,
  verticalOuterLinesLength: 6,
  independantOuterLineLength: false,
  outerLineThickness: 2,
  outerLineOffset: 3,
  outerToggleMovementError: false,
  outerMovementErrorMultiplier: 1,
  outerFiringError: true,
  outerFiringErrorMultiplier: 1,

  // ADS Section (same defaults as primary)
  adsColor: 0,
  adsUserColor: '#FFFFFF',
  adsToggleOutlines: true,
  adsOutlineOpacity: 0.5,
  adsOutlineThickness: 1,
  adsToggleCenterDot: false,
  adsCenterDotOpacity: 1,
  adsCenterDotThickness: 2,
  adsFadeTopLinesWhenSpraying: false,
  adsShowSpectatorsCrosshair: true,
  adsOverrideFiringErrorOffsetWithCrosshairOffset: false,
  adsShowInnerLines: true,
  adsInnerLineOpacity: 0.8,
  adsHorizontalInnerLineLength: 6,
  adsVerticalInnerLinesLength: 6,
  adsIndependantInnerLineLength: false,
  adsInnerLineThickness: 2,
  adsInnerLineOffset: 3,
  adsInnerToggleMovementError: false,
  adsInnerMovementErrorMultiplier: 1,
  adsInnerFiringError: true,
  adsInnerFiringErrorMultiplier: 1,
  adsShowOuterLines: true,
  adsOuterLineOpacity: 0.8,
  adsHorizontalOuterLineLength: 6,
  adsVerticalOuterLinesLength: 6,
  adsIndependantOuterLineLength: false,
  adsOuterLineThickness: 2,
  adsOuterLineOffset: 3,
  adsOuterToggleMovementError: false,
  adsOuterMovementErrorMultiplier: 1,
  adsOuterFiringError: true,
  adsOuterFiringErrorMultiplier: 1,

  // Sniper Section
  sniperColor: 0,
  sniperUserColor: '#FFFFFF',
  sniperToggleCenterDot: true,
  sniperCenterDotOpacity: 0.75,
  sniperCenterDotThickness: 1
});

// COMPLETE VALORANT CROSSHAIR CODE GENERATOR (ALL REDDIT PARAMETERS)
const generateValorantCrosshairCode = (settings: ValorantCrosshairSettings): string => {
  const formatDecimal = (value: number, decimals: number) => {
    return parseFloat(value.toFixed(decimals));
  };

  const boolToInt = (value: boolean) => value ? 1 : 0;

  let code = '0;';

  // ========== START SECTION ==========
  code += `s;${boolToInt(settings.useAdvancedOptions)};`;
  code += `c;${boolToInt(settings.overrideAllPrimaryCrosshair)};`;
  code += `p;${boolToInt(settings.usePrimaryForAimDownSight)};`;

  // ========== PRIMARY SECTION ==========
  code += 'P;';
  code += `c;${settings.color};`;
  
  // Add userColor if custom color is selected
  if (settings.color === 8) {
    code += `u;${settings.userColor};`;
    code += 'b;1;'; // Required for custom colors according to Reddit notes
  }
  
  code += `h;${boolToInt(settings.toggleOutlines)};`;
  code += `o;${formatDecimal(settings.outlineOpacity, 3)};`;
  code += `t;${settings.outlineThickness};`;
  code += `d;${boolToInt(settings.toggleCenterDot)};`;
  code += `a;${formatDecimal(settings.centerDotOpacity, 3)};`;
  code += `z;${settings.centerDotThickness};`;
  code += `f;${boolToInt(settings.fadeTopLinesWhenSpraying)};`;
  code += `s;${boolToInt(settings.showSpectatorsCrosshair)};`;
  code += `m;${boolToInt(settings.overrideFiringErrorOffsetWithCrosshairOffset)};`;
  
  // Inner Lines (0x)
  code += `0b;${boolToInt(settings.showInnerLines)};`;
  code += `0a;${formatDecimal(settings.innerLineOpacity, 3)};`;
  code += `0l;${settings.horizontalInnerLineLength};`;
  code += `0v;${settings.verticalInnerLinesLength};`;
  code += `0g;${boolToInt(settings.independantInnerLineLength)};`;
  code += `0t;${settings.innerLineThickness};`;
  code += `0o;${settings.innerLineOffset};`;
  code += `0m;${boolToInt(settings.innerToggleMovementError)};`;
  code += `0s;${formatDecimal(settings.innerMovementErrorMultiplier, 3)};`;
  code += `0f;${boolToInt(settings.innerFiringError)};`;
  code += `0e;${formatDecimal(settings.innerFiringErrorMultiplier, 3)};`;
  
  // Outer Lines (1x)
  code += `1b;${boolToInt(settings.showOuterLines)};`;
  code += `1a;${formatDecimal(settings.outerLineOpacity, 3)};`;
  code += `1l;${settings.horizontalOuterLineLength};`;
  code += `1v;${settings.verticalOuterLinesLength};`;
  code += `1g;${boolToInt(settings.independantOuterLineLength)};`;
  code += `1t;${settings.outerLineThickness};`;
  code += `1o;${settings.outerLineOffset};`;
  code += `1m;${boolToInt(settings.outerToggleMovementError)};`;
  code += `1s;${formatDecimal(settings.outerMovementErrorMultiplier, 3)};`;
  code += `1f;${boolToInt(settings.outerFiringError)};`;
  code += `1e;${formatDecimal(settings.outerFiringErrorMultiplier, 3)};`;

  // ========== AIM DOWN SIGHT SECTION ==========
  code += 'A;';
  code += `c;${settings.adsColor};`;
  
  if (settings.adsColor === 8) {
    code += `u;${settings.adsUserColor};`;
    code += 'b;1;';
  }
  
  code += `h;${boolToInt(settings.adsToggleOutlines)};`;
  code += `o;${formatDecimal(settings.adsOutlineOpacity, 3)};`;
  code += `t;${settings.adsOutlineThickness};`;
  code += `d;${boolToInt(settings.adsToggleCenterDot)};`;
  code += `a;${formatDecimal(settings.adsCenterDotOpacity, 3)};`;
  code += `z;${settings.adsCenterDotThickness};`;
  code += `f;${boolToInt(settings.adsFadeTopLinesWhenSpraying)};`;
  code += `s;${boolToInt(settings.adsShowSpectatorsCrosshair)};`;
  code += `m;${boolToInt(settings.adsOverrideFiringErrorOffsetWithCrosshairOffset)};`;
  
  // ADS Inner Lines
  code += `0b;${boolToInt(settings.adsShowInnerLines)};`;
  code += `0a;${formatDecimal(settings.adsInnerLineOpacity, 3)};`;
  code += `0l;${settings.adsHorizontalInnerLineLength};`;
  code += `0v;${settings.adsVerticalInnerLinesLength};`;
  code += `0g;${boolToInt(settings.adsIndependantInnerLineLength)};`;
  code += `0t;${settings.adsInnerLineThickness};`;
  code += `0o;${settings.adsInnerLineOffset};`;
  code += `0m;${boolToInt(settings.adsInnerToggleMovementError)};`;
  code += `0s;${formatDecimal(settings.adsInnerMovementErrorMultiplier, 3)};`;
  code += `0f;${boolToInt(settings.adsInnerFiringError)};`;
  code += `0e;${formatDecimal(settings.adsInnerFiringErrorMultiplier, 3)};`;
  
  // ADS Outer Lines
  code += `1b;${boolToInt(settings.adsShowOuterLines)};`;
  code += `1a;${formatDecimal(settings.adsOuterLineOpacity, 3)};`;
  code += `1l;${settings.adsHorizontalOuterLineLength};`;
  code += `1v;${settings.adsVerticalOuterLinesLength};`;
  code += `1g;${boolToInt(settings.adsIndependantOuterLineLength)};`;
  code += `1t;${settings.adsOuterLineThickness};`;
  code += `1o;${settings.adsOuterLineOffset};`;
  code += `1m;${boolToInt(settings.adsOuterToggleMovementError)};`;
  code += `1s;${formatDecimal(settings.adsOuterMovementErrorMultiplier, 3)};`;
  code += `1f;${boolToInt(settings.adsOuterFiringError)};`;
  code += `1e;${formatDecimal(settings.adsOuterFiringErrorMultiplier, 3)};`;

  // ========== SNIPER SECTION ==========
  code += 'S;';
  code += `c;${settings.sniperColor};`;
  
  if (settings.sniperColor === 8) {
    code += `t;${settings.sniperUserColor};`;
  }
  
  code += `d;${boolToInt(settings.sniperToggleCenterDot)};`;
  code += `o;${formatDecimal(settings.sniperCenterDotOpacity, 3)};`;
  code += `s;${formatDecimal(settings.sniperCenterDotThickness, 3)};`;

  return code;
};

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

const CrosshairCreator = () => {
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [crosshairCode, setCrosshairCode] = useState('');
  const [activeSection, setActiveSection] = useState<'primary' | 'ads' | 'sniper'>('primary');
  
  // Toast System
  const { toasts, success, error, removeToast } = useToast();
  const { showNotification, NotificationComponent } = useNotification();

  // Complete Crosshair Settings
  const [settings, setSettings] = useState<ValorantCrosshairSettings>(getDefaultSettings());

  // Update Setting
  const updateSetting = (key: keyof ValorantCrosshairSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Generate Code
  useEffect(() => {
    const code = generateValorantCrosshairCode(settings);
    setCrosshairCode(code);
  }, [settings]);

  // Copy Code
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(crosshairCode);
      showNotification('✅ Crosshair Code kopiert!', 'success');
      success('Crosshair Code kopiert!');
    } catch (err) {
      showNotification('❌ Fehler beim Kopieren', 'error');
      error('Fehler beim Kopieren');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500">
            🎯 Valorant Crosshair Creator
          </h1>
          <p className="text-gray-300 text-lg">
            🔥 ALLE Parameter aus Reddit Reverse-Engineering - Nichts vergessen!
          </p>
          <div className="mt-4 text-sm text-gray-400">
            ✨ Basiert auf dem kompletten Valorant Crosshair Code System
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Controls */}
          <div className="space-y-6">
            {/* Section Tabs */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              {(['primary', 'ads', 'sniper'] as const).map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-md transition-all font-medium",
                    activeSection === section
                      ? "bg-red-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  )}
                >
                  {section === 'primary' && '🎯 Primary'}
                  {section === 'ads' && '🔍 ADS'}
                  {section === 'sniper' && '🎯 Sniper'}
                </button>
              ))}
            </div>

            {/* Start Section - Advanced Options */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-400" />
                🔧 Erweiterte Optionen
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Advanced Options</label>
                  <Checkbox
                    checked={settings.useAdvancedOptions}
                    onCheckedChange={(checked) => updateSetting('useAdvancedOptions', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Override All Primary</label>
                  <Checkbox
                    checked={settings.overrideAllPrimaryCrosshair}
                    onCheckedChange={(checked) => updateSetting('overrideAllPrimaryCrosshair', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Use Primary for ADS</label>
                  <Checkbox
                    checked={settings.usePrimaryForAimDownSight}
                    onCheckedChange={(checked) => updateSetting('usePrimaryForAimDownSight', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Primary Section */}
            {activeSection === 'primary' && (
              <div className="space-y-6">
                {/* Color Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    🎨 Farbe & Style
                  </h3>
                  
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {VALORANT_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => updateSetting('color', color.id)}
                        className={cn(
                          "p-3 rounded-lg border-2 transition-all text-sm",
                          settings.color === color.id
                            ? "border-red-500 bg-gray-700"
                            : "border-gray-600 bg-gray-700 hover:border-gray-500"
                        )}
                        style={{ backgroundColor: color.id === 8 ? settings.userColor : color.hex }}
                      >
                        {color.name}
                      </button>
                    ))}
                  </div>

                  {settings.color === 8 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2">Custom Color</label>
                      <input
                        type="color"
                        value={settings.userColor}
                        onChange={(e) => updateSetting('userColor', e.target.value)}
                        className="w-full h-10 rounded border border-gray-600"
                      />
                    </div>
                  )}
                </div>

                {/* Center Dot */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    🔘 Center Dot
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show Center Dot</label>
                      <Checkbox
                        checked={settings.toggleCenterDot}
                        onCheckedChange={(checked) => updateSetting('toggleCenterDot', checked)}
                      />
                    </div>
                    
                    {settings.toggleCenterDot && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Opacity: {settings.centerDotOpacity}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.001"
                            value={settings.centerDotOpacity}
                            onChange={(e) => updateSetting('centerDotOpacity', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Thickness: {settings.centerDotThickness}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="6"
                            step="1"
                            value={settings.centerDotThickness}
                            onChange={(e) => updateSetting('centerDotThickness', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Outlines */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    🖼️ Outlines
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show Outlines</label>
                      <Checkbox
                        checked={settings.toggleOutlines}
                        onCheckedChange={(checked) => updateSetting('toggleOutlines', checked)}
                      />
                    </div>
                    
                    {settings.toggleOutlines && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Opacity: {settings.outlineOpacity}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.001"
                            value={settings.outlineOpacity}
                            onChange={(e) => updateSetting('outlineOpacity', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Thickness: {settings.outlineThickness}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="6"
                            step="1"
                            value={settings.outlineThickness}
                            onChange={(e) => updateSetting('outlineThickness', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* General Options */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    ⚙️ General Options
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Fade Top Lines When Spraying</label>
                      <Checkbox
                        checked={settings.fadeTopLinesWhenSpraying}
                        onCheckedChange={(checked) => updateSetting('fadeTopLinesWhenSpraying', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show Spectators Crosshair</label>
                      <Checkbox
                        checked={settings.showSpectatorsCrosshair}
                        onCheckedChange={(checked) => updateSetting('showSpectatorsCrosshair', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Override Firing Error Offset</label>
                      <Checkbox
                        checked={settings.overrideFiringErrorOffsetWithCrosshairOffset}
                        onCheckedChange={(checked) => updateSetting('overrideFiringErrorOffsetWithCrosshairOffset', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Inner Lines */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    📏 Inner Lines (0x)
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show Inner Lines</label>
                      <Checkbox
                        checked={settings.showInnerLines}
                        onCheckedChange={(checked) => updateSetting('showInnerLines', checked)}
                      />
                    </div>
                    
                    {settings.showInnerLines && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Opacity: {settings.innerLineOpacity}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.001"
                            value={settings.innerLineOpacity}
                            onChange={(e) => updateSetting('innerLineOpacity', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Horizontal Length: {settings.horizontalInnerLineLength}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={settings.horizontalInnerLineLength}
                            onChange={(e) => updateSetting('horizontalInnerLineLength', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Vertical Length: {settings.verticalInnerLinesLength}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={settings.verticalInnerLinesLength}
                            onChange={(e) => updateSetting('verticalInnerLinesLength', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Independent Line Length</label>
                          <Checkbox
                            checked={settings.independantInnerLineLength}
                            onCheckedChange={(checked) => updateSetting('independantInnerLineLength', checked)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Thickness: {settings.innerLineThickness}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="1"
                            value={settings.innerLineThickness}
                            onChange={(e) => updateSetting('innerLineThickness', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Offset: {settings.innerLineOffset}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={settings.innerLineOffset}
                            onChange={(e) => updateSetting('innerLineOffset', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Movement Error</label>
                          <Checkbox
                            checked={settings.innerToggleMovementError}
                            onCheckedChange={(checked) => updateSetting('innerToggleMovementError', checked)}
                          />
                        </div>
                        
                        {settings.innerToggleMovementError && (
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Movement Error Multiplier: {settings.innerMovementErrorMultiplier}
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="3"
                              step="0.001"
                              value={settings.innerMovementErrorMultiplier}
                              onChange={(e) => updateSetting('innerMovementErrorMultiplier', parseFloat(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Firing Error</label>
                          <Checkbox
                            checked={settings.innerFiringError}
                            onCheckedChange={(checked) => updateSetting('innerFiringError', checked)}
                          />
                        </div>
                        
                        {settings.innerFiringError && (
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Firing Error Multiplier: {settings.innerFiringErrorMultiplier}
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="3"
                              step="0.001"
                              value={settings.innerFiringErrorMultiplier}
                              onChange={(e) => updateSetting('innerFiringErrorMultiplier', parseFloat(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Outer Lines */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    📐 Outer Lines (1x)
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show Outer Lines</label>
                      <Checkbox
                        checked={settings.showOuterLines}
                        onCheckedChange={(checked) => updateSetting('showOuterLines', checked)}
                      />
                    </div>
                    
                    {settings.showOuterLines && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Opacity: {settings.outerLineOpacity}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.001"
                            value={settings.outerLineOpacity}
                            onChange={(e) => updateSetting('outerLineOpacity', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Horizontal Length: {settings.horizontalOuterLineLength}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={settings.horizontalOuterLineLength}
                            onChange={(e) => updateSetting('horizontalOuterLineLength', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Vertical Length: {settings.verticalOuterLinesLength}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={settings.verticalOuterLinesLength}
                            onChange={(e) => updateSetting('verticalOuterLinesLength', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Independent Line Length</label>
                          <Checkbox
                            checked={settings.independantOuterLineLength}
                            onCheckedChange={(checked) => updateSetting('independantOuterLineLength', checked)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Thickness: {settings.outerLineThickness}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="1"
                            value={settings.outerLineThickness}
                            onChange={(e) => updateSetting('outerLineThickness', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Offset: {settings.outerLineOffset}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={settings.outerLineOffset}
                            onChange={(e) => updateSetting('outerLineOffset', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Movement Error</label>
                          <Checkbox
                            checked={settings.outerToggleMovementError}
                            onCheckedChange={(checked) => updateSetting('outerToggleMovementError', checked)}
                          />
                        </div>
                        
                        {settings.outerToggleMovementError && (
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Movement Error Multiplier: {settings.outerMovementErrorMultiplier}
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="3"
                              step="0.001"
                              value={settings.outerMovementErrorMultiplier}
                              onChange={(e) => updateSetting('outerMovementErrorMultiplier', parseFloat(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Firing Error</label>
                          <Checkbox
                            checked={settings.outerFiringError}
                            onCheckedChange={(checked) => updateSetting('outerFiringError', checked)}
                          />
                        </div>
                        
                        {settings.outerFiringError && (
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Firing Error Multiplier: {settings.outerFiringErrorMultiplier}
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="3"
                              step="0.001"
                              value={settings.outerFiringErrorMultiplier}
                              onChange={(e) => updateSetting('outerFiringErrorMultiplier', parseFloat(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Code Output */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Copy className="h-5 w-5 text-green-400" />
                Generated Code
              </h3>
              
              <div className="bg-gray-900 rounded p-4 mb-4">
                <pre className="text-sm text-green-400 break-all whitespace-pre-wrap">
                  {crosshairCode}
                </pre>
              </div>
              
              <Button onClick={copyCode} className="w-full bg-red-600 hover:bg-red-700">
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-400" />
                Live Preview
              </h3>
              
              <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
                {/* Crosshair Preview */}
                <div className="relative">
                  {/* Center Dot */}
                  {settings.toggleCenterDot && (
                    <div
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        width: `${settings.centerDotThickness * 2}px`,
                        height: `${settings.centerDotThickness * 2}px`,
                        backgroundColor: settings.color === 8 ? settings.userColor : VALORANT_COLORS[settings.color].hex,
                        opacity: settings.centerDotOpacity
                      }}
                    />
                  )}
                  
                  {/* Inner Lines */}
                  {settings.showInnerLines && (
                    <>
                      {/* Horizontal Lines */}
                      <div
                        className="absolute top-1/2 transform -translate-y-1/2"
                        style={{
                          width: `${settings.horizontalInnerLineLength * 4}px`,
                          height: `${settings.innerLineThickness}px`,
                          backgroundColor: settings.color === 8 ? settings.userColor : VALORANT_COLORS[settings.color].hex,
                          opacity: settings.innerLineOpacity,
                          left: `${-settings.horizontalInnerLineLength * 2 - settings.innerLineOffset}px`
                        }}
                      />
                      <div
                        className="absolute top-1/2 transform -translate-y-1/2"
                        style={{
                          width: `${settings.horizontalInnerLineLength * 4}px`,
                          height: `${settings.innerLineThickness}px`,
                          backgroundColor: settings.color === 8 ? settings.userColor : VALORANT_COLORS[settings.color].hex,
                          opacity: settings.innerLineOpacity,
                          right: `${-settings.horizontalInnerLineLength * 2 - settings.innerLineOffset}px`
                        }}
                      />
                      
                      {/* Vertical Lines */}
                      <div
                        className="absolute left-1/2 transform -translate-x-1/2"
                        style={{
                          height: `${settings.verticalInnerLinesLength * 4}px`,
                          width: `${settings.innerLineThickness}px`,
                          backgroundColor: settings.color === 8 ? settings.userColor : VALORANT_COLORS[settings.color].hex,
                          opacity: settings.innerLineOpacity,
                          top: `${-settings.verticalInnerLinesLength * 2 - settings.innerLineOffset}px`
                        }}
                      />
                      <div
                        className="absolute left-1/2 transform -translate-x-1/2"
                        style={{
                          height: `${settings.verticalInnerLinesLength * 4}px`,
                          width: `${settings.innerLineThickness}px`,
                          backgroundColor: settings.color === 8 ? settings.userColor : VALORANT_COLORS[settings.color].hex,
                          opacity: settings.innerLineOpacity,
                          bottom: `${-settings.verticalInnerLinesLength * 2 - settings.innerLineOffset}px`
                        }}
                      />
                    </>
                  )}
                  
                  {/* Outer Lines */}
                  {settings.showOuterLines && (
                    <>
                      {/* Horizontal Lines */}
                      <div
                        className="absolute top-1/2 transform -translate-y-1/2"
                        style={{
                          width: `${settings.horizontalOuterLineLength * 4}px`,
                          height: `${settings.outerLineThickness}px`,
                          backgroundColor: settings.color === 8 ? settings.userColor : VALORANT_COLORS[settings.color].hex,
                          opacity: settings.outerLineOpacity,
                          left: `${-settings.horizontalOuterLineLength * 2 - settings.outerLineOffset - (settings.showInnerLines ? settings.horizontalInnerLineLength * 4 + settings.innerLineOffset : 0)}px`
                        }}
                      />
                      <div
                        className="absolute top-1/2 transform -translate-y-1/2"
                        style={{
                          width: `${settings.horizontalOuterLineLength * 4}px`,
                          height: `${settings.outerLineThickness}px`,
                          backgroundColor: settings.color === 8 ? settings.userColor : VALORANT_COLORS[settings.color].hex,
                          opacity: settings.outerLineOpacity,
                          right: `${-settings.horizontalOuterLineLength * 2 - settings.outerLineOffset - (settings.showInnerLines ? settings.horizontalInnerLineLength * 4 + settings.innerLineOffset : 0)}px`
                        }}
                      />
                      
                      {/* Vertical Lines */}
                      <div
                        className="absolute left-1/2 transform -translate-x-1/2"
                        style={{
                          height: `${settings.verticalOuterLinesLength * 4}px`,
                          width: `${settings.outerLineThickness}px`,
                          backgroundColor: settings.color === 8 ? settings.userColor : VALORANT_COLORS[settings.color].hex,
                          opacity: settings.outerLineOpacity,
                          top: `${-settings.verticalOuterLinesLength * 2 - settings.outerLineOffset - (settings.showInnerLines ? settings.verticalInnerLinesLength * 4 + settings.innerLineOffset : 0)}px`
                        }}
                      />
                      <div
                        className="absolute left-1/2 transform -translate-x-1/2"
                        style={{
                          height: `${settings.verticalOuterLinesLength * 4}px`,
                          width: `${settings.outerLineThickness}px`,
                          backgroundColor: settings.color === 8 ? settings.userColor : VALORANT_COLORS[settings.color].hex,
                          opacity: settings.outerLineOpacity,
                          bottom: `${-settings.verticalOuterLinesLength * 2 - settings.outerLineOffset - (settings.showInnerLines ? settings.verticalInnerLinesLength * 4 + settings.innerLineOffset : 0)}px`
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Crosshair Stats
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Active Section:</span>
                  <span className="text-red-400 font-medium">{activeSection.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Color:</span>
                  <span className="font-medium">{VALORANT_COLORS[settings.color].name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Center Dot:</span>
                  <span className="font-medium">{settings.toggleCenterDot ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Inner Lines:</span>
                  <span className="font-medium">{settings.showInnerLines ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outer Lines:</span>
                  <span className="font-medium">{settings.showOuterLines ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outlines:</span>
                  <span className="font-medium">{settings.toggleOutlines ? '✅' : '❌'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-3 rounded-md shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            } text-white`}
          >
            {toast.type === 'success' ? 
              <Check className="h-5 w-5" /> : 
              <AlertCircle className="h-5 w-5" />
            }
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Notification Component */}
      <NotificationComponent />
    </div>
  );
};

export default CrosshairCreator; 