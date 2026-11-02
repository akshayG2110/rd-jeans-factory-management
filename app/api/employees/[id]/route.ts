import { NextResponse } from 'next/server'
import { EmployeeService } from '@/lib/services/employees'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const empId = parseInt(id, 10)
    const employee = await EmployeeService.getById(empId)

    if (!employee) {
      return NextResponse.json({ success: false, detail: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: employee })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const empId = parseInt(id, 10)
    const body = await request.json()

    const updated = await EmployeeService.update(empId, body)
    if (!updated) {
      return NextResponse.json({ success: false, detail: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const empId = parseInt(id, 10)

    const deleted = await EmployeeService.delete(empId)
    if (!deleted) {
      return NextResponse.json({ success: false, detail: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Employee deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}
