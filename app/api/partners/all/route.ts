import { NextResponse } from 'next/server'
import { PartnerService } from '@/lib/services/partners'

export async function GET() {
  try {
    const transactions = await PartnerService.getTransactions('all')
    return NextResponse.json({ success: true, data: transactions })
  } catch (err: any) {
    console.error('GET /api/partners/all error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}
