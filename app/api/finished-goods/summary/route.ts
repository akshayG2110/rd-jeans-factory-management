import { NextResponse } from 'next/server'
import { FinishedGoodsService } from '@/lib/services/finished-goods'

export async function GET() {
  try {
    const summary = await FinishedGoodsService.getSummary()
    return NextResponse.json({ success: true, data: summary })
  } catch (err: any) {
    console.error('GET /api/finished-goods/summary error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}
