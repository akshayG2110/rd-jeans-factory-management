import { NextResponse } from 'next/server'
import { ReportService, ReportFilterParams } from '@/lib/services/reports'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('report_type') || searchParams.get('category') || 'cashbook'
    const format = (searchParams.get('format') || 'json').toLowerCase()

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

    if (format === 'excel' || format === 'xlsx') {
      const excelBuffer = await ReportService.generateExcel(category, filters)
      const filename = `${category}_report_${new Date().toISOString().split('T')[0]}.xlsx`
      return new Response(new Uint8Array(excelBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    }

    if (format === 'pdf') {
      const pdfBuffer = await ReportService.generatePdf(category, filters)
      const filename = `${category}_report_${new Date().toISOString().split('T')[0]}.pdf`
      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    }

    const data = await ReportService.exportData(category, filters)

    if (format === 'csv') {
      if (data.length === 0) {
        return new Response('No data', {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${category}_report.csv"`
          }
        })
      }

      const headers = Object.keys(data[0]).join(',')
      const rows = data.map((row: any) =>
        Object.values(row)
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      const csvContent = [headers, ...rows].join('\n')

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${category}_report.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      category,
      total_records: data.length,
      data
    })
  } catch (err: any) {
    console.error('GET /api/reports/export error:', err)
    return NextResponse.json({ success: false, detail: err.message || 'Server error' }, { status: 500 })
  }
}
