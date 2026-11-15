import { NextResponse } from 'next/server'
import { SethHisabService } from '@/lib/services/hisab-seth'

interface Props {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: Props) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.amount || Number(body.amount) <= 0) {
      return NextResponse.json({ success: false, detail: 'Please enter a valid payment amount' }, { status: 400 })
    }

    const updated = await SethHisabService.addPayment(Number(id), body)
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    console.error('POST /api/hisab-seth/[id]/payment error:', err)
    return NextResponse.json(
      { success: false, detail: err.message || 'Server error recording payment' },
      { status: 400 }
    )
  }
}
