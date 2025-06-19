const fs = require('fs');
const path = require('path');

class ServerSetupAPI {
    constructor(client) {
        this.client = client;
        this.templatesFile = path.join(__dirname, 'settings', 'server-templates.json');
        this.ensureTemplatesFile();
    }

    ensureTemplatesFile() {
        if (!fs.existsSync(this.templatesFile)) {
            const defaultTemplates = {
                gaming: {
                    name: "Gaming Server Template",
                    description: "Perfekt für Gaming Communities",
                    channels: [
                        { name: "willkommen", type: 0, category: "MAIN" },
                        { name: "regeln", type: 0, category: "MAIN" },
                        { name: "ankündigungen", type: 0, category: "MAIN" },
                        { name: "allgemein", type: 0, category: "CHAT" },
                        { name: "gaming-chat", type: 0, category: "CHAT" },
                        { name: "memes", type: 0, category: "CHAT" },
                        { name: "General Voice", type: 2, category: "VOICE" },
                        { name: "Gaming Voice 1", type: 2, category: "VOICE" },
                        { name: "Gaming Voice 2", type: 2, category: "VOICE" }
                    ],
                    roles: [
                        { name: "Moderator", color: "#e74c3c", permissions: ["MANAGE_MESSAGES", "KICK_MEMBERS"], hoist: true },
                        { name: "VIP", color: "#f39c12", permissions: [], hoist: true },
                        { name: "Gamer", color: "#3498db", permissions: [], hoist: false },
                        { name: "Supporter", color: "#9b59b6", permissions: [], hoist: false }
                    ],
                    settings: {
                        verificationLevel: 1,
                        defaultMessageNotifications: 1,
                        explicitContentFilter: 1
                    }
                },
                business: {
                    name: "Business Server Template",
                    description: "Professionell für Unternehmen",
                    channels: [
                        { name: "willkommen", type: 0, category: "GENERAL" },
                        { name: "ankündigungen", type: 0, category: "GENERAL" },
                        { name: "projektdiskussion", type: 0, category: "WORK" },
                        { name: "updates", type: 0, category: "WORK" },
                        { name: "ressourcen", type: 0, category: "WORK" },
                        { name: "Meeting Room 1", type: 2, category: "MEETINGS" },
                        { name: "Meeting Room 2", type: 2, category: "MEETINGS" },
                        { name: "Casual Talk", type: 2, category: "SOCIAL" }
                    ],
                    roles: [
                        { name: "Admin", color: "#e74c3c", permissions: ["ADMINISTRATOR"], hoist: true },
                        { name: "Manager", color: "#f39c12", permissions: ["MANAGE_CHANNELS", "MANAGE_MESSAGES"], hoist: true },
                        { name: "Team Lead", color: "#3498db", permissions: ["MANAGE_MESSAGES"], hoist: true },
                        { name: "Mitarbeiter", color: "#2ecc71", permissions: [], hoist: false }
                    ],
                    settings: {
                        verificationLevel: 2,
                        defaultMessageNotifications: 0,
                        explicitContentFilter: 2
                    }
                },
                community: {
                    name: "Community Server Template",
                    description: "Ideal für große Communities",
                    channels: [
                        { name: "willkommen", type: 0, category: "INFO" },
                        { name: "regeln", type: 0, category: "INFO" },
                        { name: "ankündigungen", type: 0, category: "INFO" },
                        { name: "allgemein", type: 0, category: "CHAT" },
                        { name: "off-topic", type: 0, category: "CHAT" },
                        { name: "support", type: 0, category: "SUPPORT" },
                        { name: "feedback", type: 0, category: "SUPPORT" },
                        { name: "Lounge", type: 2, category: "VOICE" },
                        { name: "Music", type: 2, category: "VOICE" },
                        { name: "Events", type: 2, category: "VOICE" }
                    ],
                    roles: [
                        { name: "Owner", color: "#e74c3c", permissions: ["ADMINISTRATOR"], hoist: true },
                        { name: "Moderator", color: "#f39c12", permissions: ["MANAGE_MESSAGES", "KICK_MEMBERS", "BAN_MEMBERS"], hoist: true },
                        { name: "Helper", color: "#3498db", permissions: ["MANAGE_MESSAGES"], hoist: true },
                        { name: "VIP", color: "#9b59b6", permissions: [], hoist: true },
                        { name: "Member", color: "#95a5a6", permissions: [], hoist: false }
                    ],
                    settings: {
                        verificationLevel: 1,
                        defaultMessageNotifications: 1,
                        explicitContentFilter: 1
                    }
                }
            };
            fs.writeFileSync(this.templatesFile, JSON.stringify(defaultTemplates, null, 2));
        }
    }

