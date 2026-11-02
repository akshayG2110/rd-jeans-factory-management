import { NextRequest, NextResponse } from 'next/server'
import { ReportService, ReportFilterParams } from '@/lib/services/reports'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const report_type = searchParams.get('report_type') || searchParams.get('category') || 'cashbook'

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

    const pdfBuffer = await ReportService.generatePdf(report_type, filters)
    const filename = `${report_type}_report_${new Date().toISOString().split('T')[0]}.pdf`

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (err: any) {
    console.error('GET /api/reports/export/pdf error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error generating PDF report' }, { status: 500 })
  }
}
