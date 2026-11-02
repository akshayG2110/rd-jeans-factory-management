import { NextResponse } from 'next/server'
import { PartnerService } from '@/lib/services/partners'

export async function GET() {
  try {
    const partners = await PartnerService.getAll()
    return NextResponse.json({ success: true, data: partners })
  } catch (err: any) {
    console.error('GET /api/partners error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ success: false, detail: 'Partner name is required' }, { status: 400 })
    }

    const partner = await PartnerService.create({
      name: body.name,
      mobile_number: body.mobile_number || null,
      profit_share_percentage: body.profit_share_percentage !== undefined ? parseFloat(body.profit_share_percentage) : 50.00,
      opening_balance: body.opening_balance !== undefined ? parseFloat(body.opening_balance) : 0.00,
      status: body.status || 'Active',
      notes: body.notes || null
    })

    return NextResponse.json({ success: true, data: partner }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/partners error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}
