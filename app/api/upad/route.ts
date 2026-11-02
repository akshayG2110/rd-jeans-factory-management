import { NextResponse } from 'next/server'
import { UpadService } from '@/lib/services/upad'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employee_id = searchParams.get('employee_id') ? parseInt(searchParams.get('employee_id')!, 10) : undefined
    const date_from = searchParams.get('date_from') || undefined
    const date_to = searchParams.get('date_to') || undefined
    const payment_method = searchParams.get('payment_method') || undefined
    const handled_by = searchParams.get('handled_by') || undefined

    const upadRecords = await UpadService.getAll({
      employee_id,
      date_from,
      date_to,
      payment_method,
      handled_by
    })
    return NextResponse.json({ success: true, data: upadRecords })
  } catch (err: any) {
    console.error('GET /api/upad error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.employee_id || !body.date || body.amount === undefined || !body.payment_method || !body.handled_by) {
      return NextResponse.json({ success: false, detail: 'Missing required upad fields' }, { status: 400 })
    }

    const upad = await UpadService.create({
      employee_id: parseInt(body.employee_id, 10),
      date: body.date,
      amount: parseFloat(body.amount),
      payment_method: body.payment_method,
      notes: body.notes || null,
      handled_by: body.handled_by
    })

    return NextResponse.json({ success: true, data: upad }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/upad error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}
