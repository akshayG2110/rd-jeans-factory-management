import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/services/admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const updated = await AdminService.updateUser(Number(id), body)
    return NextResponse.json({ success: true, data: updated, message: 'User updated successfully' })
  } catch (err: any) {
    console.error('PUT /api/admin/users/[id] error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Error updating user' }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const res = await AdminService.deleteUser(Number(id))
    return NextResponse.json(res)
  } catch (err: any) {
    console.error('DELETE /api/admin/users/[id] error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Error deleting user' }, { status: 400 })
  }
}
