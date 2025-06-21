// =============================================
// Discord Bot Rules API mit Supabase Integration
// =============================================

const { createClient } = require('@supabase/supabase-js');

// Supabase Client initialisieren
let supabase = null;

function initializeSupabase() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.warn('⚠️ Supabase Umgebungsvariablen fehlen - Rules verwenden Fallback zu JSON');
        return null;
    }

    try {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        console.log('✅ Supabase für Rules-System initialisiert');
        return supabase;
    } catch (error) {
        console.error('❌ Fehler beim Initialisieren von Supabase für Rules:', error);
        return null;
    }
}

// Initialize Supabase
initializeSupabase();

// Standard Server ID (kann später dynamisch gemacht werden)
const DEFAULT_SERVER_ID = '123456789012345678';

// Standard Rules Template
const DEFAULT_RULES = {
    title: "📜 SERVERREGELN",
    description: "Willkommen auf **{serverName}**! Bitte lies und befolge diese Regeln:",
    color: "0xFF6B6B",
    channelName: "rules",
    rules: [
        { emoji: "1️⃣", name: "Respekt", value: "Sei respektvoll und freundlich zu allen Mitgliedern" },
        { emoji: "2️⃣", name: "Kein Spam", value: "Kein Spam, keine Werbung oder Eigenwerbung" },
        { emoji: "3️⃣", name: "Angemessene Inhalte", value: "Keine beleidigenden, diskriminierenden oder NSFW Inhalte" },
        { emoji: "4️⃣", name: "Richtige Kanäle", value: "Nutze die entsprechenden Kanäle für verschiedene Themen" },
        { emoji: "5️⃣", name: "Discord Guidelines", value: "Halte dich an die Discord Community Guidelines" },
        { emoji: "6️⃣", name: "Moderatoren", value: "Respektiere Mods und Admins - bei Problemen wende dich an sie" },
        { emoji: "7️⃣", name: "Sprache", value: "Deutsche Sprache bevorzugt im Chat" },
        { emoji: "8️⃣", name: "Konsequenzen", value: "Verstöße können zu Verwarnungen oder Bans führen" }
    ],
    footer: "Viel Spaß auf dem Server! 🎉",
    reaction: {
        emoji: "✅",
        message: "Reagiere mit ✅ um die Regeln zu akzeptieren!",
        acceptedRole: "verified",
        acceptedMessage: "Willkommen! Du hast die Regeln akzeptiert und erhältst Zugang zum Server."
    }
};

// =============================================
// Hilfsfunktionen
// =============================================

function getServerId(req) {
    // Später: aus JWT Token oder Session extrahieren
    return req.headers['server-id'] || DEFAULT_SERVER_ID;
}

async function loadRulesFromSupabase(serverId) {
    if (!supabase) {
        throw new Error('Supabase nicht initialisiert');
    }

    try {
        console.log(`🔍 Lade Rules für Server ${serverId} aus Supabase...`);

        // Lade Hauptkonfiguration
        const { data: config, error: configError } = await supabase
            .from('server_rules_config')
            .select('*')
            .eq('server_id', serverId)
            .single();

        if (configError && configError.code !== 'PGRST116') {
            throw configError;
        }

        if (!config) {
            console.log(`ℹ️ Keine Rules-Konfiguration für Server ${serverId} gefunden`);
            return null;
        }

        // Lade alle Rules Items
        const { data: rulesItems, error: itemsError } = await supabase
            .from('server_rules_items')
            .select('emoji, name, value')
            .eq('server_id', serverId)
            .order('rule_order', { ascending: true });

        if (itemsError) {
            throw itemsError;
        }

        // Lade Reaction-Einstellungen
        const { data: reaction, error: reactionError } = await supabase
            .from('server_rules_reactions')
            .select('emoji, message, accepted_role, accepted_message')
            .eq('server_id', serverId)
            .single();

        if (reactionError && reactionError.code !== 'PGRST116') {
            throw reactionError;
        }

        // Zusammenbauen
        const rules = {
            title: config.title,
            description: config.description,
            color: config.color,
            channelName: config.channel_name,
            footer: config.footer,
            rules: rulesItems || [],
            reaction: reaction ? {
                emoji: reaction.emoji,
                message: reaction.message,
                acceptedRole: reaction.accepted_role,
                acceptedMessage: reaction.accepted_message
            } : DEFAULT_RULES.reaction
        };

        console.log(`✅ Rules für Server ${serverId} aus Supabase geladen (${rules.rules.length} Regeln)`);
        return rules;

    } catch (error) {
        console.error('❌ Fehler beim Laden der Rules aus Supabase:', error);
        throw error;
    }
}

