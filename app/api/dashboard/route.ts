import { NextResponse } from 'next/server'
import { DashboardService } from '@/lib/services/dashboard'

export async function GET() {
  try {
    const metrics = await DashboardService.getMetrics()
    return NextResponse.json({ success: true, data: metrics })
  } catch (err: any) {
    console.error('GET /api/dashboard error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}
