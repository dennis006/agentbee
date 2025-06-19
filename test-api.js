const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Mock data für Tests
const mockStats = {
    totalVerifications: 12,
    todayVerifications: 3,
    popularGames: [
        { game: 'Valorant', count: 8 },
        { game: 'League of Legends', count: 3 },
        { game: 'Minecraft', count: 1 }
    ],
    platformStats: [
        { platform: 'pc', count: 10 },
        { platform: 'ps5', count: 2 }
    ],
    recentUsers: [
        {
            discordId: '123456789',
            username: 'TestUser',
            discriminator: '0001',
            avatar: null,
            games: ['Valorant'],
            platform: 'pc',
            agents: ['Jett'],
            assignedRoles: ['Gamer', 'Verified'],
            verificationDate: new Date().toISOString(),
            guildId: '987654321',
            guildName: 'Test Server'
        }
    ],
    totalUsers: 12,
    activeToday: 3,
    mostPopularGame: 'Valorant',
    mostPopularPlatform: 'pc'
};

const mockUsers = {
    users: [
        {
            discordId: '123456789',
            username: 'TestUser1',
            discriminator: '0001',
            avatar: null,
            games: ['Valorant', 'League of Legends'],
            platform: 'pc',
            agents: ['Jett', 'Sage'],
            assignedRoles: ['Gamer', 'Verified'],
            verificationDate: new Date().toISOString(),
            guildId: '987654321',
            guildName: 'Test Server'
        },
        {
            discordId: '987654321',
            username: 'TestUser2', 
            discriminator: '0002',
            avatar: null,
            games: ['Minecraft'],
            platform: 'ps5',
            agents: [],
            assignedRoles: ['Casual', 'Verified'],
            verificationDate: new Date(Date.now() - 24*60*60*1000).toISOString(),
            guildId: '987654321',
            guildName: 'Test Server'
        }
    ],
    totalCount: 2,
    lastUpdated: new Date().toISOString()
};

// API Endpoints
app.get('/api/verification/stats', (req, res) => {
    console.log('📊 Stats requested');
    res.json(mockStats);
});

app.get('/api/verification/users', (req, res) => {
    console.log('👥 Users requested');
    res.json(mockUsers);
});

app.get('/api/verification/users/:discordId', (req, res) => {
    const { discordId } = req.params;
    const user = mockUsers.users.find(u => u.discordId === discordId);
    
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

app.delete('/api/verification/users/:discordId', (req, res) => {
    const { discordId } = req.params;
    const userIndex = mockUsers.users.findIndex(u => u.discordId === discordId);
    
    if (userIndex !== -1) {
        const deletedUser = mockUsers.users.splice(userIndex, 1)[0];
        mockUsers.totalCount = mockUsers.users.length;
        mockUsers.lastUpdated = new Date().toISOString();
        
        console.log(`🗑️ User ${deletedUser.username} deleted`);
        res.json({ success: true, message: `User ${deletedUser.username} deleted` });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

app.get('/api/verification/config', (req, res) => {
    console.log('⚙️ Config requested');
    
    // Mock config
    const mockConfig = {
        enabled: true,
        requireCaptcha: true,
        allowedGames: [
            { id: 'valorant', label: 'Valorant', emoji: '🎯' },
            { id: 'lol', label: 'League of Legends', emoji: '⚔️' },
            { id: 'minecraft', label: 'Minecraft', emoji: '🧱' }
        ],
        allowedPlatforms: [
            { id: 'pc', label: 'PC', emoji: '💻' },
            { id: 'ps5', label: 'PlayStation 5', emoji: '🎮' },
            { id: 'xbox', label: 'Xbox Series X/S', emoji: '🎮' }
        ],
        defaultRoles: ['Verified', 'Member'],
        welcomeMessage: 'Willkommen! Du bist jetzt verifiziert.',
        logChannel: 'verify-logs',
        autoAssignRoles: true
    };
    
    res.json(mockConfig);
});

app.post('/api/verification/config', (req, res) => {
    console.log('💾 Config save requested:', req.body);
    res.json({ success: true, message: 'Config saved (mock)' });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Test API Server läuft auf http://localhost:${PORT}`);
    console.log('📋 Verfügbare Endpunkte:');
    console.log('   GET  /api/verification/stats');
    console.log('   GET  /api/verification/users');
    console.log('   GET  /api/verification/users/:id');
    console.log('   DELETE /api/verification/users/:id');
    console.log('   GET  /api/verification/config');
    console.log('   POST /api/verification/config');
}); 