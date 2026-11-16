import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('super_admin_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'SuperAdmin') {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        username: payload.sub,
        role: payload.role
      }
    })
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 401 })
  }
}
