import { NextResponse } from 'next/server'
import { SuperAdminService } from '@/lib/services/super-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const backup = await SuperAdminService.createBackup()
    const jsonStr = JSON.stringify(backup, null, 2)
    const filename = `rd_jeans_super_admin_backup_${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 500 })
  }
}
