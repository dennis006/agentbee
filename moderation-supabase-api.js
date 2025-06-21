// ==========================================
// SUPABASE MODERATION API
// ==========================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase Client Setup
let supabase = null;

function initializeSupabase() {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
            supabase = createClient(supabaseUrl, supabaseKey);
            console.log('✅ Supabase Client für Moderation initialisiert');
            return true;
        } else {
            console.log('⚠️ Supabase Umgebungsvariablen nicht gefunden, verwende JSON Fallback');
            return false;
        }
    } catch (error) {
        console.error('❌ Fehler beim Initialisieren von Supabase für Moderation:', error);
        return false;
    }
}

// Fallback JSON Funktionen
function loadModerationLogsFromJSON() {
    try {
        if (fs.existsSync('./moderation-logs.json')) {
            return JSON.parse(fs.readFileSync('./moderation-logs.json', 'utf8'));
        }
        return [];
    } catch (error) {
        console.error('❌ Fehler beim Laden der JSON Moderation-Logs:', error);
        return [];
    }
}

function setupModerationSupabaseRoutes(app) {
    const supabaseAvailable = initializeSupabase();

    // GET /api/moderation/supabase/logs
    app.get('/api/moderation/supabase/logs', async (req, res) => {
        try {
            console.log('📄 Verwende JSON Fallback für Moderation Logs');
            const logs = loadModerationLogsFromJSON();
            const { page = 1, limit = 50, action, user, days } = req.query;

            let filteredLogs = [...logs];

            // Filter anwenden
            if (action && action !== 'all') {
                filteredLogs = filteredLogs.filter(log => log.action === action);
            }

            if (user) {
                filteredLogs = filteredLogs.filter(log => 
                    log.targetUser.username.toLowerCase().includes(user.toLowerCase()) ||
                    log.targetUser.displayName.toLowerCase().includes(user.toLowerCase())
                );
            }

            if (days) {
                const daysAgo = new Date();
                daysAgo.setDate(daysAgo.getDate() - parseInt(days));
                filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= daysAgo);
            }

            // Pagination
            const totalLogs = filteredLogs.length;
            const startIndex = (parseInt(page) - 1) * parseInt(limit);
            const endIndex = startIndex + parseInt(limit);
            const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

            const result = {
                logs: paginatedLogs,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalLogs / parseInt(limit)),
                    totalLogs: totalLogs,
                    hasNext: endIndex < totalLogs,
                    hasPrev: startIndex > 0
                }
            };

            res.json(result);
        } catch (error) {
            console.error('❌ Fehler beim Laden der Moderation Logs:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Moderation Logs' });
        }
    });

    // GET /api/moderation/supabase/stats
    app.get('/api/moderation/supabase/stats', async (req, res) => {
        try {
            console.log('📄 Verwende JSON Fallback für Moderation Stats');
            const logs = loadModerationLogsFromJSON();
            
            const stats = {
                totalActions: logs.length,
                actionCounts: {},
                topModerators: {},
                recentActivity: []
            };
            
            // Zähle Aktionen
            logs.forEach(log => {
                stats.actionCounts[log.action] = (stats.actionCounts[log.action] || 0) + 1;
                
                // Top Moderatoren
                const modKey = log.moderator.username;
                stats.topModerators[modKey] = (stats.topModerators[modKey] || 0) + 1;
            });
            
            // Aktivität der letzten 7 Tage
            const last7Days = new Date();
            last7Days.setDate(last7Days.getDate() - 7);
            
            stats.recentActivity = logs
                .filter(log => new Date(log.timestamp) >= last7Days)
                .slice(0, 20);

            res.json(stats);
        } catch (error) {
            console.error('❌ Fehler beim Laden der Moderation Stats:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Moderation Stats' });
        }
    });

    console.log('📊 Moderation Supabase API Routen registriert:');
    console.log('   GET  /api/moderation/supabase/logs');
    console.log('   GET  /api/moderation/supabase/stats');
}

module.exports = { setupModerationSupabaseRoutes }; 