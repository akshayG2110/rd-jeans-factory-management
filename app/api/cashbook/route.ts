import { NextResponse } from 'next/server'
import { CashBookService } from '@/lib/services/cashbook'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const transaction_type = searchParams.get('transaction_type') || undefined
    const payment_method = searchParams.get('payment_method') || undefined
    const handled_by = searchParams.get('handled_by') || undefined
    const date_from = searchParams.get('date_from') || undefined
    const date_to = searchParams.get('date_to') || undefined
    const search = searchParams.get('search') || undefined

    const records = await CashBookService.getAll({
      transaction_type,
      payment_method,
      handled_by,
      date_from,
      date_to,
      search
    })

    return NextResponse.json({ success: true, data: records })
  } catch (err: any) {
    console.error('GET /api/cashbook error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}
