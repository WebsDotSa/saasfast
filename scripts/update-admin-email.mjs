/**
 * سكريبت تحديث بريد المستخدم إلى admin@saasfa.st
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const ADMIN_EMAIL = 'admin@saasfa.st';
const ADMIN_PASSWORD = 'Mm12345132';
const ADMIN_NAME = 'Super Admin';
const USER_ID = 'bb2aea01-2287-4fd7-a644-2b5af2b1feff';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔧 Updating Admin Email...\n');

  try {
    // Step 1: Update user email and password
    console.log('Step 1: Updating user email and password...');
    const { data, error } = await supabase.auth.admin.updateUserById(USER_ID, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: ADMIN_NAME,
        is_super_admin: true,
        role: 'super_admin',
        email: ADMIN_EMAIL,
      },
      app_metadata: {
        is_super_admin: true,
        role: 'super_admin',
      },
    });

    if (error) {
      console.error('❌ Error updating user:', error.message);
      console.error('Status:', error.status);
      console.error('Code:', error.code);
      process.exit(1);
    }

    console.log('✅ User updated successfully');
    console.log(`   New Email: ${data.user.email}`);
    console.log(`   ID: ${data.user.id}`);

    // Step 2: Update user profile
    console.log('\nStep 2: Updating user profile...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        email: ADMIN_EMAIL,
        full_name: ADMIN_NAME,
        role: 'super_admin',
      })
      .eq('user_id', USER_ID);

    if (profileError) {
      console.error('❌ Error updating profile:', profileError.message);
    } else {
      console.log('✅ User profile updated');
    }

    // Step 3: Verify authentication
    console.log('\nStep 3: Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (authError) {
      console.error('❌ Authentication test failed:');
      console.error(`   Error: ${authError.message}`);
    } else {
      console.log('✅ Authentication successful!');
      console.log(`   User ID: ${authData.user.id}`);
      console.log(`   Email: ${authData.user.email}`);
    }

    // Final summary
    console.log('\n═══════════════════════════════════════');
    console.log('✅ Admin Account Updated Successfully!');
    console.log('───────────────────────────────────────');
    console.log(`📧 Email:       ${ADMIN_EMAIL}`);
    console.log(`🔑 Password:    ${ADMIN_PASSWORD}`);
    console.log(`🌐 Dashboard:   http://localhost:3000/admin`);
    console.log(`🔐 Sign In:     http://localhost:3000/auth/signin`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
