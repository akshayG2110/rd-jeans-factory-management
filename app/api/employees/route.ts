import { NextResponse } from 'next/server'
import { EmployeeService } from '@/lib/services/employees'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const role = searchParams.get('role') || undefined
    const status = searchParams.get('status') || undefined

    const employees = await EmployeeService.getAll(search, role, status)
    return NextResponse.json({ success: true, data: employees })
  } catch (err: any) {
    console.error('GET /api/employees error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.employee_name || !body.role || !body.joining_date) {
      return NextResponse.json({ success: false, detail: 'Missing required fields: employee_name, role, joining_date' }, { status: 400 })
    }

    const employee = await EmployeeService.create(body)
    return NextResponse.json({ success: true, data: employee }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/employees error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}
