import { NextResponse } from 'next/server'
import { IncomeService } from '@/lib/services/income'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const income_source = searchParams.get('income_source') || undefined
    const payment_method = searchParams.get('payment_method') || undefined
    const handled_by = searchParams.get('handled_by') || undefined
    const date_from = searchParams.get('date_from') || undefined
    const date_to = searchParams.get('date_to') || undefined
    const search = searchParams.get('search') || undefined

    const incomes = await IncomeService.getAll({
      income_source,
      payment_method,
      handled_by,
      date_from,
      date_to,
      search
    })
    return NextResponse.json({ success: true, data: incomes })
  } catch (err: any) {
    console.error('GET /api/income error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.income_date || !body.income_source || !body.source_name || body.amount === undefined || !body.payment_method || !body.handled_by) {
      return NextResponse.json({ success: false, detail: 'Missing required income fields' }, { status: 400 })
    }

    const income = await IncomeService.create({
      income_date: body.income_date,
      income_source: body.income_source,
      source_name: body.source_name,
      amount: parseFloat(body.amount),
      payment_method: body.payment_method,
      handled_by: body.handled_by,
      reference_number: body.reference_number || null,
      notes: body.notes || null
    })

    return NextResponse.json({ success: true, data: income }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/income error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}
