// Force-Restart des Self-Monitoring Systems
// Direkte API-Calls um das System zu reparieren

const express = require('express');

async function forceSelfMonitoringRestart() {
    console.log('🔧 FORCE RESTART SELF-MONITORING');
    console.log('=================================\n');
    
    try {
        // 1. Bot Status prüfen
        console.log('1️⃣ Bot Status prüfen...');
        const statusResponse = await fetch('http://localhost:3001/api/twitch-bot/stats');
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('   Bot Connected:', statusData.stats.isConnected);
            console.log('   Self-Monitoring Enabled:', statusData.stats.selfMonitoring?.enabled);
            console.log('   Self-Monitoring Running:', statusData.stats.selfMonitoring?.isRunning);
            console.log('   Has Credentials:', statusData.stats.selfMonitoring?.hasCredentials);
            console.log('   Has Token:', statusData.stats.selfMonitoring?.hasToken);
            console.log('   Monitored Channels:', statusData.stats.selfMonitoring?.monitoredChannels);
        } else {
            console.log('   ❌ Bot API nicht erreichbar');
        }
        console.log('');
        
        // 2. Self-Monitoring Settings aktivieren
        console.log('2️⃣ Self-Monitoring aktivieren...');
        const settingsResponse = await fetch('http://localhost:3001/api/twitch-bot/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                selfMonitoringEnabled: true,
                botEnabled: true,
                liveNotificationsEnabled: true
            })
        });
        
        if (settingsResponse.ok) {
            console.log('   ✅ Self-Monitoring aktiviert');
        } else {
            console.log('   ❌ Fehler beim Aktivieren');
        }
        console.log('');
        
        // 3. Bot neu starten um Settings zu laden
        console.log('3️⃣ Bot neu starten...');
        const restartResponse = await fetch('http://localhost:3001/api/twitch-bot/restart', {
            method: 'POST'
        });
        
        if (restartResponse.ok) {
            console.log('   ✅ Bot Restart ausgelöst');
        } else {
            console.log('   ❌ Restart-Fehler');
        }
        console.log('');
        
        // 4. Warten und Status erneut prüfen
        console.log('4️⃣ Warte 30 Sekunden und prüfe Status...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        const finalStatusResponse = await fetch('http://localhost:3001/api/twitch-bot/stats');
        if (finalStatusResponse.ok) {
            const finalStatusData = await finalStatusResponse.json();
            console.log('   Bot Connected:', finalStatusData.stats.isConnected);
            console.log('   Self-Monitoring Enabled:', finalStatusData.stats.selfMonitoring?.enabled);
            console.log('   Self-Monitoring Running:', finalStatusData.stats.selfMonitoring?.isRunning);
            console.log('   Has Token:', finalStatusData.stats.selfMonitoring?.hasToken);
        }
        
        console.log('\n🔧 FORCE RESTART ABGESCHLOSSEN');
        
        if (finalStatusData?.stats?.selfMonitoring?.isRunning) {
            console.log('✅ Self-Monitoring läuft jetzt!');
            console.log('💡 Gehe jetzt live und warte 3 Minuten auf die Live-Message');
        } else {
            console.log('❌ Self-Monitoring läuft immer noch nicht');
            console.log('💡 Mögliche Probleme:');
            console.log('   - Environment Variables fehlen');
            console.log('   - OAuth Token ungültig');
            console.log('   - Channel nicht konfiguriert');
        }
        
    } catch (error) {
        console.error('❌ Force Restart Fehler:', error.message);
    }
}

// Script ausführen
forceSelfMonitoringRestart().then(() => {
    process.exit(0);
}).catch(console.error); 