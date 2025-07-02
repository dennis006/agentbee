#!/usr/bin/env node

/**
 * 🧪 NETLIFY → RAILWAY CONNECTION TEST
 * 
 * Testet die API-Verbindung zwischen Netlify Dashboard und Railway Backend
 */

const https = require('https');

const TESTS = [
    {
        name: '🏃 Railway API Health Check',
        url: 'https://agentbee.up.railway.app/api/health',
        method: 'GET'
    },
    {
        name: '⚙️ Valorant Settings Laden',
        url: 'https://agentbee.up.railway.app/api/valorant-settings',
        method: 'GET'
    },
    {
        name: '📊 Bot Status',
        url: 'https://agentbee.up.railway.app/api/bot/status',
        method: 'GET'
    },
    {
        name: '🎯 Netlify Dashboard',
        url: 'https://agentbee-dashboard.netlify.app',
        method: 'GET'
    }
];

function makeRequest(url, method = 'GET') {
    return new Promise((resolve, reject) => {
        const request = https.request(url, { method }, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                resolve({
                    status: response.statusCode,
                    headers: response.headers,
                    data: data
                });
            });
        });
        
        request.on('error', (error) => {
            reject(error);
        });
        
        request.setTimeout(10000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
        
        request.end();
    });
}

async function runTests() {
    console.log('🚀 NETLIFY → RAILWAY CONNECTION TEST\n');
    console.log('=' .repeat(60));
    
    let passed = 0;
    let failed = 0;
    
    for (const test of TESTS) {
        try {
            console.log(`\n${test.name}`);
            console.log(`🔗 ${test.url}`);
            
            const startTime = Date.now();
            const response = await makeRequest(test.url, test.method);
            const endTime = Date.now();
            
            const isSuccess = response.status >= 200 && response.status < 400;
            
            if (isSuccess) {
                console.log(`✅ SUCCESS (${response.status}) - ${endTime - startTime}ms`);
                
                // Spezielle Ausgaben für bestimmte Endpoints
                if (test.url.includes('/api/valorant-settings')) {
                    try {
                        const jsonData = JSON.parse(response.data);
                        console.log(`   📊 System Enabled: ${jsonData.enabled || 'undefined'}`);
                    } catch (e) {
                        console.log(`   📄 Response: ${response.data.substring(0, 100)}...`);
                    }
                }
                
                passed++;
            } else {
                console.log(`❌ FAILED (${response.status}) - ${endTime - startTime}ms`);
                console.log(`   📄 Response: ${response.data.substring(0, 200)}...`);
                failed++;
            }
            
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
            failed++;
        }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log(`📊 TEST SUMMARY:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🎯 Total: ${passed + failed}`);
    
    if (failed === 0) {
        console.log('\n🎉 ALLE TESTS ERFOLGREICH!');
        console.log('🚀 Netlify → Railway Integration funktioniert perfekt!');
    } else {
        console.log('\n⚠️ Einige Tests fehlgeschlagen.');
        console.log('💡 Prüfe Netlify Deployment und Railway Status.');
    }
    
    console.log('\n🔧 NÄCHSTE SCHRITTE:');
    console.log('1. 🌐 Gehe zu: https://agentbee-dashboard.netlify.app/valorant');
    console.log('2. 🔘 Teste den Toggle Button');
    console.log('3. 📊 Prüfe ob keine 404-Fehler mehr auftreten');
}

// Script ausführen
runTests().catch(console.error); 