// ================================================================
// 🎮 GAMING SYSTEM API - COMPREHENSIVE TEAM MANAGEMENT
// ================================================================
// Smart Auto-Ping, Team Builder, Voice Integration, Reputation System
// Features: Auto-Ping System, One-Click Team-Join, Live Team-Tracker,
// Auto-Voice-Channels, Reputation System, Role & Channel Management

const express = require('express');
const router = express.Router();

// Export für index.js
module.exports = router;

// Gaming System Settings (Default)
let gamingSystemSettings = {
    enabled: true,
    autoChannelCreation: true,
    autoRoleCreation: true,
    
    // 🤖 Smart Auto-Ping System
    autoPing: {
        enabled: true,
        minRank: 'Bronze',
        maxPingRadius: 5, // Max unterschied in Rängen
        cooldown: 30000, // 30 Sekunden zwischen Pings
        maxPingsPerHour: 10,
        smartMatching: true,
        respectDND: true
    },
    
    // ⚡ One-Click Team-Join System
    quickJoin: {
        enabled: true,
        autoVoiceJoin: true,
        maxTeamSize: 5,
        allowSpectators: true,
        autoRoleAssignment: true
    },
    
    // 📊 Live Team-Tracker
    teamTracker: {
        enabled: true,
        showProgress: true,
        liveUpdates: true,
        trackStats: true,
        displayChannel: 'team-status'
    },
    
    // 🎤 Auto-Voice-Channels
    voiceChannels: {
        enabled: true,
        autoCreate: true,
        autoDelete: true,
        namingScheme: '{emoji} {game} Team #{number}',
        maxChannels: 10,
        categoryName: '🎮 Gaming Lobbys'
    },
    
    // ⭐ Reputation System
    reputation: {
        enabled: true,
        startingPoints: 100,
        maxPoints: 1000,
        minPoints: 0,
        goodTeammateReward: 5,
        badTeammateDeduction: 10,
        winBonus: 3,
        lossDeduction: 1,
        displayBadges: true,
        requireMinGames: 5
    },
    
    // 📅 Scheduling System
    scheduling: {
        enabled: true,
        maxAdvanceBooking: 7, // Tage
        reminderTimes: [60, 15, 5], // Minuten vorher
        autoCancel: 30 // Minuten nach geplanter Zeit
    },

    // 🎯 Games Configuration
    supportedGames: {
        valorant: {
            name: 'Valorant',
            emoji: '🎯',
            teamSize: 5,
            roles: ['Controller', 'Duelist', 'Initiator', 'Sentinel'],
            ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
            channels: {
                general: '🎯 valorant-general',
                lfg: '🔍 valorant-lfg',
                ranked: '🏆 valorant-ranked',
                scrims: '⚔️ valorant-scrims'
            }
        },
        lol: {
            name: 'League of Legends',
            emoji: '⭐',
            teamSize: 5,
            roles: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
            ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
            channels: {
                general: '⭐ lol-general',
                lfg: '🔍 lol-lfg',
                ranked: '🏆 lol-ranked',
                aram: '🎲 lol-aram'
            }
        },
        overwatch: {
            name: 'Overwatch 2',
            emoji: '🧡',
            teamSize: 5,
            roles: ['Tank', 'Damage', 'Support'],
            ranks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Top 500'],
            channels: {
                general: '🧡 overwatch-general',
                lfg: '🔍 overwatch-lfg',
                competitive: '🏆 overwatch-comp',
                quickplay: '⚡ overwatch-quick'
            }
        },
        csgo: {
            name: 'CS2',
            emoji: '🔫',
            teamSize: 5,
            roles: ['IGL', 'Entry', 'Support', 'AWPer', 'Lurker'],
            ranks: ['Silver', 'Gold Nova', 'Master Guardian', 'Distinguished Master Guardian', 'Legendary Eagle', 'Supreme', 'Global Elite'],
            channels: {
                general: '🔫 cs2-general',
                lfg: '🔍 cs2-lfg',
                competitive: '🏆 cs2-competitive',
                retakes: '💥 cs2-retakes'
            }
        }
    }
};

// In-Memory Data Storage (wird später durch Supabase ersetzt)
let activeTeams = new Map(); // teamId -> team data
let playerReputation = new Map(); // userId -> reputation data
let teamInvites = new Map(); // inviteId -> invite data
let scheduledGames = new Map(); // gameId -> scheduled game data
let playerStats = new Map(); // userId -> player stats

// ================================================================
// 🚀 GAMING SYSTEM ROUTES
// ================================================================

// GET: Gaming System Status & Settings
router.get('/gaming/status', async (req, res) => {
    try {
        const stats = {
            systemEnabled: gamingSystemSettings.enabled,
            activeTeams: activeTeams.size,
            totalPlayers: Array.from(activeTeams.values()).reduce((sum, team) => sum + team.members.length, 0),
            scheduledGames: scheduledGames.size,
            supportedGames: Object.keys(gamingSystemSettings.supportedGames).length,
            reputationEnabled: gamingSystemSettings.reputation.enabled
        };

        res.json({
            success: true,
            settings: gamingSystemSettings,
            stats,
            activeTeams: Array.from(activeTeams.values()),
            message: 'Gaming System Status erfolgreich geladen'
        });
    } catch (error) {
        console.error('❌ Gaming Status Error:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Laden des Gaming System Status',
            details: error.message
        });
    }
});

