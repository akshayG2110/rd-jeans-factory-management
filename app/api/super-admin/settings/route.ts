import { NextRequest, NextResponse } from 'next/server'
import { SuperAdminService } from '@/lib/services/super-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await SuperAdminService.getSettings()
    return NextResponse.json({ success: true, data: settings })
  } catch (err: any) {
    console.error('GET /api/super-admin/settings error:', err)
    return NextResponse.json({ success: false, detail: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const updated = await SuperAdminService.saveSettings(body)
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Super Admin settings saved successfully'
    })
  } catch (err: any) {
    console.error('POST /api/super-admin/settings error:', err)
    return NextResponse.json({ success: false, detail: err.message }, { status: 400 })
  }
}
