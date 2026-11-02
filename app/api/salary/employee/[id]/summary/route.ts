import { NextResponse } from 'next/server'
import { SalaryService } from '@/lib/services/salary'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const empId = parseInt(id, 10)

    const summary = await SalaryService.getEmployeeSummary(empId)
    return NextResponse.json(summary)
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 400 })
  }
}
