import { beforeEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Load .env.local for local database & secret environment variables
try {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=')
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim()
          let val = trimmed.slice(idx + 1).trim()
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    })
  }
} catch {
  // Ignore
}

// Set predictable environment variables for test execution
;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
process.env.SECRET_KEY = process.env.SECRET_KEY || 'test_secret_key_for_vitest_unit_testing_minimum_32_characters'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_for_vitest_unit_testing_minimum_32_characters'
process.env.ALGORITHM = 'HS256'
process.env.ACCESS_TOKEN_EXPIRE_MINUTES = '30'

beforeEach(() => {
  vi.clearAllMocks()
})
