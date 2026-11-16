import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/services/admin'

export async function GET() {
  try {
    const settings = await AdminService.getSettings()
    return NextResponse.json({ success: true, data: settings })
  } catch (err: any) {
    console.error('GET /api/admin/settings error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Error fetching settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const updated = await AdminService.saveSettings(body)
    return NextResponse.json({ success: true, data: updated, message: 'Factory settings updated successfully' })
  } catch (err: any) {
    console.error('POST /api/admin/settings error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Error saving settings' }, { status: 400 })
  }
}
