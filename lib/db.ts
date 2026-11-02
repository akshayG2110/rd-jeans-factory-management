import { Pool, type QueryResultRow } from 'pg'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/rd_jeans_factory'

const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1')

export const pool = new Pool({
  connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
) {
  const res = await pool.query<T>(text, params)
  return res
}

export async function getClient() {
  const client = await pool.connect()
  return client
}
