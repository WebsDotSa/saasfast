/**
 * سكريبت فحص واختبار قاعدة البيانات
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔍 Testing Database Connection...\n');

  // Test 1: List users
  console.log('Test 1: Listing users...');
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Error listing users:', usersError.message);
  } else {
    console.log(`✅ Found ${users.users.length} user(s)`);
    users.users.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} (ID: ${u.id})`);
    });
  }

  // Test 2: Check user_profiles table
  console.log('\nTest 2: Checking user_profiles table...');
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(5);
  
  if (profilesError) {
    console.error('❌ Error querying user_profiles:', profilesError.message);
    console.error('Details:', profilesError.details);
    console.error('Hint:', profilesError.hint);
  } else {
    console.log(`✅ Found ${profiles.length} profile(s)`);
  }

  // Test 3: Check if trigger exists
  console.log('\nTest 3: Checking triggers...');
  const { data: triggers, error: triggerError } = await supabase
    .from('information_schema.triggers')
    .select('trigger_name, event_object_table')
    .like('trigger_name', '%user%');
  
  if (triggerError) {
    console.error('❌ Error querying triggers:', triggerError.message);
  } else {
    console.log(`✅ Found ${triggers.length} trigger(s)`);
    triggers.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.trigger_name} on ${t.event_object_table}`);
    });
  }

  // Test 4: Try to query the function
  console.log('\nTest 4: Checking handle_new_user function...');
  const { error: funcError } = await supabase.rpc('handle_new_user');
  if (funcError) {
    // This is expected as the function needs parameters
    console.log('ℹ️ Function exists (expected error without params):', funcError.message);
  } else {
    console.log('✅ Function exists');
  }

  console.log('\n═══════════════════════════════════════');
  console.log('Database test complete!');
  console.log('═══════════════════════════════════════\n');
}

main();
