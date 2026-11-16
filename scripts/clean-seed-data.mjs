import { MongoClient } from 'mongodb'
import fs from 'fs'
import bcrypt from 'bcryptjs'

// Load environment variables from .env.local if present
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
  console.error('Error: MONGODB_URI is not set in environment or .env.local')
  process.exit(1)
}

const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 8000 })

async function cleanDatabase() {
  try {
    console.log('================================================================')
    console.log('       RD JEANS FACTORY - RESET & CLEAN DATABASE SCRIPT         ')
    console.log('================================================================\n')
    console.log(`Connecting to MongoDB Atlas database: ${dbName}...`)
    await client.connect()
    console.log('✓ Connected successfully!\n')

    const db = client.db(dbName)

    // 1. Transactional and master collections to completely empty
    const collectionsToClean = [
      'employees',
      'seths',
      'seth_payments',
      'rolls',
      'cutting_entries',
      'finished_goods',
      'salaries',
      'upad_records',
      'incomes',
      'expenses',
      'cash_book_ledger',
      'partners',
      'partner_transactions',
      'attendance',
      'audit_logs',
      'system_checks'
    ]

    console.log('Clearing all transactional and operational data...')
    for (const colName of collectionsToClean) {
      const res = await db.collection(colName).deleteMany({})
      console.log(`  - ${colName}: deleted ${res.deletedCount} documents`)
    }

    // 2. Reset ID counters so next entries start from sequence ID 1
    console.log('\nResetting all ID counters...')
    await db.collection('counters').deleteMany({})
    console.log('  - counters: cleared (next inserts will start with ID 1)')

    // 3. Reset factory_balance to 0.00
    console.log('\nResetting factory_balance to 0.00...')
    await db.collection('factory_balance').deleteMany({})
    await db.collection('factory_balance').insertOne({
      id: 1,
      current_balance: 0.0,
      last_updated: new Date().toISOString()
    })
    console.log('  - factory_balance: set to ₹0.00')

    // 4. Ensure admin users (rdjeans123 & SuperAdmin AkshayGohel21) are preserved
    console.log('\nEnsuring default user (rdjeans123) and Super Admin (AkshayGohel21)...')
    await db.collection('users').deleteMany({})
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash('RD@123', salt)
    const superAdminHash = await bcrypt.hash('Akshay21', salt)

    await db.collection('users').insertMany([
      {
        id: 1,
        username: 'rdjeans123',
        display_name: 'RD Staff Admin',
        role: 'Admin',
        status: 'Active',
        password_hash: hash,
        created_at: new Date().toISOString()
      },
      {
        id: 999,
        username: 'AkshayGohel21',
        display_name: 'Akshay Gohel (Super Admin)',
        role: 'SuperAdmin',
        status: 'Active',
        password_hash: superAdminHash,
        created_at: new Date().toISOString()
      }
    ])
    await db.collection('counters').updateOne(
      { _id: 'users' },
      { $set: { seq: 1 } },
      { upsert: true }
    )
    console.log('  - users: rdjeans123 and AkshayGohel21 configured successfully')

    console.log('\n================================================================')
    console.log('               DATABASE CLEANUP VERIFICATION                    ')
    console.log('================================================================')
    const allCollections = [
      ...collectionsToClean,
      'factory_balance',
      'partners',
      'users',
      'counters'
    ]
    for (const c of allCollections) {
      const count = await db.collection(c).countDocuments()
      console.log(`  - ${c.padEnd(25)}: ${count} documents`)
    }

    console.log('\n✓ All sample/test data has been successfully cleared!')
    console.log('✓ Factory balance and partner balances are at ₹0.00')
    console.log('✓ Counters are reset to start fresh at ID 1')
    console.log('✓ Admin user rdjeans123 is ready for login\n')
    process.exit(0)
  } catch (err) {
    console.error('❌ Database cleanup failed:', err)
    process.exit(1)
  } finally {
    await client.close()
  }
}

cleanDatabase()
