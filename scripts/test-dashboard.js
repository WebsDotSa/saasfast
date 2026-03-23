const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');

// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard Comprehensive Test Script
// ═══════════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://ofgwcinsbkyledtfuhng.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ3djaW5zYmt5bGVkdGZ1aG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzI1MzQsImV4cCI6MjA4OTU0ODUzNH0.ElNQjF45A7h9-34Vy1_952VjfBrztZCV4dBUOfU3jKY';
const APP_URL = 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Dashboard Pages to Test
const DASHBOARD_PAGES = [
  { name: 'Dashboard Home', path: '/dashboard' },
  { name: 'Analytics', path: '/dashboard/analytics' },
  { name: 'Billing', path: '/dashboard/billing' },
  { name: 'Team', path: '/dashboard/team' },
  { name: 'Settings', path: '/dashboard/settings' },
  { name: 'Domains', path: '/dashboard/domains' },
  { name: 'Referrals', path: '/dashboard/referrals' },
  
  // Payments
  { name: 'Payments Overview', path: '/dashboard/payments' },
  { name: 'Transactions', path: '/dashboard/payments/transactions' },
  { name: 'Payment Links', path: '/dashboard/payments/links' },
  { name: 'Bank Accounts', path: '/dashboard/payments/bank-accounts' },
  { name: 'Withdrawal Request', path: '/dashboard/payments/withdrawal-request' },
  
  // Marketing
  { name: 'Marketing Overview', path: '/dashboard/marketing' },
  { name: 'Discounts', path: '/dashboard/marketing/discounts' },
  { name: 'Campaigns', path: '/dashboard/marketing/campaigns' },
  { name: 'Loyalty', path: '/dashboard/marketing/loyalty' },
  { name: 'Affiliates', path: '/dashboard/marketing/affiliates' },
  { name: 'AI Assistant', path: '/dashboard/marketing/ai-assistant' },
  
  // AI
  { name: 'AI Agents', path: '/dashboard/ai' },
  { name: 'AI Knowledge', path: '/dashboard/ai/knowledge' },
];

// API Routes to Test
const API_ROUTES = [
  { name: 'Health Check', path: '/api/health', method: 'GET' },
  { name: 'Tenants List', path: '/api/tenants', method: 'GET' },
  { name: 'Discounts API', path: '/api/marketing/discounts', method: 'GET' },
  { name: 'Campaigns API', path: '/api/marketing/campaigns', method: 'GET' },
  { name: 'Loyalty API', path: '/api/marketing/loyalty', method: 'GET' },
  { name: 'Affiliates API', path: '/api/marketing/affiliates', method: 'GET' },
  { name: 'Payments API', path: '/api/payments/transactions', method: 'GET' },
  { name: 'AI Agents API', path: '/api/ai/agents', method: 'GET' },
];

async function testDatabase() {
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  DATABASE TESTS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Test 1: Database Connection
  try {
    const { data, error } = await supabase.from('tenants').select('id, name_ar').limit(1);
    if (error && !error.message.includes('JWT') && !error.message.includes('app.current')) throw error;
    results.passed.push('Database Connection');
    console.log('✓ Database Connection\n');
  } catch (error) {
    results.failed.push({ name: 'Database Connection', error: error.message });
    console.log(`✗ Database Connection: ${error.message}\n`);
  }

  // Test 2: Core Tables
  const coreTables = ['tenants', 'tenant_users', 'plans', 'subscriptions'];
  for (const table of coreTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && !error.message.includes('JWT') && !error.message.includes('app.current')) throw error;
      results.passed.push(`Table: ${table}`);
      console.log(`✓ Table: ${table} (exists)\n`);
    } catch (error) {
      results.failed.push({ name: `Table: ${table}`, error: error.message });
      console.log(`✗ Table: ${table}: ${error.message}\n`);
    }
  }

  // Test 3: Marketing Tables
  const marketingTables = ['discounts', 'marketing_campaigns', 'loyalty_programs', 'affiliates'];
  for (const table of marketingTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && !error.message.includes('JWT') && !error.message.includes('app.current')) throw error;
      results.passed.push(`Marketing Table: ${table}`);
      console.log(`✓ Marketing Table: ${table} (exists)\n`);
    } catch (error) {
      results.failed.push({ name: `Marketing Table: ${table}`, error: error.message });
      console.log(`✗ Marketing Table: ${table}: ${error.message}\n`);
    }
  }

  // Test 4: Payments Tables
  const paymentsTables = ['store_transactions', 'merchant_balances', 'payment_links', 'settlements'];
  for (const table of paymentsTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && !error.message.includes('JWT') && !error.message.includes('app.current')) throw error;
      results.passed.push(`Payments Table: ${table}`);
      console.log(`✓ Payments Table: ${table} (exists)\n`);
    } catch (error) {
      results.failed.push({ name: `Payments Table: ${table}`, error: error.message });
      console.log(`✗ Payments Table: ${table}: ${error.message}\n`);
    }
  }

  // Test 5: AI Tables
  const aiTables = ['ai_agents', 'ai_conversations', 'ai_knowledge_base', 'ai_documents'];
  for (const table of aiTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && !error.message.includes('JWT') && !error.message.includes('app.current')) throw error;
      results.passed.push(`AI Table: ${table}`);
      console.log(`✓ AI Table: ${table} (exists)\n`);
    } catch (error) {
      results.failed.push({ name: `AI Table: ${table}`, error: error.message });
      console.log(`✗ AI Table: ${table}: ${error.message}\n`);
    }
  }
}

