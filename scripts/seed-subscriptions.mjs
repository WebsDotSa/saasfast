/**
 * سكريبت إضافة اشتراكات وفواتير - الهيكل الصحيح
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const uuidv4 = () => randomUUID();

async function main() {
  console.log('🧪 Creating Subscriptions & Invoices...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Get existing tenants and plans
  console.log('📋 Fetching Tenants and Plans...\n');
  
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name_ar')
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: plans } = await supabase
    .from('plans')
    .select('id, name_ar, price')
    .order('price', { ascending: true });

  if (!tenants || tenants.length === 0) {
    console.error('❌ No tenants found!');
    return;
  }

  if (!plans || plans.length === 0) {
    console.error('❌ No plans found!');
    return;
  }

  console.log(`Found ${tenants.length} tenants and ${plans.length} plans\n`);

  // Create Subscriptions
  console.log('📋 Creating Subscriptions...\n');

  for (let i = 0; i < tenants.length; i++) {
    const tenant = tenants[i];
    const plan = plans[Math.min(i + 1, plans.length - 1)]; // Skip free plan

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: tenant.id,
          plan_id: plan.id,
          status: 'active',
          started_at: new Date().toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          last_payment_amount: plan.price,
          last_payment_date: new Date().toISOString(),
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      console.log(`  ✅ Subscription: ${tenant.name_ar} → ${plan.name_ar}`);
      
      // Create Invoice for this subscription
      const invoiceNumber = `INV-${Date.now()}-${String(i + 1).padStart(4, '0')}`;
      const amountSAR = parseFloat(plan.price);
      const vatAmount = amountSAR * 0.15;
      const totalAmount = amountSAR + vatAmount;

      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          tenant_id: tenant.id,
          subscription_id: data.id,
          invoice_number: invoiceNumber,
          amount_sar: amountSAR,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          currency: 'SAR',
          status: i === 0 ? 'paid' : 'pending',
          items: [
            { description: `اشتراك ${plan.name_ar}`, quantity: 1, unit_price: amountSAR },
            { description: 'ضريبة القيمة المضافة (15%)', quantity: 1, unit_price: vatAmount },
          ],
          period_start: new Date().toISOString(),
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          paid_at: i === 0 ? new Date().toISOString() : null,
        });

      if (invoiceError) {
        console.error(`    ⚠️  Invoice error: ${invoiceError.message}`);
      } else {
        console.log(`    ✅ Invoice: ${invoiceNumber} - ${totalAmount} SAR (${i === 0 ? 'paid' : 'pending'})`);
      }

    } catch (error) {
      console.error(`  ❌ Error for ${tenant.name_ar}: ${error.message}`);
    }
  }

  // Final Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ Subscriptions & Invoices Created!');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📊 Summary:\n');
  console.log(`  ✓ Tenants: ${tenants.length}`);
  console.log(`  ✓ Plans: ${plans.length}`);
  console.log(`  ✓ Subscriptions Created: ${tenants.length}`);
  console.log(`  ✓ Invoices Created: ${tenants.length}\n`);

  console.log('🔐 Admin Account:\n');
  console.log('   Email:    admin@saasfa.st');
  console.log('   Password: Mm12345132\n');

  console.log('🌐 URLs:\n');
  console.log('   Login:      http://localhost:3000/auth/signin');
  console.log('   Dashboard:  http://localhost:3000/dashboard');
  console.log('   Plans:      http://localhost:3000/dashboard/plans');
  console.log('   Invoices:   http://localhost:3000/dashboard/invoices');
  console.log('   Subscriptions: http://localhost:3000/dashboard/subscriptions\n');

  console.log('═══════════════════════════════════════════════════════════\n');
}

main();
