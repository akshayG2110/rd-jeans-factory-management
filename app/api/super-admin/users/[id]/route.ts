import { NextRequest, NextResponse } from 'next/server'
import { SuperAdminService } from '@/lib/services/super-admin'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const result = await SuperAdminService.updateUser(Number(id), body)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await SuperAdminService.deleteUser(Number(id))
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 400 })
  }
}
