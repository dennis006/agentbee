// API Configuration für Development und Production
const isDevelopment = import.meta.env.MODE === 'development';

// API Base URL aus Environment Variables oder Fallback
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
    (isDevelopment ? 'http://localhost:3001' : 'https://your-railway-domain.railway.app');

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
            throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
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
            throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
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
            throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
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
            throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
        }
        
        return response.json();
    }
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