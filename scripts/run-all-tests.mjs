import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:2110@localhost:5432/rd_jeans_factory'
});

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function log(section, msg, status = 'INFO') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
  console.log(`${icon} [${section}] ${msg}`);
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('  RD JEANS FACTORY - FULL SUITE INTEGRATION TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      log('TEST', `${name}`, 'PASS');
      passed++;
    } catch (err) {
      log('TEST', `${name} - FAILED: ${err.message}`, 'FAIL');
    }
  }

  // 1. Database Schema & FK Constraints
  await test('Database: Check all core tables exist in PostgreSQL', async () => {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      const tables = res.rows.map(r => r.table_name);
      const expected = [
        'users', 'employees', 'upad_records', 'salaries', 'seths', 
        'seth_payments', 'rolls', 'cutting_entries', 'finished_goods',
        'incomes', 'expenses', 'cash_book_ledger', 'partners', 'partner_transactions'
      ];
      for (const t of expected) {
        if (!tables.includes(t)) throw new Error(`Missing table: ${t}`);
      }
    } finally {
      client.release();
    }
  });

  await test('Database: Check foreign key constraints (Upad, Cutting, Partners, Cashbook)', async () => {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT tc.constraint_name, tc.table_name, kcu.column_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
      `);
      const fkList = res.rows.map(r => `${r.table_name}.${r.column_name}`);
      const requiredFks = [
        'upad_records.settled_in_salary_id',
        'cutting_entries.employee_id',
        'finished_goods.cutting_id',
        'cash_book_ledger.partner_id',
        'partner_transactions.partner_id'
      ];
      for (const req of requiredFks) {
        if (!fkList.includes(req)) throw new Error(`Missing required physical foreign key: ${req}`);
      }
    } finally {
      client.release();
    }
  });

  // 2. Authentication & Auth Guard
  let authToken = '';
  await test('Auth: Unauthenticated request to /api/employees is blocked with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/employees`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('Auth: Login with valid credentials and receive JWT access token', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'rdjeans123', password: 'RD@123' })
    });
    if (!res.ok) throw new Error(`Login failed with status ${res.status}`);
    const data = await res.json();
    if (!data.access_token) throw new Error('No access_token returned');
    authToken = data.access_token;
  });

  await test('Auth: Authenticated request to /api/employees succeeds with Bearer token', async () => {
    const res = await fetch(`${BASE_URL}/api/employees`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Expected 200, got ${res.status}`);
    const body = await res.json();
    if (!body.success || !Array.isArray(body.data)) throw new Error('Invalid employees envelope');
  });

  // 3. Reports Export Engine
  await test('Reports: Generate binary Excel report (.xlsx) for cashbook', async () => {
    const res = await fetch(`${BASE_URL}/api/reports/export/excel?report_type=cashbook`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Excel export failed with status ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('spreadsheetml')) throw new Error(`Unexpected Content-Type: ${contentType}`);
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 500) throw new Error(`Excel file too small (${buf.byteLength} bytes)`);
  });

  await test('Reports: Generate binary printable PDF report (.pdf) for salary', async () => {
    const res = await fetch(`${BASE_URL}/api/reports/export/pdf?report_type=salary`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`PDF export failed with status ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/pdf')) throw new Error(`Unexpected Content-Type: ${contentType}`);
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 500) throw new Error(`PDF file too small (${buf.byteLength} bytes)`);
  });

  // 4. Cutting Overconsumption Guard
  await test('Business Rule: Reject cutting when meter_used exceeds roll remaining balance', async () => {
    const client = await pool.connect();
    try {
      const rollRes = await client.query('SELECT id, remaining_meter FROM rolls WHERE remaining_meter > 0 LIMIT 1');
      if (rollRes.rows.length === 0) return; // Skip if no active rolls
      const roll = rollRes.rows[0];
      const excessiveMeters = parseFloat(roll.remaining_meter) + 9999;

      const res = await fetch(`${BASE_URL}/api/cutting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          cutting_date: '2026-10-27',
          lot_number: 'TEST-OVERCONSUME-LOT',
          roll_id: roll.id,
          meter_used: excessiveMeters,
          piece_count: 50,
          size: '30'
        })
      });

      if (res.status === 201) {
        throw new Error('Server accepted cutting request that exceeded available roll meters!');
      }
    } finally {
      client.release();
    }
  });

  // 5. Partners & Capital Equity
  await test('Partners: Fetch dynamic partners list and equity breakdown', async () => {
    const res = await fetch(`${BASE_URL}/api/partners`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Expected 200, got ${res.status}`);
    const body = await res.json();
    if (!body.success || !Array.isArray(body.data)) throw new Error('Invalid partners response');
    if (body.data.length < 2) throw new Error(`Expected at least 2 partners, got ${body.data.length}`);
  });

  console.log('\n------------------------------------------------------');
  console.log(`  SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('------------------------------------------------------\n');

  await pool.end();
  if (passed !== total) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
