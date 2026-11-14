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
    global._mongoClientPromise = client.connect().catch(err => {
      global._mongoClientPromise = undefined
      throw err
    })
  }

  return await global._mongoClientPromise
}

/**
 * Returns the MongoDB Database instance (defaults to rd_jeans_factory)
 */
export async function getMongoDb(dbName: string = defaultDbName): Promise<Db> {
  const clientInstance = await getMongoClient()
  return clientInstance.db(dbName)
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
