import { MongoClient } from 'mongodb'
import fs from 'fs'

// Load environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8')
let mongoUri = 'mongodb://localhost:27017/rd_jeans_uat'
let dbName = 'rd_jeans_uat'

for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (trimmed.startsWith('#')) continue
  if (trimmed.startsWith('MONGODB_URI=')) {
    mongoUri = trimmed.substring('MONGODB_URI='.length).trim()
  }
  if (trimmed.startsWith('MONGODB_DB=')) {
    dbName = trimmed.substring('MONGODB_DB='.length).trim()
  }
}

// Mask credentials in logs if any
const maskedUri = mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')

console.log('================================================================')
console.log('  RD JEANS FACTORY - MONGODB UAT DATABASE CONNECTION TEST')
console.log('================================================================\n')
console.log(`Connecting to: ${maskedUri}`)
console.log(`Target Database: ${dbName}\n`)

const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 })

async function run() {
  const startTime = Date.now()
  try {
    await client.connect()
    const pingTime = Date.now() - startTime
    console.log(`✓ Connected to MongoDB in ${pingTime}ms!`)

    const db = client.db(dbName)
    const pingResult = await db.command({ ping: 1 })
    console.log(`✓ Ping command response:`, pingResult)

    // Verify Collections
    const collections = await db.listCollections().toArray()
    console.log(`\nExisting Collections in "${dbName}" (${collections.length}):`)
    collections.forEach(c => console.log(`  - ${c.name}`))

    // Test Write & Read verification
    const testColl = db.collection('system_checks')
    const testDoc = {
      test: 'UAT Connectivity Check',
      timestamp: new Date(),
      status: 'SUCCESS'
    }
    const insertRes = await testColl.insertOne(testDoc)
    console.log(`\n✓ Test write successful (ID: ${insertRes.insertedId})`)

    const readDoc = await testColl.findOne({ _id: insertRes.insertedId })
    console.log(`✓ Test read verification successful:`, readDoc?.test)

    console.log('\n================================================================')
    console.log('  STATUS: MONGODB UAT DATABASE IS FULLY FUNCTIONAL AND READY!   ')
    console.log('================================================================\n')
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message)
    process.exit(1)
  } finally {
    await client.close()
  }
}

run()

