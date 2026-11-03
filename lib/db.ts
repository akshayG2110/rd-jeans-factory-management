import { Pool, type QueryResultRow } from 'pg'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:2110@localhost:5432/rd_jeans_factory'

const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1')

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined
}

function createPool(): Pool {
  const p = new Pool({
    connectionString,
    ssl: isLocalhost ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  })

  // Catch unexpected errors on idle clients so they don't crash or break the pool
  p.on('error', (err: any) => {
    // Only log if it's not a common transient socket close
    if (err?.code !== 'ECONNRESET') {
      console.warn('PostgreSQL pool idle client warning:', err.message)
    }
  })

  return p
}

export const pool: Pool = global._pgPool || (global._pgPool = createPool())

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
) {
  try {
    const res = await pool.query<T>(text, params)
    return res
  } catch (err: any) {
    // Retry once if connection was reset or timed out
    if (err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT' || err?.code === '57P01') {
      console.warn(`PostgreSQL transient error (${err.code}), retrying query...`)
      const retryRes = await pool.query<T>(text, params)
      return retryRes
    }
    throw err
  }
}

export async function getClient() {
  const client = await pool.connect()
  return client
}