    loadTemplates() {
        try {
            return JSON.parse(fs.readFileSync(this.templatesFile, 'utf8'));
        } catch (error) {
            console.error('Error loading templates:', error);
            return {};
        }
    }

    saveTemplates(templates) {
        try {
            fs.writeFileSync(this.templatesFile, JSON.stringify(templates, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving templates:', error);
            return false;
        }
    }

    // Get all available templates
    getTemplates() {
        return this.loadTemplates();
    }

    // Create custom template from existing server
    async createTemplateFromServer(serverId, templateName, description) {
        try {
            const guild = this.client.guilds.cache.get(serverId);
            if (!guild) {
                throw new Error('Server nicht gefunden');
            }

            const template = {
                name: templateName,
                description: description,
                createdAt: Date.now(),
                createdBy: serverId,
                channels: [],
                roles: [],
                settings: {
                    verificationLevel: guild.verificationLevel,
                    defaultMessageNotifications: guild.defaultMessageNotifications,
                    explicitContentFilter: guild.explicitContentFilter
                }
            };

            // Extract channels with categories
            const categories = new Map();
            guild.channels.cache.forEach(channel => {
                if (channel.type === 4) { // Category channel
                    categories.set(channel.id, channel.name.toUpperCase());
                }
            });

            guild.channels.cache.forEach(channel => {
                if (channel.type === 0 || channel.type === 2) { // Text or Voice channel
                    const categoryName = channel.parentId ? categories.get(channel.parentId) : 'UNCATEGORIZED';
                    template.channels.push({
                        name: channel.name,
                        type: channel.type,
                        category: categoryName,
                        topic: channel.topic || '',
                        slowmode: channel.rateLimitPerUser || 0
                    });
                }
            });

            // Extract roles (exclude @everyone and bot roles)
            guild.roles.cache.forEach(role => {
                if (role.name !== '@everyone' && !role.managed) {
                    template.roles.push({
                        name: role.name,
                        color: role.hexColor,
                        permissions: role.permissions.toArray(),
                        hoist: role.hoist,
                        mentionable: role.mentionable
                    });
                }
            });

            // Save template
            const templates = this.loadTemplates();
            templates[templateName.toLowerCase().replace(/\s+/g, '_')] = template;
            this.saveTemplates(templates);

            return { success: true, template };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Apply template to server
    async applyTemplate(serverId, templateId, options = {}) {
        try {
            const guild = this.client.guilds.cache.get(serverId);
            if (!guild) {
                throw new Error('Server nicht gefunden');
            }

            const templates = this.loadTemplates();
            const template = templates[templateId];
            if (!template) {
                throw new Error('Template nicht gefunden');
            }

            const results = {
                channels: { created: 0, failed: 0, errors: [] },
                roles: { created: 0, failed: 0, errors: [] },
                categories: { created: 0, failed: 0, errors: [] },
                settings: { applied: false, error: null }
            };

            // Apply server settings first
            if (options.applySettings !== false) {
                try {
                    await guild.edit({
                        verificationLevel: template.settings.verificationLevel,
                        defaultMessageNotifications: template.settings.defaultMessageNotifications,
                        explicitContentFilter: template.settings.explicitContentFilter
                    });
                    results.settings.applied = true;
                } catch (error) {
                    results.settings.error = error.message;
                }
            }

            // Create roles first
            if (options.createRoles !== false) {
                for (const roleData of template.roles) {
                    try {
                        // Check if role already exists
                        const existingRole = guild.roles.cache.find(r => r.name === roleData.name);
                        if (existingRole && !options.overwriteExisting) {
                            continue;
                        }

                        await guild.roles.create({
                            name: roleData.name,
                            color: roleData.color,
                            permissions: roleData.permissions,
                            hoist: roleData.hoist,
                            mentionable: roleData.mentionable
                        });

                        results.roles.created++;
                    } catch (error) {
                        results.roles.failed++;
                        results.roles.errors.push(`Role ${roleData.name}: ${error.message}`);
                    }
                }
            }

            // Create categories and channels
            if (options.createChannels !== false) {
                const categoryMap = new Map();
                const categoriesNeeded = [...new Set(template.channels.map(ch => ch.category))];

                // Create categories first
                for (const categoryName of categoriesNeeded) {
                    if (categoryName && categoryName !== 'UNCATEGORIZED') {
                        try {
                            const existingCategory = guild.channels.cache.find(ch => 
                                ch.type === 4 && ch.name.toUpperCase() === categoryName
                            );

                            if (existingCategory) {
                                categoryMap.set(categoryName, existingCategory.id);
                            } else {
                                const newCategory = await guild.channels.create({
                                    name: categoryName,
                                    type: 4
                                });
                                categoryMap.set(categoryName, newCategory.id);
                                results.categories.created++;
                            }
                        } catch (error) {
                            results.categories.failed++;
                            results.categories.errors.push(`Category ${categoryName}: ${error.message}`);
                        }
                    }
                }

                // Create channels
                for (const channelData of template.channels) {
                    try {
                        // Check if channel already exists
                        const existingChannel = guild.channels.cache.find(ch => ch.name === channelData.name);
                        if (existingChannel && !options.overwriteExisting) {
                            continue;
                        }

                        const channelOptions = {
                            name: channelData.name,
                            type: channelData.type,
                            parent: categoryMap.get(channelData.category) || null
                        };

                        if (channelData.type === 0) { // Text channel
                            channelOptions.topic = channelData.topic;
                            channelOptions.rateLimitPerUser = channelData.slowmode;
                        }

                        await guild.channels.create(channelOptions);
                        results.channels.created++;

                    } catch (error) {
                        results.channels.failed++;
                        results.channels.errors.push(`Channel ${channelData.name}: ${error.message}`);
                    }
                }
            }

            return { success: true, results };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Delete template
    deleteTemplate(templateId) {
        try {
            const templates = this.loadTemplates();
            if (!templates[templateId]) {
                return { success: false, error: 'Template nicht gefunden' };
            }

            delete templates[templateId];
            this.saveTemplates(templates);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Update template
    updateTemplate(templateId, updatedTemplate) {
        try {
            const templates = this.loadTemplates();
            if (!templates[templateId]) {
                return { success: false, error: 'Template nicht gefunden' };
            }

            templates[templateId] = { ...templates[templateId], ...updatedTemplate };
            this.saveTemplates(templates);
            return { success: true, template: templates[templateId] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get template details
    getTemplate(templateId) {
        const templates = this.loadTemplates();
        return templates[templateId] || null;
    }

    // Backup server structure
    async backupServerStructure(serverId) {
        try {
            const guild = this.client.guilds.cache.get(serverId);
            if (!guild) {
                throw new Error('Server nicht gefunden');
            }

            const backup = {
                serverId: serverId,
                serverName: guild.name,
                backupDate: Date.now(),
                structure: await this.createTemplateFromServer(serverId, `backup_${guild.name}_${Date.now()}`, 'Auto-generated backup')
            };

            // Save backup
            const backupFile = path.join(__dirname, 'settings', 'server-backups.json');
            let backups = {};
            
            if (fs.existsSync(backupFile)) {
                backups = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
            }

            backups[serverId] = backups[serverId] || [];
            backups[serverId].push(backup);

            // Keep only last 10 backups per server
            backups[serverId] = backups[serverId].slice(-10);

            fs.writeFileSync(backupFile, JSON.stringify(backups, null, 2));

            return { success: true, backup };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get server backups
    getServerBackups(serverId) {
        try {
            const backupFile = path.join(__dirname, 'settings', 'server-backups.json');
            if (!fs.existsSync(backupFile)) {
                return [];
            }

            const backups = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
            return backups[serverId] || [];
        } catch (error) {
            console.error('Error loading backups:', error);
            return [];
        }
    }
}

module.exports = ServerSetupAPI; 