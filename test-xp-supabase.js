// Test-Script für XP-System Supabase Verbindung
// Dieses Script testet:
// 1. Supabase-Verbindung
// 2. Ob die xp_users Tabelle existiert
// 3. Ob Daten eingefügt werden können

require('dotenv').config();

async function testSupabaseXP() {
    console.log('🧪 Teste XP-System Supabase-Verbindung...\n');
    
    // 1. Environment Variables prüfen
    console.log('1️⃣ Environment Variables:');
    console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ gesetzt' : '❌ nicht gesetzt'}`);
    console.log(`   SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? '✅ gesetzt' : '❌ nicht gesetzt'}`);
    console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ gesetzt' : '❌ nicht gesetzt'}\n`);
    
    if (!process.env.SUPABASE_URL) {
        console.log('❌ SUPABASE_URL nicht gesetzt. Teste mit JSON-Fallback.\n');
        return false;
    }
    
    try {
        // 2. Supabase Client initialisieren
        console.log('2️⃣ Initialisiere Supabase Client...');
        const { createClient } = require('@supabase/supabase-js');
        
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
        const keyType = process.env.SUPABASE_SERVICE_KEY ? 'SERVICE_ROLE' : 'ANON_KEY';
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        console.log(`   ✅ Supabase Client erstellt (${keyType})\n`);
        
        // 3. Verbindung testen (prüfe alle XP-Tabellen)
        console.log('3️⃣ Teste Supabase-Verbindung...');
        
        // Teste xp_users Tabelle
        const { data: usersTest, error: usersError } = await supabase
            .from('xp_users')
            .select('count', { count: 'exact', head: true });
            
        // Teste xp_settings Tabelle
        const { data: settingsTest, error: settingsError } = await supabase
            .from('xp_settings')
            .select('count', { count: 'exact', head: true });
            
        // Teste xp_level_roles Tabelle
        const { data: rolesTest, error: rolesError } = await supabase
            .from('xp_level_roles')
            .select('count', { count: 'exact', head: true });
            
        // Teste xp_milestone_rewards Tabelle
        const { data: milestonesTest, error: milestonesError } = await supabase
            .from('xp_milestone_rewards')
            .select('count', { count: 'exact', head: true });
            
        if (usersError && usersError.code === '42P01') {
            console.log('   ⚠️ Tabelle "xp_users" existiert nicht');
            console.log('   📝 Führe die SQL-Migration aus: xp_users_supabase_migration.sql\n');
            return false;
        }
        
        if (settingsError && settingsError.code === '42P01') {
            console.log('   ⚠️ Tabelle "xp_settings" existiert nicht');
            console.log('   📝 Führe die SQL-Migration aus: xp_settings_supabase_migration.sql\n');
            return false;
        }
        
        if (rolesError && rolesError.code === '42P01') {
            console.log('   ⚠️ Tabelle "xp_level_roles" existiert nicht');
            console.log('   📝 Führe die SQL-Migration aus: xp_settings_supabase_migration.sql\n');
            return false;
        }
        
        if (milestonesError && milestonesError.code === '42P01') {
            console.log('   ⚠️ Tabelle "xp_milestone_rewards" existiert nicht');
            console.log('   📝 Führe die SQL-Migration aus: xp_settings_supabase_migration.sql\n');
            return false;
        }
        
        console.log(`   ✅ Verbindung erfolgreich:`);
        console.log(`     - xp_users: ${usersTest?.count || 0} Einträge`);
        console.log(`     - xp_settings: ${settingsTest?.count || 0} Einträge`);
        console.log(`     - xp_level_roles: ${rolesTest?.count || 0} Einträge`);
        console.log(`     - xp_milestone_rewards: ${milestonesTest?.count || 0} Einträge\n`);
        
        // 4. Test-Daten einfügen
        console.log('4️⃣ Teste Daten-Einfügung...');
        const testUserId = 'test_user_' + Date.now();
        const testGuildId = '1325050102477488169'; // Hauptserver
        
        const testUserData = {
            guild_id: testGuildId,
            user_id: testUserId,
            xp: 100,
            level: 2,
            total_xp: 250,
            message_count: 5,
            voice_time: 15.5,
            last_message: Date.now(),
            voice_join_time: 0,
            username: 'TestUser',
            avatar: null
        };
        
        const { data: insertData, error: insertError } = await supabase
            .from('xp_users')
            .upsert([testUserData], {
                onConflict: 'guild_id,user_id'
            })
            .select();
            
        if (insertError) throw insertError;
        
        console.log('   ✅ Test-Daten erfolgreich eingefügt');
        console.log(`   📊 Eingefügte Daten:`, insertData[0]);
        
        // 5. Test-Daten wieder löschen
        console.log('\n5️⃣ Räume Test-Daten auf...');
        const { error: deleteError } = await supabase
            .from('xp_users')
            .delete()
            .eq('user_id', testUserId);
            
        if (deleteError) throw deleteError;
        console.log('   ✅ Test-Daten gelöscht\n');
        
        console.log('🎉 Alle Tests erfolgreich! XP-System kann Supabase verwenden.\n');
        return true;
        
    } catch (error) {
        console.error('❌ Fehler beim Supabase-Test:', error);
        console.log('\n📄 Fallback zu JSON-System wird verwendet.\n');
        return false;
    }
}

// Script direkt ausführen wenn aufgerufen
if (require.main === module) {
    testSupabaseXP().then(success => {
        if (success) {
            console.log('✅ Supabase XP-System bereit');
            process.exit(0);
        } else {
            console.log('⚠️ JSON-Fallback wird verwendet');
            process.exit(1);
        }
    });
}

module.exports = { testSupabaseXP }; 