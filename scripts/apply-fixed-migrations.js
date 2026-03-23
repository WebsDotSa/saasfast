const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const MIGRATIONS = [
  '040_store_transactions_fixed.sql',
  '041_merchant_balances_fixed.sql',
  '042_payment_links_bank_accounts_fixed.sql',
  '043_settlements_fixed.sql'
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
      console.log(`✗ Error in ${migration}: ${error.message.substring(0, 300)}\n`);
    }
  }
  
  await sql.end();
  console.log('Done!');
}

applyMigrations().catch(console.error);
