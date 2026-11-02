import { NextResponse } from 'next/server'
import { SethService } from '@/lib/services/seths'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sethId = parseInt(id, 10)
    const payments = await SethService.getPayments(sethId)

    return NextResponse.json(payments)
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sethId = parseInt(id, 10)
    const body = await request.json()

    if (!body.payment_date || body.amount === undefined || !body.payment_method || !body.handled_by) {
      return NextResponse.json({ detail: 'Missing required payment fields' }, { status: 400 })
    }

    const payment = await SethService.addPayment(sethId, {
      payment_date: body.payment_date,
      amount: parseFloat(body.amount),
      payment_method: body.payment_method,
      notes: body.notes || null,
      handled_by: body.handled_by
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 400 })
  }
}
