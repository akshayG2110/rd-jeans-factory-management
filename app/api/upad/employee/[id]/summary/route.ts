import { NextResponse } from 'next/server'
import { UpadService } from '@/lib/services/upad'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const empId = parseInt(id, 10)

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!, 10) : undefined
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined

    const summary = await UpadService.getEmployeeSummary(empId, { month, year })
    return NextResponse.json(summary)
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 400 })
  }
}
