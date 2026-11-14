import { getMongoDb, getMongoClient } from './mongodb'

/**
 * MongoDB database access layer (replaces legacy PostgreSQL pool).
 * Maintained for backward compatibility.
 */
export { getMongoDb, getMongoClient }

export async function getClient() {
  return await getMongoClient()
}

export async function query(queryTextOrCollection: string, params?: any[]) {
  const db = await getMongoDb()
  return { rows: [] }
}

export default getMongoDb
