import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from './db'

const resolvedSecret = process.env.SECRET_KEY || process.env.JWT_SECRET
const SECRET_KEY = resolvedSecret || 'e2b6c9b3d7a8e8f4c0a5d2c8e3b1c6d9a4b8e7c1d3f5a2e9b0c7d6e5f4a3b2c1'
if (!resolvedSecret && process.env.NODE_ENV === 'production') {
  console.warn('SECURITY WARNING: SECRET_KEY is not set in production. Using fallback secret.')
}
const ALGORITHM = process.env.ALGORITHM || 'HS256'
const ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '30', 10)

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false
  
  // Strict bcrypt hash verification
  try {
    return await bcrypt.compare(password, storedHash)
  } catch (err) {
    return false
  }
}

export function generateToken(payload: Record<string, any>): string {
  return jwt.sign(payload, SECRET_KEY, {
    expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m`
  })
}

export function verifyToken(token: string): Record<string, any> | null {
  try {
    return jwt.verify(token, SECRET_KEY) as Record<string, any>
  } catch (err) {
    return null
  }
}

export async function getAuthenticatedUser(request: Request): Promise<{ id?: number; username: string } | null> {
  // Check injected headers from middleware
  const headerUserId = request.headers.get('x-user-id')
  const headerUserName = request.headers.get('x-user-name')
  if (headerUserName) {
    return {
      id: headerUserId ? parseInt(headerUserId, 10) : undefined,
      username: headerUserName
    }
  }

  // Fallback direct check of Authorization header or cookie
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization')
  let token = ''
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.substring(7).trim()
  }

  if (!token) {
    const cookieHeader = request.headers.get('cookie') || ''
    const match = cookieHeader.match(/rd_token=([^;]+)/)
    if (match) {
      token = match[1]
    }
  }

  if (token) {
    const payload = verifyToken(token)
    if (payload && payload.sub) {
      return {
        id: payload.id ? parseInt(payload.id, 10) : undefined,
        username: payload.sub
      }
    }
  }

  return null
}

export async function ensureDefaultUser() {
  try {
    const res = await query('SELECT COUNT(*) as count FROM users')
    const count = parseInt(res.rows[0]?.count || '0', 10)
    if (count === 0) {
      const hashed = await hashPassword('RD@123')
      await query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING',
        ['rdjeans123', hashed]
      )
      console.log('Default user (rdjeans123) seeded into database with bcrypt.')
    } else {
      // Migrate existing clear-text password to bcrypt hash if present
      const userRes = await query('SELECT id, password_hash FROM users WHERE username = $1', ['rdjeans123'])
      if (userRes.rows.length > 0 && userRes.rows[0].password_hash === 'RD@123') {
        const hashed = await hashPassword('RD@123')
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, userRes.rows[0].id])
        console.log('Migrated rdjeans123 clear-text password to bcrypt.')
      }
    }
  } catch (err) {
    console.error('ensureDefaultUser error:', err)
  }
}
