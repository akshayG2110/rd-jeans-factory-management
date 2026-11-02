import { NextResponse } from 'next/server'
import { SalaryService } from '@/lib/services/salary'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const salId = parseInt(id, 10)
    const salary = await SalaryService.getById(salId)

    if (!salary) {
      return NextResponse.json({ success: false, detail: 'Salary record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: salary })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const salId = parseInt(id, 10)
    const body = await request.json()

    if (body.employee_id) body.employee_id = parseInt(body.employee_id, 10)
    if (body.salary_month) body.salary_month = parseInt(body.salary_month, 10)
    if (body.salary_year) body.salary_year = parseInt(body.salary_year, 10)
    if (body.salary_amount !== undefined) body.salary_amount = parseFloat(body.salary_amount)
    if (body.paid_amount !== undefined) body.paid_amount = parseFloat(body.paid_amount)

    const updated = await SalaryService.update(salId, body)
    if (!updated) {
      return NextResponse.json({ success: false, detail: 'Salary record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const salId = parseInt(id, 10)

    const deleted = await SalaryService.delete(salId)
    if (!deleted) {
      return NextResponse.json({ success: false, detail: 'Salary record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Salary record deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}
