/**
 * سكريبت فحص هيكل جداول الاشتراكات والفواتير
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔍 Checking Subscriptions & Invoices Schema...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Check subscriptions table
  console.log('📋 Subscriptions Table:\n');
  const { data: subData, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .limit(1);

  if (subError) {
    console.error('Error:', subError.message);
  } else if (subData && subData.length > 0) {
    console.log('Columns:', Object.keys(subData[0]).join(', '));
  }

  // Check invoices table
  console.log('\n\n💳 Invoices Table:\n');
  const { data: invData, error: invError } = await supabase
    .from('invoices')
    .select('*')
    .limit(1);

  if (invError) {
    console.error('Error:', invError.message);
  } else if (invData && invData.length > 0) {
    console.log('Columns:', Object.keys(invData[0]).join(', '));
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main();
