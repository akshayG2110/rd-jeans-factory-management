import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getMongoDb } from './mongodb'

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

/**
 * Checks whether the incoming HTTP request is authenticated as Super Admin
 * Cryptographically verifies JWT token or checks trusted middleware header
 */
export function isSuperAdminRequest(request: Request): boolean {
  try {
    const cookieHeader = request.headers.get('cookie') || ''

    // 1. Verify cryptographic super_admin_token in cookie or Authorization header
    let token = ''
    const match = cookieHeader.match(/super_admin_token=([^;]+)/)
    if (match) {
      token = match[1]
    } else {
      const authHeader = request.headers.get('Authorization') || request.headers.get('authorization')
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.substring(7).trim()
      }
    }

    if (token) {
      const payload = verifyToken(token)
      if (payload && payload.role === 'SuperAdmin') {
        return true
      }
    }

    // 2. Injected headers from middleware (after cryptographic verification)
    const userRole = request.headers.get('x-user-role')
    if (userRole === 'SuperAdmin') {
      return true
    }
  } catch {
    return false
  }

  return false
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
    const db = await getMongoDb()
    const usersCol = db.collection('users')
    
    // Check total count of existing users
    const totalUsers = await usersCol.countDocuments()
    
    if (totalUsers === 0) {
      // 1. Initial Operator user (seeded ONLY if collection is brand new and empty)
      const hashedOperator = await hashPassword('RD@123')
      await usersCol.insertOne({
        id: 1,
        username: 'rdjeans123',
        display_name: 'RD Operator',
        role: 'Operator',
        status: 'Active',
        password_hash: hashedOperator,
        created_at: new Date().toISOString()
      })

      // 2. Initial Super Admin user (seeded ONLY if collection is brand new and empty)
      const hashedSuperAdmin = await hashPassword('Akshay21')
      await usersCol.insertOne({
        id: 999,
        username: 'AkshayGohel21',
        display_name: 'Akshay Gohel (Super Admin)',
        role: 'SuperAdmin',
        status: 'Active',
        password_hash: hashedSuperAdmin,
        created_at: new Date().toISOString()
      })
      console.log('Fresh database: Initial default accounts seeded into MongoDB Atlas.')
      return
    }

    // If database already has users, ensure at least one active SuperAdmin account exists
    // NEVER overwrite passwords of existing accounts.
    const superAdminCount = await usersCol.countDocuments({ role: 'SuperAdmin' })
    if (superAdminCount === 0) {
      const hashedSuperAdmin = await hashPassword('Akshay21')
      await usersCol.insertOne({
        id: 999,
        username: 'AkshayGohel21',
        display_name: 'Super Admin',
        role: 'SuperAdmin',
        status: 'Active',
        password_hash: hashedSuperAdmin,
        created_at: new Date().toISOString()
      })
      console.log('Seeded initial SuperAdmin account into MongoDB Atlas.')
    }
  } catch (err) {
    console.error('ensureDefaultUser error:', err)
  }
}
