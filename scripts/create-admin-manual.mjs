/**
 * سكريبت إنشاء حساب Admin - الطريقة اليدوية
 * الاستخدام: node scripts/create-admin-manual.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const ADMIN_EMAIL = 'admin@saasfa.st';
const ADMIN_PASSWORD = 'Mm12345132';
const ADMIN_NAME = 'Super Admin';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔧 Creating Admin Account (Manual Method)...\n');

  try {
    // Step 1: List existing users to check if admin exists
    console.log('Step 1: Checking for existing admin user...');
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      process.exit(1);
    }

    const existingUser = listData?.users?.find((u) => u.email === ADMIN_EMAIL);

    let userId;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`✅ Admin user exists: ${userId}`);
      
      // Update password
      console.log('📝 Updating password...');
      const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: ADMIN_NAME,
          is_super_admin: true,
        },
        app_metadata: {
          is_super_admin: true,
          role: 'super_admin',
        },
      });
      
      if (updateErr) {
        console.error('⚠️ Warning updating user:', updateErr.message);
      } else {
        console.log('✅ Password and metadata updated');
      }
    } else {
      console.log('❌ Admin user does not exist and cannot be created via Auth API');
      console.log('💡 Trying to use existing user as template...\n');
      
      // Show existing users
      console.log('Existing users in the system:');
      listData.users.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.email} (ID: ${u.id})`);
      });
      
      console.log('\n💡 Since we cannot create new users via Auth API due to database constraints,');
      console.log('   please use one of the existing users or create the user via Supabase Dashboard.\n');
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('Alternative: Create admin via Supabase Dashboard');
      console.log('───────────────────────────────────────────────────────────');
      console.log('1. Go to: https://ofgwcinsbkyledtfuhng.supabase.co');
      console.log('2. Navigate to: Authentication → Users');
      console.log('3. Click "Add user" → "Create new user"');
      console.log('4. Enter these details:');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log('5. Check "Auto Confirm User"');
      console.log('6. In User Metadata, add:');
      console.log('   { "full_name": "Super Admin", "is_super_admin": true }');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      return;
    }

    // Step 2: Manually create user profile
    console.log('\nStep 2: Creating user profile...');
    
    // First, try to insert directly
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        email: ADMIN_EMAIL,
        full_name: ADMIN_NAME,
        role: 'super_admin',
      })
      .select()
      .single();

    if (profileError) {
      // Check if it's a conflict (profile already exists)
      if (profileError.code === '23505') { // Unique violation
        console.log('ℹ️ Profile already exists, updating...');
        
        const { data: updateData, error: updateError } = await supabase
          .from('user_profiles')
          .update({
            email: ADMIN_EMAIL,
            full_name: ADMIN_NAME,
            role: 'super_admin',
          })
          .eq('user_id', userId)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Error updating profile:', updateError.message);
        } else {
          console.log('✅ Profile updated successfully');
        }
      } else {
        console.error('❌ Error creating profile:', profileError.message);
        console.error('Details:', profileError.details);
        console.error('Hint:', profileError.hint);
      }
    } else {
      console.log('✅ Profile created successfully');
    }

    // Step 3: Verify the setup
    console.log('\nStep 3: Verifying admin account...');
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
    console.log('🎉 Admin Account Ready!');
    console.log('───────────────────────────────────────');
    console.log(`📧 Email:       ${ADMIN_EMAIL}`);
    console.log(`🔑 Password:    ${ADMIN_PASSWORD}`);
    console.log(`🌐 Dashboard:   http://localhost:3000/admin`);
    console.log(`🔐 Sign In:     http://localhost:3000/auth/signin`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