async function saveRulesToSupabase(serverId, rules) {
    if (!supabase) {
        throw new Error('Supabase nicht initialisiert');
    }

    try {
        console.log(`💾 Speichere Rules für Server ${serverId} in Supabase...`);

        // Beginne Transaktion-ähnliche Operation
        let configId;

        // 1. Upsert Hauptkonfiguration
        const { data: configData, error: configError } = await supabase
            .from('server_rules_config')
            .upsert({
                server_id: serverId,
                title: rules.title,
                description: rules.description,
                color: rules.color,
                channel_name: rules.channelName,
                footer: rules.footer,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'server_id'
            })
            .select('id')
            .single();

        if (configError) {
            throw configError;
        }

        configId = configData.id;

        // 2. Lösche alte Rules Items
        const { error: deleteError } = await supabase
            .from('server_rules_items')
            .delete()
            .eq('server_id', serverId);

        if (deleteError) {
            throw deleteError;
        }

        // 3. Füge neue Rules Items hinzu
        if (rules.rules && rules.rules.length > 0) {
            const rulesItems = rules.rules.map((rule, index) => ({
                config_id: configId,
                server_id: serverId,
                rule_order: index + 1,
                emoji: rule.emoji,
                name: rule.name,
                value: rule.value
            }));

            const { error: itemsError } = await supabase
                .from('server_rules_items')
                .insert(rulesItems);

            if (itemsError) {
                throw itemsError;
            }
        }

        // 4. Upsert Reaction-Einstellungen
        if (rules.reaction) {
            const { error: reactionError } = await supabase
                .from('server_rules_reactions')
                .upsert({
                    config_id: configId,
                    server_id: serverId,
                    emoji: rules.reaction.emoji,
                    message: rules.reaction.message,
                    accepted_role: rules.reaction.acceptedRole,
                    accepted_message: rules.reaction.acceptedMessage,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'server_id'
                });

            if (reactionError) {
                throw reactionError;
            }
        }

        console.log(`✅ Rules für Server ${serverId} in Supabase gespeichert (${rules.rules.length} Regeln)`);
        return { success: true, configId };

    } catch (error) {
        console.error('❌ Fehler beim Speichern der Rules in Supabase:', error);
        throw error;
    }
}

async function createDefaultRulesInSupabase(serverId) {
    try {
        console.log(`🆕 Erstelle Standard-Rules für Server ${serverId}...`);
        await saveRulesToSupabase(serverId, DEFAULT_RULES);
        console.log(`✅ Standard-Rules für Server ${serverId} erstellt`);
        return DEFAULT_RULES;
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Standard-Rules:', error);
        throw error;
    }
}

// =============================================
// API Routes
// =============================================

