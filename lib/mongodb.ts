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
    global._mongoClientPromise = client.connect().catch((err) => {
      global._mongoClientPromise = undefined
      throw err
    })
  }

  return await global._mongoClientPromise
}

/**
 * Returns the MongoDB Database instance.
 * Automatically resolves tenant database based on the active organization context:
 * 1. If explicit dbName is passed and != default, use that dbName.
 * 2. Checks incoming request header 'x-tenant-db' or 'x-tenant-org'.
 * 3. Checks incoming cookie 'rd_active_org'.
 * 4. Falls back to defaultDbName ('rd_jeans_factory').
 */
export async function getMongoDb(dbName?: string): Promise<Db> {
  const clientInstance = await getMongoClient()

  if (dbName && dbName !== defaultDbName) {
    return clientInstance.db(dbName)
  }

  let resolvedDbName = defaultDbName

  try {
    const { cookies, headers } = await import('next/headers')
    const headerStore = await headers()
    const cookieStore = await cookies()

    const headerDb = headerStore.get('x-tenant-db')
    const headerOrg = headerStore.get('x-tenant-org')
    const cookieOrg = cookieStore.get('rd_active_org')?.value

    if (headerDb && headerDb !== defaultDbName) {
      resolvedDbName = headerDb
    } else if (headerOrg && headerOrg !== 'rd-jeans-main') {
      resolvedDbName = headerOrg.startsWith('rd_tenant_')
        ? headerOrg
        : `rd_tenant_${headerOrg.replace(/-/g, '_')}`
    } else if (cookieOrg && cookieOrg !== 'rd-jeans-main') {
      resolvedDbName = cookieOrg.startsWith('rd_tenant_')
        ? cookieOrg
        : `rd_tenant_${cookieOrg.replace(/-/g, '_')}`
    }
  } catch {
    // Outside request context (scripts, migrations, test runner)
    resolvedDbName = defaultDbName
  }

  return clientInstance.db(resolvedDbName)
}

/**
 * Generates an atomic sequential integer ID for collection items (1, 2, 3...)
 * Uses the active tenant database context unless overridden.
 */
export async function getNextSequence(collectionName: string, dbName?: string): Promise<number> {
  const db = await getMongoDb(dbName)
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: collectionName as any },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  )
  return result?.seq || 1
}
