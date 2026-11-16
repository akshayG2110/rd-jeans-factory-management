import { NextResponse } from 'next/server'
import { SuperAdminService } from '@/lib/services/super-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await SuperAdminService.getDatabaseStats()
    return NextResponse.json({ success: true, data: stats })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 500 })
  }
}
