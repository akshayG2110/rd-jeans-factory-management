import { NextResponse } from 'next/server'
import { SuperAdminService } from '@/lib/services/super-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const visibility = await SuperAdminService.getModuleVisibility()
    return NextResponse.json({ success: true, data: visibility })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message }, { status: 500 })
  }
}
