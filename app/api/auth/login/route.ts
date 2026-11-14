import { NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { verifyPassword, generateToken, ensureDefaultUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ success: false, detail: 'Username and password are required' }, { status: 400 })
    }

    const db = await getMongoDb()
    let user = await db.collection('users').findOne({ username })

    // Only attempt default user seed if users collection is completely empty
    if (!user) {
      const userCount = await db.collection('users').countDocuments()
      if (userCount === 0) {
        await ensureDefaultUser()
        user = await db.collection('users').findOne({ username })
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, detail: 'Invalid username or password' }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({ success: false, detail: 'Invalid username or password' }, { status: 401 })
    }

    const token = generateToken({ sub: user.username, id: user.id })

    const response = NextResponse.json({
      success: true,
      access_token: token,
      token_type: 'bearer',
      message: 'Login successful',
      user: { id: user.id, username: user.username, token }
    })

    // Set cookies for middleware authentication
    response.cookies.set('rd_user', user.username, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 // 24 hours
    })

    response.cookies.set('rd_token', token, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 // 24 hours
    })

    return response
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Internal server error' }, { status: 500 })
  }
}
