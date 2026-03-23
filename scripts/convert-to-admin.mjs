/**
 * سكريبت تحويل مستخدم موجود إلى Super Admin
 * الاستخدام: node scripts/convert-to-admin.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const TARGET_EMAIL = 'webdotsa@gmail.com'; // Existing user
const ADMIN_EMAIL = 'admin@saasfa.st';
const ADMIN_PASSWORD = 'Mm12345132';
const ADMIN_NAME = 'Super Admin';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔧 Converting Existing User to Super Admin...\n');

  try {
    // Step 1: Find the existing user
    console.log('Step 1: Finding existing user...');
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      process.exit(1);
    }

    // Try to find admin@saasfa.st first
    let targetUser = listData.users.find((u) => u.email === ADMIN_EMAIL);
    
    if (!targetUser) {
      // Try to find the target email
      targetUser = listData.users.find((u) => u.email === TARGET_EMAIL);
    }

    if (!targetUser) {
      console.error('❌ No existing user found to convert');
      console.log('\nAvailable users:');
      listData.users.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.email} (ID: ${u.id})`);
      });
      process.exit(1);
    }

    const userId = targetUser.id;
    console.log(`✅ Found user: ${targetUser.email} (ID: ${userId})`);

    // Step 2: Update user password and metadata
    console.log('\nStep 2: Updating user credentials and metadata...');
    const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: ADMIN_NAME,
        is_super_admin: true,
        role: 'super_admin',
      },
      app_metadata: {
        is_super_admin: true,
        role: 'super_admin',
      },
    });

    if (updateErr) {
      console.error('❌ Error updating user:', updateErr.message);
      process.exit(1);
    }
    console.log('✅ User credentials updated');

    // Step 3: Create/update user profile
    console.log('\nStep 3: Creating user profile...');
    const { error: profileErr } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        email: ADMIN_EMAIL,
        full_name: ADMIN_NAME,
        role: 'super_admin',
      }, { onConflict: 'user_id' });

    if (profileErr) {
      console.error('❌ Error creating profile:', profileErr.message);
    } else {
      console.log('✅ User profile created/updated');
    }

    // Step 4: Verify
    console.log('\nStep 4: Verifying admin account...');
    const { data: verification } = await supabase
      .from('user_profiles')
      .select('user_id, email, role, full_name')
      .eq('user_id', userId)
      .single();

    if (verification) {
      console.log('✅ Verification successful!');
      console.log(`   User ID: ${verification.user_id}`);
      console.log(`   Email: ${verification.email}`);
      console.log(`   Role: ${verification.role}`);
      console.log(`   Name: ${verification.full_name}`);
    }

    // Final summary
    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Super Admin Account Ready!');
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
