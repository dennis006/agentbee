/**
 * Migration Script: XP System von JSON zu Supabase
 * 
 * Dieses Skript migriert alle bestehenden XP-Daten von JSON-Dateien zu Supabase.
 * Es sollte nur einmal nach der Einrichtung der Supabase-Tabellen ausgeführt werden.
 * 
 * Usage: node migrate_xp_to_supabase.js
 */

const fs = require('fs');
const path = require('path');
const XPSupabaseAPI = require('./xp-supabase-api');

async function migrateXPData() {
    console.log('🔄 Starting XP data migration from JSON to Supabase...');
    
    const supabaseAPI = new XPSupabaseAPI();
    
    if (!supabaseAPI.initialized) {
        console.error('❌ Supabase API not initialized. Please check your environment variables.');
        process.exit(1);
    }

    try {
        // 1. Migrate Settings
        console.log('\n📋 Migrating XP settings...');
        if (fs.existsSync('./xp-settings.json')) {
            const settingsData = JSON.parse(fs.readFileSync('./xp-settings.json', 'utf8'));
            await supabaseAPI.updateSettings(settingsData);
            
            // Migrate channel blacklists if they exist
            if (settingsData.channels && settingsData.channels.xpBlacklist && settingsData.channels.voiceBlacklist) {
                await supabaseAPI.updateChannelBlacklists(
                    settingsData.channels.xpBlacklist,
                    settingsData.channels.voiceBlacklist
                );
            }
            
            // Migrate level roles if they exist
            if (settingsData.rewards && settingsData.rewards.levelRoles) {
                for (const role of settingsData.rewards.levelRoles) {
                    try {
                        await supabaseAPI.addLevelRole(role.level, role.roleId, role.roleName);
                    } catch (error) {
                        if (!error.message.includes('duplicate')) {
                            console.warn(`⚠️ Could not migrate level role: ${role.roleName} (Level ${role.level})`);
                        }
                    }
                }
            }
            
            // Migrate milestone rewards if they exist
            if (settingsData.rewards && settingsData.rewards.milestoneRewards) {
                for (const milestone of settingsData.rewards.milestoneRewards) {
                    try {
                        await supabaseAPI.addMilestoneReward(milestone.xp, milestone.reward);
                    } catch (error) {
                        if (!error.message.includes('duplicate')) {
                            console.warn(`⚠️ Could not migrate milestone: ${milestone.reward} (${milestone.xp} XP)`);
                        }
                    }
                }
            }
            
            console.log('✅ Settings migration completed');
        } else {
            console.log('⚠️ No xp-settings.json found, using defaults');
        }

        // 2. Migrate User Data
        console.log('\n👥 Migrating user XP data...');
        if (fs.existsSync('./xp-data.json')) {
            const userData = JSON.parse(fs.readFileSync('./xp-data.json', 'utf8'));
            
            let migratedUsers = 0;
            for (const user of userData) {
                try {
                    const userDataToMigrate = {
                        xp: user.xp || 0,
                        level: user.level || 1,
                        totalXP: user.totalXP || user.xp || 0,
                        messageCount: user.messageCount || 0,
                        voiceTime: user.voiceTime || 0,
                        lastMessage: user.lastMessage || 0,
                        lastVoiceXP: user.lastVoiceXP || 0,
                        voiceJoinTime: user.voiceJoinTime || 0,
                        username: user.username || 'Unknown',
                        avatar: user.avatar || null
                    };
                    
                    await supabaseAPI.updateUser(user.userId, userDataToMigrate);
                    migratedUsers++;
                    
                    if (migratedUsers % 10 === 0) {
                        console.log(`   Migrated ${migratedUsers} users...`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Could not migrate user ${user.userId}: ${error.message}`);
                }
            }
            
            console.log(`✅ User data migration completed: ${migratedUsers}/${userData.length} users migrated`);
        } else {
            console.log('⚠️ No xp-data.json found');
        }

        // 3. Verify Migration
        console.log('\n🔍 Verifying migration...');
        const migratedSettings = await supabaseAPI.getSettings();
        const migratedUsers = await supabaseAPI.getAllUsers();
        const levelRoles = await supabaseAPI.getLevelRoles();
        const milestoneRewards = await supabaseAPI.getMilestoneRewards();
        const blacklists = await supabaseAPI.getChannelBlacklists();
        
        console.log(`✅ Verification completed:`);
        console.log(`   - Settings: ${migratedSettings ? 'OK' : 'FAILED'}`);
        console.log(`   - Users: ${migratedUsers.length}`);
        console.log(`   - Level Roles: ${levelRoles.length}`);
        console.log(`   - Milestone Rewards: ${milestoneRewards.length}`);
        console.log(`   - XP Blacklist Channels: ${blacklists.xpBlacklist.length}`);
        console.log(`   - Voice Blacklist Channels: ${blacklists.voiceBlacklist.length}`);

        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('   1. Restart your Discord bot to use the new Supabase backend');
        console.log('   2. Test the XP system to ensure everything works correctly');
        console.log('   3. After verification, you can safely delete the JSON files:');
        console.log('      - xp-data.json');
        console.log('      - xp-settings.json');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Check your Supabase credentials in environment variables');
        console.log('   2. Ensure the Supabase tables are created (run the SQL migration first)');
        console.log('   3. Check network connectivity to Supabase');
        process.exit(1);
    }
}

// Backup existing JSON files before migration
function createBackups() {
    console.log('📁 Creating backups of JSON files...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (fs.existsSync('./xp-data.json')) {
        const backupPath = `./backup/xp-data-backup-${timestamp}.json`;
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        fs.copyFileSync('./xp-data.json', backupPath);
        console.log(`✅ Backed up xp-data.json to ${backupPath}`);
    }
    
    if (fs.existsSync('./xp-settings.json')) {
        const backupPath = `./backup/xp-settings-backup-${timestamp}.json`;
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        fs.copyFileSync('./xp-settings.json', backupPath);
        console.log(`✅ Backed up xp-settings.json to ${backupPath}`);
    }
}

// Main migration function
async function main() {
    console.log('🚀 XP System Migration to Supabase');
    console.log('=====================================\n');
    
    // Check if Supabase environment variables are set
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.error('❌ Missing Supabase environment variables!');
        console.log('Please set the following environment variables:');
        console.log('   - SUPABASE_URL');
        console.log('   - SUPABASE_ANON_KEY');
        process.exit(1);
    }
    
    // Check if JSON files exist
    const hasData = fs.existsSync('./xp-data.json');
    const hasSettings = fs.existsSync('./xp-settings.json');
    
    if (!hasData && !hasSettings) {
        console.log('⚠️ No JSON files found. Nothing to migrate.');
        console.log('If this is a fresh installation, you can skip this migration.');
        process.exit(0);
    }
    
    // Create backups
    createBackups();
    
    // Start migration
    await migrateXPData();
}

// Run migration if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Migration script crashed:', error);
        process.exit(1);
    });
}

module.exports = { migrateXPData, createBackups }; 