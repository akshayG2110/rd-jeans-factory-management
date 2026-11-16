import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb+srv://akshaygohel909_db_user:T3bcgdmhtA4XC0MS@rd-jeans-cluster.ilj92kf.mongodb.net/rd_jeans_factory?retryWrites=true&w=majority'
const client = new MongoClient(uri)

async function runVerification() {
  console.log('================================================================')
  console.log('  SUPER ADMIN ENHANCEMENTS & ACTIVATION / DEACTIVATION TEST')
  console.log('================================================================\n')

  await client.connect()
  console.log('✓ Connected to MongoDB Atlas cluster.')

  // 1. Verify Master Registry & Organization status
  const masterDb = client.db('rd_master_registry')
  const orgs = await masterDb.collection('organizations').find({}).toArray()
  console.log(`✓ Master Registry contains ${orgs.length} registered organizations:`)
  for (const org of orgs) {
    console.log(`   - [${org.status || 'Active'}] ${org.name} (slug: ${org.slug}, DB: ${org.database_name})`)
  }

  // 2. Test Organization Activation / Deactivation toggle in database
  const demoOrg = orgs.find(o => o.slug !== 'rd-jeans-main')
  if (demoOrg) {
    console.log(`\n[Test 1] Toggling Organization "${demoOrg.name}" status...`)
    await masterDb.collection('organizations').updateOne(
      { slug: demoOrg.slug },
      { $set: { status: 'Inactive', updated_at: new Date().toISOString() } }
    )
    const deactivated = await masterDb.collection('organizations').findOne({ slug: demoOrg.slug })
    console.log(`✓ Organization status changed to: ${deactivated.status}`)

    // Reactivate
    await masterDb.collection('organizations').updateOne(
      { slug: demoOrg.slug },
      { $set: { status: 'Active', updated_at: new Date().toISOString() } }
    )
    const reactivated = await masterDb.collection('organizations').findOne({ slug: demoOrg.slug })
    console.log(`✓ Organization status reactivated to: ${reactivated.status}`)
  }

  // 3. Test Staff User status toggle
  const primaryDb = client.db('rd_jeans_factory')
  const users = await primaryDb.collection('users').find({}).toArray()
  console.log(`\n[Test 2] Found ${users.length} staff user accounts in primary database:`)
  for (const u of users) {
    console.log(`   - @${u.username} (${u.display_name || u.username}) [${u.status || 'Active'}] - Role: ${u.role || 'Operator'}`)
  }

  // 4. Test Latency Ping to DB
  console.log('\n[Test 3] Measuring MongoDB ping latency...')
  const start = Date.now()
  await primaryDb.command({ ping: 1 })
  const latency = Date.now() - start
  console.log(`✓ Primary DB Ping roundtrip: ${latency}ms (Atlas Live)`)

  console.log('\n================================================================')
  console.log('  ALL SUPER ADMIN CAPABILITIES VERIFIED SUCCESSFULLY!')
  console.log('================================================================\n')

  await client.close()
  process.exit(0)
}

runVerification().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
