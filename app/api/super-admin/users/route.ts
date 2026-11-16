import { NextRequest, NextResponse } from 'next/server'
import { SuperAdminService } from '@/lib/services/super-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const users = await SuperAdminService.getUsers()
    return NextResponse.json({ success: true, data: users })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.username || !body.password) {
      return NextResponse.json({ success: false, detail: 'Username and password required' }, { status: 400 })
    }
    const created = await SuperAdminService.createUser(body)
    return NextResponse.json({ success: true, data: created, message: 'User created successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 400 })
  }
}
