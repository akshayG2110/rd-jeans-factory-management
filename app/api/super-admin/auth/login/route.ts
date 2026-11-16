import { NextRequest, NextResponse } from 'next/server'
import { SuperAdminService } from '@/lib/services/super-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const authResult = await SuperAdminService.authenticate(username, password)
    if (!authResult.authenticated || !authResult.token) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Invalid credentials' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      success: true,
      message: 'Super Admin login successful',
      token: authResult.token,
      user: authResult.user
    })

    // Set secure super admin cookie
    response.cookies.set('super_admin_token', authResult.token, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 * 7 // 7 days
    })

    response.cookies.set('super_admin_user', authResult.user?.username || '', {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 * 7
    })

    return response
  } catch (err: any) {
    console.error('Super Admin login error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Login failed' },
      { status: 500 }
    )
  }
}
