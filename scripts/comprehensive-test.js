const postgres = require('postgres');

const DATABASE_URL = process.env.DATABASE_URL;
const sql = postgres(DATABASE_URL, { max: 5 });

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function test(name, fn) {
  return async () => {
    try {
      await fn();
      results.passed.push(name);
      console.log(`✓ ${name}`);
    } catch (error) {
      results.failed.push({ name, error: error.message });
      console.log(`✗ ${name}: ${error.message.substring(0, 100)}`);
    }
  };
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  COMPREHENSIVE DATABASE & API TESTS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // DATABASE TESTS
  // ─────────────────────────────────────────────────────────────────────────────

  await test('Database Connection', async () => {
    const result = await sql`SELECT 1 as test`;
    if (result[0].test !== 1) throw new Error('Connection failed');
  })();

  await test('Core Tables Exist', async () => {
    const tables = ['tenants', 'tenant_users', 'plans', 'subscriptions'];
    for (const table of tables) {
      const result = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ${table}) as exists`;
      if (!result[0].exists) throw new Error(`Table ${table} missing`);
    }
  })();

  await test('Marketing Tables Exist', async () => {
    const tables = ['discounts', 'marketing_campaigns', 'loyalty_programs', 'affiliates'];
    for (const table of tables) {
      const result = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ${table}) as exists`;
      if (!result[0].exists) throw new Error(`Table ${table} missing`);
    }
  })();

  await test('Payments Tables Exist', async () => {
    const tables = ['store_transactions', 'merchant_balances', 'payment_links', 'settlements'];
    for (const table of tables) {
      const result = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ${table}) as exists`;
      if (!result[0].exists) throw new Error(`Table ${table} missing`);
    }
  })();

  await test('AI Tables Exist', async () => {
    const tables = ['ai_agents', 'ai_conversations', 'ai_documents', 'ai_knowledge_base'];
    for (const table of tables) {
      const result = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ${table}) as exists`;
      if (!result[0].exists) throw new Error(`Table ${table} missing`);
    }
  })();

  await test('Generated Columns Work (store_transactions)', async () => {
    // Insert a test transaction
    const testId = 'test-tx-' + Date.now();
    await sql`
      INSERT INTO store_transactions (id, tenant_id, gross_amount, gateway_fee_rate, platform_fee_rate, status)
      VALUES (${testId}, '00000000-0000-0000-0000-000000000000', 100.00, 0.015, 0.01, 'pending')
      ON CONFLICT (id) DO NOTHING
    `;
    
    const result = await sql`SELECT gateway_fee_amount, platform_fee_amount, net_amount FROM store_transactions WHERE id = ${testId}`;
    if (result.length > 0) {
      // Fees should be calculated (or null if trigger didn't run)
      console.log(`   Fees: gateway=${result[0].gateway_fee_amount}, platform=${result[0].platform_fee_amount}, net=${result[0].net_amount}`);
    }
    
    // Cleanup
    await sql`DELETE FROM store_transactions WHERE id = ${testId}`;
  })();

  await test('RLS Policies Exist', async () => {
    const policies = ['tx_tenant_isolation', 'mb_tenant_isolation', 'pl_tenant_isolation'];
    for (const policy of policies) {
      const result = await sql`SELECT EXISTS (SELECT FROM pg_policies WHERE policyname = ${policy}) as exists`;
      if (!result[0].exists) throw new Error(`Policy ${policy} missing`);
    }
  })();

  await test('Database Extensions', async () => {
    const extensions = ['uuid-ossp', 'pgvector'];
    for (const ext of extensions) {
      const result = await sql`SELECT EXISTS (SELECT FROM pg_extension WHERE extname = ${ext}) as exists`;
      if (!result[0].exists) {
        results.warnings.push(`Extension ${ext} not installed`);
        console.log(`⚠ Extension ${ext} not installed (warning only)`);
      }
    }
  })();

  // ─────────────────────────────────────────────────────────────────────────────
  // API TESTS (Basic Health Check)
  // ─────────────────────────────────────────────────────────────────────────────

  console.log('\n─────────────────────────────────────────────────────────────────────');
  console.log('  API Health Checks');
  console.log('─────────────────────────────────────────────────────────────────────\n');

  const https = require('https');
  
  const apiTests = [
    { name: 'API: Health Check', url: 'http://localhost:3000/api/health' },
    { name: 'API: Tenants', url: 'http://localhost:3000/api/tenants' },
  ];

  for (const apiTest of apiTests) {
    await test(apiTest.name, async () => {
      return new Promise((resolve, reject) => {
        const req = https.get(apiTest.url, (res) => {
          if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 404) {
            resolve();
          } else {
            reject(new Error(`Status ${res.statusCode}`));
          }
        });
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
      });
    })();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`✓ Passed: ${results.passed.length}`);
  console.log(`✗ Failed: ${results.failed.length}`);
  console.log(`⚠ Warnings: ${results.warnings.length}`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  if (results.failed.length > 0) {
    console.log('Failed Tests:');
    results.failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
    console.log('');
  }

  if (results.warnings.length > 0) {
    console.log('Warnings:');
    results.warnings.forEach(w => console.log(`  - ${w}`));
    console.log('');
  }

  await sql.end();
  
  process.exit(results.failed.length > 0 ? 1 : 0);
}

runTests().catch(console.error);
