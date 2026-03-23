/**
 * سكريبت إضافة بيانات اختبارية - باستخدام SQL المباشر
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🧪 Creating Test Data...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Step 1: Check existing users
  console.log('👥 Checking Existing Users...\n');
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  
  console.log(`Current users in system: ${existingUsers.users.length}\n`);
  existingUsers.users.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email} (${u.user_metadata?.full_name || 'No name'})`);
  });

  // Step 2: Create plans using REST API
  console.log('\n\n📦 Creating Plans...\n');
  
  const plans = [
    {
      name_ar: 'الخطة المجانية',
      name_en: 'Free Plan',
      description_ar: 'خطة مجانية للمشاريع الصغيرة',
      description_en: 'Free plan for small projects',
      price_sar: '0',
      price_usd: '0',
      billing_interval: 'monthly',
      trial_period_days: 0,
      included_modules: ['basic'],
      limits: { max_users: 3, max_projects: 2, storage_gb: 5 },
      features: ['الميزات الأساسية', 'دعم عبر البريد', '2 مشروع'],
      is_active: true,
      sort_order: 1,
      color: '#6c63ff',
    },
    {
      name_ar: 'الخطة الأساسية',
      name_en: 'Basic Plan',
      description_ar: 'خطة مناسبة للشركات الناشئة',
      description_en: 'Perfect for startups',
      price_sar: '99',
      price_usd: '29',
      billing_interval: 'monthly',
      trial_period_days: 14,
      included_modules: ['basic', 'advanced'],
      limits: { max_users: 10, max_projects: 10, storage_gb: 50 },
      features: ['جميع الميزات الأساسية', '10 مستخدمين', '10 مشاريع', 'دعم فني 24/7', '50GB تخزين'],
      is_active: true,
      sort_order: 2,
      is_popular: true,
      color: '#00d4aa',
    },
    {
      name_ar: 'الخطة الاحترافية',
      name_en: 'Professional Plan',
      description_ar: 'خطة متقدمة للشركات المتوسطة',
      description_en: 'Advanced plan for medium businesses',
      price_sar: '299',
      price_usd: '79',
      billing_interval: 'monthly',
      trial_period_days: 14,
      included_modules: ['basic', 'advanced', 'premium'],
      limits: { max_users: 50, max_projects: 100, storage_gb: 200 },
      features: ['جميع الميزات', '50 مستخدم', '100 مشروع', 'دعم VIP', '200GB تخزين', 'API Access'],
      is_active: true,
      sort_order: 3,
      color: '#ff6b6b',
    },
    {
      name_ar: 'خطة المؤسسات',
      name_en: 'Enterprise Plan',
      description_ar: 'حل متكامل للمؤسسات الكبيرة',
      description_en: 'Complete solution for enterprises',
      price_sar: '999',
      price_usd: '299',
      billing_interval: 'yearly',
      trial_period_days: 30,
      included_modules: ['basic', 'advanced', 'premium', 'enterprise'],
      limits: { max_users: -1, max_projects: -1, storage_gb: 1000 },
      features: ['غير محدود', 'دعم مخصص', 'تدريب', 'تخصيص كامل', 'SLA 99.9%'],
      is_active: true,
      sort_order: 4,
      color: '#f093fb',
    },
  ];

  for (const plan of plans) {
    try {
      const { data, error } = await supabase
        .from('plans')
        .insert(plan)
        .select()
        .single();

      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          console.log(`  ⚠️  ${plan.name_ar} already exists`);
        } else {
          console.error(`  ❌ ${plan.name_ar}: ${error.message}`);
        }
      } else {
        console.log(`  ✅ Created: ${plan.name_ar} - ${plan.price_sar} SAR`);
      }
    } catch (error) {
      console.error(`  ❌ ${plan.name_ar}: ${error.message}`);
    }
  }

  // Step 3: Fetch plans to get IDs
  console.log('\n📋 Fetching Plan IDs...\n');
  const { data: plansData, error: plansError } = await supabase
    .from('plans')
    .select('id, name_ar, price_sar');

  if (plansError) {
    console.error('❌ Error fetching plans:', plansError.message);
  } else {
    plansData?.forEach(p => {
      console.log(`  ✓ ${p.name_ar} - ${p.price_sar} SAR (ID: ${p.id?.substring(0, 8)}...)`);
    });
  }

  // Final Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ Test Data Script Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📧 Test Accounts to Create Manually:\n');
  console.log('┌──────────────────────┬───────────────┬────────────────────┐');
  console.log('│ Email                │ Password      │ Role               │');
  console.log('├──────────────────────┼───────────────┼────────────────────┤');
  console.log('│ user1@test.com       │ Test1234!     │ owner              │');
  console.log('│ user2@test.com       │ Test1234!     │ admin              │');
  console.log('│ user3@test.com       │ Test1234!     │ editor             │');
  console.log('│ user4@test.com       │ Test1234!     │ viewer             │');
  console.log('│ company@test.com     │ Test1234!     │ owner              │');
  console.log('└──────────────────────┴───────────────┴────────────────────┘\n');

  console.log('🔐 Admin Account:\n');
  console.log('   Email:    admin@saasfa.st');
  console.log('   Password: Mm12345132\n');

  console.log('🌐 Login URL: http://localhost:3000/auth/signin\n');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main();
