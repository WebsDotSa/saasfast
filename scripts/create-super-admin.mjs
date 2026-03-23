/**
 * سكريبت إنشاء حساب Super Admin
 * الاستخدام: node scripts/create-super-admin.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const ADMIN_EMAIL    = 'admin@saasfa.st';
const ADMIN_PASSWORD = 'Mm12345132';
const ADMIN_NAME     = 'Super Admin';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🔧 إنشاء حساب Super Admin...\n');

  // 1) إنشاء المستخدم أو الحصول عليه
  let userId;

  // البحث عبر Admin API
  const { data: listData } = await supabase.auth.admin.listUsers();
  const existingUser = listData?.users?.find((u) => u.email === ADMIN_EMAIL);

  if (existingUser) {
    userId = existingUser.id;
    console.log(`✅ المستخدم موجود: ${userId}`);

    // تحديث كلمة المرور والـ metadata
    const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: ADMIN_NAME,
        is_super_admin: true,
      },
    });
    if (updateErr) console.warn('تحذير تحديث:', updateErr.message);
    else console.log('✅ تم تحديث المستخدم');

  } else {
    // إنشاء مستخدم جديد
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
      console.error('❌ فشل إنشاء المستخدم:', createErr.message);
      process.exit(1);
    }
    userId = created.user.id;
    console.log(`✅ تم إنشاء المستخدم: ${userId}`);
  }

  // 2) إنشاء/تحديث user_profiles بدور super_admin
  const { error: profileErr } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userId,
      full_name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      role: 'super_admin',
    }, { onConflict: 'user_id' });

  if (profileErr) {
    console.warn('⚠️  user_profiles:', profileErr.message);
  } else {
    console.log('✅ تم تعيين role = super_admin في user_profiles');
  }

  console.log('\n═══════════════════════════════════════');
  console.log('🎉 Super Admin جاهز!');
  console.log('───────────────────────────────────────');
  console.log(`📧 البريد:      ${ADMIN_EMAIL}`);
  console.log(`🔑 كلمة المرور: ${ADMIN_PASSWORD}`);
  console.log(`🌐 لوحة التحكم: http://localhost:3000/admin`);
  console.log('═══════════════════════════════════════\n');
}

main().catch(console.error);
