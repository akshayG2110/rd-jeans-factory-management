import { NextResponse } from 'next/server'
import { AdminService } from '@/lib/services/admin'

export async function GET() {
  try {
    const stats = await AdminService.getDatabaseStats()
    return NextResponse.json({ success: true, data: stats })
  } catch (err: any) {
    console.error('GET /api/admin/stats error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Stats failed' }, { status: 500 })
  }
}
