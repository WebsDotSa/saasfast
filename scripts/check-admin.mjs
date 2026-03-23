/**
 * سكريبت فحص حساب الـ Admin
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔍 Checking Admin Account Status...\n');

  // List all users
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Error:', listError.message);
    return;
  }

  console.log('All users in the system:');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  listData.users.forEach((user, i) => {
    console.log(`${i + 1}. ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email Confirmed: ${user.email_confirmed_at ? '✅' : '❌'}`);
    console.log(`   Created: ${user.created_at}`);
    console.log(`   Metadata: ${JSON.stringify(user.user_metadata, null, 2)}`);
    console.log(`   App Metadata: ${JSON.stringify(user.app_metadata, null, 2)}\n`);
  });

  // Check user profiles
  console.log('User Profiles:');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*');

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message);
  } else {
    profiles.forEach((profile, i) => {
      console.log(`${i + 1}. ${profile.email}`);
      console.log(`   User ID: ${profile.user_id}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Full Name: ${profile.full_name}\n`);
    });
  }

  // Test authentication
  console.log('\n🔐 Testing Authentication...\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const testEmail = 'admin@saasfa.st';
  const testPassword = 'Mm12345132';
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (authError) {
    console.error('❌ Authentication failed:');
    console.error(`   Error: ${authError.message}`);
    console.error(`   Status: ${authError.status}`);
    console.error(`   Code: ${authError.code}`);
  } else {
    console.log('✅ Authentication successful!');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);
    console.log(`   Session: ${authData.session ? 'Active' : 'None'}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main();
