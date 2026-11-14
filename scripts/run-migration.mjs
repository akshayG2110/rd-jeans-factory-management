import { MongoClient } from 'mongodb'
import fs from 'fs'

let mongoUri = process.env.MONGODB_URI || ''
let dbName = process.env.MONGODB_DB || 'rd_jeans_factory'

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#')) continue
    if (trimmed.startsWith('MONGODB_URI=') && !mongoUri) {
      mongoUri = trimmed.substring('MONGODB_URI='.length).trim()
    }
    if (trimmed.startsWith('MONGODB_DB=') && dbName === 'rd_jeans_factory') {
      dbName = trimmed.substring('MONGODB_DB='.length).trim()
    }
  }
}

if (!mongoUri) {
  console.error('Error: MONGODB_URI not found.')
  process.exit(1)
}

const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 })

async function run() {
  console.log('Connecting to MongoDB Atlas for database setup...')
  await client.connect()
  const db = client.db(dbName)
  console.log(`✓ Connected to ${dbName}! Setting up high-performance indexes...`)

  const indexDefinitions = [
    { col: 'users', spec: { username: 1 }, options: { unique: true } },
    { col: 'employees', spec: { id: 1 }, options: { unique: true } },
    { col: 'employees', spec: { status: 1 } },
    { col: 'seths', spec: { id: 1 }, options: { unique: true } },
    { col: 'seths', spec: { seth_name: 1 } },
    { col: 'seth_payments', spec: { seth_id: 1, payment_date: -1 } },
    { col: 'rolls', spec: { id: 1 }, options: { unique: true } },
    { col: 'rolls', spec: { seth_id: 1, status: 1 } },
    { col: 'cutting_entries', spec: { id: 1 }, options: { unique: true } },
    { col: 'cutting_entries', spec: { roll_id: 1 } },
    { col: 'finished_goods', spec: { id: 1 }, options: { unique: true } },
    { col: 'finished_goods', spec: { lot_no: 1 } },
    { col: 'salaries', spec: { id: 1 }, options: { unique: true } },
    { col: 'salaries', spec: { employee_id: 1, payment_date: -1 } },
    { col: 'upad_records', spec: { id: 1 }, options: { unique: true } },
    { col: 'upad_records', spec: { employee_id: 1, status: 1 } },
    { col: 'incomes', spec: { id: 1 }, options: { unique: true } },
    { col: 'incomes', spec: { income_date: -1 } },
    { col: 'expenses', spec: { id: 1 }, options: { unique: true } },
    { col: 'expenses', spec: { expense_date: -1 } },
    { col: 'cash_book_ledger', spec: { id: 1 }, options: { unique: true } },
    { col: 'cash_book_ledger', spec: { entry_date: -1 } },
    { col: 'partners', spec: { id: 1 }, options: { unique: true } },
    { col: 'partner_transactions', spec: { partner_id: 1, transaction_date: -1 } }
  ]

  for (const { col, spec, options } of indexDefinitions) {
    try {
      await db.collection(col).createIndex(spec, options || {})
      console.log(`  ✓ Index on ${col}: ${JSON.stringify(spec)}`)
    } catch (err) {
      console.warn(`  Warning on index ${col}:`, err.message)
    }
  }

  console.log('\n✓ All MongoDB Atlas collections and indexes configured successfully!')
  await client.close()
  process.exit(0)
}

run().catch(err => {
  console.error('Setup failed:', err)
  process.exit(1)
})
