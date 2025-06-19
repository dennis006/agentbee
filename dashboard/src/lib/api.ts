// API Configuration für Development und Production
const isDevelopment = import.meta.env.MODE === 'development';

// API Base URL aus Environment Variables oder Fallback
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
    (isDevelopment ? 'http://localhost:3001' : 'https://agentbee.up.railway.app');

console.log('🔗 API_BASE_URL:', API_BASE_URL);
console.log('🔧 Mode:', import.meta.env.MODE);

// HTTP Client mit Default-Konfiguration
export const apiClient = {
    get: async (endpoint: string) => {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log(`🔗 GET Request: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error(`❌ GET Error: ${response.status} ${response.statusText}`);
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
    },
    
    post: async (endpoint: string, data?: any) => {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log(`🔗 POST Request: ${url}`, data);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: data ? JSON.stringify(data) : undefined
        });
        
        if (!response.ok) {
            console.error(`❌ POST Error: ${response.status} ${response.statusText}`);
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
    },
    
    put: async (endpoint: string, data?: any) => {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log(`🔗 PUT Request: ${url}`, data);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: data ? JSON.stringify(data) : undefined
        });
        
        if (!response.ok) {
            console.error(`❌ PUT Error: ${response.status} ${response.statusText}`);
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
    },
    
    delete: async (endpoint: string) => {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log(`🔗 DELETE Request: ${url}`);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error(`❌ DELETE Error: ${response.status} ${response.statusText}`);
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
    }
};

// Helper für API Calls
export const api = {
    // Bot Status & Info
    getBotStatus: () => apiClient.get('/api/bot/status'),
    getBotInfo: () => apiClient.get('/api/info'),
    
    // Settings
    getSettings: () => apiClient.get('/api/bot/settings'),
    updateSettings: (settings: any) => apiClient.post('/api/bot/settings', settings),
    
    // Rules
    getRules: () => apiClient.get('/api/rules'),
    updateRules: (rules: any) => apiClient.post('/api/rules', rules),
    repostRules: () => apiClient.post('/api/rules/repost'),
    
    // XP System
    getXPSettings: () => apiClient.get('/api/xp-settings'),
    updateXPSettings: (settings: any) => apiClient.post('/api/xp-settings', settings),
    getXPData: () => apiClient.get('/api/xp-data'),
    
    // Welcome System
    getWelcomeSettings: () => apiClient.get('/api/welcome-settings'),
    updateWelcomeSettings: (settings: any) => apiClient.post('/api/welcome-settings', settings),
    
    // Server Stats
    getServerStatsSettings: () => apiClient.get('/api/server-stats-settings'),
    updateServerStatsSettings: (settings: any) => apiClient.post('/api/server-stats-settings', settings),
    
    // Giveaway System
    getGiveawaySettings: () => apiClient.get('/api/giveaway-settings'),
    updateGiveawaySettings: (settings: any) => apiClient.post('/api/giveaway-settings', settings),
    
    // Ticket System
    getTicketSettings: () => apiClient.get('/api/ticket-settings'),
    updateTicketSettings: (settings: any) => apiClient.post('/api/ticket-settings', settings),
    
    // Music System
    getMusicSettings: () => apiClient.get('/api/music-settings'),
    updateMusicSettings: (settings: any) => apiClient.post('/api/music-settings', settings),
    
    // Twitch Notifications
    getTwitchSettings: () => apiClient.get('/api/twitch-settings'),
    updateTwitchSettings: (settings: any) => apiClient.post('/api/twitch-settings', settings),
    
    // Valorant System
    getValorantSettings: () => apiClient.get('/api/valorant-settings'),
    updateValorantSettings: (settings: any) => apiClient.post('/api/valorant-settings', settings),
    
    // Verification System
    getVerificationSettings: () => apiClient.get('/api/verification-settings'),
    updateVerificationSettings: (settings: any) => apiClient.post('/api/verification-settings', settings),
    
    // Moderation
    getModerationLogs: () => apiClient.get('/api/moderation/logs'),
    getModerationStats: () => apiClient.get('/api/moderation/stats'),
    
    // Health Check
    healthCheck: () => apiClient.get('/api/health')
};

// Environment Info
export const ENV_INFO = {
    isDevelopment,
    isProduction: !isDevelopment,
    apiBaseUrl: API_BASE_URL,
    buildTime: new Date().toISOString()
};

// Log Environment Info beim Import
console.log('🔧 API Configuration:', ENV_INFO); 