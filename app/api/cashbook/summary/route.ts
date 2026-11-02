import { NextResponse } from 'next/server'
import { CashBookService } from '@/lib/services/cashbook'

export async function GET() {
  try {
    const summary = await CashBookService.getDashboardSummary()
    return NextResponse.json(summary)
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 500 })
  }
}
