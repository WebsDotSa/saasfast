/**
 * سكريبت إضافة بيانات اختبارية للمنصة
 * يضيف: باقات، مستخدمين، شركات، اشتراكات، فواتير
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const uuidv4 = () => randomUUID();

async function main() {
  console.log('🧪 Creating Test Data...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Step 1: Create Plans
  console.log('📦 Creating Plans...\n');
  
  const plans = [
    {
      name_ar: 'الخطة المجانية',
      name_en: 'Free Plan',
      description_ar: 'خطة مجانية للمشاريع الصغيرة',
      description_en: 'Free plan for small projects',
      price: 0,
      price_usd: 0,
      currency: 'SAR',
      billing_interval: 'monthly',
      trial_period_days: 0,
      included_modules: ['basic'],
      limits: { max_users: 3, max_projects: 2, storage_gb: 5 },
      features: { basic_support: true, email_support: true, max_projects: 2 },
      is_active: true,
      sort_order: 1,
      color: '#6c63ff',
      max_users: 3,
      max_products: 2,
      max_orders: 10,
    },
    {
      name_ar: 'الخطة الأساسية',
      name_en: 'Basic Plan',
      description_ar: 'خطة مناسبة للشركات الناشئة',
      description_en: 'Perfect for startups',
      price: 99,
      price_usd: 29,
      currency: 'SAR',
      billing_interval: 'monthly',
      trial_period_days: 14,
      included_modules: ['basic', 'advanced'],
      limits: { max_users: 10, max_projects: 10, storage_gb: 50 },
      features: { basic_support: true, email_support: true, phone_support: true, max_projects: 10 },
      is_active: true,
      sort_order: 2,
      is_popular: true,
      color: '#00d4aa',
      max_users: 10,
      max_products: 10,
      max_orders: 100,
    },
    {
      name_ar: 'الخطة الاحترافية',
      name_en: 'Professional Plan',
      description_ar: 'خطة متقدمة للشركات المتوسطة',
      description_en: 'Advanced plan for medium businesses',
      price: 299,
      price_usd: 79,
      currency: 'SAR',
      billing_interval: 'monthly',
      trial_period_days: 14,
      included_modules: ['basic', 'advanced', 'premium'],
      limits: { max_users: 50, max_projects: 100, storage_gb: 200 },
      features: { basic_support: true, email_support: true, phone_support: true, vip_support: true, api_access: true, max_projects: 100 },
      is_active: true,
      sort_order: 3,
      color: '#ff6b6b',
      max_users: 50,
      max_products: 100,
      max_orders: 1000,
    },
    {
      name_ar: 'خطة المؤسسات',
      name_en: 'Enterprise Plan',
      description_ar: 'حل متكامل للمؤسسات الكبيرة',
      description_en: 'Complete solution for enterprises',
      price: 999,
      price_usd: 299,
      currency: 'SAR',
      billing_interval: 'yearly',
      trial_period_days: 30,
      included_modules: ['basic', 'advanced', 'premium', 'enterprise'],
      limits: { max_users: -1, max_projects: -1, storage_gb: 1000 },
      features: { basic_support: true, email_support: true, phone_support: true, vip_support: true, api_access: true, dedicated_support: true, sla: '99.9%', max_projects: -1 },
      is_active: true,
      sort_order: 4,
      color: '#f093fb',
      max_users: -1,
      max_products: -1,
      max_orders: -1,
      is_featured: true,
    },
  ];

  const planIds = [];

  for (const plan of plans) {
    try {
      // Check if plan exists
      const { data: existing } = await supabase
        .from('plans')
        .select('id')
        .eq('name_ar', plan.name_ar)
        .single();

      if (existing) {
        console.log(`  ⚠️  ${plan.name_ar} already exists`);
        planIds.push(existing.id);
        continue;
      }

      const { data, error } = await supabase
        .from('plans')
        .insert(plan)
        .select('id')
        .single();

      if (error) throw error;
      
      console.log(`  ✅ Created: ${plan.name_ar} - ${plan.price} SAR`);
      planIds.push(data.id);
    } catch (error) {
      console.error(`  ❌ ${plan.name_ar}: ${error.message}`);
    }
  }

  // Step 2: Create Test Tenants (Companies)
  console.log('\n🏢 Creating Test Companies...\n');

  const companies = [
    { name_ar: 'مؤسسة الأفق', name_en: 'Ufuq Co.', slug: 'ufuq-co' },
    { name_ar: 'شركة الإبداع', name_en: 'Ibdaa Inc.', slug: 'ibdaa-inc' },
    { name_ar: 'تقنية المستقبل', name_en: 'Mustaqbal Tech', slug: 'mustaqbal-tech' },
  ];

  const tenantIds = [];

  for (const company of companies) {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          ...company,
          slug: `${company.slug}-${Date.now() + Math.random().toString(36).substring(7)}`,
          status: 'active',
          plan_id: planIds[1] || null,
          modules: ['basic', 'advanced'],
          settings: { language: 'ar', timezone: 'Asia/Riyadh', currency: 'SAR' },
          email: `company${tenantIds.length + 1}@test.com`,
          country: 'SA',
          city: 'Riyadh',
        })
        .select('id')
        .single();

      if (error) throw error;

      console.log(`  ✅ Created: ${company.name_ar}`);
      tenantIds.push(data.id);
    } catch (error) {
      console.error(`  ❌ ${company.name_ar}: ${error.message}`);
    }
  }

  // Step 3: Create Subscriptions
  console.log('\n📋 Creating Subscriptions...\n');

  for (let i = 0; i < tenantIds.length && i < planIds.length; i++) {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: tenantIds[i],
          plan_id: planIds[i + 1] || planIds[0],
          status: 'active',
          start_date: new Date().toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;

      console.log(`  ✅ Created subscription for tenant ${i + 1}`);
    } catch (error) {
      console.error(`  ❌ Subscription ${i + 1}: ${error.message}`);
    }
  }

  // Step 4: Create Invoices
  console.log('\n💳 Creating Invoices...\n');

  const invoices = [
    { amount: 99, status: 'paid', description: 'فاتورة اشتراك - الخطة الأساسية' },
    { amount: 99, status: 'pending', description: 'فاتورة اشتراك - الخطة الأساسية' },
    { amount: 299, status: 'paid', description: 'فاتورة اشتراك - الخطة الاحترافية' },
  ];

  for (let i = 0; i < invoices.length && i < tenantIds.length; i++) {
    try {
      const invoiceNumber = `INV-${Date.now()}-${String(i + 1).padStart(4, '0')}`;
      
      const { error } = await supabase
        .from('invoices')
        .insert({
          tenant_id: tenantIds[i],
          invoice_number: invoiceNumber,
          amount: invoices[i].amount,
          currency: 'SAR',
          status: invoices[i].status,
          description: invoices[i].description,
          items: [{ description: invoices[i].description, quantity: 1, unit_price: invoices[i].amount }],
          due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;

      console.log(`  ✅ Created invoice: ${invoiceNumber} - ${invoices[i].status}`);
    } catch (error) {
      console.error(`  ❌ Invoice ${i + 1}: ${error.message}`);
    }
  }

  // Final Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ Test Data Creation Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📊 Summary:\n');
  console.log(`  ✓ Plans Created: ${planIds.length}`);
  console.log(`  ✓ Companies Created: ${tenantIds.length}`);
  console.log(`  ✓ Subscriptions Created: ${tenantIds.length}`);
  console.log(`  ✓ Invoices Created: ${invoices.length}\n`);

  console.log('🔐 Admin Account:\n');
  console.log('   Email:    admin@saasfa.st');
  console.log('   Password: Mm12345132\n');

  console.log('🌐 URLs:\n');
  console.log('   Login:      http://localhost:3000/auth/signin');
  console.log('   Dashboard:  http://localhost:3000/dashboard');
  console.log('   Plans:      http://localhost:3000/dashboard/plans');
  console.log('   Invoices:   http://localhost:3000/dashboard/invoices\n');

  console.log('═══════════════════════════════════════════════════════════\n');
}

main();
