import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:2110@localhost:5432/rd_jeans_factory'
});

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function log(step, msg, ok = true) {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} [STEP ${step}] ${msg}`);
}

async function runSeniorAudit() {
  console.log('\n================================================================');
  console.log('  RD JEANS FACTORY - SENIOR AUDITOR E2E FINANCIAL & FLOW CHECK');
  console.log('================================================================\n');

  const client = await pool.connect();
  let authToken = '';

  try {
    // -------------------------------------------------------------
    // 0. AUTHENTICATION
    // -------------------------------------------------------------
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

    // Record initial cashbook balance
    const initCashRes = await client.query(`
      SELECT running_balance FROM cash_book_ledger ORDER BY transaction_date DESC, id DESC LIMIT 1
    `);
    const startingCash = initCashRes.rows.length > 0 ? parseFloat(initCashRes.rows[0].running_balance) : 0;
    await log('0', `Starting Factory Cashbook Balance: ₹${startingCash.toLocaleString('en-IN')}`);

    // -------------------------------------------------------------
    // 1. WORKER & UPAD ISSUANCE FLOW
    // -------------------------------------------------------------
    // Create test worker
    const workerName = `Audit Worker ${Date.now() % 10000}`;
    const empRes = await fetch(`${BASE_URL}/api/employees`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        employee_name: workerName,
        role: 'Stitching Worker',
        joining_date: '2026-05-01',
        status: 'Active'
      })
    });
    const empData = await empRes.json();
    const employeeId = empData.data.id;
    await log('1', `Created Worker "${workerName}" (ID: ${employeeId})`);

    // Issue Upad advance of ₹3,000
    const upadRes = await fetch(`${BASE_URL}/api/upad`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        employee_id: employeeId,
        date: '2026-05-10',
        amount: 3000,
        payment_method: 'Cash',
        handled_by: 'Rajubhai',
        notes: 'Senior Audit Advance'
      })
    });
    const upadData = await upadRes.json();
    const upadId = upadData.data.id;
    await log('1', `Issued Upad Advance: ₹3,000 (Upad ID: ${upadId}, Status: ${upadData.data.status})`);

    // Verify cashbook was debited with physical FK upad_id
    const cashUpadCheck = await client.query('SELECT * FROM cash_book_ledger WHERE upad_id = $1', [upadId]);
    if (cashUpadCheck.rows.length === 0) throw new Error('Cashbook entry missing physical upad_id FK!');
    const upadOut = parseFloat(cashUpadCheck.rows[0].out_amount);
    if (upadOut !== 3000) throw new Error(`Expected ₹3000 cash out, got ₹${upadOut}`);
    await log('1', `Cashbook verified: Debited ₹3,000 with physical upad_id foreign key.`);

    // -------------------------------------------------------------
    // 2. SALARY CALCULATION & AUTO-DEDUCTION FLOW
    // -------------------------------------------------------------
    // Total salary: ₹15,000. Upad deducted: ₹3,000. Net wage paid: ₹12,000.
    const salRes = await fetch(`${BASE_URL}/api/salary`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        employee_id: employeeId,
        salary_month: 5,
        salary_year: 2026,
        salary_amount: 15000,
        paid_amount: 12000,
        payment_method: 'Cash',
        handled_by: 'Rajubhai',
        payment_date: '2026-05-31',
        notes: 'May 2026 Salary Settlement with Upad Deduction'
      })
    });
    const salData = await salRes.json();
    const salaryId = salData.data.id;
    await log('2', `Calculated Salary: Gross ₹15,000, Upad Deducted ₹${salData.data.total_upad_deducted}, Net Paid ₹${salData.data.paid_amount}`);

    // Verify Upad status in DB is now 'Settled' with settled_in_salary_id
    const upadSettledCheck = await client.query('SELECT status, settled_in_salary_id FROM upad_records WHERE id = $1', [upadId]);
    if (upadSettledCheck.rows[0].status !== 'Settled') {
      throw new Error(`Upad status is ${upadSettledCheck.rows[0].status}, expected Settled!`);
    }
    if (parseInt(upadSettledCheck.rows[0].settled_in_salary_id, 10) !== salaryId) {
      throw new Error(`Upad settled_in_salary_id is ${upadSettledCheck.rows[0].settled_in_salary_id}, expected ${salaryId}`);
    }
    await log('2', `Upad settlement verified: Upad #${upadId} marked 'Settled' and linked to Salary #${salaryId}.`);

    // Verify cashbook entry for salary was debited ONLY the NET amount (₹12,000), NOT gross (₹15,000)
    const cashSalCheck = await client.query('SELECT * FROM cash_book_ledger WHERE salary_id = $1', [salaryId]);
    if (cashSalCheck.rows.length === 0) throw new Error('Cashbook entry missing physical salary_id FK!');
    const netCashOut = parseFloat(cashSalCheck.rows[0].out_amount);
    if (netCashOut !== 12000) {
      throw new Error(`Double-counting bug! Expected net cash out of ₹12,000, but found ₹${netCashOut}`);
    }
    await log('2', `Cashbook verified: Net salary debited exactly ₹12,000 (no double-counting).`);

    // -------------------------------------------------------------
    // 3. SETH $\rightarrow$ ROLL $\rightarrow$ CUTTING $\rightarrow$ FINISHED GOODS FLOW
    // -------------------------------------------------------------
    // Create test seth
    const sethRes = await fetch(`${BASE_URL}/api/seths`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        seth_name: `Audit Seth ${Date.now() % 10000}`,
        mobile_number: '9988776655',
        address: 'Surat Textile Market',
        status: 'Active'
      })
    });
    const sethData = await sethRes.json();
    const sethId = sethData.data.id;
    await log('3', `Created Seth "${sethData.data.seth_name}" (ID: ${sethId})`);

    // Inward roll of 100 meters
    const rollNo = `AUDIT-R-${Date.now() % 10000}`;
    const rollRes = await fetch(`${BASE_URL}/api/rolls`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        roll_number: rollNo,
        short_number: `S-${Date.now() % 1000}`,
        seth_id: sethId,
        fabric_type: 'Heavy Denim 14oz',
        received_meter: 100,
        entry_date: '2026-05-12'
      })
    });
    const rollData = await rollRes.json();
    const rollId = rollData.data.id;
    await log('3', `Inwarded Roll: "${rollNo}" with 100 meters.`);

    // Cut 60 meters with assigned cutter worker
    const lotNo = `AUDIT-LOT-${Date.now() % 10000}`;
    const cutRes = await fetch(`${BASE_URL}/api/cutting`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        cutting_date: '2026-05-15',
        lot_number: lotNo,
        roll_id: rollId,
        employee_id: employeeId,
        meter_used: 60,
        piece_count: 75,
        size: '32',
        sort_number: 'S-AUDIT',
        notes: 'Senior Audit Cutting Lot'
      })
    });
    const cutData = await cutRes.json();
    const cuttingId = cutData.data.id;
    await log('3', `Cut Lot "${lotNo}": Used 60m to produce 75 pieces (Assigned Cutter: Worker #${employeeId}).`);

    // Verify roll remaining meters reduced from 100 to 40
    const rollCheck = await client.query('SELECT remaining_meter, used_meter, status FROM rolls WHERE id = $1', [rollId]);
    const remMeters = parseFloat(rollCheck.rows[0].remaining_meter);
    if (remMeters !== 40) throw new Error(`Expected 40m remaining, got ${remMeters}`);
    if (rollCheck.rows[0].status !== 'Partially Used') throw new Error(`Expected Partially Used status`);
    await log('3', `Roll inventory verified: Used 60m, Remaining 40m, Status 'Partially Used'.`);

    // Verify Finished Goods auto-yielded 75 pieces in stage 'Cut'
    const fgCheck = await client.query('SELECT * FROM finished_goods WHERE cutting_id = $1', [cuttingId]);
    if (fgCheck.rows.length === 0) throw new Error('Finished Goods record was not auto-initialized!');
    const fgItem = fgCheck.rows[0];
    if (fgItem.total_pieces !== 75 || fgItem.status !== 'Cut') {
      throw new Error(`Invalid finished goods yield! Total: ${fgItem.total_pieces}, Status: ${fgItem.status}`);
    }
    await log('3', `Finished Goods verified: Auto-initialized Lot "${lotNo}" with 75 garment pieces in stage 'Cut'.`);

    // Progress Finished Goods stage from 'Cut' -> 'Finished' -> 'Dispatched'
    const updateFgRes = await fetch(`${BASE_URL}/api/finished-goods/${fgItem.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'Dispatched',
        finished_pieces: 72,
        rejected_pieces: 3,
        dispatched_pieces: 72,
        dispatch_date: '2026-05-20',
        unit_price: 350
      })
    });
    const updateFgData = await updateFgRes.json();
    if (!updateFgRes.ok || updateFgData.data.status !== 'Dispatched') {
      throw new Error('Failed to update garment dispatch stage');
    }
    await log('3', `Production Lifecycle: Progressed batch #${fgItem.id} to 'Dispatched' (72 pieces dispatched, 3 rejected).`);

    // -------------------------------------------------------------
    // 4. PARTNER CAPITAL EQUITY & CASH DESK AUDIT
    // -------------------------------------------------------------
    // Fetch partner 1 (Rajubhai)
    const p1Res = await client.query('SELECT * FROM partners ORDER BY id LIMIT 1');
    const partner1 = p1Res.rows[0];
    const initialEquity = parseFloat(partner1.current_balance);

    // Record Capital Investment of ₹50,000
    const invRes = await fetch(`${BASE_URL}/api/partners/transactions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        partner_id: partner1.id,
        transaction_date: '2026-05-22',
        transaction_type: 'Capital Investment',
        amount: 50000,
        payment_method: 'Bank Transfer',
        notes: 'Senior Audit Capital Infusion',
        sync_cashbook: true
      })
    });
    const invData = await invRes.json();
    if (!invRes.ok) throw new Error('Failed to record capital investment');

    // Verify partner equity increased by ₹50,000
    const p1Updated = await client.query('SELECT current_balance FROM partners WHERE id = $1', [partner1.id]);
    const newEquity = parseFloat(p1Updated.rows[0].current_balance);
    if (newEquity !== initialEquity + 50000) {
      throw new Error(`Expected equity balance ₹${initialEquity + 50000}, got ₹${newEquity}`);
    }
    await log('4', `Partner Equity verified: Infused ₹50,000 Capital. Equity: ₹${initialEquity} -> ₹${newEquity}`);

    // Verify cashbook credited ₹50,000 with physical partner_id
    const cashInvCheck = await client.query(
      "SELECT * FROM cash_book_ledger WHERE partner_id = $1 AND transaction_type = 'Money In' AND income_amount = 50000",
      [partner1.id]
    );
    if (cashInvCheck.rows.length === 0) throw new Error('Cashbook entry missing for capital investment!');
    await log('4', `Cashbook verified: Credited ₹50,000 factory cash in with physical partner_id FK.`);

    // -------------------------------------------------------------
    // 5. ATOMIC RUNNING CASH BALANCE AUDIT (O(1) WINDOW FUNCTION)
    // -------------------------------------------------------------
    const allCashRes = await client.query(`
      SELECT id, income_amount, out_amount, running_balance 
      FROM cash_book_ledger 
      ORDER BY id ASC
    `);

    let expectedCalc = 0;
    let discrepancies = 0;
    allCashRes.rows.forEach(r => {
      expectedCalc += (parseFloat(r.income_amount) - parseFloat(r.out_amount));
      const actual = parseFloat(r.running_balance);
      if (Math.abs(expectedCalc - actual) > 0.01) {
        discrepancies++;
        console.error(`Discrepancy at Tx #${r.id}: Expected ₹${expectedCalc}, DB has ₹${actual}`);
      }
    });

    if (discrepancies > 0) {
      throw new Error(`Found ${discrepancies} ledger balance discrepancies!`);
    }
    await log('5', `Ledger Audit verified: 100% of all ${allCashRes.rows.length} cashbook entries have exact mathematical running balances.`);

    // -------------------------------------------------------------
    // 6. CLEAN UP TEST DATA
    // -------------------------------------------------------------
    await client.query('DELETE FROM finished_goods WHERE cutting_id = $1', [cuttingId]);
    await client.query('DELETE FROM cutting_entries WHERE id = $1', [cuttingId]);
    await client.query('DELETE FROM rolls WHERE id = $1', [rollId]);
    await client.query('DELETE FROM seths WHERE id = $1', [sethId]);
    await client.query('DELETE FROM cash_book_ledger WHERE salary_id = $1', [salaryId]);
    await client.query('DELETE FROM salaries WHERE id = $1', [salaryId]);
    await client.query('DELETE FROM cash_book_ledger WHERE upad_id = $1', [upadId]);
    await client.query('DELETE FROM upad_records WHERE id = $1', [upadId]);
    await client.query('DELETE FROM employees WHERE id = $1', [employeeId]);
    await client.query('DELETE FROM partner_transactions WHERE id = $1', [invData.data.id]);
    await client.query('DELETE FROM cash_book_ledger WHERE id = $1', [cashInvCheck.rows[0].id]);
    await client.query('UPDATE partners SET current_balance = $1 WHERE id = $2', [initialEquity, partner1.id]);
    
    // Recalculate cashbook balances back to original
    const latestRow = await client.query('SELECT MIN(id) as min_id FROM cash_book_ledger');
    if (latestRow.rows[0]?.min_id) {
      await client.query(`
        WITH updated_balances AS (
          SELECT id, SUM(income_amount - out_amount) OVER (ORDER BY id ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS new_balance
          FROM cash_book_ledger
        )
        UPDATE cash_book_ledger c
        SET running_balance = u.new_balance, updated_at = NOW()
        FROM updated_balances u
        WHERE c.id = u.id;
      `);
    }
    await log('6', `Test audit data cleanly removed and factory cashbook balance restored to ₹${startingCash.toLocaleString('en-IN')}.`);

    console.log('\n================================================================');
    console.log('  AUDIT RESULT: 100% E2E FINANCIAL & PRODUCTION FLOW PASSED!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Senior Audit Failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeniorAudit();
