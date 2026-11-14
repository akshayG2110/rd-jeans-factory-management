import { MongoClient, Db, MongoClientOptions } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rd_jeans_factory'
const defaultDbName = process.env.MONGODB_DB || 'rd_jeans_factory'

const options: MongoClientOptions = {
  maxPoolSize: 20,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 10000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

/**
 * Returns the connected MongoClient instance
 */
export async function getMongoClient(): Promise<MongoClient> {
  return await clientPromise
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

export default clientPromise