function setupRulesSupabaseRoutes(app) {
    console.log('🔧 Registriere Supabase Rules API Endpunkte...');

    // GET /api/rules/supabase - Lade Rules
    app.get('/api/rules/supabase', async (req, res) => {
        const serverId = getServerId(req);

        try {
            let rules = await loadRulesFromSupabase(serverId);
            
            if (!rules) {
                // Wenn keine Rules gefunden, erstelle Standard-Rules
                rules = await createDefaultRulesInSupabase(serverId);
            }

            res.json(rules);
        } catch (error) {
            console.error('❌ Fehler in GET /api/rules/supabase:', error);
            
            // Fallback: Versuche aus JSON-Datei zu laden
            const fs = require('fs');
            try {
                if (fs.existsSync('./rules.json')) {
                    const fallbackRules = JSON.parse(fs.readFileSync('./rules.json', 'utf8'));
                    console.log('📄 Fallback: Rules aus JSON-Datei geladen');
                    res.json(fallbackRules);
                } else {
                    console.log('📄 Fallback: Standard-Rules verwendet');
                    res.json(DEFAULT_RULES);
                }
            } catch (fallbackError) {
                console.error('❌ Auch Fallback fehlgeschlagen:', fallbackError);
                res.status(500).json({ 
                    error: 'Fehler beim Laden der Rules', 
                    details: error.message,
                    fallback: 'JSON-Fallback auch fehlgeschlagen'
                });
            }
        }
    });

    // POST /api/rules/supabase - Speichere Rules
    app.post('/api/rules/supabase', async (req, res) => {
        const serverId = getServerId(req);
        
        // Unterstütze sowohl { action: 'save', rules: ... } als auch direkte Rules
        let rules;
        if (req.body.action === 'save' && req.body.rules) {
            rules = req.body.rules;
        } else if (req.body.title && req.body.rules) {
            // Direktes Rules-Objekt vom Frontend
            rules = req.body;
        } else {
            return res.status(400).json({ 
                error: 'Rules-Daten fehlen oder ungültiges Format' 
            });
        }

        try {
            const result = await saveRulesToSupabase(serverId, rules);
                
            // Backup in JSON-Datei (optional)
            const fs = require('fs');
            try {
                fs.writeFileSync('./rules.json', JSON.stringify(rules, null, 2));
                console.log('📄 Backup in rules.json erstellt');
            } catch (backupError) {
                console.warn('⚠️ JSON-Backup fehlgeschlagen:', backupError.message);
            }

            res.json({
                success: true,
                message: 'Rules erfolgreich in Supabase gespeichert',
                configId: result.configId,
                serverId: serverId,
                rulesCount: rules.rules.length
            });

        } catch (error) {
            console.error('❌ Fehler in POST /api/rules/supabase:', error);
            
            // Fallback: Versuche in JSON-Datei zu speichern
            if (rules) {
                const fs = require('fs');
                try {
                    fs.writeFileSync('./rules.json', JSON.stringify(rules, null, 2));
                    console.log('📄 Fallback: Rules in JSON-Datei gespeichert');
                    res.json({
                        success: true,
                        message: 'Rules in JSON-Datei gespeichert (Supabase nicht verfügbar)',
                        warning: 'Supabase-Fehler - Fallback verwendet',
                        error: error.message
                    });
                } catch (fallbackError) {
                    console.error('❌ Auch JSON-Fallback fehlgeschlagen:', fallbackError);
                    res.status(500).json({ 
                        error: 'Fehler beim Speichern der Rules', 
                        details: error.message,
                        fallback: 'JSON-Fallback auch fehlgeschlagen'
                    });
                }
            } else {
                res.status(500).json({ 
                    error: 'Fehler beim Verarbeiten der Rules', 
                    details: error.message 
                });
            }
        }
    });

    // DELETE /api/rules/supabase - Lösche Rules (Admin-Funktion)
    app.delete('/api/rules/supabase', async (req, res) => {
        const serverId = getServerId(req);

        try {
            if (!supabase) {
                return res.status(503).json({ 
                    error: 'Supabase nicht verfügbar' 
                });
            }

            // Lösche alle Rules für diesen Server
            const { error } = await supabase
                .from('server_rules_config')
                .delete()
                .eq('server_id', serverId);

            if (error) {
                throw error;
            }

            console.log(`🗑️ Alle Rules für Server ${serverId} gelöscht`);
            res.json({
                success: true,
                message: 'Alle Rules gelöscht'
            });

        } catch (error) {
            console.error('❌ Fehler beim Löschen der Rules:', error);
            res.status(500).json({ 
                error: 'Fehler beim Löschen der Rules', 
                details: error.message 
            });
        }
    });

    // GET /api/rules/supabase/stats - Statistiken
    app.get('/api/rules/supabase/stats', async (req, res) => {
        try {
            if (!supabase) {
                return res.status(503).json({ 
                    error: 'Supabase nicht verfügbar' 
                });
            }

            const { data: configs, error: configError } = await supabase
                .from('server_rules_config')
                .select('server_id, created_at, updated_at');

            if (configError) {
                throw configError;
            }

            const { data: rulesCount, error: countError } = await supabase
                .from('server_rules_items')
                .select('server_id', { count: 'exact' });

            if (countError) {
                throw countError;
            }

            res.json({
                serversWithRules: configs.length,
                totalRules: rulesCount.length,
                servers: configs.map(config => ({
                    serverId: config.server_id,
                    created: config.created_at,
                    lastUpdated: config.updated_at
                }))
            });

        } catch (error) {
            console.error('❌ Fehler beim Laden der Stats:', error);
            res.status(500).json({ 
                error: 'Fehler beim Laden der Statistiken', 
                details: error.message 
            });
        }
    });

    console.log('✅ Supabase Rules API Endpunkte registriert');
}

// =============================================
// Export
// =============================================

module.exports = {
    setupRulesSupabaseRoutes,
    loadRulesFromSupabase,
    saveRulesToSupabase,
    createDefaultRulesInSupabase,
    DEFAULT_RULES
}; 