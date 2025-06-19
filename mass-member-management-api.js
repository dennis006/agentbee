const fs = require('fs');
const path = require('path');

class MassMemberManagementAPI {
    constructor(client) {
        this.client = client;
        this.dataFile = path.join(__dirname, 'settings', 'mass-member-management.json');
        this.operationHistory = new Map();
        this.pendingOperations = new Map();
        this.ensureDataFile();
    }

    ensureDataFile() {
        const settingsDir = path.join(__dirname, 'settings');
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.dataFile)) {
            const defaultData = {
                operationHistory: [],
                memberGroups: {},
                automationRules: [],
                settings: {
                    maxBatchSize: 100,
                    operationDelay: 1000, // ms between operations
                    requireConfirmation: true,
                    logOperations: true,
                    enableUndo: true,
                    undoTimeLimit: 3600000 // 1 hour
                },
                statistics: {
                    totalOperations: 0,
                    totalMembersProcessed: 0,
                    lastOperation: null
                }
            };
            fs.writeFileSync(this.dataFile, JSON.stringify(defaultData, null, 2));
        }
    }

    loadData() {
        try {
            return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        } catch (error) {
            console.error('Error loading mass member management data:', error);
            return { operationHistory: [], memberGroups: {}, automationRules: [], settings: {}, statistics: {} };
        }
    }

    saveData(data) {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving mass member management data:', error);
            return false;
        }
    }

    // Bulk Role Operations
    async bulkAssignRoles(guildId, memberIds, roleIds, reason = 'Bulk role assignment') {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) throw new Error('Guild not found');

            const operation = {
                id: this.generateOperationId(),
                type: 'bulk_assign_roles',
                guildId: guildId,
                timestamp: Date.now(),
                reason: reason,
                totalMembers: memberIds.length,
                processedMembers: 0,
                failedMembers: [],
                successfulMembers: [],
                roleIds: roleIds,
                status: 'in_progress'
            };

            this.pendingOperations.set(operation.id, operation);

            // Validate roles exist
            const roles = roleIds.map(roleId => guild.roles.cache.get(roleId))
                .filter(role => role !== undefined);

            if (roles.length !== roleIds.length) {
                throw new Error('Some roles not found');
            }

            // Process members in batches
            const batchSize = this.getSettings().maxBatchSize;
            const delay = this.getSettings().operationDelay;

            for (let i = 0; i < memberIds.length; i += batchSize) {
                const batch = memberIds.slice(i, i + batchSize);
                
                for (const memberId of batch) {
                    try {
                        const member = guild.members.cache.get(memberId);
                        if (!member) {
                            operation.failedMembers.push({
                                memberId: memberId,
                                reason: 'Member not found'
                            });
                            continue;
                        }

                        await member.roles.add(roles, reason);
                        operation.successfulMembers.push(memberId);
                        operation.processedMembers++;

                        // Small delay to avoid rate limits
                        if (delay > 0) {
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    } catch (error) {
                        operation.failedMembers.push({
                            memberId: memberId,
                            reason: error.message
                        });
                    }
                }
            }

            operation.status = 'completed';
            operation.completedAt = Date.now();

            this.logOperation(operation);
            this.pendingOperations.delete(operation.id);

            return {
                success: true,
                operationId: operation.id,
                processed: operation.processedMembers,
                failed: operation.failedMembers.length,
                details: operation
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async bulkRemoveRoles(guildId, memberIds, roleIds, reason = 'Bulk role removal') {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) throw new Error('Guild not found');

            const operation = {
                id: this.generateOperationId(),
                type: 'bulk_remove_roles',
                guildId: guildId,
                timestamp: Date.now(),
                reason: reason,
                totalMembers: memberIds.length,
                processedMembers: 0,
                failedMembers: [],
                successfulMembers: [],
                roleIds: roleIds,
                status: 'in_progress'
            };

            this.pendingOperations.set(operation.id, operation);

            const roles = roleIds.map(roleId => guild.roles.cache.get(roleId))
                .filter(role => role !== undefined);

            const batchSize = this.getSettings().maxBatchSize;
            const delay = this.getSettings().operationDelay;

            for (let i = 0; i < memberIds.length; i += batchSize) {
                const batch = memberIds.slice(i, i + batchSize);
                
                for (const memberId of batch) {
                    try {
                        const member = guild.members.cache.get(memberId);
                        if (!member) {
                            operation.failedMembers.push({
                                memberId: memberId,
                                reason: 'Member not found'
                            });
                            continue;
                        }

                        await member.roles.remove(roles, reason);
                        operation.successfulMembers.push(memberId);
                        operation.processedMembers++;

                        if (delay > 0) {
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    } catch (error) {
                        operation.failedMembers.push({
                            memberId: memberId,
                            reason: error.message
                        });
                    }
                }
            }

            operation.status = 'completed';
            operation.completedAt = Date.now();

            this.logOperation(operation);
            this.pendingOperations.delete(operation.id);

            return {
                success: true,
                operationId: operation.id,
                processed: operation.processedMembers,
                failed: operation.failedMembers.length,
                details: operation
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Bulk Moderation Operations
    async bulkKick(guildId, memberIds, reason = 'Bulk kick operation') {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) throw new Error('Guild not found');

            const operation = {
                id: this.generateOperationId(),
                type: 'bulk_kick',
                guildId: guildId,
                timestamp: Date.now(),
                reason: reason,
                totalMembers: memberIds.length,
                processedMembers: 0,
                failedMembers: [],
                successfulMembers: [],
                status: 'in_progress'
            };

            this.pendingOperations.set(operation.id, operation);

            const batchSize = this.getSettings().maxBatchSize;
            const delay = this.getSettings().operationDelay * 2; // Slower for moderation actions

            for (let i = 0; i < memberIds.length; i += batchSize) {
                const batch = memberIds.slice(i, i + batchSize);
                
                for (const memberId of batch) {
                    try {
                        const member = guild.members.cache.get(memberId);
                        if (!member) {
                            operation.failedMembers.push({
                                memberId: memberId,
                                reason: 'Member not found'
                            });
                            continue;
                        }

                        await member.kick(reason);
                        operation.successfulMembers.push(memberId);
                        operation.processedMembers++;

                        if (delay > 0) {
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    } catch (error) {
                        operation.failedMembers.push({
                            memberId: memberId,
                            reason: error.message
                        });
                    }
                }
            }

            operation.status = 'completed';
            operation.completedAt = Date.now();

            this.logOperation(operation);
            this.pendingOperations.delete(operation.id);

            return {
                success: true,
                operationId: operation.id,
                processed: operation.processedMembers,
                failed: operation.failedMembers.length,
                details: operation
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async bulkBan(guildId, memberIds, reason = 'Bulk ban operation', deleteMessageDays = 0) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) throw new Error('Guild not found');

            const operation = {
                id: this.generateOperationId(),
                type: 'bulk_ban',
                guildId: guildId,
                timestamp: Date.now(),
                reason: reason,
                deleteMessageDays: deleteMessageDays,
                totalMembers: memberIds.length,
                processedMembers: 0,
                failedMembers: [],
                successfulMembers: [],
                status: 'in_progress'
            };

            this.pendingOperations.set(operation.id, operation);

            const batchSize = Math.min(this.getSettings().maxBatchSize, 50); // Lower limit for bans
            const delay = this.getSettings().operationDelay * 3; // Even slower for bans

            for (let i = 0; i < memberIds.length; i += batchSize) {
                const batch = memberIds.slice(i, i + batchSize);
                
                for (const memberId of batch) {
                    try {
                        await guild.members.ban(memberId, {
                            reason: reason,
                            days: deleteMessageDays
                        });
                        
                        operation.successfulMembers.push(memberId);
                        operation.processedMembers++;

                        if (delay > 0) {
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    } catch (error) {
                        operation.failedMembers.push({
                            memberId: memberId,
                            reason: error.message
                        });
                    }
                }
            }

            operation.status = 'completed';
            operation.completedAt = Date.now();

            this.logOperation(operation);
            this.pendingOperations.delete(operation.id);

            return {
                success: true,
                operationId: operation.id,
                processed: operation.processedMembers,
                failed: operation.failedMembers.length,
                details: operation
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Member Filtering and Selection
    filterMembers(guildId, criteria) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) throw new Error('Guild not found');

            let members = Array.from(guild.members.cache.values());

            // Apply filters
            if (criteria.hasRole) {
                members = members.filter(member => 
                    member.roles.cache.has(criteria.hasRole)
                );
            }

            if (criteria.missingRole) {
                members = members.filter(member => 
                    !member.roles.cache.has(criteria.missingRole)
                );
            }

            if (criteria.joinedBefore) {
                const beforeDate = new Date(criteria.joinedBefore).getTime();
                members = members.filter(member => 
                    member.joinedTimestamp < beforeDate
                );
            }

            if (criteria.joinedAfter) {
                const afterDate = new Date(criteria.joinedAfter).getTime();
                members = members.filter(member => 
                    member.joinedTimestamp > afterDate
                );
            }

            if (criteria.isBot !== undefined) {
                members = members.filter(member => 
                    member.user.bot === criteria.isBot
                );
            }

            if (criteria.usernamePattern) {
                const regex = new RegExp(criteria.usernamePattern, 'i');
                members = members.filter(member => 
                    regex.test(member.user.username)
                );
            }

            if (criteria.status) {
                members = members.filter(member => 
                    member.presence?.status === criteria.status
                );
            }

            if (criteria.inactiveForDays) {
                const inactiveSince = Date.now() - (criteria.inactiveForDays * 24 * 60 * 60 * 1000);
                members = members.filter(member => {
                    const lastMessage = this.getLastMessageTime(member.id, guildId);
                    return lastMessage < inactiveSince;
                });
            }

            return {
                success: true,
                members: members.map(member => ({
                    id: member.id,
                    username: member.user.username,
                    discriminator: member.user.discriminator,
                    nickname: member.nickname,
                    joinedAt: member.joinedTimestamp,
                    roles: member.roles.cache.map(role => ({
                        id: role.id,
                        name: role.name
                    })),
                    isBot: member.user.bot,
                    status: member.presence?.status
                })),
                count: members.length
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Member Groups Management
    createMemberGroup(guildId, groupName, memberIds, description = '') {
        const data = this.loadData();
        
        if (!data.memberGroups[guildId]) {
            data.memberGroups[guildId] = {};
        }

        const groupId = this.generateGroupId();
        data.memberGroups[guildId][groupId] = {
            id: groupId,
            name: groupName,
            description: description,
            memberIds: memberIds,
            createdAt: Date.now(),
            lastUpdated: Date.now(),
            memberCount: memberIds.length
        };

        this.saveData(data);

        return {
            success: true,
            groupId: groupId,
            group: data.memberGroups[guildId][groupId]
        };
    }

    getMemberGroups(guildId) {
        const data = this.loadData();
        const groups = data.memberGroups[guildId] || {};
        
        return {
            success: true,
            groups: Object.values(groups)
        };
    }

    updateMemberGroup(guildId, groupId, updates) {
        const data = this.loadData();
        
        if (!data.memberGroups[guildId] || !data.memberGroups[guildId][groupId]) {
            return { success: false, error: 'Group not found' };
        }

        const group = data.memberGroups[guildId][groupId];
        Object.assign(group, updates);
        group.lastUpdated = Date.now();
        group.memberCount = group.memberIds.length;

        this.saveData(data);

        return {
            success: true,
            group: group
        };
    }

    deleteMemberGroup(guildId, groupId) {
        const data = this.loadData();
        
        if (!data.memberGroups[guildId] || !data.memberGroups[guildId][groupId]) {
            return { success: false, error: 'Group not found' };
        }

        delete data.memberGroups[guildId][groupId];
        this.saveData(data);

        return { success: true };
    }

    // CSV Import/Export
    async importMembersFromCSV(guildId, csvData, operation = 'add_roles', roleIds = []) {
        try {
            const lines = csvData.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            const memberData = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const member = {};
                
                headers.forEach((header, index) => {
                    member[header] = values[index];
                });
                
                memberData.push(member);
            }

            // Extract member IDs or usernames
            const memberIds = memberData.map(member => 
                member.id || member.userId || member.username
            ).filter(id => id);

            // Perform the specified operation
            let result;
            switch (operation) {
                case 'add_roles':
                    result = await this.bulkAssignRoles(guildId, memberIds, roleIds, 'CSV Import - Role Assignment');
                    break;
                case 'remove_roles':
                    result = await this.bulkRemoveRoles(guildId, memberIds, roleIds, 'CSV Import - Role Removal');
                    break;
                case 'kick':
                    result = await this.bulkKick(guildId, memberIds, 'CSV Import - Bulk Kick');
                    break;
                default:
                    throw new Error('Invalid operation type');
            }

            return {
                success: true,
                imported: memberData.length,
                operation: result
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    exportMembersToCSV(guildId, memberIds = null) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) throw new Error('Guild not found');

            let members;
            if (memberIds) {
                members = memberIds.map(id => guild.members.cache.get(id))
                    .filter(member => member !== undefined);
            } else {
                members = Array.from(guild.members.cache.values());
            }

            const csvLines = [
                'ID,Username,Discriminator,Nickname,JoinedAt,Roles,IsBot,Status'
            ];

            members.forEach(member => {
                const roles = member.roles.cache
                    .filter(role => role.id !== guild.id) // Exclude @everyone
                    .map(role => role.name)
                    .join(';');

                csvLines.push([
                    member.id,
                    member.user.username,
                    member.user.discriminator,
                    member.nickname || '',
                    new Date(member.joinedTimestamp).toISOString(),
                    roles,
                    member.user.bot,
                    member.presence?.status || 'offline'
                ].join(','));
            });

            return {
                success: true,
                csv: csvLines.join('\n'),
                memberCount: members.length
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Operation History and Undo
    getOperationHistory(guildId = null, limit = 50) {
        const data = this.loadData();
        let history = data.operationHistory || [];

        if (guildId) {
            history = history.filter(op => op.guildId === guildId);
        }

        return history
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    async undoOperation(operationId) {
        const data = this.loadData();
        const operation = data.operationHistory.find(op => op.id === operationId);

        if (!operation) {
            return { success: false, error: 'Operation not found' };
        }

        const timeSinceOperation = Date.now() - operation.timestamp;
        if (timeSinceOperation > data.settings.undoTimeLimit) {
            return { success: false, error: 'Operation too old to undo' };
        }

        try {
            let undoResult;

            switch (operation.type) {
                case 'bulk_assign_roles':
                    undoResult = await this.bulkRemoveRoles(
                        operation.guildId,
                        operation.successfulMembers,
                        operation.roleIds,
                        `Undo operation ${operationId}`
                    );
                    break;
                
                case 'bulk_remove_roles':
                    undoResult = await this.bulkAssignRoles(
                        operation.guildId,
                        operation.successfulMembers,
                        operation.roleIds,
                        `Undo operation ${operationId}`
                    );
                    break;
                
                default:
                    return { success: false, error: 'Operation type cannot be undone' };
            }

            // Mark original operation as undone
            operation.undone = true;
            operation.undoneAt = Date.now();
            operation.undoOperationId = undoResult.operationId;

            this.saveData(data);

            return {
                success: true,
                undoResult: undoResult
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility methods
    generateOperationId() {
        return `op_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    generateGroupId() {
        return `grp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    logOperation(operation) {
        const data = this.loadData();
        data.operationHistory.unshift(operation);
        
        // Keep only recent operations
        data.operationHistory = data.operationHistory.slice(0, 1000);
        
        // Update statistics
        data.statistics.totalOperations++;
        data.statistics.totalMembersProcessed += operation.processedMembers;
        data.statistics.lastOperation = operation.timestamp;

        this.saveData(data);
    }

    getLastMessageTime(userId, guildId) {
        // This would need to be integrated with your message tracking system
        // For now, return a default value
        return Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    }

    getSettings() {
        const data = this.loadData();
        return data.settings;
    }

    updateSettings(newSettings) {
        const data = this.loadData();
        data.settings = { ...data.settings, ...newSettings };
        this.saveData(data);
        return data.settings;
    }

    getStatistics(guildId = null) {
        const data = this.loadData();
        let operations = data.operationHistory || [];

        if (guildId) {
            operations = operations.filter(op => op.guildId === guildId);
        }

        const now = Date.now();
        const last24h = operations.filter(op => (now - op.timestamp) < 86400000);
        const last7d = operations.filter(op => (now - op.timestamp) < 604800000);

        return {
            total: {
                operations: operations.length,
                membersProcessed: operations.reduce((sum, op) => sum + op.processedMembers, 0)
            },
            last24Hours: {
                operations: last24h.length,
                membersProcessed: last24h.reduce((sum, op) => sum + op.processedMembers, 0)
            },
            last7Days: {
                operations: last7d.length,
                membersProcessed: last7d.reduce((sum, op) => sum + op.processedMembers, 0)
            },
            operationTypes: this.getOperationTypeStats(operations),
            pendingOperations: this.pendingOperations.size
        };
    }

    getOperationTypeStats(operations) {
        const types = {};
        operations.forEach(op => {
            if (!types[op.type]) {
                types[op.type] = { count: 0, membersProcessed: 0 };
            }
            types[op.type].count++;
            types[op.type].membersProcessed += op.processedMembers;
        });
        return types;
    }
}

module.exports = MassMemberManagementAPI;
