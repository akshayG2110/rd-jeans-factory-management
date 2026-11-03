import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyPassword, generateToken, ensureDefaultUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    await ensureDefaultUser()
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ success: false, detail: 'Username and password are required' }, { status: 400 })
    }

    const res = await query('SELECT * FROM users WHERE username = $1', [username])
    const user = res.rows[0]

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
