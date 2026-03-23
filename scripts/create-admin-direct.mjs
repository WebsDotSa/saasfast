/**
 * سكريبت إنشاء حساب Admin عبر الاتصال المباشر بقاعدة البيانات
 * الاستخدام: node scripts/create-admin-direct.mjs
 */

import { Pool } from 'pg';

// Database connection from .env.local
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  console.error('Please add it to .env.local or run:');
  console.error('  export DATABASE_URL="postgresql://..."');
  process.exit(1);
}

const ADMIN_EMAIL = 'admin@saasfa.st';
const ADMIN_PASSWORD = 'Mm12345132';
const ADMIN_NAME = 'Super Admin';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log('🔧 Creating Admin Account (Direct DB Connection)...\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Step 1: Ensure handle_new_user function exists
    console.log('Step 1: Creating handle_new_user function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.user_profiles (user_id, email, full_name, avatar_url, role)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
          NEW.raw_user_meta_data->>'avatar_url',
          COALESCE(NEW.raw_user_meta_data->>'role', 'user')
        )
        ON CONFLICT (user_id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
          avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
          role = COALESCE(EXCLUDED.role, user_profiles.role);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('✅ Function created');

    // Step 2: Ensure trigger exists
    console.log('\nStep 2: Creating trigger...');
    await client.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    `);
    console.log('✅ Trigger created');

    // Step 3: Check if admin exists
    console.log('\nStep 3: Checking for existing admin...');
    const { rows: existingUsers } = await client.query(`
      SELECT id, email, email_confirmed_at 
      FROM auth.users 
      WHERE email = $1
    `, [ADMIN_EMAIL]);

    let adminUserId;

    if (existingUsers.length > 0) {
      adminUserId = existingUsers[0].id;
      console.log(`✅ Admin user exists: ${adminUserId}`);
      
      // Update password and metadata
      console.log('\nStep 4: Updating admin user...');
      await client.query(`
        UPDATE auth.users
        SET
          encrypted_password = crypt($1, gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
          raw_user_meta_data = jsonb_build_object('full_name', $2, 'is_super_admin', true, 'role', 'super_admin'),
          app_metadata = jsonb_build_object('is_super_admin', true, 'role', 'super_admin'),
          updated_at = NOW()
        WHERE id = $3
      `, [ADMIN_PASSWORD, ADMIN_NAME, adminUserId]);
      console.log('✅ Admin user updated');
    } else {
      // Create new admin user
      console.log('\nStep 4: Creating admin user...');
      const { rows: newUser } = await client.query(`
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
          $1,
          crypt($2, gen_salt('bf')),
          NOW(),
          jsonb_build_object('full_name', $3, 'is_super_admin', true, 'role', 'super_admin'),
          jsonb_build_object('is_super_admin', true, 'role', 'super_admin'),
          NOW(),
          NOW()
        )
        RETURNING id
      `, [ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME]);
      
      adminUserId = newUser[0].id;
      console.log(`✅ Admin user created: ${adminUserId}`);
    }

    // Step 5: Create/update user profile
    console.log('\nStep 5: Creating user profile...');
    await client.query(`
      INSERT INTO public.user_profiles (user_id, email, full_name, role)
      VALUES ($1, $2, $3, 'super_admin')
      ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'super_admin'
    `, [adminUserId, ADMIN_EMAIL, ADMIN_NAME]);
    console.log('✅ User profile created/updated');

    // Step 6: Verify
    console.log('\nStep 6: Verifying admin account...');
    const { rows: verification } = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.email_confirmed_at,
        p.role,
        p.full_name
      FROM auth.users u
      LEFT JOIN public.user_profiles p ON u.id = p.user_id
      WHERE u.email = $1
    `, [ADMIN_EMAIL]);

    if (verification.length > 0) {
      const admin = verification[0];
      console.log('✅ Verification successful!');
      console.log(`   User ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Email Confirmed: ${admin.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Name: ${admin.full_name}`);
    }

    await client.query('COMMIT');

    // Final summary
    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Admin Account Created Successfully!');
    console.log('───────────────────────────────────────');
    console.log(`📧 Email:       ${ADMIN_EMAIL}`);
    console.log(`🔑 Password:    ${ADMIN_PASSWORD}`);
    console.log(`🌐 Dashboard:   http://localhost:3000/admin`);
    console.log(`🔐 Sign In:     http://localhost:3000/auth/signin`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