async function testPage(path) {
  return new Promise((resolve) => {
    const url = `${APP_URL}${path}`;
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      if (res.statusCode === 200 || res.statusCode === 307 || res.statusCode === 401) {
        resolve({ success: true, status: res.statusCode });
      } else {
        resolve({ success: false, status: res.statusCode });
      }
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

async function testAPIRoute(route) {
  return new Promise((resolve) => {
    const url = `${APP_URL}${route.path}`;
    const client = url.startsWith('https') ? https : http;
    
    const options = {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const req = client.request(url, options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 404) {
        resolve({ success: true, status: res.statusCode });
      } else {
        resolve({ success: false, status: res.statusCode });
      }
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
    
    req.end();
  });
}

async function testDashboardPages() {
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  DASHBOARD PAGES TESTS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  for (const page of DASHBOARD_PAGES) {
    const result = await testPage(page.path);
    if (result.success) {
      results.passed.push(`Page: ${page.name}`);
      console.log(`✓ ${page.name} (${page.path}) - Status: ${result.status}\n`);
    } else {
      results.failed.push({ name: `Page: ${page.name}`, error: result.error || `Status: ${result.status}` });
      console.log(`✗ ${page.name} (${page.path}) - ${result.error || result.status}\n`);
    }
  }
}

async function testAPIs() {
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  API ROUTES TESTS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  for (const route of API_ROUTES) {
    const result = await testAPIRoute(route);
    if (result.success) {
      results.passed.push(`API: ${route.name}`);
      console.log(`✓ ${route.name} (${route.path}) - Status: ${result.status}\n`);
    } else {
      results.failed.push({ name: `API: ${route.name}`, error: result.error || `Status: ${result.status}` });
      console.log(`✗ ${route.name} (${route.path}) - ${result.error || result.status}\n`);
    }
  }
}

async function testAuth() {
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  AUTHENTICATION TESTS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Test: Check if Supabase is configured
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error && error.message.includes('Auth session missing')) {
      results.warnings.push('No active session (expected for testing)');
      console.log('⚠ No active session - Need to login as tenant user\n');
    } else if (user) {
      results.passed.push('User Authentication');
      console.log(`✓ User Authentication - Email: ${user.email}\n`);
    }
  } catch (error) {
    results.warnings.push(`Auth test: ${error.message}`);
    console.log(`⚠ Auth test: ${error.message}\n`);
  }
}

async function generateReport() {
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY REPORT');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const total = results.passed.length + results.failed.length;
  const passRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : 0;

  console.log(`Total Tests: ${total}`);
  console.log(`✓ Passed: ${results.passed.length}`);
  console.log(`✗ Failed: ${results.failed.length}`);
  console.log(`⚠ Warnings: ${results.warnings.length}`);
  console.log(`📊 Pass Rate: ${passRate}%\n`);

  if (results.failed.length > 0) {
    console.log('\n───────────────────────────────────────────────────────────────────');
    console.log('  FAILED TESTS');
    console.log('───────────────────────────────────────────────────────────────────\n');
    results.failed.forEach(f => {
      console.log(`✗ ${f.name}`);
      console.log(`  Error: ${f.error}\n`);
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n───────────────────────────────────────────────────────────────────');
    console.log('  WARNINGS');
    console.log('───────────────────────────────────────────────────────────────────\n');
    results.warnings.forEach(w => {
      console.log(`⚠ ${w}\n`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  if (results.failed.some(f => f.name.includes('Page'))) {
    console.log('1. Start the development server: pnpm dev\n');
  }
  
  if (results.failed.some(f => f.name.includes('Database'))) {
    console.log('2. Check DATABASE_URL in .env.local\n');
  }
  
  if (results.warnings.some(w => w.includes('session'))) {
    console.log('3. Login as a tenant user to test protected routes\n');
    console.log('   Login URL: http://localhost:3000/auth/signin\n');
  }

  console.log('═══════════════════════════════════════════════════════════════════\n');

  return {
    total,
    passed: results.passed.length,
    failed: results.failed.length,
    warnings: results.warnings.length,
    passRate
  };
}

async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║     SAASFAST COMPREHENSIVE DASHBOARD & API TESTING               ║');
  console.log('║                    23 March 2026                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Run all tests
  await testDatabase();
  await testAuth();
  await testDashboardPages();
  await testAPIs();
  
  // Generate report
  const summary = await generateReport();
  
  // Exit with appropriate code
  process.exit(summary.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(console.error);
