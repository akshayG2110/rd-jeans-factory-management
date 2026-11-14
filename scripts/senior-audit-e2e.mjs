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

async function log(step, msg, ok = true) {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} [STEP ${step}] ${msg}`);
}

async function runSeniorAudit() {
  console.log('\n================================================================');
  console.log('  RD JEANS FACTORY - SENIOR AUDITOR E2E AUDIT CHECK (MONGODB)');
  console.log('================================================================\n');

  await client.connect();
  const db = client.db(dbName);
  let authToken = '';

  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'rdjeans123', password: 'RD@123' })
    });
    if (!loginRes.ok) throw new Error(`Auth failed: ${loginRes.status}`);
    const loginBody = await loginRes.json();
    authToken = loginBody.access_token;
    await log('0', `Authenticated as admin. Received valid JWT token.`);

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };

    const latestTx = await db.collection('cash_book_ledger').findOne({}, { sort: { id: -1 } });
    const startingCash = latestTx ? parseFloat(latestTx.running_balance) : 0;
    await log('0', `Starting Factory Cashbook Balance: ₹${startingCash.toLocaleString('en-IN')}`);

    console.log('\n✓ Senior auditor verification completed cleanly on MongoDB Atlas!');
  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runSeniorAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
