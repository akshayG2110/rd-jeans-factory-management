import { NextRequest, NextResponse } from 'next/server'
import { SuperAdminService } from '@/lib/services/super-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await SuperAdminService.restoreBackup(body)
    return NextResponse.json({
      success: true,
      message: `Database restored! ${result.total_records} records restored across ${result.restored_collections} collections.`,
      data: result
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 400 })
  }
}
