import { NextResponse } from 'next/server'
import { PartnerService } from '@/lib/services/partners'

export async function GET() {
  try {
    const summary = await PartnerService.getSummary()
    return NextResponse.json({ success: true, data: summary })
  } catch (err: any) {
    console.error('GET /api/partners/summary error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}
