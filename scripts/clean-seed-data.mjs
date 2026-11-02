import { Pool } from 'pg'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf8')
let dbUrl = ''
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.split('=')[1].trim()
  }
}

const pool = new Pool({ connectionString: dbUrl })

async function cleanSeedData() {
  const client = await pool.connect()
  try {
    console.log('Cleaning seed data from database...')
    await client.query('BEGIN')

    // 1. Truncate all transactional and master seed data tables with CASCADE and RESTART IDENTITY
    const tablesToTruncate = [
      'finished_goods',
      'cutting_entries',
      'rolls',
      'seth_payments',
      'seths',
      'salary_payments',
      'salaries',
      'upad_records',
      'employee_advances',
      'attendance',
      'employees',
      'expenses',
      'factory_expenses',
      'incomes',
      'cash_book_ledger',
      'cash_book',
      'partner_transactions',
      'audit_logs'
    ]

    console.log(`Truncating tables: ${tablesToTruncate.join(', ')}...`)
    await client.query(`TRUNCATE TABLE ${tablesToTruncate.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`)

    // 2. Reset factory_balance to 0.00
    console.log('Resetting factory_balance to 0.00...')
    await client.query(`UPDATE factory_balance SET current_balance = 0.00, last_updated = CURRENT_TIMESTAMP;`)

    // 3. Reset partner balances to 0.00
    console.log('Resetting partner opening and current balances to 0.00...')
    await client.query(`UPDATE partners SET opening_balance = 0.00, current_balance = 0.00, updated_at = CURRENT_TIMESTAMP;`)

    await client.query('COMMIT')
    console.log('✓ Successfully cleaned all seed data and reset all records to 0!')

    // Print summary
    console.log('\n--- VERIFYING TABLE ROW COUNTS ---')
    const allTables = [...tablesToTruncate, 'factory_balance', 'partners', 'users']
    for (const t of allTables) {
      const res = await client.query(`SELECT count(*) FROM "${t}"`)
      console.log(`${t}: ${res.rows[0].count} rows`)
    }

    const balRes = await client.query(`SELECT current_balance FROM factory_balance LIMIT 1`)
    console.log(`Factory balance: ₹${balRes.rows[0]?.current_balance || '0.00'}`)

    const partnerRes = await client.query(`SELECT name, opening_balance, current_balance FROM partners`)
    console.log('Partners:', partnerRes.rows)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Failed to clean seed data:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

cleanSeedData().catch(console.error)

