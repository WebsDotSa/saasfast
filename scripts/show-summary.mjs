/**
 * سكريبت عرض ملخص البيانات الاختبارية
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║         SaaS Platform - Test Data Summary                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Users
  console.log('👥 USERS\n');
  const { data: users } = await supabase.auth.admin.listUsers();
  console.log(`Total Users: ${users.users.length}\n`);
  
  users.users.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email}`);
    console.log(`     ID: ${u.id.substring(0, 8)}...`);
    console.log(`     Role: ${u.user_metadata?.role || 'N/A'}`);
    console.log(`     Name: ${u.user_metadata?.full_name || 'N/A'}\n`);
  });

  // Plans
  console.log('─────────────────────────────────────────────────────────────\n');
  console.log('📦 PLANS\n');
  const { data: plans } = await supabase.from('plans').select('name_ar, price, is_active');
  console.log(`Total Plans: ${plans?.length || 0}\n`);
  
  plans?.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name_ar} - ${p.price} SAR ${p.is_active ? '✅' : '❌'}\n`);
  });

  // Tenants
  console.log('─────────────────────────────────────────────────────────────\n');
  console.log('🏢 COMPANIES (TENANTS)\n');
  const { data: tenants } = await supabase.from('tenants').select('name_ar, slug, status');
  console.log(`Total Companies: ${tenants?.length || 0}\n`);
  
  tenants?.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.name_ar} (${t.slug}) - ${t.status}\n`);
  });

  // Subscriptions
  console.log('─────────────────────────────────────────────────────────────\n');
  console.log('📋 SUBSCRIPTIONS\n');
  const { data: subscriptions } = await supabase.from('subscriptions').select('id, status');
  console.log(`Total Subscriptions: ${subscriptions?.length || 0}\n`);

  // Invoices
  console.log('─────────────────────────────────────────────────────────────\n');
  console.log('💳 INVOICES\n');
  const { data: invoices } = await supabase.from('invoices').select('invoice_number, total_amount, status');
  console.log(`Total Invoices: ${invoices?.length || 0}\n`);
  
  invoices?.forEach((inv, i) => {
    console.log(`  ${i + 1}. ${inv.invoice_number} - ${inv.total_amount} SAR (${inv.status})\n`);
  });

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🔐 LOGIN CREDENTIALS\n');
  console.log('┌──────────────────────┬───────────────┬────────────────────┐');
  console.log('│ Email                │ Password      │ Role               │');
  console.log('├──────────────────────┼───────────────┼────────────────────┤');
  console.log('│ admin@saasfa.st      │ Mm12345132    │ super_admin        │');
  console.log('└──────────────────────┴───────────────┴────────────────────┘\n');

  console.log('🌐 URLs:\n');
  console.log('   Login:      http://localhost:3000/auth/signin');
  console.log('   Dashboard:  http://localhost:3000/dashboard\n');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main();
