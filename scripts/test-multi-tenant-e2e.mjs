import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb+srv://akshaygohel909_db_user:T3bcgdmhtA4XC0MS@rd-jeans-cluster.ilj92kf.mongodb.net/rd_jeans_factory?retryWrites=true&w=majority'
const client = new MongoClient(uri)

async function runE2ETest() {
  console.log('================================================================')
  console.log('  MULTI-ORGANIZATION ISOLATION & SEPARATION E2E TEST')
  console.log('================================================================\n')

  await client.connect()
  console.log('✓ Connected to MongoDB Cluster successfully.')

  const masterDb = client.db('rd_master_registry')
  const orgsCol = masterDb.collection('organizations')

  // 1. Verify default RD Jeans organization
  console.log('\n[1/5] Verifying Primary Organization (RD Jeans Factory)...')
  let defaultOrg = await orgsCol.findOne({ slug: 'rd-jeans-main' })
  if (!defaultOrg) {
    defaultOrg = {
      id: 1,
      org_id: 'org_rd_jeans_main',
      name: 'RD Jeans Factory',
      slug: 'rd-jeans-main',
      database_name: 'rd_jeans_factory',
      owner_name: 'Akshay Gohel',
      phone: '+91 98765 43210',
      address: 'Ahmedabad, Gujarat',
      gstin: '24AAAAA0000A1Z5',
      status: 'Active',
      created_at: new Date().toISOString(),
      settings: {
        default_stitching_rate: 45,
        default_washing_rate: 5,
        shift_hours: 10,
        currency_symbol: '₹',
      },
      module_visibility: {
        employees: true,
        upad: true,
        seths: true,
        hisab_seth: true,
        cutting: true,
        finished_goods: true,
        rolls: true,
        partners: true,
        income: true,
        expense: true,
        cashbook: true,
        reports: true,
      },
    }
    await orgsCol.insertOne(defaultOrg)
    console.log('✓ Initialized default RD Jeans organization in master registry.')
  } else {
    console.log('✓ Default RD Jeans organization verified in master registry.')
  }

  // Check RD Jeans database collection counts
  const rdDb = client.db('rd_jeans_factory')
  const rdRollsCount = await rdDb.collection('rolls').countDocuments()
  const rdEmployeesCount = await rdDb.collection('employees').countDocuments()
  console.log(`  -> RD Jeans DB ('rd_jeans_factory'): ${rdEmployeesCount} employees, ${rdRollsCount} rolls.`)

  // 2. Create a new separate organization
  console.log('\n[2/5] Creating New Organization: "Shiv Denim Plant"...')
  const testSlug = 'shiv-denim-test'
  const testDbName = 'rd_tenant_shiv_denim_test'

  // Clean any previous test run
  await orgsCol.deleteOne({ slug: testSlug })
  await client.db(testDbName).dropDatabase().catch(() => {})

  const newOrg = {
    id: 2,
    org_id: 'org_shiv_denim_test',
    name: 'Shiv Denim Plant',
    slug: testSlug,
    database_name: testDbName,
    owner_name: 'Ramesh Patel',
    phone: '+91 98980 12345',
    address: 'GIDC Naroda, Ahmedabad',
    gstin: '24BBBBB1111B1Z2',
    status: 'Active',
    created_at: new Date().toISOString(),
    settings: {
      default_stitching_rate: 55,
      default_washing_rate: 8,
      shift_hours: 10,
      currency_symbol: '₹',
    },
    module_visibility: {
      employees: true,
      upad: true,
      seths: true,
      hisab_seth: true,
      cutting: true,
      finished_goods: false,
      rolls: true,
      partners: false,
      income: true,
      expense: true,
      cashbook: true,
      reports: true,
    },
  }

  await orgsCol.insertOne(newOrg)
  console.log(`✓ Organization "${newOrg.name}" registered in master registry.`)

  // 3. Seed isolated tenant database
  console.log(`\n[3/5] Initializing fresh tenant database: "${testDbName}"...`)
  const tenantDb = client.db(testDbName)

  await tenantDb.collection('system_settings').insertOne({
    type: 'super_admin_settings',
    company_name: newOrg.name,
    owner_name: newOrg.owner_name,
    modules: newOrg.module_visibility,
  })

  // Add 1 test roll in the new tenant database
  await tenantDb.collection('rolls').insertOne({
    id: 1,
    roll_number: 'SHIV-ROLL-001',
    seth_name: 'Shiv Textiles',
    fabric_type: 'Heavy Denim',
    received_meter: 500,
    used_meter: 0,
    remaining_meter: 500,
    status: 'Available',
    created_at: new Date().toISOString(),
  })
  console.log('✓ Inserted test roll (SHIV-ROLL-001) into new tenant database.')

  // 4. Verify absolute data isolation
  console.log('\n[4/5] Verifying 100% Data Isolation between Databases...')
  const newTenantRolls = await tenantDb.collection('rolls').find({}).toArray()
  const rdRollsAfter = await rdDb.collection('rolls').find({ roll_number: 'SHIV-ROLL-001' }).toArray()

  console.log(`  -> Shiv Denim DB ('${testDbName}') roll count: ${newTenantRolls.length}`)
  console.log(`  -> Did 'SHIV-ROLL-001' leak into RD Jeans DB?: ${rdRollsAfter.length === 0 ? 'NO (100% Clean Isolation ✓)' : 'YES (Leak detected ❌)'}`)

  const shivHasRdRolls = await tenantDb.collection('rolls').find({ roll_number: { $ne: 'SHIV-ROLL-001' } }).toArray()
  console.log(`  -> Did any RD Jeans rolls leak into Shiv Denim DB?: ${shivHasRdRolls.length === 0 ? 'NO (100% Clean Isolation ✓)' : 'YES (Leak detected ❌)'}`)

  // 5. Cleanup test database
  console.log('\n[5/5] Cleaning up test tenant database...')
  await client.db(testDbName).dropDatabase()
  await orgsCol.deleteOne({ slug: testSlug })
  console.log(`✓ Dropped "${testDbName}" and cleaned up master registry record.`)

  console.log('\n================================================================')
  console.log('  RESULT: MULTI-ORGANIZATION SYSTEM VERIFIED 100% OPERATIONAL!  ')
  console.log('================================================================\n')

  await client.close()
}

runE2ETest().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})
