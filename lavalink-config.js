// 🎵 LAVALINK KONFIGURATION
// Professionelle Audio-Streaming-Lösung für Discord-Bots

const lavalink = {
    // 🔧 Lavalink Server Nodes
    nodes: [
        {
            identifier: 'main-node',
            host: 'lavalink.devamop.in', // Kostenloser öffentlicher Lavalink-Server
            port: 443,
            password: 'DevamOP',
            secure: true, // SSL
            retryAmount: 5,
            retryDelay: 30000,
            requestTimeout: 10000
        },
        {
            identifier: 'backup-node-1',
            host: 'lava.link', // Backup-Server
            port: 80,
            password: 'youshallnotpass',
            secure: false,
            retryAmount: 3,
            retryDelay: 15000,
            requestTimeout: 8000
        },
        {
            identifier: 'backup-node-2',
            host: 'lavalink.oops.wtf', // Zweiter Backup
            port: 443,
            password: 'www.freelavalink.ga',
            secure: true,
            retryAmount: 3,
            retryDelay: 20000,
            requestTimeout: 12000
        }
    ],

    // 🎵 Player-Optionen
    playerOptions: {
        useUnresolvedData: true, // Nutze unresolved tracks für bessere Performance
        selfDeafen: true, // Bot stumm schalten
        selfMute: false, // Bot nicht muten (muss Audio senden können)
        volume: 80, // Standard-Lautstärke
        searchFallback: true // Automatischer Fallback bei Suchfehlern
    },

    // 🔍 Such-Optionen
    searchOptions: {
        sources: {
            youtube: 'ytsearch', // YouTube-Suche
            youtubeMusic: 'ytmsearch', // YouTube Music
            soundcloud: 'scsearch', // SoundCloud
            spotify: 'spsearch' // Spotify (falls verfügbar)
        },
        defaultSource: 'ytsearch', // Standard-Suchquelle
        maxResults: 5, // Max. Suchergebnisse
        timeout: 15000 // Such-Timeout
    },

    // 📊 Monitoring
    monitoring: {
        enabled: true,
        logNodeStats: true,
        logPlayerEvents: true,
        logSearchEvents: true
    },

    // 🔄 Fallback-Strategie
    fallback: {
        enabled: true,
        sources: ['ytsearch', 'ytmsearch', 'scsearch'], // Fallback-Reihenfolge
        retryAttempts: 3,
        retryDelay: 2000
    }
};

// 🌐 Öffentliche Lavalink-Server (Updates regelmäßig)
const publicLavalinkNodes = [
    {
        identifier: 'lavalink-repl',
        host: 'lavalink.devamop.in',
        port: 443,
        password: 'DevamOP',
        secure: true
    },
    {
        identifier: 'something-host',
        host: 'lava.link',
        port: 80,
        password: 'youshallnotpass',
        secure: false
    },
    {
        identifier: 'freelavalink',
        host: 'lavalink.oops.wtf',
        port: 443,
        password: 'www.freelavalink.ga',
        secure: true
    }
];

// 🔧 Node-Health Checker
function checkNodeHealth(node) {
    return {
        isHealthy: node.stats ? 
            node.stats.cpu.systemLoad < 0.8 && 
            node.stats.memory.used < node.stats.memory.allocated * 0.9 : false,
        stats: node.stats || null,
        players: node.stats?.players || 0,
        playingPlayers: node.stats?.playingPlayers || 0
    };
}

// 🎯 Node-Selector (Wählt besten verfügbaren Node)
function selectBestNode(manager) {
    const availableNodes = manager.nodes.filter(node => node.connected);
    
    if (availableNodes.length === 0) {
        console.log('⚠️ Keine Lavalink-Nodes verfügbar');
        return null;
    }

    // Sortiere nach Gesundheit und Last
    return availableNodes.sort((a, b) => {
        const healthA = checkNodeHealth(a);
        const healthB = checkNodeHealth(b);
        
        if (healthA.isHealthy && !healthB.isHealthy) return -1;
        if (!healthA.isHealthy && healthB.isHealthy) return 1;
        
        // Bei gleicher Gesundheit: Weniger belasteten Node wählen
        return (healthA.players || 0) - (healthB.players || 0);
    })[0];
}

// 🎵 Track-Resolver für verschiedene Quellen
function resolveTrackSource(query) {
    // URL-Detection
    if (query.includes('youtube.com') || query.includes('youtu.be')) {
        return { source: 'youtube', query: query };
    }
    if (query.includes('soundcloud.com')) {
        return { source: 'soundcloud', query: query };
    }
    if (query.includes('spotify.com')) {
        return { source: 'spotify', query: query };
    }
    
    // Automatische Quellenauswahl für Text-Suchen
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('official') || lowerQuery.includes('music video')) {
        return { source: 'ytmsearch', query: query };
    }
    
    // Standard: YouTube-Suche
    return { source: 'ytsearch', query: query };
}

// 📈 Performance-Monitoring
function logNodePerformance(node) {
    if (!lavalink.monitoring.enabled || !node.stats) return;
    
    const stats = node.stats;
    const cpuLoad = (stats.cpu.systemLoad * 100).toFixed(1);
    const memoryUsage = ((stats.memory.used / stats.memory.allocated) * 100).toFixed(1);
    
    console.log(`📊 Node ${node.identifier} Performance:`);
    console.log(`   CPU: ${cpuLoad}% | Memory: ${memoryUsage}%`);
    console.log(`   Players: ${stats.players} (${stats.playingPlayers} playing)`);
    console.log(`   Uptime: ${Math.floor(stats.uptime / 1000 / 60)} Minuten`);
}

module.exports = {
    lavalink,
    publicLavalinkNodes,
    checkNodeHealth,
    selectBestNode,
    resolveTrackSource,
    logNodePerformance
}; 