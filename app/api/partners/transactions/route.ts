import { NextResponse } from 'next/server'
import { PartnerService } from '@/lib/services/partners'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const partner_id = searchParams.get('partner_id') ? parseInt(searchParams.get('partner_id')!, 10) : undefined
    const partner_name = searchParams.get('partner_name') || searchParams.get('partner') || undefined
    const type = searchParams.get('type') // 'equity' or 'cashbook'

    if (type === 'equity') {
      const transactions = await PartnerService.getPartnerTransactions(partner_id)
      return NextResponse.json({ success: true, data: transactions })
    }

    // Default: Return cashbook transactions for passbook view
    const transactions = await PartnerService.getTransactions(partner_name)
    return NextResponse.json(transactions)
  } catch (err: any) {
    console.error('GET /api/partners/transactions error:', err)
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.partner_id || !body.transaction_date || !body.transaction_type || body.amount === undefined) {
      return NextResponse.json(
        { success: false, detail: 'Missing required fields: partner_id, transaction_date, transaction_type, and amount.' },
        { status: 400 }
      )
    }

    const tx = await PartnerService.logTransaction({
      partner_id: parseInt(body.partner_id, 10),
      transaction_date: body.transaction_date,
      transaction_type: body.transaction_type,
      amount: parseFloat(body.amount),
      payment_method: body.payment_method || 'Cash',
      notes: body.notes || null,
      sync_cashbook: body.sync_cashbook !== undefined ? Boolean(body.sync_cashbook) : true
    })

    return NextResponse.json({ success: true, data: tx }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/partners/transactions error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}
