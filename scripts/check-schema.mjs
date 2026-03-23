/**
 * سكريبت فحص هيكل قاعدة البيانات
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk3MjUzNCwiZXhwIjoyMDg5NTQ4NTM0fQ.2MM_C7dT4PpIh-MdOs1w8g1MOncYr4l3UomWghaMDL8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔍 Checking Database Schema...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Check plans table structure
  console.log('📦 Plans Table Structure:\n');
  
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error:', error.message);
    } else {
      if (data && data.length > 0) {
        console.log('Existing columns in plans table:');
        console.log(Object.keys(data[0]).map(k => `  - ${k}`).join('\n'));
      } else {
        console.log('Table is empty, checking RPC error for column info...');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Try to insert with minimal fields
  console.log('\n\n📝 Trying minimal insert...\n');
  
  const { data: insertData, error: insertError } = await supabase
    .from('plans')
    .insert({
      name_ar: 'Test Plan',
      name_en: 'Test Plan',
    })
    .select()
    .single();

  if (insertError) {
    console.error('Insert error:', insertError.message);
    console.error('Details:', insertError.details);
    console.error('Hint:', insertError.hint);
  } else {
    console.log('✅ Insert successful!');
    console.log('Created plan:', insertData);
    
    // Delete the test plan
    await supabase.from('plans').delete().eq('name_ar', 'Test Plan');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main();
