import { MongoClient } from 'mongodb';
import fs from 'fs';

let mongoUri = process.env.MONGODB_URI || '';
let dbName = process.env.MONGODB_DB || 'rd_jeans_factory';

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('MONGODB_URI=') && !mongoUri) {
      mongoUri = trimmed.substring('MONGODB_URI='.length).trim();
    }
    if (trimmed.startsWith('MONGODB_DB=') && dbName === 'rd_jeans_factory') {
      dbName = trimmed.substring('MONGODB_DB='.length).trim();
    }
  }
}

const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function log(section, msg, status = 'INFO') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
  console.log(`${icon} [${section}] ${msg}`);
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('  RD JEANS FACTORY - FULL SUITE INTEGRATION TESTS (MONGODB)');
  console.log('======================================================\n');

  await client.connect();
  const db = client.db(dbName);

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

  // 1. Database Collections Check
  await test('Database: Check all core collections exist in MongoDB Atlas', async () => {
    const collections = await db.listCollections().toArray();
    const colNames = collections.map(c => c.name);
    const expected = [
      'users', 'employees', 'upad_records', 'salaries', 'seths', 
      'rolls', 'cutting_entries', 'finished_goods',
      'incomes', 'expenses', 'cash_book_ledger', 'partners'
    ];
    for (const t of expected) {
      // Collections can be empty but exist
      const count = await db.collection(t).countDocuments();
      if (typeof count !== 'number') throw new Error(`Cannot query collection: ${t}`);
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

  console.log('\n------------------------------------------------------');
  console.log(`  SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('------------------------------------------------------\n');

  await client.close();
  if (passed !== total) {
    process.exit(1);
  }
  process.exit(0);
}

runAllTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
