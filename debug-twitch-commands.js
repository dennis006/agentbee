// Debug Script für Twitch Custom Commands & Live Messages
// Führe dieses Script aus um die Probleme zu diagnostizieren

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function debugTwitchSystem() {
    console.log('🔍 [DEBUG] Starting Twitch System Debug...\n');

    // 1. Supabase Connection Test
    console.log('1️⃣ Testing Supabase Connection...');
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        const { data, error } = await supabase.from('twitch_bot_commands').select('count').limit(1);
        
        if (error) {
            console.error('❌ Supabase Connection Failed:', error.message);
        } else {
            console.log('✅ Supabase Connection OK');
        }
    } catch (err) {
        console.error('❌ Supabase Error:', err.message);
    }

    // 2. Check if Migration ran
    console.log('\n2️⃣ Checking if twitch_bot_commands table exists...');
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        const { data, error } = await supabase
            .from('twitch_bot_commands')
            .select('*')
            .limit(5);
        
        if (error) {
            console.error('❌ Table does not exist or has error:', error.message);
            console.log('🔧 You need to run the migration script in Supabase SQL Editor!');
        } else {
            console.log(`✅ Table exists with ${data.length} commands`);
            console.log('📋 Commands found:');
            data.forEach(cmd => {
                console.log(`   - !${cmd.command_name}: "${cmd.response_text?.substring(0, 50)}..."`);
            });
        }
    } catch (err) {
        console.error('❌ Table Check Error:', err.message);
    }

    // 3. Check Bot Settings
    console.log('\n3️⃣ Checking Twitch Bot Settings...');
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        const { data, error } = await supabase
            .from('twitch_bot_settings')
            .select('*')
            .eq('guild_id', 'default')
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('❌ Bot Settings Error:', error.message);
        } else if (data) {
            console.log('✅ Bot Settings found:');
            console.log(`   - Bot Enabled: ${data.bot_enabled}`);
            console.log(`   - Bot Username: ${data.bot_username}`);
            console.log(`   - Live Notifications: ${data.live_notifications_enabled}`);
            console.log(`   - Live Message Cooldown: ${data.live_message_cooldown} minutes`);
            console.log(`   - OAuth Token: ${data.oauth_token ? 'SET' : 'NOT SET'}`);
        } else {
            console.log('⚠️ No bot settings found - default settings will be used');
        }
    } catch (err) {
        console.error('❌ Bot Settings Error:', err.message);
    }

    // 4. Check Bot Channels
    console.log('\n4️⃣ Checking Twitch Bot Channels...');
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        const { data, error } = await supabase
            .from('twitch_bot_channels')
            .select('*')
            .eq('guild_id', 'default')
            .eq('enabled', true);
        
        if (error) {
            console.error('❌ Bot Channels Error:', error.message);
        } else {
            console.log(`✅ Found ${data.length} enabled channels:`);
            data.forEach(channel => {
                console.log(`   - ${channel.channel_name}: Live Messages ${channel.live_message_enabled ? 'ENABLED' : 'DISABLED'}`);
            });
        }
    } catch (err) {
        console.error('❌ Bot Channels Error:', err.message);
    }

    // 5. Test Custom Command Creation
    console.log('\n5️⃣ Testing Custom Command Creation...');
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        
        // Test Discord Command
        const testCommand = {
            command_name: 'discord',
            response_text: 'Join our Discord: https://discord.gg/test 🎮',
            description: 'Discord Server Link',
            enabled: true,
            cooldown_seconds: 0,
            mod_only: false,
            vip_only: false,
            subscriber_only: false,
            category_id: 2,
            created_by: 'debug-script',
            channel_name: null
        };

        const { data: insertData, error: insertError } = await supabase
            .from('twitch_bot_commands')
            .upsert(testCommand, { onConflict: 'command_name,channel_name' })
            .select();

        if (insertError) {
            console.error('❌ Command Creation Failed:', insertError.message);
        } else {
            console.log('✅ Test command created/updated successfully');
            console.log(`   Command: !${insertData[0].command_name}`);
            console.log(`   Response: ${insertData[0].response_text}`);
        }
    } catch (err) {
        console.error('❌ Command Creation Error:', err.message);
    }

    console.log('\n🔍 [DEBUG] Debug completed!\n');
    
    console.log('📋 NEXT STEPS:');
    console.log('1. Run the migration script in Supabase SQL Editor if table missing');
    console.log('2. Check if Bot OAuth token is set');
    console.log('3. Ensure bot is connected and channels are configured');
    console.log('4. Set live message cooldown to 0 in dashboard');
    console.log('5. Test commands in Twitch chat');
}

debugTwitchSystem().catch(console.error); 