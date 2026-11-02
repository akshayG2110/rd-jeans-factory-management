import { NextResponse } from 'next/server'
import { ReportService, ReportFilterParams } from '@/lib/services/reports'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('report_type') || searchParams.get('category') || 'cashbook'

    const filters: ReportFilterParams = {
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      employee_id: searchParams.get('employee_id') || undefined,
      seth_id: searchParams.get('seth_id') || undefined,
      handled_by: searchParams.get('handled_by') || undefined,
      expense_category: searchParams.get('expense_category') || undefined,
      income_source: searchParams.get('income_source') || undefined,
      status: searchParams.get('status') || undefined,
      roll_number: searchParams.get('roll_number') || undefined,
      lot_number: searchParams.get('lot_number') || undefined
    }

    const data = await ReportService.exportData(category, filters)
    return NextResponse.json({
      success: true,
      category,
      date_from: filters.date_from || null,
      date_to: filters.date_to || null,
      total_records: data.length,
      data
    })
  } catch (err: any) {
    console.error('GET /api/reports error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}
