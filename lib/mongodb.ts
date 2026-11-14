import { MongoClient, Db, MongoClientOptions } from 'mongodb'

const defaultDbName = process.env.MONGODB_DB || 'rd_jeans_factory'

const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
  // eslint-disable-next-line no-var
  var _mongoIndexesInitialized: boolean | undefined
}

/**
 * Returns the cached MongoClient instance (shared across warm serverless invocations)
 */
export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error(
      'Environment variable MONGODB_URI is not configured in Vercel Project Settings. Please add MONGODB_URI in Vercel -> Settings -> Environment Variables and redeploy.'
    )
  }

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect().catch(err => {
      global._mongoClientPromise = undefined
      throw err
    })
  }

  return await global._mongoClientPromise
}

/**
 * Ensures indexes exist on frequently queried fields for high performance
 */
async function ensureIndexes(db: Db) {
  if (global._mongoIndexesInitialized) return
  global._mongoIndexesInitialized = true

  try {
    await Promise.all([
      db.collection('users').createIndex({ username: 1 }, { unique: true }).catch(() => {}),
      db.collection('employees').createIndex({ id: 1 }, { unique: true }).catch(() => {}),
      db.collection('employees').createIndex({ status: 1 }).catch(() => {}),
      db.collection('seths').createIndex({ id: 1 }, { unique: true }).catch(() => {}),
      db.collection('seths').createIndex({ seth_name: 1 }).catch(() => {}),
      db.collection('seth_payments').createIndex({ seth_id: 1, payment_date: -1 }).catch(() => {}),
      db.collection('rolls').createIndex({ id: 1 }, { unique: true }).catch(() => {}),
      db.collection('rolls').createIndex({ seth_id: 1, status: 1 }).catch(() => {}),
      db.collection('cutting_entries').createIndex({ id: 1 }, { unique: true }).catch(() => {}),
      db.collection('cutting_entries').createIndex({ roll_id: 1 }).catch(() => {}),
      db.collection('finished_goods').createIndex({ id: 1 }, { unique: true }).catch(() => {}),
      db.collection('finished_goods').createIndex({ lot_no: 1 }).catch(() => {}),
      db.collection('salaries').createIndex({ id: 1 }, { unique: true }).catch(() => {}),
      db.collection('salaries').createIndex({ employee_id: 1, payment_date: -1 }).catch(() => {}),
      db.collection('upad_records').createIndex({ id: 1 }, { unique: true }).catch(() => {}),
      db.collection('upad_records').createIndex({ employee_id: 1, status: 1 }).catch(() => {}),
      db.collection('incomes').createIndex({ id: 1 }, { unique: true }).catch(() => {}),
      db.collection('incomes').createIndex({ income_date: -1 }).catch(() => {}),
      db.collection('expenses').createIndex({ id: 1 }, { unique: true }).catch(() => {}),
      db.collection('expenses').createIndex({ expense_date: -1 }).catch(() => {}),
      db.collection('cash_book_ledger').createIndex({ id: 1 }, { unique: true }).catch(() => {}),
      db.collection('cash_book_ledger').createIndex({ entry_date: -1 }).catch(() => {}),
      db.collection('partners').createIndex({ id: 1 }, { unique: true }).catch(() => {}),
      db.collection('partner_transactions').createIndex({ partner_id: 1, transaction_date: -1 }).catch(() => {})
    ])
  } catch {
    // Indexes creation failure should not block requests
  }
}

/**
 * Returns the MongoDB Database instance (defaults to rd_jeans_factory)
 */
export async function getMongoDb(dbName: string = defaultDbName): Promise<Db> {
  const clientInstance = await getMongoClient()
  const db = clientInstance.db(dbName)
  ensureIndexes(db).catch(() => {})
  return db
}

/**
 * Generates an atomic sequential integer ID for collection items (1, 2, 3...)
 */
export async function getNextSequence(collectionName: string): Promise<number> {
  const db = await getMongoDb()
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: collectionName as any },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  )
  return result?.seq || 1
}

export default getMongoClient
