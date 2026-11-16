import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/services/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await AdminService.restoreDatabaseBackup(body)
    return NextResponse.json({
      success: true,
      message: `Database restored successfully! ${result.total_records} records restored across ${result.restored_collections} collections.`,
      data: result
    })
  } catch (err: any) {
    console.error('POST /api/admin/restore error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Restore failed' }, { status: 400 })
  }
}
