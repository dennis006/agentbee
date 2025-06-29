// Crosshair Proxy API für Netlify → Railway → Henrik API
const express = require('express');
const cors = require('cors');

function setupCrosshairProxyAPI(app) {
    console.log('🎯 Setting up Crosshair Proxy API...');

    // CORS für Netlify
    const corsOptions = {
        origin: [
            'http://localhost:5173',
            'http://localhost:3000', 
            'https://agentbee.netlify.app',
            'https://beellgrounds.netlify.app',
            process.env.FRONTEND_URL
        ].filter(Boolean),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
    };

    // Crosshair Proxy Routes
    app.use('/api/crosshair', cors(corsOptions));

    // Generate Crosshair Image via Henrik API
    app.get('/api/crosshair/generate', async (req, res) => {
        try {
            const { code } = req.query;
            
            if (!code) {
                return res.status(400).json({
                    error: 'Crosshair code is required',
                    message: 'Bitte gib einen gültigen Crosshair-Code an'
                });
            }

            console.log('🎯 Generating crosshair for code:', code);

            // Henrik API Key aus Environment Variables
            const henrikApiKey = process.env.HENRIK_API_KEY || process.env.VALORANT_API_TOKEN;
            
            if (!henrikApiKey) {
                console.error('❌ Henrik API Key fehlt! Bitte HENRIK_API_KEY oder VALORANT_API_TOKEN setzen.');
                return res.status(500).json({
                    error: 'API Configuration Error',
                    message: 'Henrik API Key nicht konfiguriert. Bitte kontaktiere den Administrator.'
                });
            }

            // Henrik API Request mit API Key
            const apiUrl = `https://api.henrikdev.xyz/valorant/v1/crosshair/generate?id=${encodeURIComponent(code)}&api_key=${encodeURIComponent(henrikApiKey)}`;
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'AgentBee-Bot/1.0',
                    'Authorization': henrikApiKey
                }
            });

            if (!response.ok) {
                console.error('❌ Henrik API Error:', response.status, response.statusText);
                
                let errorMessage = 'Fehler beim Generieren des Crosshairs';
                
                if (response.status === 401) {
                    errorMessage = 'Henrik API Key ungültig oder abgelaufen. Bitte kontaktiere den Administrator.';
                } else if (response.status === 429) {
                    errorMessage = 'Henrik API Rate Limit erreicht. Bitte versuche es später erneut.';
                } else if (response.status === 400) {
                    errorMessage = 'Ungültiger Crosshair-Code. Bitte überprüfe den Code.';
                }
                
                return res.status(response.status).json({
                    error: 'Henrik API Error',
                    status: response.status,
                    message: errorMessage
                });
            }

            // Return image as blob
            const blob = await response.arrayBuffer();
            
            res.set({
                'Content-Type': 'image/png',
                'Content-Length': blob.byteLength,
                'Cache-Control': 'public, max-age=3600' // 1 hour cache
            });

            res.send(Buffer.from(blob));
            
            console.log('✅ Crosshair generated successfully');

        } catch (error) {
            console.error('❌ Crosshair Proxy Error:', error);
            
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Fehler beim Generieren des Crosshairs',
                details: error.message
            });
        }
    });

    // Validate Crosshair Code
    app.post('/api/crosshair/validate', cors(corsOptions), async (req, res) => {
        try {
            const { code } = req.body;
            
            if (!code) {
                return res.status(400).json({
                    valid: false,
                    error: 'Code ist erforderlich'
                });
            }

            // Basic validation
            const isValid = code.includes(';') && code.includes('P') && code.includes('c');
            
            res.json({
                valid: isValid,
                code: code,
                message: isValid ? 'Code ist gültig' : 'Code-Format ungültig'
            });

        } catch (error) {
            console.error('❌ Validation Error:', error);
            res.status(500).json({
                valid: false,
                error: 'Validation failed'
            });
        }
    });

    // Test endpoint
    app.get('/api/crosshair/test', cors(corsOptions), (req, res) => {
        res.json({
            status: 'online',
            message: 'Crosshair Proxy API is working',
            timestamp: new Date().toISOString()
        });
    });

    console.log('✅ Crosshair Proxy API routes registered');
}

module.exports = { setupCrosshairProxyAPI }; 