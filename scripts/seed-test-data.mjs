/**
 * سكريبت إضافة بيانات اختبارية للمنصة
 * يضيف: مستخدمين، باقات، اشتراكات، فواتير
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const uuidv4 = () => randomUUID();

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Test Users Data
const TEST_USERS = [
  {
    email: 'user1@test.com',
    password: 'Test1234!',
    name: 'أحمد محمد',
    role: 'owner',
  },
  {
    email: 'user2@test.com',
    password: 'Test1234!',
    name: 'فاطمة علي',
    role: 'admin',
  },
  {
    email: 'user3@test.com',
    password: 'Test1234!',
    name: 'محمد سعيد',
    role: 'editor',
  },
  {
    email: 'user4@test.com',
    password: 'Test1234!',
    name: 'نورة خالد',
    role: 'viewer',
  },
  {
    email: 'company@test.com',
    password: 'Test1234!',
    name: 'شركة التقنية المتقدمة',
    role: 'owner',
  },
];

// Plans Data
const PLANS = [
  {
    name_ar: 'الخطة المجانية',
    name_en: 'Free Plan',
    description_ar: 'خطة مجانية للمشاريع الصغيرة',
    description_en: 'Free plan for small projects',
    price_sar: 0,
    price_usd: 0,
    billing_interval: 'monthly',
    trial_period_days: 0,
    included_modules: ['basic'],
    limits: { max_users: 3, max_projects: 2, storage_gb: 5 },
    features: ['الميزات الأساسية', 'دعم عبر البريد', '2 مشروع'],
    is_active: true,
  },
  {
    name_ar: 'الخطة الأساسية',
    name_en: 'Basic Plan',
    description_ar: 'خطة مناسبة للشركات الناشئة',
    description_en: 'Perfect for startups',
    price_sar: 99,
    price_usd: 29,
    billing_interval: 'monthly',
    trial_period_days: 14,
    included_modules: ['basic', 'advanced'],
    limits: { max_users: 10, max_projects: 10, storage_gb: 50 },
    features: ['جميع الميزات الأساسية', '10 مستخدمين', '10 مشاريع', 'دعم فني 24/7', '50GB تخزين'],
    is_active: true,
  },
  {
    name_ar: 'الخطة الاحترافية',
    name_en: 'Professional Plan',
    description_ar: 'خطة متقدمة للشركات المتوسطة',
    description_en: 'Advanced plan for medium businesses',
    price_sar: 299,
    price_usd: 79,
    billing_interval: 'monthly',
    trial_period_days: 14,
    included_modules: ['basic', 'advanced', 'premium'],
    limits: { max_users: 50, max_projects: 100, storage_gb: 200 },
    features: ['جميع الميزات', '50 مستخدم', '100 مشروع', 'دعم VIP', '200GB تخزين', 'API Access'],
    is_active: true,
  },
  {
    name_ar: 'خطة المؤسسات',
    name_en: 'Enterprise Plan',
    description_ar: 'حل متكامل للمؤسسات الكبيرة',
    description_en: 'Complete solution for enterprises',
    price_sar: 999,
    price_usd: 299,
    billing_interval: 'yearly',
    trial_period_days: 30,
    included_modules: ['basic', 'advanced', 'premium', 'enterprise'],
    limits: { max_users: -1, max_projects: -1, storage_gb: 1000 },
    features: ['غير محدود', 'دعم مخصص', 'تدريب', 'تخصيص كامل', 'SLA 99.9%'],
    is_active: true,
  },
];

async function createTestUser(userData) {
  try {
    // Check if user exists
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existingUser = listData.users.find(u => u.email === userData.email);

    if (existingUser) {
      console.log(`  ⚠️  User ${userData.email} already exists`);
      return existingUser.id;
    }

    // Create user
    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.name,
        role: userData.role,
      },
    });

    if (error) throw error;

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: data.user.id,
        email: userData.email,
        full_name: userData.name,
        role: userData.role,
      });

    if (profileError) console.warn('  ⚠️  Profile error:', profileError.message);

    console.log(`  ✅ Created user: ${userData.email}`);
    return data.user.id;
  } catch (error) {
    console.error(`  ❌ Error creating ${userData.email}:`, error.message);
    return null;
  }
}

async function createPlans() {
  console.log('\n📦 Creating Plans...\n');

  for (const plan of PLANS) {
    try {
      const { data, error } = await supabase
        .from('plans')
        .insert(plan)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          console.log(`  ⚠️  Plan ${plan.name_ar} already exists`);
        } else {
          console.error(`  ❌ Error creating ${plan.name_ar}:`, error.message);
        }
      } else {
        console.log(`  ✅ Created plan: ${plan.name_ar} - ${plan.price_sar} SAR`);
      }
    } catch (error) {
      console.error(`  ❌ Error creating ${plan.name_ar}:`, error.message);
    }
  }
}

async function createTenantAndSubscription(userId, planId, tenantName) {
  const tenantId = uuidv4();

  try {
    // Create tenant
    const { error: tenantError } = await supabase
      .from('tenants')
      .insert({
        id: tenantId,
        name_ar: tenantName,
        name_en: `${tenantName} Co.`,
        slug: `${tenantName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        status: 'active',
        settings: {
          language: 'ar',
          timezone: 'Asia/Riyadh',
          currency: 'SAR',
        },
      });

    if (tenantError) throw tenantError;

    // Add user to tenant
    const { error: memberError } = await supabase
      .from('tenant_users')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        role: 'owner',
        permissions: ['all'],
      });

    if (memberError) throw memberError;

    // Create subscription
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        tenant_id: tenantId,
        plan_id: planId,
        status: 'active',
        start_date: new Date().toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (subError) throw subError;

    console.log(`  ✅ Created tenant & subscription for ${tenantName}`);
    return tenantId;
  } catch (error) {
    console.error(`  ❌ Error creating tenant for ${tenantName}:`, error.message);
    return null;
  }
}

async function createInvoices(tenantId, planId) {
  console.log('\n💳 Creating Invoices...\n');

  const invoices = [
    {
      invoice_number: `INV-${Date.now()}-001`,
      amount: 99,
      status: 'paid',
      payment_date: new Date().toISOString(),
    },
    {
      invoice_number: `INV-${Date.now()}-002`,
      amount: 99,
      status: 'pending',
      due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  for (const invoice of invoices) {
    try {
      const { error } = await supabase
        .from('invoices')
        .insert({
          tenant_id: tenantId,
          subscription_id: uuidv4(),
          ...invoice,
          currency: 'SAR',
          items: [{ description: 'اشتراك شهري', quantity: 1, unit_price: invoice.amount }],
        });

      if (error) {
        console.error(`  ❌ Error creating invoice ${invoice.invoice_number}:`, error.message);
      } else {
        console.log(`  ✅ Created invoice: ${invoice.invoice_number} - ${invoice.status}`);
      }
    } catch (error) {
      console.error(`  ❌ Error creating invoice:`, error.message);
    }
  }
}

async function main() {
  console.log('🧪 Starting Test Data Creation...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Step 1: Create Test Users
  console.log('👥 Creating Test Users...\n');
  const userIds = [];

  for (const user of TEST_USERS) {
    const userId = await createTestUser(user);
    if (userId) userIds.push({ id: userId, email: user.email, name: user.name });
  }

  // Step 2: Create Plans
  await createPlans();

  // Step 3: Get plan IDs
  console.log('\n📋 Fetching Plan IDs...\n');
  const { data: plans } = await supabase
    .from('plans')
    .select('id, name_ar')
    .order('price_sar', { ascending: true });

  if (!plans || plans.length === 0) {
    console.error('❌ No plans found!');
    return;
  }

  plans.forEach(p => console.log(`  ✓ ${p.name_ar}`));

  // Step 4: Create Tenants & Subscriptions
  console.log('\n🏢 Creating Tenants & Subscriptions...\n');

  const tenantData = [
    { userId: userIds[0].id, planId: plans[1]?.id, name: 'مؤسسة الأفق' },
    { userId: userIds[1].id, planId: plans[2]?.id, name: 'شركة الإبداع' },
    { userId: userIds[4].id, planId: plans[3]?.id, name: 'مجموعة التقنية' },
  ];

  for (const data of tenantData) {
    if (data.planId) {
      await createTenantAndSubscription(data.userId, data.planId, data.name);
    }
  }

  // Step 5: Create Invoices (for first tenant)
  if (tenantData[0].planId) {
    const { data: firstTenant } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (firstTenant) {
      await createInvoices(firstTenant.id, tenantData[0].planId);
    }
  }

  // Final Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ Test Data Creation Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📧 Test Accounts:\n');
  console.log('┌──────────────────────┬───────────────┬────────────────────┐');
  console.log('│ Email                │ Password      │ Role               │');
  console.log('├──────────────────────┼───────────────┼────────────────────┤');

  TEST_USERS.forEach(user => {
    const emailPad = user.email.padEnd(20);
    const passPad = user.password.padEnd(13);
    const rolePad = user.role.padEnd(18);
    console.log(`│ ${emailPad} │ ${passPad} │ ${rolePad} │`);
  });

  console.log('└──────────────────────┴───────────────┴────────────────────┘\n');

  console.log('🔐 Admin Account:\n');
  console.log(`   Email:    admin@saasfa.st`);
  console.log(`   Password: Mm12345132\n`);

  console.log('🌐 Login URL: http://localhost:3000/auth/signin\n');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main();
