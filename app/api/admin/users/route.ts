import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/services/admin'

export async function GET() {
  try {
    const users = await AdminService.getUsers()
    return NextResponse.json({ success: true, data: users })
  } catch (err: any) {
    console.error('GET /api/admin/users error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Error fetching users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.username || !body.password) {
      return NextResponse.json({ success: false, detail: 'Username and password are required' }, { status: 400 })
    }

    const newUser = await AdminService.createUser(body)
    return NextResponse.json({ success: true, data: newUser, message: `User "${newUser.username}" created successfully` })
  } catch (err: any) {
    console.error('POST /api/admin/users error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Error creating user' }, { status: 400 })
  }
}