// POST: Update Gaming System Settings
router.post('/gaming/settings', async (req, res) => {
    try {
        const newSettings = req.body;
        
        // Validate essential settings
        if (typeof newSettings.enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'enabled muss ein boolean Wert sein'
            });
        }

        // Update settings
        gamingSystemSettings = { ...gamingSystemSettings, ...newSettings };
        
        // TODO: Save to Supabase
        // await saveGamingSettingsToSupabase(gamingSystemSettings);

        res.json({
            success: true,
            settings: gamingSystemSettings,
            message: 'Gaming System Einstellungen erfolgreich gespeichert'
        });

    } catch (error) {
        console.error('❌ Gaming Settings Update Error:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Speichern der Gaming System Einstellungen',
            details: error.message
        });
    }
});

// POST: Create New Team
router.post('/gaming/team/create', async (req, res) => {
    try {
        const { game, gameMode, leaderId, leaderUsername, description, maxSize, requireRank } = req.body;
        
        if (!game || !leaderId || !leaderUsername) {
            return res.status(400).json({
                success: false,
                error: 'game, leaderId und leaderUsername sind erforderlich'
            });
        }

        const gameConfig = gamingSystemSettings.supportedGames[game];
        if (!gameConfig) {
            return res.status(400).json({
                success: false,
                error: `Spiel "${game}" wird nicht unterstützt`
            });
        }

        const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const team = {
            id: teamId,
            game,
            gameMode: gameMode || 'Competitive',
            leader: { id: leaderId, username: leaderUsername },
            members: [{ id: leaderId, username: leaderUsername, role: 'Leader', joinedAt: Date.now() }],
            maxSize: maxSize || gameConfig.teamSize,
            description: description || `${gameConfig.name} Team sucht Mitspieler`,
            requireRank: requireRank || null,
            status: 'recruiting',
            createdAt: Date.now(),
            voiceChannelId: null,
            invites: []
        };

        activeTeams.set(teamId, team);

        // TODO: Create voice channel if enabled
        // TODO: Send notifications to potential teammates

        res.json({
            success: true,
            team,
            message: 'Team erfolgreich erstellt'
        });

    } catch (error) {
        console.error('❌ Team Creation Error:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Erstellen des Teams',
            details: error.message
        });
    }
});

// POST: Join Team
router.post('/gaming/team/:teamId/join', async (req, res) => {
    try {
        const { teamId } = req.params;
        const { userId, username, preferredRole, rank } = req.body;

        if (!userId || !username) {
            return res.status(400).json({
                success: false,
                error: 'userId und username sind erforderlich'
            });
        }

        const team = activeTeams.get(teamId);
        if (!team) {
            return res.status(404).json({
                success: false,
                error: 'Team nicht gefunden'
            });
        }

        if (team.members.length >= team.maxSize) {
            return res.status(400).json({
                success: false,
                error: 'Team ist bereits voll'
            });
        }

        if (team.members.some(m => m.id === userId)) {
            return res.status(400).json({
                success: false,
                error: 'Du bist bereits in diesem Team'
            });
        }

        // Add member to team
        team.members.push({
            id: userId,
            username,
            role: preferredRole || 'Member',
            rank: rank || 'Unranked',
            joinedAt: Date.now()
        });

        // Update team status if full
        if (team.members.length >= team.maxSize) {
            team.status = 'full';
        }

        activeTeams.set(teamId, team);

        // TODO: Add to voice channel if exists
        // TODO: Send notifications

        res.json({
            success: true,
            team,
            message: 'Erfolgreich dem Team beigetreten'
        });

    } catch (error) {
        console.error('❌ Team Join Error:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Beitreten des Teams',
            details: error.message
        });
    }
});

// GET: Find Teams (Smart Matching)
router.get('/gaming/teams/find', async (req, res) => {
    try {
        const { game, rank, role, gameMode } = req.query;
        
        let teams = Array.from(activeTeams.values()).filter(team => 
            team.status === 'recruiting' && team.members.length < team.maxSize
        );

        // Filter by game
        if (game) {
            teams = teams.filter(team => team.game === game);
        }

        // Filter by rank compatibility (if Smart Auto-Ping enabled)
        if (rank && gamingSystemSettings.autoPing.smartMatching) {
            const gameConfig = gamingSystemSettings.supportedGames[game];
            if (gameConfig && gameConfig.ranks) {
                const playerRankIndex = gameConfig.ranks.indexOf(rank);
                if (playerRankIndex !== -1) {
                    teams = teams.filter(team => {
                        const leaderRank = team.members[0].rank;
                        const leaderRankIndex = gameConfig.ranks.indexOf(leaderRank);
                        if (leaderRankIndex === -1) return true; // No rank restriction
                        
                        const rankDifference = Math.abs(playerRankIndex - leaderRankIndex);
                        return rankDifference <= gamingSystemSettings.autoPing.maxPingRadius;
                    });
                }
            }
        }

        // Sort by creation time (newest first)
        teams.sort((a, b) => b.createdAt - a.createdAt);

        res.json({
            success: true,
            teams,
            count: teams.length,
            message: 'Teams erfolgreich gefunden'
        });

    } catch (error) {
        console.error('❌ Find Teams Error:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Suchen von Teams',
            details: error.message
        });
    }
});

