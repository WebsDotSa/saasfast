/**
 * سكريبت إنشاء حساب Admin للمنصة
 * الاستخدام: node scripts/create-admin.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const ADMIN_EMAIL = 'admin@saasfa.st';
const ADMIN_PASSWORD = 'Mm12345132';
const ADMIN_NAME = 'Super Admin';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🔧 إنشاء حساب Admin للمنصة...\n');

  try {
    // 1) Check if user exists
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
    }

    const existingUser = listData?.users?.find((u) => u.email === ADMIN_EMAIL);

    let userId;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`✅ User exists: ${userId}`);

      // Update password and metadata
      const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: ADMIN_NAME,
          is_super_admin: true,
        },
      });

      if (updateErr) {
        console.warn('⚠️ Warning updating user:', updateErr.message);
      } else {
        console.log('✅ User updated successfully');
      }
    } else {
      // Create new user
      console.log('📝 Creating new user...');
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: ADMIN_NAME,
          is_super_admin: true,
        },
      });

      if (createErr) {
        console.error('❌ Failed to create user:', createErr.message);
        console.error('Error details:', JSON.stringify(createErr, null, 2));
        process.exit(1);
      }

      userId = created.user.id;
      console.log(`✅ User created successfully: ${userId}`);
    }

    // 2) Create/update user_profiles with super_admin role
    console.log('\n📋 Setting up user profile...');
    
    const { data: profileData, error: profileErr } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        email: ADMIN_EMAIL,
        full_name: ADMIN_NAME,
        role: 'super_admin',
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });

    if (profileErr) {
      console.error('❌ Error setting up user profile:', profileErr.message);
      console.error('Error details:', JSON.stringify(profileErr, null, 2));
    } else {
      console.log('✅ User profile set with role = super_admin');
    }

    // 3) Verify the setup
    console.log('\n🔍 Verifying setup...');
    const { data: verification } = await supabase
      .from('user_profiles')
      .select('user_id, email, role, full_name')
      .eq('user_id', userId)
      .single();

    if (verification) {
      console.log('✅ Verification successful:');
      console.log(`   - User ID: ${verification.user_id}`);
      console.log(`   - Email: ${verification.email}`);
      console.log(`   - Role: ${verification.role}`);
      console.log(`   - Name: ${verification.full_name}`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Admin Account Ready!');
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
