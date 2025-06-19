import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Key, Save, AlertCircle, CheckCircle, ExternalLink, Shield, Zap, Bot, Gamepad2 } from 'lucide-react';
import { useToast, ToastContainer } from '../components/ui/toast';

interface APIKeyStatus {
    discord: {
        bot_token: boolean;
        client_id: boolean;
        client_secret: boolean;
        configured: boolean;
    };
    openai: boolean;
    twitch: {
        clientId: boolean;
        clientSecret: boolean;
        configured: boolean;
    };
    valorant: boolean;
    youtube: {
        apiKey: boolean;
        configured: boolean;
    };
}

interface APIKeys {
    discord: {
        bot_token: string;
        client_id: string;
        client_secret: string;
    };
    openai: string;
    twitch: {
        clientId: string;
        clientSecret: string;
    };
    valorant: string;
    youtube: {
        apiKey: string;
    };
}

const APIKeys: React.FC = () => {
    const [keyStatus, setKeyStatus] = useState<APIKeyStatus>({
        discord: { bot_token: false, client_id: false, client_secret: false, configured: false },
        openai: false,
        twitch: { clientId: false, clientSecret: false, configured: false },
        valorant: false,
        youtube: { apiKey: false, configured: false }
    });
    
    const [keys, setKeys] = useState<APIKeys>({
        discord: { bot_token: '', client_id: '', client_secret: '' },
        openai: '',
        twitch: { clientId: '', clientSecret: '' },
        valorant: '',
        youtube: { apiKey: '' }
    });
    
    const [showKeys, setShowKeys] = useState({
        discordBotToken: false,
        discordClientId: false,
        discordClientSecret: false,
        openai: false,
        twitchClientId: false,
        twitchClientSecret: false,
        valorant: false,
        youtubeApiKey: false
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toastManager = useToast();

    useEffect(() => {
        loadKeyStatus();
    }, []);

    const loadKeyStatus = async () => {
        try {
            const response = await fetch('/api/keys/status');
            if (response.ok) {
                const data = await response.json();
                setKeyStatus(data.status);
            }
        } catch (error) {
            console.error('Fehler beim Laden des API-Key-Status:', error);
            toastManager.error('Fehler beim Laden des API-Key-Status');
        } finally {
            setLoading(false);
        }
    };

    const saveKeys = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(keys)
            });

            if (response.ok) {
                const data = await response.json();
                setKeyStatus(data.status);
                toastManager.success('API-Keys erfolgreich gespeichert!');
                
                // Keys nach dem Speichern zurücksetzen
                setKeys({
                    discord: { bot_token: '', client_id: '', client_secret: '' },
                    openai: '',
                    twitch: { clientId: '', clientSecret: '' },
                    valorant: '',
                    youtube: { apiKey: '' }
                });
            } else {
                throw new Error('Fehler beim Speichern');
            }
        } catch (error) {
            console.error('Fehler beim Speichern der API-Keys:', error);
            toastManager.error('Fehler beim Speichern der API-Keys');
        } finally {
            setSaving(false);
        }
    };

    const toggleShowKey = (keyName: string) => {
        setShowKeys(prev => ({
            ...prev,
            [keyName]: !prev[keyName as keyof typeof prev]
        }));
    };

    const handleKeyChange = (path: string, value: string) => {
        if (path.includes('.')) {
            const [parent, child] = path.split('.');
            setKeys(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent as keyof typeof prev] as any,
                    [child]: value
                }
            }));
        } else {
            setKeys(prev => ({
                ...prev,
                [path]: value
            }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-primary"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-3">
                        <div className="p-3 bg-purple-primary/20 rounded-xl">
                            <Key className="w-8 h-8 text-purple-primary" />
                        </div>
                        <h1 className="text-4xl font-bold text-white">API-Keys Verwaltung</h1>
                    </div>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                        Verwalte alle API-Keys zentral an einem Ort. Keine .env-Dateien mehr nötig!
                    </p>
                </div>

                {/* Warning */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-yellow-400 font-semibold">Sicherheitshinweis</h3>
                            <p className="text-yellow-300 text-sm mt-1">
                                API-Keys werden sicher gespeichert und niemals im Frontend angezeigt. 
                                Gib deine Keys niemals an Dritte weiter!
                            </p>
                        </div>
                    </div>
                </div>

                {/* API Keys Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Discord Configuration */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 lg:col-span-2">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Bot className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Discord Konfiguration</h3>
                                <p className="text-gray-400 text-sm">Bot Token + OAuth Credentials für Verifizierung</p>
                            </div>
                            <div className="ml-auto">
                                {keyStatus.discord.configured ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Bot Token */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Bot Token</label>
                                <div className="relative">
                                    <input
                                        type={showKeys.discordBotToken ? 'text' : 'password'}
                                        value={keys.discord.bot_token}
                                        onChange={(e) => handleKeyChange('discord.bot_token', e.target.value)}
                                        placeholder={keyStatus.discord.bot_token ? 'Token konfiguriert' : 'Bot Token...'}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 pr-10"
                                    />
                                    <button
                                        onClick={() => toggleShowKey('discordBotToken')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showKeys.discordBotToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Client ID */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Client ID</label>
                                <div className="relative">
                                    <input
                                        type={showKeys.discordClientId ? 'text' : 'password'}
                                        value={keys.discord.client_id}
                                        onChange={(e) => handleKeyChange('discord.client_id', e.target.value)}
                                        placeholder={keyStatus.discord.client_id ? 'Client ID konfiguriert' : 'Client ID...'}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 pr-10"
                                    />
                                    <button
                                        onClick={() => toggleShowKey('discordClientId')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showKeys.discordClientId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Client Secret */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Client Secret</label>
                                <div className="relative">
                                    <input
                                        type={showKeys.discordClientSecret ? 'text' : 'password'}
                                        value={keys.discord.client_secret}
                                        onChange={(e) => handleKeyChange('discord.client_secret', e.target.value)}
                                        placeholder={keyStatus.discord.client_secret ? 'Client Secret konfiguriert' : 'Client Secret...'}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 pr-10"
                                    />
                                    <button
                                        onClick={() => toggleShowKey('discordClientSecret')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showKeys.discordClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <div className="flex items-start space-x-3">
                                <ExternalLink className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-blue-400 font-semibold text-sm">Setup-Anleitung</h4>
                                    <p className="text-blue-300 text-sm mt-1">
                                        1. Gehe zum <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200">Discord Developer Portal</a><br/>
                                        2. Bot Token: Bot → Token → Copy<br/>
                                        3. OAuth: General Information → Client ID & Client Secret<br/>
                                        4. Redirect URI: <code className="bg-gray-700 px-1 rounded">http://localhost:5173/verify</code>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* OpenAI API Key */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <Zap className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">OpenAI API Key</h3>
                                <p className="text-gray-400 text-sm">Für AI-Nachrichten-Generator</p>
                            </div>
                            <div className="ml-auto">
                                {keyStatus.openai ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type={showKeys.openai ? 'text' : 'password'}
                                    value={keys.openai}
                                    onChange={(e) => handleKeyChange('openai', e.target.value)}
                                    placeholder={keyStatus.openai ? 'API-Key ist konfiguriert' : 'OpenAI API Key eingeben...'}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 pr-10"
                                />
                                <button
                                    onClick={() => toggleShowKey('openai')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                                <ExternalLink className="w-4 h-4 text-purple-400" />
                                <a 
                                    href="https://platform.openai.com/api-keys" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:text-purple-300"
                                >
                                    OpenAI API Keys
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Twitch API */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Twitch API</h3>
                                <p className="text-gray-400 text-sm">Für Live-Stream-Benachrichtigungen</p>
                            </div>
                            <div className="ml-auto">
                                {keyStatus.twitch.configured ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type={showKeys.twitchClientId ? 'text' : 'password'}
                                    value={keys.twitch.clientId}
                                    onChange={(e) => handleKeyChange('twitch.clientId', e.target.value)}
                                    placeholder={keyStatus.twitch.clientId ? 'Client ID ist konfiguriert' : 'Twitch Client ID eingeben...'}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 pr-10"
                                />
                                <button
                                    onClick={() => toggleShowKey('twitchClientId')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showKeys.twitchClientId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            
                            <div className="relative">
                                <input
                                    type={showKeys.twitchClientSecret ? 'text' : 'password'}
                                    value={keys.twitch.clientSecret}
                                    onChange={(e) => handleKeyChange('twitch.clientSecret', e.target.value)}
                                    placeholder={keyStatus.twitch.clientSecret ? 'Client Secret ist konfiguriert' : 'Twitch Client Secret eingeben...'}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 pr-10"
                                />
                                <button
                                    onClick={() => toggleShowKey('twitchClientSecret')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showKeys.twitchClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-sm">
                                <ExternalLink className="w-4 h-4 text-purple-400" />
                                <a 
                                    href="https://dev.twitch.tv/console" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:text-purple-300"
                                >
                                    Twitch Developer Console
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Valorant API */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <Gamepad2 className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Valorant API</h3>
                                <p className="text-gray-400 text-sm">Für Spieler-Statistiken</p>
                            </div>
                            <div className="ml-auto">
                                {keyStatus.valorant ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type={showKeys.valorant ? 'text' : 'password'}
                                    value={keys.valorant}
                                    onChange={(e) => handleKeyChange('valorant', e.target.value)}
                                    placeholder={keyStatus.valorant ? 'API-Token ist konfiguriert' : 'Valorant API Token eingeben...'}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 pr-10"
                                />
                                <button
                                    onClick={() => toggleShowKey('valorant')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showKeys.valorant ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                                <ExternalLink className="w-4 h-4 text-purple-400" />
                                <span className="text-purple-400">
                                    Discord: HenrikDev Server → #get-a-key
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* YouTube API */}
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-red-600/20 rounded-lg">
                                <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">YouTube API</h3>
                                <p className="text-gray-400 text-sm">Für Musik-Bot und Suche</p>
                            </div>
                            <div className="ml-auto">
                                {keyStatus.youtube.configured ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type={showKeys.youtubeApiKey ? 'text' : 'password'}
                                    value={keys.youtube.apiKey}
                                    onChange={(e) => handleKeyChange('youtube.apiKey', e.target.value)}
                                    placeholder={keyStatus.youtube.apiKey ? 'API-Key ist konfiguriert' : 'YouTube Data API v3 Key eingeben...'}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 pr-10"
                                />
                                <button
                                    onClick={() => toggleShowKey('youtubeApiKey')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showKeys.youtubeApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                                <ExternalLink className="w-4 h-4 text-purple-400" />
                                <a 
                                    href="https://console.developers.google.com/apis/credentials" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:text-purple-300"
                                >
                                    Google Cloud Console
                                </a>
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                                💡 Tipp: YouTube Data API v3 aktivieren und API-Key erstellen
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-center">
                    <button
                        onClick={saveKeys}
                        disabled={saving}
                        className="bg-gradient-to-r from-purple-primary to-purple-secondary text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-purple-primary/25 hover:shadow-purple-primary/40 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Speichere...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>API-Keys speichern</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Status Overview */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">System Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${keyStatus.discord.configured ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <p className="text-sm text-gray-300">Discord Bot</p>
                        </div>
                        <div className="text-center">
                            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${keyStatus.openai ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <p className="text-sm text-gray-300">OpenAI</p>
                        </div>
                        <div className="text-center">
                            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${keyStatus.twitch.configured ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <p className="text-sm text-gray-300">Twitch</p>
                        </div>
                        <div className="text-center">
                            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${keyStatus.valorant ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <p className="text-sm text-gray-300">Valorant</p>
                        </div>
                        <div className="text-center">
                            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${keyStatus.youtube.configured ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <p className="text-sm text-gray-300">YouTube</p>
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer 
                toasts={toastManager.toasts} 
                removeToast={toastManager.removeToast} 
            />
        </div>
    );
};

export default APIKeys; 