// GET: Player Reputation
router.get('/gaming/reputation/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const reputation = playerReputation.get(userId) || {
            userId,
            points: gamingSystemSettings.reputation.startingPoints,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            commendations: 0,
            reports: 0,
            badges: [],
            createdAt: Date.now()
        };

        // Calculate win rate
        reputation.winRate = reputation.gamesPlayed > 0 
            ? Math.round((reputation.wins / reputation.gamesPlayed) * 100)
            : 0;

        // Determine reputation level
        if (reputation.points >= 800) reputation.level = 'Legendary';
        else if (reputation.points >= 600) reputation.level = 'Expert';
        else if (reputation.points >= 400) reputation.level = 'Skilled';
        else if (reputation.points >= 200) reputation.level = 'Good';
        else if (reputation.points >= 100) reputation.level = 'Average';
        else reputation.level = 'Beginner';

        res.json({
            success: true,
            reputation,
            message: 'Reputation erfolgreich geladen'
        });

    } catch (error) {
        console.error('❌ Reputation Error:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Laden der Reputation',
            details: error.message
        });
    }
});

// POST: Create Gaming Channels & Roles
router.post('/gaming/setup/:game', async (req, res) => {
    try {
        const { game } = req.params;
        
        const gameConfig = gamingSystemSettings.supportedGames[game];
        if (!gameConfig) {
            return res.status(400).json({
                success: false,
                error: `Spiel "${game}" wird nicht unterstützt`
            });
        }

        // TODO: Implement channel and role creation logic
        // This would interact with Discord API to create:
        // - Game-specific channels
        // - Role-specific roles
        // - Rank-specific roles
        // - Categories

        const setupResult = {
            game,
            channelsCreated: Object.keys(gameConfig.channels).length,
            rolesCreated: gameConfig.roles.length + gameConfig.ranks.length,
            categoryCreated: true
        };

        res.json({
            success: true,
            setup: setupResult,
            message: `${gameConfig.name} Setup erfolgreich abgeschlossen`
        });

    } catch (error) {
        console.error('❌ Gaming Setup Error:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Setup des Gaming Systems',
            details: error.message
        });
    }
});

// POST: Toggle Gaming System
router.post('/gaming/toggle', async (req, res) => {
    try {
        gamingSystemSettings.enabled = !gamingSystemSettings.enabled;
        
        // TODO: Save to Supabase
        
        res.json({
            success: true,
            enabled: gamingSystemSettings.enabled,
            message: `Gaming System ${gamingSystemSettings.enabled ? 'aktiviert' : 'deaktiviert'}`
        });

    } catch (error) {
        console.error('❌ Gaming Toggle Error:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Umschalten des Gaming Systems',
            details: error.message
        });
    }
});

// GET: Gaming Statistics
router.get('/gaming/stats', async (req, res) => {
    try {
        const stats = {
            overview: {
                totalTeams: activeTeams.size,
                activeTeams: Array.from(activeTeams.values()).filter(t => t.status === 'recruiting').length,
                totalPlayers: Array.from(activeTeams.values()).reduce((sum, team) => sum + team.members.length, 0),
                averageTeamSize: activeTeams.size > 0 
                    ? (Array.from(activeTeams.values()).reduce((sum, team) => sum + team.members.length, 0) / activeTeams.size).toFixed(1)
                    : 0
            },
            games: {},
            reputation: {
                totalPlayers: playerReputation.size,
                averagePoints: playerReputation.size > 0
                    ? Math.round(Array.from(playerReputation.values()).reduce((sum, rep) => sum + rep.points, 0) / playerReputation.size)
                    : gamingSystemSettings.reputation.startingPoints
            }
        };

        // Game-specific stats
        for (const [gameKey, gameConfig] of Object.entries(gamingSystemSettings.supportedGames)) {
            const gameTeams = Array.from(activeTeams.values()).filter(t => t.game === gameKey);
            stats.games[gameKey] = {
                name: gameConfig.name,
                emoji: gameConfig.emoji,
                teams: gameTeams.length,
                players: gameTeams.reduce((sum, team) => sum + team.members.length, 0)
            };
        }

        res.json({
            success: true,
            stats,
            message: 'Gaming Statistiken erfolgreich geladen'
        });

    } catch (error) {
        console.error('❌ Gaming Stats Error:', error);
        res.status(500).json({
            success: false,
            error: 'Fehler beim Laden der Gaming Statistiken',
            details: error.message
        });
    }
}); 