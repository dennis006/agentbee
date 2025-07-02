// =============================================
// GIVEAWAY SYSTEM MIGRATION TO SUPABASE
// =============================================
// Script um bestehende JSON-Daten zu Supabase zu migrieren
// Datum: 2025-01-16
// Version: 1.0

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseAPI = require('./giveaway-supabase-api');

async function migrateGiveawaySystem() {
    console.log('🚀 Starting Giveaway System Migration to Supabase...');
    console.log('=' .repeat(60));

    try {
        // Initialize Supabase
        const supabaseInitialized = await supabaseAPI.initializeSupabase();
        if (!supabaseInitialized) {
            throw new Error('Supabase initialization failed');
        }

        // Load existing data
        const dataFile = path.join(__dirname, 'giveaway-data.json');
        const settingsFile = path.join(__dirname, 'giveaway-settings.json');

        let migrationData = {
            settings: null,
            giveaways: [],
            inviteTracking: {},
            inviteCodeTracking: {},
            userInvites: {},
            invitedUsers: {}
        };

        // Load main data file
        if (fs.existsSync(dataFile)) {
            console.log('📂 Loading existing giveaway-data.json...');
            const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
            migrationData = { ...migrationData, ...data };
            console.log(`✅ Loaded data with ${data.giveaways?.length || 0} giveaway(s)`);
        } else {
            console.log('ℹ️ No giveaway-data.json found');
        }

        // Load settings file
        if (fs.existsSync(settingsFile)) {
            console.log('📂 Loading existing giveaway-settings.json...');
            const settingsData = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
            migrationData.settings = settingsData;
            console.log('✅ Settings loaded');
        } else {
            console.log('ℹ️ No giveaway-settings.json found');
        }

        // Create backup
        console.log('\n📦 Creating backup of original files...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        if (fs.existsSync(dataFile)) {
            const backupDataFile = `giveaway-data.json.backup-${timestamp}`;
            fs.copyFileSync(dataFile, backupDataFile);
            console.log(`✅ Backup created: ${backupDataFile}`);
        }
        
        if (fs.existsSync(settingsFile)) {
            const backupSettingsFile = `giveaway-settings.json.backup-${timestamp}`;
            fs.copyFileSync(settingsFile, backupSettingsFile);
            console.log(`✅ Backup created: ${backupSettingsFile}`);
        }

        // Migrate settings
        console.log('\n⚙️ Migrating settings...');
        if (migrationData.settings) {
            try {
                await supabaseAPI.updateSettings(migrationData.settings);
                console.log('✅ Settings migrated successfully');
            } catch (error) {
                console.error('❌ Error migrating settings:', error.message);
            }
        } else {
            console.log('ℹ️ No settings to migrate');
        }

        // Migrate giveaways
        console.log('\n🎉 Migrating giveaways...');
        let giveawayCount = 0;
        if (migrationData.giveaways && migrationData.giveaways.length > 0) {
            for (const giveaway of migrationData.giveaways) {
                try {
                    // Convert participants Set to Array if needed
                    if (giveaway.participants && typeof giveaway.participants !== 'object') {
                        giveaway.participants = Array.from(giveaway.participants);
                    }
                    
                    await supabaseAPI.createGiveaway(giveaway);
                    
                    // Migrate participants
                    if (giveaway.participants && giveaway.participants.length > 0) {
                        for (const participantId of giveaway.participants) {
                            try {
                                await supabaseAPI.addParticipant(giveaway.id, participantId, `User_${participantId}`);
                            } catch (error) {
                                // Ignore duplicate participant errors
                                if (!error.message.includes('already participating')) {
                                    console.warn(`⚠️ Error adding participant ${participantId}:`, error.message);
                                }
                            }
                        }
                    }
                    
                    console.log(`✅ Migrated giveaway: ${giveaway.title} (${giveaway.participants?.length || 0} participants)`);
                    giveawayCount++;
                } catch (error) {
                    console.error(`❌ Error migrating giveaway ${giveaway.title}:`, error.message);
                }
            }
        } else {
            console.log('ℹ️ No giveaways to migrate');
        }

        // Migrate invite tracking
        console.log('\n📨 Migrating invite tracking...');
        let inviteTrackingCount = 0;
        if (migrationData.inviteTracking && Object.keys(migrationData.inviteTracking).length > 0) {
            for (const [userId, trackingData] of Object.entries(migrationData.inviteTracking)) {
                try {
                    await supabaseAPI.updateInviteTracking(userId, trackingData);
                    console.log(`✅ Migrated invite tracking for user: ${userId}`);
                    inviteTrackingCount++;
                } catch (error) {
                    console.error(`❌ Error migrating invite tracking for ${userId}:`, error.message);
                }
            }
        } else {
            console.log('ℹ️ No invite tracking to migrate');
        }

        // Migrate invite codes
        console.log('\n🔗 Migrating invite codes...');
        let inviteCodeCount = 0;
        if (migrationData.inviteCodeTracking && Object.keys(migrationData.inviteCodeTracking).length > 0) {
            for (const [code, codeData] of Object.entries(migrationData.inviteCodeTracking)) {
                try {
                    await supabaseAPI.createInviteCode({
                        code: code,
                        userId: codeData.userId,
                        giveawayId: codeData.giveawayId,
                        uses: codeData.uses || 0,
                        maxUses: 100,
                        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days from now
                    });
                    console.log(`✅ Migrated invite code: ${code}`);
                    inviteCodeCount++;
                } catch (error) {
                    console.error(`❌ Error migrating invite code ${code}:`, error.message);
                }
            }
        } else {
            console.log('ℹ️ No invite codes to migrate');
        }

        // Migrate user invites
        console.log('\n👥 Migrating user invites...');
        let userInviteCount = 0;
        if (migrationData.userInvites && Object.keys(migrationData.userInvites).length > 0) {
            for (const [giveawayId, userInviteMap] of Object.entries(migrationData.userInvites)) {
                for (const [userId, inviteCount] of Object.entries(userInviteMap)) {
                    try {
                        await supabaseAPI.updateUserInvites(giveawayId, userId, inviteCount);
                        console.log(`✅ Migrated user invites: ${userId} -> ${giveawayId} (${inviteCount} invites)`);
                        userInviteCount++;
                    } catch (error) {
                        console.error(`❌ Error migrating user invites for ${userId}:`, error.message);
                    }
                }
            }
        } else {
            console.log('ℹ️ No user invites to migrate');
        }

        // Migrate invited users tracking
        console.log('\n🔄 Migrating invited users tracking...');
        let invitedUserCount = 0;
        if (migrationData.invitedUsers && Object.keys(migrationData.invitedUsers).length > 0) {
            for (const [giveawayId, inviterMap] of Object.entries(migrationData.invitedUsers)) {
                for (const [inviterId, invitedArray] of Object.entries(inviterMap)) {
                    for (const invitedId of invitedArray) {
                        try {
                            await supabaseAPI.addInvitedUser(giveawayId, inviterId, invitedId, `User_${invitedId}`);
                            invitedUserCount++;
                        } catch (error) {
                            // Ignore duplicate entries
                            if (!error.message.includes('already invited')) {
                                console.warn(`⚠️ Error migrating invited user ${invitedId}:`, error.message);
                            }
                        }
                    }
                }
            }
            console.log(`✅ Migrated ${invitedUserCount} invited user tracking entries`);
        } else {
            console.log('ℹ️ No invited users tracking to migrate');
        }

        // Migration summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Settings: ${migrationData.settings ? 'Migrated' : 'None'}`);
        console.log(`✅ Giveaways: ${giveawayCount} migrated`);
        console.log(`✅ Invite Tracking: ${inviteTrackingCount} users migrated`);
        console.log(`✅ Invite Codes: ${inviteCodeCount} codes migrated`);
        console.log(`✅ User Invites: ${userInviteCount} entries migrated`);
        console.log(`✅ Invited Users: ${invitedUserCount} tracking entries migrated`);
        console.log('='.repeat(60));
        console.log('🎉 Migration completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Test the Giveaway System with Supabase');
        console.log('2. Verify all data is correctly migrated');
        console.log('3. If everything works, you can remove the .backup files');
        console.log('4. Update your deployment to use Supabase');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error('Stack trace:', error.stack);
        console.log('\n🔄 The original files remain unchanged.');
        console.log('💡 Please check the error above and try again.');
        process.exit(1);
    }
}

// Run migration if called directly
if (require.main === module) {
    migrateGiveawaySystem()
        .then(() => {
            console.log('\n✅ Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateGiveawaySystem }; 