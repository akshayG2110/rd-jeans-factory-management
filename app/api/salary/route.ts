import { NextResponse } from 'next/server'
import { SalaryService } from '@/lib/services/salary'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employee_id = searchParams.get('employee_id') ? parseInt(searchParams.get('employee_id')!, 10) : undefined
    const salary_month = searchParams.get('salary_month') ? parseInt(searchParams.get('salary_month')!, 10) : undefined
    const salary_year = searchParams.get('salary_year') ? parseInt(searchParams.get('salary_year')!, 10) : undefined
    const payment_method = searchParams.get('payment_method') || undefined
    const handled_by = searchParams.get('handled_by') || undefined
    const date_from = searchParams.get('date_from') || undefined
    const date_to = searchParams.get('date_to') || undefined

    const salaries = await SalaryService.getAll({
      employee_id,
      salary_month,
      salary_year,
      payment_method,
      handled_by,
      date_from,
      date_to
    })
    return NextResponse.json({ success: true, data: salaries })
  } catch (err: any) {
    console.error('GET /api/salary error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (
      !body.employee_id ||
      !body.salary_month ||
      !body.salary_year ||
      body.salary_amount === undefined ||
      body.paid_amount === undefined ||
      !body.payment_method ||
      !body.handled_by ||
      !body.payment_date
    ) {
      return NextResponse.json({ success: false, detail: 'Missing required salary fields' }, { status: 400 })
    }

    const salary = await SalaryService.create({
      employee_id: parseInt(body.employee_id, 10),
      salary_month: parseInt(body.salary_month, 10),
      salary_year: parseInt(body.salary_year, 10),
      salary_amount: parseFloat(body.salary_amount),
      paid_amount: parseFloat(body.paid_amount),
      payment_method: body.payment_method,
      notes: body.notes || null,
      handled_by: body.handled_by,
      payment_date: body.payment_date,
      deduct_upad: body.deduct_upad !== undefined ? Boolean(body.deduct_upad) : true,
      upad_ids: Array.isArray(body.upad_ids) ? body.upad_ids.map((id: any) => parseInt(id, 10)) : undefined
    })

    return NextResponse.json({ success: true, data: salary }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/salary error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}
