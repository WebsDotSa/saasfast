const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const MIGRATIONS = [
  '025_ai_vector_store.sql',
  '026_ai_agent_module.sql',
  '030_discounts.sql',
  '031_campaigns.sql',
  '032_loyalty.sql',
  '033_affiliates.sql',
  '040_store_transactions.sql',
  '041_merchant_balances.sql',
  '042_payment_links_bank_accounts.sql',
  '043_settlements.sql',
  '044_add_fee_rates_to_plans.sql'
];

async function applyMigrations() {
  console.log('Connected to database\n');

  for (const migration of MIGRATIONS) {
    const filePath = path.join(process.cwd(), 'supabase/migrations', migration);
    const content = fs.readFileSync(filePath, 'utf8');

    console.log(`Applying: ${migration}...`);
    try {
      await sql.begin(async (sql) => {
        await sql.unsafe(content);
      });
      console.log(`✓ Success: ${migration}\n`);
    } catch (error) {
      console.log(`✗ Error in ${migration}: ${error.message.substring(0, 200)}\n`);
    }
  }

  await sql.end();
  console.log('Done!');
}

applyMigrations().catch(console.error);
