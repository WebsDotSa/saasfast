/**
 * سكريبت إنشاء حساب Admin للمنصة - طريقة بديلة
 * الاستخدام: node scripts/create-admin-simple.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const ADMIN_EMAIL = 'admin@saasfa.st';
const ADMIN_PASSWORD = 'Mm12345132';
const ADMIN_NAME = 'Super Admin';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔧 Creating Admin Account...\n');

  try {
    // First, try to sign up the user
    console.log('📝 Attempting to create user via signUp...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
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

    if (authError) {
      // Check if user already exists
      if (authError.message.includes('already been registered') || authError.message.includes('User already registered')) {
        console.log('✅ User already exists, fetching user...');
        
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingUser = listData?.users?.find((u) => u.email === ADMIN_EMAIL);
        
        if (existingUser) {
          console.log(`✅ Found existing user: ${existingUser.id}`);
          
          // Update the user
          const { error: updateErr } = await supabase.auth.admin.updateUserById(existingUser.id, {
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
          } else {
            console.log('✅ User updated successfully');
          }
          
          // Set up profile
          await setupUserProfile(existingUser.id);
          return;
        }
      }
      
      console.error('❌ Failed to create user:', authError.message);
      console.error('Status:', authError.status);
      console.error('Code:', authError.code);
      process.exit(1);
    }

    const userId = authData.user.id;
    console.log(`✅ User created successfully: ${userId}`);
    console.log(`   Email: ${authData.user.email}`);
    console.log(`   Email Confirmed: ${authData.user.email_confirmed_at}`);
    
    // Set up user profile
    await setupUserProfile(userId);

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

async function setupUserProfile(userId) {
  console.log('\n📋 Setting up user profile...');
  
  // Try using RPC call if the table has issues
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userId,
      email: ADMIN_EMAIL,
      full_name: ADMIN_NAME,
      role: 'super_admin',
    }, { 
      onConflict: 'user_id',
    });

  if (error) {
    console.error('❌ Error creating profile:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
    
    // Try direct SQL via RPC
    console.log('\n📝 Trying alternative method...');
    const { error: rpcError } = await supabase.rpc('create_or_update_user_profile', {
      p_user_id: userId,
      p_email: ADMIN_EMAIL,
      p_full_name: ADMIN_NAME,
      p_role: 'super_admin',
    });
    
    if (rpcError) {
      console.error('❌ RPC also failed:', rpcError.message);
    } else {
      console.log('✅ Profile created via RPC');
    }
  } else {
    console.log('✅ User profile created/updated successfully');
  }
  
  // Verify
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
  
  // Final summary
  console.log('\n═══════════════════════════════════════');
  console.log('🎉 Admin Account Ready!');
  console.log('───────────────────────────────────────');
  console.log(`📧 Email:       ${ADMIN_EMAIL}`);
  console.log(`🔑 Password:    ${ADMIN_PASSWORD}`);
  console.log(`🌐 Dashboard:   http://localhost:3000/admin`);
  console.log(`🔐 Sign In:     http://localhost:3000/auth/signin`);
  console.log('═══════════════════════════════════════\n');
}

main();
