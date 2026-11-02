import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Pool } from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function run() {
  const migrationsDir = path.join(__dirname, 'migrations')
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

  const client = await pool.connect()
  try {
    for (const file of files) {
      const sqlPath = path.join(migrationsDir, file)
      console.log(`Running migration: ${file}...`)
      const sql = fs.readFileSync(sqlPath, 'utf8')

      await client.query('BEGIN')
      await client.query(sql)
      await client.query('COMMIT')
      console.log(`✓ Migration ${file} completed successfully!`)
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Migration failed:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
