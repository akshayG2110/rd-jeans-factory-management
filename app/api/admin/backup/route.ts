import { NextResponse } from 'next/server'
import { AdminService } from '@/lib/services/admin'

export async function GET() {
  try {
    const backup = await AdminService.createDatabaseBackup()
    const jsonStr = JSON.stringify(backup, null, 2)
    const filename = `rd_jeans_factory_backup_${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (err: any) {
    console.error('GET /api/admin/backup error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Backup failed' }, { status: 500 })
  }
}
