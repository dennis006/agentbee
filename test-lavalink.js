// 🎵 LAVALINK TEST SCRIPT
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001';
const TEST_GUILD_ID = '1203994020779532348'; // Beispiel Guild ID
const TEST_VOICE_CHANNEL_ID = '1203994021291769961'; // Beispiel Voice Channel ID

async function testLavalinkAPI() {
    console.log('🚀 Teste Lavalink Musik-System API...\n');

    // 1. Health Check
    console.log('1️⃣ Testing Lavalink Status...');
    try {
        const response = await fetch(`${API_URL}/api/music/lavalink/status`);
        const data = await response.json();
        console.log('✅ Lavalink Status:', data);
    } catch (error) {
        console.error('❌ Health Check Fehler:', error.message);
    }

    // 2. Music Search
    console.log('\n2️⃣ Testing Music Search...');
    try {
        const response = await fetch(`${API_URL}/api/music/search?query=never gonna give you up`);
        const data = await response.json();
        console.log('✅ Search Results:', data.tracks?.length || 0, 'tracks found');
        if (data.tracks?.[0]) {
            console.log('   First result:', data.tracks[0].title, 'by', data.tracks[0].author);
        }
    } catch (error) {
        console.error('❌ Search Fehler:', error.message);
    }

    // 3. Play Music
    console.log('\n3️⃣ Testing Music Play...');
    try {
        const response = await fetch(`${API_URL}/api/music/play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                guildId: TEST_GUILD_ID,
                query: 'never gonna give you up rick astley',
                userId: 'test-user',
                voiceChannelId: TEST_VOICE_CHANNEL_ID,
                textChannelId: TEST_VOICE_CHANNEL_ID
            })
        });
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Play Success:', data.message);
            console.log('   Track:', data.track?.title || 'Unknown');
        } else {
            console.log('❌ Play Error:', data.error);
        }
    } catch (error) {
        console.error('❌ Play Request Fehler:', error.message);
    }

    // 4. Queue Status
    console.log('\n4️⃣ Testing Queue Status...');
    try {
        const response = await fetch(`${API_URL}/api/music/queue/${TEST_GUILD_ID}`);
        const data = await response.json();
        console.log('✅ Queue Status:', {
            current: data.queue?.current?.title || 'None',
            queueSize: data.queue?.size || 0,
            playing: data.player?.playing || false,
            connected: data.player?.connected || false
        });
    } catch (error) {
        console.error('❌ Queue Fehler:', error.message);
    }

    // 5. Skip (nach 5 Sekunden)
    console.log('\n5️⃣ Testing Skip (in 5 seconds)...');
    setTimeout(async () => {
        try {
            const response = await fetch(`${API_URL}/api/music/skip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guildId: TEST_GUILD_ID })
            });
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Skip Success:', data.message);
            } else {
                console.log('❌ Skip Error:', data.error);
            }
        } catch (error) {
            console.error('❌ Skip Request Fehler:', error.message);
        }
    }, 5000);

    // 6. Leave (nach 10 Sekunden)
    console.log('\n6️⃣ Testing Leave (in 10 seconds)...');
    setTimeout(async () => {
        try {
            const response = await fetch(`${API_URL}/api/music/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guildId: TEST_GUILD_ID })
            });
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Leave Success:', data.message);
            } else {
                console.log('❌ Leave Error:', data.error);
            }
        } catch (error) {
            console.error('❌ Leave Request Fehler:', error.message);
        }

        console.log('\n🎵 Lavalink Test komplett!');
    }, 10000);
}

// Test ausführen
if (require.main === module) {
    testLavalinkAPI();
}

module.exports = { testLavalinkAPI }; 