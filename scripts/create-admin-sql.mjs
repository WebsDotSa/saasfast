/**
 * سكريبت إنشاء حساب Admin - باستخدام Supabase API مباشرة
 * هذه النسخة تستخدم دالة SQL مباشرة عبر Supabase API
 * الاستخدام: node scripts/create-admin-sql.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const ADMIN_EMAIL = 'admin@saasfa.st';
const ADMIN_PASSWORD = 'Mm12345132';
const ADMIN_NAME = 'Super Admin';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔧 Creating Admin Account via SQL...\n');

  try {
    // Use Supabase REST API to execute SQL
    console.log('Step 1: Creating admin user via SQL...');
    
    const sql = `
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = '${ADMIN_EMAIL}';
  
  IF admin_user_id IS NULL THEN
    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      app_metadata,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      '${ADMIN_EMAIL}',
      crypt('${ADMIN_PASSWORD}', gen_salt('bf')),
      NOW(),
      jsonb_build_object('full_name', '${ADMIN_NAME}', 'is_super_admin', true, 'role', 'super_admin'),
      jsonb_build_object('is_super_admin', true, 'role', 'super_admin'),
      NOW(),
      NOW()
    )
    RETURNING id INTO admin_user_id;
    
    RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
  ELSE
    -- Update existing user
    UPDATE auth.users
    SET
      encrypted_password = crypt('${ADMIN_PASSWORD}', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = jsonb_build_object('full_name', '${ADMIN_NAME}', 'is_super_admin', true, 'role', 'super_admin'),
      app_metadata = jsonb_build_object('is_super_admin', true, 'role', 'super_admin'),
      updated_at = NOW()
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Admin user updated: %', admin_user_id;
  END IF;
  
  -- Ensure user profile exists
  INSERT INTO public.user_profiles (user_id, email, full_name, role)
  VALUES (
    admin_user_id,
    '${ADMIN_EMAIL}',
    '${ADMIN_NAME}',
    'super_admin'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = 'super_admin';
  
  RAISE NOTICE 'User profile created/updated for admin user';
END $$ LANGUAGE plpgsql;
    `;

    // Try using the REST endpoint directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_admin_user`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        p_email: ADMIN_EMAIL,
        p_password: ADMIN_PASSWORD,
        p_name: ADMIN_NAME
      })
    });

    if (response.ok) {
      console.log('✅ Admin created via RPC');
    } else {
      console.log('ℹ️ RPC method not available, trying alternative...');
      // Fall back to the manual method
      await createAdminManual();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    await createAdminManual();
  }
}

async function createAdminManual() {
  console.log('\n📝 Using manual creation method...\n');
  
  try {
    // Step 1: List existing users
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existingUser = listData?.users?.find((u) => u.email === ADMIN_EMAIL);

    let userId;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`✅ User exists: ${userId}`);
      
      const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: ADMIN_NAME, is_super_admin: true, role: 'super_admin' },
        app_metadata: { is_super_admin: true, role: 'super_admin' },
      });
      
      if (updateErr) throw updateErr;
      console.log('✅ User updated');
    } else {
      console.log('❌ Cannot create new user via Auth API due to database constraints');
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('⚠️  IMPORTANT: Manual Action Required');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('\nPlease create the admin user via Supabase Dashboard:\n');
      console.log('1. Go to: https://ofgwcinsbkyledtfuhng.supabase.co');
      console.log('2. Navigate to: Authentication → Users');
      console.log('3. Click "Add user" → "Create new user"');
      console.log('4. Enter these details:');
      console.log(`   • Email: ${ADMIN_EMAIL}`);
      console.log(`   • Password: ${ADMIN_PASSWORD}`);
      console.log('5. ✓ Check "Auto Confirm User"');
      console.log('6. Add User Metadata:');
      console.log('   {');
      console.log('     "full_name": "Super Admin",');
      console.log('     "is_super_admin": true,');
      console.log('     "role": "super_admin"');
      console.log('   }');
      console.log('\n═══════════════════════════════════════════════════════════\n');
      return;
    }

    // Step 2: Create user profile
    const { error: profileErr } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        email: ADMIN_EMAIL,
        full_name: ADMIN_NAME,
        role: 'super_admin',
      }, { onConflict: 'user_id' });

    if (profileErr) throw profileErr;
    console.log('✅ User profile created');

    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Admin Account Ready!');
    console.log('───────────────────────────────────────');
    console.log(`📧 Email:       ${ADMIN_EMAIL}`);
    console.log(`🔑 Password:    ${ADMIN_PASSWORD}`);
    console.log(`🌐 Dashboard:   http://localhost:3000/admin`);
    console.log(`🔐 Sign In:     http://localhost:3000/auth/signin`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

main();
