import { Pool } from 'pg'
import { MongoClient } from 'mongodb'
import fs from 'fs'

// Load .env.local
const envContent = fs.readFileSync('.env.local', 'utf8')
let mongoUri = ''
let pgUrl = ''

for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (trimmed.startsWith('MONGODB_URI=') && !trimmed.startsWith('#')) {
    mongoUri = trimmed.replace('MONGODB_URI=', '').trim()
  }
  if (trimmed.startsWith('DATABASE_URL=') && !trimmed.startsWith('#')) {
    pgUrl = trimmed.replace('DATABASE_URL=', '').trim()
  }
}

if (!mongoUri) {
  console.error('No MONGODB_URI found in .env.local')
  process.exit(1)
}
if (!pgUrl) {
  pgUrl = 'postgresql://postgres:2110@localhost:5432/rd_jeans_factory'
}

const pool = new Pool({ connectionString: pgUrl })
const mongo = new MongoClient(mongoUri)

async function migrate() {
  console.log('Connecting to PostgreSQL and MongoDB Atlas...')
  await pool.connect()
  await mongo.connect()
  const db = mongo.db('rd_jeans_factory')
  console.log('Connected to both databases successfully!')

  const tables = [
    'users',
    'employees',
    'seths',
    'seth_payments',
    'partners',
    'partner_transactions',
    'rolls',
    'cutting_entries',
    'finished_goods',
    'salaries',
    'upad_records',
    'incomes',
    'expenses',
    'cash_book_ledger',
    'attendance',
    'audit_logs',
    'factory_balance'
  ]

  for (const table of tables) {
    try {
      const pgRes = await pool.query(`SELECT * FROM ${table} ORDER BY id ASC`)
      const rows = pgRes.rows

      console.log(`Migrating ${rows.length} records from PostgreSQL table: ${table}...`)
      if (rows.length > 0) {
        const col = db.collection(table)
        // Upsert by numeric id
        for (const row of rows) {
          const doc = { ...row }
          delete doc._id
          await col.updateOne({ id: doc.id }, { $set: doc }, { upsert: true })
        }

        // Update counter for auto-incrementing id
        const maxId = Math.max(...rows.map(r => r.id))
        await db.collection('counters').updateOne(
          { _id: table },
          { $max: { seq: maxId } },
          { upsert: true }
        )
      } else {
        // Initialize counter to 0 if empty
        await db.collection('counters').updateOne(
          { _id: table },
          { $setOnInsert: { seq: 0 } },
          { upsert: true }
        )
      }
    } catch (err) {
      console.warn(`Table ${table} skipped or error:`, err.message)
    }
  }

  // Ensure default user exists
  const usersCol = db.collection('users')
  const defaultUser = await usersCol.findOne({ username: 'rdjeans123' })
  if (!defaultUser) {
    await usersCol.insertOne({
      id: 1,
      username: 'rdjeans123',
      password_hash: '$2b$10$wILqCdL9YSDbkRtMO4r0F.o2Xq82t0WbTXjtqXhsTBtCrZhQuGau.',
      created_at: new Date().toISOString()
    })
    console.log('Default user (rdjeans123) seeded into MongoDB Atlas.')
  }

  // Ensure default partners exist
  const partnersCol = db.collection('partners')
  const pCount = await partnersCol.countDocuments()
  if (pCount === 0) {
    await partnersCol.insertMany([
      {
        id: 1,
        name: 'Rajubhai',
        mobile_number: null,
        profit_share_percentage: 50.00,
        opening_balance: 0.00,
        current_balance: 0.00,
        status: 'Active',
        notes: 'Co-Founder & Managing Partner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Dhruveshbhai',
        mobile_number: null,
        profit_share_percentage: 50.00,
        opening_balance: 0.00,
        current_balance: 0.00,
        status: 'Active',
        notes: 'Co-Founder & Financial Partner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    console.log('Default partners seeded into MongoDB Atlas.')
  }

  // Create unique indexes
  await usersCol.createIndex({ username: 1 }, { unique: true }).catch(() => {})
  await db.collection('seths').createIndex({ seth_name: 1 }).catch(() => {})
  await db.collection('rolls').createIndex({ roll_number: 1 }, { unique: true, sparse: true }).catch(() => {})
  await db.collection('cutting_entries').createIndex({ lot_number: 1 }, { unique: true, sparse: true }).catch(() => {})
  await db.collection('partners').createIndex({ name: 1 }, { unique: true, sparse: true }).catch(() => {})

  console.log('✓ Migration to MongoDB Atlas completed successfully!')
  await pool.end()
  await mongo.close()
  process.exit(0)
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
