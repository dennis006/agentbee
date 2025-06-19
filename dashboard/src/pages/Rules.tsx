import { useState, useEffect } from 'react'
import { FileText, Settings, Plus, Trash2, Code, Eye, Smile, Hash } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Textarea } from '../components/ui/textarea'
import { Input } from '../components/ui/input'
import { useToast, ToastContainer } from '../components/ui/toast'
import EmojiPicker from '../components/ui/emoji-picker'
// Matrix Blocks Komponente direkt hier

// Matrix Blocks Komponente
const MatrixBlocks = ({ density = 30 }: { density?: number }) => {
  const blocks = Array.from({ length: density }, (_, i) => (
    <div
      key={i}
      className="matrix-block"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${2 + Math.random() * 3}s`
      }}
    />
  ));
  return <div className="matrix-blocks">{blocks}</div>;
};

interface Rules {
  title: string;
  description: string;
  color: string;
  channelName: string;
  rules: Array<{
    emoji: string;
    name: string;
    value: string;
  }>;
  footer: string;
  reaction: {
    emoji: string;
    message: string;
    acceptedRole: string;
    acceptedMessage: string;
  };
}

const Rules = () => {
  const { toasts, showSuccess, showError, removeToast } = useToast()
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<string | null>(null)
  const [currentRuleIndex, setCurrentRuleIndex] = useState<number | null>(null)
  
  // API Base URL
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  const [rules, setRules] = useState<Rules>({
    title: "📜 SERVERREGELN",
    description: "Willkommen auf **{serverName}**! Bitte lies und befolge diese Regeln:",
    color: "0xFF6B6B",
    channelName: "rules",
    rules: [
      { emoji: "1️⃣", name: "Respekt", value: "Sei respektvoll und freundlich zu allen Mitgliedern" },
      { emoji: "2️⃣", name: "Kein Spam", value: "Kein Spam, keine Werbung oder Eigenwerbung" },
      { emoji: "3️⃣", name: "Angemessene Inhalte", value: "Keine beleidigenden, diskriminierenden oder NSFW Inhalte" },
      { emoji: "4️⃣", name: "Richtige Kanäle", value: "Nutze die entsprechenden Kanäle für verschiedene Themen" },
      { emoji: "5️⃣", name: "Discord Guidelines", value: "Halte dich an die Discord Community Guidelines" },
      { emoji: "6️⃣", name: "Moderatoren", value: "Respektiere Mods und Admins - bei Problemen wende dich an sie" },
      { emoji: "7️⃣", name: "Sprache", value: "Deutsche Sprache bevorzugt im Chat" },
      { emoji: "8️⃣", name: "Konsequenzen", value: "Verstöße können zu Verwarnungen oder Bans führen" }
    ],
    footer: "Viel Spaß auf dem Server! 🎉",
    reaction: {
      emoji: "✅",
      message: "Reagiere mit ✅ um die Regeln zu akzeptieren!",
      acceptedRole: "verified",
      acceptedMessage: "Willkommen! Du hast die Regeln akzeptiert und erhältst Zugang zum Server."
    }
  });

  const [rulesJson, setRulesJson] = useState('');
  const [editMode, setEditMode] = useState<'visual' | 'json'>('visual');

  const saveRules = async () => {
    try {
      let updatedRules;
      if (editMode === 'json') {
        updatedRules = JSON.parse(rulesJson);
      } else {
        updatedRules = rules;
      }

      const response = await fetch(`${apiUrl}/api/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRules),
      });

      if (response.ok) {
        setRules(updatedRules);
        setRulesJson(JSON.stringify(updatedRules, null, 2));
        
        // Trigger automatisches Neu-Posten im Bot
        const repostResponse = await fetch(`${apiUrl}/api/rules/repost`, {
          method: 'POST'
        });
        
        if (repostResponse.ok) {
          const result = await repostResponse.json();
          showSuccess('Regeln gespeichert!', `Automatisch in ${result.repostedCount} Server(n) neu gepostet!`);
        } else {
          showSuccess('✅ Regeln gespeichert!', 'Neu-Posten fehlgeschlagen - Bot eventuell offline');
        }
      } else {
        showError('Speichern fehlgeschlagen', 'Fehler beim Speichern der Regeln');
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Fehler beim Speichern:', error);
      }
      showError('Speichern fehlgeschlagen', 'Ungültiges JSON oder Netzwerkfehler');
    }
  };

  // Funktionen für visuelles Bearbeiten
  const updateRule = (index: number, field: string, value: string) => {
    const newRules = { ...rules };
    if (field === 'emoji' || field === 'name' || field === 'value') {
      newRules.rules[index][field] = value;
    }
    setRules(newRules);
  };

  const addRule = () => {
    const newRules = { ...rules };
    newRules.rules.push({
      emoji: "🔥",
      name: "Neue Regel",
      value: "Beschreibung hier eingeben..."
    });
    setRules(newRules);
  };

  const removeRule = (index: number) => {
    const newRules = { ...rules };
    newRules.rules.splice(index, 1);
    setRules(newRules);
  };

  const loadRules = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/rules`);
      if (response.ok) {
        const data = await response.json();
        setRules(data);
        setRulesJson(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      // Silent error handling in production
      if (import.meta.env.DEV) {
        console.error('Fehler beim Laden der Regeln:', error);
      }
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    setRulesJson(JSON.stringify(rules, null, 2));
  }, [rules]);

  return (
    <div className="space-y-8 p-6 animate-fade-in relative">
      {/* Matrix Background Effects */}
      <MatrixBlocks density={20} />
      
      {/* Page Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <FileText className="w-12 h-12 text-purple-accent animate-pulse" />
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-neon">
            Server Rules Management
          </h1>
        </div>
        <div className="text-dark-text text-lg max-w-2xl mx-auto">
          Editiere und verwalte deine Serverregeln wie ein Boss! 
          <span className="ml-2 inline-block relative">
            <svg 
              className="w-6 h-6 animate-pulse hover:animate-bounce text-purple-400 hover:text-purple-300 transition-all duration-300 hover:scale-110 drop-shadow-lg" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <div className="absolute inset-0 animate-ping">
              <svg 
                className="w-6 h-6 text-purple-500 opacity-30" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </span>
        </div>
        <div className="w-32 h-1 bg-gradient-neon mx-auto mt-4 rounded-full animate-glow"></div>
      </div>

      {/* Rules Header Settings */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-accent" />
            Rules Header Configuration
          </CardTitle>
          <CardDescription className="text-dark-muted">
            Konfiguriere den Header deiner Serverregeln
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Channel Name</label>
              <div className="relative">
                <Input
                  value={rules.channelName}
                  onChange={(e) => setRules({...rules, channelName: e.target.value})}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple pl-10"
                  placeholder="rules"
                />
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted w-4 h-4" />
              </div>
              <p className="text-xs text-dark-muted mt-1">
                Channel in dem die Regeln gepostet werden
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Titel</label>
              <div className="relative">
                <Input
                  value={rules.title}
                  onChange={(e) => setRules({...rules, title: e.target.value})}
                  className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple pr-10"
                  placeholder="📜 SERVERREGELN"
                />
                <button
                  onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'title' ? null : 'title')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-neon-purple transition-colors duration-200 hover:scale-110"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-dark-text mb-2 block">Embed Farbe</label>
              <div className="flex gap-3 items-center">
                {/* Color Picker */}
                <div className="relative">
                  <input
                    type="color"
                    value={rules.color.startsWith('0x') ? `#${rules.color.slice(2)}` : rules.color.startsWith('#') ? rules.color : '#FF6B6B'}
                    onChange={(e) => {
                      const hexColor = e.target.value;
                      const discordColor = `0x${hexColor.slice(1).toUpperCase()}`;
                      setRules({...rules, color: discordColor});
                    }}
                    className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 bg-dark-bg cursor-pointer hover:border-neon-purple transition-all duration-300 hover:scale-105"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-neon rounded-full animate-ping opacity-60"></div>
                </div>
                
                {/* Hex Input */}
                <div className="flex-1">
                  <Input
                    value={rules.color}
                    onChange={(e) => setRules({...rules, color: e.target.value})}
                    className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple font-mono"
                    placeholder="0xFF6B6B"
                  />
                </div>

                {/* Color Preview */}
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-purple-primary/30 flex items-center justify-center text-white font-bold text-xs shadow-neon"
                  style={{
                    backgroundColor: rules.color.startsWith('0x') ? `#${rules.color.slice(2)}` : rules.color.startsWith('#') ? rules.color : '#FF6B6B',
                    filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                  }}
                >
                  🎨
                </div>
              </div>
              
              {/* Preset Colors */}
              <div className="mt-3">
                <p className="text-xs text-dark-muted mb-2">Beliebte Discord Farben:</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { name: 'Blau', color: '0x3498DB' },
                    { name: 'Grün', color: '0x2ECC71' },
                    { name: 'Rot', color: '0xE74C3C' },
                    { name: 'Lila', color: '0x9B59B6' },
                    { name: 'Orange', color: '0xE67E22' },
                    { name: 'Pink', color: '0xE91E63' },
                    { name: 'Cyan', color: '0x1ABC9C' },
                    { name: 'Gelb', color: '0xF1C40F' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setRules({...rules, color: preset.color})}
                      className="w-8 h-8 rounded-lg border border-purple-primary/30 hover:border-neon-purple transition-all duration-300 hover:scale-110 relative group"
                      style={{
                        backgroundColor: `#${preset.color.slice(2)}`,
                        filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.2))'
                      }}
                      title={preset.name}
                    >
                      <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-dark-text">Beschreibung</label>
              <button
                onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'description' ? null : 'description')}
                className="text-dark-muted hover:text-neon-purple transition-colors duration-200 hover:scale-110 p-2"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
            <Textarea
              value={rules.description}
              onChange={(e) => setRules({...rules, description: e.target.value})}
              className="bg-dark-bg/70 border-purple-primary/30 text-dark-text focus:border-neon-purple"
              placeholder="Willkommen auf **{serverName}**! Bitte lies und befolge diese Regeln:"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit Mode Toggle */}
      <div className="flex gap-4 justify-center">
        <Button 
          onClick={() => setEditMode(editMode === 'visual' ? 'json' : 'visual')}
          className={`${editMode === 'visual' ? 'bg-gradient-to-r from-purple-primary to-purple-secondary' : 'bg-gradient-to-r from-gray-600 to-gray-700'} hover:from-purple-secondary hover:to-purple-accent text-white font-bold py-3 px-6 rounded-xl shadow-neon transition-all duration-300 hover:scale-105`}
        >
          {editMode === 'visual' ? <Code className="w-5 h-5 mr-2" /> : <Eye className="w-5 h-5 mr-2" />}
          {editMode === 'visual' ? 'JSON Editor' : 'Visual Editor'}
        </Button>
      </div>

      {/* Rules Editor */}
      <Card className="bg-dark-surface/90 backdrop-blur-xl border-purple-primary/30 shadow-purple-glow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-dark-text">
            {editMode === 'visual' ? '📋 Visual Rules Editor' : '💻 JSON Editor'}
          </CardTitle>
          <CardDescription className="text-dark-muted">
            {editMode === 'visual' ? 'Bearbeite deine Regeln visuell mit Formularen' : 'Bearbeite deine Regeln direkt als JSON'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editMode === 'visual' ? (
            /* Visual Rules Editor */
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-neon-purple">📋 Server Rules</h3>
                <Button 
                  onClick={addRule}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-neon transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Regel hinzufügen
                </Button>
              </div>

              <div className="space-y-4">
                {rules.rules.map((rule, index) => (
                  <div key={index} className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      <div className="md:col-span-1">
                        <label className="text-xs text-dark-muted mb-1 block">Emoji</label>
                        <div className="relative">
                          <Input
                            value={rule.emoji}
                            onChange={(e) => updateRule(index, 'emoji', e.target.value)}
                            className="bg-dark-bg border-purple-primary/30 text-dark-text text-center text-lg h-12 pr-10"
                            placeholder="🔥"
                          />
                          <button
                            onClick={() => {
                              setEmojiPickerOpen('ruleEmoji');
                              setCurrentRuleIndex(index);
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-neon-purple transition-colors duration-200 hover:scale-110"
                          >
                            <Smile className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-xs text-dark-muted mb-1 block">Regel Name</label>
                        <Input
                          value={rule.name}
                          onChange={(e) => updateRule(index, 'name', e.target.value)}
                          className="bg-dark-bg border-purple-primary/30 text-dark-text"
                          placeholder="Regel Name"
                        />
                      </div>
                      <div className="md:col-span-7">
                        <label className="text-xs text-dark-muted mb-1 block">Beschreibung</label>
                        <Textarea
                          value={rule.value}
                          onChange={(e) => updateRule(index, 'value', e.target.value)}
                          className="bg-dark-bg border-purple-primary/30 text-dark-text resize-none"
                          placeholder="Regel Beschreibung..."
                          rows={2}
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-end">
                        <Button 
                          onClick={() => removeRule(index)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all duration-300 hover:scale-105 mt-5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer & Reaction Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-dark-text">Footer Text</label>
                    <button
                      onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'footer' ? null : 'footer')}
                      className="text-dark-muted hover:text-neon-purple transition-colors duration-200 hover:scale-110 p-2"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                  <Input
                    value={rules.footer}
                    onChange={(e) => setRules({...rules, footer: e.target.value})}
                    className="bg-dark-bg border-purple-primary/30 text-dark-text"
                    placeholder="Viel Spaß auf dem Server! 🎉"
                  />
                </div>

                <div className="bg-dark-bg/50 rounded-lg p-4 border border-purple-primary/20">
                  <h4 className="text-sm font-medium text-dark-text mb-3">Reaktions-Einstellungen</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-dark-muted mb-1 block">Emoji</label>
                      <div className="relative">
                        <Input
                          value={rules.reaction.emoji}
                          onChange={(e) => setRules({...rules, reaction: {...rules.reaction, emoji: e.target.value}})}
                          className="bg-dark-bg border-purple-primary/30 text-dark-text text-center text-lg pr-10"
                          placeholder="✅"
                        />
                        <button
                          onClick={() => setEmojiPickerOpen(emojiPickerOpen === 'reactionEmoji' ? null : 'reactionEmoji')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-neon-purple transition-colors duration-200 hover:scale-110"
                        >
                          <Smile className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-dark-muted mb-1 block">Rolle</label>
                      <Input
                        value={rules.reaction.acceptedRole}
                        onChange={(e) => setRules({...rules, reaction: {...rules.reaction, acceptedRole: e.target.value}})}
                        className="bg-dark-bg border-purple-primary/30 text-dark-text"
                        placeholder="verified"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* JSON Editor */
            <div className="space-y-4">
              <Textarea
                value={rulesJson}
                onChange={(e) => setRulesJson(e.target.value)}
                className="min-h-[600px] bg-dark-bg/70 border-purple-primary/30 text-dark-text font-mono text-sm focus:border-neon-purple focus:ring-neon-purple transition-all duration-300"
                placeholder="Rules JSON hier bearbeiten..."
              />
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-center mt-8">
            <Button 
              onClick={saveRules}
              className="bg-gradient-to-r from-neon-purple to-purple-accent hover:from-purple-accent hover:to-neon-purple text-white font-bold py-4 px-8 rounded-xl shadow-neon-strong transition-all duration-300 hover:scale-105 text-lg"
            >
              💾 Regeln speichern & automatisch neu posten
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emoji Picker Overlays */}
      {emojiPickerOpen === 'title' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setRules(prev => ({...prev, title: prev.title + emoji}));
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'description' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setRules(prev => ({...prev, description: prev.description + emoji}));
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'footer' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setRules(prev => ({...prev, footer: prev.footer + emoji}));
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'ruleEmoji' && currentRuleIndex !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                updateRule(currentRuleIndex, 'emoji', emoji);
                setEmojiPickerOpen(null);
                setCurrentRuleIndex(null);
              }}
              onClose={() => {
                setEmojiPickerOpen(null);
                setCurrentRuleIndex(null);
              }}
            />
          </div>
        </div>
      )}

      {emojiPickerOpen === 'reactionEmoji' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEmojiPickerOpen(null)}>
          <div className="bg-dark-surface border border-purple-primary/30 rounded-xl shadow-purple-glow" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setRules(prev => ({...prev, reaction: {...prev.reaction, emoji}}));
                setEmojiPickerOpen(null);
              }}
              onClose={() => setEmojiPickerOpen(null)}
            />
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

export default Rules 