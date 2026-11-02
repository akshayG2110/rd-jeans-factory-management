import { MongoClient, Db, MongoClientOptions } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rd_jeans_uat'
const defaultDbName = process.env.MONGODB_DB || 'rd_jeans_uat'

const options: MongoClientOptions = {
  maxPoolSize: 20,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
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
 * Returns the MongoDB Database instance (defaults to rd_jeans_uat)
 */
export async function getMongoDb(dbName: string = defaultDbName): Promise<Db> {
  const clientInstance = await getMongoClient()
  return clientInstance.db(dbName)
}

export default clientPromise

