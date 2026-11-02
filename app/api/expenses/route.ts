import { NextResponse } from 'next/server'
import { ExpenseService } from '@/lib/services/expenses'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const expense_category = searchParams.get('expense_category') || undefined
    const payment_method = searchParams.get('payment_method') || undefined
    const handled_by = searchParams.get('handled_by') || undefined
    const date_from = searchParams.get('date_from') || undefined
    const date_to = searchParams.get('date_to') || undefined
    const search = searchParams.get('search') || undefined

    const expenses = await ExpenseService.getAll({
      expense_category,
      payment_method,
      handled_by,
      date_from,
      date_to,
      search
    })
    return NextResponse.json({ success: true, data: expenses })
  } catch (err: any) {
    console.error('GET /api/expenses error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.expense_date || !body.expense_category || !body.party_name || body.amount === undefined || !body.payment_method || !body.handled_by) {
      return NextResponse.json({ success: false, detail: 'Missing required expense fields' }, { status: 400 })
    }

    const expense = await ExpenseService.create({
      expense_date: body.expense_date,
      expense_category: body.expense_category,
      party_name: body.party_name,
      amount: parseFloat(body.amount),
      payment_method: body.payment_method,
      handled_by: body.handled_by,
      reference_number: body.reference_number || null,
      notes: body.notes || null
    })

    return NextResponse.json({ success: true, data: expense }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/expenses error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}
